import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Wallet from 'App/Models/Wallet'
import fetch from 'node-fetch'
import Env from '@ioc:Adonis/Core/Env'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { internalAccountToAccountTransfer, getFee } from 'App/Services/Wallet'
import {
  SubscriptionType,
  createNewSubscription,
  listActiveSubscriptions,
  cancelExistingSubscription,
  obtainReportForSubscription,
} from '@tatumio/tatum'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'

export default class WebhooksController {
  public async index({ request, response }: HttpContextContract) {
    const wallet = await Wallet.findBy('tat_account_id', request.all().accountId)

    if (wallet) {
      const account: any = await wallet.related('account').query().first()
      const currency: any = await wallet?.related('currency').query().first()
      const address: any = await wallet.related('addresses').query().first()

      let fetchTransactions = await fetch(`${Env.get('APP_URL')}/get/wallet/transactions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          account_name: account.name,
          currency: currency.currency,
          pageSize: '50',
          offset: 0,
        }),
      })

      let transactions = await fetchTransactions.json()

      let transaction = transactions?.data?.filter(
        (transactions) => transactions.txId === request.all().txId
      )[0]

      switch (currency.token) {
        case 'eth':
        case 'erc20':
        case 'bsc':
        case 'bnb':
          let fee = await getFee(currency, wallet, address?.address, transaction.amount)

          await internalAccountToAccountTransfer(
            currency,
            wallet,
            transaction.address, // fromAddress
            address?.address, // toAddress
            transaction.amount,
            fee
          )
      }

      delete transaction.accountId
      delete transaction.anonymous
      delete transaction.marketValue
    }
  }

  public async recreateSubscription({ request, response }: HttpContextContract) {

    var requestData = schema.create({
      account_name: schema.string(),
      currency: schema.string(),
      webhook_url: schema.string.optional({}, [rules.url({
        protocols: ['http', 'https'],
      })]),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const account = await accountNameExist(request.all().account_name)

    if (account['status'] === 'failed') {
      return response.status(422).json(account)
    }

    const currency = await currencyExistInDb(request.all().currency)

    if (currency['status'] === 'failed') {
      return response.status(422).json(currency)
    }

    let wallet = await account.related('wallets').query().where('currency_id', currency.id).first()

    await cancelExistingSubscription(wallet.webhook_id)

    try {
      const subscription = await createNewSubscription({
        type: SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
        attr: {
          id: wallet.tat_account_id,
          url: request.all().webhook_url,
        },
      })

      await account.related('wallets').query().where('currency_id', currency.id).update({
        webhook_id: subscription.id
      })
  
      return response.status(200).json(subscription)
    } catch (err) {
      return err.response?.data
    }

    
  }

  public async createSubscription({ request, response }: HttpContextContract) {

    var requestData = schema.create({
      account_name: schema.string(),
      currency: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const account = await accountNameExist(request.all().account_name)

    if (account['status'] === 'failed') {
      return response.status(422).json(account)
    }

    const currency = await currencyExistInDb(request.all().currency)

    if (currency['status'] === 'failed') {
      return response.status(422).json(currency)
    }

    let wallet = await account.related('wallets').query().where('currency_id', currency.id).first()

    try {
      const subscription = await createNewSubscription({
        type: SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
        attr: {
          id: wallet.tat_account_id,
          url: request.all().webhook_url,
        },
      })

      await account.related('wallets').query().where('currency_id', currency.id).update({
        webhook_id: subscription.id
      })

      return response.status(200).json(subscription)

    } catch (e) {
      return e.response.data;
    }

  }

  public async deleteSubscription({ request, response }: HttpContextContract) {

    var requestData = schema.create({
      webhook_id: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    let cancel = await cancelExistingSubscription(request.all().webhook_id)

    return cancel
  }

  public async listSubscription({ request }: HttpContextContract) {

    var requestData = schema.create({
      pageSize: schema.string(),
      offset: schema.string(),
    })

    try {

      let list = await listActiveSubscriptions(request.all()?.pageSize ?? 50, request.all()?.offset ?? 0)

      return list
    } catch (e) {
      return e.response.data
    }
  }
}
