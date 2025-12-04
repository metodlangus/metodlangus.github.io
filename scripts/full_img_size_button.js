//<![CDATA[

// Add an event listener for when the DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Get all images within blog post bodies
  var images = document.querySelectorAll('.post-body img');

  // Loop through each image
  images.forEach(function(image) {
    // Check if the image has a parent <a> tag
    if (image.parentNode.tagName.toLowerCase() === 'a') {
      // Check if the data-lightbox attribute is already defined
      if (!image.parentNode.hasAttribute('data-lightbox')) {
        // Add the data-lightbox="1" attribute to the parent <a> tag
        image.parentNode.setAttribute('data-lightbox', 'Galery');
      }
    }
  });
});


var windowWidth = window.innerWidth;
var windowHeight = window.innerHeight;
var topPosition = 5;

// function checkWindowSize() {
//     var newWindowWidth = window.innerWidth;
//     var newWindowHeight = window.innerHeight;
    
//     if (((windowWidth / windowHeight) > 1) ^ ((newWindowWidth / newWindowHeight) > 1)) {
//         // If window size has changed, reload the page
//         location.reload();
//     }
// }

// // Add event listener for window resize
// window.addEventListener('resize', checkWindowSize);

// Check if windowWidth is less than windowHeight
if (windowWidth < windowHeight) {
    topPosition = (windowHeight - windowWidth/1.33) / 2;
}

lightbox.option({
    'positionFromTop': topPosition,
    'wrapAround': true,
    'imageFadeDuration': 200,
	'resizeDuration': 400,
});


window.addEventListener('DOMContentLoaded', function() {
    function addButtonToImagesInLightbox() {
        var images = document.querySelectorAll('.lb-image');
        
        images.forEach(function(img) {
            if (!img.parentNode.querySelector('.lightbox-button')) {
                var lightboxContainer = img.closest('.lb-container');
                var btn = document.createElement('button');
                btn.className = 'lightbox-button';
				btn.title = 'Open original size';
                btn.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 5px; background-color: rgba(0, 0, 0, 0.3); color: #fff; border: none; border-radius: 5px; cursor: pointer; z-index: 1000000;';
                var iconImg = document.createElement('img');
                iconImg.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjNZz81Qo6JF_YRLPDKgfuUSmnMLMXdIQtiGTBwyEmYKF549fHKNqwYrEw1UJWCt9wokFNXTNmIOV4qgnelDJ6fyqLYLH3sttGacsMkNkhJ01elKCrNP7ec0AF9n-r9Tqm9I_9QB5mm2nYHElB7be9mBYCZbZTIRtk8Or-TNVL24_LxIXfE1IWo7d8Rv2SL/s512/full-size.png';
                iconImg.style.cssText = 'width: 15px; height: 15px; filter: invert(100%); display: block;';
                btn.appendChild(iconImg);
                lightboxContainer.appendChild(btn);
                
                btn.addEventListener('click', function() {
                    var imgSrc = img.src;
                    imgSrc = imgSrc.replace(/\/s\d+\//, '/s0/');
                    window.open(imgSrc, '_blank');
                });
            }
        });
    }
    
    var checkInterval = setInterval(function() {
        if (document.querySelector('.lb-image')) {
            addButtonToImagesInLightbox();
            clearInterval(checkInterval);
        }
    }, 500);
});

//]]>
