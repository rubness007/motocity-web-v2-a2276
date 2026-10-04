const $ = (s) => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const icons={arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',box:'<path d="m3 7 9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',screen:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',help:'<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4m0 3h.01"/>',doc:'<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/>'};
let selected='all',query='',activeArticle=null;
const getCategory=id=>CATEGORIES.find(c=>c.id===id);
function matching(){let tokens=normalize(query).split(/\s+/).filter(Boolean);return ARTICLES.filter(a=>(selected==='all'||a.category===selected)&&tokens.every(t=>normalize([a.title,a.summary,...a.paragraphs,...a.steps,a.tags,getCategory(a.category).name].join(' ')).includes(t)));}
function render(){
 const filtered=matching();const list=query||selected!=='all'?filtered:ARTICLES.filter(a=>a.popular);
 $('#articles-title').textContent=query?'Résultats de recherche'.replace('Résultats','Resultados'):selected==='all'?'Preguntas frecuentes':getCategory(selected).name;
 $('#list-eyebrow').textContent=query?'ENCUENTRA TU RESPUESTA':selected==='all'?'COMIENZA AQUÍ':'GUÍAS PARA CLIENTES';
 $('#results').textContent=query?`${filtered.length} ${filtered.length===1?'artículo encontrado':'artículos encontrados'} para “${query}”`:selected==='all'?`${list.length} respuestas para las consultas más habituales`:`${list.length} artículos en esta categoría`;
 $('#reset').hidden=!query&&selected==='all';$('#empty').hidden=list.length>0;
 $('#articles').innerHTML=list.map(a=>`<button class="article-button" type="button" data-article="${a.id}"><span><small>${esc(getCategory(a.category).name)}</small><h3>${esc(a.title)}</h3><p>${esc(a.summary)}</p></span><span class="arrow" aria-hidden="true">›</span></button>`).join('');
 document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.category===selected?'true':'false'));
}
function selectCategory(id,scroll=true){selected=id;query='';$('#search').value='';render();if(scroll)document.querySelector('.knowledge').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
$('#categories').innerHTML=CATEGORIES.map(c=>`<button class="category-card" type="button" data-category="${c.id}" aria-pressed="false"><span class="icon-tile"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[c.icon]}</svg></span><span><h3>${esc(c.name)}</h3><p>${esc(c.description)}</p><small>4 artículos →</small></span></button>`).join('');
function doSearch(scroll=false){query=$('#search').value.trim();selected='all';render();if(scroll)document.querySelector('.knowledge').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
$('#search-form').addEventListener('submit',e=>{e.preventDefault();doSearch(true);});
$('#search').addEventListener('input',()=>doSearch());
$('#reset').addEventListener('click',()=>selectCategory('all',false));$('#empty-reset').addEventListener('click',()=>selectCategory('all',false));
function openArticle(id,updateHash=true){const a=ARTICLES.find(a=>a.id===id);if(!a)return;activeArticle=a;$('#dialog-category').textContent=getCategory(a.category).name;const email=a.contact==='finance'?'facturacion@motocity.cl':'contacto@motocity.cl';
 $('#article-content').innerHTML=`<h2 id="dialog-title">${esc(a.title)}</h2><p class="lead">${esc(a.summary)}</p>${a.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${a.steps.length?`<h3>${a.id==='datos-cotizacion'||a.category==='finanzas'?'Datos que debes enviar':'Paso a paso'}</h3><ol>${a.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${a.id==='iniciar-sesion'||a.id==='solicitar-servicio'?'<a class="button" href="https://clientes.motocity.cl/cost_centers/sign_in">Ingresar a la plataforma ↗</a>':''}<div class="article-contact"><strong>${a.contact==='finance'?'¿Necesitas ayuda de Finanzas?':'¿Necesitas apoyo de Coordinación?'}</strong><div class="email-row"><span>${email}</span><button type="button" class="copy" data-email="${email}" aria-label="Copiar correo ${email}">Copiar</button><span class="sr copy-status" role="status"></span></div>${a.contact!=='finance'?'<a class="button whatsapp" href="https://wa.me/56950105659" target="_blank" rel="noopener noreferrer">WhatsApp · +56 9 5010 5659 ↗</a>':''}</div>`;
 $('#share-status').textContent='';if(!$('#article-dialog').open)$('#article-dialog').showModal();$('#article-dialog').scrollTop=0;
 if(updateHash)history.pushState(null,'',`#articulo/${id}`);
}
$('#close-dialog').addEventListener('click',()=>$('#article-dialog').close());
$('#article-dialog').addEventListener('click',e=>{if(e.target===$('#article-dialog')){const r=$('#article-dialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('#article-dialog').close();}});
$('#article-dialog').addEventListener('close',()=>{activeArticle=null;if(location.hash.startsWith('#articulo/'))history.replaceState(null,'',location.pathname+location.search);});
function handleHash(){const id=location.hash.match(/^#articulo\/(.+)$/)?.[1];if(id)openArticle(id,false);else if($('#article-dialog').open)$('#article-dialog').close();}
window.addEventListener('hashchange',handleHash);window.addEventListener('popstate',handleHash);
async function copyText(value){try{if(!navigator.clipboard)throw Error();await navigator.clipboard.writeText(value);}catch(error){const t=document.createElement('textarea');t.value=value;t.style.cssText='position:fixed;opacity:0;top:0;left:0';document.body.appendChild(t);const prior=document.activeElement;try{t.select();if(!document.execCommand('copy'))throw Error('No se pudo copiar');}finally{t.remove();prior?.focus();}}}
document.addEventListener('click',async e=>{const category=e.target.closest('[data-category]');if(category){selectCategory(category.dataset.category);return;}const suggestion=e.target.closest('[data-query]');if(suggestion){$('#search').value=suggestion.dataset.query;doSearch(true);return;}const article=e.target.closest('[data-article]');if(article){openArticle(article.dataset.article);return;}const copy=e.target.closest('[data-email]');if(copy){const status=copy.parentElement.querySelector('.copy-status');try{await copyText(copy.dataset.email);copy.textContent='¡Copiado!';if(status)status.textContent='Correo copiado al portapapeles.';}catch(error){copy.textContent='Reintentar';if(status)status.textContent='Selecciona el correo y cópialo manualmente.';}clearTimeout(copy.copyTimer);copy.copyTimer=setTimeout(()=>{copy.textContent='Copiar';if(status)status.textContent='';},3000);}});
$('#share-article').addEventListener('click',async()=>{if(!activeArticle)return;try{await copyText(location.href);$('#share-status').textContent='Enlace copiado.';}catch(error){$('#share-status').textContent='Copia la dirección desde la barra de tu navegador.';}});
render();handleHash();
