import { BaseCommand } from '@adonisjs/core/build/standalone'
import { getFee, sendCrypto } from 'App/Services/Wallet'

export default class SendDepositToMasterAddress extends BaseCommand {

  /**
   * Command name is used to run the command
   */
  public static commandName = 'send_deposit:to_master'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = 'Send deposits in an account to master address.'

  /// Cron job of this is runing ace file 

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

    const { default: Wallet } = await import('App/Models/Wallet')
    const { default: MasterAddressDeposit } = await import('App/Models/MasterAddressDeposit')

    const pendingMasterDeposits:any = await MasterAddressDeposit
      .query()
      .preload('account')
      .preload('wallet')
      .preload('currency')
      .where('status', 'pending')

    for(var i = 0; i <= pendingMasterDeposits.length; i++) {

      let pendingDeposit = await pendingMasterDeposits[i]

      if(pendingDeposit) {
        try {

          let fee:any = await getFee(
            pendingDeposit?.currency, 
            pendingDeposit?.from_address,
            pendingDeposit?.to_address, 
            pendingDeposit?.amount,
            pendingDeposit?.wallet,
            pendingDeposit?.currency?.contract_address
          )
  
          if(["ERC20", "BEP20", "TRC20"].includes(pendingDeposit?.token) && pendingDeposit.fee_deposit_status === null) {
    
            let nativeCurrency = "";
  
            switch(pendingDeposit.token) {
              case "ERC20":
                nativeCurrency = "eth";
              break;
              case "BEP20":
                nativeCurrency = "bsc";
              break;
              case "TRC20":
                nativeCurrency = "tron";
              break;
            }
  
            let nativeWallet:any = await Wallet
              .query().where("account_id", pendingDeposit?.account_id)
              .preload('currency')
              .whereHas('currency', (curr) => {
                curr.where('tatum_currency', nativeCurrency)
              }).first()
  
            // send native currency as fee from master address to from address
            let sendFee:any = await sendCrypto(
              nativeWallet,
              null,
              undefined,
              pendingDeposit?.from_address,
              fee.token.feeInNativeCurrency,
              fee,
              false, // subtract fee from amount
              "", // memo, tag
              0, // cutPercentage
              false // shouldChargeFee
            )
  
            if(sendFee.id) {
    
              pendingDeposit.fee_deposit_txid = sendFee.txId;
              pendingDeposit.fee_deposit_status = "sent";
              pendingDeposit.fee_deposit_amount = JSON.stringify(fee.token);
              await pendingDeposit.save();
    
            }
  
          } else {
  
            let send:any = await sendCrypto(
              pendingDeposit.wallet,
              null,
              pendingDeposit.from_address,
              pendingDeposit.to_address,
              pendingDeposit.amount,
              JSON.parse(pendingDeposit.fee_deposit_amount) ?? fee,
              ["ERC20", "BEP20", "TRC20"].includes(pendingDeposit?.token) ? false : true, // subtract fee from amount
              "", // memo, tag
              0, // cutPercentage
              false // shouldChargeFee
            )
  
            pendingDeposit.misc = JSON.stringify(fee.native);
    
            if(send.id) {
    
              pendingDeposit.status = "sent";
              pendingDeposit.withdrawal_txid = send.txId;
              await pendingDeposit.save();
    
            }
    
          }
  
        } catch (err) {
  
          console.log(err);
  
          if(err?.response?.status === 403) {
            pendingDeposit.fail_reason = err?.response?.data?.message;
            await pendingDeposit.save();
          }
          
        }
      }

    }

    this.logger.info('Done')
    await this.exit()
  }
}
