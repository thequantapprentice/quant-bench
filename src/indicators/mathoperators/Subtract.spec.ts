
import * as path from "path";
import * as indicators from "../";
import { TestDataFactory } from "../../../testdata/testData";
const jsonfile = require("jsonfile");

describe("Subtract", () => {
    let taResultFile: string;
    let sourceData: any;
    let taResultData: any;
    let indicator: indicators.Subtract;
    let indicatorResults: number[];
    let indicatorOnDataRasied: boolean = false;

    beforeEach(() => {
        taResultFile = path.resolve("./testdata/talib-results/sub.json");
        sourceData = TestDataFactory.getInstance().sourceData;
        taResultData = jsonfile.readFileSync(taResultFile);
        indicatorResults = new Array<number>(sourceData.close.length - taResultData.begIndex);
    });

    describe("when constructing", () => {
        beforeEach(() => {
            indicator = new indicators.Subtract();
        });

        it("should set the indicator name", () => {
            expect(indicator.name).toBe(indicators.Subtract.INDICATOR_NAME);
        });

        it("should set the indicator description", () => {
            expect(indicator.description).toBe(indicators.Subtract.INDICATOR_DESCR);
        });

        it("should match the talib lookback", () => {
            expect(taResultData.begIndex).toBe(indicator.lookback);
        });
    });

    describe("when receiving all tick data", () => {
        beforeEach(() => {
            indicator = new indicators.Subtract();
            let idx = 0;
            sourceData.close.forEach((value: number, index: number) => {
                if (indicator.receiveData(
                    sourceData.high[index],
                    sourceData.low[index])) {
                    indicatorResults[idx] = indicator.currentValue;
                    idx++;
                }
            });
        });

        it("should match the talib results", () => {
            for (let i = 0; i < taResultData.result.outReal.length; i++) {
                expect(isNaN(indicatorResults[i])).toBe(false);
                expect(taResultData.result.outReal[i]).toBeCloseTo(indicatorResults[i], 0.001);
            }
        });

        it("should match the talib lookback", () => {
            expect(taResultData.begIndex).toBe(indicator.lookback);
        });
    });

    describe("when receiving less tick data than the lookback period", () => {
        beforeEach(() => {
            indicator = new indicators.Subtract();
            let idx = 0;
            indicatorOnDataRasied = false;
            indicator.on("data", () => {
                indicatorOnDataRasied = true;
            });

            for (let index = 0; index < indicator.lookback; index++) {
                if (indicator.receiveData(
                    sourceData.high[index],
                    sourceData.low[index])) {
                    indicatorResults[idx] = indicator.currentValue;
                    idx++;
                }
            }
        });

        it("the indicator should not indicate that it is ready to be consumed", () => {
            expect(indicator.isReady).toBe(false);
        });

        it("should not have raised the ondata event", () => {
            expect(indicatorOnDataRasied).toBe(false);
        });
    });

    describe("when receiving tick data equal to the lookback period", () => {
        beforeEach(() => {
            indicator = new indicators.Subtract();
            let idx = 0;
            indicatorOnDataRasied = false;
            indicator.on("data", () => {
                indicatorOnDataRasied = true;
            });

            for (let index = 0; index <= indicator.lookback; index++) {
                if (indicator.receiveData(
                    sourceData.high[index],
                    sourceData.low[index])) {
                    indicatorResults[idx] = indicator.currentValue;
                    idx++;
                }
            }
        });

        it("the indicator should indicate that it is ready to be consumed", () => {
            expect(indicator.isReady).toBe(true);
        });

        it("should have raised the ondata event", () => {
            expect(indicatorOnDataRasied).toBe(true);
        });
    });
});
