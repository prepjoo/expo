// 콘텐츠 자동 검사: 40자, 숫자, 예시 80점 이상, 함정 40점 이하, 칸 순서를 바꾸면 점수 하락, 프렙·아하의 처음과 끝은 다른 문장
const S = require('./scorer.js')();
const C = require('../content/questions.json');
let bad = 0;
for (const it of C.items) {
  const errs = [];
  it.slots.forEach((s, i) => { if (s.length > 40) errs.push(`칸${i + 1} ${s.length}자`); });
  const numIdx = it.form === 'PREP' ? 2 : it.form === 'AWHA' ? 2 : -1;
  if (!/\d|절반|세 번|한 달/.test(it.slots.join(''))) errs.push('숫자 없음');
  if (numIdx >= 0 && !/\d/.test(it.slots[numIdx])) errs.push('사례·방법 칸 숫자 없음');
  const F = it.form === 'AWHA' ? 'AHWA' : it.form;
  const r = S.scoreAnswer(F, it.slots, it.q);
  const t = S.scoreAnswer(F, [it.trap, '', '', ''], it.q).total;
  const rev = S.scoreAnswer(F, [it.slots[3], it.slots[2], it.slots[1], it.slots[0]], it.q).total;
  const sw = S.scoreAnswer(F, [it.slots[2], it.slots[3], it.slots[0], it.slots[1]], it.q).total;
  if (r.total < 80) errs.push(`예시 ${r.total}점`);
  if (it.form !== 'CRIB' && S.nearSame(it.slots[0], it.slots[3])) errs.push('첫 칸과 마지막 칸이 같은 문장');
  if (t > 40) errs.push(`함정 ${t}점`);
  if (rev >= r.total || sw >= r.total) errs.push(`순서 바꿔도 ${Math.max(rev, sw)}점`);
  const sc = Object.entries(r.scores).map(([k, v]) => k[0] + v).join(' ');
  console.log(`${errs.length ? '✗' : '✓'} ${it.id} ${it.form} ${r.total}점 (함정 ${t}, 뒤섞기 ${Math.max(rev, sw)}) [${sc}] ${errs.join(', ')}${errs.length && r.weakest ? ' · 약한 저울 ' + r.weakest : ''}`);
  if (errs.length) bad++;
}
console.log(bad ? `\n고칠 묶음 ${bad}개` : '\n모두 통과');
process.exit(bad ? 1 : 0);
