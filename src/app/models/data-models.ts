export interface RawDataItem {
    date: Date;
    oil_price: number;
    exchange_rate: number;
}

export interface HistoryPoint {
    timestamp: Date;
    price: number;
    isForecast: boolean;
}
