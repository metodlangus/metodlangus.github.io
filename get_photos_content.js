const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');

const blogUrl = 'https://gorski-uzitki.blogspot.com/'; // Blog URL
const maxResults = 10;  // Number of results to fetch in one request
let startIndex = 1;
let imageDetailsBuffer = []; // Array to store image details (filename and URL)

function fetchData() {
    const feedUrl = `${blogUrl}feeds/posts/default?start-index=${startIndex}&max-results=${maxResults}&alt=json`;

    fetch(feedUrl)
        .then(response => response.json())
        .then(data => {
            const entries = data.feed.entry;

            if (!entries || entries.length === 0) {
                // Once all entries are fetched, save the image details
                console.log('All image details:', imageDetailsBuffer);
                const output = imageDetailsBuffer.map(img => `${img.imageName} Link: ${img.imgUrl}`).join('\n');
                fs.writeFileSync('./list_of_photos.txt', output);
                return;
            }

            entries.forEach(entry => {
                const content = entry.content.$t;
                const $ = cheerio.load(content);
                const images = $('img');

                images.each((i, img) => {
                    let imgSrc = $(img).attr('src');
                    imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, `/s400/`); // Resize images for uniformity

                    // Extract the image name (filename) from the URL
                    const imageName = imgSrc.split('/').pop(); // Get the filename from the URL

                    // Push image details (filename and URL) into the buffer
                    imageDetailsBuffer.push({ imageName, imgUrl: imgSrc });
                });
            });

            startIndex += maxResults;
            fetchData(); // Continue fetching next set of images
        })
        .catch(error => console.error('Error fetching data:', error));
}

fetchData();  // Start fetching images
