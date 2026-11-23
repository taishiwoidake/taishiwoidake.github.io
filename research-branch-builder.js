"use strict";
(() => {
  // Additive renderer for new branches only; runs before photo-garden.js.
  const root=document.querySelector(".site-root.branch-root");
  const world=document.getElementById("horizontal-world");
  if (!root || !world) return;
  const chapters=Array.from(world.querySelectorAll(":scope > .branch-chapter"));
  if (chapters.length!==5) { console.error("Exactly five chapters are required"); return; }
  const kinds=["slide-welcome","slide-garden","slide-wonders","slide-ideas","slide-connect"];
  const slides=chapters.map((item,i)=>{
    const id=item.id||("branch-"+(i+1));
    const sec=document.createElement("section");
    sec.id=id;
    sec.className="slide "+kinds[i]+" research-scene dd-scene"+(i===0?" active":"");
    sec.dataset.label=item.dataset.label||("CHAPTER "+(i+1));
    sec.setAttribute("aria-labelledby","title-"+id);
    const paper=document.createElement("div");
    paper.className="paper-texture";
    paper.setAttribute("aria-hidden","true");
    const field=document.createElement("div");
    field.className="flower-field";
    field.id="flowers-"+id;
    field.setAttribute("aria-hidden","true");
    const panel=document.createElement("div");
    panel.className="slide-inner research-inner dd-panel";
    const title=item.querySelector("h1,h2");
    if(title)title.id="title-"+id;
    while(item.firstChild)panel.appendChild(item.firstChild);
    sec.append(paper,field,panel);
    if(i===4){
      const end=document.createElement("div");
      end.className="end-note dd-end-note";
      end.innerHTML="RYUNOSUKE HIRATA / RESEARCH — © <span id='copyright-year'>2026</span>";
      sec.append(end);
    }
    return sec;
  });
  world.replaceChildren(...slides);
  root.classList.add("branch-initialised");
  const nav=document.querySelector(".site-header .top-nav");
  if(nav){
    nav.replaceChildren(...slides.map((sec,i)=>{
      const a=document.createElement("a");
      a.className="nav-link";
      a.href="#"+sec.id;
      a.textContent=sec.dataset.label;
      if(!i)a.setAttribute("aria-current","page");
      return a;
    }));
  }
})();