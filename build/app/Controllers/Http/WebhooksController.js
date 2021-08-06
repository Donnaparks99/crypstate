"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Wallet_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Wallet"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Wallet_2 = global[Symbol.for('ioc.use')]("App/Services/Wallet");
class WebhooksController {
    async index({ request }) {
        const wallet = await Wallet_1.default.findBy('tat_account_id', request.all().accountId);
        if (wallet) {
            const account = await wallet.related('account').query().first();
            const currency = await wallet?.related('currency').query().first();
            const address = await wallet.related('addresses').query().first();
            let fetchTransactions = await node_fetch_1.default(`${Env_1.default.get('APP_URL')}/get/wallet/transactions`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    account_name: account.name,
                    currency: currency.currency,
                    pageSize: '50',
                    offset: 0,
                }),
            });
            let transactions = await fetchTransactions.json();
            let transaction = transactions?.data?.filter((transactions) => transactions.txId === request.all().txId)[0];
            switch (currency.token) {
                case 'eth':
                case 'erc20':
                case 'bsc':
                case 'bnb':
                    let fee = await Wallet_2.getFee(currency, wallet, address?.address, transaction.amount);
                    await Wallet_2.internalAccountToAccountTransfer(currency, wallet, transaction.address, address?.address, transaction.amount, fee);
            }
            delete transaction.accountId;
            delete transaction.anonymous;
            delete transaction.marketValue;
            node_fetch_1.default(`${account.url}${account.webhook_endpoint}`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(transaction),
            });
            console.log('object');
        }
    }
}
exports.default = WebhooksController;
//# sourceMappingURL=WebhooksController.js.map