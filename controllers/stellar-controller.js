require('dotenv').config()
var rp = require('request-promise')

const priceCheck = function() {
  return new Promise((resolve, reject) => {
    var options = {
      uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=XLM',
      headers: {
          'X-CMC_PRO_API_KEY': process.env.COIN_MKT_CAP_API_KEY
      },
      json: true // Automatically parses the JSON string in the response
    };
    rp(options)
      .then(function (res) {
          resolve(res.data.XLM.quote.USD.price);
      })
      .catch(function (err) {
          reject(err)
    });
  })
}

module.exports = {
  priceCheck: priceCheck
}
