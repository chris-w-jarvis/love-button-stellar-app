const Pages = require('../models/pages').Pages

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
      console.log(err)
    }
  )
}