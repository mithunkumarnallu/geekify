chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(message.method == "login") {
        login();
    }
});

function login(){
    chrome.identity.getAuthToken({"interactive":true}, function (token) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {accessToken: token}, function(response) {
                console.log(response.farewell);
            });
        });
    });

}