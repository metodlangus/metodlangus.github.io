import requests
import re

def fetch_file_content(url, local_override=None):
    """Fetches the content of a file either from a URL or a local file."""
    if local_override:
        with open(local_override, 'r', encoding="utf-8") as file:
            return file.read()
    response = requests.get(url)
    response.raise_for_status()  # Raise an error if the request failed
    return response.text

def parse_file_to_dict(local_path=None, url=None):
    """Parses list_of_photos.txt into a dictionary where the key is the image name."""
    photo_data = {}
    content = fetch_file_content(url, local_override=local_path)

    for line in content.splitlines():
        parts = line.split(' ', 1)  # Split only on the first space to keep the rest intact
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]
            
            # Extract the 'data-skip' value if it exists
            match = re.search(r'data-skip=([\d\w;]+)', rest)
            data_skip = match.group(1) if match else "NA"  # Default to "NA" if missing

            # Extract post title and post link (assuming they're enclosed in quotes)
            title_match = re.search(r'"(.*?)"', rest)
            post_title = title_match.group(1) if title_match else ""

            post_link_match = re.search(r'(\d{4}/\d{2}/[\w-]+\.html)', rest)
            post_link = post_link_match.group(1) if post_link_match else ""

            # Store the extracted data in the dictionary
            photo_data[image_name] = {
                "data_skip": data_skip,
                "post_title": post_title,
                "post_link": post_link
            }

    return photo_data

def update_photo_data(extracted_url, list_url, local_list_path, local_file_path):
    """Updates the extracted photos file with the data-skip attribute, post title, and post link."""
    # Parse the list_of_photos.txt file into a dictionary
    photo_dict = parse_file_to_dict(local_path=local_list_path)

    # Fetch the extracted photos file content
    extracted_content = fetch_file_content(extracted_url)
    extracted_lines = extracted_content.splitlines()

    # Regex to match and update the `data-skip` attribute
    data_skip_regex = re.compile(r"(data-skip=[^,]*),?")
    
    updated_lines = []
    for line in extracted_lines:
        parts = line.split(', Link: ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]

            # Retrieve updated data if available
            if image_name in photo_dict:
                skip_data = photo_dict[image_name]["data_skip"]
                post_title = photo_dict[image_name]["post_title"]
                post_link = photo_dict[image_name]["post_link"]

                # Ensure we keep existing metadata and update only what’s necessary
                if "data-skip=" in line:
                    updated_line = re.sub(data_skip_regex, f"data-skip={skip_data},", line)
                else:
                    # Extract the link part and remaining metadata
                    link_part, remainder = rest.split(' ', 1)
                    updated_line = f"{image_name}, Link: {link_part} data-skip={skip_data}, \"{post_title}\" {post_link}, {remainder}"
            else:
                updated_line = line  # No update needed
        else:
            updated_line = line  # No update needed

        updated_lines.append(updated_line)

    # Write the updated lines to the local file
    with open(local_file_path, 'w', encoding="utf-8") as file:
        file.writelines("\n".join(updated_lines) + "\n")

# Local paths for files
local_list_path = 'list_of_photos.txt'
local_file_path = 'extracted_photos_with_gps_data.txt'

# URLs to fallback files (if needed)
extracted_url = 'https://metodlangus.github.io/extracted_photos_with_gps_data.txt'
list_url = 'https://metodlangus.github.io/list_of_photos.txt'

# Update the photo data
update_photo_data(extracted_url, list_url, local_list_path, local_file_path)
