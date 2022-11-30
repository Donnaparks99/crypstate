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
          "webhook_url": Env.get('APP_URL') + '/tatum/webhook'
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

    // let addresses = [
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 1,
    //     "address": "1JbVBFLavm9DYqut5tVgAiNWv1e1vxeuQf",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 2,
    //     "address": "1LeYSyx7n1xSGXbPMdvFJu2qaLdMCZuCtP",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 3,
    //     "address": "1Bm556cwzXadKj8XyA2HUHKiNFMNnmfLFF",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 4,
    //     "address": "bc1qjcc3nffnp6lg9v9vt9epjhnj72npjctqunckx8",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 5,
    //     "address": "bc1q3qfhux5yfu3k254datyaumj7zy74fc30ue00wr",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 6,
    //     "address": "bc1q3sg8kr82an3eptdatwrxwl5uhy5gef64prk8sw",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 7,
    //     "address": "bc1q7w6f3xwr8nc2g05dfajxzm3dy59d32nd38gfrk",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 8,
    //     "address": "bc1qnhaxngllsdm8a4uugyry075kfvywjfulnpqxuh",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 9,
    //     "address": "bc1qg0mmw7l7j97dh8ldghy39n7xadyav2d9xyjplc",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 10,
    //     "address": "bc1qutwqrr9rd6wjf97hyxqerxa2s5m5wympnfkvqf",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 11,
    //     "address": "bc1qswrhm5hd07kl80art0t8pxn04jhjjl2sj06hc5",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 12,
    //     "address": "bc1q8m9p4308f45n0fm940qgjqlz0mf70c54x0aqdl",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 13,
    //     "address": "bc1qst7xslkk6k6yy29rtdjl4n44wv6w39zh7lnhw2",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 14,
    //     "address": "bc1q3kpjnudjs36xj3jtzl89lzzc6f9r6pgnk2lrlv",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 15,
    //     "address": "bc1qzy3e8fdck5lk6x6302rnluxaav47mzrtgvrz4v",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 16,
    //     "address": "bc1qq0kk3jj08lxnpzz6xlfc65wamt76k4axv5kpat",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 17,
    //     "address": "bc1qev7jkgzhhwrj0lq7jrwq76z0lmkydf9xfpxrjc",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 18,
    //     "address": "bc1qk7677922um06mfqj3kfjs70fd3r5gsfcq7ra76",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 19,
    //     "address": "bc1qyzgjgj6h30en28a3vgcvk9ythe3czr52n66eay",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 20,
    //     "address": "bc1qute8f2zu4ywjrsqrnf50mqtj8haylngqjhy9lp",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 21,
    //     "address": "bc1qldg3r27957xw46l2dxpjag54e00z3vqdnv3pls",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 22,
    //     "address": "bc1qh9sfftpm9ypnymd9lk7ep8pj5xv7ga9ejlwehk",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 23,
    //     "address": "bc1qv4yhyhh2zn9gvry83qc2aursw9sf80348ke453",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 24,
    //     "address": "bc1qm09lf6jzlvyea5axdh3wh56h2h6672cfds4h9e",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 25,
    //     "address": "bc1qzxa22g6estleasr7hkwsdxa8gvqrfdk9nxaldr",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 26,
    //     "address": "bc1q8lql6k6zxhwmtj2znhpr8v7evxsf32mz5wv3gm",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 27,
    //     "address": "bc1qkdf03kqv6cmz8qvagpxsdrjfrcncm8a7348u62",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 28,
    //     "address": "bc1q53vwm8tfcda5rg2ldjpkf5qtqy0qnurzv25fax",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 29,
    //     "address": "bc1qn0fn06d4a097szu7ux3gwfrcg6vjekusr7w4mp",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 30,
    //     "address": "bc1q3d8peh0jtyuxxrjg533s7z7pc5y8vdemxwvg0j",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 31,
    //     "address": "bc1q0m9lr6mr29ku44wy9a88u9qj5jydcjxj8f5a5l",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 32,
    //     "address": "bc1qe94skpguln9xzr04v7uneqmv3f7tt0vf887n0r",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 33,
    //     "address": "bc1qz8vxnpsj2gu3lww5wu5lpv33eg8pjtujzxxneu",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 34,
    //     "address": "bc1q2lr7rg6l458tjq6lq2t822dt08w0skwe8ntpsh",
    //     "currency": "BTC"
    //   },
    //   {
    //     "xpub": "xpub6Eo51yHVhntf3QMds7kFTi2JqSNaadXi3TaTRFSvA5ChQtJdpqmXNSDGZrtx5NCKMiyWMokqbELQcYcGmezgHVtuzUJGvmB9DNSGrNTcaSu",
    //     "derivationKey": 35,
    //     "address": "bc1qhclgu2r0mzf7zrkw8pp78md0nwqm9ntxds2qg9",
    //     "currency": "BTC"
    //   }
    // ]

    // let addressWithBalance = [];

    // for(var i = 0; i <= addresses.length; i++) {

    // }

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
