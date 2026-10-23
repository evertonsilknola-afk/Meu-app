import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, BookMarked, Timer, PenTool, Notebook, RefreshCcw, Flame, Plus, Trash2,
  Edit3, Check, X, CheckCircle, Play, Pause, RotateCcw, Target, Repeat, TrendingUp, Skull
} from 'lucide-react';

const uid = () => Math.random().toString(36).slice(2, 9);
const dk = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
const dayNum = (k) => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
const fmt = (min) => `${Math.floor((min || 0) / 60)}h${String((min || 0) % 60).padStart(2, '0')}`;

function useLS(key, init) {
  const [v, setV] = useState(() => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; } catch { return init; } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }, [key, v]);
  return [v, setV];
}

// Estilos globais atualizados para Dark Mode + Vermelho + Vidro/Desfoque
const inp = 'w-full p-3 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-100 outline-none focus:border-red-600 placeholder:text-zinc-600 transition-colors';
const btn = 'px-4 py-3 rounded-xl font-bold text-white bg-red-700 hover:bg-red-600 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-900/20';
const btn2 = 'px-4 py-3 rounded-xl font-bold text-zinc-300 bg-zinc-800/80 border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all flex items-center justify-center gap-2';
// Efeito de desfoque (backdrop-blur) adicionado aos Cards
const Card = ({ children, className = '' }) => <div className={`bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-xl p-4 ${className}`}>{children}</div>;
const H = ({ icon: I, children }) => <h2 className="text-lg font-extrabold text-red-500 flex items-center gap-2 mb-3"><I className="w-5 h-5 text-red-600" />{children}</h2>;

export default function App() {
  const [tab, setTab] = useState('home');
  const [edital, setEdital] = useLS('est_edital', []);
  const [progress, setProgress] = useLS('est_progress', {});
  const [exercises, setExercises] = useLS('est_ex', []);
  const [erros, setErros] = useLS('est_erros', []);
  const [examDate, setExamDate] = useLS('est_exam', '');
  const [cfg, setCfg] = useLS('est_cfg', { hours: 4, weights: {}, cycle: [], idx: 0, study: 50, brk: 10 });
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => { const i = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(i); }, []);

  const subj = (id) => edital.find((s) => s.id === id);
  const addExercise = (e) => setExercises((p) => [{ id: uid(), date: new Date().toISOString(), ...e }, ...p]);
  
  // Função para deletar um exercício específico e atualizar tudo
  const deleteExercise = (id) => {
    if(window.confirm('Deseja realmente apagar este registro? Os dados da Home serão recalculados.')) {
      setExercises(exercises.filter(ex => ex.id !== id));
    }
  };

  const stats = useMemo(() => {
    let total = 0, correct = 0, time = 0;
    const per = {};
    edital.forEach((s) => (per[s.id] = { total: 0, correct: 0, time: 0 }));
    exercises.forEach((e) => {
      total += e.total; correct += e.total - e.errors; time += e.time || 0;
      if (per[e.subjectId]) { per[e.subjectId].total += e.total; per[e.subjectId].correct += e.total - e.errors; per[e.subjectId].time += e.time || 0; }
    });
    const days = new Set(exercises.map((e) => dk(e.date)));
    let streak = 0, c = dayNum(dk());
    if (!days.has(dk())) c -= 1;
    const nums = new Set([...days].map(dayNum));
    while (nums.has(c)) { streak++; c--; }
    const topics = edital.reduce((a, s) => a + s.topics.length, 0);
    const done = edital.reduce((a, s) => a + s.topics.filter((t) => progress[t.id]).length, 0);
    const reviews = [];
    edital.forEach((s) => s.topics.forEach((t) => {
      const p = progress[t.id]; if (!p) return;
      const age = dayNum(dk()) - dayNum(dk(p.date));
      [[1, '24h'], [7, '7 dias'], [30, '30 dias']].forEach(([n, label]) => {
        if (age >= n && !p.rev?.[n]) reviews.push({ sid: s.id, tid: t.id, name: t.name, n, label, subject: s.title, late: age > n });
      });
    }));
    return { total, correct, time, per, streak, topics, done, reviews };
  }, [exercises, edital, progress]);

  const markReview = (tid, n) => setProgress((p) => ({ ...p, [tid]: { ...p[tid], rev: { ...(p[tid].rev || {}), [n]: true } } }));
  const toggleTopic = (tid) => setProgress((p) => { const q = { ...p }; if (q[tid]) delete q[tid]; else q[tid] = { date: new Date().toISOString(), rev: {} }; return q; });

  // ---------- HOME ----------
  const Countdown = () => {
    if (!examDate) return <label className="block"><span className="text-xs font-bold text-red-500 uppercase">Data da prova</span><input type="date" className={inp} onChange={(e) => setExamDate(e.target.value)} /></label>;
    const diff = Math.max(0, new Date(examDate + 'T08:00:00') - now);
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    return (
      <div className="bg-zinc-900 border border-zinc-800 text-white rounded-2xl p-4 shadow-lg shadow-black/50">
        <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold uppercase text-red-500 flex items-center gap-1"><Target className="w-4 h-4" />Dia D</span>
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-zinc-800 text-white text-xs rounded-lg p-1.5 border border-zinc-700 outline-none" /></div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[[d, 'dias'], [h, 'h'], [m, 'min'], [s, 's']].map(([v, l]) => <div key={l} className="bg-zinc-950 border border-zinc-800 rounded-xl py-2"><div className="text-2xl font-extrabold text-zinc-100 tabular-nums">{String(v).padStart(2, '0')}</div><div className="text-[10px] text-zinc-500 uppercase font-bold">{l}</div></div>)}
        </div>
      </div>
    );
  };

  const next = cfg.cycle.length ? cfg.cycle[cfg.idx % cfg.cycle.length] : null;
  const renderHome = () => {
    const acc = stats.total ? Math.round((stats.correct / stats.total) * 100) : 0;
    const pct = stats.topics ? Math.round((stats.done / stats.topics) * 100) : 0;
    return (
      <div className="space-y-4 up">
        <Countdown />
        
        {/* Barra de Aproveitamento inspirada na imagem */}
        <Card className="!p-4">
           <div className="flex justify-between text-xs font-bold text-zinc-400 mb-2">
             <span className="text-red-500 text-lg">{acc}% <span className="text-zinc-500 text-xs">APROVEITAMENTO</span></span>
             <span>{stats.total} Questões</span>
           </div>
           <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
             <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${acc}%` }}></div>
           </div>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Card className="text-center !p-3"><div className="text-2xl font-extrabold text-zinc-100">{fmt(stats.time)}</div><div className="text-[11px] text-red-500 font-bold uppercase">Tempo Estudado</div></Card>
          <Card className="text-center !p-3"><div className="text-2xl font-extrabold text-zinc-100">{pct}%</div><div className="text-[11px] text-red-500 font-bold uppercase">Edital Fechado</div></Card>
        </div>
        
        {next && subj(next.sid) && (
          <Card className="border-l-4 !border-l-red-600 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-5"><Target className="w-24 h-24" /></div>
            <p className="text-xs font-bold text-zinc-500 uppercase relative">Próxima Missão</p>
            <p className="font-bold text-zinc-100 text-lg relative">{subj(next.sid).title}</p>
            <p className="text-sm text-zinc-400 relative mb-3">{next.min} minutos focados</p>
            <div className="flex gap-2 relative"><button className={btn + ' flex-1 !py-2'} onClick={() => setTab('foco')}><Timer className="w-4 h-4" />Executar</button>
              <button className={btn2 + ' !py-2'} onClick={() => setCfg({ ...cfg, idx: cfg.idx + 1 })}>Pular</button></div>
          </Card>
        )}
        <Card>
          <H icon={RefreshCcw}>Revisões Táticas</H>
          {stats.reviews.length === 0 && <p className="text-sm text-zinc-500 italic">Área limpa. Nenhuma revisão pendente.</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {stats.reviews.map((r) => (
              <div key={r.tid + r.n} className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-red-500 uppercase truncate">{r.subject}</p><p className="text-sm font-medium text-zinc-200 truncate">{r.name}</p></div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-md text-white uppercase ${r.late ? 'bg-orange-700' : 'bg-red-700'}`}>{r.label}</span>
                <button onClick={() => markReview(r.tid, r.n)} className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 text-red-500 hover:bg-zinc-700"><Check className="w-4 h-4" /></button>
              </div>))}
          </div>
        </Card>
        <Evolution />
      </div>
    );
  };

  const [evSub, setEvSub] = useState('');
  const Evolution = () => {
    const sid = evSub || edital[0]?.id;
    const pts = exercises.filter((e) => e.subjectId === sid && e.total > 0).slice().reverse().map((e) => ({ d: e.date, v: ((e.total - e.errors) / e.total) * 100 }));
    const W = 300, Hh = 110;
    const xy = pts.map((p, i) => [pts.length > 1 ? (i / (pts.length - 1)) * (W - 20) + 10 : W / 2, Hh - 10 - (p.v / 100) * (Hh - 20)]);
    const half = Math.ceil(pts.length / 2);
    const avg = (a) => (a.length ? a.reduce((x, y) => x + y.v, 0) / a.length : 0);
    const delta = pts.length >= 2 ? avg(pts.slice(half)) - avg(pts.slice(0, half)) : 0;
    return (
      <Card>
        <H icon={TrendingUp}>Desempenho em Combate</H>
        {edital.length === 0 ? <p className="text-sm text-zinc-500 italic">Cadastre seu edital primeiro.</p> : <>
          <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
            {edital.map((s) => <button key={s.id} onClick={() => setEvSub(s.id)} className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full border ${s.id === sid ? 'bg-red-700 border-red-600 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}>{s.title}</button>)}
          </div>
          {pts.length < 2 ? <p className="text-sm text-zinc-600 italic py-6 text-center">Colete mais dados (mín. 2 exercícios).</p> : <>
            <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full mt-2">
              {[0, 50, 100].map((g) => <line key={g} x1="10" x2={W - 10} y1={Hh - 10 - (g / 100) * (Hh - 20)} y2={Hh - 10 - (g / 100) * (Hh - 20)} stroke="#27272a" strokeDasharray="4" />)}
              <polyline fill="none" stroke="#dc2626" strokeWidth="3" strokeLinejoin="round" points={xy.map((p) => p.join(',')).join(' ')} />
              {xy.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="4" fill="#ef4444" stroke="#09090b" strokeWidth="2" />)}
            </svg>
            <p className={`text-sm font-bold mt-2 text-center ${delta >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{delta >= 0 ? '▲ Subindo' : '▼ Caindo'} ({delta >= 0 ? '+' : ''}{Math.round(delta)} pts)</p>
          </>}
        </>}
      </Card>
    );
  };

  // ---------- EDITAL ----------
  const [editMode, setEditMode] = useState(false);
  const [open, setOpen] = useState({});
  const [newSub, setNewSub] = useState('');
  const [newTop, setNewTop] = useState({});
  const upd = (sid, fn) => setEdital((p) => p.map((s) => (s.id === sid ? fn(s) : s)));
  const renderEdital = () => (
    <div className="space-y-3 up">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-400 font-medium"><span className="text-red-500 font-bold">{stats.done}</span> de {stats.topics} neutralizados</p>
        <button className={editMode ? btn + ' !py-2' : btn2 + ' !py-2'} onClick={() => setEditMode(!editMode)}>{editMode ? <><Check className="w-4 h-4" />Pronto</> : <><Edit3 className="w-4 h-4" />Editar</>}</button>
      </div>
      {edital.length === 0 && <Card><p className="text-zinc-500 text-sm text-center py-4">Seu edital está vazio. Toque em <b>Editar</b> e adicione suas matérias e tópicos.</p></Card>}
      {edital.map((s) => (
        <Card key={s.id} className="!p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3 bg-zinc-900">
            {editMode ? <input className={inp + ' !py-2 font-bold'} value={s.title} onChange={(e) => upd(s.id, (x) => ({ ...x, title: e.target.value }))} />
              : <button className="flex-1 text-left font-bold text-zinc-200 py-1" onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>{s.title} <span className="text-xs text-zinc-500 font-medium ml-2">({s.topics.filter((t) => progress[t.id]).length}/{s.topics.length})</span></button>}
            {editMode && <button className="p-2 bg-zinc-950 rounded-lg text-red-500 hover:text-red-400" onClick={() => confirm('Apagar matéria e seus tópicos?') && setEdital(edital.filter((x) => x.id !== s.id))}><Trash2 className="w-5 h-5" /></button>}
          </div>
          {(open[s.id] || editMode) && (
            <div className="border-t border-zinc-800 p-3 space-y-2 bg-zinc-950/50">
              {s.topics.map((t) => editMode ? (
                <div key={t.id} className="flex gap-2"><input className={inp + ' !py-2 text-sm'} value={t.name} onChange={(e) => upd(s.id, (x) => ({ ...x, topics: x.topics.map((y) => (y.id === t.id ? { ...y, name: e.target.value } : y)) }))} />
                  <button className="p-2 text-red-500 bg-zinc-900 rounded-lg" onClick={() => upd(s.id, (x) => ({ ...x, topics: x.topics.filter((y) => y.id !== t.id) }))}><X className="w-5 h-5" /></button></div>
              ) : (
                <label key={t.id} className="flex items-start gap-3 py-2 px-1 rounded-lg hover:bg-zinc-900 cursor-pointer">
                  <input type="checkbox" checked={!!progress[t.id]} onChange={() => toggleTopic(t.id)} className="mt-1 w-5 h-5 accent-red-600 rounded" />
                  <span className={`text-sm ${progress[t.id] ? 'text-zinc-600 line-through' : 'text-zinc-300'}`}>{t.name}</span>
                </label>))}
              {editMode && <div className="flex gap-2 pt-2"><input className={inp + ' !py-2 text-sm'} placeholder="Novo tópico..." value={newTop[s.id] || ''} onChange={(e) => setNewTop({ ...newTop, [s.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && newTop[s.id]?.trim()) { upd(s.id, (x) => ({ ...x, topics: [...x.topics, { id: uid(), name: newTop[s.id].trim() }] })); setNewTop({ ...newTop, [s.id]: '' }); } }} />
                <button className={btn + ' !px-3'} onClick={() => { if (!newTop[s.id]?.trim()) return; upd(s.id, (x) => ({ ...x, topics: [...x.topics, { id: uid(), name: newTop[s.id].trim() }] })); setNewTop({ ...newTop, [s.id]: '' }); }}><Plus className="w-5 h-5" /></button></div>}
            </div>)}
        </Card>))}
      {editMode && <div className="flex gap-2 pt-4"><input className={inp} placeholder="Nova matéria (ex: Português)" value={newSub} onChange={(e) => setNewSub(e.target.value)} />
        <button className={btn} onClick={() => { if (!newSub.trim()) return; const id = uid(); setEdital([...edital, { id, title: newSub.trim(), topics: [] }]); setNewSub(''); }}><Plus className="w-5 h-5" />Matéria</button></div>}
    </div>
  );

  // ---------- FOCO (Pomodoro + Ciclo) ----------
  const [pomo, setPomo] = useState({ mode: 'Estudo', running: false, endAt: 0, left: cfg.study * 60 });
  const [pSub, setPSub] = useState(''); const [pTop, setPTop] = useState('');
  useEffect(() => { if (next && !pSub && subj(next.sid)) setPSub(next.sid); }, [next?.sid]);
  
  const left = pomo.running ? Math.max(0, Math.ceil((pomo.endAt - now) / 1000)) : pomo.left;
  
  useEffect(() => {
    if (pomo.running && left === 0) {
      navigator.vibrate?.([300, 150, 300]);
      if (pomo.mode === 'Estudo') {
        addExercise({ category: 'Teoria', subjectId: pSub, topicId: pTop, topic: subj(pSub)?.topics.find((t) => t.id === pTop)?.name || 'Foco', total: 0, errors: 0, time: cfg.study });
        if (next && next.sid === pSub) setCfg((c) => ({ ...c, idx: c.idx + 1 }));
        setPomo({ mode: 'Pausa', running: false, endAt: 0, left: cfg.brk * 60 });
      } else setPomo({ mode: 'Estudo', running: false, endAt: 0, left: cfg.study * 60 });
    }
  }, [left, pomo.running]);

  const startPause = () => {
    if (pomo.mode === 'Estudo' && !pSub) return alert('Escolha a matéria antes de iniciar.');
    if (pomo.running) setPomo({ ...pomo, running: false, left });
    else setPomo({ ...pomo, running: true, endAt: Date.now() + pomo.left * 1000 });
  };
  const finishEarly = () => {
    const spent = Math.floor((cfg.study * 60 - left) / 60);
    if (pomo.mode === 'Estudo' && spent >= 1 && pSub) addExercise({ category: 'Teoria', subjectId: pSub, topicId: pTop, topic: subj(pSub)?.topics.find((t) => t.id === pTop)?.name || 'Foco', total: 0, errors: 0, time: spent });
    setPomo({ mode: 'Estudo', running: false, endAt: 0, left: cfg.study * 60 });
  };
  
  const generateCycle = () => {
    const ws = edital.map((s) => [s.id, Number(cfg.weights[s.id] ?? 1)]);
    const sum = ws.reduce((a, [, w]) => a + w, 0); if (!sum) return;
    const blocks = Math.max(1, Math.round((cfg.hours * 60 * 7) / cfg.study));
    const rem = Object.fromEntries(ws.map(([id, w]) => [id, w ? Math.max(1, Math.round((w / sum) * blocks)) : 0]));
    const cycle = []; let go = true;
    while (go) { go = false; ws.forEach(([id]) => { if (rem[id] > 0) { cycle.push({ sid: id, min: cfg.study }); rem[id]--; go = true; } }); }
    setCfg({ ...cfg, cycle, idx: 0 });
  };

  const renderFoco = () => {
    const mm = String(Math.floor(left / 60)).padStart(2, '0'), ss = String(left % 60).padStart(2, '0');
    return (
      <div className="space-y-4 up">
        <Card className="text-center relative overflow-hidden border-t-4 !border-t-red-600">
          <div className="absolute inset-0 bg-red-900/10 pointer-events-none"></div>
          <span className={`relative text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${pomo.mode === 'Estudo' ? 'bg-red-950 text-red-500 border border-red-900' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'}`}>{pomo.mode}</span>
          <div className="relative text-7xl font-extrabold tabular-nums font-mono my-6 text-zinc-100 drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]">{mm}:{ss}</div>
          
          {pomo.mode === 'Estudo' && !pomo.running && <div className="space-y-3 mb-5 text-left relative">
            <select className={inp} value={pSub} onChange={(e) => { setPSub(e.target.value); setPTop(''); }}><option value="">Selecione a Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            <select className={inp} value={pTop} onChange={(e) => setPTop(e.target.value)} disabled={!pSub}><option value="">Tópico (opcional)</option>{subj(pSub)?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
          
          <div className="flex gap-2 relative">
            <button className={btn + ' flex-1 py-4 text-lg'} onClick={startPause}>{pomo.running ? <><Pause className="w-6 h-6" />Pausar</> : <><Play className="w-6 h-6" />Iniciar Missão</>}</button>
            <button className={btn2 + ' py-4'} onClick={finishEarly} title="Finalizar e registrar parcial"><RotateCcw className="w-6 h-6" /></button>
          </div>
          
          <p className="text-xs text-zinc-500 mt-4 relative">Ao finalizar, o progresso é registrado e atualiza a Home automaticamente.</p>
          
          {!pomo.running && pomo.mode === 'Estudo' && <div className="flex gap-2 mt-4 text-sm items-center justify-center text-zinc-400 relative">
            <input type="number" min="1" className="w-16 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center focus:border-red-600 outline-none" value={cfg.study} onChange={(e) => { const v = Math.max(1, +e.target.value || 1); setCfg({ ...cfg, study: v }); setPomo({ ...pomo, left: v * 60 }); }} /> min foco
            <span className="px-1 text-zinc-700">|</span>
            <input type="number" min="1" className="w-16 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-center focus:border-red-600 outline-none" value={cfg.brk} onChange={(e) => setCfg({ ...cfg, brk: Math.max(1, +e.target.value || 1) })} /> min pausa</div>}
        </Card>

        {/* FUNÇÃO RESETAR NO FOCO: Mostra o último estudo feito para reverter rapidamente */}
        {exercises.length > 0 && (
          <Card className="border-l-4 !border-l-red-600 bg-red-950/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Último Registro (Desfazer)</p>
                <p className="text-sm font-bold text-zinc-200">{subj(exercises[0].subjectId)?.title || 'Geral'} - {exercises[0].topic}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{fmt(exercises[0].time)} | {exercises[0].total - exercises[0].errors} acertos</p>
              </div>
              <button 
                className="p-3 bg-zinc-900 border border-red-900/50 rounded-xl text-red-500 hover:bg-red-900/40 transition-colors"
                onClick={() => deleteExercise(exercises[0].id)}
                title="Apagar este registro e recalcular Home"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </Card>
        )}

        <Card>
          <H icon={Repeat}>Ciclo de Batalha</H>
          {edital.length === 0 ? <p className="text-sm text-zinc-500 italic">Cadastre as matérias no Edital.</p> : <>
            <label className="text-xs font-bold text-red-500 uppercase">Horas por dia</label>
            <input type="number" min="1" max="16" className={inp + ' mb-4 mt-1'} value={cfg.hours} onChange={(e) => setCfg({ ...cfg, hours: +e.target.value || 1 })} />
            <p className="text-xs font-bold text-red-500 uppercase mb-2">Peso da Matéria (1–5)</p>
            {edital.map((s) => <div key={s.id} className="flex items-center gap-3 mb-2 bg-zinc-950 p-2 rounded-lg border border-zinc-800"><span className="flex-1 text-sm text-zinc-300 truncate">{s.title}</span>
              <input type="number" min="0" max="5" className="w-16 p-2 rounded-md bg-zinc-900 border border-zinc-700 text-center text-zinc-100" value={cfg.weights[s.id] ?? 1} onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, [s.id]: e.target.value } })} /></div>)}
            <button className={btn + ' w-full mt-4'} onClick={generateCycle}><Repeat className="w-4 h-4" />Gerar Ciclo</button>
            {cfg.cycle.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{cfg.cycle.map((b, i) => <span key={i} className={`text-xs font-bold px-3 py-1.5 rounded-md border ${i === cfg.idx % cfg.cycle.length ? 'bg-red-700 border-red-600 text-white shadow-lg shadow-red-900/30' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{i + 1}. {subj(b.sid)?.title}</span>)}</div>}
          </>}
        </Card>
      </div>
    );
  };

  // ---------- REGISTRAR ----------
  const [f, setF] = useState({ cat: 'Teoria', sid: '', tid: '', time: '', total: '', errs: '' });
  const submitEx = (e) => {
    e.preventDefault();
    const total = +f.total || 0, errors = Math.min(+f.errs || 0, total);
    addExercise({ category: f.cat, subjectId: f.sid, topicId: f.tid, topic: subj(f.sid)?.topics.find((t) => t.id === f.tid)?.name || 'Geral', total, errors, time: +f.time || 0 });
    setF({ ...f, time: '', total: '', errs: '' });
  };
  const renderReg = () => (
    <div className="space-y-4 up">
      <Card>
        <form onSubmit={submitEx} className="space-y-3">
          <select className={inp} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}><option>Teoria</option><option>Revisão</option><option>Questões</option><option>Simulado</option></select>
          <select className={inp} required value={f.sid} onChange={(e) => setF({ ...f, sid: e.target.value, tid: '' })}><option value="">Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <select className={inp} value={f.tid} onChange={(e) => setF({ ...f, tid: e.target.value })} disabled={!f.sid}><option value="">Tópico (opcional)</option>{subj(f.sid)?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" min="0" placeholder="Minutos" className={inp} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
            <input type="number" min="0" placeholder="Questões" className={inp} value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
            <input type="number" min="0" placeholder="Erros" className={inp} value={f.errs} onChange={(e) => setF({ ...f, errs: e.target.value })} /></div>
          <button className={btn + ' w-full'}><CheckCircle className="w-5 h-5" />Registrar</button>
        </form>
      </Card>
      <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest pl-2">Histórico de Batalhas</h3>
      {exercises.slice(0, 10).map((e) => (
        <Card key={e.id} className="flex items-center gap-3 !p-3 bg-zinc-950/50">
          <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-red-600 uppercase truncate">{e.category} · {subj(e.subjectId)?.title || '—'}</p><p className="text-sm font-bold text-zinc-200 truncate">{e.topic}</p>
            <p className="text-xs text-zinc-500 mt-1">{fmt(e.time)} · <span className="text-emerald-500">{e.total - e.errors} acertos</span> · <span className="text-red-400">{e.errors} erros</span></p></div>
          <button className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-red-500 hover:bg-zinc-800" onClick={() => deleteExercise(e.id)}><Trash2 className="w-5 h-5" /></button>
        </Card>))}
      {exercises.length === 0 && <p className="text-center text-zinc-600 text-sm">Nenhum registro ainda.</p>}
    </div>
  );

  // ---------- ERROS + QUIZ ----------
  const [ef, setEf] = useState({ sid: '', q: '', answer: '', reason: '' });
  const [quiz, setQuiz] = useState(null);
  const startQuiz = () => {
    const list = erros.slice().sort((a, b) => (b.ko - b.ok) - (a.ko - a.ok)).slice(0, 10);
    if (!list.length) return alert('Cadastre erros primeiro para iniciar o Quiz.');
    setQuiz({ list, i: 0, show: false });
  };
  const answerQuiz = (hit) => {
    const cur = quiz.list[quiz.i];
    setErros((p) => p.map((x) => (x.id === cur.id ? { ...x, ok: x.ok + (hit ? 1 : 0), ko: x.ko + (hit ? 0 : 1) } : x)));
    setQuiz(quiz.i + 1 >= quiz.list.length ? null : { ...quiz, i: quiz.i + 1, show: false });
  };
  
  const renderErros = () => (
    <div className="space-y-4 up">
      {quiz ? (
        <Card className="space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
             <p className="text-xs font-bold text-red-500 uppercase tracking-widest">Missão Quiz {quiz.i + 1}/{quiz.list.length}</p>
             <p className="text-xs font-bold text-zinc-400">{subj(quiz.list[quiz.i].sid)?.title}</p>
          </div>
          <p className="font-semibold text-zinc-100 whitespace-pre-wrap text-lg leading-relaxed">{quiz.list[quiz.i].q}</p>
          {quiz.show ? <>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm space-y-2">
              {quiz.list[quiz.i].answer && <p className="text-emerald-400"><b className="text-zinc-500">Correta:</b> {quiz.list[quiz.i].answer}</p>}
              <p className="text-red-400"><b className="text-zinc-500">Motivo:</b> {quiz.list[quiz.i].reason || '—'}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button className={btn + ' flex-1 !bg-emerald-700 !shadow-none hover:!bg-emerald-600'} onClick={() => answerQuiz(true)}>Acertei</button>
              <button className={btn + ' flex-1 !bg-red-800 !shadow-none hover:!bg-red-700'} onClick={() => answerQuiz(false)}>Errei dnv</button>
            </div>
          </> : <button className={btn + ' w-full py-4 mt-2'} onClick={() => setQuiz({ ...quiz, show: true })}>Ver Gabarito</button>}
          <div className="text-center pt-2"><button className="text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-300" onClick={() => setQuiz(null)}>Abortar Quiz</button></div>
        </Card>
      ) : <>
        <div className="flex justify-between items-center mb-1">
          <H icon={Notebook}>Erros e QAPs</H>
          <div className="flex gap-2 mb-3">
             {/* FUNÇÃO RESETAR TODOS OS ERROS */}
             <button className={btn2 + ' !py-2 !px-3 text-red-500 border-red-900/30'} onClick={() => confirm('Tem certeza que deseja APAGAR TODOS os erros registrados? Esta ação não tem volta.') && setErros([])} title="Limpar Todo o Caderno">
               <Trash2 className="w-4 h-4" />
             </button>
             <button className={btn + ' !py-2'} onClick={startQuiz}>Gerar Quiz</button>
          </div>
        </div>
        <Card>
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (!ef.q.trim()) return; setErros([{ id: uid(), date: new Date().toISOString(), ok: 0, ko: 0, ...ef }, ...erros]); setEf({ ...ef, q: '', answer: '', reason: '' }); }}>
            <select className={inp} value={ef.sid} onChange={(e) => setEf({ ...ef, sid: e.target.value })}><option value="">Selecione a Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            <textarea className={inp + ' min-h-[100px] resize-none'} placeholder="Descreva a questão que você errou..." value={ef.q} onChange={(e) => setEf({ ...ef, q: e.target.value })} />
            <input className={inp} placeholder="Gabarito correto" value={ef.answer} onChange={(e) => setEf({ ...ef, answer: e.target.value })} />
            <input className={inp} placeholder="Qual foi a pegadinha / motivo do erro?" value={ef.reason} onChange={(e) => setEf({ ...ef, reason: e.target.value })} />
            <button className={btn + ' w-full mt-2'}><Plus className="w-5 h-5" />Registrar Falha</button>
          </form>
        </Card>
        
        {erros.map((x) => (
          <Card key={x.id} className="border-l-4 !border-l-red-700 relative bg-zinc-950/50">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">{subj(x.sid)?.title || 'Geral'} · <span className="text-emerald-500">{x.ok}✓</span> <span className="text-red-500">{x.ko}✗</span></p>
            <p className="font-medium text-zinc-200 text-sm whitespace-pre-wrap pr-10 leading-relaxed">{x.q}</p>
            {x.reason && <p className="text-xs text-red-400 mt-2 bg-red-950/30 p-2 rounded border border-red-900/30">Motivo: {x.reason}</p>}
            
            {/* FUNÇÃO APAGAR ERRO INDIVIDUAL */}
            <button className="absolute top-3 right-3 p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 hover:bg-zinc-800 transition-colors" onClick={() => { if(confirm('Apagar este erro?')) setErros(erros.filter((y) => y.id !== x.id)); }}>
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>))}
      </>}
    </div>
  );

  const tabs = [['home', Home, 'Home'], ['edital', BookMarked, 'Edital'], ['foco', Timer, 'Foco'], ['reg', PenTool, 'Registro'], ['erros', Notebook, 'Erros']];
  const titles = { home: 'QG de Estudos', edital: 'Plano de Ação', foco: 'Modo Tático', reg: 'Relatório', erros: 'Análise de Falhas' };
  
  return (
    <div className="h-full flex flex-col bg-[#09090b] text-zinc-100 font-sans" style={{ height: '100dvh' }}>
      
      {/* HEADER: Inspirado na imagem (com Ícone Caveira, Letras Vermelhas e Desfoque) */}
      <header className="safe-t bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 text-white shrink-0 z-10 relative shadow-md">
        <div className="h-16 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Skull className="w-6 h-6 text-zinc-400" />
             <h1 className="text-lg font-bold tracking-widest text-zinc-200">{titles[tab].toUpperCase()}</h1>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 font-bold text-sm shadow-inner">
             <Flame className={`w-5 h-5 ${stats.streak ? 'text-red-500 fill-red-500' : 'text-zinc-600'}`} />
             <span className="text-zinc-300">{stats.streak}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 bg-zinc-950" style={{ WebkitOverflowScrolling: 'touch', backgroundImage: 'radial-gradient(circle at top, #18181b 0%, #09090b 100%)' }}>
        <div className="max-w-2xl mx-auto pb-4">
          {tab === 'home' && renderHome()}
          {tab === 'edital' && renderEdital()}
          {tab === 'foco' && renderFoco()}
          {tab === 'reg' && renderReg()}
          {tab === 'erros' && renderErros()}
        </div>
      </main>

      {/* NAV: Desfoque (glassmorphism) e Ícones em Vermelho quando ativos */}
      <nav className="safe-b bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 shrink-0 z-10 relative">
        <div className="flex">
          {tabs.map(([id, I, l]) => (
            <button key={id} onClick={() => setTab(id)} className={`flex-1 py-3 flex flex-col items-center gap-1 text-[10px] uppercase font-bold tracking-wider transition-colors ${tab === id ? 'text-red-500' : 'text-zinc-500 hover:text-zinc-400'}`}>
               <I className={`w-6 h-6 ${tab === id ? 'drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]' : ''}`} />
               {l}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
