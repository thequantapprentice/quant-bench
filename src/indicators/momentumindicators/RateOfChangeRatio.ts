import * as indicators from "../";

export class RateOfChangeRatio
    extends indicators.AbstractIndicator<number> {

    static INDICATOR_NAME: string = "ROCR";
    static INDICATOR_DESCR: string = "Rate of change ratio: (price/prevPrice)";
    static TIMEPERIOD_DEFAULT: number = 10;
    static TIMEPERIOD_MIN: number = 1;

    public timePeriod: number;
    private periodHistory: indicators.Queue<number>;
    private periodCounter: number;
    private previousPrice: number;

    constructor(timePeriod: number = RateOfChangeRatio.TIMEPERIOD_DEFAULT) {
        super(RateOfChangeRatio.INDICATOR_NAME, RateOfChangeRatio.INDICATOR_DESCR);

        if (timePeriod < RateOfChangeRatio.TIMEPERIOD_MIN) {
            throw (new Error(indicators.generateMinTimePeriodError(this.name, RateOfChangeRatio.TIMEPERIOD_MIN, timePeriod)));
        }

        this.previousPrice = 0;
        this.timePeriod = timePeriod;
        this.periodCounter = timePeriod * -1;
        this.periodHistory = new indicators.Queue<number>();
        this.setLookBack(this.timePeriod);
    }

    receiveData(inputData: number): boolean {
        this.periodCounter += 1;
        this.periodHistory.enqueue(inputData);

        if (this.periodCounter > 0) {
            // RocR = price/previousPrice
            this.previousPrice = this.periodHistory.peek();

            if (this.previousPrice !== 0) {
                this.setCurrentValue(inputData / this.previousPrice);
            } else {
                this.setCurrentValue(0);
            }
        }

        if (this.periodHistory.count > this.timePeriod) {
            this.periodHistory.dequeue();
        }

        return this.isReady;
    }
}

export class ROCR extends RateOfChangeRatio {

}
