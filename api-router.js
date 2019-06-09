const stellarController = require('./controllers/stellar-controller')
const accountController = require('./controllers/account-controller')
const recoveryController = require('./controllers/recoveryController')
const Pages = require('./models/pages').Pages
const sendPaymentService = require('./services/payment-account-transaction').sendPaymentService
const validationService = require('./services/validations')
const path = require('path') 
const fs = require('fs')
require('dotenv').config()

const filePath = path.join(__dirname, 'lastPageId.txt');

const passport = require('passport');

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

const accountRecoveryLimiter = rateLimit({
  store: new RedisStore({
    client: client,
    expiry: 3600,
    prefix: 'arrl:'
  }),
  max: 1, // start blocking after 1
  message:
    "Account recovery rate limiter: 1 request per hour"
});

// value returned by /api/priceCheck
var stellarPrice = "";
const stellarPriceCheck = function() {
  stellarController.priceCheck().then((price) => {
    stellarPrice = price
  })
  .catch((err)  => {
    console.log(err)
  })
}

stellarPriceCheck()

// QUERY STELLAR PRICE, run this every 4.9 minutes
setInterval(stellarPriceCheck, 294000)

// on startup get last page id
var latestPageId 
try {
  latestPageId = parseInt(fs.readFileSync(filePath,{ encoding: 'utf8' }))
} catch (err) {
  latestPageId = 0
}

module.exports = function router(app) {

  app.post('/api/admin', function(req, res) {
    if (req.header('adminKey') === process.env.ADMIN_PW) {
      // db
      Pages.create({name:req.body.name, publicKey:req.body.key, pageId:req.body.path, memo:req.body.memo}).then(
        (page) => {
          console.log(`Created premium link /${page.pageId}`)
          res.sendStatus(200)
        }
      )
      .catch(err => {
        console.log(err)
        res.sendStatus(200)
      })
    }
  })

  app.post('/api/get-my-link', validationService.getMyLink, function(req, res) {
    console.log(req.body)
    // zerofill latestPageId
    var idString = `${++latestPageId}`
    if (idString.length < 6) {
      var idLen = idString.length
      for (i = 0; i < 6-idLen; i++) {
        idString = `0${idString}`
      }
    }
    // latestPageId++

    // db
    Pages.create({name:req.body.name, publicKey:req.body.key, pageId:idString, memo:req.body.memo}).then(
      (page) => {
        res.send({id:page.pageId})
        fs.writeFileSync(filePath,`${page.pageId}`)
      }
    )
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
  })

  app.get('/api/checkBalance', requireAuth, function(req, res) {
    accountController.checkBalanceUserId(req.user.id)
    .then(balance => res.send({'balance':balance}))
    .catch(err => {
      console.log(err)
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
      console.log(err)
      res.sendStatus(400)
    })
  })

  // TESTING UTILITIES
  app.post('/api/test/transToLBPub', function(req, res) {
    stellarController.testPayer(req.body.src, req.body.memo, req.body.amount)
    .then(result => res.send(result))
    .catch(err => {console.log(err)
      res.sendStatus(400)})
  })
  app.post('/api/test/balCheckAny', function(req, res) {
    console.log(req.body)
    stellarController.testBalanceChecker(req.body.src)
    .then(result => {
      console.log(result)
      res.send({balance:result})
    })
    .catch(err => res.sendStatus(400))
  })

  app.get('/api/loadAccount', requireAuth, function(req, res) {
    const user = req.user
    res.status(200).send({
      username: user.username,
      email: user.email,
      memo: user.accountBalanceId,
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
      res.send({'balance':dbRes.balance, 'memo':dbRes.accountBalanceId, 'loveButtonPublicAddress':process.env.LOVE_BUTTON_PUBLIC_ADDRESS, username: user.username})
    })
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
  })
}