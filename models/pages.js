const sequelize = require('./connection')
const Sequelize = require('sequelize')
const Model = Sequelize.Model

class Pages extends Model {}
Pages.init({
  name: {type: Sequelize.STRING, allowNull: false},
  publicKey: {type: Sequelize.STRING, allowNull: false},
  memo: {type: Sequelize.STRING, defaultValue: "no_memo"},
  // put index on this
  pageId: {type: Sequelize.STRING, primaryKey: true}
}, { indexes: [
  {
    unique: true,
    fields: ['pageId']
  }
], sequelize, modelName: 'Page' })

// to delete db add as argument {force:true}
Pages.sync({force:true})

module.exports = {
  Pages: Pages
}