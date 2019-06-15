const AccountRecovery = require('../models/accountRecovery')
const Accounts = require('../models/accounts')
const EmailService = require('../services/sendgrid')
const bcrypt = require('bcrypt')

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
              res.render('resetPassword', {token:token})
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
                    console.log(err)
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
                    .catch(err => console.log(err))
                    res.sendStatus(200)
                })
                .catch(err => {console.log(err);res.sendStatus(500)})
            })
        })
        .catch(err => {
            console.log(err)
            res.sendStatus(404)
        })
    }
}