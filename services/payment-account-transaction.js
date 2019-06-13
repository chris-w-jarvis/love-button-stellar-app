require('dotenv').config()
const stellarController = require('../controllers/stellar-controller')
const sequelize = require('../models/connection')
const Account = require('../models/accounts')

var transactionNumber = 0
const LB_TRANSACTION_FEE = parseFloat(process.env.TRANSACTION_FEE)
const LB_TRANSACTION_FEE_ADDR = process.env.LB_TRANSACTION_FEE_ADDR
const LB_TRANSACTION_FEE_MEMO = process.env.LB_TRANSACTION_FEE_MEMO
const STELLAR_TRANSACTION_FEE = parseFloat(process.env.STELLAR_TRANSACTION_FEE)

let stellarLedgerUrl
if (process.env.RUNTIME_ENV === "TEST") {
    stellarLedgerUrl = 'http://testnet.stellarchain.io/tx/'
} else {
    throw new Error("Need mainnet url")
}

const sendPayment = function(req, res) {
    // check account balance
    const bal = parseFloat(req.user.balance)
    const pmt = parseFloat(req.body.amount)
    console.log('BALANCE BEFORE TRANS:',bal)
    if (bal <= (pmt + LB_TRANSACTION_FEE + STELLAR_TRANSACTION_FEE)) {
        return res.status(400).send({msg: "Not enough money in account"})
    }
            transactionNumber++
            var fee = 0.0
            if (transactionNumber % 10 === 0) {
              fee = LB_TRANSACTION_FEE
            }
            sequelize.transaction(t => {
              return Account.update({
                balance: bal-(pmt+LB_TRANSACTION_FEE+STELLAR_TRANSACTION_FEE)
              }, {
                where: {
                  id: req.user.id
                }
              }, {transaction: t})
              .then(updateRes => {
                  if (updateRes[0] != 1) {
                      res.status(500).send({msg: "Error updating account balance"})
                      throw new Error()
                  }
                  // send payment
                  stellarController.sendPayment(req.body.destination, req.body.amount, req.body.memo)
                  .then(pmtRes => {
                    // successful transaction
                    res.status(201).send({url: `${stellarLedgerUrl}${pmtRes.hash}`})
                    console.log('transactionNumber:',transactionNumber)
                  })
                  .catch(err => {
                      console.log("Transaction failed in Stellar, rolling back")
                      res.status(500).send({msg: "Payment failed in Stellar network"})
                      throw err
                  })
                  // transaction fee
                  if (fee != 0) {
                    stellarController.sendPayment(LB_TRANSACTION_FEE_ADDR, fee, LB_TRANSACTION_FEE_MEMO)
                    .catch((err) => {
                      console.log('Failed on transaction fee for transaction ', transactionNumber, err)
                    })
                  }
              })
          })
}

module.exports = {
    sendPaymentService: sendPayment
}