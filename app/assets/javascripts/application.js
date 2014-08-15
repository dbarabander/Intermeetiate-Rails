// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or vendor/assets/javascripts of plugins, if any, can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file.
//
// Read Sprockets README (https://github.com/sstephenson/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery-ui
//= require jquery_ujs
//= require jquery-ui/core
//= require jquery-ui/effect.all
//= require_tree .

var map;
var service;
var currentLocation;
var geocoder;

function initialize() {
  var address1 = [];
  var address2 = [];
  var markers = [];
  var midPointArray = [];
  var images = [];

  geocoder = new google.maps.Geocoder();
  var mapOptions = {
    zoom: 12
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  // Try HTML5 geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      currentLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
     //  var marker = new google.maps.Marker({
     //    position: currentLocation,
     //    map: map,
     //    icon: '/assets/letter_a.png'
   		// });
      // marker.setMap(map);
      map.setCenter(currentLocation);
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  };

  function recenter(position){
    var position_lat = position.lat();
    var position_long = position.lng();
    var latLng = new google.maps.LatLng(position_lat, position_long-.02);
    map.panTo(latLng);
  }


  $('#what_do').keypress(function(e) {
    if (e.which == 13) {
      $('#search').click();
    }
  });


  $('#back').click(function() {
    $('#results').hide('slide', {direction: 'right'}, 700,function(){
       $('#leftcontainer').show('slide', {direction: 'right'}, 700);
    });
    $('#searchdiv').addClass('edit');
  });

  $('ul').on('click', 'li', function() {
    var position = $(this).data('position');
    recenter(position);

  });


  $('ul').on('mouseover', 'li', function() {
    var markerId = $(this).attr('id');
    var marker = markers[markerId];
    marker.setIcon("assets/point.png");
    marker.setVisible(true)
  });

  $('ul').on('mouseout','li', function() {
    var markerId = $(this).attr('id');
	  var marker = markers[markerId];
	  var image = images[markerId];
	  marker.setIcon(image);
  });

  // $('#currentLocation').on(':checked', function(){
  //     $('#location_one').val('');
  //     $('#location_one').val('My Current Location');
  //   });


  $('#currentLocation').change(function(){
    if ($('#currentLocation').is(':checked') == true){
      $('#location_one').data("previous_value", $('#location_one').val());
      $('#location_one').val('My Current Location').prop('disabled',true);
    }
    else{

      $('#location_one').val($('#location_one').data("previous_value")).prop('disabled', false);
    }

    });

     

  $('#search').click(function() {
	  $('#searchdiv').addClass('searched');

    //slide search boxes out and display results
    $('#leftcontainer').hide();

    //slides in the results when the leftcontainer finishes sliding out
  	$('#results').show();


    if ($('#searchdiv').hasClass('edit')){
      $('#results li').remove();


      removeMarker(markers);
      removeMarker(address1);
      removeMarker(address2);

      console.log(address1);
      console.log(address2);
      removeMarker(midPointArray);
      markers = [];
      images = [];

      getGeoCodeAddress(address1Val);
      getGeoCodeAddress(address2Val);

    } 

    $('#searchdiv').removeClass('edit');

    if ($('#currentLocation').is(':checked') || $('#location_one').val().toLowerCase()=='my current location' ){
          geocoder.geocode({'latLng':currentLocation}, function (results, status){
            if (status == google.maps.GeocoderStatus.OK){
              getGeoCodeAddress(results[0].formatted_address);
              console.log(address1Val);
            }
          });
           var address2Val = $("#location_two").val(); 
           getGeoCodeAddress(address2Val);
           console.log(address2Val);
        }
    
    else{
          var address1Val = $("#location_one").val(); 
          var address2Val = $("#location_two").val();  
          getGeoCodeAddress(address1Val);
          getGeoCodeAddress(address2Val);
    }

    function getGeoCodeAddress(address) {
      geocoder.geocode({'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          lat_long_hash = results[0].geometry.location;
          map.setCenter(results[0].geometry.location);
          var marker = new google.maps.Marker({
            map: map,
            position: results[0].geometry.location
          });
          address1.push(marker);
          address2.push(marker); 

          checkForBothLocations(lat_long_hash);
        } else {
          // alert("Geocode was not successful for the following reason: " + status);
        }
      });
    }

    var first_complete_lat_long_hash = {};
    var second_complete_lat_long_hash = {};


    function checkForBothLocations(lat_long_hash) {
      if ($.isEmptyObject(first_complete_lat_long_hash)) {
        first_complete_lat_long_hash = lat_long_hash;
      } else {
        second_complete_lat_long_hash = lat_long_hash;
        getMidPoint(first_complete_lat_long_hash,second_complete_lat_long_hash);
      }
    }


    function getMidPoint(first_hash, second_hash) {
      var lat1 = first_hash.lat();
      var long1 = first_hash.lng();
      var lat2 = second_hash.lat();
      var long2 = second_hash.lng();
      var midPointLat = (parseFloat(lat1) + parseFloat(lat2))/2;
      var midPointLong = (parseFloat(long1) + parseFloat(long2))/2;
      var midPoint = new google.maps.LatLng(midPointLat,midPointLong);
      drawMidPoint(midPoint);
      getMidPointVenues(midPoint);
    }

    function drawMidPoint(midPoint){
      var image = '/assets/midpoint.png';
      var marker = new google.maps.Marker({
        position: midPoint,
        map: map,
        icon: image
      });
      recenter(midPoint);
      map.setZoom(14);
      midPointArray.push(marker);
    }

    function getMidPointVenues(midPoint){
      var venue = $('#what_do').val();
      var request = {
        location: midPoint,
        radius: '100',
        query: venue
      };
      service = new google.maps.places.PlacesService(map);
      service.textSearch(request, callbackMark);
    }

    function callbackMark(results, status) {
      if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < 8 && i < results.length; i++) {
          var place = results[i];  
          createList(place,i,results);
          createMarker(place,i,results);
        }
      }
    }

    function createMarker(place, i, results) {
      var image = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      var placeLoc = place.geometry.location;
      var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        icon: image
      });
      markers.push(marker);
      images.push(image);

      google.maps.event.addListener(marker, 'mouseover', function() {
        marker.setIcon("/assets/point.png");
      });

      google.maps.event.addListener(marker, 'mouseout', function() {
        marker.setIcon(image);
      });
    }

   

    function createList(place, i, results) {
      var name = $('<div class ="name">' + place['name'] + '</div>');
      var price = $('<div class ="price">' + priceConverter(place['price_level']) + '</div>');
      var rating = $('<div class ="rating">' + place['rating'] + '</div>');
      var address = $('<div class ="address">' + addressAbbreviator(place['formatted_address']) + '</div>');
      var photo;
      if (place['photos'] && place.photos.length > 0) {
        photo = $('<div class="photo"><img src="' + getPhoto(place) + '"></div>');
      } else {
        photo = $('<div class="photo"></div>');
      }
      var left = $('<div class="left"></div>').append(name).append(price).append(rating).append(address);
      var right = $('<div class="right"></div>').append(photo);
      var li = $('<li id="'+ i +'"></li>').append(left).append(right).data('id', place['id']).data('position', place.geometry.location);

      $('#results').append(li);
    }

    function priceConverter(price) {
      var x = parseInt(price);
      if (isNaN(x)) {
        return "";
      } else {
        return Array(parseInt(price) + 1).join('$');
      }
    }

    function getPhoto(place) {
      var photoArray = place.photos;
      return photoArray[0].getUrl({'maxWidth': 75, 'maxHeight': 75})
    }

    function addressAbbreviator(address) {
      var addressArray = address.split(',');
      newAddress = addressArray.slice(0,(addressArray.length-1));
      return newAddress
    }

    function removeMarker(array){
      for (index = 0; index < array.length; index++) {
        marker = array[index]
        marker.setVisible(false);
      }
    }


  });
}

function handleNoGeolocation(errorFlag) {
  var content;
  if (errorFlag) {
    content = 'Error: The Geolocation service failed.';
  } else {
    content = 'Error: Your browser doesn\'t support geolocation.';
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);
}

window.onload = function() {
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.src = 'http://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=initialize&key=AIzaSyBe1AdZQtoOdFvRC5IWoUo_C4F8nqw_QdU&libraries=places';
  document.body.appendChild(script);
};
