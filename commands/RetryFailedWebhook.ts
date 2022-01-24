import { BaseCommand } from '@adonisjs/core/build/standalone'
import FailedWebhookRequest from 'App/Models/FailedWebhookRequest'
import Wallet from 'App/Models/Wallet'
import fetch from 'node-fetch'

export default class RetryFailedWebhook extends BaseCommand {

  /**
   * Command name is used to run the command
   */
  public static commandName = 'failed:webhook'

  /**
   * Command description is displayed in the "help" output
   */
  public static description = ''

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
    stayAlive: false,
  }

  public async run () {
    let failedHook = await FailedWebhookRequest.all()

    for(let i = 0; i < failedHook?.length; i++) {

      const wallet: any = await Wallet.query().where('id', failedHook[i].wallet_id).first()
      const account: any = await wallet?.related('account').query().first()
      let webhookEndpoint = account?.url + account?.webhook_endpoint
  
      try {
        let sendWebhookRequest = await fetch(webhookEndpoint, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: failedHook[i].request_body,
        })
  
        // let sendWebhookResponse = 
        await sendWebhookRequest.json()
  
        await FailedWebhookRequest.query().where("id", failedHook[i].id).delete()

      } catch (err) {

        await FailedWebhookRequest.query().where("id", failedHook[i].id).update({"fail_reason": err.message})

      }
    }
  }
}
