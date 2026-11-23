"use strict";
(() => {
  const world = document.getElementById("horizontal-world");
  if (!world) return;
  const slides = [...world.querySelectorAll(".slide")];
  const root = document.querySelector(".site-root");
  const counter = document.getElementById("scene-counter");
  const progress = document.querySelector("#scene-progress span");
  const previous = document.getElementById("previous");
  const next = document.getElementById("next");
  const hint = document.getElementById("scroll-hint");
  const nav = [...document.querySelectorAll(".nav-link")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const year = document.getElementById("copyright-year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Photographs from Wikimedia Commons, used as true transparent-background cutouts.
  // Every filename is traceable to its individual Commons photo and license page.
  // The 2-hex-character field is Wikimedia Commons' MD5 file storage prefix.
  const PHOTO_LIBRARY = [
    ["Anag_arve1.png","71","Anagallis arvensis"],
    ["Clematis20090812_509.png","07","Clematis"],
    ["Clematis20090812_510.png","49","Clematis with leaves"],
    ["Daisy_from_below.png","1e","Daisy, underside"],
    ["Daisy.png","c1","Daisy"],
    ["Echinocactus_grusonii20051007_01.png","42","Echinocactus grusonii"],
    ["Hieracium_lachenalii20090813_153.png","62","Hieracium lachenalii"],
    ["Impatiens_parviflora20090912_108.png","39","Impatiens parviflora"],
    ["Kleines_Schneeglöcken.png","ed","Galanthus"],
    ["LiliumBulbiferumCroceumBologna.png","a0","Lilium bulbiferum"],
    ["Linum_grandiflorum20090813_006.png","0e","Linum grandiflorum"],
    ["Narcissus20090514_37.png","5b","Narcissus"],
    ["Oxalis_tetraphylla_Iron_Cross20090521_07.png","01","Oxalis tetraphylla"],
    ["Oxalis_tetraphylla_Iron_Cross20090912_191-2.png","f5","Oxalis tetraphylla"],
    ["Oxalis_tetraphylla_Iron_Cross20090912_191.png","99","Oxalis tetraphylla"],
    ["Tulipa_sprengeri_FotoTakkk_Hungary_PNG.png","05","Tulipa sprengeri"],
    ["Typhonium_venosum_002.png","0f","Typhonium venosum"],
    ["Zantedeschia_aethiopica_002.png","d1","Zantedeschia aethiopica"],
    ["Cactus_flower_extracted.png","fd","Cactus flower"],
    ["Trifolium_repens_macro_flower_cutout.png","e6","Trifolium repens"],
    ["Yellow_Flower_Edited.png","f0","Yellow flower"],
    ["Blue_Flower_Transparent_Background.png","fc","Color-adjusted flower photograph"],
    ["Rose20050727_19.png","36","Rosa"],
    ["Rose20090913_36.png","8b","Rosa"],
    ["Extracted_pink_rose.png","c3","Pink rose"],
    ["YosriDec04MawarKampung1_Extracted.png","d7","Rose"],
    ["A_sunflower-Edited.png","b5","Sunflower"],
    ["Sunflower_Metalhead64_edited.png","e0","Sunflower"],
    ["Sunflower_with_black_seeds.png","fb","Sunflower"],
    ["SunflowerIMG_2257_WP2.png","89","Sunflower"]
  ];
  // Commons thumbnails preserve existing transparency. Reusing URLs shares browser cache.
  function photoUrl(entry) {
    const file = encodeURIComponent(entry[0]).replace(/%2F/g,"/");
    const h = entry[1];
    const size = entry[0] === "YosriDec04MawarKampung1_Extracted.png" ? 250 : 330;
    return "https://thumb.wikimedia.org/wikipedia/commons/thumb/"+h[0]+"/"+h+"/"+file+"/"+size+"px-"+file;
  }
  function commonsUrl(entry){
    return "https://commons.wikimedia.org/wiki/File:"+encodeURIComponent(entry[0]).replace(/%20/g,"_");
  }
  function seeded(seed) {
    return function() {
      seed |= 0;
      seed = (seed + 0x6D2B79F5)|0;
      let t=Math.imul(seed^(seed>>>15),1|seed);
      t=(t+Math.imul(t^(t>>>7),61|t))^t;
      return ((t^(t>>>14))>>>0)/4294967296;
    };
  }
  const random=seeded(720412);
  const round=v=>Math.round(v*100)/100;
  const PHOTO_COUNT_PER_SLIDE=150; // About five times the previous ~30 per scene.
  const layout = [
    // Each composition: left wall, right wall, canopy above, and flowers rising from below.
    {priority:[1,9,16,24,20,8,10,27,14,26,17,7]},
    {priority:[2,15,12,25,9,11,1,28,18,4,6,26]},
    {priority:[7,16,19,14,6,18,8,0,13,1,21,15]},
    {priority:[10,2,8,3,5,9,1,24,29,12,17,23]},
    {priority:[9,27,1,28,8,18,16,25,10,2,15,21]}
  ];

  for (let s=0;s<slides.length;s++) {
    const field=slides[s].querySelector(".flower-field");
    if(!field) continue;
    const fragment=document.createDocumentFragment();
    for(let i=0;i<PHOTO_COUNT_PER_SLIDE;i++) {
      const edge=i%4; // left, right, upper canopy, lower border
      const chosen=(i<layout[s].priority.length) ? layout[s].priority[i] :
          Math.floor(random()*PHOTO_LIBRARY.length);
      const photo=PHOTO_LIBRARY[chosen];
      const el=document.createElement("div");
      el.className="flower photo "+(i%9===0?"front":i%5===0?"back":"mid");
      el.dataset.species=photo[2];
      // Density: 75% desktop visible on phones, not so much as to block controls.
      if(i%3===0)el.dataset.mobile="hide";
      let x=0,y=0;
      if(edge===0){x=-10+random()*29; y=-12+random()*111;}
      if(edge===1){x=82+random()*30; y=-13+random()*111;}
      if(edge===2){x=4+random()*92; y=-27+random()*26;}
      if(edge===3){x=4+random()*92; y=76+random()*34;}
      const foreground=i%7===0;
      let width=(foreground?158:85)+(foreground?random()*120:random()*104);
      if(i%13===0)width=205+random()*140;
      if(photo[0].includes("Typhonium"))width*=.62;
      if(photo[0].includes("Schneegl"))width*=.83;
      const scale=.77+random()*.51;
      const angle=(random()-.5)*78+(edge===0?18:edge===1?-18:0);
      const direction=[[-100,random()*38-19],[100,random()*38-19],[random()*36-18,-100],[random()*36-18,100]][edge];
      const image=document.createElement("img");
      image.src=photoUrl(photo);
      image.alt="";
      image.decoding="async";
      image.loading=s===0&&i<38?"eager":"lazy";
      image.setAttribute("referrerpolicy","no-referrer");
      image.width=330;
      image.height=330;
      el.appendChild(image);
      el.style.setProperty("--x",round(x)+"%");
      el.style.setProperty("--y",round(y)+"%");
      el.style.setProperty("--w",round(width)+"px");
      el.style.setProperty("--scale",round(scale));
      el.style.setProperty("--rotation",round(angle)+"deg");
      el.style.setProperty("--opacity",round(.84+random()*.16));
      el.style.setProperty("--from-x",round(direction[0])+"vw");
      el.style.setProperty("--from-y",round(direction[1])+"vh");
      el.style.setProperty("--delay",Math.round(random()*750)+"ms");
      el.style.setProperty("--layer",foreground?"5":i%5===0?"2":"3");
      if(i%12===0)el.classList.add("huge");
      fragment.appendChild(el);
    }
    field.appendChild(fragment);
  }

  // A compact, accessible credit sheet identifies the original photographers and
  // licenses via the corresponding Commons file descriptions.
  const creditLink=document.createElement("button");
  creditLink.type="button";
  creditLink.className="photo-credit-trigger";
  creditLink.textContent="PHOTO CREDITS";
  creditLink.setAttribute("aria-label","View flower photo sources and licenses");
  const dialog=document.createElement("dialog");
  dialog.className="photo-credit-dialog";
  const wrap=document.createElement("div");
  wrap.className="photo-credit-content";
  const heading=document.createElement("h2");
  heading.textContent="Real flowers. Real photographs.";
  const intro=document.createElement("p");
  intro.textContent="The flowers are photographic cutouts published on Wikimedia Commons, not AI-generated flower drawings. Each image links to its photographer, licensing terms and source history. The photographs are used in layered compositions with position, size and rotation changes.";
  const sourceList=document.createElement("ol");
  for(const entry of PHOTO_LIBRARY){
    const item=document.createElement("li");
    const link=document.createElement("a");
    link.href=commonsUrl(entry);
    link.target="_blank";
    link.rel="noopener noreferrer";
    link.textContent=entry[2]+" — "+entry[0];
    item.appendChild(link);
    sourceList.appendChild(item);
  }
  const note=document.createElement("p");
  note.className="credit-licensing-note";
  note.textContent="Wikimedia Commons files carry individual free-content licenses (including attribution requirements). Please consult each linked source for author and license information.";
  const close=document.createElement("button");
  close.className="photo-credit-close";
  close.type="button";
  close.textContent="CLOSE ×";
  close.addEventListener("click",()=>dialog.close());
  wrap.append(heading,intro,sourceList,note,close);
  dialog.appendChild(wrap);
  document.body.append(dialog);
  root.appendChild(creditLink);
  creditLink.addEventListener("click",()=>dialog.showModal());
  dialog.addEventListener("click",e=>{if(e.target===dialog)dialog.close();});

  let current=0;
  let handlingScroll=false;
  const pad=n=>String(n).padStart(2,"0");
  function activate(index){
    const chosen=Math.max(0,Math.min(slides.length-1,index));
    if(chosen===current&&document.body.classList.contains("motion"))return;
    current=chosen;
    slides.forEach((panel,k)=>panel.classList.toggle("active",k===current));
    root.classList.toggle("is-dark",current===slides.length-1);
    if(counter)counter.innerHTML=pad(current+1)+' <span>/</span> '+pad(slides.length)+' <small>'+slides[current].dataset.label+'</small>';
    if(progress)progress.style.transform="scaleX("+((current+1)/slides.length)+")";
    if(previous)previous.disabled=current===0;
    if(next)next.disabled=current===slides.length-1;
    nav.forEach(a=>{
      if(a.hash==="#"+slides[current].id)a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
    if(hint)hint.classList.toggle("hidden",current>0);
  }
  function go(index){
    const i=Math.max(0,Math.min(slides.length-1,index));
    world.scrollTo({left:i*world.clientWidth,behavior:reduced?"instant":"smooth"});
    activate(i);
  }
  if(previous)previous.addEventListener("click",()=>go(current-1));
  if(next)next.addEventListener("click",()=>go(current+1));
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener("click",event=>{
      const i=slides.findIndex(s=>"#"+s.id===a.getAttribute("href"));
      if(i<0)return;
      event.preventDefault();
      go(i);
    });
  });
  world.addEventListener("scroll",()=>{
    if(handlingScroll)return;
    handlingScroll=true;
    requestAnimationFrame(()=>{
      handlingScroll=false;
      activate(Math.round(world.scrollLeft/Math.max(world.clientWidth,1)));
    });
  },{passive:true});
  let lastWheel=0;
  window.addEventListener("wheel",event=>{
    if(dialog.open||event.ctrlKey||event.metaKey)return;
    if(Math.abs(event.deltaY)<4||Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.05)return;
    event.preventDefault();
    const now=performance.now();
    if(now-lastWheel<710)return;
    const direction=event.deltaY>0?1:-1;
    const at=Math.round(world.scrollLeft/Math.max(1,world.clientWidth));
    if((at===0&&direction<0)||(at===slides.length-1&&direction>0))return;
    lastWheel=now;
    go(at+direction);
  },{passive:false});
  window.addEventListener("keydown",event=>{
    if(dialog.open||event.altKey||event.ctrlKey||event.metaKey)return;
    if(["ArrowRight","PageDown"].includes(event.key)){event.preventDefault();go(current+1);}
    if(["ArrowLeft","PageUp"].includes(event.key)){event.preventDefault();go(current-1);}
    if(event.key==="Home"){event.preventDefault();go(0);}
    if(event.key==="End"){event.preventDefault();go(slides.length-1);}
  });
  window.addEventListener("resize",()=>world.scrollTo({left:current*world.clientWidth,behavior:"instant"}),{passive:true});
  requestAnimationFrame(()=>{
    activate(0);
    document.body.classList.add("motion");
    const target=decodeURIComponent(location.hash.slice(1));
    const index=slides.findIndex(s=>s.id===target);
    if(index>0)go(index);
  });
})();
