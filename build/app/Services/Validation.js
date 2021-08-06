"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyExistInDb = exports.accountNameExist = void 0;
const Account_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Account"));
const Currency_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Currency"));
async function accountNameExist(name) {
    try {
        return await Account_1.default.findByOrFail('name', name);
    }
    catch (e) {
        return {
            status: 'failed',
            message: `Account name "${name}" was not found`,
        };
    }
}
exports.accountNameExist = accountNameExist;
async function currencyExistInDb(currency) {
    try {
        return await Currency_1.default.findByOrFail('currency', currency);
    }
    catch (e) {
        return {
            status: 'failed',
            message: `${currency.toUpperCase()} not is not supported`,
        };
    }
}
exports.currencyExistInDb = currencyExistInDb;
//# sourceMappingURL=Validation.js.map