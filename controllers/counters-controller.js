require('dotenv').config()
const logger = require('../services/winston-logger')

// storing lastPageId and lastPagingToken in redis
var redis = require("redis"),
    client = redis.createClient(process.env.REDIS_URL)

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });
client.on("error", function (err) {
    logger.log('info',"Redis error " + err)
});

module.exports = {
    incrTransactionNumber: async function() {
        return new Promise((res, rej) => {
            return client.incr("transactionNumber", (err, tr) => {
                if (err) rej(err)
                else res(tr)
            })
        })
    },
    incrLastPageId : function(cb) {
        return client.incr("lastPageId", cb)
    },
    readPagingToken : function() {
        return new Promise((resolve, reject) => {
            client.get('pagingToken', (err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        })
    },
    writePagingToken : function(newVal) {
        return new Promise((resolve, reject) => {
            client.set('pagingToken', newVal, (err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        })
    },
    saveStellarPrice: function(price, cb) {
        return client.set('stellarPrice', price, cb)
    },
    readStellarPrice: function() {
        return new Promise((resolve, reject) => {
            client.get('stellarPrice', (err, res) => {
                if (err) reject(err)
                resolve(res)
            })
        })
    }
}