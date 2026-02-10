(function (window) {

let config = {
    mapId: 'map',
    baseUrl: '',
    isRelive: false,
    initPhotosValue: -2,
    center: [46.27396640, 14.30939080],
    zoom: 8
};

let map, gpxFolder, trackListUrl, photoListUrl, isRelive;

// Tile layers
let opentopoMap;
let openstreetMap;
let esriSatellite;

// Marker clusters
let markers;

// GPX layers and tracks
const masterLayerGroup = L.layerGroup();
const clusteredMarkers = L.markerClusterGroup();
const nonClusteredMarkers = L.layerGroup();
const tracks = {};  // Store currently displayed GPX tracks
const hiddenTracks = {};  // Store temporarily hidden GPX tracks
let currentlySelectedTrack = null;  // Track the selected track
let wasZoomedFromTopo = false; // Flag to track if the map was zoomed in from OpenTopoMap beyond 17.25
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

// Populate filter inputs with stored or default value
function populateFilterInputs() {
    const defaults = {
        dayFilterStart: "1970-01-01",
        dayFilterEnd: "9999-12-31",
        timeFilterStart: "00:00",
        timeFilterEnd: "23:59",
        dailyTimeFilterStart: "00:00",
        dailyTimeFilterEnd: "23:59",
    };

    Object.keys(defaults).forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.value = localStorage.getItem(id) || defaults[id];
        }
    });
}

// Function to handle and store the slider value in localStorage
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


    // Update value display
    valueDisplay.textContent = specialTitle[slider.value] || slider.value;
    
    // Store the slider value in localStorage
    localStorage.setItem('photosMapSliderValue', slider.value);
}

// Initialize slider (called from init / createMap)
function initPhotoSlider() {
    const slider = document.getElementById('photosMapSliderElement');
    const valueDisplay = document.getElementById('photosMapValueElement');

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

    // Retrieve stored slider value
    const storedValue = localStorage.getItem('photosMapSliderValue');

    const initialValue =
        storedValue !== null
            ? storedValue
            : String(config.initPhotosValue);

    slider.value = initialValue;
    valueDisplay.textContent =
        specialTitle[initialValue] || initialValue;

    // Update value on change
    slider.addEventListener('input', handleSliderChange);
}

function init(userConfig = {}) {
    // Merge user config into defaults
    config = { ...config, ...userConfig };

    // Create blog-specific paths
    const blogCfg = createblogCfg();
    gpxFolder = blogCfg.gpxFolder;
    trackListUrl = blogCfg.trackListUrl;
    photoListUrl = blogCfg.photoListUrl;
    isRelive = blogCfg.isRelive;

    // Initialize map and UI
    createMap();
    initPhotoSlider();
    populateFilterInputs();
}

// -----------------
// BLOG CONFIG
// -----------------
function createblogCfg() {
    const isRelive = config.isRelive === true;
    return {
        isRelive,
        gpxFolder: isRelive
          ? `${WindowBaseUrl}/my_GPX_tracks/`
          : `${WindowBaseUrl}/GPX_tracks/`,

        trackListUrl: isRelive
          ? `${WindowBaseUrl}/list_of_relive_tracks.txt`
          : `${WindowBaseUrl}/list_of_tracks.txt`,

        photoListUrl: isRelive
          ? `${WindowBaseUrl}/extracted_relive_photos_with_gps_data.txt`
          : `${WindowBaseUrl}/extracted_photos_with_gps_data.txt`
    };
}

// -----------------
// CREATE MAP
// -----------------
function createMap() {
    map = L.map(config.mapId).setView(config.center, config.zoom);

    // Tile layers
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

// Custom red marker start icon
const startMarkerIcon = L.icon({
    iconUrl: 'https://metodlangus.github.io/photos/marker-icon-green.png', // Green icon URL
    iconSize: [25, 41], // Icon size
    iconAnchor: [12, 41], // Icon anchor (the point of the icon that will be placed at the marker position)
    popupAnchor: [1, -34], // Popup position
    shadowUrl: null // No shadow
});

// Custom photo marker icon
const photoMarkerIcon = L.icon({
    iconUrl: 'https://metodlangus.github.io/photos/marker-photo-icon-blue.png', // Blue icon URL
    iconSize: [25, 41], // Icon size
    iconAnchor: [12, 41], // Icon anchor (the point of the icon that will be placed at the marker position)
    popupAnchor: [1, -34], // Popup position
    shadowUrl: null // No shadow
});


// Function to parse and add markers to the map
function addMarkers(data) {
    // Split the input data into individual lines
    var lines = data.split('\n');
    lines.forEach(function (line) {
        if (line.trim() === "") return; // Skip empty lines

        // Regular expression to parse each line
        var regex = /(.+?),\s*Link:\s*(https?:\/\/[^\s]+),\s*data-skip=([^\s,]+),\s*"([^"]+)",\s*([^,]+),\s*Latitude:\s*([+-]?\d+\.\d+),\s*Longitude:\s*([+-]?\d+\.\d+)/;
        var match = line.match(regex);
        if (!match) return; // Skip lines that do not match

        var imageName = match[1];   // Extract image name
        var imageLink = match[2];   // Extract image link
        var dataSkip = match[3] || null; // Extract data-skip value
        var postTitle = match[4];   // Extract post title
        var postLink = config.isRelive     // Construct full post link from extracted link part
          ? WindowBaseUrl + "/relive/posts/" + (match[5] || "")
          : WindowBaseUrl + "/posts/" + (match[5] || "");
        var latitude = parseFloat(match[6]); // Extract latitude
        var longitude = parseFloat(match[7]); // Extract longitude

        // Ensure valid link, latitude, and longitude
        if (!imageLink || isNaN(latitude) || isNaN(longitude)) return;

        // Retrieve the photos map range
        let PhotosMapRange = getPhotosMapSliderValue();

        // Assign a default value to `data-skip` if undefined or "NA"
        if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
            dataSkip = "3"; // Assign a default value
        }

        // Replace "best" with "0" in the `data-skip` values
        dataSkip = dataSkip.replace(/best/g, "0");

        // Replace "cover" with "-1" in the `data-skip` values
        dataSkip = dataSkip.replace(/cover/g, "-1");

        // Replace "peak" with "-2" in the `data-skip` values
        dataSkip = dataSkip.replace(/peak/g, "-2");

        // Split `dataSkip` values by semicolon
        const dataSkipValues = dataSkip.split(";");

        // Check if any value in `data-skip` matches or is within the PhotosMapRange
        const isWithinRange = dataSkipValues.some(value => {
            const numericValue = parseFloat(value); // Parse each value to a number
            if (!isNaN(numericValue)) {
                if ([0, -1, -2].includes(PhotosMapRange)) {
                    // For PhotosMapRange 0, -1, or -2, match exactly
                    return numericValue === PhotosMapRange;
                }
                // For other ranges, check if the value is within the range
                return numericValue <= PhotosMapRange;
            }
            return false; // Non-numeric values are ignored
        });

        // Exclude photos that do not meet the data-skip criteria
        if (!isWithinRange) return;

        var captureDate;
        try {
            // Match valid formats:
            // 1. "20241104_130716.jpg"
            // 2. "IMG20241029132928.jpg"
            // 3. "IMG-20220627_162856.JPG"
            // 4. "20250615_043107056.JPG" (with milliseconds)
            const imageTimeRegex = /^(\d{8})_(\d{6})(\d{3})?\.jpg$|^IMG(\d{8})(\d{6})\.jpg$|^IMG-(\d{8})_(\d{6})\.JPG$/i;

            // Apply the regex to the image name
            const imageTimeMatch = imageName.match(imageTimeRegex);

            if (!imageTimeMatch) {
                console.error('Image name does not contain a valid timestamp:', imageName);
                return; // Skip if the name doesn't match expected formats
            }

            // Extract date and time components based on matched groups
            const datePart = imageTimeMatch[1] || imageTimeMatch[4] || imageTimeMatch[6]; // Match group 1 for "20241104_130716", group 4 for "IMG20241029132928", or group 6 for "IMG-20220627_162856"
            const timePart = imageTimeMatch[2] || imageTimeMatch[5] || imageTimeMatch[7]; // Match group 2 for "20241104_130716", group 5 for "IMG20241029132928", or group 7 for "IMG-20220627_162856"
            const millisPart = imageTimeMatch[3] || ''; // Only the first pattern can include milliseconds

            // Construct the ISO 8601 date string with optional milliseconds
            let captureDateString = `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}T${timePart.slice(0, 2)}:${timePart.slice(2, 4)}:${timePart.slice(4, 6)}`;
            if (millisPart) {
                captureDateString += `.${millisPart}`;
            }

            // Parse the date
            captureDate = new Date(captureDateString);

            // Validate the parsed date
            if (isNaN(captureDate.getTime())) {
                console.error('Invalid capture date parsed from image name:', captureDateString);
                return; // Skip if the date is invalid
            }
        } catch (error) {
            console.error('Error parsing capture date:', error);
            return; // Skip this entry on error
        }

        // Retrieve selected time filters from local storage
        const timeFilterStart = localStorage.getItem('timeFilterStart') || "00:00"; // Default to midnight
        const timeFilterEnd = localStorage.getItem('timeFilterEnd') || "23:59"; // Default to end of the day
        const dayFilterStart = localStorage.getItem('dayFilterStart') || "1970-01-01"; // Default to start of epoch
        const dayFilterEnd = localStorage.getItem('dayFilterEnd') || "9999-12-31"; // Default to distant future
        const dailyTimeFilterStart = localStorage.getItem('dailyTimeFilterStart') || "00:00";
        const dailyTimeFilterEnd = localStorage.getItem('dailyTimeFilterEnd') || "23:59";

        // Parse filters to Date objects with proper validation
        const filterStartDate = new Date(`${dayFilterStart}T${timeFilterStart}`);
        const filterEndDate = new Date(`${dayFilterEnd}T${timeFilterEnd}`);

        // Validate that filterStartDate and filterEndDate are valid dates
        if (isNaN(filterStartDate.getTime()) || isNaN(filterEndDate.getTime())) {
            console.error('Invalid date filter range:', filterStartDate, filterEndDate);
            return;
        }

        // Ensure filterStartDate is before or equal to filterEndDate
        if (filterStartDate > filterEndDate) {
            console.error('Start date cannot be after end date:', filterStartDate, filterEndDate);
            return;
        }

        // Check if captureDate is within the range
        if (captureDate < filterStartDate || captureDate > filterEndDate) {
            return; // Exclude photos outside the time range
        }

        // Parse daily time filters into individual Date objects
        const dailyStartTime = new Date(`${dayFilterStart}T${dailyTimeFilterStart}:00`);
        const dailyEndTime = new Date(`${dayFilterEnd}T${dailyTimeFilterEnd}:00`);
        
        // Extract just the time from the capture date for comparison
        const captureTimeOnly = new Date(`${captureDate.toISOString().slice(0, 10)}T${captureDate.toTimeString().slice(0, 8)}`);

        // Validate date range
        if (captureDate < dayFilterStart || captureDate > dayFilterEnd) return; // Skip if outside date range

        // Validate time range for the specific day
        if (captureTimeOnly < dailyStartTime || captureTimeOnly > dailyEndTime) return; // Skip if outside time range

        // Create popup content with a clickable image and caption  <a href="${postLink}" target="_blank">
        var popupContent = `
            <div class="popup-container">
                <a href="${postLink}">  
                    <img src="${imageLink}" alt="${postTitle}" class="popup-image">
                </a>
                <div class="popup-caption">${postTitle}</div>
            </div>`;
        
        // var popupContent = `
        //     <div class="popup-container">
        //         <img src="${imageLink}" alt="${postTitle}" class="popup-image">
        //         <div class="popup-caption">${postTitle}</div>
        //     </div>`;

        // Create and bind marker for valid entries
        const photoMarker = L.marker([latitude, longitude], { icon: photoMarkerIcon })
            .bindPopup(popupContent, {
                className: 'photo-popup' // Assign the specific photo-popup class
            });
        markers.addLayer(photoMarker);
    });

    // Add all filtered markers to the map
    map.addLayer(markers);
}

// Fetch metadata and add markers
fetch(photoListUrl)
    .then(response => response.text())
    .then(data => addMarkers(data))
    .catch(error => console.error('Error fetching photos metadata:', error)
);

// Apply filters when the button is clicked
const applyBtn = document.getElementById('applyFilters');
if (applyBtn) {
  applyBtn.addEventListener('click', function () {
    // Get filter values from input fields
    const dayFilterStart = document.getElementById('dayFilterStart').value || "1970-01-01";
    const dayFilterEnd = document.getElementById('dayFilterEnd').value || "9999-12-31";
    const timeFilterStart = document.getElementById('timeFilterStart').value || "00:00";
    const timeFilterEnd = document.getElementById('timeFilterEnd').value || "23:59";
    const dailyTimeFilterStart = document.getElementById('dailyTimeFilterStart').value || "00:00";
    const dailyTimeFilterEnd = document.getElementById('dailyTimeFilterEnd').value || "23:59";

    // Store the values in localStorage
    localStorage.setItem('dayFilterStart', dayFilterStart);
    localStorage.setItem('dayFilterEnd', dayFilterEnd);
    localStorage.setItem('timeFilterStart', timeFilterStart);
    localStorage.setItem('timeFilterEnd', timeFilterEnd);
    localStorage.setItem('dailyTimeFilterStart', dailyTimeFilterStart);
    localStorage.setItem('dailyTimeFilterEnd', dailyTimeFilterEnd);

    // Reload markers with updated filters
    fetch(photoListUrl)
        .then(response => response.text())
        .then(data => {
            // Clear existing markers
            markers.clearLayers();
            // Re-add markers with new filters
            addMarkers(data);
        })
        .catch(error => console.error('Error fetching photos metadata:', error));
  });
}


// Function to retrieve stored slider value for use in the markers filter
function getPhotosMapSliderValue() {
    // Retrieve the photosMapSliderValue from localStorage
    let photosMapSliderValue = localStorage.getItem('photosMapSliderValue');
    return photosMapSliderValue ? Number(photosMapSliderValue) : config.initPhotosValue; // Default to config.initPhotosValue if not found
}


// Helper functions
function extractTrackName(filename) {
    const dateHourRegex = /^(\d{4})-(\d{2})-(\d{2}) \d{6} /;
    const dateMatch = filename.match(dateHourRegex);
    let date = dateMatch ? `${dateMatch[3]}.${dateMatch[2]}.${dateMatch[1]}.` : '';
    let name = filename.replace(dateHourRegex, '').split('__')[0].trim();
    return { trackName: name, trackDate: date };
}

// Load GPX track
async function loadGPXTrack(gpxURL, trackColor, marker) {
    try {
        const response = await fetch(gpxURL);
        const gpx = await response.text();
        const geojson = toGeoJSON.gpx(new DOMParser().parseFromString(gpx, 'text/xml'));

        const polyline = L.geoJson(geojson, { style: { color: trackColor, weight: 2 } }).getLayers()[0];
        if (!polyline) {
            console.error('Polyline creation failed for', gpxURL);
            return;
        }

        const arrowLayer = L.polylineDecorator(polyline, {
            patterns: [{
                offset: 0, repeat: 7,
                symbol: L.Symbol.arrowHead({ pixelSize: 6, pathOptions: { color: trackColor, fillOpacity: 1, weight: 2 } })
            }]
        });

        const startMarker = L.marker(polyline.getLatLngs()[0], { icon: startMarkerIcon })
            .bindPopup(marker.getPopup().getContent(), {
                className: 'track-popup' // Apply track popup style
            });
        nonClusteredMarkers.addLayer(startMarker);
        clusteredMarkers.removeLayer(marker);

        const GPXtrack = L.layerGroup([polyline, arrowLayer, startMarker]).addTo(map);
        masterLayerGroup.addLayer(GPXtrack);

        tracks[marker.options.title] = { polyline, arrowLayer, color: trackColor, marker: startMarker };

        startMarker.on('click', () => highlightTrack(tracks[marker.options.title]));
        polyline.on('click', () => highlightTrack(tracks[marker.options.title]));
    } catch (error) {
        console.error('Error fetching or parsing GPX data:', error);
    }
}

// Highlight track function
function highlightTrack(trackData) {
    if (currentlySelectedTrack && currentlySelectedTrack !== trackData) {
        // Reset previously selected track style
        resetTrackStyle(currentlySelectedTrack);
        currentlySelectedTrack.marker.closePopup();
    }

    // Highlight the current track
    setTrackStyle(trackData, 'black');
    trackData.marker.openPopup();
    currentlySelectedTrack = trackData;
}

// Reset track style to original color
function resetTrackStyle(trackData) {
    trackData.polyline.setStyle({ color: trackData.color });
    if (trackData.arrowLayer) {
        trackData.arrowLayer.setStyle({ color: trackData.color });
    }
}

// Set track style for highlighting
function setTrackStyle(trackData, color) {
    trackData.polyline.setStyle({ color });
    if (trackData.arrowLayer) {
        trackData.arrowLayer.setStyle({ color });
    }
}

// Handle track click event near track line
function handleTrackClick(e) {
    const clickLocation = e.latlng;
    const maxDistance = 0.01; // Maximum distance in degrees (~1km)

    let nearestTrack = null;
    let nearestDistance = Infinity;

    Object.values(tracks).forEach(trackData => {
        const distance = trackData.polyline.getLatLngs().reduce((closest, latlng) => {
            const dist = clickLocation.distanceTo(latlng);
            return Math.min(closest, dist);
        }, Infinity);

        if (distance < nearestDistance && distance <= maxDistance * 111000) {
            nearestTrack = trackData;
            nearestDistance = distance;
        }
    });

    if (nearestTrack) {
        if (currentlySelectedTrack && currentlySelectedTrack !== nearestTrack) {
            currentlySelectedTrack.polyline.setStyle({ color: currentlySelectedTrack.color });
            if (currentlySelectedTrack.arrowLayer) {
                currentlySelectedTrack.arrowLayer.setStyle({ color: currentlySelectedTrack.color });
            }
            currentlySelectedTrack.marker.closePopup();
        }

        nearestTrack.polyline.setStyle({ color: 'black' });
        if (nearestTrack.arrowLayer) {
            nearestTrack.arrowLayer.setStyle({ color: 'black' });
        }

        nearestTrack.marker.openPopup();
        currentlySelectedTrack = nearestTrack;
    }
}

// Clear all tracks from map
function clearTracks() {
    Object.entries(tracks).forEach(([key, trackData]) => {
        // Remove polyline and arrow layer (but leave the marker in place)
        map.removeLayer(trackData.polyline);
        if (trackData.arrowLayer) {
            map.removeLayer(trackData.arrowLayer);
        }
        nonClusteredMarkers.removeLayer(trackData.marker);
        clusteredMarkers.addLayer(trackData.marker);
        hiddenTracks[key] = trackData;
        delete tracks[key];
    });
    currentlySelectedTrack = null;
}

// Show tracks within current map area
function showTracksInCurrentMapArea() {
    const bounds = map.getBounds();

    clusteredMarkers.eachLayer(marker => {
        if (bounds.contains(marker.getLatLng()) && !tracks[marker.options.title]) {
            const trackColor = trackColors[Math.floor(Math.random() * trackColors.length)];
            loadGPXTrack(`${gpxFolder}${marker.options.title}`, trackColor, marker);
        }
    });

    Object.entries(hiddenTracks).forEach(([key, trackData]) => {
        if (bounds.contains(trackData.marker.getLatLng())) {
            // Add polyline and arrow layer back to the map
            map.addLayer(trackData.polyline);
            if (trackData.arrowLayer) {
                map.addLayer(trackData.arrowLayer);
            }
            clusteredMarkers.removeLayer(trackData.marker);
            nonClusteredMarkers.addLayer(trackData.marker);
            tracks[key] = trackData;
            delete hiddenTracks[key];
        }
    });
}

// Custom control to show tracks in the current area
const ShowTracksControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-show-tracks', container);
        button.href = '#';
        button.title = 'Show Tracks';
        button.innerHTML = '<span>&#x2713;</span>';
        L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
            .on(button, 'click', L.DomEvent.preventDefault)
            .on(button, 'click', function () { showTracksInCurrentMapArea(); });
        return container;
    }
});

// Custom control to clear all tracks
const ClearTracksControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function (map) {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        const button = L.DomUtil.create('a', 'leaflet-control-clear-tracks', container);
        button.href = '#';
        button.title = 'Clear All Tracks';
        button.innerHTML = '<span>&#x2715;</span>';
        L.DomEvent.on(button, 'click', L.DomEvent.stopPropagation)
            .on(button, 'click', L.DomEvent.preventDefault)
            .on(button, 'click', function () { clearTracks(); });
        return container;
    }
});

// Fetch and display track markers with track-popup style (same as photo-popup style)
function loadTrackMarkers() {
    fetch(trackListUrl)
        .then(response => response.text())
        .then(data => {
            // Split lines and filter for at least 3 columns
            const trackList = data.split('\n').map(line => line.split(';')).filter(parts => parts.length >= 3);

            trackList.forEach(([lat, lng, filename, coverPhoto, postLink]) => {
                const { trackName, trackDate } = extractTrackName(filename);
                const gpxURL = `${gpxFolder}${filename}`;
                const randomColor = trackColors[Math.floor(Math.random() * trackColors.length)];

                // Build popup content using track-popup style
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
                    // Fallback to simple text if no photo
                    popupContent = `
                        <div class="popup-container">
                            <div class="popup-caption">${trackName}<br>${trackDate}</div>
                        </div>`;
                }

                const marker = L.marker([parseFloat(lat), parseFloat(lng)], { 
                    icon: startMarkerIcon, title: filename 
                }).bindPopup(popupContent, { className: 'track-popup' });

                marker.on('click', () => loadGPXTrack(gpxURL, randomColor, marker));
                clusteredMarkers.addLayer(marker);
            });
        })
        .catch(error => console.error('Error loading track markers:', error));
}

// Function to handle zoom level changes and map layer switching
function handleZoomChange() {
    const zoomLevel = map.getZoom();

    // Check if the OpenTopoMap is currently active
    if (map.hasLayer(opentopoMap)) {
        // If zoom level exceeds 15.50, switch to OpenStreetMap
        if (zoomLevel > 15.50) {
            if (!map.hasLayer(openstreetMap)) {
                map.removeLayer(opentopoMap);
                map.addLayer(openstreetMap);
                wasZoomedFromTopo = true; // Mark that we zoomed in from OpenTopoMap
            }
        }
    } else if (map.hasLayer(openstreetMap)) {
        // If OpenStreetMap is already the active layer, do nothing
        // But handle zooming out and returning to OpenTopoMap if necessary
        if (zoomLevel <= 15.50 && wasZoomedFromTopo) {
            // If zoom level is lower than 15.50 and the map was zoomed from OpenTopoMap
            map.removeLayer(openstreetMap);
            map.addLayer(opentopoMap);
            wasZoomedFromTopo = false; // Reset the flag after switching back
        }
    }
}
    // Marker clusters
    markers = L.markerClusterGroup({ maxClusterRadius: 20 });

    // Add default tile layer
    opentopoMap.addTo(map);

    // Add master layers
    masterLayerGroup.addTo(map);
    masterLayerGroup.addLayer(clusteredMarkers);
    masterLayerGroup.addLayer(nonClusteredMarkers);

    // Layer control
    L.control.layers(
        {"OpenTopoMap": opentopoMap, "OpenStreetMap": openstreetMap, "Esri Satellite": esriSatellite},
        {"GPX sledi": masterLayerGroup, "Slike": markers},
        {position: 'topright'}
    ).addTo(map);

    // Add geocoder
    if (L.Control.geocoder) {
        L.Control.geocoder({ defaultMarkGeocode: false, position: 'topright' })
            .on('markgeocode', e => map.setView(e.geocode.center, 12))
            .addTo(map);
    }

    // Fullscreen
    if (L.Control.Fullscreen) {
        map.addControl(new L.Control.Fullscreen({ position: 'topleft', title: 'Show fullscreen', titleCancel: 'Exit fullscreen' }));
    }

    // Custom controls
    map.addControl(new ShowTracksControl());
    map.addControl(new ClearTracksControl());

    // Events
    map.on('click', handleTrackClick);
    map.on('zoomend', handleZoomChange);

    // Initialize track markers
    loadTrackMarkers();

}

// -----------------
// ZOOM SWITCH
// -----------------
function handleZoomChange() {
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
}

// -----------------
// EXPORT
// -----------------
window.MyMemoryMapModule = { init };

})(window);