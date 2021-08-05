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
import Currency from 'App/Models/Currency'

export async function sendTransaction(data) {
  switch (data.currency.token) {
    case 'btc':
      return await sendBitcoinOffchainTransaction(isTest, {
        senderAccountId: data.senderAccountId,
        address: data.address,
        amount: data.amount,
        compliant: false,
        senderNote: data.senderNote,
        fee: data.fee,
        mnemonic: data.mnemonic,
        xpub: data.xpub,
      })
    case 'bch':
      return await sendBitcoinCashOffchainTransaction(isTest, { ...requiredData, ...utoxData })
    case 'trx':
      return await sendTronOffchainTransaction(isTest, {
        senderAccountId: data.senderAccountId,
        address: data.address,
        amount: data.amount,
        compliant: false,
        senderNote: data.senderNote,
        fee: data.fee,
        mnemonic: data.mnemonic,
        xpub: data.xpub,
        index: addresses.derivation_key ?? null,
      })
    // case 'trc10':
    // case 'trc20':
    // return await sendTronTrc10Transaction()
    // case 'ltc':
    //   return await sendLitecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData })
    // case 'doge':
    //   return await sendDogecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData })
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

      console.log(bscTxRes)
    // return await sendBscOffchainTransaction(isTest, { ...requiredData, ...bscData })
    // case 'bnb':
    //   return await sendBnbOffchainTransaction({ ...requiredData, ...ercData })
  }
}
