const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

let imageDetailsBuffer = []; // Array to store image details

const BASE_DIR = __dirname;
const FEED_FILE = path.join(BASE_DIR, 'data', 'all-posts.json');
const OUTPUT_FILE = path.join(BASE_DIR, 'list_of_photos.txt');

// Function to fetch data from the local blog feed
function fetchData() {
    console.log('Loading local feed...');

    const rawData = fs.readFileSync(FEED_FILE, 'utf8');
    const data = JSON.parse(rawData);

    const entries = data.feed.entry;

    entries.forEach(entry => {
        const postTitle = entry.title.$t;
        const content = entry.content.$t;

        let postUrl = '';
        const altLink = entry.link.find(link => link.rel === 'alternate');
        if (altLink) {
            postUrl = altLink.href
                .replace(/^.*?\/posts/, '')   // remove domain + /posts
                .replace(/\/index\.html$/, '/');
        }

        const $ = cheerio.load(content);
        const images = $('img');

        images.each((i, img) => {
            let imgSrc = $(img).attr('src');
            if (!imgSrc) return;
            if (imgSrc.startsWith('data:image/svg+xml')) return;

            imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, '/s400/');
            const imageName = imgSrc.split('/').pop();
            const dataSkip = $(img).attr('data-skip') || 'NA';

            imageDetailsBuffer.push({
                imageName,
                imgUrl: imgSrc,
                dataSkip,
                postTitle,
                postUrl
            });
        });
    });

    console.log('Feed loaded. Processing duplicates...');

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
    const filenameCounts = {};
    const uniqueImages = [];
    const duplicates = [];

    imageDetails.forEach(({ imageName, imgUrl, dataSkip, postTitle, postUrl }) => {
        if (!filenameCounts[imageName]) {
            filenameCounts[imageName] = {
                count: 0,
                firstImgUrl: imgUrl,
                dataSkips: [],
                firstPostTitle: postTitle,
                firstPostUrl: postUrl
            };
        }

        filenameCounts[imageName].count += 1;
        filenameCounts[imageName].dataSkips.push(dataSkip);

        if (filenameCounts[imageName].count === 1) {
            uniqueImages.push({
                imageName,
                imgUrl,
                dataSkip,
                postTitle,
                postUrl
            });
        }
    });

    for (const [imageName, data] of Object.entries(filenameCounts)) {
        if (data.count > 1) {
            const combinedDataSkip = combineDataSkipValues(data.dataSkips);
            uniqueImages.forEach(img => {
                if (img.imageName === imageName) {
                    img.dataSkip = combinedDataSkip;
                    img.imgUrl = data.firstImgUrl;
                    img.postTitle = data.firstPostTitle;
                    img.postUrl = data.firstPostUrl;
                }
            });
            duplicates.push({ imageName, count: data.count });
        }
    }

    return { uniqueImages, duplicates };
}

// Function to combine duplicate data-skip values
function combineDataSkipValues(dataSkips) {
    const uniqueValues = new Set();

    dataSkips.forEach(dataSkip => {
        if (dataSkip !== 'NA') {
            dataSkip
                .split(';')
                .filter(Boolean)
                .forEach(v => uniqueValues.add(v));
        }
    });

    return uniqueValues.size === 0 ? 'NA' : [...uniqueValues].join(';');
}

fetchData(); // Start processing