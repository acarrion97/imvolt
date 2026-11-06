"""Genera export/ghl/imvolt-landing-ghl.html (landing en un solo archivo para GoHighLevel).

Uso (desde la raíz del repo; requiere Pillow):
    python3 export/ghl/build/build.py

Toma el CSS real de src/presentation/pages/landing/landing.css (prefijando cada selector
con #imvolt-lp), embebe los logos de public/logo y las fotos de public/landing, y
rellena template.html. Si cambias la landing de React, vuelve a correr este script.
"""
import base64, io, re, sys
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
REPO = str(HERE.parents[2])
OUT = sys.argv[1] if len(sys.argv) > 1 else str(HERE.parent / "imvolt-landing-ghl.html")

# ── Logos oficiales reducidos y embebidos (WebP con transparencia) ──
def data_uri(path, width):
    im = Image.open(path).convert("RGBA")
    h = round(im.height * width / im.width)
    im = im.resize((width, h), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=90, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())

logo_h, sz_h = data_uri(f"{REPO}/public/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png", 560)
logo_i, sz_i = data_uri(f"{REPO}/public/logo/IMVOLT_Isotipo_Sobre_Oscuro.png", 160)

# ── CSS del proyecto, con todos los selectores prefijados por #imvolt-lp ──
css = open(f"{REPO}/src/presentation/pages/landing/landing.css", encoding="utf-8").read()
css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)

def prefix(css):
    out, i = [], 0
    while True:
        j = css.find("{", i)
        if j == -1:
            break
        sel = css[i:j].strip()
        depth, k = 1, j + 1
        while depth:
            c = css[k]
            depth += (c == "{") - (c == "}")
            k += 1
        body = css[j + 1:k - 1]
        if sel.startswith("@media"):
            out.append(f"{sel}{{{prefix(body)}}}")
        elif sel.startswith("@keyframes"):
            out.append(f"{sel}{{{body.strip()}}}")   # los pasos from/to no se prefijan
        else:
            parts = []
            for s in (x.strip() for x in sel.split(",")):
                if s.startswith("html") or s.startswith(".lenis"):
                    parts.append(s)
                elif s.startswith(".lp-root"):
                    parts.append("#imvolt-lp" + s)
                else:
                    parts.append("#imvolt-lp " + s)
            out.append(f"{','.join(parts)}{{{body.strip()}}}")
        i = k
    return "\n".join(out)

css = prefix(css)
css += """
/* ── Ajustes para GoHighLevel ── */
body { overflow-x: clip; }
#imvolt-lp.lp-root {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: left;
}
#imvolt-lp, #imvolt-lp *, #imvolt-lp *::before, #imvolt-lp *::after { box-sizing: border-box; }
#imvolt-lp img { max-width: 100%; }
#imvolt-lp .lp-footer img { display: block; }
#imvolt-lp h1, #imvolt-lp h2, #imvolt-lp h3, #imvolt-lp p, #imvolt-lp ul { font-family: inherit; }
/* Neutraliza estilos globales del tema de GHL (especificidad baja: las clases .lp-* siguen mandando) */
#imvolt-lp :where(h1, h2, h3, p, a, span, li, b, div, header, footer, article, section) {
  text-transform: none;
  font-style: normal;
  text-decoration: none;
  text-shadow: none;
}
#imvolt-lp :where(h1, h2, h3, p, ul) { padding: 0; }
#imvolt-lp :where(p, li) { line-height: 1.5; }
#imvolt-lp :where(h1, h2, h3, p) { color: inherit; }
#imvolt-lp :where(p) { font-size: inherit; }
#imvolt-lp :where(ol, ul, li) { color: inherit; font-size: inherit; }
#imvolt-lp :where(li) { margin: 0; }
#imvolt-lp .lp-flow li, #imvolt-lp .lp-phone__rows li { list-style: none; }
#imvolt-lp .lp-block li { list-style: decimal; }
#imvolt-lp img { border: 0; box-shadow: none; outline: 0; }
#imvolt-lp :where(button) { margin: 0; text-transform: none; box-shadow: none; letter-spacing: normal; }
"""

def prop_uri(name):
    im = Image.open(f"{REPO}/public/landing/prop-{name}.webp").convert("RGB")
    im = im.resize((560, round(im.height * 560 / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=76, method=6)
    return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())

img_casa, sz_c = prop_uri("casa")
img_lote, sz_l = prop_uri("lote")
img_depto, sz_d = prop_uri("departamento")
print(f"propiedades: casa {sz_c/1024:.1f} KB · lote {sz_l/1024:.1f} KB · departamento {sz_d/1024:.1f} KB")

html = open(HERE / "template.html", encoding="utf-8").read()
html = (html.replace("/*__CSS__*/", css)
            .replace("__IMG_CASA__", img_casa)
            .replace("__IMG_LOTE__", img_lote)
            .replace("__IMG_DEPARTAMENTO__", img_depto)
            .replace("__LOGO_ISO__", logo_i)
            .replace("__LOGO_H__", logo_h))
for ph in ("/*__CSS__*/", "__IMG_CASA__", "__IMG_LOTE__", "__IMG_DEPARTAMENTO__", "__LOGO_ISO__", "__LOGO_H__"):
    assert ph not in html, "marcador sin reemplazar: " + ph
open(OUT, "w", encoding="utf-8").write(html)
print(f"logo horizontal {sz_h/1024:.1f} KB · isotipo {sz_i/1024:.1f} KB · archivo final {len(html)/1024:.1f} KB")
