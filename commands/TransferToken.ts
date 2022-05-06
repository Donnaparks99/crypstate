import { BaseCommand } from '@adonisjs/core/build/standalone'
import { sendEthErc20OffchainTransaction } from '@tatumio/tatum'
import { getFee, sendCrypto } from 'App/Services/Wallet'
import Env from '@ioc:Adonis/Core/Env'
import Encryption from '@ioc:Adonis/Core/Encryption'

export default class TransferToken extends BaseCommand {

  /**
   * Command name is used to run the command
   */
  public static commandName = 'transfer:token'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Transfer tokens that has native currency to pay for fees'

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

  public async run () {

    const { default: TokenTransfer } = await import('App/Models/TokenTransfer')

    const pendingTransfers:any = await TokenTransfer
      .query()
      .preload('account')
      .preload('wallet')
      .preload('currency')
      .where('native_fee_status', 'sent')
      .where('send_token_status', 'pending')

    for(var i = 0; i <= pendingTransfers.length; i++) {

      let pendingTransfer = await pendingTransfers[i]

      if(pendingTransfer) {

        try {

          const isTest: boolean = pendingTransfer.account.environment === 'local' ? true : false
          
          const mnemonic: any = Encryption.child({
            secret: Env.get(`CRYPTO_KEY`),
          }).decrypt(pendingTransfer.wallet.mnemonic.toString())

          let fee =  JSON.parse(pendingTransfer.token_fee)

          let sendToken = await sendEthErc20OffchainTransaction(isTest, {
            address: pendingTransfer.to_address,
            amount: pendingTransfer.send_amount,
            compliant: false,
            index: 1,
            gasPrice: fee.gasPrice.toString(),
            gasLimit: fee.gasLimit.toString(),
            mnemonic: mnemonic,
            senderAccountId: pendingTransfer.wallet.tat_account_id,
            senderNote: Math.random().toString(36).substring(2),
          })

          if(sendToken.id) {

            pendingTransfer.sent_token_txid = sendToken.txId;
            pendingTransfer.send_token_status = 'sent';
            await pendingTransfer.save()
  
          }

        } catch (err) {
          console.log(err?.response?.data ?? err);
        }
        
      }

    }

    this.logger.info('Done')
    await this.exit()
  }
}
