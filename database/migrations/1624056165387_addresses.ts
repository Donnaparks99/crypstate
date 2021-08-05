import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Addresses extends BaseSchema {
  protected tableName = 'addresses'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('wallet_id').unsigned().notNullable().references('wallets.id')
      table.string('address')
      table.integer('derivation_key').nullable()
      table.string('destination_tag').nullable()
      table.string('memo').nullable()
      table.string('message').nullable()
      table.text('key').nullable()
      table.text('xpub').nullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
