import { Injectable, computed, signal, inject } from '@angular/core';
import { CalculationParams, CalculationResult, DEFAULT_PARAMS } from '../models/fuel-calculation.model';
import { RawDataItem, HistoryPoint } from '../models/data-models';
import { OilPriceRepository } from '../core/repositories/oil-price.repository';
import { FuelCalculator } from '../core/fuel-calculator';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class CalculationService {
    readonly params = signal<CalculationParams>(DEFAULT_PARAMS);
    readonly history = signal<HistoryPoint[]>([]);
    readonly loading = signal<boolean>(false);
    readonly error = signal<string | null>(null);

    readonly result = computed(() => {
        const calculator = new FuelCalculator(this.params());
        return calculator.calculate();
    });

    readonly finalPrice = computed(() => this.result().finalPrice);

    private repository = inject(OilPriceRepository);

    constructor() {
        this.loadPrices();
    }

    private loadPrices(): void {
        this.loading.set(true);
        this.error.set(null);

        this.repository.getPrices().subscribe({
            next: (response) => {
                this.processData(response.items);
                this.loading.set(false);
            },
            error: (err) => {
                this.error.set('Failed to load price data');
                this.loading.set(false);
                console.error('Error loading prices:', err);
            }
        });
    }

    private processData(apiItems: { date: string; oil_price: number; exchange_rate: number }[]): void {
        const rawData = this.sortAndMapRawData(apiItems);
        if (rawData.length === 0) return;

        const historyPoints = this.generateHistoryPoints(rawData);
        this.history.set(historyPoints);

        this.updateCurrentParams(rawData);
    }

    private sortAndMapRawData(apiItems: { date: string; oil_price: number; exchange_rate: number }[]): RawDataItem[] {
        const sortedItems = [...apiItems].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        return sortedItems.map(item => ({
            date: new Date(item.date),
            oil_price: item.oil_price,
            exchange_rate: item.exchange_rate
        }));
    }

    private generateHistoryPoints(rawData: RawDataItem[]): HistoryPoint[] {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const historyPoints: HistoryPoint[] = [];

        // Get the latest exchange rate for forecast calculations
        const latestExchangeRate = rawData[rawData.length - 1].exchange_rate;

        console.log('Generating history points from', new Date(today.getTime() - environment.historyDays * 24 * 60 * 60 * 1000), 'to', new Date(today.getTime() + environment.forecastDays * 24 * 60 * 60 * 1000));
        console.log('Raw data available from', rawData[0]?.date, 'to', rawData[rawData.length - 1]?.date);

        // Generate points from -15 to +15 days
        for (let offset = -environment.historyDays; offset <= environment.forecastDays; offset++) {
            const targetDate = this.createTargetDate(today, offset);
            
            // For historical data (offset <= 0), use actual exchange rate from that day
            // For forecast data (offset > 0), use latest exchange rate
            const exchangeRate = offset <= 0 
                ? this.findDataByDate(rawData, targetDate)?.exchange_rate
                : latestExchangeRate;

            if (!exchangeRate) {
                console.log('No exchange rate for offset', offset, 'date', targetDate);
                continue;
            }

            // Calculate price using cotation from 15 days before target date
            const calculatedPrice = this.calculatePriceForDate(rawData, targetDate, exchangeRate);

            if (calculatedPrice !== null) {
                historyPoints.push({
                    timestamp: targetDate,
                    price: calculatedPrice,
                    isForecast: offset > 0
                });
            } else {
                console.log('No calculated price for offset', offset, 'date', targetDate);
            }
        }

        console.log('Generated', historyPoints.length, 'history points');
        return historyPoints;
    }

    private createTargetDate(today: Date, offset: number): Date {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate;
    }

    private calculatePriceForDate(rawData: RawDataItem[], targetDate: Date, exchangeRate: number): number | null {
        const laggedOilPrice = this.findLaggedOilPrice(rawData, targetDate);
        return laggedOilPrice ? this.computeFinalPrice(laggedOilPrice, exchangeRate) : null;
    }

    private findLaggedOilPrice(rawData: RawDataItem[], targetDate: Date): number | null {
        const laggedDate = new Date(targetDate);
        laggedDate.setDate(laggedDate.getDate() - environment.lagDays);

        const laggedEntry = this.findDataByDate(rawData, laggedDate);
        return laggedEntry ? laggedEntry.oil_price : null;
    }

    private findDataByDate(rawData: RawDataItem[], targetDate: Date): RawDataItem | undefined {
        return rawData.find(d =>
            d.date.getDate() === targetDate.getDate() &&
            d.date.getMonth() === targetDate.getMonth() &&
            d.date.getFullYear() === targetDate.getFullYear()
        );
    }

    private computeFinalPrice(oilPrice: number, exchangeRate: number): number {
        const calculator = new FuelCalculator({
            ...DEFAULT_PARAMS,
            cotation: oilPrice,
            taux: exchangeRate
        });
        return calculator.calculate().finalPrice;
    }

    private updateCurrentParams(rawData: RawDataItem[]): void {
        const today = new Date();
        const todayLaggedDate = new Date(today);
        todayLaggedDate.setDate(todayLaggedDate.getDate() - environment.lagDays);

        const todayLaggedEntry = this.findDataByDate(rawData, todayLaggedDate);
        const todayEntry = this.findDataByDate(rawData, today);

        if (todayLaggedEntry && todayEntry) {
            this.updateParams({
                cotation: todayLaggedEntry.oil_price,
                taux: todayEntry.exchange_rate
            });
        }
    }

    updateParams(newParams: Partial<CalculationParams>): void {
        this.params.update(current => ({ ...current, ...newParams }));
    }

    refreshData(): void {
        this.repository.clearCache();
        this.loadPrices();
    }

    getCalculations() {
        return this.history;
    }
}
