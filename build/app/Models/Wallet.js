"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
const Orm_1 = global[Symbol.for('ioc.use')]("Adonis/Lucid/Orm");
const Account_1 = __importDefault(require("./Account"));
const Currency_1 = __importDefault(require("./Currency"));
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
const Address_1 = __importDefault(require("./Address"));
class Wallet extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Wallet.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Wallet.prototype, "account_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Wallet.prototype, "currency_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "tat_account_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "account_code", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "account_number", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "customer_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "webhook_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Wallet.prototype, "received", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Wallet.prototype, "sent", void 0);
__decorate([
    Orm_1.column({
        prepare: (value) => !value
            ? null
            : Encryption_1.default.child({
                secret: Env_1.default.get(`CRYPTO_KEY`),
            }).encrypt(value),
        serializeAs: null,
    }),
    __metadata("design:type", Object)
], Wallet.prototype, "mnemonic", void 0);
__decorate([
    Orm_1.column({
        prepare: (value) => !value
            ? null
            : Encryption_1.default.child({
                secret: Env_1.default.get(`CRYPTO_KEY`),
            }).encrypt(value),
        serializeAs: null,
    }),
    __metadata("design:type", Object)
], Wallet.prototype, "xpub", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Wallet.prototype, "address", void 0);
__decorate([
    Orm_1.column({
        prepare: (value) => !value
            ? null
            : Encryption_1.default.child({
                secret: Env_1.default.get(`CRYPTO_KEY`),
            }).encrypt(value),
        serializeAs: null,
    }),
    __metadata("design:type", Object)
], Wallet.prototype, "secret", void 0);
__decorate([
    Orm_1.column({
        prepare: (value) => !value
            ? null
            : Encryption_1.default.child({
                secret: Env_1.default.get(`CRYPTO_KEY`),
            }).encrypt(value),
        serializeAs: null,
    }),
    __metadata("design:type", Object)
], Wallet.prototype, "private_key", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Wallet.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Wallet.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.belongsTo(() => Account_1.default, { foreignKey: 'account_id' }),
    __metadata("design:type", Object)
], Wallet.prototype, "account", void 0);
__decorate([
    Orm_1.belongsTo(() => Currency_1.default, { foreignKey: 'currency_id' }),
    __metadata("design:type", Object)
], Wallet.prototype, "currency", void 0);
__decorate([
    Orm_1.hasMany(() => Address_1.default, { foreignKey: 'wallet_id' }),
    __metadata("design:type", Object)
], Wallet.prototype, "addresses", void 0);
exports.default = Wallet;
//# sourceMappingURL=Wallet.js.map