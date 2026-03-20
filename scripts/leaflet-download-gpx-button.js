//<![CDATA[ 
// Custom Leaflet Control for Downloading GPX Files
L.Control.DownloadGPX = L.Control.extend({
    options: {
        position: "topleft",
        title: "Download GPX",
        gpxUrl: null,
        fileName: null,
        isSignedIn: true
    },
    onAdd: function(map) {
        var container = L.DomUtil.create("div", "leaflet-control-download-gpx leaflet-bar leaflet-control");
        this.link = L.DomUtil.create("a", "leaflet-control-download-gpx-button leaflet-bar-part", container);
        this.link.href = "#";
        this._map = map;
        this.link.title = this.options.title;
        this._updateAppearance();

        // React to auth state changes live
        if (window.auth) {
            window.auth.onAuthStateChanged(user => {
                this.options.isSignedIn = !!user;
                this._updateAppearance();

                // If user just signed in and overlay is visible → hide it
                if (user) {
                    const overlay = document.getElementById("authOverlay");
                    if (overlay) overlay.style.display = "none";
                }
            });
        }

        L.DomEvent.on(this.link, "click", this._click, this);
        return container;
    },
    _updateAppearance: function() {
        if (this.options.isSignedIn) {
            this.link.style.opacity = "1";
            this.link.title = this.options.title;
        } else {
            this.link.style.opacity = "0.7";
            this.link.title = "Za prenos GPX datoteke je potrebna prijava";
        }
    },
    _click: function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);

        // If auth is not configured at all, allow download freely
        if (!window.auth) {
            this.downloadGPX();
            return;
        }

        // Auth is present — check if user is signed in
        const currentUser = window.auth.currentUser;
        if (!currentUser) {
            const overlay = document.getElementById("authOverlay");
            if (overlay) overlay.style.display = "flex";
            return;
        }

        this.downloadGPX();
    },
    downloadGPX: function() {
        var gpxUrl = this.options.gpxUrl;
        var fileName = this.options.fileName;
        
        if (!gpxUrl) {
            console.error("GPX URL not provided.");
            return;
        }
        if (!fileName) {
            console.error("File name not provided.");
            return;
        }
        
        // Fetch the GPX data from the URL
        fetch(gpxUrl)
            .then(response => response.blob())
            .then(blob => {
                // Create a temporary anchor element
                var a = document.createElement('a');
                a.href = window.URL.createObjectURL(blob);
                
                // Set the file name
                if (fileName) {
                    a.download = fileName + '.gpx';
                } else {
                    console.error("File name not provided.");
                    return;
                }
                
                // Append the anchor to the body and trigger the click event
                document.body.appendChild(a);
                a.click();
                
                // Clean up
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error("Error fetching GPX data:", error);
            });
    }
});

// Add DownloadGPX Control to Map options
L.Map.mergeOptions({
    downloadGPXControl: false
});

// Initialization hook for DownloadGPX Control
L.Map.addInitHook(function() {
    if (this.options.downloadGPXControl) {
        this.downloadGPXControl = new L.Control.DownloadGPX(this.options.downloadGPXControl);
        this.addControl(this.downloadGPXControl);
    }
});

// Function for creating DownloadGPX Control
L.control.downloadGPX = function(options) {
    return new L.Control.DownloadGPX(options);
};
//]]>
