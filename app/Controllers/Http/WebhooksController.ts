import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Wallet from 'App/Models/Wallet'
import fetch from 'node-fetch'
import Env from '@ioc:Adonis/Core/Env'
import { internalAccountToAccountTransfer, getFee, sendCrypto } from 'App/Services/Wallet'

export default class WebhooksController {
  public async index({ request }: HttpContextContract) {
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

      fetch(`${account.url}${account.webhook_endpoint}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(transaction),
      })

      console.log('object')
    }
  }
}
