//
//Copyright (c) 2016, Skedans Systems, Inc.
//All rights reserved.
//
//Redistribution and use in source and binary forms, with or without
//modification, are permitted provided that the following conditions are met:
//
//    * Redistributions of source code must retain the above copyright notice,
//      this list of conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright
//      notice, this list of conditions and the following disclaimer in the
//      documentation and/or other materials provided with the distribution.
//
//THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
//AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
//IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
//ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
//LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
//CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
//SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
//INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
//CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
//ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
//POSSIBILITY OF SUCH DAMAGE.
//
var isConnected = false;

var node = document.getElementById('elm');
var app = Elm.Main.embed(node);

function initApp() {
    document.getElementById("main").className = "notconnected";
}

function connect(credentials, onSuccess) {
    console.log("Username: ", credentials.username)
    console.log("Password: ", credentials.password)
    easyrtc.setSocketUrl(":8080");

    // Listen for data sent from other clients
    easyrtc.setPeerListener(peerListener);

    // This will tell us who else is hooked up to the server
    // easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.setRoomEntryListener(roomEntryListener);
    easyrtc.setDisconnectListener(function() {
	// TODO: send this to elm and let it handle it
        jQuery('#rooms').empty();
        document.getElementById("main").className = "notconnected";
        console.log("disconnect listener fired");
    });
    easyrtc.setUsername(credentials.username);
    // easyrtc.setCredential({password: credentials.password});
    easyrtc.connect("easyrtc.instantMessaging", onSuccess, loginFailure);
    // easyrtc.connect("easyrtc.instantMessaging", loginSuccess, loginFailure);
}

app.ports.sendMessage.subscribe(function(data) {
	sendMessage(null, data.room, data.message);
});

app.ports.connect.subscribe(function(credentials) {

  onSuccess = function (easyrtcid) {
       app.ports.loginSuccess.send(easyrtcid)

       // refreshRoomList();
       isConnected = true;
       document.getElementById("main").className = "connected";
  }

  connect(credentials, onSuccess);
});

app.ports.refreshRoomList.subscribe(function() {
  onSuccess = function(roomList){
    var roomNames = []
    for (var roomName in roomList) {
      roomNames.push(roomName)
    }
    console.log("ROOMS!!!");
    console.log(roomNames);
    app.ports.roomList.send(roomNames);
  }

  easyrtc.getRoomList(onSuccess, null);

});

function roomEntryListener(entered, roomName) {
    console.log("roomEntryListener");
    console.log(entered);
    if (entered) { // entered a room
        console.log("saw add of room " + roomName);
        app.ports.addRoom.send(roomName);
    }
}



function addToConversation(who, msgType, content, targeting) {
    console.log("received: ", {who: who, content: content});
    app.ports.recvMessage.send({who: who, content: content});
}

function genRoomDivName(roomName) {
    return "roomblock_" + roomName;
}

function genRoomOccupantName(roomName) {
    return "roomOccupant_" + roomName;
}

/*
function setCredential(event, value) {
    if (event.keyCode === 13) {
        easyrtc.setCredential(value);
    }
}
*/



function leaveRoom(roomName) {
    if (!roomName) {
        roomName = document.getElementById("roomToAdd").value;
    }
    var entry = document.getElementById(genRoomDivName(roomName));
    var roomButtonHolder = document.getElementById('rooms');
    easyrtc.leaveRoom(roomName, null);
    roomButtonHolder.removeChild(entry);
}



function peerListener(who, msgType, content, targeting) {
    addToConversation(who, msgType, content, targeting);
}

function disconnect() {
    easyrtc.disconnect();
}

function occupantListener(roomName, occupants, isPrimary) {
  // Handle if we want to know who else is hooked up to the server
}

function getGroupId() {
        return null;
}


function sendMessage(destTargetId, destRoom, text) {
    console.log("SendMessage("+destRoom+")");
    // var text = document.getElementById('sendMessageText').value;
    if (text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
        return;
    }
    var dest;
    var destGroup = getGroupId();
    if (destRoom || destGroup) {
        dest = {};
        if (destRoom) {
            dest.targetRoom = destRoom;
        }
        if (destGroup) {
            dest.targetGroup = destGroup;
        }
        if (destTargetId) {
            dest.targetEasyrtcid = destTargetId;
        }
    }
    else if (destTargetId) {
        dest = destTargetId;
    }
    else {
        easyrtc.showError("user error", "no destination selected");
        return;
    }

    if( text === "empty") {
         easyrtc.sendPeerMessage(dest, "message");
    }
    else {
    easyrtc.sendDataWS(dest, "message", text, function(reply) {
        if (reply.msgType === "error") {
            easyrtc.showError(reply.msgData.errorCode, reply.msgData.errorText);
        }
    });
    }
    addToConversation("Me", "message", text);
    document.getElementById('sendMessageText').value = "";
}


function loginFailure(errorCode, message) {
    easyrtc.showError("LOGIN-FAILURE", message);
    document.getElementById('connectButton').disabled = false;
    jQuery('#rooms').empty();
}


function queryRoomNames() {
    var roomName = document.getElementById("queryRoom").value;
    if( !roomName ) {
        roomName = "default";
    }
    if( roomName ) {
        console.log("getRoomOccupantsAsArray("+ roomName + ")=" + JSON.stringify(easyrtc.getRoomOccupantsAsArray(roomName)));
        console.log("getRoomOccupantsAsMap(" + roomName + ")=" + JSON.stringify(easyrtc.getRoomOccupantsAsMap(roomName)));
    }
}
function addApiField() {
    var roomName = document.getElementById("apiroomname").value;
    var fieldname = document.getElementById("apifieldname").value;
    var fieldvaluetext = document.getElementById("apifieldvalue").value;
    var fieldvalue;
    if(fieldvaluetext.indexOf("{") >= 0) {
        fieldvalue = JSON.parse(fieldvaluetext);
    }
    else {
        fieldvalue = fieldvaluetext;
    }
    easyrtc.setRoomApiField(roomName, fieldname, fieldvalue);
}

