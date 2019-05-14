let destKeyElement = document.getElementById('destKey')
let sourceKeyIn = document.getElementById('sourceKeyIn')
let sendPaymentBtn = document.getElementById('sendPaymentBtn')
let xlmPrice = document.getElementById('xlmPrice')
let priceCheckBtn = document.getElementById('priceCheck')
let acctBalanceBtn = document.getElementById('accountBalanceCheck')
let acctBalanceDiv = document.getElementById('accountBalanceDiv')
let selectedCurrency = document.getElementById('selectedCurrency')
let selectedCurrencyDefault = document.getElementById('selectedCurrencyDefault')
let paymentAmount = document.getElementById('paymentAmount')
let defaultPaymentBtn = document.getElementById('defaultPaymentAmountBtn')
let saveDefaultPaymentBtn = document.getElementById('defaultBtn')
let showOptionsDivBtn = document.getElementById('showOptionsDivBtn')
let clearKeyBtn = document.getElementById('clearKeyBtn')
let paymentStatusDiv = document.getElementById('paymentStatusDiv')
let saveKeyInBrowserBtn = document.getElementById('saveKeyInBrowserBtn')
let saveKeyPassphraseInput = document.getElementById("saveKeyPassphraseInput")

const Stellar = require('./stellar-browser')
const Encryption = require('./encryption-browser')

let loveButtonAcctAddr = 'GCP4TPXG3TIYJ2U7Z77T5QFXVMJZTTWDKBQBFPGXJL4WG26FZ6DVT5GZ'

let stellarLedgerUrl = 'http://testnet.stellarchain.io/tx/'
// let host = 'https://www.love-button.org/api/'
let host = 'http://localhost:8080/api/'
let stellarPrice = ''

function checkXLM() {
    xlmPrice.innerText = 'loading'
    $.get(`${host}priceCheck`, function(price) {
        xlmPrice.innerText = `1 Stellar(XLM) is worth ${price.price} USD`
        stellarPrice = price.price
    })
}

if (localStorage.getItem("encryptedKey")) {
    console.log("loaded key")
    sourceKeyIn.placeholder = "Passphrase here, key saved in browser"
} else {
    console.log("no key in localStorage")
}

checkXLM()

function loadDefaultBtn() {
    const defCur = localStorage.getItem("defaultCurrency")
    const defAmt = localStorage.getItem("defaultAmt")
    if (defCur && defAmt) {
        defaultPaymentBtn.innerHTML = `Default (${defAmt+defCur})`
    } else {
        defaultPaymentBtn.innerHTML = "Default (not set)"
    }
}

loadDefaultBtn()

defaultPaymentBtn.onclick =  function(e) {
    const defCur = localStorage.getItem("defaultCurrency")
    const defAmt = localStorage.getItem("defaultAmt")
    if (defCur && defAmt) {
        selectedCurrency.value = defCur
        paymentAmount.value = defAmt
    }
}

saveDefaultPaymentBtn.onclick = function(e) {
    localStorage.setItem("defaultCurrency", selectedCurrencyDefault.value)
    localStorage.setItem("defaultAmt", document.getElementById("defaultAmt").value)
    location.reload()
}

function validateAmount(amount) {
    if ((parseFloat(stellarPrice) * amount) <= 5.0) return true
    return false
}

showOptionsDivBtn.onclick = function(e) {
    document.getElementById("optionsDiv").style.display = "block"
}

clearKeyBtn.onclick = function(e) {
    localStorage.clear()
}

function sendPayment(amount) {
    if (amount <= 0) {
        alert("Can't send 0 or negative")
        return
    }
    if (!validateAmount(amount)) {
        alert("Max transaction size is 5$, if you want to send more, use the Stellar account viewer")
        return
    }
    var privateKey
    if (localStorage.getItem("encryptedKey")) {
        privateKey = Encryption.decryptKeyFromBrowser(localStorage.getItem("encryptedKey"), sourceKeyIn.value)
    } else {
        privateKey = sourceKeyIn.value
    }
    paymentStatusDiv.innerHTML = '<p>Wait...</p>'
    Stellar.sendPaymentToStellar(privateKey, destKeyElement.innerHTML, amount)
        .then( res => {
            paymentStatusDiv.innerHTML = `<p>Success, sent ${amount} XLM\nSee this transaction on Stellar public ledger: ${stellarLedgerUrl}${res.hash}</p>`
            paymentStatusDiv.style.backgroundColor = "#28a745";
            if (Math.floor(Math.random() * 25) === 8) {
                Stellar.sendPaymentToStellar(privateKey, loveButtonAcctAddr, '.1')
                .catch(err => console.log(err))
                console.log("You were randomly chosen to pay a .01xlm transaction fee")
            }
        })
        .catch(err => {
            console.log(err)
            paymentStatusDiv.innerHTML = '<p>Failed, check your private key, is your account funded?</p>'
            paymentStatusDiv.style.backgroundColor = "red";
        })
}

priceCheckBtn.onclick = function(e) {
    checkXLM()
}

acctBalanceBtn.onclick = function(e) {
    if (acctBalanceDiv.firstChild) acctBalanceDiv.removeChild(acctBalanceDiv.firstChild)
    if (sourceKeyIn.value != '') {
        var privateKey
        if (localStorage.getItem("encryptedKey")) {
            privateKey = Encryption.decryptKeyFromBrowser(localStorage.getItem("encryptedKey"), sourceKeyIn.value)
        } else {
            privateKey = sourceKeyIn.value
        }
        Stellar.accountBalance(privateKey)
            .then(balance => {
                var usd = parseFloat(balance) * parseFloat(stellarPrice)
                var xlm = parseFloat(balance).toFixed(3)
                acctBalanceDiv.innerText = `Account balance: ${xlm} XLM which is ~${usd.toFixed(3)} USD`
            })
            .catch(error => {
                console.log(error)
                alert('Request failed, check your private key.');
            })
    } else alert('Set source key to check balance (private key not public key)')
}

// TODO: More detailed error messaging
sendPaymentBtn.onclick = function (e) {
    if (destKeyElement.innerHTML != 'No destination key on this page' && sourceKeyIn.value != '') {
        if (paymentAmount.value.match(/[a-z]/i) || !paymentAmount.value.match(/[0-9]/)) {
            alert('Numbers only and not empty')
            return
        }
        // determine amount
        if (selectedCurrency.value === 'usd') {
            var amount = parseFloat(paymentAmount.value) / parseFloat(stellarPrice)
            sendPayment(amount.toFixed(6).toString())
        } else {
            sendPayment(parseFloat(paymentAmount.value).toFixed(6).toString())
        }
    } else alert('Destination key or source key not set')
}

// ENCRYPTION CONTROLLER
saveKeyInBrowserBtn.onclick = function(e) {
    saveKeyPassphraseInput.style.display = "block"
}

saveKeyPassphraseInput.addEventListener("keyup", function(event) {
    // on enter
    if (event.keyCode === 13) {
        event.preventDefault();
        localStorage.setItem("encryptedKey", Encryption.encryptKeyForBrowser(sourceKeyIn.value, saveKeyPassphraseInput.value))
        alert("Encrypted key saved in browser, from now on type your passcode instead of your key, periodically you should "+
        "set a new passphrase.")
        location.reload()
    }
})