<?php
header('Content-Type: application/json');

// Database connection
$db = new SQLite3('photos_with_location.db');

// Query the database
$query = 'SELECT image_name, url, latitude, longitude, timestamp FROM photos';
$result = $db->query($query);

// Initialize an array to store the results
$photos = [];

while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $photos[] = [
        'image_name' => $row['image_name'],
        'url' => $row['url'],
        'latitude' => $row['latitude'],
        'longitude' => $row['longitude'],
        'timestamp' => $row['timestamp']
    ];
}

// Return the results as JSON
echo json_encode($photos);
?>
