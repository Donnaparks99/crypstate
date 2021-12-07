import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { schema } from '@ioc:Adonis/Core/Validator'
import { Currency, Fiat, getExchangeRate } from '@tatumio/tatum'
import { accountNameExist, currencyExistInDb } from 'App/Services/Validation'
import Env from '@ioc:Adonis/Core/Env'
import fetch from 'node-fetch'
import BigNumber from 'bignumber.js'
import Route from '@ioc:Adonis/Core/Route'

export default class CheckFeesController {

    public async checkFees({ request, response }: HttpContextContract) {

        var requestData = schema.create({
            account_name: schema.string(),
            currency: schema.string(),
            withdraw: schema.string.optional()
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
                message: 'Wallet does not exist.',
            })
        }

        let due_fees = await wallet.related('due_fee').query()

        let fees = due_fees.reduce((previousValue, due_fee) => {
            return previousValue + due_fee.amount
        }, 0)

        let exchangeRate: any = await getExchangeRate(Currency[currency.currency.toUpperCase()], Fiat['USD'])

        if(request.all().withdraw == "false") {

            return response.status(200).json({
                status: 'success',
                "data" :  {
                    "pending_withdrawal_crypto": fees + " " + currency.currency.toUpperCase(),
                    "pending_withdrawal_fiat":  fees * exchangeRate?.value + ' USD'
                }
            })

        }

        if(
            request.all().withdraw == "true" && 
            (fees * exchangeRate?.value) >= parseFloat(Env.get('MINIMUM_FEE_WITHDRAWAL'))
        ) {

            const managerAccount = await accountNameExist(Env.get('MANAGER_ACCOUNT_NAME'))
            let managerWallet = await managerAccount.related('wallets').query().where('currency_id', currency.id).first()
            let managerAddress = await managerWallet.related('addresses').query().first();

            try {
                let withdraw = await fetch(
                    Route.makeUrl('createWithdrawal', [], {
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
                        "amount": fees,
                        "toAddress": managerAddress?.address,
                        // "memoTag": "",
                        // "#cutPercentage": "0"
                      }),
                    }
                )
    
                let withdrawData = withdraw.json()

                return response.status(200).json({
                    status: 'success',
                    "data" : withdrawData
                })

            } catch (e) {
                
                return response.status(200).json({
                    status: 'success',
                    "data" : e?.response?.data ?? e?.message ?? e
                })

            }

        } else {
            return response.status(200).json({
                status: 'success',
                "data" :  {
                    "pending_withdrawal_crypto": fees + " " + currency.currency.toUpperCase(),
                    "pending_withdrawal_fiat":  fees * exchangeRate?.value + ' USD'
                }
            })
        }

    }

}
