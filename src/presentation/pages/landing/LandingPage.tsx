import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import "./landing.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * Landing pública de IMVOLT (`/`).
 *
 * Beats de scroll: Hero (video) → Flujo fijado → Revelado de Studio →
 * Módulos → Fidelidad → Segmentos (interacción) → CTA.
 *
 * Reglas de marca (Manual v1): descriptor "MARKETING INMOBILIARIO AI", verde
 * como énfasis (~10 %), Inter, sin promesas de ventas garantizadas.
 *
 * Video hero: si existen `/media/hero-1080.mp4|webm` (escritorio) y
 * `/media/hero-720.mp4|webm` (móvil) el video entra con fundido sobre el fondo
 * animado; si no, el fondo animado es la composición final. Ver public/media/README.md.
 */

const FLOW = [
  { n: "01", title: "Propiedad", text: "Datos y fotografías verificados de tu inmueble." },
  { n: "02", title: "Estrategia IA", text: "Ángulos, oferta, copy y guion desde información real." },
  { n: "03", title: "Creativos", text: "Imágenes y videos con plantillas por tipo de inmueble." },
  { n: "04", title: "Meta Ads", text: "Borradores que tú apruebas. Nada se activa sin tu autorización." },
  { n: "05", title: "Resultados", text: "Inversión, contactos y oportunidades en un solo lugar." },
];

const MODULES = [
  {
    name: "IMVOLT Studio",
    text: "Crea imágenes y videos con plantillas, modelos y vista previa. Modo Fácil por defecto.",
  },
  {
    name: "IMVOLT Ads",
    text: "Objetivos, presupuestos y creativos en borradores que apruebas antes de publicar.",
  },
  {
    name: "IMVOLT Pulse",
    text: "Mide inversión, contactos y oportunidades en un solo lugar.",
  },
  {
    name: "IMVOLT Connect",
    text: "Vínculo opcional con Lotes al Mando y otros sistemas autorizados.",
  },
];

const PILLARS = [
  { title: "Fiel a tu inmueble", text: "Conserva geometría, materiales y entorno. Los renders se identifican como conceptuales." },
  { title: "Tú decides", text: "Cotización antes de cada generación y aprobación explícita antes de publicar." },
  { title: "Campañas en pausa", text: "Los recursos nacen en estado pausado. Ningún gasto se activa por una acción ambigua." },
];

const SEGMENTS = [
  {
    id: "dev",
    tab: "Desarrolladores",
    title: "Comercializa varios proyectos con un solo equipo.",
    job: "Promociona lotizaciones, urbanizaciones y proyectos sobre planos con información de inventario consistente.",
    points: ["Portafolio por proyectos", "Campañas con aprobaciones", "Integración opcional con Lotes al Mando"],
  },
  {
    id: "inmo",
    tab: "Inmobiliarias",
    title: "Un catálogo compartido para todos tus agentes.",
    job: "Promociona distintos inmuebles de múltiples propietarios con equipos comerciales y marcas.",
    points: ["Catálogo compartido", "Permisos por usuario", "Contactos asignables"],
  },
  {
    id: "agente",
    tab: "Agentes independientes",
    title: "Publicidad profesional sin armar un equipo de marketing.",
    job: "Pasa de la ficha de tu propiedad a un anuncio listo para revisar, guiado paso a paso.",
    points: ["Alta rápida de propiedad", "Asistente de una pantalla por paso", "Campañas guiadas"],
  },
];

const FIDELITY_TEXT =
  "Un creativo generado con IA no prueba que la propiedad exista. Por eso IMVOLT parte de datos verificados, identifica lo conceptual y deja la decisión final en tus manos.";

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span className="lp-w" key={i}>
          {w}{" "}
        </span>
      ))}
    </>
  );
}

export function LandingPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [segment, setSegment] = useState(SEGMENTS[0].id);
  const [videoReady, setVideoReady] = useState(false);
  const active = SEGMENTS.find((s) => s.id === segment) ?? SEGMENTS[0];

  useEffect(() => {
    const prev = document.title;
    document.title = "IMVOLT · MARKETING INMOBILIARIO AI — Crea. Anuncia. Vende.";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const ready = () => setVideoReady(true);
    video.addEventListener("loadeddata", ready);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) video.pause();
    return () => video.removeEventListener("loadeddata", ready);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = gsap.utils.selector(root);

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      // Los triggers se crean en orden de página (flujo antes que revelado) para que
      // el espaciado de cada pin se calcule bien.
      // 2 · FLUJO — fijado en escritorio
      mm.add("(prefers-reduced-motion: no-preference) and (min-width: 768px)", () => {
        const steps = q(".lp-step");
        gsap.set(steps, { opacity: 0.28, y: 24 });
        const tl = gsap.timeline({
          scrollTrigger: { trigger: q(".lp-flow")[0], start: "top top", end: "+=2200", pin: true, scrub: 0.6, anticipatePin: 1 },
        });
        tl.fromTo(q(".lp-flow__fill"), { scaleX: 0 }, { scaleX: 1, ease: "none", duration: steps.length }, 0);
        steps.forEach((s, i) => {
          tl.to(s, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, i);
          tl.fromTo(q(".lp-step__dot")[i], { scale: 0.6 }, { scale: 1, duration: 0.4 }, i);
        });
        tl.to({}, { duration: 0.6 });
      });

      // 2 · FLUJO — móvil: aparece al hacer scroll
      mm.add("(prefers-reduced-motion: no-preference) and (max-width: 767px)", () => {
        gsap.set(q(".lp-step"), { opacity: 0, y: 36 });
        ScrollTrigger.batch(q(".lp-step"), {
          start: "top 90%",
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" }),
        });
      });

      // ── Todo movimiento solo con "no-preference" ─────────────────────────
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95 });
        lenisRef.current = lenis;
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (t: number) => lenis.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // Progreso de lectura + barra de navegación
        gsap.to(q(".lp-progress"), {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom bottom", scrub: 0.3 },
        });
        ScrollTrigger.create({
          start: 60,
          end: "max",
          onToggle: (self) => q(".lp-nav").forEach((n) => n.classList.toggle("is-solid", self.isActive)),
        });

        // 1 · HERO — entrada
        const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
        intro
          .from(q(".lp-nav"), { y: -30, opacity: 0, duration: 0.9 })
          .from(q(".lp-hero__lines path"), { strokeDashoffset: 1, duration: 2.4, stagger: 0.07, ease: "power2.out" }, 0)
          .from(q(".lp-hero__glow"), { opacity: 0, scale: 0.8, duration: 2 }, 0)
          .from(q(".lp-hero__eyebrow"), { y: 18, opacity: 0, duration: 0.8 }, 0.25)
          .from(q(".lp-hero__title .lp-line__in"), { yPercent: 115, duration: 1.1, stagger: 0.13 }, 0.35)
          .from(q(".lp-hero__sub"), { y: 24, opacity: 0, duration: 0.9 }, 0.9)
          .from(q(".lp-hero__cta > *"), { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 1.05)
          .from(q(".lp-hero__note"), { opacity: 0, duration: 0.8 }, 1.4)
          .from(q(".lp-hero__mark"), { x: 80, opacity: 0, scale: 0.92, duration: 1.6 }, 0.4)
          .from(q(".lp-hero__scroll"), { opacity: 0, duration: 0.8 }, 1.8);

        gsap.to(q(".lp-hero__mark"), { y: -18, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });

        // HERO — scroll: el contenido se aleja, el fondo respira
        const heroScroll = gsap.timeline({
          scrollTrigger: { trigger: q(".lp-hero")[0], start: "top top", end: "bottom top", scrub: true },
        });
        heroScroll
          .to(q(".lp-hero__content"), { yPercent: -18, opacity: 0.1, ease: "none" }, 0)
          .to(q(".lp-hero__mark"), { yPercent: -28, scale: 1.12, ease: "none" }, 0)
          .to(q(".lp-hero__media"), { scale: 1.12, ease: "none" }, 0);

        // 3 · REVELADO — marco → pantalla completa (todas las pantallas)
        const reveal = q(".lp-reveal")[0];
        const frame = q(".lp-reveal__frame")[0];
        const isSmall = window.matchMedia("(max-width: 767px)").matches;
        gsap.set(frame, { clipPath: isSmall ? "inset(24% 7% round 22px)" : "inset(17% 21% round 28px)" });
        gsap
          .timeline({
            scrollTrigger: { trigger: reveal, start: "top top", end: "+=1700", pin: true, scrub: 0.6, anticipatePin: 1 },
          })
          .to(q(".lp-reveal__intro"), { opacity: 0, y: -40, duration: 0.5 }, 0)
          .to(frame, { clipPath: "inset(0% 0% round 0px)", ease: "power2.inOut", duration: 1.2 }, 0)
          .fromTo(q(".lp-reveal__ui"), { scale: 1.18 }, { scale: 1, ease: "none", duration: 1.2 }, 0)
          .from(q(".lp-reveal__cap"), { opacity: 0, y: 40, duration: 0.5 }, 1)
          .from(q(".lp-reveal__chip"), { opacity: 0, y: 16, stagger: 0.12, duration: 0.4 }, 1.1)
          .to({}, { duration: 0.4 });

        // 5 · MÓDULOS
        gsap.set(q(".lp-card"), { opacity: 0, y: 48 });
        ScrollTrigger.batch(q(".lp-card"), {
          start: "top 88%",
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }),
        });

        // 6 · FIDELIDAD — texto que se enciende palabra a palabra
        gsap.fromTo(
          q(".lp-fidelity__text .lp-w"),
          { opacity: 0.16 },
          {
            opacity: 1,
            stagger: 0.12,
            ease: "none",
            scrollTrigger: { trigger: q(".lp-fidelity__text")[0], start: "top 78%", end: "bottom 48%", scrub: true },
          },
        );
        gsap.set(q(".lp-pillar"), { opacity: 0, y: 40 });
        ScrollTrigger.batch(q(".lp-pillar"), {
          start: "top 90%",
          onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, stagger: 0.14, ease: "power3.out" }),
        });

        // 7 · CTA
        gsap.from(q(".lp-cta__inner > *"), {
          opacity: 0,
          y: 40,
          stagger: 0.12,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: { trigger: q(".lp-cta")[0], start: "top 70%" },
        });
        gsap.fromTo(
          q(".lp-cta__lines"),
          { yPercent: 12 },
          { yPercent: -12, ease: "none", scrollTrigger: { trigger: q(".lp-cta")[0], start: "top bottom", end: "bottom top", scrub: true } },
        );

        return () => {
          gsap.ticker.remove(tick);
          lenis.destroy();
          lenisRef.current = null;
        };
      });
    }, root);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById((e.currentTarget.getAttribute("href") ?? "").slice(1));
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -10 });
    else el.scrollIntoView({ behavior: "auto" });
  };

  return (
    <div className="lp" ref={rootRef}>
      <div className="lp-progress" aria-hidden="true" />

      <header className="lp-nav">
        <a className="lp-nav__logo" href="#inicio" onClick={go} aria-label="IMVOLT — Marketing Inmobiliario AI">
          <img src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png" alt="IMVOLT — Marketing Inmobiliario AI" height={40} />
        </a>
        <nav className="lp-nav__links" aria-label="Secciones">
          <a href="#como-funciona" onClick={go}>Cómo funciona</a>
          <a href="#modulos" onClick={go}>Módulos</a>
          <a href="#para-quien" onClick={go}>Para quién</a>
        </nav>
        <div className="lp-nav__actions">
          <Link className="lp-btn lp-btn--ghost lp-btn--sm" to="/login">Iniciar sesión</Link>
          <Link className="lp-btn lp-btn--primary lp-btn--sm" to="/registro">Crear cuenta</Link>
        </div>
      </header>

      <main>
        {/* 1 · HERO */}
        <section className="lp-hero" id="inicio" aria-labelledby="hero-title">
          <div className="lp-hero__media" aria-hidden="true">
            <div className="lp-hero__glow" />
            <svg className="lp-hero__lines" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
              {Array.from({ length: 16 }, (_, i) => (
                <path key={i} d={`M ${300 + i * 46} 640 L ${520 + i * 46} -40`} pathLength={1} strokeDasharray={1} />
              ))}
            </svg>
            <video
              ref={videoRef}
              className={`lp-hero__video${videoReady ? " is-ready" : ""}`}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/media/hero-poster.jpg"
            >
              <source src="/media/hero-720.webm" type="video/webm" media="(max-width: 767px)" />
              <source src="/media/hero-720.mp4" type="video/mp4" media="(max-width: 767px)" />
              <source src="/media/hero-1080.webm" type="video/webm" />
              <source src="/media/hero-1080.mp4" type="video/mp4" />
            </video>
            <div className="lp-hero__shade" />
          </div>
          <img className="lp-hero__mark" src="/logo/IMVOLT_Isotipo_Color.png" alt="" aria-hidden="true" />

          <div className="lp-hero__content">
            <p className="lp-hero__eyebrow">MARKETING INMOBILIARIO AI</p>
            <h1 id="hero-title" className="lp-hero__title">
              <span className="lp-line"><span className="lp-line__in">Crea.</span></span>
              <span className="lp-line"><span className="lp-line__in">Anuncia.</span></span>
              <span className="lp-line"><span className="lp-line__in lp-accent">Vende.</span></span>
            </h1>
            <p className="lp-hero__sub">
              Del inmueble al anuncio, en pocos clics. IMVOLT convierte las fotos y datos verificados de tus
              propiedades en videos, imágenes y campañas listas para revisar y publicar en Meta.
            </p>
            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--primary" to="/registro">Crear mi primera campaña</Link>
              <a className="lp-btn lp-btn--ghost" href="#como-funciona" onClick={go}>Ver cómo funciona</a>
            </div>
            <p className="lp-hero__note">Tú apruebas cada anuncio antes de publicarlo.</p>
          </div>
          <div className="lp-hero__scroll" aria-hidden="true"><span /></div>
        </section>

        {/* 2 · FLUJO (fijado) */}
        <section className="lp-flow" id="como-funciona" aria-labelledby="flow-title">
          <div className="lp-flow__wrap">
            <p className="lp-kicker">DE UNA PROPIEDAD A UNA CAMPAÑA</p>
            <h2 id="flow-title" className="lp-h2">Cinco pasos. Una sola plataforma.</h2>
            <div className="lp-flow__track" aria-hidden="true"><div className="lp-flow__fill" /></div>
            <ol className="lp-flow__steps">
              {FLOW.map((s) => (
                <li className="lp-step" key={s.n}>
                  <span className="lp-step__dot" aria-hidden="true" />
                  <span className="lp-step__n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* 3 · REVELADO */}
        <section className="lp-reveal" aria-labelledby="reveal-title">
          <div className="lp-reveal__intro">
            <p className="lp-kicker lp-kicker--dark">IMVOLT STUDIO</p>
            <h2 id="reveal-title" className="lp-h2 lp-h2--light">Crea contenido con IA, sin ser diseñador.</h2>
          </div>
          <div className="lp-reveal__frame">
            <div className="lp-reveal__ui" role="img" aria-label="Vista conceptual de IMVOLT Studio: configuración del creativo y vista previa del concepto">
              <div className="lp-ui">
                <aside className="lp-ui__panel">
                  <b>Configura tu creativo</b>
                  <span className="lp-ui__field"><i>Propiedad</i>Urbanización Aurora · Lotización</span>
                  <span className="lp-ui__field"><i>Plantilla</i>Vuelo aéreo cinematográfico</span>
                  <span className="lp-ui__field"><i>Formato</i>9:16 · Reels / Stories</span>
                  <span className="lp-ui__btn">Generar propuesta</span>
                </aside>
                <div className="lp-ui__preview">
                  <em>VISTA CONCEPTUAL · SIN GENERACIÓN REAL</em>
                  <strong>Vuelo aéreo cinematográfico</strong>
                  <small>Cámara suave sobre lotes y accesos reales. Sin añadir elementos no confirmados.</small>
                </div>
              </div>
            </div>
            <div className="lp-reveal__cap">
              <h3>Elige propiedad, objetivo y plantilla. IMVOLT escribe el prompt por ti.</h3>
              <ul>
                <li className="lp-reveal__chip">Cotización antes de generar</li>
                <li className="lp-reveal__chip">Modo Fácil y Modo Pro</li>
                <li className="lp-reveal__chip">Revisión de fidelidad</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4 · MÓDULOS */}
        <section className="lp-modules" id="modulos" aria-labelledby="modules-title">
          <div className="lp-wrap">
            <p className="lp-kicker">UN SISTEMA, CUATRO MÓDULOS</p>
            <h2 id="modules-title" className="lp-h2">Todo el ciclo publicitario, sin saltar entre herramientas.</h2>
            <div className="lp-cards">
              {MODULES.map((m, i) => (
                <article className="lp-card" key={m.name}>
                  <span className="lp-card__i">0{i + 1}</span>
                  <h3>{m.name}</h3>
                  <p>{m.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5 · FIDELIDAD */}
        <section className="lp-fidelity" aria-labelledby="fid-title">
          <div className="lp-wrap">
            <p className="lp-kicker lp-kicker--dark" id="fid-title">CONFIANZA Y CONTROL</p>
            <p className="lp-fidelity__text"><Words text={FIDELITY_TEXT} /></p>
            <div className="lp-pillars">
              {PILLARS.map((p) => (
                <div className="lp-pillar" key={p.title}>
                  <h3>{p.title}</h3>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 · SEGMENTOS (interacción) */}
        <section className="lp-segments" id="para-quien" aria-labelledby="seg-title">
          <div className="lp-wrap">
            <p className="lp-kicker">PARA QUIÉN ES</p>
            <h2 id="seg-title" className="lp-h2">Elige tu perfil y mira cómo trabajaría IMVOLT contigo.</h2>
            <div className="lp-tabs" role="tablist" aria-label="Perfiles">
              {SEGMENTS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  id={`tab-${s.id}`}
                  aria-selected={segment === s.id}
                  aria-controls="seg-panel"
                  className={`lp-tab${segment === s.id ? " is-on" : ""}`}
                  onClick={() => setSegment(s.id)}
                >
                  {s.tab}
                </button>
              ))}
            </div>
            <div className="lp-panel" id="seg-panel" role="tabpanel" aria-labelledby={`tab-${active.id}`} key={active.id}>
              <h3>{active.title}</h3>
              <p>{active.job}</p>
              <ul>
                {active.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 7 · CTA */}
        <section className="lp-cta" aria-labelledby="cta-title">
          <svg className="lp-cta__lines" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            {Array.from({ length: 14 }, (_, i) => (
              <line key={i} x1={260 + i * 52} y1={680} x2={480 + i * 52} y2={-80} />
            ))}
          </svg>
          <div className="lp-cta__inner">
            <h2 id="cta-title" className="lp-h2 lp-h2--light lp-h2--xl">Tu próxima campaña comienza con una propiedad.</h2>
            <p>Crea tu cuenta, agrega un inmueble y prepara tu primer creativo para revisar.</p>
            <div className="lp-hero__cta">
              <Link className="lp-btn lp-btn--primary" to="/registro">Crear mi primera campaña</Link>
              <Link className="lp-btn lp-btn--ghost" to="/login">Ya tengo cuenta</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <img src="/logo/IMVOLT_Logo_Horizontal_Sobre_Oscuro.png" alt="IMVOLT — Marketing Inmobiliario AI" height={34} />
        <nav aria-label="Legal">
          <a href="/privacidad.html">Privacidad</a>
          <a href="/terminos-servicio.html">Términos del servicio</a>
          <a href="/eliminacion-datos.html">Eliminación de datos</a>
        </nav>
        <small>© 2026 IMVOLT. Los resultados publicitarios dependen de cada inmueble, mercado e inversión; no se garantizan ventas.</small>
      </footer>
    </div>
  );
}

export default LandingPage;
