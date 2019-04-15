const StellarSdk = require('stellar-sdk');
StellarSdk.Network.useTestNetwork();
var server = new StellarSdk.Server('https://horizon-testnet.stellar.org');

module.exports = {
    sendPaymentToStellar: function(privateSourceKey, destinationId, lumensAmount) {
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
    },
    accountBalance: function(privateSourceKey) {
        return new Promise((resolve, reject) => {
          var sourceKeys = StellarSdk.Keypair.fromSecret(privateSourceKey);
          server.loadAccount(sourceKeys.publicKey()).then(function(account) {
            account.balances.forEach(function(balance) {
              if (balance.asset_type === 'native') resolve(balance.balance)
            })
            // no stellar balance
            resolve('0')
          }).catch(err => reject(err))
        })
      }
}