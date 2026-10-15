# IMVOLT Frontend

Interfaz de **IMVOLT — MARKETING INMOBILIARIO AI**: plataforma SaaS para crear, publicar y
medir contenido inmobiliario generado con IA.

Aplica el **Manual de Marca IMVOLT v1** (Inter, paleta carbón/verde, regla 70/20/10) sobre la
plantilla frontend (Clean Architecture, patrón Repository, TanStack Query + caché IndexedDB).

```
Dashboard · Proyectos · Propiedades · Plantillas · Estudio IA · Campañas · Contactos ·
Analítica · Configuración
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
    ├── theme/         Tokens de marca (light/dark) y ThemeProvider
    ├── components/    brand/ (logos), layout/ (Sidebar carbón), common/
    ├── hooks/         useProyectos, usePropiedades, useGeneraciones, ...
    ├── validations/   Esquemas Zod por formulario
    └── pages/         dashboard, proyectos, propiedades, plantillas,
                       estudio, campanas, contactos, analitica, configuracion
```

## Patrones clave

- **Repository**: cada entidad declara `resource` y agrega sus consultas (p.ej.
  `getByProyectoId`); el CRUD viene resuelto por `RestCrudRepository` / `InMemoryCrudRepository`.
- **Invalidación**: toda escritura invalida `domainKey("<dominio>")`, refrescando listados y
  consultas por foránea de un golpe.
- **Caché persistida**: solo `plantillas`, `modelos` y `proyectos` sobreviven al cierre del
  navegador (política explícita en `cache/cachePolicy.ts`).
- **Multi-tenant**: la API acota por `organization_id`; en modo REST el header `X-Org-Id` viaja
  desde la configuración de sesión.

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
