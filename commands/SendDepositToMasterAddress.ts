import { BaseCommand } from '@adonisjs/core/build/standalone'
import Currency from 'App/Models/Currency'
import Wallet from 'App/Models/Wallet'
import { getFee, sendCrypto } from 'App/Services/Wallet'
import NodeCache from 'node-cache'

export default class SendDepositToMasterAddress extends BaseCommand {

  /**
   * Command name is used to run the command
   */
  public static commandName = 'send_deposit:to_master'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Send deposits in an account to master address.'

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

    const { default: MasterAddressDeposit } = await import('App/Models/MasterAddressDeposit')

    const pendingMasterDeposits:any = await MasterAddressDeposit
      .query()
      .preload('account')
      .preload('wallet')
      .preload('currency')
      .where('status', 'pending')

    for(var i = 0; i <= pendingMasterDeposits.length; i++) {

      let pendingDeposit = pendingMasterDeposits[i]

      try {

        let fee:any = await getFee(
          pendingDeposit.currency, 
          pendingDeposit.wallet,
          pendingDeposit.to_address, 
          pendingDeposit.amount
        )

        // await this.exit()
        // return 

        if(["ERC20", "BEP20", "TRC20"].includes(pendingDeposit.token)) {

          let baseCurrency = await Currency.findBy('name', pendingDeposit.currency.derived_from)

        
          console.log(baseCurrency);


          await this.exit()

        }

        let send:any = await sendCrypto(
          pendingDeposit.wallet,
          null,
          pendingDeposit.from_address,
          pendingDeposit.to_address,
          pendingDeposit.amount,
          fee,
          "", // memo, tag
          0, // cutPercentage
          false // shouldChargeFee
        )

        pendingDeposit.misc = JSON.stringify(fee);

        if(send.id) {

          pendingDeposit.status = "sent";
          pendingDeposit.withdrawal_txid = send.txId;
          await pendingDeposit.save();

        }

      } catch (err) {

        if(err?.response?.status === 403) {
          pendingDeposit.fail_reason = err?.response?.data?.message;
          await pendingDeposit.save();
        }
        
      }

    }

    this.logger.info('Done')
    await this.exit()
  }
}
