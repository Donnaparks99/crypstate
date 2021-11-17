import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import Account from 'App/Models/Account'

export default class AccountsController {
  public async create({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      display_name: schema.string(),
      name: schema.string(),
      url: schema.string({}, [rules.url({
        protocols: ['http', 'https'],
      })]),
      webhook_endpoint: schema.string(),
      environment: schema.string.optional(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const account = await Account.create({
      display_name: request.all().display_name,
      name: request.all().name,
      url: request.all().url,
      webhook_endpoint: request.all().webhook_endpoint,
      environment: request.all().environment,
      withdrawal_fee_type: request.all().withdrawal_fee_type,
      withdrawal_fee: request.all().withdrawal_fee,
    })

    if (account) {
      return response.status(200).json({
        status: 'success',
        data: account,
      })
    }
  }
}
