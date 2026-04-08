import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import * as L from "leaflet";
import { MatDialog } from "@angular/material/dialog";
import { ReportDisasterDialogComponent } from "../report-disaster-dialog/report-disaster-dialog";

@Component({
  selector: "app-interactive-map",
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatSelectModule, MatFormFieldModule, MatInputModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule, FormsModule],
  templateUrl: "./interactive-map.html",
  styleUrls: ["./interactive-map.css"]
})
export class InteractiveMapComponent implements OnInit, OnDestroy {
  private map!: L.Map;
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  selectedDisasterType = "all";
  selectedSeverity = "all";
  showDistributionPoints = true;
  loading = true;
  private allDisasters: any[] = [];
  private allDistributionPoints: any[] = [];
  private disasterLayer = L.layerGroup();
  private distributionLayer = L.layerGroup();
  private userMarker: L.Marker | null = null;
  private apiUrl = "http://localhost:5000/api";

  ngOnInit() {
    this.initMap();
    this.loadMapData();
    this.route.queryParams.subscribe(params => {
      const lat = parseFloat(params["lat"]);
      const lng = parseFloat(params["lng"]);
      const highlight = params["highlight"];
      if (!isNaN(lat) && !isNaN(lng)) {
        setTimeout(() => {
          this.map.setView([lat, lng], 16);
          // If coming from victim request, add a pulsing marker at the exact point
          if (highlight === "distribution") {
            const pulseIcon = L.divIcon({
              className: "",
              html: `<div style="position:relative;">
                <div style="width:60px;height:60px;border-radius:50%;background:rgba(16,185,129,0.2);
                  border:3px solid #10b981;animation:pulse 1.5s infinite;position:absolute;top:-30px;left:-30px;"></div>
                <div style="background:#10b981;width:40px;height:40px;border-radius:50% 50% 50% 0;
                  transform:rotate(-45deg);border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);
                  display:flex;align-items:center;justify-content:center;position:absolute;top:-20px;left:-20px;">
                  <span style="transform:rotate(45deg);font-size:18px;">🏪</span></div>
              </div>`,
              iconSize: [0, 0], iconAnchor: [0, 0]
            });
            L.marker([lat, lng], { icon: pulseIcon })
              .bindPopup("<strong>🏪 Your Distribution Point</strong><br><small>This is where you collect your aid</small>")
              .addTo(this.map)
              .openPopup();
          }
        }, 500);
      }
    });
  }

  ngOnDestroy() { if (this.map) this.map.remove(); }

  private initMap() {
    this.map = L.map("map", { center: [30.3753, 69.3451], zoom: 6, zoomControl: false });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(this.map);
    L.control.zoom({ position: "bottomright" }).addTo(this.map);
    this.disasterLayer.addTo(this.map);
    this.distributionLayer.addTo(this.map);
  }

  loadMapData() {
    this.loading = true;
    this.http.get<any>(this.apiUrl + "/map/data").subscribe({
      next: (res) => {
        if (res.success) { this.allDisasters = res.data.disasters; this.allDistributionPoints = res.data.distributionPoints; this.renderMarkers(); }
        this.loading = false; this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  private renderMarkers() {
    this.disasterLayer.clearLayers();
    this.distributionLayer.clearLayers();
    this.allDisasters.filter(d => (this.selectedDisasterType === "all" || d.disasterType === this.selectedDisasterType) && (this.selectedSeverity === "all" || d.severity === this.selectedSeverity)).forEach(d => this.addDisasterMarker(d));
    if (this.showDistributionPoints) this.allDistributionPoints.forEach(p => this.addDistributionMarker(p));
  }

  private addDisasterMarker(d: any) {
    const color = this.getDisasterColor(d.disasterType);
    const size = this.getSeveritySize(d.severity);
    const emoji = this.getDisasterEmoji(d.disasterType);
    const icon = L.divIcon({ className: "", html: "<div style='position:relative;width:" + (size+16) + "px;height:" + (size+20) + "px;'><div style='background:" + color + ";width:" + (size+16) + "px;height:" + (size+16) + "px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;'><span style='transform:rotate(45deg);font-size:" + (size*0.7) + "px;line-height:1;'>" + emoji + "</span></div></div>", iconSize: [size+16, size+20], iconAnchor: [(size+16)/2, size+20] });
    const needsList = d.needs ? Object.entries(d.needs).filter(([,v]) => v).map(([k]) => k).join(", ") : "";
    L.marker(d.location, { icon }).bindPopup("<div style='min-width:200px;font-family:sans-serif;'><div style='background:" + color + ";color:white;padding:8px 12px;margin:-12px -12px 10px;border-radius:4px 4px 0 0;'><strong>" + emoji + " " + (d.disasterType||"").toUpperCase() + "</strong><span style='float:right;background:rgba(0,0,0,0.2);padding:2px 6px;border-radius:10px;font-size:11px;'>" + (d.severity||"").toUpperCase() + "</span></div><p style='margin:4px 0;'><strong>Location:</strong> " + (d.address||"Unknown") + "</p><p style='margin:4px 0;'><strong>Affected:</strong> " + (d.peopleAffected||0).toLocaleString() + "</p>" + (needsList ? "<p style='margin:4px 0;'><strong>Needs:</strong> " + needsList + "</p>" : "") + (d.description ? "<p style='margin:6px 0;color:#555;font-size:12px;'>" + d.description + "</p>" : "") + "<p style='margin:4px 0;font-size:11px;color:#888;'>Status: " + d.status + "</p></div>", { maxWidth: 280 }).bindTooltip(d.disasterType + " - " + d.severity, { direction: "top" }).addTo(this.disasterLayer);
  }

  private addDistributionMarker(p: any) {
    const icon = L.divIcon({ className: "", html: "<div style='background:#10b981;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 3px 10px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;'><span style='transform:rotate(45deg);font-size:16px;'>🏪</span></div>", iconSize: [36, 40], iconAnchor: [18, 40] });
    const hoursLeft = Math.max(0, Math.floor((new Date(p.shiftEnd).getTime() - Date.now()) / 3600000));
    L.marker(p.location, { icon }).bindPopup("<div style='min-width:200px;font-family:sans-serif;'><div style='background:#10b981;color:white;padding:8px 12px;margin:-12px -12px 10px;border-radius:4px 4px 0 0;'><strong>🏪 Distribution Point</strong></div><p style='margin:4px 0;'><strong>Location:</strong> " + p.address + "</p><p style='margin:4px 0;'><strong>NGO:</strong> " + p.ngoName + "</p>" + (p.ngoContact ? "<p style='margin:4px 0;'><strong>Contact:</strong> " + p.ngoContact + "</p>" : "") + "<p style='margin:4px 0;'><strong>Time left:</strong> " + hoursLeft + "h</p><p style='margin:4px 0;'><strong>Distributed:</strong> " + p.totalDistributions + "</p></div>", { maxWidth: 280 }).bindTooltip("Distribution: " + p.address, { direction: "top" }).addTo(this.distributionLayer);
  }

  locateMe() {
    if (!navigator.geolocation) { this.snackBar.open("Geolocation not supported", "Close", { duration: 3000 }); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude; const lng = pos.coords.longitude;
        if (this.userMarker) this.map.removeLayer(this.userMarker);
        const icon = L.divIcon({ className: "", html: "<div style='width:16px;height:16px;background:#3b82f6;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);'></div>", iconSize: [16, 16], iconAnchor: [8, 8] });
        this.userMarker = L.marker([lat, lng], { icon }).bindPopup("<strong>Your Location</strong>").addTo(this.map);
        this.map.setView([lat, lng], 12);
        this.snackBar.open("Location found!", "Close", { duration: 2000 });
      },
      () => this.snackBar.open("Could not get location", "Close", { duration: 3000 })
    );
  }

  applyFilters() { this.renderMarkers(); }
  toggleDistributionPoints() { this.showDistributionPoints = !this.showDistributionPoints; this.renderMarkers(); }
  resetFilters() { this.selectedDisasterType = "all"; this.selectedSeverity = "all"; this.showDistributionPoints = true; this.renderMarkers(); }
  openReportDialog() { 
    const ref = this.dialog.open(ReportDisasterDialogComponent, { width: "600px", maxWidth: "95vw", panelClass: "glass-dialog" });
    ref.afterClosed().subscribe(result => { if (result) { setTimeout(() => this.loadMapData(), 500); } });
  }
  get disasterCount() { return this.allDisasters.length; }
  get distributionCount() { return this.allDistributionPoints.length; }
  private getDisasterColor(t: string): string { return ({flood:"#3b82f6",fire:"#ef4444",earthquake:"#f97316",landslide:"#92400e",cyclone:"#a855f7",accident:"#eab308"} as any)[t]||"#6b7280"; }
  private getSeveritySize(s: string): number { return ({low:10,medium:14,high:18,critical:22} as any)[s]||14; }
  private getDisasterEmoji(t: string): string { return ({flood:"🌊",fire:"🔥",earthquake:"🏚",landslide:"⛰",cyclone:"🌪",accident:"🚑"} as any)[t]||"⚠️"; }
}



