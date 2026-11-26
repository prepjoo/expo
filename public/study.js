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
      power: ['문제를 정의하는 힘', '무엇이 문제이고 무엇을 잃는지 밝혀요.'],
      ai: 'AI도 자료에서 문제를 찾고 순위까지 매겨요. 하지만 그중 무엇을 붙잡을지 고르고, 그 근거가 맞는지 따지고, 결과를 책임지는 일은 사람의 몫이에요. 이것이 AI 시대에 가장 중요한 역량 중 하나인 문제를 정의하는 능력이에요.',
      def: '여는 삼지작법은 두 가지 일을 해요. 생각할 때는 문제를 정의하고(C·R) 해결을 내놓는(I·B) 틀이고, 말할 때는 듣는 사람을 내 아이디어로 끌어들이는 설득의 순서예요.',
      groups: { 0: ['문제 정의', 'C·R · 무엇이 문제이고 무엇을 잃나'], 2: ['해결 제시', 'I·B · 어떻게 막고 무엇을 얻나'] },
      when: '먼저 말을 꺼낼 때: 회의 제안, 업무 보고, 발표 첫 30초, 기획서·보고서 도입부',
      rows: [
        ['상황', '지금 무슨 일이 있나요?', '듣는 사람도 아는 상황에서 출발해요. 한 걸음 더: "그런데"로 몰랐던 사실을 붙여요. 숫자는 직접 세면 돼요(몇 명, 몇 번, 몇 분).'],
        ['손실', '해결하지 않으면 무엇을 잃나요?', '듣는 사람이 잃는 시간·돈·기회를 말해요.'],
        ['아이디어', '그래서 어떻게 하자는 건가요?', '손실을 막을 해결책을, 버린 대안("~대신")과 함께 제안해요.'],
        ['이익', '해결되면 나는 무엇을 얻나요?', '얻는 것을 숫자로 말하고, 언제부터 해 보자고 요청해요.']
      ],
      why: [
        '<b>문제 = 불안정한 상황 + 그로 인한 손실.</b> 상황만 말하면 듣는 사람에게는 남의 일이에요. 손실이 붙어야 "내 일"이 돼요.',
        '듣는 사람의 가장 큰 질문은 <b>"그래서 나와 무슨 상관인데?"</b>(What\'s In It For Me)예요. 손실과 이익이 바로 그 답이에요.',
        '사람을 움직이는 힘은 두 가지, <b>고통을 피하려는 마음과 기쁨을 얻으려는 마음</b>이라고 마케팅 전문가 조 비테일은 말해요. 크립은 손실(고통)로 귀를 열고 이익(기쁨)으로 발을 움직여요.',
        '바바라 민토의 피라미드 글쓰기 도입부(상황 → 그런데 → 질문 → 답)처럼 <b>듣는 사람이 아는 상황에서 출발하고, "그런데"로 몰랐던 사실을 붙여</b> 주의를 끌어요. 아리스토텔레스의 설득 순서(주의 끌기 → 문제 → 해결 → 이점)와도 같은 흐름이에요.'
      ],
      ex: 'M-04',
      rules: [
        '상황(C)은 아는 상황 + "그런데" + 몰랐던 사실: "회의를 매주 해요. 그런데 4번 중 3번은 결론 없이 끝났어요." 숫자는 직접 세면 돼요.',
        '손실(R)은 듣는 사람 쪽에서: 내가 힘든 것보다 상대가 잃는 것을 말해요.',
        '아이디어(I)는 손실을 막는 것이어야 해요. 손실과 아이디어가 짝이 맞는지 확인하세요.',
        '이익(B)은 얻는 것 + 요청: "4주만 시험해 주십시오"처럼 언제, 얼마나를 붙여요.'
      ],
      mistake: '해결책부터 꺼내는 것. 무엇을 잃고 있는지 모르는 사람에게 해결책은 남의 일로 들려요.',
      uses: ['회의 안건 제안', '팀장에게 첫 보고', '발표 첫 30초', '기획서·사업계획서 도입부', '자기소개 30초', '가족·동아리에 새 규칙 제안']
    },
    PREP: {
      en: ['Point', 'Reason', 'Example', 'Point'],
      power: ['생각을 증명하는 힘', '내 주장을 이유와 사례로 증명해요.'],
      def: '주장을 먼저 말하고, 이유로 받치고, 사례로 증명한 뒤, 다시 주장으로 맺는 짜임이에요.',
      when: '주장할 때: 면접 답변, 토론, 의견 말하기, 보고의 결론',
      rows: [
        ['결론', '그래서 하고 싶은 말이 뭔가요?', '질문의 단어로 결론부터 한 문장에 말해요.'],
        ['이유', '왜 그렇게 말할 수 있나요?', '"~때문입니다"로 이유를 대요. 이유 대신 방법이 와도 돼요.'],
        ['사례', '정말 그런가요? 보여 줄 수 있나요?', '숫자·자료·사실·전문가 의견으로 눈에 보이게 증명해요.'],
        ['다시 결론', '그래서 앞으로 어떻게 하나요?', '처음 결론과 같은 뜻을, 다른 문장으로 적용·실천(다짐이나 제안)으로 맺어요.']
      ],
      why: [
        '<b>인명학과 맞물려요.</b> 진나 이전의 인명학은 종(宗)·인(因)·유(喩)·합(合)·결(結)의 다섯 갈래(오지작법)였고, 진나는 되풀이인 합·결을 줄여 삼지작법으로 정리했어요. 프렙의 P·R·E는 종·인·유의 일을 하고, 마지막 P는 합·결과 하는 일이 닮았어요. 같은 것은 아니에요. 세 삼지작법은 옛 형식을 그대로 옮긴 게 아니라 현대 말하기에 맞게 새로 짠 응용 모델이에요.',
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
      power: ['움직임을 만드는 힘', '상대에게 행동을 요청해, 문제 해결을 위한 움직임을 만들어 내요.'],
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
    ['PREP', 'P 결론', '옳고 그름을 판단·주장', '맨 앞, 그리고 맨 끝(P′)', '"AI가 쓴 과제를 그대로 내면 안 됩니다."', '~입니다 / ~해야 합니다'],
    ['AHWA', 'A 행동', '상대가 할 일을 권함', '맨 앞, 그리고 맨 끝(A′)', '"AI 초안은 꼭 내 말로 고쳐 쓰세요."', '~하세요'],
    ['CRIB', 'I 아이디어', '해결책을 제안', '손실(R) 다음, 셋째 칸', '"AI를 금지하는 대신, 쓴 곳을 표시하고 내 말로 고치자고 제안합니다."', '~하자고 제안합니다']
  ];

  var badge = function (role, key) { return '<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:var(--' + role + ');color:#fff;font-weight:800;flex:0 0 28px">' + key + '</span>'; };
  var bold1 = function (w) { return '<b>' + w.charAt(0) + '</b>' + w.slice(1); };
  // 접었다 펴는 목록: 한 번에 하나만 열려요
  var fold = function (key, title, body) {
    var open = S.ui.studyFold === key;
    return '<div class="fold' + (open ? ' open' : '') + '"><button class="fold-h" data-act="studyFold" data-v="' + key + '" aria-expanded="' + open + '"><span>' + title + '</span><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>' + (open ? '<div class="fold-b">' + body + '</div>' : '') + '</div>';
  };
  var card = function (title, body) { return '<section class="card"><h2 class="sec" style="margin-top:0">' + title + '</h2>' + body + '</section>'; };

  function view(k) {
    var F = FORMS[k], d = D[k], R = ROLE_OF[k], it = BY[d.ex];
    var tabs = '<div class="seg-tabs f" role="tablist" aria-label="삼지작법 고르기">' + Object.keys(FORMS).map(function (x) { return '<button role="tab" aria-selected="' + (x === k) + '" data-act="go" data-v="study-' + SLUG[x] + '" data-form="' + x + '">' + fmono(x) + FORMS[x].label + '</button>'; }).join('') + '</div>';
    var head = pageHead('삼지작법', '종·인·유 세 칸을 상황에 맞는 순서로 쓰는 세 가지 말하기 틀이에요.') + tabs +
      '<h2 class="lp-h">' + F.label + ' · ' + F.code + '</h2><p class="lp-sub">' + F.pron + ' · ' + d.en.join(' → ') + '</p>';
    var power = '<section class="card lp-power"><p class="lp-pw"><span>AI 시대 역량</span><b>' + d.power[0] + '</b></p><p class="lp-pd">' + d.power[1] + (d.ai ? ' ' + d.ai : '') + '</p>' +
      '<p class="lp-loop"><b>문제를 풀 때</b> ' + ['CRIB', 'PREP', 'AHWA'].map(function (x) { return '<span class="' + (x === k ? 'on' : '') + '">' + D[x].power[0] + '</span>'; }).join('<i>→</i>') + '</p></section>';
    var intro = power + '<section class="card" style="display:flex;gap:16px;align-items:center"><img src="' + ICON[k] + '" width="96" height="96" alt="' + F.code + '" style="flex:0 0 96px">' +
      '<div><p class="body-tx" style="margin:0 0 6px"><b>' + esc(d.def) + '</b></p><p class="small muted" style="margin:0">' + esc(d.when) + ' · 목표 ' + F.target + '초</p></div></section>';
    var table = card('네 칸', d.rows.map(function (r, i) {
      var g = d.groups && d.groups[i];
      return (g ? '<p class="lp-grp' + (i ? ' next' : '') + '"><b>' + g[0] + '</b> ' + g[1] + '</p>' : '') + '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 0;' + (i && !(d.groups && d.groups[i]) ? 'border-top:1px solid var(--line)' : '') + '">' + badge(R[i], F.slots[i].key) +
        '<div style="flex:1"><div><b>' + bold1(d.en[i]) + ' ' + r[0] + '</b> <small style="color:var(--' + R[i] + ');font-weight:700">' + HAN[R[i]] + ' ' + MEAN[R[i]] + '</small></div>' +
        '<div class="small" style="margin:2px 0">듣는 사람: "' + esc(r[1]) + '"</div><div class="small muted">' + esc(r[2]) + '</div></div></div>';
    }).join('') + (k === 'AHWA' ? '<p class="small" style="margin:10px 0 0;padding:10px 12px;background:var(--in-soft);border-radius:10px"><b style="color:var(--in)">W와 H는 나란히</b> · A(宗) → [ W 왜(因) | H 어떻게(因) ] → A(宗). 왜와 어떻게는 위아래가 아니라 행동을 함께 받치는 두 기둥이에요.</p>' : ''));
    var why = fold('why', '왜 이 순서일까요?', '<ul class="body-tx" style="padding-left:1.1em;margin:0">' + d.why.map(function (w) { return '<li style="margin:6px 0">' + w + '</li>'; }).join('') + '</ul>' +
      (d.weight ? '<p class="small" style="margin:12px 0 4px"><b>프렙의 정보 배분</b> · 결론은 짧고 무겁게, 사례는 길고 구체적으로</p><table style="width:100%;border-collapse:collapse;font-size:.9em"><tr style="color:var(--muted)"><th style="text-align:left;padding:4px">칸</th><th style="text-align:right;padding:4px">중요도</th><th style="text-align:right;padding:4px">분량</th></tr>' +
        d.weight.map(function (w, i) { return '<tr style="border-top:1px solid var(--line)"><td style="padding:4px;color:var(--' + R[i] + ');font-weight:700">' + w[0] + '</td><td style="text-align:right;padding:4px">' + w[1] + '</td><td style="text-align:right;padding:4px">' + w[2] + '</td></tr>'; }).join('') + '</table>' : ''));
    var exb = fold('exb', '한 묶음 예시', '<p class="small muted" style="margin:0 0 6px">' + esc(it.who) + '의 질문</p><p class="body-tx" style="margin:0 0 8px"><b>"' + esc(it.q) + '"</b></p>' +
      it.slots.map(function (s, i) { return '<div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0">' + badge(R[i], F.slots[i].key) + '<div class="body-tx" style="margin:0">' + esc(s) + '</div></div>'; }).join('') +
      '<div class="note"><p><b>함정</b> ' + esc(it.trap) + '</p><span class="small muted">' + esc(it.trapWhy) + '</span></div>' +
      (k !== 'CRIB' ? '<p class="small" style="margin:10px 0 0"><b>같은 뜻, 다른 문장</b> · 첫 ' + F.slots[0].key + '은 지금의 ' + (k === 'PREP' ? '주장' : '행동 제안') + ', 마지막 ' + F.slots[3].key + '은 ' + (k === 'PREP' ? '요약과 앞으로 할 일' : '시점과 첫걸음을 붙인 다시 촉구') + '예요. 같은 문장을 되풀이하면 앱의 \'끝맺음\' 점수가 낮아져요.</p>' : ''));
    var rules = fold('rules', '이것만은 지켜요', '<ol class="body-tx" style="padding-left:1.2em;margin:0">' + d.rules.map(function (r) { return '<li style="margin:6px 0">' + esc(r) + '</li>'; }).join('') + '</ol>' +
      '<p class="note"><b>흔한 실수</b> ' + esc(d.mistake) + '</p>');
    var two = k !== 'CRIB' ? '' : fold('two', '이름이 둘인 까닭', '<p class="body-tx" style="margin:0 0 10px">여는 삼지작법은 <b>문제를 정의하는 삼지작법</b>이기도 해요. 하는 일이 둘이기 때문이에요.</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.9em"><tr style="color:var(--muted)"><th style="padding:4px"></th><th style="text-align:left;padding:4px">문제를 정의할 때</th><th style="text-align:left;padding:4px">말을 열 때</th></tr>' +
      [['언제', '말하기 전, 혼자 생각을 정리할 때', '아무도 묻지 않았는데 내가 먼저 꺼낼 때'], ['누구에게', '나에게 묻기', '듣는 사람에게 말하기'], ['중심 칸', 'C·R: 무엇이 문제이고 누가 무엇을 잃나', '네 칸 전체: 사실로 귀를 열고 이익으로 움직이게'], ['끝나면', '붙잡을 문제 하나가 정해져요', '듣는 사람이 먼저 “그럼 어떻게 해?”라고 물어요']].map(function (r) { return '<tr style="border-top:1px solid var(--line)"><td style="padding:6px 4px;font-weight:700;white-space:nowrap;vertical-align:top">' + r[0] + '</td><td style="padding:6px 4px;vertical-align:top">' + r[1] + '</td><td style="padding:6px 4px;vertical-align:top">' + r[2] + '</td></tr>'; }).join('') + '</table>' +
      '<p class="small" style="margin:10px 0 0">먼저 C·R로 문제를 정의하고(생각), 그 C·R을 그대로 첫 두 칸 삼아 말을 열어요(말하기). 문제를 제대로 정의해 두지 않으면 말을 열 수도 없어요.</p>');
    var pre = k !== 'CRIB' ? '' : fold('pre', '꺼내기 전에 문제부터 따져 보기', '<p class="body-tx" style="margin:0 0 8px">여는 삼지작법은 문제를 남에게 <b>꺼내는</b> 틀이에요. 꺼내기 전에 그게 정말 문제인지 혼자 따져 볼 때는 <b>받치는 삼지작법(PREP)</b>을 쓰세요.</p>' +
      [['P', 'jong', '무엇이 문제인가', '지난 과제에서 AI 문장을 출처 없이 쓴 것이 문제다.'], ['R', 'in', '왜 문제인가', '확인하지 않은 문장 때문에 점수와 신뢰를 함께 잃기 때문이다.'], ['E', 'yu', '사례와 숫자', '우리 조 과제에서 출처 없는 문장 12곳이 걸려 10점이 깎였다.']].map(function (x) { return '<div style="display:flex;gap:10px;align-items:flex-start;margin:8px 0">' + badge(x[1], x[0]) + '<div class="body-tx" style="margin:0"><b>' + x[2] + '</b> · ' + x[3] + '</div></div>'; }).join('') +
      '<p class="small" style="margin:10px 0">이렇게 따져 본 P·R·E가 그대로 C(상황)와 R(손실)의 재료가 돼요. 사례 하나로 부족하면 같은 일이 또 있었는지, 반대 경우는 없는지 더 찾아봐요.</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:.9em"><tr style="color:var(--muted)"><th style="text-align:left;padding:4px">단계</th><th style="text-align:left;padding:4px">누가</th><th style="text-align:left;padding:4px">앱에서</th></tr>' +
      [['① 찾기·분석', 'AI와 함께', '자료 조사, 문제 후보 모으기'], ['② 고르기', '나', 'PREP으로 따지고 C·R로 정하기'], ['③ 따지기', '나 + 삼지작법', '재기 · 다섯저울 ② 가려내라'], ['④ 실행·다시 보기', '나', 'AWHA의 마지막 A, 고쳐 말하기']].map(function (r) { return '<tr style="border-top:1px solid var(--line)"><td style="padding:4px;font-weight:700">' + r[0] + '</td><td style="padding:4px">' + r[1] + '</td><td style="padding:4px">' + r[2] + '</td></tr>'; }).join('') + '</table>');
    var jong = fold('jong', '宗은 하나, 쓰임은 셋', '<p class="small muted" style="margin:0 0 8px">크립의 I, 프렙의 P, 아하의 A는 모두 <b style="color:var(--jong)">종(宗)</b>이에요. 같은 주제(AI 과제)라도 삼지작법에 따라 종을 다르게 말해요.</p>' +
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
    return head + intro + table + '<section class="card fold-list">' + why + two + exb + rules + pre + jong + '</section>' + uses + nav;
  }
  window.viewStudy = function (slug) {
    try { localStorage.setItem('b5adult:lastStudy', slug); } catch (e) {}
    var k = { crib: 'CRIB', prep: 'PREP', awha: 'AHWA' }[slug];
    return k ? view(k) : '';
  };
})();

if (/^#study-/.test(location.hash) && typeof render === 'function') render();
