import { schema } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import { getFee, sendCrypto, accountToAccountTransaction } from 'App/Services/Wallet'
import Env from '@ioc:Adonis/Core/Env'
import { getTransactionsByReference } from '@tatumio/tatum'

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

    const fromAccount = await accountNameExist(request.all().from_account_name)
    const toAccount = await accountNameExist(request.all().to_account_name)

    const fromWallet = await fromAccount.related('wallets').query().first()
    const toWallet = await toAccount.related('wallets').query().first()

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
}
