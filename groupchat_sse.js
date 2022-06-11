$(function () {
    // check for server-sent events support
    if (typeof (EventSource) == "undefined") {
        // Sorry! No server-sent events support..
        alert("Sorry, your browser does not support server-sent events.  Please try Chrome.");
        return;
    }

    //var apiUrl = "http://localhost:53456/api/ChatMessageSSE"
    var apiUrl = "http://www.rodansotto.com/mvc5/api/ChatMessageSSE"

    // initialize controls
    $("#spanUserName").text("");
    $("#divMessages").html("");

    // prompt for user name
    var rndNbr = Math.round(Math.random() * 100);
    var userName = prompt("Please enter a user name: ", "User" + rndNbr);
    $("#spanUserName").text(userName);


    // wire connect button to connect to server and set up SSE
    $("#buttonConnect").click(function () {
        // disable the connect button now before connecting 
        //  so user can't click on it multiple times while waiting for connection to be established
        //  which might take a while due to limited server resource
        // we will enable this though if connection failed
        $("#buttonConnect").text("Connecting...");
        $("#buttonConnect").attr("disabled", "disabled");
        connect();
    });

    function connect() {
        // call server to get a unique user ID to assign to this user
        $.ajax({
            method: "GET",
            url: apiUrl,
            success: onConnected, // on success, set up client to listen to server-sent events
            error: function (jqXHR, textStatus, errorThrown) {
                $("#buttonConnect").text("Connect");
                $("#buttonConnect").removeAttr("disabled").focus();
            }
        });
    };

    var userID;
    function onConnected(data) {
        $("#buttonConnect").text("Connect");

        userID = data;
        console.log("userID: " + userID);

        openEventSource();
        setUIConnect();
        appendToDivMessages("<span class='label label-success'>Connected</span><br /><br />");
    }

    var eventSource;
    function openEventSource() {
        console.log("userID: " + userID);
        eventSource = new EventSource(apiUrl + "\\" + userID);
        eventSource.onopen = function () {
            console.log("Connection to server opened.");
        };
        eventSource.onmessage = function (event) {
            // check if we have data
            if (event.data) {
                // event.data should contain "{userName}:{message}"
                var dataSplit = event.data.split(":");
                var userName = dataSplit[0];
                var message = dataSplit[1];
                var messageSplit = message.split("\n");

                appendToDivMessages("<span class='badge'>" + userName + ":</span> " + message + "<br />");
            }
        };
        eventSource.onerror = function () {
            console.log("eventSource.onerror");
            disconnect();
        };
    };

    function setUIConnect() {
        $("#buttonConnect").attr("disabled", "disabled");
        $("#buttonDisconnect").removeAttr("disabled");
        $("#textMessage").removeAttr("disabled").focus();
        $("#buttonSend").removeAttr("disabled");
    };


    // wire disconnect button to disconnect from server and close the SSE event source
    $("#buttonDisconnect").click(function () {
        disconnect();
    });

    function disconnect() {
        closeEventSource();
        setUIDisconnect();
        appendToDivMessages("<br /><span class='label label-danger'>Disconnected</span><br />");
    }

    function closeEventSource() {
        console.log("eventSource: " + eventSource);
        if (eventSource) {
            eventSource.close();
        }
    };

    function setUIDisconnect() {
        $("#buttonConnect").removeAttr("disabled").focus();
        $("#buttonDisconnect").attr("disabled", "disabled");
        $("#textMessage").attr("disabled", "disabled");
        $("#buttonSend").attr("disabled", "disabled");
    }


    // wire send button to send chat message
    $("#buttonSend").click(function () {
        sendMessage();
        $("#textMessage").val("");
    });

    function sendMessage() {
        $.ajax({
            method: "POST",
            url: apiUrl,
            contentType: "application/json",
            data: "\"" + userName + ":" + $("#textMessage").val() + "\""
        });
    }

    // wire enter key pressed on text message to click send
    $("#textMessage").keydown(function (e) {
        if (e.keyCode == 13) {
            $("#buttonSend").click();
            return false;
        }
    });

    function appendToDivMessages(appendString) {
        $("#divMessages").append(appendString);

        // always set scrollbar at bottom
        //$("#divMessages").scrollTop(200);
        var divMessages = document.getElementById("divMessages");
        divMessages.scrollTop = divMessages.scrollHeight - divMessages.clientHeight;
        //console.log("scrollTop: " + divMessages.scrollTop);
        //console.log("scrollHeight: " + divMessages.scrollHeight);
        //console.log("clientHeight: " + divMessages.clientHeight);
    };
});
