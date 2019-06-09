const sequelize = require('./connection')
const Sequelize = require('sequelize')
const Model = Sequelize.Model

class AccountRecovery extends Model {}
AccountRecovery.init({
  email: {type: Sequelize.STRING, primaryKey: true},
  token: {type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4}
}, { sequelize, modelName: 'AccountRecovery' });

  // create table
  AccountRecovery.sync()


module.exports = AccountRecovery