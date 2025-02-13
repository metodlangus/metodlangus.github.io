import requests
import re

def fetch_file_content(url, local_override=None):
    """Fetches the content of a file either from a URL or a local file."""
    if local_override:
        with open(local_override, 'r', encoding='utf-8') as file:
            return file.read()
    response = requests.get(url)
    response.raise_for_status()  # Raise an error if the request failed
    return response.text

def parse_file_to_dict(local_path=None, url=None):
    """Parses a file into a dictionary where the key is the image name."""
    photo_data = {}
    content = fetch_file_content(url, local_override=local_path)
    for line in content.splitlines():
        parts = line.split(' ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]
            if "data-skip=" in rest:
                skip_data = rest.split("data-skip=")[1].strip()
                photo_data[image_name] = skip_data
    return photo_data

def update_photo_data(extracted_url, list_url, local_list_path, local_file_path):
    """Updates the extracted photos file with the data-skip attribute correctly formatted."""
    # Parse the list file into a dictionary
    photo_dict = parse_file_to_dict(local_path=local_list_path)

    # Fetch the extracted photos file content
    extracted_content = fetch_file_content(extracted_url)
    extracted_lines = extracted_content.splitlines()

    # Regex to match data-skip (correcting cases where it's misplaced)
    data_skip_regex = re.compile(r"(data-skip=[^,]*)\s")

    # Process and update each line
    updated_lines = []
    for line in extracted_lines:
        parts = line.split(', Link: ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]
            skip_data = photo_dict.get(image_name, "").strip()

            if skip_data:
                if "data-skip=" in line:
                    # Ensure proper comma placement after data-skip
                    updated_line = re.sub(data_skip_regex, f"data-skip={skip_data}, ", line)
                else:
                    # Find the blog post link position and insert properly formatted data-skip
                    rest_parts = rest.split(', ', 1)
                    if len(rest_parts) > 1:
                        link_part, remainder = rest_parts
                        updated_line = f"{image_name}, Link: {link_part}, data-skip={skip_data}, {remainder}"
                    else:
                        updated_line = f"{image_name}, Link: {rest}, data-skip={skip_data}"
            else:
                updated_line = line  # No update needed
        else:
            updated_line = line  # No update needed

        updated_lines.append(updated_line)

    # Write the updated lines to a local file
    with open(local_file_path, 'w', encoding='utf-8') as file:
        file.writelines("\n".join(updated_lines) + "\n")

# Local paths for files
local_list_path = 'list_of_photos.txt'
local_file_path = 'extracted_photos_with_gps_data.txt'

# URLs to fallback files (if needed)
extracted_url = 'https://metodlangus.github.io/extracted_photos_with_gps_data.txt'
list_url = 'https://metodlangus.github.io/list_of_photos.txt'

# Update the photo data
update_photo_data(extracted_url, list_url, local_list_path, local_file_path)
