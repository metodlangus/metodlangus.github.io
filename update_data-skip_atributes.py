import requests

def fetch_file_content(url):
    """Fetches the content of a file from a URL."""
    response = requests.get(url)
    response.raise_for_status()  # Raise an error if the request failed
    return response.text

def parse_file_to_dict(url):
    """Parses a file from a URL into a dictionary where the key is the image name."""
    photo_data = {}
    content = fetch_file_content(url)
    for line in content.splitlines():
        parts = line.split(' ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]
            if "data-skip=" in rest:
                skip_data = rest.split("data-skip=")[1].strip()
                photo_data[image_name] = skip_data
    return photo_data

def update_photo_data(extracted_url, list_url, local_file_path):
    """Updates the extracted photos file with the data-skip attribute."""
    # Parse the list file into a dictionary
    photo_dict = parse_file_to_dict(list_url)

    # Fetch the extracted photos file content
    extracted_content = fetch_file_content(extracted_url)
    extracted_lines = extracted_content.splitlines()

    # Process and update each line
    updated_lines = []
    for line in extracted_lines:
        parts = line.split(', Link: ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]
            skip_data = photo_dict.get(image_name, "")
            if skip_data:
                # Insert the data-skip attribute
                link_part, remainder = rest.split(' ', 1)
                updated_line = f"{image_name}, Link: {link_part} data-skip={skip_data} {remainder}"
            else:
                updated_line = line  # No update needed
        else:
            updated_line = line  # No update needed

        updated_lines.append(updated_line)

    # Write the updated lines to a local file
    with open(local_file_path, 'w') as file:
        file.writelines("\n".join(updated_lines) + "\n")

# URLs to input files
extracted_url = 'https://metodlangus.github.io/extracted_photos_with_gps_data.txt'
list_url = 'https://metodlangus.github.io/list_of_photos.txt'

# Local file path for the updated file
local_file_path = 'extracted_photos_with_gps_data.txt'

# Update the photo data
update_photo_data(extracted_url, list_url, local_file_path)
