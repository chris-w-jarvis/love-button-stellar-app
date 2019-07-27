const logger = require('./winston-logger')

// middleware to log the url that a process is handling

// factory
module.exports = function(procId) {
    return factory(procId)
}

const factory = function(procId) {
    return function(req, res, next) {
        logger.log('info', `Worker ${procId} handling [${req.originalUrl}]`)
        next()
    }
}