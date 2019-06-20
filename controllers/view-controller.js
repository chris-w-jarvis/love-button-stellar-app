const Pages = require('../models/pages').Pages
const logger = require('../services/winston-logger')

module.exports = function(req, res, next) {
  // find corresponding public key in db for req.params.pageId
  Pages.findOne({
    where: {
      pageId: req.params.pageId
    }
  }).then(
    (page) => {
      res.render('sendPayment', {key:page.publicKey, name:page.name, memo:page.memo})
    }
  )
  .catch(
    (err) => {
      res.sendStatus(404)
      logger.log('info',`page ${req.params.pageId} not found`)
    }
  )
}