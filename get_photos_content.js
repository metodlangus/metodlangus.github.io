const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const blogUrl = 'https://gorski-uzitki.blogspot.com/'; // Blog URL
const maxResults = 10;  // Number of results to fetch in one request
let startIndex = 1;
let imageDetailsBuffer = []; // Array to store image details

function fetchData() {
    const feedUrl = `${blogUrl}feeds/posts/default?start-index=${startIndex}&max-results=${maxResults}&alt=json`;

    fetch(feedUrl)
        .then(response => response.json())
        .then(data => {
            const entries = data.feed.entry;

            if (!entries || entries.length === 0) {
                console.log('Fetching complete. Processing duplicates...');
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
                        `${img.imageName}, Link: ${img.imgUrl}, data-skip=${img.dataSkip}, "${img.postTitle}", ${img.postUrl}`
                    )
                    .join('\n');
                    
                fs.writeFileSync('./list_of_photos.txt', output);
                return;
            }

            entries.forEach(entry => {
                const postTitle = entry.title.$t.replace(/,/g, ''); // Remove commas to prevent CSV issues
                const content = entry.content.$t;
                const postUrl = entry.link.find(link => link.rel === 'alternate').href.replace(blogUrl, '');
                const $ = cheerio.load(content);
                const images = $('img');

                images.each((i, img) => {
                    let imgSrc = $(img).attr('src');
                    if (imgSrc && imgSrc.startsWith('data:image/svg+xml')) return;
                    imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, '/s400/');
                    const imageName = imgSrc.split('/').pop();
                    const dataSkip = $(img).attr('data-skip') || 'NA';
                    imageDetailsBuffer.push({ imageName, imgUrl: imgSrc, dataSkip, postTitle, postUrl });
                });
            });

            startIndex += maxResults;
            fetchData();
        })
        .catch(error => console.error('Error fetching data:', error));
}

function processDuplicates(imageDetails) {
    const filenameCounts = {};
    const uniqueImages = [];
    const duplicates = [];

    imageDetails.forEach(({ imageName, imgUrl, dataSkip, postTitle, postUrl }) => {
        if (!filenameCounts[imageName]) {
            filenameCounts[imageName] = { count: 0, urls: [], dataSkips: [], postTitles: [], postUrls: [] };
        }
        filenameCounts[imageName].count += 1;
        filenameCounts[imageName].urls.push(imgUrl);
        filenameCounts[imageName].dataSkips.push(dataSkip);
        filenameCounts[imageName].postTitles.push(postTitle);
        filenameCounts[imageName].postUrls.push(postUrl);

        if (filenameCounts[imageName].count === 1) {
            uniqueImages.push({ imageName, imgUrl, dataSkip, postTitle, postUrl });
        }
    });

    for (const [imageName, data] of Object.entries(filenameCounts)) {
        if (data.count > 1) {
            const combinedDataSkip = combineDataSkipValues(data.dataSkips);
            const combinedPostTitle = [...new Set(data.postTitles)].join(' / '); // Merge unique titles
            const combinedPostUrl = [...new Set(data.postUrls)].join('; ');
            uniqueImages.forEach(img => {
                if (img.imageName === imageName) {
                    img.dataSkip = combinedDataSkip;
                    img.postTitle = combinedPostTitle;
                    img.postUrl = combinedPostUrl;
                }
            });
            duplicates.push({ imageName, count: data.count, urls: data.urls });
        }
    }

    return { uniqueImages, duplicates };
}

function combineDataSkipValues(dataSkips) {
    const uniqueValues = new Set();
    dataSkips.forEach(dataSkip => {
        if (dataSkip !== 'NA') {
            const parts = dataSkip.split(';').filter(Boolean);
            parts.forEach(part => uniqueValues.add(part));
        }
    });
    return uniqueValues.size === 0 ? 'NA' : [...uniqueValues].join(';');
}

fetchData();
