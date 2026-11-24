"use strict";
(() => {
  const opening=document.getElementById("sakura-opening"),site=document.querySelector(".site-root");
  if(!opening||!site)return;
  const replay=new URLSearchParams(location.search).get("intro")==="1";
  const motion=matchMedia("(prefers-reduced-motion: reduce)"),key="hyakka-sakura-opening-v2";
  let seen=false;try{seen=sessionStorage.getItem(key)==="seen"}catch(_){}
  if(motion.matches||(!replay&&(seen||(location.hash&&location.hash!=="#welcome"))))return;
  const far=opening.querySelector(".so-landscape"),bloom=opening.querySelector(".so-bloom"),frameArt=opening.querySelector(".so-frame"),burstArt=opening.querySelector(".so-burst"),title=opening.querySelector(".so-title"),canvas=opening.querySelector("canvas"),ctx=canvas.getContext("2d"),progress=opening.querySelector(".so-progress"),skip=opening.querySelector(".so-skip");
  const duration=9.2;
  let raf=0,watchdog=0,started=null,done=false,w=1,h=1,dpr=1;
  const initialInert=site.inert,priorFocus=document.activeElement;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
  const phase=(t,a,b)=>smooth((t-a)/(b-a));
  function resize(){w=opening.clientWidth||innerWidth;h=opening.clientHeight||innerHeight;dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0)}
  function block(e){if(!done){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault()}}
  function keys(e){if(done)return;if(e.key==="Escape"){block(e);finish()}else if(e.key==="Tab"){block(e);skip.focus()}else if(e.target!==skip&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(e.key))block(e)}
  function finish(){if(done)return;done=true;cancelAnimationFrame(raf);clearTimeout(watchdog);opening.classList.add("so-leaving");try{sessionStorage.setItem(key,"seen")}catch(_){}window.removeEventListener("wheel",block,true);window.removeEventListener("keydown",keys,true);window.removeEventListener("resize",resize);motion.removeEventListener?.("change",onMotion);setTimeout(()=>{opening.hidden=true;site.inert=initialInert;if(priorFocus?.isConnected&&priorFocus!==document.body)priorFocus.focus({preventScroll:true})},motion.matches?0:680)}
  function onMotion(e){if(e.matches)finish()}
  // Pixel regions in the 840×473 reference preview of the transparent AI-generated petal sheet.
  // Each sprite uses actual RGBA image pixels; there are no drawn vector petals or rectangular backgrounds.
  const regions=[[294,55,57,56],[204,240,74,55],[281,414,45,45],[405,325,43,30],[481,349,45,54],[618,16,64,76],[698,44,87,66],[138,91,57,70],[370,100,30,33],[534,28,34,44],[289,337,43,62],[636,232,39,34]];
  const sprites=regions.map(([x,y,rw,rh])=>({x:x/840,y:y/473,w:rw/840,h:rh/473}));
  // Seeded particle paths for repeatable and stable cinematic motion.
  let seed=39411;function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
  const count=innerWidth<650?175:320;
  const petals=Array.from({length:count},(_,i)=>({angle:i*2.39996323+(random()-.5)*.7,delay:random()*1.6,speed:.48+random()*.95,size:10+Math.pow(random(),1.65)*54,spin:(random()-.5)*4.6,rotation:random()*Math.PI*2,flutter:2+random()*5,phase:random()*Math.PI*2,depth:random(),sprite:i%sprites.length}));
  const drift=Array.from({length:innerWidth<650?36:66},(_,i)=>({x:random(),y:random(),size:7+random()*22,phase:random()*6.28,rotation:random()*6.28,spin:(random()-.5)*.9,sprite:i%sprites.length}));
  function sprite(p,x,y,size,angle,flip,alpha){if(!ctx||alpha<=0||!burstArt.naturalWidth||x< -size||x>w+size||y< -size||y>h+size)return;const s=sprites[p.sprite],sw=s.w*burstArt.naturalWidth,sh=s.h*burstArt.naturalHeight,hh=size*sh/sw;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(Math.max(.22,Math.abs(flip)),1);ctx.globalAlpha=clamp(alpha);ctx.drawImage(burstArt,s.x*burstArt.naturalWidth,s.y*burstArt.naturalHeight,sw,sh,-size/2,-hh/2,size,hh);ctx.restore()}
  function draw(t){if(!ctx)return;ctx.clearRect(0,0,w,h);
    const approach=phase(t,.5,3.35),len=Math.hypot(w,h),originX=w*.508,originY=h*.39;
    // A few petals pass the lens during the approach, providing depth cues before the main burst.
    if(t<4.1&&t>.75){for(let i=0;i<drift.length;i+=3){const p=drift[i],q=clamp((t-.75)/3.35),x=originX+(p.x-.5)*w*(.16+q*.8)+Math.sin(t*1.7+p.phase)*18,y=originY+(p.y-.5)*h*(.12+q*.65)+q*q*h*.21;sprite(p,x,y,p.size*(.5+q*1.6),p.rotation+t*p.spin,Math.cos(t+p.phase),phase(t,.75,1.6)*(1-phase(t,3.25,4.1))*.72)}}
    // Spiral/radial flight with different velocity, depth, angular spin and drag per petal.
    const age0=t-3.35;
    if(age0>=0){for(const p of petals){const age=age0-p.delay;if(age<0)continue;const travel=1-Math.exp(-age*(.65+p.depth*.6)),rad=len*(.023+p.speed*travel*.73),a=p.angle+.20*age*(p.depth-.35),x=w*.5+Math.cos(a)*rad+Math.sin(age*2.8+p.phase)*24,y=h*.43+Math.sin(a)*rad*.91+age*age*8+Math.cos(age*2.0+p.phase)*17;const size=p.size*(.6+age*.30+p.depth*.8),alpha=phase(age,0,.23)*(1-phase(age,3.3,4.9));sprite(p,x,y,size,p.rotation+age*p.spin,Math.cos(age*p.flutter+p.phase),alpha)}}
    // Sparse continuing sakura snowfall around the title, instead of freezing the image.
    if(t>5.15){const a=phase(t,5.15,6.1);for(const p of drift){const x=(p.x*w+t*23+Math.sin(t*.7+p.phase)*34+w)%w,y=((p.y*h+(t-5.15)*(24+p.size*.9))%(h+80))-40;const center=1-.74*Math.exp(-((x/w-.5)**2*22+(y/h-.48)**2*13));sprite(p,x,y,p.size,p.rotation+t*p.spin,Math.cos(t*.8+p.phase),a*center*.8)}}
  }
  function tick(now){if(done)return;if(started===null)started=now;const t=Math.min(duration,(now-started)/1000);
    // Perspective-style dolly: project the image according to decreasing virtual distance,
    // rather than a linear CSS zoom or a hard cut between unrelated photographs.
    const u=clamp((t-.42)/3.78),v=u*u*(3-2*u),scale=1/(1-.82*v);
    const imgW=Math.max(w,h*1672/941),imgH=Math.max(h,w*941/1672);
    const dx=(.5-.508)*imgW*(scale-1),dy=(.5-.39)*imgH*(scale-1)*.14;
    far.style.transform="translate3d("+dx.toFixed(2)+"px,"+dy.toFixed(2)+"px,0) scale("+scale.toFixed(4)+")";
    far.style.opacity=String(1-phase(t,3.88,4.92));
    bloom.style.opacity=String(phase(t,3.75,4.95));
    // Transparent petals fill the transition and visibly travel outward.
    burstArt.style.opacity=String(phase(t,3.25,4.05)*(1-phase(t,4.75,6.05)));
    burstArt.style.transform="scale("+(.58+1.65*phase(t,3.25,5.9))+")";
    frameArt.style.opacity=String(.94*phase(t,4.23,5.7));
    frameArt.style.transform="scale("+(1.15-.105*phase(t,4.23,7.5))+") translate3d("+(.45*Math.sin(t*.55))+"%,0,0)";
    const show=phase(t,4.78,6.3);title.style.opacity=String(show);title.style.transform="translateY("+(12*(1-show))+"px) scale("+(.93+.07*show)+")";
    progress.style.transform="scaleX("+(t/duration)+")";draw(t);if(t>=duration)finish();else raf=requestAnimationFrame(tick)
  }
  const ready=img=>new Promise(resolve=>{if(img.complete){resolve(img.naturalWidth>0);return}img.addEventListener("load",()=>resolve(true),{once:true});img.addEventListener("error",()=>resolve(false),{once:true})});
  async function start(){const result=await Promise.race([Promise.all([far,frameArt,burstArt].map(ready)),new Promise(resolve=>setTimeout(()=>resolve([false]),3000))]);if(!result.every(Boolean)||motion.matches)return;opening.hidden=false;site.inert=true;resize();skip.addEventListener("click",finish,{once:true});skip.focus({preventScroll:true});window.addEventListener("wheel",block,{capture:true,passive:false});window.addEventListener("keydown",keys,true);window.addEventListener("resize",resize,{passive:true});motion.addEventListener?.("change",onMotion);watchdog=setTimeout(finish,11000);raf=requestAnimationFrame(tick)}
  start().catch(()=>{if(!opening.hidden)finish()});
})();
