-- AGROTEC · Esquema para Supabase (SQL Editor > New Query > Run)
-- Contiene políticas RLS para que cada productor solo modifique sus propias publicaciones.
-- IMPORTANTE: NO desactives Row Level Security ni utilices service_role en el navegador.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 100),
  role text not null default 'comprador' check (role in ('productor','comprador')),
  created_at timestamptz not null default now()
);

create or replace function public.agrotec_on_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', ''), 100),
    case when new.raw_user_meta_data->>'role' = 'productor' then 'productor' else 'comprador' end
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists agrotec_auth_user_created on auth.users;
create trigger agrotec_auth_user_created
  after insert on auth.users for each row execute function public.agrotec_on_user_created();

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  address text not null default '' check (char_length(address) <= 180),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  whatsapp text check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$'),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 100),
  category text not null check (category in ('Frutas','Verduras','Granos y cereales','Tubérculos','Otros')),
  quantity numeric(13,2) not null check (quantity >= 0),
  unit text not null check (unit in ('kg','tonelada','saco','unidad','caja')),
  price numeric(13,2) not null check (price >= 0),
  description text not null default '' check (char_length(description) <= 500),
  harvest_date date,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists businesses_owner_idx on public.businesses(owner_id);
create index if not exists products_owner_idx on public.products(owner_id);
create index if not exists products_business_idx on public.products(business_id);
create index if not exists products_category_idx on public.products(category);

alter table public.profiles enable row level security;
alter table public.businesses enable row level security;
alter table public.products enable row level security;

drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using (auth.uid() = id);

-- El registro público puede consultar nombres y ubicaciones de emprendimientos.
drop policy if exists businesses_read_all on public.businesses;
create policy businesses_read_all on public.businesses for select to anon, authenticated using (true);

drop policy if exists businesses_add_own on public.businesses;
create policy businesses_add_own on public.businesses for insert to authenticated with check (
  auth.uid() = owner_id and exists (
    select 1 from public.profiles pf where pf.id = auth.uid() and pf.role = 'productor'
  )
);

drop policy if exists businesses_edit_own on public.businesses;
create policy businesses_edit_own on public.businesses for update to authenticated using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

drop policy if exists businesses_delete_own on public.businesses;
create policy businesses_delete_own on public.businesses for delete to authenticated using (auth.uid() = owner_id);

drop policy if exists products_read_all on public.products;
create policy products_read_all on public.products for select to anon, authenticated using (true);

drop policy if exists products_add_own on public.products;
create policy products_add_own on public.products for insert to authenticated with check (
 auth.uid() = owner_id
 and exists(select 1 from public.profiles pf where pf.id=auth.uid() and pf.role='productor')
 and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())
);

drop policy if exists products_edit_own on public.products;
create policy products_edit_own on public.products for update to authenticated using (auth.uid() = owner_id)
with check (
 auth.uid() = owner_id and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=auth.uid())
);

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products for delete to authenticated using (auth.uid() = owner_id);

-- Lectura del catálogo y del directorio, incluso sin iniciar sesión.
grant select on public.businesses, public.products to anon, authenticated;
grant insert, update, delete on public.businesses, public.products to authenticated;
grant select on public.profiles to authenticated;

-- Fotografías públicas, con permiso de subida solo a la carpeta del usuario autenticado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images','product-images',true,5242880,array['image/webp'])
on conflict (id) do update set public=true, file_size_limit=5242880, allowed_mime_types=array['image/webp'];

drop policy if exists agrotec_images_public_read on storage.objects;
create policy agrotec_images_public_read on storage.objects for select to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists agrotec_images_own_upload on storage.objects;
create policy agrotec_images_own_upload on storage.objects for insert to authenticated with check (
 bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists agrotec_images_own_delete on storage.objects;
create policy agrotec_images_own_delete on storage.objects for delete to authenticated using (
 bucket_id = 'product-images' and (storage.foldername(name))[1] = auth.uid()::text
);

-- Eventos en tiempo real para refrescar el catálogo y el mapa entre navegadores.
do $$ begin
 alter publication supabase_realtime add table public.businesses;
exception when duplicate_object then null;
end $$;
do $$ begin
 alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

-- Si ya existen usuarios de Auth creados antes de ejecutar este SQL, su perfil puede
-- añadirse desde un script administrativo; los nuevos se crean con el trigger.
