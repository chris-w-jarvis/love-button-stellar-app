require('dotenv').config()
const validator = require('validator');
const TRANSACTION_FEE = parseFloat(process.env.TRANSACTION_FEE)
const StrKey = require('stellar-sdk').StrKey

module.exports = {
    signUp: function(req, res, next) {
        const un = req.body.username
        const pw = req.body.password
        const email = req.body.email

        // validate email
        if (!validator.isEmail(email) || (email.length < 4 || email.length > 128)) {
            return res.status(400).send({msg:'Bad email, between 4 and 128 chars'})
        }
        // validate username
        if (un.length > 24 || un.length < 8) {
            return res.status(400).send({msg:'Username must be between 8 and 24 chars'})
        }
        // validate password
        if (pw.length > 56 || pw.length < 8) {
            return res.status(400).send({msg:'Password must be between 8 and 56 chars'})
        }
        next()
    },
    preSignin: function(req, res, next) {
        const pw = req.body.password
        const email = req.body.email

        if (!pw || !email) {
            return res.status(400).send({msg:'Email, and password required for login'})
        }
        req.body.email = validator.trim(email)
        next()
    },
    preSignup: function(req, res, next) {
        const un = req.body.username
        const pw = req.body.password
        const email = req.body.email

        if (!un || !pw || !email) {
            return res.status(400).send({msg:'Username, email, and password all required'})
        }
        req.body.username = validator.trim(un)
        req.body.email = validator.trim(email)
        next()
    },
    // this breaks premium links (maybe do something here eventually like premium is
    // give/p/premiumPageId or something (to save a db call being the goal of this validator))
    // give: function(req, res, next) {
    //     if (validator.isInt(req.params.pageId)) {
    //         next()
    //     } else {
    //         res.status(404).send({msg:'give/pageId pageId must be an integer'})
    //     }
    // }
    getMyLink: function(req, res, next) {
        if (!req.body.name || !req.body.description || !req.body.key) {
            return res.status(400).send({msg:'Need name, description, and key'})
        }
        const txt = req.body.name
        const key = validator.trim(req.body.key)
        const desc = req.body.description
        if (txt.length >= 128) {
            return res.status(400).send({msg:'Name max length 128'})
        }
        if (!validator.isAlphanumeric(key) || key.length != 56) {
            return res.status(400).send({msg:'Key is 56 alphanumeric chars'})
        } else {
            if (!StrKey.isValidEd25519PublicKey(key)) {
                return res.status(400).send({msg:'Stellar says this public key is invalid, double check your wallet?'})
            }
        }
        if (req.body.memo) {
            const memo = validator.trim(req.body.memo)
            if (!validator.isNumeric(memo) || memo.length > 19) {
                return res.status(400).send({msg:'Memo is all numbers and max length 19 chars (64 bit integer)'})
            }
        }
        if (desc.length >= 512) {
            return res.status(400).send({msg:'Description must be 512 chars or less'})
        }
        next()
    },
    sendPayment: function(req, res, next) {
        const maxPaymentAmtUSD = 10.0
        const key = validator.trim(req.body.destination)
        const amt = validator.trim(req.body.amount)
        const memo = req.body.memo ? validator.trim(req.body.memo) : null
        const maxPaymentAmtXLM = (maxPaymentAmtUSD / parseFloat(req.stellarPriceCurrent)) + TRANSACTION_FEE
        if (!validator.isAlphanumeric(key) || key.length != 56) {
            return res.status(400).send({msg:'Key is 56 alphanumeric chars'})
        } else {
            if (!StrKey.isValidEd25519PublicKey(key)) {
                return res.status(400).send({msg:'Stellar says this public key is invalid, double check your wallet?'})
            }
        }
        if ((!validator.isInt(amt) && !validator.isFloat(amt)) || parseFloat(amt) > maxPaymentAmtXLM) {
            return res.status(400).send({msg:'Amount must be a number and max payment size is 10 USD'})
        }
        if (memo != null) {
            if (!validator.isNumeric(memo) || memo.length > 19) {
                return res.status(400).send({msg:'Memo is numeric and up to 19 chars in length'})
            }
        }
        next()
    },
}