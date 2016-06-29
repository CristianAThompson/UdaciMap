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
		marker.addListener('click', function(){
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
};