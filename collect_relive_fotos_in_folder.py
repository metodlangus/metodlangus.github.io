import os
import subprocess
from datetime import datetime
from ppadb.client import Client as AdbClient
import base64
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ================= NEW OUTPUT FOLDERS =================
RELIVE_FOLDER = os.path.join(r"C:\Spletna_stran_Github", "relive_fotos")
MISSING_REPORT = os.path.join(BASE_DIR, "missing_relive_photos.txt")

os.makedirs(RELIVE_FOLDER, exist_ok=True)
# =====================================================


########## SELECT DIRECTORY AS PATH TO IMAGE FOLDER #########
# Phone SD card directory
phone_directory = "/storage/0123-4567/DCIM/Camera"
disk_directory = ""

# # Disk directory
# disk_directory = r"D:\A20e_Camera_Metod(do29_8_24)"
# phone_directory = ""

# # From downloads
# disk_directory = r'C:\Users\HP\Downloads\test'
# phone_directory = ""
#############################################################


def execute_adb_command(command):
    result = subprocess.run(command, capture_output=True, text=True, shell=True)
    return result.stdout.strip()


def adb_connect():
    print("Connecting to ADB...")
    print(execute_adb_command("adb start-server"))
    print(execute_adb_command("adb devices"))


def adb_disconnect():
    print("Disconnecting from ADB...")
    print(execute_adb_command("adb disconnect"))
    print(execute_adb_command("adb kill-server"))


def determine_directory(phone_dir, disk_dir):
    if phone_dir:
        return phone_dir, True
    elif disk_dir:
        return disk_dir, False
    else:
        raise ValueError("Both phone_directory and disk_directory are empty!")


directory, use_adb = determine_directory(phone_directory, disk_directory)


def adb_pull(image_path, local_path):
    result = subprocess.run(
        ["adb", "pull", image_path, local_path],
        capture_output=True,
        text=True
    )
    return result.stdout.strip()


def process_images(list_of_photos_file, images_folder):
    found_images = []

    with open(list_of_photos_file, 'r', encoding="utf-8") as f:
        list_of_photos = f.readlines()

    cleaned_list_of_photos = []

    # ===== CLEAN INPUT LIST =====
    for line in list_of_photos:
        parts = line.strip().split(' ', 4)
        if len(parts) < 5:
            continue

        try:
            decoded_url = base64.b64decode(parts[0]).decode("utf-8")
            original_filename = os.path.basename(decoded_url)

            name_parts = original_filename.split('_')
            if len(name_parts) < 2:
                continue

            image_name = f"{name_parts[0]}_{name_parts[1]}"
            if not image_name.lower().endswith('.jpg'):
                image_name += ".jpg"

            cleaned_list_of_photos.append(image_name)

        except Exception:
            continue

    # ===== GET FILE LIST FROM SOURCE =====
    if use_adb:
        adb_connect()
        client = AdbClient(host="127.0.0.1", port=5037)
        device = client.device("HQ646N0A68")  # Sony device ID
        folder_images = set(
            device.shell(f"ls -1 {images_folder}").splitlines()
        )
    else:
        folder_images = {
            f for f in os.listdir(images_folder)
            if os.path.isfile(os.path.join(images_folder, f))
            and f.lower().endswith(('.jpg', '.jpeg', '.png'))
        }

    print(f"Processing images from: {images_folder}")

    # ===== COLLECT IMAGES =====
    for image_name in cleaned_list_of_photos:
        target_path = os.path.join(RELIVE_FOLDER, image_name)

        # Already collected
        if os.path.exists(target_path):
            found_images.append(image_name)
            continue

        if image_name in folder_images:
            try:
                if use_adb:
                    image_path_on_device = f"{images_folder}/{image_name}"
                    adb_pull(image_path_on_device, target_path)
                else:
                    shutil.copy2(
                        os.path.join(images_folder, image_name),
                        target_path
                    )

                found_images.append(image_name)
                print(f"Collected: {image_name}")

            except Exception as e:
                print(f"Failed to copy {image_name}: {e}")

    # ===== FINAL MISSING CHECK (OUTPUT FOLDER IS SOURCE OF TRUTH) =====
    output_images = {
        f.lower()
        for f in os.listdir(RELIVE_FOLDER)
        if os.path.isfile(os.path.join(RELIVE_FOLDER, f))
    }

    missing_images = [
        img for img in cleaned_list_of_photos
        if img.lower() not in output_images
    ]

    # ===== WRITE MISSING REPORT =====
    with open(MISSING_REPORT, "w", encoding="utf-8") as f:
        for img in missing_images:
            f.write(img + "\n")

    print("\n===== RELIVE PHOTO COLLECTION SUMMARY =====")
    print(f"Total photos in list: {len(cleaned_list_of_photos)}")
    print(f"Collected photos:     {len(found_images)}")
    print(f"Missing photos:       {len(missing_images)}")
    print(f"Collected folder:     {RELIVE_FOLDER}")
    print(f"Missing list saved:   {MISSING_REPORT}")

    if use_adb:
        adb_disconnect()


def main():
    list_of_photos_file = os.path.join(BASE_DIR, "list_of_relive_photos.txt")
    images_folder = directory
    process_images(list_of_photos_file, images_folder)

if __name__ == "__main__":
    main()
