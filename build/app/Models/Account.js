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
class Account extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Account.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Account.prototype, "display_name", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Account.prototype, "name", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Account.prototype, "url", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Account.prototype, "webhook_endpoint", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Boolean)
], Account.prototype, "resticted", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Account.prototype, "environment", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Object)
], Account.prototype, "withdrawal_fee_type", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Object)
], Account.prototype, "withdrawal_fee", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Account.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Account.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.hasMany(() => Wallet_1.default, { foreignKey: 'account_id' }),
    __metadata("design:type", Object)
], Account.prototype, "wallets", void 0);
exports.default = Account;
//# sourceMappingURL=Account.js.map