/* Optional artwork experience. Never runs on ordinary page load. */
let dialog;
let raf=0, run=0, assets=null, resize=null;
const media=matchMedia("(prefers-reduced-motion: reduce)");
const regions=[[294,55,57,56],[204,240,74,55],[281,414,45,45],[405,325,43,30],[481,349,45,54],[618,16,64,76],[698,44,87,66],[138,91,57,70],[370,100,30,33],[534,28,34,44],[289,337,43,62],[636,232,39,34]].map(([x,y,w,h])=>[x/840,y/473,w/840,h/473]);
const clamp=x=>Math.max(0,Math.min(1,x));
const phase=(t,a,b)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x)};
function build(){
  const d=document.createElement("dialog");
  d.id="hyakka-sakura-dialog";d.setAttribute("aria-labelledby","hs-heading");
  d.innerHTML='<img class="hs-art hs-frame" alt="" aria-hidden="true"><img class="hs-art hs-burst" alt="" aria-hidden="true"><div class="hs-aura" aria-hidden="true"></div><canvas aria-hidden="true"></canvas><div class="hs-title"><img class="hs-crest" src="/hyakka-ryoran.svg?v=1" alt="" width="176" height="176"><h2 class="hs-japanese" id="hs-heading" lang="ja">百花繚乱</h2><p class="hs-roman">HYAKKA RYORAN</p><p class="hs-name">Ryunosuke Hirata</p><p class="hs-name-ja" lang="ja">平田 隆之介</p></div><div class="hs-controls"><button type="button" data-replay>REPLAY ↻</button><button type="button" data-close>RETURN TO SITE ×</button></div><span class="hs-credit">AI-generated sakura artwork</span>';
  document.body.append(d);
  d.querySelector("[data-close]").addEventListener("click",()=>d.close());
  d.querySelector("[data-replay]").addEventListener("click",()=>play());
  d.addEventListener("close",()=>{run++;cancelAnimationFrame(raf);if(resize)window.removeEventListener("resize",resize);resize=null;document.querySelector(".rh-waypoint")?.focus({preventScroll:true})});
  return d;
}
async function load(){
  if(!assets){
    assets=Promise.all([import("./hyakka-sakura-frame.js"),import("./hyakka-sakura-burst.js")]).then(async ([f,b])=>{
      const a=dialog.querySelector(".hs-frame"),c=dialog.querySelector(".hs-burst");
      a.src=f.default;c.src=b.default;
      await Promise.all([a.decode(),c.decode()]);
      return {a,c};
    }).catch(e=>{assets=null;throw e});
  }
  return assets;
}
async function play(){
  const token=++run;cancelAnimationFrame(raf);
  if(resize)window.removeEventListener("resize",resize);
  const title=dialog.querySelector(".hs-title"),canvas=dialog.querySelector("canvas"),ctx=canvas.getContext("2d");
  const a=dialog.querySelector(".hs-frame"),b=dialog.querySelector(".hs-burst"),credit=dialog.querySelector(".hs-credit");
  title.style.opacity="1";title.style.transform="none";
  a.style.opacity="0";b.style.opacity="0";credit.textContent="AI-generated sakura artwork";
  let w=1,h=1;
  resize=()=>{w=dialog.clientWidth||innerWidth;h=dialog.clientHeight||innerHeight;const dpr=Math.min(devicePixelRatio||1,1.8);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0)};
  resize();window.addEventListener("resize",resize,{passive:true});
  try{await load()}catch(e){if(token===run&&dialog.open)credit.textContent="Sakura artwork could not load. Return or replay.";return}
  if(token!==run||!dialog.open)return;
  if(media.matches){a.style.opacity=".96";return}
  // The same transparent photographic-style AI image crops as the saved intro.
  const count=w<650?160:320;
  let seed=39411;
  function random(){seed=(1664525*seed+1013904223)>>>0;return seed/4294967296}
  const petals=Array.from({length:count},(_,i)=>({angle:i*2.39996323+(random()-.5)*.75,delay:random()*.85,speed:.48+random()*1.05,size:10+Math.pow(random(),1.65)*54,rotation:random()*6.28,spin:(random()-.5)*5,flutter:2+random()*5,phase:random()*6.28,depth:random(),sprite:i%regions.length}));
  const drift=Array.from({length:w<650?33:66},(_,i)=>({x:random(),y:random(),size:7+random()*24,phase:random()*6.28,rotation:random()*6.28,spin:(random()-.5)*.9,sprite:i%regions.length}));
  function sprite(p,x,y,size,rotation,flip,alpha){
    if(!ctx||alpha<=0||!b.naturalWidth||x< -size||x>w+size||y< -size||y>h+size)return;
    const [rx,ry,rw,rh]=regions[p.sprite],sw=rw*b.naturalWidth,sh=rh*b.naturalHeight,hh=size*sh/sw;
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(Math.max(.22,Math.abs(flip)),1);ctx.globalAlpha=clamp(alpha);ctx.drawImage(b,rx*b.naturalWidth,ry*b.naturalHeight,sw,sh,-size/2,-hh/2,size,hh);ctx.restore();
  }
  let start=null;
  function tick(now){
    if(token!==run||!dialog.open)return;
    if(start===null)start=now;
    const t=(now-start)/1000,len=Math.hypot(w,h);
    a.style.opacity=String(.98*phase(t,.18,1.8));
    a.style.transform="scale("+(1.13-.12*phase(t,0,3.5))+")";
    b.style.opacity=String(phase(t,0,.36)*(1-phase(t,.65,2.65)));
    b.style.transform="scale("+(.62+1.55*phase(t,0,2.9))+")";
    const show=phase(t,.45,2.05);title.style.opacity=String(.18+.82*show);title.style.transform="translateY("+(12*(1-show))+"px) scale("+(.93+.07*show)+")";
    if(ctx){
      ctx.clearRect(0,0,w,h);
      if(t<5.9)for(const p of petals){
        const age=t-p.delay;if(age<0)continue;
        const travel=1-Math.exp(-age*(.65+p.depth*.6)),rad=len*(.02+p.speed*travel*.73),angle=p.angle+.2*age*(p.depth-.35);
        const x=w*.5+Math.cos(angle)*rad+Math.sin(age*2.8+p.phase)*24,y=h*.43+Math.sin(angle)*rad*.91+age*age*8+Math.cos(age*2+p.phase)*17;
        sprite(p,x,y,p.size*(.6+age*.30+p.depth*.8),p.rotation+age*p.spin,Math.cos(age*p.flutter+p.phase),phase(age,0,.23)*(1-phase(age,3.3,4.9)));
      }
      if(t>1.8)for(const p of drift){
        const x=(p.x*w+t*23+Math.sin(t*.7+p.phase)*34+w)%w,y=((p.y*h+t*(24+p.size*.9))%(h+80))-40;
        const center=1-.74*Math.exp(-((x/w-.5)**2*22+(y/h-.48)**2*13));
        sprite(p,x,y,p.size,p.rotation+t*p.spin,Math.cos(t*.8+p.phase),phase(t,1.8,3)*center*.8);
      }
    }
    if(media.matches){a.style.opacity=".98";b.style.opacity="0";title.style.opacity="1";title.style.transform="none";ctx?.clearRect(0,0,w,h);return}
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
}
export function openSakura(){
  if(!dialog)dialog=build();
  if(!dialog.open)dialog.showModal();
  dialog.querySelector("[data-close]").focus({preventScroll:true});
  play();
}
