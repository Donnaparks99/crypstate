"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Validator_1 = global[Symbol.for('ioc.use')]("Adonis/Core/Validator");
const Account_1 = __importDefault(global[Symbol.for('ioc.use')]("App/Models/Account"));
class AccountsController {
    async create({ request, response }) {
        var requestData = Validator_1.schema.create({
            display_name: Validator_1.schema.string(),
            name: Validator_1.schema.string(),
            url: Validator_1.schema.string(),
            webhook_endpoint: Validator_1.schema.string(),
            environment: Validator_1.schema.string.optional(),
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
        const account = await Account_1.default.create({
            display_name: request.all().display_name,
            name: request.all().name,
            url: request.all().url,
            webhook_endpoint: request.all().webhook_endpoint,
            environment: request.all().environment,
            withdrawal_fee_type: request.all().withdrawal_fee_type,
            withdrawal_fee: request.all().withdrawal_fee,
        });
        if (account) {
            return response.status(200).json({
                status: 'success',
                data: account,
            });
        }
    }
}
exports.default = AccountsController;
//# sourceMappingURL=AccountsController.js.map