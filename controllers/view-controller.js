const Pages = require('../models/pages').Pages
const logger = require('../services/winston-logger')
require('dotenv').config()
const env = process.env.LOVE_BUTTON_RUNTIME_ENV
if (!env) throw new Error("No LOVE_BUTTON_RUNTIME_ENV")

module.exports = function(req, res, next) {
  // find corresponding public key in db for req.params.pageId
  Pages.findOne({
    where: {
      pageId: req.params.pageId
    }
  }).then(
    (page) => {
      res.render('sendPayment', {key:page.publicKey, name:page.name, memo:page.memo, 
        description:page.description, env:env})
    }
  )
  .catch(
    (err) => {
      res.sendStatus(404)
      logger.log('info',`page ${req.params.pageId} not found`)
    }
  )
}