$( document ).ready(function () {

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

    let lBPublicAddr = document.getElementById('loveButtonPubAddr')
    let memo = document.getElementById('memo')
    let balance = document.getElementById('balance')
    let paymentStatusDiv = document.getElementById('paymentStatusDiv')

    // load user details
    if (localStorage.getItem('loveButtonAuthToken')) {
        token = localStorage.getItem('loveButtonAuthToken')
        $.get({url:`${host}api/fund`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            success: function(res) {
                lBPublicAddr.value = res.loveButtonPublicAddress
                memo.value = res.memo
                balance.value = res.balance
                var oldBal = parseInt(balance.innerHTML)
                document.getElementById('accountInfoDiv').innerHTML = `<p>Logged in as: ${res.username}`
                const stopTrigger = setInterval(() => {
                    // check balance after 5 seconds
                    $.get(
                        {
                            url: `${host}api/checkBalance`,
                            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
                            success: function(res) {
                                console.log(res)
                                if (parseInt(res.balance) > oldBal) {
                                    balance.value = res.balance
                                    paymentStatusDiv.innerHTML = `<p>Success, received ${parseInt(res.balance) - oldBal} XLM</p>`
                                    paymentStatusDiv.style.backgroundColor = "#28a745";
                                    clearInterval(stopTrigger)
                                }
                            },
                            error: function() {
                                console.log("Check balance request failed")
                            }
                        }
                    )
                }, 5000)
            },
            error: function() {
                console.log("Fund account request failed")
                window.location.replace('/login')
            }
        })
    }
    else {
        console.log("no auth token")
        window.location.replace('/login')
    }
})