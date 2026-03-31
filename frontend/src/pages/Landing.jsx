import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell, Zap, Flame, Users, ClipboardList, Clock,
  MapPin, Phone, Instagram, MessageCircle, Facebook,
  ChevronRight, Menu, X, Check, Wrench, Calendar
} from "lucide-react";

const CLASSES = [
  { name: "Musculación", desc: "Sala equipada con máquinas y peso libre para todos los niveles. Entrenadores presentes en todo momento.", Icon: Dumbbell, schedule: "Lun–Sáb · 6:00 a 22:00", color: "#FF4500" },
  { name: "Funcional", desc: "Clases grupales de alta intensidad en salón exclusivo. Quemá grasa y ganá resistencia.", Icon: Zap, schedule: "Mar, Jue, Sáb · 4 horarios", color: "#FFD700" },
  { name: "Cardio", desc: "Cinta, bicicletas y elípticas de última generación con pantallas integradas.", Icon: Flame, schedule: "Todos los días · 6:00 a 22:00", color: "#00CED1" },
];

const PLANS = [
  { name: "1 Día", price: 24000, features: ["1 vez por semana", "Acceso sala musculación", "Sin clases funcionales"], highlight: false, value: "UN_DIA" },
  { name: "2 Días", price: 28000, features: ["2 veces por semana", "Acceso sala musculación", "Sin clases funcionales"], highlight: false, value: "DOS_DIAS" },
  { name: "3 Días", price: 30000, features: ["3 veces por semana", "Acceso sala musculación", "1 clase funcional/semana"], highlight: true, value: "TRES_DIAS" },
  { name: "Libre", price: 34000, features: ["Acceso ilimitado", "Clases funcionales ilimitadas", "Plan personalizado", "Nutrición básica"], highlight: false, value: "LIBRE" },
];

const STATS = [
  { value: 8, suffix: "+", label: "Años de experiencia" },
  { value: 500, suffix: "+", label: "Socios activos" },
  { value: 12, suffix: "", label: "Entrenadores certificados" },
  { value: 2, suffix: "", label: "Salones equipados" },
];

const NOSOTROS_ITEMS = [
  { Icon: Wrench, title: "Equipamiento pro", desc: "Máquinas de última generación y peso libre completo" },
  { Icon: Users, title: "Clases grupales", desc: "Funcional en salón exclusivo con cupo limitado" },
  { Icon: ClipboardList, title: "Rutinas personalizadas", desc: "Plan según tus objetivos con seguimiento mensual" },
  { Icon: Clock, title: "Amplio horario", desc: "Abierto de lunes a sábado de 6 a 22hs" },
];

const CONTACTO_ITEMS = [
  { Icon: MapPin, text: "Av. Colón 1234, Nueva Córdoba" },
  { Icon: Phone, text: "(0351) 123-4567" },
  { Icon: Instagram, text: "@impulso.cba" },
  { Icon: Clock, text: "Lun–Vie 6:00–22:00 · Sáb 8:00–20:00" },
];

const SOCIAL_LINKS = [
  { Icon: Instagram, label: "Instagram" },
  { Icon: MessageCircle, label: "WhatsApp" },
  { Icon: Facebook, label: "Facebook" },
];

const NAV_LINKS = ["Inicio", "Nosotros", "Clases", "Noticias", "Planes", "Contacto"];

// Counter animation hook
function useCounter(target, suffix, duration = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);
  useEffect(() => {
    if (!started) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [started, target, duration]);
  return { ref, display: `${count}${suffix}` };
}

// Fade-in on scroll hook
function useFadeIn(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function StatItem({ value, suffix, label }) {
  const { ref, display } = useCounter(value, suffix);
  return (
    <div ref={ref} className="stat-item">
      <div style={{ fontSize: "3.5rem", color: "#FF4500", lineHeight: 1 }}>{display}</div>
      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#666", letterSpacing: 2, marginTop: "0.5rem", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function FadeSection({ children, style, className, delay = 0 }) {
  const { ref, visible } = useFadeIn();
  return (
    <div ref={ref} className={className} style={{
      ...style,
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(40px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// Ref simple para el hero (sin re-animación)
function useHeroRef() {
  const ref = useRef(null);
  return { ref };
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { ref: heroRef } = useHeroRef();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const [noticias, setNoticias] = useState([]);
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const response = await fetch(`${BASE}/noticias`);
        const data = await response.json();
        setNoticias(data.slice(0, 6));
      } catch (err) {
        console.error("Error al cargar noticias:", err);
      }
    };
    fetchNoticias();
  }, [BASE]);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Bloquear scroll del body cuando el menú mobile está abierto
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const formatPrice = (p) => `$${p.toLocaleString("es-AR")}`;
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  return (
    <div style={{ fontFamily: "'Bebas Neue', 'Arial Black', sans-serif", background: "#0a0a0a", color: "#f0f0f0", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }

        /* NAV */
        .nav-link { font-family: 'Bebas Neue', sans-serif; letter-spacing: 2px; font-size: 1rem; color: #aaa; text-decoration: none; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: #FF4500; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: #f0f0f0; padding: 4px; z-index: 1001; align-items: center; justify-content: center; }

        /* MOBILE MENU OVERLAY */
        .mobile-menu {
          display: none;
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(10,10,10,0.98);
          z-index: 1100;
          flex-direction: column; align-items: center; justify-content: center; gap: 2rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .mobile-menu.open { display: flex; opacity: 1; }
        .mobile-menu .nav-link { font-size: 2rem; letter-spacing: 4px; color: #f0f0f0; }
        .mobile-menu .nav-link:hover { color: #FF4500; }

        /* BUTTONS */
        .btn-primary { background: #FF4500; color: white; border: none; padding: 14px 36px; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 3px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: background 0.2s, transform 0.1s; }
        .btn-primary:hover { background: #e03d00; transform: translateY(-2px); }
        .btn-outline { background: transparent; color: #f0f0f0; border: 1px solid #444; padding: 13px 35px; font-family: 'Bebas Neue', sans-serif; font-size: 1.1rem; letter-spacing: 3px; cursor: pointer; clip-path: polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%); transition: border-color 0.2s, color 0.2s; }
        .btn-outline:hover { border-color: #FF4500; color: #FF4500; }

        /* CARDS */
        .class-card { background: #111; border: 1px solid #1e1e1e; padding: 2rem; transition: border-color 0.3s, transform 0.3s; position: relative; overflow: hidden; }
        .class-card::before { content: ''; position: absolute; bottom: 0; left: 0; width: 100%; height: 3px; background: var(--accent); transform: scaleX(0); transition: transform 0.3s; transform-origin: left; }
        .class-card:hover { transform: translateY(-6px); border-color: #333; }
        .class-card:hover::before { transform: scaleX(1); }
        .plan-card { background: #111; border: 1px solid #1e1e1e; padding: 2.5rem 2rem; transition: transform 0.3s; position: relative; }
        .plan-card.highlight { border-color: #FF4500; background: #130800; }
        .plan-card:hover { transform: translateY(-6px); }

        /* STATS */
        .stat-item { text-align: center; padding: 2rem 1rem; border-right: 1px solid #1e1e1e; }
        .stat-item:last-child { border-right: none; }
        .stats-grid { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: repeat(4, 1fr); }

        /* GRIDS */
        .nosotros-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6rem; align-items: center; }
        .nosotros-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .clases-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
        .planes-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
        .contacto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: start; }

        /* MISC */
        .noise-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.4; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); }
        .section-tag { font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 4px; color: #FF4500; text-transform: uppercase; margin-bottom: 1rem; }
        .divider-line { width: 60px; height: 3px; background: #FF4500; margin: 1rem 0 2rem; }
        .contact-input { width: 100%; background: #0a0a0a; border: 1px solid #222; color: #f0f0f0; padding: 12px 16px; margin-bottom: 1rem; font-family: 'Inter', sans-serif; font-size: 0.9rem; outline: none; display: block; transition: border-color 0.2s; }
        .contact-input:focus { border-color: #FF4500; }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .ticker-inner { animation: ticker 20s linear infinite; display: flex; white-space: nowrap; align-items: center; }
        @keyframes ecg-wave { from { transform: translateX(-280px); } to { transform: translateX(140px); } }

        /* SCROLLBAR */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #FF4500; }

        /* ECG PULSE */
        .ecg-pulse { width: 140px; height: 45px; display: inline-block; margin-left: 16px; margin-bottom: 8px; vertical-align: middle; overflow: hidden; position: relative; }
        .ecg-pulse::before { content: ''; display: block; width: 280px; height: 100%; position: absolute; left: 0; top: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 45"><polyline points="0,22 8,22 12,8 16,36 20,22 28,22 36,22 44,22 52,10 56,34 60,22 68,22 76,22 84,22 92,12 96,32 100,22 108,22 120,22 130,22 140,10 148,34 156,22 164,22 180,22 190,22 200,14 208,30 216,22 224,22 240,22 250,22 260,16 268,28 276,22 280,22" stroke="%23FF4500" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'); background-repeat: repeat-x; background-position: 0 center; background-size: 280px 100%; animation: ecg-wave 3.8s linear infinite; filter: drop-shadow(0 0 4px rgba(255,69,0,0.6)); }

        .hero-price-badge { position: absolute; bottom: 140px; right: 40px; z-index: 10; }

        /* ===== TABLET ===== */
        @media (max-width: 1024px) {
          .planes-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-grid  { grid-template-columns: repeat(2, 1fr); }
          .stat-item:nth-child(2) { border-right: none; }
          .stat-item:nth-child(3) { border-top: 1px solid #1e1e1e; }
          .stat-item:nth-child(4) { border-top: 1px solid #1e1e1e; border-right: none; }
          .nosotros-grid { gap: 3rem; }
          .hero-price-badge { bottom: 110px; right: 30px; }
        }

        /* ===== MOBILE ===== */
        @media (max-width: 768px) {
          /* NAV responsive */
          .site-nav { padding: 1rem 1.5rem !important; }
          .nav-desktop-links, .nav-desktop-btn { display: none !important; }
          .hamburger { display: flex !important; }

          /* HERO */
          .hero-section { padding: 7rem 1.5rem 12rem !important; min-height: 100svh; }
          .hero-price-badge { position: static !important; display: inline-block; margin-top: 2rem; }
          .ecg-pulse { display: none; }
          .hero-buttons { flex-wrap: wrap; }

          /* STATS */
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .stat-item { border-right: none !important; border-bottom: 1px solid #1e1e1e; }
          .stat-item:nth-last-child(-n+2) { border-bottom: none; }

          /* SECTIONS padding */
          .nosotros-section { padding: 4rem 1.5rem !important; }
          .nosotros-grid { grid-template-columns: 1fr; gap: 3rem; }
          .nosotros-cards { grid-template-columns: 1fr; }
          .clases-section  { padding: 4rem 1.5rem !important; }
          .clases-grid     { grid-template-columns: 1fr; }
          .planes-section  { padding: 4rem 1.5rem !important; }
          .planes-grid     { grid-template-columns: 1fr; }
          .cta-section     { padding: 4rem 1.5rem !important; }
          .contacto-section { padding: 4rem 1.5rem !important; }
          .contacto-grid  { grid-template-columns: 1fr; gap: 2.5rem; }

          /* NOTICIAS */
          .noticias-section { padding: 4rem 1.5rem !important; }
          .noticias-grid { grid-template-columns: 1fr !important; }

          /* FOOTER */
          .footer { flex-direction: column !important; gap: 1.5rem; text-align: center; padding: 2rem 1.5rem !important; }
          .footer-social { justify-content: center; }
        }

        /* ===== SMALL MOBILE ===== */
        @media (max-width: 400px) {
          .planes-grid   { grid-template-columns: 1fr; }
          .nosotros-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="noise-overlay" />

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${menuOpen ? "open" : ""}`}>
        <button style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "none", border: "none", cursor: "pointer", color: "#f0f0f0" }} onClick={() => setMenuOpen(false)}>
          <X size={28} />
        </button>
        {NAV_LINKS.map(l => <a key={l} className="nav-link" onClick={() => scrollTo(l.toLowerCase())}>{l}</a>)}
        <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => { navigate("/login"); setMenuOpen(false); }}>Ingresar →</button>
      </div>

      {/* NAV */}
      <nav className="site-nav" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        padding: "1.2rem 4rem",
        background: scrolled ? "rgba(10,10,10,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(10px)" : "none",
        borderBottom: scrolled ? "1px solid #1a1a1a" : "none",
        transition: "all 0.3s", display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 36, height: 36, background: "#FF4500", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={16} color="white" fill="white" />
          </div>
          <span style={{ fontSize: "1.6rem", letterSpacing: 3 }}>IM<span style={{ color: "#FF4500" }}>PULSO</span></span>
        </div>
        <div className="nav-desktop-links" style={{ display: "flex", gap: "2.5rem" }}>
          {NAV_LINKS.map(l => <a key={l} className="nav-link" onClick={() => scrollTo(l.toLowerCase())}>{l}</a>)}
        </div>
        <button className="btn-primary nav-desktop-btn" style={{ padding: "10px 24px", fontSize: "0.85rem" }} onClick={() => navigate("/login")}>Ingresar →</button>
        <button className="hamburger" onClick={() => setMenuOpen(true)}><Menu size={28} /></button>
      </nav>

      {/* HERO */}
      <section ref={heroRef} id="inicio" className="hero-section" style={{
        padding: "120px 4rem 8rem",
        minHeight: "100vh", display: "flex", alignItems: "center", flexDirection: "column", justifyContent: "center",
        position: "relative", overflow: "hidden",
      }}>
        <div
          onMouseMove={(e) => {
            const { clientX, clientY, currentTarget } = e;
            const { width, height, left, top } = currentTarget.getBoundingClientRect();
            const x = ((clientX - left) / width - 0.5) * 12;
            const y = ((clientY - top) / height - 0.5) * 12;
            currentTarget.querySelector(".hero-bg").style.transform = `translate(${-x}px, ${-y}px) scale(1.05)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.querySelector(".hero-bg").style.transform = "translate(0px, 0px) scale(1.05)";
          }}
          style={{ position: "absolute", inset: 0, overflow: "hidden" }}
        >
          <div className="hero-bg" style={{
            position: "absolute", inset: "-5%",
            backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80')",
            backgroundSize: "cover", backgroundPosition: "center",
            filter: "brightness(0.3)", transition: "transform 0.4s ease", transform: "scale(1.05)",
          }} />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, rgba(255,69,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.65) 100%)" }} />
        <div style={{ position: "absolute", left: "-5%", top: "20%", width: 500, height: 500, background: "radial-gradient(circle, rgba(255,69,0,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ position: "relative", maxWidth: 780, width: "100%" }}>
          <div className="section-tag" style={{ opacity: 0, animation: "fadeUp 0.6s ease 0.1s forwards" }}>
            Gimnasio · Porteña, Córdoba
          </div>
          <h1 style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)", lineHeight: 0.9, letterSpacing: 2, marginBottom: "1.5rem" }}>
            <span style={{ display: "block", opacity: 0, animation: "fadeUp 0.7s ease 0.3s forwards" }}>UN</span>
            <span style={{ display: "block", opacity: 0, animation: "fadeUp 0.7s ease 0.7s forwards" }}>
              IM<span style={{ color: "#FF4500", WebkitTextStroke: "2px #FF4500", WebkitTextFillColor: "transparent" }}>PULSO</span>
              <span className="ecg-pulse" />
            </span>
            <span style={{ display: "block", opacity: 0, animation: "fadeUp 0.7s ease 1.1s forwards" }}>MIL CAMBIOS</span>
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, fontSize: "1.1rem", color: "#888", lineHeight: 1.7, maxWidth: 480, marginBottom: "2.5rem", opacity: 0, animation: "fadeUp 0.7s ease 1.6s forwards" }}>
            Sala de musculación completa + clases funcionales grupales. Entrenadores certificados.
          </p>
          <div className="hero-buttons" style={{ display: "flex", gap: "1rem", opacity: 0, animation: "fadeUp 0.7s ease 1.9s forwards" }}>
            <button className="btn-primary" onClick={() => scrollTo("planes")}>Registrarme →</button>
            <button className="btn-outline" onClick={() => scrollTo("clases")}>Ver clases</button>
          </div>
          <div className="hero-price-badge" style={{ background: "#FF4500", padding: "1.5rem", clipPath: "polygon(0 15%, 15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%)", opacity: 0, animation: "fadeUp 0.7s ease 2.1s forwards" }}>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.65rem", letterSpacing: 3, color: "rgba(255,255,255,0.7)", marginBottom: "0.3rem" }}>DESDE</div>
            <div style={{ fontSize: "2.5rem", lineHeight: 1 }}>$24K</div>
            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.65rem", letterSpacing: 2, color: "rgba(255,255,255,0.7)", marginTop: "0.3rem" }}>POR MES</div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: "#FF4500", padding: "0.8rem 0", overflow: "hidden" }}>
        <div className="ticker-inner">
          {[...Array(8)].map((_, i) => (
            <span key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", letterSpacing: 4, marginRight: "4rem", color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Dumbbell size={13} /> MUSCULACIÓN &nbsp;·&nbsp; <Zap size={13} /> FUNCIONAL &nbsp;·&nbsp; <Flame size={13} /> CARDIO &nbsp;·&nbsp; <Users size={13} /> ENTRENADORES CERTIFICADOS &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ background: "#0d0d0d", borderBottom: "1px solid #1a1a1a" }}>
        <div className="stats-grid">
          {STATS.map((s) => <StatItem key={s.label} {...s} />)}
        </div>
      </div>

      {/* NOSOTROS */}
      <section id="nosotros" className="nosotros-section" style={{ padding: "8rem 4rem", maxWidth: 1200, margin: "0 auto" }}>
        <div className="nosotros-grid">
          <FadeSection>
            <div className="section-tag">Quiénes somos</div>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1, marginBottom: "1rem" }}>MÁS QUE<br />UN GIMNASIO</h2>
            <div className="divider-line" />
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#888", lineHeight: 1.8, marginBottom: "1.5rem", fontWeight: 300 }}>
              Somos un espacio donde la disciplina y la comunidad se encuentran. Con más de 8 años formando atletas y personas que buscan mejorar su calidad de vida en Córdoba.
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#888", lineHeight: 1.8, fontWeight: 300 }}>
              Contamos con una sala de musculación completamente equipada y un salón exclusivo para clases funcionales con cupo limitado, garantizando atención personalizada.
            </p>
          </FadeSection>
          <FadeSection delay={0.15}>
            <div className="nosotros-cards">
              {NOSOTROS_ITEMS.map(({ Icon, title, desc }) => (
                <div key={title} style={{ background: "#111", border: "1px solid #1e1e1e", padding: "1.5rem" }}>
                  <div style={{ marginBottom: "0.8rem", color: "#FF4500" }}><Icon size={28} strokeWidth={1.5} /></div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", letterSpacing: 1, marginBottom: "0.5rem" }}>{title}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "#666", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* CLASES */}
      <section id="clases" className="clases-section" style={{ padding: "6rem 4rem", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeSection style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className="section-tag" style={{ textAlign: "center" }}>Actividades</div>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1 }}>NUESTRAS CLASES</h2>
          </FadeSection>
          <div className="clases-grid">
            {CLASSES.map(({ name, desc, Icon, schedule, color }, i) => (
              <FadeSection key={name} delay={i * 0.1}>
                <div className="class-card" style={{ "--accent": color, height: "100%" }}>
                  <div style={{ marginBottom: "1rem", color }}><Icon size={36} strokeWidth={1.5} /></div>
                  <h3 style={{ fontSize: "2rem", letterSpacing: 2, marginBottom: "1rem", color }}>{name}</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", color: "#777", lineHeight: 1.7, fontSize: "0.9rem", marginBottom: "1.5rem" }}>{desc}</p>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#555", letterSpacing: 1, borderTop: "1px solid #1e1e1e", paddingTop: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Clock size={12} /> {schedule}
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* NOTICIAS */}
      <section id="noticias" className="noticias-section" style={{ padding: "8rem 4rem", background: "#0a0a0a" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeSection style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className="section-tag" style={{ textAlign: "center" }}>Actualidad</div>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1, fontFamily: "'Bebas Neue', sans-serif" }}>ÚLTIMAS NOTICIAS</h2>
            <div className="divider-line" style={{ margin: "1rem auto 2rem" }} />
          </FadeSection>

          <div className="noticias-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem"
          }}>
            {noticias.length === 0 ? (
              <p style={{ gridColumn: "1 / -1", textAlign: "center", color: "#666", fontFamily: "'Inter', sans-serif" }}>No hay noticias recientes para mostrar en este momento.</p>
            ) : noticias.map((noticia, i) => (
              <FadeSection key={noticia.id} delay={i * 0.1}>
                <div style={{
                  background: "#1a1a1a",
                  border: "1px solid #222",
                  borderRadius: "8px",
                  overflow: "hidden",
                  height: "100%",
                  transition: "transform 0.3s, border-color 0.3s",
                  cursor: "default"
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-10px)"; e.currentTarget.style.borderColor = "#FF4500"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = "#222"; }}
                >
                  <div style={{ height: "220px", overflow: "hidden" }}>
                    <img
                      src={noticia.imagen}
                      alt={noticia.titulo}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ padding: "1.5rem" }}>
                    <div style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.75rem",
                      color: "#FF4500",
                      marginBottom: "0.5rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}>
                      <Calendar size={12} />
                      {new Date(noticia.fecha).toLocaleDateString('es-AR')}
                    </div>
                    <h3 style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.8rem",
                      marginBottom: "1rem",
                      lineHeight: 1.1,
                      letterSpacing: "1px"
                    }}>{noticia.titulo}</h3>
                    <p style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.9rem",
                      color: "#888",
                      lineHeight: 1.6,
                      marginBottom: "1.5rem"
                    }}>
                      {noticia.contenido.length > 120
                        ? noticia.contenido.substring(0, 120) + '...'
                        : noticia.contenido}
                    </p>
                    <div style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      color: "#FF4500",
                      fontSize: "1.1rem",
                      letterSpacing: "1px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      cursor: "pointer"
                    }}>
                      LEER MÁS <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="planes-section" style={{ padding: "8rem 4rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <FadeSection style={{ textAlign: "center", marginBottom: "4rem" }}>
            <div className="section-tag" style={{ textAlign: "center" }}>Precios</div>
            <h2 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", lineHeight: 1 }}>ELEGÍ TU PLAN</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", color: "#666", marginTop: "1rem", fontSize: "0.9rem" }}>Abono mensual · Sin permanencia mínima</p>
          </FadeSection>
          <div className="planes-grid">
            {PLANS.map((p, i) => (
              <FadeSection key={p.name} delay={i * 0.08}>
                <div className={`plan-card ${p.highlight ? "highlight" : ""}`} style={{ height: "100%" }}>
                  {p.highlight && (
                    <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "#FF4500", padding: "4px 20px", fontFamily: "'Bebas Neue'", fontSize: "0.8rem", letterSpacing: 2, whiteSpace: "nowrap" }}>
                      MÁS POPULAR
                    </div>
                  )}
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#666", letterSpacing: 3, textTransform: "uppercase", marginBottom: "1rem" }}>{p.name}</div>
                  <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.3rem" }}>{formatPrice(p.price)}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#555", marginBottom: "2rem" }}>/ mes</div>
                  <div style={{ borderTop: "1px solid #1e1e1e", paddingTop: "1.5rem", marginBottom: "2rem" }}>
                    {p.features.map(f => (
                      <div key={f} style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", color: "#888", padding: "0.5rem 0", borderBottom: "1px solid #111", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <Check size={14} color="#FF4500" strokeWidth={2.5} /> {f}
                      </div>
                    ))}
                  </div>
                  <button className={p.highlight ? "btn-primary" : "btn-outline"} style={{ width: "100%", clipPath: "none" }} onClick={() => navigate(`/register?plan=${p.value}`)}>
                    Elegir plan
                  </button>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <FadeSection>
        <section className="cta-section" style={{ padding: "7rem 4rem", textAlign: "center", position: "relative", overflow: "hidden", minHeight: "420px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <video autoPlay muted loop playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.35)" }}>
            <source src="/gym.mp4" type="video/mp4" />
          </video>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(255,69,0,0.45) 0%, rgba(0,0,0,0.2) 100%)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="section-tag" style={{ textAlign: "center", color: "#FF4500" }}>¿Listo para empezar?</div>
            <h2 style={{ fontSize: "clamp(3rem, 8vw, 6rem)", lineHeight: 0.9, marginBottom: "1.5rem", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>EMPEZÁ<br />HOY MISMO</h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", marginBottom: "2.5rem", color: "rgba(255,255,255,0.75)" }}>Primer día sin costo · Sin compromiso</p>
            <button
              style={{ background: "#FF4500", color: "white", border: "none", padding: "16px 48px", fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", letterSpacing: 3, cursor: "pointer", clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "background 0.2s, transform 0.1s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#e03d00"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#FF4500"; e.currentTarget.style.transform = "translateY(0)"; }}
              onClick={() => scrollTo("planes")}
            >
              Elegir mi plan <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </FadeSection>

      {/* CONTACTO */}
      <section id="contacto" className="contacto-section" style={{ padding: "6rem 4rem", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="contacto-grid">
            <FadeSection>
              <div className="section-tag">Contacto</div>
              <h2 style={{ fontSize: "3rem", lineHeight: 1, marginBottom: "2rem" }}>ENCONTRANOS</h2>
              {CONTACTO_ITEMS.map(({ Icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "1rem", marginBottom: "1rem", fontFamily: "'Inter', sans-serif", color: "#777", alignItems: "center" }}>
                  <Icon size={16} color="#FF4500" strokeWidth={1.5} /> {text}
                </div>
              ))}
            </FadeSection>
            <FadeSection delay={0.15}>
              <div style={{ background: "#111", border: "1px solid #1e1e1e", padding: "2.5rem" }}>
                <h3 style={{ fontSize: "1.8rem", marginBottom: "1.5rem" }}>MANDANOS UN MENSAJE</h3>
                {["Nombre completo", "Email", "Teléfono"].map(field => (
                  <input key={field} placeholder={field} className="contact-input" />
                ))}
                <textarea placeholder="¿Qué necesitás saber?" rows={4} className="contact-input" style={{ resize: "vertical" }} />
                <button className="btn-primary" style={{ width: "100%", clipPath: "none" }}>Enviar mensaje</button>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer" style={{ background: "#0a0a0a", borderTop: "1px solid #1a1a1a", padding: "2rem 4rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ width: 24, height: 24, background: "#FF4500", clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={12} color="white" fill="white" />
          </div>
          <span style={{ fontSize: "1.2rem", letterSpacing: 2 }}>IM<span style={{ color: "#FF4500" }}>PULSO</span></span>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <a href="https://tu-portfolio.com" target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#FF4500", textDecoration: "none" }}>
            Developed by Agustín Righetti
          </a>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#444" }}>© 2026 Impulso Gym · Córdoba, Argentina</span>
        </div>
        <div className="footer-social" style={{ display: "flex", gap: "1.5rem" }}>
          {SOCIAL_LINKS.map(({ Icon, label }) => (
            <span key={label} title={label} style={{ color: "#555", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#FF4500"}
              onMouseLeave={e => e.currentTarget.style.color = "#555"}>
              <Icon size={18} strokeWidth={1.5} />
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}