// mapmgr.js
// @author Andreas Werner
// @date September 2018
//
// event handling functions

//******************************************************************************
// VARIABLES
//******************************************************************************
var URL_BASE = 'https://schmaeche:18088d7b2a8eb8075fd4c12d9fb7e787@opensky-network.org/api/';
var URL_STATES = 'states/all';
var stateDataTimer = null;


//******************************************************************************
// HANDLER
//******************************************************************************
function btnUpdateClick(ev) {

  if( stateDataTimer) {
    clearTimeout(stateDataTimer);
    stateDataTimer = null;
  }
  else {
    _requestStates();
  }
}

function _requestStates() {
  var boxCoordinates = MBC.getViewLocation();
  var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
           if (this.readyState == 4 && this.status == 200) {
               //alert(this.responseText);
               MBC.showMarker(this.responseText);
               stateDataTimer = setTimeout( _requestStates, 5000);
           }
      };
      reqUrl = URL_BASE + URL_STATES + "?lamin=" + boxCoordinates[0] + "&lomin=" + boxCoordinates[1] + "&lamax=" + boxCoordinates[2] + "&lomax=" + boxCoordinates[3];
      request.open("GET", reqUrl, true);
      request.setRequestHeader("Content-type", "application/json");
      request.send();
      console.log( reqUrl);
}
