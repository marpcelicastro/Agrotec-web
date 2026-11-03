import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// Cuando no existe configuración, los registros se guardan únicamente en este navegador.
const USING_CLOUD = Boolean(SUPABASE_URL.trim() && SUPABASE_ANON_KEY.trim());
let supabase = null;
let memoryBusinesses = null;
let memoryProducts = null;
const BKEY = 'agrotec_demo_businesses_v3';
const PKEY = 'agrotec_demo_products_v3';
const DEMO_BUSINESSES = [
  { id:'demo-b1', name:'Huerto de ejemplo Monsefú', address:'Monsefú, Lambayeque (ubicación ilustrativa)',lat:-6.878,lng:-79.873,whatsapp:'',owner_id:'demo',created_at:'2026-09-03T08:00:00Z' },
  { id:'demo-b2', name:'Cooperativa de ejemplo Ferreñafe', address:'Ferreñafe, Lambayeque (ubicación ilustrativa)',lat:-6.639,lng:-79.787,whatsapp:'',owner_id:'demo',created_at:'2026-09-02T08:00:00Z' },
  { id:'demo-b3', name:'Finca de ejemplo Lambayeque', address:'Lambayeque, Perú (ubicación ilustrativa)',lat:-6.701,lng:-79.906,whatsapp:'',owner_id:'demo',created_at:'2026-09-01T08:00:00Z' },
];
const DEMO_PRODUCTS = [
  { id:'demo-p1',business_id:'demo-b1',owner_id:'demo',name:'Mango Kent (ejemplo)',category:'Frutas',quantity:500,unit:'kg',price:3.50,description:'Producto de demostración; no representa una oferta real.',harvest_date:null,image_url:null,created_at:'2026-09-03T10:00:00Z' },
  { id:'demo-p2',business_id:'demo-b2',owner_id:'demo',name:'Maíz amarillo (ejemplo)',category:'Granos y cereales',quantity:250,unit:'kg',price:2.80,description:'Producto de demostración; no representa una oferta real.',harvest_date:null,image_url:null,created_at:'2026-09-02T10:00:00Z' },
  { id:'demo-p3',business_id:'demo-b3',owner_id:'demo',name:'Arroz (ejemplo)',category:'Granos y cereales',quantity:120,unit:'saco',price:95,description:'Producto de demostración; no representa una oferta real.',harvest_date:null,image_url:null,created_at:'2026-09-01T10:00:00Z' },
];
function readJson(key,seed){
  try {const saved=localStorage.getItem(key);if(saved!==null){const parsed=JSON.parse(saved);if(Array.isArray(parsed))return parsed;} const initial=structuredClone(seed);localStorage.setItem(key,JSON.stringify(initial));return initial;}
  catch {return structuredClone(seed);}
}
function saveJson(key,data){try{localStorage.setItem(key,JSON.stringify(data));}catch(e){throw new Error('No se pudo guardar en este navegador. Prueba con una imagen más pequeña o libera espacio.');}}
function demoBusinessList(){memoryBusinesses=readJson(BKEY,memoryBusinesses||DEMO_BUSINESSES);return memoryBusinesses;}
function demoProductList(){memoryProducts=readJson(PKEY,memoryProducts||DEMO_PRODUCTS);return memoryProducts;}
function newId(){return typeof crypto!=='undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function check(error){if(error)throw new Error(error.message||'No se pudo completar la operación.');}
function validCoordinates(lat,lng){return Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180;}
function normalizedBusiness(input){
 const name=String(input.name||'').trim();const address=String(input.address||'').trim();const lat=Number(input.lat),lng=Number(input.lng);
 const whatsapp=String(input.whatsapp||'').replace(/[^\d]/g,'');
 if(name.length<2||name.length>100)throw new Error('Escribe un nombre válido (2 a 100 caracteres).');
 if(!validCoordinates(lat,lng)||input.lat===''||input.lng==='')throw new Error('Selecciona un punto exacto en el mapa.');
 if(address.length>180)throw new Error('La dirección es demasiado larga.');
 if(whatsapp&&(whatsapp.length<8||whatsapp.length>15))throw new Error('Escribe un WhatsApp válido (8 a 15 dígitos) o déjalo vacío.');
 return {name,address:address||`${lat.toFixed(5)}, ${lng.toFixed(5)}`,lat,lng,whatsapp:whatsapp||null};
}
function normalizedProduct(input){
 const name=String(input.name||'').trim(),description=String(input.description||'').trim();
 const categories=['Frutas','Verduras','Granos y cereales','Tubérculos','Otros'],units=['kg','tonelada','saco','unidad','caja'];
 const quantity=Number(input.quantity),price=Number(input.price),category=String(input.category||''),unit=String(input.unit||'');
 if(!input.business_id)throw new Error('Primero registra y selecciona un negocio.');
 if(name.length<2||name.length>100)throw new Error('Escribe un nombre de producto válido.');
 if(!categories.includes(category)||!units.includes(unit))throw new Error('Selecciona una categoría y unidad válidas.');
 if(input.quantity===''||!Number.isFinite(quantity)||quantity<0||quantity>1e9)throw new Error('Escribe una cantidad válida.');
 if(input.price===''||!Number.isFinite(price)||price<0||price>1e9)throw new Error('Escribe un precio válido.');
 if(description.length>500)throw new Error('La descripción debe tener máximo 500 caracteres.');
 const harvest_date=input.harvest_date||null;
 if(harvest_date&&!/^\d{4}-\d{2}-\d{2}$/.test(harvest_date))throw new Error('Fecha de cosecha inválida.');
 return {business_id:input.business_id,name,category,quantity,unit,price,description,harvest_date,image_url:input.image_url||null};
}
export const cloudEnabled = () => USING_CLOUD;
export async function initStore(){
 if(!USING_CLOUD){demoBusinessList();demoProductList();return;}
 const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2');
 supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}
export async function currentUser(){if(!USING_CLOUD)return null;const {data,error}=await supabase.auth.getUser();if(error)return null;return data.user;}
export async function currentProfile(){if(!USING_CLOUD)return null;const user=await currentUser();if(!user)return null;const {data,error}=await supabase.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle();check(error);return data;}
async function requireUser(){const user=await currentUser();if(!user)throw new Error('Debes iniciar sesión para guardar información pública.');return user;}
export async function logIn(email,password){if(!USING_CLOUD)throw new Error('Activa Supabase para iniciar sesión con seguridad.');const {data,error}=await supabase.auth.signInWithPassword({email,password});check(error);return data;}
export async function register(email,password,role,name){if(!USING_CLOUD)throw new Error('Activa Supabase para crear cuentas.');const {data,error}=await supabase.auth.signUp({email,password,options:{data:{role,name}}});check(error);return data;}
export async function logOut(){if(!USING_CLOUD)return;const {error}=await supabase.auth.signOut();check(error);}
export function authChanges(callback){if(!supabase)return()=>{};const {data}=supabase.auth.onAuthStateChange(()=>callback());return()=>data.subscription.unsubscribe();}
export async function listBusinesses(){
 if(!USING_CLOUD)return [...demoBusinessList()].sort((a,b)=>b.created_at.localeCompare(a.created_at));
 const {data,error}=await supabase.from('businesses').select('id,owner_id,name,address,lat,lng,whatsapp,created_at').order('created_at',{ascending:false});check(error);return data||[];
}
export async function myBusinesses(){if(!USING_CLOUD)return listBusinesses();const user=await currentUser();if(!user)return [];const {data,error}=await supabase.from('businesses').select('*').eq('owner_id',user.id).order('created_at',{ascending:false});check(error);return data||[];}
export async function createBusiness(input){const b=normalizedBusiness(input);
 if(!USING_CLOUD){const saved={...b,id:newId(),owner_id:'demo',created_at:new Date().toISOString()};const all=demoBusinessList();all.unshift(saved);saveJson(BKEY,all);return saved;}
 const user=await requireUser();const {data,error}=await supabase.from('businesses').insert({...b,owner_id:user.id}).select().single();check(error);return data;
}
export async function deleteBusiness(id){
 if(!USING_CLOUD){saveJson(BKEY,demoBusinessList().filter(b=>b.id!==id));saveJson(PKEY,demoProductList().filter(p=>p.business_id!==id));return;}
 await requireUser();const {error}=await supabase.from('businesses').delete().eq('id',id);check(error);
}
export async function listProducts(){
 if(!USING_CLOUD){const bs=demoBusinessList();return demoProductList().map(p=>({...p,businesses:bs.find(b=>b.id===p.business_id)||null})).filter(p=>p.businesses).sort((a,b)=>b.created_at.localeCompare(a.created_at));}
 const {data,error}=await supabase.from('products').select('id,owner_id,business_id,name,category,quantity,unit,price,description,harvest_date,image_url,created_at,businesses(id,name,address,lat,lng,whatsapp)').order('created_at',{ascending:false});check(error);return data||[];
}
export async function myProducts(){if(!USING_CLOUD)return listProducts();const user=await currentUser();if(!user)return [];return (await listProducts()).filter(p=>p.owner_id===user.id);}
export async function saveProduct(input,id){const p=normalizedProduct(input);
 if(!USING_CLOUD){const all=demoProductList();const bs=demoBusinessList();if(!bs.some(b=>b.id===p.business_id))throw new Error('El negocio seleccionado no existe.');
   if(id){const old=all.find(x=>x.id===id);if(!old)throw new Error('Publicación no encontrada.');Object.assign(old,p);saveJson(PKEY,all);return old;}
   const item={...p,id:newId(),owner_id:'demo',created_at:new Date().toISOString()};all.unshift(item);saveJson(PKEY,all);return item;}
 const user=await requireUser();if(id){const {data,error}=await supabase.from('products').update(p).eq('id',id).eq('owner_id',user.id).select().single();check(error);return data;}
 const {data,error}=await supabase.from('products').insert({...p,owner_id:user.id}).select().single();check(error);return data;
}
export async function deleteProduct(id){if(!USING_CLOUD){saveJson(PKEY,demoProductList().filter(p=>p.id!==id));return;}
 const user=await requireUser();const {error}=await supabase.from('products').delete().eq('id',id).eq('owner_id',user.id);check(error);
}
function resizeImage(file){return new Promise((resolve,reject)=>{
 const img=new Image();const blobUrl=URL.createObjectURL(file);
 img.onload=()=>{try{const max=1000,scale=Math.min(1,max/img.width,max/img.height),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(b=>{URL.revokeObjectURL(blobUrl);b?resolve(b):reject(new Error('No se pudo procesar la imagen.'));},'image/webp',.78);}catch(e){URL.revokeObjectURL(blobUrl);reject(e);}};
 img.onerror=()=>{URL.revokeObjectURL(blobUrl);reject(new Error('El archivo de imagen es inválido.'));};img.src=blobUrl;
});}
export async function saveImage(file){if(!file)return null;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Solo se admiten imágenes JPG, PNG o WebP.');
 if(file.size>5*1024*1024)throw new Error('La foto debe pesar como máximo 5 MB.');
 const blob=await resizeImage(file);
 if(!USING_CLOUD)return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('No se pudo leer la fotografía.'));reader.readAsDataURL(blob);});
 const user=await requireUser(),path=`${user.id}/${newId()}.webp`;
 const {error}=await supabase.storage.from('product-images').upload(path,blob,{contentType:'image/webp',upsert:false});check(error);
 return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}
export function subscribeLive(callback){if(!USING_CLOUD||!supabase)return()=>{};
 const ch=supabase.channel('agrotec-public-updates').on('postgres_changes',{event:'*',schema:'public',table:'businesses'},callback).on('postgres_changes',{event:'*',schema:'public',table:'products'},callback).subscribe();
 return()=>{supabase.removeChannel(ch);};
}
