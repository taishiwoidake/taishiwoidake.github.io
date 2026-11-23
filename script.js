"use strict";
(() => {
  const world = document.getElementById("horizontal-world");
  if (!world) return;
  const slides = Array.from(world.querySelectorAll(".slide"));
  const root = document.querySelector(".site-root");
  const counter = document.getElementById("scene-counter");
  const progress = document.querySelector("#scene-progress span");
  const nav = Array.from(document.querySelectorAll(".nav-link"));
  const prev = document.getElementById("previous");
  const next = document.getElementById("next");
  const hint = document.getElementById("scroll-hint");
  const year = document.getElementById("copyright-year");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (year) year.textContent = String(new Date().getFullYear());

  // Botanical illustrations are original, programmatically constructed vector artwork.
  // Distinct silhouettes represent, rather than scientifically reproduce, flowering plants.
  const SPECIES = {
    fritillaria: ["#9c6483","#e7b1c2","#5d3d69","bell"],
    jadevine: ["#3cae9a","#b2ead7","#1e7168","jade"],
    batflower: ["#473345","#a07987","#241d33","bat"],
    meconopsis: ["#638dc7","#c7d7f0","#37588a","radial"],
    passionflower: ["#9675b3","#e6daf0","#5f537e","passion"],
    bleedingheart: ["#c9577f","#f4b4c4","#903e5c","hearts"],
    protea: ["#c57c75","#f1c0a4","#8c505a","protea"],
    gloriosa: ["#e1744a","#f4cd7e","#ab3b42","flame"],
    anemone: ["#91609f","#e1bfdc","#694174","radial"],
    hellebore: ["#95a87d","#d8dfad","#667b5d","radial"],
    nigella: ["#7997c3","#dceaff","#4a6d9f","nigella"],
    orchid: ["#bb78aa","#f2d5e9","#86507d","orchid"],
    iris: ["#806ea9","#c5c3e1","#514c85","iris"],
    hoya: ["#ca92b3","#f6dde4","#8e6188","hoya"],
    blueholly: ["#678dac","#bdcfdc","#4d6980","holly"],
    columbine: ["#bb7494","#efd1df","#785479","columbine"],
    foxglove: ["#a5759c","#e3b7d0","#774d80","foxglove"],
    lotus: ["#e1a9b8","#fff0e5","#c37e92","radial"],
    strawflower: ["#dda365","#f6dc9e","#b57955","daisy"],
    echinacea: ["#c17e99","#edb5b6","#834d6f","daisy"],
    birdparadise: ["#d7803f","#ffcf78","#3e7396","bird"],
    allium: ["#a48ac8","#ded6eb","#775f95","globe"],
    snowdrop: ["#dfe8d5","#ffffff","#a0be99","bell"],
    chocolatecosmos: ["#8d4058","#c47883","#532b46","radial"],
    calceolaria: ["#e2a048","#fbe09b","#ba684a","pouch"],
    seaaster: ["#9886b8","#e8dcf3","#74679c","daisy"]
  };

  // Flowers are distributed on all four edges. The center stays open for readable copy.
  const collections = {
    welcome: ["fritillaria","meconopsis","protea","gloriosa","anemone","hoya","columbine","nigella","iris","lotus","hellebore","chocolatecosmos","jadevine","strawflower","allium","orchid","echinacea","foxglove","passionflower","snowdrop","blueholly","birdparadise","seaaster","bleedingheart","calceolaria","batflower","meconopsis","fritillaria"],
    garden: ["hellebore","hoya","jadevine","fritillaria","lotus","columbine","orchid","foxglove","gloriosa","passionflower","snowdrop","iris","seaaster","allium","meconopsis","strawflower","echinacea","nigella","blueholly","protea","bleedingheart","birdparadise","chocolatecosmos","pouch","calceolaria","anemone","hoya","hellebore","lotus","columbine"],
    wonders: ["batflower","fritillaria","jadevine","meconopsis","protea","nigella","calceolaria","orchid","gloriosa","columbine","blueholly","hoya","passionflower","bleedingheart","iris","birdparadise","foxglove","hellebore","allium","seaaster","snowdrop","chocolatecosmos","strawflower","echinacea","lotus","anemone","batflower","jadevine","fritillaria","meconopsis","protea","nigella"],
    ideas: ["nigella","hellebore","orchid","meconopsis","fritillaria","lotus","allium","strawflower","hoya","passionflower","columbine","foxglove","gloriosa","blueholly","jadevine","anemone","seaaster","snowdrop","calceolaria","protea","echinacea","iris","bleedingheart","chocolatecosmos","fritillaria","hellebore"],
    connect: ["jadevine","hoya","snowdrop","hellebore","lotus","nigella","columbine","fritillaria","allium","blueholly","seaaster","orchid","meconopsis","gloriosa","passionflower","birdparadise","calceolaria","protea","strawflower","anemone","echinacea","bleedingheart","iris","foxglove","chocolatecosmos","batflower","hoya","lotus","snowdrop","jadevine"]
  };
  // Correct any missing shorthand so every vignette has a defined plant.
  collections.garden = collections.garden.filter(id => SPECIES[id]);

  function rng(seed) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = rng(614127);
  const round = x => Math.round(x * 100) / 100;
  const circle = (x,y,r,fill,other="") => '<circle cx="'+round(x)+'" cy="'+round(y)+'" r="'+round(r)+'" fill="'+fill+'" '+other+'/>';
  const path = (d,fill,other="") => '<path d="'+d+'" fill="'+fill+'" '+other+'/>';
  const rot = (angle,x=130,y=95) => 'rotate('+round(angle)+' '+x+' '+y+')';
  function ellipse(cx,cy,rx,ry,fill,other="") { return '<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+other+'/>'; }

  function radialPetals(n, size, petal, edge, variations=0) {
    let out = "";
    for (let k=0;k<n;k++) {
      const a = k*360/n;
      const vary = Math.sin(k*2.77+variations)*7;
      const w = size*.34 + vary*.4;
      const h = size*.90 + vary;
      const d = 'M130 99 C'+round(130-w)+' '+round(98-h*.22)+' '+round(130-w*1.36)+' '+round(95-h*.66)+' 130 '+round(97-h)+' C'+round(130+w*1.36)+' '+round(95-h*.66)+' '+round(130+w)+' '+round(98-h*.22)+' 130 99Z';
      out += '<g transform="'+rot(a)+'">'+path(d,petal,'stroke="'+edge+'" stroke-opacity=".5" stroke-width="1.1"')+'</g>';
    }
    return out;
  }
  function flowerHeart(petal) {
    let s = circle(130,100,14,'url(#CENTER)','stroke="#fff2cc" stroke-opacity=".62" stroke-width="2"');
    for(let i=0;i<12;i++){
      const a=i*30*Math.PI/180;
      const x=130+Math.cos(a)*18,y=100+Math.sin(a)*18;
      s+=circle(x,y,1.6,petal);
    }
    return s;
  }
  function showyRadial(n=6,size=91) {
    return '<g class="flutter">'+radialPetals(n,size,'url(#PETAL)','url(#EDGE)',.7)+flowerHeart('#fff2c2')+'</g>';
  }
  function daisy() {
    let s='<g class="flutter">';
    for(let i=0;i<21;i++){
      const a=i*360/21;
      s+='<g transform="'+rot(a)+'">'+path('M130 96 Q117 65 127 22 Q136 8 138 23 Q143 67 130 96Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1" stroke-opacity=".57"')+'</g>';
    }
    s+=circle(130,97,21,'url(#CENTER)','stroke="#8a6b49" stroke-opacity=".4" stroke-width="1"');
    for(let i=0;i<16;i++){const a=i*2.399;s+=circle(130+Math.cos(a)*(Math.sqrt(i)*4.25),97+Math.sin(a)*(Math.sqrt(i)*4.25),2.3,'#f1d69b');}
    return s+'</g>';
  }
  function nigella() {
    let s='<g class="flutter">';
    for(let i=0;i<5;i++)s+='<g transform="'+rot(i*72)+'">'+path('M130 102 C100 82 99 49 130 15 C155 56 150 82 130 102Z','url(#PETAL)','stroke="#dae7ef" stroke-opacity=".6" stroke-width="1.7"')+'</g>';
    s+=circle(130,98,13,'url(#CENTER)');
    for(let i=0;i<32;i++){
      const a=i*Math.PI*2/32,x=130+Math.cos(a)*13,y=98+Math.sin(a)*13;
      const x2=130+Math.cos(a)*(44+i%5*4),y2=98+Math.sin(a)*(44+i%5*4);
      s+=path('M'+round(x)+' '+round(y)+' Q'+round(x2+6)+' '+round(y2-4)+' '+round(x2)+' '+round(y2),'none','stroke="#79ae98" stroke-width="1.25" stroke-linecap="round"');
    }
    return s+'</g>';
  }
  function bell() {
    let s = '<g class="flutter">';
    s += path('M130 75 Q130 48 122 36','none','stroke="#648764" stroke-width="4" stroke-linecap="round"');
    s += path('M95 67 C91 86 96 111 106 137 Q117 123 127 140 Q140 124 152 139 C165 118 171 87 162 65 Q132 89 95 67Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="2"');
    s += path('M94 68 Q130 82 164 67','none','stroke="#edf1d3" stroke-opacity=".7" stroke-width="2"');
    for(let i=0;i<5;i++){
      s+=path('M'+(100+i*12)+' 86 Q'+(107+i*12)+' 102 '+(99+i*12)+' 120','none','stroke="#674e6b" stroke-opacity=".38" stroke-width="2"');
    }
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){
      const x=104+col*11+(row%2?5:0),y=91+row*13;
      s+='<rect x="'+x+'" y="'+y+'" width="6" height="7" fill="#69465e" fill-opacity=".25" transform="rotate(45 '+(x+3)+' '+(y+3)+')"/>';
    }
    s+=circle(126,141,3,'#e8dbb4')+'</g>';
    return s;
  }
  function jade() {
    let s='<g class="flutter">';
    s+=path('M111 36 C134 79 108 135 138 220','none','stroke="#467f69" stroke-width="3.5"');
    for(let i=0;i<11;i++){
      const y=62+i*14,side=i%2?-1:1,x=122+Math.sin(i*.69)*8;
      s+=path('M'+x+' '+y+' q'+(side*30)+' 1 '+(side*22)+' 24 q'+(-side*7)+' 17 '+(-side*15)+' 16 q'+(-side*4)+' -16 '+(side*8)+' -32 Q'+x+' '+y+' '+x+' '+y+'Z','url(#PETAL)','stroke="#bcf4de" stroke-opacity=".6" stroke-width="1"');
      s+=circle(x+side*22,y+24,2.5,'#d5fbe5');
    }
    return s+'</g>';
  }
  function hearts() {
    let s='<g class="flutter">';
    s+=path('M75 39 C117 18 171 40 187 91','none','stroke="#678668" stroke-width="4"');
    for(let i=0;i<5;i++){
      const x=85+i*24,y=40+Math.sin(i/4*Math.PI)*6;
      s+=path('M'+x+' '+(y+4)+' v'+(22+i*4),'none','stroke="#698464" stroke-width="2"');
      const yy=y+23+i*4;
      s+=path('M'+x+' '+(yy+43)+' C'+(x-40)+' '+(yy+18)+' '+(x-27)+' '+(yy-6)+' '+x+' '+(yy+6)+' C'+(x+25)+' '+(yy-6)+' '+(x+38)+' '+(yy+18)+' '+x+' '+(yy+43)+'Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.5"');
      s+=path('M'+x+' '+(yy+30)+' l0 19','none','stroke="#ffeddb" stroke-opacity=".8" stroke-width="3"');
    }
    return s+'</g>';
  }
  function protea() {
    let s='<g class="flutter">';
    for(let i=0;i<28;i++){
      const a=i*360/28;
      s+='<g transform="'+rot(a)+'">'+path('M130 95 Q118 39 130 9 Q143 40 130 95Z','url(#PETAL)','stroke="url(#EDGE)" stroke-opacity=".64" stroke-width="1"')+'</g>';
    }
    s+=ellipse(130,98,49,54,'url(#CENTER)','stroke="#b88978" stroke-width="1.5"');
    for(let i=0;i<90;i++){
      const a=i*2.39996,r=Math.sqrt(i/90)*45;
      s+=circle(130+Math.cos(a)*r,98+Math.sin(a)*r,2.1,i%3===0?'#fff0cd':'#e4b49f');
    }
    return s+'</g>';
  }
  function passion() {
    let s='<g class="flutter">'+radialPetals(10,81,'url(#PETAL)','url(#EDGE)',.4);
    for(let i=0;i<50;i++){
      const a=i*2*Math.PI/50,r1=25,r2=73+Math.sin(i*1.82)*9;
      s+=path('M'+round(130+Math.cos(a)*r1)+' '+round(97+Math.sin(a)*r1)+' L'+round(130+Math.cos(a)*r2)+' '+round(97+Math.sin(a)*r2),'none','stroke="'+(i%3===0?'#52487f':'#f2f1dd')+'" stroke-width="2.5" stroke-linecap="round"');
    }
    s+=circle(130,97,20,'url(#CENTER)');
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5;
      s+=path('M130 97 L'+round(130+Math.cos(a)*37)+' '+round(97+Math.sin(a)*37),'none','stroke="#6d8b72" stroke-width="3"');
      s+=ellipse(130+Math.cos(a)*37,97+Math.sin(a)*37,6,3,'#e8dcb3','transform="'+rot(i*72+90,130+Math.cos(a)*37,97+Math.sin(a)*37)+'"');
    }
    return s+'</g>';
  }
  function orchid() {
    let s='<g class="flutter">';
    for(const a of [0,55,-55,122,-122]){
      s+='<g transform="'+rot(a)+'">'+path('M130 100 C97 65 104 22 130 14 C161 34 160 68 130 100Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.9"')+'</g>';
    }
    s+=path('M111 95 Q84 122 114 147 Q132 156 145 138 Q171 119 150 96 Q137 125 130 121 Q124 120 111 95Z','url(#CENTER)','stroke="url(#EDGE)" stroke-width="2"');
    s+=path('M129 105 Q122 119 129 137','none','stroke="#d68ba4" stroke-width="3"');
    return s+'</g>';
  }
  function bat() {
    let s='<g class="flutter">';
    s+=path('M130 77 C98 25 55 42 20 56 C49 66 40 112 93 109 Q112 96 130 77Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="2"');
    s+=path('M130 77 C162 25 205 42 240 56 C211 66 220 112 167 109 Q148 96 130 77Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="2"');
    s+=path('M91 80 Q129 101 169 80 Q162 132 130 160 Q98 130 91 80Z','url(#CENTER)','stroke="#ba8d9b" stroke-width="1.5"');
    for(let i=0;i<10;i++){
      const x=100+i*7;
      s+=path('M'+x+' 113 Q'+(90+i*11)+' 165 '+(35+i*19)+' '+(183+i%3*20),'none','stroke="#8e788b" stroke-width="1.5" stroke-linecap="round"');
    }
    return s+'</g>';
  }
  function flame() {
    let s='<g class="flutter">';
    for(let i=0;i<6;i++){
      const a=-85+i*34;
      s+='<g transform="'+rot(a)+'">'+path('M130 104 C103 73 116 33 145 5 Q145 53 141 85 L130 104Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.7"')+'</g>';
    }
    for(let i=0;i<6;i++){
      const a=i*2*Math.PI/6;
      s+=path('M130 109 Q'+round(130+Math.cos(a)*40)+' '+round(90+Math.sin(a)*40)+' '+round(130+Math.cos(a)*70)+' '+round(55+Math.sin(a)*52),'none','stroke="#ad875a" stroke-width="2"');
      s+=ellipse(130+Math.cos(a)*70,55+Math.sin(a)*52,5,3,'#d7aa69');
    }
    return s+'</g>';
  }
  function bird() {
    let s='<g class="flutter">';
    s+=path('M75 110 L177 76 L154 116 L77 126Z','#4c789d','stroke="#7599bc" stroke-width="2"');
    s+=path('M128 99 Q124 48 180 11 Q168 58 128 99Z','url(#PETAL)');
    s+=path('M118 104 Q89 54 102 19 Q123 51 118 104Z','url(#PETAL)');
    s+=path('M141 105 Q151 56 203 40 Q174 72 141 105Z','url(#PETAL)');
    s+=path('M85 114 Q129 130 172 109','none','stroke="#376588" stroke-width="8" stroke-linecap="round"');
    return s+'</g>';
  }
  function holly() {
    let s='<g class="flutter">';
    for(let i=0;i<18;i++){
      s+='<g transform="'+rot(i*20)+'">'+path('M130 105 L119 78 L127 82 L130 22 L137 82 L144 75 Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.3"')+'</g>';
    }
    s+=ellipse(130,100,20,28,'url(#CENTER)');
    for(let i=0;i<32;i++){const a=i*2.399;rnd: {const r=Math.sqrt(i/32)*20;s+=circle(130+Math.cos(a)*r,100+Math.sin(a)*r,1.6,'#d2e7e1');}}
    return s+'</g>';
  }
  function globe() {
    let s='<g class="flutter">';
    for(let i=0;i<80;i++){
      const a=i*2.39996,r=Math.sqrt(i/80)*68,x=130+Math.cos(a)*r,y=96+Math.sin(a)*r;
      const radius=2.5+(i%4);
      s+=circle(x,y,radius,'url(#PETAL)','stroke="url(#EDGE)" stroke-opacity=".6" stroke-width=".6"');
      if(i%5===0)s+=circle(x,y,1.4,'#fcf0d8');
    }
    return s+'</g>';
  }
  function hoya() {
    let s='<g class="flutter">';
    for(let i=0;i<11;i++){
      const a=i*2.4,r=Math.sqrt(i/11)*55,cx=130+Math.cos(a)*r,cy=97+Math.sin(a)*r;
      for(let j=0;j<5;j++){
        const angle=j*72;
        s+='<g transform="translate('+round(cx)+' '+round(cy)+') rotate('+angle+')">'+path('M0 1 Q-11 -10 0 -17 Q11 -10 0 1Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1"')+'</g>';
      }
      s+=circle(cx,cy,4,'#f8ecd2');
    }
    return s+'</g>';
  }
  function iris() {
    let s='<g class="flutter">';
    for(let i=0;i<3;i++){
      s+='<g transform="'+rot(i*120)+'">'+path('M130 102 Q88 70 124 10 Q159 42 130 102Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.6"')+'</g>';
    }
    for(let i=0;i<3;i++){
      s+='<g transform="'+rot(i*120+60)+'">'+path('M130 100 C111 114 101 165 131 183 C157 154 152 121 130 100Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="2"')+'</g>';
    }
    s+=circle(130,100,10,'url(#CENTER)');return s+'</g>';
  }
  function columbine() {
    let s='<g class="flutter">';
    for(let i=0;i<5;i++){
      const a=i*72;s+='<g transform="'+rot(a)+'">';
      s+=path('M130 96 Q109 61 118 40 Q129 18 143 41 Q157 67 130 96Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.5"');
      s+=path('M130 69 C120 44 106 22 122 8','none','stroke="url(#EDGE)" stroke-width="3" stroke-linecap="round"');
      s+='</g>';
    }
    s+=circle(130,96,15,'url(#CENTER)');return s+'</g>';
  }
  function foxglove() {
    let s='<g class="flutter">';
    s+=path('M130 20 Q150 103 126 222','none','stroke="#7e996e" stroke-width="4"');
    for(let i=0;i<9;i++){
      const side=i%2?-1:1,y=39+i*18,x=130+Math.sin(i*.74)*9;
      s+=path('M'+x+' '+y+' q'+(side*35)+' -2 '+(side*27)+' 18 q'+(-side*4)+' 22 '+(-side*21)+' 26 q'+(-side*10)+' -20 '+(-side*6)+' -39Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.6"');
      s+=circle(x+side*30,y+21,3,'#f0c9ac');
    }
    return s+'</g>';
  }
  function pouch() {
    let s='<g class="flutter">';
    s+=path('M130 65 C106 31 83 56 94 83 Q130 94 163 84 C171 54 148 34 130 65Z','url(#PETAL)');
    s+=path('M129 78 C82 91 80 143 129 152 C183 150 179 97 129 78Z','url(#PETAL)','stroke="url(#EDGE)" stroke-width="1.8"');
    for(let i=0;i<7;i++)s+=circle(102+i*9,107+(i%3)*8,2.5,'#c8774d');
    s+=path('M104 94 Q130 102 156 94','none','stroke="#fff0c2" stroke-width="3"');
    return s+'</g>';
  }

  const bloomByType = {
    radial: () => showyRadial(7,95),
    daisy, nigella, bell, jade, hearts, protea, passion, orchid, bat, flame, bird, holly, globe, hoya, iris, columbine, foxglove, pouch
  };

  function flowerSVG(id, unique) {
    const spec=SPECIES[id]||SPECIES.hellebore;
    const gradId='f'+unique;
    // Replace per-illustration gradient placeholders to avoid SVG ID collisions.
    const defs='<defs>'+
      '<linearGradient id="'+gradId+'p" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+spec[1]+'"/><stop offset=".5" stop-color="'+spec[0]+'"/><stop offset="1" stop-color="'+spec[2]+'"/></linearGradient>'+
      '<linearGradient id="'+gradId+'e" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+spec[1]+'"/><stop offset="1" stop-color="'+spec[2]+'"/></linearGradient>'+
      '<radialGradient id="'+gradId+'c"><stop stop-color="#f9f0c9"/><stop offset=".4" stop-color="'+spec[1]+'"/><stop offset="1" stop-color="'+spec[2]+'"/></radialGradient>'+
      '<linearGradient id="'+gradId+'l" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c1dca3"/><stop offset=".44" stop-color="#6d9c73"/><stop offset="1" stop-color="#315942"/></linearGradient>'+
    '</defs>';
    let leaves = '<g stroke-linecap="round">'+path('M132 298 Q111 205 133 101','none','stroke="#658f6b" stroke-width="4"')+
       path('M127 238 C80 212 62 186 44 175 Q49 236 127 245Z','url(#LEAF)','stroke="#3e7154" stroke-opacity=".65" stroke-width="1.4"')+
       path('M131 209 C184 189 200 156 221 147 Q208 209 133 218Z','url(#LEAF)','stroke="#3e7154" stroke-opacity=".65" stroke-width="1.4"')+
       path('M47 176 Q82 209 125 241 M220 147 Q183 185 132 216','none','stroke="#dce4b9" stroke-opacity=".42" stroke-width="1.1"')+
       path('M130 281 Q99 272 85 260 Q100 286 133 289Z','url(#LEAF)')+'</g>';
    if(['jade','hearts','foxglove','globe'].includes(spec[3])) {
      leaves='<g>'+path('M132 298 Q147 235 134 103','none','stroke="#72916c" stroke-width="4"')+
        path('M128 254 Q75 238 67 207 Q113 214 134 255Z','url(#LEAF)','stroke="#5c896c" stroke-width="1"')+
        path('M135 221 Q181 211 205 180 Q190 237 132 229Z','url(#LEAF)','stroke="#5c896c" stroke-width="1"')+'</g>';
    }
    const bloom = (bloomByType[spec[3]]||bloomByType.radial)();
    return ('<svg viewBox="0 0 260 310" xmlns="http://www.w3.org/2000/svg" role="presentation" aria-hidden="true">'+defs+leaves+bloom+'</svg>')
      .replaceAll('url(#PETAL)','url(#'+gradId+'p)')
      .replaceAll('url(#EDGE)','url(#'+gradId+'e)')
      .replaceAll('url(#CENTER)','url(#'+gradId+'c)')
      .replaceAll('url(#LEAF)','url(#'+gradId+'l)');
  }
  let total=0;
  for(const scene of slides) {
    const field=scene.querySelector('.flower-field');
    if(!field)continue;
    const species=collections[scene.id]||collections.welcome;
    const flowerDoc=document.createDocumentFragment();
    species.forEach((id,i)=>{
      if (!SPECIES[id]) return;
      const side=i%4;
      let x,y;
      if(side===0){ x=-10+rand()*23; y=-18+rand()*109; }
      else if(side===1){ x=82+rand()*25; y=-20+rand()*112; }
      else if(side===2){ x=8+rand()*84; y=-42+rand()*20; }
      else { x=7+rand()*85; y=69+rand()*40; }
      // A little variety without crowding the center copy.
      const width=130+rand()*148;
      const size=.76+rand()*.49;
      const turn=(rand()-.5)*53;
      const flower=document.createElement('div');
      flower.className='flower '+(i%5===0?'front':i%4===1?'back':'mid');
      flower.dataset.species=id;
      if(i%4===3||i%7===0)flower.dataset.mobile='hide';
      const from=[[-115,rand()*130-65],[115,rand()*130-65],[rand()*110-55,-135],[rand()*110-55,135]][side];
      flower.style.setProperty('--x',round(x)+'%');
      flower.style.setProperty('--y',round(y)+'%');
      flower.style.setProperty('--w',round(width)+'px');
      flower.style.setProperty('--scale',round(size));
      flower.style.setProperty('--rotation',round(turn)+'deg');
      flower.style.setProperty('--opacity',round(.75+rand()*.25));
      flower.style.setProperty('--from-x',round(from[0])+'vw');
      flower.style.setProperty('--from-y',round(from[1])+'vh');
      flower.style.setProperty('--delay',Math.round(rand()*560)+'ms');
      flower.style.setProperty('--float-delay',round(-rand()*6)+'s');
      flower.style.setProperty('--layer',i%5===0?'3':'2');
      flower.innerHTML=flowerSVG(id,total++);
      flowerDoc.appendChild(flower);
    });
    field.appendChild(flowerDoc);
  }

  let current=0;
  let scheduled=false;
  const pad2=n=>String(n).padStart(2,'0');
  function updateActive(i) {
    const nextIndex=Math.max(0,Math.min(slides.length-1,i));
    if(nextIndex===current && document.body.classList.contains("motion"))return;
    current=nextIndex;
    slides.forEach((section,k)=>section.classList.toggle("active",k===current));
    root.classList.toggle("is-dark",current===slides.length-1);
    if(counter)counter.innerHTML=pad2(current+1)+' <span>/</span> '+pad2(slides.length)+' <small>'+slides[current].dataset.label+'</small>';
    if(progress)progress.style.transform='scaleX('+((current+1)/slides.length)+')';
    if(prev)prev.disabled=current===0;
    if(next)next.disabled=current===slides.length-1;
    nav.forEach(link=>link.setAttribute('aria-current',link.hash==='#'+slides[current].id?'page':'false'));
    if(hint)hint.classList.toggle('hidden',current>0);
  }
  function go(i) {
    const n=Math.max(0,Math.min(slides.length-1,i));
    world.scrollTo({left:n*world.clientWidth,behavior:reduce?'auto':'smooth'});
    updateActive(n);
  }
  if(prev)prev.addEventListener('click',()=>go(current-1));
  if(next)next.addEventListener('click',()=>go(current+1));
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener('click',event=>{
      const id=link.getAttribute('href').slice(1);
      const i=slides.findIndex(s=>s.id===id);
      if(i<0)return;
      event.preventDefault();
      go(i);
    });
  });
  world.addEventListener('scroll',()=>{
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      updateActive(Math.round(world.scrollLeft/Math.max(world.clientWidth,1)));
    });
  },{passive:true});
  let lastWheel=0;
  window.addEventListener('wheel',event=>{
    if(event.ctrlKey||event.metaKey)return;
    if(Math.abs(event.deltaY)<5||Math.abs(event.deltaX)>Math.abs(event.deltaY)*1.05)return;
    event.preventDefault();
    const now=performance.now();
    if(now-lastWheel<670)return;
    const dir=event.deltaY>0?1:-1;
    const at=Math.round(world.scrollLeft/Math.max(world.clientWidth,1));
    const requested=Math.max(0,Math.min(slides.length-1,at+dir));
    if(requested!==at){lastWheel=now;go(requested);}
  },{passive:false});
  window.addEventListener('keydown',event=>{
    if(event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='ArrowRight'||event.key==='PageDown'){event.preventDefault();go(current+1);}
    if(event.key==='ArrowLeft'||event.key==='PageUp'){event.preventDefault();go(current-1);}
    if(event.key==='Home'){event.preventDefault();go(0);}
    if(event.key==='End'){event.preventDefault();go(slides.length-1);}
  });
  window.addEventListener('resize',()=>world.scrollTo({left:current*world.clientWidth,behavior:'auto'}),{passive:true});
  requestAnimationFrame(()=>{
    updateActive(0);
    document.body.classList.add('motion');
    // On load from a section link, show that slide directly.
    const target=decodeURIComponent(location.hash.slice(1));
    const targetIndex=slides.findIndex(slide=>slide.id===target);
    if(targetIndex>0)go(targetIndex);
  });
})();