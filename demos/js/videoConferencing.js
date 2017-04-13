easyrtc.setStreamAcceptor( function(peerId, stream) {
  var video = document.getElementById('caller');
  easyrtc.setVideoObjectSrc(video, stream);
});

easyrtc.setOnStreamClosed( function(peerid) {
  easyrtc.setVideoObjectSrc(document.getElementById('caller'), "");
});

function my_init() {
  easyrtc.setRoomOccupantListener(loggedInListener);
  
  var connectSuccess = function(myId) {
    console.log("My easyrtcid is " + myId);
  }
  var connectFailure= function(err) {
    console.log("Error connecting: " + err);
  }

  var initSuccessCB = function() {
      var selfVideo = document.getElementById("self");
      easyrtc.setVideoObjectSrc(selfVideo, easyrtc.getLocalStream());
      easyrtc.connect("Something", connectSuccess, connectFailure)
  };
  var initFailureCB = function(err) {
    console.log("Error initing: " + err);
  };
  easyrtc.initMediaSource(
    initSuccessCB,
    initFailureCB
  );
}

function loggedInListener(roomName, otherPeers) {
  var otherClientDiv = document.getElementById('otherClients');
  while (otherClientDiv.hasChildNodes()) {
    otherClientDiv.removeChild(otherClientDiv.lastChild);
  }

  for(var i in otherPeers) {
    var button = document.createElement('button');
    button.onclick = function(easyrtcid) {
      return function() {
        performCall(easyrtcid);
      }
    }(i);

    label = document.createTextNode(i);
    button.appendChild(label);
    otherClientDiv.appendChild(button);
  }
}

function performCall(peerId) {
  easyrtc.call(
    peerId,
    function(easyrtcid) { console.log("completed call to " + easyrtcid);},
    function(errorCode, errorText) { console.log("err:" + errorText);},
    function(accepted, bywho) {
      console.log((accepted?"accepted":"rejected")+ " by " + bywho);
    }

  );
}
