/* 다섯저울 연습 (#balance): 카드를 알맞은 접시에 올려 저울을 맞추는 놀이
   재료는 content.js의 질문 36묶음(예시 답·함정 문장)을 그대로 씀.
   다섯저울 모두: 고르라(버린 것까지/고른 것만) · 가려내라(사실/생각) · 대비하라(전과 후/후만) · 맞춰라(듣고 싶은 말/하고 싶은 말) · 움직여라(이익/손실) */
(function () {
  'use strict';
  var ITEMS = window.CONTENT.items;
  var shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var scaleOf = function (id) { return SCALES.filter(function (x) { return x.id === id; })[0]; };

  // 저울별 놀이 정의: 카드 만들기, 두 접시 이름, 틀렸을 때 힌트, 다음 단계 훈련
  var GAMES = {
    fact: {
      L: '사실', R: '생각',
      ask: '이 문장은 사실인가요, 생각인가요?',
      rule: '누구나 확인할 수 있는 숫자·한 일·결과는 사실, 느낌·추측·남의 말·일반론은 생각이에요.',
      build: function () {
        var facts = [], thoughts = [];
        ITEMS.forEach(function (it) {
          var k = it.form === 'CRIB' ? 0 : 2, s = it.slots[k];
          if (/\d/.test(s) && !/말해|말하|같아|같습|것 같/.test(s)) facts.push({ text: s, side: 'L', why: '숫자와 한 일이 들어 있어 누구나 확인할 수 있어요.' });
          thoughts.push({ text: it.trap, side: 'R', why: it.trapWhy });
        });
        return shuffle(shuffle(facts).slice(0, 4).concat(shuffle(thoughts).slice(0, 4)));
      },
      train: {
        title: '생각을 사실로 고쳐 쓰기',
        how: '아래 생각 문장을, 숫자가 들어간 확인할 수 있는 문장으로 바꿔 보세요. 예: "많이 줄었다" → "12분에서 5분으로 줄었다".',
        pick: function (cards) { var t = cards.filter(function (c) { return c.side === 'R'; }); return t[Math.floor(Math.random() * t.length)]; },
        measure: function (text) { return scoreAnswer('PREP', ['', '', text, ''], '').scores.fact || 0; }
      }
    }
  };
  var slotsOf = function (pred) { var o = []; ITEMS.forEach(function (it) { it.slots.forEach(function (t, k) { if (pred(t, k, it)) o.push({ t: t, k: k, it: it }); }); }); return o; };
  var BA = /\S*\d[\d,.%]*\S{0,4}에서\s*/;
  GAMES.pick = {
    L: '버린 것까지', R: '고른 것만',
    ask: '버린 대안까지 말했나요, 고른 것만 말했나요?',
    rule: '"~대신", "~보다"로 버린 대안을 함께 말해야 내 판단이 보여요.',
    wrongL: '"대신" 앞에 버린 대안이 있어요. 무엇과 비교해 골랐는지 보여요.',
    build: function () {
      var src = shuffle(slotsOf(function (t) { return /대신 /.test(t) && !/때문/.test(t.replace(/^.*?대신\s*/, '')); }));
      var good = src.slice(0, 4).map(function (x) { return { text: x.t, side: 'L', why: '버린 대안(' + x.t.split('대신')[0].trim() + ')과 고른 것을 함께 말했어요.' }; });
      var bad = src.slice(4, 8).map(function (x) { var t = x.t.replace(/^.*?대신\s*/, ''); return { text: t.charAt(0).toUpperCase() + t.slice(1), side: 'R', why: '고른 것만 있어요. 듣는 사람은 "다른 방법은 없었나?" 하고 의심해요.' }; });
      return shuffle(good.concat(bad));
    },
    train: { title: '버린 대안 붙이기', how: '고른 것만 말한 문장에 "~대신"이나 "~보다"로 버린 대안을, "~때문에"로 고른 까닭을 붙여 보세요.',
      pick: function (cards) { var t = cards.filter(function (c) { return c.side === 'R'; }); return t[Math.floor(Math.random() * t.length)]; },
      measure: function (text) { return scoreAnswer('PREP', ['', text, '', ''], '').scores.pick || 0; } }
  };
  GAMES.contrast = {
    L: '전과 후', R: '후만',
    ask: '전과 후가 모두 보이나요, 후만 보이나요?',
    rule: '"○에서 △로"처럼 전과 후를 같은 단위의 숫자로 나란히 말해야 변화의 크기가 보여요.',
    wrongL: '"○에서 △로"가 있어요. 전과 후를 함께 말했어요.',
    build: function () {
      var src = shuffle(slotsOf(function (t) { return /\d[\d,.%]*\s*\S{0,4}에서\s*\S{0,6}\d/.test(t); }));
      var good = src.slice(0, 4).map(function (x) { return { text: x.t, side: 'L', why: '전과 후를 같은 단위로 나란히 말해 변화가 보여요.' }; });
      var bad = src.slice(4, 8).map(function (x) { return { text: x.t.replace(BA, ''), side: 'R', why: '후만 있어요. 처음에 얼마였는지 알 수 없어 변화의 크기가 안 보여요.' }; });
      return shuffle(good.concat(bad));
    },
    train: { title: '전을 붙여 대비하기', how: '후만 말한 문장에 "○에서"를 넣어, 바뀌기 전 숫자와 후의 숫자를 나란히 말해 보세요.',
      pick: function (cards) { var t = cards.filter(function (c) { return c.side === 'R'; }); return t[Math.floor(Math.random() * t.length)]; },
      measure: function (text) { return scoreAnswer('PREP', ['', '', text, ''], '').scores.contrast || 0; } }
  };
  GAMES.fit = {
    L: '듣고 싶은 말', R: '하고 싶은 말',
    ask: '질문에 대한 첫 문장으로, 듣는 사람이 듣고 싶은 말인가요?',
    rule: '듣는 사람은 질문의 답을 먼저 듣고 싶어 해요. 과정·사연·경험부터 말하면 내가 하고 싶은 말이에요.',
    wrongL: '질문에 바로 답하는 결론·행동이 첫 문장에 왔어요.',
    build: function () {
      var src = shuffle(ITEMS.filter(function (it) { return it.form !== 'CRIB'; }));
      var good = src.slice(0, 4).map(function (it) { return { ctx: it.who + ': ' + it.q, text: it.slots[0], side: 'L', why: '질문에 바로 답하는 첫 문장이에요.' }; });
      var bad = src.slice(4, 8).map(function (it) { return { ctx: it.who + ': ' + it.q, text: it.slots[2], side: 'R', why: '경험부터 꺼냈어요. 좋은 재료지만 첫 문장이 아니라 셋째 칸에 와야 해요.' }; });
      return shuffle(good.concat(bad));
    },
    train: { title: '결론부터 말하기', how: '경험부터 꺼낸 첫 문장 대신, 질문에 바로 답하는 짧은 첫 문장을 써 보세요.',
      pick: function (cards) { var t = cards.filter(function (c) { return c.side === 'R'; }); return t[Math.floor(Math.random() * t.length)]; },
      measure: function (text, card) { var q = card && card.ctx ? card.ctx.split(': ').slice(1).join(': ') : ''; return scoreAnswer('PREP', [text, '', '', ''], q).scores.fit || 0; } }
  };
  GAMES.move = {
    L: '이익', R: '손실',
    ask: '이 문장은 얻는 것(이익)인가요, 잃는 것(손실)인가요?',
    rule: '사람을 움직이는 두 힘은 잃지 않으려는 마음(손실)과 얻으려는 마음(이익)이에요.',
    wrongL: '얻게 되는 것(시간·돈·기회)을 말하고 있어요.',
    build: function () {
      var cr = shuffle(ITEMS.filter(function (it) { return it.form === 'CRIB'; }));
      var gain = cr.slice(0, 4).map(function (it) { return { text: it.slots[3], side: 'L', why: '하면 얻는 것을 말하고, 언제 해 보자고 요청했어요.' }; });
      var loss = cr.slice(4, 8).map(function (it) { return { text: it.slots[1], side: 'R', why: '하지 않으면 잃는 것을 말했어요. 듣는 사람의 귀를 여는 문장이에요.' }; });
      return shuffle(gain.concat(loss));
    },
    train: { title: '흐릿한 다짐 고치기', how: '"열심히 하겠습니다"처럼 흐릿한 끝맺음에, 안 하면 잃는 것(손실)이나 하면 얻는 것(이익)을 숫자로 붙이고, 듣는 사람이 언제 무엇을 하면 되는지 넣어 고쳐 보세요.',
      pick: function () { return { text: ['앞으로 더 열심히 하겠습니다.', '모두 조금씩 신경 써 주시면 좋겠습니다.', '좋은 결과가 있도록 노력하겠습니다.'][Math.floor(Math.random() * 3)] }; },
      measure: function (text) { return scoreAnswer('PREP', ['', '', '', text], '').scores.move || 0; } }
  };
  window.BALANCE_READY = Object.keys(GAMES);

  function start(id) {
    var G = GAMES[id]; if (!G) return;
    S.ui.bal = { id: id, cards: G.build(), i: 0, L: 0, R: 0, wrong: 0, miss: [], msg: null, done: false, t0: Date.now(), train: null, trainText: '', trainScore: null };
  }

  // 저울 그림: 수평 막대 양 끝에서 줄이 내려와 접시를 매닮. 막대가 기울면 접시는 수평을 유지한 채 오르내림
  function scaleSvg(B, G) {
    var diff = B.done ? 0 : Math.max(-4, Math.min(4, B.L - B.R)), ang = diff * 4 * Math.PI / 180;
    var cx = 180, cy = 46, arm = 120;
        // 왼쪽 접시가 무거우면(diff>0) 왼쪽 끝이 내려감
    var lx = cx - arm * Math.cos(ang), ly = cy + arm * Math.sin(ang), rx = cx + arm * Math.cos(ang), ry = cy - arm * Math.sin(ang);
    var pan = function (x, y, n, lab, col) {
      var py = y + 74, chips = '';
      for (var k = 0; k < n; k++) chips += '<rect x="' + (x - 30 + (k % 4) * 15).toFixed(1) + '" y="' + (py - 9 - Math.floor(k / 4) * 9).toFixed(1) + '" width="13" height="7" rx="2" fill="' + col + '"/>';
      return '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x - 46).toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="var(--ink3)" stroke-width="1.5"/>' +
        '<line x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + (x + 46).toFixed(1) + '" y2="' + py.toFixed(1) + '" stroke="var(--ink3)" stroke-width="1.5"/>' +
        '<path d="M' + (x - 50).toFixed(1) + ' ' + py.toFixed(1) + ' Q' + x.toFixed(1) + ' ' + (py + 24).toFixed(1) + ' ' + (x + 50).toFixed(1) + ' ' + py.toFixed(1) + ' Z" fill="var(--surface)" stroke="var(--ink3)" stroke-width="1.5"/>' + chips +
        '<text x="' + x.toFixed(1) + '" y="' + (py + 42).toFixed(1) + '" text-anchor="middle" font-size="15" font-weight="800" fill="' + col + '">' + lab + ' ' + n + '</text>';
    };
    return '<svg viewBox="0 0 360 200" style="width:100%;max-width:440px;display:block;margin:0 auto" role="img" aria-label="' + G.L + ' ' + B.L + '장, ' + G.R + ' ' + B.R + '장">' +
      '<path d="M168 196 L192 196 L185 ' + (cy + 6) + ' L175 ' + (cy + 6) + ' Z" fill="var(--ink3)"/><rect x="150" y="194" width="60" height="5" rx="2" fill="var(--ink3)"/>' +
      '<line x1="' + lx.toFixed(1) + '" y1="' + ly.toFixed(1) + '" x2="' + rx.toFixed(1) + '" y2="' + ry.toFixed(1) + '" stroke="var(--ink2)" stroke-width="5" stroke-linecap="round" style="transition:all .35s"/>' +
      '<circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4" fill="var(--ink2)"/><circle cx="' + rx.toFixed(1) + '" cy="' + ry.toFixed(1) + '" r="4" fill="var(--ink2)"/><circle cx="' + cx + '" cy="' + cy + '" r="7" fill="var(--ink3)"/>' +
      pan(lx, ly, B.L, G.L, 'var(--in)') + pan(rx, ry, B.R, G.R, 'var(--jong)') + '</svg>';
  }

  window.viewBalance = function () {
    var B = S.ui.bal; if (!B || !GAMES[B.id]) { start('fact'); B = S.ui.bal; }
    var G = GAMES[B.id], sc = scaleOf(B.id), n = B.cards.length;
    var head = pageHead(sc.name + ' 연습', sc.q + ' · ' + G.L + ' / ' + G.R + ' 가르기');
    var tabs = '<div class="si-tabs" role="tablist" aria-label="저울 고르기">' + SCALES.map(function (x) {
      var ok = !!GAMES[x.id];
      return '<button role="tab" aria-selected="' + (x.id === B.id) + '" ' + (ok ? 'data-act="balStart" data-v="' + x.id + '"' : 'aria-disabled="true" title="준비 중" style="opacity:.45"') + '>' + x.name + '</button>';
    }).join('') + '</div>';
    var body;
    if (!B.done) {
      var c = B.cards[B.i];
      body = '<section class="card" style="text-align:center"><p class="small muted" style="margin:0">' + (B.i + 1) + ' / ' + n + ' · ' + esc(G.ask) + '</p>' + scaleSvg(B, G) +
        '<div style="margin:14px auto 6px;max-width:520px;padding:18px 16px;border-radius:16px;background:var(--surface);border:2px solid var(--rule2);font-size:1.15em;font-weight:700;line-height:1.5">' + (c.ctx ? '<div class="small muted" style="font-weight:600;margin-bottom:6px">' + esc(c.ctx) + '</div>' : '') + esc(c.text) + '</div>' +
        (B.msg ? '<p class="small" style="margin:8px auto;max-width:520px;color:' + (B.msg.ok ? 'var(--yu)' : 'var(--jong)') + '"><b>' + (B.msg.ok ? '맞아요!' : '다시 볼까요?') + '</b> ' + esc(B.msg.text) + '</p>' : '<p class="small muted" style="margin:8px auto;max-width:520px">' + esc(G.rule) + '</p>') +
        '<div class="grid2" style="max-width:520px;margin:12px auto 0"><button class="btn" style="background:var(--in)" data-act="balPut" data-v="L">← ' + G.L + '</button><button class="btn" style="background:var(--jong)" data-act="balPut" data-v="R">' + G.R + ' →</button></div>' +
        '<p class="tiny muted" style="margin:10px 0 0">키보드: ← → 화살표</p></section>';
    } else {
      var sec = Math.round((Date.now() - B.t0) / 1000), right = n - B.wrong;
      body = '<section class="card" style="text-align:center">' + scaleSvg(B, G) +
        '<p style="font-size:2em;font-weight:900;margin:8px 0 0;color:var(--yu)">수평! ' + right + ' / ' + n + '</p><p class="small muted" style="margin:4px 0 0">' + n + '장을 ' + sec + '초 만에 가렸어요' + (B.wrong ? ' · 헷갈린 카드 ' + B.wrong + '장' : '') + '</p></section>' +
        (B.miss.length ? '<section class="card"><h2 class="sec" style="margin-top:0">헷갈린 카드</h2>' + B.miss.map(function (m) { return '<p class="body-tx" style="margin:6px 0"><b style="color:' + (m.side === 'L' ? 'var(--in)' : 'var(--jong)') + '">' + (m.side === 'L' ? G.L : G.R) + '</b> ' + esc(m.text) + '<br><span class="small muted">' + esc(m.why) + '</span></p>'; }).join('') + '</section>' : '') +
        trainHtml(B, G);
    }
    var foot = '<div class="grid2" style="margin-top:14px"><button class="btn ghost" data-act="balStart" data-v="' + B.id + '">새 카드로 다시</button><button class="btn ghost" data-act="go" data-v="scaleinfo">저울 설명 보기</button></div>';
    return head + tabs + body + foot;
  };

  function trainHtml(B, G) {
    var T = G.train; if (!T) return '';
    if (!B.train) B.train = T.pick(B.cards);
    var meter = B.trainScore == null ? '' : '<p class="small" style="margin:8px 0 0"><b>' + scaleOf(B.id).name + ' ' + B.trainScore + ' / 3칸</b> ' +
      [0, 1, 2].map(function (k) { return '<span style="display:inline-block;width:28px;height:12px;border-radius:4px;margin-right:3px;vertical-align:middle;background:' + (k < B.trainScore ? 'var(--yu)' : 'var(--rule2)') + '"></span>'; }).join('') +
      ' ' + (B.trainScore >= 2 ? '저울이 채워졌어요!' : esc(G.train.how)) + '</p>';
    return '<section class="card"><h2 class="sec" style="margin-top:0">다음 단계 · ' + esc(T.title) + '</h2><p class="small muted" style="margin:0 0 8px">' + esc(T.how) + '</p>' +
      '<p class="body-tx" style="margin:0 0 8px;padding:10px 12px;border-radius:10px;background:var(--jong-soft)">' + (B.train.ctx ? '<span class="small muted">' + esc(B.train.ctx) + '</span><br>' : '') + '<b style="color:var(--jong)">' + (B.id === 'move' ? '흐릿한 다짐' : G.R) + '</b> ' + esc(B.train.text) + '</p>' +
      '<textarea id="balTrain" rows="2" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1.5px solid var(--rule2);font:inherit" placeholder="예) ○○이 ○에서 ○로 줄었습니다.">' + esc(B.trainText) + '</textarea>' +
      '<button class="btn" style="width:100%;margin-top:8px" data-act="balTrain">저울에 올려 보기</button>' + meter + '</section>';
  }

  function put(side) {
    var B = S.ui.bal; if (!B || B.done) return;
    var c = B.cards[B.i], ok = c.side === side;
    if (ok) { if (side === 'L') B.L++; else B.R++; B.msg = { ok: true, text: c.why }; B.i++; if (B.i >= B.cards.length) B.done = true; }
    else { B.wrong++; if (B.miss.indexOf(c) < 0) B.miss.push(c); B.msg = { ok: false, text: c.side === 'L' ? (GAMES[B.id].wrongL || '숫자나 한 일처럼 누구나 확인할 수 있으면 사실이에요.') : c.why }; }
    render();
  }
  // 재기 화면에 '가장 약한 저울 연습하기' 버튼
  var prevAfter = window.EXPO_AFTER_RENDER;
  window.EXPO_AFTER_RENDER = function () {
    if (prevAfter) prevAfter();
    var route = (location.hash || '').slice(1), r = S.ui.result, v = document.getElementById('view');
    if ((route === 'scales' || route === 'feedback') && r && r.scores && !v.querySelector('.bal-go')) {
      var w = SCALES.slice().sort(function (a, b) { return (r.scores[a.id] || 0) - (r.scores[b.id] || 0); })[0];
      var box = v.querySelector('.rbox.rb-s');
      if (box) box.insertAdjacentHTML('beforeend', '<button class="btn bal-go" style="width:100%;margin-top:12px" data-act="balStart" data-v="' + w.id + '">' + w.name + ' 연습하기 · 저울 맞추기</button>');
    }
  };
  ACT.balStart = function (id) { start(id); if ((location.hash || '').slice(1) === 'balance') render(); else go('balance'); };
  ACT.balPut = put;
  ACT.balTrain = function () {
    var B = S.ui.bal, t = document.getElementById('balTrain'); if (!B || !t) return;
    B.trainText = t.value; if (!t.value.trim()) { toast('고쳐 쓴 문장을 적어 주세요.', 'think'); return; }
    B.trainScore = GAMES[B.id].train.measure(t.value, B.train); render();
  };
  document.addEventListener('keydown', function (e) {
    if ((location.hash || '').slice(1) !== 'balance' || (e.target && /TEXTAREA|INPUT/.test(e.target.tagName))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); put('L'); } else if (e.key === 'ArrowRight') { e.preventDefault(); put('R'); }
  });
})();
if (/^#balance/.test(location.hash) && typeof render === 'function') render();
