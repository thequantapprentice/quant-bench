import * as indicators from "../";
import { Queue } from "../queue";

export class WMA
    extends indicators.AbstractIndicator<number> {

    static INDICATOR_NAME: string = "WMA";
    static INDICATOR_DESCR: string = "Weighted Moving Average";
    static TIMEPERIOD_DEFAULT: number = 30;
    static TIMEPERIOD_MIN: number = 2;

    public timePeriod: number;

    private periodHistory: Queue<number>;
    private periodCounter: number;
    private periodWeightTotal: number;

    constructor(timePeriod: number = WMA.TIMEPERIOD_DEFAULT) {
        super(WMA.INDICATOR_NAME, WMA.INDICATOR_DESCR);

        if (timePeriod < WMA.TIMEPERIOD_MIN) {
            throw (new Error(indicators.generateMinTimePeriodError(this.name, WMA.TIMEPERIOD_MIN, timePeriod)));
        }

        this.timePeriod = timePeriod;
        this.periodCounter = timePeriod * -1;
        this.periodHistory = new Queue<number>();

        let weightedTotal = 0;
        for (let i = 1; i <= timePeriod; i++) {
            weightedTotal += i;
        }
        this.periodWeightTotal = weightedTotal;
        this.setLookBack(this.timePeriod - 1);
    }

    receiveData(inputData: number): boolean {

        this.periodCounter += 1;
        this.periodHistory.enqueue(inputData);

        if (this.periodHistory.count > this.timePeriod) {
            this.periodHistory.dequeue();
        }

        if (this.periodCounter >= 0) {
            // calculate the ind
            let iter: number = 1;
            let sum = 0;

            this.periodHistory.toArray().forEach((item) => {
                let localSum = 0;
                for (let i = 1; i <= iter; i++) {
                    localSum += item;
                }
                sum += localSum;
                iter++;
            });

            this.setCurrentValue(sum / this.periodWeightTotal);
        }

        return this.isReady;
    }
}
