import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

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
export class OilPriceRepository {
  private http = inject(HttpClient);
  private cache$ : Observable<OilPriceResponse> | null = null;
  private cacheTimestamp = 0;

  getPrices(forceRefresh = false): Observable<OilPriceResponse> {
    const now = Date.now();
    const isCacheValid = this.cache$ && (now - this.cacheTimestamp) < environment.cacheTimeout;

    if (!forceRefresh && isCacheValid) {
      return this.cache$!;
    }

    this.cache$ = this.http.get<OilPriceResponse>(environment.apiUrl).pipe(
      tap(() => this.cacheTimestamp = now),
      catchError(error => {
        console.warn('API call failed, using mock data', error);
        return of(this.generateMockData());
      }),
      shareReplay(1)
    );

    return this.cache$;
  }

  clearCache(): void {
    this.cache$ = null;
    this.cacheTimestamp = 0;
  }

  private generateMockData(): OilPriceResponse {
    const items: OilPriceData[] = [];
    const today = new Date();

    // Generate data from today -30 to today (31 days total)
    // This allows us to calculate prices from today -15 to today +15
    // (each needs cotation from 15 days before)
    for (let i = -30; i <= 0; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      items.push({
        date: date.toISOString().split('T')[0],
        oil_price: 750 + Math.random() * 50,
        exchange_rate: 9.25 + Math.random() * 0.1
      });
    }
    console.log('Mock data generated:', items.length, 'items from', items[0].date, 'to', items[items.length - 1].date);
    return {
      items,
      count: items.length
    };
  }
}
