import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class Accounts extends BaseSchema {
  protected tableName = 'accounts'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('display_name')
      table.string('name').unique()
      table.string('url').unique()
      table.string('webhook_endpoint')
      table.boolean('restricted').defaultTo(0)
      table.string('environment').defaultTo('production')
      table.timestamps(true)
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
