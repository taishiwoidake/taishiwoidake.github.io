"use strict";
(() => {
  // The high-school project is a secondary detail, not the ABOUT headline.
  const trigger=document.getElementById("school-project-open");
  const dialog=document.getElementById("school-project-dialog");
  if(!trigger||!dialog)return;
  const close=dialog.querySelector(".school-project-close");
  let returnFocus=null;
  trigger.addEventListener("click",()=>{
    if(dialog.open)return;
    returnFocus=document.activeElement;
    dialog.showModal();
  });
  close?.addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{
    if(event.target===dialog)dialog.close();
  });
  dialog.addEventListener("close",()=>{
    if(returnFocus&&returnFocus.isConnected)returnFocus.focus({preventScroll:true});
    returnFocus=null;
  });
  // The existing floral slide navigator listens to global wheel and keys.
  // Keep those inputs inside this dialog while it is open. Leave Escape to
  // the native dialog and allow scrolling long project text normally.
  window.addEventListener("wheel",event=>{
    if(!dialog.open)return;
    event.stopImmediatePropagation();
    if(!dialog.contains(event.target))event.preventDefault();
  },{capture:true,passive:false});
  window.addEventListener("keydown",event=>{
    if(!dialog.open)return;
    if(["ArrowLeft","ArrowRight","PageDown","PageUp","Home","End"," "].includes(event.key)){
      event.stopImmediatePropagation();
    }
  },true);
})();
