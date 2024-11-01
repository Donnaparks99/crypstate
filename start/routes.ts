/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'
import Quote from 'inspirational-quotes'

Route.get('/', async () => {
  return Quote.getQuote()
})

Route.post('/check/fees', 'CheckFeesController.checkFees')
 
//Webhook
Route.post('/tatum/webhook', 'WebhooksController.sendWebhook').as('tatumWebhook')
Route.post('/recreate/subscription', 'WebhooksController.recreateSubscription')
Route.post('/delete/subscription', 'WebhooksController.deleteSubscription')
Route.post('/list/subscription', 'WebhooksController.listSubscription')
Route.post('/create/subscription', 'WebhooksController.createSubscription')

//Account
Route.post('/create/account', 'AccountsController.create').as('createAccount')
Route.post('/all/accounts/balance', 'AccountsController.allAccountsBalance')

//Wallet
Route.post('/create/wallet', 'WalletsController.create').as('createWallet')
Route.post('get/wallet/balance', 'WalletsController.getWalletBalance')
Route.post('get/wallet/transactions', 'WalletsController.getWalletTransactions')

Route.post('generate/mnem/key', 'WalletsController.generateMnemonicKey')
Route.post('dc/mem', 'WalletsController.dcMem')
Route.post('/gen/pkey', 'WalletsController.gpk')

//Address
Route.post('/create/address', 'AddressesController.create')
Route.post('/get/address/balance', 'AddressesController.getAddressBalance')
Route.post('/get/wallet/addresses', 'AddressesController.getWalletAddresses')
Route.post('/address/to/address/transfer', 'TransactionsController.addressToAddressTransfer')

//Transaction
Route.get('/get/withdrawals', 'TransactionsController.getWithdrawals')
// Route.get('/get/deposits', 'TransactionsController.getDeposits')
Route.post('/complete/withdrawal', 'TransactionsController.completeWithdrawal')
Route.post('/cancel/withdrawal', 'TransactionsController.cancelWithdrawal')
Route.post('/withdrawal/broadcast', 'TransactionsController.withdrawalBroadcast')
Route.post('/internal/transfer', 'TransactionsController.internalTransfer')
Route.post('/create/withdrawal/transaction', 'TransactionsController.create').as('createWithdrawal')
Route.post('/get/transaction/reference', 'TransactionsController.getTransactionWithReference')
