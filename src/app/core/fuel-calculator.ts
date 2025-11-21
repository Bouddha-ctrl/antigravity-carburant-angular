import { CalculationParams, CalculationResult } from '../models/fuel-calculation.model';

interface IntermediateResult {
  prixRepriseTonne: number;
  prixReprise100Littres: number;
}

interface SubtotalResult {
  sousTotal: number;
}

interface WholesalePriceResult {
  prixVenteGrosHorsTva: number;
  prixVenteGrosAvecTva: number;
}

interface RetailPriceResult {
  prixVenteDetailHorsTva: number;
  prixVenteDetailAvecTva: number;
}

export class FuelCalculator {
  private readonly params: CalculationParams;

  constructor(params: CalculationParams) {
    this.params = { ...params };
  }

  calculate(): CalculationResult {
    const costPerTon = this.calculateCostPerTon();
    const subtotal = this.calculateSubtotal(costPerTon.prixReprise100Littres);
    const wholesalePrice = this.calculateWholesalePrice(subtotal.sousTotal, costPerTon.prixReprise100Littres);
    const retailPrice = this.calculateRetailPrice(wholesalePrice);

    const finalPrice = Math.ceil(retailPrice.prixVenteDetailAvecTva) / 100;

    return {
      ...costPerTon,
      ...subtotal,
      ...wholesalePrice,
      ...retailPrice,
      finalPrice
    };
  }

  private calculateCostPerTon(): IntermediateResult {
    const cotationMAD = this.params.cotation * this.params.taux;
    const fretMAD = this.params.fret * this.params.taux;

    const fraisApproche = this.params.fraisApprocheFixe +
      (this.params.fraisApprocheVariable * (cotationMAD + fretMAD)) / 100;

    const fraisParafiscale = (this.params.taxeParafiscale *
      (cotationMAD + fretMAD + this.params.taxePortuaires)) / 100;

    const prixRepriseTonne = this.round(
      cotationMAD +
      fretMAD +
      this.params.taxePortuaires +
      fraisApproche +
      fraisParafiscale +
      this.params.remunerationStockage
    );

    const prixReprise100Littres = this.round(
      Math.round(prixRepriseTonne * 0.84 * 10) / 10 / 10
    );

    return { prixRepriseTonne, prixReprise100Littres };
  }

  private calculateSubtotal(prixReprise100Littres: number): SubtotalResult {
    const tvaValue = (this.params.tva * (prixReprise100Littres + this.params.tic)) / 100;
    const creditDroitValue = (this.params.creditDroit * (this.params.tic + tvaValue)) / 100;

    const sousTotal = this.round(
      prixReprise100Littres + this.params.tic + tvaValue + creditDroitValue
    );

    return { sousTotal };
  }

  private calculateWholesalePrice(sousTotal: number, prixReprise100Littres: number): WholesalePriceResult {
    const tvaValue = (this.params.tva * (prixReprise100Littres + this.params.tic)) / 100;

    const prixVenteGrosHorsTva = this.round(
      sousTotal + this.params.fraisMargeDistribution - tvaValue
    );

    const prixVenteGrosAvecTva = this.round(
      (this.params.tva * prixVenteGrosHorsTva) / 100 + prixVenteGrosHorsTva
    );

    return { prixVenteGrosHorsTva, prixVenteGrosAvecTva };
  }

  private calculateRetailPrice(wholesalePrice: WholesalePriceResult): RetailPriceResult {
    const { prixVenteGrosAvecTva, prixVenteGrosHorsTva } = wholesalePrice;

    const coulageDetaillantsValue = (this.params.coulageDetaillants * prixVenteGrosAvecTva) / 100;
    const tvaValue = (this.params.tva * prixVenteGrosHorsTva) / 100;

    const prixVenteDetailHorsTva = this.round(
      prixVenteGrosAvecTva +
      coulageDetaillantsValue +
      this.params.correctionVariationThermique +
      this.params.margeDetail -
      tvaValue
    );

    const tva2Value = (this.params.tva * prixVenteDetailHorsTva) / 100;
    const prixVenteDetailAvecTva = this.round(prixVenteDetailHorsTva + tva2Value);

    return { prixVenteDetailHorsTva, prixVenteDetailAvecTva };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
