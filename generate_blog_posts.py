import requests
from pathlib import Path
from slugify import slugify

# Constants
FEED_URL = "https://gorski-uzitki.blogspot.com/feeds/posts/default?alt=json"
OUTPUT_DIR = Path(r"C:\Spletna_stran_Github\metodlangus.github.io\raw_posts")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def fetch_and_save_raw_posts():
    print("Fetching feed...")
    response = requests.get(FEED_URL)
    response.raise_for_status()

    data = response.json()
    entries = data.get("feed", {}).get("entry", [])
    print(f"Found {len(entries)} entries.")

    for index, entry in enumerate(entries):
        title = entry.get("title", {}).get("$t", f"untitled-{index}")
        content_html = entry.get("content", {}).get("$t", "")
        slug = slugify(title) or f"post-{index}"
        
        fullId = entry.get("id", {}).get("$t", "")
        postId = fullId.split("post-")[-1] if "post-" in fullId else ""
        
        filename = OUTPUT_DIR / f"{slug}.html"

        with open(filename, "w", encoding="utf-8") as f:
            f.write(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{title}</title>

  <script>
    var postTitle = {title!r};
    var postId = {postId!r};
  </script>
  
   <!-- Leaflet Map -->

   <link href='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.css' rel='stylesheet'></script>


   <!-- Leaflet elevation plugin -->
     
   <link href='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.css' rel='stylesheet'></script>
 
   
   <!-- Leaflet fullscreen plugin -->
 
   <link href='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/leaflet.fullscreen.css' rel='stylesheet'></script>
 
   
   <!-- Custom Leaflet download plugin -->

   <link href='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.css' rel='stylesheet'></script>

   
   <!-- Custom lightbox -->
    
   <link href='https://metodlangus.github.io/plugins/lightbox2/2.11.1/css/lightbox.min.css' rel='stylesheet'></script>
 
  
  <!-- Leaflet marker cluster plugin -->
  
  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css' rel='stylesheet'></script>

  <link href='https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css' rel='stylesheet'></script>

  
  <!-- Leaflet geocoder plugin -->
 
  <link href='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.css' rel='stylesheet'></script>

    <link rel="stylesheet" href="../assets/MyMapScript.css">
    <link rel="stylesheet" href="../assets/MySlideshowScript.css">

</head>
<body>
<h2>{title}</h2>
{content_html}


  
  <!-- Leaflet Map -->

  <script src='https://metodlangus.github.io/plugins/leaflet/1.7.1/leaflet.min.js'></script>


  <!-- Leaflet gpx plugin -->
 
  <script src='https://metodlangus.github.io/plugins/togeojson/0.16.0/togeojson.min.js'></script>
   
  <script src='https://metodlangus.github.io/plugins/leaflet-gpx/1.6.0/gpx.min.js'></script>



  <!-- Leaflet elevation plugin -->
     
  <script src='https://metodlangus.github.io/plugins/@raruto/leaflet-elevation/dist/leaflet-elevation.min.js'></script>

  <!-- Leaflet fullscreen plugin -->
 
  <script src='https://metodlangus.github.io/plugins/leaflet-fullscreen/v1.0.1/Leaflet.fullscreen.min.js'></script>

  <!-- Leaflet polylinedecorator plugin -->
 
  <script src='https://metodlangus.github.io/plugins/leaflet-polylinedecorator/1.1.0/leaflet.polylineDecorator.min.js'></script>

  <!-- Custom Leaflet download plugin -->

  <script src='https://metodlangus.github.io/scripts/leaflet-download-gpx-button.js'></script>

  <!-- Custom lightbox -->
    
  <script src='https://metodlangus.github.io/plugins/lightbox2/2.11.1/js/lightbox-plus-jquery.min.js'></script>
  <script src='https://metodlangus.github.io/scripts/full_img_size_button.js'></script>

  <!-- Leaflet marker cluster plugin -->
  
  <script src='https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'></script>

  <!-- Leaflet geocoder plugin -->
 
  <script src='https://cdn.jsdelivr.net/npm/leaflet-control-geocoder@3.1.0/dist/Control.Geocoder.min.js'></script>

  <script src="../assets/MyMapScript.js" defer></script>
  <script src="../assets/MySlideshowScript.js" defer></script>




</body>
</html>""")

        print(f"Saved raw post: {filename}")

if __name__ == "__main__":
    fetch_and_save_raw_posts()
