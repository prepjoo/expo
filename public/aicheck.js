/* AI 답 뜯어보기 — 워드댄싱의 두 번째 모드.
   예시 AI 답 6개(기법마다 2개): 문장마다 宗·因·喩·없음을 골라 확인하면 모범 뜯어보기와 빠진 칸을 보여 줘요.
   '내 AI 답 가져오기': 붙여 넣은 글은 기기 밖으로 나가지 않고 저장하지도 않아요. */
(function () {
  var TAG = { j: ['주장', '宗'], i: ['이유', '因'], y: ['사례', '喩'], n: ['없음', ''] };
  var ORDER = ['j', 'i', 'y', 'n'];
  var AI_SET = [
    { id: 'ai1', form: 'PREP', q: '고등학생이 과제에 AI를 써도 될까요?',
      s: [['AI는 학습을 돕는 유용한 도구입니다.', 'j', '답의 주장이에요. 다만 “써도 되나?”에 바로 답하지 않고 돌려 말했어요.'],
        ['요즘은 많은 학생이 이미 AI를 쓰고 있습니다.', 'n', '“많이들 한다”는 옳다는 이유가 되지 않아요. 이유처럼 보이는 함정이에요.'],
        ['한 연구에 따르면 AI를 쓴 학생의 성적이 올랐습니다.', 'y', '사례 자리지만 어떤 연구인지, 얼마나 올랐는지가 없어요. 확인하기 전엔 사실로 쓰면 안 돼요.'],
        ['따라서 적절히 활용하는 것이 좋습니다.', 'j', '결론을 다시 말했지만 ‘적절히’가 무엇인지 빠졌어요.']],
      miss: ['이유(因)가 없어요. “왜 써도 되는가”에 답하는 문장이 없어요.', '사례에 출처와 숫자가 없어요(② 가려내라).', '‘적절히’가 무엇인지 기준이 없어요.'],
      fix: 'AI는 초안까지만 쓰고, 결론은 내 말로 쓰면 써도 됩니다.' },
    { id: 'ai2', form: 'PREP', q: '중학생에게 스마트폰 사용 시간 제한이 필요할까요?',
      s: [['네, 스마트폰 사용 시간 제한은 필요합니다.', 'j', '질문에 바로 답한 주장이에요. 좋아요.'],
        ['스마트폰을 오래 쓰면 잠드는 시간이 늦어지기 때문입니다.', 'i', '“~때문입니다”로 이유를 댔어요.'],
        ['스마트폰은 집중력을 망가뜨리는 기계라고 할 수 있습니다.', 'n', '이유도 사례도 아닌 단정이에요. 크게 말할수록 근거가 더 필요해요.'],
        ['전문가들도 대부분 같은 의견입니다.', 'n', '어떤 전문가인지 없어요. 이름 없는 권위는 사례가 될 수 없어요.']],
      miss: ['확인할 수 있는 사례(喩)가 없어요. 몇 시간, 몇 명 같은 숫자가 필요해요.', '반대 경우(제한 없이도 잘 지내는 학생)는 따져 보지 않았어요.'],
      fix: '중학생에게는 밤 시간 스마트폰 제한이 필요합니다.' },
    { id: 'ai3', form: 'AHWA', q: '발표할 때 떨리지 않으려면 어떻게 해야 하나요?',
      s: [['발표 불안은 누구나 겪는 자연스러운 현상입니다.', 'n', '“어떻게?”에 답하지 않고 일반론으로 시작했어요.'],
        ['발표 전에 거울 앞에서 세 번 소리 내어 연습해 보세요.', 'j', '할 일을 권한 문장, 이 답의 주장이에요.'],
        ['소리 내어 말해 본 내용은 실제 발표에서 덜 막히기 때문입니다.', 'i', '그 행동이 왜 필요한지 이유를 댔어요.'],
        ['무엇보다 긍정적인 마음가짐이 중요합니다.', 'n', '할 일이 아니라 막연한 태도예요. 마지막엔 행동을 다시 청해야 해요.']],
      miss: ['해 본 사례(喩)가 없어요. “세 번 연습했더니 막힌 곳이 5곳에서 1곳으로”처럼요.', '첫 문장이 질문에 답하지 않았어요(④ 맞춰라).', '마지막에 ‘언제부터 무엇을’ 하라는 행동이 없어요.'],
      fix: '발표 전에 거울 앞에서 세 번 소리 내어 연습하세요.' },
    { id: 'ai4', form: 'AHWA', q: '동아리 회의가 자꾸 길어져요. 어떻게 하면 좋을까요?',
      s: [['회의를 시작할 때 오늘 정할 것 한 가지를 칠판에 먼저 적으세요.', 'j', '할 일을 먼저 권했어요. 좋아요.'],
        ['정할 것이 눈에 보이면 이야기가 옆길로 덜 새기 때문입니다.', 'i', '왜 그 행동이 통하는지 이유를 댔어요.'],
        ['어떤 회사는 이 방법으로 회의 시간을 크게 줄였다고 합니다.', 'y', '사례 자리지만 어떤 회사인지, 얼마나 줄었는지 없어요. 전해 들은 말이에요.'],
        ['회의 문화는 하루아침에 바뀌지 않습니다.', 'n', '맞는 말이지만 할 일이 아니에요. 다시 행동을 청해야 해요.']],
      miss: ['사례에 출처와 숫자가 없어요. 몇 분에서 몇 분으로 줄었나요?(③ 대비하라)', '마지막 행동(다음 회의부터 등)이 없어요.'],
      fix: '회의를 시작할 때 오늘 정할 것 한 가지를 칠판에 먼저 적으세요.' },
    { id: 'ai5', form: 'CRIB', q: '학급회의에서 급식 잔반 문제를 제안해 보세요.',
      s: [['먹을 만큼만 받기 캠페인을 하자고 제안합니다.', 'j', '제안(아이디어)부터 꺼냈어요. 듣는 사람은 아직 왜 해야 하는지 몰라요.'],
        ['잔반은 환경에 나쁜 영향을 줍니다.', 'i', '이유이긴 하지만 너무 넓은 일반론이에요. 우리 반이 무엇을 잃는지가 아니에요.'],
        ['우리 학교도 잔반이 꽤 많은 편인 것 같습니다.', 'n', '“~것 같습니다”는 짐작이에요. 사례가 되려면 직접 센 숫자가 필요해요.'],
        ['모두가 조금씩 노력하면 좋은 결과가 있을 것입니다.', 'n', '얻을 것이 막연해요. 이익은 숫자로, 언제부터 할지와 함께 말해요.']],
      miss: ['직접 센 사실(喩)이 없어요. 예: 지난주 우리 반 잔반 통 3개.', '순서가 거꾸로예요. 여는 삼지작법은 사실(C)과 손실(R)부터 보여 줘요.'],
      fix: '' },
    { id: 'ai6', form: 'CRIB', q: '가족에게 휴대폰 없는 주말 저녁을 제안해 보세요.',
      s: [['지난 3주 동안 저녁 식사 중 우리 가족 대화는 하루 평균 10분이 안 됐어요.', 'y', '직접 센 숫자로 상황을 보여 줬어요. 좋은 사례예요.'],
        ['이대로면 서로의 일주일이 어땠는지 모른 채 지나가게 돼요.', 'i', '그대로 두면 잃는 것(손실), 제안을 받치는 이유예요.'],
        ['그래서 토요일 저녁만 휴대폰을 거실 바구니에 두자고 제안해요.', 'j', '제안, 이 답의 주장이에요.'],
        ['휴대폰을 멀리 두면 대화가 늘어난다는 조사가 많아요.', 'y', '사례 자리지만 어떤 조사인지 없어요. “많다”도 숫자가 아니에요.']],
      miss: ['얻을 것(이익)과 ‘이번 주부터’ 같은 시작이 없어요.', '마지막 문장의 조사는 출처를 확인하기 전엔 빼는 게 나아요.'],
      fix: '' }
  ];
  var KEY = 'b5adult:aiCheck';
  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  function st() { var A = S.ui.ai || (S.ui.ai = { i: 0, paste: false, ptext: '', psents: null, ptags: [] }); return A; }
  function rec(id) { var o = load(); return o[id] || { tags: [], checked: false }; }
  function setRec(id, r) { var o = load(); if (!r.tags.some(function (x) { return x; }) && !r.checked) delete o[id]; else o[id] = r; save(o); }

  function tagBtns(k, cur, act, lock) {
    return '<div class="ai-tags" role="group" aria-label="이 문장은">' + ORDER.map(function (t) {
      return '<button class="t-' + t + (cur === t ? ' on' : '') + '" data-act="' + act + '" data-v="' + k + ':' + t + '" aria-pressed="' + (cur === t) + '"' + (lock ? ' disabled' : '') + '>' + TAG[t][0] + (TAG[t][1] ? '<small>' + TAG[t][1] + '</small>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function modeBar(m) {
    return '<div class="seg-tabs ai-mode" role="tablist" aria-label="워드댄싱 모드"><button role="tab" aria-selected="' + (m !== 'ai') + '" data-act="drillMode" data-v="order">순서 맞추기</button><button role="tab" aria-selected="' + (m === 'ai') + '" data-act="drillMode" data-v="ai">AI 답 뜯어보기</button></div>';
  }
  window.drillModeBar = modeBar;

  function viewPaste(A) {
    var body;
    if (!A.psents) {
      body = '<section class="card"><h2 class="sec" style="margin-top:0">내 AI 답 가져오기</h2><p class="small muted" style="margin:0 0 8px">AI에게 받은 답을 붙여 넣으세요. 이 글은 기기 밖으로 나가지 않고, 저장하지도 않아요.</p>' +
        '<textarea id="aiPaste" rows="6" style="width:100%" placeholder="AI의 답을 여기에 붙여 넣으세요">' + esc(A.ptext || '') + '</textarea>' +
        '<p id="aiErr" class="small" style="color:#B3261E;margin:6px 0 0"></p>' +
        '<button class="btn mt12" data-act="aiSplit">문장으로 나누기</button></section>';
    } else {
      var has = function (t) { return A.ptags.indexOf(t) >= 0; }, all = A.ptags.length === A.psents.length && A.ptags.every(function (x) { return x; });
      var res = [];
      if (all) {
        res.push(has('j') ? ['ok', '주장이 있어요.'] : ['no', '주장이 없어요. 이 답은 결국 무엇을 말하나요?']);
        res.push(has('i') ? ['ok', '이유가 있어요.'] : ['no', '이유(왜)가 빠졌어요.']);
        if (!has('y')) res.push(['no', '확인할 수 있는 사례가 없어요.']);
        A.psents.forEach(function (s, k) {
          if (A.ptags[k] !== 'y') return;
          if (!/\d/.test(s)) res.push(['warn', '“' + s.slice(0, 18) + '…”: 사례에 숫자가 없어요(② 가려내라).']);
          if (/연구|조사|전문가|보고서|통계/.test(s) && !/『|《|「|\(\d{4}|\d{4}년/.test(s)) res.push(['warn', '“' + s.slice(0, 18) + '…”: 누가, 언제 낸 자료인지 출처가 없어요.']);
        });
        var nn = A.ptags.filter(function (t) { return t === 'n'; }).length;
        if (nn) res.push(['warn', '주장·이유·사례 어디에도 들지 않는 문장이 ' + nn + '개 있어요. 빼도 답이 그대로인지 보세요.']);
      }
      body = '<section class="card"><h2 class="sec" style="margin-top:0">문장마다 색을 고르세요</h2>' +
        A.psents.map(function (s, k) { return '<div class="ai-s ' + (A.ptags[k] ? 'c-' + A.ptags[k] : '') + '"><p>' + esc(s) + '</p>' + tagBtns(k, A.ptags[k], 'aiPTag') + '</div>'; }).join('') + '</section>' +
        (all ? '<section class="card"><h2 class="sec" style="margin-top:0">점검 결과</h2>' + res.map(function (r) { return '<p class="ai-r ' + r[0] + '">' + r[1] + '</p>'; }).join('') +
          '<p class="note">점검은 형식만 봐요. 숫자와 출처가 실제로 맞는지는 직접 확인해야 해요.</p></section>' +
          '<button class="btn mb8" data-act="aiFix" data-v="paste">받치는 삼지작법으로 고쳐 말하기</button>' : '<p class="small muted" style="text-align:center">모든 문장에 색을 고르면 점검 결과가 나와요.</p>') +
        '<button class="link" style="width:100%" data-act="aiPasteNew">다른 답 붙여 넣기</button>';
    }
    return '<h2 class="lp-h">내 AI 답 뜯어보기</h2><p class="lp-sub">붙여 넣은 답을 문장으로 나눠 직접 색칠해요.</p>' + body +
      '<button class="link" style="width:100%;margin-top:8px" data-act="aiPasteOff">예시 문제로 돌아가기</button>';
  }

  window.viewAiCheck = function () {
    var A = st();
    var head = pageHead('워드댄싱', 'AI의 답을 문장마다 주장·이유·사례로 나눠 보고, 빈 칸을 찾아요.') + modeBar('ai');
    if (A.paste) return head + viewPaste(A);
    var i = Math.max(0, Math.min(A.i || 0, AI_SET.length - 1)), P = AI_SET[i], R = rec(P.id), F = FORMS[P.form];
    var all = P.s.every(function (_, k) { return R.tags[k]; }), right = P.s.filter(function (s, k) { return R.tags[k] === s[1]; }).length;
    var done = load();
    var msg = R.checked ? (right === P.s.length ? '모두 맞혔어요! 아래 빈 칸까지 확인해 보세요.' : right + '/' + P.s.length + '개 맞혔어요. 문장 아래 설명을 읽어 보세요.') : 'AI의 답이에요. 문장마다 <b>주장·이유·사례·없음</b> 중 하나를 고르세요.';
    return head +
      '<h2 class="lp-h">AI 답 뜯어보기</h2><p class="lp-sub">문제 ' + (i + 1) + '/' + AI_SET.length + ' · 고쳐 말할 삼지작법: ' + F.label + '</p>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">질문</h2><p class="lq">' + esc(P.q) + '</p></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">AI의 답</h2><div class="lmsg"><img src="' + CH(R.checked ? (right === P.s.length ? 'joy' : 'stop') : 'think') + '" alt=""><p>' + msg + '</p></div>' +
      P.s.map(function (s, k) {
        var t = R.tags[k], ok = R.checked && t === s[1];
        return '<div class="ai-s ' + (R.checked ? 'c-' + s[1] + (ok ? ' ok' : ' bad') : (t ? 'c-' + t : '')) + '"><p>' + esc(s[0]) + '</p>' + tagBtns(k, t, 'aiTag', R.checked) +
          (R.checked ? '<p class="ai-why">' + (ok ? '✓ ' : '✗ 정답은 <b>' + TAG[s[1]][0] + (TAG[s[1]][1] ? '(' + TAG[s[1]][1] + ')' : '') + '</b> · ') + esc(s[2]) + '</p>' : '') + '</div>';
      }).join('') + '</section>' +
      (R.checked ? '<section class="card"><h2 class="sec" style="margin-top:0">이 답에서 빠진 것</h2><ul class="body-tx" style="padding-left:1.1em;margin:0">' + P.miss.map(function (m) { return '<li style="margin:4px 0">' + esc(m) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<div class="mt12">' + (R.checked
        ? '<button class="btn mb8" data-act="aiFix" data-v="' + i + '">' + F.label + '으로 고쳐 말하기</button>' + (i < AI_SET.length - 1 ? '<button class="btn ghost mb8" data-act="aiGo" data-v="' + (i + 1) + '">다음 문제 (' + (i + 2) + '/' + AI_SET.length + ')</button>' : '') + '<button class="link" style="width:100%" data-act="aiReset">다시 풀어 보기</button>'
        : '<button class="btn mb8" data-act="aiCheck" ' + (all ? '' : 'disabled') + '>확인</button>') + '</div>' +
      '<div class="dprog" role="group" aria-label="문제 진행 상황">' + AI_SET.map(function (it, k) {
        var r = done[it.id], fin = r && r.checked, part = r && !r.checked;
        return '<button class="' + (k === i ? 'cur ' : '') + (fin ? 'done ' : '') + (part ? 'part' : '') + '" data-act="aiGo" data-v="' + k + '" aria-label="' + (k + 1) + '번 문제' + (fin ? ' · 푼 문제' : part ? ' · 푸는 중' : '') + '"' + (k === i ? ' aria-current="step"' : '') + '>' + (k + 1) + '</button>';
      }).join('<i aria-hidden="true"></i>') + '</div>' +
      '<section class="card" style="margin-top:18px"><h2 class="sec" style="margin-top:0">내 AI 답 가져오기</h2><p class="small muted" style="margin:0 0 10px">AI에게 직접 물어본 답도 같은 방법으로 뜯어볼 수 있어요.</p><button class="btn ghost" data-act="aiPasteOn">붙여 넣고 뜯어보기</button></section>';
  };

  function splitSents(t) {
    return t.replace(/\s+/g, ' ').split(/(?<=[.!?。])\s+|\n+/).map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 1; }).slice(0, 12);
  }
  Object.assign(ACT, {
    drillMode: function (v) { S.ui.drill.mode = v === 'ai' ? 'ai' : 'order'; render(); window.scrollTo(0, 0); },
    aiTag: function (v) { var A = st(), P = AI_SET[A.i || 0], R = rec(P.id); if (R.checked) return; var p = v.split(':'); R.tags[+p[0]] = R.tags[+p[0]] === p[1] ? null : p[1]; setRec(P.id, R); render(); },
    aiCheck: function () { var A = st(), P = AI_SET[A.i || 0], R = rec(P.id); if (!P.s.every(function (_, k) { return R.tags[k]; })) return; R.checked = true; setRec(P.id, R); render(); },
    aiReset: function () { var A = st(), P = AI_SET[A.i || 0]; setRec(P.id, { tags: [], checked: false }); render(); },
    aiGo: function (v) { st().i = +v; render(); window.scrollTo(0, 0); },
    aiFix: function (v) {
      var A = st(), form = 'PREP', q, slots = ['', '', '', ''];
      if (v === 'paste') { q = 'AI 답을 내 말로 다시 말해 보세요'; var j = A.psents.filter(function (_, k) { return A.ptags[k] === 'j'; })[0]; if (j) slots[0] = j; }
      else { var P = AI_SET[+v]; form = P.form; q = P.q; if (P.fix) slots[0] = P.fix; }
      S.ui.speak = { form: form, q: { who: 'AI 답 고쳐 말하기', q: q }, slots: slots, memo: ['', '', '', ''], stage: 4 };
      S.ui.formPicked = true; if (Store && Store.saveLocal) Store.saveLocal(); go('speak'); window.scrollTo(0, 0);
    },
    aiPasteOn: function () { var A = st(); A.paste = true; A.psents = null; A.ptags = []; render(); window.scrollTo(0, 0); },
    aiPasteOff: function () { var A = st(); A.paste = false; A.psents = null; A.ptags = []; A.ptext = ''; render(); window.scrollTo(0, 0); },
    aiPasteNew: function () { var A = st(); A.psents = null; A.ptags = []; render(); },
    aiSplit: function () {
      var A = st(), el = document.getElementById('aiPaste'), t = el ? el.value.trim() : '';
      A.ptext = t; var ss = splitSents(t);
      if (ss.length < 2) { var e = document.getElementById('aiErr'); if (e) e.textContent = '두 문장 이상 붙여 넣어 주세요.'; return; }
      A.psents = ss; A.ptags = []; render();
    },
    aiPTag: function (v) { var A = st(), p = v.split(':'), k = +p[0]; A.ptags[k] = A.ptags[k] === p[1] ? null : p[1]; render(); }
  });
  if (/^#drill/.test(location.hash) && typeof render === 'function') render();
})();
