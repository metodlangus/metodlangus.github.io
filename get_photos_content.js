const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const blogUrl = 'https://gorski-uzitki.blogspot.com/'; // Blog URL
const maxResults = 10;  // Number of results to fetch in one request
let startIndex = 1;
let imageDetailsBuffer = []; // Array to store image details

// Function to fetch data from the blog feed
function fetchData() {
    const feedUrl = `${blogUrl}feeds/posts/default?start-index=${startIndex}&max-results=${maxResults}&alt=json`;

    fetch(feedUrl)
        .then(response => response.json())
        .then(data => {
            const entries = data.feed.entry;

            if (!entries || entries.length === 0) {
                // Once all entries are fetched, process duplicates and save results
                console.log('Fetching complete. Processing duplicates...');

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

                // Save the unique image details (with no duplicates) to a file
                const output = uniqueImages
                    .map(img => `${img.imageName} Link: ${img.imgUrl} data-skip=${img.dataSkip} "${img.postTitle}" ${img.postUrl}`)
                    .join('\n');
                fs.writeFileSync('./list_of_photos.txt', output);
                return;
            }

            entries.forEach(entry => {
                const postTitle = entry.title.$t;
                const content = entry.content.$t;
                const postUrl = entry.link.find(link => link.rel === 'alternate').href.replace(blogUrl, '');
                const $ = cheerio.load(content);
                const images = $('img');

                images.each((i, img) => {
                    let imgSrc = $(img).attr('src');
                    if (imgSrc && imgSrc.startsWith('data:image/svg+xml')) return; // Skip SVG images encoded as text
                    imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, '/s400/'); // Resize images for uniformity
                    const imageName = imgSrc.split('/').pop(); // Extract the image name (filename) from the URL
                    const dataSkip = $(img).attr('data-skip') || 'NA';
                    // Push image details (filename, URL, data-skip) into the buffer
                    imageDetailsBuffer.push({ imageName, imgUrl: imgSrc, dataSkip, postTitle, postUrl });
                });
            });

            startIndex += maxResults;
            fetchData(); // Continue fetching the next set of images
        })
        .catch(error => console.error('Error fetching data:', error));
}

// Function to process duplicates and keep only unique images
function processDuplicates(imageDetails) {
    const filenameCounts = {}; // To count occurrences of each filename
    const uniqueImages = [];    // To store unique images (one occurrence per filename)
    const duplicates = [];      // To store duplicate info for logging

    imageDetails.forEach(({ imageName, imgUrl, dataSkip, postTitle, postUrl }) => {
        if (!filenameCounts[imageName]) {
            filenameCounts[imageName] = {
                count: 0,
                firstImgUrl: imgUrl,       // Store only the first image URL
                dataSkips: [],
                firstPostTitle: postTitle, // Store only the first post title
                firstPostUrl: postUrl      // Store only the first post URL
            };
        }
        filenameCounts[imageName].count += 1;
        filenameCounts[imageName].dataSkips.push(dataSkip);

        // Only add the image to uniqueImages the first time we encounter it
        if (filenameCounts[imageName].count === 1) {
            uniqueImages.push({
                imageName,
                imgUrl: filenameCounts[imageName].firstImgUrl,
                dataSkip,
                postTitle: filenameCounts[imageName].firstPostTitle,
                postUrl: filenameCounts[imageName].firstPostUrl
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

fetchData(); // Start fetching images
