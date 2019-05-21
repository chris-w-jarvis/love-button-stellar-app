const stellarController = require('./controllers/stellar-controller')
const accountController = require('./controllers/account-balance-controller')
const Pages = require('./models/pages').Pages
const sendPaymentService = require('./services/payment-account-transaction').sendPaymentService
const path = require('path') 
const fs = require('fs')
require('dotenv').config()

const filePath = path.join(__dirname, 'lastPageId.txt');

const passport = require('passport');

// setup passport, token not session (cookie) based
const requireAuth = passport.authenticate('jwt', {session: false, failureRedirect: "/login"});

// Rate limiter
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
var Redis = require('ioredis')
var client = new Redis(process.env.REDIS_URL)

const paymentRateLimiter = rateLimit({
  store: new RedisStore({
    client: client
  }),
  windowMs: 10000, // 10 second window
  max: 1, // 1 payment per 10 seconds
  message: "Payment rate limiter: 1 per 10 seconds.",
  keyGenerator: function(req) {
    if (req.user) {
      return req.user.id
    }
    else {
      return req.get("Authorization")
    }
  }
})

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
  app.get('/api/priceCheck', function(req, res) {
    res.send({price:stellarPrice})
  })

  app.post('/api/admin', function(req, res) {
    if (req.header('adminKey') === process.env.ADMIN_PW) {
      // db
      Pages.create({name:req.body.name, publicKey:req.body.key, pageId:req.body.path}).then(
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

  app.post('/api/getMyLink', function(req, res) {
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
    Pages.create({name:req.body.name, publicKey:req.body.key, pageId:idString}).then(
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

  // FOR TESTING ONLY, remove
  app.post('/api/test/addFunds', requireAuth, function(req, res) {
    accountController.modifyFunds(req.user.id, req.body.amount)
    .then(res.sendStatus(204))
    .catch(err => {
      console.log(err)
      res.sendStatus(404)
    })
  });

  app.get('/api/checkBalance', requireAuth, function(req, res) {
    accountController.checkBalanceUserId(req.user.id)
    .then(balance => res.send({'balance':balance}))
    .catch(err => {
      console.log(err)
      res.sendStatus(404)
    })
  })

  app.post('/api/sendPayment', paymentRateLimiter, requireAuth, paymentRateLimiter, sendPaymentService)

  app.get('/api/fund', requireAuth, function(req, res) {
    accountController.fundAccount(req.user.id)
    .then(dbRes => {
      res.send({'balance':dbRes.balance, 'memo':dbRes.accountBalanceId, 'loveButtonPublicAddress':process.env.LOVE_BUTTON_PUBLIC_ADDRESS})
    })
  })
}