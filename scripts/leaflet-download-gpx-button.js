//<![CDATA[ 
// Custom Leaflet Control for Downloading GPX Files
L.Control.DownloadGPX = L.Control.extend({
    options: {
        position: "topleft",
        title: "Download GPX",
        gpxUrl: null,
        fileName: null
    },
    onAdd: function(map) {
        var container = L.DomUtil.create("div", "leaflet-control-download-gpx leaflet-bar leaflet-control");
        this.link = L.DomUtil.create("a", "leaflet-control-download-gpx-button leaflet-bar-part", container);
        this.link.href = "#";
        this._map = map;
        this.link.title = this.options.title;
        L.DomEvent.on(this.link, "click", this._click, this);
        return container;
    },
    _click: function(e) {
        L.DomEvent.stopPropagation(e);
        L.DomEvent.preventDefault(e);
        this.downloadGPX();
    },
    downloadGPX: function() {
        var gpxUrl = this.options.gpxUrl;
        var fileName = this.options.fileName;
        
        if (!gpxUrl) {
            console.error("GPX URL not provided.");
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
