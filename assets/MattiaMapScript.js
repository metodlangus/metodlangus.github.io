// Toggle sidebar
const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleSidebar');
toggleBtn.addEventListener('click', () => sidebar.classList.toggle('show'));

// Distance helper
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI/180;
  const dLon = (lon2 - lon1) * Math.PI/180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Initialize map
const map = L.map('map', { zoomControl: false }).setView([46.38, 13.3], 10);
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
const masterLayerGroup = L.layerGroup().addTo(map); // All adventures
const individualLayers = {}; // Individual activity toggle

// Adventures markers and polylines
const colors = ['red', 'blue', 'green', 'orange', 'purple'];
let colorIndex = 0;
const postList = document.getElementById('postList');
const allLatLngs = [];
const postsData = [];
const postPolylines = {};
const postMarkers = {};

(function() {
  for (const [postName, postInfo] of Object.entries(keywords_geo)) {
    const color = colors[colorIndex % colors.length];
    colorIndex++;

    let validLocations = postInfo.locations.filter(l => l.lat && l.lon);
    if (validLocations.length > 1) {
      const centroidLat = validLocations.reduce((sum, l) => sum + l.lat, 0)/validLocations.length;
      const centroidLon = validLocations.reduce((sum, l) => sum + l.lon, 0)/validLocations.length;
      validLocations = validLocations.filter(l => distanceKm(l.lat, l.lon, centroidLat, centroidLon) <= 100);
    }

    const latlngs = [];
    const markers = [];
    const activityLayer = L.layerGroup();

    const rawDate = postInfo.date || "";
    const postDateText = rawDate ? rawDate.split(" ")[0] : "Date unknown";
    const postDateObj = rawDate ? new Date(rawDate) : new Date(0);

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

    if (latlngs.length > 1) {
      const polyline = L.polyline(latlngs, { color, weight: 2, opacity: 0.7 }).addTo(masterLayerGroup).addTo(activityLayer);
      postPolylines[postName] = polyline;
    }

    postMarkers[postName] = markers;
    individualLayers[postName] = activityLayer;
    postsData.push({ postName, postDate: { text: postDateText, dateObj: postDateObj }, latlngs, markers });
  }

  // Sort posts by date
  const allPostsSorted = postsData.slice().sort((a,b) => b.postDate.dateObj - a.postDate.dateObj);

  // Populate sidebar
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
        sidebar.classList.remove('show');
      };
    } else {
      li.classList.add('no-map');
      li.onclick = () => {
        window.open(`https://mattia-furlan.github.io/mont/escursioni/${post.postName}`, '_blank');
      };
    }

    postList.appendChild(li);
  });

  if (allLatLngs.length > 0) {
    map.fitBounds(L.latLngBounds(allLatLngs));
  }

  // Layer control
  const layersControl = L.control.layers(
    { "OpenTopoMap": openTopoMap, "OpenStreetMap": openStreetMap },
    { "Adventures": masterLayerGroup },
    { position: 'topright' }
  ).addTo(map);

  // Geosearch control below layers
  const geocoder = L.Control.geocoder({ position: 'topright' }).addTo(map);
  const geocoderContainer = geocoder.getContainer();
  geocoderContainer.style.marginTop = '10px';

})();