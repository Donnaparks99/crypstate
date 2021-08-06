"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWallet = void 0;
const tatum_1 = require("@tatumio/tatum");
async function createWallet(currency, env) {
    const isTest = env === 'local' ? true : false;
    currency = currency.toUpperCase();
    try {
        return await tatum_1.generateWallet(tatum_1.Currency[currency], isTest);
    }
    catch (err) {
        console.log(err);
    }
}
exports.createWallet = createWallet;
//# sourceMappingURL=GenerateWallet.js.map