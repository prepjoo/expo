// 앱의 채점기(app.js)를 그대로 불러와 node에서 쓰는 도우미
const fs = require('fs'), vm = require('vm'), path = require('path');
const P = f => path.join(__dirname, '..', 'public', f);
function load() {
  const app = fs.readFileSync(P('app.js'), 'utf8');
  const a = app.indexOf('// ---------- scoring (rule based)'), b = app.indexOf('const FOLLOW');
  const ctx = { console }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(P('data.js'), 'utf8') + '\nconst clamp=(v,a,b)=>Math.max(a,Math.min(b,v));\n' + app.slice(a, b) + '\nthis.scoreAnswer=scoreAnswer;this.FORMS=FORMS;', ctx);
  return ctx;
}
module.exports = load;
