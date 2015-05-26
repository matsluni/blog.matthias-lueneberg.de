var infowinWidth,
    infoWinMinHeight,
    captiontimer,
    maptimer,
    currentPosMarker,
    markers         = [],
    mapLoaded       = false,
    mapOpen         = false,
    mapHeight       = $(window).height() - 120,
    infowindow      = null,
    currentPos      = new google.maps.LatLng($('#loc-settings').data('lat'), $('#loc-settings').data('lng')),
    zoomLevel       = $('#loc-settings').data('zoom-level'),
    polylineColor   = $('#loc-settings').data('polyline-color')

function bindInfoWindow(marker, map, infowindow, html) {
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.setContent(html);
        infowindow.open(map, marker);
        map.panBy(-50, -150);
    });
}

function travelMap() {

    if(mapLoaded) {console.log("map already loaded"); return;}
    mapLoaded = true;

    // options
    var mapOptions = {
        center: currentPos,
        zoom: zoomLevel,
        minZoom: 2,
        maxZoom: 18,
        mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'map_style']
        },
        disableDefaultUI: false
    };

     //build array from data attributes
    var travelLocs = [];
    $('select.marker-coords > option').each(function(){
        var $this = $(this);
        travelLocs.push([ $this.data('post-loc'), $this.data('post-loc-lat'), $this.data('post-loc-lng'), $this.data('post-url'), $this.data('post-excerpt'), $this.data('post-thumb'), $this.data('post-title'), $this.data('post-date') ]);
    });

     //set arrays
    var travelCoords = [],
        coordsArray = [],
        locArray = [];

     //get coords only for polylines
    for(var y = 1; y < travelLocs.length; y++) {
        coordsArray = $.makeArray( travelLocs[y] );
        travelCoords.push(new google.maps.LatLng(coordsArray[1], coordsArray[2]));
    }

     //polylines
    var travelItinerary = new google.maps.Polyline({
        path: $.merge(travelCoords, [currentPos]),
        geodesic: true,
        strokeColor: polylineColor,
        strokeOpacity: 1.0,
        strokeWeight: 2
    });

    // set map
    var map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);

     //set infowindow
    infowindow = new google.maps.InfoWindow({
        content: "loading...",
        maxWidth: infowinWidth
    });

     //loop for markers and infowindows
    for (var i = 1; i < travelLocs.length; i++) {
        // make array from key value pairs
        locArray = $.makeArray(travelLocs[i]);
        var hasBlogEntry = locArray[3] !== '#';
        var hasThumb = locArray[5] !== '#';
        var travelLocLabel = '<label class="loclabel"><span class="locnr">' + (i) + '</span></label>';
        var infoWindowPreviewMapMarker = '<span class="locpost-location">' + locArray[0] + ' - ' + locArray[7] + '</span>' +
            (hasThumb ? '<div class="locpost-preview" style="min-height:' + infoWinMinHeight +
            ';"><img style="width: 250px; height: auto !important;" src="' + locArray[5] + '" />': '') +'<p style="max-width: 400px">' +
            locArray[4] + '</div>';

        var infoWindowPreviewBlog = '<span class="locpost-location">' + locArray[0] + ' - ' + locArray[7] + '</span>' +
            '<a class="locpost-link" href="' + locArray[3] + '"><h4 class="locpost-title">' +
            locArray[6] + '</h4></a><div class="locpost-preview" style="min-height:' + infoWinMinHeight +
            ';"><img style="width: 250px; height: auto !important;" src="' + locArray[5] + '" /><p style="max-width: 400px">' +
            locArray[4] + '</p><a class="locpost-link" href="' + locArray[3] + '">Weiter lesen</a></div>';
        var infoWindowPreview = hasBlogEntry ? infoWindowPreviewBlog : infoWindowPreviewMapMarker;
        if ( i > 9 ) {
            setLabelAnchor = new google.maps.Point(7, 40);
        } else {
            setLabelAnchor = new google.maps.Point(4, 40);
        }
        // set markers
        markers[i] = new MarkerWithLabel({
            icon : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
            position: new google.maps.LatLng( locArray[1], locArray[2] ),
            map: map,
            draggable: false,
            labelContent: travelLocLabel,
            labelAnchor: setLabelAnchor,
            labelClass: "marker-label",// the CSS class for the label
            labelZIndex: i+1,
            html: infoWindowPreview,
            url: locArray[3],
            zIndex: i
        });

        bindInfoWindow(markers[i], map, infowindow, markers[i].html);
    }

     //get current loc
    currentPosMarker = new MarkerWithLabel({
        position: currentPos,
        icon : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        draggable: false,
        map: map,
        labelContent: "Aktuell",
        labelAnchor: new google.maps.Point(-20, 22),
        labelClass: "marker-label", // label css class
        labelInBackground: false
    });

    // add polyline
    travelItinerary.setMap(map);

    // scale map according to viewport height
    $(window).resize(function() {
        $('#travel-map, #map-canvas').css('height', $(window).height() - 120);
        if (!mapOpen) {
            $('#travel-map').css({marginTop: -($('#travel-map').height()) });
        }
        google.maps.event.trigger(map, 'resize');
    });

}
function toggleMap() {
    if(mapOpen) {

        $('#travel-map').delay(200).animate({marginTop: -($('#travel-map').height()) }, 300);
        $('#arrow-pos').addClass('map-btn').removeClass('close-btn');
        $('#map-arrow').removeClass('arrow-up').addClass('arrow-down');
        $('#travel-map-caption').slideUp(300);
        $('#travel-map-toggle').text('Karte');

        // remove anchor
        window.location.hash = '';
        mapOpen = false;
    } else {

        clearTimeout(captiontimer, maptimer);

        // load map
        maptimer = setTimeout(function() {
            travelMap();
        }, 1500);

        $('#travel-map').animate({ marginTop: "0px" }, 300);
        $('#arrow-pos').removeClass('map-btn').addClass('close-btn');
        $('#map-arrow').removeClass('arrow-down').addClass('arrow-up');
        $('#travel-map-caption').delay(200).slideDown(300);
        $('#travel-map-toggle').text('Schliessen');

        // map notification
        captiontimer = setTimeout(function() {
            $('#travel-map-caption').slideUp(300);
        }, 6000);

        // set anchor
        window.location.hash = 'map';
        mapOpen = true;
    }
}


var mapInit = {
    initialization: function() {
        $('#travel-map, #map-canvas').css('height', mapHeight);
        $('#travel-map').css({'z-index': 123456, 'margin-top' : -(mapHeight)});
        $("#travel-map-toggle").on('click', function() {
            toggleMap();
        });
        $("#location-toggle").on('click', function() {
            toggleMap();
        });
        if (window.location.hash === '#map') {
            toggleMap();
        }
    }
};

$(document).ready(mapInit.initialization());