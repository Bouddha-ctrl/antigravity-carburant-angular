import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimplePriceComponent } from '../simple-price/simple-price.component';
import { DetailedFormComponent } from '../detailed-form/detailed-form.component';
import { ChartComponent } from '../chart/chart.component';
import { MarkerVolumeComponent } from '../marker-volume/marker-volume.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SimplePriceComponent,
    DetailedFormComponent,
    ChartComponent,
    MarkerVolumeComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  viewMode = signal<'simple' | 'detailed'>('simple');

  setView(mode: 'simple' | 'detailed') {
    this.viewMode.set(mode);
  }
}
