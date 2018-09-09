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

    map.addSource("opensky-tracks", {
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
    map.addLayer({
      "id": "plane_tracks",
      "type": "line",
      "source": "opensky-tracks",
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": "#1b1bb1",
        "line-opacity": 0.5,
        "line-width": 4
      }
    },
    "planes_flying"); // layer plane_tracks
  }); // on load

  var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
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
    popup.remove();
  });

  map.on('click', 'planes_flying', function(e) {
    //var coordinates = e.features[0].geometry.coordinates.slice();
    var icao = e.features[0].properties.icao;
    requestAircraftTrack(icao);
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


MBC.showAircraftFlights = function( flightsJson) {
  var flightsElem = document.getElementById('flights');
  flightsElem.innerHTML = flightsJson;

  var flights = JSON.parse(flightsJson);

  var data = {
    "type": "FeatureCollection",
    "features": [{
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": [ /*[140.4,37.3], [136.7845, 23.566] */]
      },
      "properties": {
        "icao": flights.icao24,
        "callsign": flights.callsign
      }
    }]
  }; //data

  var points = [];
  var lastlong = 0;
  var offset = 0;

  for ( i in flights.path)
  {
    // set a offset to draw lines over international date line
    if( (flights.path[i][2] - lastlong) < -180 ) {
      // crossing from west to east
      offset = 360;
    }
    else if ((flights.path[i][2] - lastlong) > 180) {
      // crossing from east to west
      offset = -360;
    }
    points.push( [ flights.path[i][2] + offset, flights.path[i][1]]);
    lastlong = flights.path[i][2] + offset;
  }

  var line = turf.lineString(points);
  var max = points.length;
  if (max > 1) {
    var lineDistance = turf.distance( points[0], points[max-1], {units: 'kilometers'});

    var steps = 500;

    // Draw an arc between the `origin` & `destination` of the two points
    for (var j = 0; j < lineDistance; j += lineDistance / steps) {
      var segment = turf.along( line, j, {units: 'kilometers'});
      // Update the route with calculated arc coordinates
      data.features[0].geometry.coordinates.push(segment.geometry.coordinates);
    }
  }
  map.getSource('opensky-tracks').setData(data);
}
