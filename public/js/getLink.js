$( document ).ready(function () {
    let getLinkBtn = document.getElementById('getLinkSubmitBtn')
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

    getLinkBtn.onclick = function() {
        var request = {}
        if (document.getElementById("publicKey").value != '' && document.getElementById("publicKey").value.length == 56) request['key'] = document.getElementById("publicKey").value
        else {
            alert("Need 56 character public key")
            return
        }
        if (document.getElementById("name").value != '' && document.getElementById("name").value.length <= 128) request['name'] = document.getElementById("name").value
        else {
            alert("Need a name (can't be blank) that is 128 chars or less")
            return
        }
        if (document.getElementById("description").value != '' && document.getElementById("description").value.length <= 512) request['description'] = document.getElementById("description").value
        else {
            alert("Need a description(can't be blank) that is 512 chars or less")
            return
        }
        if (document.getElementById("memo").value != '') {
            if (document.getElementById('memo').value.length <= 19 && !document.getElementById('memo').value.match(/[a-z]/i)) request['memo'] = document.getElementById("memo").value
            else {
                alert("XLM Memo Id is all numbers (64 bit integer, the largest of which is 19 digits long)")
                return
            }
        }
        if (document.getElementById("emailInput").value != '') request['email'] = document.getElementById("emailInput").value
        $.post({url:`${host}api/get-my-link`,
            data:request,
            success: function(res) {
                document.getElementById('link').value = `${host}give/${res.id}`
                document.getElementById('copyLinkSection').style.display = 'block'
            },
            error: function(res) {
                alert(JSON.parse(res.responseText).msg);
            }
        })
    }
})
