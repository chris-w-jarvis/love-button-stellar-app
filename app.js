const throng = require('throng')
require('dotenv').config()

const startSlave = require('./server')
const WORKERS = process.env.WEB_CONCURRENCY || 1
const env = process.env.LOVE_BUTTON_RUNTIME_ENV
const logger = require('./services/winston-logger')
const countersController = require('./controllers/counters-controller')
const stellarController = require('./controllers/stellar-controller')

logger.log("info", "WEB_CONCURRENCY = "+process.env.WEB_CONCURRENCY)

throng({
    workers: WORKERS,
    master: startMaster,
    start: (id) => startSlave(id)
})

// the master has two jobs in addition to starting workers: 
// 1. call stellar price api and update that value in redis, 2. listen for account funding transactions
function startMaster() {

    logger.log('info', `Master starting ${WORKERS} slaves.`)

    // quit startup if this doesn't work
    countersController.incrLastPageId((err, lpi) => {
        if (err) {
            logger.log('info','Error setting last page id in master: '+ err)
            throw err
        }
    })

    const stellarPriceCheck = function() {
        if (env === "PROD") {
            stellarController.priceCheck()
            .then((price) => {
                countersController.saveStellarPrice(price, (err, res) => {
                    if (err) throw err
                })
            })
            .catch((err)  => {
                logger.log('error', "Error retrieving stellar price: "+err)
                countersController.saveStellarPrice("0.10", (error, res) => {
                    if (error) logger.log('error', "Can't save stellar price to db")
                })
            })
        } else {
            countersController.saveStellarPrice("0.10", (err, res) => {
                if (err) logger.log('error', "Can't save stellar price to db")
            })
        }
    }

    stellarPriceCheck()

    // QUERY STELLAR PRICE, run this every 4.9 minutes
    if (env === "PROD") setInterval(stellarPriceCheck, 294000)

    // turn on transaction listener
    require('./services/fund-account-listener')
}