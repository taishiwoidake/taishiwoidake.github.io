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
    const size = 250;
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
  // Four lightweight Canvas layers per scene replace 750 individual DOM images.
  // Every image must pass an actual pixel-alpha inspection before it can be drawn.
  // Eight directionally animated photographic layers.
  // Flower density remains unchanged: 150 cutouts per scene, cached as 8 canvases.
  const FLOWERS_PER_SCENE=150;
  const DIRECTIONS=["northwest","north","northeast","east","southeast","south","southwest","west"];
  const contexts=new Map();
  const accepted=[];
  let renderTimer=0;
  let renderVersion=0;

  for(const slide of slides){
    const field=slide.querySelector(".flower-field");
    if(!field)continue;
    const canvases=[];
    for(let k=0;k<DIRECTIONS.length;k++){
      const canvas=document.createElement("canvas");
      canvas.className="photo-canvas from-"+DIRECTIONS[k];
      canvas.style.setProperty("--stagger",(k%4*95+(k>3?100:0))+"ms");
      canvas.setAttribute("aria-hidden","true");
      field.appendChild(canvas);
      canvases.push(canvas);
    }
    contexts.set(slide,{canvases,drawnVersion:-1});
  }

  function verifyAndTrimCutout(img) {
    // Deliberately conservative: if transparency or organic silhouette cannot
    // be established, never display the file. An opaque rectangular photograph
    // is worse than omitting a flower.
    try {
      const srcW=img.naturalWidth, srcH=img.naturalHeight;
      if(!srcW||!srcH)return null;
      const n=112;
      const test=document.createElement("canvas");
      test.width=n;test.height=n;
      const tctx=test.getContext("2d",{willReadFrequently:true});
      if(!tctx)return null;
      tctx.drawImage(img,0,0,n,n);
      const px=tctx.getImageData(0,0,n,n).data;
      const alpha=(x,y)=>px[(y*n+x)*4+3];
      let clear=0,solid=0,opaqueWhite=0;
      let minX=n,minY=n,maxX=-1,maxY=-1;
      const cornerClear=[0,0,0,0],cornerTotal=[0,0,0,0];
      for(let y=0;y<n;y++)for(let x=0;x<n;x++) {
        const k=(y*n+x)*4,a=px[k+3];
        if(a<18)clear++;
        if(a>232) {
          solid++;
          minX=Math.min(minX,x);maxX=Math.max(maxX,x);
          minY=Math.min(minY,y);maxY=Math.max(maxY,y);
          if(px[k]>225&&px[k+1]>225&&px[k+2]>225)opaqueWhite++;
        }
        const quadrant=(x<12?0:x>=n-12?1:-1)+(y>=n-12?2:0);
        if((x<12||x>=n-12)&&(y<12||y>=n-12)){
          const q=(x>=n-12?1:0)+(y>=n-12?2:0);
          cornerTotal[q]++;
          if(a<25)cornerClear[q]++;
        }
      }
      // A cutout must have genuine alpha, not a white rectangle with
      // a narrow transparent frame or a fake checkerboard.
      if(clear/n/n < .27||solid/n/n < .025||solid/n/n > .66)return null;
      if(cornerClear.some((k,i)=>k/Math.max(1,cornerTotal[i]) < .80))return null;
      if(minX<0||maxX<minX||maxY<minY)return null;
      const bw=maxX-minX+1,bh=maxY-minY+1;
      const bboxArea=bw*bh;
      let bboxOpaque=0;
      for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++)
        if(alpha(x,y)>232)bboxOpaque++;
      if(bboxOpaque/bboxArea > .66)return null;

      // A photo pasted on a transparent canvas has a straight rectangular
      // perimeter. Reject that perimeter even when the outer PNG has alpha.
      let perimeterOpaque=0,perimeterCount=0;
      const bx=Math.max(1,Math.ceil(bw*.05)),by=Math.max(1,Math.ceil(bh*.05));
      for(let y=minY;y<=maxY;y+=2)for(const x of [minX+bx,maxX-bx]) {
        perimeterCount++;if(alpha(x,y)>225)perimeterOpaque++;
      }
      for(let x=minX;x<=maxX;x+=2)for(const y of [minY+by,maxY-by]) {
        perimeterCount++;if(alpha(x,y)>225)perimeterOpaque++;
      }
      if(perimeterOpaque/Math.max(1,perimeterCount)>.70)return null;

      // Cropping large transparent margins improves density and avoids drawing
      // mostly empty thumbnails on every slide.
      const full=document.createElement("canvas");
      const padding=5;
      const sx=Math.max(0,Math.floor(minX/n*srcW)-padding);
      const sy=Math.max(0,Math.floor(minY/n*srcH)-padding);
      const ex=Math.min(srcW,Math.ceil((maxX+1)/n*srcW)+padding);
      const ey=Math.min(srcH,Math.ceil((maxY+1)/n*srcH)+padding);
      full.width=Math.max(1,ex-sx);
      full.height=Math.max(1,ey-sy);
      const fctx=full.getContext("2d",{alpha:true});
      if(!fctx)return null;
      fctx.drawImage(img,sx,sy,full.width,full.height,0,0,full.width,full.height);
      return full;
    } catch(error) {
      // Includes CORS-tainted or unverifiable images.
      return null;
    }
  }

  function getPicture(entry) {
    return new Promise(resolve=>{
      const img=new Image();
      let finished=false;
      const done=value=>{
        if(finished)return;finished=true;
        clearTimeout(timeout);
        img.onload=null;img.onerror=null;
        resolve(value);
      };
      const timeout=setTimeout(()=>done(null),9000);
      img.crossOrigin="anonymous";
      img.decoding="async";
      img.onload=()=>{
        const cutout=verifyAndTrimCutout(img);
        if(!cutout)done(null);
        else done({img:cutout,entry});
      };
      img.onerror=()=>done(null);
      img.src=photoUrl(entry);
    });
  }

  function setBacking(canvas,w,h){
    const dpr=Math.min(window.devicePixelRatio||1,1.35);
    const pixelW=Math.max(1,Math.round(w*dpr));
    const pixelH=Math.max(1,Math.round(h*dpr));
    if(canvas.width!==pixelW||canvas.height!==pixelH){
      canvas.width=pixelW;canvas.height=pixelH;
    }
    const ctx=canvas.getContext("2d",{alpha:true});
    if(!ctx)return null;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    return ctx;
  }

  function paintScene(sceneIndex, force=false) {
    const slide=slides[sceneIndex];
    const entry=contexts.get(slide);
    if(!entry||!accepted.length)return;
    const vw=world.clientWidth, vh=world.clientHeight;
    if(!vw||!vh)return;
    const signature=vw+"x"+vh+"-"+renderVersion;
    if(!force&&entry.drawnVersion===signature)return;

    const small=vw<650;
    for(let direction=0;direction<DIRECTIONS.length;direction++){
      const canvas=entry.canvases[direction];
      // The canvas pixel dimensions follow the CSS-positioned edge patches.
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(w<2||h<2)continue;
      const ctx=setBacking(canvas,w,h);
      if(!ctx)continue;
      const rand=seeded(194173+sceneIndex*857+direction*129);
      const count=Math.floor(FLOWERS_PER_SCENE/DIRECTIONS.length)
        +(direction<FLOWERS_PER_SCENE%DIRECTIONS.length?1:0);
      for(let i=0;i<count;i++){
        const resource=accepted[Math.floor(rand()*accepted.length)];
        const img=resource.img;
        const maxSide=(small?55:88)+rand()*(small?100:148)+(i%9===0?36:0);
        const scale=Math.min(maxSide/img.width,maxSide/img.height);
        const dw=img.width*scale,dh=img.height*scale;
        // Edge patches overlap to produce one continuous, layered wild garden.
        // Scatter outward with fewer flowers toward the text in the centre.
        let x=w*rand(),y=h*rand();
        if(direction===0||direction===6)x=w*(.24+rand()*.63);
        if(direction===2||direction===4)x=w*(.12+rand()*.63);
        if(direction===1)y=h*(.10+rand()*.67);
        if(direction===5)y=h*(.18+rand()*.70);
        if(direction===3||direction===7)y=h*(.05+rand()*.90);
        const angle=(rand()-.5)*2.8+(direction%2?.21:-.21);
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(angle);
        ctx.globalAlpha=.90+rand()*.10;
        ctx.drawImage(img,-dw*.5,-dh*.5,dw,dh);
        ctx.restore();
      }
    }
    entry.drawnVersion=signature;
  }

  function releaseFarScenes(){
    for(let i=0;i<slides.length;i++){
      if(Math.abs(i-current)<=1)continue;
      const entry=contexts.get(slides[i]);
      if(!entry||entry.drawnVersion===-1)continue;
      for(const canvas of entry.canvases){
        canvas.width=0;canvas.height=0;
      }
      entry.drawnVersion=-1;
    }
  }

  function renderNearScenes(){
    if(!accepted.length)return;
    paintScene(current);
    if(current+1<slides.length)paintScene(current+1);
    if(current>0)paintScene(current-1);
    releaseFarScenes();
  }

  function schedulePaint(){
    if(renderTimer)return;
    renderTimer=setTimeout(()=>{
      renderTimer=0;
      renderVersion++;
      renderNearScenes();
    },230);
  }

  async function loadVerifiedPhotos(){
    const candidates=PHOTO_LIBRARY.filter(entry=>entry[0]!=="Blue_Flower_Transparent_Background.png");
    let nextIndex=0;
    async function worker(){
      while(nextIndex<candidates.length){
        const entry=candidates[nextIndex++];
        const picture=await getPicture(entry);
        if(picture){
          accepted.push(picture);
          if(accepted.length===1||accepted.length%4===0)schedulePaint();
        }
      }
    }
    await Promise.all(Array.from({length:5},()=>worker()));
    schedulePaint();
    document.documentElement.dataset.verifiedFlowers=String(accepted.length);
    const verified=document.getElementById("cutout-verified-count");
    if(verified)verified.textContent=String(accepted.length)+" cutout image files accepted out of "+candidates.length+" candidates. Only approved silhouettes appear in the garden.";
  }
  void loadVerifiedPhotos();
  
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
  intro.textContent="Wikimedia Commons source images are screened for real transparent pixels and irregular cutout silhouettes. Opaque rectangles and files that cannot be checked are excluded. Source links contain photographers, licensing terms and histories.";
  const status=document.createElement("p");
  status.id="cutout-verified-count";
  status.textContent="Checking transparent photo cutouts…";
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
  wrap.append(heading,intro,status,sourceList,note,close);
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
    renderNearScenes();
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
  window.addEventListener("resize",()=>{
    world.scrollTo({left:current*world.clientWidth,behavior:"instant"});
    renderVersion++;
    renderNearScenes();
  },{passive:true});
  requestAnimationFrame(()=>{
    activate(0);
    document.body.classList.add("motion");
    const target=decodeURIComponent(location.hash.slice(1));
    const index=slides.findIndex(s=>s.id===target);
    if(index>0)go(index);
  });
})();
