"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class AddWithdrawalFeeTypeToAcctounts extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'accounts';
    }
    async up() {
        this.schema.table(this.tableName, (table) => {
            table.string('withdrawal_fee_type').nullable().after('environment').defaultTo('percentage');
            table.double('withdrawal_fee', 3, 2).nullable().after('withdrawal_fee_type').defaultTo(4);
        });
    }
    async down() {
        this.schema.dropTableIfExists(this.tableName);
    }
}
exports.default = AddWithdrawalFeeTypeToAcctounts;
//# sourceMappingURL=1627030759477_add_withdrawal_fee_type_to_acctounts.js.map