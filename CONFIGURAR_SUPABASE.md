# Activar inicio de sesión REAL con Supabase — Agrotec

El código ya tiene formularios de registro, inicio/cierre de sesión, correo de verificación, cambio de contraseña, protección por roles y permisos RLS. **Para que funcionen entre dispositivos debes enlazar un proyecto Supabase creado por ti.** No hace falta pagar Google Maps.

## Paso 1. Crear el proyecto

1. Entra a <https://supabase.com/dashboard> y crea una cuenta / proyecto. Elige una contraseña de base de datos segura y guárdala solo para ti.
2. Abre **SQL Editor → New query**. Pega el contenido COMPLETO de `supabase.sql` y ejecuta **Run**. Es importante ejecutar la consulta antes de registrar los primeros usuarios. Las tablas serán `profiles`, `businesses` y `products`. La política RLS protege las modificaciones de cada dueño.
3. Abre **Authentication → Providers → Email**. Habilita Email, contraseña y, recomendado, **Confirm email**. Si activas la confirmación debes disponer de una configuración de envío de correo válida para una aplicación en producción; el servicio SMTP por defecto tiene límites.
4. En **Authentication → URL Configuration** establece:
   - **Site URL**: `https://marpcelicastro.github.io/Agrotec-web/`
   - **Redirect URLs**: `https://marpcelicastro.github.io/Agrotec-web/ingresar.html`
   (Si usas otro dominio, registra allí el que corresponda.)
5. En **Project Settings → API Keys** / **Connect** copia la **Project URL** y la clave **publishable** o **anon pública**.
6. Desde GitHub abre el archivo `config.js`, haz clic en el lápiz Edit y cambia únicamente los dos valores vacíos:

```js
export const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_TU_CLAVE_PUBLICA';
```

La clave empieza también por `eyJ...` en proyectos antiguos (anon). **NUNCA pegues la clave secret, service_role o contraseña de tu base de datos.** El `config.js` queda público en GitHub Pages: solo puede contener la clave pública.

7. Haz clic en **Commit changes**. Verifica que el sitio abra bien: `https://marpcelicastro.github.io/Agrotec-web/ingresar.html`. Prueba registrar un productor, confirma el correo, inicia sesión y publica un negocio/producto. Prueba abrir el directorio desde una pestaña privada.

## Si no funciona

- **Sigue diciendo modo demostración**: `config.js` continúa con valores vacíos, no se publicó o estás viendo una versión en caché.
- **Invalid API key / Failed to fetch**: comprueba Project URL y la clave pública. No uses la secret.
- **Error de permiso / row level security**: ejecuta `supabase.sql` y entra con una cuenta de tipo productor. Si registraste cuentas ANTES del SQL, ver sección de usuarios antiguos en README.
- **No llega el correo**: revisa carpeta spam, proveedor Email, confirmación y límites del servicio SMTP.
- **El enlace vuelve a localhost**: configura Site URL y Redirect URLs como arriba.
- **Quiero recuperar mi contraseña**: en Ingresar escribe tu correo y selecciona “¿Olvidaste tu contraseña?”. Tras abrir el correo, cambia tu contraseña en la misma página.
- **Doble creación de tablas**: `supabase.sql` es mayormente idempotente. Ejecuta con una cuenta administradora en SQL Editor, no desde el navegador.

## Seguridad y límites

- Las contraseñas las procesa Supabase Auth. Nunca se guardan en GitHub ni en localStorage de Agrotec. Supabase gestiona su sesión en el navegador; cualquier token almacenado requiere precauciones habituales de seguridad web.
- RLS protege los datos del productor en el servidor. Cada productor solo puede escribir sobre sus negocios y publicaciones. El mapa y las publicaciones son públicos por diseño.
- Se recomienda ofrecer solo la ubicación comercial / punto de entrega, no domicilios personales sin consentimiento.
- **Esto no proporciona verificación de identidad, revisión de anuncios ni pagos.** La seguridad final depende de configurar correctamente el proyecto y mantener sus dependencias.

Fuentes: <https://supabase.com/docs/guides/auth/passwords> · <https://supabase.com/docs/reference/javascript/auth-signinwithpassword> · <https://supabase.com/docs/guides/database/postgres/row-level-security>
