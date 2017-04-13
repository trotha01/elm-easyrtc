function connect() {
  easyrtc.setRoomOccupantListener(convertListToButtons);
  easyrtc.easyApp(
    "easyrtc.ApplicationName",
    "self",
    ["caller"],
    loginSuccess,
    loginFailure);
}

function convertListToButtons(roomName, peers, isPrimary) {
  var otherClientDiv = document.getElementById('otherClients');
  otherClientDiv.innerHTML = "";
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }


  for(var easyrtcid in peers) {
    var button = document.createElement('button');

    button.onclick = function(easyrtcid) {
      return function() {
        performCall(easyrtcid);
      };
    }(easyrtcid);

    var label = document.createTextNode(easyrtcid);
    button.appendChild(label);
    otherClientDiv.appendChild(button);
  }
}

function performCall(peerID) {
  var successCB = function(id) {console.log("succesfully connected to: " + id)};
  var failureCB = function(error) {console.log("Error: " + error)};
  var acceptedCB = function(accepted, who) {console.log("Call accepted? " + accepted + " by " + who)};

  easyrtc.call(
    peerID,
    successCB,
    failureCB,
    acceptedCB
  );

}

function loginSuccess(easyrtcid) {
  console.log("My easyrtc id is: " + easyrtcid)
  easyrtc.showError("none", "Successfully connected");
}

function loginFailure(errorCode, message) {
  easyrtc.showError(errorCode, message);
}
