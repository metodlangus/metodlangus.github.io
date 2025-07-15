// Format date
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.post-date').forEach(function (el) {
    const date = new Date(el.dataset.date);
    const formatted = date.toLocaleDateString('sl-SI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    el.textContent = formatted;
  });
});



// Removes images from the post and slideshow if their `data-skip` attribute is not within the allowed range.
document.addEventListener("DOMContentLoaded", function() {
        const elements = [
            ...document.querySelectorAll('td.tr-caption'),
            ...document.querySelectorAll('.separator')
        ];

        const PhotosRange = localStorage.getItem('photosSliderValue') || initPhotos; // Default value if not set

        // Function to process the `data-skip` attribute and check the range
        function isWithinRange(dataSkip) {
            // Assign a default value to `data-skip` if undefined or "NA"
            if (dataSkip === "NA" || dataSkip === null || dataSkip === undefined) {
                dataSkip = "3"; // Assign a default value
            }

            // Replace placeholders in the `data-skip` values
            dataSkip = dataSkip
                .replace(/best/g, "0")
                .replace(/cover/g, "-1")
                .replace(/peak/g, "5"); // Remove all peaks to be displayed because of high priority

            // Split `data-skip` values by semicolon
            const dataSkipValues = dataSkip.split(";");

            // Convert values to numbers and filter out invalid ones
            const numericValues = dataSkipValues
                .map(value => parseFloat(value))
                .filter(value => !isNaN(value));

            // Find the smallest number
            const minValue = Math.min(...numericValues);

            // // Exclude if the only tag is `-2` (peak)
            // if (minValue === -2 && dataSkipValues.length === 1) {
            //     return false;
            // }

            // Check if the smallest number is greater than PhotosRange
            return minValue > PhotosRange ? 1 : 0;
        }

        // Iterate over all elements and process them
        elements.forEach(element => {
            const isCaption = element.classList.contains('tr-caption');
            const isSeparator = element.classList.contains('separator');

            if (isCaption) {
                // Process caption elements
                const title = element.textContent.trim();
                const link = element.closest('tr').previousElementSibling?.querySelector('a[href*="blogger.googleusercontent.com"]');
                if (link) {
                    link.setAttribute('data-title', title);
                }

                const img = element.closest('tr').previousElementSibling?.querySelector('a img');
                if (img && isWithinRange(img.getAttribute('data-skip'))) {
                    const table = element.closest('table');
                    if (table) table.remove();
                }
            } else if (isSeparator) {
                // Process separator elements
                const img = element.querySelector('img');
                const text = element.textContent.trim();

                if (img && isWithinRange(img.getAttribute('data-skip'))) {
                    element.remove();
                } else if (!img && !text) {
                    // Remove separator if no content and no images
                    element.remove();
      }
    }
  });
});



/* For togling label navigation bar */
document.addEventListener("DOMContentLoaded", function() {
  const showMoreBtn = document.querySelector(".show-more");
  const showLessBtn = document.querySelector(".show-less");
  const remainingItems = document.querySelector(".remaining-items");

  if (showMoreBtn && showLessBtn && remainingItems) {
    showMoreBtn.addEventListener("click", function() {
      remainingItems.classList.remove("hidden");
      showMoreBtn.classList.add("hidden");
      showLessBtn.classList.remove("hidden");
    });

    showLessBtn.addEventListener("click", function() {
      remainingItems.classList.add("hidden");
      showMoreBtn.classList.remove("hidden");
      showLessBtn.classList.add("hidden");
    });
  }
});

