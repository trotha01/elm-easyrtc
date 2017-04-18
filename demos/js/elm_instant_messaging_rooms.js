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
var node = document.getElementById('elm');
var app = Elm.Main.embed(node);

function connect(credentials, onSuccess) {
    console.log("Username: ", credentials.username)
    easyrtc.setSocketUrl(":8080");

    // Listen for data sent from other clients
    easyrtc.setPeerListener(addToConversation);

    // This will tell us who else is hooked up to the server
    // easyrtc.setRoomOccupantListener(occupantListener);
    easyrtc.setRoomEntryListener(roomEntryListener);
    easyrtc.setDisconnectListener(function() {
	// TODO: send this to elm and let it handle it
        console.log("disconnect listener fired");
    });
    easyrtc.setUsername(credentials.username);
    easyrtc.connect("easyrtc.instantMessaging", onSuccess, loginFailure);
}

app.ports.sendMessage.subscribe(function(data) {
	sendMessage(data.room, data.message);
});

app.ports.connect.subscribe(function(credentials) {
  onSuccess = function (easyrtcid) {
       app.ports.loginSuccess.send(easyrtcid)
  }

  connect(credentials, onSuccess);
});

app.ports.refreshRoomList.subscribe(function() {
  onSuccess = function(roomList){
    var roomNames = []
    for (var roomName in roomList) {
      roomNames.push(roomName)
    }
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
    console.log("received: ", {who: who, msgType: msgType, content: content, targeting: targeting});
    app.ports.recvMessage.send({who: who, content: content});
}

function sendMessage(destRoom, text) {
    var dest = {};
    dest.targetRoom = destRoom;

    easyrtc.sendDataWS(dest, "message", text, function(reply) {
        if (reply.msgType === "error") {
            easyrtc.showError(reply.msgData.errorCode, reply.msgData.errorText);
        }
    });

    addToConversation("Me", "message", text);
}


function loginFailure(errorCode, message) {
    easyrtc.showError("LOGIN-FAILURE", message);
}

function leaveRoom(roomName) {
    easyrtc.leaveRoom(roomName, null);
}

function disconnect() {
    easyrtc.disconnect();
}

function occupantListener(roomName, occupants, isPrimary) {
  // Handle if we want to know who else is hooked up to the server
}
