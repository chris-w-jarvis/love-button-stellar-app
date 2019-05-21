// let host = 'https://www.love-button.org/'
let host = 'http://localhost:8080/'

$( document ).ready(function () {

    let lBPublicAddr = document.getElementById('loveButtonPubAddr')
    let memo = document.getElementById('memo')
    let balance = document.getElementById('balance')

    // load user details
    if (localStorage.getItem('loveButtonAuthToken')) {
        token = localStorage.getItem('loveButtonAuthToken')
        $.get({url:`${host}api/fund`,
            beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            success: function(res) {
                lBPublicAddr.value = res.loveButtonPublicAddress
                memo.value = res.memo
                balance.innerHTML = res.balance
            },
            error: function() {
                console.log("Fund account request failed")
                window.location.replace('/login')
            }
        })
    } // test if it will redirect the whole app or just the api request
    else {
        window.location.replace('/login')
    }
})