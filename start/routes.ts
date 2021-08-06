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

//Webhook
Route.post('/tatum/webhook', 'WebhooksController.index').as('tatumWebhook')

//Account
Route.post('/create/account', 'AccountsController.create')

//Wallet
Route.post('/create/wallet', 'WalletsController.create')
Route.post('get/wallet/balance', 'WalletsController.getWalletBalance')
Route.post('get/wallet/transactions', 'WalletsController.getWalletTransactions')

//Address
Route.post('/create/address', 'AddressesController.create')

//Transaction
Route.post('/internal/transfer', 'TransactionsController.internalTransfer')
Route.post('/create/withdrawal/transaction', 'TransactionsController.create')
Route.post('/get/transaction/reference', 'TransactionsController.getTransactionWithReference')