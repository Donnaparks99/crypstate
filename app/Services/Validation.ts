import Account from 'App/Models/Account'
import Currency from 'App/Models/Currency'

export async function accountNameExist(name: string): Promise<any> {
  try {
    return await Account.findByOrFail('name', name)
  } catch (e) {
    return {
      status: 'failed',
      message: `Account name "${name}" was not found`,
    }
  }
}

export async function currencyExistInDb(currency: string): Promise<any> {
  try {
    return await Currency.findByOrFail('currency', currency)
  } catch (e) {
    return {
      status: 'failed',
      message: `${currency.toUpperCase()} not is not supported`,
    }
  }
}
