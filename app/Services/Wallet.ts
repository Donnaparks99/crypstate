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

  const managerWalletAddress = await managerWallet
    ?.related('addresses')
    .query()
    .orderBy('created_at', 'desc')
    .first()

  const isTest: boolean = account.environment === 'local' ? true : false

  let withdrawalFeeType: any = account.withdrawal_fee_type
  let withdrawalFee: any = account.withdrawal_fee
  let managerAddress: any = managerWalletAddress?.address
  let managerAddressMemoTag =
    managerWalletAddress?.destination_tag ??
    managerWalletAddress?.memo ??
    managerWalletAddress?.message
  let networkFee: any = 0

  if (withdrawalFeeType === 'flat') {
    amount = amount - withdrawalFee
  } else if (withdrawalFeeType === 'percentage') {
    withdrawalFee = ((amount * withdrawalFee) / 100).toFixed(8)
    amount = amount - withdrawalFee
  }

  if (fee?.gasPrice) {
    // networkFee = new BigNumber(fee.gasLimit)
    //   .multipliedBy(fee.gasPrice)
    //   .dividedBy(1000000000000000000)
    //   .toFixed(9)
    // amount = (parseFloat(amount) - networkFee).toFixed(8)
  } else {
    amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8)
  }

  // return networkFee

  const mnemonic: any = decryptEncryption(wallet.mnemonic)
  const xpub: any = decryptEncryption(wallet.xpub)
  const secret: any = decryptEncryption(wallet.secret)

  let withdrawalCutWithdrawalAdminFee: any = parseFloat(cutAmount) + parseFloat(withdrawalFee)
  let receivingAddress: any = ''
  let sendingAmount: any = ''
  let totalSendAmount: any = ''

  if (withdrawalCutWithdrawalAdminFee > 0) {
    receivingAddress = recepiantAddress + ',' + managerAddress
    sendingAmount = [amount.toString(), withdrawalCutWithdrawalAdminFee.toString()]
    totalSendAmount = (parseFloat(amount) + withdrawalCutWithdrawalAdminFee).toFixed(8).toString()
  } else {
    receivingAddress = recepiantAddress
    sendingAmount = [amount.toString()]
    totalSendAmount = amount.toString()
  }

  switch (currency.token) {
    case 'btc':
      return await sendBitcoinOffchainTransaction(isTest, {
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

    case 'bch':
      return await sendBitcoinCashOffchainTransaction(isTest, {
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

    case 'ltc':
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
      return await sendDogecoinOffchainTransaction(isTest, {
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

    case 'eth':
      let ethTotalCut: any = 0
      let maitainanceTxData: any = 0

      // if (withdrawalCutWithdrawalAdminFee > 0 && managerWalletAddress) {
      //   console.log('true')
      // } else {
      //   console.log('false')
      // }

      // return

      if (withdrawalCutWithdrawalAdminFee > 0 && managerWalletAddress) {
        let gas = {
          gasLimit: 21000,
          gasPrice: 130,
        }

        maitainanceTxData = await sendEthOffchainTransaction(isTest, {
          address: managerAddress,
          amount: withdrawalCutWithdrawalAdminFee.toFixed(8).toString(),
          compliant: false,
          index: 1,
          gasPrice: gas.gasPrice.toString(),
          gasLimit: gas.gasLimit.toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })

        networkFee = new BigNumber(gas.gasLimit)
          .multipliedBy(gas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        ethTotalCut = parseFloat(withdrawalCutWithdrawalAdminFee) + parseFloat(networkFee)
      }

      let ethGas = {
        gasLimit: 21000,
        gasPrice: 200,
      }

      networkFee = new BigNumber(ethGas.gasLimit)
        .multipliedBy(ethGas.gasPrice)
        .dividedBy(1000000000)
        .toFixed(9)

      amount = new BigNumber(amount).minus(networkFee).minus(ethTotalCut).toString()

      return await sendEthOffchainTransaction(isTest, {
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

    case 'erc20':
      let erc20TotalCut: any = 0

      if (withdrawalCutWithdrawalAdminFee > 0 && managerWalletAddress) {
        let erc20Gas = {
          gasLimit: 21000,
          gasPrice: 20,
        }

        await sendEthErc20OffchainTransaction(isTest, {
          address: managerAddress,
          amount: withdrawalCutWithdrawalAdminFee.toFixed(8).toString(),
          compliant: false,
          index: 1,
          gasPrice: erc20Gas.gasPrice.toString(),
          gasLimit: erc20Gas.gasLimit.toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })

        networkFee = new BigNumber(erc20Gas.gasLimit)
          .multipliedBy(erc20Gas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        erc20TotalCut = parseFloat(withdrawalCutWithdrawalAdminFee) + parseFloat(networkFee)
      }

      let erc20Gas = {
        gasLimit: 21000,
        gasPrice: 50,
      }

      networkFee = new BigNumber(erc20Gas.gasLimit)
        .multipliedBy(erc20Gas.gasPrice)
        .dividedBy(1000000000)
        .toFixed(9)

      amount = new BigNumber(amount).minus(networkFee).minus(erc20TotalCut).toString()

      return await sendEthErc20OffchainTransaction(isTest, {
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

    case 'trx':
      let trxTotalCut: any = 0

      if (withdrawalCutWithdrawalAdminFee > 0 && managerWalletAddress) {
        await sendTronOffchainTransaction(isTest, {
          senderAccountId: wallet.tat_account_id,
          address: managerAddress,
          amount: withdrawalCutWithdrawalAdminFee.toFixed(8).toString(),
          compliant: false,
          fee: '1',
          index: 0,
          mnemonic: mnemonic,
          senderNote: Math.random().toString(36).substring(2),
        })

        trxTotalCut = parseFloat(withdrawalCutWithdrawalAdminFee) + 1
      }

      amount = amount - trxTotalCut - 2

      return await sendTronOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: recepiantAddress,
        amount: amount,
        compliant: false,
        fee: '2',
        index: 1,
        mnemonic: mnemonic,
        senderNote: Math.random().toString(36).substring(2),
      })

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
    case 'bsc':
      return await sendBscOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: recepiantAddress,
        amount: amount,
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
        gasLimit: '40000',
        gasPrice: '20',
        mnemonic: mnemonic,
        index: 1,
      })
    case 'bnb':
      let bnbTotalCut: any = 0

      let privateKey: any = decryptEncryption(wallet.private_key)

      if (withdrawalCutWithdrawalAdminFee > 0 && managerWalletAddress) {
        let bnbGas = {
          gasLimit: 21000,
          gasPrice: 20,
        }

        await sendBnbOffchainTransaction({
          senderAccountId: wallet.tat_account_id,
          address: managerAddress,
          amount: withdrawalCutWithdrawalAdminFee.toFixed(8).toString(),
          compliant: false,
          gasPrice: bnbGas.gasPrice.toString(),
          gasLimit: bnbGas.gasLimit.toString(),
          mnemonic: mnemonic,
          privateKey: privateKey,
          senderNote: Math.random().toString(36).substring(2),
        })

        networkFee = new BigNumber(bnbGas.gasLimit)
          .multipliedBy(bnbGas.gasPrice)
          .dividedBy(1000000000)
          .toFixed(9)

        bnbTotalCut = parseFloat(withdrawalCutWithdrawalAdminFee) + parseFloat(networkFee)
      }

      let bnbGas = {
        gasLimit: 21000,
        gasPrice: 50,
      }

      networkFee = new BigNumber(bnbGas.gasLimit)
        .multipliedBy(bnbGas.gasPrice)
        .dividedBy(1000000000)
        .toFixed(9)

      amount = new BigNumber(amount).minus(networkFee).minus(bnbTotalCut).toString()

      return await sendBnbOffchainTransaction({
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: amount,
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
        gasPrice: bnbGas.gasPrice.toString(),
        gasLimit: bnbGas.gasLimit.toString(),
        mnemonic: mnemonic,
        privateKey: privateKey,
      })
    case 'ada':
      return await sendAdaOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: '0.1',
        // index: 0,
        mnemonic: mnemonic,
        xpub: xpub,
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
