require('dotenv').config()
const logger = require('../services/winston-logger')
const Sequelize = require('sequelize')
const env = process.env.LOVE_BUTTON_RUNTIME_ENV
var sequelize
if (env === "PROD") {
  sequelize = new Sequelize(process.env.HEROKU_POSTGRESQL_PURPLE_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: true
    },
    logging: false
  })
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: true
  })
}

sequelize
  .authenticate()
  .then(() => {
    logger.log('info','Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = sequelize