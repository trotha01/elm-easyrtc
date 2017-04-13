function connect() {
  easyrtc.setPeerListener(addToConversation);
  easyrtc.setRoomOccupantListener(convertListToButtons);
  easyrtc.connect("something", loginSuccess, loginFailure);
}

function addToConversation(who, msgType, content) {
  content = content.replace(/&/, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  content = content.replace(/\n/g, '<br />');
  document.getElementById('conversation').innerHTML +=
    "<b>" + who + ":</br>&nbsp;" + content + "<br />";
}

function convertListToButtons(roomName, occupants, isPrimary) {
  var otherClientDiv = document.getElementById('otherClients');
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }

  for(var easyrtcid in occupants) {
    var button = document.createElement('button');
    button.onclick = function(easyrtcid) {
      return function() {
        sendStuffWS(easyrtcid);
      };
    }(easyrtcid);
    var label = document.createTextNode("Send to " + easyrtc.idToName(easyrtcid));
    button.appendChild(label);

    otherClientDiv.appendChild(button);
  }
  if (!otherClientDiv.hasChildNodes() ) {
    otherClientDiv.innerHTML = "<em>Nobody else logged in to talk to...</em>";
  }
}

function sendStuffWS(otherEasyrtcid) {
  var text = document.getElementById('sendMessageText').value;
  if(text.replace(/\s/g, "").length === 0) { // Don't send just whitespace
    return;
  }
  easyrtc.sendDataWS(otherEasyrtcid, "message", text);
  addToConversation("Me", "message", text);
  document.getElementById('sendMessageText').value = "";
}

function loginSuccess(easyrtcid) {
  selfEasyrtcid = easyrtcid;
  document.getElementById("iam").innerHTML = "I am " + easyrtcid;
}

function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
