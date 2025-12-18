import re
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def fetch_file_content(local_path):
    """Fetches the content of a local file."""
    with open(local_path, 'r', encoding="utf-8") as file:
        return file.read()


def parse_file_to_dict(local_path):
    """Parses list_of_photos.txt into a dictionary where the key is the image name."""
    photo_data = {}
    content = fetch_file_content(local_path)

    for line in content.splitlines():
        parts = line.split(' ', 1)  # Split only on the first space to keep the rest intact
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]

            # Extract the 'data-skip' value if it exists
            match = re.search(r'data-skip=([\d\w;]+)', rest)
            data_skip = match.group(1) if match else "NA"  # Default to "NA" if missing

            # Extract post title (inside quotes)
            title_match = re.search(r'"(.*?)"', rest)
            post_title = title_match.group(1) if title_match else ""

            # Extract post link (e.g., 2023/03/sardija-2023/index.html)
            post_link_match = re.search(r'(\d{4}/\d{2}/[\w-]+/index\.html)', rest)
            post_link = post_link_match.group(1) if post_link_match else ""

            # Convert post_link to folder-style (remove index.html)
            if post_link.endswith("index.html"):
                post_link = post_link.replace("index.html", "")

            # Store extracted data
            photo_data[image_name] = {
                "data_skip": data_skip,
                "post_title": post_title,
                "post_link": post_link
            }

    return photo_data


def update_photo_data(local_list_path, local_file_path):
    """Updates the extracted photos file with the data-skip attribute, post title, and post link."""
    # Parse the list_of_photos.txt file into a dictionary
    photo_dict = parse_file_to_dict(local_list_path)

    # Load extracted photos file
    extracted_content = fetch_file_content(local_file_path)
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

                # Update or insert data-skip
                if "data-skip=" in line:
                    line = re.sub(data_skip_regex, f"data-skip={skip_data},", line)
                else:
                    # Insert data-skip if missing
                    line = line.replace(rest, f"{rest} data-skip={skip_data},")

                # Update post title
                line = re.sub(r'"[^"]*"', f'"{post_title}"', line)

                # Update post link (remove index.html if present)
                line = re.sub(r'\d{4}/\d{2}/[\w-]+/(?:index\.html)?', post_link, line)

        updated_lines.append(line)

    # Write updated content back to file
    with open(local_file_path, 'w', encoding="utf-8") as file:
        file.write("\n".join(updated_lines) + "\n")


# Local paths for files
local_list_path = os.path.join(BASE_DIR, 'list_of_photos.txt')
local_file_path = os.path.join(BASE_DIR, 'extracted_photos_with_gps_data.txt')

# Update the photo data (LOCAL ONLY)
update_photo_data(local_list_path, local_file_path)