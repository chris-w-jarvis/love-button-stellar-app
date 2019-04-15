const CryptoJS = require("crypto-js")

const encryptKeyForBrowser = function(privateKey, passphrase) {
    return CryptoJS.AES.encrypt(privateKey, passphrase).toString()
}

const decryptKeyFromBrowser = function(encryptedPrivateKey, passphrase) {
    var bytes  = CryptoJS.AES.decrypt(encryptedPrivateKey.toString(), passphrase)
    return bytes.toString(CryptoJS.enc.Utf8)
}

module.exports = {
    encryptKeyForBrowser: encryptKeyForBrowser,
    decryptKeyFromBrowser: decryptKeyFromBrowser
}