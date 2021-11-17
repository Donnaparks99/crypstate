import Route from '@ioc:Adonis/Core/Route'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { createWallet } from 'App/Services/GenerateWallet'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import {
  createAccount,
  Fiat,
  createNewSubscription,
  generateDepositAddress,
  getAccountById,
  getTransactionsByAccount,
} from '@tatumio/tatum'
import { Country } from '@tatumio/tatum/dist/src/model/request/Country'
import { SubscriptionType } from '@tatumio/tatum/dist/src/model/response/ledger/SubscriptionType'

export default class WalletsController {
  public async create({ request, response }: HttpContextContract) {
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

    if (wallet?.currency_id === currency.id) {
      return response.status(422).json({
        status: 'failed',
        message: `Wallet already exists.`,
      })
    }

    const newWallet = await createWallet(currency.tatum_currency, account.environment)

    try {
      const newAccount: any = await createAccount({
        currency: currency.tatum_currency.toUpperCase(),
        xpub: newWallet.xpub ?? newWallet.address,
        compliant: true,
        accountingCurrency: Fiat.USD,
        accountCode: `${request.all().account_name.toUpperCase()}-${request
          .all()
          .currency.toUpperCase()}`,
        accountNumber: Math.random().toString(36).substring(2),
        customer: {
          customerCountry: Country.US,
          accountingCurrency: Fiat.USD,
          providerCountry: Country.US,
          externalId: Math.random().toString(36).substring(2),
        },
      })

      if (request.all().webhook_url?.length > 1) {
        var webhookUrl: any = request.all().webhook_url
      } else {
        var webhookUrl: any = account?.url + account?.webhook_endpoint
      }

      const subscription = await createNewSubscription({
        type: SubscriptionType.ACCOUNT_INCOMING_BLOCKCHAIN_TRANSACTION,
        attr: {
          id: newAccount.id,
          url: webhookUrl,
        },
      })

      let newAcc = await account.related('wallets').create({
        currency_id: currency.id,
        tat_account_id: newAccount.id,
        account_code: newAccount.accountCode,
        account_number: newAccount.accountNumber,
        customer_id: newAccount.customerId,
        webhook_id: subscription.id,
        mnemonic: newWallet.mnemonic ?? null,
        xpub: newWallet.xpub ?? null,
        address: newWallet.address ?? null,
        secret: newWallet.secret ?? null,
        private_key: newWallet.privateKey ?? null,
      })

      const newAddress: any = await generateDepositAddress(newAccount.id)

      await newAcc.related('addresses').create({
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
        data: {
          wallet_name: newAcc.account_code,
          address: newAddress.address,
          derivation_key: newAddress.derivationKey,
          destination_tag: newAddress.destinationTag,
          message: newAddress.message,
          memo: newAddress.memo,
        },
      })
    } catch (err) {
      console.log(err)
    }
  }

  public async getWalletBalance({ request, response }: HttpContextContract) {
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
      return response.status(422).json({
        status: 'failed',
        message: `Wallet not found.`,
      })
    }

    let tatAccount: any = await getAccountById(wallet.tat_account_id)

    delete tatAccount.id
    delete tatAccount.xpub
    delete tatAccount.customerId

    return response.status(200).json({
      status: 'success',
      data: tatAccount,
    })
  }

  public async getWalletTransactions({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      account_name: schema.string(),
      currency: schema.string(),
      pageSize: schema.number(),
      offset: schema.number(),
      sieveout: schema.string.optional(),
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
      return response.status(422).json({
        status: 'failed',
        message: `Wallet not found.`,
      })
    }

    let transactions = await getTransactionsByAccount(
      {
        id: wallet.tat_account_id,
      },
      request.all().pageSize,
      request.all().offset
    )

    if (request.all().sieveout && request.all().sieveout !== 'none') {
      const sieveAccount = await accountNameExist(request.all().sieveout)

      if (sieveAccount) {
        let sieveWallet = await sieveAccount
          .related('wallets')
          .query()
          .where('currency_id', currency.id)
          .first()

        transactions = transactions.filter(
          (tx) => tx.counterAccountId !== sieveWallet.tat_account_id
        )
      }
    }

    //   let transactions = await getTransactionsByLedger(
    //     wallet.tat_account_id,
    //     request.all().pageSize,
    //     request.all().offset
    //   )

    return response.status(200).json({
      status: 'success',
      data: transactions,
    })
  }
}
