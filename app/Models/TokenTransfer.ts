import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'
import Currency from './Currency'
import Account from './Account'

export default class TokenTransfer extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public currency_id: number

  @column()
  public wallet_id: number

  @column()
  public account_id: number

  @column()
  public from_address: string

  @column()
  public to_address: string

  @column()
  public network: string

  @column()
  public currency_code: string

  @column()
  public send_amount: string

  @column()
  public native_fee: null|string

  @column()
  public native_fee_status: null|string

  @column()
  public token_fee: null|string

  @column()
  public send_token_status: null|string

  @column()
  public sent_native_txid: null|string

  @column()
  public sent_token_txid: null|string

  @column()
  public send_native_fee_failed_message: null|string

  @column()
  public send_token_failed_message: null|string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Wallet, { foreignKey: 'wallet_id', localKey: 'id' })
  public wallet: BelongsTo<typeof Wallet>

  @belongsTo(() => Currency, { foreignKey: 'currency_id', localKey: 'id' })
  public currency: BelongsTo<typeof Currency>

  @belongsTo(() => Account, { foreignKey: 'account_id', localKey: 'id' })
  public account: BelongsTo<typeof Account>
}
