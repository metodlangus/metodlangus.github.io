/*
 * PeakListModule
 *
 * Renders peak/activity lists with mode-dependent sorting controls.
 *
 * Normal peak page:
 *   Po državi, Po datumu, Po razdalji, Po vzponu, Po višini, Po abecedi
 *
 * Relive page:
 *   Po datumu, Po razdalji, Po vzponu, Po abecedi
 *
 * Activity list:
 *   Keeps existing simple alphabetical flat list.
 *
 * Distance and elevation gain are loaded from:
 *   - list_of_tracks.txt
 *   - list_of_relive_tracks.txt for Relive mode
 */

const PeakListModule = (() => {

    let config = {
        WindowBaseUrl: '',
        isRelive: false,
        isBlogger: false,
        isActivityList: false
    };

    let WindowBaseUrl, isRelive, isBlogger, isActivityList;
    let activeView = 'grouped';
    let allPeaks = [];
    let allHikes = [];
    let trackStatsByFilename = {};
    let peakSearchQuery = '';
    let stylesInjected = false;
    let controlsInjected = false;

    // Function to fetch JSON data from the provided URL
    async function fetchJSON(url) {
        const response = await fetch(url);
        return await response.json();
    }

    async function fetchText(url) {
        const response = await fetch(url);
        return await response.text();
    }

    // Normalize spaces
    function normalizeSpaces(str) {
        return str
            .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeSearchText(str) {
        return normalizeSpaces(str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function getSearchTokens() {
        return normalizeSearchText(peakSearchQuery)
            .split(' ')
            .filter(Boolean);
    }

    function peakMatchesSearch(peakName) {
        const tokens = getSearchTokens();
        if (!tokens.length) return true;

        const normalizedPeakName = normalizeSearchText(peakName);
        return tokens.every(token => normalizedPeakName.includes(token));
    }

    function filterPeaksForSearch(peaks) {
        return peaks.filter(peak => peakMatchesSearch(peak.peakName));
    }

    function filterHikesForSearch(hikes) {
        const tokens = getSearchTokens();
        if (!tokens.length) return hikes;

        return hikes
            .map(hike => {
                const matchingPeaks = hike.peaks.filter(peakName => peakMatchesSearch(peakName));

                return {
                    ...hike,
                    peaks: matchingPeaks
                };
            })
            .filter(hike => hike.peaks.length > 0);
    }

    function parsePeakHeight(peakName) {
        const normalized = normalizeSpaces(peakName);
        const match = normalized.match(/(\d{3,5})\s*(?:m|metrov|meter|meters|m\.?)\b/i);
        return match ? Number(match[1]) : null;
    }

    function buildBadgeLabel(label2, label3) {
        const parts = [label2, label3]
            .flatMap(value => Array.isArray(value) ? value : [value])
            .map(value => normalizeSpaces(value || ''))
            .filter(Boolean);

        return parts.length ? parts.join(' - ') : 'Ostalo';
    }

    function buildCategoryEntries(label2s, label3s) {
        const normalizedLabel2s = (label2s || [])
            .map(value => normalizeSpaces(value || ''))
            .filter(Boolean);
        const normalizedLabel3s = (label3s || [])
            .map(value => normalizeSpaces(value || ''))
            .filter(Boolean);

        const combinedLabel2 = normalizedLabel2s.length ? normalizedLabel2s.join(', ') : 'Ostalo';
        const resolvedLabel3s = normalizedLabel3s.length ? normalizedLabel3s : ['Ostalo'];

        return resolvedLabel3s.map(label3 => ({
            label2: combinedLabel2,
            label3
        }));
    }

    function sortPeaksAlphabetically(labelMap) {
        const sortedLabelMap = {};

        const label2Keys = Object.keys(labelMap).sort((a, b) => {
            if (a === 'Ostalo') return 1;
            if (b === 'Ostalo') return -1;
            return a.localeCompare(b);
        });

        label2Keys.forEach(label2 => {
            const label3Map = labelMap[label2];
            const sortedLabel3Map = {};

            const label3Keys = Object.keys(label3Map).sort((a, b) => {
                if (a === 'Ostalo') return 1;
                if (b === 'Ostalo') return -1;
                return a.localeCompare(b);
            });

            label3Keys.forEach(label3 => {
                sortedLabel3Map[label3] = label3Map[label3].sort((a, b) => {
                    return normalizeSpaces(a.peakName).localeCompare(normalizeSpaces(b.peakName));
                });
            });

            sortedLabelMap[label2] = sortedLabel3Map;
        });

        return sortedLabelMap;
    }

    function sortPeaksByHeight(peaks) {
        const withHeight = [];
        const withoutHeight = [];

        peaks.forEach(peak => {
            if (peak.height !== null && peak.height !== undefined) {
                withHeight.push(peak);
            } else {
                withoutHeight.push(peak);
            }
        });

        return [
            ...withHeight.sort((a, b) => {
                const heightA = a.height ?? Number.MAX_SAFE_INTEGER;
                const heightB = b.height ?? Number.MAX_SAFE_INTEGER;

                if (heightA === heightB) {
                    return normalizeSpaces(a.peakName).localeCompare(normalizeSpaces(b.peakName));
                }

                return heightB - heightA;
            }),
            ...withoutHeight.sort((a, b) => {
                return normalizeSpaces(a.peakName).localeCompare(normalizeSpaces(b.peakName));
            })
        ];
    }

    function sortPeaksAlphabeticallyFlat(peaks) {
        return [...peaks].sort((a, b) => {
            return normalizeSpaces(a.peakName).localeCompare(normalizeSpaces(b.peakName));
        });
    }

    async function loadTrackStats() {
        const stats = {};
        const trackListUrl = isRelive
            ? `${WindowBaseUrl}/list_of_relive_tracks.txt`
            : `${WindowBaseUrl}/list_of_tracks.txt`;

        try {
            const text = await fetchText(trackListUrl);

            text.split('\n').forEach(line => {
                const parts = line.trim().split(';');

                // Format:
                // lat;lng;filename;coverPhoto;postLink;distanceKm;elevationGainM
                if (parts.length < 7) return;

                const filename = normalizeSpaces(parts[2] || '');
                const distanceKm = parseFloat(String(parts[5] || '').replace(',', '.')) || 0;
                const elevationGainM = parseFloat(String(parts[6] || '').replace(',', '.')) || 0;

                if (!filename) return;

                stats[filename] = {
                    distanceKm,
                    elevationGainM
                };
            });
        } catch (error) {
            console.warn('PeakListModule: could not load list_of_tracks.txt', error);
        }

        return stats;
    }

    function extractGpxFilenamesFromContent(content) {
        const filenames = [];

        const matches = content.matchAll(
            /var\s+gpxURL\d*\s*=\s*['"`]?([\s\S]*?\.gpx)/gi
        );

        for (const match of matches) {
            let gpxUrl = match[1] || '';

            // Handles polluted HTML anchor tags if content was copied through editor
            gpxUrl = gpxUrl
                .replace(/<[^>]*>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .replace(/^['"`]+|['"`]+$/g, '');

            const filename = decodeURIComponent(gpxUrl.split('/').pop() || '').trim();

            if (filename) {
                filenames.push(normalizeSpaces(filename));
            }
        }

        return [...new Set(filenames)];
    }

    function getPostTrackStats(content) {
        let totalDistanceKm = 0;
        let totalElevationGainM = 0;

        extractGpxFilenamesFromContent(content).forEach(filename => {
            const stats = trackStatsByFilename[filename];

            if (!stats) return;

            totalDistanceKm += stats.distanceKm || 0;
            totalElevationGainM += stats.elevationGainM || 0;
        });

        return {
            distanceKm: totalDistanceKm,
            elevationGainM: totalElevationGainM
        };
    }

    function addHikeToCollection(collection, hike) {
        collection.push({
            date: hike.date,
            dateKey: hike.dateKey,
            timestamp: hike.timestamp,
            link: hike.link,
            links: hike.link ? [hike.link] : [],
            distanceKm: hike.distanceKm || 0,
            elevationGainM: hike.elevationGainM || 0,
            peaks: [...hike.peaks]
        });

        return collection[collection.length - 1];
    }

    function ensureViewControls() {
        if (isActivityList) return;

        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');
        if (!mountainContainer || controlsInjected) return;

        const controls = document.createElement('div');
        controls.id = 'peak-list-controls';
        controls.className = 'peak-list-controls';

        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'peak-list-search-wrapper';

        const searchInput = document.createElement('input');
        searchInput.id = 'peak-list-search';
        searchInput.className = 'peak-list-search';
        searchInput.type = 'search';
        searchInput.placeholder = 'Išči vrh';
        searchInput.value = peakSearchQuery;
        searchInput.autocomplete = 'off';

        searchInput.addEventListener('input', () => {
            peakSearchQuery = searchInput.value;
            renderCurrentView(allPeaks);
        });

        searchWrapper.appendChild(searchInput);
        controls.appendChild(searchWrapper);

        const buttonRow = document.createElement('div');
        buttonRow.className = 'peak-list-button-row';

        const viewKeys = isRelive
            ? ['time', 'distance', 'gain', 'alphabetical']
            : ['grouped', 'time', 'distance', 'gain', 'height', 'alphabetical'];

        viewKeys.forEach(viewKey => {
            const button = document.createElement('button');
            button.className = 'peak-list-view-btn';
            button.type = 'button';
            button.dataset.view = viewKey;

            if (['time', 'distance', 'gain'].includes(viewKey)) {
                button.dataset.privilegedView = 'true';
                button.style.display = 'none';
            }

            button.textContent = viewKey === 'grouped'
                ? 'Po državi'
                : viewKey === 'time'
                    ? 'Po datumu'
                    : viewKey === 'distance'
                        ? 'Po razdalji'
                        : viewKey === 'gain'
                            ? 'Po vzponu'
                            : viewKey === 'height'
                                ? 'Po višini'
                                : 'Po abecedi';

            button.addEventListener('click', () => {
                activeView = viewKey;
                renderCurrentView(allPeaks);
            });

            buttonRow.appendChild(button);
        });

        controls.appendChild(buttonRow);

        const insertTarget = loadingMessage && loadingMessage.parentNode
            ? loadingMessage
            : mountainContainer;

        insertTarget.parentNode.insertBefore(controls, insertTarget);
        controlsInjected = true;

        if (typeof checkSignIn === 'function') {
            checkSignIn()
                .then(user => updateHikeSortControlsVisibility(user))
                .catch(() => updateHikeSortControlsVisibility(null));
        }

        if (window.onAuthStateChanged) {
            window.onAuthStateChanged(user => updateHikeSortControlsVisibility(user));
        }
    }

    function setActiveControl(viewKey) {
        const buttons = document.querySelectorAll('.peak-list-view-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', button.dataset.view === viewKey);
        });
    }

    function updateHikeSortControlsVisibility(user) {
        const show = hasPrivilegedAccess(user);

        document.querySelectorAll('.peak-list-view-btn[data-privileged-view="true"]').forEach(button => {
            button.style.display = show ? '' : 'none';
        });

        if (!show && ['time', 'distance', 'gain'].includes(activeView)) {
            activeView = isRelive ? 'alphabetical' : 'grouped';
            renderCurrentView(allPeaks);
        }
    }

    function appendDates(container, publishedDates) {
        if (!publishedDates || !publishedDates.length) return;

        const dates = document.createElement('span');
        dates.className = 'peak-dates';
        dates.textContent = ' (';

        publishedDates.forEach(({ date, link }, index) => {
            const linkElement = document.createElement('a');
            linkElement.href = link;
            linkElement.textContent = date;
            dates.appendChild(linkElement);

            if (index < publishedDates.length - 1) {
                dates.appendChild(document.createTextNode(', '));
            }
        });

        dates.appendChild(document.createTextNode(')'));
        container.appendChild(dates);
    }

    function renderGroupedPeaks(sortedLabelMap) {
        const mountainContainer = document.getElementById('mountainContainer');
        mountainContainer.innerHTML = '';

        for (const [label2, label3Map] of Object.entries(sortedLabelMap)) {
            const label3Keys = Object.keys(label3Map);
            const isOnlyOstalo =
                label2 === 'Ostalo' &&
                label3Keys.length === 1 &&
                label3Keys[0] === 'Ostalo';

            if (!isOnlyOstalo) {
                const h2 = document.createElement('h2');
                h2.textContent = label2;
                mountainContainer.appendChild(h2);
            }

            for (const [label3, peaks] of Object.entries(label3Map)) {
                if (!(isOnlyOstalo && label3 === 'Ostalo')) {
                    const h3 = document.createElement('h3');
                    h3.textContent = label3;
                    mountainContainer.appendChild(h3);
                }

                const ul = document.createElement('ul');

                peaks.forEach(({ peakName, publishedDates }) => {
                    const li = document.createElement('li');
                    li.className = 'peak-list-item';

                    const mainRow = document.createElement('div');
                    mainRow.className = 'peak-main-row';

                    const title = document.createElement('span');
                    title.className = 'peak-name';
                    title.textContent = peakName;
                    mainRow.appendChild(title);

                    if (publishedDates && publishedDates.length) {
                        const dates = document.createElement('span');
                        dates.className = 'peak-dates';
                        dates.textContent = ' (';

                        publishedDates.forEach(({ date, link }, index) => {
                            const linkElement = document.createElement('a');
                            linkElement.href = link;
                            linkElement.textContent = date;
                            dates.appendChild(linkElement);

                            if (index < publishedDates.length - 1) {
                                dates.appendChild(document.createTextNode(', '));
                            }
                        });

                        dates.appendChild(document.createTextNode(')'));
                        mainRow.appendChild(dates);
                    }

                    li.appendChild(mainRow);
                    ul.appendChild(li);
                });

                mountainContainer.appendChild(ul);
            }
        }
    }

    function renderFlatPeaks(peaks, showHeight, showCategories = true) {
        const mountainContainer = document.getElementById('mountainContainer');
        mountainContainer.innerHTML = '';

        const ul = document.createElement('ul');

        peaks.forEach(peak => {
            const li = document.createElement('li');
            li.className = 'peak-list-item';

            const mainRow = document.createElement('div');
            mainRow.className = 'peak-main-row';

            const title = document.createElement('span');
            title.className = 'peak-name';
            title.textContent = peak.peakName;
            mainRow.appendChild(title);

            if (showCategories && peak.categories && peak.categories.length) {
                const badges = document.createElement('div');
                badges.className = 'peak-category-badges';

                peak.categories.forEach(category => {
                    const badge = document.createElement('span');
                    badge.className = 'peak-category-badge';
                    badge.textContent = buildBadgeLabel(category.label2, category.label3);
                    badges.appendChild(badge);
                });

                mainRow.appendChild(badges);
            }

            if (peak.publishedDates && peak.publishedDates.length) {
                const dates = document.createElement('span');
                dates.className = 'peak-dates';
                dates.textContent = ' (';

                peak.publishedDates.forEach(({ date, link }, index) => {
                    const linkElement = document.createElement('a');
                    linkElement.href = link;
                    linkElement.textContent = date;
                    dates.appendChild(linkElement);

                    if (index < peak.publishedDates.length - 1) {
                        dates.appendChild(document.createTextNode(', '));
                    }
                });

                dates.appendChild(document.createTextNode(')'));
                mainRow.appendChild(dates);
            }

            li.appendChild(mainRow);
            ul.appendChild(li);
        });

        mountainContainer.appendChild(ul);
    }

    function renderHikesSorted(hikes, sortMode = 'time') {
        const mountainContainer = document.getElementById('mountainContainer');
        mountainContainer.innerHTML = '';

        const sortedHikes = [...hikes].sort((a, b) => {
            if (sortMode === 'distance') {
                const diff = (b.distanceKm || 0) - (a.distanceKm || 0);
                return diff !== 0 ? diff : b.timestamp - a.timestamp;
            }

            if (sortMode === 'gain') {
                const diff = (b.elevationGainM || 0) - (a.elevationGainM || 0);
                return diff !== 0 ? diff : b.timestamp - a.timestamp;
            }

            return b.timestamp - a.timestamp;
        });

        const ul = document.createElement('ul');
        ul.className = 'peak-date-list';

        sortedHikes.forEach(hike => {
            const li = document.createElement('li');
            li.className = 'peak-list-item peak-date-item';

            const mainRow = document.createElement('div');
            mainRow.className = 'peak-main-row peak-date-main-row';

            const dateSpan = document.createElement('span');
            dateSpan.className = 'peak-name peak-date-name';

            if (hike.links && hike.links.length === 1) {
                const dateLink = document.createElement('a');
                dateLink.href = hike.links[0];
                dateLink.textContent = hike.date;
                dateSpan.appendChild(dateLink);
            } else {
                dateSpan.textContent = hike.date;
            }

            mainRow.appendChild(dateSpan);

            const stats = document.createElement('div');
            stats.className = 'peak-track-stats';

            if (hike.distanceKm > 0) {
                const distanceBadge = document.createElement('span');
                distanceBadge.className = 'peak-track-stat-badge';
                distanceBadge.textContent = `${hike.distanceKm.toFixed(1)} km`;
                stats.appendChild(distanceBadge);
            }

            if (hike.elevationGainM > 0) {
                const elevationBadge = document.createElement('span');
                elevationBadge.className = 'peak-track-stat-badge';
                elevationBadge.innerHTML = `<span class="track-stat-arrow">↑</span> ${Math.round(hike.elevationGainM)} m`;
                stats.appendChild(elevationBadge);
            }

            mainRow.appendChild(stats);

            if (hike.peaks && hike.peaks.length) {
                const peaksText = document.createElement('span');
                peaksText.className = 'peak-name peak-day-peaks-text';

                peaksText.textContent = hike.peaks
                    .sort((a, b) => normalizeSpaces(a).localeCompare(normalizeSpaces(b)))
                    .join(', ');

                mainRow.appendChild(peaksText);
            }

            li.appendChild(mainRow);
            ul.appendChild(li);
        });

        mountainContainer.appendChild(ul);
    }
        
    function renderCurrentView(peaks) {
        const mountainContainer = document.getElementById('mountainContainer');
        if (!mountainContainer) return;

        const filteredPeaks = filterPeaksForSearch(peaks);
        const filteredHikes = filterHikesForSearch(allHikes);

        if (isActivityList) {
            renderFlatPeaks(sortPeaksAlphabeticallyFlat(filteredPeaks), false, false);
            return;
        }

        if (
            ['time', 'distance', 'gain'].includes(activeView) &&
            !document.querySelector(`.peak-list-view-btn[data-view="${activeView}"]:not([style*="display: none"])`)
        ) {
            activeView = isRelive ? 'alphabetical' : 'grouped';
        }

        if (isRelive) {
            if (activeView === 'time') {
                renderHikesSorted(filteredHikes, 'time');
            } else if (activeView === 'distance') {
                renderHikesSorted(filteredHikes, 'distance');
            } else if (activeView === 'gain') {
                renderHikesSorted(filteredHikes, 'gain');
            } else {
                renderFlatPeaks(sortPeaksAlphabeticallyFlat(filteredPeaks), false, false);
            }

            setActiveControl(activeView);
            return;
        }

        if (activeView === 'time') {
            renderHikesSorted(filteredHikes, 'time');
        } else if (activeView === 'distance') {
            renderHikesSorted(filteredHikes, 'distance');
        } else if (activeView === 'gain') {
            renderHikesSorted(filteredHikes, 'gain');
        } else if (activeView === 'height') {
            renderFlatPeaks(sortPeaksByHeight(filteredPeaks), true, true);
        } else if (activeView === 'alphabetical') {
            renderFlatPeaks(sortPeaksAlphabeticallyFlat(filteredPeaks), false, true);
        } else {
            const labelMap = {};

            filteredPeaks.forEach(item => {
                const categories = item.categories && item.categories.length
                    ? item.categories
                    : [{ label2: 'Ostalo', label3: 'Ostalo' }];

                categories.forEach(category => {
                    const label2 = normalizeSpaces(category.label2 || 'Ostalo');
                    const label3 = normalizeSpaces(category.label3 || 'Ostalo');
                    labelMap[label2] ??= {};
                    labelMap[label2][label3] ??= [];
                    labelMap[label2][label3].push(item);
                });
            });

            renderGroupedPeaks(sortPeaksAlphabetically(labelMap));
        }

        setActiveControl(activeView);
    }

    // Strip "index.html" from the URL if it exists
    function stripIndexHtml(fullUrl) {
        const url = new URL(fullUrl);
        if (url.pathname.endsWith('/index.html')) {
            url.pathname = url.pathname.replace(/\/index\.html$/, '/');
        }
        return url.toString();
    }

    function addPeakToCollection(collection, peakName, height, categories, publishedDate) {
        const normalizedPeakName = normalizeSpaces(peakName);
        const existing = collection.find(item => normalizeSpaces(item.peakName) === normalizedPeakName);

        if (existing) {
            if (!existing.height && height !== null) {
                existing.height = height;
            }

            existing.publishedDates.push(publishedDate);

            categories.forEach(category => {
                const categoryKey = `${category.label2 || 'Ostalo'}||${category.label3 || 'Ostalo'}`;
                const alreadyHasCategory = existing.categories.some(item => `${item.label2 || 'Ostalo'}||${item.label3 || 'Ostalo'}` === categoryKey);
                if (!alreadyHasCategory) {
                    existing.categories.push(category);
                }
            });

            return existing;
        }

        const newPeak = {
            peakName,
            height,
            categories,
            publishedDates: [publishedDate]
        };

        collection.push(newPeak);
        return newPeak;
    }

    // Main function to parse the JSON data and extract mountain names, heights, post links, and dates
    async function main() {
        const loadingMessage = document.getElementById('loadingMessage');
        const mountainContainer = document.getElementById('mountainContainer');

        ensureViewControls();

        try {
            loadingMessage.style.display = 'block';
            mountainContainer.style.display = 'none';

            const maxResults = 25; // Number of blog posts to fetch per request
            let startIndex = 1; // Start index of blog posts to fetch
            let hasMoreEntries = true;
            let feedUrl;

            allPeaks = [];
            allHikes = [];
            trackStatsByFilename = await loadTrackStats();

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
                    const content = entry.content?.$t || '';

                    const postPeaks = new Set();

                    const fullUrl = entry.link.find(l => l.rel === 'alternate')?.href || '';
                    const postLink = fullUrl ? stripIndexHtml(fullUrl) : '';

                    const d = new Date(entry.published.$t);
                    const date = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                    const dateKey = d.toISOString().slice(0, 10);
                    const timestamp = d.getTime();

                    const postTrackStats = getPostTrackStats(content);

                    const postDoc = new DOMParser().parseFromString(content, 'text/html');
                    const peakElements = postDoc.querySelectorAll('.peak-tag, .peak-tag-manually');

                    function processPeaks(peakElement) {
                        const span = peakElement.querySelector('b span');
                        if (!span) return;

                        // Try to read manual categories from a hidden .category div inside the tag
                        const categoryDiv = peakElement.querySelector('div.category');
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
                            const label3sFromEntry = entry.category?.filter(c => c.term.startsWith('3.')) || [];

                            if (label2) label2s.push(normalizeSpaces(label2.term.slice(2)));
                            label3s = label3sFromEntry.map(c => normalizeSpaces(c.term.slice(2)));
                        }

                        if (label2s.length === 0) label2s = ['Ostalo'];
                        if (label3s.length === 0) label3s = ['Ostalo'];

                        span.textContent
                            .split(',')
                            .map(normalizeSpaces)
                            .filter(peakName => peakName.length > 0)
                            .forEach(peakName => {
                                if (!postLink) return;

                                const height = (isRelive || isActivityList) ? null : parsePeakHeight(peakName);
                                const categories = buildCategoryEntries(label2s, label3s);

                                addPeakToCollection(
                                    allPeaks,
                                    peakName,
                                    height,
                                    categories,
                                    { date, link: postLink }
                                );

                                postPeaks.add(peakName);
                            });
                    }

                    peakElements.forEach(peakElement => processPeaks(peakElement));

                    if (postPeaks.size > 0) {
                        addHikeToCollection(allHikes, {
                            date,
                            dateKey,
                            timestamp,
                            link: postLink,
                            distanceKm: postTrackStats.distanceKm,
                            elevationGainM: postTrackStats.elevationGainM,
                            peaks: [...postPeaks]
                        });
                    }
                });

                startIndex += maxResults;
            }

            renderCurrentView(allPeaks);

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
        isActivityList = config.isActivityList;

        if (isRelive && activeView === 'grouped') {
            activeView = 'time';
        }

        if (!WindowBaseUrl) {
            console.warn('PeakListModule: WindowBaseUrl is missing');
            return;
        }

        main();
    }

    return { init };
})();

window.PeakListModule = PeakListModule;
