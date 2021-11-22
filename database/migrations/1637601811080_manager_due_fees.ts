import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class ManagerDueFees extends BaseSchema {
  protected tableName = 'manager_due_fees'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('wallet_id')
      table.double('amount', 50, 10)

      /**
       * Uses timestamptz for PostgreSQL and DATETIME2 for MSSQL
       */
      table.timestamp('created_at', { useTz: true })
      table.timestamp('updated_at', { useTz: true })
    })
  }

  public async down () {
    this.schema.dropTable(this.tableName)
  }
}
