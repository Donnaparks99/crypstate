"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Validation_1 = global[Symbol.for('ioc.use')]("App/Services/Validation");
const tatum_1 = require("@tatumio/tatum");
class AddressesController {
    async create({ request, response }) {
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
                message: 'Wallet does not exist.',
            });
        }
        const newAddress = await tatum_1.generateDepositAddress(wallet.tat_account_id);
        const newAdd = await wallet.related('addresses').create({
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
            data: newAdd,
        });
    }
}
exports.default = AddressesController;
//# sourceMappingURL=AddressesController.js.map