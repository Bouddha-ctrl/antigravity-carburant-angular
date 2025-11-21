import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface OilPriceData {
    date: string;
    oil_price: number;
    exchange_rate: number;
}

export interface OilPriceResponse {
    items: OilPriceData[];
    count: number;
}

@Injectable({
    providedIn: 'root'
})
export class OilPriceService {
    private http = inject(HttpClient);
    private readonly API_URL = 'https://dbffffffubaths.cloudfront.net/oil-prices';

    getPrices(): Observable<OilPriceResponse> {
        return this.http.get<OilPriceResponse>(this.API_URL).pipe(
            catchError(error => {
                console.warn('API call failed, using mock data', error);
                return of(this.generateMockData());
            })
        );
    }

    private generateMockData(): OilPriceResponse {
        const items: OilPriceData[] = [];
        const today = new Date();

        for (let i = 45; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            items.push({
                date: date.toISOString().split('T')[0],
                oil_price: 750 + Math.random() * 50,
                exchange_rate: 9.25 + Math.random() * 0.1
            });
        }

        return {
            items,
            count: items.length
        };
    }
}
