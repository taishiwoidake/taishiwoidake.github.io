/* Hyakka Ryoran: a quiet, living storm of individually isolated sakura petals. */
let dialog, raf=0, generation=0, resize=null, atlasPromise;
const reduced=matchMedia("(prefers-reduced-motion: reduce)");
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(t,a,b)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x)};
const tau=Math.PI*2;
// Measured alpha-component bounds in the saved 1672 x 941 transparent artwork.
// These are discrete petals, with no surrounding branches or photographic rectangle.
const boxes=[[1362,91,197,139],[1140,753,137,148],[2,142,143,100],[279,184,168,132],[411,488,137,91],[588,108,108,110],[1120,45,70,122],[960,706,74,89],[563,833,85,79],[25,639,103,57],[1564,171,94,71],[293,391,98,65],[28,344,77,60],[538,214,85,72],[629,19,53,82],[328,545,71,72],[1040,169,83,59],[230,359,88,44],[806,653,74,44],[395,311,57,59],[132,391,50,59],[1257,311,64,46],[684,613,44,60],[1132,210,55,48],[445,314,57,39],[1083,794,39,50]];
function loadSprites(){
  if(!atlasPromise)atlasPromise=import("./hyakka-sakura-burst.js").then(async m=>{
    const im=new Image();im.src=m.default;await im.decode();
    const sx=im.naturalWidth/1672,sy=im.naturalHeight/941;
    return boxes.map(([x,y,w,h])=>{
      const c=document.createElement("canvas");c.width=Math.max(1,Math.round(w*sx));c.height=Math.max(1,Math.round(h*sy));
      const ctx=c.getContext("2d",{willReadFrequently:true});
      ctx.drawImage(im,x*sx,y*sy,w*sx,h*sy,0,0,c.width,c.height);
      // Retain only the largest connected alpha component in each crop.
      const pix=ctx.getImageData(0,0,c.width,c.height),d=pix.data,W=c.width,H=c.height,N=W*H,labels=new Int32Array(N);
      let id=0,best=0,largest=0;
      for(let p=0;p<N;p++){if(labels[p]||d[p*4+3]<25)continue;id++;const queue=[p];labels[p]=id;
        for(let k=0;k<queue.length;k++){const q=queue[k],xx=q%W,yy=(q/W)|0;for(const n of [xx>0?q-1:-1,xx<W-1?q+1:-1,yy>0?q-W:-1,yy<H-1?q+W:-1]){if(n>=0&&!labels[n]&&d[n*4+3]>=25){labels[n]=id;queue.push(n)}}}
        if(queue.length>largest){largest=queue.length;best=id}
      }
      for(let p=0;p<N;p++)if(labels[p]!==best)d[p*4+3]=0;
      ctx.putImageData(pix,0,0);
      return c;
    }).filter(c=>c.width>0&&c.height>0);
  }).catch(e=>{atlasPromise=null;throw e});
  return atlasPromise;
}
function makeDialog(){
 const d=document.createElement("dialog");d.id="hyakka-sakura-dialog";d.setAttribute("aria-labelledby","hs-heading");
 d.innerHTML='<div class="hs-aura" aria-hidden="true"></div><canvas class="hs-back" aria-hidden="true"></canvas><div class="hs-title"><img class="hs-crest" src="/hyakka-ryoran-wood.svg?v=1" width="176" height="176" alt=""><h2 class="hs-japanese" id="hs-heading" lang="ja">百花繚乱</h2><p class="hs-roman">HYAKKA RYORAN</p><p class="hs-name">Ryunosuke Hirata</p><p class="hs-name-ja" lang="ja">平田 隆之介</p></div><canvas class="hs-front" aria-hidden="true"></canvas><button class="hs-close" type="button" aria-label="Return to site" title="Return to site">×</button>';
 document.body.append(d);d.querySelector(".hs-close").addEventListener("click",()=>d.close());
 d.addEventListener("close",()=>{generation++;cancelAnimationFrame(raf);if(resize)window.removeEventListener("resize",resize);resize=null;document.querySelector(".rh-waypoint")?.focus({preventScroll:true})});
 return d;
}
async function play(){
 const token=++generation;cancelAnimationFrame(raf);if(resize)window.removeEventListener("resize",resize);
 const title=dialog.querySelector(".hs-title"),back=dialog.querySelector(".hs-back"),front=dialog.querySelector(".hs-front");
 const bg=back.getContext("2d"),fg=front.getContext("2d");let w=1,h=1;
 resize=()=>{w=dialog.clientWidth||innerWidth;h=dialog.clientHeight||innerHeight;const dpr=Math.min(devicePixelRatio||1,1.7);for(const [c,ctx] of [[back,bg],[front,fg]]){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0)}};
 resize();window.addEventListener("resize",resize,{passive:true});title.style.opacity="1";
 let sprites;try{sprites=await loadSprites()}catch(e){console.error("Sakura artwork unavailable",e);return}
 if(token!==generation||!dialog.open||!bg||!fg||!sprites.length)return;
 let seed=728153;
 const rnd=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296};
 const mobile=w<650;
 // 3 depth planes: distant light petals, mid-ground sakura, and a few large
 // foreground petals with a softer focus. Wind speeds vary over time.
 const count=mobile?380:760;
 const petals=Array.from({length:count},(_,i)=>{
   const z=rnd(),near=z>.93,far=z<.35;
   return {z,near,far,x:rnd(),y:rnd(),angle:rnd()*tau,phase:rnd()*tau,spin:(rnd()-.5)*(near?1.5:2.2),roll:1.1+rnd()*2.6,
     size:near?42+rnd()*65:far?5+rnd()*12:13+rnd()*27,
     velocity:near?90+rnd()*75:far?20+rnd()*37:35+rnd()*65,
     drift:12+rnd()*55,sprite:i%sprites.length,opacity:far?.33+rnd()*.35:.67+rnd()*.30};
 });
 const burst=Array.from({length:mobile?150:280},(_,i)=>({p:petals[i%petals.length],a:i*2.39996323+(rnd()-.5)*.68,delay:rnd()*1.15,speed:.24+rnd()*.8,spread:rnd()*.12}));
 const softened=sprites.map(im=>{const c=document.createElement("canvas");c.width=im.width+12;c.height=im.height+12;const ctx=c.getContext("2d");ctx.filter="blur(2px)";ctx.drawImage(im,6,6);return c;});
 const gold=Array.from({length:mobile?36:90},()=>({x:rnd(),y:rnd(),r:.35+rnd()*1.15,phase:rnd()*tau,z:rnd()}));
 function paint(ctx,p,x,y,size,rot,flip,alpha){
   if(alpha<.012||x< -size*2||x>w+size*2||y< -size*2||y>h+size*2)return;
   const img=p.near&&size>55?softened[p.sprite]:sprites[p.sprite],hh=size*img.height/img.width;
   ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.scale(Math.max(.16,Math.abs(flip)),1);ctx.globalAlpha=clamp(alpha);
   ctx.drawImage(img,-size/2,-hh/2,size,hh);ctx.restore();
 }
 const wrap=(v,range)=>((v%range)+range)%range;
 function field(t,still=false){
   bg.clearRect(0,0,w,h);fg.clearRect(0,0,w,h);
   const scale=Math.max(.7,Math.min(1.3,Math.sqrt(w*h/1000000))),diag=Math.hypot(w,h);
   const gust=1+.35*Math.sin(t*.85)+.19*Math.sin(t*1.71);
   for(const p of petals){
     const travel=t*p.velocity*(.8+.2*gust),pad=120;
     const x=wrap(p.x*(w+2*pad)+travel*.91+Math.sin(t*.55+p.phase)*p.drift+Math.sin(t*.19+p.phase)*45,w+2*pad)-pad;
     const y=wrap(p.y*(h+2*pad)+travel*.57+Math.cos(t*.7+p.phase)*p.drift*.65,h+2*pad)-pad;
     const center=Math.exp(-(((x/w-.5)*2.8)**2+((y/h-.48)*2.7)**2)*3.2);
     const a=p.opacity*(1-(p.near?.97:.80)*center)*(still?1:smooth(t,.02,1.65));
     // Foreground particles cross the plane of the lettering, but thin out in its center.
     paint(p.near?fg:bg,p,x,y,p.size*scale*(.89+.13*Math.sin(t*.85+p.phase)),p.angle+t*p.spin+Math.sin(t*.58+p.phase)*.32,Math.cos(t*p.roll+p.phase),a);
   }
   if(!still&&t<6.8)for(const {p,a,delay,speed,spread} of burst){
     const age=t-delay;if(age<0)continue;
     const r=diag*(spread+speed*(1-Math.exp(-age*.53))*.77),angle=a+age*.13;
     const x=w*.5+Math.cos(angle)*r+Math.sin(age*1.8+p.phase)*28,y=h*.43+Math.sin(angle)*r*.74+age*age*5;
     paint(p.near?fg:bg,p,x,y,p.size*scale*(.65+age*.24),p.angle+age*p.spin,Math.cos(age*p.roll+p.phase),p.opacity*smooth(age,0,.45)*(1-smooth(age,3.1,5.7)));
   }
   // Subtle, dim gold motes behind the petals, never a fixed wreath.
   bg.fillStyle="#f2d79b";
   for(const p of gold){const x=wrap(p.x*w+t*(8+p.z*18),w),y=wrap(p.y*h-t*(3+p.z*8),h),a=(.15+.13*Math.sin(t*1.8+p.phase))*smooth(t,0,1.4);bg.globalAlpha=a;bg.beginPath();bg.arc(x,y,p.r,0,tau);bg.fill()}
   bg.globalAlpha=1;
 }
 if(reduced.matches){field(1.8,true);return}
 let start=null;
 function tick(now){
   if(token!==generation||!dialog.open)return;
   if(start===null)start=now;const t=(now-start)/1000;
   if(reduced.matches){field(1.8,true);title.style.opacity="1";title.style.transform="none";return}
   field(t);
   const reveal=smooth(t,.25,2.3);title.style.opacity=String(.14+.86*reveal);title.style.transform="translateY("+((1-reveal)*9)+"px) scale("+(.975+.025*reveal)+")";
   raf=requestAnimationFrame(tick);
 }
 raf=requestAnimationFrame(tick);
}
export function openSakura(){
 if(!dialog)dialog=makeDialog();
 if(!dialog.open)dialog.showModal();
 dialog.querySelector(".hs-close").focus({preventScroll:true});play();
}
