import React, { useState, useEffect, useMemo } from 'react';
import {
  Home, BookMarked, Timer, PenTool, Notebook, RefreshCcw, Flame, Plus, Trash2,
  Edit3, Check, X, CheckCircle, Play, Pause, RotateCcw, Target, Repeat, TrendingUp
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

const inp = 'w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none focus:border-teal-500';
const btn = 'px-4 py-3 rounded-xl font-bold text-white bg-teal-600 active:scale-95 transition-transform flex items-center justify-center gap-2';
const btn2 = 'px-4 py-3 rounded-xl font-bold text-slate-700 bg-slate-200 active:scale-95 transition-transform flex items-center justify-center gap-2';
const Card = ({ children, className = '' }) => <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm p-4 ${className}`}>{children}</div>;
const H = ({ icon: I, children }) => <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2 mb-3"><I className="w-5 h-5 text-teal-600" />{children}</h2>;

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
    if (!examDate) return <label className="block"><span className="text-xs font-bold text-slate-500 uppercase">Data da prova</span><input type="date" className={inp} onChange={(e) => setExamDate(e.target.value)} /></label>;
    const diff = Math.max(0, new Date(examDate + 'T08:00:00') - now);
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
    return (
      <div className="bg-slate-800 text-white rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2"><span className="text-xs font-bold uppercase text-teal-300 flex items-center gap-1"><Target className="w-4 h-4" />Contagem regressiva</span>
          <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-slate-700 text-white text-xs rounded-lg p-1" /></div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[[d, 'dias'], [h, 'h'], [m, 'min'], [s, 's']].map(([v, l]) => <div key={l} className="bg-slate-700 rounded-xl py-2"><div className="text-2xl font-extrabold tabular-nums">{String(v).padStart(2, '0')}</div><div className="text-[10px] text-slate-300">{l}</div></div>)}
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
        <div className="grid grid-cols-3 gap-2">
          <Card className="text-center !p-3"><div className="text-xl font-extrabold">{fmt(stats.time)}</div><div className="text-[11px] text-slate-500 font-bold uppercase">Estudo</div></Card>
          <Card className="text-center !p-3"><div className="text-xl font-extrabold">{acc}%</div><div className="text-[11px] text-slate-500 font-bold uppercase">Acertos</div></Card>
          <Card className="text-center !p-3"><div className="text-xl font-extrabold">{pct}%</div><div className="text-[11px] text-slate-500 font-bold uppercase">Edital</div></Card>
        </div>
        {next && subj(next.sid) && (
          <Card className="border-l-4 !border-l-teal-500">
            <p className="text-xs font-bold text-slate-500 uppercase">Próximo bloco do ciclo</p>
            <p className="font-bold text-slate-800">{subj(next.sid).title} · {next.min} min</p>
            <div className="flex gap-2 mt-2"><button className={btn + ' flex-1 !py-2'} onClick={() => setTab('foco')}><Timer className="w-4 h-4" />Estudar</button>
              <button className={btn2 + ' !py-2'} onClick={() => setCfg({ ...cfg, idx: cfg.idx + 1 })}>Pular</button></div>
          </Card>
        )}
        <Card>
          <H icon={RefreshCcw}>Revisões de hoje</H>
          {stats.reviews.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma revisão pendente.</p>}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.reviews.map((r) => (
              <div key={r.tid + r.n} className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-100">
                <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-teal-700 uppercase truncate">{r.subject}</p><p className="text-sm font-medium truncate">{r.name}</p></div>
                <span className={`text-xs font-bold px-2 py-1 rounded-md text-white ${r.late ? 'bg-rose-500' : 'bg-teal-600'}`}>{r.label}</span>
                <button onClick={() => markReview(r.tid, r.n)} className="p-2 rounded-lg bg-white border border-teal-200 text-teal-600"><Check className="w-4 h-4" /></button>
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
        <H icon={TrendingUp}>Evolução por matéria</H>
        {edital.length === 0 ? <p className="text-sm text-slate-400 italic">Cadastre seu edital primeiro.</p> : <>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {edital.map((s) => <button key={s.id} onClick={() => setEvSub(s.id)} className={`whitespace-nowrap text-xs font-bold px-3 py-1.5 rounded-full ${s.id === sid ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{s.title}</button>)}
          </div>
          {pts.length < 2 ? <p className="text-sm text-slate-400 italic py-6 text-center">Registre ao menos 2 estudos com questões.</p> : <>
            <svg viewBox={`0 0 ${W} ${Hh}`} className="w-full">
              {[0, 50, 100].map((g) => <line key={g} x1="10" x2={W - 10} y1={Hh - 10 - (g / 100) * (Hh - 20)} y2={Hh - 10 - (g / 100) * (Hh - 20)} stroke="#e2e8f0" />)}
              <polyline fill="none" stroke="#0d9488" strokeWidth="2.5" strokeLinejoin="round" points={xy.map((p) => p.join(',')).join(' ')} />
              {xy.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#0d9488" />)}
            </svg>
            <p className={`text-sm font-bold ${delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{delta >= 0 ? '▲ Melhorando' : '▼ Piorando'} ({delta >= 0 ? '+' : ''}{Math.round(delta)} pontos)</p>
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
        <p className="text-sm text-slate-500 font-medium">{stats.done}/{stats.topics} tópicos concluídos</p>
        <button className={editMode ? btn + ' !py-2' : btn2 + ' !py-2'} onClick={() => setEditMode(!editMode)}>{editMode ? <><Check className="w-4 h-4" />Pronto</> : <><Edit3 className="w-4 h-4" />Editar edital</>}</button>
      </div>
      {edital.length === 0 && <Card><p className="text-slate-500 text-sm text-center py-4">Seu edital está vazio. Toque em <b>Editar edital</b> e adicione suas matérias e tópicos.</p></Card>}
      {edital.map((s) => (
        <Card key={s.id} className="!p-0 overflow-hidden">
          <div className="flex items-center gap-2 p-3">
            {editMode ? <input className={inp + ' !py-2 font-bold'} value={s.title} onChange={(e) => upd(s.id, (x) => ({ ...x, title: e.target.value }))} />
              : <button className="flex-1 text-left font-bold text-slate-800 py-1" onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>{s.title} <span className="text-xs text-slate-400 font-medium">({s.topics.filter((t) => progress[t.id]).length}/{s.topics.length})</span></button>}
            {editMode && <button className="p-2 text-rose-500" onClick={() => confirm('Apagar matéria e seus tópicos?') && setEdital(edital.filter((x) => x.id !== s.id))}><Trash2 className="w-5 h-5" /></button>}
          </div>
          {(open[s.id] || editMode) && (
            <div className="border-t border-slate-100 p-3 space-y-2 bg-slate-50">
              {s.topics.map((t) => editMode ? (
                <div key={t.id} className="flex gap-2"><input className={inp + ' !py-2 text-sm'} value={t.name} onChange={(e) => upd(s.id, (x) => ({ ...x, topics: x.topics.map((y) => (y.id === t.id ? { ...y, name: e.target.value } : y)) }))} />
                  <button className="p-2 text-rose-500" onClick={() => upd(s.id, (x) => ({ ...x, topics: x.topics.filter((y) => y.id !== t.id) }))}><X className="w-5 h-5" /></button></div>
              ) : (
                <label key={t.id} className="flex items-start gap-3 py-1">
                  <input type="checkbox" checked={!!progress[t.id]} onChange={() => toggleTopic(t.id)} className="mt-1 w-5 h-5 accent-teal-600" />
                  <span className={`text-sm ${progress[t.id] ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{t.name}</span>
                </label>))}
              {editMode && <div className="flex gap-2"><input className={inp + ' !py-2 text-sm'} placeholder="Novo tópico..." value={newTop[s.id] || ''} onChange={(e) => setNewTop({ ...newTop, [s.id]: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && newTop[s.id]?.trim()) { upd(s.id, (x) => ({ ...x, topics: [...x.topics, { id: uid(), name: newTop[s.id].trim() }] })); setNewTop({ ...newTop, [s.id]: '' }); } }} />
                <button className={btn + ' !px-3'} onClick={() => { if (!newTop[s.id]?.trim()) return; upd(s.id, (x) => ({ ...x, topics: [...x.topics, { id: uid(), name: newTop[s.id].trim() }] })); setNewTop({ ...newTop, [s.id]: '' }); }}><Plus className="w-5 h-5" /></button></div>}
            </div>)}
        </Card>))}
      {editMode && <div className="flex gap-2"><input className={inp} placeholder="Nova matéria (ex: Português)" value={newSub} onChange={(e) => setNewSub(e.target.value)} />
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
        <Card className="text-center">
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${pomo.mode === 'Estudo' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>{pomo.mode}</span>
          <div className="text-7xl font-extrabold tabular-nums font-mono my-4">{mm}:{ss}</div>
          {pomo.mode === 'Estudo' && !pomo.running && <div className="space-y-2 mb-3 text-left">
            <select className={inp} value={pSub} onChange={(e) => { setPSub(e.target.value); setPTop(''); }}><option value="">Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            <select className={inp} value={pTop} onChange={(e) => setPTop(e.target.value)} disabled={!pSub}><option value="">Tópico (opcional)</option>{subj(pSub)?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
          <div className="flex gap-2"><button className={btn + ' flex-1'} onClick={startPause}>{pomo.running ? <><Pause className="w-5 h-5" />Pausar</> : <><Play className="w-5 h-5" />Iniciar estudo</>}</button>
            <button className={btn2} onClick={finishEarly} title="Finalizar e registrar"><RotateCcw className="w-5 h-5" /></button></div>
          <p className="text-xs text-slate-400 mt-3">Ao terminar, o tempo é registrado automaticamente.</p>
          {!pomo.running && pomo.mode === 'Estudo' && <div className="flex gap-2 mt-3 text-sm items-center justify-center">
            <input type="number" min="1" className="w-16 p-2 rounded-lg border text-center" value={cfg.study} onChange={(e) => { const v = Math.max(1, +e.target.value || 1); setCfg({ ...cfg, study: v }); setPomo({ ...pomo, left: v * 60 }); }} /> min estudo
            <input type="number" min="1" className="w-16 p-2 rounded-lg border text-center" value={cfg.brk} onChange={(e) => setCfg({ ...cfg, brk: Math.max(1, +e.target.value || 1) })} /> min pausa</div>}
        </Card>
        <Card>
          <H icon={Repeat}>Gerador de ciclo de estudos</H>
          {edital.length === 0 ? <p className="text-sm text-slate-400 italic">Cadastre as matérias no Edital.</p> : <>
            <label className="text-xs font-bold text-slate-500 uppercase">Horas por dia</label>
            <input type="number" min="1" max="16" className={inp + ' mb-3'} value={cfg.hours} onChange={(e) => setCfg({ ...cfg, hours: +e.target.value || 1 })} />
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Peso de cada matéria (1–5)</p>
            {edital.map((s) => <div key={s.id} className="flex items-center gap-2 mb-2"><span className="flex-1 text-sm truncate">{s.title}</span>
              <input type="number" min="0" max="5" className="w-16 p-2 rounded-lg border text-center" value={cfg.weights[s.id] ?? 1} onChange={(e) => setCfg({ ...cfg, weights: { ...cfg.weights, [s.id]: e.target.value } })} /></div>)}
            <button className={btn + ' w-full mt-2'} onClick={generateCycle}><Repeat className="w-4 h-4" />Gerar ciclo</button>
            {cfg.cycle.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{cfg.cycle.map((b, i) => <span key={i} className={`text-xs font-bold px-2 py-1 rounded-md ${i === cfg.idx % cfg.cycle.length ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{i + 1}. {subj(b.sid)?.title}</span>)}</div>}
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
          <select className={inp} value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}><option>Teoria</option><option>Revisão</option><option>Questões</option></select>
          <select className={inp} required value={f.sid} onChange={(e) => setF({ ...f, sid: e.target.value, tid: '' })}><option value="">Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <select className={inp} value={f.tid} onChange={(e) => setF({ ...f, tid: e.target.value })} disabled={!f.sid}><option value="">Tópico (opcional)</option>{subj(f.sid)?.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" min="0" placeholder="Minutos" className={inp} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} />
            <input type="number" min="0" placeholder="Questões" className={inp} value={f.total} onChange={(e) => setF({ ...f, total: e.target.value })} />
            <input type="number" min="0" placeholder="Erros" className={inp} value={f.errs} onChange={(e) => setF({ ...f, errs: e.target.value })} /></div>
          <button className={btn + ' w-full'}><CheckCircle className="w-5 h-5" />Registrar</button>
        </form>
      </Card>
      <h3 className="text-sm font-bold text-slate-500 uppercase">Últimos registros</h3>
      {exercises.slice(0, 10).map((e) => (
        <Card key={e.id} className="flex items-center gap-3 !p-3">
          <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-teal-700 uppercase truncate">{e.category} · {subj(e.subjectId)?.title || '—'}</p><p className="text-sm font-bold truncate">{e.topic}</p>
            <p className="text-xs text-slate-500">{fmt(e.time)} · {e.total - e.errors} acertos · {e.errors} erros · {new Date(e.date).toLocaleDateString('pt-BR')}</p></div>
          <button className="p-2 text-slate-400" onClick={() => confirm('Apagar registro?') && setExercises(exercises.filter((x) => x.id !== e.id))}><Trash2 className="w-5 h-5" /></button>
        </Card>))}
      {exercises.length === 0 && <p className="text-center text-slate-400 text-sm">Nenhum registro ainda.</p>}
    </div>
  );

  // ---------- ERROS + QUIZ ----------
  const [ef, setEf] = useState({ sid: '', q: '', answer: '', reason: '' });
  const [quiz, setQuiz] = useState(null);
  const startQuiz = () => {
    const list = erros.slice().sort((a, b) => (b.ko - b.ok) - (a.ko - a.ok)).slice(0, 10);
    if (!list.length) return alert('Cadastre erros primeiro.');
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
        <Card className="space-y-3">
          <p className="text-xs font-bold text-slate-500 uppercase">Quiz {quiz.i + 1}/{quiz.list.length} · {subj(quiz.list[quiz.i].sid)?.title}</p>
          <p className="font-semibold text-slate-800 whitespace-pre-wrap">{quiz.list[quiz.i].q}</p>
          {quiz.show ? <>
            <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">{quiz.list[quiz.i].answer && <p><b>Resposta:</b> {quiz.list[quiz.i].answer}</p>}<p><b>Motivo do erro:</b> {quiz.list[quiz.i].reason || '—'}</p></div>
            <div className="flex gap-2"><button className={btn + ' flex-1 !bg-emerald-600'} onClick={() => answerQuiz(true)}>Acertei</button><button className={btn + ' flex-1 !bg-rose-600'} onClick={() => answerQuiz(false)}>Errei</button></div>
          </> : <button className={btn + ' w-full'} onClick={() => setQuiz({ ...quiz, show: true })}>Ver resposta</button>}
          <button className="text-xs text-slate-400 underline" onClick={() => setQuiz(null)}>Sair do quiz</button>
        </Card>
      ) : <>
        <div className="flex justify-between items-center"><H icon={Notebook}>Caderno de erros</H><button className={btn + ' !py-2 mb-3'} onClick={startQuiz}>Quiz semanal</button></div>
        <Card><form className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (!ef.q.trim()) return; setErros([{ id: uid(), date: new Date().toISOString(), ok: 0, ko: 0, ...ef }, ...erros]); setEf({ ...ef, q: '', answer: '', reason: '' }); }}>
          <select className={inp} value={ef.sid} onChange={(e) => setEf({ ...ef, sid: e.target.value })}><option value="">Matéria...</option>{edital.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
          <textarea className={inp + ' min-h-[80px]'} placeholder="Questão que você errou" value={ef.q} onChange={(e) => setEf({ ...ef, q: e.target.value })} />
          <input className={inp} placeholder="Resposta correta" value={ef.answer} onChange={(e) => setEf({ ...ef, answer: e.target.value })} />
          <input className={inp} placeholder="Motivo do erro" value={ef.reason} onChange={(e) => setEf({ ...ef, reason: e.target.value })} />
          <button className={btn + ' w-full'}><Plus className="w-5 h-5" />Adicionar</button></form></Card>
        {erros.map((x) => (
          <Card key={x.id} className="border-l-4 !border-l-rose-400 relative">
            <p className="text-[11px] font-bold text-rose-700 uppercase">{subj(x.sid)?.title || 'Geral'} · {x.ok}✓ {x.ko}✗</p>
            <p className="font-semibold text-slate-800 text-sm whitespace-pre-wrap pr-8">{x.q}</p>
            {x.reason && <p className="text-xs text-slate-500 mt-1">Motivo: {x.reason}</p>}
            <button className="absolute top-3 right-3 text-slate-300" onClick={() => setErros(erros.filter((y) => y.id !== x.id))}><Trash2 className="w-4 h-4" /></button>
          </Card>))}
      </>}
    </div>
  );

  const tabs = [['home', Home, 'Home'], ['edital', BookMarked, 'Edital'], ['foco', Timer, 'Foco'], ['reg', PenTool, 'Registro'], ['erros', Notebook, 'Erros']];
  const titles = { home: 'Estudei', edital: 'Meu Edital', foco: 'Foco e Ciclo', reg: 'Registro de Estudo', erros: 'Caderno de Erros' };
  return (
    <div className="h-full flex flex-col bg-slate-100 text-slate-800" style={{ height: '100dvh' }}>
      <header className="safe-t bg-teal-600 text-white shrink-0">
        <div className="h-14 px-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold">{titles[tab]}</h1>
          <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1.5 font-bold text-sm"><Flame className={`w-5 h-5 ${stats.streak ? 'text-orange-300 fill-orange-300' : 'text-white/50'}`} />{stats.streak}</div>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-4" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="max-w-2xl mx-auto pb-4">
          {tab === 'home' && renderHome()}{tab === 'edital' && renderEdital()}{tab === 'foco' && renderFoco()}{tab === 'reg' && renderReg()}{tab === 'erros' && renderErros()}
        </div>
      </main>
      <nav className="safe-b bg-white border-t border-slate-200 shrink-0">
        <div className="flex">{tabs.map(([id, I, l]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-[11px] font-bold ${tab === id ? 'text-teal-600' : 'text-slate-400'}`}><I className="w-6 h-6" />{l}</button>))}</div>
      </nav>
    </div>
  );
}
