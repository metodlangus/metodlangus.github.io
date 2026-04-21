// MattiaMapScriptModule - Refactored to module pattern
const MattiaMapScriptModule = (function(window) {

    let map;
    let masterLayerGroup;
    let individualLayers = {};
    let postPolylines = {};
    let postMarkers = {};
    let postList = null;
    let sidebar = null;
    let toggleBtn = null;

    const defaults = {
        mapId: 'map',
        sidebarId: 'sidebar',
        toggleBtnId: 'toggleSidebar',
        postListId: 'postList',
        keywordsGeo: window.keywords_geo || {}
    };

    // Distance helper (Haversine formula)
    function distanceKm(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) ** 2 +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    function initializeSidebar() {
        if (!toggleBtn || !sidebar) return;
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('show'));
    }

    function initializeMap(config) {
        const mapContainer = document.getElementById(config.mapId);
        if (!mapContainer) {
            console.error(`Map container with ID "${config.mapId}" not found`);
            return false;
        }

        // Initialize map
        map = L.map(config.mapId, { zoomControl: false }).setView([46.38, 13.3], 10);
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Base layers
        const openTopoMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenTopoMap contributors'
        });
        const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        });
        openTopoMap.addTo(map);

        // Overlay layers
        masterLayerGroup = L.layerGroup().addTo(map);

        // Layer control
        const layersControl = L.control.layers(
            { "OpenTopoMap": openTopoMap, "OpenStreetMap": openStreetMap },
            { "Adventures": masterLayerGroup },
            { position: 'topright' }
        ).addTo(map);

        // Geosearch control
        const geocoder = L.Control.geocoder({ position: 'topright' }).addTo(map);
        const geocoderContainer = geocoder.getContainer();
        geocoderContainer.style.marginTop = '10px';

        return true;
    }

    function populateMap(keywordsGeo) {
        if (!map || !masterLayerGroup) {
            console.error('Map not initialized');
            return;
        }

        const colors = ['red', 'blue', 'green', 'orange', 'purple'];
        let colorIndex = 0;
        const allLatLngs = [];
        const postsData = [];

        for (const [postName, postInfo] of Object.entries(keywordsGeo)) {
            const color = colors[colorIndex % colors.length];
            colorIndex++;

            // Filter valid locations
            let validLocations = postInfo.locations.filter(l => l.lat && l.lon);
            if (validLocations.length > 1) {
                const centroidLat = validLocations.reduce((sum, l) => sum + l.lat, 0) / validLocations.length;
                const centroidLon = validLocations.reduce((sum, l) => sum + l.lon, 0) / validLocations.length;
                validLocations = validLocations.filter(l => distanceKm(l.lat, l.lon, centroidLat, centroidLon) <= 100);
            }

            const latlngs = [];
            const markers = [];
            const activityLayer = L.layerGroup();

            const rawDate = postInfo.date || "";
            const postDateText = rawDate ? rawDate.split(" ")[0] : "Date unknown";
            const postDateObj = rawDate ? new Date(rawDate) : new Date(0);

            // Add markers
            validLocations.forEach(loc => {
                const marker = L.circleMarker([loc.lat, loc.lon], {
                    radius: 8,
                    color,
                    fillColor: color,
                    fillOpacity: 0.8
                }).addTo(masterLayerGroup).addTo(activityLayer);

                const postLink = `https://mattia-furlan.github.io/mont/escursioni/${postName}`;
                marker.bindPopup(`
                    <div class="popup-title">
                        <a href="${postLink}" target="_blank">${postName}</a>
                    </div>
                    <div><strong>${loc.name}</strong></div>
                    <div>Date: ${postDateText}</div>
                    <hr>
                    <div>Other places in this post:<br>${validLocations.map(l => l.name).join(', ')}</div>
                `);

                markers.push(marker);
                latlngs.push([loc.lat, loc.lon]);
                allLatLngs.push([loc.lat, loc.lon]);
            });

            // Add polyline if multiple locations
            if (latlngs.length > 1) {
                const polyline = L.polyline(latlngs, { color, weight: 2, opacity: 0.7 })
                    .addTo(masterLayerGroup).addTo(activityLayer);
                postPolylines[postName] = polyline;
            }

            postMarkers[postName] = markers;
            individualLayers[postName] = activityLayer;
            postsData.push({ postName, postDate: { text: postDateText, dateObj: postDateObj }, latlngs, markers });
        }

        // Sort posts by date (newest first)
        const allPostsSorted = postsData.slice().sort((a, b) => b.postDate.dateObj - a.postDate.dateObj);

        // Populate sidebar
        if (postList) {
            postList.innerHTML = ''; // Clear existing items
            allPostsSorted.forEach(post => {
                const li = document.createElement('li');
                li.textContent = `${post.postName} — ${post.postDate.text}`;

                if (post.latlngs.length > 0) {
                    li.onclick = () => {
                        // Hide all overlays
                        Object.values(individualLayers).forEach(layer => map.removeLayer(layer));
                        // Show selected activity
                        individualLayers[post.postName].addTo(map);
                        map.fitBounds(L.latLngBounds(post.latlngs));
                        post.markers[0].openPopup();
                        if (sidebar) sidebar.classList.remove('show');
                    };
                } else {
                    li.classList.add('no-map');
                    li.onclick = () => {
                        window.open(`https://mattia-furlan.github.io/mont/escursioni/${post.postName}`, '_blank');
                    };
                }

                postList.appendChild(li);
            });
        }

        // Fit map to all locations
        if (allLatLngs.length > 0) {
            map.fitBounds(L.latLngBounds(allLatLngs));
        }
    }

    function init(options = {}) {
        const config = { ...defaults, ...options };

        // Get DOM elements
        map = null;
        sidebar = document.getElementById(config.sidebarId);
        toggleBtn = document.getElementById(config.toggleBtnId);
        postList = document.getElementById(config.postListId);

        // Validate elements
        if (!sidebar) {
            console.warn(`Sidebar with ID "${config.sidebarId}" not found`);
        }
        if (!toggleBtn) {
            console.warn(`Toggle button with ID "${config.toggleBtnId}" not found`);
        }
        if (!postList) {
            console.warn(`Post list with ID "${config.postListId}" not found`);
        }

        // Initialize sidebar toggle
        initializeSidebar();

        // Initialize map
        if (!initializeMap(config)) {
            console.error('Failed to initialize map');
            return;
        }

        // Use provided keywordsGeo or fall back to window global
        const keywordsGeo = config.keywordsGeo || window.keywords_geo;
        if (!keywordsGeo || Object.keys(keywordsGeo).length === 0) {
            console.warn('No keywords_geo data provided');
            return;
        }

        // Populate map with data
        populateMap(keywordsGeo);

        console.log('MattiaMapScriptModule initialized');
    }

    // Public API
    return {
        init,
        getMap: () => map,
        getMasterLayerGroup: () => masterLayerGroup,
        getIndividualLayers: () => individualLayers
    };

})(window);

window.MattiaMapScriptModule = MattiaMapScriptModule;
