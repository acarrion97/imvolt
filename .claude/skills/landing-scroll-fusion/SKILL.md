---
name: landing-scroll-fusion
description: Receta de coreografía de scroll para landings "fusión": elementos del producto que aparecen, giran, caen, se desvanecen y se ensamblan en armonía mientras el usuario baja (referencia "Rosso / The Ingredient Ballet"). Úsala al diseñar o construir cualquier landing de imvolt adaptada a un nicho (restaurante, belleza, fitness, inmobiliaria, etc.) o al pedir "efecto de scroll", "elementos que giran y se complementan", "landing cinematográfica".
---

# Landing scroll-fusion

Patrón visual de referencia: una landing donde **un elemento protagonista (hilo conductor) atraviesa todas las secciones** y los elementos secundarios del nicho orbitan, caen, giran y se ensamblan hasta formar la imagen final del producto. El scroll no mueve la página: **mueve una línea de tiempo**.

Esta skill define la *coreografía y la técnica*. Para el proceso de producción (brief, assets con IA, QA) combínala con la skill `landing-cinematica-inmersiva`.

## Reglas de oro (imvolt)

1. **No tocar lo existente.** Todo va en archivos nuevos (p. ej. `src/presentation/pages/landings/<nicho>/`). Si hay que modificar un archivo existente (ruta, dependencias), el cambio es mínimo y se muestra al usuario antes.
2. Una landing nueva = una carpeta nueva autocontenida (componentes, estilos, assets, copy).
3. Antes de subir: `npm run build` y `npm run lint` deben pasar.
4. Trabajo siempre en la rama indicada; nunca en la principal, nunca PR sin pedirlo.
5. Cero placeholders en la entrega final; nunca inventar testimonios, cifras ni premios.

## Anatomía del patrón (5 actos)

| Acto | Qué ocurre | Técnica |
|---|---|---|
| 1. Hero | Fondo de color de marca, titular serif enorme, elemento protagonista con sus complementos, etiqueta "SECTION 01" lateral, nav fijo | Entrada con texto enmascarado + flotación suave |
| 2. Transición | Titular sube y se desvanece; **el fondo cambia de color** (oscuro → claro); el protagonista se estira y cruza a la siguiente sección | `background-color` ligado al scroll + protagonista con `z-index` superior |
| 3. Dispersión | Los ingredientes/elementos del nicho entran cada uno a distinta velocidad | Parallax por capas + `stagger` |
| 4. Ballet | El protagonista forma una espiral central; elementos giran alrededor; etiquetas con líneas finas apuntan a cada uno | Secuencia de fotogramas en canvas (o 3D) + SVG con `stroke-dashoffset` |
| 5. Revelado | Todo cae y se ensambla en la imagen final ("plato servido"); titular pasa *detrás* de los elementos; aparece el CTA | Caída con gravedad (`power2.in`/`bounce.out`), cambio de capas, botón de acción |

Constantes de la referencia: barra superior fija (logo, título de sección que cambia, "sign up", menú), numeración de secciones (01, 02, 03), tipografía serif elegante para titulares, paleta de 2 colores dominantes (oscuro de marca + crema).

## Recetas técnicas

Stack recomendado (pedir confirmación antes de agregar dependencias a `package.json`): `gsap` (+ `ScrollTrigger`), `lenis`. `three` solo si hay 3D real.

### Sección fijada con línea de tiempo
```ts
gsap.registerPlugin(ScrollTrigger);
const tl = gsap.timeline({
  scrollTrigger: { trigger: ref.current, start: 'top top', end: '+=4000', scrub: true, pin: true },
});
tl.to('.hero-titulo', { yPercent: -120, opacity: 0 })
  .to(ref.current, { backgroundColor: '#f3ead8' }, '<')
  .from('.ingrediente', { y: 240, rotate: -30, opacity: 0, stagger: 0.1 })
  .to('.etiqueta-linea', { strokeDashoffset: 0, stagger: 0.15 });
```

### Texto con máscara
Cada línea dentro de un contenedor `overflow: hidden`; el hijo sube con `yPercent: 100 → 0`.

### Protagonista animado (secuencia de fotogramas)
Canvas + array de imágenes (80–120 frames WebP). Un objeto `{ frame: 0 }` se anima con GSAP a `frame: N` con `snap: 'frame'` y `scrub`; en cada `onUpdate` se dibuja `images[frame]`. Precargar por tandas y mostrar el primer frame como poster.

### Caída de elementos
`from({ y: -400, rotate: gsap.utils.random(-40, 40), opacity: 0, ease: 'power2.in', stagger: 0.12 })`, con rebote final opcional.

### Texto detrás del producto
Titular con `z-index: 1`, elementos con `z-index: 2` (cambio de capa en el acto 5).

### Líneas con etiquetas
SVG con `path` y `stroke-dasharray` igual a su longitud; animar `stroke-dashoffset` de largo a 0.

## Adaptación por nicho

Cambiar solo estos 5 parámetros; la coreografía se mantiene:

| Parámetro | Restaurante (referencia) | Ejemplo belleza | Ejemplo fitness | Ejemplo inmobiliaria |
|---|---|---|---|---|
| Protagonista (hilo) | Pasta en espiral | Hilo de serum / listón | Cuerda / banda elástica | Cinta de planos que se pliega |
| Elementos orbitales | Mariscos, tomate, albahaca | Ingredientes activos, flores | Pesas, frutas, reloj | Muebles, plantas, llaves |
| Imagen final | Plato servido | Kit/producto armado | Atleta + rutina | Sala amueblada |
| Paleta | Granate + crema | Rosa palo + marfil | Negro + neón | Azul noche + arena |
| CTA | Reservar mesa | Comprar / probar | Agendar clase | Agendar visita |

## Assets necesarios por landing

1. Secuencia del protagonista (80–120 frames) — generada con IA o aportada.
2. PNG con fondo transparente de cada elemento orbital (2 variantes si aplica: entero/cortado).
3. Imagen final ensamblada (con plato/contexto).
4. Hero aprobado como ancla de paleta e iluminación (ver skill `landing-cinematica-inmersiva`).

Todo asset se guarda en la carpeta de la landing con nombre descriptivo y se lista en una tabla de inventario.

## Rendimiento y accesibilidad

- Móvil primero (390 px): menos fotogramas, sin 3D pesado, imágenes WebP/AVIF, `loading="lazy"` salvo el hero.
- `prefers-reduced-motion`: sustituir la línea de tiempo por transiciones simples y el protagonista por una imagen estática.
- Destruir `ScrollTrigger` y listeners al desmontar el componente (React 19: limpiar en el `return` del `useEffect` / usar `gsap.context`).
- Objetivo: LCP < 2.5 s en móvil.

## Checklist antes de entregar

- [ ] Sin cambios en archivos del programador (salvo ruta/dependencias acordadas)
- [ ] Los 5 actos se recorren hacia abajo y regresan limpios hacia arriba
- [ ] Móvil 390 px sin scroll horizontal
- [ ] Movimiento reducido funcional
- [ ] `npm run build` y `npm run lint` en verde
- [ ] Consola sin errores
