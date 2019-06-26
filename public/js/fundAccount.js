 let host = 'https://www.love-button.org/api/'
// let host = 'http://localhost:8080/api/'

$( document ).ready(function () {

    let lBPublicAddr = document.getElementById('loveButtonPubAddr')
    let memo = document.getElementById('memo')
    let balance = document.getElementById('balance')
    let paymentStatusDiv = document.getElementById('paymentStatusDiv')

    // load user details
    if (localStorage.getItem('loveButtonAuthToken')) {
        token = localStorage.getItem('loveButtonAuthToken')
        $.get({url:`${host}fund`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            success: function(res) {
                lBPublicAddr.value = res.loveButtonPublicAddress
                memo.value = res.memo
                balance.innerHTML = res.balance
                var oldBal = parseInt(balance.innerHTML)
                document.getElementById('accountInfoDiv').innerHTML = `<p>Logged in as: ${res.username}`
                const stopTrigger = setInterval(() => {
                    // check balance after 3 seconds
                    $.get(
                        {
                            url: `${host}checkBalance`,
                            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
                            success: function(res) {
                                console.log(res)
                                if (parseInt(res.balance) > oldBal) {
                                    balance.innerHTML = res.balance
                                    paymentStatusDiv.innerHTML = `<p>Success, received ${parseInt(res.balance) - oldBal} XLM</p>`
                                    paymentStatusDiv.style.backgroundColor = "#28a745";
                                    clearInterval(stopTrigger)
                                } else if (parseInt(res.balance) < oldBal) {
                                    oldBal = parseInt(res.balance)
                                    balance.innerHTML = res.balance
                                }
                            },
                            error: function(err) {
                                console.log("Check balance request failed")
                            }
                        }
                    )
                }, 5000)
            },
            error: function(err) {
                console.log("Fund account request failed")
                window.location.replace('/login')
            }
        })
    } // test if it will redirect the whole app or just the api request
    else {
        console.log("no auth token")
        window.location.replace('/login')
    }
})
