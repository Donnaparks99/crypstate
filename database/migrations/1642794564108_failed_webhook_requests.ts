import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class FailedWebhookRequests extends BaseSchema {
  protected tableName = 'failed_webhook_requests'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('account_id').notNullable()
      table.integer('wallet_id').notNullable()
      table.string('endpoint').notNullable()
      table.string('txid').notNullable()
      table.text('request_body').notNullable()
      table.text('fail_reason').nullable()

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
