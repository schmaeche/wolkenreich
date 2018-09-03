// mapboxctrl.js
// @author Andreas Werner
// @date September 2018
//
// handling map rendering for mapbox

var MBC = {};
var map;

var planeMarkerList = {
  elements: [],

  add: function(elem) {
    this.elements.push(elem);
  },

  clear: function() {
    while( this.elements.length) {
      this.elements[0].remove()
      this.elements.shift();
    }
  }
};

MBC.initialize = function() {
  mapboxgl.accessToken = 'pk.eyJ1Ijoic2NobWFlY2hlIiwiYSI6ImNqNTVmc3NvbzBvenUzM29hYW9jZXp0bG8ifQ.f9LIzhedtt9K8YwfpTcZdQ';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/schmaeche/cjllgbmo94c6f2so27etz1bpl'
  });

  map.addControl(new mapboxgl.GeolocateControl({
    fitBoundsOptions: {maxZoom: 9},
    trackUserLocation: false
  }));
}

//###############################
//### Map requests            ###
//###############################

MBC.getViewLocation = function() {
  var bounds = map.getBounds();
  return [ bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()];
}

MBC.showMarker = function( statesJson) {
  planeMarkerList.clear();
  var states = JSON.parse(statesJson);
  for( i in states.states) {
    var state = states.states[i];
    // create a DOM element for the marker
    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url(res/airplane-icon_big@0,1x.png)';
    el.style.width = '24px';
    el.style.height = '24px';
    el.innerHTML = state[1];
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
    var marker = new mapboxgl.Marker(el)
      .setLngLat( [parseFloat( state[5]), parseFloat( state[6])])
      .setPopup( new mapboxgl.Popup({ offset: 25 }) // add popups
      .setHTML( tooltip))
      .addTo(map);
    planeMarkerList.add( marker);
    //var icon = new PlaneMarkerIcon( {html: title});
    //layerPlane.addLayer( L.marker([parseFloat(state[6]), parseFloat(state[5])], {icon: icon}).bindTooltip(tooltip, {permanent: false}));
  }
}
