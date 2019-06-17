const winston = require('winston');
const format = winston.format

const options = {
    stderrLevels : ['error']
}

module.exports = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'love-button', pid: process.pid ? process.pid : 'not_found' },
  transports: [
    new winston.transports.Console(options)
  ]
})