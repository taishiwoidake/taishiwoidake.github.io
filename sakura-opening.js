"use strict";
(() => {
  const opening=document.getElementById("sakura-opening");
  const site=document.querySelector(".site-root");
  if(!opening||!site)return;
  const params=new URLSearchParams(location.search);
  const replay=params.get("intro")==="1";
  const motion=matchMedia("(prefers-reduced-motion: reduce)");
  const key="hyakka-sakura-opening-v1";
  let seen=false;
  try{seen=sessionStorage.getItem(key)==="seen"}catch(_){}
  if(motion.matches||(!replay&&(seen||(location.hash&&location.hash!=="#welcome"))))return;
  const far=opening.querySelector(".so-landscape");
  const macro=opening.querySelector(".so-macro");
  const bloom=opening.querySelector(".so-bloom");
  const title=opening.querySelector(".so-title");
  const canvas=opening.querySelector("canvas");
  const ctx=canvas.getContext("2d");
  const caption=opening.querySelector(".so-caption");
  const progress=opening.querySelector(".so-progress");
  const skip=opening.querySelector(".so-skip");
  const duration=7500;
  let frame=0,finished=false,watchdog=0,started=0,w=1,h=1,dpr=1;
  const priorInert=site.inert;
  const priorFocus=document.activeElement;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
  const ease=v=>1-Math.pow(1-clamp(v),3);
  const phase=(t,a,b)=>smooth((t-a)/(b-a));
  function resize(){
    w=opening.clientWidth||innerWidth;h=opening.clientHeight||innerHeight;
    dpr=Math.min(devicePixelRatio||1,1.7);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
    if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function blockInput(e){if(!finished){e.stopImmediatePropagation();if(e.cancelable)e.preventDefault()}}
  function blockKeys(e){
    if(finished)return;
    if(e.key==="Escape"){e.preventDefault();e.stopImmediatePropagation();finish();return}
    if(e.target===skip&&(e.key==="Enter"||e.key===" "))return;
    if(e.key==="Tab"){e.preventDefault();skip.focus();return}
    if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(e.key))blockInput(e);
  }
  function finish(){
    if(finished)return;
    finished=true;cancelAnimationFrame(frame);clearTimeout(watchdog);
    opening.classList.add("so-leaving");
    try{sessionStorage.setItem(key,"seen")}catch(_){}
    window.removeEventListener("wheel",blockInput,true);
    window.removeEventListener("keydown",blockKeys,true);
    window.removeEventListener("resize",resize);
    motion.removeEventListener?.("change",onMotion);
    setTimeout(()=>{
      opening.hidden=true;site.inert=priorInert;
      if(priorFocus&&priorFocus!==document.body&&priorFocus.isConnected)priorFocus.focus({preventScroll:true});
    },motion.matches?0:690);
  }
  function onMotion(e){if(e.matches)finish()}
  // Build small reusable petals from a photographed petal crop. Their silhouette
  // and spin are synthetic; the underlying blossom texture is photographic.
  const sprites=[];
  function makeSprites(){
    if(sprites.length)return;
    for(let i=0;i<5;i++){
      const tile=document.createElement("canvas");tile.width=100;tile.height=136;
      const c=tile.getContext("2d");if(!c)continue;
      c.translate(50,67);
      c.beginPath();c.moveTo(0,62);c.bezierCurveTo(-38,26,-51,-19,-25,-52);
      c.bezierCurveTo(-13,-66,-4,-63,1,-53);c.bezierCurveTo(13,-68,27,-61,35,-41);
      c.bezierCurveTo(53,-5,30,33,0,62);c.closePath();c.clip();
      const g=c.createLinearGradient(-35,-56,30,65);
      g.addColorStop(0,["#fff6ec","#ffe8e3","#f9cbd6","#fff5f4","#efb4c7"][i]);
      g.addColorStop(.62,"#ed9fb7");g.addColorStop(1,"#b85278");c.fillStyle=g;c.fillRect(-50,-68,100,136);
      if(macro.complete&&macro.naturalWidth){
        c.globalAlpha=.34;c.globalCompositeOperation="soft-light";
        const mw=macro.naturalWidth,mh=macro.naturalHeight;
        c.drawImage(macro,mw*.64,mh*.15,mw*.13,mh*.16,-50,-68,100,136);
        c.globalAlpha=1;c.globalCompositeOperation="source-over";
      }
      c.strokeStyle="#fff4ec55";c.lineWidth=.9;
      for(let k=0;k<5;k++){c.beginPath();c.moveTo(0,61);c.quadraticCurveTo((k-2)*9,1,(k-2)*12,-48);c.stroke()}
      sprites.push(tile);
    }
  }
  const particles=Array.from({length:innerWidth<650?110:215},(_,i)=>{
    const angle=i*2.39996323+Math.random()*.48;
    return {angle,delay:Math.random()*.85,speed:.38+Math.random()*.87,
      size:7+Math.pow(Math.random(),1.8)*40,rotation:Math.random()*6.28,
      spin:(Math.random()-.5)*6,flutter:Math.random()*5+2,phase:Math.random()*6.28,
      sprite:i%5,depth:Math.random(),offset:Math.random()};
  });
  const sparks=Array.from({length:100},(_,i)=>({angle:i*2.39996323,speed:.3+Math.random()*.8,delay:Math.random(),r:.4+Math.random()*1.5}));
  function draw(t){
    if(!ctx)return;
    ctx.clearRect(0,0,w,h);
    const unit=Math.hypot(w,h);
    const burst=(t-2.6);
    if(burst<0)return;
    if(!sprites.length)makeSprites();
    for(const p of particles){
      const age=burst-p.delay;if(age<0)continue;
      const rad=unit*(.035+p.speed*(1-Math.exp(-age*.72))*.82);
      const angle=p.angle+age*.17*(p.depth-.42);
      const x=w*.5+Math.cos(angle)*rad+Math.sin(age*2.1+p.phase)*21;
      const y=h*.46+Math.sin(angle)*rad*.86+age*age*9+Math.cos(age*2.8+p.phase)*15;
      const alpha=clamp(age*5)*clamp((5.5-burst)*.75)*(.63+p.depth*.37);
      if(x<-85||x>w+85||y<-85||y>h+85||alpha<=0)continue;
      const s=p.size*(.75+age*.19),flip=Math.cos(age*p.flutter+p.phase);
      ctx.save();ctx.translate(x,y);ctx.rotate(p.rotation+age*p.spin);
      ctx.scale(Math.max(.10,Math.abs(flip)),1);ctx.globalAlpha=alpha;
      const tile=sprites[p.sprite%sprites.length];
      if(tile)ctx.drawImage(tile,-s*.5,-s*.67,s,s*1.36);
      ctx.restore();
    }
    for(const p of sparks){
      const a=burst-p.delay;if(a<0)continue;
      const rad=unit*p.speed*(1-Math.exp(-a*.62))*.65;
      const angle=p.angle+a*.35;
      const x=w*.5+Math.cos(angle)*rad,y=h*.47+Math.sin(angle)*rad*.78;
      ctx.globalAlpha=clamp(a*4)*clamp((4.8-a)/2)*.7;
      ctx.fillStyle="#f2d596";ctx.beginPath();ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  function tick(now){
    if(finished)return;
    if(!started)started=now;
    const t=Math.min(duration,(now-started))/1000;
    const zoom=phase(t,.25,2.8);
    const mobile=w<650;
    far.style.transform="translate("+(mobile?-14:-26)*zoom+"%,"+15*zoom+"%) scale("+(1+zoom*2.9)+")";
    far.style.opacity=String(1-phase(t,1.95,3.05));
    macro.style.opacity=String(phase(t,1.95,2.85)*(1-phase(t,2.85,3.8)));
    macro.style.transform="scale("+(1+phase(t,2.05,3.7)*.6)+")";
    bloom.style.opacity=String(phase(t,2.65,3.65));
    const reveal=phase(t,3.25,4.65);
    title.style.opacity=String(reveal);
    title.style.transform="translateY("+(15*(1-reveal))+"px) scale("+(.96+.04*reveal)+")";
    caption.textContent=t<1.8?"01 / APPROACH":t<3.2?"02 / INTO THE BLOSSOMS":"03 / HYAKKA RYORAN";
    progress.style.transform="scaleX("+clamp(t/(duration/1000))+")";
    draw(t);
    if(t>=duration/1000)finish();else frame=requestAnimationFrame(tick);
  }
  // Do not cover the site with a broken photo or wait indefinitely for a CDN.
  function ready(img){
    return new Promise(resolve=>{
      if(img.complete){resolve(img.naturalWidth>0);return}
      img.addEventListener("load",()=>resolve(true),{once:true});
      img.addEventListener("error",()=>resolve(false),{once:true});
    })
  }
  async function start(){
    const ok=await Promise.race([ready(far),new Promise(resolve=>setTimeout(()=>resolve(false),2400))]);
    if(!ok||motion.matches)return;
    opening.hidden=false;site.inert=true;
    resize();skip.addEventListener("click",finish,{once:true});skip.focus({preventScroll:true});
    window.addEventListener("wheel",blockInput,{capture:true,passive:false});
    window.addEventListener("keydown",blockKeys,true);
    window.addEventListener("resize",resize,{passive:true});
    motion.addEventListener?.("change",onMotion);
    watchdog=setTimeout(finish,duration+1100);
    frame=requestAnimationFrame(tick);
  }
  start().catch(()=>{if(!opening.hidden)finish()});
})();