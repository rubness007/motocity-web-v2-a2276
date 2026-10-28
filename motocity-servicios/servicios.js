(()=>{
const root=document.getElementById('mc-services-concept');
if(!root||root.dataset.initialized)return;root.dataset.initialized='true';
const tabs=Array.from(root.querySelectorAll('[role=tab]'));
const panels=Array.from(root.querySelectorAll('[role=tabpanel]'));
const toggle=root.querySelector('.autoplay-toggle');
const fill=root.querySelector('.indicator-fill');
const line=root.querySelector('.indicator');
const motion=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,elapsed=0,last=0,visible=false,hover=false,focus=false,manual=motion.matches;
const duration=8000;
function paused(){return manual||hover||focus||!visible||document.hidden;}
function display(){toggle.textContent=manual?'Reanudar':'Pausar';toggle.setAttribute('aria-label',manual?'Reanudar avance automático':'Pausar avance automático');}
function select(index,moveFocus){current=index;elapsed=0;tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;panels[i].classList.remove('enter');});line.style.transform=`translateX(${index*100}%)`;fill.style.transform='scaleX(0)';tabs.forEach(t=>t.style.setProperty('--service-progress','0%'));void panels[index].offsetWidth;panels[index].classList.add('enter');if(moveFocus)tabs[index].focus();}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>select(i,false));tab.addEventListener('keydown',e=>{let n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(n,true);});});
toggle.addEventListener('click',()=>{manual=!manual;display();});
root.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true;});root.addEventListener('pointerleave',()=>{hover=false;});
root.addEventListener('focusin',e=>{focus=e.target.matches(':focus-visible');});root.addEventListener('pointerdown',()=>{focus=false;});root.addEventListener('focusout',()=>{setTimeout(()=>{focus=root.contains(document.activeElement)&&document.activeElement.matches(':focus-visible');},0);});
new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);last=0;},{threshold:.3}).observe(root);
document.addEventListener('visibilitychange',()=>{last=0;});
function frame(now){if(last&&!paused()){elapsed+=Math.min(now-last,100);if(elapsed>=duration)select((current+1)%tabs.length,false);}last=now;const p=Math.min(elapsed/duration,1);fill.style.transform=`scaleX(${p})`;tabs[current].style.setProperty('--service-progress',`${p*100}%`);requestAnimationFrame(frame);}
motion.addEventListener('change',e=>{if(e.matches){manual=true;display();}});
display();requestAnimationFrame(frame);
})();

/* Enlaces del sitio a #express, #gestion, #financiero y #corporativo: seleccionan ese servicio en el bloque */
(()=>{
const root=document.getElementById('mc-services-concept');
if(!root)return;
const ids=['express','gestion','financiero','corporativo'];
function fromHash(){
  const i=ids.indexOf(location.hash.slice(1));
  if(i<0)return;
  const tab=root.querySelector('[data-index="'+i+'"]');
  if(tab)tab.click();
}
addEventListener('hashchange',fromHash);
fromHash();
})();
