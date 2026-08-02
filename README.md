# SSF2X México

Plataforma web de la comunidad mexicana de **Super Street Fighter II X Grand Master Challenge**.

Torneos mensuales, resultados, perfiles de jugadores, noticias y guías.

---

## ⚠️ Antes de nada: borra la carpeta `node_modules`

Si existe una carpeta `node_modules` en el proyecto, **bórrala** antes de instalar. Quedó a medias durante la construcción y puede provocar un error `ENOTEMPTY`. También puede aparecer como `.trash-node-modules`; esa también se borra.

En el Explorador de Windows: selecciónalas y elimínalas. O desde PowerShell:

```powershell
cd C:\stmx
Remove-Item -Recurse -Force node_modules, .trash-node-modules -ErrorAction SilentlyContinue
```

---

## Arrancar en tu computadora

Necesitas [Node.js 20 o superior](https://nodejs.org).

```bash
cd C:\stmx
npm install
npm run dev
```

Abre <http://localhost:5173>.

Las credenciales de Supabase ya están en `.env.production`; para desarrollo puedes copiar `.env.example` a `.env.local` si quieres apuntar a otro proyecto.

### Comandos

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática |
| `npm run typecheck` | Verifica los tipos sin compilar |
| `npm run build` | Compila, genera el fallback 404 y prerenderiza las metaetiquetas |
| `npm run preview` | Sirve la versión compilada localmente |

---

## Publicar el sitio

El despliegue es automático. Cada `push` a `main` compila y publica en GitHub Pages.

### Primera subida

```bash
cd C:\stmx
git init
git add .
git commit -m "feat: plataforma SSF2X México — Fase 1"
git branch -M main
git remote add origin https://github.com/ssfxmx/ssfxmx.github.io.git
git push -u origin main
```

> Si el repositorio todavía se llama `stmx`, renómbralo a `ssfxmx.github.io` en **Settings → Repository name**. El sitio quedará en la raíz del dominio y no en una subcarpeta.

Después, en **Settings → Pages**, elige **Source: GitHub Actions**. En unos minutos el sitio estará en <https://ssfxmx.github.io>.

### Tu cuenta de administrador

1. Regístrate en el sitio con `ssfxmx@gmail.com` y confirma el correo
2. En el SQL Editor de Supabase:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'ssfxmx@gmail.com');
```

El rol de administrador no se puede obtener desde la aplicación: si alguien intenta modificárselo por la API, un trigger revierte el cambio en silencio. Este `UPDATE` es la única puerta, y se usa una sola vez. A partir de ahí se promueven administradores desde el panel.

---

## Cómo está organizado

```
src/
├─ app/              Router, layouts y guardas de ruta
├─ modules/          Un módulo por dominio, todos con la misma anatomía
│  ├─ auth/ news/ events/ results/ players/ tutorials/ profile/ admin/
│  └─ <módulo>/{pages,components,hooks,services}
├─ shared/           Lo que de verdad se comparte
│  ├─ components/ui  Sistema de diseño arcade
│  ├─ lib/           Cliente de Supabase, caché, catálogos
│  ├─ utils/         Fechas, formato, avatares
│  └─ types/         Tipos del esquema
└─ styles/           Tokens y estilos base

supabase/migrations/ Esquema de la base de datos (fuente de verdad)
scripts/prerender.mjs Metaetiquetas y sitemap para compartir enlaces
```

### Tres reglas que sostienen todo

**1. Solo los servicios hablan con Supabase.** Ningún componente importa el cliente directamente. Si mañana cambia el proveedor o se renombra una tabla, se toca un archivo y no cuarenta componentes.

**2. Un módulo no importa de otro módulo.** Lo que necesiten compartir sube a `shared/`. Sin esta regla, las carpetas serían decorativas y el proyecto sería un monolito con buena apariencia.

**3. La seguridad vive en la base de datos, no aquí.** La llave publicable viaja dentro del JavaScript: cualquiera puede leerla y consultar la API directamente. Todo lo que ves en el frontend sobre permisos sirve para decidir qué se muestra, nunca para proteger. La protección real son las políticas RLS de `supabase/migrations/0008_rls.sql`.

---

## Decisiones que conviene no revertir sin pensarlo

**Los datos personales están en otra tabla.** El nombre real y la fecha de nacimiento viven en `profile_private`, no en `profiles`. RLS filtra filas, no columnas: si estuvieran juntos, cualquier política que permita ver perfiles ajenos los expondría. El correo ni siquiera se copia, vive solo en `auth.users`.

**Los resultados son una fila por posición.** Permite pasar de top 4 a top 8 sin migrar datos en producción, y `guest_nickname` cubre el caso real de que suba al podio alguien sin cuenta.

**El personaje se guarda por resultado.** El main de un jugador cambia con los años; el que usó en un torneo concreto es un hecho histórico. Sin este dato, las estadísticas de la Fase 3 serían imposibles y no se podrían reconstruir.

**Los avatares de personaje se dibujan por código.** Un monograma SVG con las iniciales sobre el color del personaje. Usar imágenes reales sería material con copyright.

**Todas las fechas son `timestamptz`.** Se guardan en UTC y se muestran en hora de la Ciudad de México con etiqueta explícita. Guardar horas sin zona es la causa número uno de torneos anunciados a la hora equivocada.

**El prerenderizado no usa una librería de SSG.** `scripts/prerender.mjs` consulta Supabase al compilar y escribe las metaetiquetas de cada noticia, evento y tutorial. Sin eso, compartir un enlace en WhatsApp o Discord mostraría una tarjeta vacía. Una librería de SSG obligaría a reestructurar el router para resolver algo que aquí son sustituciones de texto.

---

## Estado del proyecto

**Fase 1 — completa.** Autenticación, perfiles públicos y privados, noticias, eventos, calendario, resultados, directorio de jugadores, tutoriales y panel de administración completo.

**Preparado, sin interfaz todavía:** reportes, overlays de OBS y votaciones en vivo. Sus rutas, permisos y tablas ya existen; completarlos será rellenar pantallas, no rediseñar nada.

**Pendiente de configuración:** SMTP propio. El correo integrado de Supabase envía solo unos pocos mensajes por hora. Funciona para probar, pero hay que configurarlo antes de anunciar el sitio a la comunidad, o la mayoría de los registros nunca recibirá su correo de confirmación.

---

## Verificación realizada

- Esquema completo aplicado y probado contra PostgreSQL 16, incluyendo pruebas de RLS como anónimo, jugador y administrador
- Compilación y verificación de tipos en modo estricto, sin errores ni advertencias
- API de producción comprobada: la llave publicable lee lo que debe y no ve lo que no debe

Detalle de las pruebas de base de datos en `supabase/README.md`.

---

Sitio no oficial creado por la comunidad. No está afiliado ni patrocinado por ninguna empresa. Todas las marcas registradas pertenecen a sus respectivos propietarios.
