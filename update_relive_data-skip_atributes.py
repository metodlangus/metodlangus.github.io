import re
import os


BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def fetch_file_content(local_path):
    """Fetches the content of a local file. Creates the file if it doesn't exist."""
    os.makedirs(os.path.dirname(local_path), exist_ok=True)

    if not os.path.exists(local_path):
        with open(local_path, 'w', encoding="utf-8") as f:
            f.write("")

    with open(local_path, 'r', encoding="utf-8") as file:
        return file.read()


def parse_file_to_dict(local_path):
    """Parses list_of_photos.txt into a dictionary where the key is the image name."""
    photo_data = {}
    content = fetch_file_content(local_path)

    for line in content.splitlines():
        parts = line.split(' ', 1)
        if len(parts) > 1:
            image_name, rest = parts[0], parts[1]

            match = re.search(r'data-skip=([\d\w;]+)', rest)
            data_skip = match.group(1) if match else "NA"

            title_match = re.search(r'"(.*?)"', rest)
            post_title = title_match.group(1) if title_match else ""

            post_link_match = re.search(r'(\d{4}/\d{2}/[\w-]+/index\.html)', rest)
            post_link = post_link_match.group(1) if post_link_match else ""

            if post_link.endswith("index.html"):
                post_link = post_link.replace("index.html", "")

            photo_data[image_name] = {
                "data_skip": data_skip,
                "post_title": post_title,
                "post_link": post_link
            }

    return photo_data


def update_photo_data(local_list_path, local_file_path):
    """
    Updates the extracted photos file with data-skip, post title, and post link.
    Rows whose image name is NOT present in the input list are removed.
    """
    photo_dict = parse_file_to_dict(local_list_path)

    extracted_content = fetch_file_content(local_file_path)
    extracted_lines = extracted_content.splitlines()

    data_skip_regex = re.compile(r"(data-skip=[^,]*),?")

    updated_lines = []
    removed_count = 0

    for line in extracted_lines:
        # Skip empty lines
        if not line.strip():
            continue

        parts = line.split(', Link: ', 1)
        if len(parts) > 1:
            image_name = parts[0]

            # --- KEY CHANGE: skip rows not in input list ---
            if image_name not in photo_dict:
                print(f"Removing row (not in input list): {image_name}")
                removed_count += 1
                continue

            rest = parts[1]
            skip_data = photo_dict[image_name]["data_skip"]
            post_title = photo_dict[image_name]["post_title"]
            post_link = photo_dict[image_name]["post_link"]

            # Update or insert data-skip
            if "data-skip=" in line:
                line = re.sub(data_skip_regex, f"data-skip={skip_data},", line)
            else:
                line = line.replace(rest, f"{rest} data-skip={skip_data},")

            # Update post title
            line = re.sub(r'"[^"]*"', f'"{post_title}"', line)

            # Update post link only if it exists
            if post_link:
                line = re.sub(r'\d{4}/\d{2}/[\w-]+/index\.html', post_link, line)

        updated_lines.append(line)

    # Write updated content back to file
    with open(local_file_path, 'w', encoding="utf-8") as file:
        file.write("\n".join(updated_lines) + "\n")

    print(f"Done. {len(updated_lines)} rows kept, {removed_count} rows removed.")


# Local paths for files
local_list_path = os.path.join(BASE_DIR, 'list_of_relive_photos.txt')
local_file_path = os.path.join(BASE_DIR, 'extracted_relive_photos_with_gps_data.txt')

# Update the photo data (LOCAL ONLY)
update_photo_data(local_list_path, local_file_path)