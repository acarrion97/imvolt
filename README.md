# IMVOLT Frontend

Interfaz de **IMVOLT — MARKETING INMOBILIARIO AI**: plataforma SaaS para crear, publicar y
medir contenido inmobiliario generado con IA.

La UI sigue el **prototipo interactivo (IMVOLT · UI Concept 01)** sobre Clean Architecture
(Repository, TanStack Query + caché IndexedDB) y el **Manual de Marca IMVOLT v1**: tipografía
Inter, sidebar carbón `#101719`, fondo niebla `#F5F8F6`, verde vivo `#00D94B` en acciones
primarias y verde de enlace `#008E47` (contraste AA).

```
Inicio · Mis propiedades · Estudio IA · Plantillas · Brand Kit · Campañas Meta · Contactos ·
Analítica · Configuración   (+ Proyectos, secundaria)
```

## Arranque

```bash
npm install
cp .env.example .env    # en Windows: copy .env.example .env
npm run dev
```

Por defecto `VITE_DATA_PROVIDER=mock`: arranca con **semillas IMVOLT** en memoria (3 proyectos,
4 propiedades, plantillas, generaciones en varios estados, campañas en distintas fases del flujo
§10 y leads de ejemplo), sin backend. Para conectar la API real (`/api`):

```bash
VITE_DATA_PROVIDER=rest
VITE_API_URL=http://localhost:3000/api
```

## Autenticación

Con `VITE_DATA_PROVIDER=rest` la app exige sesión:

- `/login` llama a `POST /api/auth/login` y persiste la sesión en `localStorage`
  (clave `imvolt-session`); `presentation/auth/AuthProvider.tsx` la restaura con
  `GET /api/auth/me` al recargar y expone `useAuth()` → `status`, `perfil`,
  `rol`, `login()`, `logout()`.
- Todas las rutas pasan por `RequireAuth`: sin sesión → `/login` recordando la
  ruta original en `state.from`. El cierre de sesión (menú del usuario en la
  topbar) borra la sesión y la caché persistida en IndexedDB.
- `infrastructure/http/httpClient.ts` envía `Authorization: Bearer <token>` y
  `X-Empresa-Id` (empresa activa resuelta por `/auth/me`); un **401** en
  cualquier petición cierra la sesión en toda la app.
- En modo `mock` **no hay login**: el `AuthProvider` queda en `disabled` y la
  app arranca directo al Inicio, como siempre.

El registro todavía no tiene pantalla: se hace con `POST /api/auth/register`
desde `/documentacion` del API.

## Equipo, auditoría y organización (identity)

`/equipo` (Administración → Equipo): miembros de la empresa con **invitación**
(`POST /v1/usuarios/invitaciones`, devuelve una contraseña temporal de 7 días que se
muestra una sola vez), **cambio de rol** (§13), activar/desactivar acceso y la
**bitácora de auditoría** (`GET /v1/auditoria`, solo propietario/administrador, con
filtro por acción/tabla y detalle expandible). Las acciones se puertean con
`usePermisos()` a partir de `permisos[]` de `/auth/me`; el API sigue siendo la autoridad.
En Configuración, el perfil de trabajo edita razón social y RUC (`PATCH /v1/empresas/{id}`).

## Catálogo (proyectos, propiedades, medios, Brand Kit)

- **Proyectos** y **Propiedades** usan el contrato del API (`proyecto_id`, `empresa_id`,
  `creado_en`, `estado: activo|inactivo`); una propiedad puede asignarse a un proyecto
  (`proyecto_id`, `null` = individual) y la tarjeta muestra su proyecto.
- **Medios** (`/medios`, `/api/v1/media-assets`): metadatos (categoría imagen/video/
  documento/otro, vínculo opcional a proyecto y propiedad) + versiones en bucket privado
  (100 MB, validación de MIME cliente espejo del API), miniatura y descarga por URL
  firmada de 5 min, historial con restaurar/eliminar versión.
- **Brand Kit** (`/brand-kit`): archivos con versiones y paleta de colores.

## Pantallas

| Ruta | Pantalla | Contenido |
|------|----------|-----------|
| `/inicio` | Inicio | Hero de marca, 4 métricas, acciones rápidas y propiedades recientes |
| `/propiedades` | Mis propiedades | Rejilla de tarjetas con ilustración (terreno/casa/torre/oficina), filtros y alta en Drawer |
| `/estudio` | Estudio IA | Modo fácil/pro, plantilla + modelo (§09 catálogo vivo), prompt generado y preview con cotización en créditos |
| `/plantillas` | Plantillas | Pestañas por categoría y tarjetas listas para usar en el Estudio |
| `/campanas` | Campañas Meta | Asistente 3 pasos (Datos → Objetivo → Revisión) + resumen + flujo §10 |
| `/contactos` | Contactos | Pipeline de leads por fuente y estado (§11) |
| `/analitica` | Analítica | Leads por día, lectura de resultados y distribución por fuente |
| `/configuracion` | Configuración | Integraciones (Higgsfield/Meta/Lotes al Mando), billetera de créditos y perfil |
| `/brand-kit` | Brand Kit | Subida de archivos de marca (logos, iconos, fuentes…) y paleta de colores; máximo 10 MB por archivo y tipos según categoría, con descarga por URL firmada desde el bucket privado `brand-kit` |
| `/proyectos` | Proyectos | ABM de desarrollos (enlace desde Mis propiedades) |

## Estructura (Clean Architecture)

```
src/
├── domain/            Entidades IMVOLT (snake_case, IDs UUID = esquema SQL)
│   ├── proyecto/  propiedad/  plantilla/  modelo/  generacion/
│   ├── campana/   lead/       credito/    conexion/   auth/      brand-kit/
│   └── core/repositories/CrudRepository.ts   Contrato CRUD genérico
├── application/       Casos de uso (CRUD genérico + negocio: recarga, validar campaña)
├── infrastructure/
│   ├── container/     Composition root: repositorio → caso de uso
│   ├── repositories/  mock (InMemory, con semillas) y rest (Fetch)
│   ├── seeds/         Datos semilla realistas por defecto
│   ├── cache/         queryKeys, persistencia IndexedDB y política por dominio
│   ├── auth/          sessionStore: sesión en localStorage + suscriptores
│   └── http/          Cliente HTTP (timeout, Bearer, ApiError)
└── presentation/
    ├── theme/         brand.ts, temas AntD (light/dark) y art.css (ilustraciones)
    ├── components/    layout/ (Sidebar carbón + topbar), common/ (DataTable, estados)
    ├── auth/          AuthProvider + useAuth (estado de sesión)
    ├── hooks/         useProyectos, usePropiedades, useGeneraciones, ...
    ├── validations/   Esquemas Zod por formulario
    └── pages/         inicio, propiedades, plantillas, estudio, brand-kit, campanas,
                       contactos, analitica, configuracion, proyectos, auth/login
```

Los estilos del prototipo viven en `src/index.css` (clases `.sidebar`, `.hero`, `.item-card`,
`.template-card`, `.studio-preview`, `.steps`, `.chart`…); las ilustraciones de las tarjetas de
propiedad están en `src/presentation/theme/art.css` (SVG del prototipo).

## Patrones clave

- **Repository**: cada entidad declara `resource` y agrega sus consultas (p.ej.
  `getByProyectoId`); el CRUD viene resuelto por `RestCrudRepository` / `InMemoryCrudRepository`.
- **Invalidación**: toda escritura invalida `domainKey("<dominio>")`, refrescando listados y
  consultas por foránea de un golpe.
- **Caché persistida**: solo `plantillas`, `modelos` y `proyectos` sobreviven al cierre del
  navegador (política explícita en `cache/cachePolicy.ts`).
- **Multi-tenant**: la API acota por `empresa_id`; en modo REST el header `X-Empresa-Id`
  viaja desde la sesión (empresa activa resuelta con `GET /api/auth/me`).
- **§07 fidelidad de contenido**: los renders IA se etiquetan como conceptuales en catálogo y
  Estudio. **§09**: la cotización sale del registro vivo de modelos (nunca hardcodeada).
- **Subida de archivos**: los `<Upload>` validan tamaño y tipo antes de enviar (espejo del API:
  10 MB máximo y catálogo de MIME por categoría en `domain/brand-kit`), con `Upload.LIST_IGNORE`
  para descartar el archivo inválido sin disparar la petición; las descargas resuelven URL
  firmada de 5 minutos vía `GET /brand-assets/:id/descarga`.

## Comandos

```bash
npm run dev        # desarrollo
npm run build      # typecheck (tsc -b) + bundle de producción
npm run lint       # eslint
npm run format     # prettier
```

## Roles (§13)

`propietario` · `administrador` · `marketing` · `agente` · `lector` — la UI mock asume permisos
completos; el gating por rol vive en la API.
