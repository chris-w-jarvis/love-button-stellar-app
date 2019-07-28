require('dotenv').config()
const logger = require('../services/winston-logger')
const Sequelize = require('sequelize')
var sequelize;
if (env === "PROD") {
  sequelize = new Sequelize(process.env.HEROKU_POSTGRESQL_PURPLE_URL, {
    dialect: 'postgres',
    logging: false
  })
} else {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false
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