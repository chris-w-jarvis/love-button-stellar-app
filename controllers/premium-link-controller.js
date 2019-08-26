const UnpaidLinks = require('../models/unpaidPremiumLinks').UnpaidPremiumLinks
const PremiumLinks = require('../models/premiumLinks').PremiumLinks
const logger = require('../services/winston-logger')

const buyingPremiumLink = function(id) {
    return new Promise((resolve, reject) => {
        UnpaidLinks.findByPk(id)
            .then( res => {
                if (res) resolve(true)
                else resolve(false)
            })
            .catch(err => reject(err))
    })
}

/**
 * 
 * @param {account id} id 
 * This database transaction must 1. copy the row from unpaid into paid, 2. delete entry from unpaid
 * actually not sure this needs to be a transaction, normal callbacks should be fine
 */
const fundPremiumLink = function(id) {
    return new Promise((resolve, reject) => {
        UnpaidLinks.findByPk(id)
            .then(unpaid => {
                if (unpaid) {
                    PremiumLinks.create({
                        name: unpaid.name,
                        publicKey: unpaid.publicKey,
                        memo: unpaid.memo,
                        description: unpaid.description,
                        email: unpaid.email,
                        path: unpaid.path
                    })
                    .then(paid => {
                        UnpaidLinks.destroy({where: {
                            id: id
                        }})
                            .then(num => {
                                if (num == 1) resolve(paid)
                                else {
                                    logger.log('info', 'Unsuccessful delete from unpaid for id: '+id)
                                    resolve(paid)
                                }
                            })
                            .catch(err => reject(err))
                    })
                    .catch(err => reject(err))
                } else {
                    reject(new Error("Not found in Unpaid table"))
                }
            })
            .catch(err => reject(err))
    })
}

module.exports = {
    fundPremiumLink: fundPremiumLink,
    buyingPremiumLink: buyingPremiumLink
}