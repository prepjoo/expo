/* 성인·박람회판 대상 데이터
   청소년판 data.js·persona.js의 학교급(초·중·고)을 '성인(대학생 포함)' 하나로 바꾸고,
   질문은 content.js(카드와 같은 원본)에서 읽어 옵니다. */
(function () {
  'use strict';
  var C = window.CONTENT;
  var FK = function (f) { return f === 'AWHA' ? 'AHWA' : f; };   // 앱 안의 열쇠 이름은 AHWA, 화면 표기는 AWHA

  // 1) 대상: 성인 하나 (청소년은 청소년판 앱으로 안내)
  Object.keys(LEVELS).forEach(function (k) { delete LEVELS[k]; });
  LEVELS.adult = { label: '대학생·직장인', sub: '' };

  // 2) 영역 5개: 학업·AI, 취업 면접, 일·회의, 관계·대화, 불교·마음
  Object.keys(AREAS).forEach(function (k) { delete AREAS[k]; });
  Object.keys(C.areas).forEach(function (k) { AREAS[k] = C.areas[k]; });
  Object.keys(LEVEL_AREAS).forEach(function (k) { delete LEVEL_AREAS[k]; });
  LEVEL_AREAS.adult = Object.keys(C.areas);

  // 3) 질문: 카드와 같은 번호(M-07, B-03)
  Object.keys(QUESTIONS).forEach(function (k) { delete QUESTIONS[k]; });
  QUESTIONS.adult = {};
  LEVEL_AREAS.adult.forEach(function (a) { QUESTIONS.adult[a] = []; });
  C.items.forEach(function (it) {
    QUESTIONS.adult[it.area].push({ id: it.id, who: it.who, q: it.q, form: FK(it.form) });
  });
  window.CONTENT_BY_ID = {};
  C.items.forEach(function (it) { window.CONTENT_BY_ID[it.id] = it; });

  var byId = window.CONTENT_BY_ID;

  // 4) 대상별 예시 묶음
  PERSONAS.adult = {
    follow: '꼬리질문', asker: '듣는 사람',
    choiceEx: { CRIB: '자기소개, 회의 제안, 발표 첫 30초', PREP: '지원 동기, 내 강점, 토론 주장', AHWA: '"어떻게 해야 하나요?"' },
    line: 'AI 시대에 내 생각을 증명하려는 대학생·직장인',
    label: '대학생·직장인', sub: '수업·면접·회의',
    desc: '수업·면접·회의에서 내 말로 증명하는 사람',
    scene: '면접·발표·회의', listener: '면접관·교수님·팀장',
    material: '수업 과제, 아르바이트, 회사 일',
    bad: '저는 어디서든 성실하다는 말을 듣습니다.', badTag: '→ 꼬리질문이 붙어요',
    good: '주문 취소 300건을 분류해 취소율을 12%에서 7%로 낮췄습니다.', goodTag: '→ 증명이 보여요',
    reco: 'PREP', cta: '"본인의 강점은?"에 답해 보기'
  };
  FORM_EX.adult = { CRIB: byId['M-03'].slots, PREP: byId['M-09'].slots, AHWA: byId['M-15'].slots };
  SCALE_EX.adult = {
    pick: ['B안을 골랐습니다.', 'A안보다 비용은 10% 높지만 고객 이탈을 막기 때문에 B안을 골랐습니다.'],
    fact: ['취소가 많이 줄었습니다.', '주문 취소율이 12%에서 7%로 낮아졌습니다.'],
    contrast: ['회의 방식을 바꿨습니다.', '90분이던 주간 회의가 30분으로 줄었습니다.'],
    fit: ['(입사 전 경험부터 순서대로 나열)', '결론부터 말씀드리면, 숫자로 문제를 찾는 사람입니다.'],
    move: ['입사하면 열심히 하겠습니다.', '입사하면 첫 달에 팀의 숫자부터 살피겠습니다.']
  };
  HOME_EX.adult = { hi: 2, slots: byId['M-09'].slots };
  SCALE_LR.adult = {
    pick: ['B안: 고객 이탈을 막는 안', 'A안: 비용이 10% 싼 안'],
    fact: ['취소율이 12%에서 7%로 낮아졌다', '고객이 더 만족한 것 같다'],
    contrast: ['안건 없이, 주간 회의 90분', '안건을 미리 올린 뒤, 30분'],
    fit: ['입사 전 경험 전부를 순서대로', '그래서 우리 팀에서 무엇을 할 사람인지'],
    move: ['알리지 않으면 고칠 시간을 잃습니다', '오늘 알리면 하루 만에 맞출 수 있습니다']
  };
  SAMPLE_CARDS.adult = [
    { title: '카페 재고 관리', sit: '대학 2~3학년, 동네 카페 아르바이트 2년', prob: '매주 우유 20팩이 유통기한을 넘겨 버려졌다',
      judge: '감으로 주문하는 대신 요일별 판매량을 기록해 주문했다. 원인이 주문량이라서', act: '4주 동안 요일별 판매량을 표로 적고 주문표를 바꿨다',
      res: '버리는 우유 주 20팩 → 3팩', learn: '기록해 보면 원인이 보인다', qs: '자기소개, 강점 질문' },
    { title: '조별 과제 AI 사용 규칙', sit: '3학년 전공 수업, 4명 조', prob: '조원 3명이 AI 답을 그대로 붙여 출처 없는 문장 12곳으로 10점 감점',
      judge: 'AI를 금지하는 대신 쓴 곳을 표시하고 내 말로 고치게 했다. 금지는 지켜지지 않아서', act: '공유 문서에 AI 사용 칸을 만들고 발표 전 서로 질문 3개씩 했다',
      res: '다음 과제 감점 10점 → 0점, 질문 답변 1개 → 3개', learn: 'AI는 초안, 결론은 내 말로', qs: 'AI 활용 질문, 협업 질문' },
    { title: '고객 문의 답변 틀', sit: '입사 1년 차, 고객지원팀', prob: '문의 1,200건, 답변이 평균 2일 늦어 불만 45건',
      judge: '사람을 늘리는 대신 자주 묻는 질문 10개를 답변 틀로 만들었다. 문의의 60%가 같은 질문이라서', act: '한 달 문의를 분류해 답변 틀 10개를 만들고 팀에 공유했다',
      res: '답변 2일 → 반나절', learn: '많이 묻는 것부터 줄이면 전체가 빨라진다', qs: '업무 개선 질문, 보고' }
  ];

  // 5) 워드댄싱: 묶음의 네 칸과 함정 문장으로 만든 배치 연습
  function drill(id) {
    var it = byId[id], ids = ['k0', 'k1', 'k2', 'k3'];
    var ch = it.slots.map(function (t, i) { return { id: ids[i], text: t, ans: i }; });
    ch.push({ id: 'kx', text: it.trap, ans: -1 });
    var ORDERS = [[2, 4, 0, 3, 1], [3, 0, 4, 1, 2], [1, 3, 2, 4, 0], [4, 2, 1, 0, 3], [0, 4, 3, 2, 1], [2, 1, 4, 3, 0]];
    var order = ORDERS[(parseInt(id.replace(/\D/g, ''), 10) || 0) % ORDERS.length];
    return { id: id, question: it.who + ': ' + it.q, chunks: order.map(function (i) { return ch[i]; }), trapWhy: it.trapWhy, hint: it.hint || '' };
  }
  // 삼지작법마다 기본 묶음(M) 6문제. 불교 확장팩(B)은 감수 뒤에 더해요.
  ['CRIB', 'PREP', 'AHWA'].forEach(function (f) {
    var key = f === 'AHWA' ? 'AWHA' : f;
    var list = (window.CONTENT && CONTENT.items || []).filter(function (x) { return x.set === 'mini' && (x.form === key || x.form === f); }).map(function (x) { return drill(x.id); });
    DRILL[f].adultList = list;
    DRILL[f].adult = list[0];
  });
})();
