require('dotenv').config()
const logger = require('../services/winston-logger')
const Sequelize = require('sequelize')
const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
})

sequelize
  .authenticate()
  .then(() => {
    logger.log('info','Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize