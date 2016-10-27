import * as wmaIndicator from "../../../src/indicators/overlapstudies/wma";
import * as chai from "chai";
import * as path from "path";
let jsonfile = require("jsonfile");

chai.should();

describe("WMA Indicator", () => {
    let sourceFile: string;
    let taResultFile: string;
    let sourceData: any;
    let taResultData: any;
    let indicator: wmaIndicator.WMA;
    let indicatorResults: number[];

    beforeEach(() => {
        sourceFile = path.resolve("./test/sourcedata/sourcedata.json");
        taResultFile = path.resolve("./test/talib-results/wma.json");
        sourceData = jsonfile.readFileSync(sourceFile);
        taResultData = jsonfile.readFileSync(taResultFile);
        indicator = new wmaIndicator.WMA(30);
        indicatorResults = new Array<number>(sourceData.close.length - indicator.lookback);
    });

    describe("when receiving tick data", () => {
        beforeEach(() => {
            let idx = 0;
            sourceData.close.forEach((value: number) => {
                if (indicator.receiveData(value)) {
                    indicatorResults[idx] = indicator.currentValue;
                    idx++;
                }
            });
        });

        it("should match the talib results", () => {
            for (let i = 0; i < taResultData.result.outReal.length; i++) {
                isNaN(indicatorResults[i]).should.be.false;
                taResultData.result.outReal[i].should.be.closeTo(indicatorResults[i], 0.001);
            }
        });

        it("should match the talib lookback", () => {
            taResultData.begIndex.should.equal(indicator.lookback);
        });
    });
});