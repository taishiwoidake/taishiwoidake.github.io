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
  // Every flower receives its own independent trajectory, spin, delay and sway.
  // One canvas per panel replaces hundreds of individually animated HTML nodes.
  const FLOWERS_PER_SCENE=150;
  const contexts=new Map();
  const accepted=[];
  let imageVersion=0;
  let paintTimer=0;
  let frameId=0;
  let lastFrame=0;
  let liveScene=-1;
  let entryTime=0;
  const pointerWind={x:-100000,y:-100000,active:false};
  world.addEventListener("pointermove",event=>{
    if(event.pointerType==="touch")return;
    const rect=world.getBoundingClientRect();
    pointerWind.x=event.clientX-rect.left;
    pointerWind.y=event.clientY-rect.top;
    pointerWind.active=true;
  },{passive:true});
  world.addEventListener("pointerleave",()=>{pointerWind.active=false;},{passive:true});


  for(const slide of slides){
    const field=slide.querySelector(".flower-field");
    if(!field)continue;
    const canvas=document.createElement("canvas");
    canvas.className="individual-flower-canvas";
    canvas.setAttribute("aria-hidden","true");
    field.appendChild(canvas);
    contexts.set(slide,{canvas,signature:"",layout:[],drawn:false});
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

  function clamp01(t){return Math.max(0,Math.min(1,t));}
  function ease(t){t=clamp01(t);return 1-Math.pow(1-t,3);}
  function spring(t){
    t=clamp01(t);
    const c=1.70158;
    return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2);
  }
  function canvasContext(entry,w,h) {
    // Keep 2D compositing bounded on 4K displays and high-DPI phones.
    const maxPixels=innerWidth<650?1250000:2400000;
    const pixelRatio=Math.min(window.devicePixelRatio||1,1.32,Math.sqrt(maxPixels/(w*h)));
    const pw=Math.max(1,Math.round(w*pixelRatio)),ph=Math.max(1,Math.round(h*pixelRatio));
    if(entry.canvas.width!==pw||entry.canvas.height!==ph) {
      entry.canvas.width=pw;entry.canvas.height=ph;
    }
    const ctx=entry.canvas.getContext("2d",{alpha:true,desynchronized:true});
    if(!ctx)return null;
    ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
    ctx.clearRect(0,0,w,h);
    return ctx;
  }

  function createIndividualFlowers(sceneIndex,w,h){
    const rand=seeded(904711+sceneIndex*1931);
    const flowers=[];
    for(let i=0;i<FLOWERS_PER_SCENE;i++){
      const side=i%8;
      const x0=rand(),y0=rand();
      let x,y;
      // Each edge and corner has independent flowers; keep a modest clearing
      // behind the central headings without thinning the outer floral wall.
      if(side===0){x=w*(-.07+x0*.27);y=h*(-.10+y0*1.17);}
      else if(side===1){x=w*(.79+x0*.29);y=h*(-.10+y0*1.17);}
      else if(side===2){x=w*(.02+x0*.96);y=h*(-.10+y0*.35);}
      else if(side===3){x=w*(.02+x0*.96);y=h*(.76+y0*.34);}
      else if(side===4){x=w*(-.04+x0*.37);y=h*(-.10+y0*.40);}
      else if(side===5){x=w*(.67+x0*.37);y=h*(-.10+y0*.40);}
      else if(side===6){x=w*(-.04+x0*.37);y=h*(.70+y0*.42);}
      else {x=w*(.67+x0*.37);y=h*(.70+y0*.42);}
      // A few flowers extend toward the text, creating layered depth.
      if(i%17===0){x+=(w/2-x)*.21;y+=(h/2-y)*.15;}

      const img=accepted[Math.floor(rand()*accepted.length)].img;
      const small=w<650;
      const maxSide=(small?63:82)+rand()*(small?96:139)+(i%11===0?(small?48:81):0);
      const scale=Math.min(maxSide/img.width,maxSide/img.height);
      const width=img.width*scale,height=img.height*scale;
      const startSide=(side+Math.floor(rand()*3)+7)%8;
      const dirs=[
        [-1,rand()*.45-.22],[1,rand()*.45-.22],
        [rand()*.45-.22,-1],[rand()*.45-.22,1],
        [-1,-.95],[1,-.95],[-1,.95],[1,.95]
      ];
      const vec=dirs[startSide];
      const fromX=x+vec[0]*(w*.48+width*.85+rand()*w*.22);
      const fromY=y+vec[1]*(h*.46+height*.85+rand()*h*.22);
      const type=(i+Math.floor(rand()*9))%9;
      const driftSpeed=.42+rand()*.82;
      flowers.push({
        img,x,y,width,height,fromX,fromY,type,
        angle:(rand()-.5)*2.5,
        spin:(rand()>.5?1:-1)*(.6+rand()*5.6),
        curve:(rand()>.5?1:-1)*(38+rand()*142),
        sway:((rand()>.5?1:-1)*(.055+rand()*.19)),
        amp:4+rand()*(small?9:19),
        driftSpeed,phase:rand()*Math.PI*2,
        delay:rand()*1150+((i%8)*60),
        duration:1450+rand()*1550,
        depth:i%10===0?1.12:.78+rand()*.33
      });
    }
    // Render distant, smaller flowers first, larger foreground flowers last.
    flowers.sort((p,q)=>p.depth-q.depth);
    return flowers;
  }

  function paintScene(sceneIndex, now, entering=false, force=false){
    const slide=slides[sceneIndex];
    const entry=contexts.get(slide);
    if(!entry||!accepted.length)return;
    const w=world.clientWidth,h=world.clientHeight;
    if(w<1||h<1)return;
    const signature=w+"x"+h+"/"+imageVersion;
    if(entry.signature!==signature){
      entry.layout=createIndividualFlowers(sceneIndex,w,h);
      entry.signature=signature;
      entry.drawn=false;
    }
    if(!entering&&!force&&entry.drawn)return;
    const ctx=canvasContext(entry,w,h);
    if(!ctx)return;
    const elapsed=entering?Math.max(0,now-entryTime):16000;
    for(const flower of entry.layout){
      const {
        img,x,y,width,height,fromX,fromY,type,angle,spin,curve,
        sway,amp,driftSpeed,phase,delay,duration,depth
      }=flower;
      const p=clamp01((elapsed-delay)/duration);
      if(p===0)continue;
      const e=type===6?spring(p):ease(p);
      const inverse=1-e;
      let px=fromX*inverse+x*e;
      let py=fromY*inverse+y*e;
      let theta=angle+spin*inverse;
      let size=e;
      const bend=Math.sin(p*Math.PI)*(1-p*.22)*curve;
      // Each species moves independently, never as part of a rigid patch.
      switch(type){
        case 0: // Spiral inward; the flower unfurls while circling.
          px+=Math.cos(p*Math.PI*3+phase)*bend;
          py+=Math.sin(p*Math.PI*3+phase)*bend;
          theta+=Math.PI*2*inverse;
          size=.18+.82*e;
          break;
        case 1: // Long graceful sweep on a curved trajectory.
          px+=bend*.95;
          py-=Math.sin(p*Math.PI)*curve*.60;
          theta+=.65*inverse;
          size=.36+.64*e;
          break;
        case 2: // A drifting fall with lateral wobble.
          px+=Math.sin(p*Math.PI*4+phase)*bend*.52;
          py-=Math.sin(p*Math.PI)*23;
          size=.55+.45*e;
          break;
        case 3: // Sideways corkscrew.
          px+=Math.cos(p*Math.PI*5+phase)*bend*.52;
          py+=Math.sin(p*Math.PI*5+phase)*bend*.57;
          theta+=Math.PI*1.3*inverse;
          size=.3+.7*e;
          break;
        case 4: // Swoop up from below.
          py+=Math.sin(p*Math.PI)*curve*.72;
          px+=Math.sin(p*Math.PI*2)*curve*.22;
          size=.45+.55*e;
          break;
        case 5: // Zig-zag flight, settling into a gentle hover.
          px+=Math.sin(p*Math.PI*6)*bend*.72;
          theta+=Math.sin(p*Math.PI*4)*inverse*.6;
          size=.5+.5*e;
          break;
        case 6: // Spring out and blossom with a restrained overshoot.
          px=x+(fromX-x)*Math.max(0,1-p*1.35);
          py=y+(fromY-y)*Math.max(0,1-p*1.35);
          size=.05+Math.max(.0,e)*.95;
          theta+=Math.PI*.7*inverse;
          break;
        case 7: // Fall gently around an S-shaped bend.
          px+=Math.sin(p*Math.PI*2+phase)*bend*.65;
          py-=Math.sin(p*Math.PI)*curve*.33;
          size=.35+.65*e;
          break;
        default: // Wide, arcing entrance.
          px-=bend*.58;
          py+=Math.sin(p*Math.PI)*curve*.44;
          theta-=Math.PI*.8*inverse;
          size=.20+.8*e;
      }
      // Each flower has an individual idle choreography, even after arriving.
      // Swirls, slow orbits, drifts, pendulums, flutters and gentle breathing.
      const seconds=elapsed/1000;
      const life=ease(p);
      const t=seconds*driftSpeed+phase;
      switch(type){
        case 0: // Small elliptical orbit
          px+=Math.cos(t*.81)*amp*1.5*life;
          py+=Math.sin(t*.81)*amp*1.05*life;
          theta+=Math.sin(t*.73)*sway*1.35*life;
          break;
        case 1: // Long diagonal sway
          px+=Math.sin(t*.51)*amp*1.65*life;
          py+=Math.cos(t*.43)*amp*.78*life;
          theta+=Math.sin(t*.41)*sway*1.5*life;
          break;
        case 2: // Petal-like hovering and falling
          px+=Math.sin(t*.97)*amp*.54*life;
          py+=Math.sin(t*1.17)*amp*1.48*life;
          theta+=Math.cos(t*.85)*sway*.9*life;
          break;
        case 3: // Rotating, almost weightless suspension
          px+=Math.cos(t*.61)*amp*1.03*life;
          py+=Math.sin(t*.76)*amp*1.1*life;
          theta+=Math.sin(t*.58)*sway*2.3*life;
          break;
        case 4: // Flower looking upwards
          px+=Math.sin(t*.77)*amp*.6*life;
          py+=Math.cos(t*.62)*amp*1.65*life;
          theta+=Math.sin(t*.60+phase)*sway*1.1*life;
          break;
        case 5: // A lively lateral dance
          px+=Math.sin(t*.95)*amp*1.95*life;
          py+=Math.cos(t*1.15)*amp*.50*life;
          theta+=Math.sin(t*.91)*sway*1.95*life;
          break;
        case 6: // Gently opening and closing, like breathing
          px+=Math.sin(t*.48)*amp*.65*life;
          py+=Math.cos(t*.67)*amp*.85*life;
          theta+=Math.sin(t*.54)*sway*.65*life;
          break;
        case 7: // Figure-eight movement
          px+=Math.sin(t*.75)*amp*1.28*life;
          py+=Math.sin(t*1.50)*amp*.74*life;
          theta+=Math.sin(t*.61)*sway*1.2*life;
          break;
        default: // Asymmetrical, floating arc
          px+=Math.sin(t*.73)*amp*1.17*life;
          py+=Math.cos(t*.52+phase)*amp*1.30*life;
          theta+=Math.sin(t*.69)*sway*1.05*life;
      }
      if(pointerWind.active&&life>.01){
        const dx=px-pointerWind.x,dy=py-pointerWind.y;
        const distanceSquared=dx*dx+dy*dy;
        const radius=230;
        if(distanceSquared<radius*radius){
          const effect=Math.pow(1-distanceSquared/(radius*radius),2);
          px+=dx/radius*28*effect*life;
          py+=dy/radius*28*effect*life;
          theta+=(dx/radius)*.17*effect;
        }
      }
      const breathe=1+Math.sin(t*.86+phase)*(type===6?.08:.025)*life;
      const finalSize=Math.max(0,size)*breathe*depth;
      if(finalSize<.01)continue;
      ctx.save();
      ctx.globalAlpha=Math.min(1,p*1.7);
      ctx.translate(px,py);
      ctx.rotate(theta);
      ctx.scale(finalSize,finalSize);
      ctx.drawImage(img,-width/2,-height/2,width,height);
      ctx.restore();
    }
    entry.drawn=!entering;
  }

  function releaseFarScenes(){
    for(let i=0;i<slides.length;i++){
      if(Math.abs(i-current)<=1)continue;
      const entry=contexts.get(slides[i]);
      if(!entry)continue;
      if(entry.canvas.width!==0){entry.canvas.width=0;entry.canvas.height=0;}
      entry.drawn=false;
    }
  }

  function renderNearScenes(){
    if(!accepted.length)return;
    if(liveScene!==current){
      liveScene=current;
      entryTime=performance.now();
      lastFrame=0;
      if(frameId){cancelAnimationFrame(frameId);frameId=0;}
      for(let k=current-1;k<=current+1;k++){
        if(k>=0&&k<slides.length&&k!==current)paintScene(k,0,false,true);
      }
      releaseFarScenes();
    }
    if(reduced){
      paintScene(current,16000,false,true);
      return;
    }
    if(!frameId&&!document.hidden)frameId=requestAnimationFrame(tick);
  }

  function tick(now){
    frameId=0;
    if(document.hidden||!accepted.length)return;
    const minInterval=world.clientWidth<650?44:33;
    if(now-lastFrame>=minInterval){
      lastFrame=now;
      paintScene(current,now,true,true);
    }
    frameId=requestAnimationFrame(tick);
  }

  function schedulePaint(){
    if(paintTimer)return;
    paintTimer=setTimeout(()=>{
      paintTimer=0;
      imageVersion++;
      for(const entry of contexts.values())entry.drawn=false;
      renderNearScenes();
      for(let k=current-1;k<=current+1;k++){
        if(k>=0&&k<slides.length&&k!==current)paintScene(k,0,false,true);
      }
    },260);
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
          if(accepted.length===1||accepted.length%3===0)schedulePaint();
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

  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){
      if(frameId)cancelAnimationFrame(frameId);
      frameId=0;
    }else{
      lastFrame=0;
      renderNearScenes();
    }
  },{passive:true});

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

  // A short botanical curtain between chapters. It uses the same verified
  // real-photo cutouts; no new image requests and no changes to scene artwork.
  const portal=document.createElement("div");
  portal.className="botanical-portal";
  portal.setAttribute("aria-hidden","true");
  portal.innerHTML='<div class="portal-wipe"></div><div class="portal-aura"></div><div class="portal-ring ring-one"></div><div class="portal-ring ring-two"></div><canvas class="portal-flowers"></canvas>';
  root.appendChild(portal);
  const portalCanvas=portal.querySelector(".portal-flowers");
  const transitionDuration=1280;
  let transitionLocked=false;
  let transitionToken=0;
  let portalFrame=0;
  let portalFlowers=[];
  let portalRatio=1;


  // Real flower photographs are retained in the background scenes.
  // During chapter changes, translucent petal sprites ride different currents
  // and a small number of authentic cutout blooms drift through the foreground.
  const PETAL_PALETTES=[
    ["#fff1f2","#f3b4c2","#c96988"],
    ["#fff8e9","#f8d7ac","#d99082"],
    ["#f7e4f5","#cfa4d5","#916da9"],
    ["#ffedf0","#e997ac","#bb617e"],
    ["#fff4d7","#efd39a","#be9464"],
    ["#f0f5e9","#d1deb4","#84a67f"],
    ["#ffede0","#eabb9e","#cd9076"],
    ["#ede9ff","#beb7dc","#8177ad"],
    ["#fbe6e2","#f0c4c2","#bf8b97"],
    ["#fafaf4","#e7e8de","#aebda2"],
    ["#fce9eb","#d7a5b0","#9a688c"],
    ["#fbeec9","#f0cdbb","#d39795"]
  ];
  const petalSprites=PETAL_PALETTES.map((palette,index)=>{
    const sprite=document.createElement("canvas");
    sprite.width=112;sprite.height=126;
    const p=sprite.getContext("2d",{alpha:true});
    if(!p)return sprite;
    p.translate(56,65);
    const grad=p.createLinearGradient(-27,-51,16,47);
    grad.addColorStop(0,palette[0]);
    grad.addColorStop(.36,palette[1]);
    grad.addColorStop(.80,palette[1]);
    grad.addColorStop(1,palette[2]);
    p.beginPath();
    p.moveTo(0,49);
    p.bezierCurveTo(-15,19,-49,-13,-29,-42);
    p.bezierCurveTo(-18,-60,-4,-55,0,-51);
    p.bezierCurveTo(16,-64,36,-48,38,-26);
    p.bezierCurveTo(39,2,22,31,0,49);
    p.closePath();p.fillStyle=grad;p.fill();
    // A subtle translucent rim and fine real-petal-like venation.
    p.strokeStyle="rgba(255,255,248,.46)";
    p.lineWidth=1.45;p.stroke();
    p.beginPath();p.moveTo(0,42);
    p.bezierCurveTo(-2,15,8,-21,0,-48);
    p.strokeStyle="rgba(255,254,245,.23)";
    p.lineWidth=1;p.stroke();
    for(let i=-2;i<=2;i++){
      p.beginPath();p.moveTo(0,35+i*3);
      p.quadraticCurveTo(10+i*5,0,24+i*2,-25);
      p.strokeStyle="rgba(255,246,246,.11)";
      p.lineWidth=.7;p.stroke();
    }
    if(index%3===0){
      p.beginPath();p.ellipse(-15,-25,10,25,-.4,0,Math.PI*2);
      p.fillStyle="rgba(255,255,255,.09)";p.fill();
    }
    return sprite;
  });

  function portalComposition(direction,index){
    const rand=seeded(871921+index*3553+Math.floor(performance.now()/1300));
    const mobile=window.innerWidth<650;
    const count=mobile?110:220;
    const w=world.clientWidth,h=world.clientHeight;
    const composition=[];
    for(let k=0;k<count;k++){
      const isFlower=accepted.length>0 && k%11===0;
      const resource=isFlower?accepted[Math.floor(rand()*accepted.length)].img
                             :petalSprites[Math.floor(rand()*petalSprites.length)];
      const maxSize=isFlower?(mobile?69:90)+rand()*(mobile?68:94):
                      (mobile?24:32)+rand()*(mobile?30:49);
      const factor=Math.min(maxSize/resource.width,maxSize/resource.height);
      const layer=rand();
      // Wind streams begin in different parts of the frame. Petals do not
      // travel as one group: every petal has an individual curved path.
      const x=(direction===1?-.38:.20)*w+rand()*w*1.16;
      const y=(-.26+rand()*1.51)*h;
      composition.push({
        image:resource,kind:isFlower?"flower":"petal",
        x,y,
        dx:direction*(w*(.67+rand()*.72)),
        dy:h*((rand()-.5)*.57)+((k%5===0)?-h*.15:0),
        ampX:(mobile?20:32)+rand()*(mobile?48:118),
        ampY:14+rand()*(mobile?39:89),
        angle:(rand()-.5)*Math.PI*2,
        spin:(rand()>.5?1:-1)*(2.3+rand()*12.7),
        phase:rand()*Math.PI*2,
        delay:rand()*.28,
        width:resource.width*factor,height:resource.height*factor,
        zoom:(isFlower?.65:.75)+rand()*(isFlower?.66:1.12),
        layer
      });
    }
    composition.sort((a,b)=>a.layer-b.layer);
    return composition;
  }

  function renderPortal(now,start){
    portalFrame=0;
    if(!transitionLocked)return;
    const elapsed=Math.max(0,now-start);
    const t=Math.min(1,elapsed/transitionDuration);
    const w=world.clientWidth,h=world.clientHeight;
    if(!w||!h)return;
    const ctx=portalCanvas.getContext("2d",{alpha:true});
    if(!ctx)return;
    const pixelBudget=window.innerWidth<650?850000:1500000;
    const ratio=Math.min(window.devicePixelRatio||1,1.2,Math.sqrt(pixelBudget/(w*h)));
    const pw=Math.max(1,Math.round(w*ratio)),ph=Math.max(1,Math.round(h*ratio));
    if(portalCanvas.width!==pw||portalCanvas.height!==ph){
      portalCanvas.width=pw;portalCanvas.height=ph;
      portalRatio=ratio;
    }
    ctx.setTransform(portalRatio,0,0,portalRatio,0,0);
    ctx.clearRect(0,0,w,h);
    for(const petal of portalFlowers){
      const p=Math.max(0,Math.min(1,(t-petal.delay)/(.98-petal.delay)));
      if(p===0)continue;
      const smooth=p*p*(3-2*p);
      const bend=Math.sin(p*Math.PI);
      // Different speeds, alternating spirals and independent wind gusts.
      const x=petal.x+petal.dx*smooth+
        Math.sin(p*Math.PI*(3+petal.layer*3)+petal.phase)*petal.ampX*bend;
      const y=petal.y+petal.dy*smooth+
        Math.cos(p*Math.PI*(2+petal.layer*2)+petal.phase)*petal.ampY*bend;
      const angle=petal.angle+petal.spin*smooth+
        Math.sin(p*Math.PI*3+petal.phase)*.34;
      const appearing=Math.min(1,p*9);
      const fading=Math.min(1,(1-p)*7);
      const opacity=Math.max(0,Math.min(appearing,fading));
      if(opacity<=0)continue;
      const depth=.65+petal.layer*.9;
      const flutter=petal.kind==="petal"
        ?Math.max(.15,Math.abs(Math.cos(p*Math.PI*10+petal.phase)))
        :1;
      const size=petal.zoom*depth*(.75+.20*Math.sin(p*Math.PI));
      ctx.save();
      ctx.globalAlpha=opacity*(petal.kind==="petal"?.92:.90);
      ctx.translate(x,y);
      ctx.rotate(angle);
      ctx.scale(size*flutter,size);
      ctx.drawImage(petal.image,-petal.width/2,-petal.height/2,petal.width,petal.height);
      ctx.restore();
    }
    if(t<1&&!document.hidden)portalFrame=requestAnimationFrame(next=>renderPortal(next,start));
  }

  function stopPortal(){
    if(portalFrame)cancelAnimationFrame(portalFrame);
    portalFrame=0;
    portal.classList.remove("is-playing");
    root.classList.remove("is-scene-changing");
    transitionLocked=false;
    portalCanvas.width=0;portalCanvas.height=0;
    portalFlowers=[];
  }

  function startPortal(target){
    if(transitionLocked)return;
    transitionLocked=true;
    const source=current;
    const forward=(source===slides.length-1&&target===0)||(target>source&&!(source===0&&target===slides.length-1));
    const direction=forward?1:-1;
    const token=++transitionToken;
    portal.dataset.direction=forward?"forward":"backward";
    portal.classList.remove("is-playing");
    portal.style.setProperty("--scene-direction",String(direction));
    root.style.setProperty("--scene-direction",String(direction));
    // Re-adding the class restarts CSS keyframes on every transition.
    void portal.offsetWidth;
    portal.classList.add("is-playing");
    root.classList.add("is-scene-changing");
    portalFlowers=portalComposition(direction,target);
    const start=performance.now();
    if(portalFrame)cancelAnimationFrame(portalFrame);
    portalFrame=requestAnimationFrame(now=>renderPortal(now,start));
    // At 49% the curtain is fully opaque: jump to the destination invisibly.
    setTimeout(()=>{
      if(token!==transitionToken)return;
      world.scrollTo({left:target*world.clientWidth,behavior:"instant"});
      activate(target);
    },transitionDuration*.49);
    setTimeout(()=>{
      if(token===transitionToken)stopPortal();
    },transitionDuration+45);
  }

  let current=0;

  // Click the scene (or the explicit toggle) to keep the current chapter in view.
  const readToggle=document.createElement("button");
  readToggle.type="button";readToggle.className="rh-chapter-read-toggle";
  readToggle.setAttribute("aria-pressed","false");
  const controls=root.querySelector(".site-controls");
  if(controls)controls.insertBefore(readToggle,controls.querySelector(".scene-arrows"));
  let readPanel=null;
  const touchLayout=matchMedia("(hover: none) and (pointer: coarse)");
  function setReading(on){
    if(on){
      if(touchLayout.matches||transitionLocked||document.querySelector("dialog[open]"))return;
      const panel=slides[current]?.querySelector(".slide-inner");
      if(!panel)return;
      readPanel=panel;
      if(!panel.id)panel.id=slides[current].id+"-reading";
      panel.setAttribute("tabindex","0");
      panel.setAttribute("aria-label","Scroll within this chapter");
      readToggle.setAttribute("aria-controls",panel.id);
    }else{
      if(readPanel){
        readPanel.removeAttribute("tabindex");
        readPanel.removeAttribute("aria-label");
      }
      readPanel=null;
      readToggle.removeAttribute("aria-controls");
    }
    root.classList.toggle("rh-chapter-reading",!!readPanel);
    readToggle.setAttribute("aria-pressed",String(!!readPanel));
    readToggle.textContent=readPanel?"Exit reading mode":"Read this chapter";
    readToggle.title=readPanel?"Click the chapter again or press Esc to return to slide navigation":"Click the chapter to scroll vertically without changing slides";
  }
  setReading(false);
  const syncTouchLayout=()=>{
    if(touchLayout.matches&&readPanel)setReading(false);
    root.classList.toggle("rh-touch-reading",touchLayout.matches);
    readToggle.hidden=touchLayout.matches;
  };
  syncTouchLayout();
  if(touchLayout.addEventListener)touchLayout.addEventListener("change",syncTouchLayout);
  else touchLayout.addListener(syncTouchLayout);
  readToggle.addEventListener("click",()=>setReading(!readPanel));
  world.addEventListener("click",event=>{
    if(touchLayout.matches||event.pointerType==="touch"||transitionLocked||document.querySelector("dialog[open]")||event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    if(event.target.closest?.("a,button,input,select,textarea,summary,[role=button],label"))return;
    if(!event.target.closest?.(".slide.active")||window.getSelection()?.toString())return;
    setReading(!readPanel);
  });
  // Capture before other garden handlers; never turn a chapter at a scroll boundary.
  window.addEventListener("wheel",event=>{
    if(!readPanel||document.querySelector("dialog[open]")||event.ctrlKey||event.metaKey)return;
    if(event.target.closest?.(".site-header,.site-controls")&&!event.target.closest?.(".rh-chapter-read-toggle"))return;
    event.stopImmediatePropagation();
    event.preventDefault();
    const unit=event.deltaMode===1?16:event.deltaMode===2?readPanel.clientHeight:1;
    readPanel.scrollTop+=event.deltaY*unit;
  },{capture:true,passive:false});

  let handlingScroll=false;
  const pad=n=>String(n).padStart(2,"0");
  function activate(index){
    const chosen=Math.max(0,Math.min(slides.length-1,index));
    if(chosen===current&&document.body.classList.contains("motion"))return;
    if(chosen!==current&&readPanel)setReading(false);
    current=chosen;
    slides.forEach((panel,k)=>panel.classList.toggle("active",k===current));
    root.classList.toggle("is-dark",current===slides.length-1);
    if(counter)counter.innerHTML=pad(current+1)+' <span>/</span> '+pad(slides.length)+' <small>'+slides[current].dataset.label+'</small>';
    if(progress)progress.style.transform="scaleX("+((current+1)/slides.length)+")";
    // Both arrows always work. The chapters form an endless circular garden.
    if(previous){
      previous.disabled=false;
      const label=current===0?"Previous: final chapter":"Previous chapter";
      previous.title=label;
      previous.setAttribute("aria-label",label);
    }
    if(next){
      next.disabled=false;
      const label=current===slides.length-1?"Next: back to the beginning":"Next chapter";
      next.title=label;
      next.setAttribute("aria-label",label);
    }
    nav.forEach(a=>{
      if(a.hash==="#"+slides[current].id)a.setAttribute("aria-current","page");
      else a.removeAttribute("aria-current");
    });
    if(hint)hint.classList.toggle("hidden",current>0);
    renderNearScenes();
  }
  function go(index,immediate=false){
    const target=((index%slides.length)+slides.length)%slides.length;
    if(transitionLocked&&!immediate)return;
    if(target===current)return;
    if(readPanel)setReading(false);
    if(immediate||reduced){
      world.scrollTo({left:target*world.clientWidth,behavior:"instant"});
      activate(target);
    }else{
      startPortal(target);
    }
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
      // Programmatic midpoint jumps are already handled by activate().
      if(transitionLocked)return;
      activate(Math.round(world.scrollLeft/Math.max(world.clientWidth,1)));
    });
  },{passive:true});
  let lastWheel=0;
  window.addEventListener("wheel",event=>{
    if(document.querySelector("dialog[open]")||event.ctrlKey||event.metaKey)return;
    if(readPanel)return;
    if(touchLayout.matches&&Math.abs(event.deltaY)>=Math.abs(event.deltaX)){return;}
    if(transitionLocked){event.preventDefault();return;}
    const x=event.deltaX,y=event.deltaY;
    if(Math.max(Math.abs(x),Math.abs(y))<5)return;
    event.preventDefault();
    const now=performance.now();
    if(now-lastWheel<250)return;
    const direction=(Math.abs(x)>Math.abs(y)*.7?x:y)>0?1:-1;
    lastWheel=now;
    go(current+direction);
  },{passive:false});
  // Trackpads, keyboard arrows, buttons and swipe gestures all use one
  // consistent transition pipeline (including the wrap from last to first).
  let touchStart=null;
  world.addEventListener("touchstart",event=>{
    if(readPanel||event.touches.length!==1||document.querySelector("dialog[open]")){touchStart=null;return;}
    const t=event.touches[0];
    touchStart={x:t.clientX,y:t.clientY,id:t.identifier,axis:null};
  },{passive:true});
  world.addEventListener("touchmove",event=>{
    if(!touchStart||event.touches.length!==1||readPanel){touchStart=null;return;}
    const t=event.touches[0];
    if(t.identifier!==touchStart.id){touchStart=null;return;}
    const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;
    if(!touchStart.axis&&Math.max(Math.abs(dx),Math.abs(dy))>=10){
      if(Math.abs(dx)>Math.abs(dy)*1.3)touchStart.axis="x";
      else if(Math.abs(dy)>=Math.abs(dx))touchStart.axis="y";
    }
    if(touchStart.axis==="x"&&event.cancelable)event.preventDefault();
  },{passive:false});
  world.addEventListener("touchend",event=>{
    if(readPanel||!touchStart||transitionLocked){touchStart=null;return;}
    const gesture=touchStart;touchStart=null;
    const t=Array.from(event.changedTouches).find(t=>t.identifier===gesture.id);
    if(!t)return;
    const dx=t.clientX-gesture.x,dy=t.clientY-gesture.y;
    if(gesture.axis!=="y"&&Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){
      if(event.cancelable)event.preventDefault();
      go(current+(dx<0?1:-1));
    }
  },{passive:false});
  world.addEventListener("touchcancel",()=>{touchStart=null;},{passive:true});
  window.addEventListener("keydown",event=>{
    if(document.querySelector("dialog[open]")||event.altKey||event.ctrlKey||event.metaKey)return;
    if(readPanel){
      if(event.key==="Escape"){event.preventDefault();setReading(false);readToggle.focus({preventScroll:true});return;}
      if(event.target.closest?.("button,a,input,select,textarea,summary,[contenteditable=true]")&&event.key===" ")return;
      const step=event.key==="ArrowDown"?40:event.key==="ArrowUp"?-40:event.key==="PageDown"||event.key===" "?readPanel.clientHeight*.85:event.key==="PageUp"?-readPanel.clientHeight*.85:0;
      if(step){event.preventDefault();readPanel.scrollTop+=event.shiftKey&&event.key===" "?-step:step;return;}
      if(event.key==="Home"||event.key==="End"){event.preventDefault();readPanel.scrollTop=event.key==="Home"?0:readPanel.scrollHeight;return;}
      if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();return;}
    }
    if(["ArrowRight","PageDown"].includes(event.key)){event.preventDefault();go(current+1);}
    if(["ArrowLeft","PageUp"].includes(event.key)){event.preventDefault();go(current-1);}
    if(event.key==="Home"){event.preventDefault();go(0);}
    if(event.key==="End"){event.preventDefault();go(slides.length-1);}
  });
  window.addEventListener("resize",()=>{
    world.scrollTo({left:current*world.clientWidth,behavior:"instant"});
    imageVersion++;
    for(const entry of contexts.values())entry.drawn=false;
    renderNearScenes();
    for(let k=current-1;k<=current+1;k++)if(k>=0&&k<slides.length&&k!==current)paintScene(k,0,false,true);
  },{passive:true});
  requestAnimationFrame(()=>{
    activate(0);
    document.body.classList.add("motion");
    const target=decodeURIComponent(location.hash.slice(1));
    const index=slides.findIndex(s=>s.id===target);
    if(index>0)go(index,true);
  });
})();
