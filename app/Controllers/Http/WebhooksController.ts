import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

import Wallet from 'App/Models/Wallet'
import fetch from 'node-fetch'
import Env from '@ioc:Adonis/Core/Env'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import {
  SubscriptionType,
  createNewSubscription,
  listActiveSubscriptions,
  cancelExistingSubscription,
  obtainReportForSubscription,
} from '@tatumio/tatum'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import FailedWebhookRequest from 'App/Models/FailedWebhookRequest'
import MasterAddressDeposit from 'App/Models/MasterAddressDeposit'

import { getFee, sendCrypto } from 'App/Services/Wallet'

export default class WebhooksController {

  public async sendWebhook({request, response }: HttpContextContract) {

    const wallet: any = await Wallet.findBy('tat_account_id', request.all().accountId)
    const currency: any = await wallet.related('currency').query().first()
    const account: any = await wallet.related('account').query().first()
    const masterAddress: any = await wallet.related('addresses').query().first()

    let webhookEndpoint = account?.url + account?.webhook_endpoint

    try {
      let sendWebhookRequest = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(request.all()),
      })

      if(currency.tx_model === 'account' || currency.token === 'trx' || currency.token === 'trc20') {

        var ticker = await fetch('https://api.binance.com/api/v3/ticker/24hr');

        ticker = await ticker.json()

        if(["BUSD", "USDT", "USDC"].includes(currency?.currency.toUpperCase())) {

          var amountUsd = parseFloat(request.all().amount)

        } else {

          var exchangeRate = ticker.find(({ symbol }) =>  symbol === `${currency?.currency.toUpperCase()}USDT`)['lastPrice'];
          var amountUsd = parseFloat(exchangeRate) * parseFloat(request.all().amount)

        }

        let txExists = await MasterAddressDeposit.query().where('deposit_txid', request.all().txId).first()

        if((amountUsd >= 4) && (request.all().to !== masterAddress) && !txExists) {

            var newTx = await MasterAddressDeposit.create({
              "account_id": account.id,
              "wallet_id": wallet.id,
              "currency_id": currency.id,
              "currency_code": currency.currency.toUpperCase(),
              "token": currency.token.toUpperCase(),
              "amount": request.all().amount,
              "from_address": request.all().to, 
              "to_address": masterAddress.address,
              "status": "pending",
              "deposit_txid": request.all().txId,
              "withdrawal_txid": null,
              "misc": null
            })
            
            if(currency.type === 'native') {

              let fee:any = await getFee(
                currency?.currency, 
                newTx?.from_address,
                newTx?.to_address, 
                newTx?.amount,
                newTx?.wallet,
                currency?.contract_address
              )

              let send:any = await sendCrypto(
                wallet,
                null,
                newTx.from_address,
                newTx.to_address,
                newTx.amount,
                fee,
                true, // subtract fee from amount
                "", // memo, tag
                0, // cutPercentage
                false // shouldChargeFee
              )
    
              newTx.misc = JSON.stringify(fee.native);

              if(send?.id) {
    
                newTx.status = "sent";
                newTx.withdrawal_txid = send.txId;
                await newTx.save();
      
              }
    
            }
        }
      }

      return response.status(200).json({
        "status": "success"
      })
    } catch (err) {

      console.log(err);
      
      let hasFailedBefore = await FailedWebhookRequest.query().where('txid', request.all().txId).first();

      if(!hasFailedBefore?.id) {
        await FailedWebhookRequest.create({
          account_id: account.id,
          wallet_id: wallet.id,
          endpoint: webhookEndpoint,
          txid: request.all().txId,
          request_body: JSON.stringify(request.all()),
          fail_reason: err.message
        });
      }

      return response.status(401).json({
        "status": "failed"
      })
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

    let webhookUrl: any 

    if(request.all().webhook_url.length > 1) {
      webhookUrl = request.all().webhook_url
    } else {
      webhookUrl = Env.get('APP_URL') + '/tatum/webhook'
    }

    try {
      const subscription = await createNewSubscription({
        type: SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
        attr: {
          id: wallet.tat_account_id,
          url: webhookUrl,
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

    let webhookUrl: any 

    if(request.all().webhook_url.length > 1) {
      webhookUrl = request.all().webhook_url
    } else {
      webhookUrl = Env.get('APP_URL') + '/tatum/webhook'
    }

    try {
      const subscription = await createNewSubscription({
        type: SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
        attr: {
          id: wallet.tat_account_id,
          url: webhookUrl
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
