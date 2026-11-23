// content/questions.json → public/content.js (카드와 앱이 같은 문장을 쓰게 하는 동기화)
const fs = require('fs'), path = require('path');
const src = require('../content/questions.json');
const out = '/* 자동 생성 파일: content/questions.json을 고친 뒤 node tools/sync.js 로 다시 만드세요 */\nwindow.CONTENT = ' + JSON.stringify({ areas: src.areas, items: src.items }) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'public', 'content.js'), out);
console.log(`content.js: 질문 ${src.items.length}개`);
