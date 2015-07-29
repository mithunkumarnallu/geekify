var ref;

function getURL(url) {
    url = url.substring(url.indexOf("//") + 2);
    url = url.replace(/\./g,"-").replace(/#/g,"").replace(/\//g,"\\");
    return url;
}

function markGotIt() {
    var tp = $('#topfixed');
    if ($('#gotIt').prop('checked')) {
        tp.removeClass('notdone');
        tp.addClass('done');
        tp.text('Got It!');
        var url = getURL(document.URL);
        ref.child(url).update({gotIt: true});
    } else {
        tp.removeClass('done');
        tp.addClass('notdone');
        tp.text('Yet to Get it!');
        var url = getURL(document.URL);
        ref.child(url).update({gotIt: false});
    }
}

function markGetBack() {
    if ($('#getBack').prop('checked')) {
        var url = getURL(document.URL);
        ref.child(url).update({getBack: true});
    } else {
        var url = getURL(document.URL);
        ref.child(url).update({getBack: false});
    }
}

function cutThroughGotIt(data) {
    if(data == true){
        $(this).css("color", "#006600");
        $(this).css("font-weight", "bold");
        $(this).css("text-decoration", "line-through");
    }
}

function cutThroughGetBack(data) {
    if(data == true){
        $(this).css("color", "#CC0000");
        $(this).css("font-weight", "bold");
    }
}

function markGotItLinks() {
    $(".site-content a").each(function() {
        if(this.href!= "") {
            var link = getURL(this.href);
            var callback = cutThroughGotIt.bind(this);
            isQuestionGotIt(link, callback);
        }
    });
}

function markGetBackLinks() {
    $(".site-content a").each(function() {
        if(this.href!= "") {
            var link = getURL(this.href);
            var callback = cutThroughGetBack.bind(this);
            isQuestionGetBack(link, callback);
        }
    });
}

function login(){
    chrome.runtime.sendMessage({
       method: "login"
    });
}

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if(request.accessToken) {
            ref = new Firebase("https://geekify.firebaseio.com");
            ref.authWithOAuthToken("google", request.accessToken, function(error, authData) {
                if (error) {
                    alert("Could not login... Error: " + error);
                    console.log("Login Failed!", error);
                } else {
                    console.log("Authenticated successfully with payload:", authData);
                    ref = ref.child(authData.uid);
                    ref.once("value", function(snapshot) {
                       if(!snapshot.exists())
                            ref.set({});
                    });
                    localStorage['geekifyId'] = authData.uid;
                    window.location.reload();
                }
            });
        }
    }
);

function isLoggedIn() {
    ref = new Firebase("https://geekify.firebaseio.com");
    if(ref.getAuth()) {
        if(localStorage['geekifyId']) {
            ref = ref.child(localStorage['geekifyId']);
            return true;
        } else {
            return false;
        }
    }
    else
        return false;
}

function isQuestionGotIt(url, callback) {
    ref.child(url).once("value", function(snapshot) {
        if(snapshot.child("gotIt").exists() && snapshot.child("gotIt").val() == true)
            callback(true);
        else
            callback(false);
    })
}

function isQuestionGetBack(url, callback) {
    ref.child(url).once("value", function(snapshot) {
        if(snapshot.child("getBack").exists() && snapshot.child("getBack").val() == true)
            callback(true);
        else
            callback(false);
    });
}

function isQuestionSolved(url, callback) {
    ref.child(url).once("value", function(snapshot) {
        if(snapshot.child("link").exists())
            callback(snapshot.child("link").val());
        else
            callback(null);
    });
}

function solve() {
    var url = getURL(document.URL);
    isQuestionSolved(url, function(link) {
        if(link) {
            //link already exists. Open it
            var newWindow = window.open(link);
        } else {
            //Open a new link
            var newLink = "http://collabandcode-itwsgroup10.rhcloud.com/#" + localStorage['geekifyId'] + new Date().getTime();
            var newWindow = window.open(newLink);
            if(newWindow)
                ref.child(url).update({link: newLink});
            else
                alert("Please allow popups!");
        }
    });
}

function allowDrop(ev) {
    ev.preventDefault();
}

function dragstart(ev) {
    var style = window.getComputedStyle(ev.target, null);
    console.log(style.getPropertyValue("left"));
    ev.originalEvent.dataTransfer.setData("text",
        (parseInt(style.getPropertyValue("left"),10) - ev.originalEvent.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - ev.originalEvent.clientY));
}

function drop(ev) {
    console.log(ev);
    ev.preventDefault();
    var data = document.getElementById("geekbox").style;
    var offset = ev.originalEvent.dataTransfer.getData("text").split(",");
    data.position = "fixed";
    console.log(offset);
    data.left = (ev.originalEvent.clientX  + parseInt(offset[0],10)) + "px";
    data.top = (ev.originalEvent.clientY + parseInt(offset[1],10)) + "px";    
}

$(document).ready(function() {
    if (!isLoggedIn()) {
        //user is not logged in. Show button to login at the top
        var head = $("<div id='topfixed' class='notdone'>Login!</div>");
        var div = $("<a href='#' id='login'>").append(head);
        $("body").append(div);
        $("#login").on("click", function() {
            login();
        });
    } else {

        var a = JSON.parse(localStorage.getItem('geekiT'));
        var send = localStorage.getItem('geekiT');
        var url = document.URL;
        url = getURL(url);
        var pat1 = "http://www.geeksforgeeks.org/";
        var pat2 = "http://www.geeksforgeeks.org/page/";
        var pat3 = "https://www.geeksforgeeks.org/";
        var pat4 = "https://www.geeksforgeeks.org/page/";

        var topFixed = '<div id="topfixed" class="notdone">Yet to Get it!</div>';
        var solveIt = "<span id='solve' class='btn btn-primary'>Solve it</span>";
        var gotIt = "<span style='margin: 2px'>Got it!</span><input id='gotIt' name='gotIt' type='checkbox'/>";
        var getBack = "<span style='margin: 2px'>Get Back!</span><input id='getBack' name='getBack' type='checkbox'/>";

        $("body").append(topFixed);
        $("body").append("<div id='geekbox' class='pull-right' draggable='true'></div>");
        $("#geekbox").append(solveIt).append(gotIt).append(getBack);

        $(document).on('click', '#solve', function () {
            solve();
        });

        $(document).on('click', '#gotIt', function () {
            markGotIt();
        });

        $(document).on('click', '#getBack', function () {
            markGetBack();
        });

        //Code to make the console movable
        $("body").on("dragover", allowDrop);

        $(document).on("dragstart", "#geekbox", dragstart);
        
        $("body").on("drop", drop);
        //end code to make console movable

        if (!(url == pat1) && !(url == pat3) && !(url.search(pat2) >= 0) && !(url.search(pat4) >= 0)) {
            isQuestionGotIt(url, function(data) {
                    var status = $('#topfixed');
                    if(data) {
                        $("#gotIt").attr("checked", true);
                        status.removeClass("notdone");
                        status.addClass("done");
                        status.text("Got it!");
                    } else {
                        $("#gotIt").attr("checked", false);
                        status.removeClass("done");
                        status.addClass("notdone");
                        status.text("Yet to Get it!");
                    }
                }
            );

            isQuestionGetBack(url, function(data) {
                    if(data) {
                        $("#getBack").attr("checked", true);
                    } else {
                        $("#gotIt").attr("checked", false);
                    }
                }
            );
        }

        markGetBackLinks();
        markGotItLinks();
    }
});
