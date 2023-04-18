// const Tatum = require('@tatumio/tatum')
import { generateWallet, Currency } from '@tatumio/tatum'

export async function createWallet(currency: string, env: string, mnemonic?: string): Promise<any> {
  const isTest = env === 'local' ? true : false

  currency = currency.toUpperCase()

  try {
    return await generateWallet(Currency[currency], isTest, mnemonic)
  } catch (err) {
    console.log(err)
  }
}
