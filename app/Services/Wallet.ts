import Wallet from 'App/Models/Wallet'
import {
  sendBitcoinCashOffchainTransaction,
  ethEstimateGas,
  bscEstimateGas,
  vetEstimateGas,
  xlmGetFee,
  xrpGetFee,
  sendBitcoinOffchainTransaction,
  sendLitecoinOffchainTransaction,
  sendDogecoinOffchainTransaction,
  sendTronOffchainTransaction,
  sendTronTrc10Transaction,
  sendEthOffchainTransaction,
  sendEthErc20OffchainTransaction,
  sendBscOffchainTransaction,
  sendXlmOffchainTransaction,
  sendXrpOffchainTransaction,
  sendAdaOffchainTransaction,
  getExchangeRate,
  Fiat,
  Currency
} from '@tatumio/tatum'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'
import fetch from 'node-fetch'
import { BigNumber } from 'bignumber.js'
import ManagerDueFee from 'App/Models/ManagerDueFee'
import { accountNameExist } from './Validation'
import Route from '@ioc:Adonis/Core/Route'

type WithdrawBnbType = {
  senderAccountId: string
  address: string
  amount: string
  compliant: boolean
  senderNote: string
  gasPrice: string
  gasLimit: string
  mnemonic: string
  privateKey: string
  attr?: string | number | null
}

export async function sendCrypto(
  wallet: Wallet,
  managerWallet: Wallet | null,
  recepiantAddress: string,
  amount: any,
  fee: any,
  memoTag: any,
  withdrawalCommission: any
) {
  const currency: any = await wallet.related('currency').query().first()
  const account: any = await wallet.related('account').query().first()
  const addresses: any = await wallet.related('addresses').query().first()

  const managerWalletAddress = await managerWallet
    ?.related('addresses')
    .query()
    .orderBy('created_at', 'desc')
    .first()

  const isTest: boolean = account.environment === 'local' ? true : false

  let managerAddress: any = managerWalletAddress?.address
  let managerAddressMemoTag =
    managerWalletAddress?.destination_tag ??
    managerWalletAddress?.memo ??
    managerWalletAddress?.message
  let networkFee: any = 0


  let withdrawalFee: any = 0;

  if(parseFloat(account.withdrawal_fee) > 0 || parseFloat(withdrawalCommission) > 0) {

    if(account.withdrawal_fee_type === 'flat') {

      withdrawalFee = parseFloat(account.withdrawal_fee) + parseFloat(withdrawalCommission)
      amount = amount - withdrawalFee

    } else if(account.withdrawal_fee_type === 'percentage') {

      withdrawalFee = (amount * (account.withdrawal_fee / 100)).toFixed(8)
      amount = amount - (parseFloat(withdrawalFee) + parseFloat(withdrawalCommission))
      
    }

  }

  const mnemonic: any = decryptEncryption(wallet.mnemonic)
  const xpub: any = decryptEncryption(wallet.xpub)
  const secret: any = decryptEncryption(wallet.secret)

  
  let receivingAddress: any = ''
  let multipleAmounts: any = ''
  let totalSendAmount: any = ''

  let exchangeRate: any = await getExchangeRate(Currency[currency.currency.toUpperCase()], Fiat['USD'])

  if(
    (exchangeRate?.value * amount) > parseFloat(Env.get('FEE_FROM_AMOUNT_ABOVE')) && 
    withdrawalFee > 0 && 
    managerAddress) 
  {

    receivingAddress = recepiantAddress + ',' + managerAddress
    multipleAmounts = [
      amount.toString(), 
      withdrawalFee.toString()
    ]
    totalSendAmount = (parseFloat(amount) + parseFloat(withdrawalFee)).toFixed(8).toString()
  } else {
    receivingAddress = recepiantAddress
    multipleAmounts = [amount.toString()]
    totalSendAmount = amount.toString()
  }

  async function toDueFeeAccount() {
    if(withdrawalFee > 0) {
      const dueFeeAccount = await accountNameExist("due-fee")

      let dueFeeWallet = await dueFeeAccount
        .related('wallets')
        .query()
        .where('currency_id', currency.id)
        .first()

      if(!dueFeeWallet) {

        let createDueFeeWallet = await fetch(
          Route.makeUrl('createWallet', [], {
            prefixUrl: Env.get('HOST_URL')
          }),
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              "account_name": "due-fee",
              "currency": currency.currency,
              "webhook_url": dueFeeAccount.url + dueFeeAccount.webhook_endpoint,
            }),
          }
        )

        dueFeeWallet = await dueFeeAccount
          .related('wallets')
          .query()
          .where('currency_id', currency.id)
          .first()
      }

      await accountToAccountTransaction(
        wallet.tat_account_id,
        dueFeeWallet.tat_account_id,
        withdrawalFee.toString(),
        'Transfer'
      )

      ManagerDueFee.create({
        wallet_id: wallet.id,
        amount: withdrawalFee
      })
    }
  }

  switch (currency.token) {

    case 'btc':

      amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)

      return await sendBitcoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: fee,
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

    case 'bch':

      amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)

      return await sendBitcoinCashOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: fee,
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

    case 'ltc':

      amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)

      return await sendLitecoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: fee,
        multipleAmounts: sendingAmount,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

    case 'doge':

      amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)

      return await sendDogecoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: fee,
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

    case 'eth':

      try {

        let ethGas = {
          gasLimit: "21000",
          gasPrice: "200",
        }

        networkFee = new BigNumber(ethGas.gasLimit)
          .multipliedBy(ethGas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        amount = new BigNumber(amount).minus(networkFee).toString()

        let sendEth = await sendEthOffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount,
          compliant: false,
          index: 1,
          gasPrice: ethGas.gasPrice.toString(),
          gasLimit: ethGas.gasLimit.toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        }) 
          
        await toDueFeeAccount()

        return sendEth;
      } catch (e) {
        return e
      }

    case 'erc20':

      try {

        let erc20Gas = {
          gasLimit: 21000,
          gasPrice: 50,
        }

        networkFee = new BigNumber(erc20Gas.gasLimit)
          .multipliedBy(erc20Gas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        amount = new BigNumber(amount).minus(networkFee).toString()

        let sendErc20 = await sendEthErc20OffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount,
          compliant: false,
          index: 1,
          gasPrice: erc20Gas.gasPrice.toString(),
          gasLimit: erc20Gas.gasLimit.toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })
          
        await toDueFeeAccount()

        return sendErc20;
      } catch (e) {
        return e
      }

    case 'bsc':
      try {

        let BscGas = {
          gasLimit: 40000,
          gasPrice: 20,
        }

        networkFee = new BigNumber(BscGas.gasLimit)
          .multipliedBy(BscGas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        amount = new BigNumber(amount).minus(networkFee).toString()

        let sendBsc = await sendBscOffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount,
          compliant: false,
          index: 1,
          gasPrice: BscGas.gasPrice.toString(),
          gasLimit: BscGas.gasLimit.toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })
        
        await toDueFeeAccount()

        return sendBsc;

      } catch (e) {

        return e

      }

    case 'ada':
      
      try {
        let adaFee = 0.16;

        amount = parseFloat(amount) - adaFee;

        let sendAda = await sendAdaOffchainTransaction(isTest, {
          senderAccountId: wallet.tat_account_id,
          address: receivingAddress,
          amount: amount.toString(),
          compliant: false,
          fee: adaFee.toString(),
          // index: 0,
          mnemonic: mnemonic,
          xpub: xpub,
          senderNote: Math.random().toString(36).substring(2),
        })

        await toDueFeeAccount()

        return sendAda;
      } catch (e) {
        return e
      }

    case 'trx':

      try {
        let tronFee = 2

        amount = amount - tronFee
  
        let sendTron = await sendTronOffchainTransaction(isTest, {
          senderAccountId: wallet.tat_account_id,
          address: recepiantAddress,
          amount: amount,
          compliant: false,
          fee: tronFee.toString(),
          index: 1,
          mnemonic: mnemonic,
          senderNote: Math.random().toString(36).substring(2),
        })

        await toDueFeeAccount()

        return sendTron;

      } catch (e) {
        return e
      }

    case 'xrp':
      let xrpFromAddress: any = await wallet
        .related('addresses')
        .query()
        .where('derivation_key', 1)
        .first()

      return await sendXrpOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        account: xrpFromAddress.address,
        address: recepiantAddress,
        amount: amount,
        compliant: false,
        sourceTag: memoTag,
        secret: secret,
        senderNote: Math.random().toString(36).substring(2),
      })

    case 'xlm':
      let xlmFromAddress: any = await wallet
        .related('addresses')
        .query()
        .where('derivation_key', 1)
        .first()

      return await sendXlmOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        fromAccount: xlmFromAddress.address,
        address: recepiantAddress,
        amount: amount,
        secret: secret,
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
      })
  }
}

export async function internalAccountToAccountTransfer(
  currency: Currency,
  wallet: Wallet,
  fromAddress: any,
  toAddress: any,
  amount: any,
  fee: any
) {
  let computedFee: any

  switch (currency.token) {
    case 'eth':
    case 'erc20':
    case 'bsc':
      computedFee = new BigNumber(fee.gasLimit)
        .multipliedBy(fee.gasPrice)
        .dividedBy(1000000000000000000)
        .toString()

      amount = new BigNumber(amount).minus(computedFee).toFixed(7).toString()
  }

  let fromAddressData: any = await wallet
    .related('addresses')
    .query()
    .where('address', fromAddress)
    .first()

  const requiredData = {
    senderAccountId: wallet.tat_account_id,
    address: toAddress,
    // multipleAmounts: any,
    amount: amount.toString(),
    compliant: false,
    senderNote: Math.random().toString(36).substring(2),
  }

  const mnemonic: any = decryptEncryption(wallet.mnemonic)
  const xpub: any = decryptEncryption(wallet.xpub)

  const utoxData = {
    fee: fee?.toString(),
    mnemonic,
    xpub,
    index: fromAddressData.derivation_key ?? null,
  }

  const privateKey: any = decryptEncryption(wallet.private_key)

  const ercData = {
    gasPrice: fee?.gasPrice?.toString(),
    gasLimit: fee?.gasLimit?.toString(),
    mnemonic,
    index: fromAddressData?.derivation_key || null,
    privateKey: privateKey || null,
  }

  const secret: any = decryptEncryption(wallet.secret)

  // const secretData = {
  //   account: wallet.address,
  //   secret,
  //   index: fromAddressData.derivation_key,
  // }

  const bscData: any = {
    // gasPrice: fee?.gasPrice?.toString(),
    // gasLimit: fee?.gasLimit?.toString(),
    mnemonic,
    index: fromAddressData?.derivation_key || null,
  }

  const account: any = wallet.related('account').query().first()
  const isTest: boolean = account.environment === 'local' ? true : false

  try {
    switch (currency.token) {
      case 'trx':
        return await sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData })
      // case 'trc10':
      // case 'trc20':
      //   // return await sendTronTrc10Transaction()
      case 'eth':
        return await sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData })
      case 'erc20':
        return await sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData })
        // case 'xrp':
        return await sendXrpOffchainTransaction(isTest, { ...requiredData, ...secretData })
        // case 'xlm':
        return await sendXlmOffchainTransaction(isTest, { ...requiredData, ...secretData })
      case 'bsc':
        let bscTx = await fetch('https://api-eu1.tatum.io/v3/offchain/bsc/transfer', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': Env.get('TATUM_API_KEY'),
          },
          body: JSON.stringify({
            ...requiredData,
            ...bscData,
          }),
        })

        let bscTxRes = await bscTx.json()
        return bscTxRes
      // return await sendBscOffchainTransaction(isTest, { ...requiredData, ...bscData })
      // case 'bnb':
      //   return await sendBnbOffchainTransaction({ ...requiredData, ...ercData })
    }
  } catch (e) {
    console.log(e)
  }
}

export async function getFee(
  currency: Currency,
  fromWallet: Wallet,
  recipientAddress: string,
  amount?: any
) {
  try {
    let fromAddress: any = await fromWallet.related('addresses').query().first()

    switch (currency.tatum_currency) {
      case 'erc20':
      case 'eth':
        return await ethEstimateGas({
          from: fromAddress.address,
          to: recipientAddress,
          amount: amount.toString(),
        })
      case 'bnb':
        return '0.000075'
      case 'bsc':
        return await bscEstimateGas({
          from: fromAddress.address,
          to: recipientAddress,
          amount: amount.toString(),
        })
      case 'vet':
        return await vetEstimateGas({
          from: fromAddress.address,
          to: recipientAddress,
          value: amount.toString(),
        })
      case 'xlm':
        return await xlmGetFee()
      case 'xrp':
        return await xrpGetFee()
      case 'trx':
        return '1'
      case 'btc':
      case 'ltc':
      case 'doge':
        let xpub = decryptEncryption(fromWallet.xpub)

        let estimatedFee = await fetch('https://api-eu1.tatum.io/v3/offchain/blockchain/estimate', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': Env.get('TATUM_API_KEY'),
          },
          body: JSON.stringify({
            senderAccountId: fromWallet.tat_account_id,
            address: recipientAddress,
            amount: amount.toString(),
            xpub: xpub,
          }),
        })

        estimatedFee = await estimatedFee.json()
        // ['slow', 'medium', 'fast']
        return parseFloat(estimatedFee['medium']).toFixed(7)
    }
  } catch (err) {
    console.log(err)
  }
}

export async function accountToAccountTransaction(
  senderAccountId,
  recipientAccountId,
  amount,
  recipientNote
) {
  const a2a = await fetch(`https://api-eu1.tatum.io/v3/ledger/transaction`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': Env.get('TATUM_API_KEY'),
    },
    body: JSON.stringify({
      senderAccountId: senderAccountId,
      recipientAccountId: recipientAccountId,
      amount: amount.toString(),
      anonymous: false,
      compliant: false,
      recipientNote,
      // paymentId: "",
    }),
  })

  return await a2a.json()
}

async function sendBnbOffchainTransaction(body: WithdrawBnbType) {
  const withdrawBnb = await fetch(`https://api-eu1.tatum.io/v3/offchain/bnb/transfer`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.TATUM_API_KEY,
    },
    body: JSON.stringify(body),
  })

  const withdrawBnbResponse = await withdrawBnb.json()

  if (withdrawBnbResponse.status !== 200) {
    throw new Error(withdrawBnbResponse.message)
  }

  return withdrawBnbResponse
}

function decryptEncryption(key) {
  return key
    ? Encryption.child({
        secret: Env.get(`CRYPTO_KEY`),
      }).decrypt(key.toString())
    : null
}
