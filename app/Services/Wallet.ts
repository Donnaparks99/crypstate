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
  Currency,
  generateDepositAddress
} from '@tatumio/tatum'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'
import fetch from 'node-fetch'
import { BigNumber } from 'bignumber.js'
import ManagerDueFee from 'App/Models/ManagerDueFee'
import { accountNameExist } from './Validation'
import Route from '@ioc:Adonis/Core/Route'
import Cache from 'App/Models/Cache'
import moment from 'moment'
import  CurrencyModel from 'App/Models/Currency'
import Address from 'App/Models/Address'
import TokenTransfer from 'App/Models/TokenTransfer'
import Account from 'App/Models/Account'

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
  fromAdd: null | undefined | string, 
  recepiantAddress: string,
  amount: any,
  fee: any,
  subtractFeeFromAnount: boolean|string,
  memoTag: any,
  withdrawalCommission: any, //cutPercentage
  shouldChargeFee: boolean|string
) {
  const currency: any = await wallet.related('currency').query().first()
  const account: any = await wallet.related('account').query().first()

  let fromAddress: any;


  if(fromAdd) {
    fromAddress = await wallet.related('addresses').query().where('address', fromAdd).first()
    // fromAddressIndex = fromAddress.derivation_key
  } else {
    fromAddress = await wallet.related('addresses').query().where('derivation_key', 1).first()
  }

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

  const mnemonic: any = decryptEncryption(wallet.mnemonic)
  const xpub: any = decryptEncryption(wallet.xpub)
  const secret: any = decryptEncryption(wallet.secret)
  
  let receivingAddress: any = ''
  let multipleAmounts: any = ''
  let totalSendAmount: any = ''

  let exchangeRate: any = fee?.[currency.type]?.['exchangeRate'] ?? fee.exchangeRate

  let blockchainFee = 0;

  if(currency.type === "token") {
    blockchainFee = parseFloat(fee?.token?.feeInToken)
  }

  if(currency.type === "native") {
    blockchainFee = parseFloat(fee.native.fee)
    
  }

  if(subtractFeeFromAnount) {
    amount = (parseFloat(amount) - blockchainFee).toFixed(7)
  }

  let withdrawalFee: any = 0;

  withdrawalCommission = amount * withdrawalCommission / 100;

  if([true, 'true', 'yes'].includes(shouldChargeFee) && (parseFloat(account.withdrawal_fee) > 0 || parseFloat(withdrawalCommission) > 0)) {

    if(account.withdrawal_fee_type === 'flat') {

      withdrawalFee = (parseFloat(account.withdrawal_fee) + parseFloat(withdrawalCommission)).toFixed(8)
      amount = amount - withdrawalFee

    } else if(account.withdrawal_fee_type === 'percentage') {
      
      withdrawalFee = ((amount * (account.withdrawal_fee / 100)) + parseFloat(withdrawalCommission)).toFixed(8)
      amount = amount - withdrawalFee

      amount = Math.floor(amount * Math.pow(10, 8)) / Math.pow(10, 8)
    }

  }

  if( 
    withdrawalFee > 0 && 
    managerAddress) 
  {

    if((exchangeRate * amount) <= parseFloat(Env.get('FEE_FROM_AMOUNT_ABOVE'))) {

      let newSendAmount = (parseFloat(amount) + parseFloat(withdrawalFee)).toFixed(7);
      
      receivingAddress = recepiantAddress
      multipleAmounts = [newSendAmount.toString()]
      totalSendAmount = newSendAmount.toString()

    } else {

      receivingAddress = recepiantAddress + ',' + managerAddress
      multipleAmounts = [
        amount.toString(), 
        withdrawalFee.toString()
      ]
      totalSendAmount = (parseFloat(amount) + parseFloat(withdrawalFee))
      totalSendAmount = (Math.floor(totalSendAmount * Math.pow(10, 8)) / Math.pow(10, 8)).toString()
    }

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
              "webhook_url": Env.get('APP_URL') + '/tatum/webhook'
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
        amount: withdrawalFee, 
        // add fee from address
      })
    }
  }

  let tx: any;

  switch (currency.token) {

    case 'btc':

      tx = await sendBitcoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: blockchainFee.toString(),
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

      break;

    case 'bch':

      tx = await sendBitcoinCashOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        // compliant: false,
        fee: blockchainFee.toString(),
        // multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        // senderNote: Math.random().toString(36).substring(2),
      })

     break;

    case 'ltc':

       tx = await sendLitecoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: blockchainFee.toString(),
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

      break;

    case 'doge':

       tx = await sendDogecoinOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        address: receivingAddress,
        amount: totalSendAmount,
        compliant: false,
        fee: blockchainFee.toString(),
        multipleAmounts: multipleAmounts,
        mnemonic: mnemonic,
        xpub: xpub,
        senderNote: Math.random().toString(36).substring(2),
      })

      break;

    case 'eth':

      try {

        tx = await sendEthOffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount.toString(),
          compliant: false,
          index: fromAddress.derivation_key,
          gasPrice: fee[currency.type]['gasPrice'],
          gasLimit: fee[currency.type]['gasLimit'],
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        }) 
          
        await toDueFeeAccount()

      } catch (e) {

        throw(e)

      }

break;

    case 'erc20':

      try {

        let accountWallets = await Account.query()
          .preload('wallets', (walletQuery) => {
            walletQuery
            .preload('currency')
            .preload('addresses')
          })
          .where('id', wallet.account_id)
          .first()

        let nativeWallet: any = await accountWallets?.wallets.find((wallet) => wallet.currency.currency === "eth")
        let nativeMasterAddress  = nativeWallet.addresses.find((address) => address.derivation_key === 1)
        const nativeMnemonic: any = decryptEncryption(nativeWallet.mnemonic)


        // await TokenTransfer.create({
        //   account_id: wallet.account_id,
        //   wallet_id: wallet.id,
        //   currency_id: wallet.currency_id,
        //   from_address: fromAddress.address,
        //   to_address: recepiantAddress,
        //   network: currency.token,
        //   currency_code: currency.currency,
        //   send_amount: amount.toString(),
        //   native_fee: JSON.stringify(fee.native),
        //   native_fee_status: 'sent',
        //   send_token_status: 'pending',
        //   token_fee: JSON.stringify(fee.token ?? fee),
        //   sent_native_txid: "sendErc20?.txIdddd"
        // })

        // return

        tx = await sendEthErc20OffchainTransaction(isTest, {
          address: fromAddress.address,
          amount: fee.token?.feeInNativeCurrency ?? fee?.feeInNativeCurrency,
          compliant: false,
          index: nativeMasterAddress.derivation_key,
          gasPrice: fee.native?.gasPrice?.toString() ?? fee.gasPrice,
          gasLimit: fee.native?.gasLimit?.toString() ?? fee.gasLimit,
          mnemonic: nativeMnemonic,
          senderAccountId: nativeWallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })

        if(tx?.txId) {

          await TokenTransfer.create({
            account_id: wallet.account_id,
            wallet_id: wallet.id,
            currency_id: wallet.currency_id,
            from_address: fromAddress.address,
            to_address: recepiantAddress,
            network: currency.token,
            currency_code: currency.currency,
            send_amount: amount.toString(),
            native_fee: JSON.stringify(fee.native),
            native_fee_status: 'sent',
            send_token_status: 'pending',
            token_fee: JSON.stringify(fee.token ?? fee),
            sent_native_txid: tx?.txId
          })

        }

        await toDueFeeAccount()

      } catch (e) {

        throw(e)

      }

      break;

    case 'bsc':

      try {

         tx = await sendBscOffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount.toString(),
          compliant: false,
          index: fromAddress.derivation_key,
          gasPrice: fee[currency.type]['gasPrice'].toString(),
          gasLimit: fee[currency.type]['gasLimit'].toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })
        
        await toDueFeeAccount()
      } catch (e) {

        throw(e)

      }

      break;

    case 'bep20':

      try {

        tx = await sendBscOffchainTransaction(isTest, {
          address: recepiantAddress,
          amount: amount.toString(),
          compliant: false,
          index: fromAddress.derivation_key,
          gasPrice: fee[currency.type]['gasPrice'].toString(),
          gasLimit: fee[currency.type]['gasLimit'].toString(),
          mnemonic: mnemonic,
          senderAccountId: wallet.tat_account_id,
          senderNote: Math.random().toString(36).substring(2),
        })
        
        await toDueFeeAccount()

      } catch (e) {

        throw(e)

      }

      break;

    case 'ada':
      
      try {
        let adaFee = 0.16;

        amount = parseFloat(amount) - adaFee;

        tx = await sendAdaOffchainTransaction(isTest, {
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

   
      } catch (e) {
        throw(e)
      }
      break;

    case 'trx':

      try {
        let tronFee = 2

        amount = amount - tronFee
  
        tx = await sendTronOffchainTransaction(isTest, {
          senderAccountId: wallet.tat_account_id,
          address: recepiantAddress,
          amount: amount.toString(),
          compliant: false,
          fee: tronFee.toString(),
          index: fromAddress.derivation_key,
          mnemonic: mnemonic,
          senderNote: Math.random().toString(36).substring(2),
        })

        await toDueFeeAccount()

     

      } catch (e) {
        throw(e)
      }

      break;

    case 'xrp':
      let xrpFromAddress: any = await wallet
        .related('addresses')
        .query()
        .where('derivation_key', 1)
        .first()

      tx = await sendXrpOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        account: xrpFromAddress.address,
        address: recepiantAddress,
        amount: amount.toString(),
        compliant: false,
        sourceTag: memoTag,
        secret: secret,
        senderNote: Math.random().toString(36).substring(2),
      })

      break;

    case 'xlm':
      let xlmFromAddress: any = await wallet
        .related('addresses')
        .query()
        .where('derivation_key', 1)
        .first()

      tx = await sendXlmOffchainTransaction(isTest, {
        senderAccountId: wallet.tat_account_id,
        fromAccount: xlmFromAddress.address,
        address: recepiantAddress,
        amount: amount.toString(),
        secret: secret,
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
      })

      break;
  }

  if(['btc', 'bch', 'ltc', 'doge'].includes(currency.token) && withdrawalFee > 0 && wallet.id !== managerWallet?.id) {
    const newAddress: any = await generateDepositAddress(managerWallet?.tat_account_id!)

    await managerWallet?.related('addresses').create({
      address: newAddress.address,
      derivation_key: newAddress.derivationKey,
      xpub: newAddress.xpub,
      destination_tag: newAddress.destinationTag,
      message: newAddress.message,
      memo: newAddress.memo,
      key: newAddress.key,
    })
  }

  return tx;
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

  let transaction:any;

  try {
    switch (currency.token) {
      case 'trx':
        transaction = await sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData })
        break;
      // case 'trc10':
      // case 'trc20':
      //   // return await sendTronTrc10Transaction()
      case 'eth':
        transaction= await sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData })
        break;
      case 'erc20':
        transaction = await sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData })
        break;
        // case 'xrp':
        transaction = await sendXrpOffchainTransaction(isTest, { ...requiredData, ...secretData })
        break;
        // case 'xlm':
        transaction = await sendXlmOffchainTransaction(isTest, { ...requiredData, ...secretData })
        break;
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
        transaction = bscTxRes
        break;
      // return await sendBscOffchainTransaction(isTest, { ...requiredData, ...bscData })
      // case 'bnb':
      //   return await sendBnbOffchainTransaction({ ...requiredData, ...ercData })
    }

    return transaction;
  } catch (e) {
    console.log(e)
  }
}

export async function getFee(
  currency:any,
  fromAddress: string,
  recipientAddress: string,
  amount?: any,
  fromWallet: any = null,
  contractAddress: string|null|undefined = null, 
) {
  try {

    // let tickerData:any = await Cache.findBy('key', 'price_ticker');
    
    // let ticker: any;

    // if(!tickerData || moment().isAfter(moment(new Date(tickerData?.updatedAt)).add(6, 'minutes'))) {
    //   var newPriceTicker = await fetch('https://api.binance.com/api/v3/ticker/24hr');

    //   ticker = await newPriceTicker.json()

    //   console.log(ticker);

    //   let currenciesModel = await CurrencyModel.query().select(['currency']);

    //   let currencyPairs = await currenciesModel.reduce(function (p, c) {

    //     if(!["USDT", "USDC", "BUSD"].includes(c.currency)) {

    //       return [
    //         ...p,
    //         `${c.currency?.toUpperCase()}USDT`,
    //         `${c.currency?.toUpperCase()}BUSD`
    //       ]

    //     }

    //     return p

    //   }, [])

    //   console.log(ticker);

    //   ticker = ticker?.reduce(function (p, c) {

    //     if(currencyPairs.includes(c.symbol)) {
    //       return [
    //         ...p, 
    //         {
    //           symbol: c.symbol,
    //           lastPrice: c.lastPrice
    //         }
    //       ]
    //     }

    //     return p
    //   }, [])
    // }

    // if(!tickerData) {
    //   await Cache.create({
    //     'key': 'price_ticker',
    //     'value': JSON.stringify(ticker)
    //   })
    // } else {
    //   if(moment().isAfter(moment(new Date(tickerData?.updatedAt)).add(6, 'minutes'))) {
    
    //     tickerData.value = JSON.stringify(ticker);
    //     tickerData.save();
      
    //   } else {
  
    //     ticker = JSON.parse(tickerData?.value)
      
    //   }
    // }

    switch (currency?.token) {
      case 'erc20':
      case 'eth':

        var getFee =  await ethEstimateGas({
          from: fromAddress,
          to: recipientAddress,
          amount: amount.toString(),
          contractAddress
        })
        
        var gasPrice = Math.floor(getFee?.estimations?.standard / Math.pow(10, 9)).toString(); // convert wei to gwei

        var nativeGasLimit = contractAddress ? '21000' : getFee?.gasLimit;
        var tokenGasLimit = contractAddress ? getFee?.gasLimit : '0';

        
        var feeInNativeCurrency = ((parseFloat(nativeGasLimit) * parseFloat(gasPrice)) /  Math.pow(10, 9)).toFixed(8).toString();
        var tokenFeeInNativeCurrency = ((parseFloat(tokenGasLimit) * parseFloat(gasPrice)) /  Math.pow(10, 9)).toFixed(8).toString();

        // var nativeExchangeRate = ticker.find(({ symbol }) =>  symbol === `ETHUSDT`)['lastPrice'];
        var nativeExchangeRate = await getExchangeRate(Currency['ETH'], Fiat['USD'])

        var nativeFeeInUsd = (parseFloat(nativeExchangeRate?.value) * parseFloat(feeInNativeCurrency)).toString()
        var tokenFeeInUsd = (parseFloat(nativeExchangeRate?.value) * parseFloat(tokenFeeInNativeCurrency)).toString()

        var tokenExchangeRate: any = '1';
        var feeInTokenCurrency = '0';
        var token: any = null;
        // var tokenFeeInUsd = '1';

        if(currency.token !== 'eth') {
          token = currency.currency?.toUpperCase();

          if(!["USDT", "USDC", "BUSD"].includes(token)) {
            // tokenExchangeRate = ticker.find(({ symbol }) =>  symbol === `${token}USDT`)['lastPrice']
            tokenExchangeRate = await getExchangeRate(Currency[token.toUpperCase()], Fiat['USD'])
            tokenExchangeRate = tokenExchangeRate?.value
          }

          feeInTokenCurrency = (parseFloat(tokenFeeInUsd) / parseFloat(tokenExchangeRate)).toString()
          tokenFeeInUsd = (parseFloat(feeInTokenCurrency) * parseFloat(tokenExchangeRate)).toString()
        }

        return {
          native: {
            currency: "ETH",
            gasLimit: nativeGasLimit,
            gasPrice: gasPrice,
            fee: feeInNativeCurrency,
            feeInUsd: nativeFeeInUsd,
            exchangeRate: nativeExchangeRate
          },
          token: {
            currency: token,
            gasLimit: tokenGasLimit,
            gasPrice: gasPrice,
            feeInNativeCurrency: tokenFeeInNativeCurrency,
            feeInToken: feeInTokenCurrency,
            feeInUsd: tokenFeeInUsd,
            exchangeRate: tokenExchangeRate
          }
        };

      // case 'bnb':
      //   return '0.000075'

      case 'bsc':
        var getFee = await bscEstimateGas({
          from: fromAddress,
          to: recipientAddress,
          amount: amount.toString(),
          contractAddress
        })

        var gasPrice = Math.floor(getFee?.gasPrice / Math.pow(10, 9)).toString(); // convert wei to gwei

        var nativeGasLimit = contractAddress ? '21000' : getFee?.gasLimit;
        var tokenGasLimit = contractAddress ? getFee?.gasLimit : '0';

        
        var feeInNativeCurrency = ((parseFloat(nativeGasLimit) * parseFloat(gasPrice)) /  Math.pow(10, 9)).toFixed(8).toString();
        var tokenFeeInNativeCurrency = ((parseFloat(tokenGasLimit) * parseFloat(gasPrice)) /  Math.pow(10, 9)).toFixed(8).toString();

        // var nativeExchangeRate = ticker.find(({ symbol }) =>  symbol === `BNBUSDT`)['lastPrice'];
        var nativeExchangeRate = await getExchangeRate(Currency['ETH'], Fiat['USD'])

        var nativeFeeInUsd = (parseFloat(nativeExchangeRate?.value) * parseFloat(feeInNativeCurrency)).toString()
        var tokenFeeInUsd = (parseFloat(nativeExchangeRate?.value) * parseFloat(tokenFeeInNativeCurrency)).toString()

        var tokenExchangeRate: any = '1';
        var feeInTokenCurrency = '0';
        var token: any = '';

        if(currency.token !== 'bsc') {
          token = currency.currency?.toUpperCase();

          if(!["USDT", "USDC", "BUSD"].includes(token)) {
            // tokenExchangeRate = ticker.find(({ symbol }) =>  symbol === `${token}USDT`)['lastPrice']
            tokenExchangeRate = await getExchangeRate(Currency[token.toUpperCase()], Fiat['USD'])
            tokenExchangeRate = tokenExchangeRate?.value
          }

          feeInTokenCurrency = (parseFloat(tokenFeeInUsd) / parseFloat(tokenExchangeRate)).toString()
          tokenFeeInUsd = (parseFloat(feeInTokenCurrency) * parseFloat(tokenExchangeRate)).toString()
        }

        return {
          native: {
            currency: "BNB",
            gasLimit: nativeGasLimit,
            gasPrice: gasPrice,
            fee: feeInNativeCurrency,
            feeInUsd: nativeFeeInUsd,
            exchangeRate: nativeExchangeRate
          },
          token: {
            currency: token,
            gasLimit: tokenGasLimit,
            gasPrice: gasPrice,
            feeInNativeCurrency: tokenFeeInNativeCurrency,
            feeInToken: feeInTokenCurrency,
            feeInUsd: tokenFeeInUsd,
            exchangeRate: tokenExchangeRate
          }
        };

      case 'vet':
        return await vetEstimateGas({
          from: fromAddress,
          to: recipientAddress,
          value: amount.toString(),
        })
      case 'xlm':
        return await xlmGetFee()
      case 'xrp':
        return await xrpGetFee()
      case 'trx':
        // var exchangeRate = ticker.find(({ symbol }) =>  symbol === `${currency.currency?.toUpperCase()}USDT`)['lastPrice'];
        var exchangeRate = await getExchangeRate(Currency[currency.currency?.toUpperCase()], Fiat['USD'])

        return {
          fee: 1,
          feeInUsd: (parseFloat(exchangeRate?.value) * 1).toString(),
          exchangeRate
        }
      case 'bch':
        // var exchangeRate = ticker.find(({ symbol }) =>  symbol === `${currency.currency?.toUpperCase()}USDT`)['lastPrice'];
        var exchangeRate = await getExchangeRate(Currency[currency.currency?.toUpperCase()], Fiat['USD'])

        return {
          fee: 0.0003,
          feeInUsd: (parseFloat(exchangeRate?.value) * 1).toString(),
          exchangeRate
        }
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

        let fee = parseFloat(estimatedFee['medium']).toFixed(7)

        // var baseCurrencyPrice = ticker.find(({ symbol }) =>  symbol === `${currency.currency?.toUpperCase()}USDT`);
        // var exchangeRate = baseCurrencyPrice['lastPrice'];

        var exchangeRate = await getExchangeRate(Currency[currency.currency?.toUpperCase()], Fiat['USD'])


        fee = fee ? fee : '0.0003'
        
        fee = parseFloat(fee) <= 0.0001 ? 0.0003 : fee

        return {
          native: {
            fee,
            feeInUsd: (parseFloat(exchangeRate?.value) * parseFloat(fee)).toString(),
            exchangeRate
          }
        }
    }
  } catch (err) {

    if(err?.response?.status === 400) {

      throw (`Estimate fee : ${err?.response?.data?.message} : ${err?.response?.data?.data}`)

    }

    throw err

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
