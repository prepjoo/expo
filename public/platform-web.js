/* 실서비스(웹) 연결: 로그인·계정 저장(Supabase), 음성 받아쓰기(브라우저), 파일 내려받기 */
(function () {
  'use strict';
  var cfg = window.B5_CONFIG || {};
  var B5 = window.B5 = {};

  // 1) 파일 내려받기
  B5.download = function (filename, data) {
    var url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    var a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  };

  // 2) 음성 받아쓰기 (Chrome·Edge·Safari의 Web Speech API)
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    var rec = null, cb = { p: function () {}, f: function () {}, s: function () {} };
    B5.dictation = {
      onPartial: function (fn) { cb.p = fn; },
      onFinal: function (fn) { cb.f = fn; },
      onState: function (fn) { cb.s = fn; },
      start: function () {
        return new Promise(function (resolve, reject) {
          try { if (rec) rec.abort(); } catch (e) {}
          rec = new SR(); rec.lang = 'ko-KR'; rec.interimResults = true; rec.continuous = true;
          rec.onstart = function () { cb.s({ state: 'listening' }); resolve(); };
          rec.onresult = function (e) {
            var interim = '';
            for (var i = e.resultIndex; i < e.results.length; i++) {
              var r = e.results[i];
              if (r.isFinal) cb.f({ text: r[0].transcript }); else interim += r[0].transcript;
            }
            cb.p({ text: interim });
          };
          rec.onerror = function (e) {
            if (e.error === 'not-allowed' || e.error === 'service-not-allowed') reject({ code: 'not_granted' });
          };
          rec.onend = function () { cb.s({ state: 'idle', reason: 'stopped' }); };
          rec.start();
        });
      },
      stop: function () { try { if (rec) rec.stop(); } catch (e) {} return Promise.resolve(); }
    };
  }

  // 3) 로그인과 계정 저장 (Supabase: 카카오·구글)
  if (cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase) {
    var sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true }
    });
    var current = null;
    function toAccount(u) {
      if (!u) return null;
      var m = u.user_metadata || {};
      return { id: u.id, email: u.email || '', name: m.name || m.full_name || m.nickname || m.preferred_username || '' };
    }
    B5.auth = {
      login: function (provider) {
        var back = location.origin + location.pathname;
        return sb.auth.signInWithOAuth({ provider: provider, options: { redirectTo: back } }).then(function (r) { if (r.error) throw r.error; });
      },
      logout: function () { return sb.auth.signOut(); },
      onChange: function (fn) {
        sb.auth.onAuthStateChange(function (_event, session) {
          var u = session && session.user ? session.user : null;
          var id = u ? u.id : null;
          if (id === (current && current.id)) return;   // 같은 사용자의 토큰 갱신은 무시
          current = toAccount(u);
          // 로그인 직후 주소창의 ?code= 정리
          if (location.search.indexOf('code=') >= 0) history.replaceState(null, '', location.pathname + location.hash);
          fn(current);
        });
      }
    };
    B5.cloud = {
      ready: function () {
        return sb.auth.getUser().then(function (r) {
          var u = r.data && r.data.user; if (!u) return null;
          return {
            getAll: function () {
              return sb.from('user_data').select('profile,history,cards').eq('user_id', u.id).maybeSingle()
                .then(function (q) { if (q.error) throw { code: 'unavailable', message: q.error.message }; return q.data || {}; });
            },
            set: function (name, body) {
              var row = { user_id: u.id, updated_at: new Date().toISOString() }; row[name] = body;
              return sb.from('user_data').upsert(row, { onConflict: 'user_id' }).then(function (q) {
                if (q.error) throw { code: q.error.code === '42501' ? 'auth' : 'unavailable', message: q.error.message };
              });
            }
          };
        });
      }
    };
  }
})();
