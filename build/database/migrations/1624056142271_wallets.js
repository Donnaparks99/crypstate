"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Wallets extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'wallets';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('account_id').unsigned().notNullable().references('accounts.id');
            table.integer('currency_id').unsigned().notNullable().references('currencies.id');
            table.string('tat_account_id').notNullable();
            table.string('account_code').notNullable();
            table.string('account_number').notNullable();
            table.string('customer_id').notNullable();
            table.integer('received').defaultTo(0);
            table.integer('sent').defaultTo(0);
            table.text('mnemonic').nullable();
            table.text('xpub').nullable();
            table.text('address').nullable();
            table.text('secret').nullable();
            table.text('private_key').nullable();
            table.text('webhook_id').nullable();
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Wallets;
//# sourceMappingURL=1624056142271_wallets.js.map