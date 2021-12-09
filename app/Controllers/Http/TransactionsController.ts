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
import BigNumber from 'bignumber.js'
import Route from '@ioc:Adonis/Core/Route'

export default class TransactionsController {
  public async create({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      account_name: schema.string(),
      currency: schema.string(),
      amount: schema.number(),
      toAddress: schema.string(),
      memoTag: schema.string.optional(),
      // cutPercentage: schema.string.optional()
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
    let managerAccount: any = await accountNameExist(Env.get('MANAGER_ACCOUNT_NAME'))

    
    if(!managerAccount) {
      let createManagerAccount = await fetch(
        Route.makeUrl('createAccount', [], {
          prefixUrl: Env.get('HOST_URL')
        }),
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            "display_name": Env.get('MANAGER_ACCOUNT_NAME'),
            "name": Env.get('MANAGER_ACCOUNT_NAME'),
            "url": "http://crypstate.io",
            "webhook_endpoint": "/tatum/webhook",
            "environment": "production"
          }),
        }
      )

        managerAccount = await createManagerAccount.json();

      if(managerAccount.status === "success") {

        managerAccount = await accountNameExist(Env.get('MANAGER_ACCOUNT_NAME'))

      } else {

        return response.status(422).json({
          status: 'failed',
          message: `Unable to complete - MA193. Please try again.`,
        })

      }
    }

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

    if (wallet?.currency_id !== currency.id) {
      return response.status(422).json({
        status: 'failed',
        message: `Wallet does not exists.`,
      })
    }

    let managerWallet = await managerAccount
      .related('wallets')
      .query()
      .where('currency_id', currency.id)
      .first()

    if(!managerWallet) {
      let createManagerWallet = await fetch(
        Route.makeUrl('createWallet', [], {
          prefixUrl: Env.get('HOST_URL')
        }),
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            "account_name": Env.get('MANAGER_ACCOUNT_NAME'),
            "currency": currency.currency,
            "webhook_url": managerAccount.url + managerAccount.webhook_endpoint,
          }),
        }
      )

      managerWallet = await createManagerWallet.json();

      if(managerWallet.status === "success") {
        managerWallet = await managerAccount
          .related('wallets')
          .query()
          .where('currency_id', currency.id)
          .first()
      } else {

        return response.status(422).json({
          status: 'failed',
          message: `Unable to complete - MW216. Please try again.`,
        })

      }

    }

    let fee:any = await getFee(currency, wallet, request.all().toAddress, request.all().amount)

    try {
      let send = await sendCrypto(
        wallet,
        managerWallet,
        request.all().toAddress,
        request.all().amount,
        fee,
        request.all().memoTag,
        request.all().cutPercentage ?? 0
      )

      return response.status(200).json({
        status: 'success',
        data: send,
      })
    } catch (err) {

      if(err?.response?.data ?? err?.message ?? err) {
        return response.status(401).json({
          status: 'error',
          data: err?.response?.data ?? err?.message ?? err
        })
      }
  
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

    // let toAddress = await wallet
    //   .related('addresses')
    //   .query()
    //   .where('address', request.all().to_address)
    //   .first()

    // if (!toAddress) {
    //   return response.status(422).json({
    //     status: 'failed',
    //     message: `To address not found.`,
    //   })
    // }

    let toAddress = request.all().to_address;

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

    // const fromAddressPrivateKey: any = await generatePrivateKeyFromMnemonic(
    //   Currency['ETH'],
    //   isTest,
    //   mnemonic,
    //   fromAddress?.derivation_key
    // )

    const requiredData = {
      senderAccountId: wallet.tat_account_id,
      address: toAddress,
      amount: request.all().amount,
      compliant: false,
      senderNote: Math.random().toString(36).substring(2),
    }

    // let fee: any = await getFee(currency, wallet, toAddress.address, request.all().amount)
    const ercData = {
      mnemonic,
      index: fromAddress?.derivation_key || null,
      attr: null,
    }

    const ercGas = {
      gasPrice: "150",
      gasLimit: "21000",
    }

    const bscGas = {
      gasPrice: "5",
      gasLimit: "21000",
    }

    let gasFee:any = 0

    try {
      switch (currency.token) {
        // case 'trx':
        // return await sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData })
        // case 'trc10':
        // case 'trc20':
        // return await sendTronTrc10Transaction(isTest, { ...requiredData })

        case 'eth':

          gasFee = new BigNumber(ercGas.gasLimit)
            .multipliedBy(ercGas.gasPrice)
            .dividedBy(1000000000)
            .toString()

            requiredData['amount'] = (parseFloat(requiredData['amount']) - parseFloat(gasFee)).toString()
            
          try {

            let sendEth = await sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData, ...ercGas })

            return response.status(200).json({
              status: 'success',
              data: sendEth
            })

          } catch (e) {

            console.log(e?.response)

            if(e?.response) {
              return response.status(401).json({
                status: 'error',
                data: e?.response?.data
              })
            }

            return e
          }
        case 'erc20':
          gasFee = new BigNumber(ercGas.gasLimit)
            .multipliedBy(ercGas.gasPrice)
            .dividedBy(1000000000)
            .toFixed(9)

            requiredData['amount'] = (parseFloat(requiredData['amount']) - parseFloat(gasFee)).toString()

            try {

              let sendErc20 = await sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData, ...ercGas });

              return response.status(200).json({
                status: 'success',
                message: sendErc20
              });

            } catch (e) {

              if(e?.response) {
                return response.status(401).json({
                  status: 'error',
                  data: e?.response?.data
                })
              }

            }


           

         
        case 'bsc':
          gasFee = new BigNumber(bscGas.gasLimit)
            .multipliedBy(bscGas.gasPrice)
            .dividedBy(1000000000)
            .toFixed(9)

            requiredData['amount'] = (parseFloat(requiredData['amount']) - parseFloat(gasFee)).toString()

            try {

              let SendBsc = await sendBscOffchainTransaction(isTest, { ...requiredData, ...ercData, ...bscGas })

              return response.status(200).json({
                status: 'success',
                message: SendBsc
              });

            } catch (e) {

              if(e?.response) {
                return response.status(401).json({
                  status: 'error',
                  data: e?.response?.data
                })
              }

              return e

            }

        default:
          return response.status(401).json({
            status: 'failed',
            message: 'No address to address transfer for currency',
          })
      }
    } catch (e) {
      return response.status(401).json({
        status: 'failed',
        message: e?.response?.message ?? e?.message ?? e?.response?.data,
      })
    }
  }

  public async getWithdrawals({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      currency: schema.string(),
      status: schema.enum(
        ['InProgress', 'Done', 'Cancelled'] as const
      )
      // pageSize: schema.number(),
      // offset: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const getWithdrawals = await fetch(
      `https://api-eu1.tatum.io/v3/offchain/withdrawal?currency=${request.all().currency}&status=${
        request.all().status
      }&pageSize=${request.all().pageSize ?? 50}&offset=${request.all().request ?? 0}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'x-api-key': Env.get('TATUM_API_KEY'),
        },
      }
    )

    return await getWithdrawals.json()
  }

  public async completeWithdrawal({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      id: schema.string(),
      txId: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const completeWithdrawal = await fetch(
      `https://api-eu1.tatum.io/v3/offchain/withdrawal/${request.all().id}/${request.all().txId}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'x-api-key': Env.get('TATUM_API_KEY'),
        },
      }
    )

    return await completeWithdrawal.json()
  }

  public async cancelWithdrawal({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      id: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const cancelWithdrawal = await fetch(
      `https://api-eu1.tatum.io/v3/offchain/withdrawal/${request.all().id}`,
      {
        method: 'GET',
        headers: {
          'content-type': 'application/json',
          'x-api-key': Env.get('TATUM_API_KEY'),
        },
      }
    )

    return await cancelWithdrawal.json()
  }

  public async withdrawalBroadcast({ request, response }: HttpContextContract) {
    var requestData = schema.create({
      currency: schema.string(),
      txData: schema.string(),
    })

    try {
      await request.validate({ schema: requestData })
    } catch (error) {
      return response.status(422).json({
        status: 'failed',
        message: `${error.messages.errors[0].message} on ${error.messages.errors[0].field}`,
      })
    }

    const withdrawalBroadcast = await fetch(
      `https://api-eu1.tatum.io/v3/offchain/withdrawal/broadcast`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': Env.get('TATUM_API_KEY'),
        },
        body: JSON.stringify({
          currency: request.all().currency,
          txData: request.all().txData,
          withdrawalId: request.all().withdrawalId,
        }),
      }
    )

    return await withdrawalBroadcast.json()
  }
}
