import { Injectable, computed, signal, inject } from '@angular/core';
import { CalculationParams, CalculationResult, DEFAULT_PARAMS } from '../models/fuel-calculation.model';
import { RawDataItem, HistoryPoint } from '../models/data-models';
import { OilPriceService } from './oil-price.service';

// Internal class to encapsulate the exact logic provided by the user
class FormClass {
    cotation!: number;
    fret: number = 15;
    taux!: number;
    taxePortuaires: number = 21.04;
    fraisApprocheFixe: number = 16.62;
    fraisApprocheVariable: number = 1.8;
    taxeParafiscale: number = 0.25;
    remunerationStockage: number = 150;

    prixRepriseTonne!: number;
    prixReprise100Littres!: number;

    tic: number = 242.2;
    tva: number = 10; //% * (prix de reprise 100L + tic)
    creditDroit: number = 0.41; // % *(tic+tva)
    sousTotal!: number; //prix de reprise 100L + tic + tva + credit de droit
    fraisMargeDistribution: number = 28.4;

    prixVenteGrosHorsTva!: number; // sous total + fraisMargeDistribution - tva
    prixVenteGrosAvecTva!: number; // prixVenteGrosHorsTva + tva*prixVenteGrosHorsTva

    coulageDetaillants: number = 0.5; //% * prixVenteGrosAvecTva
    correctionVariationThermique: number = 1.5;
    margeDetail: number = 26.4;
    prixVenteDetailHorsTva!: number; //prixVenteGrosAvecTva+coulageDetaillants+correctionVariationThermique+margeDetail+ tva*prixVenteGrosHorsTva
    prixVenteDetailAvecTva!: number; //prixVenteDetailHorsTva + tva*prixVenteDetailHorsTva

    finalPrice!: number;
    constructor() { }

    calculePart1(): void {
        let cotatioMAD = this.cotation * this.taux;
        let fretMad = this.fret * this.taux;

        let fraitApproche =
            this.fraisApprocheFixe +
            (this.fraisApprocheVariable * (cotatioMAD + fretMad)) / 100;

        let fraisParafiscale =
            (this.taxeParafiscale * (cotatioMAD + fretMad + this.taxePortuaires)) /
            100;

        this.prixRepriseTonne =
            cotatioMAD +
            fretMad +
            this.taxePortuaires +
            fraitApproche +
            fraisParafiscale +
            this.remunerationStockage;

        this.prixRepriseTonne = this.round2(this.prixRepriseTonne);
        this.prixReprise100Littres =
            Math.round(this.prixRepriseTonne * 0.84 * 10) / 10 / 10;

        this.prixReprise100Littres = this.round2(this.prixReprise100Littres);
    }

    calculePart2(): void {
        let tvaValue = (this.tva * (this.prixReprise100Littres + this.tic)) / 100;
        let creditDroitValue = (this.creditDroit * (this.tic + tvaValue)) / 100;
        this.sousTotal = this.round2(
            this.prixReprise100Littres + this.tic + tvaValue + creditDroitValue
        );
    }

    calculePart3(): void {
        let tvaValue = (this.tva * (this.prixReprise100Littres + this.tic)) / 100;
        this.prixVenteGrosHorsTva = this.round2(
            this.sousTotal + this.fraisMargeDistribution - tvaValue
        );

        this.prixVenteGrosAvecTva = this.round2(
            (this.tva * this.prixVenteGrosHorsTva) / 100 + this.prixVenteGrosHorsTva
        );
    }

    calculePart4(): void {
        let coulageDetaillantsValue =
            (this.coulageDetaillants * this.prixVenteGrosAvecTva) / 100;
        let tvaValue = (this.tva * this.prixVenteGrosHorsTva) / 100;

        this.prixVenteDetailHorsTva = this.round2(
            this.prixVenteGrosAvecTva +
            coulageDetaillantsValue +
            this.correctionVariationThermique +
            this.margeDetail -
            tvaValue
        );

        let tva2Value = (this.tva * this.prixVenteDetailHorsTva) / 100;

        this.prixVenteDetailAvecTva = this.round2(
            this.prixVenteDetailHorsTva + tva2Value
        );
    }
    calcule(): number {
        this.calculePart1();
        this.calculePart2();
        this.calculePart3();
        this.calculePart4();

        this.finalPrice = Math.ceil(this.prixVenteDetailAvecTva) / 100;

        return this.finalPrice;
    }

    equals(anotherFrom: FormClass): boolean {
        return JSON.stringify(this) === JSON.stringify(anotherFrom);
    }

    round2(value: number): number {
        return Math.round(value * 100) / 100;
    }
}

@Injectable({
    providedIn: 'root'
})
export class CalculationService {
    readonly params = signal<CalculationParams>(DEFAULT_PARAMS);
    readonly history = signal<HistoryPoint[]>([]);

    readonly result = computed(() => {
        const p = this.params();
        const calculator = new FormClass();
        Object.assign(calculator, p);
        calculator.calcule();

        return {
            prixRepriseTonne: calculator.prixRepriseTonne,
            prixReprise100Littres: calculator.prixReprise100Littres,
            sousTotal: calculator.sousTotal,
            prixVenteGrosHorsTva: calculator.prixVenteGrosHorsTva,
            prixVenteGrosAvecTva: calculator.prixVenteGrosAvecTva,
            prixVenteDetailHorsTva: calculator.prixVenteDetailHorsTva,
            prixVenteDetailAvecTva: calculator.prixVenteDetailAvecTva,
            finalPrice: calculator.finalPrice
        } as CalculationResult;
    });

    readonly finalPrice = computed(() => this.result().finalPrice);

    private oilPriceService = inject(OilPriceService);
    private readonly LAG_DAYS = 15;

    constructor() {
        this.oilPriceService.getPrices().subscribe({
            next: (response) => this.processData(response.items)
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
        const historyPoints: HistoryPoint[] = [];
        const latestExchangeRate = rawData[rawData.length - 1].exchange_rate;

        for (let offset = -15; offset <= 15; offset++) {
            const targetDate = this.createTargetDate(today, offset);
            const exchangeRate = this.determineExchangeRate(rawData, targetDate, offset, latestExchangeRate);

            if (!exchangeRate) continue;

            const calculatedPrice = this.calculatePriceForDate(rawData, targetDate, exchangeRate);

            if (calculatedPrice !== null) {
                historyPoints.push({
                    timestamp: targetDate,
                    price: calculatedPrice,
                    isForecast: offset > 0
                });
            }
        }

        return historyPoints;
    }

    private createTargetDate(today: Date, offset: number): Date {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset);
        targetDate.setHours(0, 0, 0, 0);
        return targetDate;
    }

    private determineExchangeRate(rawData: RawDataItem[], targetDate: Date, offset: number, latestExchangeRate: number): number | null {
        if (offset <= 0) {
            const rateEntry = this.findDataByDate(rawData, targetDate);
            return rateEntry ? rateEntry.exchange_rate : null;
        }
        return latestExchangeRate;
    }

    private calculatePriceForDate(rawData: RawDataItem[], targetDate: Date, exchangeRate: number): number | null {
        const laggedOilPrice = this.findLaggedOilPrice(rawData, targetDate);
        return laggedOilPrice ? this.computeFinalPrice(laggedOilPrice, exchangeRate) : null;
    }

    private findLaggedOilPrice(rawData: RawDataItem[], targetDate: Date): number | null {
        const laggedDate = new Date(targetDate);
        laggedDate.setDate(laggedDate.getDate() - this.LAG_DAYS);

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
        const calculator = new FormClass();
        Object.assign(calculator, { ...DEFAULT_PARAMS, cotation: oilPrice, taux: exchangeRate });
        calculator.calcule();
        return calculator.finalPrice;
    }

    private updateCurrentParams(rawData: RawDataItem[]): void {
        const today = new Date();
        const todayLaggedDate = new Date(today);
        todayLaggedDate.setDate(todayLaggedDate.getDate() - this.LAG_DAYS);

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

    getCalculations() {
        return this.history;
    }
}
