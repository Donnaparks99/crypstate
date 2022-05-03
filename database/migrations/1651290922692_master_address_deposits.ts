import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class MasterAddressDeposits extends BaseSchema {
  protected tableName = 'master_address_deposits'

  public async up () {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id');
      table.integer('account_id');
      table.integer('wallet_id');
      table.integer('currency_id');
      table.string('currency_code'); 
      table.string('token'); 
      table.string('from_address');
      table.string('to_address');
      table.string('amount');
      table.string('status');
      table.string('deposit_txid');
      table.string('withdrawal_txid').nullable();
      table.text('misc').nullable();
      table.text('fail_reason').nullable();

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
