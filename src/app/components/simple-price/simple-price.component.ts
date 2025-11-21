import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CalculationService } from '../../services/calculation.service';

@Component({
  selector: 'app-simple-price',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './simple-price.component.html',
  styleUrl: './simple-price.component.css'
})
export class SimplePriceComponent {
  @Output() switchToDetail = new EventEmitter<void>();

  calcService = inject(CalculationService);

  updateCotation(val: number) {
    this.calcService.updateParams({ cotation: val });
  }

  updateTaux(val: number) {
    this.calcService.updateParams({ taux: val });
  }
}
