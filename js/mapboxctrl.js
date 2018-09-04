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

  map.on('load', function () {
    map.addSource("opensky-states-all", {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      }
    });

    map.addLayer({
      "id": "planes_flying",
      "type": "symbol",
      "source": "opensky-states-all",
      "layout": {
          "icon-image": "{icon}-15",
          "icon-rotate": { "type": "identity", "property": "true_track"},
          "text-field": "{callsign}",
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-offset": [0, 0.8],
          "text-anchor": "top",
          "text-size": 10
      },
      "paint": {
        "icon-color": "#b11010",
        "text-color": [
          "interpolate",
          ["linear"],
          ["get","vertical"],
          -8, "#b11010",
          0, "#6b6b6b",
          8, "#39b110"
        ],
        "text-halo-color": "#eceeed",
        "text-halo-width": 1,
        "text-halo-blur": 0.5
      }
    });
  });

  var popup = new mapboxgl.Popup({
    closeButton: true,
    closeOnClick: true
  });

  map.on('mouseenter', 'planes_flying', function(e) {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = 'pointer';

    var coordinates = e.features[0].geometry.coordinates.slice();
    var description = e.features[0].properties.description;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates)
        .setHTML(description)
        .addTo(map);
  });

  map.on('mouseleave', 'planes_flying', function() {
    map.getCanvas().style.cursor = '';
    //popup.remove();
  });

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
  var data = {
    "type": "FeatureCollection",
    "features": []
  }; //data

  for( i in states.states) {
    var state = states.states[i];
    var tooltip = "<div class='tooltip_gg'>";
    tooltip += "<div><b>icao: </b>" + state[0] + "</div>";
    tooltip += "<div><b>callsign: </b>" + state[1] + "</div>";
    tooltip += "<div><b>longitude: </b>" + state[5] + "</div>";
    tooltip += "<div><b>latitude: </b>" + state[6] + "</div>";
    tooltip += "<div><b>geo alt: </b>" + state[7] + "m</div>";
    tooltip += "<div><b>baro alt: </b>" + state[13] + "m</div>";
    tooltip += "<div><b>on ground: </b>" + state[8] + "</div>";
    tooltip += "<div><b>velocity: </b>" + state[9] + "m/s</div>";
    tooltip += "<div><b>heading: </b>" + state[10] + "deg</div>";
    tooltip += "<div><b>vertical: </b>" + state[11] + "m/s</div>";
    tooltip += "<div><b>origin: </b>" + state[2] + "</div>";
    tooltip += "<div><b>time: </b>" + new Date(state[3] * 1000) + "</div>";
    tooltip += "<div><b>last contact: </b>" + new Date(state[4] * 1000) + "</div>";
    tooltip += "<div><b>sensors: </b>" + state[12] + "</div>";
    tooltip += "<div><b>squak: </b>" + state[14] + "</div>";
    tooltip += "<div><b>spi: </b>" + state[15] + "</div>";
    tooltip += "<div><b>pos src: </b>" + state[16] + "</div>";
    tooltip += "</div>";

    data.features.push({
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [ parseFloat(state[5]), parseFloat(state[6]) ]
      },
      "properties": {
        "icon": "airport",
        "icao": state[0],
        "callsign": state[1],
        "longitude": parseFloat(state[5]),
        "latitude": parseFloat(state[6]),
        "true_track": state[10],
        "vertical": parseFloat(state[11]),
        "description": tooltip
      }
    });

  } // for
  map.getSource('opensky-states-all').setData(data);
}
