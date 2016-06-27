var map;
var marker;
var infowindow;
var markers = [];

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

	function populateInfoWindow(marker, infowindow) {
		//check to make sure the infowindow is not already opened on this marker
		if (infowindow.marker != marker) {
			infowindow.marker = marker;
			infowindow.setContent('<div>' + marker.title + "</div>");
			infowindow.open(map, marker);
			//make sure the marker property is cleared if the infowindow is closed
			infowindow.addListener('closeclick', function(){
				infowindow.setMarker(null);
			});
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
};