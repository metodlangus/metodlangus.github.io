// MyRandomPhoto Module
(function(window) {
    let imageBuffer = [];
    let currentBatchIndex = 0;
    let slideshowContainer;
    let slideContainers = [];
    let shuffledImages = [];
    let activeSlide = 0;

    // Module-level variables
    let WindowBaseUrl;
    let initPhotos;
    let isRelive;

    const defaults = {
        WindowBaseUrl: '',
        initPhotos: 1,
        isRelive: false
    };

    function getCaptions(htmlDoc) {
        const images = htmlDoc.getElementsByTagName('img');
        const captions = [];
        const captionElements = htmlDoc.getElementsByClassName('tr-caption');
        let captionIndex = 0;

        for (let i = 0; i < images.length; i++) {
            let caption = '';
            while (captionIndex < captionElements.length) {
                const currentCaptionElement = captionElements[captionIndex];
                const nextImageElement = images[i + 1];

                if (!nextImageElement || currentCaptionElement.compareDocumentPosition(nextImageElement) & Node.DOCUMENT_POSITION_FOLLOWING) {
                    caption = currentCaptionElement.textContent.trim();
                    captionIndex++;
                    break;
                }
                break;
            }
            captions.push(caption);
        }
        return captions;
    }

    function fetchData() {
        const feedUrl = isRelive
          ? `${WindowBaseUrl}/data/all-relive-posts.json`
          : `${WindowBaseUrl}/data/all-posts.json`;

        fetch(feedUrl)
            .then(response => response.json())
            .then(data => {
                const entries = data.feed.entry;

                entries.forEach(entry => {
                    const content = entry.content.$t;
                    const parser = new DOMParser();
                    const htmlDoc = parser.parseFromString(content, 'text/html');
                    const images = htmlDoc.getElementsByTagName('img');
                    const postTitle = entry.title.$t;
                    const captions = getCaptions(htmlDoc);

                    for (let i = 0; i < images.length; i++) {
                        // Check if the image has a data-skip attribute with a value greater than value saved in initPhotos
                        const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos; // Default value if not set
                        // Extract the `data-skip` attribute content
                        let dataSkip = images[i].getAttribute('data-skip');

                        // Assign a default value to `data-skip` if undefined or "NA"
                        if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
                            dataSkip = "3"; // Assign a default value
                        }

                        // Replace "best" with "0" in the `data-skip` values
                        dataSkip = dataSkip.replace(/best/g, "0");

                        // Replace "cover" with "-1" in the `data-skip` values
                        dataSkip = dataSkip.replace(/cover/g, "-1");

                        // Replace "peak" with "-2" in the `data-skip` values
                        dataSkip = dataSkip.replace(/peak/g, "-2");

                        // Split `data-skip` values by semicolon
                        const dataSkipValues = dataSkip.split(";");

                        // Check if any value in `data-skip` matches or is within the PhotosRange
                        const isWithinRange = dataSkipValues.some(value => {
                            if (!isNaN(value)) {
                                const numericValue = parseFloat(value); // Parse each value to a number

                                // For other ranges, check if the value is within the range
                                return numericValue <= PhotosRange;
                            }
                            return false; // Non-numeric values are ignored
                        });

                        // Perform the desired action based on the range check
                        if (isWithinRange) {
                            // Process and add the image if data-skip is within range
                            let imgSrc = images[i].getAttribute('src');
                            imgSrc = imgSrc.replace(/\/s\d+\/|\/w\d+-h\d+\//, `/s400/`);
                            const caption = captions[i] || '';
                            imageBuffer.push({ src: imgSrc, caption: caption, title: postTitle });
                        }
                    }
                });

                console.log('All entries fetched:', imageBuffer.length, 'images');
                shuffleArray(imageBuffer);
                shuffledImages = imageBuffer.slice();
                buildSlides();

            })
            .catch(error => console.error('Error fetching data:', error));
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function buildSlides() {
        slideshowContainer = document.querySelector('.slideshow-container');
        slideContainers = [
            document.querySelector('.slide1'),
            document.querySelector('.slide2')
        ];

        // Set the initial height of the slideshow container
        adjustSlideshowHeight(slideContainers[0]);

        setTimeout(function () {
            showSlides();
        }, 500); // Switch to start image faster
    }

    function preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            function cleanup() {
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
            }

            function onLoad() {
                cleanup();
                resolve(img);
            }

            function onError(err) {
                cleanup();
                reject(err || new Error(`Failed to load image: ${src}`));
            }

            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);

            img.src = src;
        });
    }

    async function showSlides() {
        if (currentBatchIndex >= shuffledImages.length) {
            currentBatchIndex = 0;
        }

        const nextSlideIndex = (activeSlide + 1) % 2;
        const currentSlideContainer = slideContainers[activeSlide];
        const nextSlideContainer = slideContainers[nextSlideIndex];

        const entry = shuffledImages[currentBatchIndex];
        nextSlideContainer.querySelector('img').src = entry.src;
        nextSlideContainer.querySelector('.uppertext').textContent = entry.title;
        nextSlideContainer.querySelector('.text').textContent = entry.caption;

        // Handle image loading with a fallback to the next image if it fails
        const imgElement = nextSlideContainer.querySelector('img');
        imgElement.onerror = async function() {
            // Attempt to load the next image in the buffer
            currentBatchIndex++;
            if (currentBatchIndex >= shuffledImages.length) {
                currentBatchIndex = 0; // Wrap around if we've reached the end
            }
            const nextEntry = shuffledImages[currentBatchIndex];
            imgElement.src = nextEntry.src; // Set the new image source

            // Set the title and caption for the new image
            nextSlideContainer.querySelector('.uppertext').textContent = nextEntry.title;
            nextSlideContainer.querySelector('.text').textContent = nextEntry.caption;
        };

        // Preload the next image if it exists
        if (currentBatchIndex + 1 < shuffledImages.length) {
            const nextEntry = shuffledImages[currentBatchIndex + 1];
            preloadImage(nextEntry.src);
        }

        // Adjust the height of the slideshow container before showing the next slide
        adjustSlideshowHeight(nextSlideContainer);

        // Fade out the current slide and fade in the next slide
        currentSlideContainer.style.opacity = 0;
        nextSlideContainer.style.opacity = 1;

        setTimeout(() => {
            activeSlide = nextSlideIndex;
            currentBatchIndex++;
            showSlides();
        }, 7000); // Display the new slide for 7 seconds
    }

    function adjustSlideshowHeight(slideContainer) {
        if (!slideshowContainer || !slideContainer) return;

        let image = slideContainer.querySelector('img');
        if (image.complete) {
            let imageAspectRatio = image.naturalWidth / image.naturalHeight;
            let newHeight = slideshowContainer.offsetWidth / imageAspectRatio;
            slideshowContainer.style.height = `${newHeight}px`;
        } else {
            image.addEventListener('load', function () {
                adjustSlideshowHeight(slideContainer);
            });
        }
    }

    // Event listener to trigger random slideshow
    function startRandomSlideshowOnInteraction() {
        window.removeEventListener('scroll', startRandomSlideshowOnInteraction);
        window.removeEventListener('mousemove', startRandomSlideshowOnInteraction);
        fetchData();
    }

    function init(options = {}) {
        const settings = { ...defaults, ...options };
        WindowBaseUrl = settings.WindowBaseUrl;
        initPhotos = settings.initPhotos;

        isRelive = settings.isRelive;
        // Attach event listeners
        window.addEventListener('scroll', startRandomSlideshowOnInteraction, { once: true });
        window.addEventListener('mousemove', startRandomSlideshowOnInteraction, { once: true });

        window.onresize = function () {
            adjustSlideshowHeight(slideContainers[activeSlide]);
        };
    }

    // Expose the init function
    window.MyRandomPhoto = { init };

})(window);