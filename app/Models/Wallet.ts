import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Currency from './Currency'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'
import Address from './Address'
import ManagerDueFee from './ManagerDueFee'

export default class Wallet extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public account_id: number

  @column()
  public currency_id: number

  @column()
  public tat_account_id: string

  @column()
  public account_code: string

  @column()
  public deposited: number

  @column()
  public withdrawn: number

  @column()
  public account_number: string

  @column()
  public customer_id: string

  @column()
  public webhook_id: string

  @column()
  public received: number

  @column()
  public sent: number

  @column({
    prepare: (value?: unknown) =>
      !value
        ? null
        : Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).encrypt(value),
    serializeAs: null,
  })
  public mnemonic: Record<string, string>

  @column({
    // consume: (value?: Buffer) => (!value ? null : Encryption.decrypt(value.toString())),
    prepare: (value?: unknown) =>
      !value
        ? null
        : Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).encrypt(value),
    serializeAs: null,
  })
  public xpub: Record<string, string>

  @column()
  public address: string

  @column({
    prepare: (value?: unknown) =>
      !value
        ? null
        : Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).encrypt(value),
    serializeAs: null,
  })
  public secret: Record<string, string>

  @column({
    prepare: (value?: unknown) =>
      !value
        ? null
        : Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).encrypt(value),
    serializeAs: null,
  })
  public private_key: Record<string, string>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Account, { foreignKey: 'account_id', localKey: 'id' })
  public account: BelongsTo<typeof Account>

  @belongsTo(() => Currency, { foreignKey: 'currency_id', localKey: 'id' })
  public currency: BelongsTo<typeof Currency>

  @hasMany(() => Address, { foreignKey: 'wallet_id', localKey: 'id' })
  public addresses: HasMany<typeof Address>

  @hasMany(() => ManagerDueFee, { foreignKey: 'wallet_id', localKey: 'id' })
  public due_fee: HasMany<typeof ManagerDueFee>
}
