import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import { getFee, sendCrypto, accountToAccountTransaction } from 'App/Services/Wallet'
import Env from '@ioc:Adonis/Core/Env'
import {
  Currency,
  generatePrivateKeyFromMnemonic,
  getTransactionsByReference,
  sendBscOffchainTransaction,
  sendEthErc20OffchainTransaction,
  sendEthOffchainTransaction,
  sendXlmOffchainTransaction,
  sendXrpOffchainTransaction,
} from '@tatumio/tatum'
import Encryption from '@ioc:Adonis/Core/Encryption'
import fetch from 'node-fetch'

export default class TransactionsController {
  public async create({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      account_name: schema.string(),
      currency: schema.string(),
      amount: schema.number(),
      toAddress: schema.string(),
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
    const managerAccount: any = await accountNameExist(Env.get('MANAGER_ACCOUNT_NAME'))

    if (account['status'] === 'failed') {
      return response.status(422).json(account)
    }

    if (account.restricted) {
      return response.status(422).json({
        status: 'failed',
        message: `Unable to withdraw! Please try again later or contact support.`,
      })
    }

    const currency = await currencyExistInDb(request.all().currency)

    if (currency['status'] === 'failed') {
      return response.status(422).json(currency)
    }

    let wallet = await account.related('wallets').query().where('currency_id', currency.id).first()
    let managerWallet = await managerAccount
      .related('wallets')
      .query()
      .where('currency_id', currency.id)
      .first()

    if (wallet?.currency_id !== currency.id) {
      return response.status(422).json({
        status: 'failed',
        message: `Wallet does not exists.`,
      })
    }

    let fee = await getFee(currency, wallet, request.all().toAddress, request.all().amount)

    try {
      let send = await sendCrypto(
        wallet,
        managerWallet,
        request.all().toAddress,
        request.all().amount,
        fee,
        request.all().memoTag,
        request.all().cutAmount ?? 0
      )

      return response.status(200).json({
        status: 'success',
        data: send,
      })
    } catch (err) {
      console.log(err)

      return response.status(401).json({
        status: 'error',
        data: err?.message,
      })
    }
  }

  public async internalTransfer({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      from_account_name: schema.string(),
      to_account_name: schema.string(),
      currency: schema.string(),
      amount: schema.string(),
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

    const fromAccount = await accountNameExist(request.all().from_account_name)
    const toAccount = await accountNameExist(request.all().to_account_name)

    const fromWallet = await fromAccount
      .related('wallets')
      .query()
      .where('currency_id', currency.id)
      .first()

    const toWallet = await toAccount
      .related('wallets')
      .query()
      .where('currency_id', currency.id)
      .first()

    const a2at = await accountToAccountTransaction(
      fromWallet.tat_account_id,
      toWallet.tat_account_id,
      request.all().amount,
      'Transfer'
    )

    return response.status(200).json({
      status: 'success',
      data: a2at,
    })
  }

  public async getTransactionWithReference({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      referenceId: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    try {
      let transaction = await getTransactionsByReference(request.all().referenceId)

      return response.status(200).json({
        status: 'success',
        data: transaction,
      })
    } catch (err) {
      return response.status(401).json({
        status: 'failed',
        data: 'Unable to get transaction.',
      })
    }
  }

  public async addressToAddressTransfer({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      account_name: schema.string(),
      from_address: schema.string(),
      to_address: schema.string(),
      currency: schema.string(),
      amount: schema.string(),
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

    let fromAddress = await wallet
      .related('addresses')
      .query()
      .where('address', request.all().from_address)
      .first()

    if (!fromAddress) {
      return response.status(422).json({
        status: 'failed',
        message: `From address not found.`,
      })
    }

    let toAddress = await wallet
      .related('addresses')
      .query()
      .where('address', request.all().to_address)
      .first()

    if (!toAddress) {
      return response.status(422).json({
        status: 'failed',
        message: `To address not found.`,
      })
    }

    function decryptEncryption(key) {
      return key
        ? Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).decrypt(key.toString())
        : null
    }

    const isTest: boolean = account.environment === 'local' ? true : false
    const mnemonic: any = decryptEncryption(wallet.mnemonic)
    // const fromAddressPrivateKey: any = decryptEncryption(fromAddress.xpub)

    const fromAddressPrivateKey: any = await generatePrivateKeyFromMnemonic(
      Currency['ETH'],
      isTest,
      mnemonic,
      fromAddress?.derivation_key
    )

    const requiredData = {
      senderAccountId: wallet.tat_account_id,
      address: toAddress.address,
      amount: request.all().amount,
      compliant: false,
      senderNote: Math.random().toString(36).substring(2),
    }

    let fee: any = await getFee(currency, wallet, toAddress.address, request.all().amount)

    const ercData = {
      gasPrice: fee?.gasPrice?.toString(),
      gasLimit: fee?.gasLimit?.toString(),
      mnemonic,
      index: fromAddress?.derivation_key || null,
      // privateKey: fromAddressPrivateKey || null,
      attr: null,
    }

    try {
      switch (currency.token) {
        // case 'trx':
        // return await sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData })
        // case 'trc10':
        // case 'trc20':
        // return await sendTronTrc10Transaction(isTest, { ...requiredData })

        case 'eth':
          return await sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData })
        case 'erc20':
          return response.status(200).json({
            status: 'success',
            message: await sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData }),
          })
        case 'bsc':
          return await sendBscOffchainTransaction(isTest, { ...requiredData, ...ercData })
        default:
          return response.status(401).json({
            status: 'failed',
            message: 'No address to address transfer for currency',
          })
      }
    } catch (e) {
      return response.status(401).json({
        status: 'failed',
        message: e?.response?.message ?? e?.message,
      })
    }
  }
}
