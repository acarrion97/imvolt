import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
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

// ── Ilustraciones en SVG ────────────────────────────────────────────────────
function PropertyArt({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 220 128"
      role="img"
      aria-label="Ilustración de una casa"
    >
      <defs>
        <linearGradient id="lp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f2f7f4" />
          <stop offset="1" stopColor="#cfe9db" />
        </linearGradient>
        <linearGradient id="lp-hill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#04eb40" />
          <stop offset="1" stopColor="#075335" />
        </linearGradient>
      </defs>
      <rect width="220" height="128" fill="url(#lp-sky)" />
      <circle cx="184" cy="26" r="13" fill="#fff" opacity=".85" />
      <ellipse cx="60" cy="132" rx="140" ry="40" fill="#0a7a46" />
      <ellipse cx="190" cy="136" rx="110" ry="34" fill="url(#lp-hill)" />
      <rect x="64" y="58" width="96" height="48" rx="3" fill="#101719" />
      <polygon points="58,60 112,30 166,60" fill="#1d2a2c" />
      <rect x="76" y="70" width="26" height="22" rx="2" fill="#00d94b" opacity=".9" />
      <rect x="110" y="70" width="14" height="36" rx="2" fill="#2a3a3c" />
      <rect x="132" y="70" width="18" height="22" rx="2" fill="#00d94b" opacity=".55" />
      <circle cx="34" cy="92" r="14" fill="#075335" />
      <rect x="32" y="100" width="4" height="12" fill="#101719" />
      <circle cx="190" cy="96" r="11" fill="#075335" />
      <rect x="188" y="102" width="4" height="10" fill="#101719" />
    </svg>
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

// ── Componente ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const stage = root.querySelector<HTMLElement>(".lp-stage")!;
    const pin = root.querySelector<HTMLElement>(".lp-pin")!;
    const navLabel = root.querySelector<HTMLElement>(".lp-nav__label")!;
    const sectionNo = root.querySelector<HTMLElement>(".lp-section-no")!;
    const cards = gsap.utils.toArray<HTMLElement>(".lp-card", root);
    const phone = root.querySelector<HTMLElement>(".lp-phone")!;
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
      stage.style.setProperty("--lp-phonew", `${Math.min(mobile ? W * 0.6 : 250, H * 0.34)}px`);

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
      const heroPos: [number, number] = mobile ? [0.5, 0.76] : [0.74, 0.53];
      const heroScale = mobile ? 1.15 : 1.45;
      const orbitCy = H * 0.56;
      const rx = mobile ? W * 0.3 : Math.min(W * 0.4, 430);
      const ry = mobile ? Math.min(H * 0.34, 300) : Math.min(H * 0.3, 250);
      const yFactor = mobile ? 0.95 : 0.55;
      const phoneCy = H * 0.6;

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
        .fromTo(".lp-t--act4", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 10 }, 84);
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
                    <PropertyArt className="lp-card__art" />
                    <div className="lp-card__title">Urbanización Aurora</div>
                    <div className="lp-card__sub">Machala, Ecuador</div>
                    <span className="lp-card__tag">Ejemplo ilustrativo</span>
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
                <PropertyArt className="lp-phone__art" />
                <div className="lp-phone__copy">
                  <b>Urbanización Aurora</b>
                  <span>Lotes en Machala · Conoce el proyecto</span>
                  <ul className="lp-phone__rows">
                    <li>Creativo revisado</li>
                    <li>Copy redactado con tus datos</li>
                    <li className="is-pending">Pendiente: tu aprobación</li>
                  </ul>
                  <div className="lp-phone__cta">Más información</div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="lp-steps" aria-labelledby="lp-steps-title">
          <div className="lp-steps__head">
            <span className="lp-kicker">Cómo funciona</span>
            <h2 className="lp-h2" id="lp-steps-title">
              De una propiedad a una campaña profesional.
            </h2>
          </div>
          <div className="lp-steps__grid">
            {STEPS.map((s, i) => (
              <article className="lp-step" key={s.title}>
                <span className="lp-step__n">0{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </article>
            ))}
          </div>
        </section>

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
