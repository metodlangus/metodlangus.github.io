document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".post-date").forEach(function(n){const c=new Date(n.dataset.date);if(isNaN(c.getTime()))return;const i=c.toLocaleDateString("sl-SI",{weekday:"long",day:"numeric",month:"long",year:"numeric"});n.textContent=i})}),document.addEventListener("DOMContentLoaded",function(){const n=[...document.querySelectorAll("td.tr-caption"),...document.querySelectorAll(".separator")],c=localStorage.getItem("photosSliderValue")||(typeof initPhotos<"u"?initPhotos:0);function i(e){(e==="NA"||e===null||e===void 0)&&(e="3"),e=e.replace(/best/g,"0").replace(/cover/g,"-1").replace(/peak/g,"5");const r=e.split(";").map(s=>parseFloat(s)).filter(s=>!isNaN(s));return r.length?Math.min(...r)>c?1:0:!1}n.forEach(e=>{const o=e.classList.contains("tr-caption"),r=e.classList.contains("separator");if(o){const a=e.textContent.trim(),s=e.closest("tr");if(!s)return;const t=s.previousElementSibling;if(!t)return;const l=t.querySelector('a[href*="blogger.googleusercontent.com"]');l&&l.setAttribute("data-title",a);const u=t.querySelector("a img");if(u&&i(u.getAttribute("data-skip"))){const d=e.closest("table");d&&d.remove()}}else if(r){const a=e.querySelector("img"),s=e.textContent.trim();(a&&i(a.getAttribute("data-skip"))||!a&&!s)&&e.remove()}})}),document.addEventListener("DOMContentLoaded",function(){const n=document.querySelector(".show-more"),c=document.querySelector(".show-less"),i=document.querySelector(".remaining-items"),o=localStorage.getItem("labelsExpanded")==="true";n&&c&&i&&(o?(i.classList.remove("hidden"),n.classList.add("hidden"),c.classList.remove("hidden")):(i.classList.add("hidden"),n.classList.remove("hidden"),c.classList.add("hidden")),n.addEventListener("click",function(){i.classList.remove("hidden"),n.classList.add("hidden"),c.classList.remove("hidden"),localStorage.setItem("labelsExpanded","true")}),c.addEventListener("click",function(){i.classList.add("hidden"),n.classList.remove("hidden"),c.classList.add("hidden"),localStorage.setItem("labelsExpanded","false")}))});let posts=[];typeof WindowBaseUrl<"u"&&Promise.all([fetch(`${WindowBaseUrl}/data/all-posts.json`).then(n=>n.json()),typeof isRelive<"u"?fetch(`${WindowBaseUrl}/data/all-relive-posts.json`).then(n=>n.json()):Promise.resolve({feed:{entry:[]}})]).then(([n,c])=>{const i=n.feed?.entry||[],e=c.feed?.entry||[];posts=[...i,...e].map((r,a)=>{const s=r.title?.$t||`untitled-${a}`,t=r.content?.$t||"",u=((r.link||[]).find(h=>h.rel==="alternate"&&h.type==="text/html")?.href||"#").replace(/\/index\.html$/,"/"),d=r.media$thumbnail?.url||"";return{title:s,content:t,link:u,thumbnail:d}})}).catch(n=>{console.error("Error loading feeds:",n)}),document.addEventListener("DOMContentLoaded",function(){const n=document.getElementById("searchToggle"),c=document.getElementById("searchContainer"),i=document.getElementById("searchClose"),e=document.getElementById("searchBox"),o=document.getElementById("searchResults");!n||!c||!i||!e||!o||(n.addEventListener("click",()=>{c.classList.toggle("visible")?e.focus():closeSearchOverlay()}),(function(){const a=Array.from(document.querySelectorAll("details.month-group, details.year-group"));a.length!==0&&(a.forEach(s=>{s.addEventListener("toggle",()=>{s.open&&a.forEach(t=>{t!==s&&(t.open=!1)})})}),a.forEach(s=>{s.querySelectorAll&&s.querySelectorAll("a").forEach(t=>{t.addEventListener("click",function(l){const u=t.closest("details");if(!u)return;a.forEach(h=>{h!==u&&(h.open=!1)}),u.open=!0;const d=u.querySelectorAll("details.month-group");if(d&&d.length>0){const h=d[d.length-1];a.forEach(m=>{m.matches&&m.matches("details.month-group")&&m!==h&&(m.open=!1)}),h.open=!0}})})}))})(),i.addEventListener("click",()=>{closeSearchOverlay()}),e.addEventListener("input",function(){const r=this.value.toLowerCase();if(o.innerHTML="",!r){o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible");return}const a=posts.filter(s=>s.title.toLowerCase().includes(r)||s.content.toLowerCase().includes(r));if(a.length>0){let s=`
        <button class="close-button" onclick="closeSearchOverlay()">×</button>
        <h1>Prikaz objav, ki vsebujejo: ${r}</h1>
        <div class="search-posts-container">`;a.forEach(t=>{s+=`
          <div class="post-container">
            <a href="${t.link}" class="image-link">
              <div class="image-wrapper">
                ${t.thumbnail?`<img src="${t.thumbnail.replace(/\/s\d+-c/,"/s300")}" alt="Thumbnail for ${t.title}" class="post-thumb">`:""}
                <h3 class="overlay-title">${t.title}</h3>
              </div>
            </a>
          </div>`}),s+="</div>",o.innerHTML=s,o.classList.remove("overlay-hidden"),o.classList.add("overlay-visible")}else o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible")}),window.closeSearchOverlay=function(){o.innerHTML="",o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible"),e.value="",c.classList.remove("visible")})});function toggleSidebar(){const n=document.getElementById("sidebar");n&&n.classList.toggle("visible")}document.addEventListener("DOMContentLoaded",function(){const n=document.querySelectorAll(".photo-entry"),i=Math.ceil(n.length/12),e=document.getElementById("blog-pager");let o=1;if(!e)return;function r(t){t<1||t>i||(o=t,a(o))}function a(t){n.forEach(l=>{parseInt(l.dataset.page)===t?l.classList.remove("visually-hidden"):l.classList.add("visually-hidden")}),document.querySelectorAll(`.photo-entry[data-page="${t}"] img[data-src]`).forEach(l=>{l.src=l.dataset.src,l.removeAttribute("data-src")}),s(t),window.scrollTo({top:0,behavior:"smooth"})}function s(t){if(i<=1){e.style.display="none";return}else e.style.display="flex";e.innerHTML="",e.innerHTML+=`<span class="displaypageNum">
      <a href="#" onclick="redirectpage(${t-1}); return false" ${t===1?'style="pointer-events:none;opacity:0.5;"':""}>&laquo;</a>
    </span>`,t===1?e.innerHTML+='<span class="pagecurrent">1</span>':e.innerHTML+='<span class="displaypageNum"><a href="#" onclick="redirectpage(1); return false">1</a></span>',t>3&&(e.innerHTML+='<span class="showpage ellipsis">...</span>');for(let l=t-1;l<=t+1;l++)l>1&&l<i&&(l===t?e.innerHTML+=`<span class="pagecurrent">${l}</span>`:e.innerHTML+=`<span class="displaypageNum"><a href="#" onclick="redirectpage(${l}); return false">${l}</a></span>`);t<i-2&&(e.innerHTML+='<span class="showpage ellipsis">...</span>'),t===i?e.innerHTML+=`<span class="pagecurrent">${i}</span>`:e.innerHTML+=`<span class="displaypageNum"><a href="#" onclick="redirectpage(${i}); return false">${i}</a></span>`,e.innerHTML+=`<span class="displaypageNum">
      <a href="#" onclick="redirectpage(${t+1}); return false" ${t===i?'style="pointer-events:none;opacity:0.5;"':""}>&raquo;</a>
    </span>`}window.redirectpage=r,a(o)});const btn=document.getElementById("backToTop");btn&&(window.addEventListener("scroll",()=>{btn.style.display=window.scrollY>400?"block":"none"}),btn.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})})),document.addEventListener("DOMContentLoaded",function(){if(window.self!==window.top)return;const n={birthday:"09-30",daysAfter:30,testMode:!1,rememberDismissal:!0},c=window.location.hostname.toLowerCase(),i=window.location.pathname.replace(/\/+$/,""),e=c==="matejlangus.github.io"&&i==="/map",o=c==="127.0.0.1"&&window.location.port==="5500"&&i==="/matejlangus.github.io/map";if(!e&&!o)return;const r=["https://metodlangus.github.io"];o&&r.push(window.location.origin);function a(){const f=n.birthday.split("-");if(f.length!==2)return null;const p=parseInt(f[0],10),y=parseInt(f[1],10);if(!Number.isInteger(p)||!Number.isInteger(y)||p<1||p>12||y<1||y>31)return null;const g=new Date;g.setHours(0,0,0,0);const b=new Date(g.getFullYear(),p-1,y);if(b.setHours(0,0,0,0),g<b)return null;const L=Math.floor((g-b)/864e5);return L>=0&&L<=n.daysAfter?L:null}const s=n.testMode?0:a();if(!n.testMode&&s===null)return;const t="/ostalo/objava/",l=e?`https://metodlangus.github.io${t}?birthday=${n.birthday}&days=${s}`:`${window.location.origin}${t}?birthday=${n.birthday}&days=${s}`,u="birthdaySurpriseDismissed",d=new Date,h=n.birthday+"-"+d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");if(n.rememberDismissal&&sessionStorage.getItem(u)===h)return;const m=document.createElement("div");m.id="birthday-surprise-overlay",m.innerHTML=`
    <iframe
      src="${l}"
      title="Birthday surprise"
      allow="autoplay; fullscreen"
    ></iframe>
  `;const v=document.createElement("style");v.textContent=`
    #birthday-surprise-overlay {
      position:fixed;
      inset:0;
      z-index:9990;
      width:100vw;
      height:100vh;
      margin:0;
      padding:0;
      background:#000;
      opacity:0;
      transition:opacity .45s ease;
    }

    #birthday-surprise-overlay.birthday-visible {
      opacity:1;
    }

    #birthday-surprise-overlay iframe {
      position:fixed;
      inset:0;
      display:block;
      width:100vw;
      height:100vh;
      border:0;
      margin:0;
      padding:0;
      background:transparent;
    }

    @media (prefers-reduced-motion:reduce) {
      #birthday-surprise-overlay {
        transition:none;
      }
    }
  `,document.head.appendChild(v),document.body.appendChild(m);function w(){n.rememberDismissal&&sessionStorage.setItem(u,h),m.classList.remove("birthday-visible"),setTimeout(function(){m.remove(),v.remove(),window.removeEventListener("message",E),document.removeEventListener("keydown",k)},500)}function E(f){r.includes(f.origin)&&(!f.data||f.data.type!=="birthday-close"||w())}window.addEventListener("message",E);function k(f){f.key==="Escape"&&w()}document.addEventListener("keydown",k),requestAnimationFrame(function(){requestAnimationFrame(function(){m.classList.add("birthday-visible")})})});async function getRandomPost(){try{const[n]=await Promise.all([fetch("https://metodlangus.github.io/data/all-posts.json")]),i=[...(await n.json()).feed?.entry||[]];if(!i||i.length===0)throw new Error("No posts found");const e=[];for(const r of i){const s=(r.link||[]).find(t=>t.rel==="alternate"&&t.type==="text/html");s&&s.href&&e.push(s.href.replace(/\/index\.html$/,"/"))}if(e.length===0)throw new Error("No valid post links found");const o=e[Math.floor(Math.random()*e.length)];window.location.href=o}catch(n){console.error("Error fetching posts:",n),window.location.href="https://metodlangus.github.io/"}}
