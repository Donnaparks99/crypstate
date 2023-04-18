import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class AddCategoryColumeTos extends BaseSchema {
  protected tableName = 'accounts'

  public async up () {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('category').after('name').nullable()
    })
  }

  public async down () {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category');
    })
  }
}
