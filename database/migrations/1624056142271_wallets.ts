import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Wallets extends BaseSchema {
  protected tableName = 'wallets'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('account_id').unsigned().notNullable().references('accounts.id')
      table.integer('currency_id').unsigned().notNullable().references('currencies.id')
      table.string('tat_account_id').notNullable()
      table.string('account_code').notNullable()
      table.string('account_number').notNullable()
      table.string('customer_id').notNullable()
      table.integer('received').defaultTo(0)
      table.integer('sent').defaultTo(0)
      table.text('mnemonic').nullable()
      table.text('xpub').nullable()
      table.text('address').nullable()
      table.text('secret').nullable()
      table.text('private_key').nullable()
      table.text('webhook_id').nullable()
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
