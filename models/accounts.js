const sequelize = require('./connection')
const Sequelize = require('sequelize')
const bcrypt = require('bcrypt');
const Model = Sequelize.Model

class Account extends Model {}
Account.init({
  username: Sequelize.STRING,
  password: Sequelize.STRING,
  email: {type: Sequelize.STRING, validate : {isEmail: true}, defaultValue: null},
  balance: Sequelize.STRING,
  id: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true},
  accountBalanceId: {type: Sequelize.BIGINT, autoIncrement: true}
}, { sequelize, modelName: 'Account' });

// login methods
Account.prototype.comparePassword = function(candidate, cb) {
    bcrypt.compare(candidate, this.password, function(err, res) {
        if (err) return cb(err);
        return cb(null, res);
      })
  };
// make sure to catch this err when calling create, promisify
Account.addHook('beforeCreate', (account) => {
    return new Promise((resolve, reject) => {
        bcrypt.hash(account.password, 10, function(err, encrypted) {
            if (err) reject(err)
            account.password = encrypted;
            resolve()
        })
    })
  });

  // create table
  Account.sync()


module.exports = Account