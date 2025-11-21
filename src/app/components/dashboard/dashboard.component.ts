import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimplePriceComponent } from '../simple-price/simple-price.component';
import { DetailedFormComponent } from '../detailed-form/detailed-form.component';
import { ChartComponent } from '../chart/chart.component';
import { MarkerVolumeComponent } from '../marker-volume/marker-volume.component';
import { CalculationService } from '../../services/calculation.service';

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
  private calcService = inject(CalculationService);

  readonly vm = computed(() => ({
    loading: this.calcService.loading(),
    error: this.calcService.error()
  }));

  setView(mode: 'simple' | 'detailed') {
    this.viewMode.set(mode);
  }

  retry() {
    this.calcService.refreshData();
  }
}
