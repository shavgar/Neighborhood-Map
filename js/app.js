// global variables
var mapWindow;
var map;

//Location Names
var Areas = [
    {
        name : 'Umayyad Mosque',
        latitude : 33.511944,
        longitude : 36.306667
    },
    {
        name : 'Umayyad Square',
        latitude : 33.513889,
        longitude : 36.276389
    },
    {
        name : 'National Museum',
        latitude : 33.512572,
        longitude : 36.290044
    },
    {
        name : 'Damascus University',
        latitude : 33.511389,
        longitude : 36.291389
    },
    {
        name : 'Al-Hamidiyah Souq',
        latitude : 33.510833,
        longitude : 36.300833
    }
];

var Location = function(location) {
    var self = this;

    self.name = ko.observable(location.name);
    self.latitude = ko.observable(location.latitude);
    self.longitude = ko.observable(location.longitude);
    self.active = ko.observable(false);

    self.Info = function(callback) {
        var wikipedia = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + self.name() + '&format=json&callback=wikiCallback';

        jQuery.ajax({
            url: wikipedia,
            dataType: 'jsonp',
        })
        .done(function(data) {
            var LocationInfo = '';
            if (data){
                if (typeof data[1] !=="udefined" && typeof data[3] !=="undefined"){
                    for (var i = 0; i < 3; i++) {
                        if (typeof data[1][i] !=="undefined" && typeof data[3][i] !=="undefined"){
                            LocationInfo += '<a href="' + data[3][i] + '" target"_blank">' + data[1][i] + '</a><br>';
                        }
                    }
                }
            }
            if (LocationInfo !== '') {
                self.content = ko.observable('Information from wikipedia about "' + self.name() + '"<p>' + LocationInfo + '</p>');                 
            } else {
                self.content = ko.observable('Information from wikipedia about "' + self.name() + '"<p> Error in loading the page </p>');                 
            }
        })
        .fail(function() {
            console.log("Error in loading the page");
            self.content = ko.observable('Information from wikipedia about "' + self.name() + '"<p> Error in loading the page</p>');                 
        })
        .always(function() {
            if (typeof callback !== "error"){
                callback(self);
            }
        });
    };

    // set marker for each location
    self.mapMarker = (function() {

        self.placeMarker = new google.maps.Marker({
            position: {lat: self.latitude(), lng: self.longitude()},
            map: map,
            title: self.name()
        });
        map.bounds.extend(self.placeMarker.position);
        self.placeMarker.addListener('click', function() {
            selectLocation(self);
        });

    })();
};

// initialize the google map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'));
    map.bounds = new google.maps.LatLngBounds();
    mapWindow = new google.maps.InfoWindow({
        content: ''
    });
    google.maps.event.addListener(mapWindow, 'closeclick', function(){
        resetActiveState();
    });
    google.maps.event.addDomListener(window, 'resize', function() {
        map.fitBounds(map.bounds);
    });
}

// showing the map
var mapView = function() {
    var self = this;
    this.loadingError = ko.observable(false);
    this.areaNames = ko.observableArray([]);
    Areas.forEach(function(location) {
        self.areaNames.push( new Location(location));
    });
    map.fitBounds(map.bounds);
    this.area = ko.observable(areaNames()[0]);
    this.searchName = ko.observable('');
    this.resetActiveState = function() {
        self.area().active(false);
        self.area().placeMarker.setAnimation(null);
        mapWindow.close();
    };

    // filtering the locations by the search name
    this.filterNames = ko.computed(function() {
        resetActiveState();
        return self.areaNames().filter(function (location) {
            var display = true;
            if (self.searchName() !== ''){
                if (location.name().toLowerCase().indexOf(self.searchName().toLowerCase()) !== -1){
                    display = true;
                }else {
                    display = false;
                }
            }
            location.placeMarker.setVisible(display);
            return display;
        });
    });

    // handler is clicked when clicking a location
    this.selectLocation = function(currentArea) {
        if (self.area() == currentArea && self.area().active() === true) {
            resetActiveState();
            return;
        }
        resetActiveState();
        self.area(currentArea);
        self.area().active(true);

        // open window to give information about the location
        mapWindow.setContent('<h2>' + self.area().name() + '</h2>' + self.area().Info(function(l){
            if (self.area() == l){
                mapWindow.setContent('<h2>' + self.area().name() + '</h2>' + l.content());
            }
        }));
        mapWindow.open(map, self.area().placeMarker);
    };
    this.hiddenList = ko.observable( window.innerWidth < 680 );
};
var app = function() {
    initMap();

    ko.applyBindings(mapView);
};

function googleMapsApiErrorHandler(){
    console.log('Whoops, could not load the map');
    $('body').prepend('<h3><p id="map-error">Error, Try reloading the page.</p><h3>');
}