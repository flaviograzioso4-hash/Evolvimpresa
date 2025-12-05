'use client';
import { useEffect, useRef, useState } from 'react';

/**********************
 * UTIL: Typewriter (compatta e con ridotta gestione caret)
 **********************/
function Typewriter({ text = '', speed = 60, className = '', highlightText = '', highlightClass = '', highlightStyle = {} }) {
  const [display, setDisplay] = useState('');
  const [caretVisible, setCaretVisible] = useState(true);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplay(text);
      setCaretVisible(false);
      return;
    }
    let i = 0;
    setDisplay('');
    const t = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(t);
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return setCaretVisible(false);
    const t = setInterval(() => setCaretVisible((v) => !v), 530);
    return () => clearInterval(t);
  }, []);

  const renderWithHighlight = () => {
    if (!highlightText) return display;
    const idx = display.indexOf(highlightText);
    if (idx === -1) return display;
    return (
      <>
        {display.slice(0, idx)}
        <span className={highlightClass} style={highlightStyle}>{display.slice(idx, idx + highlightText.length)}</span>
        {display.slice(idx + highlightText.length)}
      </>
    );
  };

  return (
    <span className={className} aria-live="polite">
      {renderWithHighlight()}
      <span aria-hidden style={{ display: 'inline-block', width: '0.6ch', opacity: caretVisible ? 1 : 0 }}>|</span>
    </span>
  );
}

/**********************
 * SCROLL STATE (semplificato)
 **********************/
let __scrollInit = false;
const __visitedRegistry = new Map(); // id -> { el, setVisited }
const __globalScroll = { lastY: 0, dir: 'down' };

function __initGlobalScroll() {
  if (typeof window === 'undefined' || __scrollInit) return;
  __scrollInit = true;
  __globalScroll.lastY = window.scrollY || 0;
  const handler = () => {
    const y = window.scrollY || 0;
    __globalScroll.dir = y > __globalScroll.lastY ? 'down' : y < __globalScroll.lastY ? 'up' : __globalScroll.dir;
    // quando si torna su nascondo i "visited" degli elementi scesi sotto
    if (__globalScroll.dir === 'up') {
      for (const [, entry] of __visitedRegistry) {
        const el = entry.el; if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top > window.innerHeight) entry.setVisited(false);
      }
    }
    __globalScroll.lastY = y;
  };
  window.addEventListener('scroll', handler, { passive: true });
}

function usePersistentInView(ref, threshold = 0.25) {
  const [inView, setInView] = useState(false);
  const [visited, setVisited] = useState(false);
  const idRef = useRef(Symbol());

  useEffect(() => {
    __initGlobalScroll();
    const id = idRef.current;
    __visitedRegistry.set(id, { el: ref.current, setVisited });
    return () => { __visitedRegistry.delete(id); };
  }, []);

  useEffect(() => {
    const node = ref.current; if (!node) return;
    const id = idRef.current;
    const entry = __visitedRegistry.get(id); if (entry) entry.el = node;

    let obs;
    try {
      if (typeof IntersectionObserver === 'undefined') throw new Error('no IO');
      obs = new IntersectionObserver(([e]) => {
        setInView(e.isIntersecting);
        if (e.isIntersecting && __globalScroll.dir === 'down') setVisited(true);
      }, { threshold });
      obs.observe(node);
    } catch (err) {
      const check = () => {
        const rect = node.getBoundingClientRect();
        const h = window.innerHeight || document.documentElement.clientHeight;
        const isIn = rect.top < h && rect.bottom > 0;
        setInView(isIn);
        if (isIn && __globalScroll.dir === 'down') setVisited(true);
      };
      check();
      window.addEventListener('scroll', check, { passive: true });
      window.addEventListener('resize', check);
      return () => { window.removeEventListener('scroll', check); window.removeEventListener('resize', check); };
    }
    return () => obs && obs.disconnect();
  }, [ref, threshold]);

  return { inView, visited, active: inView || visited, setVisited };
}

/**********************
 * ICONS (usate in "Il problema reale")
 **********************/
function ProIconAlert3D() {
  return (
    <svg viewBox="0 0 64 64" className="w-5 h-5 mt-1 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="g-alert" x1="0" x2="1"><stop offset="0" stopColor="#FFD400" /><stop offset="1" stopColor="#FFB000" /></linearGradient>
        <filter id="shadow-alert" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFD400" floodOpacity=".35" /></filter>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#g-alert)" filter="url(#shadow-alert)" />
      <polygon points="32,12 52,48 12,48" fill="#071827" />
      <rect x="29" y="24" width="6" height="14" rx="2" fill="#FFD400" />
      <rect x="29" y="41" width="6" height="6" rx="1.5" fill="#FFD400" />
    </svg>
  );
}
function ProIconProcess3D() {
  return (
    <svg viewBox="0 0 64 64" className="w-5 h-5 mt-1 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="g-proc" x1="0" x2="1"><stop offset="0" stopColor="#FFF8D9" /><stop offset="1" stopColor="#FFD400" /></linearGradient>
        <filter id="shadow-proc" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFD400" floodOpacity=".35" /></filter>
      </defs>
      <rect x="6" y="10" width="52" height="44" rx="10" fill="#071827" stroke="url(#g-proc)" strokeWidth="3" filter="url(#shadow-proc)" />
      <circle cx="20" cy="32" r="6" fill="url(#g-proc)" />
      <circle cx="32" cy="32" r="6" fill="#FFB000" />
      <circle cx="44" cy="32" r="6" fill="#FFB000" />
      <path d="M23 32h6m6 0h6" stroke="#FFF8D9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function ProIconDrop3D() {
  return (
    <svg viewBox="0 0 64 64" className="w-5 h-5 mt-1 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="g-drop" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#FFD400" /><stop offset="1" stopColor="#0D5C66" /></linearGradient>
        <filter id="shadow-drop" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#FFD400" floodOpacity=".35" /></filter>
      </defs>
      <path d="M32 6 C20 24 14 30 14 40 a18 18 0 0 0 36 0 c0-10-6-16-18-34z" fill="url(#g-drop)" filter="url(#shadow-drop)" />
      <circle cx="24" cy="40" r="3" fill="#FFF8D9" opacity=".8" />
    </svg>
  );
}

/**********************
 * UI HELPERS (compattati)
 **********************/
const TIFFANY_CARD = 'relative bg-[#071827] border-4 border-transparent rounded-3xl transition duration-500 will-change-transform';
const TIFFANY_CARD_P = 'p-8';
const TIFFANY_CARD_SMALL = 'rounded-2xl border-4 border-transparent transition duration-500';

function TiffanyBox({ children, className = '', small = false, threshold = 0.25 }) {
  const ref = useRef(null);
  const { active } = usePersistentInView(ref, threshold);
  const activeClass = 'border-[#FFE55A] ring-4 ring-[#FFE55A]/40 shadow-[0_0_100px_rgba(255,212,0,0.85)] bg-[#071827]/90 scale-[1.02]';
  const inactiveClass = 'ring-0 shadow-[0_0_20px_rgba(255,212,0,0.1)] scale-100';
  const base = small ? TIFFANY_CARD_SMALL : TIFFANY_CARD;
  return (
    <div ref={ref} className={`${base} ${active ? activeClass : inactiveClass} ${className}`}>{children}</div>
  );
}

function GlowCard({ icon, title, children, index }) {
  const ref = useRef(null);
  const { active } = usePersistentInView(ref, 0.5);
  const wrapperClass = `${TIFFANY_CARD_P} ${typeof index !== 'undefined' ? 'overflow-visible' : 'overflow-hidden'}`;
  return (
    <TiffanyBox className={wrapperClass}>
      <div ref={ref} />
      <div className="pointer-events-none absolute -top-10 -left-10 w-32 h-32 rounded-full bg-[#FFD400]/25 blur-3xl" />
      {typeof index !== 'undefined' ? (
        <div className={`absolute -top-8 left-1/2 -translate-x-1/2 md:top-1/2 md:-left-8 md:-translate-y-1/2 md:translate-x-0 w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl font-extrabold z-30 ${
          active ? 'bg-[#FFE55A] text-[#020617] ring-4 ring-[#FFE55A]/40 shadow-[0_0_40px_rgba(255,212,0,0.7)]' : 'bg-[#0A2B33] text-white/80'
        }`}>{index}</div>
      ) : null}
      <div className={`relative z-10 ${typeof index !== 'undefined' ? 'pt-14 md:pt-6 text-center' : 'flex flex-col items-center justify-center text-center py-8'}`}>
        {typeof index === 'undefined' && icon ? (
          <div className="mb-4 flex items-center justify-center">
            <div className="relative w-20 h-20 rounded-full bg-[#FFD400]/20 flex items-center justify-center text-4xl">
              <span className="relative z-10">{icon}</span>
              <div className="pointer-events-none absolute inset-0 rounded-full bg-[#FFE55A]/10 blur-xl" />
            </div>
          </div>
        ) : null}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-white/80 text-sm leading-relaxed">{children}</p>
      </div>
    </TiffanyBox>
  );
}

function ImgWithFallback({ src, alt, className }) {
  const dataFallback = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#ff5a5a"/><stop offset="100%" stop-color="#ff2f2f"/></radialGradient></defs><circle cx="50" cy="50" r="40" fill="url(#g)"/><circle cx="50" cy="50" r="28" fill="#fff"/><circle cx="50" cy="50" r="16" fill="#ff2f2f"/><circle cx="50" cy="50" r="6" fill="#fff"/><path d="M15 52 L45 48 L83 38 L62 56 L45 48" fill="#333"/></svg>`);
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => { if (e.currentTarget.src !== dataFallback) e.currentTarget.src = dataFallback; }}
    />
  );
}

function PrimaryCTA({ href = '#', children }) {
  return (
    <span className="primary-cta-wrapper w-full sm:w-auto inline-block">
      <a href={href} className="inline-flex items-center justify-center gap-3 w-full sm:w-auto px-6 py-3 md:px-10 md:py-4 bg-[#FF7A1A] text-white rounded-full font-semibold text-base md:text-lg shadow-[0_8px_30px_rgba(255,122,26,0.12)] hover:bg-[#FF8F3D] hover:scale-105 transition primary-cta-inner">
        {children}
      </a>
      <svg className="primary-cta-svg-back" aria-hidden="true" viewBox="0 0 240 120" preserveAspectRatio="none">
        <rect className="primary-cta-glow" x="-12" y="-12" width="264" height="136" rx="48" />
        <rect className="primary-cta-streak" x="-6" y="-6" width="252" height="116" rx="40" />
      </svg>
      <svg className="primary-cta-svg-front" aria-hidden="true" viewBox="0 0 100 40" preserveAspectRatio="none">
        <rect className="primary-cta-perimeter" x="0" y="0" width="100" height="40" rx="20" />
      </svg>
    </span>
  );
}

function ContactForm() {
  const [form, setForm] = useState({ nome: '', email: '', telefono: '', azienda: '', provincia: '' });
  const [status, setStatus] = useState('idle');
  const onChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));
  const onSubmit = (e) => { e.preventDefault(); setStatus('sending'); setTimeout(() => setStatus('sent'), 700); };

  const inputCls = 'bg-[#071827] border border-[#0A2B33] rounded-md px-3 py-2 md:px-4 md:py-3 md:text-lg text-white placeholder:text-white/40 focus:ring-2 focus:ring-[#FFD400]/30 outline-none';

  return (
    <form onSubmit={onSubmit} className="w-full max-w-2xl md:text-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ['nome', 'Nome', 'Mario Rossi', 'text'],
          ['email', 'Email', 'mario@azienda.it', 'email'],
          ['telefono', 'Telefono (WhatsApp)', '+39 3xx xxxxxxx', 'text'],
          ['azienda', 'Azienda', 'Nome azienda', 'text'],
        ].map(([name, label, placeholder, type]) => (
          <label key={name} className="flex flex-col text-sm md:text-base">
            <span className="text-white/90 mb-1">{label}</span>
            <input type={type} name={name} value={form[name]} onChange={onChange} required={name !== 'azienda'} className={inputCls} placeholder={placeholder} />
          </label>
        ))}
        <label className="flex flex-col text-sm sm:col-span-2 md:text-base">
          <span className="text-white/90 mb-1">Provincia</span>
          <input name="provincia" value={form.provincia} onChange={onChange} className={inputCls} placeholder="Es. Milano" />
        </label>
      </div>
      <div className="mt-4 flex justify-center">
        <button type="submit" disabled={status !== 'idle'} className="inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 md:text-lg bg-[#FF7A1A] hover:bg-[#FF8F3D] text-white rounded-full font-semibold transition disabled:opacity-60 w-full sm:w-auto">
          {status === 'sending' ? 'Invio…' : status === 'sent' ? 'Grazie!' : 'Richiedi consulenza'}
        </button>
      </div>
      <p className="mt-3 text-center font-semibold text-white md:text-lg lg:text-xl">Lavoriamo con aziende selezionate.</p>
      {status === 'sent' ? <p className="mt-3 text-sm text-[#FFE55A]">Grazie! Ti contatteremo a breve via WhatsApp o email.</p> : null}
    </form>
  );
}

function RevealBox({ children, className = '' }) {
  const ref = useRef(null);
  const { active } = usePersistentInView(ref, 0.25);
  const base = 'rounded-[28px] border-4 border-transparent bg-[#061321]/70 p-8 md:p-12 transition duration-700 will-change-transform';
  const activeClass = 'border-[#FFE55A] ring-4 ring-[#FFE55A]/40 shadow-[0_0_160px_rgba(255,212,0,0.8)] scale-[1.02]';
  const inactiveClass = 'ring-0 shadow-[0_0_30px_rgba(255,212,0,0.12)] scale-100';
  return <div ref={ref} className={`${base} ${active ? activeClass : inactiveClass} ${className}`}>{children}</div>;
}

/**********************
 * STEPS (compatti)
 **********************/
function StepItem({ index, title, children }) {
  const ref = useRef(null);
  const { active } = usePersistentInView(ref, 0.6);
  return (
    <div ref={ref} className={`relative p-6 pt-14 md:pt-8 rounded-2xl border transition-all duration-300 ${
      active ? 'border-[#FFE55A] ring-4 ring-[#FFE55A]/40 shadow-[0_0_100px_rgba(255,212,0,0.85)] bg-[#071827]/90' : 'border-[#0A2B33] bg-[#071827]/70 opacity-90'
    }`}>
      <div className={`absolute -top-8 left-1/2 -translate-x-1/2 md:top-1/2 md:-left-8 md:-translate-y-1/2 md:translate-x-0 w-[60px] h-[60px] rounded-full flex items-center justify-center text-2xl font-extrabold z-30 ${
        active ? 'bg-[#FFE55A] text-[#020617] ring-4 ring-[#FFE55A]/40 shadow-[0_0_40px_rgba(255,212,0,0.7)]' : 'bg-[#0A2B33] text-white/80'
      }`}>{index}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-white/80 text-sm leading-relaxed">{children}</p>
    </div>
  );
}
function VerticalSteps() {
  return (
    <div className="relative max-w-3xl mx-auto mb-12">
      <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#FFD400]/40 via-[#FFD400]/20 to-transparent ml-4" />
      <div className="space-y-6 pl-0 md:pl-8">
        <StepItem index="1" title="Obiettivi reali e concreti">Definiamo insieme un primo traguardo misurabile: zona, servizi, capacità e margini.</StepItem>
        <StepItem index="2" title="Troviamo le persone giuste">Campagne locali e attivazioni che intercettano chi cerca davvero lavori come i tuoi. Zero curiosi.</StepItem>
        <StepItem index="3" title="Qualifica che filtra il rumore">Budget, zona, tempi e tipo di intervento: arrivano solo richieste in linea con il tuo lavoro.</StepItem>
        <StepItem index="4" title="Conferma del sopralluogo">Gestiamo noi il percorso fino al "sì, fissiamo l'appuntamento", con reminder e calendario chiaro.</StepItem>
        <StepItem index="5" title="Con chi non lavoriamo">Accettiamo solo imprese organizzate e davvero disponibili, senza visione chiara, responsabilità e impegno ai sopralluoghi, nessun sistema può generare risultati veri e continui.</StepItem>
      </div>
    </div>
  );
}

/**********************
 * HEADER SEMPLICE
 **********************/
function Header() {
  const [open, setOpen] = useState(false);
  return (
    <div className="site-header-wrap">
      <div className="site-header px-4">
        <div className="site-header-inner px-2 py-1 flex items-center justify-between gap-3">
          <div className="flex items-center gap-0">
            <div className="w-[12.5rem] h-[6.25rem] md:w-[13.75rem] md:h-[7.5rem] flex items-center justify-center overflow-hidden">
              <ImgWithFallback src="/Colazione.png" alt="Colazione" className="max-w-full max-h-full object-contain" />
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#come-funziona" className="text-sm md:text-base">Come funziona</a>
            <a href="#candidatura" className="text-sm md:text-base">Candidatura</a>
            <a href="#contatto" className="text-sm md:text-base">Contatto</a>
          </nav>
          <div className="md:hidden">
            <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Apri menu" className="p-2 rounded-md bg-[#FFD400] text-[#020617] shadow-[0_6px_22px_rgba(255,212,0,0.14)]">☰</button>
          </div>
        </div>
        {open ? (
          <div className="md:hidden mt-2 bg-white/6 backdrop-blur-md rounded-xl p-3 border border-white/6">
            <nav className="flex flex-col gap-2">
              <a href="#come-funziona" className="block text-white/90" onClick={() => setOpen(false)}>Come funziona</a>
              <a href="#candidatura" className="block text-white/90" onClick={() => setOpen(false)}>Candidatura</a>
              <a href="#contatto" className="block text-white/90" onClick={() => setOpen(false)}>Contatto</a>
            </nav>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/**********************
 * PAGINA — CONTENUTO (ripulita da blocchi non utilizzati)
 **********************/
function PageContent() {
  const [playFree, setPlayFree] = useState(false);
  useEffect(() => { setPlayFree(true); }, []);
  return (
    <main className="min-h-screen pt-20 md:pt-24 bg-[#020617] text-white">
      {/* HERO */}
      <section className="min-h-screen py-24 px-6 bg-black relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[120px] h-[120px] rounded-full bg-[#FFD400]/6 blur-[28px]" />
        </div>
        <div className="relative max-w-6xl mx-auto w-full">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-3xl md:text-4xl lg:text-5xl text-white/75 mb-3 whitespace-nowrap">
              <Typewriter text={"Contatti? No Cantieri!🚧"} speed={50} className="inline-block" highlightText={"Cantieri!"} highlightClass={'lamborghini text-[#FFD400]'} highlightStyle={{ fontSize: 'calc(1em + 4px)' }} />
            </p>
            <h1 className="font-extrabold leading-tight mb-4 text-center">
              <span className="block text-3xl md:text-4xl lg:text-5xl leading-tight">Con il <span className="text-[#FFD400]">partner giusto </span><span className="text-white">arrivano</span></span>
              <span className="block text-3xl md:text-4xl lg:text-5xl leading-tight mt-3"><span className="lamborghini text-[#FFD400] heartbeat">Clienti Garantiti  </span> ogni mese</span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 max-w-3xl mx-auto mb-6">
              Un <span className="lamborghini glow-underline font-normal text-xl md:text-4xl lamborghini-scale-plus">Strumento</span>, adottato da oltre <span className="lamborghini glow-underline font-normal text-xl md:text-2xl lamborghini-scale-plus">300 Imprese Italiane</span>, pensato per far crescere la tua azienda con risultati chiari, senza nessuna sorpresa.
            </p>
            <div className="mt-6 mb-4 text-center">
              <p className="font-semibold tracking-tight flex flex-row items-center justify-center gap-2 flex-nowrap">
                <span className="banner-left text-base md:text-lg lg:text-xl whitespace-nowrap">Oppure lavoriamo</span>
                <span className={`banner-free text-[#FFD400] drop-shadow-[0_0_14px_rgba(255,212,0,0.45)] text-5xl md:text-4xl lg:text-5xl whitespace-nowrap ${playFree ? 'play-underline' : ''}`}>GRATIS</span>
              </p>
            </div>
            <div className="mt-10 max-w-3xl mx-auto">
              <TiffanyBox className="p-6 overflow-hidden rounded-3xl">
                <ImgWithFallback src="/mnt/data/371906770_HITTING_TARGET_400x400.gif" alt="Target centrato: garanzia Oppure lavoriamo GRATIS" className="w-full h-64 md:h-80 rounded-3xl border border-[#0A2B33] ring-2 ring-[#FFD400]/8 object-cover transition-all duration-700 hover:scale-105" />
              </TiffanyBox>
            </div>
            <div className="mt-12 mb-14 flex justify-center">
              <PrimaryCTA href="#contatto"><span className="text-xl leading-none">👤</span>Candidati ora al colloquio di selezione</PrimaryCTA>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-center mt-16 mb-12">Il percorso in 5 fasi che fa crescere la tua impresa.</h2>
            <VerticalSteps />
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PrimaryCTA href="#contatto"><span className="text-xl leading-none">👤</span>Candidati ora al colloquio di selezione</PrimaryCTA>
            </div>
          </div>
        </div>
      </section>

      {/* IL VERO PROBLEMA */}
      <section className="py-28 px-6 bg-[#020B14] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-80px] top-[-80px] w-64 h-64 rounded-full bg-[#FFD400]/20 blur-[160px]" />
          <div className="absolute left-[-80px] bottom-[-80px] w-64 h-64 rounded-full bg-[#FFD400]/10 blur-[160px]" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <RevealBox className="backdrop-blur">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1 w-10 rounded bg-[#FFD400]" />
              <p className="text-[#FFD400] text-sm tracking-widest uppercase">Il problema reale</p>
            </div>
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Perché è difficile crescere oggi.</h2>
                <p className="text-white/80 text-lg leading-relaxed mb-6">Troppi preventivi inutili, richieste non in linea e margini che si assottigliano. Il problema non sono i contatti, <span className="text-[#FFD400] font-semibold"> è arrivare al sopralluogo giusto, nel momento giusto.</span></p>
                <ul className="grid gap-3 text-white/85 text-sm md:text-base">
                  <li className="flex items-start gap-3"><ProIconAlert3D /> <span>Tempo perso con curiosi e richieste senza budget.</span></li>
                  <li className="flex items-start gap-3"><ProIconProcess3D /> <span>Processi disordinati: nessuno filtra, tutti chiedono preventivi.</span></li>
                  <li className="flex items-start gap-3"><ProIconDrop3D /> <span>Margini sotto pressione: più ore, meno risultati.</span></li>
                </ul>
              </div>
              <div className="rounded-3xl border-0 bg-transparent p-4 flex justify-center">
                <ImgWithFallback src="/IMG 1 .png" alt="Flusso visivo: richieste → filtro a imbuto → appuntamenti confermati" className="w-auto h-auto max-w-full rounded-3xl object-contain transition-all duration-700 hover:scale-105" />
              </div>
            </div>
          </RevealBox>
        </div>
      </section>

      {/* CHIUSURA */}
      <section className="py-28 px-6 bg-[#03101B] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-[-120px] bottom-[-100px] w-72 h-72 rounded-full bg-[#FFD400]/20 blur-[160px]" /></div>
        <div className="relative max-w-6xl mx-auto z-10">
          <RevealBox className="text-left md:text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Il tuo mercato non aspetta.</h2>
            <p className="text-white/80 text-lg max-w-3xl mx-auto leading-relaxed mb-10">Più cantieri, più margini, un sistema che ti accompagna ogni mese. Non per provare: <span className="text-[#FFD400] font-semibold"> per crescere</span>.</p>
            <ImgWithFallback src="GIF 1 .gif" alt="Mockup mercato che scende" className="block mx-auto w-full md:w-[40%] h-auto shadow-none md:-mt-6" />
          </RevealBox>
        </div>
      </section>

      {/* VALORE */}
      <section className="py-28 px-6 bg-[#020617] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute right-[-120px] top-[-80px] w-72 h-72 rounded-full bg-[#FFD400]/16 blur-[160px]" />
          <div className="absolute left-[-120px] bottom-[-100px] w-72 h-72 rounded-full bg-[#FFD400]/8 blur-[160px]" />
        </div>
        <div className="relative max-w-6xl mx-auto">
          <RevealBox className="backdrop-blur">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="md:order-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Perché il nostro Sistema vale più di un dipendente.</h2>
                <p className="text-white/80 text-lg leading-relaxed mb-6">Un dipendente costa ~36.000€/anno tra contributi e gestione. Noi costiamo meno, generiamo sopralluoghi reali e portiamo un metodo che cresce con la tua impresa.</p>
                <div className="grid sm:grid-cols-3 gap-4">
                  <TiffanyBox small className="p-4 text-center bg-[#071827]"><p className="text-2xl font-extrabold">36k€</p><p className="text-xs text-white/60">Costo annuo medio</p></TiffanyBox>
                  <TiffanyBox small className="p-4 text-center bg-[#071827]"><p className="text-2xl font-extrabold">KPI</p><p className="text-xs text-white/60">Sopralluoghi/mese</p></TiffanyBox>
                  <TiffanyBox small className="p-4 text-center bg-[#071827]"><p className="text-2xl font-extrabold">ROI</p><p className="text-xs text-white/60">Metodo scalabile</p></TiffanyBox>
                </div>
              </div>
              <div className="md:order-2 flex justify-center mt-6 md:mt-0">
                <ImgWithFallback src="/IMG 2.png" alt="Illustrazione 3D — Valore vs Costo" className="w-full h-auto rounded-2xl max-w-[520px]" />
              </div>
            </div>
          </RevealBox>
        </div>
      </section>

      {/* NON È ADATTO */}
      <section className="py-28 px-6 bg-[#020B14] relative overflow-hidden" id="candidatura">
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-[-80px] top-[-80px] w-64 h-64 rounded-full bg-[#FFD400]/16 blur-[160px]" /></div>
        <div className="relative max-w-6xl mx-auto">
          <RevealBox className="backdrop-blur">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Con chi <span className="text-white/90">non possiamo lavorare</span>.</h2>
                <p className="text-white/80 text-lg leading-relaxed mb-4">Per entrare nei nostri programmi serve <span className="text-white">struttura, serietà e volontà di raggiungere un obbiettivo</span>. Il marketing che costruiamo è una leva che<span className="text-white"> amplifica tutto</span>, punti di forza e criticità. Per questo selezioniamo con attenzione con chi lavorare.</p>
                <p className="text-white/70 leading-relaxed mb-6">Durante il colloquio valuteremo sostenibilità del business nelle zone, disponibilità ai sopralluoghi, organizzazione interna e mentalità di responsabilità.</p>
                <ul className="space-y-3 text-white/85 text-sm md:text-base mb-8">
                  <li className="flex items-start gap-3"><span className="mt-1">❌</span><span><span className="text-white">Gestione senza programmazione</span> né pianificazione reale.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1">❌</span><span>Zero disponibilità a seguire <span className="text-white">sopralluoghi confermati</span>.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1">❌</span><span>Nessuna <span className="text-white">organizzazione minima</span> per gestire i lavori.</span></li>
                  <li className="flex items-start gap-3"><span className="mt-1">❌</span><span>Chi cerca un “tentativo” invece di un <span className="text-white">sistema stabile e professionale</span>.</span></li>
                </ul>
              </div>
              <div className="relative">
                <div className="p-4 overflow-hidden">
                  <ImgWithFallback src="/IMG 3.png" alt="Standard qualitativi" className="w-full h-auto rounded-2xl object-contain" />
                </div>
                <div className="mt-6 flex justify-center md:hidden">
                  <PrimaryCTA href="#contatto"><span className="text-xl leading-none">👤</span>Candidati ora al colloquio di selezione</PrimaryCTA>
                </div>
                <div className="pointer-events-none absolute -z-10 -right-10 -bottom-10 w-56 h-56 rounded-full bg-[#FFD400]/10 blur-[120px]" />
              </div>
            </div>
            <div className="hidden md:flex justify-center mt-8"><PrimaryCTA href="#contatto"><span className="text-xl leading-none">👤</span>Candidati ora al colloquio di selezione</PrimaryCTA></div>
          </RevealBox>
        </div>
      </section>

      {/* COME FUNZIONA */}
      <section id="come-funziona" className="py-24 px-6 bg-gradient-to-b from-[#020617] via-[#041421] to-[#020617] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"><div className="absolute right-[-100px] top-0 w-72 h-72 rounded-full bg-[#FFD400]/20 blur-[140px]" /></div>
        <div className="relative max-w-6xl mx-auto grid gap-10 md:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Come funziona il Sistema EvolvImpresa.</h2>
            <p className="text-white/80 mb-8">Più sopralluoghi utili, meno preventivi a vuoto. Filtriamo chi non è in linea, fissiamo gli appuntamenti e lavoriamo su un obiettivo mensile chiaro.</p>
            <div className="space-y-6">
              <GlowCard index={1} title="Filtro serio, non curiosi">Qualifichiamo per budget, zona, tempi e tipologia: arrivano solo richieste compatibili con i tuoi lavori.</GlowCard>
              <GlowCard index={2} title="Appuntamento confermato">Gestiamo noi la conferma del sopralluogo con reminder e calendario: tu entri quando c'è un incontro reale.</GlowCard>
              <GlowCard index={3} title="Obiettivo mensile + ottimizzazione">Definiamo i sopralluoghi attesi al mese e ottimizziamo per ridurre preventivi inutili e aumentare quelli che si chiudono.</GlowCard>
            </div>
          </div>
          <div className="space-y-6">
            <div className="w-full h-64 md:h-80 rounded-3xl border border-dashed border-[#0A2B33] bg-[#020b12]/60 flex items-center justify-center text-sm text-white/40">VIDEO - Spiegazione Sistema EvolvImpresa</div>
            <p className="text-xs text-white/50 text-center">Video breve che mostra come si passa dal lead al cantiere.</p>
          </div>
        </div>
      </section>

      {/* COSA OTTIENI */}
      <section className="py-24 px-6 bg-[#020B14] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"><div className="absolute left-1/2 -translate-x-1/2 bottom-[-160px] w-[420px] h-[420px] rounded-full bg-[#FFD400]/14 blur-[160px]" /></div>
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Cosa ottieni davvero per far crescere la tua impresa.</h2>
          <p className="text-white/80 text-center max-w-3xl mx-auto mb-12">Richieste utili, appuntamenti solidi, margini protetti e <strong>tempo</strong> recuperato per seguire i cantieri che contano davvero.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlowCard icon="📈" title="Pipeline che lavora per te">Opportunità chiare, stati visibili, probabilità reali. Sai dove mettere il tempo.</GlowCard>
            <GlowCard icon="🤝" title="Appuntamenti di valore (non perditempo)">Filtriamo i curiosi. Restano richieste allineate a budget, zona e tempi.</GlowCard>
            <GlowCard icon="📆" title="Prevedibilità mensile">KPI semplici, scelte più sicure. Programmi il lavoro, non lo insegui.</GlowCard>
          </div>
        </div>
      </section>

      {/* TEAM */}
      <section className="py-24 px-6 bg-[#020617] relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0"><div className="absolute right-[-100px] bottom-[-120px] w-72 h-72 rounded-full bg-[#FFD400]/18 blur-[140px]" /></div>
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Il team di EvolvImpresa.</h2>
          <p className="text-white/80 text-center max-w-3xl mx-auto mb-12">Non una piattaforma anonima: persone che ti affiancano su strategia, implementazione e numeri.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <TiffanyBox key={i} className="p-8">
                <div className="w-20 h-20 rounded-2xl bg-[#020b12] border border-[#0A2B33] ring-2 ring-[#FFD400]/8 mb-4 mx-auto" />
                <h3 className="text-lg font-semibold text-white text-center">Nome Cognome</h3>
                <p className="text-xs text-[#FFD400] text-center mb-2">Ruolo</p>
                <p className="text-white/75 text-sm text-center">Descrizione breve del contributo al progetto.</p>
              </TiffanyBox>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section id="contatto" className="py-24 px-6 bg-gradient-to-b from-[#020617] via-[#031824] to-[#020617]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Vuoi aumentare i tuoi sopralluoghi?</h2>
          <p className="text-white/80 max-w-3xl mx-auto mb-12">Prenota una consulenza gratuita: analizziamo lo scenario e verifichiamo se il nostro sistema è adatto alla tua realtà.</p>
          <TiffanyBox className="p-10 md:p-16 lg:p-20 inline-block max-w-3xl"><div className="md:text-lg"><ContactForm /></div></TiffanyBox>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen">
      <Header />
      <PageContent />
    </div>
  );
}
