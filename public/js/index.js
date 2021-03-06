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

let stellarPrice
let token
let userBal

// configure env
let env = document.getElementById('env').innerHTML
let host
function loadEnv() {
    if (env === 'PROD') {
        host = 'https://www.love-button.org/'
    } else if (env === 'TEST') {
        host = 'https://www.test-love-button.herokuapp.com/'
    } else {
        host = 'http://localhost:8080/'
    }
}
loadEnv()
if (env != "DEV" && location.protocol !== "https:") {
    location.protocol = "https:";
}

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
            url: `${host}api/loadSendPayment`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token)},
            success: function(res) {
                console.log(res)
                xlmPrice.innerText = `1 Stellar(XLM) is worth ${parseFloat(res.price).toFixed(4)} USD`
                stellarPrice = res.price
                accountBalance.innerHTML = `${parseFloat(res.balance).toFixed(4)} xlm`
                userBal = parseFloat(res.balance).toFixed(4)
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
        // default "default" value
        defaultPaymentBtn.innerHTML = `Default Amount (1xlm)`
        localStorage.setItem("defaultCurrency", 'xlm')
        localStorage.setItem("defaultAmt", '1')
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
    if ((parseFloat(stellarPrice) * amount) <= 10.0) return true
    return false
}
function hasEnoughMoney(amount) {
    if (parseFloat(amount) > (parseFloat(userBal)+.00001)) return false;
    return true;
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
        $.post({url:`${host}api/sendPayment`,
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
    if (!hasEnoughMoney(amount)) {
        alert("Not enough money in account for that!")
        return
    }
    if (!validateAmount(amount)) {
        alert("Max transaction size is 10$, if you want to send more, use the Stellar account viewer")
        return
    }
    paymentStatusDiv.innerHTML = '<p>Waiting...</p>'
    sendPaymentToStellar(destKeyElement.innerHTML, amount, memo.innerHTML)
        .then(res => {
            paymentStatusDiv.innerHTML = `<div class="alert alert-success" role="alert">Success, sent ${amount} XLM\nSee this transaction on Stellar public ledger: ${res.url}</div>`
            loadUser()
        })
        .catch(msg => {
            paymentStatusDiv.innerHTML = `<div class="alert alert-danger" role="alert">
                                            Transaction failed, error message: ${msg}
                                          </div>`

        })
}

// TODO: More detailed error messaging
sendPaymentBtn.onclick = function (e) {
    var regex = /[A-Z0-9]{56}/;
    if (destKeyElement.innerHTML.match(regex)) {
        if (paymentAmount.value.match(/[a-z]/i) || !paymentAmount.value.match(/[0-9]/)) {
            alert('Payment amount needs to be a number (decimals ok)')
            return
        }
        // determine amount
        if (selectedCurrency.value === 'usd') {
            var amount = parseFloat(paymentAmount.value) / parseFloat(stellarPrice)
            sendPayment(amount.toFixed(4).toString())
        } else {
            sendPayment(parseFloat(paymentAmount.value).toFixed(4).toString())
        }
    } else alert('Destination key or source key not loaded, bad give page? Sorry')
}