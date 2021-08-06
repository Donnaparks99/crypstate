"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountToAccountTransaction = exports.getFee = exports.internalAccountToAccountTransfer = exports.sendCrypto = void 0;
const tatum_1 = require("@tatumio/tatum");
const Env_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Env"));
const Encryption_1 = __importDefault(global[Symbol.for('ioc.use')]("Adonis/Core/Encryption"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const bignumber_js_1 = require("bignumber.js");
async function sendCrypto(wallet, managerWallet, recepiantAddress, amount, fee, memoTag, cutAmount) {
    const currency = await wallet.related('currency').query().first();
    const account = await wallet.related('account').query().first();
    const addresses = await wallet.related('addresses').query().first();
    const isTest = account.environment === 'local' ? true : false;
    let withdrawalFeeType = account.withdrawal_fee_type;
    let withdrawalFee = account.withdrawal_fee;
    if ((managerWallet?.id && wallet.id !== managerWallet?.id && withdrawalFee > 0) ||
        cutAmount > 0) {
        if (withdrawalFee > 0) {
            switch (withdrawalFeeType) {
                case 'flat':
                    amount = amount - withdrawalFee;
                    break;
                case 'percentage':
                    withdrawalFee = ((amount * withdrawalFee) / 100).toFixed(8);
                    amount = amount - withdrawalFee;
                    break;
                default:
                    withdrawalFee = ((amount * 4) / 100).toFixed(8);
                    amount = amount - withdrawalFee;
            }
            await accountToAccountTransaction(wallet.tat_account_id, managerWallet?.tat_account_id, withdrawalFee.toString(), account.name + ' wif');
        }
        if (cutAmount > 0) {
            await accountToAccountTransaction(wallet.tat_account_id, managerWallet?.tat_account_id, cutAmount.toString(), account.name + ' ct');
        }
    }
    if (fee?.gasPrice) {
    }
    else {
        amount = (parseFloat(amount) - parseFloat(fee)).toFixed(8);
    }
    const requiredData = {
        senderAccountId: wallet.tat_account_id,
        address: recepiantAddress,
        amount: amount.toString(),
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
    };
    const mnemonic = decryptEncryption(wallet.mnemonic);
    const xpub = decryptEncryption(wallet.xpub);
    const utoxData = {
        fee: fee?.toString(),
        mnemonic,
        xpub,
        index: addresses.derivation_key ?? null,
    };
    const privateKey = decryptEncryption(wallet.xpub);
    const ercData = {
        gasPrice: fee?.gasPrice?.toString(),
        gasLimit: fee?.gasLimit?.toString(),
        mnemonic,
        index: addresses?.derivation_key || null,
        privateKey: privateKey || null,
        attr: memoTag || null,
    };
    const secret = decryptEncryption(wallet.secret);
    const secretData = {
        account: wallet.address,
        secret,
        index: addresses.derivation_key,
    };
    console.log(amount);
    console.log(fee);
    try {
        switch (currency.token) {
            case 'btc':
                return await tatum_1.sendBitcoinOffchainTransaction(isTest, { ...requiredData, ...utoxData });
            case 'bch':
                return await tatum_1.sendBitcoinCashOffchainTransaction(isTest, { ...requiredData, ...utoxData });
            case 'trx':
                return await tatum_1.sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData });
                return await tatum_1.sendTronTrc10Transaction(isTest, { ...requiredData });
            case 'ltc':
                return await tatum_1.sendLitecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData });
            case 'doge':
                return await tatum_1.sendDogecoinOffchainTransaction(isTest, { ...requiredData, ...utoxData });
            case 'eth':
                return await tatum_1.sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData });
            case 'erc20':
                return await tatum_1.sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData });
            case 'xrp':
                return await tatum_1.sendXrpOffchainTransaction(isTest, { ...requiredData, ...secretData });
            case 'xlm':
                return await tatum_1.sendXlmOffchainTransaction(isTest, { ...requiredData, ...secretData });
            case 'bsc':
                return await tatum_1.sendBscOffchainTransaction(isTest, { ...requiredData, ...ercData });
            case 'bnb':
                return await sendBnbOffchainTransaction({ ...requiredData, ...ercData });
        }
    }
    catch (e) {
        console.log(e);
        if (e?.response?.data) {
            throw new Error(e.response.data.message);
        }
        throw new Error(e.message);
    }
}
exports.sendCrypto = sendCrypto;
async function internalAccountToAccountTransfer(currency, wallet, fromAddress, toAddress, amount, fee) {
    let computedFee;
    switch (currency.token) {
        case 'eth':
        case 'erc20':
        case 'bsc':
            computedFee = new bignumber_js_1.BigNumber(fee.gasLimit)
                .multipliedBy(fee.gasPrice)
                .dividedBy(1000000000000000000)
                .toString();
            amount = new bignumber_js_1.BigNumber(amount).minus(computedFee).toFixed(7).toString();
    }
    let fromAddressData = await wallet
        .related('addresses')
        .query()
        .where('address', fromAddress)
        .first();
    const requiredData = {
        senderAccountId: wallet.tat_account_id,
        address: toAddress,
        amount: amount.toString(),
        compliant: false,
        senderNote: Math.random().toString(36).substring(2),
    };
    const mnemonic = decryptEncryption(wallet.mnemonic);
    const xpub = decryptEncryption(wallet.xpub);
    const utoxData = {
        fee: fee?.toString(),
        mnemonic,
        xpub,
        index: fromAddressData.derivation_key ?? null,
    };
    const privateKey = decryptEncryption(wallet.private_key);
    const ercData = {
        gasPrice: fee?.gasPrice?.toString(),
        gasLimit: fee?.gasLimit?.toString(),
        mnemonic,
        index: fromAddressData?.derivation_key || null,
        privateKey: privateKey || null,
    };
    const bscData = {
        mnemonic,
        index: fromAddressData?.derivation_key || null,
    };
    const account = wallet.related('account').query().first();
    const isTest = account.environment === 'local' ? true : false;
    try {
        switch (currency.token) {
            case 'trx':
                return await tatum_1.sendTronOffchainTransaction(isTest, { ...requiredData, ...utoxData });
            case 'eth':
                return await tatum_1.sendEthOffchainTransaction(isTest, { ...requiredData, ...ercData });
            case 'erc20':
                return await tatum_1.sendEthErc20OffchainTransaction(isTest, { ...requiredData, ...ercData });
            case 'bsc':
                let bscTx = await node_fetch_1.default('https://api-eu1.tatum.io/v3/offchain/bsc/transfer', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'x-api-key': Env_1.default.get('TATUM_API_KEY'),
                    },
                    body: JSON.stringify({
                        ...requiredData,
                        ...bscData,
                    }),
                });
                let bscTxRes = await bscTx.json();
                return bscTxRes;
        }
    }
    catch (e) {
        console.log(e);
    }
}
exports.internalAccountToAccountTransfer = internalAccountToAccountTransfer;
async function getFee(currency, fromWallet, recipientAddress, amount) {
    try {
        let fromAddress = await fromWallet.related('addresses').query().first();
        switch (currency.tatum_currency) {
            case 'erc20':
            case 'eth':
                return await tatum_1.ethEstimateGas({
                    from: fromAddress.address,
                    to: recipientAddress,
                    amount: amount.toString(),
                });
            case 'bnb':
                return '0.000075';
            case 'bsc':
                return await tatum_1.bscEstimateGas({
                    from: fromAddress.address,
                    to: recipientAddress,
                    amount: amount.toString(),
                });
            case 'vet':
                return await tatum_1.vetEstimateGas({
                    from: fromAddress.address,
                    to: recipientAddress,
                    value: amount.toString(),
                });
            case 'xlm':
                return await tatum_1.xlmGetFee();
            case 'xrp':
                return await tatum_1.xrpGetFee();
            case 'trx':
                return '1';
            case 'btc':
            case 'ltc':
            case 'doge':
                let xpub = decryptEncryption(fromWallet.xpub);
                let estimatedFee = await node_fetch_1.default('https://api-eu1.tatum.io/v3/offchain/blockchain/estimate', {
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json',
                        'x-api-key': Env_1.default.get('TATUM_API_KEY'),
                    },
                    body: JSON.stringify({
                        senderAccountId: fromWallet.tat_account_id,
                        address: recipientAddress,
                        amount: amount.toString(),
                        xpub: xpub,
                    }),
                });
                estimatedFee = await estimatedFee.json();
                return parseFloat(estimatedFee['medium']).toFixed(7);
        }
    }
    catch (err) {
        console.log(err);
    }
}
exports.getFee = getFee;
async function accountToAccountTransaction(senderAccountId, recipientAccountId, amount, recipientNote) {
    const a2a = await node_fetch_1.default(`https://api-eu1.tatum.io/v3/ledger/transaction`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': Env_1.default.get('TATUM_API_KEY'),
        },
        body: JSON.stringify({
            senderAccountId: senderAccountId,
            recipientAccountId: recipientAccountId,
            amount: amount.toString(),
            anonymous: false,
            compliant: false,
            recipientNote,
        }),
    });
    return await a2a.json();
}
exports.accountToAccountTransaction = accountToAccountTransaction;
async function sendBnbOffchainTransaction(body) {
    const withdrawBnb = await node_fetch_1.default(`https://api-eu1.tatum.io/v3/offchain/bnb/transfer`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': process.env.TATUM_API_KEY,
        },
        body: JSON.stringify(body),
    });
    const withdrawBnbResponse = await withdrawBnb.json();
    if (withdrawBnbResponse.status !== 200) {
        throw new Error(withdrawBnbResponse.message);
    }
    return withdrawBnbResponse;
}
function decryptEncryption(key) {
    return key
        ? Encryption_1.default.child({
            secret: Env_1.default.get(`CRYPTO_KEY`),
        }).decrypt(key.toString())
        : null;
}
//# sourceMappingURL=Wallet.js.map