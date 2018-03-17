# google-skype-bot
Bot that takes info from spreadsheet &amp; posts it to Skype chat at specific time

***Important!***

You have to save your JWT from Google Developers Console at `./spreadsheets/JWT.json`
Read more about JWT at *http://google.github.io/google-api-nodejs-client/22.2.0/index.html#toc15__anchor*
Don't forget to get proper API keys for Azure & thecatapi as well.

*Note:*
In order to be able to use bot correctly, make sure your `MicrosoftAppId` and `MicrosoftAppPassword` don't have signs like \ + !

After each deplot to Azure need to restart application service

In other case you'll have `Server Error 500` in `Test in Web Chat` window and wouldn't be able to send any message to bot in Skype