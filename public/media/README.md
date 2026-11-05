# Video hero de la landing

La landing (`/`) reproduce automáticamente, si existen, estos archivos (el fondo animado de marca
queda como respaldo y el video entra con fundido al cargar):

| Archivo | Uso |
|---|---|
| `hero-1080.webm` / `hero-1080.mp4` | Escritorio, 16:9, 1920×1080 |
| `hero-720.webm` / `hero-720.mp4` | Móvil (<768px), 720p |
| `hero-poster.jpg` | Fotograma de portada |

Duración 6–8 s, sin audio, loop sin corte, < 4 MB por archivo.

## Prompt sugerido (Higgsfield · Seedance 2.5 / Kling 3.0, 16:9, 1080p, sin audio)

> Cinematic slow aerial drift over a premium residential development at blue hour: modern white
> villas with warm lit windows, manicured gardens, a calm infinity pool, paved access roads.
> Smooth forward dolly with subtle parallax, shallow haze, deep carbon-black shadows and
> emerald-green rim light, fine film grain. Dark, premium, technological mood. No text, no logos,
> no people, no invented landmarks. Seamless loop.

Usa fotografía real del inmueble como `start_image` (image-to-video) para respetar la regla de
fidelidad de la marca; evita añadir amenidades que no existan.

## Exportar con ffmpeg

```bash
ffmpeg -i in.mp4 -an -vf scale=1920:1080 -c:v libx264 -crf 24 -preset slow -movflags +faststart hero-1080.mp4
ffmpeg -i in.mp4 -an -vf scale=1920:1080 -c:v libvpx-vp9 -crf 33 -b:v 0 hero-1080.webm
ffmpeg -i in.mp4 -an -vf scale=1280:720  -c:v libx264 -crf 26 -preset slow -movflags +faststart hero-720.mp4
ffmpeg -i in.mp4 -an -vf scale=1280:720  -c:v libvpx-vp9 -crf 35 -b:v 0 hero-720.webm
ffmpeg -i in.mp4 -frames:v 1 -q:v 3 hero-poster.jpg
```
