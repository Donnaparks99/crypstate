import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import { generateDepositAddress } from '@tatumio/tatum'
import fetch from 'node-fetch'
import Env from '@ioc:Adonis/Core/Env'

export default class AddressesController {
  public async create({ request, response }: HttpContextContract) {
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

    if (!wallet) {
      // return response.status(422).json({
      //   status: 'failed',
      //   message: 'Wallet does not exist.',
      // })


      let createWallet = await fetch(`${Env.get('APP_URL')}/create/wallet`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          "account_name": request.all().account_name,
          "currency": currency.currency,
          "webhook_url": account.url + account.webhook_endpoint
        }),
      })

      let newWalletData = await createWallet.json()

      if(newWalletData.status !== "success") {
        return response.status(422).json({
          status: 'failed',
          message: 'Wallet does not exist.',
        })
      }

      wallet = await account.related('wallets').query().where('currency_id', currency.id).first()
    }

    const newAddress: any = await generateDepositAddress(wallet.tat_account_id)

    const newAdd = await wallet.related('addresses').create({
      address: newAddress.address,
      derivation_key: newAddress.derivationKey,
      xpub: newAddress.xpub,
      destination_tag: newAddress.destinationTag,
      message: newAddress.message,
      memo: newAddress.memo,
      key: newAddress.key,
    })

    return response.status(200).json({
      status: 'success',
      data: newAdd,
    })
  }

  public async getAddressBalance({ request, response }: HttpContextContract) {
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
  }

  public async getWalletAddresses({ request, response }: HttpContextContract) {
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
    
    return wallet.related('addresses').query();
  }
}
