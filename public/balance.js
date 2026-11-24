/* 다섯 저울 연습 (#balance): 카드를 알맞은 접시에 올려 저울을 맞추는 놀이
   재료는 content.js의 질문 36묶음(예시 답·함정 문장)을 그대로 씀.
   지금 준비된 저울: 가려내라(사실/생각). 나머지 저울은 같은 틀로 이어서 만든다. */
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
  window.BALANCE_READY = Object.keys(GAMES);

  function start(id) {
    var G = GAMES[id]; if (!G) return;
    S.ui.bal = { id: id, cards: G.build(), i: 0, L: 0, R: 0, wrong: 0, miss: [], msg: null, done: false, t0: Date.now(), train: null, trainText: '', trainScore: null };
  }

  // 저울 그림: 왼쪽·오른쪽 접시에 올린 수만큼 기울고, 다 끝나면 수평
  function scaleSvg(B, G) {
    var diff = B.done ? 0 : Math.max(-4, Math.min(4, B.L - B.R)), ang = -diff * 4;
    var pan = function (x, n, lab, col) {
      var chips = ''; for (var k = 0; k < n; k++) chips += '<rect x="' + (x - 30 + (k % 4) * 15) + '" y="' + (112 - Math.floor(k / 4) * 9) + '" width="13" height="7" rx="2" fill="' + col + '"/>';
      return '<g><line x1="' + (x - 38) + '" y1="70" x2="' + x + '" y2="40" stroke="var(--ink3)" stroke-width="1.5"/><line x1="' + (x + 38) + '" y1="70" x2="' + x + '" y2="40" stroke="var(--ink3)" stroke-width="1.5"/>' +
        '<path d="M' + (x - 44) + ' 120 Q' + x + ' 142 ' + (x + 44) + ' 120 Z" fill="var(--surface)" stroke="var(--ink3)" stroke-width="1.5"/>' + chips +
        '<text x="' + x + '" y="160" text-anchor="middle" font-size="15" font-weight="800" fill="' + col + '">' + lab + ' ' + n + '</text></g>';
    };
    return '<svg viewBox="0 0 360 172" style="width:100%;max-width:420px;display:block;margin:0 auto" role="img" aria-label="' + G.L + ' ' + B.L + '장, ' + G.R + ' ' + B.R + '장">' +
      '<path d="M170 168 L190 168 L184 46 L176 46 Z" fill="var(--ink3)"/><circle cx="180" cy="40" r="7" fill="var(--ink3)"/>' +
      '<g transform="rotate(' + ang + ' 180 40)" style="transition:transform .35s"><line x1="70" y1="40" x2="290" y2="40" stroke="var(--ink2)" stroke-width="5" stroke-linecap="round"/>' +
      pan(70, B.L, G.L, 'var(--in)') + pan(290, B.R, G.R, 'var(--jong)') + '</g></svg>';
  }

  window.viewBalance = function () {
    var B = S.ui.bal; if (!B || !GAMES[B.id]) { start('fact'); B = S.ui.bal; }
    var G = GAMES[B.id], sc = scaleOf(B.id), n = B.cards.length;
    var head = pageHead(sc.name + ' 연습', sc.q + ' · ' + G.L + '와 ' + G.R + '을 가르기');
    var tabs = '<div class="si-tabs" role="tablist" aria-label="저울 고르기">' + SCALES.map(function (x) {
      var ok = !!GAMES[x.id];
      return '<button role="tab" aria-selected="' + (x.id === B.id) + '" ' + (ok ? 'data-act="balStart" data-v="' + x.id + '"' : 'aria-disabled="true" title="준비 중" style="opacity:.45"') + '>' + x.name + '</button>';
    }).join('') + '</div>';
    var body;
    if (!B.done) {
      var c = B.cards[B.i];
      body = '<section class="card" style="text-align:center"><p class="small muted" style="margin:0">' + (B.i + 1) + ' / ' + n + ' · ' + esc(G.ask) + '</p>' + scaleSvg(B, G) +
        '<div style="margin:14px auto 6px;max-width:520px;padding:18px 16px;border-radius:16px;background:var(--surface);border:2px solid var(--rule2);font-size:1.15em;font-weight:700;line-height:1.5">' + esc(c.text) + '</div>' +
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
      ' ' + (B.trainScore >= 2 ? '확인할 수 있는 사실이 됐어요.' : '숫자와 한 일(언제·얼마나·무엇을)을 더 넣어 보세요.') + '</p>';
    return '<section class="card"><h2 class="sec" style="margin-top:0">다음 단계 · ' + esc(T.title) + '</h2><p class="small muted" style="margin:0 0 8px">' + esc(T.how) + '</p>' +
      '<p class="body-tx" style="margin:0 0 8px;padding:10px 12px;border-radius:10px;background:var(--jong-soft)"><b style="color:var(--jong)">' + G.R + '</b> ' + esc(B.train.text) + '</p>' +
      '<textarea id="balTrain" rows="2" style="width:100%;box-sizing:border-box;padding:10px 12px;border-radius:12px;border:1.5px solid var(--rule2);font:inherit" placeholder="예) ○○이 ○에서 ○로 줄었습니다.">' + esc(B.trainText) + '</textarea>' +
      '<button class="btn" style="width:100%;margin-top:8px" data-act="balTrain">저울에 올려 보기</button>' + meter + '</section>';
  }

  function put(side) {
    var B = S.ui.bal; if (!B || B.done) return;
    var c = B.cards[B.i], ok = c.side === side;
    if (ok) { if (side === 'L') B.L++; else B.R++; B.msg = { ok: true, text: c.why }; B.i++; if (B.i >= B.cards.length) B.done = true; }
    else { B.wrong++; if (B.miss.indexOf(c) < 0) B.miss.push(c); B.msg = { ok: false, text: c.side === 'L' ? '숫자나 한 일처럼 누구나 확인할 수 있으면 사실이에요.' : c.why }; }
    render();
  }
  ACT.balStart = function (id) { start(id); if ((location.hash || '').slice(1) === 'balance') render(); else go('balance'); };
  ACT.balPut = put;
  ACT.balTrain = function () {
    var B = S.ui.bal, t = document.getElementById('balTrain'); if (!B || !t) return;
    B.trainText = t.value; if (!t.value.trim()) { toast('고쳐 쓴 문장을 적어 주세요.', 'think'); return; }
    B.trainScore = GAMES[B.id].train.measure(t.value); render();
  };
  document.addEventListener('keydown', function (e) {
    if ((location.hash || '').slice(1) !== 'balance' || (e.target && /TEXTAREA|INPUT/.test(e.target.tagName))) return;
    if (e.key === 'ArrowLeft') { e.preventDefault(); put('L'); } else if (e.key === 'ArrowRight') { e.preventDefault(); put('R'); }
  });
})();
if (/^#balance/.test(location.hash) && typeof render === 'function') render();
