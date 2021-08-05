import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public wallet_id: number

  @column()
  public address: string

  @column()
  public derivation_key: number

  @column()
  public destination_tag: string

  @column()
  public memo: string

  @column()
  public message: string

  @column()
  public key: string

  @column({
    prepare: (value?: unknown) =>
      !value
        ? null
        : Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).encrypt(value),
    serializeAs: null,
  })
  public xpub: Record<string, string>

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Wallet, { foreignKey: 'wallet_id' })
  public wallets: BelongsTo<typeof Wallet>
}
