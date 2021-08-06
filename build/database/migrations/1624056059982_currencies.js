"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Currencies extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'currencies';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('public_name');
            table.string('name');
            table.string('logo').nullable();
            table.string('currency');
            table.string('tatum_currency');
            table.string('tx_model');
            table.string('type');
            table.string('token').nullable();
            table.string('derived_from').nullable();
            table.boolean('has_mnemonic');
            table.boolean('has_xpub');
            table.boolean('has_address_xpub');
            table.boolean('has_private_key');
            table.boolean('has_secret');
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Currencies;
//# sourceMappingURL=1624056059982_currencies.js.map