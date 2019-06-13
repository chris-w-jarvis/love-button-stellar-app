require('dotenv').config()

// storing lastPageId and lastPagingToken in redis
var redis = require("redis"),
    client = redis.createClient(process.env.REDIS_URL)

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });
client.on("error", function (err) {
    console.log("Redis error " + err)
});

module.exports = {
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
    }
}