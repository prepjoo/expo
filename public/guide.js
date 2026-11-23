// ---------- 1분 사용설명서 (모션 스틸컷 6장, 약 48초) ----------
const GUIDE_SEC = 8;
const Guide = { i: 0, t: null, paused: false, listen: false, tok: 0 };
/* 음성 안내: 녹음 파일 하나(voice/guide.mp3, 55.2초)를 장면 시작점(초)으로 나눠 맞춰요. */
const GUIDE_AUDIO = 'voice/guide.mp3';
const GUIDE_CUES = [0, 9.4, 15.9, 29.44, 39.29, 47.34, 55.23];
const GUIDE_NARR = [
  '말로 증명하라. 첫 30초에 내 생각을 증명하는 연습입니다. 짜기, 말하기, 재기, 세 단계로 해요.',
  '먼저 누가 연습하는지 고르세요. 질문과 예시가 내 상황에 맞게 바뀝니다.',
  '1단계, 짜기, 삼지작법 고르기. 먼저 말할 땐 여는 삼지작법, 주장할 땐 받치는 삼지작법, 질문엔 답하는 삼지작법. 골라서 네 칸에 메모합니다.',
  '2단계, 말하기. 메모를 보며 소리 내어 말해요. 마이크로 말해도, 글자로 써도 됩니다.',
  '3단계, 재기. 다섯 저울로 내 말의 짜임을 점검하고, 가장 약한 저울 하나만 고쳐서 다시 말해요.',
  '경험을 카드로 모아 두면, 어떤 질문에도 꺼내 쓸 수 있어요. 이제 첫 질문에 답해 보세요.'
];
const sceneLen = i => Guide.listen ? Math.max(2, GUIDE_CUES[i + 1] - GUIDE_CUES[i]) : (i === 2 || i === 3 ? 10 : GUIDE_SEC);
function guideAudio() {
  if (Guide.audio) return Guide.audio;
  const a = new Audio(GUIDE_AUDIO); a.preload = 'auto'; Guide.audio = a;
  a.addEventListener('timeupdate', () => {
    if (!Guide.listen || Guide.paused || !document.querySelector('.guide')) return;
    const n = GUIDE_CUES.length - 1;
    if (Guide.i < n - 1 && a.currentTime >= GUIDE_CUES[Guide.i + 1]) { Guide.i++; Guide.seek = false; guideRender(); }
  });
  a.addEventListener('error', () => { if (Guide.listen) { Guide.listen = false; toast('음성을 불러오지 못해 소리 없이 보여 드려요', 'surprised'); guideRender(); } });
  return a;
}
function guideDing() {
  try {
    const C = window.AudioContext || window.webkitAudioContext; if (!C) return;
    const ac = Guide.ac || (Guide.ac = new C()), t = ac.currentTime;
    [1320, 1980].forEach(f => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = f; o.type = 'sine';
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.75); });
  } catch (e) {}
}
function voiceStop() { try { if (Guide.audio) Guide.audio.pause(); } catch (e) {} }

function guideScenes() {
  const id = whoId(), p = persona(), chosen = levelChosen();
  const q = (todaysQuestions().find(x => x.form === p.reco) || currentQ());
  const F = FORMS[q.form], ex = (FORM_EX[id] && FORM_EX[id][q.form]) || F.ex;
  const cut = s => { if (s.length <= 30) return s; const t = s.slice(0, 30); const k = t.lastIndexOf(' '); return (k > 12 ? t.slice(0, k) : t) + '…'; };
  const demo = [3, 3, 2, 3, 2];
  const FT = Guide.listen ? { d: [3.6, 5.3, 7.0], pk: 8.7, cl: 9.0, op: 9.2 } : { d: [.6, 1.3, 2.0], pk: 2.9, cl: 4.0, op: 4.2 };
  const weak = 2;
  return [
    { k: 'intro', c: '#1D6A47', html: `
      <img class="g-char g-jump" src="${CH('jump')}" alt="">
      <p class="g-kicker">BALANCE 5 사용설명서</p>
      <h2 class="g-big d3">삼지작법으로<br>생각 증명하기</h2>
      <p class="g-cap">1,400년 전 삼장법사의 불교논리.<br>첫 30초에 내 생각을 증명하는 연습이에요.</p>
      <ol class="g-flow"><li style="--d:.9s"><b>1</b>짜기</li><li style="--d:1.3s"><b>2</b>말하기</li><li style="--d:1.7s"><b>3</b>재기</li></ol>
      <p class="g-cap sm" style="--d:2.3s">한 질문으로 세 단계를 이어서 해요.</p>` },
    { k: 'who', c: '#8E1B1B', html: `
      <p class="g-kicker">먼저</p>
      <h2 class="g-h">누가 연습하나요?</h2>
      <div class="g-chips">${Object.keys(LEVELS).map((k, n) => `<span class="g-chip ${chosen && k === levelId() ? 'final' : ''}" style="--d:${.4 + n * .25}s;--h:${2.0 + n * .6}s">${LEVELS[k].label}</span>`).join('')}</div>
      <p class="g-cap" style="--d:2.4s">고르면 질문, 예시, 듣는 사람이 내 상황에 맞게 바뀌어요.</p>
      <img class="g-char sm" src="${CH('point_right')}" alt="">` },
    { k: 'forms', c: '#A83E57', html: `
      <p class="g-kicker">1단계 · 삼지작법 고르기</p>
      <h2 class="g-h">짜기</h2>
      <div class="g-q" style="--d:.3s"><small>${esc(q.who)}의 질문</small>${esc(q.q)}</div>
      <div class="g-fcards" style="--pk:${FT.pk}s;--cl:${FT.cl}s;--op:${FT.op}s">${['CRIB', 'PREP', 'AHWA'].map((f, n) => `<div class="g-fcard ${f === q.form ? 'pick' : ''}" data-form="${f}" style="--d:${FT.d[n]}s">
        ${fmono(f)}
        <div class="g-fbody"><b>${FORMS[f].label}<small>${FORMS[f].code} · ${FORMS[f].pron}</small>${f === q.form ? '<em>이 질문엔 이것</em>' : ''}</b>
          <span class="g-fwhen">${FORMS[f].when}</span>
          <span class="g-fslots">${FORMS[f].slots.map(x => `<i>${x.title}</i>`).join('')}</span>
          ${f === q.form ? `<ol class="g-fopen">${F.slots.map((x, n) => `<li><b>${x.title}</b>${esc(cut(ex[n] || ''))}</li>`).join('')}</ol>` : ''}</div></div>`).join('')}</div>
      <p class="g-cap sm" style="--d:${FT.d[2] + 1}s">질문에 맞는 삼지작법을 고르고, 네 칸에 짧게 메모해요.</p>` },
    { k: 'speak', c: '#22689A', html: `
      <p class="g-kicker">2단계 · 삼지작법 익히기</p>
      <h2 class="g-h">말하기</h2>
      <div class="g-mic" style="--d:.4s"><span class="g-ring"></span><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg></div>
      <div class="g-timer" style="--d:.8s"><i></i><span>30~60초</span></div>
      <p class="g-type" style="--d:1.2s">${esc(ex[0] || '')}</p>
      <p class="g-cap" style="--d:4.6s">메모를 보며 소리 내어 말해요. 목표 시간은 삼지작법마다 30~60초예요. 마이크로 말하거나 글자로 써도 돼요.</p>` },
    { k: 'scales', c: '#1D6A47', html: `
      <p class="g-kicker">3단계 · 삼지작법 점검하기</p>
      <h2 class="g-h">재기</h2>
      <ul class="g-bars">${SCALES.map((s, n) => `<li class="${n === weak ? 'weak' : ''}" style="--d:${.4 + n * .35}s;--v:${demo[n] / 3}"><b>${s.name}</b><i><em></em></i><span>${demo[n]}</span></li>`).join('')}</ul>
      <p class="g-total" style="--d:2.6s"><b>84</b>/100 <small>예시 점검 점수</small></p>
      <p class="g-cap" style="--d:3.2s">다섯 저울로 짜임을 점검하고, <b>가장 약한 저울 하나</b>만 고쳐서 다시 말해요.</p>` },
    { k: 'cards', c: '#1D6A47', html: `
      <p class="g-kicker">그리고</p>
      <h2 class="g-h">쌓기</h2>
      <div class="g-stack"><span style="--d:.4s"></span><span style="--d:.7s"></span><span style="--d:1s"><b>경험 카드</b><small>상황 · 문제 · 판단 · 행동 · 결과 · 배움</small></span></div>
      <p class="g-cap" style="--d:1.6s">내 경험을 카드로 모아 두면 어떤 질문에도 꺼내 쓸 수 있어요. 연습 기록은 '기록'에 쌓여요.</p>
      <div class="g-end" style="--d:2.4s"><button class="btn cta" data-act="guideStart">${esc(p.cta)}</button><button class="btn ghost" data-act="guideReplay">처음부터 다시 보기</button></div>
      <img class="g-char sm" src="${CH('thumbs')}" alt="">` }
  ];
}

function guideRender() {
  const sc = guideScenes(), n = sc.length, s = sc[Guide.i];
  const box = document.querySelector('.guide'); if (!box) return;
  box.style.setProperty('--gc', s.c);
  box.querySelector('.g-bars-top').innerHTML = sc.map((_, k) => `<span class="${k < Guide.i ? 'done' : k === Guide.i ? 'cur' : ''}"><i style="animation-duration:${sceneLen(k)}s"></i></span>`).join('');
  box.querySelector('.g-stage').innerHTML = `<div class="g-scene" data-k="${s.k}">${s.html}</div>`;
  box.querySelector('.g-count').textContent = `${Guide.i + 1} / ${n}`;
  box.classList.toggle('paused', Guide.paused);
  box.classList.toggle('listen', Guide.listen);
  clearTimeout(Guide.t); clearTimeout(Guide.dingT);
  if (s.k === 'forms' && Guide.listen && !Guide.paused) Guide.dingT = setTimeout(() => { if (!Guide.paused && Guide.listen) guideDing(); }, 8750);
  if (Guide.listen) {
    const a = guideAudio();
    if (Guide.seek !== false) { try { a.currentTime = GUIDE_CUES[Guide.i]; } catch (e) {} }
    Guide.seek = true;
    if (Guide.paused) a.pause(); else a.play().catch(() => { Guide.paused = true; box.classList.add('paused'); });
    return;
  }
  voiceStop();
  if (!Guide.paused && Guide.i < n - 1) { Guide.t0 = Date.now(); Guide.left = (s.k === 'forms' || s.k === 'speak' ? 10 : GUIDE_SEC) * 1000; Guide.t = setTimeout(() => guideGo(1), Guide.left); }
}
function guideGo(d) {
  const n = guideScenes().length;
  Guide.i = Math.max(0, Math.min(n - 1, Guide.i + d)); guideRender();
}
function openGuide(listen) {
  Guide.i = 0; Guide.paused = false; Guide.listen = listen === true;
  if (Guide.listen && !Guide.ac) { try { const C = window.AudioContext || window.webkitAudioContext; if (C) Guide.ac = new C(); } catch (e) {} }
  const L = $('#layer');
  L.innerHTML = `<div class="guide" role="dialog" aria-modal="true" aria-label="1분 사용설명서">
    <div class="g-top"><div class="g-bars-top"></div>
      <div class="g-ctl"><span class="g-count"></span>
        <button class="g-btn snd" data-act="guideSound" aria-label="소리 켜기/끄기"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="ic-on" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/><path class="ic-off" d="M16 9l5 6M21 9l-5 6"/></svg></button>
        <button class="g-btn" data-act="guidePause" aria-label="멈추기/이어보기"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path class="ic-pause" d="M7 5h3v14H7zM14 5h3v14h-3z"/><path class="ic-play" d="M8 5l11 7-11 7z"/></svg></button>
        <button class="g-btn" data-act="guideClose" aria-label="닫기"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>
    <div class="g-stage"></div>
    <button class="g-tap prev" data-act="guidePrev" aria-label="이전 장면"></button><button class="g-tap next" data-act="guideNext" aria-label="다음 장면"></button>
  </div>`;
  document.body.style.overflow = 'hidden';
  guideRender();
}
function closeGuide() { clearTimeout(Guide.t); voiceStop(); Guide.audio = null; closeSheet(); }

Object.assign(ACT, {
  openGuide: () => openGuide(false),
  openGuideListen: () => openGuide(true),
  guideSound: () => { Guide.listen = !Guide.listen; guideRender(); },
  guideClose: closeGuide,
  guideNext: () => guideGo(1),
  guidePrev: () => guideGo(-1),
  guidePause: () => {
    Guide.paused = !Guide.paused;
    const box = document.querySelector('.guide'); if (box) box.classList.toggle('paused', Guide.paused);
    if (Guide.listen) { const a = guideAudio(); Guide.paused ? a.pause() : a.play().catch(() => {}); return; }
    const n = guideScenes().length;
    if (Guide.paused) { clearTimeout(Guide.t); Guide.left = Math.max(300, (Guide.left || GUIDE_SEC * 1000) - (Date.now() - (Guide.t0 || Date.now()))); }
    else if (Guide.i < n - 1) { Guide.t0 = Date.now(); Guide.t = setTimeout(() => guideGo(1), Guide.left || GUIDE_SEC * 1000); }
  },
  guideReplay: () => { Guide.i = 0; Guide.paused = false; guideRender(); },
  guideStart: () => { closeGuide(); ACT.startQ(); }
});
document.addEventListener('keydown', e => {
  if (!document.querySelector('.guide')) return;
  if (e.key === 'Escape') closeGuide();
  else if (e.key === 'ArrowRight') guideGo(1);
  else if (e.key === 'ArrowLeft') guideGo(-1);
});
