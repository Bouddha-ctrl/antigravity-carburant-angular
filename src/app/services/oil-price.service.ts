import { Injectable } from '@angular/core';
import { OilPriceRepository, OilPriceResponse } from '../core/repositories/oil-price.repository';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class OilPriceService {
    private repository = inject(OilPriceRepository);

    getPrices(): Observable<OilPriceResponse> {
        return this.repository.getPrices();
    }

    refreshPrices(): Observable<OilPriceResponse> {
        return this.repository.getPrices(true);
    }
}
