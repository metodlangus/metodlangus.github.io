const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

let imageDetailsBuffer = []; // Array to store image details

const BASE_DIR = __dirname;
const FEED_FILE = path.join(BASE_DIR, 'data', 'all-relive-posts.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'list_of_relive_photos.txt');

/**
 * Normalize image filenames from Relive URLs to standard format.
 * Handles:
 *   IMG_YYYYMMDD_HHMMSS.jpg_1669540460000.jpg
 *   VideoCapture_YYYYMMDD-HHMMSS.jpg_1682747035000.jpg
 *   20210907_110040_001.jpg
 *   Already correct YYYYMMDD_HHMMSS.jpg
 */
function normalizeFilename(name) {
    let base = name.split('/').pop(); // extract filename

    // Case 1: Relive URLs with extra millisecond suffix
    let m = base.match(/^(.+?\.jpg)(?:_\d+\.jpg)?$/i);
    if (m) base = m[1];

    // Case 2: VideoCapture_YYYYMMDD-HHMMSS.jpg -> YYYYMMDD_HHMMSS.jpg
    m = base.match(/^VideoCapture_(\d{8})-(\d{6})\.jpg$/i);
    if (m) return `${m[1]}_${m[2]}.jpg`;

    // Case 3: IMG_YYYYMMDD_HHMMSS.jpg -> YYYYMMDD_HHMMSS.jpg
    m = base.match(/^IMG_(\d{8})_(\d{6})\.jpg$/i);
    if (m) return `${m[1]}_${m[2]}.jpg`;

    // Case 4: Extra _001 or _002 suffix -> remove it
    m = base.match(/^(\d{8}_\d{6})_\d+\.jpg$/i);
    if (m) return `${m[1]}.jpg`;

    // Case 5: Already normalized
    return base;
}

// Function to fetch and parse the feed
function fetchData() {
    console.log('Loading local feed...');

    const rawData = fs.readFileSync(FEED_FILE, 'utf8');
    const data = JSON.parse(rawData);

    const entries = data.feed.entry;

    entries.forEach(entry => {
        const postTitle = entry.title.$t;
        const content = entry.content.$t;
        const postUrl = entry.link.find(link => link.rel === 'alternate')?.href?.replace(/^.*?\/posts/, '');
        const $ = cheerio.load(content);
        const images = $('img');

        images.each((i, img) => {
            let imgSrc = $(img).attr('src');
            if (!imgSrc || imgSrc.startsWith('data:image/svg+xml')) return; // Skip SVG images encoded as text
            imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, '/s400/'); // Uniform size
            const imageName = normalizeFilename(imgSrc); // Normalize filename
            const dataSkip = $(img).attr('data-skip') || 'NA';
            // Push image details (filename, URL, data-skip) into the buffer
            imageDetailsBuffer.push({ imageName, imgUrl: imgSrc, dataSkip, postTitle, postUrl });
        });
    });

    // Once feed are loaded, process duplicates and save results
    console.log('Feed loaded. Processing duplicates...');

    // Process duplicates in a single pass
    const { uniqueImages, duplicates } = processDuplicates(imageDetailsBuffer);

    if (duplicates.length > 0) {
        console.log('Duplicate image filenames found:');
        duplicates.forEach(dup => {
            console.log(`${dup.imageName} (Count: ${dup.count})`);
        });
    } else {
        console.log('No duplicate image filenames found.');
    }

    const output = uniqueImages
        .map(img =>
            `${img.imageName} Link: ${img.imgUrl} data-skip=${img.dataSkip} "${img.postTitle}" ${img.postUrl}`
        )
        .join('\n');

    fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
    console.log(`Saved ${uniqueImages.length} images to ${OUTPUT_FILE}`);
}

// Function to process duplicates and keep only unique images
function processDuplicates(imageDetails) {
    const filenameCounts = {}; // To count occurrences of each filename
    const uniqueImages = [];    // To store unique images (one occurrence per filename)
    const duplicates = [];      // To store duplicate info for logging

    imageDetails.forEach(({ imageName, imgUrl, dataSkip, postTitle, postUrl }) => {
        const normName = normalizeFilename(imageName);
        if (!filenameCounts[normName]) {
            filenameCounts[normName] = {
                count: 0,
                firstImgUrl: imgUrl,       // Store only the first image URL
                dataSkips: [],
                firstPostTitle: postTitle, // Store only the first post title
                firstPostUrl: postUrl      // Store only the first post URL
            };
        }
        filenameCounts[normName].count += 1;
        filenameCounts[normName].dataSkips.push(dataSkip);

        // Only add the image to uniqueImages the first time we encounter it
        if (filenameCounts[normName].count === 1) {
            uniqueImages.push({
                imageName: normName,
                imgUrl: filenameCounts[normName].firstImgUrl,
                dataSkip,
                postTitle: filenameCounts[normName].firstPostTitle,
                postUrl: filenameCounts[normName].firstPostUrl
            });
        }
    });

    // Collect duplicates for logging purposes
    for (const [imageName, data] of Object.entries(filenameCounts)) {
        if (data.count > 1) {
            const combinedDataSkip = combineDataSkipValues(data.dataSkips);
            uniqueImages.forEach(img => {
                if (img.imageName === imageName) {
                    img.dataSkip = combinedDataSkip;
                    img.imgUrl = data.firstImgUrl;      // Keep only the first image URL
                    img.postTitle = data.firstPostTitle; // Keep only the first post title
                    img.postUrl = data.firstPostUrl;     // Keep only the first post URL
                }
            });
            duplicates.push({ imageName, count: data.count });
        }
    }

    return { uniqueImages, duplicates };
}

// Function to combine duplicate data-skip values into a unique, semicolon-separated entry
function combineDataSkipValues(dataSkips) {
    const uniqueValues = new Set();
    dataSkips.forEach(dataSkip => {
        if (dataSkip !== 'NA') {
            // Split by semicolon and remove duplicates within the same `data-skip`
            const parts = dataSkip.split(';').filter(Boolean);
            parts.forEach(part => uniqueValues.add(part));
        }
    });

    // If 'NA' is the only value, keep it; otherwise, concatenate unique non-NA values
    return uniqueValues.size === 0 ? 'NA' : [...uniqueValues].join(';');
}

fetchData(); // Start processing