const Accounts = require('../models/accounts')
// TODO: make this DRYer
const checkBalance = function(balanceId) {
    return new Promise((resolve, reject) => {
      Accounts.findOne({
        attributes: ['balance'],
        where: {
          accountBalanceId: balanceId
        }
      }).then(res => resolve(res.balance))
      .catch(err => reject(err))
    })
  }

  const checkBalanceUserId = function(userId) {
    return new Promise((resolve, reject) => {
      Accounts.findOne({
        attributes: ['balance'],
        where: {
          id: userId
        }
      }).then(res => resolve(res.balance))
      .catch(err => reject(err))
    })
  }
  
  // TODO: for performance reasons make this use sequelize's increment functionality
  const modifyFunds = function(balanceId, amount) {
    return new Promise((resolve, reject) => {
      checkBalance(balanceId).then(curBal => {
        Accounts.update({
          balance: parseFloat(curBal)+parseFloat(amount)
        }, {
          where: {
            accountBalanceId: balanceId
          }
        }).then(res => resolve(res[0]))
        .catch(err => {throw err})
      }).catch(err => reject(err))
    })
  }

  const modifyFundsUserId = function(userId, newBal) {
    return new Promise((resolve, reject) => {
        Accounts.update({
            balance: newBal
        }, {
            where: {
                id: userId
            }
        }).then(res => resolve(res[0]))
        .catch(err => reject(err))
    })
  }

  module.exports = {
    checkBalance: checkBalance,
    checkBalanceUserId: checkBalanceUserId,
    modifyFunds: modifyFunds,
    modifyFundsUserId: modifyFundsUserId
  }