import { environment } from '../../../environments/environment';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'ngo' | 'volunteer' | 'victim';
  phone?: string;
  region?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser = signal<User | null>(null);
  private apiUrl = environment.apiUrl + '/auth';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('dms_user');
    const storedToken = localStorage.getItem('dms_token');
    if (storedUser && storedToken) {
      this.currentUser.set(JSON.parse(storedUser));
    }
  }

  get user() {
    return this.currentUser();
  }

  isLoggedIn(): boolean {
    return !!this.currentUser() && !!localStorage.getItem('dms_token');
  }

  getCurrentUser(): User | null {
    return this.currentUser();
  }

  getToken(): string | null {
    return localStorage.getItem('dms_token');
  }

  // Real Login API
  login(email: string, password: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUser.set(response.user);
            localStorage.setItem('dms_user', JSON.stringify(response.user));
            localStorage.setItem('dms_token', response.token);
            this.redirectBasedOnRole(response.user.role);
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      ) as any;
  }

  // CNIC Login for victims
  cnicLogin(cnic: string, phone: string): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/cnic-login`, { cnic, phone })
      .pipe(
        tap(response => {
          if (response.success) {
            this.currentUser.set(response.user);
            localStorage.setItem('dms_user', JSON.stringify(response.user));
            localStorage.setItem('dms_token', response.token);
            this.redirectBasedOnRole(response.user.role);
          }
        }),
        catchError(error => {
          console.error('CNIC Login error:', error);
          return throwError(() => error);
        })
      ) as any;
  }

  // Real Signup API
  signup(data: any): Observable<User> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, data)
      .pipe(
        tap(response => {
          if (response.success) {
            // Auto-login after signup
            this.currentUser.set(response.user);
            localStorage.setItem('dms_user', JSON.stringify(response.user));
            localStorage.setItem('dms_token', response.token);
            this.redirectBasedOnRole(response.user.role);
          }
        }),
        catchError(error => {
          console.error('Signup error:', error);
          return throwError(() => error);
        })
      ) as any;
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('dms_user');
    localStorage.removeItem('dms_token');
    this.router.navigate(['/']);
  }

  private redirectBasedOnRole(role: string) {
    // Redirect to role-specific dashboard
    const roleRoutes: Record<string, string> = {
      'admin': '/dashboard/admin/overview',
      'ngo': '/dashboard/ngo/overview',
      'volunteer': '/dashboard/volunteer/home',
      'victim': '/dashboard/victim/overview'
    };

    const route = roleRoutes[role] || '/dashboard';
    this.router.navigate([route]);
  }
}


