import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Account from './Account'
import Wallet from './Wallet'

export default class FailedWebhookRequest extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public account_id: number

  @column()
  public wallet_id: number

  @column()
  public endpoint: string

  @column()
  public txid: string

  @column()
  public request_body: any

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Account, { foreignKey: 'account_id' })
  public account: BelongsTo<typeof Account>

  @belongsTo(() => Wallet, { foreignKey: 'wallet_id' })
  public wallet: BelongsTo<typeof Wallet>
}
 