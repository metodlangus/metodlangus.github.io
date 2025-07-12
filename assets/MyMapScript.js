let mapIndex = 0;

// Flag variable to choose the downloaded file name
var usePostTitle = false; // Set to true to use post title, false to use extracted GPX name

// Set track colour
var trackColour = 'orange';

// Generate map containers by iterating through valid gpx files.
while (typeof window[`gpxURL${mapIndex}`] !== 'undefined' && window[`gpxURL${mapIndex}`].includes('.gpx')) {
    // Access the variables
    const gpxURL = window[`gpxURL${mapIndex}`];
    const reliveURL = window[`ReliveURL${mapIndex}`];
    const stravaURL = window[`StravaURL${mapIndex}`];
    
    // Insert the map container
    insertMapContainer(gpxURL, reliveURL, stravaURL, mapIndex);
    
    // Move to the next map index
    mapIndex++;
}


function insertMapContainer(gpxURL, reliveURL, stravaURL, index) {
    console.log(`Inserting map container for index ${index}: GPX URL=${gpxURL}, Relive URL=${reliveURL}, Strava URL=${stravaURL}`);
    var scriptTags = document.getElementsByTagName('script');
    var targetScriptTag;
    for (var i = 0; i < scriptTags.length; i++) {
        if (scriptTags[i].innerText.includes('var gpxURL' + index)) {
            targetScriptTag = scriptTags[i];
            break;
        }
    }
    
    if (targetScriptTag) {
        // Create <hr> before the container (before the title and button)
        var hrBefore = document.createElement('hr');

        // Insert <hr> before the containerDiv
        targetScriptTag.parentNode.insertBefore(hrBefore, targetScriptTag);

        // Create a new container for the title and button
        var containerDiv = document.createElement('div');
        containerDiv.style.display = 'flex';
        containerDiv.style.alignItems = 'center'; // Vertically center the items

        // Create the title element
        var titleElement = document.createElement('b');
        titleElement.innerHTML = '<span style="font-size: 20px;">Sled poti na zemljevidu:</span>';

        // Append the title element to the container
        containerDiv.appendChild(titleElement);

        // Create the button to show the map
        const button = document.createElement('button');
        button.innerText = 'Prikaži zemljevid';

        // Apply the CSS class to the button
        button.className = 'show-map-button';

        // Append the button to the container (right side)
        containerDiv.appendChild(button);

        // Insert the container before the target script tag
        targetScriptTag.parentNode.insertBefore(containerDiv, targetScriptTag);

        // Create <hr> after the container (after the title and button)
        var hrAfter = document.createElement('hr');

        // Insert <hr> after the containerDiv
        targetScriptTag.parentNode.insertBefore(hrAfter, targetScriptTag.nextSibling);

        // Create the map container div but do not initialize the map yet
        var mapDiv = document.createElement('div');
        mapDiv.id = 'map-' + index; // Set unique ID using the index
        mapDiv.className = 'map-container';
        mapDiv.style.display = 'none'; // Initially hide the map container

        // Insert the map container right after the title and button container
        targetScriptTag.parentNode.insertBefore(mapDiv, targetScriptTag.nextSibling);

        // Attach click event to initialize and display the map
        button.onclick = function () {
            // Remove the button after click
            button.remove();

            // Show the mapDiv container
            mapDiv.style.display = 'block'; // Make the map container visible

            // Initialize the map on the newly created container div
            const map = L.map(mapDiv.id, {
                center: [46.357380, 14.292459],
                zoom: 15
            });

            // Add base tile layers
            const opentopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://www.opentopomap.org">OpenTopoMap</a>'
            }).addTo(map);

            const openstreetMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            });

            // Fetch GPX data from the URL
            fetch(gpxURL)
                .then(response => response.text())
                .then(gpx => {
                    // Parse GPX data
                    var parser = new DOMParser();
                    var geojson = toGeoJSON.gpx(parser.parseFromString(gpx, 'text/xml'));

                    // Convert GeoJSON to Leaflet polyline
                    var polyline = L.geoJson(geojson, {
                        style: function(feature) {
                            return { color: trackColour, weight: 2 };
                        }
                    }).getLayers()[0];

                    // Fit map to bounds of the polyline
                    map.fitBounds(polyline.getBounds());

                    // Add arrowheads to the polyline
                    var arrowLayer = L.polylineDecorator(polyline, {
                        patterns: [{
                            offset: 0,
                            repeat: 6,
                            symbol: L.Symbol.arrowHead({
                                pixelSize: 8,
                                pathOptions: {
                                    color: trackColour,
                                    fillOpacity: 1,
                                    weight: 0
                                }
                            })
                        }]
                    });

                    var GPXtrack = L.layerGroup([polyline, arrowLayer]).addTo(map);

                    // Define base and overlay layers for the map
                    var baseLayers = {
                        opentopoMap: opentopoMap,
                        openstreetMap: openstreetMap
                    };

                    var overlayLayers = {
                        'GPX track': GPXtrack
                    };

                    // Add layer control to the map
                    var layerControl = L.control.layers(baseLayers, overlayLayers).addTo(map);

                    // Get the name from the first feature's properties in the GPX file
                    var GPXname = geojson.features[0].properties.name;

                    // Call function that uses GPXname
                    useGPXname(GPXname);
                })
                .catch(error => {
                    console.error('Error fetching or parsing GPX data for index ' + index + ':', error);
                });

            // Create elevation control
            var elevation_options = {
                collapsed: true,
                distanceMarkers: false,
                downloadLink: true,
                edgeScale: false, 
                hotline: false,
                wptLabels: true,
                polyline: {
                    opacity: 0, // Make polyline invisible
                }
            };

            // Add elevation control to the map
            var controlElevation = L.control.elevation(elevation_options).addTo(map);
            controlElevation.load(gpxURL);

            // Add fullscreen control
            map.addControl(new L.Control.Fullscreen());

            // Function to set the filename and add download GPX control
            function useGPXname(GPXname) {
                var fileName = usePostTitle ? postTitle : GPXname;
                map.addControl(new L.Control.DownloadGPX({
                    position: 'topleft',
                    title: 'Download GPX',
                    gpxUrl: gpxURL,
                    fileName: fileName
                }));
            }

            // Create Strava link button if stravaURL exists
            if (stravaURL && stravaURL.trim() !== "") {
                var stravaButton = document.createElement('a');
                stravaButton.href = stravaURL;
                stravaButton.target = '_blank';  // Open in a new tab
                stravaButton.className = 'button strava-button';
                mapDiv.appendChild(stravaButton);
            }

            // Create Relive link button if reliveURL exists
            if (reliveURL && reliveURL.trim() !== "") {
                var reliveButton = document.createElement('a');
                reliveButton.href = reliveURL;
                reliveButton.target = '_blank';  // Open in a new tab
                reliveButton.className = 'button relive-button';
                mapDiv.appendChild(reliveButton);

                // Position Strava button 50px from the bottom
                if (stravaButton) {
                    stravaButton.style.bottom = '50px';
                }
            }
        };
    } else {
        console.error('Target script tag containing gpxURL' + index + ' not found.');
    }
}

