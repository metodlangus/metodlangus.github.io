const PeakListModule = (() => {

    let config = {
        baseUrl: '',
        isRelive: false
    };

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

    // Get parent directory URL
    function getParentDirectoryUrl(fullUrl) {
        const url = new URL(fullUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        segments.pop();
        return `${url.origin}/${segments.join('/')}/`;
    }

    // Main function to parse the JSON data and extract mountain names, heights, post links, and dates
    async function main() {
        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');

        try {
            loadingMessage.style.display = 'block';
            mountainContainer.style.display = 'none';

            const feedUrl = config.isRelive
                ? `${config.baseUrl}/data/all-relive-posts.json`
                : `${config.baseUrl}/data/all-posts.json`;

            const jsonData = await fetchJSON(feedUrl);
            const entries = jsonData.feed?.entry || [];

            const labelMap = {};

            entries.forEach(entry => {
                const content = entry.content.$t;

                const peakTags =
                    content.match(/<div class="peak-tag"[^>]*>(.*?)<\/div>/gs) || [];
                const peakTag2 =
                    content.match(/<div class="peak-tag2"[^>]*>(.*?)<\/div>/gs) || [];

                function processPeaks(tag, label3Index) {
                    const doc = new DOMParser().parseFromString(tag, 'text/html');
                    const span = doc.querySelector('b span');
                    if (!span) return;

                    span.textContent
                        .split(',')
                        .map(normalizeSpaces)
                        .forEach(peakName => {

                            const fullUrl =
                                entry.link.find(l => l.rel === 'alternate')?.href;
                            if (!fullUrl) return;

                            const postLink = getParentDirectoryUrl(fullUrl);

                            const label2 =
                                entry.category?.find(c => c.term.startsWith('2.'));
                            const label3s =
                                entry.category?.filter(c => c.term.startsWith('3.')) || [];

                            const l2 = label2 ? label2.term.slice(2) : "Ostalo";
                            const l3 = label3s[label3Index]?.term.slice(2) ?? "Ostalo";

                            labelMap[l2] ??= {};
                            labelMap[l2][l3] ??= [];

                            const d = new Date(entry.published.$t);
                            const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;

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
                }

                peakTags.forEach(t => processPeaks(t, 0));
                peakTag2.forEach(t => processPeaks(t, 1));
            });

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

        if (!config.baseUrl) {
            console.warn('PeakListModule: baseUrl is missing');
            return;
        }

        main();
    }

    return { init };
})();

window.PeakListModule = PeakListModule;
