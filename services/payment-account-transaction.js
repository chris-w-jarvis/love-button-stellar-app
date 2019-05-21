require('dotenv').config()
const stellarController = require('../controllers/stellar-controller')
const sequelize = require('../models/connection')
const Account = require('../models/accounts')

let stellarLedgerUrl
if (process.env.RUNTIME_ENV === "TEST") {
    stellarLedgerUrl = 'http://testnet.stellarchain.io/tx/'
} else {
    throw new Error("Need mainnet url")
}

const sendPayment = function(req, res) {
    sequelize.transaction(t => {
        return Account.findOne({
            attributes: ['balance'],
            where: {
              id: req.user.id
            }
          }, {transaction: t})
          .then(balance => {
              // check account balance
            const bal = parseFloat(balance.balance)
            const pmt = parseFloat(req.body.amount)
            if (bal <= pmt) {
                res.status(400).send({msg: "Not enough money in account"})
                throw new Error()
            }
            return Account.update({
                balance: bal-pmt
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
                  stellarController.sendPayment(req.body.destination, req.body.amount)
                  .then(pmtRes => {
                    // successful transaction
                    res.status(201).send({url: `${stellarLedgerUrl}${pmtRes.hash}`})
                  })
                  .catch(err => {
                      console.log("Transaction failed in Stellar, rolling back")
                      throw err
                  })
              })
          })
    })
}

module.exports = {
    sendPaymentService: sendPayment
}