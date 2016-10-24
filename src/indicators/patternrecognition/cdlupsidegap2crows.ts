import * as indicators from "../";
import * as marketData from "../../data/market/";
import { AbstractIndicator } from "../abstractIndicator";

export const CDLUPSIDEGAP2CROWS_INDICATOR_NAME: string = "CDLUPSIDEGAP2CROWS";
export const CDLUPSIDEGAP2CROWS_INDICATOR_DESCR: string = "Upside Gap Two Crows";

export class CDLUPSIDEGAP2CROWS
    extends AbstractIndicator<marketData.IPriceBar, number>
    implements indicators.IIndicator<marketData.IPriceBar, number> {

    constructor() {
        super(CDLUPSIDEGAP2CROWS_INDICATOR_NAME, CDLUPSIDEGAP2CROWS_INDICATOR_DESCR);
    }

    receiveData(inputData: marketData.IPriceBar): boolean {
        return this.isReady;
    }
}