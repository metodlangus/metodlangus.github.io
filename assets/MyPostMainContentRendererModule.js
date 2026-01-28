// MyPostMainContentRendererModule
const MyPostMainContentRendererModule = (function(window) {

    let WindowBaseUrl = '';
    let isBlogger = true;

    const defaults = {
        WindowBaseUrl: '',
        isBlogger: true,
        postId: null
    };

    function fetchPostById(postId, callback) {
        let apiUrl = '';

        if (isBlogger) {
            apiUrl = `${WindowBaseUrl}/feeds/posts/default/${postId}?alt=json`;
        } else {
            apiUrl = `${WindowBaseUrl}/data/posts/${postId}.json`;
        }

        fetch(apiUrl)
            .then(res => res.json())
            .then(data => {
                if (data.entry) callback(data.entry);
                else callback(null);
            })
            .catch(err => {
                console.error('Post fetch failed:', err);
                callback(null);
            });
    }

    function renderPostContent(postId) {
        const out = document.getElementById('rendered-post-' + postId);
        if (!out) return;

        fetchPostById(postId, function(post) {
            if (!post || !post.content?.$t) {
                console.error('Post content missing for ID:', postId);
                return;
            }

            const parser = new DOMParser();
            const doc = parser.parseFromString(post.content.$t, 'text/html');

            // Replace <my-post> containers
            doc.querySelectorAll('my-post').forEach(el => {
                const slug = el.getAttribute('slug') || '';
                const div = document.createElement('div');
                div.className = 'post-container';
                const a = document.createElement('a');
                a.href = '/search/labels/' + slug + '/';
                a.innerHTML = el.innerHTML;
                div.appendChild(a);
                el.replaceWith(div);
            });

            // Wrap images for lightbox
            doc.querySelectorAll('img').forEach(img => {
                if (img.closest('a')) return;
                const a = document.createElement('a');
                a.href = img.src;
                a.setAttribute('data-lightbox', 'post');
                img.parentNode.insertBefore(a, img);
                a.appendChild(img);
            });

            // Remove hidden leading blocks
            while (doc.body.firstElementChild && doc.body.firstElementChild.classList.contains('visually-hidden')) {
                doc.body.firstElementChild.remove();
            }

            // Update meta description
            const summary = doc.querySelector('summary');
            if (summary) {
                const meta = document.querySelector('meta[name="description"]');
                if (meta) meta.content = summary.textContent.trim();
            }

            // Set og:image
            const firstImg = doc.querySelector('img');
            if (firstImg) {
                let og = document.querySelector('meta[property="og:image"]');
                if (!og) {
                    og = document.createElement('meta');
                    og.setAttribute('property', 'og:image');
                    document.head.appendChild(og);
                }
                og.setAttribute('content', firstImg.src);
            }

            // Inject post HTML
            out.innerHTML = doc.body.innerHTML;
        });
    }

    function init(options = {}) {
        const settings = { ...defaults, ...options };
        WindowBaseUrl = settings.WindowBaseUrl;
        isBlogger = settings.isBlogger;
        const postId = settings.postId;

        if (!postId) {
            console.error('No postId provided to MyPostMainContentRendererModule');
            return;
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => renderPostContent(postId));
        } else {
            renderPostContent(postId);
        }
    }

    window.MyPostMainContentRendererModule = { init };

})(window);