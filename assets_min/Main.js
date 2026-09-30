document.addEventListener("DOMContentLoaded",function(){document.querySelectorAll(".post-date").forEach(function(t){const l=new Date(t.dataset.date);if(isNaN(l.getTime()))return;const i=l.toLocaleDateString("sl-SI",{weekday:"long",day:"numeric",month:"long",year:"numeric"});t.textContent=i})}),document.addEventListener("DOMContentLoaded",function(){const t=[...document.querySelectorAll("td.tr-caption"),...document.querySelectorAll(".separator")],l=localStorage.getItem("photosSliderValue")||(typeof initPhotos<"u"?initPhotos:0);function i(e){(e==="NA"||e===null||e===void 0)&&(e="3"),e=e.replace(/best/g,"0").replace(/cover/g,"-1").replace(/peak/g,"5");const c=e.split(";").map(s=>parseFloat(s)).filter(s=>!isNaN(s));return c.length?Math.min(...c)>l?1:0:!1}t.forEach(e=>{const o=e.classList.contains("tr-caption"),c=e.classList.contains("separator");if(o){const a=e.textContent.trim(),s=e.closest("tr");if(!s)return;const n=s.previousElementSibling;if(!n)return;const r=n.querySelector('a[href*="blogger.googleusercontent.com"]');r&&r.setAttribute("data-title",a);const u=n.querySelector("a img");if(u&&i(u.getAttribute("data-skip"))){const h=e.closest("table");h&&h.remove()}}else if(c){const a=e.querySelector("img"),s=e.textContent.trim();(a&&i(a.getAttribute("data-skip"))||!a&&!s)&&e.remove()}})}),document.addEventListener("DOMContentLoaded",function(){const t=document.querySelector(".show-more"),l=document.querySelector(".show-less"),i=document.querySelector(".remaining-items"),o=localStorage.getItem("labelsExpanded")==="true";t&&l&&i&&(o?(i.classList.remove("hidden"),t.classList.add("hidden"),l.classList.remove("hidden")):(i.classList.add("hidden"),t.classList.remove("hidden"),l.classList.add("hidden")),t.addEventListener("click",function(){i.classList.remove("hidden"),t.classList.add("hidden"),l.classList.remove("hidden"),localStorage.setItem("labelsExpanded","true")}),l.addEventListener("click",function(){i.classList.add("hidden"),t.classList.remove("hidden"),l.classList.add("hidden"),localStorage.setItem("labelsExpanded","false")}))});let posts=[];typeof WindowBaseUrl<"u"&&Promise.all([fetch(`${WindowBaseUrl}/data/all-posts.json`).then(t=>t.json()),typeof isRelive<"u"?fetch(`${WindowBaseUrl}/data/all-relive-posts.json`).then(t=>t.json()):Promise.resolve({feed:{entry:[]}})]).then(([t,l])=>{const i=t.feed?.entry||[],e=l.feed?.entry||[];posts=[...i,...e].map((c,a)=>{const s=c.title?.$t||`untitled-${a}`,n=c.content?.$t||"",u=((c.link||[]).find(d=>d.rel==="alternate"&&d.type==="text/html")?.href||"#").replace(/\/index\.html$/,"/"),h=c.media$thumbnail?.url||"";return{title:s,content:n,link:u,thumbnail:h}})}).catch(t=>{console.error("Error loading feeds:",t)}),document.addEventListener("DOMContentLoaded",function(){const t=document.getElementById("searchToggle"),l=document.getElementById("searchContainer"),i=document.getElementById("searchClose"),e=document.getElementById("searchBox"),o=document.getElementById("searchResults");!t||!l||!i||!e||!o||(t.addEventListener("click",()=>{l.classList.toggle("visible")?e.focus():closeSearchOverlay()}),(function(){const a=Array.from(document.querySelectorAll("details.month-group, details.year-group"));a.length!==0&&(a.forEach(s=>{s.addEventListener("toggle",()=>{s.open&&a.forEach(n=>{n!==s&&(n.open=!1)})})}),a.forEach(s=>{s.querySelectorAll&&s.querySelectorAll("a").forEach(n=>{n.addEventListener("click",function(r){const u=n.closest("details");if(!u)return;a.forEach(d=>{d!==u&&(d.open=!1)}),u.open=!0;const h=u.querySelectorAll("details.month-group");if(h&&h.length>0){const d=h[h.length-1];a.forEach(m=>{m.matches&&m.matches("details.month-group")&&m!==d&&(m.open=!1)}),d.open=!0}})})}))})(),i.addEventListener("click",()=>{closeSearchOverlay()}),e.addEventListener("input",function(){const c=this.value.toLowerCase();if(o.innerHTML="",!c){o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible");return}const a=posts.filter(s=>s.title.toLowerCase().includes(c)||s.content.toLowerCase().includes(c));if(a.length>0){let s=`
        <button class="close-button" onclick="closeSearchOverlay()">×</button>
        <h1>Prikaz objav, ki vsebujejo: ${c}</h1>
        <div class="search-posts-container">`;a.forEach(n=>{s+=`
          <div class="post-container">
            <a href="${n.link}" class="image-link">
              <div class="image-wrapper">
                ${n.thumbnail?`<img src="${n.thumbnail.replace(/\/s\d+-c/,"/s300")}" alt="Thumbnail for ${n.title}" class="post-thumb">`:""}
                <h3 class="overlay-title">${n.title}</h3>
              </div>
            </a>
          </div>`}),s+="</div>",o.innerHTML=s,o.classList.remove("overlay-hidden"),o.classList.add("overlay-visible")}else o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible")}),window.closeSearchOverlay=function(){o.innerHTML="",o.classList.add("overlay-hidden"),o.classList.remove("overlay-visible"),e.value="",l.classList.remove("visible")})});function toggleSidebar(){const t=document.getElementById("sidebar");t&&t.classList.toggle("visible")}document.addEventListener("DOMContentLoaded",function(){const t=document.querySelectorAll(".photo-entry"),i=Math.ceil(t.length/12),e=document.getElementById("blog-pager");let o=1;if(!e)return;function c(n){n<1||n>i||(o=n,a(o))}function a(n){t.forEach(r=>{parseInt(r.dataset.page)===n?r.classList.remove("visually-hidden"):r.classList.add("visually-hidden")}),document.querySelectorAll(`.photo-entry[data-page="${n}"] img[data-src]`).forEach(r=>{r.src=r.dataset.src,r.removeAttribute("data-src")}),s(n),window.scrollTo({top:0,behavior:"smooth"})}function s(n){if(i<=1){e.style.display="none";return}else e.style.display="flex";e.innerHTML="",e.innerHTML+=`<span class="displaypageNum">
      <a href="#" onclick="redirectpage(${n-1}); return false" ${n===1?'style="pointer-events:none;opacity:0.5;"':""}>&laquo;</a>
    </span>`,n===1?e.innerHTML+='<span class="pagecurrent">1</span>':e.innerHTML+='<span class="displaypageNum"><a href="#" onclick="redirectpage(1); return false">1</a></span>',n>3&&(e.innerHTML+='<span class="showpage ellipsis">...</span>');for(let r=n-1;r<=n+1;r++)r>1&&r<i&&(r===n?e.innerHTML+=`<span class="pagecurrent">${r}</span>`:e.innerHTML+=`<span class="displaypageNum"><a href="#" onclick="redirectpage(${r}); return false">${r}</a></span>`);n<i-2&&(e.innerHTML+='<span class="showpage ellipsis">...</span>'),n===i?e.innerHTML+=`<span class="pagecurrent">${i}</span>`:e.innerHTML+=`<span class="displaypageNum"><a href="#" onclick="redirectpage(${i}); return false">${i}</a></span>`,e.innerHTML+=`<span class="displaypageNum">
      <a href="#" onclick="redirectpage(${n+1}); return false" ${n===i?'style="pointer-events:none;opacity:0.5;"':""}>&raquo;</a>
    </span>`}window.redirectpage=c,a(o)});const btn=document.getElementById("backToTop");btn&&(window.addEventListener("scroll",()=>{btn.style.display=window.scrollY>400?"block":"none"}),btn.addEventListener("click",()=>{window.scrollTo({top:0,behavior:"smooth"})})),document.addEventListener("DOMContentLoaded",function(){if(window.self!==window.top)return;const t={birthday:"09-30",daysAfter:30,testMode:!1,rememberDismissal:!0},l=window.location.hostname.toLowerCase(),i=l==="matejlangus.github.io",e=l==="127.0.0.1"&&window.location.port==="5500";if(!i&&!e)return;const o=["https://metodlangus.github.io"];e&&o.push(window.location.origin);function c(){const f=t.birthday.split("-");if(f.length!==2)return null;const p=parseInt(f[0],10),y=parseInt(f[1],10);if(!Number.isInteger(p)||!Number.isInteger(y)||p<1||p>12||y<1||y>31)return null;const g=new Date;g.setHours(0,0,0,0);const v=new Date(g.getFullYear(),p-1,y);if(v.setHours(0,0,0,0),g<v)return null;const b=Math.floor((g-v)/864e5);return b>=0&&b<=t.daysAfter?b:null}const a=t.testMode?0:c();if(!t.testMode&&a===null)return;const s="/ostalo/objava/",n=i?`https://metodlangus.github.io${s}?birthday=${t.birthday}&days=${a}`:`${window.location.origin}${s}?birthday=${t.birthday}&days=${a}`,r="birthdaySurpriseDismissed",u=new Date,h=t.birthday+"-"+u.getFullYear()+"-"+String(u.getMonth()+1).padStart(2,"0")+"-"+String(u.getDate()).padStart(2,"0");if(t.rememberDismissal&&sessionStorage.getItem(r)===h)return;const d=document.createElement("div");d.id="birthday-surprise-overlay",d.innerHTML=`
    <iframe
      src="${n}"
      title="Birthday surprise"
      allow="autoplay; fullscreen"
    ></iframe>
  `;const m=document.createElement("style");m.textContent=`
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
  `,document.head.appendChild(m),document.body.appendChild(d);function L(){t.rememberDismissal&&sessionStorage.setItem(r,h),d.classList.remove("birthday-visible"),setTimeout(function(){d.remove(),m.remove(),window.removeEventListener("message",w),document.removeEventListener("keydown",E)},500)}function w(f){o.includes(f.origin)&&(!f.data||f.data.type!=="birthday-close"||L())}window.addEventListener("message",w);function E(f){f.key==="Escape"&&L()}document.addEventListener("keydown",E),requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add("birthday-visible")})})});async function getRandomPost(){try{const[t]=await Promise.all([fetch("https://metodlangus.github.io/data/all-posts.json")]),i=[...(await t.json()).feed?.entry||[]];if(!i||i.length===0)throw new Error("No posts found");const e=[];for(const c of i){const s=(c.link||[]).find(n=>n.rel==="alternate"&&n.type==="text/html");s&&s.href&&e.push(s.href.replace(/\/index\.html$/,"/"))}if(e.length===0)throw new Error("No valid post links found");const o=e[Math.floor(Math.random()*e.length)];window.location.href=o}catch(t){console.error("Error fetching posts:",t),window.location.href="https://metodlangus.github.io/"}}
