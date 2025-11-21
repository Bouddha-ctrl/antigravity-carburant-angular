export interface CalculationParams {
    cotation: number;
    fret: number;
    taux: number;
    taxePortuaires: number;
    fraisApprocheFixe: number;
    fraisApprocheVariable: number;
    taxeParafiscale: number;
    remunerationStockage: number;
    tic: number;
    tva: number;
    creditDroit: number;
    fraisMargeDistribution: number;
    coulageDetaillants: number;
    correctionVariationThermique: number;
    margeDetail: number;
}

export interface CalculationResult {
    prixRepriseTonne: number;
    prixReprise100Littres: number;
    sousTotal: number;
    prixVenteGrosHorsTva: number;
    prixVenteGrosAvecTva: number;
    prixVenteDetailHorsTva: number;
    prixVenteDetailAvecTva: number;
    finalPrice: number;
}

export const DEFAULT_PARAMS: CalculationParams = {
    cotation: 0, // Needs input
    fret: 15,
    taux: 0, // Needs input
    taxePortuaires: 21.04,
    fraisApprocheFixe: 16.62,
    fraisApprocheVariable: 1.8,
    taxeParafiscale: 0.25,
    remunerationStockage: 150,
    tic: 242.2,
    tva: 10,
    creditDroit: 0.41,
    fraisMargeDistribution: 28.4,
    coulageDetaillants: 0.5,
    correctionVariationThermique: 1.5,
    margeDetail: 26.4
};
