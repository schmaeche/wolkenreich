// mapmgr.js
// @author Andreas Werner
// @date September 2018
//
// mapmgr will be used to initialize leaflet map, adding flights

//###############################
//### Global variables        ###
//###############################
var map;
var currentPosition;
var MBmap = {};

//###############################
//### Map Element definitions ###
//###############################



//###############################
//### Geolocation handling    ###
//###############################

MBmap._setCurPos = function(position) {
  map.setView([position.coords.latitude, position.coords.longitude], 16);
}

MBmap._onError = function(error) {
  var txt;
  switch (error.code) {
    case error.PERMISSION_DENIED:
      txt = "No permission to access position.";
      break;
    case error.POSITION_UNAVAILABLE:
      txt = "Position not available";
      break;
    case error.TIMEOUT:
      txt = "Position timeout.";
      break;
    default:
      txt = "Unknown position error";
  }
  console.warn(txt);
}

MBmap._setCurrentPosition = function(event) {
  if( event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition( this._setCurPos , this._onError);
  }
}

MBmap._updateCurPos = function(pos) {
  if( currentPosition) {
    // console.warn("latest pos " + pos.coords.latitude + ", " + pos.coords.longitude);
    currentPosition.setLatLng([pos.coords.latitude, pos.coords.longitude]);
  }
  else {
    currentPosition = L.marker( [pos.coords.latitude, pos.coords.longitude], {title: "your current location"}).addTo(map);
  }
}

//###############################
//### Map initialization      ###
//###############################

MBmap.initMap = function() {
  // map init
  var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ';
  attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
  streetLayer =    L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: attribution});
  satLayer =       L.tileLayer(mbUrl, {id: 'mapbox.satellite', attribution: attribution});
  satStreetLayer = L.tileLayer(mbUrl, {id: 'mapbox.streets-satellite', attribution: attribution});
  outdoorsLayer =  L.tileLayer(mbUrl, {id: 'mapbox.outdoors', attribution: attribution});
  sportsLayer =    L.tileLayer(mbUrl, {id: 'mapbox.run-bike-hike', attribution: attribution});

  mapBaseLayers = {
    "Streets" : streetLayer,
    "Satellite" : satLayer,
    "Mixed" : satStreetLayer,
    "Outdoor" : outdoorsLayer,
    "Sports" : sportsLayer,
  };

  map = L.map( 'id_map', {layers: outdoorsLayer} );
  map.setView( [49.83488, 9.15214], 16);
  L.control.layers( mapBaseLayers).addTo( map);

  if(navigator.geolocation) {
    navigator.geolocation.watchPosition( this._updateCurPos, this._onError);
  }
  this._setCurrentPosition(null);

}
