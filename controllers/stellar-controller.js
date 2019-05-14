require('dotenv').config()
const rp = require('request-promise')
const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const privateSourceKey = process.env.LOVE_BUTTON_PRIVATE_KEY

const priceCheck = function() {
  return new Promise((resolve, reject) => {
    var options = {
      uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=XLM',
      headers: {
          'X-CMC_PRO_API_KEY': process.env.COIN_MKT_CAP_API_KEY
      },
      json: true // Automatically parses the JSON string in the response
    };
    rp(options)
      .then(function (res) {
          resolve(res.data.XLM.quote.USD.price);
      })
      .catch(function (err) {
          reject(err)
    });
  })
}

const sendPayment = function(destinationId, lumensAmount) {
  return new Promise((resolve, reject) => {
      var sourceKeys = StellarSdk.Keypair.fromSecret(privateSourceKey);
      var transaction;
  
      server.loadAccount(destinationId)
      .catch(err => {
        throw new Error('The destination account does not exist!');
      })
      .then(function() {
        return server.loadAccount(sourceKeys.publicKey());
      })
      .then(function(sourceAccount) {
        transaction = new StellarSdk.TransactionBuilder(sourceAccount)
          .addOperation(StellarSdk.Operation.payment({
            destination: destinationId,
            asset: StellarSdk.Asset.native(),
            amount: lumensAmount
          }))
          .addMemo(StellarSdk.Memo.text('From love-button'))
          .build();
        transaction.sign(sourceKeys);
        return server.submitTransaction(transaction);
      })
      .then(function(result) {
        resolve(result);
      })
      .catch(function(error) {
        reject(error);
      });
    })
}

module.exports = {
  priceCheck: priceCheck,
  sendPayment: sendPayment
}