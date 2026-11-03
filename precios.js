import {preciosBase} from './precios-data.js';
import {cloudEnabled,initStore,listProducts} from './data.js';
const $ = id => document.getElementById(id);
const NS='http://www.w3.org/2000/svg';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nfmt=(n,d=2)=>new Intl.NumberFormat('es-PE',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const svgNode=(tag,attrs={},text)=>{let n=document.createElementNS(NS,tag);for(let [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;return n;};
const curr=(n,region)=> (region==='mundo'?'US$ ':'S/ ')+nfmt(n,region==='mundo'?1:2);
function chartSkeleton(target){target.innerHTML='';const svg=svgNode('svg',{viewBox:'0 0 920 345',role:'img','aria-label':'Gráfico de precios','preserveAspectRatio':'xMidYMid meet'});target.append(svg);return svg;}
function chartLine(target,labels,series,region){
 const svg=chartSkeleton(target),w=920,h=345,l=73,r=30,t=24,b=53;
 const all=series.flatMap(s=>s.values.filter(Number.isFinite));if(!all.length)return;
 let min=Math.min(...all),max=Math.max(...all);let span=max-min;if(span===0)span=Math.max(1,max*.3);min=Math.max(0,min-span*.17);max+=span*.22;
 const x=i=>l+(w-l-r)*i/Math.max(1,labels.length-1),y=v=>t+(h-t-b)*(1-(v-min)/(max-min));
 for(let i=0;i<=4;i++){let v=min+(max-min)*(4-i)/4,Y=y(v);svg.append(svgNode('line',{x1:l,x2:w-r,y1:Y,y2:Y,stroke:'#e4ebe5','stroke-width':1}));svg.append(svgNode('text',{x:l-13,y:Y+4,'text-anchor':'end',fill:'#72837a','font-size':12},nfmt(v,max>50?0:2)));}
 labels.forEach((label,i)=>svg.append(svgNode('text',{x:x(i),y:h-17,'text-anchor':'middle',fill:'#617568','font-size':12},label)));
 for(const s of series){let d=s.values.map((v,i)=>`${i?'L':'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');svg.append(svgNode('path',{d,fill:'none',stroke:s.color,'stroke-width':3.4,'stroke-linecap':'round','stroke-linejoin':'round'}));s.values.forEach((v,i)=>{const circle=svgNode('circle',{cx:x(i),cy:y(v),r:5,stroke:'white','stroke-width':2.4,fill:s.color,tabindex:'0',role:'img','aria-label':`${s.name}, ${labels[i]}, ${curr(v,region)}`});circle.append(svgNode('title',{},`${s.name} · ${labels[i]}: ${curr(v,region)}`));svg.append(circle);});}
}
function chartBars(target,rows,region){const svg=chartSkeleton(target),w=920,l=170,r=75,t=25,h=Math.max(345,rows.length*70+35);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);let max=Math.max(...rows.map(x=>x.value),1)*1.16;let n=rows.length;rows.forEach((row,i)=>{const y=t+i*70;svg.append(svgNode('text',{x:l-15,y:y+29,'text-anchor':'end',fill:'#28513a','font-size':15,'font-weight':650},row.name));svg.append(svgNode('rect',{x:l,y:y+8,width:w-l-r,height:35,rx:10,fill:'#edf3e9'}));svg.append(svgNode('rect',{x:l,y:y+8,width:(w-l-r)*row.value/max,height:35,rx:10,fill:['#2e8256','#6fb18e','#dfae40','#719d72'][i%4]}));svg.append(svgNode('text',{x:l+(w-l-r)*row.value/max+12,y:y+32,fill:'#204a32','font-size':16,'font-weight':800},curr(row.value,region)));});}
function renderTable(region,selected){const data=preciosBase[region];let rows=[];
 if(region==='peru'){rows=data.rows.map(r=>[r.name,r.date,nfmt(r.value)]);}else{const ss=data.series.filter(s=>selected==='todas'||s.name===selected);rows=data.dates.flatMap((date,i)=>ss.map(s=>[s.name,date,nfmt(s.values[i],region==='mundo'?1:2)]));}
 $('pricesTable').innerHTML=`<thead><tr><th>Producto / serie</th><th>Fecha</th><th>Precio (${esc(data.unit)})</th></tr></thead><tbody>${rows.map(x=>`<tr>${x.map(y=>`<td>${esc(y)}</td>`).join('')}</tr>`).join('')}</tbody>`;return rows;
}
let currentRegion='peru',currentRows=[];
function render(){const data=preciosBase[currentRegion],choice=$('pricesProduct').value;
 $('pricesTitle').textContent=data.title;$('pricesDescription').textContent=data.description;$('pricesDate').textContent=data.labelDate;$('pricesUnit').textContent=data.unit;$('pricesSource').textContent=data.source;$('pricesSource').href=data.sourceUrl;
 const selector=$('pricesProduct'),old=choice;selector.innerHTML='<option value="todas">Todas las series</option>';
 if(data.series){data.series.forEach(s=>selector.append(new Option(s.name,s.name)));selector.parentElement.classList.remove('hidden');selector.value=[...selector.options].some(o=>o.value===old)?old:'todas';}else{selector.parentElement.classList.add('hidden');}
 const ss=data.series?.filter(s=>selector.value==='todas'||s.name===selector.value)||[];
 const target=$('pricesChart');if(data.rows)chartBars(target,data.rows,currentRegion);else chartLine(target,data.dates,ss,currentRegion);
 const leg=$('pricesLegend');leg.innerHTML=ss.length?ss.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join(''):'<span><i style="background:#2e8256"></i>Precios mayoristas</span>';
 currentRows=renderTable(currentRegion,selector.value);
 let allVals=data.rows?data.rows.map(x=>x.value):ss.flatMap(x=>x.values);
 $('priceMin').textContent=curr(Math.min(...allVals),currentRegion);$('priceMax').textContent=curr(Math.max(...allVals),currentRegion);
 $('priceCount').textContent=String(currentRows.length);
 $('priceMethod').textContent=currentRegion==='chiclayo'?'Rango de precios observados en Moshoqueque (maíz amarillo duro). No se promedian máximos y mínimos.':currentRegion==='mundo'?'Promedios mensuales internacionales del Banco Mundial, en dólares por tonelada.':'Precios mayoristas nacionales publicados por el observatorio; una observación por cultivo.';
 $('pricesSourceExtra').innerHTML=currentRegion==='mundo'?ss.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Ver serie ${esc(s.name)} ↗</a>`).join(' '):'';
}
function downloadCSV(){const data=preciosBase[currentRegion],lines=[['Producto/serie','Fecha','Precio','Moneda y unidad','Mercado','Fuente URL'],...currentRows.map(x=>[...x,data.unit,currentRegion,data.sourceUrl])];const csv='\ufeff'+lines.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');const a=document.createElement('a');let url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.href=url;a.download=`agrotec_precios_${currentRegion}_2026.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
function setupNav(){const menu=$('menuToggle'),nav=$('topNav');menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',open?'true':'false');});}
const localPlaces=/chiclayo|jose leonardo ortiz|josé leonardo ortiz|la victoria|pimentel|reque|monsefu|monsefú|ciudad eten|puerto eten|pomalca|tuman|tumán|picsi|santa rosa|pátapo|patapo/;
function withinChiclayo(b){
 if(!b)return false;
 const lat=Number(b.lat),lng=Number(b.lng);
 if(Number.isFinite(lat)&&Number.isFinite(lng)){
  const earth=6371,toRad=x=>x*Math.PI/180, dLat=toRad(lat-(-6.771)),dLon=toRad(lng-(-79.841));
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(-6.771))*Math.cos(toRad(lat))*Math.sin(dLon/2)**2;
  if(2*earth*Math.asin(Math.min(1,Math.sqrt(a)))<=35)return true;
 }
 return localPlaces.test(String(b.address).toLocaleLowerCase('es'));
}
async function localOffers(){const box=$('localOfferChart'),label=$('localOfferLabel');if(!cloudEnabled()){box.innerHTML='<div class="empty"><strong>Ofertas locales todavía no disponibles</strong>Los datos de la demostración son ficticios. Conecta Supabase para mostrar precios que publiquen productores reales de Chiclayo.</div>';return;}
 try{await initStore();const products=(await listProducts()).filter(p=>p.unit==='kg'&&p.businesses&&withinChiclayo(p.businesses));
 const offers=products.slice(0,8).map(p=>({name:p.name.slice(0,25),value:Number(p.price)}));
 if(!offers.length){box.innerHTML='<div class="empty"><strong>Aún no hay publicaciones locales</strong>Cuando agricultores de Chiclayo registren precios por kg, sus ofertas aparecerán aquí.</div>';return;}
 chartBars(box,offers,'chiclayo');label.textContent=`${offers.length} anuncios publicados por usuarios · S/ por kg · no son cotizaciones oficiales`;
 }catch(error){box.innerHTML=`<div class="empty"><strong>No se pudieron cargar las ofertas</strong>${esc(error.message)}</div>`;}}
function init(){setupNav();document.querySelectorAll('[data-price-tab]').forEach(el=>el.addEventListener('click',()=>{currentRegion=el.dataset.priceTab;document.querySelectorAll('[data-price-tab]').forEach(x=>{const active=x===el;x.classList.toggle('active',active);x.setAttribute('aria-selected',String(active));});$('pricesProduct').value='todas';render();}));$('pricesProduct').addEventListener('change',render);$('downloadPrices').addEventListener('click',downloadCSV);render();localOffers();}
init();
