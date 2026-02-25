const PopularPostsModule = (() => {

  let config = {
    WindowBaseUrl: '',
    maxPosts: 3
  };

  let WindowBaseUrl, maxPosts;

  /* ---------------------------
     Helpers
  ---------------------------- */

  async function fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load ${url}`);
    return await response.json();
  }

  function slugify(text) {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  function stripIndexHtml(fullUrl) {
    let url;
    try {
      url = new URL(fullUrl, window.location.origin);
      if (url.pathname.endsWith('/index.html')) {
        url.pathname = url.pathname.replace(/\/index\.html$/, '/');
      }
      return url.pathname;
    } catch {
      // fallback for relative paths
      let path = fullUrl.replace(/\/index\.html$/, '/');
      if (!path.startsWith('/')) path = '/' + path;
      if (!path.endsWith('/')) path += '/';
      return path;
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('sl-SI', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function getCurrentPostPath() {
    let path = window.location.pathname;

    // remove site prefix if present
    const sitePrefix = '/metodlangus.github.io';
    if (path.startsWith(sitePrefix)) {
      path = path.slice(sitePrefix.length);
    }

    // normalize index.html
    if (path.endsWith('/index.html')) path = path.replace(/\/index\.html$/, '/');

    // ensure leading and trailing slash
    if (!path.startsWith('/')) path = '/' + path;
    if (!path.endsWith('/')) path += '/';

    console.log('[DEBUG] Current page normalized path:', path);
    return path;
  }

  /* ---------------------------
     Render single post card
  ---------------------------- */

  function renderPost(entry, index) {
    const title = entry.title?.$t || `untitled-${index}`;
    const postID = entry.link
      .find(l => l.rel === 'self')
      ?.href.split('/').pop()
      .replace('.json', '');

    const rawLink = entry.link.find(l => l.rel === 'alternate')?.href || '#';
    const alternateLink = stripIndexHtml(rawLink);

    const published = formatDate(entry.published?.$t || '');

    const thumbnail =
      entry.media$thumbnail?.url?.replace('/s72-c', '/s600-rw') || '';

    const categories = entry.category || [];
    const labelOne = categories.find(c => c.term.startsWith('1. '))?.term.slice(3);
    const labelSix = categories.find(c => c.term.startsWith('6. '))?.term.slice(3);

    const labelOneLink = labelOne
      ? `${WindowBaseUrl}/search/labels/${slugify(labelOne)}/`
      : '';

    const labelSixLink = labelSix
      ? `${WindowBaseUrl}/search/labels/${slugify(labelSix)}/`
      : '';

    return `
<div class="photo-entry" data-page="1">
  <article class="my-post-outer-container">
    <div class="post">

      ${labelSix ? `
      <div class="my-tag-container">
        <a href="${labelSixLink}" class="my-labels label-six">${labelSix}</a>
      </div>` : ''}

      <a href="${alternateLink}" class="my-post-link" aria-label="${title}">
        <div class="my-title-container">
          ${labelOne ? `<a href="${labelOneLink}" class="my-labels">${labelOne}</a>` : ''}
          <h2 class="my-title">${title}</h2>
        </div>
      </a>

      <div class="my-meta-data">
        <div class="author-date">Dne ${published}</div>
      </div>

      <div class="my-thumbnail" id="post-snippet-${postID}">
        <div class="my-snippet-thumbnail">
          ${thumbnail ? `<img src="${thumbnail}" alt="${title}">` : ''}
        </div>
      </div>

      <a href="${alternateLink}" aria-label="${title}"></a>

    </div>
  </article>
</div>`;
  }

  /* ---------------------------
     Main logic
  ---------------------------- */

  async function main() {
    const container = document.getElementById('popularPostsContainer');
    if (!container) {
      console.warn('PopularPostsModule: #popularPostsContainer not found');
      return;
    }

    try {
      const popularPosts = await fetchJSON(`${WindowBaseUrl}/data/popular-posts.json`);
      const allPostsData = await fetchJSON(`${WindowBaseUrl}/data/all-posts.json`);
      const entries = allPostsData.feed?.entry || [];

      if (!document.getElementById('popularPostsTitle')) {
        container.insertAdjacentHTML(
          'beforebegin',
          '<h2 id="popularPostsTitle" class="title">Popularne objave</h2>'
        );
      }

      container.innerHTML = '';

      const currentPath = getCurrentPostPath();
      let renderedCount = 0;

      for (const popPost of popularPosts) {
        if (renderedCount >= maxPosts) break;

        const popPath = stripIndexHtml(popPost.path);
        console.log('[DEBUG] Popular post path:', popPath);

        const isCurrent = popPath.replace(/\/$/, '') === currentPath.replace(/\/$/, '');
        console.log('[DEBUG] Compare current vs popular:', { currentPath, popPath, isCurrent });

        if (isCurrent) {
          console.log('[DEBUG] Skipping current post:', popPath);
          continue;
        }

        const entry = entries.find(e => {
          const alt = e.link.find(l => l.rel === 'alternate');
          if (!alt) return false;
          const entryPath = stripIndexHtml(alt.href);
          const match = entryPath === popPath;
          console.log('[DEBUG] Entry check:', { entryPath, popPath, match });
          return match;
        });

        if (!entry) {
          console.log('[DEBUG] No matching entry found for:', popPath);
          continue;
        }

        container.insertAdjacentHTML('beforeend', renderPost(entry, renderedCount));
        renderedCount++;
      }

    } catch (err) {
      console.error('PopularPostsModule error:', err);
      container.innerHTML = '<p class="err">Napaka pri nalaganju popularnih objav.</p>';
    }
  }

  /* ---------------------------
     Public API
  ---------------------------- */

  function init(userConfig = {}) {
    config = { ...config, ...userConfig };
    WindowBaseUrl = config.WindowBaseUrl;
    maxPosts = config.maxPosts;

    if (!WindowBaseUrl) {
      console.warn('PopularPostsModule: WindowBaseUrl is missing');
      return;
    }

    main();
  }

  return { init };

})();

window.PopularPostsModule = PopularPostsModule;