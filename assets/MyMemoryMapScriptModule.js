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
const tracks = {};          // filename → {polyline, arrowLayer, color, clusterMarker}
const hiddenTracks = {};    // NOT USED anymore — kept empty for safety
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

const trackGeojsonCache       = {};   // filename → [[lon,lat], ...]
const reliveTrackGeojsonCache = {};

// Separate layer groups for polylines only — so we can add/remove them
// independently of the marker cluster groups.
const polylinesLayerGroup       = L.layerGroup();
const relivePolylinesLayerGroup = L.layerGroup();

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
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: null
    });

    const photoMarkerIcon = L.icon({
        iconUrl: 'https://metodlangus.github.io/photos/marker-photo-icon-blue.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowUrl: null
    });

    // -----------------
    // ADD MARKERS — only populates cluster groups, never touches map visibility
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

            if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) dataSkip = "3";
            dataSkip = dataSkip.replace(/best/g, "0").replace(/cover/g, "-1").replace(/peak/g, "-2");

            const dataSkipValues = dataSkip.split(";");
            const isWithinRange = dataSkipValues.some(value => {
                const numericValue = parseFloat(value);
                if (!isNaN(numericValue)) {
                    if ([0, -1, -2].includes(PhotosMapRange)) return numericValue === PhotosMapRange;
                    return numericValue <= PhotosMapRange;
                }
                return false;
            });
            if (!isWithinRange) return;

            var captureDate;
            try {
                const imageTimeRegex = /^(\d{8})_(\d{6})(\d{3})?\.jpg$|^IMG(\d{8})(\d{6})\.jpg$|^IMG-(\d{8})_(\d{6})\.JPG$/i;
                const imageTimeMatch = imageName.match(imageTimeRegex);
                if (!imageTimeMatch) { console.error('Invalid timestamp:', imageName); return; }

                const datePart   = imageTimeMatch[1] || imageTimeMatch[4] || imageTimeMatch[6];
                const timePart   = imageTimeMatch[2] || imageTimeMatch[5] || imageTimeMatch[7];
                const millisPart = imageTimeMatch[3] || '';
                let captureDateString = `${datePart.slice(0,4)}-${datePart.slice(4,6)}-${datePart.slice(6,8)}T${timePart.slice(0,2)}:${timePart.slice(2,4)}:${timePart.slice(4,6)}`;
                if (millisPart) captureDateString += `.${millisPart}`;
                captureDate = new Date(captureDateString);
                if (isNaN(captureDate.getTime())) { console.error('Invalid date:', captureDateString); return; }
            } catch (error) { console.error('Date parse error:', error); return; }

            const filterElements = [
                document.getElementById('photosMapSliderElement'), document.getElementById('photosMapValueElement'),
                document.getElementById('dayFilterStart'), document.getElementById('dayFilterEnd'),
                document.getElementById('timeFilterStart'), document.getElementById('timeFilterEnd'),
                document.getElementById('dailyTimeFilterStart'), document.getElementById('dailyTimeFilterEnd'),
                document.getElementById('applyFilters'), document.getElementById('usePhotoFilterForTracks')
            ];
            filterElements.forEach(el => {
                if (el) { el.disabled = !config.isSignedIn; el.style.cursor = config.isSignedIn ? 'pointer' : 'not-allowed'; el.style.opacity = config.isSignedIn ? '1' : '0.7'; }
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
                    <a href="${postLink}"><img src="${imageLink}" alt="${postTitle}" class="popup-image"></a>
                    <div class="popup-caption">${postTitle}</div>
                </div>`;

            const photoMarker = L.marker([latitude, longitude], { icon: photoMarkerIcon });
            if (config.isSignedIn) {
                photoMarker.bindPopup(popupContent, { className: 'photo-popup' });
            } else {
                photoMarker.on('click', (e) => { e.originalEvent.stopPropagation(); e.originalEvent.preventDefault(); });
            }
            targetMarkers.addLayer(photoMarker);
        });
    }

    fetch(photoListUrl)
        .then(r => r.text()).then(data => addMarkers(data, markers, false))
        .catch(err => console.error('Error fetching photos:', err));

    if (config.enableRelive) {
        fetch(relivePhotoListUrl)
            .then(r => r.text()).then(data => addMarkers(data, reliveMarkers, true))
            .catch(err => console.error('Error fetching Relive photos:', err));
    }

    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.disabled = !config.isSignedIn;
        applyBtn.style.cursor  = config.isSignedIn ? 'pointer' : 'not-allowed';
        applyBtn.style.opacity = config.isSignedIn ? '1'       : '0.7';

        applyBtn.addEventListener('click', function () {
            const dayFilterStart       = document.getElementById('dayFilterStart').value       || "1970-01-01";
            const dayFilterEnd         = document.getElementById('dayFilterEnd').value         || "9999-12-31";
            const timeFilterStart      = document.getElementById('timeFilterStart').value      || "00:00";
            const timeFilterEnd        = document.getElementById('timeFilterEnd').value        || "23:59";
            const dailyTimeFilterStart = document.getElementById('dailyTimeFilterStart').value || "00:00";
            const dailyTimeFilterEnd   = document.getElementById('dailyTimeFilterEnd').value   || "23:59";
            const checkbox             = document.getElementById('usePhotoFilterForTracks');
            const usePhotoFilter       = checkbox && checkbox.checked;
            const trackDayFilterStart  = usePhotoFilter ? dayFilterStart : (document.getElementById('trackDayFilterStart').value || "1970-01-01");
            const trackDayFilterEnd    = usePhotoFilter ? dayFilterEnd   : (document.getElementById('trackDayFilterEnd').value   || "9999-12-31");

            localStorage.setItem('dayFilterStart', dayFilterStart); localStorage.setItem('dayFilterEnd', dayFilterEnd);
            localStorage.setItem('timeFilterStart', timeFilterStart); localStorage.setItem('timeFilterEnd', timeFilterEnd);
            localStorage.setItem('dailyTimeFilterStart', dailyTimeFilterStart); localStorage.setItem('dailyTimeFilterEnd', dailyTimeFilterEnd);
            localStorage.setItem('usePhotoFilterForTracks', String(usePhotoFilter));
            localStorage.setItem('trackDayFilterStart', trackDayFilterStart); localStorage.setItem('trackDayFilterEnd', trackDayFilterEnd);

            fetch(photoListUrl).then(r => r.text()).then(data => {
                const wasVisible = map.hasLayer(markers);
                markers.clearLayers();
                addMarkers(data, markers, false);
                if (wasVisible) map.addLayer(markers);
                applyPhotoFilterToTracks(usePhotoFilter);
            }).catch(err => console.error('Error fetching photos:', err));

            if (config.enableRelive) {
                fetch(relivePhotoListUrl).then(r => r.text()).then(data => {
                    const wasVisible = map.hasLayer(reliveMarkers);
                    reliveMarkers.clearLayers();
                    addMarkers(data, reliveMarkers, true);
                    if (wasVisible) map.addLayer(reliveMarkers);
                }).catch(err => console.error('Error fetching Relive photos:', err));
            }

            // Clear polylines only, then reload markers
            clearPolylines(false);
            clearPolylines(true);
            loadTrackMarkers();
            if (config.enableRelive) loadReliveTrackMarkers();
        });
    }

    function getPhotosMapSliderValue() {
        const v = localStorage.getItem('photosMapSliderValue');
        return v ? Number(v) : config.initPhotosValue;
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

    // Draw a polyline for one marker.
    // The marker is always moved out of the cluster into nonClusteredMarkers
    // so it renders as a standalone pin at the track start, never clustered.
    async function loadGPXTrack(gpxURL, trackColor, clusterMarker, fitBounds, isReliveSource) {
        const filename = clusterMarker.options && clusterMarker.options.title;
        if (!filename) { console.warn('loadGPXTrack: marker has no title, skipping'); return; }

        // Skip if polyline already drawn for this track
        const trackStore = isReliveSource ? reliveTracks : tracks;
        if (trackStore[filename]) return;

        const cache = isReliveSource ? reliveTrackGeojsonCache : trackGeojsonCache;
        let coords = cache[filename];

        if (!coords) {
            console.warn(`Cache miss for ${filename}, falling back to live GPX fetch.`);
            try {
                const response = await fetch(gpxURL);
                const gpxText  = await response.text();
                const geojson  = toGeoJSON.gpx(new DOMParser().parseFromString(gpxText, "text/xml"));
                const layer    = L.geoJson(geojson).getLayers()[0];
                if (!layer) { console.error("Polyline creation failed for", gpxURL); return; }
                coords = layer.getLatLngs().map(ll => [ll.lng, ll.lat]);
                cache[filename] = coords;
            } catch (err) { console.error("Error fetching GPX:", err); return; }
        }

        const latlngs = coords.map(([lon, lat]) => L.latLng(lat, lon));
        if (latlngs.length === 0) { console.error("Empty coords for", filename); return; }

        const polyline = L.polyline(latlngs, { color: trackColor, weight: 2 });
        if (fitBounds) map.fitBounds(polyline.getBounds());

        const arrowLayer = L.polylineDecorator(polyline, {
            patterns: [{ offset: 0, repeat: 7,
                symbol: L.Symbol.arrowHead({ pixelSize: 6, pathOptions: { color: trackColor, fillOpacity: 1, weight: 2 } })
            }]
        });

        // Always move marker out of cluster → nonClusteredMarkers (standalone pin)
        if (isReliveSource) {
            reliveClusteredMarkers.removeLayer(clusterMarker);
            reliveNonClusteredMarkers.addLayer(clusterMarker);
        } else {
            clusteredMarkers.removeLayer(clusterMarker);
            nonClusteredMarkers.addLayer(clusterMarker);
        }

        // Add polylines to the dedicated layer group
        const polylineGroup = isReliveSource ? relivePolylinesLayerGroup : polylinesLayerGroup;
        polylineGroup.addLayer(polyline);
        polylineGroup.addLayer(arrowLayer);

        trackStore[filename] = { polyline, arrowLayer, color: trackColor, clusterMarker };

        polyline.on("click",       () => highlightTrack(trackStore[filename], isReliveSource));
        clusterMarker.on("click",  () => { if (trackStore[filename]) highlightTrack(trackStore[filename], isReliveSource); });
    }

    function highlightTrack(trackData, isReliveSource) {
        isReliveSource = isReliveSource || false;
        const currentRef = isReliveSource ? currentlySelectedReliveTrack : currentlySelectedTrack;

        if (currentRef && currentRef !== trackData) {
            resetTrackStyle(currentRef);
            currentRef.clusterMarker.closePopup();
        }

        setTrackStyle(trackData, 'black');
        trackData.clusterMarker.openPopup();

        if (isReliveSource) currentlySelectedReliveTrack = trackData;
        else                currentlySelectedTrack = trackData;
    }

    function resetTrackStyle(trackData) {
        trackData.polyline.setStyle({ color: trackData.color });
        if (trackData.arrowLayer) trackData.arrowLayer.setStyle({ color: trackData.color });
    }

    function setTrackStyle(trackData, color) {
        trackData.polyline.setStyle({ color });
        if (trackData.arrowLayer) trackData.arrowLayer.setStyle({ color });
    }

    // Click on map near a polyline — highlight nearest track
    function handleTrackClick(e) {
        const clickLocation = e.latlng;
        const maxDist       = 0.01 * 111000; // ~1 km in metres

        const allSets = [
            { store: tracks,       isRelive: false },
            { store: reliveTracks, isRelive: true  },
        ];

        let nearestTrack    = null;
        let nearestDist     = Infinity;
        let nearestIsRelive = false;

        allSets.forEach(({ store, isRelive: rel }) => {
            Object.values(store).forEach(td => {
                const dist = td.polyline.getLatLngs().reduce(
                    (closest, ll) => Math.min(closest, clickLocation.distanceTo(ll)), Infinity);
                if (dist < nearestDist && dist <= maxDist) {
                    nearestTrack = td; nearestDist = dist; nearestIsRelive = rel;
                }
            });
        });

        if (!nearestTrack) return;

        [{ ref: currentlySelectedTrack, isR: false }, { ref: currentlySelectedReliveTrack, isR: true }]
            .forEach(({ ref, isR }) => {
                if (ref && ref !== nearestTrack) {
                    resetTrackStyle(ref);
                    ref.clusterMarker.closePopup();
                    if (isR) currentlySelectedReliveTrack = null;
                    else     currentlySelectedTrack       = null;
                }
            });

        nearestTrack.polyline.setStyle({ color: 'black' });
        if (nearestTrack.arrowLayer) nearestTrack.arrowLayer.setStyle({ color: 'black' });
        nearestTrack.clusterMarker.openPopup();

        if (nearestIsRelive) currentlySelectedReliveTrack = nearestTrack;
        else                 currentlySelectedTrack       = nearestTrack;
    }

    // Remove all polylines and return their markers back to the cluster group.
    function clearPolylines(isReliveSource) {
        const trackStore      = isReliveSource ? reliveTracks              : tracks;
        const polylineGrp     = isReliveSource ? relivePolylinesLayerGroup  : polylinesLayerGroup;
        const clusterGrp      = isReliveSource ? reliveClusteredMarkers     : clusteredMarkers;
        const nonClusterGrp   = isReliveSource ? reliveNonClusteredMarkers  : nonClusteredMarkers;

        if (isReliveSource) currentlySelectedReliveTrack = null;
        else                currentlySelectedTrack       = null;

        // Return each marker from nonClustered back into the cluster
        Object.values(trackStore).forEach(td => {
            if (td.clusterMarker) {
                nonClusterGrp.removeLayer(td.clusterMarker);
                clusterGrp.addLayer(td.clusterMarker);
            }
        });

        polylineGrp.clearLayers();
        Object.keys(trackStore).forEach(k => delete trackStore[k]);
    }

    // Show tracks in current viewport — draw polylines for visible markers.
    // If the GPX marker overlay is currently off, individual markers in the viewport
    // are added directly to the map without changing the layer toggle state.
    function showTracksInCurrentMapArea() {
        const bounds = map.getBounds();

        // Snapshot into array first to avoid mutating while iterating
        const mainSnapshot = [];
        clusteredMarkers.eachLayer(m => mainSnapshot.push(m));

        mainSnapshot.forEach(marker => {
            const filename = marker.options && marker.options.title;
            if (!filename)          return;
            if (tracks[filename])   return;
            if (!bounds.contains(marker.getLatLng())) return;
            const { trackDate } = extractTrackName(filename);
            if (!isTrackWithinFilters(trackDate)) return;
            const color = trackColors[Math.floor(Math.random() * trackColors.length)];
            loadGPXTrack(`${gpxFolder}${filename}`, color, marker, false, false);
        });

        if (config.enableRelive) {
            const reliveSnapshot = [];
            reliveClusteredMarkers.eachLayer(m => reliveSnapshot.push(m));

            reliveSnapshot.forEach(marker => {
                const filename = marker.options && marker.options.title;
                if (!filename)              return;
                if (reliveTracks[filename]) return;
                if (!bounds.contains(marker.getLatLng())) return;
                const { trackDate } = extractTrackName(filename);
                if (!isTrackWithinFilters(trackDate)) return;
                const color = trackColors[Math.floor(Math.random() * trackColors.length)];
                loadGPXTrack(`${reliveGpxFolder}${filename}`, color, marker, false, true);
            });
        }
    }

    // Custom control: show tracks in current viewport
    const ShowTracksControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button    = L.DomUtil.create('a', 'leaflet-control-show-tracks', container);
            button.href = '#'; button.title = 'Show Tracks'; button.innerHTML = '<span>&#x2713;</span>';
            if (!config.isSignedIn) {
                button.style.opacity = 0.7; button.style.pointerEvents = 'none';
            } else {
                L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
                    .on(button, 'click', L.DomEvent.preventDefault)
                    .on(button, 'click', () => showTracksInCurrentMapArea());
            }
            return container;
        }
    });

    // Custom control: clear all polylines (markers untouched)
    const ClearTracksControl = L.Control.extend({
        options: { position: 'topleft' },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button    = L.DomUtil.create('a', 'leaflet-control-clear-tracks', container);
            button.href = '#'; button.title = 'Clear All Tracks'; button.innerHTML = '<span>&#x2715;</span>';
            if (!config.isSignedIn) {
                button.style.opacity = 0.7; button.style.pointerEvents = 'none';
            } else {
                L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
                    .on(button, 'click', L.DomEvent.preventDefault)
                    .on(button, 'click', () => {
                        clearPolylines(false);
                        if (config.enableRelive) clearPolylines(true);
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

        // Clear existing markers and all polylines before reload
        clearPolylines(false);
        clusteredMarkers.clearLayers();
        nonClusteredMarkers.clearLayers();

        const geojsonURL = `${config.baseUrl}/all_tracks.geojson`;

        fetch(geojsonURL, { signal })
            .then(r => r.json())
            .then(geojson => {
                if (signal.aborted) return;
                (geojson.features || []).forEach(f => {
                    const fn = f.properties && f.properties.filename;
                    const ln = f.geometry && f.geometry.coordinates;
                    if (fn && ln) trackGeojsonCache[fn] = ln;
                });
                return fetch(trackListUrl, { signal });
            })
            .then(r => r && r.text())
            .then(data => {
                if (!data || signal.aborted) return;
                const trackList = data.split("\n").map(l => l.split(";")).filter(p => p.length >= 3);

                trackList.forEach(([lat, lng, filename, coverPhoto, postLink]) => {
                    if (!filename || !filename.trim()) return;
                    const { trackName, trackDate } = extractTrackName(filename);
                    if (!isTrackWithinFilters(trackDate)) return;

                    const gpxURL      = `${gpxFolder}${filename}`;
                    const randomColor = trackColors[Math.floor(Math.random() * trackColors.length)];

                    let popupContent;
                    if (coverPhoto && coverPhoto.trim() && postLink && postLink.trim()) {
                        popupContent = `<div class="popup-container"><a href="${postLink}" target="_blank"><img src="${coverPhoto}" alt="${trackName}" class="popup-image"></a><div class="popup-caption">${trackName}<br>${trackDate}</div></div>`;
                    } else {
                        popupContent = `<div class="popup-container"><div class="popup-caption">${trackName}<br>${trackDate}</div></div>`;
                    }

                    const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
                        icon: startMarkerIcon, title: filename
                    });

                    if (config.isSignedIn) {
                        marker.bindPopup(popupContent, { className: "track-popup" });
                        // Click opens popup AND draws polyline if not already drawn
                        marker.on("click", () => loadGPXTrack(gpxURL, randomColor, marker, false, false));
                    } else {
                        marker.on("click", e => { e.originalEvent.stopPropagation(); e.originalEvent.preventDefault(); });
                    }

                    clusteredMarkers.addLayer(marker);

                    if (pendingTrackToLoad && filename === pendingTrackToLoad && config.isSignedIn) {
                        setTimeout(() => { loadGPXTrack(gpxURL, randomColor, marker, true, false); pendingTrackToLoad = null; }, 500);
                    }
                });
            })
            .catch(err => { if (err.name !== "AbortError") console.error("Error loading track markers:", err); });
    }

    // -----------------
    // LOAD RELIVE TRACK MARKERS
    // -----------------
    function loadReliveTrackMarkers() {
        if (reliveTrackMarkersAbortController) reliveTrackMarkersAbortController.abort();
        reliveTrackMarkersAbortController = new AbortController();
        const signal = reliveTrackMarkersAbortController.signal;

        clearPolylines(true);
        reliveClusteredMarkers.clearLayers();
        reliveNonClusteredMarkers.clearLayers();

        const geojsonURL = `${config.baseUrl}/all_relive_tracks.geojson`;

        fetch(geojsonURL, { signal })
            .then(r => r.json())
            .then(geojson => {
                if (signal.aborted) return;
                (geojson.features || []).forEach(f => {
                    const fn = f.properties && f.properties.filename;
                    const ln = f.geometry && f.geometry.coordinates;
                    if (fn && ln) reliveTrackGeojsonCache[fn] = ln;
                });
                return fetch(reliveTrackListUrl, { signal });
            })
            .then(r => r && r.text())
            .then(data => {
                if (!data || signal.aborted) return;
                const trackList = data.split("\n").map(l => l.split(";")).filter(p => p.length >= 3);

                trackList.forEach(([lat, lng, filename, coverPhoto, postLink]) => {
                    if (!filename || !filename.trim()) return;
                    const { trackName, trackDate } = extractTrackName(filename);
                    if (!isTrackWithinFilters(trackDate)) return;

                    const gpxURL      = `${reliveGpxFolder}${filename}`;
                    const randomColor = trackColors[Math.floor(Math.random() * trackColors.length)];

                    let popupContent;
                    if (coverPhoto && coverPhoto.trim() && postLink && postLink.trim()) {
                        popupContent = `<div class="popup-container"><a href="${postLink}" target="_blank"><img src="${coverPhoto}" alt="${trackName}" class="popup-image"></a><div class="popup-caption">${trackName}<br>${trackDate}</div></div>`;
                    } else {
                        popupContent = `<div class="popup-container"><div class="popup-caption">${trackName}<br>${trackDate}</div></div>`;
                    }

                    const marker = L.marker([parseFloat(lat), parseFloat(lng)], {
                        icon: startMarkerIcon, title: filename
                    });

                    if (config.isSignedIn) {
                        marker.bindPopup(popupContent, { className: "track-popup" });
                        marker.on("click", () => loadGPXTrack(gpxURL, randomColor, marker, false, true));
                    } else {
                        marker.on("click", e => { e.originalEvent.stopPropagation(); e.originalEvent.preventDefault(); });
                    }

                    reliveClusteredMarkers.addLayer(marker);
                });
            })
            .catch(err => { if (err.name !== "AbortError") console.error("Error loading Relive track markers:", err); });
    }

    function isTrackWithinFilters(trackDate) {
        const parts = trackDate.split('.');
        if (parts.length !== 4) return true;
        const trackDateTime = new Date(Date.UTC(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0])));
        if (isNaN(trackDateTime.getTime())) return true;
        const filterStart = new Date((localStorage.getItem('trackDayFilterStart') || "1970-01-01") + 'T00:00:00Z');
        const filterEnd   = new Date((localStorage.getItem('trackDayFilterEnd')   || "9999-12-31") + 'T23:59:59Z');
        if (isNaN(filterStart.getTime()) || isNaN(filterEnd.getTime())) return true;
        if (filterStart > filterEnd) return false;
        return trackDateTime >= filterStart && trackDateTime <= filterEnd;
    }

    function handleZoomChange() {
        const z = map.getZoom();
        if (map.hasLayer(opentopoMap)) {
            if (z > 15.50 && !map.hasLayer(openstreetMap)) {
                map.removeLayer(opentopoMap); map.addLayer(openstreetMap);
                wasZoomedFromTopo = true; localStorage.setItem('mapBaseLayer', 'OpenStreetMap');
            }
        } else if (map.hasLayer(openstreetMap) && z <= 15.50 && wasZoomedFromTopo) {
            map.removeLayer(openstreetMap); map.addLayer(opentopoMap);
            wasZoomedFromTopo = false; localStorage.setItem('mapBaseLayer', 'OpenTopoMap');
        }
    }

    // -----------------
    // LAYER SETUP
    // -----------------

    markers       = L.markerClusterGroup({ maxClusterRadius: 20 });
    reliveMarkers = L.markerClusterGroup({ maxClusterRadius: 20 });

    // Each source has its own layer group containing both its cluster and nonClustered markers.
    // This way toggling "GPX sledi" and "GPX sledi (Relive)" work fully independently.
    const mainLayerGroup  = L.layerGroup([clusteredMarkers,       nonClusteredMarkers]);
    const reliveLayerGroup = L.layerGroup([reliveClusteredMarkers, reliveNonClusteredMarkers]);

    const overlayLayers = { "GPX sledi": mainLayerGroup, "Slike": markers };
    if (config.enableRelive) {
        overlayLayers["GPX sledi (Relive)"] = reliveLayerGroup;
        overlayLayers["Slike (Relive)"]     = reliveMarkers;
    }

    const baseLayers = {
        "OpenTopoMap":    opentopoMap,
        "OpenStreetMap":  openstreetMap,
        "Esri Satellite": esriSatellite
    };

    const overlayDefaults = {
        "GPX sledi":          "true",
        "Slike":              "true",
        "GPX sledi (Relive)": "false",
        "Slike (Relive)":     "false"
    };

    // Step 1: base tile layer first
    const savedBaseLayer = localStorage.getItem('mapBaseLayer') || 'OpenTopoMap';
    (baseLayers[savedBaseLayer] || opentopoMap).addTo(map);

    // Step 2: add layer groups to map per saved/default state
    mainLayerGroup.addTo(map);
    if (config.enableRelive) reliveLayerGroup.addTo(map);

    // Step 3: polyline groups always on map — independent of layer control
    polylinesLayerGroup.addTo(map);
    if (config.enableRelive) relivePolylinesLayerGroup.addTo(map);

    // Step 4: restore overlay visibility
    Object.entries(overlayLayers).forEach(([name, layer]) => {
        const saved = localStorage.getItem('mapOverlay_' + name);
        const isOn  = saved !== null ? saved === "true" : overlayDefaults[name] === "true";
        if (isOn) map.addLayer(layer); else map.removeLayer(layer);
    });

    const layerControl = L.control.layers(baseLayers, overlayLayers, { position: 'topright' }).addTo(map);

    // Helper: move all markers with active polylines between cluster ↔ nonClustered
    function syncNonClustered(isReliveSource, toNonClustered) {
        const store      = isReliveSource ? reliveTracks             : tracks;
        const cluster    = isReliveSource ? reliveClusteredMarkers   : clusteredMarkers;
        const nonCluster = isReliveSource ? reliveNonClusteredMarkers : nonClusteredMarkers;
        Object.values(store).forEach(td => {
            if (!td || !td.clusterMarker) return;
            if (toNonClustered) {
                cluster.removeLayer(td.clusterMarker);
                nonCluster.addLayer(td.clusterMarker);
            } else {
                nonCluster.removeLayer(td.clusterMarker);
                cluster.addLayer(td.clusterMarker);
            }
        });
    }

    // Persist layer changes + sync nonClustered markers on toggle
    map.on('baselayerchange', e => localStorage.setItem('mapBaseLayer', e.name));
    map.on('overlayadd', e => {
        localStorage.setItem('mapOverlay_' + e.name, "true");
        if (e.name === "GPX sledi")          syncNonClustered(false, true);
        if (e.name === "GPX sledi (Relive)") syncNonClustered(true,  true);
    });
    map.on('overlayremove', e => {
        localStorage.setItem('mapOverlay_' + e.name, "false");
        if (e.name === "GPX sledi")          syncNonClustered(false, false);
        if (e.name === "GPX sledi (Relive)") syncNonClustered(true,  false);
    });
    if (L.Control.geocoder) {
        L.Control.geocoder({ defaultMarkGeocode: false, position: 'topright' })
            .on('markgeocode', e => map.setView(e.geocode.center, 12)).addTo(map);
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
    if (config.enableRelive) loadReliveTrackMarkers();
}

// -----------------
// EXPORT
// -----------------
window.MyMemoryMapModule = {
    init,
    getMap: () => map,
    destroy: () => {
        if (map) {
            map.remove(); map = null;
            masterLayerGroup.clearLayers();
            clusteredMarkers.clearLayers(); nonClusteredMarkers.clearLayers();
            reliveClusteredMarkers.clearLayers(); reliveNonClusteredMarkers.clearLayers();
            polylinesLayerGroup.clearLayers(); relivePolylinesLayerGroup.clearLayers();
            Object.keys(tracks).forEach(k => delete tracks[k]);
            Object.keys(hiddenTracks).forEach(k => delete hiddenTracks[k]);
            Object.keys(reliveTracks).forEach(k => delete reliveTracks[k]);
            Object.keys(reliveHiddenTracks).forEach(k => delete reliveHiddenTracks[k]);
            currentlySelectedTrack = null; currentlySelectedReliveTrack = null;
        }
    }
};

})(window);
