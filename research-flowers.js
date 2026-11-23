"use strict";
(() => {
  const stages=[...document.querySelectorAll(".research-flower-stage")];
  if(!stages.length)return;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accepted=[];
  let imageVersion=0;
  const pointerClient={x:-10000,y:-10000,active:false};
  let animationId=0;
  let lastFrame=0;
  const entries=stages.map((stage,index)=>({stage,canvas:stage.querySelector("canvas"),index,layout:[],signature:"",visible:false,enteredAt:performance.now()}));
  const FLOWERS_PER_SCENE=150;
  // Exact Wikimedia cutout library and alpha-testing pipeline used on HOME.
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

  function createIndividualFlowers(sceneIndex,w,h,count,scaleFactor=1){
    const rand=seeded(904711+sceneIndex*1931);
    const flowers=[];
    for(let i=0;i<count;i++){
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
      const maxSide=((small?63:82)+rand()*(small?96:139)+(i%11===0?(small?48:81):0))*scaleFactor;
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


  function contextFor(entry,w,h){
    const maxPixels=innerWidth<650?950000:1800000;
    const dpr=Math.min(devicePixelRatio||1,1.22,Math.sqrt(maxPixels/(w*h)));
    const pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));
    if(entry.canvas.width!==pw||entry.canvas.height!==ph){entry.canvas.width=pw;entry.canvas.height=ph;}
    const ctx=entry.canvas.getContext("2d",{alpha:true,desynchronized:true});
    if(!ctx)return null;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,w,h);
    return ctx;
  }
  function paint(entry,now){
    if(!accepted.length||!entry.visible)return;
    const w=Math.round(entry.stage.clientWidth),h=Math.round(entry.stage.clientHeight);
    if(w<10||h<10)return;
    const count=Number(entry.stage.dataset.flowerCount)||38;
    const signature=w+"x"+h+"/"+imageVersion;
    if(entry.signature!==signature){
      entry.layout=createIndividualFlowers(entry.index,w,h,count,entry.index===0?1:entry.index===entries.length-1?.78:.67);
      entry.signature=signature;
    }
    const ctx=contextFor(entry,w,h);
    if(!ctx)return;
    const elapsed=reduced?19000:Math.max(0,now-entry.enteredAt);
    const rect=entry.stage.getBoundingClientRect();
    const pointerWind={active:pointerClient.active,x:pointerClient.x-rect.left,y:pointerClient.y-rect.top};
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

  }
  function tick(now){
    animationId=0;
    if(document.hidden||!accepted.length)return;
    const frameInterval=innerWidth<650?45:34;
    if(reduced||now-lastFrame>=frameInterval){
      lastFrame=now;
      for(const entry of entries)if(entry.visible)paint(entry,now);
    }
    if(!reduced&&entries.some(e=>e.visible))animationId=requestAnimationFrame(tick);
  }
  function start(){
    if(animationId)cancelAnimationFrame(animationId);
    animationId=0;
    if(!document.hidden&&accepted.length&&entries.some(e=>e.visible))animationId=requestAnimationFrame(tick);
  }
  if("IntersectionObserver" in window){
    const observer=new IntersectionObserver(changes=>{
      for(const item of changes){
        const entry=entries.find(e=>e.stage===item.target);
        if(!entry)continue;
        const visible=item.isIntersecting;
        if(visible&&!entry.visible){entry.enteredAt=performance.now();entry.signature="";}
        entry.visible=visible;
        if(!visible){entry.canvas.width=0;entry.canvas.height=0;}
      }
      start();
    },{rootMargin:"90px 0px 90px 0px",threshold:0});
    entries.forEach(e=>observer.observe(e.stage));
  }else{
    entries.forEach(e=>e.visible=true);
  }
  window.addEventListener("pointermove",event=>{
    if(event.pointerType==="touch")return;
    pointerClient.x=event.clientX;pointerClient.y=event.clientY;pointerClient.active=true;
  },{passive:true});
  document.addEventListener("pointerleave",()=>{pointerClient.active=false;},{passive:true});
  window.addEventListener("resize",()=>{
    imageVersion++;
    for(const e of entries)e.signature="";
    if(reduced)requestAnimationFrame(tick);
    else start();
  },{passive:true});
  document.addEventListener("visibilitychange",()=>{
    if(document.hidden){if(animationId)cancelAnimationFrame(animationId);animationId=0;}
    else start();
  },{passive:true});
  async function loadFlowers(){
    const candidates=PHOTO_LIBRARY.filter(entry=>entry[0]!=="Blue_Flower_Transparent_Background.png");
    let next=0;
    async function worker(){
      while(next<candidates.length){
        const item=candidates[next++];
        const image=await getPicture(item);
        if(image){accepted.push(image);if(accepted.length===1||accepted.length%3===0){imageVersion++;start();}}
      }
    }
    await Promise.all(Array.from({length:5},()=>worker()));
    imageVersion++;start();
    document.documentElement.dataset.researchFlowerCutouts=String(accepted.length);
  }
  void loadFlowers();
})();
