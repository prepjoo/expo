/* 성인·박람회판 기능
   A4 QR 바로 열기(?q=M-07) · A6 박람회 모드(?booth=1) · A7 결과 이미지 · A8 부스 통계
   A9 유래 화면(#origin) · 결과 받기(?r=) · 청소년판 연결
   개인정보·답 문장은 어디에도 보내거나 저장하지 않아요. 부스 통계는 숫자만 이 기기에 남아요. */
(function () {
  'use strict';
  var CFG = window.EXPO_CONFIG || {};
  var P = new URLSearchParams(location.search);
  var SITE = (CFG.siteUrl || (location.origin + location.pathname)).replace(/\/?$/, '/');
  var ITEMS = window.CONTENT.items, BY = window.CONTENT_BY_ID;
  var FK = function (f) { return f === 'AWHA' ? 'AHWA' : f; };
  var COL = { jong: '#C0141B', in: '#1565C0', yu: '#16A34A', trap: '#6B7280', navy: '#3D4B6E', scale: '#1F6B45', brick: '#8E1B1B' };
  var ROLE = { CRIB: ['yu', 'in', 'jong', 'in'], PREP: ['jong', 'in', 'yu', 'jong'], AHWA: ['jong', 'in', 'yu', 'jong'] };
  var ROLE_HAN = { jong: '종(宗)', in: '인(因)', yu: '유(喩)' };
  var FONT = "'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif";
  var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var filledOf = function (scores) { return SCALES.filter(function (x) { return (scores[x.id] || 0) >= 2; }).length; };
  var itemByQ = function (q) { var t = q && q.q ? q.q : q; return ITEMS.filter(function (x) { return x.q === t; })[0] || null; };

  // ---------- 卍 아이콘 (SVG) ----------
  // 삼지작법 아이콘: 사용자 제공 그림(icons/*.png, 배경 투명)
  var ICON_FILE = { CRIB: 'icons/crib.png', PREP: 'icons/prep.png', AHWA: 'icons/awha.png' };
  var ICON_IMG = {};
  Object.keys(ICON_FILE).forEach(function (k) { var im = new Image(); im.src = ICON_FILE[k]; ICON_IMG[k] = im; });
  var EN = { CRIB: ['Condition', 'Risk', 'Idea', 'Benefit'], PREP: ['Point', 'Reason', 'Example', 'Point'], AHWA: ['Action', 'Why', 'How', 'Action'] };
  function manji(form, size) {
    return '<img src="' + ICON_FILE[form] + '" width="' + size + '" height="' + size + '" alt="' + FORMS[form].code + '" style="display:block;margin:0 auto">';
  }


  // ---------- QR ----------
  function qrSvg(text, px) {
    var q = qrcode(0, 'M'); q.addData(text); q.make();
    var n = q.getModuleCount(), cell = Math.max(2, Math.floor(px / (n + 8))), m = cell * 4;
    return q.createSvgTag({ cellSize: cell, margin: m, scalable: true });
  }
  var resultCode = function (id, form, scores) { return id + '.' + form[0] + '.' + SCALES.map(function (x) { return scores[x.id] || 0; }).join(''); };
  function parseResult(code) {
    var m = /^([MB]-\d{2})\.([CPA])\.([0-3]{5})$/.exec(code || ''); if (!m || !BY[m[1]]) return null;
    var form = { C: 'CRIB', P: 'PREP', A: 'AHWA' }[m[2]], scores = {};
    SCALES.forEach(function (x, i) { scores[x.id] = +m[3][i]; });
    return { item: BY[m[1]], form: form, scores: scores };
  }

  // ---------- A7 결과 이미지 1080×1920 ----------
  function wrap(ctx, text, maxW) {
    var lines = [], cur = '';
    String(text).split('').forEach(function (ch) { if (ctx.measureText(cur + ch).width > maxW && cur) { lines.push(cur); cur = ch.trim() ? ch : ''; } else cur += ch; });
    if (cur) lines.push(cur); return lines;
  }
  function drawResult(cv, o) {
    var W = 1080, H = 1920; cv.width = W; cv.height = H; var c = cv.getContext('2d');
    c.fillStyle = '#F7F5EF'; c.fillRect(0, 0, W, H);
    c.fillStyle = COL.navy; c.fillRect(0, 0, W, 300);
    c.fillStyle = '#fff'; c.font = '800 84px ' + FONT; c.textBaseline = 'middle'; c.fillText('내 말로 증명하다', 80, 130);
    c.font = '500 36px ' + FONT; c.fillStyle = 'rgba(255,255,255,.8)'; c.fillText('삼지작법 · 다섯 저울 결과', 80, 215);
    // 질문
    c.fillStyle = '#6B6457'; c.font = '600 34px ' + FONT; c.fillText((o.item ? o.item.id + ' · ' : '') + (o.who || '질문'), 80, 380);
    c.fillStyle = '#1E1B16'; c.font = '700 54px ' + FONT;
    var ql = wrap(c, '“' + o.q + '”', W - 160).slice(0, 4);
    ql.forEach(function (l, i) { c.fillText(l, 80, 460 + i * 72); });
    // 卍 아이콘과 삼지작법 이름 (질문 줄 수에 따라 위치를 맞춤)
    var dy = (ql.length - 1) * 72 - 170, F = FORMS[o.form], x0 = 80, y0 = 760, s = 220;
    c.save(); c.translate(0, dy);
    var IM = ICON_IMG[o.form];
    if (IM && IM.complete && IM.naturalWidth) { c.drawImage(IM, x0, y0, s, s); } else {
    c.save(); c.translate(x0, y0); c.scale(s / 100, s / 100);
    c.strokeStyle = COL.navy; c.lineWidth = 7; c.lineCap = 'square'; c.beginPath();
    c.moveTo(14, 14); c.lineTo(50, 14); c.lineTo(50, 86); c.lineTo(86, 86); c.moveTo(86, 14); c.lineTo(86, 50); c.lineTo(14, 50); c.lineTo(14, 86); c.stroke();
    c.font = '900 31px Arial Black, Arial, sans-serif'; c.textAlign = 'center';
    [[29, 30], [71, 30], [29, 72], [71, 72]].forEach(function (p, i) { c.fillStyle = COL[ROLE[o.form][i]]; c.fillText(F.slots[i].key, p[0], p[1]); });
    c.restore(); }
    c.textAlign = 'left';
    c.fillStyle = '#1E1B16'; c.font = '800 60px ' + FONT; c.fillText(F.label, 340, 830);
    c.fillStyle = '#6B6457'; c.font = '600 36px ' + FONT; c.fillText(F.code + ' · ' + F.when, 340, 905);
    c.restore(); c.save(); c.translate(0, dy / 2);
    // 채운 저울
    var n = filledOf(o.scores);
    c.fillStyle = COL.scale; c.font = '800 150px ' + FONT; c.fillText(n + ' / 5', 80, 1120);
    c.fillStyle = '#1E1B16'; c.font = '700 44px ' + FONT; c.fillText('채운 저울', 420, 1130);
    SCALES.forEach(function (x, i) {
      var y = 1260 + i * 96, v = o.scores[x.id] || 0;
      c.fillStyle = '#1E1B16'; c.font = '700 40px ' + FONT; c.fillText((i + 1) + ' ' + x.name, 80, y);
      c.fillStyle = '#6B6457'; c.font = '500 30px ' + FONT; c.fillText(x.q, 330, y);
      for (var k = 0; k < 3; k++) { c.fillStyle = k < v ? COL.scale : '#DDD8CC'; c.fillRect(800 + k * 70, y - 18, 58, 36); }
    });
    c.restore();
    // 아래
    c.fillStyle = '#DDD8CC'; c.fillRect(80, 1770, W - 160, 2);
    c.fillStyle = '#6B6457'; c.font = '500 30px ' + FONT;
    var d = new Date(); c.fillText(d.getFullYear() + '.' + (d.getMonth() + 1) + '.' + d.getDate() + ' · 진나의 인명학을 현대 말하기에 응용', 80, 1830);
    c.fillText(SITE.replace(/^https?:\/\//, '').replace(/\/$/, ''), 80, 1878);
    return cv;
  }
  function imageSheet(o) {
    var cv = drawResult(document.createElement('canvas'), o);
    var url = cv.toDataURL('image/png');
    var name = '내말로증명하다_' + (o.item ? o.item.id : 'result') + '.png';
    openSheet('<h2>결과 이미지</h2><p class="small muted">휴대폰에 저장하거나 공유할 수 있어요. 답 문장과 개인정보는 들어가지 않아요.</p>' +
      '<img src="' + url + '" alt="채운 저울 ' + filledOf(o.scores) + '개 결과 이미지" style="width:100%;max-width:300px;display:block;margin:10px auto;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.15)">' +
      '<div class="grid2"><a class="btn" style="width:100%;text-align:center" href="' + url + '" download="' + name + '">내려받기</a><button class="btn ghost" style="width:100%" id="shareImg">공유하기</button></div>', function (sh) {
      var b = sh.querySelector('#shareImg');
      if (!(navigator.canShare)) { b.style.display = 'none'; return; }
      b.addEventListener('click', function () {
        cv.toBlob(function (blob) {
          var f = new File([blob], name, { type: 'image/png' });
          if (navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: '내 말로 증명하다' }).catch(function () {});
        });
      });
    });
  }
  window.EXPO_IMAGE = { draw: drawResult, sheet: imageSheet };

  // ---------- A9 유래 화면 ----------
  window.viewOrigin = function () {
    var rows = [['CRIB', '여는 삼지작법', '먼저 말을 꺼낼 때'], ['PREP', '받치는 삼지작법', '주장할 때'], ['AHWA', '답하는 삼지작법', '질문을 받고 행동으로 답할 때']];
    return pageHead('삼지작법의 유래', '진나가 정리하고 삼장법사가 토론에서 쓴 논리') +
      '<section class="card"><h2 class="sec" style="margin-top:0">1,500년 전 스님들의 토론법</h2>' +
      '<p class="body-tx">삼지작법(三支作法)은 5~6세기 인도의 불교 논리학자 <b>진나(陳那, 디그나가)</b>가 정리한 <b>인명학(因明學)</b>의 논증 형식이에요. 주장을 세 갈래로 받쳐 상대를 설득해요.</p>' +
      '<ul class="body-tx"><li><b style="color:' + COL.jong + '">종(宗)</b> 주장: 내가 증명하려는 것</li><li><b style="color:' + COL.in + '">인(因)</b> 이유: 그렇게 말할 수 있는 까닭</li><li><b style="color:' + COL.yu + '">유(喩)</b> 사례: 누구나 확인할 수 있는 예</li></ul></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">1,400년 전 삼장법사를 토론 승자로 만든 논리</h2>' +
      '<p class="body-tx">서유기의 삼장법사로 알려진 <b>현장(玄奘) 스님</b>은 7세기에 인도 <b>나란다 대학</b>에서 계현(시라바드라) 스님에게 인명학을 배웠어요.</p>' +
      '<p class="body-tx">641~643년 무렵 북인도의 하르샤왕(계일왕)이 수도 <b>곡녀성(카냐쿠브자)</b>에서 큰 토론회를 열었어요. 왕 18명과 스님 3,000명, 학자 수천 명이 모였어요. 현장 스님이 종·인·유로 짠 논증 <b>진유식량(眞唯識量)</b>을 내걸자 18일 동안 아무도 꺾지 못했고, 현장 스님은 토론의 승자가 되었어요.</p>' +
      '<p class="body-tx">진나가 정리한 삼지작법을, 약 1,400년 전 삼장법사가 실제 토론에서 써서 이긴 거예요. 현장 스님은 인명학 책을 중국으로 가져와 번역했고, 그 덕분에 동아시아에 삼지작법이 전해졌어요.</p></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">현대 말하기에 맞게 응용했어요</h2>' +
      '<p class="body-tx">여는·받치는·답하는 삼지작법은 진나의 삼지작법을 <b>현대 말하기에 맞게 응용한 것</b>이에요. 종·인·유로 짠 네 칸을 상황에 맞게 순서를 바꿔 써요.</p>' +
      rows.map(function (r) {
        var F = FORMS[r[0]];
        return '<div style="display:flex;gap:14px;align-items:center;margin:12px 0"><span style="flex:0 0 60px">' + manji(r[0], 60) + '</span>' + '<div><b>' + r[1] + ' · ' + F.code + ' <small style="font-weight:600;opacity:.65;font-size:.78em">' + F.pron + '</small></b><div class="small muted">' + r[2] + ' · ' +
          F.slots.map(function (x, i) { var w = EN[r[0]][i]; return '<b>' + w.charAt(0) + '</b>' + w.slice(1) + ' ' + x.title + '<small>(' + ROLE_HAN[ROLE[r[0]][i]].slice(0, 1) + ')</small>'; }).join(' → ') + '</div></div></div>';
      }).join('') + '</section>' +
      '<p class="small muted" style="text-align:center">감수 ' + e(CFG.reviewer || '(감수자 확정 후 표기)') + '</p>';
  };

  // ---------- 청소년판 소개 (초·중·고등학생) ----------
  window.viewYouth = function () {
    var row = function (t, d) { return '<li style="margin:8px 0"><b>' + t + '</b><br><span class="small muted">' + d + '</span></li>'; };
    return pageHead('청소년판 앱', '초·중·고등학생을 위한 BALANCE 5') +
      '<section class="card"><p class="body-tx" style="margin-top:0"><b>AI가 숙제를 대신 써 주는 시대, 학생에게 남는 힘은 내 생각을 내 말로 증명하는 힘이에요.</b> 청소년판은 같은 삼지작법과 다섯 저울을 학교생활에 맞춘 앱이에요.</p></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">학교급에 맞춘 질문</h2><ul class="body-tx" style="padding-left:1.1em;margin:0">' +
      row('초등학생', '수학 "왜?" 질문, 학급회의 발표처럼 쉬운 말로 시작해요.') +
      row('중학생', '서술형 답안, 모둠 발표, 고입 면접을 연습해요.') +
      row('고등학생', '서·논술형, 학생부 활동 정리, 대입 면접을 연습해요.') + '</ul></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">무엇을 연습하나요?</h2><ul class="body-tx" style="padding-left:1.1em;margin:0">' +
      row('수행평가', '서술형과 AI 과제에서 내 생각을 근거로 받쳐요.') +
      row('발표·토론', '발표 첫 30초, 건의, 토론 주장을 짜요.') +
      row('학생부', '활동을 숫자와 사실로 정리하고 자기평가를 써요.') +
      row('진학 면접', '고입·대입 면접 질문에 30초로 답해요.') + '</ul></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">이렇게 배워요</h2><ul class="body-tx" style="padding-left:1.1em;margin:0">' +
      row('짜기 → 말하기 → 재기', '질문에 맞는 삼지작법을 골라 네 칸을 짜고, 소리 내어 말하고, 다섯 저울로 점수를 받아요.') +
      row('워드댄싱', '뒤섞인 문장을 네 칸에 맞게 놓으며 삼지작법의 순서를 익혀요. 함정 문장도 골라내요.') +
      row('경험 카드', '내 활동 하나를 여섯 칸에 모아 두고 여러 질문에 꺼내 써요.') +
      row('1분 사용설명서', '그림과 목소리로 쓰는 법을 1분 만에 알려 줘요.') + '</ul></section>' +
      '<section class="card"><h2 class="sec" style="margin-top:0">선생님께</h2><p class="body-tx" style="margin:0">5인 모둠 카드 교구(187장)와 함께 쓰면 40분 수업 한 차시가 돼요. 무료이고 가입 없이 바로 쓸 수 있어요.</p></section>' +
      (CFG.youthUrl ? '<a class="btn" style="display:flex;align-items:center;justify-content:center;width:100%;margin:14px 0 6px;text-decoration:none;color:#fff" href="' + e(CFG.youthUrl) + '">청소년판 앱 열기</a><p class="small muted" style="text-align:center">처음 화면에서 학교급(초등·중학·고등)을 고르면 시작해요.</p>' : '');
  };

  // ---------- A4 QR 바로 열기, 결과 받기 ----------
  function openQuestion(id) {
    var it = BY[id]; if (!it) return false;
    S.profile.area = it.area; S.ui.qIndex = 0;
    newSession({ who: it.who, q: it.q }, { route: 'forms' });
    return true;
  }
  function viewReceived(o) {
    var F = FORMS[o.form], n = filledOf(o.scores);
    return pageHead('내 결과', '박람회 체험 결과') +
      '<section class="card"><p class="small muted mb0">' + e(o.item.id + ' · ' + o.item.who) + '</p><p class="body-tx"><b>“' + e(o.item.q) + '”</b></p>' +
      '<div style="display:flex;gap:12px;align-items:center">' + manji(o.form, 64, COL.navy) + '<div><b>' + F.label + '</b><div class="small muted">' + F.code + ' · ' + F.pron + '</div></div></div>' +
      '<p style="font-size:2.4em;font-weight:800;color:' + COL.scale + ';margin:12px 0 4px">채운 저울 ' + n + ' / 5</p></section>' +
      '<button class="btn mb8" style="width:100%" id="rImg">결과 이미지 저장하기</button>' +
      '<button class="btn ghost" style="width:100%" id="rAgain">이 질문 다시 연습하기</button>';
  }

  // ---------- 일반 모드 덧붙이기 ----------
  function afterRender() {
    var route = (location.hash || '#home').slice(1) || 'home', v = document.getElementById('view');
    if (route === 'home' && !v.querySelector('.expo-links')) {
      var dock = v.querySelector('.cta-dock');
      var html = '<div class="expo-links card flat" style="margin:14px 0">' +
        '<a href="#origin" class="between" style="text-decoration:none;color:inherit"><span><b>삼지작법의 유래</b><br><small class="muted">진나가 정리하고 삼장법사가 토론에서 쓴 논리</small></span><span aria-hidden="true">›</span></a>' +
        '<hr style="border:none;border-top:1px solid var(--line);margin:10px 0"><a href="#youth" class="between" style="text-decoration:none;color:inherit"><span><b>초·중·고등학생이에요</b><br><small class="muted">학교급에 맞춘 청소년판 앱을 소개해요</small></span><span aria-hidden="true">›</span></a>' +
        '</div>';
      if (dock) dock.insertAdjacentHTML('beforebegin', html);
    }
    if (route === 'scales' && S.ui.result && !v.querySelector('.expo-img')) {
      var r = S.ui.result, head = v.querySelector('.page-head') || v.firstElementChild;
      var b = '<button class="btn ghost expo-img" style="width:100%;margin:10px 0">결과 이미지 만들기 (채운 저울 ' + filledOf(r.scores) + '/5)</button>';
      if (head) head.insertAdjacentHTML('afterend', b);
      v.querySelector('.expo-img').addEventListener('click', function () {
        imageSheet({ item: itemByQ(r.q), who: r.q && r.q.who, q: r.q && r.q.q, form: r.form, scores: r.scores });
      });
    }
  }
  window.EXPO_AFTER_RENDER = afterRender;

  // ---------- A6 박람회 모드 ----------
  var STAT = 'expo:stats';
  function stats() { try { return JSON.parse(localStorage.getItem(STAT)) || {}; } catch (x) { return {}; } }
  function addStat(fn) { try { var s = stats(), d = todayKey(); s[d] = s[d] || { n: 0, CRIB: 0, PREP: 0, AHWA: 0, filled: 0, student: 0, teacher: 0, general: 0, retry: 0, retryGain: 0 }; fn(s[d]); localStorage.setItem(STAT, JSON.stringify(s)); } catch (x) {} }
  function csv() {
    var s = stats(), head = ['날짜', '체험 수', '여는(CRIB)', '받치는(PREP)', '답하는(AWHA)', '채운 저울 평균', '학생', '선생님', '일반', '다시 하기 수', '다시 하기 저울 증가 평균'];
    var rows = Object.keys(s).sort().map(function (d) { var x = s[d]; return [d, x.n, x.CRIB, x.PREP, x.AHWA, x.n ? (x.filled / x.n).toFixed(2) : 0, x.student, x.teacher, x.general, x.retry, x.retry ? (x.retryGain / x.retry).toFixed(2) : 0]; });
    return '﻿' + [head].concat(rows).map(function (r) { return r.join(','); }).join('\r\n');
  }

  var B = null, idle = null;
  function bootBooth() {
    window.EXPO_BOOTH = true;
    document.body.classList.add('booth');
    var st = document.createElement('style');
    st.textContent = 'body.booth #top,body.booth nav.bottom{display:none!important}body.booth .wrap{max-width:none!important;width:100%!important;padding:0!important}body.booth main{padding:0!important}body.booth{font-size:20px;background:#F7F5EF}' +
      '.bx{max-width:980px;margin:0 auto;padding:28px 24px 60px}.bx h1{font-size:2.6em;margin:.2em 0;color:' + COL.navy + '}.bx .big{font-size:1.25em}' +
      '.bbtn{display:block;width:100%;padding:22px;border-radius:18px;border:0;font-size:1.3em;font-weight:800;background:' + COL.navy + ';color:#fff;cursor:pointer;margin:10px 0}' +
      '.bbtn.ghost{background:#fff;color:' + COL.navy + ';border:2px solid ' + COL.navy + '}.brow{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}' +
      '.bq{font-size:1.7em;font-weight:800;line-height:1.35;margin:.4em 0}.bnum{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.bnum button{padding:14px 0;font-size:.95em;border-radius:12px;border:1px solid #cfc8b8;background:#fff;font-weight:700}' +
      '.bform{background:#fff;border:2px solid #ddd5c4;border-radius:20px;padding:18px;text-align:center;cursor:pointer}.bform b{display:block;font-size:1.15em;margin-top:6px}.bform small{color:#6b6457}' +
      '.bslot{display:flex;gap:12px;align-items:flex-start;margin:10px 0}.bslot .k{flex:0 0 64px;height:64px;border-radius:14px;color:#fff;font-weight:900;font-size:1.6em;display:flex;align-items:center;justify-content:center;flex-direction:column;line-height:1}.bslot .k small{font-size:.38em;font-weight:700;margin-top:3px}' +
      '.bslot textarea{flex:1;font-size:1.05em;padding:12px;border-radius:12px;border:2px solid #ddd5c4;min-height:64px;resize:none}' +
      '.btimer{font-size:3.4em;font-weight:900;text-align:center;color:' + COL.navy + '}.btimer.end{color:' + COL.jong + '}' +
      '.bscore{font-size:4.6em;font-weight:900;color:' + COL.scale + ';text-align:center;margin:.1em 0}.bsc{display:flex;align-items:center;gap:12px;margin:8px 0;font-size:1.05em}.bsc b{flex:0 0 6.5em}.bsc span{flex:0 0 auto;white-space:nowrap}.bsc i{display:inline-block;width:46px;height:26px;border-radius:6px;background:#DDD8CC;margin-right:5px}.bsc i.on{background:' + COL.scale + '}' +
      '.badv{background:#fff;border-left:8px solid ' + COL.jong + ';border-radius:12px;padding:16px 18px;margin:16px 0;font-size:1.05em}' +
      '.bqr{display:flex;gap:18px;align-items:center;background:#fff;border-radius:16px;padding:14px}.bqr svg{width:200px!important;height:200px!important;flex:0 0 200px}' +
      '.bstats table{width:100%;border-collapse:collapse;font-size:.8em}.bstats td,.bstats th{border-bottom:1px solid #ddd;padding:6px;text-align:right}';
    document.head.appendChild(st);
    var reset = function () { B = { step: 'start' }; draw(); };
    ['pointerdown', 'keydown', 'input'].forEach(function (ev) { document.addEventListener(ev, function () { clearTimeout(idle); idle = setTimeout(function () { if (B && B.step !== 'start') reset(); }, 60000); }, true); });
    reset();
  }
  function stepStart() {
    return '<div class="bx" style="text-align:center"><h1 id="bTitle">내 말로 증명하다</h1><p class="big">1,400년 전 삼장법사의 불교논리, 삼지작법<br><b>AI가 대신 못 하는 것, 30초 만에 내 생각 증명하기</b></p>' +
      '<div style="margin:30px auto;display:flex;gap:22px;justify-content:center">' + manji('CRIB', 110, COL.navy) + manji('PREP', 110, COL.navy) + manji('AHWA', 110, COL.navy) + '</div>' +
      '<p class="big">체험하시는 분은 누구인가요?</p><div class="brow">' +
      [['student', '학생', '초·중·고·대학생'], ['teacher', '선생님', '학교·학원·사찰'], ['general', '일반', '그 밖의 모든 분']].map(function (w) { return '<button class="bbtn" data-b="who" data-v="' + w[0] + '">' + w[1] + '<br><small style="font-weight:500;font-size:.6em">' + w[2] + '</small></button>'; }).join('') + '</div>' +
      '<p class="small muted" style="margin-top:22px">이름·연락처·목소리와 답 문장은 받지도, 저장하지도 않아요.</p></div>';
  }
  function stepQ() {
    var nums = ITEMS.map(function (it) { return '<button data-b="pickQ" data-v="' + it.id + '">' + it.id + '</button>'; }).join('');
    return '<div class="bx"><h1>질문 공 뽑기</h1><p class="big">뽑은 공의 번호를 누르세요.</p><div class="bnum">' + nums + '</div>' +
      '<button class="bbtn ghost" data-b="randQ">번호 없이 아무거나</button></div>';
  }
  function stepForm() {
    var it = B.item;
    return '<div class="bx"><p class="small muted">' + e(it.id + ' · ' + it.who + '의 질문') + '</p><div class="bq">“' + e(it.q) + '”</div>' +
      '<p class="big">어떤 삼지작법으로 답할까요?</p><div class="brow">' +
      ['CRIB', 'PREP', 'AHWA'].map(function (k) { var F = FORMS[k]; return '<div class="bform" data-b="form" data-v="' + k + '" role="button" tabindex="0">' + manji(k, 110, COL.navy) + '<b>' + F.label + '</b><small>' + F.when + '</small></div>'; }).join('') + '</div></div>';
  }
  function stepSpeak() {
    var F = FORMS[B.form];
    return '<div class="bx"><div class="between" style="display:flex;justify-content:space-between;align-items:center"><div><small class="muted">' + e(B.item.id) + '</small><div style="font-weight:800;font-size:1.15em">“' + e(B.item.q) + '”</div></div><div class="btimer" id="bTimer">30</div></div>' +
      '<p class="muted" style="margin:6px 0 2px">' + F.label + ' · 네 칸을 이어 말해요. 스태프가 들으며 핵심을 적어요.</p>' +
      F.slots.map(function (x, i) { var r = ROLE[B.form][i]; return '<div class="bslot"><span class="k" style="background:' + COL[r] + '">' + x.key + '<small>' + x.title + '</small></span><textarea data-bs="' + i + '" placeholder="' + e(x.hint) + '">' + e(B.slots[i]) + '</textarea></div>'; }).join('') +
      '<button class="bbtn" data-b="score">저울에 올리기</button></div>';
  }
  function stepResult() {
    var r = B.r, n = filledOf(r.scores), it = B.item, F = FORMS[B.form], rec = FK(it.form);
    var w = r.weakest, adv = '';
    if (w) { var sl = F.slots[r.at[w]] || F.slots[0], sc = SCALES.filter(function (x) { return x.id === w; })[0]; adv = '<b>' + sl.title + ' 칸 하나만 바꾸면</b> ' + sc.name + ' 저울이 채워져요. ' + e(String(r.why[w] || '').split(/(?<=[.요다])\s/)[0]); }
    var code = resultCode(it.id, B.form, r.scores), url = SITE + '?r=' + encodeURIComponent(code);
    return '<div class="bx"><p class="small muted" style="text-align:center">' + e(it.id) + ' · ' + F.label + '</p><div class="bscore">' + n + ' / 5</div><p class="big" style="text-align:center;margin-top:0">채운 저울</p>' +
      SCALES.map(function (x) { var v = r.scores[x.id] || 0; return '<div class="bsc"><b>' + x.name + '</b><span>' + [0, 1, 2].map(function (k) { return '<i class="' + (k < v ? 'on' : '') + '"></i>'; }).join('') + '</span><small class="muted">' + x.q + '</small></div>'; }).join('') +
      (adv ? '<div class="badv">' + adv + '</div>' : '') +
      (rec !== B.form ? '<p class="muted">이 질문은 <b>' + FORMS[rec].label + '</b>이 더 잘 맞아요. 카드 뒷면의 예시 답을 보세요.</p>' : '') +
      '<div class="bqr">' + qrSvg(url, 190) + '<div><b>결과 이미지를 휴대폰에</b><br><small class="muted">카메라로 찍으면 결과 이미지를 저장할 수 있어요. 답 문장은 담기지 않아요.</small></div></div>' +
      (B.who === 'teacher' ? '<div class="badv" style="border-left-color:' + COL.navy + '"><b>선생님이시군요!</b> 수업에서 쓰는 법을 안내해 드릴게요. 옆 상담 자리에서 선생님용 안내물을 받아 가세요.</div>' : '') +
      '<div class="brow" style="grid-template-columns:1fr 1fr;margin-top:14px">' + (B.retried ? '' : '<button class="bbtn ghost" data-b="retry">한 번 더 해 보기</button>') + '<button class="bbtn" data-b="home">처음으로</button></div></div>';
  }
  function statsPanel() {
    var s = stats(), ds = Object.keys(s).sort().reverse();
    return '<div class="bx bstats"><h1>부스 통계</h1><p class="muted">이 태블릿에 저장된 숫자만 보여요. 개인정보는 없어요.</p><table><tr><th>날짜</th><th>체험</th><th>CRIB</th><th>PREP</th><th>AWHA</th><th>저울 평균</th><th>학생</th><th>선생님</th><th>일반</th><th>다시</th></tr>' +
      ds.map(function (d) { var x = s[d]; return '<tr><td>' + d + '</td><td>' + x.n + '</td><td>' + x.CRIB + '</td><td>' + x.PREP + '</td><td>' + x.AHWA + '</td><td>' + (x.n ? (x.filled / x.n).toFixed(1) : '-') + '</td><td>' + x.student + '</td><td>' + x.teacher + '</td><td>' + x.general + '</td><td>' + x.retry + '</td></tr>'; }).join('') +
      '</table><button class="bbtn" data-b="csv">CSV 내려받기</button><button class="bbtn ghost" data-b="home">닫기</button></div>';
  }
  var timer = null;
  function draw() {
    clearInterval(timer);
    var v = document.getElementById('view');
    v.innerHTML = { start: stepStart, q: stepQ, form: stepForm, speak: stepSpeak, result: stepResult, stats: statsPanel }[B.step]();
    window.scrollTo(0, 0);
    if (B.step === 'speak') {
      var left = 30, el = document.getElementById('bTimer');
      timer = setInterval(function () { left--; el.textContent = left > 0 ? left : '끝!'; if (left <= 0) { el.classList.add('end'); clearInterval(timer); } }, 1000);
      var t = v.querySelector('textarea'); if (t) t.focus();
    }
    if (B.step === 'start') {
      var taps = 0, tt = null, h = document.getElementById('bTitle');
      h.addEventListener('click', function () { taps++; clearTimeout(tt); tt = setTimeout(function () { taps = 0; }, 2000); if (taps >= 5) { B.step = 'stats'; draw(); } });
    }
  }
  function boothAct(a, val) {
    if (a === 'who') { B.who = val; B.step = 'q'; }
    else if (a === 'pickQ' || a === 'randQ') { B.item = a === 'randQ' ? ITEMS[Math.floor(Math.random() * ITEMS.length)] : BY[val]; B.step = 'form'; }
    else if (a === 'form') { B.form = val; B.slots = ['', '', '', '']; B.step = 'speak'; }
    else if (a === 'score') {
      document.querySelectorAll('[data-bs]').forEach(function (t) { B.slots[+t.dataset.bs] = t.value; });
      if (!B.slots.some(function (x) { return x.trim(); })) { toast('네 칸 중 한 칸은 적어 주세요.', 'think'); return; }
      B.r = scoreAnswer(B.form, B.slots, B.item.q);
      var n = filledOf(B.r.scores), form = B.form, who = B.who;
      if (B.retried) { var gain = n - B.first; addStat(function (d) { d.retry++; d.retryGain += gain; }); }
      else { B.first = n; addStat(function (d) { d.n++; d[form]++; d.filled += n; if (d[who] != null) d[who]++; }); }
      B.step = 'result';
    }
    else if (a === 'retry') { B.retried = true; B.step = 'speak'; }
    else if (a === 'home') { B = { step: 'start' }; }
    else if (a === 'csv') {
      var url = URL.createObjectURL(new Blob([csv()], { type: 'text/csv' })), l = document.createElement('a');
      l.href = url; l.download = 'booth-stats-' + todayKey() + '.csv'; document.body.appendChild(l); l.click(); l.remove(); return;
    }
    draw();
  }
  document.addEventListener('click', function (ev) {
    if (!window.EXPO_BOOTH) return; var el = ev.target.closest('[data-b]'); if (!el) return;
    ev.preventDefault(); boothAct(el.dataset.b, el.dataset.v);
  });
  document.addEventListener('keydown', function (ev) {
    if (!window.EXPO_BOOTH || ev.key !== 'Enter') return; var el = ev.target.closest && ev.target.closest('.bform'); if (el) boothAct('form', el.dataset.v);
  });

  // ---------- 시작 ----------
  window.EXPO_START = function () {
    if (P.get('booth') === '1') { bootBooth(); return true; }
    var r = parseResult(P.get('r'));
    if (r) {
      history.replaceState(null, '', location.pathname + '#home');
      var v = document.getElementById('view'); v.innerHTML = viewReceived(r);
      document.getElementById('rImg').addEventListener('click', function () { imageSheet({ item: r.item, who: r.item.who, q: r.item.q, form: r.form, scores: r.scores }); });
      document.getElementById('rAgain').addEventListener('click', function () { openQuestion(r.item.id); });
      return true;
    }
    var q = (P.get('q') || '').toUpperCase();
    if (q && BY[q]) { history.replaceState(null, '', location.pathname + '#forms'); openQuestion(q); return true; }
    // 첫 화면은 expo.js가 읽히기 전에 그려지므로 여기서 한 번 더 그린다
    if (['origin', 'youth'].indexOf((location.hash || '').slice(1)) >= 0) render(); else afterRender();
    return false;
  };
})();

if (window.EXPO_START) window.EXPO_START();
