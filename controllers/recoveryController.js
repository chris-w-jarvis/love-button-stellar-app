const AccountRecovery = require('../models/accountRecovery')
const Accounts = require('../models/accounts')
const EmailService = require('../services/sendgrid')
const bcrypt = require('bcrypt')
const logger = require('../services/winston-logger')
require('dotenv').config()
const env = process.env.LOVE_BUTTON_RUNTIME_ENV
if (!env) throw new Error("No LOVE_BUTTON_RUNTIME_ENV")
module.exports = {
    sendEmail : function(req, res) {
        const email = req.body.email
        Accounts.findOne({
            attributes: ['email', 'username'],
            where: {
              email: email
            }
          }).then(dbRes => {
            if (dbRes.email === 'NOT_SET') {
                return res.status(404).send({msg:'You didn\'t provide an email... Sorry.'})
            }
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
              logger.log('info',err)
              res.sendStatus(404)
            })
          })
          .catch(err => {
            logger.log('info',err)
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
              res.render('resetPassword', {token:token, env:env})
            }
          )
          .catch(
            (err) => {
              res.sendStatus(404)
              logger.log('info',err)
            }
          )
    },
    recover: function(req, res) {
        const token = req.body.token
        const pw = req.body.password
        AccountRecovery.findOne({
            where: {
                token: token
            }
        })
        .then(ar => {
            bcrypt.hash(pw, 10, function(err, encrypted) {
                if (err) {
                    logger.log('info',err)
                    return res.sendStatus(400)
                }
                Accounts.update({
                    password: encrypted 
                    }, {
                    where: {
                        email: ar.email
                    }
                })
                .then(() => {
                    AccountRecovery.destroy({
                        where: {token: token}
                    })
                    .catch(err => logger.log('info',err))
                    res.sendStatus(200)
                })
                .catch(err => {logger.log('info',err);res.sendStatus(500)})
            })
        })
        .catch(err => {
            logger.log('info',err)
            res.sendStatus(404)
        })
    }
}