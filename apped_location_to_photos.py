import os
import subprocess
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
from datetime import datetime
from ppadb.client import Client as AdbClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

####### Connect ########
# adb devices
#################################
#### SAFELY DISCONNECT PHONE ####
# adb disconnect
# adb kill-server
#################################

########## SELECT DIRECTORY AS PATH TO IMAGE FOLDER #########
# Phone SD card directory
# commit message: Updated list of extracted_photos_with_gps_data.txt (from phone)
phone_directory = "/storage/0123-4567/DCIM/Camera28"
disk_directory = ""
# -----------------------------------------------------------
# # Disk directory
# # commit message: Updated list of extracted_photos_with_gps_data.txt (from disk)
# disk_directory = r'D:\A20e_Camera_Metod'
# phone_directory = ""
# -----------------------------------------------------------
# # From downloads
# # commit message: Updated list of extracted_photos_with_gps_data.txt (from downloads)
# disk_directory = r'C:\Users\HP\Downloads\test'
# phone_directory = ""
#############################################################

# Function to execute ADB commands
def execute_adb_command(command):
    """Executes an ADB command and returns the output."""
    result = subprocess.run(command, capture_output=True, text=True, shell=True)
    return result.stdout.strip()

# ADB connection setup and teardown
def adb_connect():
    """Connects to ADB and lists connected devices."""
    print("Connecting to ADB...")
    print(execute_adb_command("adb start-server"))
    print(execute_adb_command("adb devices"))

def adb_disconnect():
    """Safely disconnects and stops the ADB server."""
    print("Disconnecting from ADB...")
    print(execute_adb_command("adb disconnect"))
    print(execute_adb_command("adb kill-server"))

# Function to decide which directory to use
def determine_directory(phone_dir, disk_dir):
    """
    Determines whether to use the phone directory or disk directory.
    Returns the directory path and a flag indicating whether to use ADB.
    """
    if phone_dir:  # If phone directory is defined and not empty
        return phone_dir, True  # Use phone directory with ADB
    elif disk_dir:  # If disk directory is defined and not empty
        return disk_dir, False  # Use local disk directory
    else:
        raise ValueError("Both phone_directory and disk_directory are undefined or empty!")

# Determine the directory and ADB usage
directory, use_adb = determine_directory(phone_directory, disk_directory)

# Function to pull the image from the device (if needed)
def adb_pull(image_path, local_path):
    """Pull image from the Android device to the local system."""
    result = subprocess.run(["adb", "pull", image_path, local_path], capture_output=True, text=True)
    return result.stdout.strip()

def get_gps_coordinates(exif_data):
    """
    Extract GPS coordinates from EXIF data if present.
    """
    if 'GPSInfo' not in exif_data:
        return None

    gps_info = exif_data['GPSInfo']
    gps_data = {}

    for key in gps_info.keys():
        name = GPSTAGS.get(key, key)
        gps_data[name] = gps_info[key]

    if 'GPSLatitude' in gps_data and 'GPSLongitude' in gps_data:
        lat_deg, lat_min, lat_sec = gps_data['GPSLatitude']
        lon_deg, lon_min, lon_sec = gps_data['GPSLongitude']

        latitude = lat_deg + (lat_min / 60.0) + (lat_sec / 3600.0)
        longitude = lon_deg + (lon_min / 60.0) + (lon_sec / 3600.0)

        if gps_data.get('GPSLatitudeRef') == 'S':
            latitude = -latitude
        if gps_data.get('GPSLongitudeRef') == 'W':
            longitude = -longitude

        return latitude, longitude
    return None

def get_current_utc_time():
    """
    Get the current UTC time in the format YYYY-MM-DD HH:MM:SS.
    """
    return datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

def extract_exif_data(file_path):
    """
    Extract EXIF data from an image file.
    """
    try:
        image = Image.open(file_path)
        exif_data = image._getexif()
        if exif_data:
            return {TAGS.get(tag, tag): value for tag, value in exif_data.items()}
    except Exception as e:
        print(f"Error reading EXIF data for {file_path}: {e}")
    return None

def load_existing_entries(output_file, saved_without_location):
    """
    Load existing entries from the output file into a dictionary of image names and their corresponding links,
    excluding entries with "No location" so they can be rechecked.
    """
    existing_entries = {}
    existing_no_location = set()
    if not os.path.exists(output_file):
        return existing_entries, existing_no_location, saved_without_location

    with open(output_file, 'r', encoding="utf-8") as f:
        for line in f:
            # Extract the image name, link, and check if the image already has GPS data
            parts = line.split(', ')
            if len(parts) > 2:
                image_name = parts[0].split()[0].strip()  # Extract just the image name
                image_link = parts[1].replace("Link:", "").strip()  # Extract the image link
                # Only add entries with valid GPS data
                if "No location" not in line:
                    existing_entries[image_name] = image_link
                if "No location" in line:
                    existing_no_location.add(image_name)
                    saved_without_location += 1
    return existing_entries, existing_no_location, saved_without_location

def process_images(list_of_photos_file, images_folder, output_file, saved_without_location):
    """
    Process each image name, check if it exists in the folder, and extract GPS coordinates and the current UTC time.
    If a previously "No location" image now has a location, update the output file.
    """
    # Load existing entries from the output file
    existing_entries, existing_no_location, saved_without_location = load_existing_entries(output_file, saved_without_location)
    updated_entries = {}
    photos_without_location = 0  # Counter for photos without location
    unprocessed_photos = 0  # Counter for unprocessed photos
    all_photos_in_file = 0  # Counter for all photos

    # Read the list of image names and links from the text file
    with open(list_of_photos_file, 'r', encoding="utf-8") as f:
        list_of_photos = f.readlines()

    cleaned_list_of_photos = []   # Image names
    image_links = []              # Image URLs
    picture_quality_tags = []      # Picture quality (data-skip)
    post_titles = []              # Post titles
    post_links = []               # Post links

    for line in list_of_photos:
        parts = line.strip().split(' ', 4)  # Split first four parts normally
        if len(parts) < 5:
            print(f"Skipping malformed line: {line}")
            continue
        
        image_name = parts[0]
        image_link = parts[2].replace("Link:", "").strip()
        picture_quality_tag = parts[3]
        
        # Extract post title (between quotes)
        remaining_parts = parts[4].split('"', 2)
        if len(remaining_parts) < 3:
            print(f"Skipping malformed line (missing post title or post link): {line}")
            continue
        
        post_title = remaining_parts[1]  # Extract title inside quotes
        post_link = remaining_parts[2].strip()  # Extract post link after title

        # Normalize post links to new Blogger format (remove leading slash)
        if post_link.startswith('/'):
            post_link = post_link[1:]

        if post_link.endswith('/index.html'):
            post_link = post_link.replace('/index.html', '/')
        elif post_link.endswith('.html'):
            post_link = post_link.replace('.html', '/')
        elif not post_link.endswith('/'):
            post_link = post_link + '/'

        cleaned_list_of_photos.append(image_name)
        image_links.append(image_link)
        picture_quality_tags.append(picture_quality_tag)
        post_titles.append(post_title)
        post_links.append(post_link)

  
    # Generate `folder_images` based on the selected directory
    if use_adb:
        adb_connect()  # Connect to ADB
        # Connect to ADB server (default IP is localhost, port is 5037)
        client = AdbClient(host="127.0.0.1", port=5037)

        # Connect to the device (CMD command to get it: C:\Users\HP>adb devices)
        # device = client.device("RF8N704QGCW")  # Use your device ID here A20e
        device = client.device("HQ646N0A68")  # Use your device ID here Sony

        # Using ADB to list images
        folder_images_raw = device.shell(f"ls -1 {images_folder}")  # Get raw output with one file per line
        folder_images = folder_images_raw.splitlines()  # Split the output by newlines
    else:
        # Using local directory listing
        folder_images = [
            image_name for image_name in os.listdir(images_folder)
            if image_name.lower().endswith(('.jpg', '.jpeg', '.png'))
        ]

    # Print the selected directory and processing information
    print(f"Processing images from {'phone directory (ADB)' if use_adb else 'local disk directory'}: {images_folder}")

    for idx, image_name in enumerate(cleaned_list_of_photos):
        image_link = image_links[idx]
        picture_quality_tag = picture_quality_tags[idx]
        
        if image_name in existing_entries:
            # print(f"Skipping already processed image: {image_name}")
            continue
        
        if image_name in folder_images:
            print(f"\nProcessing image: {image_name}")

            if use_adb:
                # Full path to the image on the device
                image_path_on_device = f"{images_folder}/{image_name}"
                
                # Create a subdirectory for extracted images
                extracted_images_dir = "../new_photos"

                # Remove all files in the directory if it exists
                if os.path.exists(extracted_images_dir):
                    for file in os.listdir(extracted_images_dir):
                        file_path = os.path.join(extracted_images_dir, file)
                        try:
                            if os.path.isfile(file_path):
                                os.remove(file_path)
                        except Exception as e:
                            print(f"Error removing file {file_path}: {e}")

                # Recreate the directory
                os.makedirs(extracted_images_dir, exist_ok=True)

                # Local path where the image will be saved temporarily
                image_path = os.path.join(extracted_images_dir, image_name)

                # Pull the image file to a local folder for EXIF extraction
                adb_pull(image_path_on_device, image_path)
            else:
                image_path = os.path.join(images_folder, image_name)

            # Extract EXIF data and GPS coordinates if present
            exif_data = extract_exif_data(image_path)
            current_utc_time = get_current_utc_time()
            if exif_data:
                gps_coords = get_gps_coordinates(exif_data)
                if gps_coords:
                    updated_entries[image_name] = {
                        'image_name': image_name,
                        'image_link': image_link,
                        'picture_quality_tag': picture_quality_tag,
                        'post_title': post_titles[idx],  # New field
                        'post_link': post_links[idx],    # New field
                        'gps_coordinates': gps_coords,
                        'extraction_time': current_utc_time
                    }
                else:
                    photos_without_location += 1
                    if image_name in existing_no_location:
                        # Photo already in database with "No location", keep timestamp, do not update
                        continue
                    print(f"No GPS data found for {image_name}. Writing 'No location' with the same timestamp.")
                    updated_entries[image_name] = {
                        'image_name': image_name,
                        'image_link': image_link,
                        'picture_quality_tag': picture_quality_tag,
                        'post_title': post_titles[idx],  # New field
                        'post_link': post_links[idx],    # New field
                        'gps_coordinates': "No location",
                        'extraction_time': current_utc_time
                    }
            else:
                photos_without_location += 1
                if image_name in existing_no_location:
                    # Photo already in database with "No location", keep timestamp, do not update
                    continue
                print(f"No EXIF data found for {image_name}. Writing 'No EXIF data' with the same timestamp.")
                updated_entries[image_name] = {
                    'image_name': image_name,
                    'image_link': image_link,
                    'picture_quality_tag': picture_quality_tag,
                    'post_title': post_titles[idx],  # New field
                    'post_link': post_links[idx],    # New field
                    'gps_coordinates': "No EXIF data",
                    'extraction_time': current_utc_time
                }
        else:
            print(f"Image {image_name} not found in folder: {images_folder}")
            unprocessed_photos += 1

    all_photos_in_file = idx

    # Rewrite output file with updated entries
    with open(output_file, 'r', encoding="utf-8") as f:
        existing_lines = f.readlines()

    with open(output_file, 'w', encoding="utf-8") as f:
        for line in existing_lines:
            image_name = line.split(', ')[0].split()[0].strip()
            if image_name in updated_entries:
                data = updated_entries[image_name]
                gps_data = data['gps_coordinates']
                if gps_data == "No EXIF data" or gps_data == "No location":
                    f.write(f"{data['image_name']}, Link: {data['image_link']}, {data['picture_quality_tag']}, \"{data['post_title']}\", {data['post_link']}, GPS Coordinates: {gps_data}, Time: {data['extraction_time']}\n")
                else:
                    f.write(f"{data['image_name']}, Link: {data['image_link']}, {data['picture_quality_tag']}, \"{data['post_title']}\", {data['post_link']}, Latitude: {gps_data[0]}, Longitude: {gps_data[1]}, Time: {data['extraction_time']}\n")
                del updated_entries[image_name]
            else:
                f.write(line)

        # Add remaining updated entries
        for data in updated_entries.values():
            gps_data = data['gps_coordinates']
            if gps_data == "No EXIF data" or gps_data == "No location":
                f.write(f"{data['image_name']}, Link: {data['image_link']}, {data['picture_quality_tag']}, \"{data['post_title']}\", {data['post_link']}, GPS Coordinates: {gps_data}, Time: {data['extraction_time']}\n")
            else:
                f.write(f"{data['image_name']}, Link: {data['image_link']}, {data['picture_quality_tag']}, \"{data['post_title']}\", {data['post_link']}, Latitude: {gps_data[0]}, Longitude: {gps_data[1]}, Time: {data['extraction_time']}\n")

    print(f"\n\nFile updated from directory: {images_folder}")
    print(f" - {len(updated_entries)} entries rewritten with location")
    print(f" - {photos_without_location} photos in current directory are without location data.\n")
    print(f"About photos from others directoryes:")
    print(f" - {all_photos_in_file} photos are in input file.")
    print(f" - {saved_without_location} photos are saved without location.")
    print(f" - {unprocessed_photos - saved_without_location} photos ramains unprocessed.\n")
    
    if use_adb:
        adb_disconnect()  # Disconnect from ADB

def main():
    list_of_photos_file = os.path.join(BASE_DIR, "list_of_photos.txt")  # The file containing the image names and links
    images_folder = directory  # Update the path with raw string notation
    output_file = os.path.join(BASE_DIR, "extracted_photos_with_gps_data.txt")  # The file to save the extracted GPS coordinates and UTC times

    # Process the images and extract GPS data
    saved_without_location = 0  # Counter for photos saved without location
    process_images(list_of_photos_file, images_folder, output_file, saved_without_location)

if __name__ == "__main__":
    main()
