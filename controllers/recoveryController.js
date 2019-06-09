const Mustache = require('mustache')
const fs = require('fs')

const AccountRecovery = require('../models/accountRecovery')
const Accounts = require('../models/accounts')
const EmailService = require('../services/sendgrid')
const bcrypt = require('bcrypt')

// read html file to memory
var htmlTemplate = '';
fs.readFile('./views/resetPassword.html', 'utf8', function(err, data) {htmlTemplate = data});

module.exports = {
    sendEmail : function(req, res) {
        const email = req.body.email
        Accounts.findOne({
            attributes: ['email', 'username'],
            where: {
              email: email
            }
          }).then(dbRes => {
            AccountRecovery.findOrCreate({
              where: {email: dbRes.email},
              defaults: {
                email: dbRes.email
              }
            })
            .then((arRes) => {
              EmailService.sendAccountRecoveryEmail(arRes[0].dataValues.token, dbRes.email, dbRes.username)
              res.sendStatus(201)
            })
            .catch(err => {
              console.log(err)
              res.sendStatus(404)
            })
          })
          .catch(err => {
            console.log(err)
            res.sendStatus(404)
          })
    },
    renderPage : function(req, res) {
        const token = req.params.token
        AccountRecovery.findOne({
            where: {
              token: token
            }
          }).then(
            () => {
              res.send(Mustache.render(htmlTemplate, {token:token}))
            }
          )
          .catch(
            (err) => {
              res.sendStatus(404)
              console.log(err)
            }
          )
    },
    recover: function(req, res) {
        console.log(req.body)
        const token = req.body.token
        const pw = req.body.password

        AccountRecovery.findOne({
            where: {
                token: token
            }
        })
        .then(ar => {
            console.log('email:',ar.email)
            console.log('new pass:', pw)
            bcrypt.hash(pw, 10, function(err, encrypted) {
                if (err) {
                    console.log(err)
                    return res.sendStatus(400)
                }
                console.log('encrypted:',encrypted)
                Accounts.update({
                    password: encrypted 
                    }, {
                    where: {
                        email: ar.email
                    }
                })
                .then((final) => {console.log(final);res.sendStatus(200)})
                .catch(err => {console.log(err);res.sendStatus(500)})
            })
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(404)
        })
    }
}