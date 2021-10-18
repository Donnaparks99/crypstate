"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Schema_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Lucid/Schema"));
class Accounts extends Schema_1.default {
    constructor() {
        super(...arguments);
        this.tableName = 'accounts';
    }
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.increments('id');
            table.string('display_name');
            table.string('name').unique();
            table.string('url').unique();
            table.string('webhook_endpoint');
            table.boolean('restricted').defaultTo(0);
            table.string('environment').defaultTo('production');
            table.timestamps(true);
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
exports.default = Accounts;
//# sourceMappingURL=1624056088357_accounts.js.map