import {cloudEnabled,initStore,currentUser,currentProfile,logIn,register,logOut,listBusinesses,myBusinesses,createBusiness,deleteBusiness,listProducts,myProducts,saveProduct,deleteProduct,saveImage,subscribeLive} from './data.js';

const $=(id)=>document.getElementById(id);
const page=document.body.dataset.page;
const pointCenter=[-6.7707,-79.8461]; // Vista regional de Lambayeque; no es una ubicación de usuario.
let businessCache=[], productCache=[];
const escapeHTML=(value)=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const money=(n)=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(n)||0);
const searchNorm=(v)=>String(v??'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const mapURL=(b)=>`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${Number(b.lat)},${Number(b.lng)}`)}`;
const whatsappURL=(number,name='')=>{
  let digits=String(number||'').replace(/\D/g,'');if(digits.length===9)digits='51'+digits;
  return digits.length>=8&&digits.length<=15?`https://wa.me/${digits}?text=${encodeURIComponent(`Hola, encontré ${name} en Agrotec y quisiera más información.`)}`:null;
};
function setMessage(node,text,isError=false){if(!node)return;node.textContent=text;node.className='form-message '+(isError?'error':'success');}
function flash(text){let el=$('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(flash.timer);flash.timer=setTimeout(()=>el.classList.remove('show'),3200);}
function displayError(node,e){setMessage(node,e instanceof Error?e.message:String(e),true);}
function toggleBusy(button,isBusy,loadingText='Guardando…'){
 if(!button)return;if(isBusy){button.dataset.previousText=button.textContent;button.textContent=loadingText;button.disabled=true;}else{button.textContent=button.dataset.previousText||button.textContent;button.disabled=false;}
}
function emptyHTML(title,message){return `<div class="empty"><strong>${escapeHTML(title)}</strong>${escapeHTML(message||'')}</div>`;}
function imgURL(url){const s=String(url||'');return s.startsWith('data:image/webp;base64,')||/^https:\/\//i.test(s)?s:null;}
function categoryEmoji(category){return ({'Frutas':'🥭','Verduras':'🥬','Granos y cereales':'🌽','Tubérculos':'🥔','Otros':'🌿'})[category]||'🌾';}
function linkMarkup(b){const wa=whatsappURL(b.whatsapp,b.name);return `<a href="${escapeHTML(mapURL(b))}" target="_blank" rel="noopener noreferrer">Cómo llegar ↗</a>${wa?`<a href="${escapeHTML(wa)}" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>`:''}`;}
function productMarkup(p){const b=p.businesses||{};const im=imgURL(p.image_url);const unavailable=Number(p.quantity)===0;return `<article class="product-card">
  <div class="product-art">${im?`<img loading="lazy" src="${escapeHTML(im)}" alt="Fotografía de ${escapeHTML(p.name)}">`:`<span class="emoji" aria-hidden="true">${categoryEmoji(p.category)}</span>`}<span class="chip">${unavailable?'Sin stock':escapeHTML(p.category)}</span></div>
  <div class="product-body"><div class="product-meta"><span class="chip">${escapeHTML(p.unit)}</span><span class="tiny muted">📦 ${escapeHTML(p.quantity)} ${escapeHTML(p.unit)}</span></div>
  <h3>${escapeHTML(p.name)}</h3><p>📍 ${escapeHTML(b.address||'Ubicación no indicada')}</p><p>👨‍🌾 ${escapeHTML(b.name||'Productor')}</p>
  <div><span class="product-price">${money(p.price)}</span><span class="tiny muted"> / ${escapeHTML(p.unit)}</span></div>
  <div class="product-actions"><button type="button" class="btn-small btn-primary" data-detail="${escapeHTML(p.id)}">Ver detalles</button><a class="btn-small btn-outline" href="directorio.html?negocio=${encodeURIComponent(b.id||'')}">Ver mapa</a></div>
  </div></article>`;}
function setupNav(){const menu=$('menuToggle'),nav=$('topNav');menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});
 if(!cloudEnabled()){const banner=$('demoBanner');banner?.classList.remove('hidden');if(banner){banner.className='container notice';banner.innerHTML='<b>Modo demostración:</b> los negocios de ejemplo son ficticios y los cambios solo se guardan en tu navegador. <a style="text-decoration:underline" href="README.md">Configura Supabase</a> para compartir datos reales.';}}
}
async function setupAuthLink(){const a=$('authLink');if(!a)return;try{const user=await currentUser();if(user){a.textContent='Mi cuenta';a.href='ingresar.html';}}catch{}}
// Los formularios reutilizan este selector de punto en el mapa.
function pickerMap(prefix){
 const node=$(prefix+'PickerMap'),lat=$(prefix+'Lat'),lng=$(prefix+'Lng'),coords=$(prefix+'Coords');if(!node)return null;
 let map=null,marker=null;
 function update(la,ln,center=true){
   const a=Number(la),b=Number(ln);if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a)>90||Math.abs(b)>180)return;
   lat.value=a.toFixed(6);lng.value=b.toFixed(6);coords.textContent=`✓ Ubicación seleccionada: ${a.toFixed(6)}, ${b.toFixed(6)}`;
   if(map){if(marker)marker.setLatLng([a,b]);else marker=L.marker([a,b],{draggable:true}).addTo(map).on('dragend',ev=>update(ev.target.getLatLng().lat,ev.target.getLatLng().lng,false));if(center)map.setView([a,b],Math.max(map.getZoom(),14));}
 }
 if(typeof L!=='undefined'){
   map=L.map(node,{scrollWheelZoom:false}).setView(pointCenter,10);
   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',maxZoom:19}).addTo(map);
   map.on('click',event=>update(event.latlng.lat,event.latlng.lng));setTimeout(()=>map.invalidateSize(),300);
 }else{node.innerHTML='<div class="empty" style="margin:22px">No se pudo cargar el mapa. Revisa tu conexión a internet y vuelve a intentarlo.</div>';}
 $(prefix+'UseLocation')?.addEventListener('click',()=>{
  if(!navigator.geolocation){flash('Este navegador no admite geolocalización.');return;}
  navigator.geolocation.getCurrentPosition(p=>{update(p.coords.latitude,p.coords.longitude);flash('Ubicación seleccionada.');},err=>flash(err.code===1?'No otorgaste permiso para conocer tu ubicación.':'No se pudo obtener tu ubicación.'),{enableHighAccuracy:true,timeout:12000,maximumAge:0});
 });
 let lastSearch=0;
 async function geocode(){
   const input=$(prefix+'Address'),query=input?.value.trim();
   if(!query)throw new Error('Escribe una dirección o selecciona un punto en el mapa.');
   if(Date.now()-lastSearch<1100)throw new Error('Espera un momento antes de repetir la búsqueda.');
   lastSearch=Date.now();const btn=$(prefix+'Geocode');toggleBusy(btn,true,'Buscando…');
   try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);
     let response;try{response=await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&q=${encodeURIComponent(query)}`,{signal:controller.signal,headers:{Accept:'application/json'}});}finally{clearTimeout(timeout);}
     if(!response.ok)throw new Error('El servicio de direcciones no está disponible. Puedes elegir un punto en el mapa.');
     const rows=await response.json();if(!rows.length)throw new Error('No encontré la dirección. Prueba con distrito, provincia y región.');
     update(Number(rows[0].lat),Number(rows[0].lon));flash('Dirección localizada. Comprueba que el marcador esté bien colocado.');
     return true;
   }catch(e){if(e.name==='AbortError')throw new Error('La búsqueda tardó demasiado.');throw e;}
   finally{toggleBusy(btn,false);}
 }
 $(prefix+'Geocode')?.addEventListener('click',()=>geocode().catch(e=>flash(e.message)));
 return {update,geocode};
}

function getFormBusiness(prefix){return {name:$(prefix+'BusinessName')?.value,address:$(prefix+'Address')?.value,whatsapp:$(prefix+'Phone')?.value,lat:$(prefix+'Lat')?.value,lng:$(prefix+'Lng')?.value};}
function wireBusinessForm(prefix,afterSave){const form=$(prefix+'BusinessForm');if(!form)return;const picker=pickerMap(prefix);
 form.addEventListener('submit',async(ev)=>{ev.preventDefault();const btn=form.querySelector('button[type=submit]'),msg=$(prefix+'FormMessage');setMessage(msg,'');toggleBusy(btn,true);
  try{if(!$(prefix+'Lat').value && $(prefix+'Address').value.trim())await picker?.geocode();
    const saved=await createBusiness(getFormBusiness(prefix));form.reset();$(prefix+'Lat').value='';$(prefix+'Lng').value='';$(prefix+'Coords').textContent='Negocio guardado. Puedes seleccionar otro punto para registrar uno nuevo.';
    setMessage(msg,`✓ ${saved.name} se registró correctamente.`);flash('Negocio agregado al directorio.');if(afterSave)await afterSave();}
  catch(e){displayError(msg,e);}finally{toggleBusy(btn,false);}
 });
}
let dirMap=null,dirMarkers=[];
function mapPopupNode(b){const root=document.createElement('div');root.className='map-tooltip';const h=document.createElement('h3');h.textContent=b.name;root.appendChild(h);
 const p=document.createElement('p');p.textContent=`📍 ${b.address||`${b.lat}, ${b.lng}`}`;root.appendChild(p);
 const directions=document.createElement('a');directions.href=mapURL(b);directions.target='_blank';directions.rel='noopener noreferrer';directions.textContent='Cómo llegar ↗';root.appendChild(directions);
 const wa=whatsappURL(b.whatsapp,b.name);if(wa){const a=document.createElement('a');a.href=wa;a.target='_blank';a.rel='noopener noreferrer';a.textContent='WhatsApp ↗';root.appendChild(a);}return root;
}
function createDirectoryMap(){const el=$('directoryMap');if(!el)return;if(typeof L==='undefined'){el.innerHTML='<div class="empty" style="margin:25px">No se pudo cargar el mapa. Conéctate a internet y actualiza la página.</div>';return;}
 dirMap=L.map(el,{scrollWheelZoom:false}).setView(pointCenter,10);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',maxZoom:19}).addTo(dirMap);
}
function renderDirectory(){const list=$('directoryList'),q=searchNorm($('directorySearch')?.value),sort=$('directorySort')?.value||'recent';if(!list)return;
 const filtered=businessCache.filter(b=>searchNorm(`${b.name} ${b.address}`).includes(q));if(sort==='name')filtered.sort((a,b)=>a.name.localeCompare(b.name,'es'));else filtered.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 $('directoryCount').textContent=`${filtered.length} negocio${filtered.length===1?'':'s'} en el directorio`;
 list.innerHTML=filtered.length?filtered.map(b=>`<article class="directory-card" data-business="${escapeHTML(b.id)}"><h3>🌱 ${escapeHTML(b.name)}</h3><p>📍 ${escapeHTML(b.address||`${b.lat}, ${b.lng}`)}</p><div class="links"><button type="button" data-focus-business="${escapeHTML(b.id)}">Ver pin en mapa ↗</button>${linkMarkup(b)}</div></article>`).join(''):emptyHTML('No hay negocios con esos filtros','Prueba otra búsqueda o registra tu propio emprendimiento.');
 for(const marker of dirMarkers)marker.remove();dirMarkers=[];if(dirMap){const bounds=[];for(const b of filtered){if(!Number.isFinite(Number(b.lat))||!Number.isFinite(Number(b.lng)))continue;const m=L.marker([Number(b.lat),Number(b.lng)]).addTo(dirMap).bindPopup(mapPopupNode(b));m.businessId=b.id;dirMarkers.push(m);bounds.push([Number(b.lat),Number(b.lng)]);}if(bounds.length)dirMap.fitBounds(bounds,{padding:[42,42],maxZoom:13});else dirMap.setView(pointCenter,10);}}
function focusBusiness(id){const b=businessCache.find(x=>x.id===id);if(!b)return;
 document.querySelectorAll('.directory-card').forEach(el=>el.classList.toggle('selected',el.dataset.business===id));
 const marker=dirMarkers.find(m=>m.businessId===id);if(dirMap&&marker){dirMap.setView([Number(b.lat),Number(b.lng)],Math.max(dirMap.getZoom(),14),{animate:true});marker.openPopup();document.getElementById('directoryMap').scrollIntoView({behavior:'smooth',block:'center'});}else flash('Este mapa necesita conexión a internet.');
}
async function refreshDirectory(){businessCache=await listBusinesses();renderDirectory();const businessId=new URLSearchParams(location.search).get('negocio');if(businessId&&businessCache.some(b=>b.id===businessId))focusBusiness(businessId);}
async function initDirectory(){createDirectoryMap();$('directorySearch')?.addEventListener('input',renderDirectory);$('directorySort')?.addEventListener('change',renderDirectory);
 $('directoryList')?.addEventListener('click',e=>{const btn=e.target.closest('[data-focus-business]');if(btn)focusBusiness(btn.dataset.focusBusiness);});
 wireBusinessForm('directory',refreshDirectory);await refreshDirectory();}
function filteredProducts(){const q=searchNorm($('searchProduct')?.value),loc=searchNorm($('districtFilter')?.value),cat=$('categoryFilter')?.value,sort=$('sortProducts')?.value;
 const rows=productCache.filter(p=>searchNorm(`${p.name} ${p.businesses?.name||''} ${p.description||''}`).includes(q)&&searchNorm(p.businesses?.address||'').includes(loc)&&(!cat||p.category===cat));
 if(sort==='price-asc')rows.sort((a,b)=>Number(a.price)-Number(b.price));else if(sort==='price-desc')rows.sort((a,b)=>Number(b.price)-Number(a.price));else if(sort==='name')rows.sort((a,b)=>a.name.localeCompare(b.name,'es'));
 return rows;}
function renderCatalog(){const grid=$('catalogGrid');if(!grid)return;const rows=filteredProducts();$('catalogCount').textContent=`${rows.length} producto${rows.length===1?'':'s'} encontrado${rows.length===1?'':'s'}`;
 grid.innerHTML=rows.length?rows.map(productMarkup).join(''):emptyHTML('No encontramos productos','Prueba otros filtros o consulta más adelante.');}
function showProductDetails(id){const p=productCache.find(item=>item.id===id);if(!p)return;const b=p.businesses||{};$('detailTitle').textContent=p.name;
 $('detailBody').innerHTML=`<div class="pill-row" style="margin:10px 0"><span class="chip">${escapeHTML(p.category)}</span><span class="chip">${Number(p.quantity)===0?'Sin stock':`${escapeHTML(p.quantity)} ${escapeHTML(p.unit)} disponibles`}</span></div><p class="product-price">${money(p.price)} / ${escapeHTML(p.unit)}</p><p>${escapeHTML(p.description||'El vendedor no ha añadido una descripción.')}</p>${p.harvest_date?`<p><b>Cosecha:</b> ${escapeHTML(p.harvest_date)}</p>`:''}<div class="divider"></div><h3>👨‍🌾 ${escapeHTML(b.name||'Productor')}</h3><p>📍 ${escapeHTML(b.address||'Ubicación no indicada')}</p><div class="form-actions"><a class="btn-small btn-primary" href="${escapeHTML(mapURL(b))}" target="_blank" rel="noopener noreferrer">📍 Ver ubicación</a>${whatsappURL(b.whatsapp,b.name)?`<a class="btn-small btn-outline" href="${escapeHTML(whatsappURL(b.whatsapp,b.name))}" target="_blank" rel="noopener noreferrer">💬 Contactar por WhatsApp</a>`:''}</div>${!b.whatsapp?'<p class="tiny muted">Este negocio aún no ha compartido un contacto de WhatsApp.</p>':''}`;
 const dialog=$('productDialog');if(dialog?.showModal)dialog.showModal();else dialog?.setAttribute('open','');}
async function refreshCatalog(){productCache=await listProducts();renderCatalog();}
async function initBuyer(){for(const id of ['searchProduct','districtFilter','categoryFilter','sortProducts'])$(id)?.addEventListener(id.startsWith('search')||id.startsWith('district')?'input':'change',renderCatalog);
 $('clearCatalogFilters')?.addEventListener('click',()=>{$('catalogFilters').reset();renderCatalog();});$('catalogGrid')?.addEventListener('click',e=>{const btn=e.target.closest('[data-detail]');if(btn)showProductDetails(btn.dataset.detail);});
 $('closeDetails')?.addEventListener('click',()=>$('productDialog')?.close());$('productDialog')?.addEventListener('click',e=>{if(e.target===$('productDialog'))e.target.close();});await refreshCatalog();}
async function initHome(){const list=$('homeProducts');if(!list)return;const products=(await listProducts()).slice(0,3);list.innerHTML=products.length?products.map(productMarkup).join(''):emptyHTML('Todavía no hay productos','Sé el primero en publicar una cosecha.');
 list.addEventListener('click',e=>{if(e.target.closest('[data-detail]'))location.href='comprador.html';});}
async function refreshProducer(){businessCache=await myBusinesses();productCache=await myProducts();const el=$('myBusinesses'),choices=$('productBusiness');
 const previous=choices?.value;if(choices){choices.innerHTML='<option value="">Selecciona tu negocio</option>'+businessCache.map(b=>`<option value="${escapeHTML(b.id)}">${escapeHTML(b.name)}</option>`).join('');if(businessCache.some(b=>b.id===previous))choices.value=previous;}
 if(el){el.innerHTML=businessCache.length?businessCache.map(b=>`<article class="my-item"><div><h3>📍 ${escapeHTML(b.name)}</h3><p>${escapeHTML(b.address)}</p></div><div class="my-item-actions"><a class="btn-small btn-outline" href="directorio.html?negocio=${encodeURIComponent(b.id)}">Ver en mapa</a><button type="button" class="btn-small btn-danger" data-delete-business="${escapeHTML(b.id)}">Eliminar</button></div></article>`).join(''):emptyHTML('Aún no has registrado tu negocio','Usa el formulario de arriba para añadir uno al mapa.');}
 const products=$('myProducts');if(products){products.innerHTML=productCache.length?productCache.map(p=>`<article class="my-item"><div><h3>${categoryEmoji(p.category)} ${escapeHTML(p.name)}</h3><p>${escapeHTML(p.businesses?.name||'')} · ${escapeHTML(p.quantity)} ${escapeHTML(p.unit)} · ${money(p.price)} / ${escapeHTML(p.unit)}</p></div><div class="my-item-actions"><button class="btn-small btn-ghost" type="button" data-edit-product="${escapeHTML(p.id)}">Editar</button><button class="btn-small btn-danger" type="button" data-delete-product="${escapeHTML(p.id)}">Eliminar</button></div></article>`).join(''):emptyHTML('Todavía no has publicado productos','Elige un negocio y publica tu primera cosecha.');}
}
function resetProductForm(){const form=$('productForm');form.reset();$('productId').value='';$('productFormTitle').textContent='Nueva publicación';$('saveProductBtn').textContent='Publicar producto';$('cancelProductEdit').classList.add('hidden');setMessage($('productFormMessage'),'');}
function editProduct(id){const p=productCache.find(item=>item.id===id);if(!p)return;$('productId').value=p.id;$('productBusiness').value=p.business_id;$('productName').value=p.name;$('productCategory').value=p.category;$('productQuantity').value=p.quantity;$('productUnit').value=p.unit;$('productPrice').value=p.price;$('productHarvest').value=p.harvest_date||'';$('productDescription').value=p.description||'';$('productFormTitle').textContent='Editar publicación';$('saveProductBtn').textContent='Guardar cambios';$('cancelProductEdit').classList.remove('hidden');$('productForm').scrollIntoView({behavior:'smooth',block:'start'});}
async function initProducer(){
 wireBusinessForm('producer',refreshProducer);const access=$('producerAccess');if(cloudEnabled()&&!(await currentUser())){access.classList.remove('hidden');access.innerHTML='Para registrar negocios y productos públicos, primero debes <a href="ingresar.html" style="text-decoration:underline">iniciar sesión o crear una cuenta de productor</a>.';}
 await refreshProducer();$('cancelProductEdit')?.addEventListener('click',resetProductForm);
 $('myBusinesses')?.addEventListener('click',async(e)=>{const btn=e.target.closest('[data-delete-business]');if(!btn)return;const b=businessCache.find(x=>x.id===btn.dataset.deleteBusiness);if(!b||!confirm(`¿Eliminar «${b.name}»? También se eliminarán sus productos.`))return;
 try{toggleBusy(btn,true);await deleteBusiness(b.id);await refreshProducer();flash('Negocio eliminado.');}catch(err){flash(err.message);}finally{toggleBusy(btn,false);}});
 $('myProducts')?.addEventListener('click',async(e)=>{const edit=e.target.closest('[data-edit-product]');if(edit){editProduct(edit.dataset.editProduct);return;}const btn=e.target.closest('[data-delete-product]');if(!btn)return;const p=productCache.find(x=>x.id===btn.dataset.deleteProduct);if(!p||!confirm(`¿Eliminar la publicación «${p.name}»?`))return;
 try{toggleBusy(btn,true);await deleteProduct(p.id);await refreshProducer();flash('Publicación eliminada.');}catch(err){flash(err.message);}finally{toggleBusy(btn,false);}});
 $('productForm')?.addEventListener('submit',async(e)=>{e.preventDefault();const btn=$('saveProductBtn'),msg=$('productFormMessage'),id=$('productId').value;setMessage(msg,'');toggleBusy(btn,true,'Publicando…');
 try{const old=productCache.find(p=>p.id===id);const imageFile=$('productImage').files?.[0];let image_url=old?.image_url||null;if(imageFile)image_url=await saveImage(imageFile);
 const product={business_id:$('productBusiness').value,name:$('productName').value,category:$('productCategory').value,quantity:$('productQuantity').value,unit:$('productUnit').value,price:$('productPrice').value,harvest_date:$('productHarvest').value,description:$('productDescription').value,image_url};
 await saveProduct(product,id||null);resetProductForm();await refreshProducer();flash(id?'Producto actualizado.':'Producto publicado en el catálogo.');setMessage(msg,id?'✓ Cambios guardados.':'✓ Producto publicado correctamente.');
 }catch(err){displayError(msg,err);}finally{toggleBusy(btn,false);}});
}
async function initAuth(){const form=$('authForm'),tabs={login:$('tabLogin'),register:$('tabRegister')};let mode='login';function setMode(next){mode=next;tabs.login.classList.toggle('active',next==='login');tabs.register.classList.toggle('active',next==='register');tabs.login.setAttribute('aria-selected',String(next==='login'));tabs.register.setAttribute('aria-selected',String(next==='register'));$('authNameField').classList.toggle('hidden',next!=='register');$('authRoleField').classList.toggle('hidden',next!=='register');$('authSubmit').textContent=next==='login'?'Ingresar':'Crear cuenta';$('authPassword').autocomplete=next==='login'?'current-password':'new-password';setMessage($('authMessage'),'');}
 tabs.login.addEventListener('click',()=>setMode('login'));tabs.register.addEventListener('click',()=>setMode('register'));
 if(!cloudEnabled()){$('authDemoMessage').classList.remove('hidden');$('authDemoMessage').innerHTML='El inicio de sesión seguro requiere activar <b>Supabase</b>. Mientras tanto, puedes <a href="productor.html" style="text-decoration:underline">probar el panel del productor sin cuenta</a>, con datos guardados solo en este navegador.';form.querySelectorAll('input,select,button[type=submit]').forEach(el=>el.disabled=true);return;}
 const existing=await currentUser();if(existing){form.classList.add('hidden');$('sessionPanel').classList.remove('hidden');const profile=await currentProfile();$('sessionInfo').textContent=`Has iniciado sesión como ${existing.email}${profile?.role?' ('+profile.role+')':''}.`;}else{$('sessionPanel').classList.add('hidden');}
 $('logoutBtn').addEventListener('click',async()=>{try{await logOut();location.reload();}catch(e){flash(e.message);}});
 form.addEventListener('submit',async(e)=>{e.preventDefault();const btn=$('authSubmit');toggleBusy(btn,true,'Procesando…');setMessage($('authMessage'),'');try{const email=$('authEmail').value.trim(),password=$('authPassword').value;if(!email||!password)throw new Error('Completa el correo y la contraseña.');if(password.length<6)throw new Error('La contraseña debe tener al menos 6 caracteres.');
 if(mode==='register'){const result=await register(email,password,$('authRole').value,$('authName').value.trim());if(result.session){location.href=$('authRole').value==='productor'?'productor.html':'comprador.html';return;}setMessage($('authMessage'),'✓ Revisa tu correo electrónico para confirmar el registro y luego inicia sesión.');}
 else{await logIn(email,password);const profile=await currentProfile();location.href=profile?.role==='productor'?'productor.html':'comprador.html';}
 }catch(err){displayError($('authMessage'),err);}finally{toggleBusy(btn,false);}});
}
async function main(){setupNav();try{await initStore();await setupAuthLink();if(page==='index')await initHome();if(page==='comprador')await initBuyer();if(page==='directorio')await initDirectory();if(page==='productor')await initProducer();if(page==='ingresar')await initAuth();
 if(cloudEnabled()&&['comprador','directorio','index','productor'].includes(page)){
  subscribeLive(async()=>{try{if(page==='comprador')await refreshCatalog();if(page==='directorio')await refreshDirectory();if(page==='index')await initHome();if(page==='productor')await refreshProducer();}catch(e){console.warn('No se pudo actualizar automáticamente:',e);}});
 }
 document.addEventListener('visibilitychange',async()=>{if(document.visibilityState!=='visible')return;try{if(page==='comprador')await refreshCatalog();if(page==='directorio')await refreshDirectory();if(page==='productor')await refreshProducer();}catch{}});
 }catch(err){console.error(err);const banner=$('demoBanner');if(banner){banner.className='container notice';banner.textContent=`Agrotec no pudo cargar los datos: ${err.message}. Comprueba config.js, las tablas y la conexión.`;}flash('Error de conexión. Revisa la configuración.');}}
main();
