# Agrotec Web — versión con observatorio de precios y autenticación

> **Entrega del 3 de noviembre de 2026.** Es una versión de despliegue estático para GitHub Pages; para autenticación real requiere un proyecto propio Supabase y configuración de `config.js`.

## Novedades

- `precios.html`: gráficas seleccionables Chiclayo / Perú / mundo, selector de serie, tabla y exportación CSV.
- `precios.js`: gráficas SVG sin depender de bibliotecas externas, exportación CSV y ofertas locales cuando haya publicaciones reales.
- `precios-data.js`: referencias con valores, fecha, unidad y fuente; **son instantáneas históricas, no datos en tiempo real**.
- `ingresar.html`: inicio de sesión, registro productor/comprador, cierre de sesión, verificación de correo según ajustes de Supabase y recuperación de contraseña.
- `CONFIGURAR_SUPABASE.md`: instrucciones exactas para activar la autenticación y compartir publicaciones.

### Referencias de precios

- Chiclayo (Moshoqueque): maíz amarillo duro, mínimo S/ 1,40 y máximo S/ 1,60 por kg, fechas 1, 4, 6, 8, 11 y 13 de mayo de 2026. Fuente MIDAGRI. Es un **rango histórico**, no una media diaria ni un valor actualizado al 3/11/2026.
- Perú: palta Hass S/ 5,23; mango Kent S/ 3,98; maracuyá S/ 5,27; piña Golden S/ 1,72 por kg, fecha 02/11/2026. Fuente Observatorio Agromercado (MIDAGRI).
- Mundo: serie mensual enero–septiembre 2026 de maíz, trigo HRW estadounidense y arroz tailandés 5%, en US$/tonelada. Fuente: Banco Mundial Pink Sheet (compilado por Macro Lab).

**No comparar directamente** precios de mercados distintos, unidades o calidades; no convertir cotizaciones internacionales a soles sin tipo de cambio, volumen y gastos de importación. Las ofertas locales publicadas por usuarios se etiquetan aparte y solo se muestran cuando Supabase está configurado (excluimos negocios ficticios de la demostración).

### Instalación en GitHub Pages

1. Descarga y descomprime el ZIP.
2. Sube los archivos de la actualización a la raíz de `https://github.com/marpcelicastro/Agrotec-web`, **no el ZIP**. Se reemplazarán archivos de nombres existentes. Conserva copia previa. **Este ZIP de actualización no incluye `config.js` para que no sobrescribas tus credenciales públicas si ya las configuraste.** Tampoco elimina tus imágenes originales.
3. Confirma el commit. Abre `https://marpcelicastro.github.io/Agrotec-web/precios.html`.
4. Para activar la sesión real sigue **`CONFIGURAR_SUPABASE.md`**. Es necesaria una cuenta Supabase y que tú pegues la clave **pública** en `config.js` en tu GitHub.

---

# 🌱 Agrotec — sitio web mejorado

Versión ampliada de la estructura original de **Agrotec-web**, para acercar a agricultores de Lambayeque con compradores.

> **IMPORTANTE:** Los datos iniciales de la demo son **ficticios** (nombres, precios y pines ilustrativos) y se muestran únicamente para probar la interfaz. No son ofertas reales ni contactos de agricultores reales.

## Lo que incluye

- **Inicio (`index.html`)**: presentación, accesos rápidos y vista de publicaciones.
- **Catálogo (`comprador.html`)**: búsqueda por producto/negocio, categoría, ubicación, orden de precios, detalle del producto y vínculo para contactar al productor (si publicó su WhatsApp).
- **Panel (`productor.html`)**: registro de negocios con solo **nombre + punto exacto** obligatorios; publicación, edición y eliminación de productos con cantidad, precio, foto y otros campos opcionales.
- **Directorio (`directorio.html`)**: mapa Leaflet + OpenStreetMap con pines y tarjetas flotantes que muestran nombre y ubicación; lista filtrable y enlace de direcciones y WhatsApp opcional.
- **Acceso (`ingresar.html`)**: registro/inicio de sesión de productor y comprador **cuando Supabase está activado**.
- **Proyecto (`proyecto.html`)**: explicación de objetivos y flujo de la plataforma.
- **Diseño adaptable** a móvil y escritorio, con mensajes de errores y validaciones.

## 1. Probar la versión de demostración (sin configurar backend)

1. Descomprime el ZIP en tu computadora.
2. Abre una terminal en la carpeta `Agrotec_web_mejorado`.
3. Ejecuta `python3 -m http.server 8000` (o en VS Code usa **Live Server**).
4. Abre `http://localhost:8000`.
5. Ve a **Directorio y mapa** > **Registrar mi negocio**, indica un nombre y haz clic en el mapa. Después entra al **Panel del productor** para publicar un producto.
6. Abre **Soy comprador** para encontrar lo que has publicado.

El modo demo utiliza `localStorage`: los cambios solo se ven **en ese mismo navegador y perfil**, no entre personas o dispositivos. El inicio de sesión está deshabilitado en la demo para evitar simular seguridad.

**Requiere internet para descargar el mapa, sus mosaicos, la tipografía y buscar direcciones**. La geolocalización del dispositivo necesita tu permiso y HTTPS (o localhost). Si no se carga el mapa, revisa conexión/ bloqueadores.

## 2. Convertirla en una plataforma real con Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/) y espera a que esté listo.
2. En **SQL Editor** abre una nueva consulta, pega todo el contenido de `supabase.sql` y ejecútalo. Crea las tablas, los controles de acceso por usuario (RLS), las políticas de imágenes y los cambios en tiempo real.
3. En **Project Settings / API** o **Connect** copia la **Project URL** y la **anon/public (publishable) key** (depende del panel actual).
4. Abre `config.js` y pega esos dos valores:

   ```js
   export const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
   export const SUPABASE_ANON_KEY = 'TU_CLAVE_PUBLICA';
   ```

   **NO uses** `service_role`, claves secretas o contraseñas de base de datos en el código del navegador.

5. En **Authentication > Providers > Email** habilita Email y configura el correo de confirmación a tu gusto. En **URL Configuration** registra la URL real de tu web en **Site URL** y en los redirect URLs permitidos.
6. Publica todos los archivos en tu hosting estático (GitHub Pages, Netlify o Vercel), manteniendo las rutas relativas.
7. Crea una cuenta como **Productor**, confirma su correo si está activado y entra al panel. Registra un negocio con el punto en el mapa y publica su producto. Desde otro navegador, el comprador podrá verlo en el catálogo y en el directorio.

Si la ejecución de SQL de tiempo real indica que la tabla ya está incluida en la publicación, se puede omitir esa parte. Si un usuario ya existía antes del SQL, puede necesitar un registro de `profiles` realizado por el administrador.

**NOTA:** El registro de negocio pide solo los dos campos solicitados (nombre y ubicación), mientras que crear una cuenta requiere correo y contraseña por seguridad. La dirección escrita y WhatsApp siguen siendo opcionales; buscar una dirección solo facilita localizar el punto exacto. El mapa usa OpenStreetMap, no Google Maps ni una clave de pago.

## 3. Subir a tu repositorio GitHub

Como esta versión se entrega por separado, no modifica tu repositorio automáticamente.

- **Antes de subir**: descarga una copia de los archivos originales o crea una rama de respaldo.
- Copia los archivos de esta carpeta a la raíz del repositorio. Conserva también cualquier imagen original que aún quieras usar; esta versión no depende del `productor.webp` anterior.
- Revisa los cambios, haz commit y publica.

Comandos de ejemplo en la carpeta del repositorio local:

```bash
git checkout -b mejora-agrotec
git add .
git commit -m "Agrega catalogo, panel de productor, directorio y mapa"
git push -u origin mejora-agrotec
```

En GitHub puedes abrir un Pull Request para fusionar la rama cuando compruebes la versión.

## 4. Cómo funciona el mapa

- Centro inicial del mapa: **Lambayeque, Perú**.
- Pines reales: se crean con los puntos que publiquen los negocios autenticados (si la base de datos está configurada).
- Haz clic en el mapa del formulario o busca una dirección para asignar latitud/longitud. El botón **Usar mi ubicación** pide autorización del dispositivo.
- Cada marcador público abre una ficha con nombre y ubicación; muestra **Cómo llegar** con Google Maps, y **WhatsApp** si el negocio publicó su número.
- Para buscar direcciones se usa el servicio público Nominatim de OpenStreetMap **solo cuando el usuario presiona Buscar** (no mientras escribe). Para un despliegue con mucho tráfico conviene usar un geocodificador contratado o gestionado por el propio proyecto y respetar su política de uso.

## 5. Privacidad, seguridad y límites

- Las coordenadas guardadas en el directorio son **públicas**. Se recomienda marcar un local o punto de entrega y no un domicilio particular.
- Con Supabase, RLS impide que un productor cambie negocios y productos de otro. Los compradores no pueden crear publicaciones bajo las reglas configuradas.
- Las fotos pasan por optimización WebP; las fotos antiguas no se borran automáticamente del almacenamiento cuando se sustituyen o se elimina la publicación. Implementar limpieza con una función del servidor antes de escalar.
- Es un MVP: no contiene pasarela de pago, verificación de identidad, moderación de contenido ni garantía de veracidad de las publicaciones.
- OpenStreetMap y los servicios externos requieren conexión y tienen políticas de uso y disponibilidad que deben respetarse.
- Evita publicar números de teléfono y coordenadas sin autorización de la persona titular.

## Archivos principales

```text
Agrotec_web_mejorado/
├── index.html
├── comprador.html
├── productor.html
├── directorio.html
├── ingresar.html
├── proyecto.html
├── estilo.css
├── app.js
├── data.js
├── config.js
├── supabase.sql
├── .gitignore
└── README.md
```

Creado para avanzar el proyecto Agrotec manteniendo una estructura simple de HTML, CSS y JavaScript sin compiladores.
