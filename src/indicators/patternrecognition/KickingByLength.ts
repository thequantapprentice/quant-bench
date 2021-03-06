import * as indicators from "../";
import * as marketData from "../../data/market/";
import { SlidingWindow } from "../SlidingWindow";
import * as candleEnums from "./candleEnums";
import { CandleSettings } from "./candleSettings";
import { CandleStickUtils } from "./candleUtils";

export class KickingByLength
    extends indicators.AbstractIndicator<marketData.PriceBar> {

    static INDICATOR_NAME: string = "CDLKICKINGBYLENGTH";
    static INDICATOR_DESCR: string = "Kicking - bull/bear determined by the longer marubozu";

    private bodyLongPeriodTotal: number[];

    private bodyLongAveragePeriod: number;

    private shadowVeryShortPeriodTotal: number[];

    private shadowVeryShortAveragePeriod: number;

    private slidingWindow: SlidingWindow<marketData.PriceBar>;

    private secondCandle: marketData.PriceBar;
    private firstCandle: marketData.PriceBar;
    private secondCandleColor: candleEnums.CandleColor;
    private firstCandleColor: candleEnums.CandleColor;

    constructor() {
        super(KickingByLength.INDICATOR_NAME, KickingByLength.INDICATOR_DESCR);

        this.shadowVeryShortAveragePeriod = CandleSettings.get(candleEnums.CandleSettingType.ShadowVeryShort).averagePeriod;
        this.shadowVeryShortPeriodTotal = new Array<number>(2);
        for (let i = 0; i < this.shadowVeryShortPeriodTotal.length; i++) {
            this.shadowVeryShortPeriodTotal[i] = 0;
        }
        this.bodyLongAveragePeriod = CandleSettings.get(candleEnums.CandleSettingType.BodyLong).averagePeriod;
        this.bodyLongPeriodTotal = new Array<number>(2);
        for (let i = 0; i < this.bodyLongPeriodTotal.length; i++) {
            this.bodyLongPeriodTotal[i] = 0;
        }

        const lookback = Math.max(this.shadowVeryShortAveragePeriod, this.bodyLongAveragePeriod) + 1;
        this.slidingWindow = new SlidingWindow<marketData.PriceBar>(lookback + 1);
        this.setLookBack(lookback);
    }

    receiveData(inputData: marketData.PriceBar): boolean {
        this.slidingWindow.add(inputData);

        if (!this.slidingWindow.isReady) {
            this.seedSlidingWindow(inputData);
            return this.isReady;
        }

        this.populateCandleVariables();

        if (this.firstAndSecondCandlesAreOfOppositeColor() &&
            this.firstCandleIsAMarubozu() &&
            this.secondCandleIsAMarubozu() &&
            (this.anUpsideGapExistsBetweenCandlesIfFirstIsBlack() ||
                this.aDownsideGapExistsBetweenCandlesIfFirstIsWhite())) {

            this.setCurrentValue((CandleStickUtils.getRealBody(this.secondCandle) >
                CandleStickUtils.getRealBody(this.firstCandle) ? this.secondCandleColor : this.firstCandleColor) * 100);
        } else {
            this.setCurrentValue(0);
        }

        for (let i = 1; i >= 0; i--) {
            this.shadowVeryShortPeriodTotal[i] +=
                CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.ShadowVeryShort, this.slidingWindow.getItem(i)) -
                CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.ShadowVeryShort,
                    this.slidingWindow.getItem(i + this.shadowVeryShortAveragePeriod));

            this.bodyLongPeriodTotal[i] +=
                CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.BodyLong, this.slidingWindow.getItem(i)) -
                CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.BodyLong,
                    this.slidingWindow.getItem(i + this.bodyLongAveragePeriod));
        }

        return this.isReady;
    }

    private populateCandleVariables() {
        this.firstCandle = this.slidingWindow.getItem(1);
        this.secondCandle = this.slidingWindow.getItem(0);
        this.secondCandleColor = CandleStickUtils.getCandleColor(this.secondCandle);
        this.firstCandleColor = CandleStickUtils.getCandleColor(this.firstCandle);
    }

    private seedSlidingWindow(inputData: marketData.PriceBar) {
        if (this.slidingWindow.samples >= this.slidingWindow.period - this.shadowVeryShortAveragePeriod) {
            this.shadowVeryShortPeriodTotal[1] += CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.ShadowVeryShort,
                this.slidingWindow.getItem(1));
            this.shadowVeryShortPeriodTotal[0] += CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.ShadowVeryShort, inputData);
        }

        if (this.slidingWindow.samples >= this.slidingWindow.period - this.bodyLongAveragePeriod) {
            this.bodyLongPeriodTotal[1] += CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.BodyLong,
                this.slidingWindow.getItem(1));
            this.bodyLongPeriodTotal[0] += CandleStickUtils.getCandleRange(candleEnums.CandleSettingType.BodyLong, inputData);
        }
    }

    private firstAndSecondCandlesAreOfOppositeColor() {
        return this.firstCandleColor === this.secondCandleColor * -1;
    }

    private firstCandleIsAMarubozu() {
        return CandleStickUtils.getRealBody(this.firstCandle) >
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.BodyLong,
                this.bodyLongPeriodTotal[1],
                this.firstCandle) &&
            CandleStickUtils.getUpperShadow(this.firstCandle) <
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.ShadowVeryShort,
                this.shadowVeryShortPeriodTotal[1],
                this.firstCandle) &&
            CandleStickUtils.getLowerShadow(this.firstCandle) <
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.ShadowVeryShort,
                this.shadowVeryShortPeriodTotal[1], this.firstCandle);
    }

    private secondCandleIsAMarubozu() {
        return CandleStickUtils.getRealBody(this.secondCandle) >
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.BodyLong,
                this.bodyLongPeriodTotal[0],
                this.secondCandle) &&
            CandleStickUtils.getUpperShadow(this.secondCandle) <
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.ShadowVeryShort,
                this.shadowVeryShortPeriodTotal[0],
                this.secondCandle) &&
            CandleStickUtils.getLowerShadow(this.secondCandle) <
            CandleStickUtils.getCandleAverage(candleEnums.CandleSettingType.ShadowVeryShort,
                this.shadowVeryShortPeriodTotal[0],
                this.secondCandle);
    }

    private anUpsideGapExistsBetweenCandlesIfFirstIsBlack() {
        return this.firstCandleColor === candleEnums.CandleColor.Black &&
            CandleStickUtils.getCandleGapUp(this.secondCandle, this.firstCandle);
    }

    private aDownsideGapExistsBetweenCandlesIfFirstIsWhite() {
        return this.firstCandleColor === candleEnums.CandleColor.White &&
            CandleStickUtils.getCandleGapDown(this.secondCandle, this.firstCandle);
    }
}

export class CDLKICKINGBYLENGTH extends KickingByLength {

}
