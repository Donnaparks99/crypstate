import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column } from '@ioc:Adonis/Lucid/Orm'
import Wallet from './Wallet'

export default class ManagerDueFee extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public wallet_id: number

  @column()
  public amount: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Wallet, { foreignKey: 'wallet_id' })
  public wallet: BelongsTo<typeof Wallet>
}
