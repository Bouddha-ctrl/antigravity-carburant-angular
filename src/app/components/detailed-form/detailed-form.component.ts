import { Component, EventEmitter, Output, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CalculationService } from '../../services/calculation.service';
import { CalculationParams, DEFAULT_PARAMS } from '../../models/fuel-calculation.model';

@Component({
  selector: 'app-detailed-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './detailed-form.component.html',
  styleUrl: './detailed-form.component.css'
})
export class DetailedFormComponent {
  @Output() close = new EventEmitter<void>();

  private calcService = inject(CalculationService);
  private fb = inject(FormBuilder);

  readonly result = this.calcService.result;
  
  form: FormGroup;
  paramKeys: (keyof CalculationParams)[];

  constructor() {
    this.paramKeys = Object.keys(DEFAULT_PARAMS) as (keyof CalculationParams)[];
    
    // Build form from params
    const formConfig: any = {};
    this.paramKeys.forEach(key => {
      formConfig[key] = [0];
    });
    this.form = this.fb.group(formConfig);

    // Sync form with service params
    effect(() => {
      const params = this.calcService.params();
      this.form.patchValue(params, { emitEvent: false });
    });

    // Update service when form changes
    this.form.valueChanges.subscribe(value => {
      this.calcService.updateParams(value);
    });
  }

  formatLabel(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  resetDefaults() {
    this.form.patchValue(DEFAULT_PARAMS);
  }
}
