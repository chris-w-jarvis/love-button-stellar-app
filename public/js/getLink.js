$( document ).ready(function () {
    let getLinkBtn = document.getElementById('getLinkSubmitBtn')
    let host = 'https://www.love-button.org/'
    //let host = 'http://localhost:8080/'

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
        $.post({url:`${host}api/getMyLink`,
            data:request,
            success: function(res) {
                document.getElementById('link').value = `${host}pages/${res.id}`
            },
            error: function() {
                alert('Request failed, try again later, sorry...');
            }
        })
    }
})