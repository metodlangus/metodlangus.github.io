// Function to fetch JSON data from the provided URL
async function fetchJSON(url) {
    const response = await fetch(url);
    const data = await response.json();
    return data;
}

// Normalize spaces: treat all space variants (non-breaking, thin, etc.) as the same
function normalizeSpaces(str) {
    return str.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ').replace(/\s+/g, ' ').trim();
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
            sortedLabel3Map[label3] = label3Map[label3].sort((a, b) =>
                a.peakName.localeCompare(b.peakName)
            );
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

        const label3Keys = Object.keys(label3Map);
        const isOnlyOstalo = label2 === "Ostalo" && label3Keys.length === 1 && label3Keys[0] === "Ostalo";

        // Display <h2> only if this is NOT the special Ostalo/Ostalo-only case
        if (!isOnlyOstalo) {
            const label2Header = document.createElement('h2');
            label2Header.textContent = label2;
            mountainContainer.appendChild(label2Header);
        }

        for (const [label3, peaks] of Object.entries(label3Map)) {

            // Also skip <h3> if this is the single Ostalo/Ostalo block
            if (!(isOnlyOstalo && label3 === "Ostalo")) {
                const label3Header = document.createElement('h3');
                label3Header.textContent = label3;
                mountainContainer.appendChild(label3Header);
            }

            // Wrap <li> elements in <ul>
            const ul = document.createElement('ul');

            peaks.forEach(({ peakName, publishedDates }) => {
                const peakItem = document.createElement('li');
                peakItem.textContent = peakName;

                if (publishedDates.length > 0) {
                    const dateLinks = publishedDates.map(({ date, link }) =>
                        `<a href="${link}">${date}</a>`
                    ).join(', ');
                    peakItem.innerHTML += ` (${dateLinks})`;
                }

                ul.appendChild(peakItem);
            });

            mountainContainer.appendChild(ul);
        }
    }
}

// Helper function to get post link from parent directory
function getParentDirectoryUrl(fullUrl) {
    const url = new URL(fullUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    segments.pop(); // remove last segment (file or folder)
    const parentPath = segments.join('/') + '/'; // ensure trailing slash
    return `${url.origin}/${parentPath}`;
}

// Main function to parse the JSON data and extract mountain names, heights, post links, and dates
async function main() {
    try {
        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');
        loadingMessage.style.display = 'block';
        mountainContainer.style.display = 'none';

        let labelMap = {};

        const isRelive = window.BLOG_CONTEXT?.isRelive === true;
        const feedUrl = isRelive
          ? `${WindowBaseUrl}/data/all-relive-posts.json`
          : `${WindowBaseUrl}/data/all-posts.json`;

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
                        .map(nameAndHeight => normalizeSpaces(nameAndHeight));

                    namesAndHeights.forEach(nameAndHeight => {
                        const peakName = normalizeSpaces(nameAndHeight);
                        const fullUrl = entry.link.find(link => link.rel === 'alternate').href;
                        const postLink = getParentDirectoryUrl(fullUrl); // use simplified parent directory

                        const label2 = entry.category ? entry.category.find(cat => cat.term.startsWith('2.')) : null;
                        const label3Categories = entry.category ? entry.category.filter(cat => cat.term.startsWith('3.')) : [];

                        const labelText2 = label2 ? label2.term.slice(2) : "Ostalo";
                        const labelText3 = label3Categories.length > label3Index
                            ? label3Categories[label3Index].term.slice(2)
                            : "Ostalo";

                        if (!labelMap[labelText2]) labelMap[labelText2] = {};
                        if (!labelMap[labelText2][labelText3]) labelMap[labelText2][labelText3] = [];

                        const publishedDate = new Date(entry.published.$t);
                        const formattedDate = `${publishedDate.getDate()}/${publishedDate.getMonth() + 1}/${publishedDate.getFullYear()}`;

                        // Normalize names before comparing to merge duplicates with different spaces
                        const existingPeak = labelMap[labelText2][labelText3].find(
                            peak => normalizeSpaces(peak.peakName) === normalizeSpaces(peakName)
                        );

                        if (existingPeak) {
                            existingPeak.publishedDates.push({ date: formattedDate, link: postLink });
                        } else {
                            labelMap[labelText2][labelText3].push({
                                peakName,
                                publishedDates: [{ date: formattedDate, link: postLink }]
                            });
                        }
                    });
                }
            }

            peakTagMatches.forEach(peakTagMatch => processPeaks(peakTagMatch, 0));
            peakTag2Matches.forEach(peakTagMatch => processPeaks(peakTagMatch, 1));
        });

        // Sort and render peaks
        const sortedLabelMap = sortPeaksAlphabetically(labelMap);
        renderSortedPeaks(sortedLabelMap);

        // Show results
        loadingMessage.style.display = 'none';
        mountainContainer.style.display = 'block';

    } catch (error) {
        console.error('Error fetching or parsing JSON:', error);
    }
}

// Run the main function
main();
