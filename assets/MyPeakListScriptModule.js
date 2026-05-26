const PeakListModule = (() => {

    let config = {
        WindowBaseUrl: '',
        isRelive: false,
        isBlogger:false
    };

    let WindowBaseUrl, isRelive, isBlogger;

    // Function to fetch JSON data from the provided URL
    async function fetchJSON(url) {
        const response = await fetch(url);
        return await response.json();
    }

    // Normalize spaces
    function normalizeSpaces(str) {
        return str
            .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Sort peaks alphabetically, keep "Ostalo" last
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
                sortedLabel3Map[label3] =
                    label3Map[label3].sort((a, b) =>
                        a.peakName.localeCompare(b.peakName)
                    );
            });

            sortedLabelMap[label2] = sortedLabel3Map;
        });

        return sortedLabelMap;
    }

    // Render peaks
    function renderSortedPeaks(sortedLabelMap) {
        const mountainContainer = document.getElementById('mountainContainer');
        mountainContainer.innerHTML = '';

        for (const [label2, label3Map] of Object.entries(sortedLabelMap)) {

            const label3Keys = Object.keys(label3Map);
            const isOnlyOstalo =
                label2 === "Ostalo" &&
                label3Keys.length === 1 &&
                label3Keys[0] === "Ostalo";

            if (!isOnlyOstalo) {
                const h2 = document.createElement('h2');
                h2.textContent = label2;
                mountainContainer.appendChild(h2);
            }

            for (const [label3, peaks] of Object.entries(label3Map)) {

                if (!(isOnlyOstalo && label3 === "Ostalo")) {
                    const h3 = document.createElement('h3');
                    h3.textContent = label3;
                    mountainContainer.appendChild(h3);
                }

                const ul = document.createElement('ul');

                peaks.forEach(({ peakName, publishedDates }) => {
                    const li = document.createElement('li');
                    li.textContent = peakName;

                    if (publishedDates.length) {
                        const links = publishedDates
                            .map(({ date, link }) => `<a href="${link}">${date}</a>`)
                            .join(', ');
                        li.innerHTML += ` (${links})`;
                    }

                    ul.appendChild(li);
                });

                mountainContainer.appendChild(ul);
            }
        }
    }

    // Strip "index.html" from the URL if it exists
    function stripIndexHtml(fullUrl) {
        const url = new URL(fullUrl);
        if (url.pathname.endsWith('/index.html')) {
            url.pathname = url.pathname.replace(/\/index\.html$/, '/');
        }
        return url.toString();
    }

    // Main function to parse the JSON data and extract mountain names, heights, post links, and dates
    async function main() {
        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');

        try {
            loadingMessage.style.display = 'block';
            mountainContainer.style.display = 'none';

            const maxResults = 25; // Number of blog posts to fetch per request
            let startIndex = 1; // Start index of blog posts to fetch
            let hasMoreEntries = true;
            var feedUrl;
            const labelMap = {};

            while (hasMoreEntries) {
                if (isBlogger) {
                    feedUrl = `${WindowBaseUrl}feeds/posts/default?start-index=${startIndex}&max-results=${maxResults}&alt=json`;
                } else {
                    feedUrl = isRelive
                      ? `${WindowBaseUrl}/data/all-relive-posts.json`
                      : `${WindowBaseUrl}/data/all-posts.json`;
                }

                const jsonData = await fetchJSON(feedUrl);
                const entries = jsonData.feed.entry || [];

                if (isBlogger) {
                    if (entries.length === 0) {
                        hasMoreEntries = false;
                        break;
                    }
                } else {
                    hasMoreEntries = false;
                }
                

                entries.forEach(entry => {
                    const content = entry.content.$t;

                    const peakTags =
                        content.match(/<div class="peak-tag"[^>]*>(.*?)<\/div>/gs) || [];
                    const peakTagManual =
                        content.match(/<div class="peak-tag-manually"[^>]*>[\s\S]*?<\/div>(?=\s*(?:<b>|<div|$))/gs) || [];

                    function processPeaks(tag, label3Index) {
                        const doc = new DOMParser().parseFromString(tag, 'text/html');
                        const span = doc.querySelector('b span');
                        if (!span) return;

                        // Try to read manual categories from a hidden .category div inside the tag
                        const categoryDiv = doc.querySelector('div.category');
                        let label2s = [];
                        let label3s = [];

                        if (categoryDiv) {
                            const text = categoryDiv.textContent.trim();
                            const inner = text.replace(/^\s*\[|\]\s*$/g, '');
                            const items = inner.split(',').map(s => s.trim()).filter(Boolean);
                            items.forEach(it => {
                                const m = it.match(/^(\d+)\.\s*(.*)$/);
                                if (m) {
                                    const num = m[1];
                                    const val = normalizeSpaces(m[2].trim());
                                    if (num === '2') label2s.push(val);
                                    else if (num === '3') label3s.push(val);
                                }
                            });
                        } else {
                            const label2 = entry.category?.find(c => c.term.startsWith('2.'));
                            const label3s_from_entry = entry.category?.filter(c => c.term.startsWith('3.')) || [];
                            if (label2) label2s.push(normalizeSpaces(label2.term.slice(2)));
                            label3s = label3s_from_entry.map(c => normalizeSpaces(c.term.slice(2)));
                        }

                        if (label2s.length === 0) label2s = ['Ostalo'];
                        if (label3s.length === 0) label3s = ['Ostalo'];

                        span.textContent
                            .split(',')
                            .map(normalizeSpaces)
                            .forEach(peakName => {

                                const fullUrl =
                                    entry.link.find(l => l.rel === 'alternate')?.href;
                                if (!fullUrl) return;

                                const postLink = stripIndexHtml(fullUrl);

                                const d = new Date(entry.published.$t);
                                const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

                                // Add the peak under each provided label2 and label3 combination
                                label2s.forEach(l2 => {
                                    labelMap[l2] ??= {};
                                    label3s.forEach(l3raw => {
                                        const l3 = l3raw ?? 'Ostalo';
                                        labelMap[l2][l3] ??= [];

                                        const existing = labelMap[l2][l3].find(
                                            p => normalizeSpaces(p.peakName) === normalizeSpaces(peakName)
                                        );

                                        if (existing) {
                                            existing.publishedDates.push({ date, link: postLink });
                                        } else {
                                            labelMap[l2][l3].push({
                                                peakName,
                                                publishedDates: [{ date, link: postLink }]
                                            });
                                        }
                                    });
                                });
                            });
                    }

                    peakTags.forEach(t => processPeaks(t, 0));
                    peakTagManual.forEach(t => processPeaks(t, 0));
                });

                startIndex += maxResults;
            }

            renderSortedPeaks(sortPeaksAlphabetically(labelMap));

            loadingMessage.style.display = 'none';
            mountainContainer.style.display = 'block';

        } catch (err) {
            console.error('Peak list error:', err);
        }
    }

    // Public API
    function init(userConfig = {}) {
        config = { ...config, ...userConfig };
        WindowBaseUrl = config.WindowBaseUrl;
        isRelive = config.isRelive;
        isBlogger = config.isBlogger;

        if (!WindowBaseUrl) {
            console.warn('PeakListModule: WindowBaseUrl is missing');
            return;
        }

        main();
    }

    return { init };
})();

window.PeakListModule = PeakListModule;
