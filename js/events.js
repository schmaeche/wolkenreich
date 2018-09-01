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


//******************************************************************************
// HANDLER
//******************************************************************************
function btnUpdateClick(ev) {

  var boxCoordinates = MBmap.getViewLocation();

  var request = new XMLHttpRequest();
      request.onreadystatechange = function() {
           if (this.readyState == 4 && this.status == 200) {
               //alert(this.responseText);
               MBmap.showMarker(this.responseText);
           }
      };
      reqUrl = URL_BASE + URL_STATES + "?lamin=" + boxCoordinates[0] + "&lomin=" + boxCoordinates[1] + "&lamax=" + boxCoordinates[2] + "&lomax=" + boxCoordinates[3];
      request.open("GET", reqUrl, true);
      request.setRequestHeader("Content-type", "application/json");
      request.send();
      console.log( reqUrl);
}
