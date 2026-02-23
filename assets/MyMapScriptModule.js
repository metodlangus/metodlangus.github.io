(function(window) {
    const startMarkerIcon = L.icon({
        iconUrl: 'https://metodlangus.github.io/photos/marker-icon-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: null
    });

    const endMarkerIcon = L.icon({
        iconUrl: 'https://metodlangus.github.io/photos/marker-icon-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: null
    });

    let baseUrl = '';
    let usePostTitle = false;  // Set to true to use post title, false to use extracted GPX name
    let trackColour = 'orange';
    let isBlogger = true;

    function init(userConfig = {}) {
        usePostTitle = userConfig.usePostTitle ?? false;
        trackColour = userConfig.trackColour ?? 'orange';
        baseUrl = userConfig.baseUrl || baseUrl;
        isBlogger = userConfig.isBlogger;

        let mapIndex = 0;

        while (typeof window[`gpxURL${mapIndex}`] !== 'undefined' && window[`gpxURL${mapIndex}`].includes('.gpx')) {
            const gpxURL = window[`gpxURL${mapIndex}`];
            const reliveURL = window[`ReliveURL${mapIndex}`];
            const stravaURL = window[`StravaURL${mapIndex}`];

            insertMapContainer(gpxURL, reliveURL, stravaURL, mapIndex);
            mapIndex++;
        }
    }

    function insertMapContainer(gpxURL, reliveURL, stravaURL, index) {
        console.log(`Inserting map container for index ${index}: GPX URL=${gpxURL}, Relive URL=${reliveURL}, Strava URL=${stravaURL}`);
        const scriptTags = document.getElementsByTagName('script');
        let targetScriptTag;
        for (let i = 0; i < scriptTags.length; i++) {
            if (scriptTags[i].innerText.includes('var gpxURL' + index)) {
                targetScriptTag = scriptTags[i];
                break;
            }
        }
        if (!targetScriptTag) return console.error('Script tag for gpxURL' + index + ' not found.');

        // Insert container UI
        const hrBefore = document.createElement('hr');
        targetScriptTag.parentNode.insertBefore(hrBefore, targetScriptTag);

        const containerDiv = document.createElement('div');
        containerDiv.style.display = 'flex';
        containerDiv.style.alignItems = 'center';

        const titleElement = document.createElement('b');
        titleElement.innerHTML = '<span style="font-size: 20px;">Sled poti na zemljevidu:</span>';
        containerDiv.appendChild(titleElement);

        const button = document.createElement('button');
        button.innerText = 'Prikaži zemljevid';
        button.className = 'show-map-button';
        containerDiv.appendChild(button);

        targetScriptTag.parentNode.insertBefore(containerDiv, targetScriptTag);

        const hrAfter = document.createElement('hr');
        targetScriptTag.parentNode.insertBefore(hrAfter, targetScriptTag.nextSibling);

        // Create map container div
        const mapDiv = document.createElement('div');
        mapDiv.id = 'map-' + index;
        mapDiv.className = 'map-container';
        mapDiv.style.display = 'none';
        targetScriptTag.parentNode.insertBefore(mapDiv, targetScriptTag.nextSibling);

        // Button click initializes the map
        button.onclick = function() {
            mapDiv.style.display = 'block';

            // Change button text and functionality to show the memory map
            button.innerText = 'Zemljevid spominov';
            button.onclick = function () {
                const trackFilename = gpxURL.split("/").pop();
                if (isBlogger) {
                    window.location.href = baseUrl + "/p/zemljevid-spominov.html?track=" + encodeURIComponent(trackFilename);
                } else {
                    window.location.href = baseUrl + "/zemljevid-spominov/?track=" + encodeURIComponent(trackFilename);
                }
            };

            const map = L.map(mapDiv.id, {
                center: [46.357380, 14.292459],
                zoom: 15
            });

            // Base layers
            const opentopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://www.opentopomap.org">OpenTopoMap</a>',
                minZoom: 1, updateWhenIdle: true
            }).addTo(map);

            const openstreetMap = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                minZoom: 1, updateWhenIdle: true
            });

            const esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
                attribution: "Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye",
                minZoom: 1, updateWhenIdle: true
            });

            let wasZoomedFromTopo = false;
            map.on('zoomend', () => {
                const z = map.getZoom();
                if (map.hasLayer(opentopoMap) && z > 15.5) {
                    map.removeLayer(opentopoMap);
                    map.addLayer(openstreetMap);
                    wasZoomedFromTopo = true;
                } else if (wasZoomedFromTopo && z <= 15.5) {
                    map.removeLayer(openstreetMap);
                    map.addLayer(opentopoMap);
                    wasZoomedFromTopo = false;
                }
            });

            // Load GPX
            fetch(gpxURL)
                .then(res => res.text())
                .then(gpx => {
                    const geojson = toGeoJSON.gpx(new DOMParser().parseFromString(gpx, 'text/xml'));
                    const polyline = L.geoJson(geojson, {
                        style: { color: trackColour, weight: 2 }
                    }).getLayers()[0];

                    map.fitBounds(polyline.getBounds());

                    const arrowLayer = L.polylineDecorator(polyline, {
                        patterns: [{
                            offset: 0,
                            repeat: 6,
                            symbol: L.Symbol.arrowHead({ pixelSize: 8, pathOptions: { color: trackColour, fillOpacity: 1, weight: 0 } })
                        }]
                    });

                    const GPXtrack = L.layerGroup([polyline, arrowLayer]).addTo(map);

                    const coords = geojson.features[0].geometry.coordinates;
                    const latlngs = coords.map(c => [c[1], c[0]]);

                    const startMarker = L.marker(latlngs[0], { icon: startMarkerIcon }).addTo(map);
                    const endMarker = L.marker(latlngs[latlngs.length - 1], { icon: endMarkerIcon }).addTo(map);

                    if (geojson.features[0].properties?.desc) {
                        const cleanDesc = geojson.features[0].properties.desc.replace(/<hr[^>]*>/gi, '');
                        startMarker.bindPopup(cleanDesc);
                        endMarker.bindPopup(cleanDesc);
                    }

                    const baseLayers = { "OpenTopoMap": opentopoMap, "OpenStreetMap": openstreetMap, "Esri Satellite": esriSatellite };
                    const overlayLayers = { 'GPX track': GPXtrack };
                    L.control.layers(baseLayers, overlayLayers).addTo(map);

                    useGPXname(geojson.features[0].properties?.name || `Track-${index}`, map, gpxURL);

                    // Elevation
                    const elevation_options = { collapsed: true, distanceMarkers: false, downloadLink: true, edgeScale: false, hotline: false, wptIcons: false, polyline: { opacity: 0 } };
                    const controlElevation = L.control.elevation(elevation_options).addTo(map);
                    controlElevation.load(gpxURL);

                    // Fullscreen
                    map.addControl(new L.Control.Fullscreen());

                    // Add external links
                    if (stravaURL?.trim()) addExternalLink(mapDiv, stravaURL, 'strava-button');
                    if (reliveURL?.trim()) addExternalLink(mapDiv, reliveURL, 'relive-button', stravaURL ? 50 : 0);
                })
                .catch(err => console.error('Error fetching/parsing GPX at index ' + index, err));
        };
    }

    function useGPXname(GPXname, map, gpxURL) {
        const fileName = usePostTitle ? (window.postTitle || GPXname) : GPXname;
        map.addControl(new L.Control.DownloadGPX({ position: 'topleft', title: 'Download GPX', gpxUrl: gpxURL, fileName }));
    }

    function addExternalLink(container, url, className, bottomPx = 0) {
        const btn = document.createElement('a');
        btn.href = url;
        btn.target = '_blank';
        btn.className = 'button ' + className;
        btn.style.position = 'absolute';
        btn.style.bottom = bottomPx + 'px';
        container.appendChild(btn);
    }

    // Expose module
    window.MyMapModule = { init };

})(window);
