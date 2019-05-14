require('dotenv').config()
const Sequelize = require('sequelize')
const sequelize = new Sequelize(process.env.LOCAL_DB_URL, {
    dialect: 'postgres'
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize