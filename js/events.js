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
var URL_FLIGHTS = 'flights/aircraft';
var URL_TRACKS = 'tracks/all';
var stateDataTimer = null;
var isTrackDataTimer = false;
var selectedIcao = null;


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
  if( isTrackDataTimer && selectedIcao) {
    requestAircraftTrack(selectedIcao);
  }
}


function requestFlightsOfAircraft( icao) {
  console.log("requestFlightsOfAircraft");
  var request = new XMLHttpRequest();
  var dateEnd = Math.ceil( Date.now() / 1000) + 86400;
  var dateBegin = dateEnd - 172800;
  request.onreadystatechange = function() {
       if (this.readyState == 4 && this.status == 200) {
           MBC.showAircraftFlights(this.responseText);
       }
  };
  reqUrl = URL_BASE + URL_FLIGHTS + "?icao24=" + icao + "&begin=" + dateBegin + "&end=" + dateEnd;
  request.open("GET", reqUrl, true);
  request.setRequestHeader("Content-type", "application/json");
  request.send();
  console.log( reqUrl);
}

function requestAircraftTrack( icao) {
  console.log("requestAircraftTrack");
  selectedIcao = icao;
  isTrackDataTimer = true;
  var request = new XMLHttpRequest();
  var date = 0; // 0 == live
  request.onreadystatechange = function() {
       if (this.readyState == 4 && this.status == 200) {
           MBC.showAircraftTrack(this.responseText);
       }
  };
  reqUrl = URL_BASE + URL_TRACKS + "?icao24=" + selectedIcao + "&time=" + date;
  request.open("GET", reqUrl, true);
  request.setRequestHeader("Content-type", "application/json");
  request.send();
  console.log( reqUrl);
}

function stopRequestAircraftTrack() {
  if( isTrackDataTimer) {
    selectedIcao = null;
    isTrackDataTimer = false;
  }
}
