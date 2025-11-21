import { Component, EventEmitter, Output, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { CalculationService } from '../../services/calculation.service';

@Component({
  selector: 'app-simple-price',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './simple-price.component.html',
  styleUrl: './simple-price.component.css'
})
export class SimplePriceComponent {
  @Output() switchToDetail = new EventEmitter<void>();

  private calcService = inject(CalculationService);
  private fb = inject(FormBuilder);

  readonly finalPrice = this.calcService.finalPrice;
  readonly loading = this.calcService.loading;

  // Computed signals for display values (rounded to 2 decimals)
  readonly cotationDisplay = computed(() => {
    const value = this.form.get('cotation')?.value;
    if (value === null || value === undefined) return '';
    return Number(value).toFixed(2);
  });

  readonly tauxDisplay = computed(() => {
    const value = this.form.get('taux')?.value;
    if (value === null || value === undefined) return '';
    return Number(value).toFixed(2);
  });

  form = this.fb.group({
    cotation: [0],
    taux: [0]
  });

  constructor() {
    // Sync form with service params
    effect(() => {
      const params = this.calcService.params();
      this.form.patchValue({
        cotation: params.cotation,
        taux: params.taux
      }, { emitEvent: false });
    });

    // Update service when form changes
    this.form.valueChanges.subscribe(value => {
      if (value.cotation !== null && value.taux !== null) {
        this.calcService.updateParams({
          cotation: value.cotation,
          taux: value.taux
        });
      }
    });
  }

  onCotationInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({ cotation: parseFloat(value) || 0 });
  }

  onTauxInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({ taux: parseFloat(value) || 0 });
  }
}
