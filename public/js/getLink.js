$( document ).ready(function () {
    let getLinkBtn = document.getElementById('getLinkSubmitBtn')
    // let host = 'https://www.love-button.org/'
    let host = 'http://localhost:8080/'

    getLinkBtn.onclick = function() {
        var request = {}
        if (document.getElementById("publicKey").value != '') request['key'] = document.getElementById("publicKey").value
        else {
            alert("Need public key")
            return
        }
        if (document.getElementById("name").value != '') request['name'] = document.getElementById("name").value
        else {
            alert("Need a name or some text")
            return
        }
        if (document.getElementById("memo").value != '') request['memo'] = document.getElementById("memo").value
        if (document.getElementById("emailInput").value != '') request['emailInput'] = document.getElementById("emailInput").value
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
