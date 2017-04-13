var selfEasyrtcid = "";
var waitingForRoomList = true;
var isConnected = false;

function initApp() {
  document.getElementById('main').className = 'notconnected';
}

function connect() {
  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(occupantListener);
  easyrtc.setRoomEntryListener(roomEntryListener);
  easyrtc.setDisconnectListener(function() {
    // jQuery('#rooms').empty()
    document.getElementById('main').className = 'notconnected';
    console.log('disconnect listener fired');
  });
  updatePresence();
  var username = document.getElementById('userNameField').value;
  var password = document.getElementById('credentialField').value;
  if (username) {
    easyrtc.setUsername(username);
  }
  if (password) {
    easyrtc.setCredential({password: password});
  }
  easyrtc.connect("foo", loginSuccess, loginFailure);
}

function addToConversation(who, msgType, content, targeting) {
  if( !content) {
    content = "**no body**";
  }
  content = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  content = content.replace(/\n/g, '<br />');
  var targetingStr = "";
  if (targeting) {
    if (targeting.targetEasyrtcid) {
      targetingStr += "user=" + targeting.targetEasyrtcid;
    }
    if (targeting.targetRoom) {
      targetingStr += " room=" + targeting.targetRoom;
    }
    if (targeting.targetGroup) {
      targetingStr += " group=" + targeting.targetGroup;
    }
  }
  document.getElementById('conversation').innerHTML +=
            "<b>" + who + " sent " + targetingStr + ":</b>&nbsp;" + content + "<br />";
}

function occupantListener(roomName, occupants, isPrimary) {
  if (roomName === null) {
    return;
  }
  var roomId = genRoomOccupantName(roomName);
  var roomDiv = document.getElementById(roomId);
  if (!roomDiv) {
    addRoom(roomName, "", false);
    roomDiv = document.getElementById(roomId);
  }

  console.log("occupantListener");
  console.log(roomName);
  console.log(occupants);
  console.log(isPrimary);
}

function addRoom(roomName, parmString, userAdded) {
  if (!roomName) {
    roomName = document.getElementById("roomToAdd").value;
    parmString = document.getElementById("optRoomParms").value;
  }
  var roomid = genRoomDivName(roomName);
  if (document.getElementById(roomid)) {
    return; // don't make a duplicate div
  }
  function addRoomButton() {
    var roomButtonHolder = document.getElementById('rooms');
    var roomdiv = document.createElement("div");
    roomdiv.id = roomid;
    roomdiv.className = "roomDiv";

    var roomButton = document.createElement("button");
    roomButton.onclick = function() {
      sendMessage(null, roomName);
    };
    var roomLabel = (document.createTextNode(roomName));
    roomButton.appendChild(roomLabel);

    roomdiv.appendChild(roomButton);
    roomButtonHolder.appendChild(roomdiv);
    var roomOccupants = document.createElement("div");
    roomOccupants.id = genRoomOccupantName(roomName);
    roomOccupants.className = "roomOccupants";
    roomdiv.appendChild(roomOccupants);
    $(roomdiv).append(" -<a href=\"javascript:\leaveRoom('" + roomName + "')\">leave</a>");
  }

  var roomParms = null;
  if (parmString && parmString !== "") {
    try {
      roomParms = JSON.parse(parmString);
    } catch (error) {
      roomParms = null;
      easyrtc.showError(easyrtc.errCodes.DEVELOPER_ERR, "Room Parameters must be an object containing key/value pars. eg: {\"fruit\":\"banana\", \"color\":\"yellow\"}");
      return;
    }
  }
  if (!isConnected || !userAdded) {
    addRoomButton();
    console.log("adding gui for room " + roomName);
  }
  else {
    console.log("not adding gui for room " + roomName + " because already connected and it's a user action");
  }
  if (userAdded) {
    console.log("calling joinRoom(" + roomName + ") because it was a user action");

    easyrtc.joinRoom(roomName, roomParms,
      function() {
        /* we'll get a room entry event for the room we were actually added to */
      },
      function(errorCode, errorText, roomName) {
        easyrtc.showError(errorCode, errorText + ": room name was(" + roomName + ")");
      });
  }
}

function getGroupId() {
  return null;
}

function sendMessage(destTargetId, destRoom) {
  var text = document.getElementById('sendMessageText').value;
  if (text.replace(/\s/g, "").length === 0) { // Don't just send whitespace
    return;
  }
  var dest;
  var destGroup = getGroupId();
  if (destRoom || destGroup) {
    dest = {}
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

  if (text === "empty") {
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
  document.getElementById('sendMessageText').value = ""
}

function genRoomOccupantName(roomName) {
  return "roomOccupant_" + roomName;
}

function genRoomDivName(roomName) {
  return "roomblock_" + roomName;
}


function roomEntryListener(entered, roomName) {
  console.log("roomEntryListener");
  console.log(entered);
  console.log(roomName);

}

function loginSuccess(easyrtcid) {
  selfEasyrtcid = easyrtcid;
  document.getElementById('iam').innerHTML = 'I am ' + easyrtcid;
  refreshRoomList();
  isConnected = true;
  displayFields();
  document.getElementById('main').className = 'connected';
}

function loginFailure(errorCode, message) {
  easyrtc.showError("LOGIN-FAILURE", message);
  document.getElementById('connectButton').disabled = false;
}

function refreshRoomList() {
  if(isConnected) {
    easyrtc.getRoomList(addQuickJoinButtons, null);
  }
}

function displayFields() {
  console.log('display fields');
}

function addQuickJoinButtons(roomList) {
  for (var room in roomList) {
    console.log('room: ', room);
  }

}

var currentShowState = 'chat';
var currentShowText = '';
function updatePresence() {
  easyrtc.updatePresence(currentShowState, currentShowText);
}
