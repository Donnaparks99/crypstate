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
const Wallet_1 = __importDefault(require("./Wallet"));
class Currency extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Currency.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "public_name", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "name", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Object)
], Currency.prototype, "logo", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "currency", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "tatum_currency", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "tx_model", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "type", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "token", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Currency.prototype, "derived_from", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Currency.prototype, "has_mnemonic", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Currency.prototype, "has_xpub", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Currency.prototype, "has_address_xpub", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Currency.prototype, "has_private_key", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Currency.prototype, "has_secret", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Currency.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Currency.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.hasMany(() => Wallet_1.default, {}),
    __metadata("design:type", Object)
], Currency.prototype, "wallets", void 0);
exports.default = Currency;
//# sourceMappingURL=Currency.js.map