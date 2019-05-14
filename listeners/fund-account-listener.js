var StellarSdk = require('stellar-sdk');
const fs = require('fs')
require('dotenv').config()
const path = require('path')   
const filePath = path.join(__dirname, 'lastPagingToken.txt');
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

const accountController = require('../controllers/account-balance-controller')
// Create an API call to query payments involving the account.
var accountId = process.env.LOVE_BUTTON_PUBLIC_ADDRESS;
var payments = server.payments().forAccount(accountId);

// If some payments have already been handled, start the results from the
// last seen payment. (See below in `handlePayment` where it gets saved.)
var lastToken
try {
    lastToken = loadLastPagingToken()
} catch (err) {
    lastToken = null
}
if (lastToken) {
  payments.cursor(lastToken);
}

// `stream` will send each recorded payment, one by one, then keep the
// connection open and continue to send you new payments as they occur.
payments.stream({
  onmessage: function(payment) {
    // Record the paging token so we can start from here next time.
    savePagingToken(payment.paging_token);

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
    console.log(payment)
    // read memo from payment
    payment.transaction().then(res => {
        console.log(res)
        var memoText = res.memo
        // read amount
        const payAmt = payment.amount
        // increase account balance in db
        console.log(`Updating balance in db: memo ${memoText}, amount: ${payAmt}`)
        accountController.modifyFunds(memoText, payAmt)
        .then(res => {
            if (res === 0) {
                // ERROR
                console.log('No account updated, bad accountBalanceId?')
            } else if (res > 1) {
                // BIG ERROR
                console.log(`More than one account updated! Audit for accountBalanceId: ${memoText}`)
            } else {
                // res == 1, what we want
                // send event here or something to show updated balance in ui?
                return
            }
        })
        .catch(err => console.log(err))
    })
  },

  onerror: function(error) {
    console.error(error);
  }
});

function savePagingToken(token) {
  // In most cases, you should save this to a local database or file so that
  // you can load it next time you stream new payments.
  fs.writeFileSync(filePath,`${token}`)
}

function loadLastPagingToken() {
  // Get the last paging token from a local database or file
  return fs.readFileSync(filePath,{ encoding: 'utf8' });
}