const sequelize = require('./connection')
const Sequelize = require('sequelize')
const Model = Sequelize.Model

class Pages extends Model {}
Pages.init({
  name: {type: Sequelize.STRING, allowNull: false, validate: {
    len: [1,128]
  }},
  publicKey: {type: Sequelize.STRING, allowNull: false, validate: {
    len: [56]
  }},
  memo: {type: Sequelize.STRING, defaultValue: "no_memo", validate: {
    len: [1,28]
  }},
  description: {type: Sequelize.STRING, allowNull: false, validate: {
    len: [1, 512]
  }},
  email: {type: Sequelize.STRING, validate: {
    isEmail: true,
    len: [1, 128]
  }},
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