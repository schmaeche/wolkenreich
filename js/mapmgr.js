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
var layerPlane;


//###############################
//### Map Element definitions ###
//###############################
var PlaneMarkerIcon = L.DivIcon.extend({
  options: {
    iconUrl: 'res/airplane-icon_big@0,1x.png',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, 0],
    className: "icon_plane"
  }
});


var MBmap = {
  //###############################
  //### Geolocation handling    ###
  //###############################

  _setCurPos: function(position) {
    map.setView([position.coords.latitude, position.coords.longitude], 10);
  },

  _onError: function(error) {
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
  },

  _setCurrentPosition: function(event) {
    if( event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition( this._setCurPos , this._onError);
    }
  },

  _updateCurPos: function(pos) {
    if( currentPosition) {
      // console.warn("latest pos " + pos.coords.latitude + ", " + pos.coords.longitude);
      currentPosition.setLatLng([pos.coords.latitude, pos.coords.longitude]);
    }
    else {
      currentPosition = L.marker( [pos.coords.latitude, pos.coords.longitude], {title: "your current location"}).addTo(map);
    }
  },

  //###############################
  //### Map initialization      ###
  //###############################

  initMap: function() {
    // map init
    // https://api.mapbox.com/styles/v1/schmaeche/cjllgbmo94c6f2so27etz1bpl.html?fresh=true&title=true&access_token=pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ#9.7/35.494149/139.990844/0
    var mbUrl = 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ';
    attribution = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>';
    streetLayer =    L.tileLayer(mbUrl, {id: 'mapbox.streets', attribution: attribution});
    satLayer =       L.tileLayer(mbUrl, {id: 'mapbox.satellite', attribution: attribution});
    satStreetLayer = L.tileLayer(mbUrl, {id: 'mapbox.streets-satellite', attribution: attribution});
    outdoorsLayer =  L.tileLayer(mbUrl, {id: 'mapbox.outdoors', attribution: attribution});
    sportsLayer =    L.tileLayer(mbUrl, {id: 'mapbox.run-bike-hike', attribution: attribution});
    lightLayer =    L.tileLayer(mbUrl, {id: 'mapbox.light', attribution: attribution});
    darkLayer =    L.tileLayer(mbUrl, {id: 'mapbox.dark', attribution: attribution});
    mylayer = L.tileLayer.wms('https://api.mapbox.com/styles/v1/schmaeche/cjllgbmo94c6f2so27etz1bpl/wmts?access_token=pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ')

    mapBaseLayers = {
      "Streets" : streetLayer,
      "Satellite" : satLayer,
      "Mixed" : satStreetLayer,
      "Outdoor" : outdoorsLayer,
      "Sports" : sportsLayer,
      "Light" : lightLayer,
      "Dark" : darkLayer,
      "Andi" : mylayer
    };

    map = L.map( 'id_map', {layers: lightLayer} );
    map.setView( [49.83488, 9.15214], 10);
    L.control.layers( mapBaseLayers).addTo( map);

    if(navigator.geolocation) {
      navigator.geolocation.watchPosition( this._updateCurPos, this._onError);
    }
    this._setCurrentPosition(null);

    layerPlane = L.layerGroup().addTo(map);

  },

  //###############################
  //### Map requests            ###
  //###############################

  getViewLocation: function() {
    var bounds = map.getBounds();
    return [ bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
  },

  showMarker: function( statesJson) {
    layerPlane.clearLayers();
    var states = JSON.parse(statesJson);
    for( i in states.states) {
      var state = states.states[i];
      var title = "<img src='res/airplane-icon_big@0,1x.png' /><div>" + state[1] + "</div>";
      var tooltip = "<div class='tooltip'>";
      tooltip += "<div><b>icao: </b>" + state[0] + "</div>";
      tooltip += "<div><b>callsign: </b>" + state[1] + "</div>";
      tooltip += "<div><b>origin: </b>" + state[2] + "</div>";
      tooltip += "<div><b>time: </b>" + new Date(state[3] * 1000) + "</div>";
      tooltip += "<div><b>last contact: </b>" + new Date(state[4] * 1000) + "</div>";
      tooltip += "<div><b>longitude: </b>" + state[5] + "</div>";
      tooltip += "<div><b>latitude: </b>" + state[6] + "</div>";
      tooltip += "<div><b>geo alt: </b>" + state[7] + "m</div>";
      tooltip += "<div><b>baro alt: </b>" + state[13] + "m</div>";
      tooltip += "<div><b>on ground: </b>" + state[8] + "</div>";
      tooltip += "<div><b>velocity: </b>" + state[9] + "m/s</div>";
      tooltip += "<div><b>track: </b>" + state[10] + "deg</div>";
      tooltip += "<div><b>vertical: </b>" + state[11] + "m/s</div>";
      tooltip += "<div><b>sensors: </b>" + state[12] + "</div>";
      tooltip += "<div><b>squak: </b>" + state[14] + "</div>";
      tooltip += "<div><b>spi: </b>" + state[15] + "</div>";
      tooltip += "<div><b>pos src: </b>" + state[16] + "</div>";
      tooltip += "</div>";
      var icon = new PlaneMarkerIcon( {html: title});
      layerPlane.addLayer( L.marker([parseFloat(state[6]), parseFloat(state[5])], {icon: icon}).bindTooltip(tooltip, {permanent: false}));
    }
  }

};
