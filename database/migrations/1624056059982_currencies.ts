import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Currencies extends BaseSchema {
  protected tableName = 'currencies'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('public_name')
      table.string('name')
      table.string('logo').nullable()
      table.string('currency')
      table.string('tatum_currency')
      table.string('tx_model')
      table.string('type')
      table.string('token').nullable()
      table.string('derived_from').nullable()
      table.boolean('has_mnemonic')
      table.boolean('has_xpub')
      table.boolean('has_address_xpub')
      table.boolean('has_private_key')
      table.boolean('has_secret')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
