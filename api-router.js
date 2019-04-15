const stellarController = require('./controllers/stellar-controller')
const Pages = require('./models/pages').Pages
const LastPageId = require('./models/pages').LastPageId
require('dotenv').config()

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
var latestPageId = 0
LastPageId.findOne({
  order: [['pageId', 'DESC']]
}).then(res => {
  latestPageId = parseInt(res.pageId)
}).catch(err => {
  console.log(err)
})

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
        LastPageId.create({pageId: page.pageId}).catch(err => console.log(err))
      }
    )
    .catch(err => {
      console.log(err)
      res.sendStatus(400)
    })
  })
}