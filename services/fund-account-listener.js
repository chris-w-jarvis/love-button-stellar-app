var StellarSdk = require('stellar-sdk');
const logger = require('./winston-logger')
require('dotenv').config() 
//const filePath = path.join(__dirname, 'lastPagingToken.txt');
// configure stellar network connection
var server
if (process.env.LOVE_BUTTON_RUNTIME_ENV === 'PROD') {
  server = new StellarSdk.Server('https://horizon.stellar.org')
} else {
  server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
}

const accountController = require('../controllers/account-controller')
const countersController = require('../controllers/counters-controller')
const premiumLinkController = require('../controllers/premium-link-controller')
const premiumPrice = parseFloat(process.env.PREMIUM_ACCOUNT_PRICE)
// Create an API call to query payments involving the account.
var accountId = process.env.LOVE_BUTTON_PUBLIC_ADDRESS;
var payments = server.payments().forAccount(accountId);

// If some payments have already been handled, start the results from the
// last seen payment. (See below in `handlePayment` where it gets saved.)
countersController.readPagingToken()
  .then(lastToken => {
  payments.cursor(lastToken);

// `stream` will send each recorded payment, one by one, then keep the
// connection open and continue to send you new payments as they occur.
payments.stream({
  onmessage: function(payment) {
    // Record the paging token so we can start from here next time.
    countersController.writePagingToken(payment.paging_token)
    .then()
    .catch(err => logger.log('info','Error writing paging token: '+ err))

    // The payments stream includes both sent and received payments. We only
    // want to process received payments here.
    if (payment.to !== accountId) {
      return;
    }

    // // In Stellar’s API, Lumens are referred to as the “native” type. Other
    // // asset types have more detailed information.
    // var asset;
    // if (payment.asset_type === 'native') {
    //   asset = 'lumens';
    // }
    // else {
    //   asset = payment.asset_code + ':' + payment.asset_issuer;
    // }
    if (payment.asset_type != 'native') return
    // read memo from payment
    payment.transaction().then(transaction => {
        var memoText = transaction.memo
        // read amount
        const payAmt = payment.amount

        // check if they are buying a premium link
        if ((parseFloat(amt)+.5) > premiumPrice) {
          premiumLinkController.buyingPremiumLink(memoText)
            .then(premRes => {
              if (premRes) {
                premiumLinkController.fundPremiumLink(memoText)
                  .then( paid => {
                    logger.log('info','Premium link purchased: give/'+paid.path)
                  })
                  .catch(err => logger.log('info',err))
              } else {
                // just update their balance
                accountController.modifyFunds(memoText, payAmt)
                  .then(res => {
                      if (res === 0) {
                          logger.log('info','No account updated, bad id?')
                      } else if (res > 1) {
                          logger.log('info',`More than one account updated! Audit for id: ${memoText}`)
                      } else {
                          return
                      }
                  })
                  .catch(err => logger.log('info',err))
              }
            })
            .catch((err) => {
              logger.log('info', err)
            })
        } else {
        // increase account balance in db
        accountController.modifyFunds(memoText, payAmt)
        .then(res => {
            if (res === 0) {
                // ERROR
                logger.log('info','No account updated, bad id?')
            } else if (res > 1) {
                // BIG ERROR
                logger.log('info',`More than one account updated! Audit for id: ${memoText}`)
            } else {
                // res == 1, what we want
                // send event here or something to show updated balance in ui?
                return
            }
        })
        .catch(err => logger.log('info',err))
      }
    })
  },

  onerror: function(error) {
    logger.log('info',error);
  }
});
  })

// function savePagingToken(token) {
//   // In most cases, you should save this to a local database or file so that
//   // you can load it next time you stream new payments.
//   fs.writeFileSync(filePath,`${token}`)
// }

// function loadLastPagingToken() {
//   // Get the last paging token from a local database or file
//   return fs.readFileSync(filePath,{ encoding: 'utf8' });
// }