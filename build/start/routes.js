"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const inspirational_quotes_1 = __importDefault(require("inspirational-quotes"));
Route_1.default.get('/', async () => {
    return inspirational_quotes_1.default.getQuote();
});
Route_1.default.post('/tatum/webhook', 'WebhooksController.index').as('tatumWebhook');
Route_1.default.post('/create/account', 'AccountsController.create');
Route_1.default.post('/create/wallet', 'WalletsController.create');
Route_1.default.post('get/wallet/balance', 'WalletsController.getWalletBalance');
Route_1.default.post('get/wallet/transactions', 'WalletsController.getWalletTransactions');
Route_1.default.post('/create/address', 'AddressesController.create');
Route_1.default.post('/internal/transfer', 'TransactionsController.internalTransfer');
Route_1.default.post('/create/withdrawal/transaction', 'TransactionsController.create');
Route_1.default.post('/get/transaction/reference', 'TransactionsController.getTransactionWithReference');
//# sourceMappingURL=routes.js.map