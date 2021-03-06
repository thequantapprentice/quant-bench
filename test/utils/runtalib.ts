let yaml = require("yamljs");
let talib = require("talib");
import * as Promise from "bluebird";
import * as fs from "fs";

// Load market data
let marketContents = fs.readFileSync("./test/sourcedata/sourcedata.json", "utf8");
let marketData = JSON.parse(marketContents);

let config = yaml.load("./test/genconfig.yml");
let indicators: any[] = [];
console.log("TALib Version: " + talib.version);

config.forEach((item: any) => {
    let parameters: any = {
        "endIdx": marketData.close.length - 1,
        "inReal": marketData.close,
        "startIdx": 0,
        "name": item.name,
    };

    item.data_inputs.forEach((dataInput: string) => {
        if (item.name === "ACOS" || item.name === "ASIN") {
            let value = Math.cos(marketData.close);
            parameters.inReal = value;
        } else {
            if (dataInput === "inReal") {
                parameters.inReal = marketData.close;
            }
            if (dataInput === "inReal0") {
                parameters.inReal0 = marketData.high;
            }
            if (dataInput === "inReal1") {
                parameters.inReal1 = marketData.low;
            }
            if (dataInput === "high") {
                parameters.high = marketData.high;
            }

            if (dataInput === "low") {
                parameters.low = marketData.low;
            }

            if (dataInput === "close") {
                parameters.close = marketData.close;
            }

            if (dataInput === "open") {
                parameters.open = marketData.open;
            }

            if (dataInput === "volume") {
                parameters.volume = marketData.volume;
            }
        }
    });

    if (item.inputs) {
        Object.keys(item.inputs).forEach((key: any) => {
            parameters[key] = item.inputs[key];
        });
    } else {
        console.log(item.name);
    }

    indicators.push(parameters);
});

Promise.each(indicators, (indicator) => {
    return new Promise((resolve, reject) => {
        // execute the indicator function
        try {
            talib.execute(indicator, (result: any) => {

                // write the results to a file
                let resultString = JSON.stringify(result);

                fs.writeFile("./test/talib-results/" + indicator.name.toLowerCase() + ".json", resultString, (err) => {
                    if (err) {
                        console.log(err);
                    }
                    console.log("Done... " + indicator.name);
                    resolve();
                });
            });
        } catch (error) {
            console.log("EXCEPTION");
            console.log(error);
        }
    });
}).then(() => {
    process.exit(0);
});
