require('dotenv').config()
const stellarController = require('../controllers/stellar-controller')
const countersController = require('../controllers/counters-controller')
const sequelize = require('../models/connection')
const Account = require('../models/accounts')
const logger = require('../services/winston-logger')

var transactionNumber
countersController.incrTransactionNumber()
  .then(tr => transactionNumber = tr-1)
  .catch(err => {
    logger.log('info',"Error loading transaction number from redis: "+err)
    transactionNumber = 0
  })
// const LB_TRANSACTION_FEE = parseFloat(process.env.TRANSACTION_FEE)
// const LB_TRANSACTION_FEE_ADDR = process.env.LB_TRANSACTION_FEE_ADDR
// const LB_TRANSACTION_FEE_MEMO = process.env.LB_TRANSACTION_FEE_MEMO
const STELLAR_TRANSACTION_FEE = parseFloat(process.env.STELLAR_TRANSACTION_FEE)

let stellarLedgerUrl
if (process.env.LOVE_BUTTON_RUNTIME_ENV === 'PROD') {
  stellarLedgerUrl = 'http://stellarchain.io/tx/'
} else {
  stellarLedgerUrl = 'http://testnet.stellarchain.io/tx/'
}

const sendPayment = function(req, res) {
    // check account balance
    const bal = parseFloat(req.user.balance)
    const pmt = parseFloat(req.body.amount)-STELLAR_TRANSACTION_FEE
    if (bal <= (pmt)) {
      return res.status(400).send({msg: "Not enough money in account"})
    }
    if (pmt.toFixed(7) <= 0) {
      return res.status(400).send({msg: "This payment is too small to send, including the Stellar network's .00001 "+
    "xlm transaction fee, the transaction amount becomes <= 0"})
    }
    // if (bal <= (pmt + LB_TRANSACTION_FEE + STELLAR_TRANSACTION_FEE)) {
    //     return res.status(400).send({msg: "Not enough money in account"})
    // }
    // var fee = 0.0
    // if (transactionNumber % 10 == 0) {
    //   fee = LB_TRANSACTION_FEE
    // }

    return sequelize.transaction(t => {

      // chain all your queries here. make sure you return them.
      return Account.update({
        // this is a bug lol
        // balance: bal-(pmt+LB_TRANSACTION_FEE+STELLAR_TRANSACTION_FEE)
        balance: bal-(pmt+STELLAR_TRANSACTION_FEE)
      }, {where: {
        id: req.user.id
      }, transaction: t})
        .then(updateResult => {
          if (updateResult[0] != 1) {
            res.status(500).send({msg: "Error updating account balance"})
            throw new Error()
          }
          // send payment
          return stellarController.sendPayment(req.body.destination, pmt.toFixed(7).toString(), req.body.memo)
          .then(pmtRes => {
            // successful transaction
            res.status(201).send({url: `${stellarLedgerUrl}${pmtRes.hash}`})
            // transaction fee
            // if (fee != 0) {
            //   stellarController.sendPayment(LB_TRANSACTION_FEE_ADDR, fee+"0", LB_TRANSACTION_FEE_MEMO)
            //   .catch((err) => {
            //     logger.log('info','Failed on transaction fee for transaction '+ transactionNumber +err)
            //   })
            // }
          })
          .catch(err => {
            res.status(400).send({msg: `Payment failed in Stellar network, does the address exist and is that account funded?`})
            // transaction fee
            // if (fee != 0) {
            //   stellarController.sendPayment(LB_TRANSACTION_FEE_ADDR, fee+"0", LB_TRANSACTION_FEE_MEMO)
            //   .catch((err) => {
            //     logger.log('info','Failed on transaction fee for transaction '+ transactionNumber+ err)
            //   })
            // }
            throw err
          })
        });
    }).then(() => {
      logger.log('info','transactionNumber '+transactionNumber+ ' committed.')
      countersController.incrTransactionNumber()
        .then(tr => transactionNumber = tr)
        .catch(err => {
          logger.log('info',"Error loading transaction number from redis: "+err)
          transactionNumber++
        })
    })
    .catch(err => {
      logger.log('info','transactionNumber '+transactionNumber+ ' failed: '+ err)
      countersController.incrTransactionNumber()
        .then(tr => transactionNumber = tr)
        .catch(err => {
          logger.log('info',"Error loading transaction number from redis: "+err)
          transactionNumber++
        })
      // Transaction has been rolled back
      // err is whatever rejected the promise chain returned to the transaction callback
    });
}

module.exports = {
    sendPaymentService: sendPayment
}