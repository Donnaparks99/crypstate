"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Route_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Route"));
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const GenerateWallet_1 = global[Symbol.for('ioc.use')]("App/Services/GenerateWallet");
const Validation_1 = global[Symbol.for('ioc.use')]("App/Services/Validation");
const tatum_1 = require("@tatumio/tatum");
const Country_1 = require("@tatumio/tatum/dist/src/model/request/Country");
const SubscriptionType_1 = require("@tatumio/tatum/dist/src/model/response/ledger/SubscriptionType");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
class WalletsController {
    async create({ request, response }) {
        var requestData = Validator_1.schema.create({
            account_name: Validator_1.schema.string(),
            currency: Validator_1.schema.string(),
            webhook_url: Validator_1.schema.string.optional({}, [Validator_1.rules.url()]),
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
        if (account['status'] === 'failed') {
            return response.status(422).json(account);
        }
        const currency = await Validation_1.currencyExistInDb(request.all().currency);
        if (currency['status'] === 'failed') {
            return response.status(422).json(currency);
        }
        let wallet = await account.related('wallets').query().where('currency_id', currency.id).first();
        if (wallet?.currency_id === currency.id) {
            return response.status(422).json({
                status: 'failed',
                message: `Wallet already exists.`,
            });
        }
        const newWallet = await GenerateWallet_1.createWallet(currency.tatum_currency, account.environment);
        try {
            const newAccount = await tatum_1.createAccount({
                currency: currency.tatum_currency.toUpperCase(),
                xpub: newWallet.xpub ?? newWallet.address,
                compliant: true,
                accountingCurrency: tatum_1.Fiat.USD,
                accountCode: `${request.all().account_name.toUpperCase()}-${request
                    .all()
                    .currency.toUpperCase()}`,
                accountNumber: Math.random().toString(36).substring(2),
                customer: {
                    customerCountry: Country_1.Country.US,
                    accountingCurrency: tatum_1.Fiat.USD,
                    providerCountry: Country_1.Country.US,
                    externalId: Math.random().toString(36).substring(2),
                },
            });
            if (request.all().webhook_url?.length > 1) {
                var webhookUrl = request.all().webhook_url;
            }
            else {
                var webhookUrl = Env_1.default.get('APP_URL') + Route_1.default.makeUrl('tatumWebhook');
            }
            const subscription = await tatum_1.createNewSubscription({
                type: SubscriptionType_1.SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
                attr: {
                    id: newAccount.id,
                    url: webhookUrl,
                },
            });
            let newAcc = await account.related('wallets').create({
                currency_id: currency.id,
                tat_account_id: newAccount.id,
                account_code: newAccount.accountCode,
                account_number: newAccount.accountNumber,
                customer_id: newAccount.customerId,
                webhook_id: subscription.id,
                mnemonic: newWallet.mnemonic ?? null,
                xpub: newWallet.xpub ?? null,
                address: newWallet.address ?? null,
                secret: newWallet.secret ?? null,
                private_key: newWallet.privateKey ?? null,
            });
            const newAddress = await tatum_1.generateDepositAddress(newAccount.id);
            await newAcc.related('addresses').create({
                address: newAddress.address,
                derivation_key: newAddress.derivationKey,
                xpub: newAddress.xpub,
                destination_tag: newAddress.destinationTag,
                message: newAddress.message,
                memo: newAddress.memo,
                key: newAddress.key,
            });
            return response.status(200).json({
                status: 'success',
                data: {
                    wallet_name: newAcc.account_code,
                    address: newAddress.address,
                    derivation_key: newAddress.derivationKey,
                    destination_tag: newAddress.destinationTag,
                    message: newAddress.message,
                    memo: newAddress.memo,
                },
            });
        }
        catch (err) {
            console.log(err);
        }
    }
    async getWalletBalance({ request, response }) {
        var requestData = Validator_1.schema.create({
            account_name: Validator_1.schema.string(),
            currency: Validator_1.schema.string(),
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
        if (account['status'] === 'failed') {
            return response.status(422).json(account);
        }
        const currency = await Validation_1.currencyExistInDb(request.all().currency);
        if (currency['status'] === 'failed') {
            return response.status(422).json(currency);
        }
        let wallet = await account.related('wallets').query().where('currency_id', currency.id).first();
        if (!wallet) {
            return response.status(422).json({
                status: 'failed',
                message: `Wallet not found.`,
            });
        }
        let tatAccount = await tatum_1.getAccountById(wallet.tat_account_id);
        delete tatAccount.id;
        delete tatAccount.xpub;
        delete tatAccount.customerId;
        return response.status(200).json({
            status: 'success',
            data: tatAccount,
        });
    }
    async getWalletTransactions({ request, response }) {
        var requestData = Validator_1.schema.create({
            account_name: Validator_1.schema.string(),
            currency: Validator_1.schema.string(),
            pageSize: Validator_1.schema.number(),
            offset: Validator_1.schema.number(),
            sieveout: Validator_1.schema.string.optional(),
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
        if (account['status'] === 'failed') {
            return response.status(422).json(account);
        }
        const currency = await Validation_1.currencyExistInDb(request.all().currency);
        if (currency['status'] === 'failed') {
            return response.status(422).json(currency);
        }
        let wallet = await account.related('wallets').query().where('currency_id', currency.id).first();
        if (!wallet) {
            return response.status(422).json({
                status: 'failed',
                message: `Wallet not found.`,
            });
        }
        let transactions = await tatum_1.getTransactionsByAccount({
            id: wallet.tat_account_id,
        }, request.all().pageSize, request.all().offset);
        if (request.all().sieveout && request.all().sieveout !== 'none') {
            const sieveAccount = await Validation_1.accountNameExist(request.all().sieveout);
            if (sieveAccount) {
                let sieveWallet = await sieveAccount
                    .related('wallets')
                    .query()
                    .where('currency_id', currency.id)
                    .first();
                transactions = transactions.filter((tx) => tx.counterAccountId !== sieveWallet.tat_account_id);
            }
        }
        return response.status(200).json({
            status: 'success',
            data: transactions,
        });
    }
}
exports.default = WalletsController;
//# sourceMappingURL=WalletsController.js.map