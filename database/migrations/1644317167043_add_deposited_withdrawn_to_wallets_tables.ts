import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddDepositedWithdrawnToWalletsTables extends BaseSchema {
  protected tableName = 'wallets'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.double('deposited').defaultTo(0).after('account_code')
      table.double('withdrawn').defaultTo(0).after('deposited')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('deposited')
      table.dropColumn('withdrawn')
    })
  }
}
