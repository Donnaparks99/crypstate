import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { Currency, Fiat, getAccountById, getExchangeRate } from '@tatumio/tatum'
import Account from 'App/Models/Account'
import { currencyExistInDb, getAccounts } from 'App/Services/Validation'

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

  public async allAccountsBalance({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      currency: schema.string()
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }


    const currency = await currencyExistInDb(request.all().currency)

    if (currency['status'] === 'failed') {
      return response.status(422).json(currency)
    }

    const accounts = await Account.query().preload('wallets').whereHas('wallets', (query) => {
      query.where('currency_id', currency.id)
    })

    const walletBalance = [];
    
    for (var i = 0; i < accounts.length; i++) {

      let tatAccount: any = await getAccountById(accounts[i].wallets[0].tat_account_id)

      let exchangeRate: any = await getExchangeRate(Currency[request.all().currency.toUpperCase()], Fiat['USD'])

      let wallet = {
        name: accounts[i].wallets[0].account_code,
        balance: tatAccount.balance.availableBalance  + ' ' + request.all().currency.toUpperCase(),
        balance_usd: (parseFloat(tatAccount.balance.availableBalance) * exchangeRate.value).toFixed(2)  + ' USD'
      }

      walletBalance.push(wallet)

    }
    
    return walletBalance

  }
}
