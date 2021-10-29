import { BaseCommand } from '@adonisjs/core/build/standalone'

export default class CreateCurrency extends BaseCommand {
  /**
   * Command name is used to run the command
   */
  public static commandName = 'create:currency'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Create currencies available in the array.'

  public static settings = {
    /**
     * Set the following value to true, if you want to load the application
     * before running the command
     */
    loadApp: true,

    /**
     * Set the following value to true, if you want this command to keep running until
     * you manually decide to exit the process
     */
    stayAlive: true,
  }

  public async run() {
    const { default: Currency } = await import('App/Models/Currency')

    let currencies: any = [
      {
        public_name: 'Bitcoin',
        name: 'bitcoin',
        logo: null,
        currency: 'btc',
        tatum_currency: 'btc',
        tx_model: 'utxo',
        type: 'native',
        token: 'btc',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'Bitcoin Cash',
        name: 'bcash',
        logo: null,
        currency: 'bch',
        tatum_currency: 'bch',
        tx_model: 'utxo',
        type: 'native',
        token: 'bch',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'Litecoin',
        name: 'litecoin',
        logo: null,
        currency: 'ltc',
        tatum_currency: 'ltc',
        tx_model: 'utxo',
        type: 'native',
        token: 'ltc',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'Ethereum',
        name: 'ethereum',
        logo: null,
        currency: 'eth',
        tatum_currency: 'eth',
        tx_model: 'account',
        type: 'native',
        token: 'eth',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'USDT',
        name: 'usdt',
        logo: null,
        currency: 'usdt',
        tatum_currency: 'usdt',
        tx_model: 'account',
        type: 'token',
        token: 'erc20',
        derived_from: 'ethereum',
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'USDC',
        name: 'usdc',
        logo: null,
        currency: 'usdc',
        tatum_currency: 'usdc',
        tx_model: 'account',
        type: 'token',
        token: 'erc20',
        derived_from: 'ethereum',
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'Stellar',
        name: 'xlm',
        logo: null,
        currency: 'xlm',
        tatum_currency: 'xlm',
        tx_model: 'account',
        type: 'native',
        token: 'xlm',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 0,
        has_address_xpub: 1,
        has_private_key: 0,
        has_secret: 1,
      },
      {
        public_name: 'Ripple',
        name: 'xrp',
        logo: null,
        currency: 'xrp',
        tatum_currency: 'xrp',
        tx_model: 'account',
        type: 'native',
        token: 'xrp',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 0,
        has_address_xpub: 1,
        has_private_key: 0,
        has_secret: 1,
      },
      {
        public_name: 'Binance Coin',
        name: 'bnb',
        logo: null,
        currency: 'bnb',
        tatum_currency: 'bnb',
        tx_model: 'account',
        type: 'native',
        token: 'bsc',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 0,
        has_address_xpub: 1,
        has_private_key: 0,
        has_secret: 0,
      },
      {
        public_name: 'Tron',
        name: 'tron',
        logo: null,
        currency: 'trx',
        tatum_currency: 'tron',
        tx_model: 'utxo',
        type: 'native',
        token: 'trx',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
      {
        public_name: 'Doge',
        name: 'dogecoin',
        logo: null,
        currency: 'doge',
        tatum_currency: 'doge',
        tx_model: 'utxo',
        type: 'native',
        token: 'doge',
        derived_from: null,
        has_mnemonic: 1,
        has_xpub: 1,
        has_address_xpub: 0,
        has_private_key: 1,
        has_secret: 0,
      },
    ]

    currencies.map(async (currency) => {
      let currencyExists = await Currency.findBy('currency', currency.currency)

      if (currencyExists === null) {
        Currency.create(currency)
        this.logger.info(`${currency.currency} created.`)
      }
    })
  }
}
