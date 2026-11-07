import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "./landing.css";

/**
 * Landing IMVOLT — patrón "scroll-fusion" (ver .claude/skills/landing-scroll-fusion).
 *
 * Un escenario fijado (pin) recorre 4 actos mientras el usuario hace scroll:
 *   1. Hero: una propiedad flota sobre fondo carbón.
 *   2. Transición: el fondo pasa a niebla, la cinta verde baja y la cadena entra.
 *   3. Ballet: la cinta forma una espiral y las 5 etapas orbitan con etiquetas.
 *   4. Revelado: todo converge en un anuncio listo para revisar.
 *
 * Todo está dibujado en código (SVG/CSS); no depende de imágenes generadas.
 * Los datos de ejemplo son ilustrativos y así se rotulan en pantalla.
 */

gsap.registerPlugin(ScrollTrigger);

// ── Utilidades ──────────────────────────────────────────────────────────────
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}

interface Scene {
  hero: number; // 1 = hero visible, 0 = salió
  dark: number; // 0 = fondo carbón, 1 = fondo niebla
  ribbon: number; // longitud/visibilidad de la cinta
  amp: number; // amplitud de la espiral
  phase: number; // giro continuo
  enter: number; // entrada de las tarjetas
  orbit: number; // mezcla dispersión → órbita
  angle: number; // ángulo de órbita
  lines: number; // líneas guía con etiquetas
  fall: number; // convergencia hacia el teléfono
  phone: number; // aparición del teléfono
}

const INITIAL_SCENE: Scene = {
  hero: 1,
  dark: 0,
  ribbon: 0,
  amp: 0,
  phase: 0,
  enter: 0,
  orbit: 0,
  angle: 0,
  lines: 0,
  fall: 0,
  phone: 0,
};

// Estado final estático para movimiento reducido
const STATIC_SCENE: Scene = {
  hero: 0,
  dark: 1,
  ribbon: 1,
  amp: 0.7,
  phase: 1.2,
  enter: 1,
  orbit: 1,
  angle: 0.5,
  lines: 1,
  fall: 0,
  phone: 0,
};

const CHAIN = [
  { title: "Propiedad", sub: "Datos y fotografías" },
  { title: "Estrategia IA", sub: "Oferta, copy, guion" },
  { title: "Creativos", sub: "Imagen y video" },
  { title: "Meta Ads", sub: "Campañas aprobadas" },
  { title: "Resultados", sub: "Leads y analítica" },
] as const;

const STEPS = [
  {
    title: "Propiedad",
    text: "Carga tu casa, lote o proyecto con datos y fotografías verificados.",
  },
  {
    title: "Estrategia IA",
    text: "La IA propone oferta, copy y guion a partir de información real.",
  },
  {
    title: "Creativos",
    text: "Genera imágenes y videos con plantillas pensadas para inmuebles.",
  },
  {
    title: "Meta Ads",
    text: "Prepara la campaña y publícala solo después de tu aprobación.",
  },
  {
    title: "Resultados",
    text: "Mide inversión, contactos y oportunidades en un solo lugar.",
  },
] as const;

// ── Datos e ilustraciones ───────────────────────────────────────────────────
/**
 * Propiedades de ejemplo para el selector interactivo. Los nombres y ciudades
 * salen de los datos ilustrativos del prototipo (Documento Maestro); las
 * imágenes son renders conceptuales generados con IA, no inmuebles reales.
 */
const PROPS = [
  {
    key: "casa",
    label: "Casa",
    title: "Casa Mirador",
    place: "Samborondón, Ecuador",
    adLine: "Casa en Samborondón · Conoce la propiedad",
    img: "/landing/prop-casa.webp",
    alt: "Render conceptual de una casa moderna rodeada de vegetación",
  },
  {
    key: "lote",
    label: "Lote",
    title: "Urbanización Aurora",
    place: "Machala, Ecuador",
    adLine: "Lotes en Machala · Conoce el proyecto",
    img: "/landing/prop-lote.webp",
    alt: "Render conceptual aéreo de una lotización con vías y áreas verdes",
  },
  {
    key: "departamento",
    label: "Departamento",
    title: "Torre Horizonte",
    place: "Quito, Ecuador",
    adLine: "Departamentos en Quito · Conoce el proyecto",
    img: "/landing/prop-departamento.webp",
    alt: "Render conceptual de un edificio de departamentos con balcones",
  },
] as const;

/** Las 3 imágenes se apilan y la activa se funde: cambiar de tipo no recarga nada. */
function PropArt({ sel, className }: { sel: number; className?: string }) {
  return (
    <div className={`lp-art ${className ?? ""}`}>
      {PROPS.map((p, i) => (
        <img
          key={p.key}
          src={p.img}
          alt={i === sel ? p.alt : ""}
          aria-hidden={i !== sel}
          className={i === sel ? "is-active" : undefined}
          decoding="async"
        />
      ))}
    </div>
  );
}

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ICONS: ReactNode[] = [
  <svg key="home" {...iconProps}>
    <path d="M3 11l9-8 9 8" />
    <path d="M5 10v10h14V10" />
  </svg>,
  <svg key="spark" {...iconProps}>
    <path d="M12 3l2.2 5.8L20 11l-5.8 2.2L12 19l-2.2-5.8L4 11l5.8-2.2z" />
  </svg>,
  <svg key="film" {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M10 9.5v5l4.5-2.5z" />
  </svg>,
  <svg key="ads" {...iconProps}>
    <path d="M7 17L17 7" />
    <path d="M8 7h9v9" />
  </svg>,
  <svg key="chart" {...iconProps}>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-7" />
    <path d="M22 20H2" />
  </svg>,
];

// Posiciones relativas (fracción del escenario) en estado disperso
const SCATTER_DESKTOP: Array<[number, number]> = [
  [0.17, 0.42],
  [0.82, 0.36],
  [0.27, 0.74],
  [0.76, 0.72],
  [0.5, 0.84],
];
const SCATTER_MOBILE: Array<[number, number]> = [
  [0.27, 0.34],
  [0.73, 0.42],
  [0.27, 0.58],
  [0.73, 0.68],
  [0.5, 0.84],
];

// ── "Cómo funciona": recorrido interactivo de 5 pasos ───────────────────────
function HowWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="lp-win">
      <div className="lp-win__bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{title}</span>
      </div>
      <div className="lp-win__body">{children}</div>
    </div>
  );
}

/** Vistas previas de ejemplo (ilustrativas): no muestran cifras ni resultados reales. */
function HowPanel({ i }: { i: number }) {
  switch (i) {
    case 0:
      return (
        <HowWindow title="Nueva propiedad">
          <div className="lp-fields">
            <div className="lp-field">
              <span>Nombre</span>
              <b>Torre Horizonte</b>
            </div>
            <div className="lp-field">
              <span>Tipo</span>
              <b>Departamento</b>
            </div>
            <div className="lp-field">
              <span>Ubicación</span>
              <b>Quito, Ecuador</b>
            </div>
          </div>
          <div className="lp-field-label">Fotografías</div>
          <div className="lp-thumbs">
            {["18% 28%", "52% 84%", "90% 22%"].map((origin) => (
              <span className="lp-thumb" key={origin}>
                <img
                  src={PROPS[2].img}
                  alt=""
                  style={{ transformOrigin: origin }}
                  decoding="async"
                  loading="lazy"
                />
              </span>
            ))}
          </div>
          <span className="lp-chip-ok">Datos verificados por ti</span>
        </HowWindow>
      );
    case 1:
      return (
        <HowWindow title="Estrategia IA">
          <div className="lp-blocks">
            <div className="lp-block">
              <span>Oferta</span>
              <p>Presenta tu proyecto a compradores interesados en vivir en Quito.</p>
            </div>
            <div className="lp-block">
              <span>Copy</span>
              <p>“Conoce Torre Horizonte, un proyecto pensado para tu próximo hogar.”</p>
            </div>
            <div className="lp-block">
              <span>Guion</span>
              <ol>
                <li>Fachada</li>
                <li>Interior</li>
                <li>Llamado a la acción</li>
              </ol>
            </div>
          </div>
          <span className="lp-chip-ok">Propuesta de ejemplo</span>
        </HowWindow>
      );
    case 2:
      return (
        <HowWindow title="Estudio IA">
          <div className="lp-media">
            <img src={PROPS[0].img} alt="" decoding="async" loading="lazy" />
            <span className="lp-play" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
          <div className="lp-fmts">
            <span>Imagen</span>
            <span className="is-on">Video</span>
            <span>9:16 · Reels y Stories</span>
            <span>Plantilla: recorrido de fachada</span>
          </div>
          <span className="lp-chip-ok">Render conceptual</span>
        </HowWindow>
      );
    case 3:
      return (
        <HowWindow title="Campaña Meta · Borrador">
          <div className="lp-fields">
            <div className="lp-field">
              <span>Objetivo</span>
              <b>Mensajes de WhatsApp</b>
            </div>
            <div className="lp-field">
              <span>Creativos</span>
              <b>Los que tú aprobaste</b>
            </div>
            <div className="lp-field">
              <span>Presupuesto</span>
              <b>Lo defines tú</b>
            </div>
          </div>
          <ol className="lp-flow">
            <li className="is-done">Borrador</li>
            <li className="is-now">Tu revisión</li>
            <li>Publicación</li>
          </ol>
          <p className="lp-note">Nada se publica ni se gasta sin tu aprobación.</p>
        </HowWindow>
      );
    default:
      return (
        <HowWindow title="Resultados">
          <div className="lp-metrics">
            <div>
              <span>Inversión</span>
              <b>—</b>
            </div>
            <div>
              <span>Contactos</span>
              <b>—</b>
            </div>
            <div>
              <span>Oportunidades</span>
              <b>—</b>
            </div>
          </div>
          <div className="lp-bars lp-bars--lg" aria-hidden="true">
            {[34, 52, 44, 70, 58, 86, 100].map((h, k) => (
              <i key={k} style={{ height: `${h}%` }} />
            ))}
          </div>
          <p className="lp-note">
            Ejemplo: aquí verás tus datos reales cuando conectes tus cuentas.
          </p>
        </HowWindow>
      );
  }
}

/** Scroll por paso: la sección queda fija y cada tramo de scroll equivale a ~60 % del alto de pantalla. */
const HOW_VH_PER_STEP = 0.6;

function HowItWorks() {
  const [step, setStep] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const triggerRef = useRef<ScrollTrigger | null>(null);

  // El scroll recorre los 5 pasos mientras la sección permanece fija en pantalla.
  useEffect(() => {
    const el = sectionRef.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sin movimiento (o en pantallas demasiado bajas) no se fija: los pasos se eligen con clic.
    if (!el || reduce || window.innerHeight < 560) return;
    const n = STEPS.length;
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: () => `+=${Math.round(window.innerHeight * HOW_VH_PER_STEP * n)}`,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      refreshPriority: 1,
      onUpdate: (self) => {
        const x = Math.min(self.progress * n, n - 0.0001);
        const idx = Math.floor(x);
        setStep(idx);
        // La barra del paso activo se llena según el scroll dentro de ese paso
        tabRefs.current.forEach((tab, k) =>
          tab?.style.setProperty("--p", k === idx ? (x - idx).toFixed(3) : "0"),
        );
      },
    });
    triggerRef.current = st;
    return () => {
      st.kill();
      triggerRef.current = null;
    };
  }, []);

  // En móvil la lista es horizontal: centra el paso activo sin mover la página
  useEffect(() => {
    const tab = tabRefs.current[step];
    const list = tab?.parentElement;
    if (tab && list && list.scrollWidth > list.clientWidth) {
      list.scrollTo({
        left: tab.offsetLeft - (list.clientWidth - tab.clientWidth) / 2,
        behavior: "smooth",
      });
    }
  }, [step]);

  /** Ir a un paso: con la sección fija se desplaza el scroll hasta ese tramo. */
  const goTo = (i: number, focus = false) => {
    const n = STEPS.length;
    const target = (i + n) % n;
    const st = triggerRef.current;
    if (st) {
      const y = st.start + (st.end - st.start) * ((target + 0.5) / n);
      window.scrollTo({ top: y, behavior: "smooth" });
    } else {
      setStep(target);
    }
    if (focus) tabRefs.current[target]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = e.key === "ArrowDown" || e.key === "ArrowRight";
    const prev = e.key === "ArrowUp" || e.key === "ArrowLeft";
    if (next || prev) {
      e.preventDefault();
      goTo(step + (next ? 1 : -1), true);
    } else if (e.key === "Home" || e.key === "End") {
      e.preventDefault();
      goTo(e.key === "Home" ? 0 : STEPS.length - 1, true);
    }
  };

  return (
    <section className="lp-steps" aria-labelledby="lp-steps-title" ref={sectionRef}>
      <div className="lp-steps__head">
        <span className="lp-kicker">Cómo funciona</span>
        <h2 className="lp-h2" id="lp-steps-title">
          De una propiedad a una campaña profesional.
        </h2>
      </div>

      <div className="lp-how">
        <div
          className="lp-how__tabs"
          role="tablist"
          aria-orientation="vertical"
          onKeyDown={onKeyDown}
        >
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`lp-tab-${i}`}
              aria-selected={i === step}
              aria-controls={`lp-panel-${i}`}
              tabIndex={i === step ? 0 : -1}
              className={`lp-tab${i === step ? " is-active" : ""}`}
              onClick={() => goTo(i)}
            >
              <span className="lp-tab__n">0{i + 1}</span>
              <span className="lp-tab__t">{s.title}</span>
              <span className="lp-tab__d">{s.text}</span>
              <span className="lp-tab__bar" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="lp-how__stage">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className={`lp-panel${i === step ? " is-active" : ""}`}
              role="tabpanel"
              id={`lp-panel-${i}`}
              aria-labelledby={`lp-tab-${i}`}
              inert={i !== step}
            >
              <HowPanel i={i} />
              <p className="lp-panel__cap">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Componente ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [sel, setSel] = useState(0);
  const prop = PROPS[sel];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stage = root.querySelector<HTMLElement>(".lp-stage")!;
    const pin = root.querySelector<HTMLElement>(".lp-pin")!;
    const navLabel = root.querySelector<HTMLElement>(".lp-nav__label")!;
    const sectionNo = root.querySelector<HTMLElement>(".lp-section-no")!;
    const cards = gsap.utils.toArray<HTMLElement>(".lp-card", root);
    const phone = root.querySelector<HTMLElement>(".lp-phone")!;
    const heroText = root.querySelector<HTMLElement>(".lp-t--hero")!;
    const picker = root.querySelector<HTMLElement>(".lp-picker")!;
    const act4 = root.querySelector<HTMLElement>(".lp-t--act4")!;
    const gradient = root.querySelector<SVGLinearGradientElement>("#lp-ribbon-grad")!;
    const strandA = root.querySelector<SVGPathElement>("#lp-strand-a")!;
    const strandB = root.querySelector<SVGPathElement>("#lp-strand-b")!;
    const strandC = root.querySelector<SVGPathElement>("#lp-strand-c")!;
    const lineEls = gsap.utils.toArray<SVGLineElement>(".lp-leader", root);
    const dotEls = gsap.utils.toArray<SVGCircleElement>(".lp-leader-dot", root);

    const scene: Scene = { ...INITIAL_SCENE };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) Object.assign(scene, STATIC_SCENE);

    let currentLabel = "";
    const LABELS = [
      "01 · Propiedad",
      "02 · Estrategia y creativos",
      "03 · La cadena completa",
      "04 · Tu campaña",
    ];

    const render = () => {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const mobile = W < 760;
      const cx = W / 2;

      // Colores del escenario
      stage.style.background = mix("#101719", "#F2F7F4", scene.dark);
      stage.style.setProperty("--lp-fg", mix("#FFFFFF", "#101719", scene.dark));
      stage.style.setProperty("--lp-muted", mix("#A9AFB0", "#4A5A55", scene.dark));

      // Tamaños responsivos
      const cardW = mobile ? Math.min(158, W * 0.42) : 214;
      stage.style.setProperty("--lp-cardw", `${cardW}px`);
      // Teléfono: ocupa el espacio libre entre el título del acto 4 y el selector
      const shortPhone = mobile && H <= 720;
      const phoneRatio = shortPhone ? 15 / 9 : 18.2 / 9;
      const phoneTop = act4.offsetTop + act4.offsetHeight + 16;
      const phoneBottom = picker.offsetTop - 14;
      const phoneW = Math.max(
        120,
        Math.min(mobile ? W * 0.6 : 250, (phoneBottom - phoneTop) / phoneRatio),
      );
      stage.style.setProperty("--lp-phonew", `${phoneW.toFixed(1)}px`);
      stage.style.setProperty("--lp-phone-ratio", (1 / phoneRatio).toFixed(4));
      const phoneCy = (phoneTop + phoneBottom) / 2;

      // ── Cinta (doble hélice) ──
      const y0 = 68 + H * 0.02;
      const y1 = y0 + (H - y0 - H * 0.02) * clamp(scene.ribbon);
      const amp = scene.amp * Math.min(W * 0.17, 140);
      const turns = 2.1;
      const N = 70;
      const ribbonX = (t: number, off: number) =>
        cx +
        amp *
          Math.pow(Math.sin(Math.PI * clamp(t)), 0.7) *
          Math.sin(2 * Math.PI * turns * t + scene.phase + off);
      const build = (off: number) => {
        let d = "";
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const y = lerp(y0, y1, t);
          d += `${k === 0 ? "M" : "L"}${ribbonX(t, off).toFixed(1)} ${y.toFixed(1)} `;
        }
        return d;
      };
      const ribbonAlpha = clamp(scene.ribbon * 2) * (1 - clamp(scene.fall * 1.3));
      gradient.setAttribute("y2", String(H));
      strandA.setAttribute("d", build(0));
      strandB.setAttribute("d", build(Math.PI));
      strandC.setAttribute("d", build(Math.PI / 2));
      strandA.style.opacity = String(ribbonAlpha);
      strandB.style.opacity = String(ribbonAlpha * 0.55);
      strandC.style.opacity = String(ribbonAlpha * 0.3);

      // ── Tarjetas ──
      const scatter = mobile ? SCATTER_MOBILE : SCATTER_DESKTOP;
      let heroPos: [number, number] = [0.74, 0.53];
      let heroScale = 1.45;
      if (mobile) {
        // La tarjeta del hero ocupa el espacio libre entre el texto y el selector.
        const textBottom = heroText.offsetTop + heroText.offsetHeight;
        const pickerTop = picker.offsetTop;
        const band = pickerTop - textBottom - 28;
        heroScale = clamp(band / (cards[0].offsetHeight || 200), 0.6, 1.15);
        heroPos = [0.5, (textBottom + pickerTop) / 2 / H];
      }
      const orbitCy = H * 0.56;
      const rx = mobile ? W * 0.3 : Math.min(W * 0.4, 430);
      const ry = mobile ? Math.min(H * 0.34, 300) : Math.min(H * 0.3, 250);
      const yFactor = mobile ? 0.95 : 0.55;

      cards.forEach((card, i) => {
        const sx = scatter[i][0] * W;
        const sy = scatter[i][1] * H;

        // Entrada escalonada (la tarjeta 0 ya está en el hero)
        const e = i === 0 ? 1 : clamp(scene.enter * 2.4 - (i - 1) * 0.45);

        // Posición dispersa (con transición desde el hero para la tarjeta 0)
        let px = sx;
        let py = sy + (1 - e) * H * 0.34;
        let scale = 1;
        if (i === 0) {
          px = lerp(sx, heroPos[0] * W, scene.hero);
          py = lerp(sy, heroPos[1] * H, scene.hero);
          scale = lerp(1, heroScale, scene.hero);
        }

        // Órbita
        const theta = scene.angle + (i * Math.PI * 2) / CHAIN.length;
        const depth = (Math.sin(theta) + 1) / 2;
        const ox = cx + rx * Math.cos(theta);
        const oy = orbitCy + ry * Math.sin(theta) * yFactor;
        px = lerp(px, ox, scene.orbit);
        py = lerp(py, oy, scene.orbit);
        const orbitScale = mobile ? lerp(0.78, 0.98, depth) : lerp(0.82, 1.08, depth);
        scale = lerp(scale, orbitScale, scene.orbit);
        const z = Math.round(lerp(5, 15, depth * scene.orbit));

        // Convergencia hacia el teléfono
        px = lerp(px, cx, scene.fall);
        py = lerp(py, phoneCy, scene.fall);
        scale *= 1 - 0.78 * scene.fall;

        const rot =
          (1 - e) * (i % 2 ? 10 : -10) + scene.orbit * (1 - scene.fall) * Math.sin(theta) * 4;
        const alpha =
          e * lerp(1, lerp(0.92, 1, depth), scene.orbit) * (1 - clamp((scene.fall - 0.35) / 0.4));

        card.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(2)}deg)`;
        card.style.opacity = alpha.toFixed(3);
        card.style.zIndex = String(z);
        card.style.pointerEvents = alpha > 0.5 ? "auto" : "none";

        // ── Línea guía con etiqueta ──
        const line = lineEls[i];
        const dot = dotEls[i];
        if (line && dot) {
          const ty = (py - y0) / Math.max(1, y1 - y0);
          const rxp = ribbonX(ty, 0);
          const edge = px + (px > rxp ? -1 : 1) * (cardW / 2) * scale;
          const len = Math.abs(edge - rxp);
          line.setAttribute("x1", rxp.toFixed(1));
          line.setAttribute("y1", py.toFixed(1));
          line.setAttribute("x2", edge.toFixed(1));
          line.setAttribute("y2", py.toFixed(1));
          line.style.strokeDasharray = `${len.toFixed(1)}`;
          line.style.strokeDashoffset = `${(len * (1 - scene.lines)).toFixed(1)}`;
          line.style.opacity = String(scene.lines * alpha);
          dot.setAttribute("cx", rxp.toFixed(1));
          dot.setAttribute("cy", py.toFixed(1));
          dot.style.opacity = String(scene.lines * alpha);
        }
      });

      // ── Teléfono ──
      const pe = clamp(scene.phone);
      const phoneScale = lerp(0.88, 1, pe);
      phone.style.transform = `translate(-50%, ${(phoneCy + (1 - pe) * H * 0.45).toFixed(1)}px) translate(0, -50%) scale(${phoneScale.toFixed(3)})`;
      phone.style.opacity = String(pe);

      // ── Etiqueta de sección ──
      let idx = 0;
      if (scene.fall > 0.05) idx = 3;
      else if (scene.orbit > 0.15) idx = 2;
      else if (scene.hero < 0.5) idx = 1;
      const label = LABELS[idx];
      if (label !== currentLabel) {
        currentLabel = label;
        navLabel.textContent = label;
        sectionNo.textContent = `Sección 0${idx + 1}`;
      }
    };

    // ── Modo movimiento reducido: sin pin, composición estática ──
    if (reduce) {
      gsap.set(".lp-t--hero, .lp-t--act2, .lp-t--act4", { autoAlpha: 0 });
      gsap.set(".lp-t--act3", { autoAlpha: 1 });
      render();
      const onResize = () => render();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    // ── Scroll suave ──
    const lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      render();

      // Entrada del hero
      gsap.from(".lp-t--hero > *", {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.1,
        delay: 0.15,
      });

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          refreshPriority: 2,
          trigger: pin,
          start: "top top",
          end: "+=480%",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        onUpdate: render,
      });

      // Escena (estado numérico)
      tl.to(scene, { hero: 0, dark: 1, duration: 18 }, 8)
        .to(scene, { ribbon: 1, amp: 0.25, duration: 20 }, 12)
        .to(scene, { enter: 1, duration: 18, ease: "power2.out" }, 26)
        .to(
          scene,
          { amp: 1, orbit: 1, angle: Math.PI * 1.4, duration: 30, ease: "power1.inOut" },
          44,
        )
        .to(scene, { lines: 1, duration: 10, ease: "none" }, 56)
        .to(scene, { lines: 0, duration: 6, ease: "none" }, 74)
        .to(scene, { phone: 1, duration: 14, ease: "power2.out" }, 74)
        .to(scene, { fall: 1, duration: 18, ease: "power2.in" }, 80)
        .to(scene, { phase: Math.PI * 7, duration: 100, ease: "none" }, 0)
        .to({}, { duration: 0.001 }, 100);

      // Textos por acto
      tl.to(".lp-t--hero", { autoAlpha: 0, y: -80, duration: 10, ease: "power2.in" }, 4)
        .fromTo(".lp-t--act2", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 10 }, 22)
        .to(".lp-t--act2", { autoAlpha: 0, y: -40, duration: 8, ease: "power2.in" }, 42)
        .fromTo(".lp-t--act3", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 10 }, 46)
        .to(".lp-t--act3", { autoAlpha: 0, y: -40, duration: 8, ease: "power2.in" }, 72)
        .fromTo(".lp-t--act4", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 10 }, 84)
        // El selector se oculta mientras la cinta y las tarjetas ocupan el escenario
        .to(".lp-picker", { autoAlpha: 0, y: 14, duration: 6, ease: "power2.in" }, 6)
        .fromTo(
          ".lp-picker",
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 8, immediateRender: false },
          90,
        );
    }, root);

    const onRefresh = () => render();
    ScrollTrigger.addEventListener("refresh", onRefresh);
    window.addEventListener("resize", onRefresh);

    return () => {
      ScrollTrigger.removeEventListener("refresh", onRefresh);
      window.removeEventListener("resize", onRefresh);
      ctx.revert();
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="lp-root" ref={rootRef}>
      <header className="lp-nav">
        <Link to="/" className="lp-nav__logo" aria-label="IMVOLT · MARKETING INMOBILIARIO AI">
          <img src="/logo/IMVOLT_Isotipo_Sobre_Oscuro.png" alt="IMVOLT" />
        </Link>
        <span className="lp-nav__label" aria-hidden="true">
          01 · Propiedad
        </span>
        <div className="lp-nav__actions">
          <Link to="/login" className="lp-link">
            Iniciar sesión
          </Link>
          <Link to="/registro" className="lp-btn">
            Crear con AI
          </Link>
        </div>
      </header>

      <main>
        <div className="lp-pin">
          <section className="lp-stage" aria-label="De la propiedad al anuncio">
            <div className="lp-stage__lines" aria-hidden="true" />
            <span className="lp-section-no" aria-hidden="true">
              Sección 01
            </span>

            <svg className="lp-ribbon" aria-hidden="true">
              <defs>
                <linearGradient
                  id="lp-ribbon-grad"
                  gradientUnits="userSpaceOnUse"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="800"
                >
                  <stop offset="0" stopColor="#04EB40" />
                  <stop offset="1" stopColor="#075335" />
                </linearGradient>
              </defs>
              <path
                id="lp-strand-c"
                fill="none"
                stroke="#00D94B"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                id="lp-strand-b"
                fill="none"
                stroke="#075335"
                strokeWidth="13"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                id="lp-strand-a"
                fill="none"
                stroke="url(#lp-ribbon-grad)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <svg className="lp-leaders" aria-hidden="true">
              {CHAIN.map((c) => (
                <g key={c.title}>
                  <line
                    className="lp-leader"
                    stroke="currentColor"
                    strokeOpacity="0.55"
                    strokeWidth="1.2"
                    style={{ color: "#4A5A55", opacity: 0 }}
                  />
                  <circle className="lp-leader-dot" r="4" fill="#00D94B" style={{ opacity: 0 }} />
                </g>
              ))}
            </svg>

            {/* Acto 1 */}
            <div className="lp-t lp-t--hero">
              <img
                className="lp-hero-logo"
                src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png"
                alt="IMVOLT MARKETING INMOBILIARIO AI"
              />
              <h1 className="lp-h1">Tu próxima campaña comienza con una propiedad.</h1>
              <p className="lp-sub">
                Crea imágenes, videos y campañas listas para revisar. Una nueva forma de impulsar tu
                inventario inmobiliario.
              </p>
              <div className="lp-actions">
                <Link to="/registro" className="lp-btn">
                  Crear mi primer creativo →
                </Link>
              </div>
            </div>

            {/* Acto 2 */}
            <div className="lp-t lp-t--center lp-t--act2">
              <h2 className="lp-h2">Crea. Anuncia. Vende.</h2>
              <p className="lp-sub">Del inmueble al anuncio, en pocos clics.</p>
            </div>

            {/* Acto 3 */}
            <div className="lp-t lp-t--center lp-t--act3">
              <h2 className="lp-h2">Todo tu proceso, en una sola plataforma.</h2>
              <p className="lp-sub">
                Propiedad, estrategia, creativos, campañas y resultados conectados entre sí.
              </p>
            </div>

            {/* Acto 4 */}
            <div className="lp-t lp-t--center lp-t--act4">
              <h2 className="lp-h2">Tu campaña, lista para revisar.</h2>
              <p className="lp-sub">Revisa, ajusta y aprueba antes de publicar.</p>
            </div>

            {/* Tarjetas de la cadena */}
            {CHAIN.map((c, i) => (
              <article className="lp-card" key={c.title}>
                {i === 0 ? (
                  <>
                    <PropArt sel={sel} className="lp-card__art" />
                    <div className="lp-card__title">{prop.title}</div>
                    <div className="lp-card__sub">{prop.place}</div>
                    <span className="lp-card__tag">Render conceptual</span>
                  </>
                ) : (
                  <>
                    <div className="lp-card__icon">{ICONS[i]}</div>
                    <div className="lp-card__title">{c.title}</div>
                    <div className="lp-card__sub">{c.sub}</div>
                    {i === 4 && (
                      <div className="lp-bars" aria-hidden="true">
                        {[40, 62, 48, 80, 100].map((h, k) => (
                          <i key={k} style={{ height: `${h}%` }} />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}

            {/* Anuncio final */}
            <div className="lp-phone" aria-label="Vista previa de un anuncio de ejemplo">
              <div className="lp-phone__screen">
                <div className="lp-phone__bar">
                  <span className="lp-phone__avatar">
                    <img src="/logo/IMVOLT_Isotipo_Sobre_Oscuro.png" alt="" />
                  </span>
                  Tu marca
                  <span className="lp-phone__tag">Anuncio de ejemplo</span>
                </div>
                <PropArt sel={sel} className="lp-phone__art" />
                <div className="lp-phone__copy">
                  <b>{prop.title}</b>
                  <span>{prop.adLine}</span>
                  <ul className="lp-phone__rows">
                    <li>Creativo revisado</li>
                    <li>Copy redactado con tus datos</li>
                    <li className="is-pending">Pendiente: tu aprobación</li>
                  </ul>
                  <div className="lp-phone__cta">Más información</div>
                </div>
              </div>
            </div>

            {/* Selector interactivo: visible en el hero y en el anuncio final */}
            <div className="lp-picker" role="group" aria-label="Tipo de propiedad">
              <span className="lp-picker__label">Prueba con tu propiedad</span>
              {PROPS.map((p, i) => (
                <button
                  key={p.key}
                  type="button"
                  className={`lp-chip${i === sel ? " is-active" : ""}`}
                  aria-pressed={i === sel}
                  onClick={() => setSel(i)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>
        </div>

        <HowItWorks />

        <section className="lp-cta" aria-labelledby="lp-cta-title">
          <h2 className="lp-h2" id="lp-cta-title">
            Convierte tus proyectos en campañas que generan oportunidades.
          </h2>
          <div className="lp-actions">
            <Link to="/registro" className="lp-btn">
              Crear mi primer creativo →
            </Link>
            <Link to="/login" className="lp-btn lp-btn--ghost">
              Iniciar sesión
            </Link>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <img
          src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png"
          alt="IMVOLT MARKETING INMOBILIARIO AI"
        />
        <p>
          Contenido ilustrativo. IMVOLT no garantiza ventas ni resultados publicitarios: toda
          campaña requiere tu aprobación antes de publicarse.
        </p>
      </footer>
    </div>
  );
}
