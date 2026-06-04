
import { useState, useEffect, useRef, useCallback } from "react";

// ─── Supabase Config ───────────────────────────────────────────────────────────
const SUPABASE_URL = "https://mknutdhrbatrhhylhcsu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbnV0ZGhyYmF0cmhoeWxoY3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDM2OTAsImV4cCI6MjA5NjA3OTY5MH0.1cHTH6TDgeXmJ6YQkPqkOCKA0YnhgPQzagWZdEenFtk";

// ─── reCAPTCHA Config ─────────────────────────────────────────────────────────
// ⚠️ استبدل هذا بـ Site Key الخاص بك من Google reCAPTCHA Admin Console
// https://www.google.com/recaptcha/admin
const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"; // Test key - replace with yours

// ─── Load reCAPTCHA Script ────────────────────────────────────────────────────
function loadRecaptcha() {
  return new Promise((resolve) => {
    if (window.grecaptcha) { resolve(window.grecaptcha); return; }
    const existing = document.querySelector('script[src*="recaptcha"]');
    if (existing) {
      const wait = setInterval(() => {
        if (window.grecaptcha) { clearInterval(wait); resolve(window.grecaptcha); }
      }, 100);
      return;
    }
    window.__recaptchaReady = () => resolve(window.grecaptcha);
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?onload=__recaptchaReady&render=explicit`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  });
}

async function supabase(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || res.statusText);
  }
  return res.json().catch(() => null);
}

async function supabaseAuth(path, body) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ─── Mock Data (fallback when Supabase not configured) ─────────────────────────
const MOCK_GAMES = [
  {
    id: "1", title: "Space Invaders Pro", description: "دفاع ملحمي عن الأرض ضد موجات الغزاة الفضائيين", category: "أكشن",
    plays: 12480, likes: 943, author: "أحمد الكودر", author_id: "u1",
    thumbnail: null, html_content: null, created_at: "2024-01-15",
    tags: ["فضاء", "إطلاق نار", "كلاسيكي"]
  },
  {
    id: "2", title: "Pixel Quest", description: "مغامرة بكسل رائعة في عالم مفتوح مليء بالأسرار والكنوز", category: "مغامرة",
    plays: 8920, likes: 721, author: "سارة المطور", author_id: "u2",
    thumbnail: null, html_content: null, created_at: "2024-02-10",
    tags: ["مغامرة", "بكسل", "مفتوح"]
  },
  {
    id: "3", title: "Brain Blast", description: "اختبر ذكاءك مع أكثر من 500 لغز ومعضلة ترفيهية", category: "ألغاز",
    plays: 21350, likes: 1876, author: "محمد العقل", author_id: "u3",
    thumbnail: null, html_content: null, created_at: "2024-03-05",
    tags: ["ألغاز", "ذكاء", "تعليم"]
  },
  {
    id: "4", title: "Neon Racer", description: "سباق سيارات بصرية نيون مستقبلية بسرعات خيالية", category: "سباق",
    plays: 15670, likes: 1234, author: "خالد السرعة", author_id: "u1",
    thumbnail: null, html_content: null, created_at: "2024-03-20",
    tags: ["سباق", "نيون", "مستقبلي"]
  },
  {
    id: "5", title: "Tower Defense Z", description: "ابنِ أبراجك ودافع عن قاعدتك ضد الزومبي اللانهائية", category: "استراتيجية",
    plays: 9340, likes: 867, author: "سارة المطور", author_id: "u2",
    thumbnail: null, html_content: null, created_at: "2024-04-01",
    tags: ["دفاع", "زومبي", "استراتيجية"]
  },
  {
    id: "6", title: "Word Wizard", description: "ألعاب كلمات عربية وإنجليزية تحدي اللغة والذاكرة", category: "ألغاز",
    plays: 6780, likes: 543, author: "محمد العقل", author_id: "u3",
    thumbnail: null, html_content: null, created_at: "2024-04-15",
    tags: ["كلمات", "لغة", "ذاكرة"]
  },
];

const MOCK_ARTICLES = [
  {
    id: "a1", title: "مستقبل ألعاب الويب: WebGL وما بعدها", content: "صناعة ألعاب الويب تشهد ثورة حقيقية...",
    author: "أحمد الكودر", author_id: "u1", created_at: "2024-04-20", read_time: 8, likes: 234
  },
  {
    id: "a2", title: "كيف تصمم لعبة HTML5 احترافية في أسبوع", content: "دليل شامل لبناء لعبتك الأولى...",
    author: "سارة المطور", author_id: "u2", created_at: "2024-05-01", read_time: 12, likes: 456
  },
];

// ─── App State ─────────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  token: null,
  page: "home", // home | game | article | upload | articles | profile | settings | search
  games: MOCK_GAMES,
  articles: MOCK_ARTICLES,
  selectedGame: null,
  selectedArticle: null,
  searchQuery: "",
  searchResults: { games: [], articles: [] },
  stats: {
    totalGames: 6,
    totalPlays: 74540,
    totalUsers: 3,
    totalArticles: 2,
  },
  profileUser: null,
  authModal: null, // login | signup
  uploadModal: false,
  articleModal: false,
  editProfileModal: false,
  notification: null,
};

// ─── Icons ─────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, className = "" }) => {
  const icons = {
    home: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>,
    search: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    upload: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
    articles: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    stats: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    user: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    play: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    heart: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    heartOutline: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    close: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    menu: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    back: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polyline points="15 18 9 12 15 6"/></svg>,
    edit: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    plus: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    gamepad: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13" strokeLinecap="round" strokeWidth="3"/><line x1="18" y1="11" x2="18.01" y2="11" strokeLinecap="round" strokeWidth="3"/><rect x="2" y="6" width="20" height="12" rx="2"/></svg>,
    external: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
    fire: <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" style={{display:"none"}}/><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>,
    trophy: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="7"/><path d="M7 4h10a1 1 0 0 1 1 1v3a5 5 0 0 1-10 0V5a1 1 0 0 1 1-1z"/><path d="M3 6h4"/><path d="M17 6h4"/></svg>,
    clock: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    eye: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  };
  return icons[name] || null;
};

// ─── Palette ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&family=Tajawal:wght@300;400;500;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base: #0a0a0a;
    --bg-elevated: #121212;
    --bg-highlight: #1a1a1a;
    --bg-press: #282828;
    --bg-tinted: #181818;
    --accent: #1ed760;
    --accent-dark: #169c44;
    --accent-glow: rgba(30, 215, 96, 0.25);
    --accent2: #e91429;
    --text-base: #ffffff;
    --text-subdued: #a7a7a7;
    --text-bright: #ffffff;
    --text-faint: #535353;
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.15);
    --sidebar-w: 240px;
    --radius: 8px;
    --radius-lg: 16px;
    --transition: 0.2s cubic-bezier(0.4,0,0.2,1);
    font-family: 'Cairo', 'Tajawal', sans-serif;
  }

  body { background: var(--bg-base); color: var(--text-base); direction: rtl; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--text-faint); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-subdued); }

  /* ── Layout ── */
  .app-shell { display: flex; height: 100vh; overflow: hidden; }
  .sidebar { width: var(--sidebar-w); min-width: var(--sidebar-w); background: #000; display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; padding-bottom: 80px; flex-shrink: 0; }
  .main-area { flex: 1; overflow-y: auto; background: linear-gradient(to bottom, #1a2a1a 0%, var(--bg-base) 35%); min-width: 0; }
  .topbar { position: sticky; top: 0; z-index: 100; display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; background: rgba(10,10,10,0.85); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); gap: 16px; }

  /* ── Sidebar ── */
  .sidebar-logo { padding: 24px 20px 16px; }
  .logo-text { font-size: 24px; font-weight: 900; color: var(--accent); letter-spacing: -1px; font-family: 'Cairo', sans-serif; }
  .logo-sub { font-size: 11px; color: var(--text-faint); letter-spacing: 2px; text-transform: uppercase; }
  .sidebar-section { padding: 8px 0; }
  .sidebar-section-label { padding: 12px 20px 4px; font-size: 11px; font-weight: 700; color: var(--text-faint); letter-spacing: 2px; text-transform: uppercase; }
  .sidebar-item { display: flex; align-items: center; gap: 14px; padding: 10px 20px; color: var(--text-subdued); cursor: pointer; transition: color var(--transition); border-radius: 6px; margin: 0 8px; font-size: 14px; font-weight: 600; }
  .sidebar-item:hover { color: var(--text-base); }
  .sidebar-item.active { color: var(--text-base); background: var(--bg-press); }
  .sidebar-item svg { flex-shrink: 0; }
  .sidebar-divider { height: 1px; background: var(--border); margin: 8px 20px; }

  /* ── Topbar ── */
  .topbar-nav { display: flex; gap: 4px; }
  .topbar-btn { width: 32px; height: 32px; border-radius: 50%; background: rgba(0,0,0,0.7); border: none; color: var(--text-base); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background var(--transition); }
  .topbar-btn:hover { background: var(--bg-press); }
  .topbar-search { flex: 1; max-width: 440px; position: relative; }
  .topbar-search input { width: 100%; background: var(--bg-press); border: 1px solid transparent; border-radius: 24px; padding: 10px 44px 10px 16px; color: var(--text-base); font-size: 14px; font-family: inherit; outline: none; transition: border-color var(--transition); }
  .topbar-search input:focus { border-color: var(--text-base); }
  .topbar-search input::placeholder { color: var(--text-faint); }
  .topbar-search .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-faint); pointer-events: none; }
  .topbar-user { display: flex; align-items: center; gap: 8px; }
  .user-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; cursor: pointer; overflow: hidden; flex-shrink: 0; }
  .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .btn-login { background: transparent; border: 1px solid var(--text-subdued); color: var(--text-base); padding: 8px 20px; border-radius: 24px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: inherit; transition: all var(--transition); }
  .btn-login:hover { border-color: var(--text-base); transform: scale(1.02); }
  .btn-signup { background: var(--text-base); border: none; color: #000; padding: 8px 20px; border-radius: 24px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: inherit; transition: all var(--transition); }
  .btn-signup:hover { background: #ccc; transform: scale(1.02); }

  /* ── Page Content ── */
  .page-content { padding: 24px 32px 100px; max-width: 1600px; }

  /* ── Section Headers ── */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .section-title { font-size: 22px; font-weight: 800; color: var(--text-base); }
  .section-link { font-size: 13px; font-weight: 700; color: var(--text-subdued); cursor: pointer; transition: color var(--transition); text-transform: uppercase; letter-spacing: 1px; }
  .section-link:hover { color: var(--text-base); }

  /* ── Game Cards ── */
  .games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
  .game-card { background: var(--bg-tinted); border-radius: var(--radius-lg); padding: 16px; cursor: pointer; transition: background var(--transition), transform var(--transition); position: relative; }
  .game-card:hover { background: var(--bg-press); transform: translateY(-2px); }
  .game-card:hover .play-overlay { opacity: 1; transform: translateY(0); }
  .game-thumbnail { width: 100%; aspect-ratio: 1; border-radius: var(--radius); background: linear-gradient(135deg, #1a3a1a, #0a2a3a); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; overflow: hidden; position: relative; }
  .game-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
  .game-thumbnail-placeholder { font-size: 48px; }
  .play-overlay { position: absolute; bottom: 8px; right: 8px; width: 48px; height: 48px; background: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateY(8px); transition: opacity 0.3s, transform 0.3s; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  .game-title { font-size: 15px; font-weight: 700; color: var(--text-base); margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .game-meta { font-size: 13px; color: var(--text-subdued); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .game-tag { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 4px; padding: 2px 8px; font-size: 11px; color: var(--text-subdued); }
  .game-stats { display: flex; gap: 12px; margin-top: 8px; }
  .game-stat { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-faint); }

  /* ── Hero Section ── */
  .hero { background: linear-gradient(135deg, #0d3320 0%, #1a2a1a 40%, #0a1a2a 100%); border-radius: 20px; padding: 40px 48px; margin-bottom: 32px; display: flex; align-items: center; justify-content: space-between; overflow: hidden; position: relative; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 70% 50%, rgba(30,215,96,0.1) 0%, transparent 60%); pointer-events: none; }
  .hero-content { max-width: 600px; z-index: 1; }
  .hero-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(30,215,96,0.15); border: 1px solid rgba(30,215,96,0.3); border-radius: 20px; padding: 6px 14px; font-size: 13px; color: var(--accent); font-weight: 700; margin-bottom: 16px; }
  .hero-title { font-size: 48px; font-weight: 900; line-height: 1.1; margin-bottom: 16px; background: linear-gradient(135deg, #fff 0%, var(--accent) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-desc { font-size: 16px; color: var(--text-subdued); line-height: 1.7; margin-bottom: 28px; }
  .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
  .btn-primary { background: var(--accent); color: #000; border: none; padding: 14px 32px; border-radius: 32px; cursor: pointer; font-size: 15px; font-weight: 800; font-family: inherit; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
  .btn-primary:hover { background: #22ee6a; transform: scale(1.03); box-shadow: 0 0 32px var(--accent-glow); }
  .btn-secondary { background: transparent; color: var(--text-base); border: 2px solid rgba(255,255,255,0.3); padding: 12px 28px; border-radius: 32px; cursor: pointer; font-size: 15px; font-weight: 700; font-family: inherit; transition: all 0.2s; }
  .btn-secondary:hover { border-color: var(--text-base); background: rgba(255,255,255,0.05); }
  .hero-visual { display: flex; gap: 12px; z-index: 1; }
  .hero-card-mini { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; width: 140px; }
  .hero-card-mini-num { font-size: 28px; font-weight: 900; color: var(--accent); }
  .hero-card-mini-label { font-size: 12px; color: var(--text-subdued); margin-top: 4px; }

  /* ── Stats Bar ── */
  .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }
  .stat-card { background: var(--bg-tinted); border-radius: var(--radius-lg); padding: 20px 24px; border: 1px solid var(--border); }
  .stat-number { font-size: 32px; font-weight: 900; color: var(--accent); }
  .stat-label { font-size: 13px; color: var(--text-subdued); margin-top: 4px; }

  /* ── Game Page ── */
  .game-page-header { display: flex; gap: 32px; margin-bottom: 32px; align-items: flex-start; }
  .game-page-cover { width: 200px; height: 200px; border-radius: 16px; background: linear-gradient(135deg, #1a3a1a, #0a2a3a); display: flex; align-items: center; justify-content: center; font-size: 64px; flex-shrink: 0; overflow: hidden; box-shadow: 0 16px 48px rgba(0,0,0,0.5); }
  .game-page-cover img { width: 100%; height: 100%; object-fit: cover; }
  .game-page-info { flex: 1; }
  .game-page-type { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; color: var(--text-subdued); margin-bottom: 8px; }
  .game-page-title { font-size: 52px; font-weight: 900; line-height: 1.05; margin-bottom: 12px; }
  .game-page-desc { font-size: 15px; color: var(--text-subdued); line-height: 1.7; max-width: 600px; }
  .game-page-author { display: flex; align-items: center; gap: 8px; margin: 16px 0; color: var(--text-subdued); font-size: 14px; }
  .game-page-author strong { color: var(--text-base); cursor: pointer; }
  .game-page-author strong:hover { text-decoration: underline; }
  .game-actions { display: flex; align-items: center; gap: 20px; margin-top: 24px; flex-wrap: wrap; }
  .btn-play { background: var(--accent); color: #000; border: none; padding: 16px 40px; border-radius: 32px; cursor: pointer; font-size: 16px; font-weight: 800; font-family: inherit; display: flex; align-items: center; gap: 10px; transition: all 0.2s; }
  .btn-play:hover { transform: scale(1.04); box-shadow: 0 0 40px var(--accent-glow); }
  .btn-like { background: transparent; border: 2px solid var(--border-strong); color: var(--text-subdued); width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all var(--transition); }
  .btn-like:hover, .btn-like.liked { border-color: var(--accent2); color: var(--accent2); }
  .game-iframe-container { border-radius: 16px; overflow: hidden; background: #000; box-shadow: 0 16px 64px rgba(0,0,0,0.8); margin-top: 24px; }
  .game-iframe-header { background: var(--bg-elevated); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border); }
  .game-iframe-title { font-size: 14px; font-weight: 600; color: var(--text-subdued); }
  .game-iframe { width: 100%; height: 600px; border: none; display: block; }

  /* ── Articles ── */
  .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 24px; }
  .article-card { background: var(--bg-tinted); border-radius: var(--radius-lg); padding: 28px; cursor: pointer; transition: background var(--transition), transform var(--transition); border: 1px solid var(--border); }
  .article-card:hover { background: var(--bg-press); transform: translateY(-2px); border-color: var(--border-strong); }
  .article-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; color: var(--text-faint); font-size: 13px; }
  .article-title { font-size: 20px; font-weight: 800; margin-bottom: 12px; line-height: 1.4; }
  .article-excerpt { color: var(--text-subdued); font-size: 14px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .article-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border); }

  /* ── Modals ── */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
  .modal { background: var(--bg-elevated); border-radius: 20px; padding: 40px; width: 100%; max-width: 480px; border: 1px solid var(--border); position: relative; max-height: 90vh; overflow-y: auto; }
  .modal-lg { max-width: 720px; }
  .modal-xl { max-width: 900px; }
  .modal-close { position: absolute; top: 20px; left: 20px; background: var(--bg-press); border: none; color: var(--text-subdued); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: color var(--transition); }
  .modal-close:hover { color: var(--text-base); }
  .modal-title { font-size: 26px; font-weight: 900; margin-bottom: 8px; }
  .modal-subtitle { font-size: 14px; color: var(--text-subdued); margin-bottom: 28px; }

  /* ── Forms ── */
  .form-group { margin-bottom: 20px; }
  .form-label { display: block; font-size: 13px; font-weight: 700; color: var(--text-subdued); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
  .form-input { width: 100%; background: var(--bg-press); border: 1px solid var(--border); border-radius: var(--radius); padding: 13px 16px; color: var(--text-base); font-size: 14px; font-family: inherit; outline: none; transition: border-color var(--transition); }
  .form-input:focus { border-color: var(--text-base); }
  .form-input::placeholder { color: var(--text-faint); }
  .form-textarea { min-height: 100px; resize: vertical; }
  .form-error { color: var(--accent2); font-size: 13px; margin-top: 6px; }
  .form-divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; color: var(--text-faint); font-size: 13px; }
  .form-divider::before, .form-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── Upload ── */
  .file-drop { border: 2px dashed var(--border-strong); border-radius: var(--radius-lg); padding: 40px; text-align: center; cursor: pointer; transition: all var(--transition); }
  .file-drop:hover, .file-drop.drag-over { border-color: var(--accent); background: rgba(30,215,96,0.05); }
  .file-drop-icon { font-size: 40px; margin-bottom: 12px; }
  .file-drop-text { font-size: 16px; font-weight: 700; margin-bottom: 6px; }
  .file-drop-sub { font-size: 13px; color: var(--text-subdued); }
  .file-name { background: var(--bg-press); border-radius: var(--radius); padding: 12px 16px; margin-top: 12px; font-size: 13px; color: var(--accent); display: flex; align-items: center; gap: 8px; }

  /* ── Profile ── */
  .profile-header { display: flex; align-items: flex-end; gap: 24px; margin-bottom: 32px; padding: 32px; background: linear-gradient(135deg, #0d3320, #1a1a1a); border-radius: 20px; }
  .profile-avatar { width: 120px; height: 120px; border-radius: 50%; background: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 42px; font-weight: 900; overflow: hidden; flex-shrink: 0; border: 4px solid rgba(255,255,255,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.5); cursor: pointer; }
  .profile-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .profile-name { font-size: 40px; font-weight: 900; }
  .profile-username { font-size: 15px; color: var(--text-subdued); margin-top: 4px; }
  .profile-stats { display: flex; gap: 24px; margin-top: 12px; }
  .profile-stat { text-align: center; }
  .profile-stat-num { font-size: 20px; font-weight: 800; }
  .profile-stat-label { font-size: 12px; color: var(--text-subdued); }

  /* ── Notification ── */
  .notification { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); background: var(--bg-press); border: 1px solid var(--accent); border-radius: 12px; padding: 14px 24px; font-size: 14px; font-weight: 700; color: var(--accent); z-index: 9999; box-shadow: 0 8px 32px rgba(0,0,0,0.5); animation: slideDown 0.3s cubic-bezier(0.4,0,0.2,1); }
  @keyframes slideDown { from { opacity: 0; transform: translateX(-50%) translateY(-20px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* ── Chips ── */
  .chip { display: inline-flex; align-items: center; gap: 6px; background: var(--bg-press); border: 1px solid var(--border); border-radius: 20px; padding: 6px 14px; font-size: 13px; color: var(--text-subdued); cursor: pointer; transition: all var(--transition); white-space: nowrap; }
  .chip:hover, .chip.active { background: rgba(30,215,96,0.1); border-color: var(--accent); color: var(--accent); }
  .chips-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }

  /* ── Empty State ── */
  .empty-state { text-align: center; padding: 80px 20px; }
  .empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  .empty-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
  .empty-sub { font-size: 14px; color: var(--text-subdued); }

  /* ── Mobile ── */
  .mobile-menu-btn { display: none; background: none; border: none; color: var(--text-base); cursor: pointer; }
  @media (max-width: 900px) {
    .sidebar { position: fixed; right: -100%; top: 0; bottom: 0; z-index: 500; transition: right 0.3s; width: 260px; }
    .sidebar.open { right: 0; }
    .mobile-menu-btn { display: flex; }
    .hero { flex-direction: column; padding: 28px 24px; }
    .hero-title { font-size: 32px; }
    .hero-visual { display: none; }
    .stats-bar { grid-template-columns: repeat(2,1fr); }
    .game-page-header { flex-direction: column; }
    .game-page-title { font-size: 32px; }
    .page-content { padding: 16px 16px 100px; }
    .topbar { padding: 12px 16px; }
  }

  /* ── Skeleton loader ── */
  .skeleton { background: linear-gradient(90deg, var(--bg-press) 25%, var(--bg-highlight) 50%, var(--bg-press) 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius); }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── SEO hidden but accessible ── */
  .seo-content { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 0; border-bottom: 2px solid var(--border); margin-bottom: 28px; }
  .tab { padding: 12px 20px; font-size: 14px; font-weight: 700; color: var(--text-subdued); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all var(--transition); }
  .tab:hover { color: var(--text-base); }
  .tab.active { color: var(--text-base); border-bottom-color: var(--accent); }

  /* ── Rich text editor ── */
  .rich-editor { background: var(--bg-press); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; min-height: 300px; color: var(--text-base); font-size: 15px; line-height: 1.8; outline: none; }
  .rich-editor:focus { border-color: var(--text-base); }
  .editor-toolbar { display: flex; gap: 4px; padding: 8px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius) var(--radius) 0 0; border-bottom: none; flex-wrap: wrap; }
  .editor-btn { background: transparent; border: none; color: var(--text-subdued); padding: 6px 10px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 700; font-family: inherit; transition: all var(--transition); }
  .editor-btn:hover { background: var(--bg-press); color: var(--text-base); }

  /* ── Image upload ── */
  .avatar-upload { position: relative; display: inline-block; }
  .avatar-upload-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); border-radius: 50%; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity var(--transition); cursor: pointer; }
  .avatar-upload:hover .avatar-upload-overlay { opacity: 1; }

  /* ── Search results ── */
  .search-result-item { display: flex; align-items: center; gap: 16px; padding: 12px 16px; border-radius: var(--radius); cursor: pointer; transition: background var(--transition); }
  .search-result-item:hover { background: var(--bg-press); }
  .search-result-thumb { width: 48px; height: 48px; border-radius: 8px; background: var(--bg-press); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; overflow: hidden; }
  .search-result-thumb img { width: 100%; height: 100%; object-fit: cover; }

  /* ── reCAPTCHA ── */
  .recaptcha-wrapper { display: flex; justify-content: center; margin: 16px 0; }
  .recaptcha-wrapper iframe { border-radius: var(--radius) !important; }

  /* ── Upload Progress ── */
  .upload-progress { margin-top: 12px; }
  .upload-progress-bar { height: 6px; background: var(--bg-press); border-radius: 3px; overflow: hidden; margin-top: 8px; }
  .upload-progress-fill { height: 100%; background: var(--accent); border-radius: 3px; transition: width 0.3s ease; }
  .upload-progress-text { font-size: 12px; color: var(--text-subdued); display: flex; justify-content: space-between; }
  .upload-size-hint { font-size: 11px; color: var(--text-faint); margin-top: 4px; }

  /* ── Share Modal ── */
  .share-modal { max-width: 440px; }
  .share-platforms { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0; }
  .share-btn { display: flex; align-items: center; gap: 10px; padding: 14px 16px; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-press); color: var(--text-base); cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 700; transition: all var(--transition); }
  .share-btn:hover { transform: translateY(-1px); }
  .share-btn.twitter:hover { border-color: #1DA1F2; background: rgba(29,161,242,0.1); }
  .share-btn.facebook:hover { border-color: #4267B2; background: rgba(66,103,178,0.1); }
  .share-btn.whatsapp:hover { border-color: #25D366; background: rgba(37,211,102,0.1); }
  .share-btn.telegram:hover { border-color: #0088cc; background: rgba(0,136,204,0.1); }
  .share-btn.reddit:hover { border-color: #FF4500; background: rgba(255,69,0,0.1); }
  .share-btn.linkedin:hover { border-color: #0077b5; background: rgba(0,119,181,0.1); }
  .embed-section { border-top: 1px solid var(--border); padding-top: 20px; margin-top: 4px; }
  .embed-code { background: var(--bg-base); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; font-family: monospace; font-size: 11px; color: var(--accent); word-break: break-all; line-height: 1.6; max-height: 120px; overflow-y: auto; direction: ltr; text-align: left; }
  .copy-btn { background: var(--bg-press); border: 1px solid var(--border); color: var(--text-base); padding: 8px 16px; border-radius: var(--radius); cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 700; transition: all var(--transition); margin-top: 8px; width: 100%; }
  .copy-btn:hover { border-color: var(--accent); color: var(--accent); }
  .copy-btn.copied { border-color: var(--accent); color: var(--accent); background: rgba(30,215,96,0.1); }

  /* ── Game Page Share Button ── */
  .btn-share { background: transparent; border: 2px solid var(--border-strong); color: var(--text-subdued); padding: 10px 20px; border-radius: 32px; cursor: pointer; font-family: inherit; font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: all var(--transition); }
  .btn-share:hover { border-color: #1DA1F2; color: #1DA1F2; background: rgba(29,161,242,0.08); }
`;

// ─── Utility ───────────────────────────────────────────────────────────────────
function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "م";
  if (n >= 1000) return (n / 1000).toFixed(1) + "ك";
  return n;
}

const CATEGORIES = ["الكل", "أكشن", "مغامرة", "ألغاز", "استراتيجية", "سباق", "رياضة", "تعليم"];

const GAME_EMOJIS = ["🎮", "🕹️", "👾", "🎯", "🚀", "⚔️", "🏆", "🌌", "🔥", "💎", "🐉", "🎲"];

function getEmoji(id) {
  return GAME_EMOJIS[parseInt(id || "0") % GAME_EMOJIS.length];
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [state, setState] = useState(initialState);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [likedGames, setLikedGames] = useState(new Set());
  const mainRef = useRef(null);

  const update = useCallback((partial) => setState(s => ({ ...s, ...partial })), []);

  const notify = useCallback((msg) => {
    update({ notification: msg });
    setTimeout(() => update({ notification: null }), 3000);
  }, [update]);

  const navigate = useCallback((page, extra = {}) => {
    update({ page, ...extra });
    if (mainRef.current) mainRef.current.scrollTo(0, 0);
  }, [update]);

  // ── Fix: handle hash-based deep links (for embed/share) ──────────────────────
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#game-")) {
      const gameId = hash.replace("#game-", "");
      const game = state.games.find(g => g.id === gameId);
      if (game) navigate("game", { selectedGame: game });
    }
  }, [state.games]);

  // ── Fix: add missing <meta> tags for proper hosting ──────────────────────────
  useEffect(() => {
    // Ensure viewport meta exists
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = "width=device-width, initial-scale=1.0";
      document.head.appendChild(meta);
    }
    // Ensure charset
    if (!document.querySelector('meta[charset]')) {
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "UTF-8");
      document.head.prepend(meta);
    }
    // Set page title
    document.title = "GameSpot Arabia - منصة الألعاب العربية";
  }, []);

  // Load games & articles from Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const games = await supabase("/games?select=*&order=created_at.desc");
        if (games && games.length > 0) {
          update({
            games,
            stats: {
              totalGames: games.length,
              totalPlays: games.reduce((s, g) => s + (g.plays || 0), 0),
              totalUsers: new Set(games.map(g => g.author_id)).size,
              totalArticles: state.articles.length,
            }
          });
        }
      } catch (_) {}
      try {
        const articles = await supabase("/articles?select=*&order=created_at.desc");
        if (articles && articles.length > 0) {
          update({ articles, stats: { totalGames: state.stats.totalGames, totalPlays: state.stats.totalPlays, totalUsers: state.stats.totalUsers, totalArticles: articles.length } });
        }
      } catch (_) {}
    }
    loadData();
  }, []);
    if (!state.searchQuery.trim()) {
      update({ searchResults: { games: [], articles: [] } });
      return;
    }
    const q = state.searchQuery.toLowerCase();
    const games = state.games.filter(g =>
      g.title.toLowerCase().includes(q) ||
      g.description?.toLowerCase().includes(q) ||
      g.category?.toLowerCase().includes(q) ||
      g.author?.toLowerCase().includes(q)
    );
    const articles = state.articles.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q)
    );
    update({ searchResults: { games, articles } });
  }, [state.searchQuery]);

  const filteredGames = activeCategory === "الكل"
    ? state.games
    : state.games.filter(g => g.category === activeCategory);

  const trendingGames = [...state.games].sort((a, b) => b.plays - a.plays).slice(0, 6);

  function handleLike(gameId) {
    setLikedGames(prev => {
      const n = new Set(prev);
      if (n.has(gameId)) { n.delete(gameId); } else { n.add(gameId); }
      return n;
    });
  }

  function handlePlayGame(game) {
    // Track play
    update({
      games: state.games.map(g => g.id === game.id ? { ...g, plays: g.plays + 1 } : g)
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>

      {/* SEO meta (hidden but crawlable) */}
      <div className="seo-content" aria-hidden="true">
        <h1>GameSpot Arabia - منصة ألعاب HTML5 العربية</h1>
        <p>اكتشف وارفع وشارك ألعاب HTML5 الرائعة. أفضل منصة ألعاب ويب عربية مجانية.</p>
      </div>

      <div className="app-shell">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <div className="sidebar-logo" onClick={() => navigate("home")} style={{ cursor: "pointer" }}>
            <div className="logo-text">🎮 GameSpot</div>
            <div className="logo-sub">Arabia</div>
          </div>

          <nav className="sidebar-section">
            {[
              { icon: "home", label: "الرئيسية", page: "home" },
              { icon: "search", label: "استكشاف", page: "explore" },
            ].map(item => (
              <div
                key={item.page}
                className={`sidebar-item ${state.page === item.page ? "active" : ""}`}
                onClick={() => { navigate(item.page); setSidebarOpen(false); }}
              >
                <Icon name={item.icon} size={20} />
                {item.label}
              </div>
            ))}
          </nav>

          <div className="sidebar-divider" />

          <nav className="sidebar-section">
            <div className="sidebar-section-label">المحتوى</div>
            {[
              { icon: "articles", label: "المقالات", page: "articles" },
              { icon: "stats", label: "الإحصائيات", page: "analytics" },
            ].map(item => (
              <div
                key={item.page}
                className={`sidebar-item ${state.page === item.page ? "active" : ""}`}
                onClick={() => { navigate(item.page); setSidebarOpen(false); }}
              >
                <Icon name={item.icon} size={20} />
                {item.label}
              </div>
            ))}
          </nav>

          {state.user && (
            <>
              <div className="sidebar-divider" />
              <nav className="sidebar-section">
                <div className="sidebar-section-label">حسابي</div>
                <div className={`sidebar-item ${state.page === "profile" ? "active" : ""}`}
                  onClick={() => { navigate("profile", { profileUser: state.user }); setSidebarOpen(false); }}>
                  <Icon name="user" size={20} />
                  ملفي الشخصي
                </div>
                <div className="sidebar-item" onClick={() => update({ uploadModal: true })}>
                  <Icon name="upload" size={20} />
                  رفع لعبة
                </div>
                <div className="sidebar-item" onClick={() => update({ articleModal: true })}>
                  <Icon name="plus" size={20} />
                  كتابة مقال
                </div>
              </nav>
            </>
          )}

          <div style={{ flex: 1 }} />

          {state.user && (
            <div style={{ padding: "16px 12px" }}>
              <div className="sidebar-item" onClick={() => update({ user: null, token: null })}>
                <span>🚪</span>
                تسجيل خروج
              </div>
            </div>
          )}
        </aside>

        {/* ── Main Area ───────────────────────────────────────────────── */}
        <main className="main-area" ref={mainRef}>
          {/* Topbar */}
          <header className="topbar">
            <button className="mobile-menu-btn topbar-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <Icon name="menu" size={20} />
            </button>

            <div className="topbar-search">
              <span className="search-icon"><Icon name="search" size={16} /></span>
              <input
                type="search"
                placeholder="ابحث عن ألعاب، مقالات، مطورين..."
                value={state.searchQuery}
                onChange={e => update({ searchQuery: e.target.value, page: e.target.value ? "search" : state.page === "search" ? "home" : state.page })}
              />
            </div>

            <div className="topbar-user">
              {state.user ? (
                <>
                  <div className="user-avatar" onClick={() => navigate("profile", { profileUser: state.user })} title={state.user.username}>
                    {state.user.avatar
                      ? <img src={state.user.avatar} alt={state.user.username} />
                      : state.user.username?.[0]?.toUpperCase()}
                  </div>
                  <button className="btn-secondary" style={{ padding: "6px 16px", fontSize: "13px" }}
                    onClick={() => update({ uploadModal: true })}>
                    + رفع لعبة
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-login" onClick={() => update({ authModal: "login" })}>دخول</button>
                  <button className="btn-signup" onClick={() => update({ authModal: "signup" })}>إنشاء حساب</button>
                </>
              )}
            </div>
          </header>

          {/* Pages */}
          <div className="page-content">
            {state.page === "home" && (
              <HomePage
                games={state.games} articles={state.articles} trendingGames={trendingGames}
                stats={state.stats} navigate={navigate} likedGames={likedGames}
                handleLike={handleLike} user={state.user} update={update}
              />
            )}
            {state.page === "explore" && (
              <ExplorePage
                games={filteredGames} categories={CATEGORIES} activeCategory={activeCategory}
                setActiveCategory={setActiveCategory} navigate={navigate}
                likedGames={likedGames} handleLike={handleLike}
              />
            )}
            {state.page === "search" && (
              <SearchPage
                query={state.searchQuery} results={state.searchResults}
                navigate={navigate}
              />
            )}
            {state.page === "game" && state.selectedGame && (
              <GamePage
                game={state.selectedGame} likedGames={likedGames} handleLike={handleLike}
                navigate={navigate} onPlay={handlePlayGame} update={update}
              />
            )}
            {state.page === "articles" && (
              <ArticlesPage articles={state.articles} navigate={navigate} />
            )}
            {state.page === "article" && state.selectedArticle && (
              <ArticleDetail article={state.selectedArticle} navigate={navigate} />
            )}
            {state.page === "analytics" && (
              <AnalyticsPage games={state.games} articles={state.articles} stats={state.stats} />
            )}
            {state.page === "profile" && state.profileUser && (
              <ProfilePage
                user={state.profileUser} games={state.games}
                currentUser={state.user} navigate={navigate} update={update}
              />
            )}
          </div>
        </main>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {state.authModal && (
        <AuthModal
          mode={state.authModal} update={update} notify={notify}
          onSuccess={(user, token) => {
            update({ user, token, authModal: null });
            notify(`مرحباً ${user.displayName || user.username}! 🎮`);
          }}
        />
      )}
      {state.uploadModal && (
        <UploadModal
          update={update} notify={notify} user={state.user}
          onUpload={(game) => {
            const newGame = game.id ? game : { ...game, id: Date.now().toString(), plays: 0, likes: 0, created_at: new Date().toISOString() };
            update({
              games: [newGame, ...state.games],
              uploadModal: false,
              stats: { ...state.stats, totalGames: state.stats.totalGames + 1 }
            });
            notify("🎉 تم رفع لعبتك بنجاح!");
          }}
        />
      )}
      {state.articleModal && (
        <ArticleEditorModal
          update={update} notify={notify} user={state.user}
          onPublish={(article) => {
            const newArticle = article.id ? article : { ...article, id: "a" + Date.now(), created_at: new Date().toISOString(), likes: 0 };
            update({
              articles: [newArticle, ...state.articles],
              articleModal: false,
            });
            notify("✍️ تم نشر مقالك بنجاح!");
          }}
        />
      )}
      {state.editProfileModal && (
        <EditProfileModal
          user={state.user} update={update} notify={notify}
          onSave={(updated) => {
            update({ user: updated, editProfileModal: false, profileUser: updated });
            notify("✅ تم تحديث ملفك الشخصي!");
          }}
        />
      )}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 499 }}
        />
      )}

      {/* Notification */}
      {state.notification && (
        <div className="notification">{state.notification}</div>
      )}
    </>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────
function HomePage({ games, articles, trendingGames, stats, navigate, likedGames, handleLike, user, update }) {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon name="fire" size={14} /> المنصة العربية الأولى للألعاب
          </div>
          <h1 className="hero-title">العب. شارك.<br />ابدع.</h1>
          <p className="hero-desc">
            اكتشف آلاف الألعاب المصنوعة بـ HTML5 من مطورين عرب موهوبين.
            أو كن المطور القادم وشارك لعبتك مع العالم.
          </p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => navigate("explore")}>
              <Icon name="gamepad" size={18} /> استكشف الألعاب
            </button>
            <button className="btn-secondary" onClick={() => user ? update({ uploadModal: true }) : update({ authModal: "signup" })}>
              + ارفع لعبتك
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card-mini">
            <div className="hero-card-mini-num">{formatNum(stats.totalGames)}</div>
            <div className="hero-card-mini-label">لعبة منشورة</div>
          </div>
          <div className="hero-card-mini">
            <div className="hero-card-mini-num">{formatNum(stats.totalPlays)}</div>
            <div className="hero-card-mini-label">مرة تشغيل</div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="stats-bar">
        {[
          { num: stats.totalGames, label: "لعبة منشورة", icon: "🎮" },
          { num: formatNum(stats.totalPlays), label: "مرة تشغيل", icon: "▶️" },
          { num: stats.totalUsers, label: "مطور مسجل", icon: "👾" },
          { num: stats.totalArticles, label: "مقالة تقنية", icon: "📝" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div className="stat-number">{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Trending */}
      <section style={{ marginBottom: 48 }}>
        <div className="section-header">
          <h2 className="section-title">🔥 الأكثر تشغيلاً</h2>
          <span className="section-link" onClick={() => navigate("explore")}>عرض الكل</span>
        </div>
        <div className="games-grid">
          {trendingGames.map(game => (
            <GameCard key={game.id} game={game} navigate={navigate} liked={likedGames.has(game.id)} onLike={handleLike} />
          ))}
        </div>
      </section>

      {/* Latest Articles */}
      {articles.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div className="section-header">
            <h2 className="section-title">✍️ أحدث المقالات</h2>
            <span className="section-link" onClick={() => navigate("articles")}>عرض الكل</span>
          </div>
          <div className="articles-grid">
            {articles.slice(0, 2).map(a => (
              <ArticleCard key={a.id} article={a} navigate={navigate} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

// ─── Explore Page ──────────────────────────────────────────────────────────────
function ExplorePage({ games, categories, activeCategory, setActiveCategory, navigate, likedGames, handleLike }) {
  return (
    <>
      <h1 className="section-title" style={{ marginBottom: 24, fontSize: 32 }}>استكشف الألعاب</h1>
      <div className="chips-row">
        {categories.map(cat => (
          <div key={cat} className={`chip ${activeCategory === cat ? "active" : ""}`} onClick={() => setActiveCategory(cat)}>
            {cat}
          </div>
        ))}
      </div>
      {games.length > 0 ? (
        <div className="games-grid">
          {games.map(game => (
            <GameCard key={game.id} game={game} navigate={navigate} liked={likedGames.has(game.id)} onLike={handleLike} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <div className="empty-title">لا توجد ألعاب في هذا التصنيف</div>
          <div className="empty-sub">كن أول من يرفع لعبة هنا!</div>
        </div>
      )}
    </>
  );
}

// ─── Search Page ───────────────────────────────────────────────────────────────
function SearchPage({ query, results, navigate }) {
  const total = results.games.length + results.articles.length;
  return (
    <>
      <h1 className="section-title" style={{ marginBottom: 8, fontSize: 28 }}>نتائج البحث</h1>
      <p style={{ color: "var(--text-subdued)", marginBottom: 28, fontSize: 14 }}>
        {total} نتيجة لـ «{query}»
      </p>
      {results.games.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 16 }}>الألعاب ({results.games.length})</h2>
          {results.games.map(g => (
            <div key={g.id} className="search-result-item"
              onClick={() => navigate("game", { selectedGame: g })}>
              <div className="search-result-thumb">{getEmoji(g.id)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{g.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-subdued)" }}>{g.category} · {g.author}</div>
              </div>
              <div style={{ color: "var(--text-faint)", fontSize: 13 }}>{formatNum(g.plays)} تشغيل</div>
            </div>
          ))}
        </section>
      )}
      {results.articles.length > 0 && (
        <section>
          <h2 className="section-title" style={{ fontSize: 18, marginBottom: 16 }}>المقالات ({results.articles.length})</h2>
          {results.articles.map(a => (
            <div key={a.id} className="search-result-item"
              onClick={() => navigate("article", { selectedArticle: a })}>
              <div className="search-result-thumb">📝</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                <div style={{ fontSize: 13, color: "var(--text-subdued)" }}>بقلم {a.author}</div>
              </div>
            </div>
          ))}
        </section>
      )}
      {total === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">لا توجد نتائج</div>
          <div className="empty-sub">جرب كلمات مختلفة</div>
        </div>
      )}
    </>
  );
}

// ─── Game Card ─────────────────────────────────────────────────────────────────
function GameCard({ game, navigate, liked, onLike }) {
  return (
    <article
      className="game-card"
      onClick={() => navigate("game", { selectedGame: game })}
      aria-label={`لعبة: ${game.title}`}
    >
      <div className="game-thumbnail">
        {game.thumbnail
          ? <img src={game.thumbnail} alt={game.title} />
          : <span className="game-thumbnail-placeholder">{getEmoji(game.id)}</span>}
        <div className="play-overlay">
          <Icon name="play" size={20} />
        </div>
      </div>
      <div className="game-title">{game.title}</div>
      <div className="game-meta">
        <span>{game.category}</span>
        <span>·</span>
        <span>{game.author}</span>
      </div>
      <div className="game-stats">
        <div className="game-stat"><Icon name="play" size={12} />{formatNum(game.plays)}</div>
        <div className="game-stat" onClick={e => { e.stopPropagation(); onLike(game.id); }}
          style={{ cursor: "pointer", color: liked ? "var(--accent2)" : undefined }}>
          {liked ? <Icon name="heart" size={12} /> : <Icon name="heartOutline" size={12} />}
          {formatNum(game.likes + (liked ? 1 : 0))}
        </div>
      </div>
    </article>
  );
}

// ─── Game Page ─────────────────────────────────────────────────────────────────
function GamePage({ game, likedGames, handleLike, navigate, onPlay, update }) {
  const [playing, setPlaying] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const liked = likedGames.has(game.id);

  function startPlay() {
    setPlaying(true);
    onPlay(game);
  }

  return (
    <>
      {/* Back */}
      <button
        onClick={() => navigate("home")}
        style={{ background: "none", border: "none", color: "var(--text-subdued)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 24, fontSize: 14, fontFamily: "inherit" }}
      >
        <Icon name="back" size={18} />
        رجوع
      </button>

      <div className="game-page-header">
        <div className="game-page-cover">
          {game.thumbnail
            ? <img src={game.thumbnail} alt={game.title} />
            : <span style={{ fontSize: 64 }}>{getEmoji(game.id)}</span>}
        </div>
        <div className="game-page-info">
          <div className="game-page-type">لعبة • {game.category}</div>
          <h1 className="game-page-title">{game.title}</h1>
          <p className="game-page-desc">{game.description}</p>
          <div className="game-page-author">
            <span>بقلم</span>
            <strong>{game.author}</strong>
            <span>·</span>
            <Icon name="play" size={14} />
            <span>{formatNum(game.plays)} تشغيل</span>
            <span>·</span>
            <Icon name="heart" size={14} />
            <span>{formatNum(game.likes + (liked ? 1 : 0))}</span>
          </div>
          <div className="game-actions">
            {!playing && (
              <button className="btn-play" onClick={startPlay}>
                <Icon name="play" size={20} />
                العب الآن
              </button>
            )}
            <button className={`btn-like ${liked ? "liked" : ""}`} onClick={() => handleLike(game.id)}>
              {liked ? <Icon name="heart" size={20} /> : <Icon name="heartOutline" size={20} />}
            </button>
            <button className="btn-share" onClick={() => setShowShare(true)}>
              <Icon name="external" size={16} />
              مشاركة
            </button>
            {game.tags?.map(tag => (
              <span key={tag} className="game-tag">{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {playing && (
        <div className="game-iframe-container">
          <div className="game-iframe-header">
            <span className="game-iframe-title">🎮 {game.title}</span>
            <button
              onClick={() => setPlaying(false)}
              style={{ background: "none", border: "none", color: "var(--text-subdued)", cursor: "pointer" }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          {game.html_content ? (
            <iframe
              className="game-iframe"
              srcDoc={game.html_content}
              title={game.title}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
            />
          ) : (
            <div style={{ padding: 60, textAlign: "center", color: "var(--text-subdued)" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>لم يتم رفع ملف اللعبة</div>
              <div style={{ fontSize: 14 }}>هذه لعبة تجريبية. ارفع ملف HTML لعبتك لتظهر هنا.</div>
            </div>
          )}
        </div>
      )}

      {/* Share Modal */}
      {showShare && <ShareModal game={game} onClose={() => setShowShare(false)} />}
    </>
  );
}

// ─── Articles Page ─────────────────────────────────────────────────────────────
function ArticlesPage({ articles, navigate }) {
  return (
    <>
      <h1 className="section-title" style={{ marginBottom: 32, fontSize: 32 }}>📝 المقالات</h1>
      {articles.length > 0 ? (
        <div className="articles-grid">
          {articles.map(a => <ArticleCard key={a.id} article={a} navigate={navigate} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">✍️</div>
          <div className="empty-title">لا توجد مقالات بعد</div>
          <div className="empty-sub">كن أول من يكتب مقالاً!</div>
        </div>
      )}
    </>
  );
}

// ─── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, navigate }) {
  return (
    <article className="article-card" onClick={() => navigate("article", { selectedArticle: article })}>
      <div className="article-meta">
        <Icon name="clock" size={14} />
        <span>{article.read_time} دقائق قراءة</span>
        <span>·</span>
        <span>{new Date(article.created_at).toLocaleDateString("ar")}</span>
      </div>
      <h2 className="article-title">{article.title}</h2>
      <p className="article-excerpt">{article.content}</p>
      <div className="article-footer">
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-subdued)" }}>
          <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 12 }}>{article.author?.[0]}</div>
          {article.author}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-faint)", fontSize: 13 }}>
          <Icon name="heart" size={14} />
          {article.likes}
        </div>
      </div>
    </article>
  );
}

// ─── Article Detail ────────────────────────────────────────────────────────────
function ArticleDetail({ article, navigate }) {
  return (
    <article style={{ maxWidth: 760, margin: "0 auto" }}>
      <button
        onClick={() => navigate("articles")}
        style={{ background: "none", border: "none", color: "var(--text-subdued)", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, marginBottom: 32, fontSize: 14, fontFamily: "inherit" }}
      >
        <Icon name="back" size={18} />
        المقالات
      </button>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, color: "var(--text-subdued)", fontSize: 14 }}>
        <Icon name="clock" size={14} />
        <span>{article.read_time} دقائق قراءة</span>
        <span>·</span>
        <span>{new Date(article.created_at).toLocaleDateString("ar")}</span>
        <span>·</span>
        <span>بقلم <strong style={{ color: "var(--text-base)" }}>{article.author}</strong></span>
      </div>
      <h1 style={{ fontSize: 42, fontWeight: 900, lineHeight: 1.2, marginBottom: 32 }}>{article.title}</h1>
      <div style={{ fontSize: 16, lineHeight: 1.9, color: "#d1d1d1" }}
        dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, "<br/>") }}
      />
    </article>
  );
}

// ─── Analytics Page ────────────────────────────────────────────────────────────
function AnalyticsPage({ games, articles, stats }) {
  const topGames = [...games].sort((a, b) => b.plays - a.plays).slice(0, 5);
  const totalLikes = games.reduce((s, g) => s + g.likes, 0);

  return (
    <>
      <h1 className="section-title" style={{ marginBottom: 32, fontSize: 32 }}>📊 الإحصائيات</h1>

      {/* Overview */}
      <div className="stats-bar" style={{ marginBottom: 40 }}>
        {[
          { num: stats.totalGames, label: "إجمالي الألعاب", color: "#1ed760" },
          { num: formatNum(stats.totalPlays), label: "إجمالي التشغيلات", color: "#e91429" },
          { num: formatNum(totalLikes), label: "إجمالي الإعجابات", color: "#f59e0b" },
          { num: stats.totalArticles, label: "إجمالي المقالات", color: "#3b82f6" },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div className="stat-number" style={{ color: s.color }}>{s.num}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Top Games Table */}
      <div style={{ background: "var(--bg-tinted)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)", marginBottom: 32 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>🏆 أكثر الألعاب تشغيلاً</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-faint)", fontSize: 12, textTransform: "uppercase", letterSpacing: "1px" }}>
              <th style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>#</th>
              <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>اللعبة</th>
              <th style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>التشغيلات</th>
              <th style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>الإعجابات</th>
              <th style={{ padding: "10px 0", textAlign: "right", fontWeight: 700 }}>التصنيف</th>
            </tr>
          </thead>
          <tbody>
            {topGames.map((g, i) => (
              <tr key={g.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "14px 0", color: i === 0 ? "#f59e0b" : "var(--text-faint)" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td style={{ padding: "14px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{getEmoji(g.id)}</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.title}</div>
                      <div style={{ fontSize: 12, color: "var(--text-subdued)" }}>{g.author}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: "14px 0", fontWeight: 700, color: "var(--accent)" }}>{formatNum(g.plays)}</td>
                <td style={{ padding: "14px 0", color: "var(--accent2)" }}>{formatNum(g.likes)}</td>
                <td style={{ padding: "14px 0" }}>
                  <span className="game-tag">{g.category}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart (CSS-only) */}
      <div style={{ background: "var(--bg-tinted)", borderRadius: "var(--radius-lg)", padding: 24, border: "1px solid var(--border)" }}>
        <h2 style={{ fontWeight: 800, marginBottom: 20, fontSize: 18 }}>📈 توزيع التشغيلات</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topGames.map(g => {
            const pct = Math.round((g.plays / topGames[0].plays) * 100);
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 120, fontSize: 13, color: "var(--text-subdued)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{g.title}</div>
                <div style={{ flex: 1, background: "var(--bg-press)", borderRadius: 4, height: 8 }}>
                  <div style={{ width: `${pct}%`, background: "var(--accent)", borderRadius: 4, height: "100%", transition: "width 0.8s" }} />
                </div>
                <div style={{ width: 60, fontSize: 13, fontWeight: 700, color: "var(--accent)", textAlign: "left" }}>{formatNum(g.plays)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Profile Page ──────────────────────────────────────────────────────────────
function ProfilePage({ user, games, currentUser, navigate, update }) {
  const userGames = games.filter(g => g.author_id === user.id);
  const isOwn = currentUser?.id === user.id;

  return (
    <>
      <div className="profile-header">
        <div className="profile-avatar">
          {user.avatar ? <img src={user.avatar} alt={user.username} /> : user.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: "var(--text-subdued)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>ملف المطور</div>
          <div className="profile-name">{user.displayName || user.username}</div>
          <div className="profile-username">@{user.username}</div>
          {user.bio && <p style={{ color: "var(--text-subdued)", fontSize: 14, marginTop: 8, maxWidth: 500 }}>{user.bio}</p>}
          <div className="profile-stats">
            <div className="profile-stat">
              <div className="profile-stat-num">{userGames.length}</div>
              <div className="profile-stat-label">لعبة</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{formatNum(userGames.reduce((s, g) => s + g.plays, 0))}</div>
              <div className="profile-stat-label">تشغيل</div>
            </div>
            <div className="profile-stat">
              <div className="profile-stat-num">{formatNum(userGames.reduce((s, g) => s + g.likes, 0))}</div>
              <div className="profile-stat-label">إعجاب</div>
            </div>
          </div>
        </div>
        {isOwn && (
          <button className="btn-secondary" onClick={() => update({ editProfileModal: true })}>
            <Icon name="edit" size={16} />
            تعديل الملف
          </button>
        )}
      </div>

      <div className="tabs">
        <div className="tab active">الألعاب ({userGames.length})</div>
      </div>

      {userGames.length > 0 ? (
        <div className="games-grid">
          {userGames.map(g => (
            <GameCard key={g.id} game={g} navigate={navigate} liked={false} onLike={() => {}} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎮</div>
          <div className="empty-title">{isOwn ? "لم ترفع أي لعبة بعد" : "لا توجد ألعاب"}</div>
          {isOwn && <div className="empty-sub">ارفع لعبتك الأولى الآن!</div>}
        </div>
      )}
    </>
  );
}

// ─── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ mode, update, notify, onSuccess }) {
  const [tab, setTab] = useState(mode);
  const [form, setForm] = useState({ email: "", password: "", username: "", displayName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState(null);
  const captchaRef = useRef(null);
  const captchaWidgetId = useRef(null);

  function f(k) { return e => setForm(p => ({ ...p, [k]: e.target.value })); }

  // Load & render reCAPTCHA
  useEffect(() => {
    let mounted = true;
    loadRecaptcha().then(grecaptcha => {
      if (!mounted || !captchaRef.current) return;
      if (captchaWidgetId.current !== null) return;
      captchaWidgetId.current = grecaptcha.render(captchaRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: "dark",
        callback: (token) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(null),
        "error-callback": () => setCaptchaToken(null),
      });
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  async function handleSubmit() {
    setError("");
    if (!form.email || !form.password) { setError("يرجى ملء جميع الحقول"); return; }
    if (tab === "signup" && !form.username) { setError("اسم المستخدم مطلوب"); return; }
    if (!captchaToken) { setError("يرجى إكمال التحقق من أنك لست روبوتاً"); return; }

    setLoading(true);
    try {
      if (tab === "signup") {
        const data = await supabaseAuth("/signup", {
          email: form.email,
          password: form.password,
          data: { username: form.username, display_name: form.displayName || form.username },
        });
        if (data.error) { setError(data.error.message || "خطأ في إنشاء الحساب"); setLoading(false); return; }
        // Try to insert into profiles table if exists
        try {
          await supabase("/profiles", {
            method: "POST",
            body: JSON.stringify({
              id: data.user?.id,
              username: form.username,
              display_name: form.displayName || form.username,
              email: form.email,
            }),
          });
        } catch (_) {}
        const user = {
          id: data.user?.id,
          email: form.email,
          username: form.username,
          displayName: form.displayName || form.username,
          avatar: null,
          bio: "",
          token: data.access_token,
        };
        setLoading(false);
        onSuccess(user, data.access_token);
      } else {
        const data = await supabaseAuth("/token?grant_type=password", {
          email: form.email,
          password: form.password,
        });
        if (data.error) { setError(data.error.message || "بريد إلكتروني أو كلمة مرور خاطئة"); setLoading(false); return; }
        const meta = data.user?.user_metadata || {};
        // Fetch profile
        let profile = null;
        try {
          const profiles = await supabase(`/profiles?id=eq.${data.user?.id}&select=*`);
          profile = profiles?.[0];
        } catch (_) {}
        const user = {
          id: data.user?.id,
          email: form.email,
          username: profile?.username || meta.username || form.email.split("@")[0],
          displayName: profile?.display_name || meta.display_name || meta.username || form.email.split("@")[0],
          avatar: profile?.avatar_url || null,
          bio: profile?.bio || "",
          token: data.access_token,
        };
        setLoading(false);
        onSuccess(user, data.access_token);
      }
    } catch (e) {
      setError("حدث خطأ، تحقق من الاتصال");
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={() => update({ authModal: null })}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={() => update({ authModal: null })}>
          <Icon name="close" size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🎮</div>
          <div className="modal-title">{tab === "login" ? "مرحباً بعودتك!" : "انضم إلى المجتمع"}</div>
          <div className="modal-subtitle">{tab === "login" ? "سجّل دخولك للمتابعة" : "أنشئ حسابك المجاني الآن"}</div>
        </div>

        <div className="tabs" style={{ marginBottom: 28, justifyContent: "center" }}>
          <div className={`tab ${tab === "login" ? "active" : ""}`} onClick={() => { setTab("login"); setCaptchaToken(null); }}>دخول</div>
          <div className={`tab ${tab === "signup" ? "active" : ""}`} onClick={() => { setTab("signup"); setCaptchaToken(null); }}>إنشاء حساب</div>
        </div>

        {tab === "signup" && (
          <>
            <div className="form-group">
              <label className="form-label">الاسم الكامل</label>
              <input className="form-input" placeholder="محمد أحمد" value={form.displayName} onChange={f("displayName")} />
            </div>
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input className="form-input" placeholder="@username" value={form.username} onChange={f("username")} />
            </div>
          </>
        )}
        <div className="form-group">
          <label className="form-label">البريد الإلكتروني</label>
          <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={f("email")} />
        </div>
        <div className="form-group">
          <label className="form-label">كلمة المرور</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={f("password")} />
        </div>

        {/* Google reCAPTCHA */}
        <div className="recaptcha-wrapper">
          <div ref={captchaRef} />
        </div>

        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ جاري المعالجة..." : tab === "login" ? "دخول" : "إنشاء حساب"}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-faint)" }}>
          محمي بـ Google reCAPTCHA
        </div>
      </div>
    </div>
  );
}

// ─── Upload Modal ──────────────────────────────────────────────────────────────
const MAX_FILE_SIZE_MB = 100; // ← رفع الحد الأقصى إلى 100MB

function UploadModal({ update, notify, user, onUpload }) {
  const [form, setForm] = useState({ title: "", description: "", category: "أكشن", tags: "" });
  const [htmlFile, setHtmlFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [htmlContent, setHtmlContent] = useState(null);
  const [thumbUrl, setThumbUrl] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [readingFile, setReadingFile] = useState(false);
  const [error, setError] = useState("");
  const htmlInputRef = useRef();
  const thumbInputRef = useRef();

  function f(k) { return e => setForm(p => ({ ...p, [k]: e.target.value })); }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  }

  function handleHtmlFile(file) {
    if (!file) return;
    // قبول .html و .zip (للألعاب الكبيرة المضغوطة)
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      setError("يرجى رفع ملف HTML فقط (.html أو .htm)");
      return;
    }
    const maxBytes = MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`حجم الملف كبير جداً. الحد الأقصى ${MAX_FILE_SIZE_MB}MB`);
      return;
    }
    setError("");
    setHtmlFile(file);
    setReadingFile(true);
    setProgress(0);

    // قراءة الملف مع متابعة التقدم
    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 90));
      }
    };
    reader.onload = (e) => {
      setHtmlContent(e.target.result);
      setProgress(100);
      setTimeout(() => { setReadingFile(false); setProgress(0); }, 600);
    };
    reader.onerror = () => {
      setError("فشل في قراءة الملف، حاول مرة أخرى");
      setReadingFile(false);
      setProgress(0);
    };
    reader.readAsText(file, "UTF-8");
  }

  function handleThumbFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    setThumbFile(file);
    const reader = new FileReader();
    reader.onload = e => setThumbUrl(e.target.result);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!form.title) { setError("يرجى إدخال اسم اللعبة"); return; }
    if (!form.description) { setError("يرجى إدخال وصف اللعبة"); return; }
    if (!user) { setError("يجب تسجيل الدخول أولاً"); return; }

    setLoading(true);
    setProgress(10);

    const game = {
      title: form.title,
      description: form.description,
      category: form.category,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      html_content: htmlContent,
      thumbnail: thumbUrl,
      author: user.displayName || user.username,
      author_id: user.id,
      plays: 0,
      likes: 0,
    };

    setProgress(40);

    // Try to save to Supabase
    try {
      const authHeader = user.token ? { Authorization: `Bearer ${user.token}` } : {};
      setProgress(70);
      const saved = await supabase("/games", {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify(game),
      });
      setProgress(100);
      if (saved && saved[0]) {
        setTimeout(() => { setLoading(false); setProgress(0); onUpload(saved[0]); }, 400);
        return;
      }
    } catch (_) {}

    // Fallback: local only
    setProgress(100);
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
      onUpload({ ...game, id: Date.now().toString(), created_at: new Date().toISOString() });
    }, 400);
  }

  return (
    <div className="modal-overlay" onClick={() => update({ uploadModal: false })}>
      <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ direction: "rtl" }}>
        <button className="modal-close" onClick={() => update({ uploadModal: false })}>
          <Icon name="close" size={16} />
        </button>

        <div className="modal-title">🚀 رفع لعبة جديدة</div>
        <div className="modal-subtitle">شارك لعبتك مع المجتمع العربي</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">اسم اللعبة *</label>
            <input className="form-input" placeholder="اسم لعبتك الرائعة" value={form.title} onChange={f("title")} />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label className="form-label">وصف اللعبة *</label>
            <textarea className="form-input form-textarea" placeholder="اكتب وصفاً جذاباً للعبتك..." value={form.description} onChange={f("description")} />
          </div>
          <div className="form-group">
            <label className="form-label">التصنيف</label>
            <select className="form-input" value={form.category} onChange={f("category")}>
              {CATEGORIES.filter(c => c !== "الكل").map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">الوسوم (مفصولة بفواصل)</label>
            <input className="form-input" placeholder="أكشن، مغامرة، فضاء" value={form.tags} onChange={f("tags")} />
          </div>
        </div>

        {/* HTML File */}
        <div className="form-group">
          <label className="form-label">ملف اللعبة (.html)</label>
          <div
            className={`file-drop ${dragOver ? "drag-over" : ""}`}
            onClick={() => htmlInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleHtmlFile(e.dataTransfer.files[0]); }}
          >
            <div className="file-drop-icon">{readingFile ? "⏳" : "📁"}</div>
            <div className="file-drop-text">اسحب ملف HTML هنا أو انقر للاختيار</div>
            <div className="file-drop-sub">ملفات .html فقط</div>
            <div className="upload-size-hint">✅ يدعم الملفات الكبيرة حتى {MAX_FILE_SIZE_MB}MB</div>
          </div>
          {htmlFile && (
            <div className="file-name">
              <span>✅</span>
              <span>{htmlFile.name}</span>
              <span style={{ color: "var(--text-faint)", marginRight: "auto" }}>({formatBytes(htmlFile.size)})</span>
            </div>
          )}
          {/* Progress Bar */}
          {(readingFile || (loading && progress > 0)) && (
            <div className="upload-progress">
              <div className="upload-progress-text">
                <span>{readingFile ? "جارٍ قراءة الملف..." : "جارٍ الرفع..."}</span>
                <span>{progress}%</span>
              </div>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <input ref={htmlInputRef} type="file" accept=".html,.htm" style={{ display: "none" }}
            onChange={e => handleHtmlFile(e.target.files?.[0])} />
        </div>

        {/* Thumbnail */}
        <div className="form-group">
          <label className="form-label">صورة مصغرة (اختياري)</label>
          <div
            className="file-drop"
            onClick={() => thumbInputRef.current?.click()}
            style={{ padding: "20px", display: "flex", alignItems: "center", gap: 16 }}
          >
            {thumbUrl ? (
              <img src={thumbUrl} alt="" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
            ) : (
              <div style={{ width: 80, height: 80, background: "var(--bg-elevated)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🖼️</div>
            )}
            <div>
              <div className="file-drop-text" style={{ fontSize: 14 }}>اختر صورة للعبة</div>
              <div className="file-drop-sub">PNG, JPG, WebP</div>
            </div>
          </div>
          <input ref={thumbInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleThumbFile(e.target.files?.[0])} />
        </div>

        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleUpload} disabled={loading || readingFile}>
          {loading ? `⏳ جاري الرفع... ${progress}%` : readingFile ? "⏳ جارٍ قراءة الملف..." : "🚀 نشر اللعبة"}
        </button>
      </div>
    </div>
  );
}

// ─── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ game, onClose }) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);

  // رابط المشاركة - يستخدم الرابط الحالي للموقع
  const pageUrl = typeof window !== "undefined"
    ? `${window.location.origin}${window.location.pathname}#game-${game.id}`
    : `https://gamespot-arabia.com/game/${game.id}`;

  const shareText = `🎮 العب "${game.title}" على GameSpot Arabia!\n${game.description}`;

  const embedCode = `<iframe
  src="${pageUrl}"
  width="800"
  height="600"
  frameborder="0"
  allowfullscreen
  title="${game.title}"
  style="border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);">
</iframe>`;

  function share(platform) {
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareText)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + "\n" + pageUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(game.title)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`,
    };
    window.open(urls[platform], "_blank", "noopener,width=600,height=500");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // fallback
      const el = document.createElement("textarea");
      el.value = pageUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function copyEmbed() {
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    } catch (_) {}
  }

  const platforms = [
    { id: "twitter", label: "X (Twitter)", icon: "𝕏", color: "#1DA1F2" },
    { id: "facebook", label: "Facebook", icon: "📘", color: "#4267B2" },
    { id: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366" },
    { id: "telegram", label: "Telegram", icon: "✈️", color: "#0088cc" },
    { id: "reddit", label: "Reddit", icon: "🔴", color: "#FF4500" },
    { id: "linkedin", label: "LinkedIn", icon: "💼", color: "#0077b5" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal share-modal" onClick={e => e.stopPropagation()} style={{ direction: "rtl" }}>
        <button className="modal-close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>

        <div className="modal-title">📤 مشاركة اللعبة</div>
        <div className="modal-subtitle">شارك "{game.title}" مع أصدقائك</div>

        {/* Copy Link */}
        <div style={{ background: "var(--bg-press)", borderRadius: "var(--radius)", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <span style={{ flex: 1, fontSize: 13, color: "var(--text-subdued)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr", textAlign: "left" }}>{pageUrl}</span>
          <button onClick={copyLink} className={`copy-btn ${copied ? "copied" : ""}`} style={{ width: "auto", padding: "6px 14px", marginTop: 0, flexShrink: 0 }}>
            {copied ? "✅ تم النسخ" : "نسخ"}
          </button>
        </div>

        {/* Social Platforms */}
        <div className="share-platforms">
          {platforms.map(p => (
            <button key={p.id} className={`share-btn ${p.id}`} onClick={() => share(p.id)}>
              <span style={{ fontSize: 18 }}>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </div>

        {/* Embed Code */}
        <div className="embed-section">
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>🔗 كود التضمين للموقع</div>
          <div className="embed-code">{embedCode}</div>
          <button className={`copy-btn ${embedCopied ? "copied" : ""}`} onClick={copyEmbed}>
            {embedCopied ? "✅ تم نسخ الكود!" : "📋 نسخ كود التضمين"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Article Editor Modal ──────────────────────────────────────────────────────
function ArticleEditorModal({ update, notify, user, onPublish }) {
  const [form, setForm] = useState({ title: "", content: "", readTime: "5" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const editorRef = useRef();

  function applyFormat(cmd, val) {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }

  async function handlePublish() {
    const content = editorRef.current?.innerHTML || form.content;
    if (!form.title) { setError("يرجى إدخال عنوان المقال"); return; }
    if (!content || content.trim() === "<br>") { setError("يرجى كتابة محتوى المقال"); return; }
    if (!user) { setError("يجب تسجيل الدخول أولاً"); return; }

    setLoading(true);

    const article = {
      title: form.title,
      content,
      read_time: parseInt(form.readTime),
      author: user.displayName || user.username,
      author_id: user.id,
      likes: 0,
    };

    // Try to save to Supabase
    try {
      const authHeader = user.token ? { Authorization: `Bearer ${user.token}` } : {};
      const saved = await supabase("/articles", {
        method: "POST",
        headers: authHeader,
        body: JSON.stringify(article),
      });
      if (saved && saved[0]) {
        setLoading(false);
        onPublish(saved[0]);
        return;
      }
    } catch (_) {}

    // Fallback: local only
    setLoading(false);
    onPublish({ ...article, id: "a" + Date.now(), created_at: new Date().toISOString() });
  }

  return (
    <div className="modal-overlay" onClick={() => update({ articleModal: false })}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()} style={{ direction: "rtl" }}>
        <button className="modal-close" onClick={() => update({ articleModal: false })}>
          <Icon name="close" size={16} />
        </button>

        <div className="modal-title">✍️ كتابة مقال جديد</div>
        <div className="modal-subtitle">شارك خبرتك مع المجتمع</div>

        <div className="form-group">
          <label className="form-label">عنوان المقال *</label>
          <input className="form-input" style={{ fontSize: "18px", fontWeight: 700 }}
            placeholder="عنوان مقالتك المميز..." value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">وقت القراءة (دقائق)</label>
          <input className="form-input" type="number" min="1" max="60" value={form.readTime}
            onChange={e => setForm(p => ({ ...p, readTime: e.target.value }))}
            style={{ width: 120 }} />
        </div>

        <div className="form-group">
          <label className="form-label">محتوى المقال *</label>
          <div className="editor-toolbar">
            {[
              { cmd: "bold", label: "ع", title: "غامق" },
              { cmd: "italic", label: "م", title: "مائل" },
              { cmd: "underline", label: "ت̲", title: "تسطير" },
              { cmd: "insertUnorderedList", label: "• قائمة", title: "قائمة" },
              { cmd: "insertOrderedList", label: "١ مرقمة", title: "قائمة مرقمة" },
            ].map(b => (
              <button key={b.cmd} className="editor-btn" onMouseDown={e => { e.preventDefault(); applyFormat(b.cmd); }} title={b.title}>
                {b.label}
              </button>
            ))}
            <button className="editor-btn" onMouseDown={e => { e.preventDefault(); applyFormat("formatBlock", "h2"); }}>H2</button>
            <button className="editor-btn" onMouseDown={e => { e.preventDefault(); applyFormat("formatBlock", "p"); }}>فقرة</button>
          </div>
          <div
            ref={editorRef}
            className="rich-editor"
            contentEditable
            suppressContentEditableWarning
            style={{ borderRadius: "0 0 var(--radius) var(--radius)" }}
            data-placeholder="اكتب مقالتك هنا... يمكنك استخدام أدوات التنسيق أعلاه"
            onInput={e => setForm(p => ({ ...p, content: e.currentTarget.innerHTML }))}
          />
        </div>

        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handlePublish} disabled={loading}>
          {loading ? "⏳ جاري النشر..." : "📝 نشر المقال"}
        </button>
      </div>
    </div>
  );
}

// ─── Edit Profile Modal ────────────────────────────────────────────────────────
function EditProfileModal({ user, update, notify, onSave }) {
  const [form, setForm] = useState({
    displayName: user?.displayName || "",
    username: user?.username || "",
    bio: user?.bio || "",
    avatar: user?.avatar || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef();

  function f(k) { return e => setForm(p => ({ ...p, [k]: e.target.value })); }

  function handleAvatarFile(file) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => setForm(p => ({ ...p, avatar: e.target.result }));
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form.username.trim()) { setError("اسم المستخدم مطلوب"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    setLoading(false);
    onSave({ ...user, ...form });
  }

  return (
    <div className="modal-overlay" onClick={() => update({ editProfileModal: false })}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ direction: "rtl" }}>
        <button className="modal-close" onClick={() => update({ editProfileModal: false })}>
          <Icon name="close" size={16} />
        </button>

        <div className="modal-title">✏️ تعديل الملف الشخصي</div>
        <div className="modal-subtitle">حدّث معلوماتك الشخصية</div>

        {/* Avatar */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
          <div className="avatar-upload" onClick={() => fileRef.current?.click()} title="تغيير الصورة">
            <div className="profile-avatar" style={{ width: 100, height: 100, fontSize: 36 }}>
              {form.avatar
                ? <img src={form.avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
                : form.username?.[0]?.toUpperCase()}
            </div>
            <div className="avatar-upload-overlay">
              <Icon name="edit" size={20} />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => handleAvatarFile(e.target.files?.[0])} />
        </div>
        <div style={{ textAlign: "center", fontSize: 12, color: "var(--text-faint)", marginBottom: 24 }}>انقر على الصورة لتغييرها</div>

        <div className="form-group">
          <label className="form-label">الاسم الكامل</label>
          <input className="form-input" placeholder="اسمك الكامل" value={form.displayName} onChange={f("displayName")} />
        </div>
        <div className="form-group">
          <label className="form-label">اسم المستخدم *</label>
          <input className="form-input" placeholder="@username" value={form.username} onChange={f("username")} />
        </div>
        <div className="form-group">
          <label className="form-label">نبذة شخصية</label>
          <textarea className="form-input form-textarea" placeholder="اكتب نبذة قصيرة عنك..." value={form.bio} onChange={f("bio")} style={{ minHeight: 80 }} />
        </div>

        {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}

        <button className="btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={handleSave} disabled={loading}>
          {loading ? "⏳ جاري الحفظ..." : "💾 حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
