const stellarController = require('./controllers/stellar-controller')
const accountController = require('./controllers/account-controller')
const recoveryController = require('./controllers/recoveryController')
const countersController = require('./controllers/counters-controller')
const Pages = require('./models/pages').Pages
const sendPaymentService = require('./services/payment-account-transaction').sendPaymentService
const validationService = require('./services/validations')
require('dotenv').config()
const env = process.env.LOVE_BUTTON_RUNTIME_ENV
const passport = require('passport');

const logger = require('./services/winston-logger')

// setup passport, token not session (cookie) based
const requireAuth = passport.authenticate('jwt', {session: false});

// Rate limiter
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
var Redis = require('ioredis')
var client = new Redis(process.env.REDIS_URL)

const paymentLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    expiry: 10,
    prefix: 'prl:'
  }),
  max: 1, // start blocking after 5 requests
  keyGenerator: function(req) {
    if (req.user) {
      return req.user.id
    } else {
      return req.header('Authorization')
    }
  },
  message:
    "Payment rate limiter: 1 payment per 10 seconds"
});

// value returned by /api/priceCheck
var stellarPrice = "";
const stellarPriceCheck = function() {
  if (env === "PROD") {
    stellarController.priceCheck().then((price) => {
      stellarPrice = price
    })
    .catch((err)  => {
      stellarPrice = .12
      logger.log('info',err)
    })
  } else {
    stellarPrice = "0.10"
  }
}

const requireAdmin = function(req, res, next) {
  if (req.header('Admin') === process.env.ADMIN_PW) {
    next()
  } else {
    return res.sendStatus(403)
  }
}

stellarPriceCheck()

// QUERY STELLAR PRICE, run this every 4.9 minutes * number of processes
setInterval(stellarPriceCheck, 294000 * parseInt(process.env.WEB_CONCURRENCY))

// on startup get last page id
var latestPageId
try {
  countersController.incrLastPageId((err, lpi) => {
    if (err) {
      logger.log('info','Error loading last page id: '+ err)
    } else {
      latestPageId = lpi
    }
  })
} catch(err) {
  logger.log('info','Error reading last page id: '+ err)
}

module.exports = function router(app) {

  app.post('/api/get-my-link', validationService.getMyLink, function(req, res) {
    // zerofill latestPageId
    if (!latestPageId) {
      // if this isn't loaded we can't create new links
      logger.log("PROBLEMS LOADING latestPageId")
      res.status(404).send({msg:'Can\'t make new link right now! We\'re working on it, sorry!'})
    }
    var idString = `${latestPageId++}`
    if (idString.length < 6) {
      var idLen = idString.length
      for (i = 0; i < 6-idLen; i++) {
        idString = `0${idString}`
      }
    }

    // db
    Pages.create({
      name:req.body.name, 
      publicKey:req.body.key, 
      pageId:idString, 
      memo:req.body.memo,
      description: req.body.description,
      email: req.body.emailInput
    }).then(
      (page) => {
        res.send({id:page.pageId})
        countersController.incrLastPageId((err) => {if (err) logger.log('info','Error writing last page id: '+err)})
      }
    )
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(400)
    })
  })

  app.get('/api/checkBalance', requireAuth, function(req, res) {
    accountController.checkBalanceUserId(req.user.id)
    .then(balance => {console.log(balance);res.send({'balance':balance})})
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(404)
    })
  })

  app.get('/api/loadSendPayment', requireAuth, function(req, res, next) {
    const user = req.user
    accountController.checkBalanceUserId(user.id)
    .then(bal => {
      res.send({balance: bal, price: stellarPrice, username: user.username})
    })
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(400)
    })
  })

  // ADMIN UTILITIES
  // app.post('/api/admin', requireAdmin, function(req, res) {
  //   // db
  //   Pages.create({name:req.body.name, publicKey:req.body.key, pageId:req.body.path, memo:req.body.memo}).then(
  //     (page) => {
  //       logger.log('info',`Created premium link /${page.pageId}`)
  //       res.sendStatus(200)
  //     })
  // })
  app.post('/api/test/transToLBPub', requireAdmin, function(req, res) {
    stellarController.testPayer(req.body.src, req.body.memo, req.body.amount)
    .then(result => res.send(result))
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(400)})
    })
  app.post('/api/test/balCheckAny', requireAdmin, function(req, res) {
    stellarController.testBalanceChecker(req.body.src)
    .then(result => {
      res.send({balance:result})
    })
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(400)
    })
  })

  app.get('/api/loadAccount', requireAuth, function(req, res) {
    const user = req.user
    res.status(200).send({
      username: user.username,
      email: user.email,
      memo: user.id,
      balance: user.balance,
      createdAt: user.createdAt
    })
  })

  app.post('/api/recoveryEmail', recoveryController.sendEmail)

  app.post('/api/recover', recoveryController.recover)

  app.post('/api/sendPayment', paymentLimiter, requireAuth, paymentLimiter, (req, res, next) => {req.stellarPriceCurrent = stellarPrice;next()}, validationService.sendPayment, sendPaymentService)

  app.get('/api/fund', requireAuth, function(req, res) {
    const user = req.user
    accountController.fundAccount(user.id)
    .then(dbRes => {
      res.send({'balance':dbRes.balance, 'memo':dbRes.id, 'loveButtonPublicAddress':process.env.LOVE_BUTTON_PUBLIC_ADDRESS, username: user.username})
    })
    .catch(err => {
      logger.log('info',err)
      res.sendStatus(400)
    })
  })
}