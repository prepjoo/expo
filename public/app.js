'use strict';
/* 내 말로 증명하다 · 성인·박람회판 (청소년판 youth-v1.0에서 복사) */

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const CH = name => `char/${name}.webp`;
const todayKey = (d = new Date()) => { const z = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`; };
const uidGen = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- state ----------
const S = {
  profile: { who: null },
  history: [],   // {id, t, day, kind:'speak'|'drill', form, q, total, scores{}, slots[] | right}
  cards: [],
  ui: {
    speak: { form: 'PREP', q: null, slots: ['', '', '', ''] },
    result: null, selScale: null,
    drill: { form: 'PREP', who: null, placed: [null, null, null, null], checked: false },
    report: { sel: null },
    qIndex: 0
  }
};

// ---------- storage: this browser + (when available) the viewer's own cloud space ----------
const LS = 'b5adult:v1';
const Store = {
  mode: 'local', backend: null, chains: {}, account: null,
  loadLocal() {
    try {
      const o = JSON.parse(localStorage.getItem(LS) || '{}');
      if (o.profile) S.profile = o.profile;
      if (Array.isArray(o.history)) S.history = o.history;
      if (Array.isArray(o.cards)) S.cards = o.cards;
      if (o.draft) S.ui.speak = Object.assign(S.ui.speak, o.draft);
      S.ui.formPicked = !!o.picked;
    } catch (e) { /* storage unavailable */ }
  },
  saveLocal() {
    try { localStorage.setItem(LS, JSON.stringify({ profile: S.profile, history: S.history, cards: S.cards, draft: S.ui.speak, picked: !!S.ui.formPicked })); } catch (e) { }
  },
  body(name) {
    const now = Date.now();
    if (name === 'profile') return { who: S.profile.who || null, area: S.profile.area || null, updatedAt: now };
    if (name === 'history') return { items: S.history.slice(-400), updatedAt: now };
    return { items: S.cards, updatedAt: now };
  },
  save(...names) {
    this.saveLocal();
    if (this.mode !== 'cloud' || !this.backend) return;
    names.forEach(n => {
      const prev = this.chains[n] || Promise.resolve();
      this.chains[n] = prev.then(() => this.backend.set(n, this.body(n))).catch(e => {
        const c = e && e.code;
        if (c === 'invalid_argument' || c === 'revoked' || c === 'not_granted' || c === 'auth') { this.mode = 'local'; renderMenuState(); }
        else if (c === 'quota_exceeded') toast('저장 공간이 가득 찼어요. 오래된 기록을 지워 주세요.', 'surprised');
      });
    });
  },
  async initCloud() {
    try {
      let be = null;
      if (window.B5 && window.B5.cloud) be = await window.B5.cloud.ready();   // 실서비스(웹) 버전
      else be = await claudeBackend();                                        // Claude 링크 버전
      if (!be) { this.mode = 'local'; this.backend = null; renderMenuState(); return; }
      const timeout = new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), 10000));
      const got = (await Promise.race([be.getAll(), timeout])) || {};
      const { profile: p, history: h, cards: c } = got;
      if (p && p.who) S.profile.who = p.who;
      if (p && p.area) S.profile.area = p.area;
      if (h && Array.isArray(h.items)) S.history = mergeById(S.history, h.items);
      if (c && Array.isArray(c.items)) S.cards = mergeById(S.cards, c.items);
      await be.set('profile', this.body('profile'));   // 쓰기 권한 확인
      this.backend = be; this.mode = 'cloud';
      this.save('history', 'cards');
      render();
      if (S.profile.who && $('.sheet') && $('.sheet').dataset.kind === 'onboard') closeSheet();
    } catch (e) { this.mode = 'local'; this.backend = null; }
    renderMenuState();
  }
};
async function claudeBackend() {
  if (!window.claude || typeof window.claude.use !== 'function') return null;
  const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
  if (!db || !user) return null;
  const uid = await user.id();
  if (!uid) return null;
  const ref = n => db.doc(`data/users/${uid}/${n}`);
  return {
    async getAll() {
      const snaps = await Promise.all(['profile', 'history', 'cards'].map(n => ref(n).get()));
      const [p, h, c] = snaps.map(x => (x && x.exists ? x.data() : null));
      return { profile: p, history: h, cards: c };
    },
    set(n, body) { return ref(n).set(body); }
  };
}
function mergeById(a, b) {
  const m = new Map();
  [...a, ...b].forEach(x => { if (x && x.id) m.set(x.id, Object.assign({}, m.get(x.id) || {}, JSON.parse(JSON.stringify(x)))); });
  return [...m.values()].sort((x, y) => (x.t || x.created || 0) - (y.t || y.created || 0));
}

// ---------- dictation ----------
const Dict = { d: null, slot: null, state: 'idle', denied: false, partial: '' };
async function initDictation() {
  try {
    let d = null;
    if (window.B5 && window.B5.dictation) d = window.B5.dictation;
    else if (window.claude && typeof window.claude.use === 'function') d = await window.claude.use('dictation');
    if (!d) return;
    Dict.d = d;
    d.onPartial(({ text }) => { Dict.partial = text || ''; const el = document.getElementById('partial-' + Dict.slot); if (el) el.textContent = Dict.partial; });
    d.onFinal(({ text }) => {
      if (Dict.slot == null || !text) return;
      const i = Dict.slot, cur = S.ui.speak.slots[i] || '';
      S.ui.speak.slots[i] = (cur ? cur.replace(/\s*$/, ' ') : '') + text.trim();
      const ta = document.querySelector(`textarea[data-slot="${i}"]`); if (ta) ta.value = S.ui.speak.slots[i];
      Dict.partial = ''; const el = document.getElementById('partial-' + i); if (el) el.textContent = '';
      updateEstimate(); Store.saveLocal();
    });
    d.onState(({ state }) => { Dict.state = state; if (state !== 'listening') { Dict.partial = ''; } refreshMics(); });
    if (location.hash.replace('#', '') === 'speak') render();
  } catch (e) { Dict.d = null; }
}
function refreshMics() {
  document.querySelectorAll('button.mic').forEach(b => {
    const on = Dict.state === 'listening' && String(Dict.slot) === b.dataset.i;
    b.classList.toggle('rec', on);
    b.textContent = on ? '멈추기' : '🎤 말하기';
  });
}
function micClick(i) {
  const d = Dict.d; if (!d) return;
  if (Dict.state === 'listening' && Dict.slot === i) { d.stop().catch(() => { }); return; }
  if (Dict.state === 'listening') { d.stop().catch(() => { }); }
  Dict.slot = i;
  d.start().catch(e => {
    if (e && e.code === 'not_granted') { Dict.denied = true; Dict.d = null; render(); toast('마이크를 쓰지 않기로 하셨어요. 글로 적어 주세요.', 'think'); }
  });
}

// ---------- scoring (rule based) ----------
const RX = {
  num: /\d[\d,.]*\s*(%|퍼센트|명|건|원|만\s?원|억|시간|분|초|일|주|개월|달|년|배|kg|점|개|회|곳|종|위|등|p)?/g,
  numWord: /(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(배|명|건|개|곳|번|달|시간|주|가지)|절반|반나절|두\s?배/g,
  vague: /(많이|굉장히|매우|정말|열심히|최선|성실|책임감|꼼꼼|소통을? 잘|잘하는|좋아했|좋아합|것 같|아마|어느 정도|다양한|누구보다|자신 있|원래)/g,
  reason: /(때문|이라서|라서|니까|므로|기 위해|위해서|덕분|해야\s?\S*\s?(됩|되|합|할 수)|어야|아야|할 경우|일 경우|ㄹ 경우|경우에는|으면|하면)/,
  alt: /(대신|보다|말고|아니라|버리|제외|중에서|중 하나|대안)/,
  crit: /(기준|우선|먼저|골랐|골라|고르|선택|택했|택하|결정)/,
  beforeAfter: /(\d[\d,.]*\s*\S{0,4}\s*(에서|→|->|～|~)\s*\S{0,6}\d)|전후|이전보다|전보다/,
  delta: /(시들|죽었|잃|손실|삭감|줄어|줄였|늦|낭비|위기|깎|떠나|떠났|이탈|줄었|줄이|줄여|앞당|낮췄|늘었|늘리|늘려|올렸|올라|낮췄|낮아|절반|감소|증가|개선|빨라|단축|아꼈|절약)/,
  request: /(주십시오|주세요|맡겨|승인|부탁|요청|제안드|검토해|기회를|허락|함께 하|결정해)/,
  future: /(겠습니다|하려 합니다|할 계획|하고 싶습니다|해 보겠|해보겠|(을|할|볼|갈|쓸|줄|될) 거예요|[할볼]게요|하고 싶어요|해 볼래요|려고 해요)/,
  vow: /(열심히|최선|노력하|성실히)/,
  imper: /(세요|십시오|야\s?(합니다|해요|됩니다|돼요)|합시다|하자)/,
  directive: /(해야\s?합니다|해야\s?해요|해야\s?됩니다|하셔야|셔야\s?합|필요합니다|필요해요|바랍니다|시면\s?됩니다|시면\s?돼요|반드시|십시오|합시다|하시죠|해 주셔야|해야 할 때)/,
  smallAsk: /(다음\s?(달|주|학기)부터|\d+\s*(주|일|개월|달|명|건|팀|곳|번)\s*(만|동안|안에|부터)?|첫\s?(석\s?)?(달|주|학기|분기|해)|먼저|우선|시범|시험|한 번|부터 시작|만 해|만 맡)/,
  concrete: /(직접|“[^”]{2,}”|"[^"]{2,}"|라고\s?(말|했|하|물)|매일|매주|매달|주말마다|방과\s?후|처음으로|일일이|한\s?명씩|찾아가|찾아갔|인터뷰|설문|기록했|기록하|관찰|측정|재\s?보|세어\s?보|물어보|물어봤|만나서|손으로)/g,
  gain: /(이익|효과|아낄|얻|빨라|반나절|절감|도움|성과|매출|공유|보고드리|정리해 드리|맞추겠|개선점)/,
  loss: /(시들|말라|죽었|찌그러|무너|망가|모자라|부족|잃|놓치|놓칩|늦어|늦었|늦습|늦게|떨어|손실|이탈|낭비|위험|못하면|않으면|안 하면|그대로 두면|빼앗|밀립|밀려|삭감|깎|감소|버려|버립|반품|줄어들|불이익|뒤처|위기|문제가 생|어려워|없어집|없어져)/,
  gain2: /(버텼|버틸|튼튼|좋겠|알 수 있|확인할 수|하나도 없었|이익|효과|줄었|줄어|빨라졌|신뢰|믿|기회|성장|좋아지|늘어|안정|지킬|지켜|확보|아낄|아낍|얻|빨라|반나절|절감|도움|성과|매출|늘|올라|올리|올렸|줄이|줄여|줄였|낮춰|낮췄|단축|개선|맞추겠|맞춥|보여 드리|보고드리|공유|넓히)/
};
function countNums(t) { return ((t.match(RX.num) || []).length) + ((t.match(RX.numWord) || []).length); }
function countConcrete(t) { return new Set(t.match(RX.concrete) || []).size; }
function countVague(t) { return (t.match(RX.vague) || []).length; }
function estSeconds(slots) { const n = slots.join('').replace(/\s/g, '').length; return Math.round(n / 6.5); }

function scaleScores(form, slots, q) {
  const F = FORMS[form], all = slots.join(' '), s = slots.map(x => (x || '').trim());
  const R = {}, why = {}, at = {};
  // 1 고르라
  let p = 0; const hasR = RX.reason.test(all), hasA = RX.alt.test(all), hasC = RX.crit.test(all);
  p = (hasR ? 1 : 0) + (hasA ? 1 : 0) + (hasC ? 1 : 0);
  R.pick = p;
  why.pick = p === 3 ? '고른 기준, 이유, 버린 대안이 모두 들어 있어요.' :
    `${!hasA ? '버린 대안("~대신", "~보다")이 없어요. ' : ''}${!hasR ? '고른 이유("~때문에")가 없어요. ' : ''}${!hasC ? '무엇을 먼저 골랐는지 기준이 보이지 않아요.' : ''}`.trim();
  at.pick = s.findIndex(x => RX.alt.test(x) || RX.reason.test(x)); if (at.pick < 0) at.pick = 1;
  // 2 가려내라
  const n = countNums(all), v = countVague(all), c = countConcrete(all);
  let f = clamp(n + Math.min(c, 2), 0, 3);
  if (n === 0) f = Math.min(f, 2);
  if (v >= 2) f -= 1;
  if (n === 0 && c === 0 && v > 0) f = 0;
  f = clamp(f, 0, 3);
  R.fact = f;
  const vq = v ? ` 다만 '${(all.match(RX.vague) || [])[0]}' 같은 증명 없는 말이 ${v}번 나와요.` : '';
  why.fact = (n === 0 && c === 0) ? '생각만 있고 그 생각을 받쳐 줄 사실이 보이지 않아요. 생각과 사실을 나눠, 사실 칸에는 숫자(언제, 얼마나, 몇 명)나 직접 한 행동을 말해 주세요.' :
    n === 0 ? `생각을 받쳐 줄 사실로 직접 한 행동이 ${c}가지 보여요.${vq} 숫자 하나를 더하면 3점까지 올라가요.` :
    `생각을 받쳐 줄 사실로 수치 ${n}개${c ? `, 직접 한 행동 ${c}가지` : ''}가 보여요.` + (vq || (f === 3 ? ' 생각과 사실이 분명하게 나뉘어요.' : ' 한두 개 더 있으면 더 단단해져요.'));
  let worst = -1, wv = -1; s.forEach((x, i) => { const sc = countVague(x) * 2 - countNums(x); if (x && sc > wv) { wv = sc; worst = i; } });
  at.fact = worst < 0 ? 0 : worst;
  // 3 대비하라
  const ba = RX.beforeAfter.test(all), dl = RX.delta.test(all);
  R.contrast = clamp((ba ? 2 : 0) + (dl ? 1 : 0), 0, 3);
  why.contrast = R.contrast === 3 ? '전과 후가 숫자로 대비되고, 무엇이 줄고 늘었는지 보여요.' :
    (ba ? '전후 수치는 있어요. 잃던 것(손실)이나 바뀐 것을 한마디 더 붙여 보세요.' : (dl ? '바뀐 것은 말했지만 "몇에서 몇으로"가 없어요.' : '전과 후, 잃는 것과 얻는 것이 보이지 않아요. "○○에서 △△로"처럼 대비해 보세요.'));
  at.contrast = s.findIndex(x => RX.beforeAfter.test(x)); if (at.contrast < 0) at.contrast = form === 'CRIB' ? 1 : 2;
  // 4 맞춰라: 상대가 듣고 싶은 말(질문에 대한 답)을 먼저, 짧게, 목표 시간 안에
  const sec = estSeconds(s), first = s[0] || '';
  const firstShort = !!first && first.length <= 60 && (first.match(/[.!?。](?!\d)/g) || []).length <= 1;
  const timeOk = sec >= F.target * 0.3 && sec <= F.target * 1.3;
  const onQ = q ? onQuestion(form, first, q) : firstShort;
  R.fit = (onQ ? 1 : 0) + (firstShort ? 1 : 0) + (timeOk ? 1 : 0);
  why.fit = R.fit === 3 ? '상대가 물은 것에 첫 문장으로 바로 답하고, 시간도 알맞아요.' :
    [!onQ ? `첫 칸(${F.slots[0].title})에 질문의 단어가 없어요. 상대가 물은 말로 바로 답하세요.` : '', !firstShort ? `첫 칸은 한 문장으로 짧게 시작하세요.` : '', !timeOk ? `예상 말하기 시간이 ${sec}초예요. ${F.label}은 ${F.target}초 안팎이 좋아요.` : ''].filter(Boolean).join(' ');
  at.fit = 0;
  // 5 움직여라: 손실 ↔ 이익 — 하지 않으면 잃는 것, 하면 얻는 것 중 무엇으로 상대를 움직이는가
  const last = s[3] || '';
  const asks = RX.request.test(last) || RX.future.test(last) || RX.directive.test(last) || RX.imper.test(last);
  const sents = (form === 'CRIB' ? [s[1] || '', last] : [last]).join(' ').split(/(?<=[.!?。])\s+/).filter(Boolean);
  const isLoss = x => RX.loss.test(x), isGain = x => RX.gain2.test(x);
  const lg = sents.filter(x => isLoss(x) || isGain(x));
  const usesLoss = lg.some(isLoss), usesGain = lg.some(isGain);
  const numLG = lg.some(x => countNums(x) > 0);
  let m = 0;
  if (last) { m = (asks ? 1 : 0) + (lg.length ? 1 : 0) + (numLG ? 1 : 0); if (RX.vow.test(last) && !lg.length) m = Math.min(m, 1); }
  R.move = m;
  const frame = usesLoss && usesGain ? '손실과 이익을 함께' : usesLoss ? '손실(하지 않으면 잃는 것)로' : usesGain ? '이익(하면 얻는 것)으로' : '';
  why.move = !last ? '마지막 칸이 비어 있어요. 상대에게 다음 행동을 청하며 끝내세요.' :
    m === 3 ? `${frame} 상대를 움직이고, 숫자로 보여 줬어요.` :
    [!asks ? '듣는 사람이 무엇을 하면 되는지가 없어요. "~하겠습니다"(내가 할 일)나 "반드시 ~해야 합니다", "~해 주십시오"(상대가 할 일)로 끝내 보세요.' : '',
     !lg.length ? '상대를 움직일 근거가 없어요. 하지 않으면 잃는 것(손실)이나 하면 얻는 것(이익)을 붙이세요.' : '',
     lg.length && !numLG ? `${frame} 움직이려 했지만 크기가 안 보여요. "재계약 30곳을 잃습니다", "답변이 반나절로 빨라집니다"처럼 숫자로 말하세요.` : ''].filter(Boolean).join(' ');
  at.move = 3;
  return { scores: R, why, at, sec };
}

/* ---------- 100점 채점: 기본 논리 70 + 다섯저울 가산점 30 ---------- */
const WEIGHT = {
  PREP: { fact: 10, fit: 10, move: 6, pick: 2, contrast: 2 },
  CRIB: { contrast: 10, move: 10, fit: 6, pick: 2, fact: 2 },
  AHWA: { move: 10, pick: 10, fact: 6, fit: 2, contrast: 2 }
};
const wRole = (form, id) => { const w = WEIGHT[form][id]; return w >= 10 ? '핵심' : w >= 6 ? '보조' : '참고'; };
const STOP = new Set(['저는', '제가', '저희', '우리', '그래서', '그리고', '하지만', '그러나', '이번', '정말', '그것', '이것', '있습', '없습', '합니', '했습', '하겠', '입니', '됩니', '것입', '대한', '위해', '때문', '어떻', '무엇', '말해', '주세']);
function words(t) {
  return (t || '').replace(/[^가-힣A-Za-z0-9\s]/g, ' ').split(/\s+/)
    .map(w => w.replace(/(으로|에서|에게|한테|까지|부터|처럼|보다|이라|이다|입니다|은|는|이|가|을|를|에|의|도|로|와|과|만|요)$/, ''))
    .filter(w => w.length >= 2).map(w => w.slice(0, 2)).filter(w => !STOP.has(w));
}
// 질문에 바로 답했는가: 여는 삼지작법은 '소개'나 먼저 말하기라 상황·자기소개로 시작해도 답이에요
function onQuestion(form, first, q) {
  if (overlap(first, q)) return true;
  if (/소개/.test(q) && /^(저는|제가|저희|안녕하십니까|안녕하세요)/.test(first.trim())) return true;
  if (form === 'CRIB' && (FT.sit(first) || countNums(first) > 0)) return true;
  // 답하는 삼지작법(아하)은 행동(Action)을 먼저 제안하는 것이 곧 답이에요
  if (form === 'AHWA' && FT.next(first)) return true;
  return false;
}
function overlap(a, b) { const B = new Set(words(b)); return words(a).some(w => B.has(w)); }
const done = t => /(다|요|죠|까|오|니다)[.!?。]?\s*$/.test((t || '').trim());
const hasPast = t => /(작년|지난|재작년|제작년|당시|예가|경험|사례|그때)/.test(t) || [...(t || '')].some((c, i, a) => { const k = c.charCodeAt(0) - 0xAC00; return k >= 0 && k < 11172 && k % 28 === 20 && /^(습니다|어요|다|고|는데|지만|으나)/.test(a.slice(i + 1, i + 4).join('')); });
const FT = {
  reason: t => RX.reason.test(t) || /(덕분|위해|때문)/.test(t),
  loss: t => RX.loss.test(t), gain: t => RX.gain2.test(t) || RX.request.test(t),
  act: t => /(뽑아|냈습니다|줄이고|줄여|했습니다|했어요|었습니다|았습니다|였습니다|만들|바꿔|바꾸|나눠|나누|정리|조사|확인|도입|시작|맡|세웠|세우|줄였|늘렸|찾아|인터뷰|기록|측정|점검|모아|모았)/.test(t),
  next: t => RX.future.test(t) || RX.directive.test(t) || RX.request.test(t) || RX.imper.test(t) || /(하겠|할게|하자|합시다|해 보겠)/.test(t),
  past: t => hasPast(t),
  sit: t => /(지금|현재|요즘|최근|이번|올해|매일|매달|하루|늘었|줄었|됐습니다|되었습니다)/.test(t),
  fact: t => countNums(t) > 0 || countConcrete(t) > 0,
  alt: t => RX.alt.test(t)
};
// 칸마다 역할을 했는지: 2 = 역할을 함, 1 = 일부만, 0 = 역할이 안 보임
const ROLE = {
  PREP: [(t) => done(t) && t.length <= 80 ? 2 : 1, t => FT.reason(t) || FT.loss(t) || FT.gain(t) ? 2 : 0,
    t => FT.fact(t) && FT.past(t) ? 2 : (FT.fact(t) || FT.past(t) ? 1 : 0), (t, s) => FT.next(t) ? 2 : overlap(t, s[0]) ? 1 : 0],
  CRIB: [t => (FT.sit(t) || countNums(t)) && t.length <= 80 ? 2 : 1, t => FT.loss(t) ? 2 : RX.delta.test(t) ? 1 : 0,
    t => FT.next(t) || FT.act(t) || FT.alt(t) || /(제안|도입|하자)/.test(t) ? 2 : 0, t => FT.gain(t) ? 2 : FT.next(t) ? 1 : 0],
  // 아하 = A 행동(종) → W 이유(인) → H 방법(인) → A 다시 행동(종). W와 H는 나란한 근거(因)
  AHWA: [t => FT.next(t) && t.length <= 80 ? 2 : (done(t) ? 1 : 0), t => FT.reason(t) || FT.alt(t) ? 2 : (FT.loss(t) || FT.gain(t) ? 1 : 0),
    t => FT.act(t) && FT.fact(t) ? 2 : (FT.act(t) || FT.fact(t) ? 1 : 0), (t, s) => FT.next(t) ? 2 : overlap(t, s[0]) ? 1 : 0]
};
function nearSame(a, b) {
  const n = t => t.replace(/[\s.,!?'"“”‘’()·~-]/g, '');
  const x = n(a), y = n(b); if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const bg = t => { const o = new Set(); for (let i = 0; i < t.length - 1; i++) o.add(t.slice(i, i + 2)); return o; };
  const A = bg(x), B = bg(y); let k = 0; A.forEach(g => { if (B.has(g)) k++; });
  return k / Math.min(A.size, B.size) >= 0.7;
}
function baseLogic(form, slots, q) {
  const s = slots.map(x => (x || '').trim());
  const role = s.map((t, i) => { if (!t) return 0; const lv = ROLE[form][i](t, s); return (done(t) ? 4 : 2) + (lv === 2 ? 6 : lv === 1 ? 3 : 0); });
  const answer = !s[0] ? 0 : (q ? (onQuestion(form, s[0], q) ? 10 : (done(s[0]) && s[0].length <= 80 ? 6 : 3)) : (done(s[0]) ? 10 : 6));
  // 프렙의 두 P, 아하의 두 A는 같은 뜻이되 다른 문장이어야 한다: 첫 칸을 거의 그대로 되풀이하면 끝맺음 점수를 낮춘다
  const rep = !!(s[0] && s[3] && form !== 'CRIB' && nearSame(s[0], s[3]));
  const same = !s[0] || !s[3] ? 0 : rep ? 3 : (form === 'CRIB' ? (FT.gain(s[3]) || FT.next(s[3]) ? 10 : 4) : (overlap(s[0], s[3]) || FT.next(s[3]) ? 10 : 4));
  const link = Math.round(s.filter(t => t && done(t)).length * 2.5);
  const roles = role.reduce((a, b) => a + b, 0);
  return { role, roles, answer, same, rep, link, total: roles + answer + same + link };
}
const GRADE = [[90, '증명 완료', '생각을 증명할 재료를 모두 갖춘 답이에요.', 'joy'], [80, '설득력 있음', '듣는 사람이 고개를 끄덕일 답이에요. 핵심 저울 하나만 더 채워 보세요.', 'thumbs'],
  [70, '논리는 섰어요', '짜임은 맞아요. 가장 약한 저울 하나만 채우면 설득력이 생겨요.', 'thumbs'], [60, '뼈대는 있어요', '칸의 역할을 하나씩 더 분명하게 하면 논리가 서요.', 'think'], [0, '칸 역할부터 다시', '칸마다 그 칸이 할 일을 한 문장씩 채워 보세요.', 'surprised']];
const grade = t => GRADE.find(g => t >= g[0]);
function scoreAnswer(form, slots, q) {
  q = q && q.q ? q.q : (q || '');
  const sc = scaleScores(form, slots, q), W = WEIGHT[form], base = baseLogic(form, slots, q);
  const pts = {}; SCALES.forEach(x => pts[x.id] = Math.round(W[x.id] * sc.scores[x.id] / 3 * 10) / 10);
  const bonus = Math.round(SCALES.reduce((a, x) => a + pts[x.id], 0));
  const total = clamp(Math.round(base.total + SCALES.reduce((a, x) => a + pts[x.id], 0)), 0, 100);
  const lost = SCALES.map(x => [x.id, W[x.id] - pts[x.id]]).sort((a, b) => b[1] - a[1]);
  const weakest = lost[0][1] > 0.05 ? lost[0][0] : null;
  // 고른 삼지작법보다 더 잘 맞는 짜임이 있는지
  let better = null, bestR = base.roles;
  Object.keys(FORMS).forEach(k => { if (k === form) return; const r = baseLogic(k, slots, q).roles; if (r >= bestR + 8) { bestR = r; better = k; } });
  return Object.assign(sc, { base, pts, bonus, total, weakest, better, v: 2 });
}
const FOLLOW = {
  none: '이 경험에서 가장 어려웠던 순간은 언제였고, 어떻게 넘겼나요?',
  pick: '다른 방법도 있었을 텐데, 왜 그 방법을 골랐나요?',
  fact: '그 결과는 몇에서 몇으로, 어떻게 측정했나요?',
  contrast: '그 일을 하지 않았다면 무엇을 잃었을까요?',
  fit: '한 문장으로 줄이면 결론이 무엇인가요?',
  move: '그래서 듣는 사람은 무엇을 하면 되나요?'
};
const RECO = { pick: 'AHWA', fact: 'PREP', contrast: 'CRIB', fit: 'CRIB', move: 'PREP' };
const RECO_TXT = {
  pick: '"왜 그 방법이었나요?"에 버린 대안과 기준을 넣어 답하는 연습을 하세요.',
  fact: '생각과 사실을 나눠, 사례 칸에는 숫자나 직접 한 행동 같은 사실만 넣는 연습을 하세요.',
  contrast: '"○○에서 △△로"처럼 전과 후를 대비하는 연습을 하세요.',
  fit: '첫 문장을 짧게, 30초 안에 끝내는 여는 삼지작법 연습을 하세요.',
  move: '끝 문장에 "하지 않으면 잃는 것(손실)"이나 "하면 얻는 것(이익)"을 숫자로 붙이는 연습을 하세요.'
};

// ---------- derived ----------
const speakRecs = () => S.history.filter(h => h.kind === 'speak');
function streak() {
  const days = new Set(S.history.map(h => h.day)); let n = 0; const d = new Date();
  if (!days.has(todayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(todayKey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function todaysQuestions() { return QUESTIONS[levelId()][areaId()]; }
function currentQ() {
  const list = todaysQuestions(); const base = Math.floor(Date.now() / 86400000);
  return list[(base + S.ui.qIndex) % list.length];
}

// ---------- persona ----------
// 성인·박람회판: 대상은 '성인(대학생 포함)' 하나, 영역 5개. 청소년은 청소년판 앱으로 안내한다
const levelChosen = () => true;
const levelId = () => 'adult';
const areaId = () => { const L = LEVEL_AREAS.adult, a = S.profile.area; return a && L.includes(a) ? a : 'study'; };
const whoId = () => 'adult';
const persona = () => PERSONAS[whoId()];
const formEx = k => FORM_EX[whoId()][k];
const scaleEx = id => SCALE_EX[whoId()][id];

// ---------- 대상별 제목 글꼴 ----------
const FONTS = {
  adult: { family: 'Gothic A1', css: 'Gothic+A1:wght@700;800' },
  elem: { family: 'Do Hyeon', css: 'Do+Hyeon' },
  mid: { family: 'Do Hyeon', css: 'Do+Hyeon' },
  high: { family: 'Do Hyeon', css: 'Do+Hyeon' },
  pres: { family: 'Gothic A1', css: 'Gothic+A1:wght@700;800' },
  univ: { family: 'Gothic A1', css: 'Gothic+A1:wght@700;800' },
  worker: { family: 'IBM Plex Sans KR', css: null },
  mover: { family: 'IBM Plex Sans KR', css: null },
  lead: { family: 'Noto Serif KR', css: 'Noto+Serif+KR:wght@700;900' },
  senior: { family: 'Noto Sans KR', css: 'Noto+Sans+KR:wght@700;800' }
};
const loadedFonts = {};
function applyFont() {
  const f = FONTS.lead;   // 제목 글꼴은 대상과 상관없이 Noto Serif KR로 고정
  if (f.css && !loadedFonts[f.css]) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = `https://fonts.googleapis.com/css2?family=${f.css}&display=swap`; document.head.appendChild(l); loadedFonts[f.css] = 1; }
  document.documentElement.style.setProperty('--serif', `'${f.family}', 'IBM Plex Sans KR', sans-serif`);
}

// ---------- UI pieces ----------
function segs(score, orange) { return `<span class="seg${orange ? ' o' : ''}">${[1, 2, 3].map(i => `<i class="${i <= score ? 'on' : ''}"></i>`).join('')}</span>`; }
function formChips(cur, act) {
  return `<div class="grp-label f">${ICON_FORM}<span>삼지작법 고르기</span></div><div class="grid3 mb8" role="group" aria-label="삼지작법 고르기">${Object.keys(FORMS).map(k => `<button class="chip fchip" data-act="${act}" data-v="${k}" aria-pressed="${k === cur}">${FORMS[k].label}<small>${FORMS[k].when}</small></button>`).join('')}</div>`;
}
function whoChips(cur, act) {
  const c = levelChosen() ? levelId() : null;
  return `<div class="who-list" role="group" aria-label="누가 연습하나요">${Object.keys(LEVELS).map(id => { const p = LEVELS[id]; return `<button class="who-item" data-act="${act}" data-v="${id}" aria-pressed="${id === c}"><span><b>${p.label}</b><small>${p.sub}</small></span><span class="go" aria-hidden="true">›</span></button>`; }).join('')}</div>`;
}
function areaSelect(id) {
  const cur = areaId();
  return `<span class="selwrap"><select id="${id}" class="who-select area-select" aria-label="어떤 영역을 연습하나요">${LEVEL_AREAS[levelId()].map(k => `<option value="${k}" ${k === cur ? 'selected' : ''}>${AREAS[k].label} (${AREAS[k].sub})</option>`).join('')}</select></span>`;
}
function whoSelect(id) {
  // 성인·박람회판은 대상이 '대학생·직장인' 하나라 고르는 버튼 없이 고정해 보여 준다
  return `<span id="${id}" class="who-fixed" style="display:flex;align-items:center;width:100%;height:42px;padding:0 12px;font-size:14.5px;font-weight:700">${esc(LEVELS[levelId()].label)}</span>`;
}
function toast(msg, pose = 'thumbs') {
  const old = document.querySelector('.toast'); if (old) old.remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `<img src="${CH(pose)}" alt="">${esc(msg)}`;
  document.body.appendChild(t); setTimeout(() => t.remove(), 2600);
}
function openSheet(html, onMount, kind) {
  const L = $('#layer');
  L.innerHTML = `<div class="scrim" data-act="closeSheet"><div class="sheet" role="dialog" aria-modal="true" data-stop="1" data-kind="${kind || ''}"><div class="grab"></div>${html}</div></div>`;
  document.body.style.overflow = 'hidden';
  if (onMount) onMount($('.sheet', L));
}
function closeSheet() { $('#layer').innerHTML = ''; document.body.style.overflow = ''; }

// ---------- views ----------
const NAV_IC = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  forms: '<rect x="3" y="4" width="18" height="4" rx="1.2"/><rect x="3" y="10" width="13" height="4" rx="1.2"/><rect x="3" y="16" width="16" height="4" rx="1.2"/>',
  speak: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  scales: '<path d="M4 20 20 4"/><path d="M4 20l3 0M20 4v3"/><path d="M8.5 15.5l1.6 1.6M11.5 12.5l1.6 1.6M14.5 9.5l1.6 1.6"/><rect x="2.5" y="13" width="9" height="8.5" rx="1.5" transform="rotate(-45 7 17.25)" opacity="0"/><path d="M3 15l6 6M15 3l6 6"/>',
  drill: '<path d="M4 6h7M4 12h10M4 18h6"/><path d="M15.5 5.5l2 2 3.5-3.5"/><path d="M17 14.5c1.5-1.2 3.5-.2 3.5 1.6 0 2.2-3.5 4.4-3.5 4.4s-3.5-2.2-3.5-4.4c0-1.8 2-2.8 3.5-1.6z"/>',
  scaleinfo: '<path d="M12 3v18M4 7h16M7 21h10"/><path d="M1.5 13a3.5 2.2 0 0 0 7 0M15.5 13a3.5 2.2 0 0 0 7 0"/><path d="M5 7v6M19 7v6" stroke-width="1.3"/>',
  cards: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h10M7 14h6"/>',
  report: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'
};
NAV_IC.study = '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M12 3.5v17M3.5 12h17"/><path d="M7.5 7.5h9l-9 9h9" stroke-width="1.4"/>';
const NAV_GROUPS = [['실전', [['forms', '짜기'], ['speak', '말하기'], ['scales', '재기']]], ['익히기', [['study', '삼지작법'], ['drill', '워드댄싱'], ['scaleinfo', '다섯저울']]], ['재료', [['cards', '경험카드']]]];
const NAV = [].concat(...NAV_GROUPS.map(g => g[1])).map(([id, l]) => [id, l, NAV_IC[id]]);
const PAGES = [['home', '홈', '처음 화면, 대상 고르기'], ['forms', '짜기', '1단계 · 삼지작법 고르기'], ['speak', '말하기', '2단계 · 삼지작법 익히기'], ['scales', '재기', '3단계 · 삼지작법 점검하기'],
  ['drill', '삼지작법 워드댄싱', '네 칸의 순서 익히기'], ['scaleinfo', '다섯저울', '저울 다섯 개 알아보기'], ['cards', '경험카드', '경험을 여섯 칸에 모으기'], ['report', '기록', '날짜별 점수 변화'], ['origin', '유래', '진나의 인명학과 삼지작법']];
function renderNav(route) {
  const r = route === 'feedback' ? 'scales' : route === 'learn' ? 'forms' : /^study-/.test(route) ? 'study' : route === 'balance' ? 'scaleinfo' : route;
  let last = 'crib'; try { last = localStorage.getItem('b5adult:lastStudy') || 'crib'; } catch (e) {}
  const link = id => id === 'study' ? `#study-${last}` : `#${id}`;
  $('#nav').innerHTML = NAV_GROUPS.map(([gl, items]) => `<div class="ng ${items.some(([id]) => id === r) ? 'on' : ''}" style="--n:${items.length}" role="group" aria-label="${gl}"><span class="ng-l" aria-hidden="true">${gl}</span>${items.map(([id, label]) => `<a href="${link(id)}" class="${r === id ? 'on' : ''}" ${r === id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${NAV_IC[id]}</svg>${label}</a>`).join('')}</div>`).join('');
}

const ICON_FORM = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="4" rx="1.2"/><rect x="3" y="10" width="13" height="4" rx="1.2"/><rect x="3" y="16" width="16" height="4" rx="1.2"/></svg>';
const ICON_SCALE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/></svg>';
const ICON_PUZZLE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><path d="M14 16.5l2 2 4-4"/></svg>';
const ICON_MIC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const backTo = (route, label) => `<a class="back" href="#${route}">‹ ${label}</a>`;
function pageHead(title, sub, tag, ch) {
  if (ch) return `${tag || ''}<div class="ph-hero"><img class="ph-char bob" src="${CH(ch)}" alt=""><h1 class="ph">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div>`;
  return `${tag || ''}<div class="ph-row"><div><h1 class="ph">${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</div></div>`;
}

/* 삼지작법 3개의 얼굴: 색, 아이콘, 쓰는 때 */
const FORM_ICON = {
  CRIB: '<path d="M4 21h16"/><path d="M6.5 21V4.5a1.5 1.5 0 0 1 1.5-1.5h6"/><path d="M14 3l5 2v16"/><path d="M14 3v18"/><circle cx="16.4" cy="12.5" r=".95" fill="currentColor" stroke="none"/>',
  PREP: '<path d="M3 7.5 12 3l9 4.5"/><path d="M4 7.5h16"/><path d="M6.5 7.5v10M10.5 7.5v10M13.5 7.5v10M17.5 7.5v10"/><path d="M4 17.5h16M3 21h18"/>',
  AHWA: '<path d="M20.5 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.6a8 8 0 1 1 15.1-3.9z"/><path d="M13 8.5l-3 3 3 3"/><path d="M10 11.5h6"/>'
};
const CHOICE = {
  CRIB: { crit: '내가 먼저 말을 시작할 때', ex: '자기소개, 발표·건의의 첫 30초' },
  PREP: { crit: '내 생각을 주장할 때', ex: '강점, 지원 동기, 제안' },
  AHWA: { crit: '질문을 받고 행동으로 답할 때', ex: '"어떻게 해야 하나요?", "왜 그랬나요?"' }
};
function gtext(t) { return String(t).replace(/\{asker\}/g, persona().asker); }
function qReco(q) { const all = todaysQuestions().concat(Object.values(QUESTIONS).flatMap(o => Object.values(o).flat())); const f = all.find(x => x.q === (q && q.q)); return f ? f.form : null; }
function stepper(cur) {
  const sp = S.ui.speak, r = S.ui.result;
  const done = { forms: !!S.ui.formPicked, speak: !!(r && r.q && r.q.q === sp.q.q), scales: false };
  return `<ol class="stepper" aria-label="연습 단계">${[['forms', '짜기', STEP.forms.sub], ['speak', '말하기', STEP.speak.sub], ['scales', '재기', STEP.scales.sub]].map(([rt, l, d], i) =>
    `<li data-step="${rt}" class="${rt === cur ? 'cur' : done[rt] ? 'done' : ''}"><a href="#${rt}" ${rt === cur ? 'aria-current="step"' : ''}><span class="no">${done[rt] && rt !== cur ? '✓' : i + 1}</span><span class="lb"><b>${l}</b><small>${d}</small></span></a></li>`).join('')}</ol>`;
}
function qCard() {
  const sp = S.ui.speak;
  if (sp.q && sp.q.who !== '직접 쓴 질문' && !todaysQuestions().some(x => x.q === sp.q.q)) { sp.q = null; S.ui.formPicked = false; S.ui.formOpen = null; }
  if (!sp.q) { const q = currentQ(); sp.q = { who: q.who, q: q.q }; }
  const w = sp.q.who || '질문', wl = /질문$/.test(w) ? w : w + '의 질문';
  return `<div class="qbox sticky"><div class="between"><span class="who">${esc(wl)}</span><button class="textbtn" data-act="pickQ">질문 바꾸기</button></div><div class="q">“${esc(sp.q.q)}”</div></div>`;
}
function formGrid(k) {
  const L = FORMS[k].slots.map(x => x.key), P = [[13, 17.6], [35, 17.6], [13, 39.6], [35, 39.6]];
  return `<svg class="fgrid" viewBox="0 0 48 48" aria-hidden="true"><rect class="t" x="1" y="1" width="46" height="46" rx="13"/><path class="d" d="M24 7v34M7 24h34"/>${L.map((c, i) => `<text class="l" x="${P[i][0]}" y="${P[i][1]}" text-anchor="middle">${c}</text>`).join('')}</svg>`;
}
// 종인유 고유색: 칸마다 종(宗)·인(因)·유(喩) 중 무엇인지
const ROLE_OF = { CRIB: ['yu', 'in', 'jong', 'in'], PREP: ['jong', 'in', 'yu', 'jong'], AHWA: ['jong', 'in', 'in', 'jong'] };
const roleBg = (k, i) => `background:var(--${(ROLE_OF[k] || [])[i] || 'ink3'})`;
function fmono(k) { const f = { CRIB: 'crib', PREP: 'prep', AHWA: 'awha' }[k]; return `<span class="ficon" aria-hidden="true"><img src="icons/${f}.png?v=3" alt="" style="width:100%;height:100%;display:block"></span>`; }
function formTag(k, size) { const F = FORMS[k]; return `<span class="ftag ${size || ''}" data-form="${k}">${fmono(k)}${F.label}<small class="ftag-code" style="font-size:.7em;opacity:.6;margin-left:.35em;font-weight:600;letter-spacing:.02em">${F.code}</small></span>`; }
const STEP = {
  forms: { no: 1, name: '짜기', sub: '삼지작법 고르기', icon: () => ICON_FORM,
    body: '질문을 보고 그에 맞는 삼지작법 하나를 골라요. 받치는·답하는·여는 삼지작법 가운데 무엇으로 답할지 정하고, 네 칸에 떠오르는 단어만 메모하세요.',
    link: '' },
  speak: { no: 2, name: '말하기', sub: '삼지작법 익히기', icon: () => ICON_MIC,
    body: '고른 삼지작법의 네 칸을 실제로 말하듯이 한 문장씩 채우며 익혀요. 마이크로 말해도, 직접 써도 돼요. 목표 시간은 받치는 삼지작법 60초, 답하는 삼지작법 45초, 여는 삼지작법 30초예요.',
    link: '' },
  scales: { no: 3, name: '재기', sub: '삼지작법 점검하기', icon: () => ICON_SCALE,
    body: '방금 말한 답을 다섯저울(BALANCE 5)로 점검해요. 저울마다 두 접시가 균형을 이루면 듣는 사람의 의심이 풀려요. 가장 약한 저울 하나만 고쳐서 다시 말하세요.',
    link: '<span class="intro-link"><a href="#scaleinfo">다섯저울(BALANCE 5) 보기</a></span>' }
};
function stepIntro(k) { const t = STEP[k]; return introBox(t.icon(), `${t.no}단계 ${t.name} · ${t.sub}`, `${t.body}${t.link ? ' ' + t.link : ''}`); }
function introBox(icon, title, body) { return `<section class="brandbox"><span class="b-ic">${icon}</span><div><b>${title}</b><p>${body}</p></div></section>`; }

/* 홈 — 정체성: 누가 · 철학 · 방법 · 효과 */
function homeScores(id) {
  const p = PERSONAS[id];
  const ex = HOME_EX[id];
  const q = '';
  return { bad: scoreAnswer(p.reco, [p.bad, '', '', ''], q).total, good: scoreAnswer(p.reco, ex.slots, q).total, ex };
}
function viewHome() {
  const chosen = levelChosen();
  const id = whoId(), p = persona(), st = streak(), first = !S.history.length, open = S.ui.homeOpen || 'why', sc = homeScores(id);
  const row = (key, tag, title, body) => `
    <section class="irow ${open === key ? 'open' : ''}" data-k="${key}">
      <button class="irow-btn" data-act="homeOpen" data-v="${key}" aria-expanded="${open === key}" aria-controls="ir-${key}">
        <span class="tag">${tag}</span><span class="irow-t">${title}</span><span class="chev" aria-hidden="true"></span>
      </button>
      <div class="irow-body" id="ir-${key}" ${open === key ? '' : 'hidden'}>${body}</div>
    </section>`;
  return `
  <section class="hero">
    <h1 class="display d3"><span class="h-pre">생각과 글이 사라지는 시대,</span>내 말로 증명하라!</h1>
    <img class="hero-char bob" src="${CH('point_left')}" alt="">
    <ul class="slogan slist">
      <li>자료 정리는 AI가 해요. 이제는 <b>말로 증명</b>하는 힘이에요.</li>
      <li>첫 <b>30초</b>에 내 생각을 증명해 보세요.</li>
      <li>세 가지 <b>삼지작법</b>이면 “그래서요?” 같은 압박 질문에도 흔들리지 않아요.</li>
    </ul>
  </section>
  <div class="ilist">
    <div class="irow who ${chosen ? '' : 'need'}">
      <span class="irow-btn as-label"><span class="tag">누가</span><span class="irow-t">연습하는 사람</span></span>
      ${whoSelect('homeWho')}
    </div>
    ${chosen ? `<div class="irow who">
      <label class="irow-btn as-label" for="homeArea"><span class="tag">영역</span><span class="irow-t">연습할 영역</span></label>
      ${areaSelect('homeArea')}
    </div>` : ''}
    ${row('why', '철학', 'AI가 자료를 정리해도, 증명은 내 몫입니다', `
      <p class="body-tx">자료를 모으고 정리하는 일은 이제 AI가 대신해 줘요. 하지만 <b>무엇을 주장하고 왜 그렇게 판단했는지</b>는 대신 증명해 주지 못해요. 나를 평가하는 사람 앞에서는 내 생각을 내 말로 증명해야 해요. 그래서 이 앱은 자료 정리 잘하는 사람보다 <b>생각을 증명하는 사람</b>이 되도록 돕는 것을 목표로 해요.</p>
      <p class="body-tx">AI는 문제를 찾고 답도 내 줘요. 그 답을 그대로 믿지 말고 <b>주장·이유·사례로 따져 보는 것</b>까지가 이 앱에서 기르는 힘이에요.</p>`)}
    ${row('what', '방법', '짜고, 말하고, 잽니다', `
      <ol class="flow3">
        <li><a href="#forms"><b>1 짜기</b><span>삼지작법 고르기: 질문에 맞는 삼지작법을 골라 메모해요</span></a></li>
        <li><a href="#speak"><b>2 말하기</b><span>삼지작법 익히기: 메모를 보며 소리 내어 말해요</span></a></li>
        <li><a href="#scales"><b>3 재기</b><span>삼지작법 점검하기: 다섯저울로 짜임을 점검해요</span></a></li>
      </ol>
      <p class="body-tx small">한 질문으로 세 단계를 이어서 해요. 삼지작법은 ${formTag('PREP', 'sm')} ${formTag('AHWA', 'sm')} ${formTag('CRIB', 'sm')} 세 가지이고, 목표 시간은 받치는 삼지작법 60초, 답하는 삼지작법 45초, 여는 삼지작법 30초예요.</p>
      <p class="body-tx small"><b>삼지작법</b>은 불교 논리학(인명학)에서 말하는 종<small>(宗)</small> 주장·인<small>(因)</small> 이유·유<small>(喩)</small> 사례의 세 갈래예요. 이 세 갈래로 짠 네 칸을 먼저 말을 꺼낼 때, 주장할 때, 질문에 답할 때에 맞게 순서를 바꿔 써요. 답하는 삼지작법 <b>아하</b>(AWHA)는 행동(Action) → 이유(Why) → 방법(How) → 다시 행동(Action), 곧 종·인·유·종의 순서로 듣는 사람을 움직여요.</p>`)}
    ${row('use', '효과', `같은 경험, ${sc.bad}점이 ${sc.good}점으로`, `
      <div class="vs" aria-label="같은 경험, 다른 점수">
        <div class="vs-item bad"><span class="vs-score">${sc.bad}<small>/100</small></span><p>“${esc(p.bad)}”</p><span class="vs-tag">${esc(p.badTag)}</span></div>
        <div class="vs-item good"><span class="vs-score">${sc.good}<small>/100</small></span><p>“${esc(sc.ex.slots[sc.ex.hi])}”</p><span class="vs-tag">${esc(p.goodTag)}</span></div>
      </div>
      <p class="vs-note">왼쪽은 이 한 문장만 말했을 때, 오른쪽은 같은 경험을 ${FORMS[p.reco].label} 네 칸으로 말했을 때 잰 예시 점수예요. 오른쪽 문장은 네 칸 중 ${FORMS[p.reco].slots[sc.ex.hi].title} 칸이에요.</p>
      <details class="vs-full" data-form="${p.reco}"><summary>${sc.good}점을 받은 네 칸 전체 보기</summary><p class="vs-form" style="margin:6px 0 10px;font-size:.92em">이 예시는 ${formTag(p.reco, 'sm')}으로 말했어요.</p><ol>${FORMS[p.reco].slots.map((x, i) => `<li class="${i === sc.ex.hi ? 'hi' : ''}"><b><span class="vs-code" style="display:inline-block;min-width:1.3em;font-weight:800;letter-spacing:.02em">${FORMS[p.reco].code[i]}</span>${x.title}</b>${esc(sc.ex.slots[i])}</li>`).join('')}</ol></details>`)}
  </div>
  <section class="guide-more" aria-label="사용설명서 더 보기">
    <p class="gm-h">1분 사용설명서 더 보기</p>
      <div class="guide-pair">
        <button class="btn cta guide-btn" data-act="openGuide" data-v="learn"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M8 5l11 7-11 7z"/></svg></span><span class="gl"><small>② 익히기 편</small><b>보기</b></span></button>
        <button class="btn cta guide-btn alt" data-act="openGuideListen" data-v="learn"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></span><span class="gl"><small>② 익히기 편</small><b>보고 듣기</b></span></button>
      </div>
      <div class="guide-pair">
        <button class="btn cta guide-btn" data-act="openGuide" data-v="level"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M8 5l11 7-11 7z"/></svg></span><span class="gl"><small>③ 칸 늘리기 편</small><b>보기</b></span></button>
        <button class="btn cta guide-btn alt" data-act="openGuideListen" data-v="level"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></span><span class="gl"><small>③ 칸 늘리기 편</small><b>보고 듣기</b></span></button>
      </div>
  </section>
  <div class="cta-dock">
    <div class="guide-pair">
      <button class="btn cta guide-btn" data-act="openGuide"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="12" height="12" fill="#fff"><path d="M8 5l11 7-11 7z"/></svg></span><span class="gl"><small>1분 사용설명서</small><b>보기</b></span></button>
      <button class="btn cta guide-btn alt" data-act="openGuideListen"><span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></span><span class="gl"><small>1분 사용설명서</small><b>보고 듣기</b></span></button>
    </div>
    <button class="btn quick" data-act="startQ">바로 연습: ${esc(p.cta)}</button>
  </div>
  <p class="free">${first ? '무료, 가입 없이 바로 시작해요' : st > 1 ? `연속 ${st}일째 연습 중이에요` : '하루 1분이면 충분해요'}</p>`;
}

function slotEditors(F, sp) {
  const mic = !!Dict.d;
  return F.slots.map((s, i) => `
    <div class="slot fslot"><div class="k">${s.key}</div><div>
      <div class="between"><label class="t" for="ta${i}">${s.title}</label>${mic ? `<button class="mic" data-act="mic" data-i="${i}">🎤 말하기</button>` : ''}</div>
      <textarea id="ta${i}" data-slot="${i}" rows="2" placeholder="${esc(s.hint)}">${esc(sp.slots[i])}</textarea>
      <div class="tiny faint" id="partial-${i}"></div>
    </div></div>`).join('');
}
function questionFor(form) { const q = todaysQuestions().find(x => x.form === form) || Object.values(QUESTIONS).flatMap(o => Object.values(o).flat()).find(x => x.form === form); return { who: q.who, q: q.q }; }

/* 1 짜기 — 질문을 보고 삼지작법을 고르면, 순서의 이유와 메모 칸이 열린다 */
function viewForms() {
  const sp = S.ui.speak; qCard();
  const reco = qReco(sp.q), open = S.ui.formOpen || null;
  const order = reco ? [reco].concat(Object.keys(FORMS).filter(k => k !== reco)) : Object.keys(FORMS);
  if (!sp.memo) sp.memo = ['', '', '', ''];
  return `
  ${stepper('forms')}
  ${stepIntro('forms')}
  ${qCard()}
  <div class="ask-row"><img class="ask-char bob" src="${CH('think')}" alt=""><h2 class="ask">${reco && !S.ui.formPicked ? `이 질문에는 <span data-form="${reco}" class="ask-f">${FORMS[reco].label}</span>이 잘 맞아요` : '이 질문에는 어떤 삼지작법이 맞을까요?'}</h2></div>
  <a class="textlink dlink" href="#drill">삼지작법마다 순서가 헷갈리면 워드댄싱으로 익혀 보세요.</a>
  <div class="ftiles">${order.map((k, oi) => { const F = FORMS[k], G = FORM_GUIDE[k], on = open === k, ex = formEx(k); return `
    ${reco && oi === 1 ? '<p class="ftiles-sub">다른 삼지작법으로 답하고 싶다면</p>' : ''}<section class="ftile ${on ? 'open' : ''} ${reco === k && !on ? 'reco-hint' : ''}" data-form="${k}">
      <button class="ftile-btn" data-act="pickForm" data-v="${k}" aria-expanded="${on}">
        <span class="ftile-tx"><span class="fname">${fmono(k)}<span class="fl">${F.label}</span><span class="fcode">${F.code} · ${F.pron}</span><span class="ftime">${F.target}초</span>${reco === k ? '<em class="reco">추천</em>' : ''}</span><span class="fcrit">${CHOICE[k].crit}</span><span class="fex">${esc(persona().choiceEx[k])}</span></span>
      </button>
      ${on ? `<div class="ftile-body">
        ${F.order ? `<p class="forder" style="margin:0 0 10px;font-weight:700;letter-spacing:.01em">${esc(F.order)}</p>` : ''}
        <p class="why">${esc(gtext(G.why))}</p>
        <ol class="rules">${F.slots.map((x, i) => `<li>
          <span class="k" style="${roleBg(k, i)}">${x.key}</span>
          <div class="r-main"><p class="r-top"><b>${x.title}</b> ${esc(G.short[i])}</p>
          <p class="r-ex">예) ${esc(ex[i])}</p>
          <input type="text" class="memo-in" data-memo="${i}" value="${esc(sp.memo[i])}" placeholder="내 메모 (단어만 적어도 돼요)" aria-label="${x.title} 메모"></div></li>`).join('')}</ol>
        <details class="more"><summary>왜 이 순서일까요?</summary><ul>${F.slots.map((x, i) => `<li><b>${x.title}</b> ${esc(G.long[i])}</li>`).join('')}</ul></details>
        <p class="mistake"><b>흔한 실수</b> ${esc(G.mistake)}</p>
        <button class="btn tospeak" data-act="toSpeak" data-v="${k}">2단계 말하기로 넘기기</button>
        ${G.refNote ? `<div class="refbox"><p class="ref">추천도서 · 《${esc(G.ref.title)}》 ${esc(G.ref.by)}</p><b>${esc(G.refNote.q)}</b><p>${esc(gtext(G.refNote.a))}</p></div>` : `<p class="ref">추천도서 · 《${esc(G.ref.title)}》 ${esc(G.ref.by)}</p>`}
        <a class="btn ghost" href="#study-${{ CRIB: 'crib', PREP: 'prep', AHWA: 'awha' }[k]}" style="display:flex;align-items:center;justify-content:center;width:100%;margin-top:10px;text-decoration:none">${F.code} 더 공부하기</a>
      </div>` : ''}
    </section>`; }).join('')}</div>`;
}

/* 3 재기 — 2단계에서 '재기로 넘기기'를 누른 답을 다섯저울로 잰다 */
function resultBlock(r) {
  if (r.v !== 2 || !r.base) r = S.ui.result = Object.assign({}, r, scoreAnswer(r.form, r.slots, r.q));
  const F = FORMS[r.form], sel = S.ui.selScale || r.weakest, W = WEIGHT[r.form], g = grade(r.total), B = r.base;
  const sc = sel ? SCALES.find(x => x.id === sel) : null, idx = sel ? r.at[sel] : -1;
  const d = new Date(r.t), defs = SLOTDEFS[r.form];
  const roleRow = (x, i) => { const v = B.role[i]; return `<li class="${v >= 10 ? 'ok' : ''}"><span class="k" style="${roleBg(r.form, i)};color:#fff">${x.key}</span><span class="t"><b>${x.title}</b>${v >= 10 ? '' : `<small>${esc(defs[i].hint)}</small>`}</span><em>${v}<small>/10</small></em></li>`; };
  const better = r.better ? FORMS[r.better] : null;
  return `
  <section class="result" data-form="${r.form}">
    <div class="r-head">${formTag(r.form)}<span class="r-date">${d.getMonth() + 1}월 ${d.getDate()}일에 한 말</span></div>
    <p class="r-q">“${esc(r.q && r.q.q || '')}”</p>
    <div class="total"><img src="${CH(g[3])}" alt="" class="pop"><div><div class="n">${r.total}<small> / 100</small></div><div class="grade">${g[1]}</div><div class="small muted">${g[2]}</div></div></div>
    ${r.stage && r.stage < 4 ? `<div class="stage-next"><p><b>${['', '', '두', '세'][r.stage]} 칸 ${FORMS[r.form].slots.slice(0, r.stage).map(x => x.key).join('')}</b>까지 쟀어요. 칸 늘리기 연습이라 네 칸 점수는 낮게 나와도 괜찮아요.</p><button class="btn" data-act="stageUp">한 칸 더: ${FORMS[r.form].slots.slice(0, r.stage + 1).map(x => x.key).join('')} 말하기</button></div>` : ''}
    <div class="split"><span class="sp-s"><b>${r.bonus}</b>/30 다섯저울</span><span>+</span><span class="sp-b"><b>${B.total}</b>/70 기본 논리 점수</span></div>
    ${better ? `<div class="better"><p><b>이 답은 ${better.slots.map(x => x.title).join('-')} 짜임이라 ${better.label}에 더 잘 맞아요.</b> 같은 네 칸을 ${better.label}으로 다시 재 볼 수 있어요.</p><button class="btn ghost sm" data-act="rescoreAs" data-v="${r.better}">${better.label}로 다시 재기</button></div>` : ''}
    <div class="rbox rb-s">
    <h3 class="r-sub">다섯저울 가산점 <span>${r.bonus}/30</span></h3>
    ${SCALES.map(x => `<button class="scale" data-act="selScale" data-v="${x.id}" aria-pressed="${sel === x.id}"><b>${x.name}<i class="wt wt-${W[x.id]}">${wRole(r.form, x.id)}</i><small class="sq">${x.id === r.weakest ? '<span class="fixline">먼저 고칠 곳</span>' : ''}${x.q}</small></b>${segs(r.scores[x.id], x.id === r.weakest)}<em>${Math.round(r.pts[x.id])}<small>/${W[x.id]}</small></em></button>`).join('')}
    ${sc ? `<div class="why"><p style="margin:0 0 8px"><b>${sc.name} ${Math.round(r.pts[sel])}/${W[sel]}점</b> ${esc(r.why[sel])}</p>
      ${idx >= 0 && r.slots[idx] ? `<div class="quote"><span>${F.slots[idx].key} ${F.slots[idx].title}</span>${markNums(r.slots[idx])}</div>` : ''}</div>` : `<p class="small muted" style="margin:8px 0 0">저울을 누르면 이유와 내 문장이 보여요.</p>`}
    </div>
    <div class="rbox rb-b">
    <h3 class="r-sub">기본 논리 점수 <span>${B.total}/70</span></h3>
    <ul class="base">
      ${F.slots.map(roleRow).join('')}
      <li class="${B.answer >= 10 ? 'ok' : ''}"><span class="k">?</span><span class="t"><b>질문에 답함</b>${B.answer >= 10 ? '' : '<small>첫 칸에서 질문의 단어로 바로 답하세요.</small>'}</span><em>${B.answer}<small>/10</small></em></li>
      <li class="${B.same >= 10 ? 'ok' : ''}"><span class="k">=</span><span class="t"><b>끝맺음</b>${B.same >= 10 ? '' : `<small>${B.rep ? `마지막 칸이 첫 칸과 거의 같은 문장이에요. ${F.slots[3].title}은 같은 뜻을 다른 문장으로, 앞으로 할 일이나 바라는 행동으로 맺으세요.` : r.form === 'CRIB' ? '마지막 칸(이익)을 상대가 얻는 것이나 바라는 행동으로 맺으세요.' : `마지막 칸(${F.slots[3].title})을 첫 칸의 말이나 다음 행동으로 다시 맺으세요.`}</small>`}</span><em>${B.same}<small>/10</small></em></li>
      <li class="${B.link >= 10 ? 'ok' : ''}"><span class="k">~</span><span class="t"><b>연결과 완결</b>${B.link >= 10 ? '' : '<small>칸마다 끝까지 완성된 문장으로 말하세요.</small>'}</span><em>${B.link}<small>/10</small></em></li>
    </ul>
    </div>
    ${(() => { const ex = FORM_EX[whoId()] && FORM_EX[whoId()][r.form]; if (!ex) return ''; return `<details class="perfect"${r.total >= 100 ? '' : ''}><summary><span>더 높은 점수 예시 보기</span><small>${F.label} · ${esc(persona().label)}</small></summary>
      <p class="pf-note">다섯저울과 기본 논리를 고르게 채운 답이에요. 숫자, 버린 대안, 전과 후, 다음 행동이 어느 칸에 들어가는지 내 답과 비교해 보세요.</p>
      <ol class="pf">${F.slots.map((x, i) => `<li><span class="k" style="${roleBg(r.form, i)};color:#fff">${x.key}</span><div><b>${x.title}</b><p>${markNums(ex[i])}</p></div></li>`).join('')}</ol></details>`; })()}
    <p class="scope">다섯저울은 듣는 사람이 속으로 던질 <b>다섯 가지 의심</b>을 내 답이 미리 풀어 주는지 재고, ${F.label}에 중요한 저울일수록 점수가 커요. 기본 논리 점수는 ${F.label}의 네 칸이 제 역할을 하는지 봐요.</p>
    <p class="scope">점수는 말의 짜임을 돌아보는 <b>참고 자료</b>예요. 점수가 높다고 사실이 참인 건 아니고, 낮다고 생각의 가치가 없는 것도 아니에요. 근거가 맞는지, 실제로 해낼 수 있는지 한 번 더 따져 보세요.</p>
  </section>
  <div class="grid2 actions"><button class="btn ghost" data-act="retry">고쳐 말하기</button><button class="btn" data-act="newQuestion">새 질문으로</button></div>
  <button class="textbtn center" data-act="answerFollow">${persona().follow}에도 답해 보기</button>`;
}
function viewMeasure() {
  const r = S.ui.result, recs = speakRecs().slice().reverse();
  const list = recs.length ? `<h2 class="sec">지금까지 잰 답 ${recs.length}개</h2>
  <ul class="mlist">${recs.map(x => { const d = new Date(x.t); return `<li><button data-act="openRec" data-v="${x.id}" class="${r && r.id === x.id ? 'cur' : ''}">
    <span class="m-date">${d.getMonth() + 1}/${d.getDate()}</span>
    <span class="m-main"><span class="m-form" data-form="${x.form}">${FORMS[x.form].label}</span><span class="m-q">${esc(x.q && x.q.q || '')}</span></span>
    <span class="m-score">${x.total}<small>/100</small></span></button></li>`; }).join('')}</ul>` : '';
  return `
  ${stepper('scales')}
  ${stepIntro('scales')}
  ${r ? resultBlock(r) : `<div class="empty"><img class="bob" src="${CH('think')}" alt=""><h2>아직 잰 답이 없어요</h2><p>2단계 말하기에서 답을 쓰고 <b>재기로 넘기기</b>를 누르면, 그 답을 여기서 다섯저울로 재요.</p><button class="btn" data-act="go" data-v="${S.ui.formPicked ? 'speak' : 'forms'}">${S.ui.formPicked ? '2단계 말하기로' : '1단계 짜기부터'}</button></div>`}
  ${list}
`;
}

/* 다섯저울 설명 */
function viewScaleInfo() {
  const i = clamp(S.ui.scaleIdx || 0, 0, 4), sc = SCALES[i], lr = (SCALE_LR[whoId()] || SCALE_LR.adult)[sc.id];
  return `
  ${pageHead('다섯저울 · <span class="b5">BALANCE 5</span>', '듣는 사람은 속으로 다섯 번 의심해요. 저울마다 두 접시를 함께 올리면 그 의심이 풀려요.')}
  <div class="seg-tabs f s5" role="tablist" aria-label="저울 고르기">${SCALES.map((x, j) => `<button role="tab" aria-selected="${j === i}" data-act="scaleIdx" data-v="${j}"><span class="snum" aria-hidden="true">${j + 1}</span>${x.name}</button>`).join('')}</div>
  <h2 class="lp-h">${sc.name}</h2><p class="lp-sub">${sc.q}</p>
  <section class="card"><h2 class="sec" style="margin-top:0">두 접시</h2>
    <div class="si-pair">
      <div class="si-pan"><span class="lab">${esc(sc.L)}</span><p>${esc(lr[0])}</p></div>
      <img class="si-mid" src="${CH('compare')}" alt="">
      <div class="si-pan"><span class="lab">${esc(sc.R)}</span><p>${esc(lr[1])}</p></div>
    </div>
  </section>
  <section class="card"><h2 class="sec" style="margin-top:0">이렇게 채워요</h2>${tipHtml(sc.tip)}</section>
  ${sc.checks ? `<section class="card"><h2 class="sec" style="margin-top:0">심판 기준</h2><ol class="lol">${sc.checks.map(x => `<li>${esc(x)}</li>`).join('')}</ol><p class="note">셋 중 둘 이상 보이면 이 저울이 채워져요. 카드놀이의 저울 심판도 같은 기준으로 판정해요.</p></section>` : ''}
  ${sc.id === 'fact' ? `<section class="card"><h2 class="sec" style="margin-top:0">실천 전에 확인할 네 가지</h2><p class="body-tx" style="margin:0 0 8px">말이 잘 짜였다고 사실이 참이 되지는 않아요. 행동으로 옮기기 전에 물어보세요.</p><ol class="lol"><li>내가 확인한 <b>사실</b>은 무엇이고, 짐작은 무엇인가?</li><li>그 정보는 <b>언제, 어디서, 누구</b>에게서 나왔나?</li><li>그 정보가 <b>지금 이 상황</b>에도 맞나?</li><li>틀렸을 때 <b>누가 무엇을 잃고</b>, 어떻게 바로잡을 수 있나?</li></ol><p class="note">내가 센 숫자도 증거 하나예요. 사례 하나가 전체를 증명하지는 않으니, 같은 일이 또 있었는지, 반대 경우는 없는지도 찾아보세요.</p></section>` : ''}
  ${(window.BALANCE_READY || []).includes(sc.id) ? (S.ui.balOpen === sc.id && window.balInline ? `<button class="btn ghost mb8" data-act="balClose" aria-expanded="true">${sc.name} 저울 연습 닫기</button><div id="balInline">${window.balInline()}</div>` : `<button class="btn mb8" data-act="balStart" data-v="${sc.id}" aria-expanded="false">${sc.name} 저울 연습하기</button>`) : ''}
  <div class="pager">
    <button class="btn ghost" data-act="scaleIdx" data-v="${i - 1}" ${i === 0 ? 'disabled' : ''}>이전 저울</button>
    ${i < 4 ? `<button class="btn" data-act="scaleIdx" data-v="${i + 1}">다음 저울</button>` : `<button class="btn" data-act="go" data-v="scales">내 답 재러 가기</button>`}
  </div>`;
}

function tipHtml(t) {
  const [head, ...rest] = String(t).split('\n');
  return `<div class="si-tip"><p>${esc(head)}</p>${rest.length ? `<ul class="si-flow">${rest.map(x => { const k = x.indexOf(':'); return `<li><b>${esc(x.slice(0, k))}</b>${esc(x.slice(k + 1).trim())}</li>`; }).join('')}</ul>` : ''}</div>`;
}
/* 2 말하기 — 1단계에서 고른 삼지작법과 메모를 보며 실제로 말한다 */
function viewSpeak() {
  const sp = S.ui.speak; qCard(); if (!sp.memo) sp.memo = ['', '', '', ''];
  if (!S.ui.formPicked) return `${stepper('speak')}${stepIntro('speak')}${qCard()}
    <div class="empty"><img class="bob" src="${CH('point_left')}" alt=""><h2>먼저 삼지작법을 골라 주세요</h2><p>1단계 짜기에서 이 질문에 맞는 삼지작법을 고르면, 여기서 그 순서대로 말해요.</p><button class="btn" data-act="go" data-v="forms">1단계 짜기로</button></div>`;
  const F = FORMS[sp.form], mic = !!Dict.d, st = stageOf(), keys = F.slots.map(x => x.key);
  return `
  ${stepper('speak')}
  ${stepIntro('speak')}
  ${qCard()}
  <section class="speakpad" data-form="${sp.form}">
    <div class="pad-head">${formTag(sp.form, 'lg')}<a class="textbtn" href="#forms">삼지작법 바꾸기</a></div>
    <div class="stagebar" role="group" aria-label="칸 늘리기">${[2, 3, 4].map(n => `<button data-act="stage" data-v="${n}" aria-pressed="${st === n}"><b>${['', '', '두', '세', '네'][n]} 칸</b><span>${keys.slice(0, n).join('')}</span></button>`).join('')}</div>
    <p class="stage-tip">${st === 4 ? `네 칸을 모두 채워 ${F.target}초 안에 말해요.` : `${['', '', '두', '세'][st]} 칸: ${F.slots.slice(0, st).map(x => x.title).join(' + ')}만 말해요. 익숙해지면 한 칸을 더해요.`}</p>
    ${F.slots.slice(0, st).map((x, i) => `
    <div class="slot"><div class="k" style="${roleBg(sp.form, i)};color:#fff">${x.key}</div><div>
      <div class="between"><label class="t" for="ta${i}">${x.title}</label>${mic ? `<button class="mic" data-act="mic" data-i="${i}">🎤 말하기</button>` : ''}</div>
      ${sp.memo[i] ? `<div class="memo-line">메모: ${esc(sp.memo[i])}</div>` : ''}
      <textarea id="ta${i}" data-slot="${i}" rows="2" placeholder="${esc(x.hint)}">${esc(sp.slots[i])}</textarea>
      <div class="tiny faint" id="partial-${i}"></div>
    </div></div>`).join('')}
    <div class="est" id="est"></div>
    <button class="btn" data-act="score" id="scoreBtn">3단계 재기로 넘기기</button>
    <p class="tiny muted center" id="scoreHint" style="margin:6px 0 0">두 칸 이상 채우면 잴 수 있어요.</p>
    <div class="row-links">${S.cards.length ? `<button class="textbtn" data-act="fromCard">경험카드에서 불러오기</button>` : ''}<button class="textbtn muted" data-act="clearSlots">지우기</button></div>
  </section>`;
}
function updateEstimate() {
  const el = $('#est'); if (!el) return;
  const sp = S.ui.speak, F = FORMS[sp.form], st = stageOf(), sl = sp.slots.map((x, i) => i < st ? x : ''), sec = estSeconds(sl), pct = clamp(sec / F.target * 100, 0, 100);
  el.innerHTML = `<span>예상 말하기 ${sec}초</span><span class="bar"><i class="${sec > F.target * 1.3 ? 'over' : ''}" style="width:${pct}%"></i></span><span>목표 ${F.target}초</span>`;
  const n = sl.filter(x => x.trim()).length, b = $('#scoreBtn'), h = $('#scoreHint');
  if (b) b.disabled = n < 2;
  if (h) h.textContent = n < 2 ? `두 칸 이상 채우면 잴 수 있어요. 지금 ${n}칸` : (n < st ? `지금 ${n}칸. ${st}칸을 다 채우면 ${st === 4 ? '기본 논리 점수가 올라가요.' : '이 단계를 끝낼 수 있어요.'}` : '');
}

function markNums(t) { return esc(t).replace(/\d[\d,.]*\s*(%|퍼센트|명|건|원|만\s?원|억|시간|분|초|일|주|개월|달|년|배|kg|점|개|회|곳|종)?/g, m => `<mark>${m}</mark>`); }

/* 워드댄싱 문제 목록 · 푼 문제 기록 */
function drillList(f) { const D = S.ui.drill, L = DRILL[f || D.form].adultList; return L && L.length ? L : [DRILL[f || D.form][D.who || whoId()]]; }
function drillCur() { const D = S.ui.drill, L = drillList(); D.idx = D.idx || {}; const i = Math.min(D.idx[D.form] || 0, L.length - 1); return L[i]; }
const DRILL_DONE_KEY = 'b5adult:drillDone';
function drillDone() { try { return JSON.parse(localStorage.getItem(DRILL_DONE_KEY) || '{}'); } catch (e) { return {}; } }
const DRILL_STATE_KEY = 'b5adult:drillState';
function drillStates() { try { return JSON.parse(localStorage.getItem(DRILL_STATE_KEY) || '{}'); } catch (e) { return {}; } }
function saveDrillState(id, st) { try { const all = drillStates(); if (st) all[id] = st; else delete all[id]; localStorage.setItem(DRILL_STATE_KEY, JSON.stringify(all)); } catch (e) {} }
const DRILL_BLANK = () => ({ placed: [null, null, null, null], checked: false, target: 0, introDone: false, hint: 0 });
/* 문제가 바뀌면 그 문제의 저장 상태를 불러와요: 풀던 문제는 이어서, 맞힌 문제는 정답 배치로 */
function syncDrillState(cur) {
  const D = S.ui.drill; if (!cur || !cur.id || D.curId === cur.id) return;
  D.curId = cur.id;
  let st = drillStates()[cur.id];
  if (!st && drillDone()[cur.id]) st = { placed: [0, 1, 2, 3].map(i => cur.chunks.find(c => c.ans === i).id), checked: true, target: null, introDone: true, hint: 0 };
  Object.assign(D, DRILL_BLANK(), st || {});
}
function markDrillDone(id) { try { const d = drillDone(); d[id] = 1; localStorage.setItem(DRILL_DONE_KEY, JSON.stringify(d)); } catch (e) {} }

function viewDrill() {
  const D = S.ui.drill; if (!D.who || !DRILL[D.form][D.who]) D.who = whoId();
  D.idx = D.idx || {}; const L = drillList(), qi = Math.min(D.idx[D.form] || 0, L.length - 1), done = drillDone();
  const cur = drillCur(), defs = SLOTDEFS[D.form], byId = {};
  syncDrillState(cur);
  if (cur.id) { const has = D.placed.some(x => x != null) || D.hint; saveDrillState(cur.id, has ? { placed: D.placed, checked: D.checked, target: D.target, introDone: D.introDone, hint: D.hint || 0 } : null); }
  const states = drillStates();
  cur.chunks.forEach(c => byId[c.id] = c);
  const res = D.placed.map((id, i) => id != null && byId[id].ans === i), right = res.filter(Boolean).length;
  const solved = D.checked && right === 4, full = D.placed.every(x => x != null);
  const pool = cur.chunks.filter(c => !D.placed.includes(c.id));
  const trap = cur.chunks.find(c => c.ans === -1);
  let pose = 'think', msg = '문장 조각 다섯 개 중 네 개를 순서대로 칸에 넣으세요. <b>하나는 함정</b>이에요.';
  if (D.checked && solved) { pose = 'joy'; msg = '정답이에요! 이 순서로 말하면 됩니다.'; }
  else if (D.checked) { pose = 'stop'; msg = `${right}칸이 맞았어요. 주황색 칸의 설명을 보고 다시 옮겨 보세요.`; }
  return `
  ${pageHead('워드댄싱', '문장 조각을 눌러 네 칸에 순서대로 넣으세요. 하나는 함정이에요.')}
  <div class="seg-tabs f" role="tablist" aria-label="삼지작법 고르기">${Object.keys(FORMS).map(x => `<button role="tab" aria-selected="${x === D.form}" data-act="drillForm" data-v="${x}" data-form="${x}">${fmono(x)}${FORMS[x].label}</button>`).join('')}</div>
  <h2 class="lp-h">${FORMS[D.form].label} · ${FORMS[D.form].code}</h2><p class="lp-sub">${FORMS[D.form].when}${L.length > 1 ? ` · 문제 ${qi + 1}/${L.length}` : ''}</p>
  <section class="card"><h2 class="sec" style="margin-top:0">질문</h2><p class="lq">${esc(cur.question)}</p></section>
  <section class="card"><h2 class="sec" style="margin-top:0">네 칸</h2>
  <div class="lmsg"><img class="${D.checked ? 'pop' : ''}" src="${CH(pose)}" alt=""><p>${msg}</p></div>
  ${(() => { if (D.target == null || D.placed[D.target] != null) { const e = D.placed.indexOf(null); D.target = e < 0 ? null : e; } return ''; })()}
  <div class="dslots ${!D.introDone && D.placed.every(x => x == null) ? 'dintro' : ''}" data-form="${D.form}">
  ${defs.map((s, i) => {
    const id = D.placed[i], c = id != null ? byId[id] : null, st = D.checked && c ? (res[i] ? 'ok' : 'bad') : (c ? '' : (!solved && D.target === i ? 'target' : ''));
    return `<button class="slot fslot ${st}" data-tone="${s.tone}" style="--sd:${0.15 + i * 0.45}s;width:100%;text-align:left" data-act="unplace" data-i="${i}" ${!solved ? '' : 'aria-disabled="true"'} aria-label="${s.title} 칸"><div class="k">${s.key}</div><div><div class="t">${s.title}</div>${c ? `<div class="placed">${esc(c.text)}</div>` : `<div class="h">${esc(s.pick)}</div>`}${D.checked && c && !res[i] ? `<div class="h" style="color:var(--orange);margin-top:4px">${esc(s.hint)}</div>` : ''}</div></button>`;
  }).join('')}
  </div>
  </section>
  <section class="card"><h2 class="sec" style="margin-top:0">${!solved ? `문장 조각 <span class="faint small" style="font-weight:600">${D.target != null ? `<b class="dnow">${defs[D.target].title}</b> 칸에 넣을 조각을 고르세요` : '칸을 누르면 조각이 되돌아와요'}</span>` : '함정'}</h2>
  ${!solved && cur.hint ? `<div class="dhint note">${D.hint ? `<p><b>힌트</b> ${esc(cur.hint)}</p>${D.hint > 1 && D.target != null ? (() => { const a = cur.chunks.find(c => c.ans === D.target); const w = a ? a.text.split(' ').slice(0, 2).join(' ') : ''; return `<p><b>${esc(defs[D.target].title)} 칸</b> 첫 말은 “${esc(w)} …”예요.</p>`; })() : ''}` : ''}${(D.hint || 0) < 2 ? `<button class="link" data-act="drillHint">${D.hint ? '힌트 하나 더' : '힌트 보기'}</button>` : ''}</div>` : ''}
  ${!solved ? `<div class="mt12">${pool.map(c => `<button class="chunk" data-act="place" data-v="${c.id}">${esc(c.text)}</button>`).join('')}</div>` : `
    <p class="lq" style="font-size:15.5px">“${esc(trap.text)}”</p><p class="note">${esc(cur.trapWhy)}</p>`}
  </section>
  <div class="mt12">
  ${solved ? `<button class="btn mb8" data-act="drillNext">${qi < L.length - 1 ? `다음 문제 (${qi + 2}/${L.length})` : '다음 삼지작법으로'}</button><button class="link" data-act="drillReset" style="width:100%">다시 풀어 보기</button>`
      : `<button class="btn mb8" data-act="drillCheck" ${full ? '' : 'disabled'}>확인</button>${D.placed.some(x => x != null) ? `<button class="link" data-act="drillReset" style="width:100%">처음부터 다시</button>` : ''}`}
  </div>
  ${L.length > 1 ? `<div class="dprog" role="group" aria-label="문제 진행 상황">${L.map((it, i) => { const part = !done[it.id] && states[it.id] && (states[it.id].placed || []).some(x => x != null); return `<button class="${i === qi ? 'cur' : ''} ${done[it.id] ? 'done' : ''} ${part ? 'part' : ''}" data-form="${D.form}" data-act="drillGo" data-v="${i}" aria-label="${i + 1}번 문제${done[it.id] ? ' · 맞힘' : part ? ' · 푸는 중' : ''}" ${i === qi ? 'aria-current="step"' : ''}>${i + 1}</button>`; }).join('<i aria-hidden="true"></i>')}</div>` : ''}`;
}

function viewCards() {
  const p = persona(), samples = SAMPLE_CARDS[whoId()];
  const myCards = S.cards.filter(c => c.source !== 'sample' || c.who === whoId());
  const mine = myCards.length ? `<ul class="clist">${myCards.slice().reverse().map(c => {
    const miss = ['sit', 'prob', 'judge', 'act', 'res', 'learn'].filter(k => !(c[k] || '').trim()).length;
    return `<li><button data-act="openCard" data-v="${c.id}"><b>${esc(c.title || '제목 없음')}</b><span>${esc(c.res || c.sit || '')}</span>${miss ? `<em class="warn">${miss}칸 비어 있음</em>` : ''}</button></li>`; }).join('')}</ul>`
    : `<p class="body-tx muted">아직 내 카드가 없어요. 아래 예시를 열어 보거나 바로 만들어 보세요.</p>`;
  return `
  ${pageHead('경험카드', '경험 하나를 여섯 칸에 적어 두면, 어떤 질문을 받아도 삼지작법으로 꺼내 쓸 수 있어요.', '', 'point_right2')}
  <button class="btn" data-act="newCard">새 경험카드 만들기</button>
  <h2 class="sec">내 카드</h2>
  ${mine}
  <h2 class="sec">${p.label} 예시 카드</h2>
  <ul class="clist sample">${samples.map((c, i) => `<li><button data-act="openSample" data-v="${i}"><b>${esc(c.title)}</b><span>${esc(c.res)}</span></button></li>`).join('')}</ul>`;
}

/* 기록 — 모듈 1개: 내 점수의 흐름 (날짜별 / 저울별) */
function viewReport() {
  if (!S.history.length) return `
  ${pageHead('기록', '', '', 'joy')}
  <div class="card empty"><img class="bob" src="${CH('point_left')}" alt=""><h2 class="mt8">아직 기록이 없어요</h2>
  <p class="small muted">한 번 답하고 점검받으면 여기에 쌓여요.</p>
  <button class="btn" data-act="go" data-v="speak">말하기 시작</button></div>`;
  const tab = S.ui.reportTab || 'day', recs = speakRecs();
  const tabs = `<div class="seg-tabs s" role="tablist">${[['day', '날짜별'], ['scale', '저울별']].map(([k, l]) => `<button role="tab" aria-selected="${tab === k}" data-act="reportTab" data-v="${k}">${l}</button>`).join('')}</div>`;
  if (tab === 'day') {
    const st = streak(), best = recs.length ? Math.max(...recs.map(r => r.total)) : 0;
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(todayKey(d)); }
    const byDay = {}; S.history.forEach(h => { (byDay[h.day] = byDay[h.day] || []).push(h); });
    const sel = S.ui.report.sel;
    const bars = days.map(k => {
      const list = byDay[k] || [], sp = list.filter(h => h.kind === 'speak'), v = sp.length ? Math.max(...sp.map(h => h.total)) : 0;
      const rest = !list.length, h = rest ? 0 : Math.max(8, v);
      const lab = `${k.slice(5).replace('-', '/')} ${rest ? '쉰 날' : sp.length ? `최고 ${v}/100` : `워드댄싱 ${list.length}개`}`;
      return `<button class="${rest ? 'rest' : ''} ${sel === k ? 'sel' : ''}" data-act="selDay" data-v="${k}" aria-label="${lab}" title="${lab}"><i style="height:${rest ? 6 : h}%;${!rest && !sp.length ? 'background:#A9CDB8' : ''}"></i></button>`;
    }).join('');
    let detail = '막대를 누르면 그날 기록이 보여요.';
    if (sel) { const list = byDay[sel] || []; detail = list.length ? `<b>${sel.slice(5).replace('-', '/')}</b> · ` + list.map(h => h.kind === 'speak' ? `${FORMS[h.form].label} ${h.total}점` : `워드댄싱 ${h.right}/4`).join(', ') : `${sel.slice(5).replace('-', '/')} · 쉰 날`; }
    return `${pageHead('기록', '날마다 잰 점수와, 저울별로 나아진 곳을 보여 줘요.', '', 'joy')}${tabs}
    <div class="grid2 mb8"><div class="stat"><b>${st}일</b><span>연속 연습</span></div><div class="stat"><b>${best || '–'}<small style="font-size:13px;color:var(--muted)">/100</small></b><span>최고 점수</span></div></div>
    <section class="card"><div class="chart" role="group" aria-label="최근 14일 점수">${bars}</div>
      <div class="between tiny faint mt8"><span>${days[0].slice(5).replace('-', '/')}</span><span>오늘</span></div>
      <p class="small mb0 mt8" aria-live="polite">${detail}</p></section>`;
  }
  const last = recs[recs.length - 1], weak = last ? last.weakest : null;
  let rows = `<p class="small muted mb0">점검이 두 번 이상 쌓이면 저울별 변화가 보여요.</p>`;
  if (recs.length >= 2) {
    const k = Math.min(3, Math.floor(recs.length / 2)) || 1, a = recs.slice(0, k), b = recs.slice(-k);
    const avg = (arr, id) => Math.round(arr.reduce((s, r) => s + r.scores[id], 0) / arr.length * 10) / 10;
    rows = SCALES.map(sc => { const x = avg(a, sc.id), y = avg(b, sc.id), d = Math.round((y - x) * 10) / 10; return `<div class="scale" style="grid-template-columns:84px 1fr auto"><b>${sc.name}</b><span class="small muted">${x} → ${y}점</span><em style="color:${d > 0 ? 'var(--green)' : d < 0 ? 'var(--orange)' : 'var(--faint)'}">${d > 0 ? '+' + d : d === 0 ? '±0' : d}</em></div>`; }).join('');
  }
  return `${pageHead('기록', '날마다 잰 점수와, 저울별로 나아진 곳을 보여 줘요.', '', 'joy')}${tabs}
  <section class="card">${rows}</section>
  ${weak ? `<button class="btn" data-act="reco" data-v="${weak}">약한 저울 '${SCALES.find(x => x.id === weak).name}' 연습하기</button>` : ''}`;
}

function sheetOnboard() {
  openSheet(`<div style="text-align:center"><img class="bob" src="${CH('jump')}" alt="" style="width:150px"><h2 class="mt8" style="font-size:20px">안녕하세요! 저는 밸런스예요</h2>
  <p class="small muted">말로 증명하는 연습을 함께 할게요.<br>누가 연습하나요? 맞는 질문과 예시를 골라 드려요.</p></div>
  <div class="mt12">${whoChips(S.profile.who, 'setWho')}</div>
  <p class="note" style="text-align:center">나중에 메뉴(☰)에서 바꿀 수 있어요.</p>`, null, 'onboard');
}
function storageLine() {
  const web = !!(window.B5 && window.B5.auth);
  if (Store.mode === 'cloud') return web ? '내 계정에 저장돼요. 다른 기기에서 로그인해도 기록이 이어져요.' : '내 Claude 계정에 저장돼요. 다른 기기에서 이 링크를 열어도 기록이 이어져요.';
  return web ? '로그인하지 않아 이 브라우저에만 저장돼요. 로그인하면 지금 기록이 계정으로 옮겨져요.' : '이 브라우저에만 저장돼요. 기기를 바꾸기 전에 기록을 내보내 두세요.';
}
function accountBlock() {
  if (!(window.B5 && window.B5.auth)) return '';
  const a = Store.account;
  if (a) return `<div class="card flat"><div class="between"><div><b class="small">로그인됨</b><div class="small muted">${esc(a.name || a.email || '내 계정')}</div></div><button class="btn ghost small" data-act="logout">로그아웃</button></div></div>`;
  return `<div class="card flat"><b class="small">로그인</b><p class="small muted" style="margin:2px 0 10px">로그인하면 카드와 기록이 계정에 저장돼요.</p>
    <button class="btn mb8" data-act="login" data-v="kakao" style="background:#FEE500;color:#191919">카카오로 시작하기</button>
    <button class="btn ghost" data-act="login" data-v="google">Google로 시작하기</button></div>`;
}
function renderMenuState() { const el = $('#storeLine'); if (el) el.textContent = storageLine(); }
function sheetMenu(confirmClear) {
  const route = (location.hash || '#home').slice(1) || 'home';
  openSheet(`<h2>이동과 설정</h2>
  <nav class="pagelist" aria-label="페이지 목차">${[['home', 'forms', 'speak', 'scales'], ['drill', 'scaleinfo', 'cards', 'report']].map(col => `<div class="pcol">${col.map(id => { const [, l, d] = PAGES.find(x => x[0] === id); return `<a href="#${id}" data-act="goPage" data-v="${id}" data-p="${id}" class="${route === id ? 'on' : ''}" ${route === id ? 'aria-current="page"' : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${NAV_IC[id]}</svg><span><b>${l}</b><small>${d}</small></span></a>`; }).join('')}</div>`).join('')}</nav>
  <h3 class="menu-sub">설정</h3>
  ${accountBlock()}
  <div class="card flat"><b class="small">저장 위치</b><p class="small muted mb0" id="storeLine">${storageLine()}</p></div>
  <div class="grid2 mb8"><button class="btn ghost small" style="width:100%" data-act="exportData">기록 내보내기</button><label class="btn ghost small" style="width:100%">기록 가져오기<input type="file" accept="application/json,.json" id="importFile" class="sr"></label></div>
  <div id="exportBox"></div>
  ${confirmClear ? `<div class="card" style="border-color:var(--orange)"><p class="small" style="margin:0 0 10px">카드 ${S.cards.length}장과 기록 ${S.history.length}개를 모두 지울까요? 되돌릴 수 없어요.</p><div class="grid2"><button class="btn ghost small" style="width:100%" data-act="menu">취소</button><button class="btn danger small" style="width:100%" data-act="clearAll">모두 지우기</button></div></div>`
      : `<div style="text-align:center"><button class="clearbtn" data-act="askClear">기록 모두 지우기</button></div>`}
  <hr style="border:none;border-top:1px solid var(--line);margin:14px 0">
  <p class="tiny faint mb0"><b>BALANCE 5</b>는 생각과 글이 사라지는 시대에 내 생각을 내 말로 증명하는 말하기 연습 앱이에요. 삼지작법은 진나의 인명학을 현대 말하기에 맞게 응용한 것이에요. 점수는 앱이 정해진 기준(다섯저울)에 따라 자동으로 매겨요.</p>`, sh => {
    const f = $('#importFile', sh); if (f) f.addEventListener('change', async () => { const file = f.files[0]; if (!file) return; importText(await file.text()); });
  });
}
function importText(text) {
  try {
    const o = JSON.parse(text);
    if (!o || (!Array.isArray(o.cards) && !Array.isArray(o.history))) throw 0;
    S.cards = mergeById(S.cards, o.cards || []); S.history = mergeById(S.history, o.history || []);
    if (o.profile && o.profile.who) S.profile.who = o.profile.who;
    if (o.profile && o.profile.area) S.profile.area = o.profile.area;
    Store.save('profile', 'history', 'cards'); closeSheet(); render(); toast(`카드 ${(o.cards || []).length}장, 기록 ${(o.history || []).length}개를 가져왔어요.`, 'joy');
  } catch (e) { toast('파일을 읽지 못했어요. 이 앱에서 내보낸 파일인지 확인해 주세요.', 'surprised'); }
}
async function exportData() {
  const data = JSON.stringify({ app: 'balance5', v: 1, at: new Date().toISOString(), profile: S.profile, cards: S.cards, history: S.history }, null, 1);
  const fname = `말로증명하라_기록_${todayKey()}.json`;
  if (window.B5 && window.B5.download) { window.B5.download(fname, data); toast('기록 파일을 저장했어요.', 'thumbs'); return; }
  try {
    const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
    if (dl) { await dl.save({ filename: fname, data }); toast('기록 파일을 저장했어요.', 'thumbs'); return; }
  } catch (e) { /* declined or unavailable → copy fallback */ }
  const box = $('#exportBox'); if (!box) return;
  box.innerHTML = `<p class="small muted">아래 내용을 복사해 메모장에 붙여 넣고 .json 파일로 저장하세요.</p><textarea rows="5" readonly id="exportTa">${esc(data)}</textarea><button class="btn soft small mt8" data-act="copyExport">복사하기</button>`;
}

function sheetPickQ() {
  const lv = levelId(), order = [areaId()].concat(LEVEL_AREAS[lv].filter(a => a !== areaId()));
  openSheet(`<h2>질문 고르기</h2>
  <div class="field"><label for="customQ">직접 쓰기</label><div class="row"><input type="text" id="customQ" placeholder="예: ${esc(todaysQuestions()[0].q)}"><button class="btn small" data-act="useCustomQ">쓰기</button></div></div>
  ${order.map(w => `<h2 class="mt16 small" style="font-size:14px">${LEVELS[lv].label} · ${AREAS[w].label} 질문</h2>
    ${QUESTIONS[lv][w].map((q, i) => `<button class="chunk" data-act="useQ" data-v="${w}:${i}"><span class="tiny muted">${esc(q.who)} · 추천 ${FORMS[q.form].label}</span><br>${esc(q.q)}</button>`).join('')}`).join('')}`);
}
function sheetFromCard() {
  openSheet(`<h2>경험카드에서 불러오기</h2><p class="small muted">${FORMS[S.ui.speak.form].label} 칸에 맞춰 카드 내용을 넣어 드려요. 그다음 말하듯이 고치세요.</p>
  ${S.cards.slice().reverse().map(c => `<button class="xcard" data-act="useCard" data-v="${c.id}"><span class="t">${esc(c.title || '제목 없음')}</span><div class="small muted">${esc(c.res || '')}</div></button>`).join('')}`);
}
function cardSlots(c, form) {
  return CARD_VIEWS[form].slots.map(s => {
    const t = s.f.map(k => (c[k] || '').trim()).filter(Boolean).join(', ');
    if (!t) return '';
    if (s.post) { const u = t.replace(/[.。\s]+$/, ''); return '그래서 앞으로도 ' + (/다$/.test(u) ? u + '는 원칙으로 해 나가겠습니다.' : u + ', 이 원칙으로 해 나가겠습니다.'); }
    return t;
  });
}
function sheetCard(id, view) {
  const isSample = String(id).startsWith('sample-');
  const c = isSample ? SAMPLE_CARDS[whoId()][+String(id).slice(7)] : S.cards.find(x => x.id === id); if (!c) return;
  view = view || 'raw';
  const V = CARD_VIEWS[view], vals = view === 'raw' ? V.slots.map(s => c[s.f[0]] || '') : cardSlots(c, view);
  openSheet(`<div class="between"><h2 class="mb0">${esc(c.title || '제목 없음')}</h2>${c.source === 'ai' ? '<span class="pill">AI 작업에서</span>' : ''}</div>
  <p class="small muted">${esc(c.qs || '')}</p>
  <div class="tabs" role="group">${Object.keys(CARD_VIEWS).map(k => `<button data-act="cardView" data-v="${id}|${k}" aria-pressed="${k === view}">${CARD_VIEWS[k].label}</button>`).join('')}</div>
  <p class="tiny muted" style="margin:-4px 0 8px">${V.when}${view !== 'raw' ? ` · ${FORMS[view].code} · 목표 ${FORMS[view].target}초` : ''}</p>
  ${V.slots.map((s, i) => `<div class="slot fslot ${vals[i] ? '' : 'bad'}"><div class="k">${s.key}</div><div><div class="t">${s.title}</div><div class="placed">${vals[i] ? esc(vals[i]) : '<span style="color:var(--orange)">비어 있어요. 편집에서 채워 주세요.</span>'}</div></div></div>`).join('')}
  ${c.ai ? `<div class="tip"><div><p class="mb0" style="margin:0"><b>AI가 한 일:</b> ${esc(c.ai)}</p>${c.check ? `<p class="mb0" style="margin:4px 0 0"><b>확인 필요:</b> ${esc(c.check)}</p>` : ''}</div></div>` : ''}
  <button class="btn mb8" data-act="cardSpeak" data-v="${id}|${view === 'raw' ? 'PREP' : view}">${view === 'raw' ? '받치는 삼지작법으로 말하기' : V.label + '으로 말하기'}</button>
  ${isSample ? `<button class="btn ghost" data-act="importSample" data-v="${String(id).slice(7)}">내 카드로 가져오기</button>` : `<div class="grid2"><button class="btn ghost small" style="width:100%" data-act="editCard" data-v="${id}">편집</button><button class="btn ghost small" style="width:100%;color:var(--ember)" data-act="delCard" data-v="${id}">삭제</button></div>
  <div id="delBox"></div>`}`);
}
const Editor = { draft: null, mode: 'manual', pasted: '', msg: '' };
function emptyDraft() { return { id: null, title: '', sit: '', prob: '', judge: '', act: '', res: '', learn: '', qs: '', ai: '', check: '', source: 'manual' }; }
function sheetEditor() {
  const d = Editor.draft, m = Editor.mode;
  const qsel = (d.qs || '').split(',').map(x => x.trim()).filter(Boolean);
  openSheet(`<h2>${d.id ? '경험카드 편집' : '새 경험카드'}</h2>
  ${d.id ? '' : `<div class="grid2 mb8"><button class="chip" data-act="edMode" data-v="manual" aria-pressed="${m === 'manual'}">직접 쓰기</button><button class="chip" data-act="edMode" data-v="ai" aria-pressed="${m === 'ai'}">AI 작업에서 가져오기</button></div>`}
  ${m === 'ai' && !d.id ? `
    <div class="card flat"><b class="small">① 쓰던 AI 대화창에 이 프롬프트를 붙여 넣으세요</b><pre class="prompt">${esc(AI_PROMPT)}</pre><button class="btn soft small" data-act="copyPrompt">프롬프트 복사</button></div>
    <div class="card flat"><div class="between"><b class="small">② AI의 답을 그대로 붙여 넣으세요</b><button class="link" data-act="sampleAI">예시 답 넣기</button></div>
    <textarea id="pasteTa" rows="7" placeholder="[경험카드]\n제목: ...">${esc(Editor.pasted)}</textarea>
    ${Editor.msg ? `<p class="small" style="color:var(--orange);margin:6px 0 0">${esc(Editor.msg)}</p>` : ''}</div>
    <button class="btn" data-act="parseAI">③ 카드 만들기</button>` : `
    ${d.source === 'ai' ? `<div class="tip"><img class="char-sm" src="${CH('point_right2')}" alt=""><div><p>AI 답으로 칸을 채웠어요. 확인하고 맨 아래 <b>카드 저장</b>을 누르세요.</p><p class="muted" style="margin:0">'판단'과 '행동'에는 내가 직접 한 것만 남기세요. 질문하는 사람은 바로 그 부분을 물어요.</p></div></div>` : ''}
    ${CARD_FIELDS.map(f => f.key === 'qs' ? `<div class="field"><label>${f.label} <small>${f.uses}</small></label><input type="text" data-field="qs" value="${esc(d.qs)}" placeholder="${esc(f.ph)}">
      <div class="qchips">${Q_EXAMPLES.map(q => `<button data-act="toggleQ" data-v="${esc(q)}" aria-pressed="${qsel.includes(q)}">${esc(q)}</button>`).join('')}</div></div>`
      : `<div class="field"><label for="f-${f.key}">${f.label} ${f.uses ? `<small>${f.uses}</small>` : ''}</label>${f.key === 'title' ? `<input type="text" id="f-${f.key}" data-field="${f.key}" value="${esc(d[f.key])}" placeholder="${esc(f.ph)}">` : `<textarea id="f-${f.key}" data-field="${f.key}" rows="2" placeholder="${esc(f.ph)}">${esc(d[f.key])}</textarea>`}</div>`).join('')}
    ${d.source === 'ai' ? `<div class="field"><label>AI가 한 일</label><textarea data-field="ai" rows="2">${esc(d.ai)}</textarea></div><div class="field"><label>확인 필요</label><textarea data-field="check" rows="2">${esc(d.check)}</textarea></div>` : ''}
    ${Editor.msg ? `<p class="small" style="color:var(--orange)">${esc(Editor.msg)}</p>` : ''}
    <button class="btn" data-act="saveCard">카드 저장</button>`}`);
}
function parseAnswer(text) {
  const map = { '제목': 'title', '상황': 'sit', '배경': 'sit', '문제': 'prob', '과제': 'prob', '문제 상황': 'prob', '판단': 'judge', '선택 기준': 'judge', '판단 근거': 'judge', '행동': 'act', '내가 한 일': 'act', '실행': 'act', '결과': 'res', '성과': 'res', '수치': 'res', '배운 것': 'learn', '배운 점': 'learn', '교훈': 'learn', '답할 질문': 'qs', 'AI가 한 일': 'ai', 'AI 역할': 'ai', '확인 필요': 'check' };
  const names = Object.keys(map).sort((a, b) => b.length - a.length).join('|');
  const re = new RegExp('^(' + names + ')\\s*[:：]\\s*(.*)$');
  const d = emptyDraft(); let found = 0;
  String(text || '').split(/\r?\n/).forEach(line => {
    const m = line.replace(/^[\s*\-•#>]+/, '').replace(/\*\*/g, '').trim().match(re);
    if (m) { d[map[m[1]]] = m[2].trim(); found++; }
  });
  return found >= 3 ? d : null;
}

// ---------- actions ----------
function go(route) { if (location.hash === '#' + route) render(); else location.hash = '#' + route; }
function newSession(q, o = {}) {
  S.ui.speak = { form: o.form || S.ui.speak.form || 'PREP', q: { who: q.who, q: q.q }, slots: o.slots || ['', '', '', ''], memo: ['', '', '', ''] };
  S.ui.formPicked = !!o.picked; S.ui.result = null; S.ui.selScale = null;
  Store.saveLocal(); go(o.route || (o.picked ? 'speak' : 'forms')); window.scrollTo(0, 0);
}
function startSpeak(q, form, slots) { newSession(q, { form, slots, picked: true, route: 'speak' }); }
function readSlotsFromDom() { document.querySelectorAll('textarea[data-slot]').forEach(t => S.ui.speak.slots[+t.dataset.slot] = t.value); }
function readEditorFromDom() { document.querySelectorAll('[data-field]').forEach(el => Editor.draft[el.dataset.field] = el.value); const p = $('#pasteTa'); if (p) Editor.pasted = p.value; }

function stageOf() { const s = S.ui.speak.stage; return s >= 2 && s <= 4 ? s : 4; }
function saveScore(form, slots, q, stage) {
  const r = scoreAnswer(form, slots, q);
  const rec = { id: uidGen(), t: Date.now(), day: todayKey(), kind: 'speak', form, q, slots: slots.slice(), scores: r.scores, total: r.total, weakest: r.weakest, v: 2, stage: stage || 4 };
  S.history.push(rec); Store.save('history');
  S.ui.result = Object.assign({}, rec, r); S.ui.selScale = r.weakest || null;
  go('scales'); window.scrollTo(0, 0);
}
// 예전(15점) 기록을 100점 방식으로 다시 계산
function migrateHistory() {
  let ch = false;
  S.history.forEach(h => { if (h.kind === 'speak' && h.v !== 2 && Array.isArray(h.slots) && FORMS[h.form]) { const r = scoreAnswer(h.form, h.slots, h.q); h.scores = r.scores; h.total = r.total; h.weakest = r.weakest; h.v = 2; ch = true; } });
  if (S.ui.result && S.ui.result.v !== 2 && S.ui.result.slots) { S.ui.result = Object.assign({}, S.ui.result, scoreAnswer(S.ui.result.form, S.ui.result.slots, S.ui.result.q)); ch = true; }
  if (ch) { try { Store.save('history'); } catch (e) { } }
}
const ACT = {
  go: v => go(v),
  toSpeak: v => { const sp = S.ui.speak; if (!S.ui.formPicked || sp.form !== v) { sp.form = v; S.ui.formPicked = true; Store.saveLocal(); } go('speak'); },
  closeSheet: () => closeSheet(),
  goPage: v => { closeSheet(); go(v); window.scrollTo(0, 0); },
  menu: () => sheetMenu(false),
  askClear: () => sheetMenu(true),
  clearAll: () => { S.cards = []; S.history = []; S.ui.result = null; Store.save('history', 'cards'); closeSheet(); render(); toast('모든 기록을 지웠어요.', 'think'); },
  exportData: () => exportData(),
  copyExport: () => { const t = $('#exportTa'); try { navigator.clipboard.writeText(t.value).then(() => toast('복사했어요.', 'thumbs'), () => { t.select(); toast('길게 눌러 복사해 주세요.', 'think'); }); } catch (e) { t.select(); } },
  setArea: v => { S.profile.area = v; S.ui.drill.who = whoId(); S.ui.qIndex = 0; S.ui.speak.q = null; Store.save('profile'); render(); },
  setWho: v => { const fromSheet = !!$('.sheet'); S.profile.who = v; S.ui.drill.who = whoId(); S.ui.qIndex = 0; S.ui.speak.q = null; S.ui.homeOpen = null; Store.save('profile'); if (fromSheet) closeSheet(); render(); window.scrollTo(0, 0); toast(`${PERSONAS[v].label}에 맞춘 질문과 예시로 바꿨어요.`, 'joy'); },
  whoPick: () => openSheet(`<h2>누가 연습하나요?</h2><p class="small muted">고르면 질문과 예시가 바뀌어요. 기록은 그대로 남아요.</p>${whoChips(S.profile.who, 'setWho')}`),
  startQ: () => { const q = S.history.length ? currentQ() : (todaysQuestions().find(x => x.form === persona().reco) || currentQ()); newSession(q); },
  pickForm: v => { readSlotsFromDom(); const sp = S.ui.speak; if (S.ui.formOpen === v) { S.ui.formOpen = null; render(); return; } sp.form = v; S.ui.formPicked = true; S.ui.formOpen = v; Store.saveLocal(); render(); const el = document.querySelector('.ftile.open'); if (el) { const q = document.querySelector('.qbox.sticky'); const off = (q ? q.getBoundingClientRect().height : 0) + 90; window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off, behavior: 'smooth' }); } },
  nextQ: () => { S.ui.qIndex++; render(); },
  goForm: v => { S.ui.formTab = v; go('forms'); },
  speakForm: v => { readSlotsFromDom(); S.ui.speak.form = v; Store.saveLocal(); render(); },
  goForms: v => { S.ui.formTab = v; go('forms'); },
  pickQ: () => sheetPickQ(),
  useQ: v => { const [w, i] = v.split(':'); const q = QUESTIONS[levelId()][w][+i]; closeSheet(); newSession(q, { route: location.hash.slice(1) === 'speak' ? 'forms' : null }); },
  useCustomQ: () => { const t = ($('#customQ').value || '').trim(); if (!t) return; closeSheet(); newSession({ who: '직접 쓴 질문', q: t.replace(/^["“]|["”]$/g, '') }, { route: 'forms' }); },
  mic: v => micClick(+v),
  clearSlots: () => { S.ui.speak.slots = ['', '', '', '']; Store.saveLocal(); render(); },
  fromCard: () => { readSlotsFromDom(); sheetFromCard(); },
  useCard: v => { const c = S.cards.find(x => x.id === v); S.ui.speak.slots = cardSlots(c, S.ui.speak.form); closeSheet(); Store.saveLocal(); render(); toast('카드 내용을 칸에 넣었어요. 말하듯이 다듬어 보세요.', 'point_right2'); },
  score: () => {
    readSlotsFromDom(); const sp = S.ui.speak;
    const st = stageOf(), sl = sp.slots.map((x, i) => i < st ? x : '');
    if (sl.filter(x => x.trim()).length < 2) return;
    if (Dict.d && Dict.state === 'listening') Dict.d.stop().catch(() => { });
    saveScore(sp.form, sl, sp.q, st);
  },
  stage: v => { readSlotsFromDom(); S.ui.speak.stage = clamp(+v, 2, 4); render(); },
  stageUp: () => { const r = S.ui.result; if (!r) return; S.ui.speak = Object.assign({}, S.ui.speak, { form: r.form, q: r.q, slots: r.slots.slice(), stage: Math.min(4, (r.stage || 4) + 1) }); S.ui.formPicked = true; go('speak'); window.scrollTo(0, 0); },
  rescoreAs: v => { const r = S.ui.result; if (!r) return; S.ui.speak = Object.assign({}, S.ui.speak, { form: v, q: r.q, slots: r.slots.slice() }); saveScore(v, r.slots, r.q); },
  selScale: v => { S.ui.selScale = S.ui.selScale === v ? null : v; render(); },
  retry: () => { const r = S.ui.result; S.ui.speak = Object.assign({}, S.ui.speak, { form: r.form, q: r.q, slots: r.slots.slice() }); S.ui.formPicked = true; go('speak'); window.scrollTo(0, 0); },
  newQuestion: () => { S.ui.qIndex++; newSession(currentQ()); },
  answerFollow: () => { const r = S.ui.result; newSession({ who: persona().follow, q: FOLLOW[r.weakest || 'none'] }, { form: 'AHWA', picked: true, route: 'speak' }); },
  reco: v => { S.ui.speakOpen = RECO[v]; const f = RECO[v]; const q = todaysQuestions().find(x => x.form === f) || currentQ(); startSpeak(q, f); },
  // drill
  drillForm: v => { S.ui.drill.form = v; render(); },
  drillOpen: v => { S.ui.drill.form = v; S.ui.drill.openForm = v; go('drill'); },
  drillGo: v => { const D = S.ui.drill; D.idx = D.idx || {}; D.idx[D.form] = +v; render(); },
  drillHint: () => { const D = S.ui.drill; D.hint = Math.min(2, (D.hint || 0) + 1); render(); },
  drillWho: v => { S.ui.drill = Object.assign(S.ui.drill, { who: v, placed: [null, null, null, null], checked: false }); render(); },
  place: v => { const D = S.ui.drill; D.introDone = true; let i = D.target != null && D.placed[D.target] == null ? D.target : D.placed.indexOf(null); if (i < 0) return; D.placed[i] = v; D.checked = false;
    const n = [1, 2, 3, 4].map(k => (i + k) % 4).find(k => D.placed[k] == null); D.target = n == null ? null : n; render(); },
  unplace: v => { const D = S.ui.drill; D.introDone = true; if (D.checked && D.placed.every((id, i) => id != null && drillCur().chunks.find(c => c.id === id).ans === i)) return; D.placed[+v] = null; D.target = +v; D.checked = false; render(); },
  drillReset: () => { Object.assign(S.ui.drill, { placed: [null, null, null, null], checked: false, target: 0, introDone: false, hint: 0 }); render(); },
  drillCheck: () => {
    const D = S.ui.drill, cur = drillCur(); D.checked = true;
    const right = D.placed.filter((id, i) => id != null && cur.chunks.find(c => c.id === id).ans === i).length;
    if (right === 4 && cur.id) markDrillDone(cur.id);
    const today = todayKey(), key = `${D.form}:${cur.id || D.who}`;
    if (!S.history.some(h => h.kind === 'drill' && h.day === today && h.key === key)) { S.history.push({ id: uidGen(), t: Date.now(), day: today, kind: 'drill', key, form: D.form, right }); Store.save('history'); }
    render();
  },
  drillNext: () => { const D = S.ui.drill, ks = Object.keys(FORMS); D.idx = D.idx || {}; const L = drillList(), i = D.idx[D.form] || 0;
    if (i < L.length - 1) D.idx[D.form] = i + 1; else { D.idx[D.form] = 0; D.form = ks[(ks.indexOf(D.form) + 1) % 3]; }
    render(); window.scrollTo(0, 0); },
  drillSpeak: () => { S.ui.speakOpen = S.ui.drill.form; const D = S.ui.drill, cur = drillCur(); const slots = D.placed.map(id => cur.chunks.find(c => c.id === id).text); startSpeak({ who: '배치 연습 문제', q: cur.question.replace(/^[^:：]*[:：]\s*/, '') }, D.form, slots); },
  // cards
  newCard: () => { Editor.draft = emptyDraft(); Editor.mode = 'manual'; Editor.pasted = ''; Editor.msg = ''; sheetEditor(); },
  sampleCard: () => { S.cards.push(Object.assign(emptyDraft(), SAMPLE_CARDS[whoId()], { id: uidGen(), created: Date.now(), source: 'sample' })); Store.save('cards'); render(); toast('예시 카드를 넣었어요. 눌러서 세 공식으로 바꿔 보세요.', 'point_left'); },
  edMode: v => { readEditorFromDom(); Editor.mode = v; Editor.msg = ''; sheetEditor(); },
  copyPrompt: () => { try { navigator.clipboard.writeText(AI_PROMPT).then(() => toast('프롬프트를 복사했어요.', 'thumbs'), () => toast('길게 눌러 복사해 주세요.', 'think')); } catch (e) { } },
  sampleAI: () => { Editor.pasted = AI_SAMPLE; const p = $('#pasteTa'); if (p) p.value = AI_SAMPLE; },
  parseAI: () => {
    readEditorFromDom(); const d = parseAnswer(Editor.pasted);
    if (!d) { Editor.msg = "칸 이름을 찾지 못했어요. '제목:', '상황:'처럼 칸 이름이 있는 답을 붙여 넣어 주세요."; sheetEditor(); return; }
    d.source = 'ai'; Editor.draft = d; Editor.mode = 'manual'; Editor.msg = ''; sheetEditor(); $('.sheet').scrollTop = 0;
  },
  toggleQ: v => {
    readEditorFromDom(); let list = (Editor.draft.qs || '').split(',').map(x => x.trim()).filter(Boolean);
    list = list.includes(v) ? list.filter(x => x !== v) : [...list, v]; Editor.draft.qs = list.join(', ');
    const inp = document.querySelector('[data-field="qs"]'); if (inp) inp.value = Editor.draft.qs;
    document.querySelectorAll('[data-act="toggleQ"]').forEach(b => b.setAttribute('aria-pressed', list.includes(b.dataset.v)));
  },
  saveCard: () => {
    readEditorFromDom(); const d = Editor.draft;
    const n = ['sit', 'prob', 'judge', 'act', 'res', 'learn'].filter(k => (d[k] || '').trim()).length;
    if (!(d.title || '').trim()) { Editor.msg = '제목을 적어 주세요.'; sheetEditor(); return; }
    if (n < 3) { Editor.msg = '여섯 칸 중 세 칸 이상 채워 주세요. 비운 칸은 나중에 채워도 돼요.'; sheetEditor(); return; }
    if (d.id) { const i = S.cards.findIndex(x => x.id === d.id); S.cards[i] = Object.assign({}, S.cards[i], d); }
    else S.cards.push(Object.assign({}, d, { id: uidGen(), created: Date.now() }));
    Store.save('cards'); closeSheet(); go('cards'); toast('카드를 저장했어요!', 'thumbs');
  },
  openCard: v => sheetCard(v, 'raw'),
  cardView: v => { const [id, k] = v.split('|'); sheetCard(id, k); },
  cardSpeak: v => { const [id, f] = v.split('|'); const c = String(id).startsWith('sample-') ? SAMPLE_CARDS[whoId()][+String(id).slice(7)] : S.cards.find(x => x.id === id); closeSheet(); const qs = (c.qs || '').split(',')[0].trim(); S.ui.speakOpen = f; startSpeak({ who: '경험카드 · ' + (c.title || ''), q: qs ? `${qs.replace(/ 질문$/, '')}에 대해 말해 주세요.` : (todaysQuestions().find(x => x.form === f) || currentQ()).q }, f, cardSlots(c, f)); },
  editCard: v => { Editor.draft = Object.assign(emptyDraft(), S.cards.find(x => x.id === v)); Editor.mode = 'manual'; Editor.msg = ''; sheetEditor(); },
  delCard: v => { $('#delBox').innerHTML = `<div class="card mt8" style="border-color:var(--orange)"><p class="small" style="margin:0 0 10px">이 카드를 지울까요?</p><button class="btn danger small" data-act="delCardYes" data-v="${v}">지우기</button></div>`; },
  delCardYes: v => { S.cards = S.cards.filter(x => x.id !== v); Store.save('cards'); closeSheet(); render(); toast('카드를 지웠어요.', 'think'); },
  login: v => { if (window.B5 && window.B5.auth) window.B5.auth.login(v).catch(() => toast('로그인을 시작하지 못했어요. 잠시 뒤 다시 해 주세요.', 'surprised')); },
  logout: async () => { if (!(window.B5 && window.B5.auth)) return; await window.B5.auth.logout(); Store.account = null; Store.mode = 'local'; Store.backend = null; closeSheet(); render(); toast('로그아웃했어요.', 'think'); },
  homeOpen: v => { S.ui.homeOpen = S.ui.homeOpen === v ? null : v; if (!S.ui.homeOpen) S.ui.homeOpen = '__none'; render(); },
  speakOpen: v => { readSlotsFromDom(); if (S.ui.speakOpen === v) { S.ui.speakOpen = null; } else { S.ui.speakOpen = v; S.ui.speak.form = v; } Store.saveLocal(); render(); const el = document.querySelector('.choice.open'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },

  openRec: v => { const r = S.history.find(h => h.id === v); if (!r) return; const x = scoreAnswer(r.form, r.slots, r.q); S.ui.result = Object.assign({}, r, x); S.ui.selScale = r.weakest || null; go('feedback'); window.scrollTo(0, 0); },
  openSample: v => sheetCard('sample-' + v, 'raw'),
  importSample: v => { const c = SAMPLE_CARDS[whoId()][+v]; S.cards.push(Object.assign(emptyDraft(), c, { id: uidGen(), created: Date.now(), source: 'sample', who: whoId() })); Store.save('cards'); closeSheet(); render(); toast('내 카드로 가져왔어요. 내 경험으로 고쳐 써 보세요.', 'thumbs'); },
  focusWho: () => { go('home'); setTimeout(() => { const el = document.getElementById('homeWho'); if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } }, 80); },
  formTab: v => { readSlotsFromDom(); S.ui.formTab = v; if (S.ui.formPractice) { S.ui.formPractice = v; if (S.ui.speak.form !== v) { S.ui.speak.form = v; S.ui.speak.q = questionFor(v); } Store.saveLocal(); } render(); },
  openPractice: v => {
    S.ui.formPractice = v;
    if (S.ui.speak.form !== v || !S.ui.speak.q) { S.ui.speak.form = v; S.ui.speak.q = questionFor(v); }
    Store.saveLocal(); render();
    const p = document.getElementById('practice'); if (p) { const y = p.getBoundingClientRect().top - window.innerHeight * 0.42; if (y > 0) window.scrollBy({ top: y, behavior: 'smooth' }); }
  },
  closePractice: () => { readSlotsFromDom(); S.ui.formPractice = null; Store.saveLocal(); render(); },
  scaleIdx: v => { S.ui.scaleIdx = clamp(+v, 0, 4); S.ui.balOpen = null; render(); },
  balClose: () => { S.ui.balOpen = null; render(); },
  studyFold: v => { S.ui.studyFold = S.ui.studyFold === v ? null : v; render(); const el = document.querySelector('.fold.open'); if (el && el.getBoundingClientRect().top < 90) el.scrollIntoView({ block: 'start' }); },
  reportTab: v => { S.ui.reportTab = v; render(); },
  jump: v => { const el = document.getElementById(v); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
  // report
  selDay: v => { S.ui.report.sel = S.ui.report.sel === v ? null : v; render(); }
};

// ---------- render & events ----------
function render() {
  if (window.EXPO_BOOTH) return;
  migrateHistory();
  const route = (location.hash || '#home').slice(1) || 'home';
  const views = { home: viewHome, learn: viewForms, forms: viewForms, scales: viewMeasure, scaleinfo: viewScaleInfo, speak: viewSpeak, feedback: viewMeasure, drill: viewDrill, cards: viewCards, report: viewReport, origin: () => (window.viewOrigin ? window.viewOrigin() : ''), youth: () => (window.viewYouth ? window.viewYouth() : ''),
    'study-crib': () => (window.viewStudy ? window.viewStudy('crib') : ''), 'study-prep': () => (window.viewStudy ? window.viewStudy('prep') : ''), 'study-awha': () => (window.viewStudy ? window.viewStudy('awha') : ''), balance: () => (window.viewBalance ? window.viewBalance() : '') };
  const fn = views[route] || viewHome;
  if (route !== S.ui.lastRoute && (route === 'forms' || route === 'learn')) S.ui.formOpen = null;
  if (route !== S.ui.lastRoute && route === 'drill') { const D = S.ui.drill; if (D.openForm) { D.form = D.openForm; D.openForm = null; } else if (!D.checked && D.placed.every(x => x == null)) { D.form = 'PREP'; D.target = 0; D.introDone = false; } }
  S.ui.lastRoute = route;
  $('#view').innerHTML = fn();
  renderNav(route in views ? route : 'home');
  const wl = $('#whoLine'); if (wl) { const chosen = levelChosen(), lab = LEVELS[levelId()].label + ' · ' + AREAS[areaId()].label; wl.innerHTML = chosen ? `<a href="#home" data-act="focusWho" aria-label="연습 대상: ${esc(lab)}">${esc(lab)}</a>` : '<a href="#home" class="need" data-act="focusWho">대상 고르기</a>'; }
  document.body.dataset.route = route; document.body.dataset.group = /^study-/.test(route) || ['drill', 'scaleinfo', 'balance'].includes(route) ? 'learn' : ''; document.body.dataset.who = whoId(); applyFont();
  if (route === 'speak') { updateEstimate(); refreshMics(); }
  if (window.EXPO_AFTER_RENDER) window.EXPO_AFTER_RENDER();
  if (route === 'scaleinfo') { const tb = $('.si-tabs'), sel = $('.si-tabs [aria-selected="true"]'); if (tb && sel) tb.scrollLeft = sel.offsetLeft - (tb.clientWidth - sel.offsetWidth) / 2; }
}
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'closeSheet' && e.target.closest('[data-stop]')) return; // click inside sheet
  if (el.getAttribute('aria-disabled') === 'true') return;
  const fn = ACT[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  fn(el.dataset.v != null ? el.dataset.v : el.dataset.i);
});
$('#menuBtn').addEventListener('click', () => sheetMenu(false));
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset && t.dataset.memo != null) { S.ui.speak.memo[+t.dataset.memo] = t.value; clearTimeout(window.__dm); window.__dm = setTimeout(() => Store.saveLocal(), 400); return; }
  if (t.dataset && t.dataset.slot != null) { S.ui.speak.slots[+t.dataset.slot] = t.value; updateEstimate(); clearTimeout(window.__dt); window.__dt = setTimeout(() => Store.saveLocal(), 400); }
});
document.addEventListener('change', e => { const t = e.target; if (t.classList && t.classList.contains('area-select') && t.value) { ACT.setArea(t.value); return; } if (t.classList && t.classList.contains('who-select') && t.value) ACT.setWho(t.value); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#layer').innerHTML) closeSheet(); if (e.key === 'Enter' && e.target.id === 'customQ') ACT.useCustomQ(); });
/* 뒤로 가기: 앱 안에서 거쳐 온 화면이 있으면 바로 앞 화면, 없으면 상위 화면 */
const NAV_PARENT = { forms: 'home', learn: 'home', speak: 'forms', scales: 'speak', feedback: 'scales', drill: 'home', scaleinfo: 'home', cards: 'home', report: 'home',
  origin: 'home', youth: 'home', 'study-crib': 'forms', 'study-prep': 'forms', 'study-awha': 'forms', balance: 'scaleinfo' };
const curRoute = () => (location.hash || '#home').slice(1) || 'home';
const NAVSTACK = [curRoute()];
function syncBack() { const b = $('#backBtn'); if (b) b.hidden = curRoute() === 'home'; }
$('#backBtn').addEventListener('click', () => {
  if (NAVSTACK.length > 1) { history.back(); return; }
  const p = NAV_PARENT[curRoute()] || 'home'; NAVSTACK.length = 0; location.replace('#' + p);
});
window.addEventListener('hashchange', () => {
  const r = curRoute();
  if (NAVSTACK.length > 1 && NAVSTACK[NAVSTACK.length - 2] === r) NAVSTACK.pop(); else if (NAVSTACK[NAVSTACK.length - 1] !== r) NAVSTACK.push(r);
  if (NAVSTACK.length > 60) NAVSTACK.splice(0, NAVSTACK.length - 60);
  closeSheet(); render(); syncBack(); window.scrollTo(0, 0);
});
syncBack();
window.addEventListener('scroll', () => $('#top').classList.toggle('scrolled', window.scrollY > 4), { passive: true });

Store.loadLocal();
render();

if (window.B5 && window.B5.auth) {
  window.B5.auth.onChange(u => { Store.account = u; if (u) Store.initCloud(); else renderMenuState(); });
} else Store.initCloud();
initDictation();
