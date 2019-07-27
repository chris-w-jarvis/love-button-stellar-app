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
      if (page) {
        res.render('sendPayment', {key:page.publicKey, name:page.name, memo:page.memo, 
          description:page.description, env:env})
      } else {
        res.status(404).render('404_page');
      }
    }
  )
  .catch(
    (err) => {
      res.status(404).render('404_page');
      logger.log('error',err)
    }
  )
}