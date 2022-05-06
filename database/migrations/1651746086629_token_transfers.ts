import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class TokenTransfers extends BaseSchema {
  protected tableName = 'token_transfers'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.bigInteger('account_id')
      table.bigInteger('wallet_id')
      table.bigInteger('currency_id')
      table.string('from_address')
      table.string('to_address')
      table.string('network')
      table.string('currency_code')
      table.string('send_amount')
      table.text('native_fee').nullable()
      table.string('native_fee_status').nullable()
      table.text('token_fee').nullable()
      table.string('send_token_status').nullable()

      table.string('sent_native_txid').nullable()
      table.string('sent_token_txid').nullable()

      table.text('send_native_fee_failed_message').nullable()
      table.text('send_token_failed_message').nullable()




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
