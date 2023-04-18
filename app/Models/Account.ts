import { DateTime } from 'luxon'
import { BaseModel, column, HasMany, hasMany } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'

export default class Account extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public display_name: string

  @column()
  public name: string

  @column()
  public url: string

  @column()
  public webhook_endpoint: string

  @column()
  public restricted: boolean

  @column()
  public environment: string

  @column()
  public withdrawal_fee_type: any

  @column()
  public withdrawal_fee: any

  @column()
  public category?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @hasMany(() => Wallet, { foreignKey: 'account_id' })
  public wallets: HasMany<typeof Wallet>
}
