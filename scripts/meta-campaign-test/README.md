# Prueba de creación de campaña en Meta

Script aislado (no forma parte del bundle del frontend) para probar la creación de una campaña
`OUTCOME_TRAFFIC` en estado `PAUSED` con el SDK oficial de Meta.

```bash
cd scripts/meta-campaign-test
npm install
cp .env.example .env      # y completa META_ACCESS_TOKEN
npm run validar           # valida con Meta sin crear nada
npm run crear             # crea la campaña (pausada)
```

- El token necesita el permiso `ads_management` y acceso a la cuenta publicitaria.
- Para anuncios inmobiliarios Meta suele exigir `special_ad_categories: ['HOUSING']`.
- `META_DEBUG=1` activa el debug del SDK, que imprime el token en la URL: no pegues esa salida.
- Los secretos de Meta no van en el frontend; en producción esta lógica vive en `imvolt-api`.
