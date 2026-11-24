/* 더 공부하기: 크립·프렙·아하 상세 설명 (#study-crib, #study-prep, #study-awha)
   근거 자료: 프로젝트 지침(01_CRIB 기법 기본지침, 02_PREP 기법 기본지침, 아하 개정 기준, Deep Writing BALANCE, 프렙 원고)
   종인유 고유색: 宗 var(--jong) 빨강 · 因 var(--in) 파랑 · 喩 var(--yu) 초록 */
(function () {
  'use strict';
  var BY = window.CONTENT_BY_ID;
  var HAN = { jong: '종(宗)', in: '인(因)', yu: '유(喩)' };
  var MEAN = { jong: '주장', in: '근거', yu: '사례' };
  var ICON = { CRIB: 'icons/crib.png?v=3', PREP: 'icons/prep.png?v=3', AHWA: 'icons/awha.png?v=3' };
  var SLUG = { CRIB: 'crib', PREP: 'prep', AHWA: 'awha' };

  var D = {
    CRIB: {
      en: ['Condition', 'Risk', 'Idea', 'Benefit'],
      def: '문제를 "불안정한 상황"과 "그 때문에 생기는 손실"로 보여 준 뒤, 아이디어와 이익으로 듣는 사람을 움직이는 짜임이에요.',
      when: '먼저 말을 꺼낼 때: 회의 제안, 업무 보고, 발표 첫 30초, 기획서·보고서 도입부',
      rows: [
        ['상황', '내가 왜 이 문제에 주목해야 하나요?', '지금 벌어지는 일을 숫자와 사실로 보여 줘요.'],
        ['손실', '해결하지 않으면 무엇을 잃나요?', '듣는 사람이 잃는 시간·돈·기회를 말해요.'],
        ['아이디어', '그래서 어떻게 하자는 건가요?', '손실을 막을 해결책을, 버린 대안("~대신")과 함께 제안해요.'],
        ['이익', '해결되면 나는 무엇을 얻나요?', '얻는 것을 숫자로 말하고, 언제부터 해 보자고 요청해요.']
      ],
      why: [
        '<b>문제 = 불안정한 상황 + 그로 인한 손실.</b> 상황만 말하면 듣는 사람에게는 남의 일이에요. 손실이 붙어야 "내 일"이 돼요.',
        '듣는 사람의 가장 큰 질문은 <b>"그래서 나와 무슨 상관인데?"</b>(What\'s In It For Me)예요. 손실과 이익이 바로 그 답이에요.',
        '사람을 움직이는 힘은 두 가지, <b>고통을 피하려는 마음과 기쁨을 얻으려는 마음</b>이라고 마케팅 전문가 조 비테일은 말해요. 크립은 손실(고통)로 귀를 열고 이익(기쁨)으로 발을 움직여요.',
        '바바라 민토의 피라미드 글쓰기 도입부(상황 → 문제 → 질문 → 답), 아리스토텔레스의 설득 순서(주의 끌기 → 문제 → 해결 → 이점)와 같은 흐름이에요.'
      ],
      ex: 'M-04',
      rules: [
        '상황(C)은 느낌이 아니라 숫자로: "회의가 길다" 대신 "평균 90분이 걸린다".',
        '손실(R)은 듣는 사람 쪽에서: 내가 힘든 것보다 상대가 잃는 것을 말해요.',
        '아이디어(I)는 손실을 막는 것이어야 해요. 손실과 아이디어가 짝이 맞는지 확인하세요.',
        '이익(B)은 얻는 것 + 요청: "4주만 시험해 주십시오"처럼 언제, 얼마나를 붙여요.'
      ],
      mistake: '해결책부터 꺼내는 것. 무엇을 잃고 있는지 모르는 사람에게 해결책은 남의 일로 들려요.',
      uses: ['회의 안건 제안', '팀장에게 첫 보고', '발표 첫 30초', '기획서·사업계획서 도입부', '자기소개 30초', '가족·동아리에 새 규칙 제안']
    },
    PREP: {
      en: ['Point', 'Reason', 'Example', 'Point'],
      def: '주장을 먼저 말하고, 이유로 받치고, 사례로 증명한 뒤, 다시 주장으로 맺는 짜임이에요.',
      when: '주장할 때: 면접 답변, 토론, 의견 말하기, 보고의 결론',
      rows: [
        ['결론', '그래서 하고 싶은 말이 뭔가요?', '질문의 단어로 결론부터 한 문장에 말해요.'],
        ['이유', '왜 그렇게 말할 수 있나요?', '"~때문입니다"로 이유를 대요. 이유 대신 방법이 와도 돼요.'],
        ['사례', '정말 그런가요? 보여 줄 수 있나요?', '숫자·자료·사실·전문가 의견으로 눈에 보이게 증명해요.'],
        ['다시 결론', '그래서 앞으로 어떻게 하나요?', '처음 결론과 같은 뜻을, 다른 문장으로 적용·실천(다짐이나 제안)으로 맺어요.']
      ],
      why: [
        '<b>인명학과 꼭 맞물려요.</b> 진나 이전의 인명학은 종(宗)·인(因)·유(喩)·합(合)·결(結)의 다섯 갈래(오지작법)였고, 진나는 되풀이인 합·결을 줄여 삼지작법으로 정리했어요. 프렙의 P·R·E는 종·인·유, 마지막 P는 합·결에 해당해요.',
        '좋은 고전 글들은 <b>주장을 앞세우고 세부 내용으로 받친다</b>는 분석에서 나온 "힘있는 글쓰기"(주장 → 근거 → 증명 → 주장)의 원칙이 곧 프렙이에요.',
        '<b>종이 없으면 얼굴 없는 글, 인이 없으면 허리 없는 글, 유가 없으면 팔다리 없는 글</b>이에요. 세 갈래가 다 있어야 논리가 서요.'
      ],
      weight: [['P 결론', '40%', '5%'], ['R 이유', '10%', '10%'], ['E 사례', '40%', '80%'], ['P 다시 결론', '10%', '5%']],
      ex: 'M-09',
      rules: [
        '결론(P)은 짧게, 첫 문장에: 듣는 사람이 가장 원하는 정보를 가장 적은 말로 먼저 줘요.',
        '이유(R)는 설명(머리로 납득), 사례(E)는 증명(눈으로 확인)이에요. 둘을 섞지 마세요.',
        '사례(E)에는 숫자를 꼭: "많이 줄었다" 대신 "12%에서 7%로".',
        '두 P는 같은 뜻, 다른 문장: 처음 P는 지금의 주장, 마지막 P는 요약 + 앞으로 할 일이에요.'
      ],
      mistake: '경험을 시간 순서대로 늘어놓는 것. 결론이 맨 끝에 나와서 듣는 사람이 요점을 놓쳐요.',
      uses: ['면접 답변("본인의 강점은?")', '토론·발표의 주장', '보고서 결론 문단', '의견 묻는 질문에 답하기', '자기소개서 문단', 'AI 답을 내 말로 고쳐 쓰기']
    },
    AHWA: {
      en: ['Action', 'Why', 'How', 'Action'],
      def: '"어떻게 해야 하나요?"라는 질문에 해야 할 행동부터 답하고, 왜와 어떻게로 받친 뒤, 다시 행동을 이끄는 짜임이에요.',
      when: '질문을 받고 행동으로 답할 때: 조언, 상담, 업무 지시, 면접의 상황 질문',
      rows: [
        ['행동', '그래서 무엇을 하면 되나요?', '듣는 사람이 할 행동을 먼저 제안해요("~하세요", "~해야 합니다").'],
        ['이유', '왜 그래야 하나요?', '그 행동이 필요한 까닭과 타당성을 말해요.'],
        ['방법', '어떻게 하면 되나요?', '구체적 방법을 숫자가 있는 경험과 함께 보여 줘요.'],
        ['다시 행동', '그럼 언제, 무엇부터 하나요?', '처음 행동과 같은 뜻을, 시점과 첫걸음을 붙인 다른 문장으로 촉구해요.']
      ],
      why: [
        '<b>왜(W)와 어떻게(H)는 나란한 짝이에요.</b> 둘 다 행동(宗)을 받치는 근거(因)예요. 근거에는 이유와 방법 두 가지가 있다는 것, 프렙의 R 자리에 이유 대신 방법이 와도 된다는 것과 같은 뿌리예요.',
        '사이먼 사이넥의 <b>골든서클</b>처럼 왜를 어떻게보다 먼저 말해요. 이유에 동의해야 방법에 귀를 기울이기 때문이에요.',
        '질문에 답할 때 상대가 동의하지 않으면 "왜 그런데?(Why so)", 동의하면 "어떻게?(How so)"를 묻는다는 질의응답의 원리를 한 번에 채워 줘요.',
        '골든서클과 달리 <b>맨 앞과 맨 뒤에 행동</b>을 놓아, 듣는 사람이 "그래서 무엇을 하면 되지?"를 처음부터 알고 끝까지 기억하게 해요.'
      ],
      ex: 'M-15',
      rules: [
        '첫 A는 질문에 바로 답하는 행동 한 문장: 설명부터 시작하지 마세요.',
        'W는 "~때문입니다", H는 "저는 ~해서 ~했습니다"처럼 숫자가 있는 방법으로.',
        'W와 H는 둘 다 근거라 순서를 바꿔도 뜻은 통하지만, 왜를 먼저 말하면 더 잘 설득돼요.',
        '두 A는 같은 뜻, 다른 문장: 마지막 A에는 "오늘부터", "1개부터"처럼 시점과 첫걸음을 붙여요.'
      ],
      mistake: '"상황에 따라 다르다"로 시작하는 것. 듣는 사람은 무엇을 하면 되는지 끝내 듣지 못해요.',
      uses: ['선후배·친구의 고민 상담', '"어떻게 해야 하나요?" 면접 질문', '팀원에게 업무 지시', '고객 문의 답변', '학생·자녀에게 공부법 조언', '마감·갈등 같은 문제 상황 대응']
    }
  };

  // 宗 비교: 같은 주제(AI 시대의 과제)를 세 삼지작법의 宗으로 말하면
  var JONG = [
    ['CRIB', 'I 아이디어', '해결책을 제안', '손실(R) 다음, 셋째 칸', '"AI를 금지하는 대신, 쓴 곳을 표시하고 내 말로 고치자고 제안합니다."', '~하자고 제안합니다'],
    ['PREP', 'P 결론', '옳고 그름을 판단·주장', '맨 앞, 그리고 맨 끝(P′)', '"AI가 쓴 과제를 그대로 내면 안 됩니다."', '~입니다 / ~해야 합니다'],
    ['AHWA', 'A 행동', '상대가 할 일을 권함', '맨 앞, 그리고 맨 끝(A′)', '"AI 초안은 꼭 내 말로 고쳐 쓰세요."', '~하세요']
  ];

  var badge = function (role, key) { return '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--' + role + ');color:#fff;font-weight:800;flex:0 0 28px">' + key + '</span>'; };
  var bold1 = function (w) { return '<b>' + w.charAt(0) + '</b>' + w.slice(1); };
  var card = function (title, body) { return '<section class="card"><h2 class="sec" style="margin-top:0">' + title + '</h2>' + body + '</section>'; };

  function view(k) {
    var F = FORMS[k], d = D[k], R = ROLE_OF[k], it = BY[d.ex];
    var tabs = '<div class="seg-tabs f" role="tablist" aria-label="삼지작법 고르기">' + Object.keys(FORMS).map(function (x) { return '<button role="tab" aria-selected="' + (x === k) + '" data-act="go" data-v="study-' + SLUG[x] + '" data-form="' + x + '">' + fmono(x) + FORMS[x].label + '</button>'; }).join('') + '</div>';
    var head = tabs + pageHead(F.label + ' · ' + F.code, F.pron + ' · ' + d.en.join(' → '));
    var intro = '<section class="card" style="display:flex;gap:16px;align-items:center"><img src="' + ICON[k] + '" width="96" height="96" alt="' + F.code + '" style="flex:0 0 96px">' +
      '<div><p class="body-tx" style="margin:0 0 6px"><b>' + esc(d.def) + '</b></p><p class="small muted" style="margin:0">' + esc(d.when) + ' · 목표 ' + F.target + '초</p></div></section>';
    var table = card('네 칸', d.rows.map(function (r, i) {
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;' + (i ? 'border-top:1px solid var(--line)' : '') + '">' + badge(R[i], F.slots[i].key) +
        '<div style="flex:1"><div><b>' + bold1(d.en[i]) + ' ' + r[0] + '</b> <small style="color:var(--' + R[i] + ');font-weight:700">' + HAN[R[i]] + ' ' + MEAN[R[i]] + '</small></div>' +
        '<div class="small" style="margin:2px 0">듣는 사람: "' + esc(r[1]) + '"</div><div class="small muted">' + esc(r[2]) + '</div></div></div>';
    }).join('') + (k === 'AHWA' ? '<p class="small" style="margin:10px 0 0;padding:10px 12px;background:var(--in-soft);border-radius:10px"><b style="color:var(--in)">W와 H는 나란히</b> · A(宗) → [ W 왜(因) | H 어떻게(因) ] → A(宗). 왜와 어떻게는 위아래가 아니라 행동을 함께 받치는 두 기둥이에요.</p>' : ''));
    var why = card('왜 이 순서일까요?', '<ul class="body-tx" style="padding-left:1.1em;margin:0">' + d.why.map(function (w) { return '<li style="margin:6px 0">' + w + '</li>'; }).join('') + '</ul>' +
      (d.weight ? '<p class="small" style="margin:12px 0 4px"><b>프렙의 정보 배분</b> · 결론은 짧고 무겁게, 사례는 길고 구체적으로</p><table style="width:100%;border-collapse:collapse;font-size:.9em"><tr style="color:var(--muted)"><th style="text-align:left;padding:4px">칸</th><th style="text-align:right;padding:4px">중요도</th><th style="text-align:right;padding:4px">분량</th></tr>' +
        d.weight.map(function (w, i) { return '<tr style="border-top:1px solid var(--line)"><td style="padding:4px;color:var(--' + R[i] + ');font-weight:700">' + w[0] + '</td><td style="text-align:right;padding:4px">' + w[1] + '</td><td style="text-align:right;padding:4px">' + w[2] + '</td></tr>'; }).join('') + '</table>' : ''));
    var exb = card('한 묶음 예시', '<p class="small muted" style="margin:0 0 6px">' + esc(it.who) + '의 질문</p><p class="body-tx" style="margin:0 0 8px"><b>"' + esc(it.q) + '"</b></p>' +
      it.slots.map(function (s, i) { return '<div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0">' + badge(R[i], F.slots[i].key) + '<div class="body-tx" style="margin:0">' + esc(s) + '</div></div>'; }).join('') +
      '<div style="margin-top:10px;padding:10px 12px;background:var(--line);border-radius:10px"><span class="small"><b style="color:#6B7280">함정</b> ' + esc(it.trap) + '</span><br><span class="small muted">' + esc(it.trapWhy) + '</span></div>' +
      (k !== 'CRIB' ? '<p class="small" style="margin:10px 0 0"><b>같은 뜻, 다른 문장</b> · 첫 ' + F.slots[0].key + '은 지금의 ' + (k === 'PREP' ? '주장' : '행동 제안') + ', 마지막 ' + F.slots[3].key + '은 ' + (k === 'PREP' ? '요약과 앞으로 할 일' : '시점과 첫걸음을 붙인 다시 촉구') + '예요. 같은 문장을 되풀이하면 앱의 \'끝맺음\' 점수가 낮아져요.</p>' : ''));
    var rules = card('이것만은 지켜요', '<ol class="body-tx" style="padding-left:1.2em;margin:0">' + d.rules.map(function (r) { return '<li style="margin:6px 0">' + esc(r) + '</li>'; }).join('') + '</ol>' +
      '<p class="small" style="margin:10px 0 0;color:var(--jong)"><b>흔한 실수</b> ' + esc(d.mistake) + '</p>');
    var jong = card('宗은 하나, 쓰임은 셋', '<p class="small muted" style="margin:0 0 8px">크립의 I, 프렙의 P, 아하의 A는 모두 <b style="color:var(--jong)">종(宗)</b>이에요. 같은 주제(AI 과제)라도 삼지작법에 따라 종을 다르게 말해요.</p>' +
      JONG.map(function (j) {
        var me = j[0] === k;
        return '<div style="padding:10px 12px;margin:8px 0;border-radius:12px;border:' + (me ? '2px solid var(--jong);background:var(--jong-soft)' : '1px solid var(--line)') + '">' +
          '<div style="display:flex;justify-content:space-between;gap:8px"><b>' + FORMS[j[0]].code + ' · ' + j[1] + '</b><small class="muted">' + j[3] + '</small></div>' +
          '<div class="small" style="margin:4px 0"><b style="color:var(--jong)">' + j[2] + '</b> · 끝맺음 "' + j[5] + '"</div><div class="body-tx" style="margin:0">' + j[4] + '</div></div>';
      }).join(''));
    var uses = card('어디에 쓰나요?', '<div style="display:flex;flex-wrap:wrap;gap:6px">' + d.uses.map(function (u) { return '<span style="padding:6px 10px;border-radius:999px;background:var(--line);font-size:.88em">' + esc(u) + '</span>'; }).join('') + '</div>');
    var others = Object.keys(FORMS).filter(function (x) { return x !== k; });
    var nav = '<button class="btn" style="width:100%;margin:14px 0 8px" data-act="drillOpen" data-v="' + k + '">' + F.code + ' 워드댄싱으로 실전 연습</button>' +
      '<p class="small muted" style="text-align:center;margin-top:12px"><a href="#origin">삼지작법의 유래 보기</a></p>';
    return head + intro + table + why + exb + rules + jong + uses + nav;
  }
  window.viewStudy = function (slug) {
    try { localStorage.setItem('b5adult:lastStudy', slug); } catch (e) {}
    var k = { crib: 'CRIB', prep: 'PREP', awha: 'AHWA' }[slug];
    return k ? view(k) : '';
  };
})();

if (/^#study-/.test(location.hash) && typeof render === 'function') render();
