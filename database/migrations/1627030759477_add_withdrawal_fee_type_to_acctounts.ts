import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddWithdrawalFeeTypeToAcctounts extends BaseSchema {
  protected tableName = 'accounts'

  public async up() {
    this.schema.table(this.tableName, (table) => {
      table.string('withdrawal_fee_type').nullable().after('environment').defaultTo('percentage')
      table.double('withdrawal_fee', 3, 2).nullable().after('withdrawal_fee_type').defaultTo(4)
    })
  }

  public async down() {
    this.schema.dropTableIfExists(this.tableName)
  }
}
