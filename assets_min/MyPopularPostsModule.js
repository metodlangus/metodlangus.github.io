const PopularPostsModule=(()=>{let c={WindowBaseUrl:"",maxPosts:3},i,$;async function P(t){const e=await fetch(t);if(!e.ok)throw new Error(`Failed to load ${t}`);return await e.json()}function g(t){return t.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ß/g,"ss").toLowerCase().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"")}function p(t){let e;try{return e=new URL(t,window.location.origin),e.pathname.endsWith("/index.html")&&(e.pathname=e.pathname.replace(/\/index\.html$/,"/")),e.pathname}catch{let a=t.replace(/\/index\.html$/,"/");return a.startsWith("/")||(a="/"+a),a.endsWith("/")||(a+="/"),a}}function w(t){return new Date(t).toLocaleDateString("sl-SI",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}function y(){let t=window.location.pathname;const e="/metodlangus.github.io";return t.startsWith(e)&&(t=t.slice(e.length)),t.endsWith("/index.html")&&(t=t.replace(/\/index\.html$/,"/")),t.startsWith("/")||(t="/"+t),t.endsWith("/")||(t+="/"),t}function v(t,e){const a=t.title?.$t||`untitled-${e}`,u=t.link.find(n=>n.rel==="self")?.href.split("/").pop().replace(".json",""),h=t.link.find(n=>n.rel==="alternate")?.href||"#",o=p(h),f=w(t.published?.$t||""),l=t.media$thumbnail?.url?.replace("/s72-c","/s600-rw")||"",m=t.category||[],s=m.find(n=>n.term.startsWith("1. "))?.term.slice(3),r=m.find(n=>n.term.startsWith("6. "))?.term.slice(3),d=s?`${i}/search/labels/${g(s)}/`:"",b=r?`${i}/search/labels/${g(r)}/`:"";return`
<div class="photo-entry" data-page="1">
  <article class="my-post-outer-container">
    <div class="post">

      ${r?`
      <div class="my-tag-container">
        <a href="${b}" class="my-labels label-six">${r}</a>
      </div>`:""}

      <a href="${o}" class="my-post-link" aria-label="${a}">
        <div class="my-title-container">
          ${s?`<a href="${d}" class="my-labels">${s}</a>`:""}
          <h2 class="my-title">${a}</h2>
        </div>
      </a>

      <div class="my-meta-data">
        <div class="author-date">Dne ${f}</div>
      </div>

      <div class="my-thumbnail" id="post-snippet-${u}">
        <div class="my-snippet-thumbnail">
          ${l?`<img src="${l}" alt="${a}">`:""}
        </div>
      </div>

      <a href="${o}" aria-label="${a}"></a>

    </div>
  </article>
</div>`}async function x(){const t=document.getElementById("popularPostsContainer");if(!t){console.warn("PopularPostsModule: #popularPostsContainer not found");return}try{const e=await P(`${i}/data/popular-posts.json`),u=(await P(`${i}/data/all-posts.json`)).feed?.entry||[];document.getElementById("popularPostsTitle")||t.insertAdjacentHTML("beforebegin",'<h2 id="popularPostsTitle" class="title">Popularne objave</h2>'),t.innerHTML="";const h=y();let o=0;for(const f of e){if(o>=$)break;const l=p(f.path);if(l.replace(/\/$/,"")===h.replace(/\/$/,""))continue;const s=u.find(r=>{const d=r.link.find(k=>k.rel==="alternate");return d?p(d.href)===l:!1});s&&(t.insertAdjacentHTML("beforeend",v(s,o)),o++)}}catch(e){console.error("PopularPostsModule error:",e),t.innerHTML='<p class="err">Napaka pri nalaganju popularnih objav.</p>'}}function W(t={}){if(c={...c,...t},i=c.WindowBaseUrl,$=c.maxPosts,!i){console.warn("PopularPostsModule: WindowBaseUrl is missing");return}x()}return{init:W}})();window.PopularPostsModule=PopularPostsModule;
