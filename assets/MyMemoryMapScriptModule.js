(function (window) {

let config = {
    mapId: 'map',
    baseUrl: '',
    isRelive: false,
    enableRelive: false,
    initPhotosValue: -2,
    center: [46.27396640, 14.30939080],
    zoom: 8,
    isSignedIn: false
};

let map, gpxFolder, trackListUrl, photoListUrl, isRelive;
let reliveGpxFolder, reliveTrackListUrl, relivePhotoListUrl;

// Tile layers
let opentopoMap;
let openstreetMap;
let esriSatellite;

// Marker clusters
let markers;
let reliveMarkers;

// GPX layers and tracks
const masterLayerGroup = L.layerGroup();
const clusteredMarkers = L.markerClusterGroup();
const nonClusteredMarkers = L.layerGroup();
const tracks = {};
const hiddenTracks = {};
let currentlySelectedTrack = null;
let wasZoomedFromTopo = false;

// Relive layer groups (parallel to main)
const reliveClusteredMarkers = L.markerClusterGroup();
const reliveNonClusteredMarkers = L.layerGroup();
const reliveTracks = {};
const reliveHiddenTracks = {};
let currentlySelectedReliveTrack = null;

let trackMarkersAbortController = null;
let reliveTrackMarkersAbortController = null;

const trackColors = ['orange', 'blue', 'green', 'red', 'purple', 'brown', 'yellow', 'pink',
    'cyan', 'magenta', 'lime', 'teal', 'indigo', 'violet', 'coral', 'navy', 'olive', 'maroon',
    'turquoise', 'gold', 'salmon', 'crimson', 'darkorange', 'darkgreen', 'darkred', 'hotpink',
    'slateblue', 'mediumseagreen', 'midnightblue', 'darkviolet', 'forestgreen', 'greenyellow',
    'goldenrod', 'steelblue', 'dodgerblue', 'mediumorchid', 'chocolate', 'firebrick', 'seagreen',
    'darkslategray', 'lightcoral', 'lightseagreen', 'mediumvioletred', 'palevioletred', 'rosybrown',
    'sienna', 'thistle', 'tomato', 'wheat', 'skyblue', 'darkturquoise', 'deepskyblue', 'lawngreen',
    'mediumblue', 'darksalmon', 'lightslategray', 'lightsteelblue', 'lightgray', 'slategrey',
    'dimgray', 'darkkhaki', 'lightgoldenrodyellow', 'mediumslateblue', 'lightblue', 'cadetblue',
    'darkcyan', 'powderblue', 'aliceblue', 'paleturquoise', 'mediumpurple', 'darkmagenta',
    'blueviolet', 'chartreuse', 'springgreen', 'darkorange', 'orchid', 'deepskyblue', 'hotpink',
    'rosybrown', 'darkolivegreen', 'mediumturquoise', 'steelblue', 'dimgrey', 'indigo',
    'mediumaquamarine', 'lightseagreen', 'mediumspringgreen', 'tomato', 'firebrick', 'darkslateblue',
    'lightcoral', 'sandybrown', 'mediumvioletred', 'gold', 'lightslategray', 'darkgray',
    'darkgoldenrod', 'darkseagreen', 'darkslategray'
];

// -----------------
// INIT
// -----------------

function populateFilterInputs() {
    const defaults = {
        dayFilterStart: "1970-01-01",
        dayFilterEnd: "9999-12-31",
        timeFilterStart: "00:00",
        timeFilterEnd: "23:59",
        dailyTimeFilterStart: "00:00",
        dailyTimeFilterEnd: "23:59",
        trackDayFilterStart: "1970-01-01",
        trackDayFilterEnd: "9999-12-31",
    };

    Object.keys(defaults).forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = localStorage.getItem(id) || defaults[id];
        }
    });

    const checkbox = document.getElementById('usePhotoFilterForTracks');
    if (checkbox) {
        checkbox.checked = localStorage.getItem('usePhotoFilterForTracks') === 'true';
        applyPhotoFilterToTracks(checkbox.checked);

        checkbox.addEventListener('change', function () {
            localStorage.setItem('usePhotoFilterForTracks', this.checked);
            applyPhotoFilterToTracks(this.checked);
        });
    }
}

function applyPhotoFilterToTracks(checked) {
    setTrackFilterFieldsDisabled(checked);
}

function setTrackFilterFieldsDisabled(disabled) {
    ['trackDayFilterStart', 'trackDayFilterEnd'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.disabled = disabled;
        el.style.cursor = disabled ? 'not-allowed' : '';
        el.style.opacity = disabled ? '0.7' : '';
    });
}

function handleSliderChange() {
    const slider = document.getElementById('photosMapSliderElement');
    const valueDisplay = document.getElementById('photosMapValueElement');

    // Define titles for different photo ranges
    let specialTitle = config.isRelive
      ? {                               // If this is a Relive page
          "1": "Vse",                   // All photos are shown
          "0": "Naslovne"              // Only cover photos are shown
        }
      : {                               // If this is a normal (non-Relive) page
          "3": "Največ slik",           // Many photos
          "2": "Več slik",              // More photos
          "1": "Malo slik",             // Few photos
          "0": "Najboljše",             // Best photos
          "-1": "Naslovne",             // Cover photos
          "-2": "Z vrhov"               // Summit photos
        };

    valueDisplay.textContent = specialTitle[slider.value] || slider.value;
    localStorage.setItem('photosMapSliderValue', slider.value);
}

function initPhotoSlider() {
    const slider = document.getElementById('photosMapSliderElement');
    if (slider) {
        slider.disabled = !config.isSignedIn;
        slider.style.cursor = config.isSignedIn ? 'pointer' : 'not-allowed';
        slider.style.opacity = config.isSignedIn ? '1' : '0.7';
    }
    const valueDisplay = document.getElementById('photosMapValueElement');
    if (valueDisplay) {
        valueDisplay.disabled = !config.isSignedIn;
        valueDisplay.style.cursor = config.isSignedIn ? 'pointer' : 'not-allowed';
        valueDisplay.style.opacity = config.isSignedIn ? '1' : '0.7';
    }

    if (!slider || !valueDisplay) return;

    // Define special titles for specific values
    const specialTitle = config.isRelive
      ? {                               // Relive page
          "1": "Vse",
          "0": "Naslovne"
        }
      : {                               // Normal page
          "3": "Največ slik",
          "2": "Več slik",
          "1": "Malo slik",
          "0": "Najboljše",
          "-1": "Naslovne",
          "-2": "Z vrhov"
        };

    const storedValue = localStorage.getItem('photosMapSliderValue');
    const initialValue = storedValue !== null ? storedValue : String(config.initPhotosValue);

    slider.value = initialValue;
    valueDisplay.textContent = specialTitle[initialValue] || initialValue;

    slider.addEventListener('input', handleSliderChange);
}

let pendingTrackToLoad = null;

function init(userConfig = {}) {
    config = { ...config, ...userConfig };

    const blogCfg = createblogCfg();

    gpxFolder    = blogCfg.main.gpxFolder;
    trackListUrl = blogCfg.main.trackListUrl;
    photoListUrl = blogCfg.main.photoListUrl;

    reliveGpxFolder    = blogCfg.relive.gpxFolder;
    reliveTrackListUrl = blogCfg.relive.trackListUrl;
    relivePhotoListUrl = blogCfg.relive.photoListUrl;

    isRelive = config.isRelive;

    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
        pendingTrackToLoad = decodeURIComponent(trackParam);
    }

    createMap();
    initPhotoSlider();
    populateFilterInputs();
}

// -----------------
// BLOG CONFIG
// -----------------

function createblogCfg() {
    return {
        main: {
            gpxFolder:    `${config.baseUrl}/GPX_tracks/`,
            trackListUrl: `${config.baseUrl}/list_of_tracks.txt`,
            photoListUrl: `${config.baseUrl}/extracted_photos_with_gps_data.txt`,
        },
        relive: {
            gpxFolder:    `${config.baseUrl}/my_GPX_tracks/`,
            trackListUrl: `${config.baseUrl}/list_of_relive_tracks.txt`,
            photoListUrl: `${config.baseUrl}/extracted_relive_photos_with_gps_data.txt`,
        }
    };
}

// -----------------
// CREATE MAP
// -----------------
function createMap() {
    map = L.map(config.mapId).setView(config.center, config.zoom);

    opentopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data &copy; <a href="http://www.opentopomap.org">OpenTopoMap</a>',
        minZoom: 1, updateWhenIdle: true
    });

    openstreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        minZoom: 1, updateWhenIdle: true
    });

    esriSatellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "Tiles © Esri",
        minZoom: 1, updateWhenIdle: true
    });

    const startMarkerIcon = L.icon({
        iconUrl: 'https://metodlangus.github.io/photos/marker-icon-green.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: null
    });

    const photoMarkerIcon = L.icon({
        iconUrl: 'https://metodlangus.github.io/photos/marker-photo-icon-blue.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowUrl: null
    });

    let trackMarkersLoading = false;

    // -----------------
    // ADD MARKERS
    // Only populates the cluster group — never touches map visibility.
    // Layer on/off is controlled solely by the layer control + persistence block.
    // -----------------
    function addMarkers(data, targetMarkers, isReliveSource) {
        targetMarkers  = targetMarkers  || markers;
        isReliveSource = isReliveSource || false;

        var lines = data.split('\n');
        lines.forEach(function (line) {
            if (line.trim() === "") return;

            var regex = /(.+?),\s*Link:\s*(https?:\/\/[^\s]+),\s*data-skip=([^\s,]+),\s*"([^"]+)",\s*([^,]+),\s*Latitude:\s*([+-]?\d+\.\d+),\s*Longitude:\s*([+-]?\d+\.\d+)/;
            var match = line.match(regex);
            if (!match) return;

            var imageName = match[1];
            var imageLink = match[2];
            var dataSkip  = match[3] || null;
            var postTitle = match[4];
            var postLink  = isReliveSource
                ? config.baseUrl + "/relive/posts/" + (match[5] || "")
                : config.baseUrl + "/posts/"        + (match[5] || "");
            var latitude  = parseFloat(match[6]);
            var longitude = parseFloat(match[7]);

            if (!imageLink || isNaN(latitude) || isNaN(longitude)) return;

            let PhotosMapRange = getPhotosMapSliderValue();

            if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
                dataSkip = "3";
            }

            dataSkip = dataSkip.replace(/best/g,  "0");
            dataSkip = dataSkip.replace(/cover/g, "-1");
            dataSkip = dataSkip.replace(/peak/g,  "-2");

            const dataSkipValues = dataSkip.split(";");

            const isWithinRange = dataSkipValues.some(value => {
                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    if ([0, -1, -2].includes(PhotosMapRange)) {
                        return numericValue === PhotosMapRange;
                    }
                    return numericValue <= PhotosMapRange;
                }
                return false;
            });

            if (!isWithinRange) return;

            var captureDate;
            try {
                // Supported filename formats:
                // 20241104_130716.jpg  |  IMG20241029132928.jpg  |  IMG-20220627_162856.JPG
                // 20250615_043107056.JPG (with milliseconds)
                const imageTimeRegex = /^(\d{8})_(\d{6})(\d{3})?\.jpg$|^IMG(\d{8})(\d{6})\.jpg$|^IMG-(\d{8})_(\d{6})\.JPG$/i;
                const imageTimeMatch = imageName.match(imageTimeRegex);

                if (!imageTimeMatch) {
                    console.error('Image name does not contain a valid timestamp:', imageName);
                    return;
                }

                const datePart   = imageTimeMatch[1] || imageTimeMatch[4] || imageTimeMatch[6];
                const timePart   = imageTimeMatch[2] || imageTimeMatch[5] || imageTimeMatch[7];
                const millisPart = imageTimeMatch[3] || '';

                let captureDateString = `${datePart.slice(0,4)}-${datePart.slice(4,6)}-${datePart.slice(6,8)}T${timePart.slice(0,2)}:${timePart.slice(2,4)}:${timePart.slice(4,6)}`;
                if (millisPart) captureDateString += `.${millisPart}`;

                captureDate = new Date(captureDateString);

                if (isNaN(captureDate.getTime())) {
                    console.error('Invalid capture date parsed from image name:', captureDateString);
                    return;
                }
            } catch (error) {
                console.error('Error parsing capture date:', error);
                return;
            }

            // Enable/disable filter UI based on sign-in status
            const filterElements = [
                document.getElementById('photosMapSliderElement'),
                document.getElementById('photosMapValueElement'),
                document.getElementById('dayFilterStart'),
                document.getElementById('dayFilterEnd'),
                document.getElementById('timeFilterStart'),
                document.getElementById('timeFilterEnd'),
                document.getElementById('dailyTimeFilterStart'),
                document.getElementById('dailyTimeFilterEnd'),
                document.getElementById('applyFilters'),
                document.getElementById('usePhotoFilterForTracks')
            ];

            filterElements.forEach(el => {
                if (el) {
                    el.disabled    = !config.isSignedIn;
                    el.style.cursor  = config.isSignedIn ? 'pointer'     : 'not-allowed';
                    el.style.opacity = config.isSignedIn ? '1'           : '0.7';
                }
            });

            const timeFilterStart      = localStorage.getItem('timeFilterStart')      || "00:00";
            const timeFilterEnd        = localStorage.getItem('timeFilterEnd')        || "23:59";
            const dayFilterStart       = localStorage.getItem('dayFilterStart')       || "1970-01-01";
            const dayFilterEnd         = localStorage.getItem('dayFilterEnd')         || "9999-12-31";
            const dailyTimeFilterStart = localStorage.getItem('dailyTimeFilterStart') || "00:00";
            const dailyTimeFilterEnd   = localStorage.getItem('dailyTimeFilterEnd')   || "23:59";

            const filterStartDate = new Date(`${dayFilterStart}T${timeFilterStart}`);
            const filterEndDate   = new Date(`${dayFilterEnd}T${timeFilterEnd}`);

            if (!isNaN(filterStartDate.getTime()) && !isNaN(filterEndDate.getTime())) {
                if (filterStartDate > filterEndDate) return;
                if (captureDate < filterStartDate || captureDate > filterEndDate) return;
            }

            const captureHHMM = captureDate.toTimeString().slice(0, 5);
            if (dailyTimeFilterStart > dailyTimeFilterEnd) return;
            if (captureHHMM < dailyTimeFilterStart || captureHHMM > dailyTimeFilterEnd) return;

            var popupContent = `
                <div class="popup-container">
                    <a href="${postLink}">
                        <img src="${imageLink}" alt="${postTitle}" class="popup-image">
                    </a>
                    <div class="popup-caption">${postTitle}</div>
                </div>`;

            const photoMarker = L.marker([latitude, longitude], { icon: photoMarkerIcon });

            if (config.isSignedIn) {
                photoMarker.bindPopup(popupContent, { className: 'photo-popup' });
            } else {
                photoMarker.on('click', (e) => {
                    e.originalEvent.stopPropagation();
                    e.originalEvent.preventDefault();
                });
            }

            targetMarkers.addLayer(photoMarker);
        });
        // No map.addLayer() here — visibility is controlled solely by layer control + persistence block.
    }

    // Load main photos
    fetch(photoListUrl)
        .then(response => response.text())
        .then(data => addMarkers(data, markers, false))
        .catch(error => console.error('Error fetching photos metadata:', error));

    // Load Relive photos if enabled
    if (config.enableRelive) {
        fetch(relivePhotoListUrl)
            .then(response => response.text())
            .then(data => addMarkers(data, reliveMarkers, true))
            .catch(error => console.error('Error fetching Relive photos metadata:', error));
    }

    // Apply filters button
    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.disabled    = !config.isSignedIn;
        applyBtn.style.cursor  = config.isSignedIn ? 'pointer'   : 'not-allowed';
        applyBtn.style.opacity = config.isSignedIn ? '1'         : '0.7';

        applyBtn.addEventListener('click', function () {
            const dayFilterStart       = document.getElementById('dayFilterStart').value       || "1970-01-01";
            const dayFilterEnd         = document.getElementById('dayFilterEnd').value         || "9999-12-31";
            const timeFilterStart      = document.getElementById('timeFilterStart').value      || "00:00";
            const timeFilterEnd        = document.getElementById('timeFilterEnd').value        || "23:59";
            const dailyTimeFilterStart = document.getElementById('dailyTimeFilterStart').value || "00:00";
            const dailyTimeFilterEnd   = document.getElementById('dailyTimeFilterEnd').value   || "23:59";

            const checkbox       = document.getElementById('usePhotoFilterForTracks');
            const usePhotoFilter = checkbox && checkbox.checked;

            const trackDayFilterStart = usePhotoFilter ? dayFilterStart
                : (document.getElementById('trackDayFilterStart').value || "1970-01-01");
            const trackDayFilterEnd = usePhotoFilter ? dayFilterEnd
                : (document.getElementById('trackDayFilterEnd').value   || "9999-12-31");

            localStorage.setItem('dayFilterStart',          dayFilterStart);
            localStorage.setItem('dayFilterEnd',            dayFilterEnd);
            localStorage.setItem('timeFilterStart',         timeFilterStart);
            localStorage.setItem('timeFilterEnd',           timeFilterEnd);
            localStorage.setItem('dailyTimeFilterStart',    dailyTimeFilterStart);
            localStorage.setItem('dailyTimeFilterEnd',      dailyTimeFilterEnd);
            localStorage.setItem('usePhotoFilterForTracks', String(usePhotoFilter));
            localStorage.setItem('trackDayFilterStart',     trackDayFilterStart);
            localStorage.setItem('trackDayFilterEnd',       trackDayFilterEnd);

            // Reload main photos — restore visibility state after clear
            fetch(photoListUrl)
                .then(response => response.text())
                .then(data => {
                    const wasVisible = map.hasLayer(markers);
                    markers.clearLayers();
                    addMarkers(data, markers, false);
                    if (wasVisible) map.addLayer(markers);
                    applyPhotoFilterToTracks(usePhotoFilter);
                })
                .catch(error => console.error('Error fetching photos metadata:', error));

            // Reload Relive photos if enabled — restore visibility state after clear
            if (config.enableRelive) {
                fetch(relivePhotoListUrl)
                    .then(response => response.text())
                    .then(data => {
                        const wasReliveVisible = map.hasLayer(reliveMarkers);
                        reliveMarkers.clearLayers();
                        addMarkers(data, reliveMarkers, true);
                        if (wasReliveVisible) map.addLayer(reliveMarkers);
                    })
                    .catch(error => console.error('Error fetching Relive photos metadata:', error));
            }

            // Reload track markers
            clearTracks();
            loadTrackMarkers();

            if (config.enableRelive) {
                clearReliveTracks();
                loadReliveTrackMarkers();
            }
        });
    }

    function getPhotosMapSliderValue() {
        let photosMapSliderValue = localStorage.getItem('photosMapSliderValue');
        return photosMapSliderValue ? Number(photosMapSliderValue) : config.initPhotosValue;
    }

    // -----------------
    // TRACK HELPERS
    // -----------------

    function extractTrackName(filename) {
        const dateHourRegex = /^(\d{4})-(\d{2})-(\d{2}) \d{6} /;
        const dateMatch = filename.match(dateHourRegex);
        let date = dateMatch ? `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}.` : '';
        let name = filename.replace(dateHourRegex, '').split('__')[0].trim();
        return { trackName: name, trackDate: date };
    }

    async function loadGPXTrack(gpxURL, trackColor, marker, fitBounds = false, isReliveSource = false) {
        try {
            const response = await fetch(gpxURL);
            const gpx = await response.text();
            const geojson = toGeoJSON.gpx(new DOMParser().parseFromString(gpx, 'text/xml'));

            const polyline = L.geoJson(geojson, { style: { color: trackColor, weight: 2 } }).getLayers()[0];
            if (!polyline) {
                console.error('Polyline creation failed for', gpxURL);
                return;
            }

            if (fitBounds) {
                map.fitBounds(polyline.getBounds());
            }

            const arrowLayer = L.polylineDecorator(polyline, {
                patterns: [{
                    offset: 0, repeat: 7,
                    symbol: L.Symbol.arrowHead({ pixelSize: 6, pathOptions: { color: trackColor, fillOpacity: 1, weight: 2 } })
                }]
            });

            const startMarker = L.marker(polyline.getLatLngs()[0], { icon: startMarkerIcon })
                .bindPopup(marker.getPopup().getContent(), { className: 'track-popup' });

            if (isReliveSource) {
                reliveNonClusteredMarkers.addLayer(startMarker);
                reliveClusteredMarkers.removeLayer(marker);
            } else {
                nonClusteredMarkers.addLayer(startMarker);
                clusteredMarkers.removeLayer(marker);
            }

            const GPXtrack = L.layerGroup([polyline, arrowLayer, startMarker]).addTo(map);
            masterLayerGroup.addLayer(GPXtrack);

            const trackStore = isReliveSource ? reliveTracks : tracks;
            trackStore[marker.options.title] = { polyline, arrowLayer, color: trackColor, marker: startMarker };

            startMarker.on('click', () => highlightTrack(trackStore[marker.options.title], isReliveSource));
            polyline.on('click',    () => highlightTrack(trackStore[marker.options.title], isReliveSource));
        } catch (error) {
            console.error('Error fetching or parsing GPX data:', error);
        }
    }

    function highlightTrack(trackData, isReliveSource) {
        isReliveSource = isReliveSource || false;
        let currentRef = isReliveSource ? currentlySelectedReliveTrack : currentlySelectedTrack;

        if (currentRef && currentRef !== trackData) {
            resetTrackStyle(currentRef);
            currentRef.marker.closePopup();
        }

        setTrackStyle(trackData, 'black');
        trackData.marker.openPopup();

        if (isReliveSource) {
            currentlySelectedReliveTrack = trackData;
        } else {
            currentlySelectedTrack = trackData;
        }
    }

    function resetTrackStyle(trackData) {
        trackData.polyline.setStyle({ color: trackData.color });
        if (trackData.arrowLayer) trackData.arrowLayer.setStyle({ color: trackData.color });
    }

    function setTrackStyle(trackData, color) {
        trackData.polyline.setStyle({ color });
        if (trackData.arrowLayer) trackData.arrowLayer.setStyle({ color });
    }

    // Handle track click event near track line
    function handleTrackClick(e) {
        const clickLocation = e.latlng;
        const maxDistance   = 0.01;

        const allTrackSets = [
            { store: tracks,       isRelive: false },
            { store: reliveTracks, isRelive: true  },
        ];

        let nearestTrack    = null;
        let nearestDistance = Infinity;
        let nearestIsRelive = false;

        allTrackSets.forEach(({ store, isRelive: rel }) => {
            Object.values(store).forEach(trackData => {
                const distance = trackData.polyline.getLatLngs().reduce((closest, latlng) => {
                    return Math.min(closest, clickLocation.distanceTo(latlng));
                }, Infinity);

                if (distance < nearestDistance && distance <= maxDistance * 111000) {
                    nearestTrack    = trackData;
                    nearestDistance = distance;
                    nearestIsRelive = rel;
                }
            });
        });

        if (nearestTrack) {
            if (currentlySelectedTrack && currentlySelectedTrack !== nearestTrack) {
                currentlySelectedTrack.polyline.setStyle({ color: currentlySelectedTrack.color });
                if (currentlySelectedTrack.arrowLayer) currentlySelectedTrack.arrowLayer.setStyle({ color: currentlySelectedTrack.color });
                currentlySelectedTrack.marker.closePopup();
            }
            if (currentlySelectedReliveTrack && currentlySelectedReliveTrack !== nearestTrack) {
                currentlySelectedReliveTrack.polyline.setStyle({ color: currentlySelectedReliveTrack.color });
                if (currentlySelectedReliveTrack.arrowLayer) currentlySelectedReliveTrack.arrowLayer.setStyle({ color: currentlySelectedReliveTrack.color });
                currentlySelectedReliveTrack.marker.closePopup();
            }

            nearestTrack.polyline.setStyle({ color: 'black' });
            if (nearestTrack.arrowLayer) nearestTrack.arrowLayer.setStyle({ color: 'black' });
            nearestTrack.marker.openPopup();

            if (nearestIsRelive) {
                currentlySelectedReliveTrack = nearestTrack;
            } else {
                currentlySelectedTrack = nearestTrack;
            }
        }
    }

    // Clear all main tracks from map
    function clearTracks() {
        Object.entries(tracks).forEach(([key, trackData]) => {
            map.removeLayer(trackData.polyline);
            if (trackData.arrowLayer) map.removeLayer(trackData.arrowLayer);
            nonClusteredMarkers.removeLayer(trackData.marker);
            clusteredMarkers.addLayer(trackData.marker);
            hiddenTracks[key] = trackData;
            delete tracks[key];
        });
        currentlySelectedTrack = null;
    }

    // Clear all Relive tracks from map
    function clearReliveTracks() {
        Object.entries(reliveTracks).forEach(([key, trackData]) => {
            map.removeLayer(trackData.polyline);
            if (trackData.arrowLayer) map.removeLayer(trackData.arrowLayer);
            reliveNonClusteredMarkers.removeLayer(trackData.marker);
            reliveClusteredMarkers.addLayer(trackData.marker);
            reliveHiddenTracks[key] = trackData;
            delete reliveTracks[key];
        });
        currentlySelectedReliveTrack = null;
    }

    // Show tracks within current map viewport
    function showTracksInCurrentMapArea() {
        const bounds = map.getBounds();

        clusteredMarkers.eachLayer(marker => {
            if (bounds.contains(marker.getLatLng()) && !tracks[marker.options.title]) {
                const { trackDate } = extractTrackName(marker.options.title);
                if (isTrackWithinFilters(trackDate)) {
                    const trackColor = trackColors[Math.floor(Math.random() * trackColors.length)];
                    loadGPXTrack(`${gpxFolder}${marker.options.title}`, trackColor, marker, false, false);
                }
            }
        });

        Object.entries(hiddenTracks).forEach(([key, trackData]) => {
            if (bounds.contains(trackData.marker.getLatLng())) {
                const { trackDate } = extractTrackName(key);
                if (isTrackWithinFilters(trackDate)) {
                    map.addLayer(trackData.polyline);
                    if (trackData.arrowLayer) map.addLayer(trackData.arrowLayer);
                    clusteredMarkers.removeLayer(trackData.marker);
                    nonClusteredMarkers.addLayer(trackData.marker);
                    tracks[key] = trackData;
                    delete hiddenTracks[key];
                }
            }
        });

        if (config.enableRelive) {
            reliveClusteredMarkers.eachLayer(marker => {
                if (bounds.contains(marker.getLatLng()) && !reliveTracks[marker.options.title]) {
                    const { trackDate } = extractTrackName(marker.options.title);
                    if (isTrackWithinFilters(trackDate)) {
                        const trackColor = trackColors[Math.floor(Math.random() * trackColors.length)];
                        loadGPXTrack(`${reliveGpxFolder}${marker.options.title}`, trackColor, marker, false, true);
                    }
                }
            });

            Object.entries(reliveHiddenTracks).forEach(([key, trackData]) => {
                if (bounds.contains(trackData.marker.getLatLng())) {
                    const { trackDate } = extractTrackName(key);
                    if (isTrackWithinFilters(trackDate)) {
                        map.addLayer(trackData.polyline);
                        if (trackData.arrowLayer) map.addLayer(trackData.arrowLayer);
                        reliveClusteredMarkers.removeLayer(trackData.marker);
                        reliveNonClusteredMarkers.addLayer(trackData.marker);
                        reliveTracks[key] = trackData;
                        delete reliveHiddenTracks[key];
                    }
                }
            });
        }
    }

    // Custom control: show tracks in current area
    const ShowTracksControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button    = L.DomUtil.create('a', 'leaflet-control-show-tracks', container);
            button.href      = '#';
            button.title     = 'Show Tracks';
            button.innerHTML = '<span>&#x2713;</span>';

            if (!config.isSignedIn) {
                button.style.opacity       = 0.7;
                button.style.pointerEvents = 'none';
            } else {
                L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
                    .on(button, 'click', L.DomEvent.preventDefault)
                    .on(button, 'click', function () { showTracksInCurrentMapArea(); });
            }
            return container;
        }
    });

    // Custom control: clear all tracks
    const ClearTracksControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button    = L.DomUtil.create('a', 'leaflet-control-clear-tracks', container);
            button.href      = '#';
            button.title     = 'Clear All Tracks';
            button.innerHTML = '<span>&#x2715;</span>';

            if (!config.isSignedIn) {
                button.style.opacity       = 0.7;
                button.style.pointerEvents = 'none';
            } else {
                L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
                    .on(button, 'click', L.DomEvent.preventDefault)
                    .on(button, 'click', function () {
                        clearTracks();
                        if (config.enableRelive) clearReliveTracks();
                    });
            }
            return container;
        }
    });

    // -----------------
    // LOAD TRACK MARKERS (main)
    // -----------------
    function loadTrackMarkers() {
        if (trackMarkersAbortController) trackMarkersAbortController.abort();
        trackMarkersAbortController = new AbortController();
        const signal = trackMarkersAbortController.signal;

        clusteredMarkers.clearLayers();
        nonClusteredMarkers.clearLayers();
        Object.keys(hiddenTracks).forEach(k => delete hiddenTracks[k]);

        fetch(trackListUrl, { signal })
            .then(response => response.text())
            .then(data => {
                if (signal.aborted) return;
                const trackList = data.split('\n').map(line => line.split(';')).filter(parts => parts.length >= 3);

                trackList.forEach(([lat, lng, filename, coverPhoto, postLink]) => {
                    const { trackName, trackDate } = extractTrackName(filename);
                    const gpxURL      = `${gpxFolder}${filename}`;
                    const randomColor = trackColors[Math.floor(Math.random() * trackColors.length)];

                    if (!isTrackWithinFilters(trackDate)) return;

                    let popupContent;
                    if (coverPhoto && coverPhoto.trim() !== '' && postLink && postLink.trim() !== '') {
                        popupContent = `
                            <div class="popup-container">
                                <a href="${postLink}" target="_blank">
                                    <img src="${coverPhoto}" alt="${trackName}" class="popup-image">
                                </a>
                                <div class="popup-caption">${trackName}<br>${trackDate}</div>
                            </div>`;
                    } else {
                        popupContent = `
                            <div class="popup-container">
                                <div class="popup-caption">${trackName}<br>${trackDate}</div>
                            </div>`;
                    }

                    const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
                        icon: startMarkerIcon, title: filename
                    });

                    if (config.isSignedIn) {
                        marker.bindPopup(popupContent, { className: 'track-popup' });
                        marker.on('click', () => loadGPXTrack(gpxURL, randomColor, marker, false, false));
                    } else {
                        marker.on('click', (e) => {
                            e.originalEvent.stopPropagation();
                            e.originalEvent.preventDefault();
                        });
                    }

                    clusteredMarkers.addLayer(marker);

                    if (pendingTrackToLoad && filename === pendingTrackToLoad && config.isSignedIn) {
                        setTimeout(() => {
                            loadGPXTrack(gpxURL, randomColor, marker, true, false);
                            pendingTrackToLoad = null;
                        }, 500);
                    }
                });
            })
            .catch(error => {
                if (error.name !== 'AbortError') console.error('Error loading track markers:', error);
            });
    }

    // -----------------
    // LOAD RELIVE TRACK MARKERS
    // -----------------
    function loadReliveTrackMarkers() {
        if (reliveTrackMarkersAbortController) reliveTrackMarkersAbortController.abort();
        reliveTrackMarkersAbortController = new AbortController();
        const signal = reliveTrackMarkersAbortController.signal;

        reliveClusteredMarkers.clearLayers();
        reliveNonClusteredMarkers.clearLayers();
        Object.keys(reliveHiddenTracks).forEach(k => delete reliveHiddenTracks[k]);

        fetch(reliveTrackListUrl, { signal })
            .then(response => response.text())
            .then(data => {
                if (signal.aborted) return;
                const trackList = data.split('\n').map(line => line.split(';')).filter(parts => parts.length >= 3);

                trackList.forEach(([lat, lng, filename, coverPhoto, postLink]) => {
                    const { trackName, trackDate } = extractTrackName(filename);
                    const gpxURL      = `${reliveGpxFolder}${filename}`;
                    const randomColor = trackColors[Math.floor(Math.random() * trackColors.length)];

                    if (!isTrackWithinFilters(trackDate)) return;

                    let popupContent;
                    if (coverPhoto && coverPhoto.trim() !== '' && postLink && postLink.trim() !== '') {
                        popupContent = `
                            <div class="popup-container">
                                <a href="${postLink}" target="_blank">
                                    <img src="${coverPhoto}" alt="${trackName}" class="popup-image">
                                </a>
                                <div class="popup-caption">${trackName}<br>${trackDate}</div>
                            </div>`;
                    } else {
                        popupContent = `
                            <div class="popup-container">
                                <div class="popup-caption">${trackName}<br>${trackDate}</div>
                            </div>`;
                    }

                    const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
                        icon: startMarkerIcon, title: filename
                    });

                    if (config.isSignedIn) {
                        marker.bindPopup(popupContent, { className: 'track-popup' });
                        marker.on('click', () => loadGPXTrack(gpxURL, randomColor, marker, false, true));
                    } else {
                        marker.on('click', (e) => {
                            e.originalEvent.stopPropagation();
                            e.originalEvent.preventDefault();
                        });
                    }

                    reliveClusteredMarkers.addLayer(marker);
                });
            })
            .catch(error => {
                if (error.name !== 'AbortError') console.error('Error loading Relive track markers:', error);
            });
    }

    // Check if a track date falls within the active date filter
    function isTrackWithinFilters(trackDate) {
        const trackDateParts = trackDate.split('.');
        if (trackDateParts.length !== 4) return true;

        const day   = parseInt(trackDateParts[0], 10);
        const month = parseInt(trackDateParts[1], 10) - 1;
        const year  = parseInt(trackDateParts[2], 10);

        const trackDateTime = new Date(Date.UTC(year, month, day));
        if (isNaN(trackDateTime.getTime())) return true;

        const filterStartStr = localStorage.getItem('trackDayFilterStart') || "1970-01-01";
        const filterEndStr   = localStorage.getItem('trackDayFilterEnd')   || "9999-12-31";

        const filterStart = new Date(filterStartStr + 'T00:00:00Z');
        const filterEnd   = new Date(filterEndStr   + 'T23:59:59Z');

        if (isNaN(filterStart.getTime()) || isNaN(filterEnd.getTime())) return true;
        if (filterStart > filterEnd) return false;
        if (trackDateTime < filterStart || trackDateTime > filterEnd) return false;

        return true;
    }

    // Auto-switch base layer at zoom threshold
    function handleZoomChange() {
        const zoomLevel = map.getZoom();

        if (map.hasLayer(opentopoMap)) {
            if (zoomLevel > 15.50) {
                if (!map.hasLayer(openstreetMap)) {
                    map.removeLayer(opentopoMap);
                    map.addLayer(openstreetMap);
                    wasZoomedFromTopo = true;
                    localStorage.setItem('mapBaseLayer', 'OpenStreetMap');
                }
            }
        } else if (map.hasLayer(openstreetMap)) {
            if (zoomLevel <= 15.50 && wasZoomedFromTopo) {
                map.removeLayer(openstreetMap);
                map.addLayer(opentopoMap);
                wasZoomedFromTopo = false;
                localStorage.setItem('mapBaseLayer', 'OpenTopoMap');
            }
        }
    }

    // -----------------
    // LAYER SETUP
    // -----------------

    markers       = L.markerClusterGroup({ maxClusterRadius: 20 });
    reliveMarkers = L.markerClusterGroup({ maxClusterRadius: 20 });

    // Build layer structure before touching the map
    masterLayerGroup.addLayer(clusteredMarkers);
    masterLayerGroup.addLayer(nonClusteredMarkers);

    if (config.enableRelive) {
        masterLayerGroup.addLayer(reliveClusteredMarkers);
        masterLayerGroup.addLayer(reliveNonClusteredMarkers);
    }

    const overlayLayers = {
        "GPX sledi": masterLayerGroup,
        "Slike":     markers,
    };

    if (config.enableRelive) {
        overlayLayers["GPX sledi (Relive)"] = reliveClusteredMarkers;
        overlayLayers["Slike (Relive)"] = reliveMarkers;
    }

    // -----------------
    // LAYER STATE PERSISTENCE
    // Defaults: GPX sledi ON, Slike ON, GPX sledi (Relive) OFF, Slike (Relive) OFF
    // Keys in overlayDefaults must exactly match keys in overlayLayers above.
    // -----------------

    const baseLayers = {
        "OpenTopoMap":    opentopoMap,
        "OpenStreetMap":  openstreetMap,
        "Esri Satellite": esriSatellite
    };

    const overlayDefaults = {
        "GPX sledi":    "true",
        "Slike":        "true",
        "GPX sledi (Relive)": "false",
        "Slike (Relive)": "false"
    };

    // Step 1: Restore base tile layer first — cluster groups need zoom range to initialise
    const savedBaseLayer = localStorage.getItem('mapBaseLayer') || 'OpenTopoMap';
    const baseLayerToAdd = baseLayers[savedBaseLayer] || opentopoMap;
    baseLayerToAdd.addTo(map);

    // Step 2: Add masterLayerGroup, then restore each overlay per saved/default state
    masterLayerGroup.addTo(map);

    Object.entries(overlayLayers).forEach(([name, layer]) => {
        const saved = localStorage.getItem('mapOverlay_' + name);
        const isOn  = saved !== null ? saved === "true" : overlayDefaults[name] === "true";
        if (isOn) {
            map.addLayer(layer);
        } else {
            map.removeLayer(layer);
        }
    });

    const layerControl = L.control.layers(baseLayers, overlayLayers, { position: 'topright' }).addTo(map);

    // Persist layer changes
    map.on('baselayerchange', function (e) {
        localStorage.setItem('mapBaseLayer', e.name);
    });
    map.on('overlayadd', function (e) {
        localStorage.setItem('mapOverlay_' + e.name, "true");
    });
    map.on('overlayremove', function (e) {
        localStorage.setItem('mapOverlay_' + e.name, "false");
    });

    if (L.Control.geocoder) {
        L.Control.geocoder({ defaultMarkGeocode: false, position: 'topright' })
            .on('markgeocode', e => map.setView(e.geocode.center, 12))
            .addTo(map);
    }

    if (L.Control.Fullscreen) {
        map.addControl(new L.Control.Fullscreen({ position: 'topleft', title: 'Show fullscreen', titleCancel: 'Exit fullscreen' }));
    }

    map.addControl(new ShowTracksControl());
    map.addControl(new ClearTracksControl());

    if (config.isSignedIn) {
        map.on('click',   handleTrackClick);
        map.on('zoomend', handleZoomChange);
    }

    loadTrackMarkers();

    if (config.enableRelive) {
        loadReliveTrackMarkers();
    }
}

// -----------------
// EXPORT
// -----------------
window.MyMemoryMapModule = {
    init,
    getMap: () => map,
    destroy: () => {
        if (map) {
            map.remove();
            map = null;

            masterLayerGroup.clearLayers();
            clusteredMarkers.clearLayers();
            nonClusteredMarkers.clearLayers();
            reliveClusteredMarkers.clearLayers();
            reliveNonClusteredMarkers.clearLayers();
            Object.keys(tracks).forEach(k => delete tracks[k]);
            Object.keys(hiddenTracks).forEach(k => delete hiddenTracks[k]);
            Object.keys(reliveTracks).forEach(k => delete reliveTracks[k]);
            Object.keys(reliveHiddenTracks).forEach(k => delete reliveHiddenTracks[k]);
            currentlySelectedTrack = null;
            currentlySelectedReliveTrack = null;
        }
    }
};

})(window);