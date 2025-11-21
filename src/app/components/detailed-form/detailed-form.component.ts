import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalculationService } from '../../services/calculation.service';
import { CalculationParams, DEFAULT_PARAMS } from '../../models/fuel-calculation.model';

@Component({
  selector: 'app-detailed-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detailed-form.component.html',
  styleUrl: './detailed-form.component.css'
})
export class DetailedFormComponent {
  @Output() close = new EventEmitter<void>();

  calcService = inject(CalculationService);
  params = this.calcService.params;
  result = this.calcService.result;

  // Get keys for iteration
  get paramKeys(): (keyof CalculationParams)[] {
    return Object.keys(DEFAULT_PARAMS) as (keyof CalculationParams)[];
  }

  formatLabel(key: string): string {
    // Convert camelCase to Title Case
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  updateParam(key: keyof CalculationParams, value: number) {
    this.calcService.updateParams({ [key]: value });
  }

  resetDefaults() {
    this.calcService.updateParams(DEFAULT_PARAMS);
  }
}
