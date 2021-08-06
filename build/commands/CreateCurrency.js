"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const standalone_1 = require("@adonisjs/core/build/standalone");
class CreateCurrency extends standalone_1.BaseCommand {
    async run() {
        const { default: Currency } = await Promise.resolve().then(() => __importStar(global[Symbol.for('ioc.use')]('App/Models/Currency')));
        let currencies = [
            {
                public_name: 'Bitcoin',
                name: 'bitcoin',
                logo: null,
                currency: 'btc',
                tatum_currency: 'btc',
                tx_model: 'utxo',
                type: 'native',
                token: 'btc',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'Bitcoin Cash',
                name: 'bcash',
                logo: null,
                currency: 'bch',
                tatum_currency: 'bch',
                tx_model: 'utxo',
                type: 'native',
                token: 'bch',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'Litecoin',
                name: 'litecoin',
                logo: null,
                currency: 'ltc',
                tatum_currency: 'ltc',
                tx_model: 'utxo',
                type: 'native',
                token: 'ltc',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'Ethereum',
                name: 'ethereum',
                logo: null,
                currency: 'eth',
                tatum_currency: 'eth',
                tx_model: 'account',
                type: 'native',
                token: 'eth',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'USDT',
                name: 'usdt',
                logo: null,
                currency: 'usdt',
                tatum_currency: 'usdt',
                tx_model: 'account',
                type: 'token',
                token: 'erc20',
                derived_from: 'ethereum',
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'Stellar',
                name: 'xlm',
                logo: null,
                currency: 'xlm',
                tatum_currency: 'xlm',
                tx_model: 'account',
                type: 'native',
                token: 'xlm',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 0,
                has_address_xpub: 1,
                has_private_key: 0,
                has_secret: 1,
            },
            {
                public_name: 'Ripple',
                name: 'xrp',
                logo: null,
                currency: 'xrp',
                tatum_currency: 'xrp',
                tx_model: 'account',
                type: 'native',
                token: 'xrp',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 0,
                has_address_xpub: 1,
                has_private_key: 0,
                has_secret: 1,
            },
            {
                public_name: 'Binance Coin',
                name: 'bnb',
                logo: null,
                currency: 'bnb',
                tatum_currency: 'bnb',
                tx_model: 'account',
                type: 'native',
                token: 'bsc',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 0,
                has_address_xpub: 1,
                has_private_key: 0,
                has_secret: 0,
            },
            {
                public_name: 'Tron',
                name: 'tron',
                logo: null,
                currency: 'trx',
                tatum_currency: 'tron',
                tx_model: 'utxo',
                type: 'native',
                token: 'trx',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
            {
                public_name: 'Doge',
                name: 'dogecoin',
                logo: null,
                currency: 'doge',
                tatum_currency: 'doge',
                tx_model: 'utxo',
                type: 'native',
                token: 'doge',
                derived_from: null,
                has_mnemonic: 1,
                has_xpub: 1,
                has_address_xpub: 0,
                has_private_key: 1,
                has_secret: 0,
            },
        ];
        currencies.map(async (currency) => {
            let currencyExists = await Currency.findBy('currency', currency.currency);
            if (currencyExists === null) {
                Currency.create(currency);
                this.logger.info(`${currency.currency} created.`);
            }
        });
    }
}
exports.default = CreateCurrency;
CreateCurrency.commandName = 'create:currency';
CreateCurrency.description = 'Create currencies available in the array.';
CreateCurrency.settings = {
    loadApp: true,
    stayAlive: true,
};
//# sourceMappingURL=CreateCurrency.js.map