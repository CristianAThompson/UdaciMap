var map;
var marker;
var infowindow;
var markers = [];
//this global polygon is to ensure only a single polygon is rendered
var polygon = null;

function initMap() {

	//create a styles array to modify how the map looks and feels
	var styles = [
	{
		featureType: "water",
		stylers: [
			{color: "#19a0d8" }
		]
	},{
		featureType: 'administrative',
		elementType: 'labels.text.stroke',
		stylers: [
			{color: "#ffffff"},
			{weight: 6}
		]
	},{
		featureType: "administrative",
		elementType: "labels.text.fill",
		stylers: [
			{color: "#e85113"}
		]
	},{
		featureType: "transit.station",
		stylers: [
			{weight: 9},
			{hue: "#e85113"}
		]
	},{
		featureType: "road.highway",
		elementType: "geometry.stroke",
		stylers: [
			{color: "#efe9e4"},
			{lightness: -40}
		]
	},{
		featureType: "road.highway",
		elementType: "labels.icon",
		stylers: [
			{visibility: "off"}
		]
	},{
		featureType: "road.highway",
		elementType: "geometry.fill",
		stylers: [
			{color: "#efe9e4"},
			{lightness: -25}
		]
	}
	];
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.741818, lng: -74.003646},
		zoom: 13,
		styles: styles,
		mapTypeControl: false
	});


	var locations = [
	{title: "Park Avenue Penthouse", location: {lat: 40.7713024, lng: -73.9632393}},
	{title: "Chelsea Loft", location: {lat: 40.7444883, lng: -73.9949465}},
	{title: "Union Square Open Floor Plan", location: {lat: 40.7347062, lng: -73.9895759}},
	{title: "East Village Hip Studio", location: {lat: 40.7281777, lng: -73.984377}},
	{title: "TiBeCa Artsy Bachelor Pad", location: {lat: 40.7195264, lng: -74.0089934}},
	{title: "Chinatown Homey Space", location: {lat: 40.7180628, lng: -73.9961237}}
	];

	var largeInfoWindow = new google.maps.InfoWindow();

	//initialize a drawing manager
	var drawingManager = new google.maps.drawing.DrawingManager({
		drawingMode: google.maps.drawing.OverlayType.POLYGON,
		drawingControl: true,
		drawingControlOptions: {
			position: google.maps.ControlPosition.TOP_LEFT,
			drawingModes: [
			google.maps.drawing.OverlayType.POLYGON]
		}
	});

	var defaultIcon = makeMarkerIcon("0091ff");

	var highlightedIcon = makeMarkerIcon("FFFF24");

	for (var i = 0; i < locations.length; i++) {
		//Get the Position from the location array
		var position = locations[i].location;
		var title = locations[i].title;
		//Create a map marker per location and put into the markers array
		marker = new google.maps.Marker({
			position: position,
			title: title,
			icon: defaultIcon,
			animation: google.maps.Animation.DROP,
			id: i
		});
		//push the marker to our markers array
		markers.push(marker);
		//create an onclick event for each marker
		marker.addListener('click', function() {
			populateInfoWindow(this, largeInfoWindow);
		});
		//two event listeners: one for mouseover and one for mouseout
		marker.addListener('mouseover', function() {
			this.setIcon(highlightedIcon);
		});
		marker.addListener('mouseout', function() {
			this.setIcon(defaultIcon);
		});
	}

	document.getElementById('show-listings').addEventListener('click', showListings);
	document.getElementById('hide-listings').addEventListener('click', hideListings);

	document.getElementById('toggle-draw').addEventListener('click', function() {
		toggleDrawing(drawingManager);
	});

	document.getElementById('zoom-to-area').addEventListener('click', function() {
		zoomToArea();
	});

	document.getElementById('search-within-time').addEventListener('click', function() {
		searchWithinTime();
	});

	//add polygon event listener call the searchWithinPolygon function and only show markers within the polygon
	drawingManager.addListener('overlaycomplete', function(event){
		//first check if there is already a polygon
		//if yes remove it and the markers within it
		if (polygon) {
			polygon.setMap(null);
			hideListings();
		}
		//switching the drawing mode to the hand not the mark tool
		drawingManager.setDrawingMode(null);
		//creat a new editable polygon from the overlay
		polygon = event.overlay;
		polygon.setEditable(true);
		polygonArea = google.maps.geometry.spherical.computeArea(polygon.getPath());
		window.alert(polygonArea+' meters squared');
		//searching within the polygon
		searchWithinPolygon();
		//make sure the search is done again if the polygon is changed
		polygon.getPath().addListener('set_at', searchWithinPolygon);
		polygon.getPath().addListener('insert_at', searchWithinPolygon);
	});

	function populateInfoWindow(marker, infowindow) {
		//check to make sure the infowindow is not already opened on this marker
		if (infowindow.marker != marker) {
			infowindow.setContent('');
			infowindow.marker = marker;
			//make sure the marker property is cleared if the infowindow is closed
			infowindow.addListener('closeclick', function(){
				infowindow.marker = null;
			});
			var streetViewService = new google.maps.StreetViewService();
			var radius = 50;
			//In the case this status is ok which means that pano was found,
			//compute the position of the streetview image, then calculate the heading,
			//then get a panorama from that and set the options
			function getStreetView(data, status) {
				if (status == google.maps.StreetViewStatus.OK) {
					var nearStreetViewLocation = data.location.latLng;
					var heading = google.maps.geometry.spherical.computeHeading(
						nearStreetViewLocation, marker.position);
						infowindow.setContent('<div>' + marker.title + '</div><div id="pano"></div>');
						var panoramaOptions = {
							position: nearStreetViewLocation,
							pov: {
								heading: heading,
								pitch: 30
							}
						};
					var panorama = new google.maps.StreetViewPanorama(
						document.getElementById('pano'), panoramaOptions);
				} else {
					infowindow.setContent*('<div>' + marker.title + '</div>' +
						'<div>No Street View Found</div>');
				}
			}
			//Use streetview service to get the closest streetview image within
			//50 meters of the marker position
			streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
			//Open the infowindow at the correct marker
			infowindow.open(map, marker);
		}
	}

	//This function loops through markers array and displays them on map
	function showListings() {
		var bounds = new google.maps.LatLngBounds();
		//extend the boundries of the map for each marker and display the marker
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(map);
			bounds.extend(markers[i].position);
		}
		map.fitBounds(bounds);
	}

	//This function loops through the listings and hides them all
	function hideListings() {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
	}

	function makeMarkerIcon(markerColor) {
		var markerImage = new google.maps.MarkerImage(
			'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor + '|40|_|%E2%80%A2',
			new google.maps.Size(21, 34),
			new google.maps.Point(0, 0),
			new google.maps.Point(10, 34),
			new google.maps.Size(21, 34));
		return markerImage;
	}

	function toggleDrawing(drawingManager) {
		if (drawingManager.map) {
			drawingManager.setMap(null);
			//also remove the polygon but leave the markers from the defined area
			if (polygon) {
				polygon.setMap(null);
			}
		} else {
			drawingManager.setMap(map);
		}
	}

	//this function hides all markers outside the polygon
	//and shows only the ones within it this is what lets a user
	//specidy an area of search
	function searchWithinPolygon() {
		for (var i = 0; i < markers.length; i++) {
			if (google.maps.geometry.poly.containsLocation(markers[i].position, polygon)) {
				markers[i].setMap(map);
			} else {
				markers[i].setMap(null);
			}
		}
	}


	//This function takes the input value in the find nearby text area locates it
	//then zooms to that area this is so that the user can show all listings
	//then decide to focus on a specific area of the map
	function zoomToArea() {
		//initialize the geocoder
		var geocoder = new google.maps.Geocoder();
		//Get the address or place that the user entered
		var address = document.getElementById('zoom-to-area-text').value;
		//Make sure the address isn't blank
		if (address == '') {
			window.alert('You must enter an area, or address.');
		} else {
			//Geocode the address/area entered to get the center, then center the map
			//on that location and zoom in
			geocoder.geocode(
				{ address: address,
					componentRestrictions: {locality: 'New York'}
				}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						map.setCenter(results[0].geometry.location);
						map.setZoom(15);
					} else {
						window.alert('We could not find that location - try entering a more specific place.');
					}
				});
		}
	}

	//this function allows the user to input a desired travel time and only show
	//the listings that are within the travel time via a specified travel mode of
	//that location
	function searchWithinTime() {
		//initialize the distance matrix service
		var distanceMatrixService = new google.maps.DistanceMatrixService;
		var address = document.getElementById('search-within-time-text').value;
		//check to make sure the place entered isnt blank
		if (address == '') {
			window.alert('You must enter an address.');
		} else {
			hideListings();
			//use the distance matrix to calculate the duration of routes between all
			//markers and the destination entered by the user then put all origins
			//into an origin matrix
			var origins = [];
			for (var i = 0; i < markers.length; i++) {
				origins[i] = markers[i].position;
			}
			var destination = address;
			var mode = document.getElementById('mode').value;
			//now that both the origins and destination are defined get all info for
			//the distances between them
			distanceMatrixService.getDistanceMatrix({
				origins: origins,
				destinations: [destination],
				travelMode: google.maps.TravelMode[mode],
				unitSystem: google.maps.UnitSystem.IMPERIAL
			}, function(response, status) {
				if (status !== google.maps.DistanceMatrixStatus.OK) {
					window.alert('Error was: ' + status);
				} else {
					displayMarkersWithinTime(response);
				}
			});
		}
	}

	//this function iterates through each result and if the distance is less than
	//the value selected show the corresponding marker
	function displayMarkersWithinTime(response) {
		var maxDuration = document.getElementById('max-duration').value;
		var origins = response.originAddresses;
		var destinations = response.destinationAddresses;
		//parse the results and get the distance and duration of each
		//because there might be multiple origins we have a loop then make sure at
		//least 1 result was returned
		var atLeastOne = false;
		for (var i = 0; i < origins.length; i++) {
			var results = response.rows[i].elements;
			for (var j = 0; j < results.length; j++) {
				var element = results[j];
				if (element.status === "OK") {
					//the distance is returned in feet but the text is in miles, if we wanted
					//to switch to show the markers within a user entered distance we would
					//need the value for distance but for now we only need the text
					var distanceText = element.distance.text;
					//duration value is given in seconds so we make it minutes we need both
					//the value and the text
					var duration = element.duration.value / 60;
					var durationText = element.duration.text;
					if (duration <= maxDuration) {
						//the origin [i] should equal the markers[i]
						markers[i].setMap(map);
						atLeastOne = true;
						//create a mini infowindow to open immediately and contain the distance
						//and duration
						var infowindow = new google.maps.InfoWindow({
							content: durationText + ' away, ' + distanceText
						});
						infowindow.open(map, markers[i]);
						//put this in so that this small window closes if user clicks the marker
						//and the large infowindow opens
						markers[i].infowindow = infowindow;
						google.maps.event.addListener(markers[i], 'click', function() {
							this.infowindow.close();
						});
					}
				}
			}
		}
	}
};
