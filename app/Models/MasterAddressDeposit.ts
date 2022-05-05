import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'
import Account from './Account'
import Currency from './Currency'

export default class MasterAddressDeposit extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public account_id: number

  @column()
  public wallet_id: number

  @column()
  public currency_id: number

  @column()
  public currency_code: string

  @column()
  public token: string

  @column()
  public from_address: string

  @column()
  public to_address: string

  @column()
  public amount: string

  @column()
  public destination_tag: string

  @column()
  public status: string

  @column()
  public deposit_txid: string

  @column()
  public withdrawal_txid: null|string

  @column()
  public misc: null|string

  @column()
  public fee_deposit_txid: null|string

  @column()
  public fee_deposit_status: null|string

  @column()
  public fee_deposit_amount: null|string

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
