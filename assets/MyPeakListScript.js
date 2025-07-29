// Function to fetch JSON data from the provided URL
async function fetchJSON(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// Function to sort peaks alphabetically; ensure 'Ostalo' is always last in label2 and label3
function sortPeaksAlphabetically(labelMap) {
    const sortedLabelMap = {};
    const label2Keys = Object.keys(labelMap).sort((a, b) => {
        if (a === "Ostalo") return 1;
        if (b === "Ostalo") return -1;
        return a.localeCompare(b);
    });

    label2Keys.forEach(label2 => {
        const label3Map = labelMap[label2];
        const sortedLabel3Map = {};
        const label3Keys = Object.keys(label3Map).sort((a, b) => {
            if (a === "Ostalo") return 1;
            if (b === "Ostalo") return -1;
            return a.localeCompare(b);
        });

        label3Keys.forEach(label3 => {
            sortedLabel3Map[label3] = label3Map[label3].sort((a, b) => a.peakName.localeCompare(b.peakName));
        });

        sortedLabelMap[label2] = sortedLabel3Map;
    });

    return sortedLabelMap;
}

// Function to render the sorted peaks
function renderSortedPeaks(sortedLabelMap) {
    const mountainContainer = document.getElementById('mountainContainer');
    mountainContainer.innerHTML = '';

    for (const [label2, label3Map] of Object.entries(sortedLabelMap)) {
        const label2Header = document.createElement('h2');
        label2Header.textContent = label2;
        mountainContainer.appendChild(label2Header);

        for (const [label3, peaks] of Object.entries(label3Map)) {
            const label3Header = document.createElement('h3');
            label3Header.textContent = label3;
            mountainContainer.appendChild(label3Header);

            peaks.forEach(({ peakName, publishedDates }) => {
                const peakItem = document.createElement('li');
                peakItem.textContent = peakName;

                if (publishedDates.length > 0) {
                    const dateLinks = publishedDates.map(({ date, link }) => `<a href="${link}">${date}</a>`).join(', ');
                    peakItem.innerHTML += ` (${dateLinks})`;
                }

                mountainContainer.appendChild(peakItem);
            });
        }
    }
}

// Main function to parse the JSON data and extract mountain names, heights, post links, and dates
async function main() {
    try { 
        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');
        loadingMessage.style.display = 'block';
        mountainContainer.style.display = 'none';

        const maxResults = 25; // Number of blog posts to fetch per request
        let startIndex = 1; // Start index of blog posts to fetch
        let labelMap = {};
        let hasMoreEntries = true;

        
        feedUrl = `${WindowBaseUrl}/data/all-posts.json`;
        const jsonData = await fetchJSON(feedUrl);
        const entries = jsonData.feed.entry || [];


        entries.forEach(entry => {
            const content = entry.content.$t;
            const peakTagMatches = content.match(/<div class="peak-tag"[^>]*>(.*?)<\/div>/gs) || [];
            const peakTag2Matches = content.match(/<div class="peak-tag2"[^>]*>(.*?)<\/div>/gs) || [];

            // Helper function to process peaks
            function processPeaks(peakTagMatch, label3Index) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(peakTagMatch, 'text/html');
                const span = doc.querySelector('b span');

                if (span && span.textContent) {
                    const namesAndHeights = span.textContent
                        .split(',')
                        .map(nameAndHeight => nameAndHeight.trim());

                    namesAndHeights.forEach(nameAndHeight => {
                        const peakName = nameAndHeight;
                        const fullUrl = entry.link.find(link => link.rel === 'alternate').href;
                        const postLink = new URL(fullUrl).pathname.slice(1); // remove leading "/"

                        // Extract labels with prefixes "2." and all "3."
                        const label2 = entry.category ? entry.category.find(cat => cat.term.startsWith('2.')) : null;
                        const label3Categories = entry.category ? entry.category.filter(cat => cat.term.startsWith('3.')) : [];

                        const labelText2 = label2 ? label2.term.slice(2) : "Ostalo";
                        const labelText3 = label3Categories.length > label3Index
                            ? label3Categories[label3Index].term.slice(2)
                            : "Ostalo";

                        if (!labelMap[labelText2]) {
                            labelMap[labelText2] = {};
                        }

                        if (!labelMap[labelText2][labelText3]) {
                            labelMap[labelText2][labelText3] = [];
                        }

                        const publishedDate = new Date(entry.published.$t);
                        const formattedDate = `${publishedDate.getDate()}/${publishedDate.getMonth() + 1}/${publishedDate.getFullYear()}`;

                        // Check if the peak already exists in the list
                        const existingPeak = labelMap[labelText2][labelText3].find(peak => peak.peakName === peakName);
                        if (existingPeak) {
                            existingPeak.publishedDates.push({ date: formattedDate, link: postLink });
                        } else {
                            labelMap[labelText2][labelText3].push({ peakName, publishedDates: [{ date: formattedDate, link: postLink }] });
                        }
                    });
                }
            }

            peakTagMatches.forEach(peakTagMatch => processPeaks(peakTagMatch, 0));
            peakTag2Matches.forEach(peakTagMatch => processPeaks(peakTagMatch, 1));
        });

        // Render initial unsorted peaks
        renderSortedPeaks(labelMap);

        // Sort list alphabetically
        const sortedLabelMap = sortPeaksAlphabetically(labelMap);
        renderSortedPeaks(sortedLabelMap);

        // Hide loading message and show mountainContainer after content is loaded
        loadingMessage.style.display = 'none';
        mountainContainer.style.display = 'block';

    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

// Run the main function
main();
