// MyPostContainerModule
const MyPostContainerModule = (function() {
    let postDetails = [];

    const defaults = {
        WindowBaseUrl: '',
        isBlogger: true
    };

    function extractAndInsertPosts() {
        document.querySelectorAll('script').forEach(script => {
            var scriptContent = script.innerText;

            // Improved regex to correctly capture post titles inside `, ', or "
            var titleMatches = scriptContent.matchAll(/var\s+(postTitle\d+)\s*=\s*([`'"])(.*?)\2/g);

            for (let match of titleMatches) {
                var titleValue = match[3].trim(); // Ensure full title is captured
                var displayModeMatch = scriptContent.match(new RegExp('var\\s+displayMode' + match[1].replace(/\D/g, '') + '\\s*=\\s*([`\'"])(.*?)\\1'));
                var displayModeValue = displayModeMatch ? displayModeMatch[2].trim() : ""; // Default to empty if not found

                if (titleValue) {
                    postDetails.push({ title: titleValue, displayMode: displayModeValue });
                    console.log("Extracted Title:", titleValue, "| Display Mode:", displayModeValue);
                    insertPostContainer(titleValue, displayModeValue, script);
                }
            }
        });

        // Retrieve post by title or ID using JSON Feeds
        function getPostByTitle(postTitle, callback) {
            let apiUrl;
            const isNumeric = /^\d+$/.test(postTitle); // Check if it's purely numeric

            if (isBlogger) {
                if (isNumeric) {
                    // If postTitle is a number, treat it as a Post ID
                    apiUrl = `${WindowBaseUrl}/feeds/posts/default/${postTitle}?alt=json`;
                } else {
                    // Otherwise, search by title
                    apiUrl = `${WindowBaseUrl}/feeds/posts/default?q=${encodeURIComponent(postTitle)}&alt=json`;
                }
            } else {
                if (isNumeric) {
                    // If postTitle is a number, treat it as a Post ID
                    apiUrl = `${WindowBaseUrl}/data/posts/${postTitle}.json`;
                } else {
                    // Otherwise, search by title
                    apiUrl = `${WindowBaseUrl}/data/posts/${encodeURIComponent(postTitle)}.json`;
                }
            }

            fetch(apiUrl)
                .then(response => response.json())
                .then(data => {
                    if (isNumeric) {
                        // Fetching by ID (may return `entry` directly, not inside `feed`)
                        if (data.entry) {
                            callback(data.entry); // Return the single post
                        } else {
                            console.error("No post found for ID:", postTitle);
                            callback(null);
                        }
                    } else {
                        // Fetching by Title (must search inside `feed.entry`)
                        if (data.feed?.entry) {
                            let matchingEntry = data.feed.entry.find(entry => entry.title.$t === postTitle);
                            if (matchingEntry) {
                                callback(matchingEntry);
                            } else {
                                console.error("No post found for title:", postTitle);
                                callback(null);
                            }
                        } else {
                            console.error("No post entries found in feed.");
                            callback(null);
                        }
                    }
                })
                .catch(error => {
                    console.error("Error fetching post:", error);
                    callback(null);
                });
        }

        function insertPostContainer(postTitle, displayMode, scriptTag) {
          getPostByTitle(postTitle, function(post) {
            if (post) {
              var outerContainer = document.createElement('article');
              outerContainer.classList.add('my-post-outer-container');

              var postContainer = document.createElement('div');
              postContainer.classList.add('post');

              var postLink = document.createElement('a');
              postLink.classList.add('my-post-link');

              var publishedDate = new Date(post.published.$t);

              // Extract year and month
              var year = publishedDate.getUTCFullYear().toString();
              var month = (publishedDate.getUTCMonth() + 1).toString().padStart(2, '0');

              // Find the 'alternate' link from the feed
              var alternateLink = post.link.find(link => link.rel === 'alternate' && link.type === 'text/html');

              if (alternateLink && alternateLink.href) {
                // Replace domain part with your local WindowBaseUrl and adjust path to /data/posts/...
                const urlParts = new URL(alternateLink.href);
                const path = urlParts.pathname.replace(/^\/posts/, '/posts');
                var fullUrl = `${WindowBaseUrl}${path}`;
              } else {
                console.error("Alternate link not found in post.");
                return; // Exit early
              }

              postLink.href = fullUrl;


              // Set a meaningful aria-label for the link
              postLink.setAttribute('aria-label', `${post.title.$t}`);

              var titleContainer = document.createElement('div');
              titleContainer.classList.add('my-title-container');
              
              // Check if post.category exists and has elements
              if (post.category?.length > 0) {
                // Find a category starting with "1. "
                var titleLabel = post.category.find(category => category.term.startsWith("1. "));
                if (titleLabel) {
                  // Remove the prefix from the term
                  var cleanTerm = titleLabel.term.replace(/^\d+\.\s*/, '');

                  // Create the new label for "1. " category
                  var labelOne = document.createElement('a');
                  labelOne.classList.add('my-labels');
                  labelOne.href = WindowBaseUrl + '/search/labels/' + slugify(cleanTerm) + '/';
                  labelOne.textContent = cleanTerm;

                  // Append the label to the tag container
                  titleContainer.appendChild(labelOne);
                }
              }

              var titleTitle = document.createElement('h2');
              titleTitle.classList.add('my-title');
              titleTitle.textContent = post.title.$t;

              var metaDataContainer = document.createElement('div');
              metaDataContainer.classList.add('my-meta-data');

              var authorDate = document.createElement('div');
              authorDate.classList.add('author-date');
              // var publishedDate = new Date(post.published.$t);
              var formattedDate = publishedDate.toLocaleDateString('sl-SI', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              authorDate.textContent = /*'Objavil ' + author +*/ 'Dne ' + formattedDate;

              var thumbnailContainer = document.createElement('div');
              thumbnailContainer.classList.add('my-thumbnail');
              thumbnailContainer.id = 'post-snippet-' + post.id.$t;

              var thumbnail = document.createElement('div');
              thumbnail.classList.add('my-snippet-thumbnail');

            var thumbnailImg = document.createElement('img');
            thumbnailImg.alt = `Thumbnail image for post: ${post.title.$t}`;  // Descriptive alt text
            // Use WebP format (-rw) and resize image to s800 for better performance and compatibility
            thumbnailImg.src = post.media$thumbnail.url.replace(/\/s\d+(?:-w\d+-h\d+)?-c\//, '/s600-rw/');
              var linkElement = document.createElement('a');
              linkElement.href  = fullUrl;
              
              // Set aria-label for the link
              linkElement.setAttribute('aria-label', `${post.title.$t}`);
              
              // Check if post.category exists and has elements
              if (post.category?.length > 0) {
                // Check if there's a category starting with "6. "
                var sixCategory = post.category.find(category => category.term.startsWith("6. "));
                if (sixCategory) {
                  // Remove the prefix from the term
                  var cleanTerm = sixCategory.term.replace(/^\d+\.\s*/, '');

                  // Create the new tag container
                  var tagContainer = document.createElement('div');
                  tagContainer.classList.add('my-tag-container');

                  // Create the new label for "6. " category
                  var labelSix = document.createElement('a');
                  labelSix.classList.add('my-labels', 'label-six');
                  labelSix.href = WindowBaseUrl + '/search/labels/' + slugify(cleanTerm) + '';
                  labelSix.textContent = cleanTerm;

                  // Append the label to the tag container
                  tagContainer.appendChild(labelSix);

                  // Append the tag container to the post container
                  postContainer.appendChild(tagContainer);
                }
              }

              // Only add the `separator` container if displayMode is NOT 'alwaysVisible'
              if (displayMode !== 'alwaysVisible') {
                var wrapperContainer = document.createElement('div');
                wrapperContainer.classList.add('separator');
                wrapperContainer.style.display = 'none';
                wrapperContainer.appendChild(outerContainer);
                scriptTag.parentNode.insertBefore(wrapperContainer, scriptTag.nextSibling);
              } else {
                scriptTag.parentNode.insertBefore(outerContainer, scriptTag.nextSibling);
              }

              // Append all other elements
              outerContainer.appendChild(postContainer);
              postContainer.appendChild(postLink);
              postLink.appendChild(titleContainer);
              titleContainer.appendChild(titleTitle);
              postContainer.appendChild(metaDataContainer);
              metaDataContainer.appendChild(authorDate);
              postContainer.appendChild(thumbnailContainer);
              thumbnailContainer.appendChild(thumbnail);
              thumbnail.appendChild(thumbnailImg);
              postContainer.appendChild(linkElement);

              console.log(`Inserted ${displayMode} post: ${postTitle}`);
            } else {
              console.error(`No post found for title: ${postTitle}`);
            }
          });
        }

        function slugify(text) {
          return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/ß/g, 'ss')  // important to replicate python-slugify
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        }
    }


    function init(options = {}) {
        const settings = { ...defaults, ...options };
        WindowBaseUrl = settings.WindowBaseUrl;
        isBlogger = settings.isBlogger;

        // Start extracting and inserting posts
        extractAndInsertPosts();
    }

    // Expose the init function
    window.MyPostContainerModule = { init };

})(window);
