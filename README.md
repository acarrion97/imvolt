# IMVOLT Frontend

Interfaz de **IMVOLT — MARKETING INMOBILIARIO AI**: plataforma SaaS para crear, publicar y
medir contenido inmobiliario generado con IA.

La UI sigue el **prototipo interactivo (IMVOLT · UI Concept 01)** sobre Clean Architecture
(Repository, TanStack Query + caché IndexedDB) y el **Manual de Marca IMVOLT v1**: tipografía
Inter, sidebar carbón `#101719`, fondo niebla `#F5F8F6`, verde vivo `#00D94B` en acciones
primarias y verde de enlace `#008E47` (contraste AA).

```
Inicio · Mis propiedades · Estudio IA · Plantillas · Campañas Meta · Contactos ·
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
| `/proyectos` | Proyectos | ABM de desarrollos (enlace desde Mis propiedades) |

## Estructura (Clean Architecture)

```
src/
├── domain/            Entidades IMVOLT (snake_case, IDs UUID = esquema SQL)
│   ├── proyecto/  propiedad/  plantilla/  modelo/  generacion/
│   ├── campana/   lead/       credito/    conexion/
│   └── core/repositories/CrudRepository.ts   Contrato CRUD genérico
├── application/       Casos de uso (CRUD genérico + negocio: recarga, validar campaña)
├── infrastructure/
│   ├── container/     Composition root: repositorio → caso de uso
│   ├── repositories/  mock (InMemory, con semillas) y rest (Fetch)
│   ├── seeds/         Datos semilla realistas por defecto
│   ├── cache/         queryKeys, persistencia IndexedDB y política por dominio
│   └── http/          Cliente HTTP (timeout, Bearer, ApiError)
└── presentation/
    ├── theme/         brand.ts, temas AntD (light/dark) y art.css (ilustraciones)
    ├── components/    layout/ (Sidebar carbón + topbar), common/ (DataTable, estados)
    ├── hooks/         useProyectos, usePropiedades, useGeneraciones, ...
    ├── validations/   Esquemas Zod por formulario
    └── pages/         inicio, propiedades, plantillas, estudio, campanas,
                       contactos, analitica, configuracion, proyectos
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
- **Multi-tenant**: la API acota por `organization_id`; en modo REST el header `X-Org-Id` viaja
  desde la configuración de sesión.
- **§07 fidelidad de contenido**: los renders IA se etiquetan como conceptuales en catálogo y
  Estudio. **§09**: la cotización sale del registro vivo de modelos (nunca hardcodeada).

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
