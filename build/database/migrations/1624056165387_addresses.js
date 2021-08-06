"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Addresses extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'addresses';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.integer('wallet_id').unsigned().notNullable().references('wallets.id');
            table.string('address');
            table.integer('derivation_key').nullable();
            table.string('destination_tag').nullable();
            table.string('memo').nullable();
            table.string('message').nullable();
            table.text('key').nullable();
            table.text('xpub').nullable();
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Addresses;
//# sourceMappingURL=1624056165387_addresses.js.map