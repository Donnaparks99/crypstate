import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, HasMany } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'

export default class Currency extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public public_name: string

  @column()
  public name: string

  @column()
  public logo: string | null

  @column()
  public currency: string

  @column()
  public tatum_currency: string

  @column()
  public tx_model: string

  @column()
  public type: string

  @column()
  public token: string

  @column()
  public derived_from: string

  @column()
  public has_mnemonic: boolean

  @column()
  public has_xpub: boolean

  @column()
  public has_address_xpub: boolean

  @column()
  public has_private_key: boolean

  @column()
  public has_secret: boolean

  @column()
  public contract_address: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Wallet, {foreignKey: 'currency_id' })
  public wallets: HasMany<typeof Wallet >
}
