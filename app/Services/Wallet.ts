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
} from '@tatumio/tatum'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'
import Currency from 'App/Models/Currency'
import fetch from 'node-fetch'
import { BigNumber } from 'bignumber.js'

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
  cutAmount: any
) {
  const currency: any = await wallet.related('currency').query().first()
  const account: any = await wallet.related('account').query().first()
  const addresses: any = await wallet.related('addresses').query().first()

  const isTest: boolean = account.environment === 'local' ? true : false

  let withdrawalFeeType: any = account.withdrawal_fee_type
  let withdrawalFee: any = account.withdrawal_fee

  if (
    (managerWallet?.id && wallet.id !== managerWallet?.id && withdrawalFee > 0) ||
    cutAmount > 0
  ) {
    if (withdrawalFee > 0) {
      switch (withdrawalFeeType) {
        case 'flat':
          amount = amount - withdrawalFee
          break
        case 'percentage':
          withdrawalFee = ((amount * withdrawalFee) / 100).toFixed(8)
          amount = amount - withdrawalFee
          break
        default:
          withdrawalFee = ((amount * 4) / 100).toFixed(8)
          amount = amount - withdrawalFee
      }

      await accountToAccountTransaction(
        wallet.tat_account_id,
        managerWallet?.tat_account_id,
        withdrawalFee.toString(),
        account.name + ' wif'
      )
    }

    if (cutAmount > 0) {
      await accountToAccountTransaction(
        wallet.tat_account_id,
        managerWallet?.tat_account_id,
        cutAmount.toString(),
        account.name + ' ct'
      )
    }
  }

  if (fee?.gasPrice) {
  } else {
    amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)
  }

  const requiredData = {
    senderAccountId: wallet.tat_account_id,
    address: recepiantAddress,
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
    index: addresses.derivation_key ?? null,
  }

  const privateKey: any = decryptEncryption(wallet.xpub)
  const ercData = {
    gasPrice: fee?.gasPrice?.toString(),
    gasLimit: fee?.gasLimit?.toString(),
    mnemonic,
    index: addresses?.derivation_key || null,
    privateKey: privateKey || null,
    attr: memoTag || null,
  }

  const secret: any = decryptEncryption(wallet.secret)

  const secretData = {
    account: wallet.address,
    secret,
    index: addresses.derivation_key,
  }

  console.log(amount)
  console.log(fee)

  try {
    switch (currency.token) {
      case 'btc':
        return await sendBitcoinOffchainTransaction(isTest, { ...requiredData, ...utoxData })
      case 'bch':
        return await sendBitcoinCashOffchainTransaction(isTest, { ...requiredData, ...utoxData })
      case 'trx':
        return await sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData })
        // case 'trc10':
        // case 'trc20':
        return await sendTronTrc10Transaction(isTest, { ...requiredData })
      case 'ltc':
        return await sendLitecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData })
      case 'doge':
        return await sendDogecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData })
      case 'eth':
        return await sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData })
      case 'erc20':
        return await sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData })
      case 'xrp':
        return await sendXrpOffchainTransaction(isTest, { ...requiredData, ...secretData })
      case 'xlm':
        return await sendXlmOffchainTransaction(isTest, { ...requiredData, ...secretData })
      case 'bsc':
        return await sendBscOffchainTransaction(isTest, { ...requiredData, ...ercData })
      case 'bnb':
        return await sendBnbOffchainTransaction({ ...requiredData, ...ercData })
    }
  } catch (e) {
    console.log(e)
    if (e?.response?.data) {
      throw new Error(e.response.data.message)
    }

    throw new Error(e.message)
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
      //   return await sendXrpOffchainTransaction(isTest, { ...requiredData, ...secretData })
      // case 'xlm':
      //   return await sendXlmOffchainTransaction(isTest, { ...requiredData, ...secretData })
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
      amount: amount,
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
