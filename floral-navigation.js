"use strict";
(() => {
  const root=document.querySelector(".site-root");
  const world=document.getElementById("horizontal-world");
  if(!root||!world||typeof HTMLDialogElement==="undefined")return;
  const scenes=Array.from(world.querySelectorAll(":scope > .slide"));
  if(!scenes.length)return;
  const catalog={
    "index.html":{name:"Home",short:"Home"},
    "research.html":{name:"Research Overview",short:"Research Overview"},
    "start-here.html":{name:"Start Here",short:"Start Here"},
    "research-branches.html":{name:"Research Atlas",short:"Research Atlas"},
    "researcher.html":{name:"About the Researcher",short:"Researcher"},
    "qtrac.html":{name:"Quantum Temporal Reconstruction",short:"QTRAC",group:"QUANTUM INFORMATION",intro:"What can a future observer still verify about an earlier event when access, time and memory are restricted?",question:"What evidence of an earlier event remains accessible after information has spread through a physical process?",method:"Specify the possible histories, the allowed sequence of observations, a memory budget and a verification task. Compare the best attainable guessing probabilities.",children:["quantum-memory.html","observation-order.html","future-questions.html"]},
    "quantum-memory.html":{name:"Finite Quantum Memory",short:"Quantum Memory",group:"QTRAC / MEMORY",intro:"How much information must an observer retain to answer a later question about the past?",question:"Determine when limited quantum or classical memory is sufficient for a specified verification task.",method:"Compare encodings and readouts under identical access and memory constraints; establish achievable protocols and lower bounds.",children:["observation-order.html","future-questions.html"]},
    "observation-order.html":{name:"Observation Order",short:"Observation Order",group:"QTRAC / SEQUENTIAL ACCESS",intro:"The timing and order of access can change which evidence is available for a future test.",question:"Can the same physical systems require different memory resources when encountered in different orders?",method:"Compare sequential-contact models with fixed hypotheses, resource accounting and success criteria.",children:["quantum-memory.html","future-questions.html"]},
    "future-questions.html":{name:"Unknown Future Questions",short:"Future Questions",group:"QTRAC / DELAYED VERIFICATION",intro:"How should an observer encode evidence before knowing exactly which question will be asked?",question:"A known task may need only one clue, whereas several possible later questions may require a more flexible record.",method:"Study delayed-question information games, matched classical and quantum encodings, and verification success.",children:["quantum-memory.html","observation-order.html"]},
    "ximeste-maluna.html":{name:"Ximeste–Maluna",short:"Ximeste–Maluna",group:"FINITE MATHEMATICS",intro:"A mathematical programme about the boundary between separately feasible local transformations and a common temporally compatible realisation.",question:"How do finite state-space size and allowed local operation arity affect temporal-separation phenomena?",method:"Compare explicit witnesses with combinatorial and dual obstructions. The general critical-curve classification remains a research question.",children:["critical-curve.html","probabilistic-circuits.html"]},
    "critical-curve.html":{name:"Ximeste–Maluna Critical Curve",short:"Critical Curve",group:"XIMESTE–MALUNA",intro:"A conjectural classification of temporal-separation phenomena as operation arity and state-space size vary.",question:"Which parameter pairs permit the defined temporal separation, and which are obstructed?",method:"Construct legal trajectories, prove obstructions and examine exceptional parameter pairs without treating finite checks as a general proof.",children:["ximeste-maluna.html","probabilistic-circuits.html"]},
    "probabilistic-circuits.html":{name:"Probabilistic Circuits",short:"Probabilistic Circuits",group:"FINITE MATHEMATICS / SYNTHESIS",intro:"How do fair binary choices realise exact or approximate probability transformations under finite resource constraints?",question:"What depth and memory does it take to implement a target stochastic map, particularly after repeated composition?",method:"Analyse dyadic probabilities, allowed gate families, exact rational constructions and approximation errors.",children:["critical-curve.html"]},
    "physical-records.html":{name:"Physical Records & Reversal",short:"Physical Records",group:"EXPLORATORY PHYSICS",intro:"Can an intervention leave a readable trace in matter, and what could a controlled reversal reveal about that trace?",question:"Under what conditions does a physical record survive restricted access and imperfect reversal?",method:"Model the preparation, writing operation, common evolution and measurement. Distinguish accessible information from globally retained information.",children:["thermal-records.html","directional-interference.html"]},
    "thermal-records.html":{name:"Thermal Records",short:"Thermal Records",group:"PHYSICAL INFORMATION",intro:"A physical record may be distributed across a thermal system even when it is difficult to read locally.",question:"How do thermal preparation, writing operations and restricted measurements affect later distinguishability?",method:"Analyse specified many-body dynamics, accessible reduced states and controlled readout or reversal.",children:["physical-records.html","directional-interference.html"]},
    "directional-interference.html":{name:"Directional Interference",short:"Directional Interference",group:"PHYSICAL INVERSE PROBLEMS",intro:"Averaging over directions can hide information about an interaction kernel.",question:"Can orientation-dependent reversal responses distinguish models that have similar direction-averaged signals?",method:"Compare directional curvature and interferometric observables under a stated physical model. This is exploratory theory, not an experimental discovery.",children:["physical-records.html","thermal-records.html"]},
    "publications.html":{name:"Results & Publications",short:"Results & Publications",group:"PUBLIC TECHNICAL WORK",intro:"Archived mathematical work, proof notes and finite verification records, with their evidence status distinguished.",question:"What mathematical claims have been stated in the public technical preprint, and what can be checked?",method:"Read Nested Regular Covers and Stopping Trees, its four stated theorem-facing results, exact finite certificates and reproducible source. A repository record is not peer review.",children:[]},
    "quantum-software.html":{name:"Quantum Software Verification",short:"Quantum Software",group:"COMPUTER SCIENCE",intro:"How can compiler transformations be tested for correctness against their promised quantum semantics?",question:"Does an optimisation preserve the unitary, channel or other observable specified by its contract?",method:"Use legal test inputs, reproducible version-specific cases and carefully defined equivalence oracles.",children:[]},
    "human-mobility.html":{name:"Human Mobility",short:"Human Mobility",group:"DATA-ORIENTED RESEARCH",intro:"How can movement patterns be inferred responsibly from incomplete empirical observations?",question:"Which temporal and spatial patterns are supported by data, and which depend on sampling or model assumptions?",method:"Study aggregated movement flows, observation quality, uncertainty and privacy-aware validation.",children:[]}
  };
  const groups=[
    ["ORIENTATION",["index.html","research.html","start-here.html","research-branches.html","researcher.html"]],
    ["01 / QUANTUM INFORMATION",["qtrac.html","quantum-memory.html","observation-order.html","future-questions.html"]],
    ["02 / MATHEMATICAL RESEARCH",["ximeste-maluna.html","critical-curve.html","probabilistic-circuits.html"]],
    ["03 / PHYSICAL INFORMATION",["physical-records.html","thermal-records.html","directional-interference.html"]],
    ["04 / WORK & OTHER INTERESTS",["publications.html","quantum-software.html","human-mobility.html"]]
  ];
  const page=location.pathname.split("/").pop()||"index.html";
  const current=catalog[page]||{name:document.title,short:document.title};
  const el=(tag,cls,txt)=>{
    const n=document.createElement(tag);
    if(cls)n.className=cls;
    if(txt!==undefined)n.textContent=txt;
    return n;
  };
  const btn=(cls,txt)=>{const n=el("button",cls,txt);n.type="button";return n;};
  const link=(href,cls,txt)=>{const n=el("a",cls,txt);n.href=href;return n;};
  const pad=n=>String(n).padStart(2,"0");
  const titleFor=s=>s.dataset.label||s.querySelector("h1,h2")?.textContent||s.id;
  const waypoint=btn("rh-waypoint");
  waypoint.setAttribute("aria-haspopup","dialog");
  waypoint.setAttribute("aria-controls","rh-location-menu");
  waypoint.setAttribute("aria-expanded","false");
  const glyph=el("span","rh-waypoint-icon");
  glyph.setAttribute("aria-hidden","true");
  glyph.innerHTML='<svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M5 7.5h17M5 14h13M5 20.5h17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M22 10.5v7M18.5 14h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="22" cy="14" r="1.5" fill="#f1db9d"/></svg>';
  const text=el("span","rh-waypoint-text");
  const parents={"quantum-memory.html":"QTRAC","observation-order.html":"QTRAC","future-questions.html":"QTRAC","critical-curve.html":"Ximeste–Maluna","probabilistic-circuits.html":"Mathematics","thermal-records.html":"Physical Records","directional-interference.html":"Physical Records"};
  const locationLabel=parents[page]?parents[page]+" / "+current.short:current.short;
  const pageText=el("span","rh-waypoint-page",locationLabel);
  const chapterText=el("span","rh-waypoint-chapter");
  text.append(el("span","rh-waypoint-kicker","YOU ARE HERE / MENU"),pageText,chapterText);
  waypoint.append(glyph,text);
  root.append(waypoint);
  function dialogShell(id,cls,kicker){
    const dlg=el("dialog",cls);dlg.id=id;dlg.setAttribute("aria-labelledby",id+"-title");
    const shell=el("div","rh-dialog-shell");
    const toolbar=el("div","rh-dialog-toolbar");
    const close=btn("rh-dialog-close","CLOSE ×");close.setAttribute("aria-label","Close dialog");
    toolbar.append(el("span","",kicker),close);shell.append(toolbar);dlg.append(shell);document.body.append(dlg);
    close.addEventListener("click",()=>dlg.close());
    dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close();});
    return {dlg,shell,close};
  }
  const menu=dialogShell("rh-location-menu","rh-nav-dialog","RH / RESEARCH IN BLOOM");
  const menuHeading=el("h2","rh-dialog-heading","Explore the research.");menuHeading.id=menu.dlg.id+"-title";
  const menuCurrent=el("div","rh-current-block");
  const menuCurrentName=el("strong","",parents[page]?parents[page]+" / "+current.name:current.name);
  const menuCurrentChapter=el("p");
  menuCurrent.append(el("small","","YOU ARE HERE"),menuCurrentName,menuCurrentChapter);
  const chapterGroup=el("section","rh-menu-group");
  const chapterList=el("div","rh-menu-list");
  chapterGroup.append(el("h3","","CHAPTERS ON THIS PAGE"),chapterList);
  const chapterItems=scenes.map((s,i)=>{
    const b=btn("",pad(i+1)+" / "+titleFor(s));const mark=el("span","rh-active-mark");b.append(mark);
    b.addEventListener("click",()=>{
      menu.dlg.close();
      // Delegate to the existing garden's chapter anchors: its circular petal
      // transition stays in charge, including the original active scene state.
      const a=Array.from(root.querySelectorAll(".top-nav a")).find(n=>n.hash==="#"+s.id);
      if(a){a.click();}
      else{world.scrollTo({left:i*world.clientWidth,behavior:"smooth"});}
    });
    chapterList.append(b);return {b,mark};
  });
  menu.shell.append(menuHeading,menuCurrent,chapterGroup,el("div","rh-dialog-rule","✳"));
  for(const [label,paths] of groups){
    const group=el("section","rh-menu-group");const list=el("div","rh-menu-list");
    group.append(el("h3","",label),list);
    for(const p of paths){
      const a=link(p,"",catalog[p].name);const m=el("span","rh-active-mark",p===page?"CURRENT":"↗");a.append(m);
      if(p===page){a.setAttribute("aria-current","page");a.addEventListener("click",e=>{e.preventDefault();menu.dlg.close();});}
      list.append(a);
    }
    menu.shell.append(group);
  }
  let lastScene=-1;
  function sync(){
    const active=scenes.findIndex(s=>s.classList.contains("active"));
    const i=active<0?0:active;
    if(i===lastScene)return;
    lastScene=i;
    const caption=pad(i+1)+" / "+pad(scenes.length)+" · "+titleFor(scenes[i]);
    chapterText.textContent=caption;
    menuCurrentChapter.textContent=caption;
    waypoint.setAttribute("aria-label","Open research menu. Current page: "+current.name+". Chapter: "+caption);
    waypoint.title=current.name+" — "+caption;
    chapterItems.forEach(({b,mark},k)=>{
      if(k===i){b.setAttribute("aria-current","step");mark.textContent="HERE";}
      else{b.removeAttribute("aria-current");mark.textContent="";}
    });
  }
  const observer=new MutationObserver(sync);
  scenes.forEach(s=>observer.observe(s,{attributes:true,attributeFilter:["class"]}));
  sync();
  waypoint.addEventListener("click",()=>{sync();if(!menu.dlg.open)menu.dlg.showModal();waypoint.setAttribute("aria-expanded","true");});
  menu.dlg.addEventListener("close",()=>{waypoint.setAttribute("aria-expanded","false");waypoint.focus({preventScroll:true});});
  const preview=dialogShell("rh-research-preview","rh-research-dialog","RESEARCH / EXPANDED VIEW");
  const back=btn("rh-preview-back","← BACK TO PREVIOUS RESEARCH");back.hidden=true;
  const kicker=el("span","rh-preview-kicker");
  const heading=el("h2","rh-dialog-heading");heading.id=preview.dlg.id+"-title";
  const intro=el("p","rh-dialog-intro");
  const pair=el("div","rh-preview-two");
  const left=el("section");const leftText=el("p");left.append(el("h3","","Research question"),leftText);
  const right=el("section");const rightText=el("p");right.append(el("h3","","Research approach"),rightText);pair.append(left,right);
  const topicLabel=el("span","rh-preview-kicker","RELATED RESEARCH");
  const topics=el("div","rh-preview-topics");
  const bar=el("div","rh-preview-linkbar");
  const full=link("research.html","","OPEN FULL RESEARCH PAGE ↗");
  bar.append(full);
  const body=el("div","rh-preview-body");
  preview.shell.append(back,kicker,heading,intro,el("div","rh-dialog-rule","✦"),pair,topicLabel,topics,bar,body);
  const cache=new Map();let version=0,history=[],activePreview="",returnFocus=null;
  const normalize=s=>s.replace(/\s+/g," ").trim();
  // Render only readable source content, without importing original scripts,
  // animation classes, image layers, or arbitrary HTML into the popup.
  function readable(n){
    if(n.nodeType===Node.TEXT_NODE)return document.createTextNode(n.textContent);
    if(n.nodeType!==Node.ELEMENT_NODE)return document.createDocumentFragment();
    const tag=n.tagName.toLowerCase();
    const safe=["sup","sub","em","strong","b","i","code","br"].includes(tag);
    const out=safe?document.createElement(tag):document.createDocumentFragment();
    for(const child of n.childNodes)out.append(readable(child));
    return out;
  }
  async function loadChapters(path,token){
    body.replaceChildren(el("p","rh-preview-status","Loading the research chapters…"));
    try{
      let data=cache.get(path);
      if(!data){
        const response=await fetch(path,{credentials:"same-origin"});
        if(!response.ok)throw Error("Research page unavailable");
        const doc=new DOMParser().parseFromString(await response.text(),"text/html");
        const list=Array.from(doc.querySelectorAll("#horizontal-world > .slide, #horizontal-world > .branch-chapter"));
        if(list.length!==5)throw Error("Unexpected chapter count");
        data=list.map((s,i)=>{
          const title=s.querySelector("h1,h2");
          const titleClone=title?.cloneNode(true);
          titleClone?.querySelectorAll("br").forEach(b=>b.replaceWith(" "));
          const content=Array.from(s.querySelectorAll("p, h3, .dd-maths, .dd-maths-note"))
            .filter(n=>normalize(n.textContent).length>0&&!n.closest(".dd-records,.branch-end-links,.dd-page-links,.dd-discipline"));
          return {id:s.id,title:normalize(titleClone?.textContent||titleFor(s)),label:s.dataset.label||pad(i+1),content};
        });
        cache.set(path,data);
      }
      if(token!==version||!preview.dlg.open)return;
      body.replaceChildren(el("span","rh-preview-kicker","READ THE FULL RESEARCH EXPLANATION"));
      for(const [i,c] of data.entries()){
        const details=el("details");
        const summary=el("summary","",pad(i+1)+" · "+c.title);
        const content=el("div","rh-preview-chapter");
        for(const n of c.content){
          const copy=el(n.tagName==="H3"?"h4":"p",n.classList.contains("dd-maths")?"rh-preview-formula":"");
          for(const child of n.childNodes)copy.append(readable(child));
          content.append(copy);
        }
        content.append(link(path+"#"+c.id,"rh-preview-source","OPEN THIS CHAPTER ON THE FULL PAGE ↗"));
        details.append(summary,content);
        body.append(details);
      }
    }catch(err){
      if(token===version&&preview.dlg.open)body.replaceChildren(el("p","rh-preview-status","The extended chapters could not be loaded. Use the full research page link above."));
    }
  }
  function show(path,push=true){
    const info=catalog[path];if(!info?.intro)return;
    if(push&&activePreview&&activePreview!==path)history.push(activePreview);
    activePreview=path;
    back.hidden=!history.length;
    kicker.textContent=info.group;
    heading.textContent=info.name;
    intro.textContent=info.intro;
    leftText.textContent=info.question;
    rightText.textContent=info.method;
    full.href=path;
    topics.replaceChildren();
    topicLabel.hidden=!info.children.length;topics.hidden=!info.children.length;
    for(const child of info.children){
      const b=btn("",catalog[child].name+" ↗");b.addEventListener("click",()=>show(child));topics.append(b);
    }
    if(!preview.dlg.open){returnFocus=document.activeElement;preview.dlg.showModal();}
    preview.dlg.scrollTop=0;
    loadChapters(path,++version);
  }
  back.addEventListener("click",()=>{const p=history.pop();if(p)show(p,false);});
  preview.dlg.addEventListener("close",()=>{
    version++;history=[];activePreview="";back.hidden=true;
    if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});returnFocus=null;
  });
  function previewPath(a){
    if(!a||!a.closest("#horizontal-world")||a.target==="_blank"||a.hasAttribute("download"))return null;
    const u=new URL(a.href,location.href);
    if(u.origin!==location.origin||u.hash||u.search)return null;
    const p=u.pathname.split("/").pop();
    return p!==page&&catalog[p]?.intro?p:null;
  }
  // Keep the real href for crawlers, modifier-click, and non-JavaScript fallback.
  for(const a of world.querySelectorAll("a[href]")){
    if(previewPath(a)){a.setAttribute("aria-haspopup","dialog");a.title="Preview research details: "+catalog[previewPath(a)].name;}
  }
  document.addEventListener("click",e=>{
    if(e.defaultPrevented||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
    const a=e.target.closest?.("a[href]");const p=previewPath(a);
    if(p){e.preventDefault();show(p);}
  });
  // Native modal scroll and keyboard handling take precedence over the
  // unchanged global garden wheel/keyboard navigation while either is open.
  function modalOpen(){return menu.dlg.open||preview.dlg.open;}
  window.addEventListener("wheel",e=>{if(modalOpen())e.stopImmediatePropagation();},{capture:true,passive:true});
  window.addEventListener("keydown",e=>{
    if(modalOpen()&&["ArrowLeft","ArrowRight","PageDown","PageUp","Home","End"," "].includes(e.key))e.stopImmediatePropagation();
  },true);
})();