"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Validation_1 = global[Symbol.for('ioc.use')]("App/Services/Validation");
const Wallet_1 = global[Symbol.for('ioc.use')]("App/Services/Wallet");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const tatum_1 = require("@tatumio/tatum");
class TransactionsController {
    async create({ request, response }) {
        var requestData = Validator_1.schema.create({
            account_name: Validator_1.schema.string(),
            currency: Validator_1.schema.string(),
            amount: Validator_1.schema.number(),
            toAddress: Validator_1.schema.string(),
        });
        try {
            await request.validate({ schema: requestData });
        }
        catch (error) {
            return response.status(422).json({
                status: 'failed',
                message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
            });
        }
        const account = await Validation_1.accountNameExist(request.all().account_name);
        const managerAccount = await Validation_1.accountNameExist(Env_1.default.get('MANAGER_ACCOUNT_NAME'));
        if (account['status'] === 'failed') {
            return response.status(422).json(account);
        }
        const currency = await Validation_1.currencyExistInDb(request.all().currency);
        if (currency['status'] === 'failed') {
            return response.status(422).json(currency);
        }
        let wallet = await account.related('wallets').query().where('currency_id', currency.id).first();
        let managerWallet = await managerAccount
            .related('wallets')
            .query()
            .where('currency_id', currency.id)
            .first();
        if (wallet?.currency_id !== currency.id) {
            return response.status(422).json({
                status: 'failed',
                message: `Wallet does not exists.`,
            });
        }
        let fee = await Wallet_1.getFee(currency, wallet, request.all().toAddress, request.all().amount);
        try {
            let send = await Wallet_1.sendCrypto(wallet, managerWallet, request.all().toAddress, request.all().amount, fee, request.all().memoTag, request.all().cutPercentage ?? 0);
            return response.status(200).json({
                status: 'success',
                data: send,
            });
        }
        catch (err) {
            console.log(err);
            return response.status(401).json({
                status: 'error',
                data: err?.message,
            });
        }
    }
    async internalTransfer({ request, response }) {
        var requestData = Validator_1.schema.create({
            from_account_name: Validator_1.schema.string(),
            to_account_name: Validator_1.schema.string(),
            currency: Validator_1.schema.string(),
            amount: Validator_1.schema.string(),
        });
        try {
            await request.validate({ schema: requestData });
        }
        catch (error) {
            return response.status(422).json({
                status: 'failed',
                message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
            });
        }
        const fromAccount = await Validation_1.accountNameExist(request.all().from_account_name);
        const toAccount = await Validation_1.accountNameExist(request.all().to_account_name);
        const fromWallet = await fromAccount.related('wallets').query().first();
        const toWallet = await toAccount.related('wallets').query().first();
        const a2at = await Wallet_1.accountToAccountTransaction(fromWallet.tat_account_id, toWallet.tat_account_id, request.all().amount, 'Transfer');
        return response.status(200).json({
            status: 'success',
            data: a2at,
        });
    }
    async getTransactionWithReference({ request, response }) {
        var requestData = Validator_1.schema.create({
            referenceId: Validator_1.schema.string(),
        });
        try {
            await request.validate({ schema: requestData });
        }
        catch (error) {
            return response.status(422).json({
                status: 'failed',
                message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
            });
        }
        try {
            let transaction = await tatum_1.getTransactionsByReference(request.all().referenceId);
            return response.status(200).json({
                status: 'success',
                data: transaction,
            });
        }
        catch (err) {
            return response.status(401).json({
                status: 'failed',
                data: 'Unable to get transaction.',
            });
        }
    }
}
exports.default = TransactionsController;
//# sourceMappingURL=TransactionsController.js.map