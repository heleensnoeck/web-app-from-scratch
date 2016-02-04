(function() {
 
        'use strict'; // je mag niet zonder var werken bijv. zodat je netjes blijft werken je moet er een var voor zetten Je krijgt een error als je bijv name = jan gebruikt
        
        // Voor styling variablen https://github.com/airbnb/javascript/tree/master/es5#variables
        var sandbox = "sandbox";
        var linear = "linear";
        var gpsAvailable = 'gpsAvailable';
        var gpsUnavailable = 'gpsUnavailable';
        var positionUpdated = 'positionUpdated';
        var refreshRate = 1000;
        var currentPosition = false;
        var currentPositionMarker = false;
        var customDebugging = false;
        var debugId = false;
        var map = false;
        var interval = false;
        var intervalCounter = false;
        var updateMap = false;

        var locations = []; 
        var markers = [];


        function EventTarget() {
            this._listeners = {};  // een leeg object
        }

        EventTarget.prototype = {
            
            constructor: EventTarget,

            addListener: function(a, c) {
                
                "undefined" == typeof this._listeners[a] && (this._listeners[a] = []);
                this._listeners[a].push(c);

            },
            
            fire: function(a) {
                
                "string" == typeof a && (a = {
                    
                    type: a
                });

                a.target || (a.target = this);
                
                if (!a.type) throw Error("Event object missing 'type' property.");
                
                if (this._listeners[a.type] instanceof Array) {

                    for (var c = this._listeners[a.type], b = 0, d = c.length; b < d; b++) {
                        c[b].call(this, a);
                    }

                }

            },
            
            removeListener: function(a, c) {
               
                if (this._listeners[a] instanceof Array) {
                    
                    for (var b = this._listeners[a], d = 0, e = b.length; d < e; d++) {
                        
                        if (b[d] === c) {
                            b.splice(d, 1);
                            break;
                        }
                    }

                }

            }
        };

        var et = new EventTarget();

        var geo = {
            // Test of GPS beschikbaar is (via geo.js) en vuur een event af
            init: function() {
                debug.message("Controleer of GPS beschikbaar is..."); // klopt dit!????????????????????????????????????????????????????????????????????????? 

                et.addListener(gpsAvailable, startInterval);
                et.addListener(gpsAvailable, function() {
                    debug.message('GPS is niet beschikbaar.') // klopt dit!????????????????????????????????????????????????????????????????????????? 
                });

                (geoPositionJs.init()) ? et.fire(gpsAvailable): et.fire(gpsUnavailable); // hier roept hij ze aan 
            },

            // Start een interval welke op basis van refrashRate de positie updated
            startInterval: function(event) {
                debug.message("GPS is beschikbaar, vraag positie."); // klopt dit!????????????????????????????????????????????????????????????????????????? 
                this.updatePosition(); // roept update position aan
                interval = self.setInterval(updatePosition, this.refreshRate); /////////////////////// net als settimeout setinterval kijk naar variable refreshrate

                et.addListener(this.positionUpdated, checkLocations);
            },

            //////////////////////////////////////////////////////////////////// DE FUNCTIE HIERBOVEN MOET in function init

            // Vraag de huidige positie aan geo.js, stel een callback in voor het resultaat
            updateCurrentPosition: function() {
                intervalCounter++;
                geoPositionJs.get.CurrentPosition(setPosition, geoErrorHandler, {
                    enableHighAccuracy: true
                });
            },


            updatePosition: function(event)  { // verwijst naar een ander object geeft dit dan ook aan. Of is het .startInterval
                // use currentPosition to center the map
                var newPos = new google.maps.LatLng(this.currentPosition.coords.latitude, this.currentPosition.coords.longitude);
                map.setCenter(newPos);
                this.currentPositionMarker.setPosition(newPos);
                
            },

            // Callback functie voor het instellen van de huidige positie, vuurt een event af
            setPosition: function(position) {
                this.currentPosition = position;
                et.fire("positionUpdated");
                debug.message(intervalCounter + " positie lat:" + position.coords.latitude + " long:" + position.coords.longitude); // klopt dit!?????????????????????????????????????????????????????????????????????????
            },

            // Controleer de locaties en verwijs naar een andere pagina als we op een locatie zijn
            checkLocations: function(event) {
                // Liefst buiten google maps om... maar helaas, ze hebben alle coole functies
                for (var i = 0; i < locations.length; i++) {
                    var location = {
                        coords: {
                            latitude: locations[i][3],
                            longitude: locations[i][4]
                        }
                    };

                    if (_calculate_distance(location, this.currentPosition) < locations[i][2]) { // moet er bij currentposition nu wel of niet this voor!?????????????????????????????????????????????????????????????????????????

                        // Controle of we NU op die location zijn, zo niet gaan we naar de betreffende page
                        if (window.location != locations[i][1] && localStorage[locations[i][0]] == "false") {
                            // Probeer local storage, als die bestaat incrementeer de locatie
                            try {
                                (localStorage[locations[i][0]] == "false") ? localStorage[locations[i][0]] = 1: localStorage[locations[i][0]]++;
                            } catch (error) {
                                debug.message("Localstorage kan niet aangesproken worden: " + error); // klopt dit!?????????????????????????????????????????????????????????????????????????
                            }

                            // TODO: Animeer de betreffende marker

                            window.location = locations[i][1];
                            debug.message("Speler is binnen een straal van " + locations[i][2] + " meter van " + locations[i][0]);
                        }
                    }
                }
            },

            // Bereken het verchil in meters tussen twee punten
            calculateDistance: function(p1, p2) {
                var pos1 = new google.maps.LatLng(p1.coords.latitude, p1.coords.longitude);
                var pos2 = new google.maps.LatLng(p2.coords.latitude, p2.coords.longitude);
                return Math.round(google.maps.geometry.spherical.computeDistanceBetween(pos1, pos2), 0);
            },


            generateMap: function(myOptions, canvasId) {
                // TODO: Kan ik hier asynchroon nog de google maps api aanroepen? dit scheelt calls
                debug.message("Genereer een Google Maps kaart en toon deze in #" + canvasId) // klopt dit!?????????????????????????????????????????????????????????????????????????
                map = new google.maps.Map(document.getElementById(canvasId), myOptions);

                var routeList = [];
                // Voeg de markers toe aan de map afhankelijk van het tourtype
                debug.message("Locaties intekenen, tourtype is: " + tourType);
                for (var i = 0; i < locaties.length; i++) {

                    // Met kudos aan Tomas Harkema, probeer local storage, als het bestaat, voeg de locaties toe
                    try {
                        (localStorage.visited == undefined || isNumber(localStorage.visited)) ? localStorage[locaties[i][0]] = false: null;
                    } catch (error) {
                        debugMessage("Localstorage kan niet aangesproken worden: " + error);
                    }

                    var markerLatLng = new google.maps.LatLng(locaties[i][3], locaties[i][4]);
                    routeList.push(markerLatLng);

                    markers[i] = {};
                    for (var attr in locatieMarker) {
                        markers[i][attr] = locatieMarker[attr];
                    }
                    markers[i].scale = locaties[i][2] / 3;

                    var marker = new google.maps.Marker({
                        position: markerLatLng,
                        map: map,
                        icon: markers[i],
                        title: locations[i][0]
                    });
                }
                // TODO: Kleur aanpassen op het huidige punt van de tour
                if (tourType == linear) {
                    // Trek lijnen tussen de punten
                    debugMessage("Route intekenen");
                    var route = new google.maps.Polyline({
                        clickable: false,
                        map: map,
                        path: routeList,
                        strokeColor: 'Black',
                        strokeOpacity: .6,
                        strokeWeight: 3
                    });

                }

                // Voeg de locatie van de persoon door
                currentPositionMarker = new google.maps.Marker({
                    position: kaartOpties.center,
                    map: map,
                    icon: positieMarker,
                    title: 'U bevindt zich hier'
                });

                // Zorg dat de kaart geupdated wordt als het POSITION_UPDATED event afgevuurd wordt
                et.addListener(positionUpdated, update_positie);
                
            }

        };

		var utilities = {
            isNumber: function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }
        };

        var debug = {
        // FUNCTIES VOOR DEBUGGING
            geoErrorHandler: function: (code, message) {
                this.message('geo.js error ' + code + ': ' + message);
            },

            message: function (message) { // noem de methode dan message omdat hij in de variable debuf staat. 
                (this.setCustomDebugging && debugId) ? document.getElementById(debugId).innerHTML: console.log(message);
            },

            setCustomDebugging: function (debugId) {
                debugId = debugId;
                customDebugging = true;
            }
        };
}());
