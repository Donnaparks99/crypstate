import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class UpdateMasterAddressDepositsTables extends BaseSchema {
  protected tableName = 'master_address_deposits'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('fee_deposit_txid').nullable()
      table.string('fee_deposit_status').nullable()
      table.text('fee_deposit_amount').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('fee_deposit_txid')
      table.dropColumn('fee_deposit_status')
      table.dropColumn('fee_deposit_amount')
    })
  }
}
