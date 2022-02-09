import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddContractAddressToCurrenciesTables extends BaseSchema {
  protected tableName = 'currencies'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('contract_address').nullable().after('derived_from')
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('contract_address')
    })
  }
}
