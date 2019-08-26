const sequelize = require('./connection')
const Sequelize = require('sequelize')
const Model = Sequelize.Model

class UnpaidPremiumLinks extends Model {}
UnpaidPremiumLinks.init({
    id: {type: Sequelize.BIGINT, primaryKey: true},
    name: {type: Sequelize.STRING, allowNull: false, validate: {
        len: [1,128]
    }},
    publicKey: {type: Sequelize.STRING, allowNull: false, validate: {
        len: [56]
    }},
    memo: {type: Sequelize.BIGINT},
    description: {type: Sequelize.STRING, allowNull: false, validate: {
        len: [1, 512]
    }},
    email: {type: Sequelize.STRING, validate: {
        isEmail: true,
        len: [1, 128]
    }},
    path: {type: Sequelize.STRING, allowNull: false, validate: {
        len: [1,128]
    }}
}, { indexes: [
    {
      unique: true,
      fields: ['id']
    }
  ], sequelize, modelName: 'UnpaidPremiumLinks' })

UnpaidPremiumLinks.sync()

module.exports = {
  UnpaidPremiumLinks: UnpaidPremiumLinks
}