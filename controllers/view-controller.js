const Mustache = require('mustache')
const fs = require('fs')

const Pages = require('../models/pages').Pages

// read html file to memory
var htmlTemplate = '';
fs.readFile('./views/sendMoneyPage.html', 'utf8', function(err, data) {htmlTemplate = data});

module.exports = function(req, res, next) {
  // find corresponding public key in db for req.params.pageId
  Pages.findOne({
    where: {
      pageId: req.params.pageId
    }
  }).then(
    (page) => {
      res.send(Mustache.render(htmlTemplate, {key:page.publicKey, name:page.name}))
    }
  )
  .catch(
    (err) => {
      res.sendStatus(404)
      console.log(err)
    }
  )
}