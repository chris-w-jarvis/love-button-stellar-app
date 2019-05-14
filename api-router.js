const stellarController = require('./controllers/stellar-controller')
const accountController = require('./controllers/account-balance-controller')
const Pages = require('./models/pages').Pages
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
// var Redis = require('ioredis')
// var client = new Redis(process.env.REDIS_URL)
 

//app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
 
// const generalLimiter = rateLimit(
//   {
//     store: new RedisStore({
//       client: client
//     }),
//     windowMs: 60000, // 1 minute window
//     max: 20, // start blocking after 20 requests
//     message: "You can only hit this service 20 times per minute, this is to prevent money laundering."
//   }
// );
 
// //  apply to all requests
// app.use(generalLimiter);

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

  // TODO: rate limiting
  app.post('/api/sendPayment', requireAuth, function(req, res) {
    accountController.checkBalanceUserId(req.user.id)
    .then(balance => {
      // check account balance
      const bal = parseFloat(balance)
      const pmt = parseFloat(req.body.amount)
      if (bal <= pmt) {
        res.status(400).send({msg: "Not enough money in account"})
        return
      }
      // lower acct bal
      accountController.modifyFundsUserId(req.user.id, bal - pmt)
      .then(modifyResult => {
        if (modifyResult != 1) {
          console.log(`Error occured changing account balance before sending payment for userid ${req.user.id}`)
        }
        // send payment
        stellarController.sendPayment(req.body.destination, req.body.amount)
        .then(pmtRes => {
          // successful transaction
          res.sendStatus(204)
        })
        .catch(err => {
          console.log('Payment failed', err)
          res.status(400).send({msg: "Transaction failed in Stellar network"})
          // revert transaction
          accountController.modifyFundsUserId(req.user.id, bal)
          .then(modifyResult2 => {
            res.sendStatus(400)
            if (modifyResult2 != 1) throw new Error('Error rolling back transaction')
          })
          .catch(err => {
            console.log(err)
            res.sendStatus(400)
          })
        })
      })
    })
  })
}