// mapboxctrl.js
// @author Andreas Werner
// @date September 2018
//
// handling map rendering for mapbox

var MBC = {};
var map;
var clickedStateId = null;
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
    map.setLayerZoomRange("airport-label", 1, 24);

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
          "icon-image": "{icon}-11",
          "icon-rotate": { "type": "identity", "property": "true_track"},
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
          "text-field": [
            "step",
            ["zoom"],
            "",
            8, ["get", "callsign"]
          ],
          "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
          "text-offset": [0, 0.8],
          "text-anchor": "top",
          "text-size": [
            "interpolate", ["linear"],
            ["zoom"],
            7, 0,
            8, 9,
            12, 14,
            16,20
          ],
          "text-allow-overlap": true,
          "text-ignore-placement": true
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
        "icon-opacity": ["case",
              ["boolean", ["feature-state", "selected"], false],
               1,
               0.5
             ],
        "text-halo-color":  ["case",
              ["boolean", ["feature-state", "selected"], false],
               "#eceeed",
               "#eceeed"
             ],
        "text-halo-width": ["case",
              ["boolean", ["feature-state", "selected"], false],
               2,
               1
             ],
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

    // var coordinates = e.features[0].geometry.coordinates.slice();
    // var description = e.features[0].properties.description;
    //
    // // Ensure that if the map is zoomed out such that multiple
    // // copies of the feature are visible, the popup appears
    // // over the copy being pointed to.
    // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    //     coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    // }
    //
    // // Populate the popup and set its coordinates
    // // based on the feature found.
    // popup.setLngLat(coordinates)
    //     .setHTML(description)
    //     .addTo(map);
  });

  map.on('mouseleave', 'planes_flying', function() {
    map.getCanvas().style.cursor = '';
    // popup.remove();
  });

  map.on('click', 'planes_flying', function(e) {
    e.preventDefault();
    // e.originalEvent.preventDefault();
    // e.originalEvent.stopPropagation();
    console.log("click planes");
    if (e.features.length > 0) {
      if (clickedStateId) {
        map.setFeatureState({source: 'opensky-states-all', id: clickedStateId}, { selected: false});
        MBC.hideAircraftTracks();
      }
      clickedStateId = e.features[0].id;
      map.setFeatureState({source: 'opensky-states-all', id: clickedStateId}, { selected: true});
    }
    //var coordinates = e.features[0].geometry.coordinates.slice();
    var icao = e.features[0].properties.icao;
    requestAircraftTrack(icao);

  });

  map.on('click', function(e){
    console.log("click somewhere");
    if (!e.defaultPrevented && clickedStateId) {
      console.log("remove track");
      map.setFeatureState({source: 'opensky-states-all', id: clickedStateId}, { selected: false});
      MBC.hideAircraftTracks();
      stopRequestAircraftTrack();
    }
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
      },
      "id": parseInt( "0x" + state[0])
    });

  } // for
  map.getSource('opensky-states-all').setData(data);
}

MBC.showAircraftFlights = function( flightsJson) {
  var flightsElem = document.getElementById('flights');
  flightsElem.innerHTML = flightsJson;
}

MBC.showAircraftTrack = function( trackJson) {
  // var flightsElem = document.getElementById('flights');
  // flightsElem.innerHTML = trackJson;

  var flights = JSON.parse(trackJson);

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

    var pointN2 = [ flights.path[i][2] + offset, flights.path[i][1]];
    if( i > 0) {
      var pointN1 = data.features[0].geometry.coordinates[data.features[0].geometry.coordinates.length - 1];
      var lineDistance = turf.distance( turf.point(pointN1), turf.point(pointN2), {units: 'kilometers'});
      if(lineDistance > 50) {
        var steps = lineDistance / 50;
        var line = turf.lineString([pointN1, pointN2]);
        // Draw an arc between the `origin` & `destination` of the two points
        for (var j = 0; j < lineDistance; j += lineDistance / steps) {
          var segment = turf.along( line, j, {units: 'kilometers'});
          // Update the route with calculated arc coordinates
          data.features[0].geometry.coordinates.push(segment.geometry.coordinates);

        }
      }
    }

    data.features[0].geometry.coordinates.push(pointN2);
    lastlong = flights.path[i][2] + offset;
  }

  map.getSource('opensky-tracks').setData(data);
}

MBC.hideAircraftTracks = function() {
  map.getSource('opensky-tracks').setData({
    "type": "FeatureCollection",
    "features": []
  });
}
