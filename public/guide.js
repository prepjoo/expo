// ---------- 1분 사용설명서 (모션 스틸컷 6장, 약 48초) ----------
const GUIDE_SEC = 8;
const Guide = { i: 0, t: null, paused: false, listen: false, tok: 0, set: 'start' };
/* 설명서 세 편: start(시작하기, 녹음 파일 하나) · learn(익히기) · level(단계 연습).
   learn·level은 장면마다 녹음 파일 voice/<편>-<번호>.mp3 를 재생하고, 파일이 없으면 기기 음성(TTS)으로 읽어요. */
const GUIDE_SETS = {
  start: { title: '1분 사용설명서', sub: '시작하기' },
  learn: { title: '1분 사용설명서', sub: '② 익히기', sec: [8, 10, 15, 11, 7], narr: [
    '삼지작법 익히기 편입니다. 받치는, 답하는, 여는 삼지작법. 쉬운 것부터 차례로 익혀요.',
    '삼지작법 메뉴에서는 맨 위 탭으로 세 기법을 오가요. 네 칸의 색은 宗은 빨강, 因은 파랑, 喩는 초록. 궁금한 제목을 누르면 설명이 펼쳐져요.',
    '워드댄싱에서는 섞인 문장 조각을 네 칸에 순서대로 놓아요. 조각 하나는 함정이에요. 막히면 힌트를 누르세요. 기법마다 여섯 문제, 아래 번호로 오가며 풀어요. 위쪽 AI 답 뜯어보기에서는 AI의 답을 주장, 이유, 사례로 나눠 빈 칸을 찾아요.',
    '다섯저울은 듣는 사람의 다섯 가지 의심이에요. 저울을 고르고 심판 기준을 읽은 뒤, 저울 연습하기를 눌러 카드를 두 접시에 갈라 보세요.',
    '순서가 손에 익으면, 짜기로 가서 내 답을 말해 보세요.'] },
  level: { title: '1분 사용설명서', sub: '③ 칸 늘리기', sec: [7, 10, 10, 12, 8], narr: [
    '칸 늘리기 편입니다. 네 칸을 한 번에 외우지 말고, 두 칸에서 시작해 한 칸씩 늘려요.',
    '말하기 화면 맨 위에서 두 칸을 고르면 두 칸만 열려요. 받치는 삼지작법이라면 결론과 이유, PR만 말하면 됩니다.',
    '두 칸만 채워도 잴 수 있어요. 결과 화면에서 한 칸 더 버튼을 누르면, 쓴 내용은 그대로 두고 한 칸이 더 열려요.',
    '네 칸을 다 채웠다면 점수를 보세요. 기본 논리 70점에 다섯저울 30점. 가장 약한 저울을 연습하고, 고쳐 말하기로 한 문장만 고쳐 다시 재요.',
    '경험카드를 모아 두면 어떤 질문에도 불러와 쓸 수 있어요. 오늘은 두 칸부터 시작해 보세요.'] }
};
/* 음성 안내: 녹음 파일 하나(voice/guide.mp3, 55.2초)를 장면 시작점(초)으로 나눠 맞춰요. */
const GUIDE_AUDIO = 'voice/guide.mp3';
const GUIDE_CUES = [0, 9.4, 15.9, 29.44, 39.29, 47.34, 55.23];
const GUIDE_NARR = [
  '말로 증명하라. 첫 30초에 내 생각을 증명하는 연습입니다. 짜기, 말하기, 재기, 세 단계로 해요.',
  '먼저 누가 연습하는지 고르세요. 질문과 예시가 내 상황에 맞게 바뀝니다.',
  '1단계, 짜기, 삼지작법 고르기. 먼저 말할 땐 여는 삼지작법, 주장할 땐 받치는 삼지작법, 질문엔 답하는 삼지작법. 골라서 네 칸에 메모합니다.',
  '2단계, 말하기. 메모를 보며 소리 내어 말해요. 마이크로 말해도, 글자로 써도 됩니다.',
  '3단계, 재기. 다섯저울로 내 말의 짜임을 점검하고, 가장 약한 저울 하나만 고쳐서 다시 말해요.',
  '경험을 카드로 모아 두면, 어떤 질문에도 꺼내 쓸 수 있어요. 이제 첫 질문에 답해 보세요.'
];
const TYPE_MS = 70, TYPE_HOLD = 2200;
const sceneLen = i => Guide.set !== 'start' ? Math.max(4, (GUIDE_SETS[Guide.set].narr[i].length * TYPE_MS + (GUIDE_SETS[Guide.set].narr[i].split(/(?<=[.?!])\s+/).length - 1) * 1100 + TYPE_HOLD) / 1000) : Guide.listen ? Math.max(2, GUIDE_CUES[i + 1] - GUIDE_CUES[i]) : (i === 2 || i === 3 ? 10 : GUIDE_SEC);
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
  if (Guide.set === 'learn') return learnScenes();
  if (Guide.set === 'level') return levelScenes();
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
      <p class="g-cap" style="--d:3.2s">다섯저울로 짜임을 점검하고, <b>가장 약한 저울 하나</b>만 고쳐서 다시 말해요.</p>` },
    { k: 'cards', c: '#1D6A47', html: `
      <p class="g-kicker">그리고</p>
      <h2 class="g-h">쌓기</h2>
      <div class="g-stack"><span style="--d:.4s"></span><span style="--d:.7s"></span><span style="--d:1s"><b>경험카드</b><small>상황 · 문제 · 판단 · 행동 · 결과 · 배움</small></span></div>
      <p class="g-cap" style="--d:1.6s">내 경험을 카드로 모아 두면 어떤 질문에도 꺼내 쓸 수 있어요. 연습 기록은 '기록'에 쌓여요.</p>
      <div class="g-end" style="--d:2.4s"><button class="btn cta" data-act="guideStart">${esc(p.cta)}</button><button class="btn ghost" data-act="guideReplay">처음부터 다시 보기</button></div>
      <img class="g-char sm" src="${CH('thumbs')}" alt="">` }
  ];
}

const GA = (d, h, cls) => `<div class="g-anim ${cls || ''}" style="--d:${d}s">${h}</div>`;
const gSlot = (f, i, t) => `<span class="g-slot" style="${roleBg(f, i)}"><b>${FORMS[f].slots[i].key}</b>${t || FORMS[f].slots[i].title}</span>`;
function learnScenes() {
  const order = ['PREP', 'AHWA', 'CRIB'];
  return [
    { k: 'l-intro', c: '#22356B', html: `
      <img class="g-char g-jump" src="${CH('jump')}" alt="">
      <p class="g-kicker">사용설명서 ② · 익히기</p>
      <h2 class="g-big d3">세 가지<br>삼지작법 익히기</h2>
      <ol class="g-flow">${order.map((f, n) => `<li style="--d:${.9 + n * .4}s"><b>${n + 1}</b>${FORMS[f].code}</li>`).join('')}</ol>
      <p class="g-cap sm" style="--d:2.4s">쉬운 것부터: 받치는 → 답하는 → 여는</p>` },
    { k: 'l-study', c: '#22356B', html: `
      <p class="g-kicker">익히기 · 삼지작법</p>
      <h2 class="g-h">원리 읽기</h2>
      ${GA(.4, order.map((f, n) => `<span class="${n === 0 ? 'on' : ''}">${FORMS[f].label.replace(' 삼지작법', '')}</span>`).join(''), 'g-tabs')}
      ${GA(1.2, [0, 1, 2, 3].map(i => gSlot('PREP', i)).join(''), 'g-slots4')}
      ${GA(2.2, '<span class="c1">宗 빨강</span><span class="c2">因 파랑</span><span class="c3">喩 초록</span>', 'g-legend')}
      ${GA(3.2, ['왜 이 순서일까요?', '한 묶음 예시', '이것만은 지켜요'].map((t, n) => `<p class="${n === 0 ? 'open' : ''}">${t}<i>${n === 0 ? '−' : '+'}</i></p>`).join(''), 'g-fold')}
      <p class="g-cap sm" style="--d:4s">맨 위 탭으로 세 기법을 오가고, 제목을 누르면 설명이 펼쳐져요.</p>` },
    { k: 'l-drill', c: '#22356B', html: `
      <p class="g-kicker">익히기 · 워드댄싱</p>
      <h2 class="g-h">순서 맞추기</h2>
      ${GA(.4, ['AI의 답은 내 생각을 증명해 주지 않기 때문입니다.', 'AI가 쓴 과제를 그대로 내면 안 됩니다.', 'AI가 저보다 글을 더 잘 쓰는 것 같습니다.'].map((t, n) => `<span class="${n === 2 ? 'trap' : ''}" style="--o:${n}">${t}${n === 2 ? '<em>함정</em>' : ''}</span>`).join(''), 'g-pieces')}
      ${GA(2.6, gSlot('PREP', 0, '결론(주장) ✓') + gSlot('PREP', 1, '근거 ✓') + gSlot('PREP', 2, '증명(사례)') + gSlot('PREP', 3, '결론(다시 주장)'), 'g-slots4')}
      ${GA(3.6, '<span class="hint">💡 힌트 보기</span><span class="dots"><i class="on">1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i></span>', 'g-drow')}
      <p class="g-cap sm" style="--d:4.4s">조각 하나는 함정이에요. 막히면 힌트, 기법마다 6문제.</p>
      ${GA(5.4, '<span class="on">AI 답 뜯어보기</span><span>주장·이유·사례로 나눠 빈 칸 찾기</span>', 'g-tabs')}` },
    { k: 'l-scale', c: '#22356B', html: `
      <p class="g-kicker">익히기 · 다섯저울</p>
      <h2 class="g-h">의심 풀기</h2>
      ${GA(.4, SCALES.map((s, n) => `<span class="${n === 1 ? 'on' : ''}">${n + 1}</span>`).join(''), 'g-tabs num')}
      ${GA(1.2, `<div class="pan"><small>사실</small>취소율 12% → 7%</div><div class="pan"><small>생각</small>더 만족한 것 같아요</div>`, 'g-scale2')}
      ${GA(2.4, '<b>심판 기준</b> 셋 중 둘이 보이면 채워져요', 'g-judge')}
      ${GA(3.2, `<span class="btn">${SCALES[1].name} 저울 연습하기</span>`, 'g-fakebtn')}
      <p class="g-cap sm" style="--d:4s">카드를 두 접시에 가르면 저울이 수평이 돼요.</p>` },
    { k: 'l-end', c: '#22356B', html: `
      <p class="g-kicker">이제</p>
      <h2 class="g-h">손에 익히기</h2>
      <p class="g-cap" style="--d:.5s">순서가 손에 익으면 짜기로 가서 내 답을 말해 보세요.</p>
      <div class="g-end" style="--d:1.2s"><button class="btn cta" data-act="guideTo" data-v="drill">워드댄싱 시작하기</button><button class="btn ghost" data-act="guideReplay">처음부터 다시 보기</button></div>
      <img class="g-char sm" src="${CH('thumbs')}" alt="">` }
  ];
}
function levelScenes() {
  const ans = ['AI가 쓴 과제를 그대로 내면 안 됩니다.', 'AI의 답은 내 생각을 증명해 주지 않기 때문입니다.'];
  const stg = on => `<div class="g-stagebar">${['PR', 'PRE', 'PREP'].map((t, n) => `<span class="${n === on ? 'on' : ''}"><small>${['두', '세', '네'][n]} 칸</small>${t}</span>`).join('')}</div>`;
  return [
    { k: 'v-intro', c: '#7A4A12', html: `
      <img class="g-char g-jump" src="${CH('jump')}" alt="">
      <p class="g-kicker">사용설명서 ③ · 칸 늘리기</p>
      <h2 class="g-big d3">두 칸부터<br>한 칸씩</h2>
      <ol class="g-flow"><li style="--d:.9s"><b>1</b>PR</li><li style="--d:1.3s"><b>2</b>PRE</li><li style="--d:1.7s"><b>3</b>PREP</li></ol>
      <p class="g-cap sm" style="--d:2.3s">AW → AWH → AWHA, CR → CRI → CRIB도 같아요.</p>` },
    { k: 'v-steps', c: '#7A4A12', html: `
      <p class="g-kicker">말하기 화면 맨 위</p>
      <h2 class="g-h">칸 고르기</h2>
      ${GA(.4, stg(0), '')}
      ${GA(1.4, gSlot('PREP', 0) + `<p>${ans[0]}</p>`, 'g-line')}
      ${GA(2.2, gSlot('PREP', 1) + `<p>${ans[1]}</p>`, 'g-line')}
      <p class="g-cap sm" style="--d:3.2s">두 칸을 고르면 두 칸만 열려요. 결론과 이유만 말하면 돼요.</p>` },
    { k: 'v-next', c: '#7A4A12', html: `
      <p class="g-kicker">재기 · 칸 늘리기 결과</p>
      <h2 class="g-h">한 칸 더</h2>
      ${GA(.4, '<b>두 칸 PR</b>까지 쟀어요. 칸 늘리기 연습이라 점수가 낮아도 괜찮아요.', 'g-note')}
      ${GA(1.4, '<span class="btn">한 칸 더: PRE 말하기</span>', 'g-fakebtn')}
      ${GA(2.4, stg(1), '')}
      <p class="g-cap sm" style="--d:3.2s">쓴 내용은 그대로, 사례(E) 칸이 하나 더 열려요.</p>` },
    { k: 'v-fix', c: '#1D6A47', html: `
      <p class="g-kicker">네 칸을 다 채웠다면</p>
      <h2 class="g-h">점수 올리기</h2>
      ${GA(.4, '<span><b>70</b>기본 논리</span><i>+</i><span><b>30</b>다섯저울</span>', 'g-split')}
      <ul class="g-bars">${SCALES.map((s, n) => `<li class="${n === 2 ? 'weak' : ''}" style="--d:${1 + n * .25}s;--v:${[3, 3, 1, 3, 2][n] / 3}"><b>${s.name}</b><i><em></em></i><span>${[3, 3, 1, 3, 2][n]}</span></li>`).join('')}</ul>
      ${GA(2.8, '<span class="btn">가장 약한 저울 연습하기</span><span class="btn ghost">고쳐 말하기</span>', 'g-fakebtn two')}
      <p class="g-cap sm" style="--d:3.6s">약한 저울 하나만, 한 문장만 고쳐 다시 재요.</p>` },
    { k: 'v-end', c: '#1D6A47', html: `
      <p class="g-kicker">그리고</p>
      <h2 class="g-h">경험카드</h2>
      <div class="g-stack"><span style="--d:.4s"></span><span style="--d:.7s"></span><span style="--d:1s"><b>경험카드에서 불러오기</b><small>상황 · 문제가 그대로 C · R 칸으로</small></span></div>
      <p class="g-cap" style="--d:1.6s">오늘은 두 칸부터 시작해 보세요.</p>
      <div class="g-end" style="--d:2.2s"><button class="btn cta" data-act="guideStart">바로 연습하기</button><button class="btn ghost" data-act="guideReplay">처음부터 다시 보기</button></div>
      <img class="g-char sm" src="${CH('thumbs')}" alt="">` }
  ];
}

/* learn·level 음성: 장면별 녹음 파일 → 없으면 기기 음성(TTS) */
function partStop() { Guide.tok++; try { if (Guide.part) { Guide.part.onended = Guide.part.onerror = null; Guide.part.pause(); } } catch (e) {} Guide.part = null; try { speechSynthesis.cancel(); } catch (e) {} Guide.mode = null; }
function partNext(tok) { if (tok !== Guide.tok || Guide.paused) return; const n = guideScenes().length; if (Guide.i < n - 1) Guide.t = setTimeout(() => { if (tok === Guide.tok && !Guide.paused) guideGo(1); }, 600); }
function partTTS(tok) {
  const text = GUIDE_SETS[Guide.set].narr[Guide.i];
  if (!('speechSynthesis' in window)) { Guide.mode = 'timer'; Guide.t = setTimeout(() => partNext(tok), sceneLen(Guide.i) * 1000); return; }
  const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; u.rate = 1.02;
  const v = speechSynthesis.getVoices().find(x => /^ko/i.test(x.lang)); if (v) u.voice = v;
  u.onend = () => partNext(tok);
  Guide.mode = 'tts'; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
function partPlay() {
  partStop(); const tok = Guide.tok;
  const a = new Audio(`voice/${Guide.set}-${Guide.i + 1}.mp3`); Guide.part = a; Guide.mode = 'file';
  a.onended = () => partNext(tok);
  a.onerror = () => { if (tok === Guide.tok) { Guide.part = null; partTTS(tok); } };
  a.play().catch(e => { if (e && e.name === 'NotAllowedError' && tok === Guide.tok) { Guide.paused = true; const b = document.querySelector('.guide'); if (b) b.classList.add('paused'); } });
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
  if (Guide.set !== 'start') { partStop(); typeStart(); return; }
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
/* 익히기·칸 늘리기 편: 음성 대신 위쪽 빈 곳에 설명을 한 문장씩, 한 글자씩 */
const SENT_HOLD = 1100;
const narrSents = i => GUIDE_SETS[Guide.set].narr[i].split(/(?<=[.?!])\s+/).filter(Boolean);
function typeStart(from) {
  clearInterval(Guide.typeT); clearTimeout(Guide.t);
  const el = document.querySelector('.g-typing'); if (!el) return;
  const ss = narrSents(Guide.i), n = guideScenes().length;
  if (from == null) { Guide.sent = 0; Guide.typed = 0; }
  el.setAttribute('aria-label', GUIDE_SETS[Guide.set].narr[Guide.i]);
  const paint = () => { const t = ss[Guide.sent] || ''; el.innerHTML = esc(t.slice(0, Guide.typed)) + (Guide.typed < t.length ? '<i class="g-caret" aria-hidden="true"></i>' : ''); };
  paint();
  if (Guide.paused) return;
  const tick = () => {
    if (Guide.paused) return;
    const t = ss[Guide.sent];
    if (Guide.typed < t.length) { Guide.typed++; paint(); return; }
    clearInterval(Guide.typeT);
    if (Guide.sent < ss.length - 1) Guide.t = setTimeout(() => { if (Guide.paused) return; Guide.sent++; Guide.typed = 0; paint(); Guide.typeT = setInterval(tick, TYPE_MS); }, SENT_HOLD);
    else if (Guide.i < n - 1) Guide.t = setTimeout(() => { if (!Guide.paused) guideGo(1); }, TYPE_HOLD);
  };
  Guide.typeT = setInterval(tick, TYPE_MS);
}
function guideGo(d) {
  const n = guideScenes().length;
  Guide.i = Math.max(0, Math.min(n - 1, Guide.i + d)); guideRender();
}
function openGuide(listen, set) {
  Guide.set = GUIDE_SETS[set] ? set : 'start'; Guide.i = 0; Guide.paused = false; Guide.listen = listen === true;
  if (Guide.listen && !Guide.ac) { try { const C = window.AudioContext || window.webkitAudioContext; if (C) Guide.ac = new C(); } catch (e) {} }
  const L = $('#layer');
  L.innerHTML = `<div class="guide" role="dialog" aria-modal="true" aria-label="${GUIDE_SETS[Guide.set].title} ${GUIDE_SETS[Guide.set].sub}">
    <div class="g-top"><div class="g-bars-top"></div>
      <div class="g-ctl"><span class="g-count"></span>
        ${Guide.set !== 'start' ? '' : `<button class="g-btn snd" data-act="guideSound" aria-label="소리 켜기/끄기"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path class="ic-on" d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/><path class="ic-off" d="M16 9l5 6M21 9l-5 6"/></svg></button>`}
        <button class="g-btn" data-act="guidePause" aria-label="멈추기/이어보기"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path class="ic-pause" d="M7 5h3v14H7zM14 5h3v14h-3z"/><path class="ic-play" d="M8 5l11 7-11 7z"/></svg></button>
        <button class="g-btn" data-act="guideClose" aria-label="닫기"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></div>
    ${Guide.set !== 'start' ? '<p class="g-typing" role="status"></p>' : ''}
    <div class="g-stage"></div>
    <button class="g-tap prev" data-act="guidePrev" aria-label="이전 장면"></button><button class="g-tap next" data-act="guideNext" aria-label="다음 장면"></button>
  </div>`;
  document.body.style.overflow = 'hidden';
  guideRender();
}
function closeGuide() { clearTimeout(Guide.t); clearInterval(Guide.typeT); voiceStop(); partStop(); Guide.audio = null; closeSheet(); }

Object.assign(ACT, {
  openGuide: v => openGuide(false, v),
  openGuideListen: v => openGuide(true, v),
  guideSound: () => { Guide.listen = !Guide.listen; guideRender(); },
  guideTo: v => { closeGuide(); go(v); },
  guideClose: closeGuide,
  guideNext: () => guideGo(1),
  guidePrev: () => guideGo(-1),
  guidePause: () => {
    Guide.paused = !Guide.paused;
    const box = document.querySelector('.guide'); if (box) box.classList.toggle('paused', Guide.paused);
    if (Guide.set !== 'start') {
      if (Guide.paused) { clearTimeout(Guide.t); }
      else typeStart(true);
      return;
    }
    if (false) {
      if (Guide.paused) { clearTimeout(Guide.t); if (Guide.mode === 'file' && Guide.part) Guide.part.pause(); else if (Guide.mode === 'tts') try { speechSynthesis.pause(); } catch (e) {} }
      else if (Guide.mode === 'file' && Guide.part) Guide.part.play().catch(() => {});
      else if (Guide.mode === 'tts' && speechSynthesis.paused) try { speechSynthesis.resume(); } catch (e) {}
      else partPlay();
      return;
    }
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
