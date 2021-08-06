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
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
class Address extends Orm_1.BaseModel {
}
__decorate([
    Orm_1.column({ isPrimary: true }),
    __metadata("design:type", Number)
], Address.prototype, "id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Address.prototype, "wallet_id", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Address.prototype, "address", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", Number)
], Address.prototype, "derivation_key", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Address.prototype, "destination_tag", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Address.prototype, "memo", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Address.prototype, "message", void 0);
__decorate([
    Orm_1.column(),
    __metadata("design:type", String)
], Address.prototype, "key", void 0);
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
], Address.prototype, "xpub", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Address.prototype, "createdAt", void 0);
__decorate([
    Orm_1.column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", luxon_1.DateTime)
], Address.prototype, "updatedAt", void 0);
__decorate([
    Orm_1.belongsTo(() => Wallet_1.default, { foreignKey: 'wallet_id' }),
    __metadata("design:type", Object)
], Address.prototype, "wallets", void 0);
exports.default = Address;
//# sourceMappingURL=Address.js.map