const sequelize = require('./connection')
const Sequelize = require('sequelize')

const Pages = sequelize.define('Pages', {
  name: {type: Sequelize.STRING, allowNull: false},
  publicKey: {type: Sequelize.STRING, allowNull: false},
  memo: Sequelize.STRING,
  // put index on this
  pageId: {type: Sequelize.STRING, primaryKey: true}
})

// to delete db add as argument {force:true}
Pages.sync()

module.exports = {
  Pages: Pages
}