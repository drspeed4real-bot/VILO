import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Engine badges config ───────────────────────────────────────────────────
const ENGINE_TYPES = [
  { id: 'unity',   label: 'Unity',   color: '#22d3ee', icon: '🎮', exts: ['.zip','.unitypackage','.apk','.exe','.x86_64'] },
  { id: 'ue4',     label: 'UE4/UE5', color: '#f97316', icon: '⚡', exts: ['.zip','.pak','.exe','.uproject'] },
  { id: 'godot',   label: 'Godot',   color: '#a78bfa', icon: '🔮', exts: ['.zip','.pck','.exe','.x86_64','.html'] },
  { id: 'web',     label: 'Web/HTML5',color: '#34d399', icon: '🌐', exts: ['.zip','.html'] },
  { id: 'other',   label: 'أخرى',    color: '#f472b6', icon: '📦', exts: ['*'] },
];

const ALL_ACCEPTED = '.zip,.html,.unitypackage,.pak,.pck,.exe,.apk,.x86_64,.uproject,.rar,.7z,.tar,.gz';
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Inline CSS ──────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Cairo:wght@400;600;700;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:      #07090f;
    --surface: #0e1219;
    --card:    #131925;
    --border:  rgba(99,179,237,0.12);
    --accent:  #63b3ed;
    --accent2: #f6ad55;
    --red:     #fc8181;
    --green:   #68d391;
    --text:    #e2e8f0;
    --muted:   #718096;
    --radius:  12px;
    --glow:    0 0 20px rgba(99,179,237,0.2);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Cairo', sans-serif;
    direction: rtl;
    min-height: 100vh;
  }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg); }
  ::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }

  /* ── Header ── */
  .gs-header {
    position: sticky; top: 0; z-index: 100;
    background: rgba(7,9,15,0.85);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 0 2rem;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .gs-logo {
    font-family: 'Rajdhani', sans-serif;
    font-size: 1.6rem; font-weight: 700;
    letter-spacing: 2px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .gs-logo span { color: var(--accent2); }
  .gs-header-actions { display: flex; gap: .75rem; align-items: center; }

  /* ── Buttons ── */
  .btn {
    display: inline-flex; align-items: center; gap: .5rem;
    padding: .55rem 1.25rem;
    border-radius: 8px; border: none; cursor: pointer;
    font-family: 'Cairo', sans-serif; font-size: .9rem; font-weight: 600;
    transition: all .2s;
  }
  .btn:disabled { opacity: .4; cursor: not-allowed; }
  .btn-primary   { background: var(--accent); color: #0a0e18; }
  .btn-primary:hover:not(:disabled) { background: #90cdf4; box-shadow: var(--glow); }
  .btn-ghost     { background: transparent; color: var(--accent); border: 1px solid var(--border); }
  .btn-ghost:hover:not(:disabled) { border-color: var(--accent); background: rgba(99,179,237,.07); }
  .btn-danger    { background: var(--red); color: #1a0000; }
  .btn-danger:hover:not(:disabled) { background: #feb2b2; }
  .btn-sm        { padding: .35rem .9rem; font-size: .8rem; }
  .btn-icon      { padding: .55rem; border-radius: 8px; }

  /* ── Layout ── */
  .gs-main { max-width: 1280px; margin: 0 auto; padding: 2rem; }

  /* ── Auth Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,.7); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .modal {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    width: 100%; max-width: 420px;
    position: relative;
    box-shadow: 0 8px 40px rgba(0,0,0,.6);
    animation: fadeUp .25s ease;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
  .modal-close {
    position: absolute; top: 1rem; left: 1rem;
    background: none; border: none; color: var(--muted);
    font-size: 1.4rem; cursor: pointer; line-height: 1;
  }
  .modal-close:hover { color: var(--text); }
  .modal h2 { font-size: 1.4rem; font-weight: 700; margin-bottom: 1.5rem; }
  .modal-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; }
  .modal-tab {
    flex: 1; padding: .55rem; border-radius: 8px; border: none; cursor: pointer;
    background: var(--surface); color: var(--muted);
    font-family: 'Cairo', sans-serif; font-weight: 600; font-size: .9rem;
    transition: all .2s;
  }
  .modal-tab.active { background: var(--accent); color: #0a0e18; }

  /* ── Form Fields ── */
  .field { margin-bottom: 1.1rem; }
  .field label { display: block; font-size: .85rem; color: var(--muted); margin-bottom: .45rem; font-weight: 600; }
  .field input, .field textarea, .field select {
    width: 100%; padding: .65rem 1rem;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text);
    font-family: 'Cairo', sans-serif; font-size: .9rem;
    transition: border-color .2s;
    outline: none;
  }
  .field input:focus, .field textarea:focus, .field select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(99,179,237,.1);
  }
  .field textarea { resize: vertical; min-height: 80px; }

  /* ── Error / Success ── */
  .alert {
    padding: .75rem 1rem; border-radius: 8px; font-size: .88rem;
    margin-bottom: 1rem; border: 1px solid;
  }
  .alert-error   { background: rgba(252,129,129,.08); border-color: var(--red); color: var(--red); }
  .alert-success { background: rgba(104,211,145,.08); border-color: var(--green); color: var(--green); }

  /* ── Upload Panel ── */
  .upload-panel {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 16px; margin-bottom: 2rem; overflow: hidden;
    animation: fadeUp .3s ease;
  }
  .upload-panel-header {
    padding: 1.25rem 1.75rem;
    border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .upload-panel-header h2 { font-size: 1.15rem; font-weight: 700; }
  .upload-panel-body { padding: 1.75rem; }

  /* ── Engine selector ── */
  .engine-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap: .7rem;
    margin-bottom: 1.5rem;
  }
  .engine-card {
    padding: .75rem; border-radius: 10px;
    border: 1.5px solid var(--border);
    cursor: pointer; text-align: center;
    transition: all .2s;
    background: var(--surface);
  }
  .engine-card:hover { border-color: var(--accent); }
  .engine-card.active { border-color: var(--accent); background: rgba(99,179,237,.07); box-shadow: var(--glow); }
  .engine-card .engine-icon { font-size: 1.6rem; margin-bottom: .3rem; }
  .engine-card .engine-label { font-size: .8rem; font-weight: 700; color: var(--muted); }
  .engine-card.active .engine-label { color: var(--accent); }

  /* ── Upload type tabs ── */
  .upload-tabs { display: flex; gap: .5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
  .upload-tab {
    padding: .5rem 1.1rem; border-radius: 20px;
    border: 1px solid var(--border); background: var(--surface);
    color: var(--muted); cursor: pointer; font-size: .85rem; font-weight: 700;
    font-family: 'Cairo', sans-serif;
    transition: all .2s;
  }
  .upload-tab:hover { border-color: var(--accent); color: var(--text); }
  .upload-tab.active { background: var(--accent); color: #0a0e18; border-color: var(--accent); }

  /* ── Drop Zone ── */
  .drop-zone {
    border: 2px dashed var(--border);
    border-radius: 12px; padding: 2.5rem 1.5rem;
    text-align: center; cursor: pointer;
    transition: all .25s; position: relative;
    background: var(--surface);
  }
  .drop-zone:hover, .drop-zone.drag-over {
    border-color: var(--accent);
    background: rgba(99,179,237,.04);
    box-shadow: var(--glow);
  }
  .drop-zone input[type=file] { display: none; }
  .drop-zone-icon { font-size: 3rem; margin-bottom: .75rem; opacity: .7; }
  .drop-zone h3 { font-size: 1rem; font-weight: 700; margin-bottom: .4rem; }
  .drop-zone p  { font-size: .82rem; color: var(--muted); line-height: 1.6; }
  .drop-zone .file-info {
    margin-top: 1rem; padding: .75rem 1rem;
    background: rgba(99,179,237,.06); border: 1px solid var(--border);
    border-radius: 8px; display: flex; align-items: center; gap: .75rem;
    text-align: right;
  }
  .file-info-icon { font-size: 1.5rem; flex-shrink: 0; }
  .file-info-name { font-weight: 700; font-size: .9rem; word-break: break-all; }
  .file-info-size { font-size: .78rem; color: var(--muted); }

  /* ── Progress ── */
  .progress-wrap { margin-top: 1.25rem; }
  .progress-header { display: flex; justify-content: space-between; font-size: .82rem; color: var(--muted); margin-bottom: .45rem; }
  .progress-bar-bg { height: 8px; background: var(--surface); border-radius: 99px; overflow: hidden; border: 1px solid var(--border); }
  .progress-bar-fill {
    height: 100%; border-radius: 99px;
    background: linear-gradient(90deg, var(--accent), var(--accent2));
    transition: width .3s ease;
    box-shadow: 0 0 10px rgba(99,179,237,.5);
  }
  .progress-stages { display: flex; gap: .5rem; margin-top: .75rem; flex-wrap: wrap; }
  .stage-badge {
    font-size: .75rem; padding: .25rem .65rem; border-radius: 20px;
    background: var(--surface); border: 1px solid var(--border); color: var(--muted);
    transition: all .3s;
  }
  .stage-badge.done  { border-color: var(--green); color: var(--green); background: rgba(104,211,145,.07); }
  .stage-badge.active { border-color: var(--accent); color: var(--accent); background: rgba(99,179,237,.07); animation: pulse .8s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

  /* ── Games grid ── */
  .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
  .section-title { font-size: 1.25rem; font-weight: 700; }
  .games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
  }
  .game-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 14px; overflow: hidden;
    transition: all .25s;
    display: flex; flex-direction: column;
  }
  .game-card:hover { border-color: var(--accent); box-shadow: var(--glow); transform: translateY(-3px); }
  .game-card-thumb {
    aspect-ratio: 16/9; background: var(--surface);
    display: flex; align-items: center; justify-content: center;
    font-size: 3rem; position: relative; overflow: hidden;
  }
  .game-card-thumb::after {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, transparent 50%, var(--card));
    pointer-events: none;
  }
  .game-card-body { padding: 1rem 1.1rem; flex: 1; display: flex; flex-direction: column; gap: .5rem; }
  .game-card-title { font-size: 1rem; font-weight: 700; }
  .game-card-desc  { font-size: .82rem; color: var(--muted); flex: 1; line-height: 1.55; }
  .game-card-footer { padding: .75rem 1.1rem; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .engine-badge {
    font-size: .72rem; font-weight: 700; padding: .25rem .75rem;
    border-radius: 20px; border: 1px solid; letter-spacing: .5px;
  }

  /* ── Loading ── */
  .spinner {
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%; animation: spin .8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── User badge ── */
  .user-badge {
    display: flex; align-items: center; gap: .6rem;
    padding: .35rem .9rem; border-radius: 20px;
    border: 1px solid var(--border); background: var(--surface);
    font-size: .82rem; font-weight: 600;
  }
  .user-avatar {
    width: 26px; height: 26px; border-radius: 50%;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    display: flex; align-items: center; justify-content: center;
    font-size: .7rem; font-weight: 700; color: #0a0e18;
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center; padding: 5rem 1rem; color: var(--muted);
  }
  .empty-state-icon { font-size: 4rem; margin-bottom: 1rem; opacity: .4; }
  .empty-state h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: .5rem; color: var(--text); opacity: .6; }

  /* ── Section divider ── */
  .divider {
    height: 1px; background: var(--border); margin: 1.5rem 0;
  }

  @media (max-width: 600px) {
    .gs-main { padding: 1rem; }
    .games-grid { grid-template-columns: 1fr; }
    .engine-grid { grid-template-columns: repeat(3, 1fr); }
  }
`;

// ─── Component ───────────────────────────────────────────────────────────────
export default function App() {
  // ── Auth state
  const [user, setUser]           = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth]   = useState(false);
  const [authTab, setAuthTab]     = useState('login'); // login | register
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass]   = useState('');
  const [authName, setAuthName]   = useState('');
  const [authError, setAuthError] = useState('');
  const [authMsg, setAuthMsg]     = useState('');
  const [authBusy, setAuthBusy]   = useState(false);

  // ── Games state
  const [games, setGames]         = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // ── Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadTab, setUploadTab]   = useState('file'); // file | zip | html | url
  const [engine, setEngine]         = useState('web');
  const [gameTitle, setGameTitle]   = useState('');
  const [gameDesc, setGameDesc]     = useState('');
  const [gameFile, setGameFile]     = useState(null);
  const [gameUrl, setGameUrl]       = useState('');
  const [htmlCode, setHtmlCode]     = useState('');
  const [dragOver, setDragOver]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage]       = useState(''); // idle|reading|uploading|saving|done
  const [uploadError, setUploadError]       = useState('');
  const [uploadBusy, setUploadBusy]         = useState(false);
  const fileRef = useRef(null);

  // ── Inject CSS
  useEffect(() => {
    const el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, []);

  // ── Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch games (stable — no stale closure issues)
  const fetchGames = useCallback(async () => {
    setGamesLoading(true);
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGames(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setGamesLoading(false);
    }
  }, []);

  useEffect(() => { fetchGames(); }, [fetchGames]);

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthError(''); setAuthMsg(''); setAuthBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPass });
    setAuthBusy(false);
    if (error) { setAuthError(error.message); return; }
    setShowAuth(false);
    resetAuthForm();
  };

  const handleRegister = async () => {
    setAuthError(''); setAuthMsg(''); setAuthBusy(true);
    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPass,
      options: { data: { full_name: authName } }
    });
    setAuthBusy(false);
    if (error) { setAuthError(error.message); return; }
    setAuthMsg('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // Reset upload panel on logout
    resetUpload();
    setShowUpload(false);
  };

  const resetAuthForm = () => {
    setAuthEmail(''); setAuthPass(''); setAuthName('');
    setAuthError(''); setAuthMsg('');
  };

  // ─── Upload helpers ────────────────────────────────────────────────────────
  const resetUpload = () => {
    setGameTitle(''); setGameDesc(''); setGameFile(null);
    setGameUrl(''); setHtmlCode(''); setEngine('web');
    setUploadProgress(0); setUploadStage('idle');
    setUploadError(''); setUploadBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };

  const acceptFile = (f) => {
    setUploadError('');
    if (f.size > MAX_FILE_SIZE) {
      setUploadError(`حجم الملف ${formatBytes(f.size)} يتجاوز الحد الأقصى 5 GB`);
      return;
    }
    setGameFile(f);
  };

  // ─── Upload flow ───────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setUploadError('');
    if (!gameTitle.trim()) { setUploadError('أدخل اسم اللعبة'); return; }

    setUploadBusy(true);
    try {
      if (uploadTab === 'url') {
        if (!gameUrl.trim()) throw new Error('أدخل رابط اللعبة');
        await saveGame({ title: gameTitle, description: gameDesc, game_url: gameUrl, upload_type: 'url', engine });
      }
      else if (uploadTab === 'html') {
        if (!htmlCode.trim()) throw new Error('أدخل كود HTML');
        setUploadStage('saving');
        await saveGame({ title: gameTitle, description: gameDesc, game_url: htmlCode, upload_type: 'html', engine });
      }
      else {
        // file or zip upload
        if (!gameFile) throw new Error('اختر ملفاً للرفع');

        const isZip = gameFile.name.toLowerCase().endsWith('.zip');

        setUploadStage('reading');
        setUploadProgress(5);

        const gameFolder = `game_${Date.now()}_${Math.random().toString(36).substr(2,7)}`;
        let publicUrl = '';

        if (isZip && uploadTab === 'zip') {
          // Extract and upload each file
          const zip = new JSZip();
          const content = await zip.loadAsync(gameFile);

          const files = [];
          content.forEach((rel, f) => { if (!f.dir) files.push({ rel, f }); });

          setUploadStage('uploading');
          let done = 0;
          for (const { rel, f: zf } of files) {
            const blob = await zf.async('blob');
            const { error } = await supabase.storage
              .from('games')
              .upload(`${gameFolder}/${rel}`, blob, { upsert: false, cacheControl: '3600' });
            if (error) throw error;
            done++;
            setUploadProgress(5 + Math.round((done / files.length) * 85));
          }
          const { data: { publicUrl: pu } } = supabase.storage.from('games').getPublicUrl(`${gameFolder}/index.html`);
          publicUrl = pu;
        } else {
          // Single binary file upload
          setUploadStage('uploading');
          const ext = gameFile.name.split('.').pop();
          const path = `${gameFolder}/game.${ext}`;

          // Chunk-simulated progress
          const timer = setInterval(() => {
            setUploadProgress(p => Math.min(p + 3, 88));
          }, 300);

          const { error } = await supabase.storage
            .from('games')
            .upload(path, gameFile, { upsert: false, cacheControl: '3600' });
          clearInterval(timer);
          if (error) throw error;
          setUploadProgress(90);
          const { data: { publicUrl: pu } } = supabase.storage.from('games').getPublicUrl(path);
          publicUrl = pu;
        }

        setUploadStage('saving');
        setUploadProgress(95);
        await saveGame({ title: gameTitle, description: gameDesc, game_url: publicUrl, upload_type: isZip ? 'zip' : 'file', engine, storage_path: gameFolder });
      }

      setUploadProgress(100);
      setUploadStage('done');
      await fetchGames();
      setTimeout(() => {
        setShowUpload(false);
        resetUpload();
      }, 1500);
    } catch (e) {
      setUploadError(e.message || 'حدث خطأ أثناء الرفع');
      setUploadStage('idle');
    } finally {
      setUploadBusy(false);
    }
  };

  const saveGame = async (data) => {
    const { error } = await supabase.from('games').insert([{
      ...data,
      user_id: user?.id,
      user_email: user?.email,
    }]);
    if (error) throw error;
  };

  // ─── Engine icon for card ──────────────────────────────────────────────────
  const engineInfo = (id) => ENGINE_TYPES.find(e => e.id === id) || ENGINE_TYPES[4];

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header ── */}
      <header className="gs-header">
        <div className="gs-logo">GAME<span>SPOT</span></div>
        <div className="gs-header-actions">
          {!authLoading && (
            user ? (
              <>
                <div className="user-badge">
                  <div className="user-avatar">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
                  <span>{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleLogout}>تسجيل خروج</button>
              </>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => { setShowAuth(true); resetAuthForm(); }}>
                تسجيل الدخول
              </button>
            )
          )}
          {user && (
            <button className="btn btn-primary btn-sm" onClick={() => { setShowUpload(v => !v); resetUpload(); }}>
              {showUpload ? '✕ إغلاق' : '⬆ رفع لعبة'}
            </button>
          )}
        </div>
      </header>

      {/* ── Auth Modal ── */}
      {showAuth && (
        <div className="modal-overlay" onClick={() => setShowAuth(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuth(false)}>×</button>
            <h2>{authTab === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h2>
            <div className="modal-tabs">
              <button className={`modal-tab${authTab === 'login' ? ' active' : ''}`} onClick={() => { setAuthTab('login'); setAuthError(''); setAuthMsg(''); }}>دخول</button>
              <button className={`modal-tab${authTab === 'register' ? ' active' : ''}`} onClick={() => { setAuthTab('register'); setAuthError(''); setAuthMsg(''); }}>حساب جديد</button>
            </div>

            {authError && <div className="alert alert-error">{authError}</div>}
            {authMsg   && <div className="alert alert-success">{authMsg}</div>}

            {authTab === 'register' && (
              <div className="field">
                <label>الاسم</label>
                <input placeholder="اسمك الكامل" value={authName} onChange={e => setAuthName(e.target.value)} />
              </div>
            )}
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input type="email" placeholder="example@email.com" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>كلمة المرور</label>
              <input type="password" placeholder="••••••••" value={authPass} onChange={e => setAuthPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (authTab === 'login' ? handleLogin() : handleRegister())} />
            </div>
            <button className="btn btn-primary" style={{width:'100%'}} disabled={authBusy}
              onClick={authTab === 'login' ? handleLogin : handleRegister}>
              {authBusy ? 'جارٍ التحميل...' : authTab === 'login' ? 'دخول' : 'إنشاء الحساب'}
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <main className="gs-main">

        {/* ── Upload Panel ── */}
        {showUpload && user && (
          <div className="upload-panel">
            <div className="upload-panel-header">
              <h2>🎮 رفع لعبة جديدة</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowUpload(false); resetUpload(); }}>إلغاء</button>
            </div>
            <div className="upload-panel-body">

              {/* Engine selector */}
              <div className="field">
                <label>المحرك / النوع</label>
              </div>
              <div className="engine-grid">
                {ENGINE_TYPES.map(eng => (
                  <div key={eng.id} className={`engine-card${engine === eng.id ? ' active' : ''}`}
                    style={engine === eng.id ? { borderColor: eng.color } : {}}
                    onClick={() => setEngine(eng.id)}>
                    <div className="engine-icon">{eng.icon}</div>
                    <div className="engine-label" style={engine === eng.id ? { color: eng.color } : {}}>{eng.label}</div>
                  </div>
                ))}
              </div>

              {/* Upload type tabs */}
              <div className="upload-tabs">
                {[
                  { id: 'file',  label: '📦 ملف مباشر' },
                  { id: 'zip',   label: '🗜 ملف ZIP' },
                  { id: 'html',  label: '🌐 كود HTML' },
                  { id: 'url',   label: '🔗 رابط خارجي' },
                ].map(t => (
                  <button key={t.id} className={`upload-tab${uploadTab === t.id ? ' active' : ''}`}
                    onClick={() => { setUploadTab(t.id); setUploadError(''); setGameFile(null); }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Common fields */}
              <div className="field">
                <label>اسم اللعبة *</label>
                <input placeholder="أدخل اسم اللعبة" value={gameTitle} onChange={e => setGameTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>الوصف</label>
                <textarea placeholder="وصف مختصر للعبة..." value={gameDesc} onChange={e => setGameDesc(e.target.value)} />
              </div>

              <div className="divider" />

              {/* ── File / ZIP drop zone ── */}
              {(uploadTab === 'file' || uploadTab === 'zip') && (
                <div>
                  <div className={`drop-zone${dragOver ? ' drag-over' : ''}`}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file"
                      accept={uploadTab === 'zip' ? '.zip' : ALL_ACCEPTED}
                      onChange={e => e.target.files[0] && acceptFile(e.target.files[0])} />
                    {gameFile ? (
                      <div className="file-info">
                        <div className="file-info-icon">📄</div>
                        <div>
                          <div className="file-info-name">{gameFile.name}</div>
                          <div className="file-info-size">{formatBytes(gameFile.size)}</div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="drop-zone-icon">{uploadTab === 'zip' ? '🗜' : '📦'}</div>
                        <h3>اسحب الملف هنا أو اضغط للاختيار</h3>
                        <p>
                          {uploadTab === 'zip'
                            ? 'ملف ZIP — يجب أن يحتوي على index.html (HTML5 / WebGL)'
                            : 'يدعم: ZIP · EXE · APK · PCK · PAK · unitypackage · UProject · HTML وأكثر'
                          }
                        </p>
                        <p style={{marginTop:'.5rem', color:'var(--accent)', fontWeight:700}}>
                          الحجم الأقصى: 5 GB
                        </p>
                      </>
                    )}
                  </div>

                  {/* supported engines hint */}
                  <p style={{fontSize:'.78rem', color:'var(--muted)', marginTop:'.75rem'}}>
                    ✅ يدعم ألعاب Unity · UE4/UE5 · Godot · Defold · Construct · GameMaker وأي محرك آخر
                  </p>
                </div>
              )}

              {/* ── HTML code ── */}
              {uploadTab === 'html' && (
                <div className="field">
                  <label>كود HTML *</label>
                  <textarea style={{fontFamily:'monospace', minHeight:160}} placeholder={'<!DOCTYPE html>\n<html>...</html>'}
                    value={htmlCode} onChange={e => setHtmlCode(e.target.value)} />
                </div>
              )}

              {/* ── External URL ── */}
              {uploadTab === 'url' && (
                <div className="field">
                  <label>رابط اللعبة *</label>
                  <input type="url" placeholder="https://itch.io/game/..." value={gameUrl} onChange={e => setGameUrl(e.target.value)} />
                </div>
              )}

              {/* Error */}
              {uploadError && <div className="alert alert-error">{uploadError}</div>}

              {/* Progress */}
              {uploadBusy && (
                <div className="progress-wrap">
                  <div className="progress-header">
                    <span>
                      {uploadStage === 'reading'   ? '📖 قراءة الملف...' :
                       uploadStage === 'uploading' ? '⬆ جارٍ الرفع...' :
                       uploadStage === 'saving'    ? '💾 حفظ البيانات...' :
                       uploadStage === 'done'      ? '✅ تم بنجاح!' : 'تحضير...'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{width:`${uploadProgress}%`}} />
                  </div>
                  <div className="progress-stages">
                    {['reading','uploading','saving','done'].map(s => (
                      <span key={s} className={`stage-badge${uploadProgress >= ({reading:5,uploading:15,saving:90,done:100}[s]) ? (uploadStage === s ? ' active' : ' done') : ''}`}>
                        {{ reading:'قراءة', uploading:'رفع', saving:'حفظ', done:'تم' }[s]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              {!uploadBusy && (
                <button className="btn btn-primary" style={{width:'100%', marginTop:'1rem'}}
                  onClick={handleUpload} disabled={uploadBusy}>
                  ⬆ رفع اللعبة
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Games section ── */}
        <div className="section-header">
          <h2 className="section-title">🕹 الألعاب المتاحة</h2>
          <button className="btn btn-ghost btn-sm" onClick={fetchGames} disabled={gamesLoading}>
            {gamesLoading ? '...' : '↻ تحديث'}
          </button>
        </div>

        {gamesLoading ? (
          <div style={{display:'flex', justifyContent:'center', padding:'4rem'}}>
            <div className="spinner" />
          </div>
        ) : games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎮</div>
            <h3>لا توجد ألعاب حالياً</h3>
            <p>كن أول من يرفع لعبة!</p>
          </div>
        ) : (
          <div className="games-grid">
            {games.map(game => {
              const eng = engineInfo(game.engine || 'other');
              return (
                <div key={game.id} className="game-card">
                  <div className="game-card-thumb" style={{background:`linear-gradient(135deg, ${eng.color}18, #0e1219)`}}>
                    <span style={{fontSize:'3.5rem'}}>{eng.icon}</span>
                  </div>
                  <div className="game-card-body">
                    <div className="game-card-title">{game.title}</div>
                    {game.description && <div className="game-card-desc">{game.description}</div>}
                  </div>
                  <div className="game-card-footer">
                    <span className="engine-badge" style={{borderColor:`${eng.color}55`, color:eng.color, background:`${eng.color}10`}}>
                      {eng.label}
                    </span>
                    <button className="btn btn-primary btn-sm"
                      onClick={() => window.open(game.game_url, '_blank')}>
                      تشغيل ▶
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
