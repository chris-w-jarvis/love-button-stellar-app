var validator = require('validator');

module.exports = {
    signUp: function(req, res, next) {
        const un = req.body.username
        const pw = req.body.password
        if (req.body.email) {
            // validate email
            if (!validator.isEmail(req.body.email)) {
                res.status(400).send({msg:'Bad email'})
                return
            }
        }
        // validate username
        if (validator.contains(un, " ") || un.length > 24 || un.length < 8) {
            res.status(400).send({msg:'No spaces in username and must be between 8 and 24 chars'})
            return
        }
        // validate password
        if (pw.length > 56 || pw.length < 8) {
            res.status(400).send({msg:'Password must be between 8 and 56 chars'})
            return
        }
        next()
    },
    trim: function(req, res, next) {
        req.body.username = validator.trim(req.body.username)
        if (req.body.email) req.body.email = validator.trim(req.body.email)
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
        const txt = req.body.name
        const key = validator.trim(req.body.key)
        if (txt.length > 255) {
            res.status(400).send({msg:'Name or text max length 255'})
            return
        }
        if (!validator.isAlphanumeric(key) || key.length != 56) {
            res.status(400).send({msg:'Key is 56 alphanumeric chars'})
            return
        }
        if (req.body.memo) {
            const memo = validator.trim(req.body.memo)
            if (!validator.isNumeric(memo) || memo.length > 28) {
                res.status(400).send({msg:'Memo is all numbers and max length 28 chars'})
                return
            }
        }
        next()
    },
    sendPayment: function(req, res, next) {
        const maxPaymentAmtUSD = 5.0
        const key = validator.trim(req.body.destination)
        const amt = validator.trim(req.body.amount)
        const maxPaymentAmtXLM = maxPaymentAmtUSD / parseFloat(req.stellarPriceCurrent)
        if (!validator.isAlphanumeric(key) || key.length != 56) {
            res.status(400).send({msg:'Key is 56 alphanumeric chars'})
            return
        }
        if ((!validator.isInt(amt) && !validator.isFloat(amt)) || parseFloat(amt) > maxPaymentAmtXLM) {
            res.status(400).send({msg:'Amount must be a number and max payment size is 5 USD'})
            return
        } 
        next()
    }
}