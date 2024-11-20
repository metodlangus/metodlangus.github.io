import os
import gpxpy

# Path to the GPX folder
GPX_FOLDER = "GPX_tracks"
OUTPUT_FILE = "list_of_tracks.txt"

def extract_start_coordinates(gpx_file):
    """Extract the start coordinates from a GPX file."""
    try:
        with open(gpx_file, 'r') as f:
            gpx = gpxpy.parse(f)
            if gpx.tracks:
                track = gpx.tracks[0]  # Use the first track
                segment = track.segments[0]  # Use the first segment
                start_point = segment.points[0]  # Get the first point
                return start_point.latitude, start_point.longitude
    except Exception as e:
        print(f"Error processing {gpx_file}: {e}")
    return None, None

def generate_list_of_tracks():
    """Generate the list_of_tracks.txt file with start coordinates."""
    with open(OUTPUT_FILE, 'w') as output:
        for root, _, files in os.walk(GPX_FOLDER):
            for file in files:
                if file.endswith('.gpx'):
                    gpx_path = os.path.join(root, file)
                    lat, lon = extract_start_coordinates(gpx_path)
                    if lat is not None and lon is not None:
                        output.write(f"{lat},{lon},{file}\n")
                    else:
                        output.write(f"0.0,0.0,{file}\n")  # Default coordinates if parsing fails

if __name__ == "__main__":
    generate_list_of_tracks()
