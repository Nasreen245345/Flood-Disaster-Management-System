import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: any;
  headers: Record<string, string>;
  timestamp: number;
  type: string; // 'aid-request' | 'disaster-report' | etc.
}

const DB_NAME = 'dms-offline-db';
const STORE_NAME = 'pending-requests';
const DB_VERSION = 1;

@Injectable({ providedIn: 'root' })
export class OfflineSyncService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5000/api';

  isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  pendingCount$ = new BehaviorSubject<number>(0);
  syncing$ = new BehaviorSubject<boolean>(false);

  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.syncPendingRequests();
    });
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        this.updatePendingCount();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Queue a request for later sync
  async queueRequest(type: string, url: string, method: string, body: any, token?: string): Promise<void> {
    const item: QueuedRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      body,
      headers: token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
      timestamp: Date.now(),
      type
    };

    await this.saveToDB(item);
    this.updatePendingCount();
  }

  private saveToDB(item: QueuedRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject('DB not ready'); return; }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.add(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private getAllPending(): Promise<QueuedRequest[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve([]); return; }
      const tx = this.db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  private deleteFromDB(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) { resolve(); return; }
      const tx = this.db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async updatePendingCount() {
    const items = await this.getAllPending();
    this.pendingCount$.next(items.length);
  }

  // Sync all pending requests when back online
  async syncPendingRequests(): Promise<void> {
    if (!navigator.onLine || this.syncing$.value) return;

    const pending = await this.getAllPending();
    if (pending.length === 0) return;

    this.syncing$.next(true);
    console.log(`Syncing ${pending.length} offline requests...`);

    for (const item of pending) {
      try {
        await this.executeRequest(item);
        await this.deleteFromDB(item.id);
        console.log(`Synced: ${item.type}`);
      } catch (err) {
        console.error(`Failed to sync ${item.type}:`, err);
        // Keep in queue for next attempt
      }
    }

    await this.updatePendingCount();
    this.syncing$.next(false);
  }

  private executeRequest(item: QueuedRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders(item.headers);
      const obs = item.method === 'POST'
        ? this.http.post(item.url, item.body, { headers })
        : this.http.put(item.url, item.body, { headers });

      obs.subscribe({ next: resolve, error: reject });
    });
  }

  // Check if currently online
  get isOnline(): boolean {
    return navigator.onLine;
  }
}
