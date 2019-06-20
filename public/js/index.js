let destKeyElement = document.getElementById('destKey')
let sourceKeyIn = document.getElementById('sourceKeyIn')
let sendPaymentBtn = document.getElementById('sendPaymentBtn')
let xlmPrice = document.getElementById('xlmPrice')
let priceCheckBtn = document.getElementById('priceCheck')
let acctBalanceBtn = document.getElementById('accountBalanceCheck')
let selectedCurrency = document.getElementById('selectedCurrency')
let selectedCurrencyDefault = document.getElementById('selectedCurrencyDefault')
let paymentAmount = document.getElementById('amount')
let defaultPaymentBtn = document.getElementById('defaultBtn')
let saveDefaultPaymentBtn = document.getElementById('saveDefaultsBtn')
let showOptionsDivBtn = document.getElementById('optionsBtn')
let clearDefaultBtn = document.getElementById('clearDefaultBtn')
let paymentStatusDiv = document.getElementById('paymentStatusDiv')
let saveKeyInBrowserBtn = document.getElementById('saveKeyInBrowserBtn')
let saveKeyPassphraseInput = document.getElementById("saveKeyPassphraseInput")
let accountBalance = document.getElementById('curBal')
let memo = document.getElementById('memo')

let stellarLedgerUrl = 'http://testnet.stellarchain.io/tx/'
// let host = 'https://www.love-button.org/api/'
let host = 'http://localhost:8080/api/'
let stellarPrice
let token

if (localStorage.getItem("loveButtonAuthToken")) {
    console.log("logged in")
    token = localStorage.getItem('loveButtonAuthToken')
} else {
    console.log("redirecting to login")
    window.location.replace('/login')
}

function loadUser() {
    $.get(
        {
            url: `${host}loadSendPayment`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token)},
            success: function(res) {
                console.log(res)
                xlmPrice.innerText = `1 Stellar(XLM) is worth ${res.price} USD`
                stellarPrice = res.price
                accountBalance.innerHTML = res.balance
                document.getElementById('accountInfoDiv').innerHTML = `<p class="col-xs-12 offset-sm-1 col-sm-10 offset-md-2 col-md-8 offset-lg-3 col-lg-6">Logged in as: ${res.username}`
            },
            error: function() {
                console.log("redirecting to login")
                window.location.replace('/login')
            }
        }
    )
}

loadUser()

function loadDefaultBtn() {
    const defCur = localStorage.getItem("defaultCurrency")
    const defAmt = localStorage.getItem("defaultAmt")
    if (defCur && defAmt) {
        defaultPaymentBtn.innerHTML = `Default Amount (${defAmt+defCur})`
    } else {
        defaultPaymentBtn.innerHTML = "Default Amount (not set)"
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

clearDefaultBtn.onclick = function(e) {
    console.log(localStorage)
    localStorage.clear();
    localStorage.defaultAmt = "";
    localStorage.defaultCurrency = "";
}

function sendPaymentToStellar(destination, amount, memoTxt) {
    return new Promise((resolve, reject) => {
        $.post({url:`${host}sendPayment`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            data: {destination: destination, amount: amount, memo: memoTxt},
            success: function(res) {
                resolve(res)
            },
            error: function(res) {
                reject(JSON.parse(res.responseText).msg)
            }
        })
    })
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
    paymentStatusDiv.innerHTML = '<p>Waiting...</p>'
    sendPaymentToStellar(destKeyElement.innerHTML, amount, memo.innerHTML)
        .then( res => {
            paymentStatusDiv.innerHTML = '<div class="alert alert-success" role="alert">Success, sent ${amount} XLM\nSee this transaction on Stellar public ledger: ${stellarLedgerUrl}${res.url}</div>'
            loadUser()
        })
        .catch(msg => {
            paymentStatusDiv.innerHTML = `<div class="alert alert-danger" role="alert">
                                            Failed, to send: ${msg}
                                          </div>`

        })
}

// TODO: More detailed error messaging
sendPaymentBtn.onclick = function (e) {
    var regex = /[A-Z0-9]{56}/;
    if (destKeyElement.innerHTML.match(regex)) {
        if (paymentAmount.value.match(/[a-z]/i) || !paymentAmount.value.match(/[0-9]/)) {
            alert('Destination key not set correctly for this link')
            return
        }
        // determine amount
        if (selectedCurrency.value === 'usd') {
            var amount = parseFloat(paymentAmount.value) / parseFloat(stellarPrice)
            sendPayment(amount.toFixed(6).toString())
        } else {
            sendPayment(parseFloat(paymentAmount.value).toFixed(6).toString())
        }
    } else alert('Destination key or source key not loaded, bad give page? Sorry.')
}