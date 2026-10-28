/* SHARK core: storage, money, dates, ladder maths, sound, haptics, files. Everything stays on the phone. */
(function () {
  'use strict';
  var S = window.SHARK = window.SHARK || {};
  S.VERSION = '1.0.0';

  /* ---------- native bridge ---------- */
  var Cap = window.Capacitor;
  S.native = !!(Cap && Cap.isNativePlatform && Cap.isNativePlatform());
  var pluginCache = {};
  S.plugin = function (name) {
    if (!S.native) return null;
    if (!pluginCache[name]) pluginCache[name] = Cap.registerPlugin(name);
    return pluginCache[name];
  };

  /* ---------- state ---------- */
  var DATA = 'shark/data.json', BAK = 'shark/data.bak.json', LS = 'shark_state';
  function blank() {
    return { v: 1, clients: [], settings: { theme: 'system', sound: true, haptics: true, rates: { EUR: '', USD: '' }, lastBackup: null } };
  }
  S.migrate = function (r) {
    var b = blank();
    if (!r || typeof r !== 'object') return b;
    r.clients = Array.isArray(r.clients) ? r.clients : [];
    r.settings = Object.assign(b.settings, r.settings || {});
    r.settings.rates = Object.assign({ EUR: '', USD: '' }, r.settings.rates || {});
    r.clients.forEach(function (c) {
      c.debts = Array.isArray(c.debts) ? c.debts : [];
      c.debts.forEach(function (d) { d.payments = Array.isArray(d.payments) ? d.payments : []; d.amount = +d.amount || 0; });
      if (!c.color) c.color = S.colorFor(c.id || c.name || '');
    });
    r.v = 1;
    return r;
  };
  S.load = async function () {
    var raw = null;
    if (S.native) {
      var FS = S.plugin('Filesystem');
      for (var p of [DATA, BAK]) {
        try { var r = await FS.readFile({ path: p, directory: 'DATA', encoding: 'utf8' }); raw = JSON.parse(r.data); if (raw) break; }
        catch (e) { raw = null; }
      }
    } else {
      try { raw = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { raw = null; }
    }
    S.state = S.migrate(raw);
  };
  var saveTimer = null;
  S.save = function () { clearTimeout(saveTimer); saveTimer = setTimeout(S.saveNow, 200); };
  S.saveNow = async function () {
    clearTimeout(saveTimer);
    var json = JSON.stringify(S.state);
    if (S.native) {
      var FS = S.plugin('Filesystem');
      try {
        await FS.writeFile({ path: DATA, data: json, directory: 'DATA', encoding: 'utf8', recursive: true });
        await FS.writeFile({ path: BAK, data: json, directory: 'DATA', encoding: 'utf8', recursive: true });
      } catch (e) { if (S.toast) S.toast('Could not save: ' + (e.message || e)); }
    } else {
      try { localStorage.setItem(LS, json); } catch (e) { /* browser preview only */ }
    }
  };

  /* ---------- undo ---------- */
  var snap = null;
  S.snapshot = function () { snap = JSON.stringify(S.state); };
  S.canUndo = function () { return !!snap; };
  S.undo = function () {
    if (!snap) return false;
    S.state = S.migrate(JSON.parse(snap));
    snap = null;
    S.save();
    return true;
  };

  /* ---------- helpers ---------- */
  S.uid = function (p) { return (p || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  S.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]; });
  };
  S.colorFor = function (seed) {
    var h = 0;
    for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    var keys = window.SHARK_SPRITES.BODY_KEYS;
    return keys[h % keys.length];
  };
  function round2(n) { return Math.round(n * 100) / 100; }
  S.round2 = round2;

  /* ---------- dates (local calendar days) ---------- */
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  S.isoDay = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  S.today = function () { return S.isoDay(new Date()); };
  S.parseDay = function (s) { var p = String(s).slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  S.daysBetween = function (a, b) { return Math.round((S.parseDay(b) - S.parseDay(a)) / 86400000); };
  S.daysSince = function (s) { return Math.max(0, S.daysBetween(s, S.today())); };
  S.fmtDate = function (s) { if (!s) return ''; var d = S.parseDay(s); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };

  /* ---------- money ---------- */
  S.CURS = ['MUR', 'EUR', 'USD'];
  S.money = function (n, cur) {
    n = +n || 0;
    var neg = n < 0; n = Math.abs(n);
    var dec = Math.round(n * 100) % 100 !== 0;
    var s = n.toLocaleString('en-US', { minimumFractionDigits: dec ? 2 : 0, maximumFractionDigits: 2 });
    return (neg ? '-' : '') + (cur === 'EUR' ? '€' : cur === 'USD' ? '$' : 'Rs ') + s;
  };
  S.parseAmount = function (v) {
    var n = parseFloat(String(v || '').replace(/[^0-9.\-]/g, ''));
    return isFinite(n) ? round2(n) : NaN;
  };
  S.rate = function (cur) {
    if (cur === 'MUR') return 1;
    var r = parseFloat(S.state.settings.rates[cur]);
    return isFinite(r) && r > 0 ? r : null;
  };

  /* ---------- debts and the ladder ---------- */
  S.paidSoFar = function (d) { return round2(d.payments.reduce(function (a, p) { return a + (+p.amount || 0); }, 0)); };
  S.balance = function (d) { return d.paidAt ? 0 : Math.max(0, round2(d.amount - S.paidSoFar(d))); };
  S.openDebts = function (c) { return c.debts.filter(function (d) { return !d.paidAt && S.balance(d) > 0; }); };
  S.totals = function (c) {
    var t = {};
    S.openDebts(c).forEach(function (d) { t[d.cur] = round2((t[d.cur] || 0) + S.balance(d)); });
    return t;
  };
  S.totalsList = function (t) { return S.CURS.filter(function (k) { return t[k]; }).map(function (k) { return [k, t[k]]; }); };
  S.lateSince = function (c) {
    var ds = S.openDebts(c).map(function (d) { return d.since; }).sort();
    return ds[0] || null;
  };
  // Value in rupees, only to size the fish. Currencies without a rate are left out.
  S.murValue = function (t) {
    var v = 0, known = false;
    for (var k in t) { var r = S.rate(k); if (r) { v += t[k] * r; known = true; } }
    return known ? v : null;
  };
  S.ladder = function () {
    return S.state.clients.filter(function (c) { return S.openDebts(c).length; }).map(function (c) {
      var t = S.totals(c);
      return { c: c, totals: t, since: S.lateSince(c), days: S.daysSince(S.lateSince(c)), value: S.murValue(t) };
    }).sort(function (a, b) {
      return (b.days - a.days) || ((b.value || 0) - (a.value || 0)) || a.c.name.localeCompare(b.c.name);
    });
  };
  S.shore = function () {
    return S.state.clients.filter(function (c) { return c.debts.length && !S.openDebts(c).length; }).sort(function (a, b) {
      return String(b.offHookAt || '').localeCompare(String(a.offHookAt || ''));
    });
  };
  S.find = function (id) { return S.state.clients.find(function (c) { return c.id === id; }); };

  /* ---------- sound (made on the phone, no files) ---------- */
  var actx = null;
  function audio() {
    if (!actx) { var A = window.AudioContext || window.webkitAudioContext; if (!A) return null; actx = new A(); }
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(a, f, t, dur, type, vol, f2) {
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }
  S.sfx = function (name) {
    if (!S.state || !S.state.settings.sound) return;
    var a = audio(); if (!a) return;
    var t = a.currentTime + 0.01;
    switch (name) {
      case 'tap': tone(a, 740, t, 0.045, 'square', 0.035); break;
      case 'open': tone(a, 520, t, 0.06, 'square', 0.04); tone(a, 780, t + 0.05, 0.08, 'square', 0.04); break;
      case 'coin': tone(a, 988, t, 0.08, 'square', 0.06); tone(a, 1319, t + 0.08, 0.3, 'square', 0.06); break;
      case 'paid':
        [523, 659, 784, 1047].forEach(function (f, i) { tone(a, f, t + i * 0.075, 0.12, 'square', 0.055); });
        tone(a, 988, t + 0.32, 0.08, 'square', 0.06); tone(a, 1319, t + 0.4, 0.45, 'square', 0.06);
        break;
      case 'drop': tone(a, 900, t, 0.25, 'triangle', 0.08, 180); tone(a, 220, t + 0.2, 0.18, 'square', 0.04, 110); break;
      case 'undo': tone(a, 660, t, 0.07, 'square', 0.04); tone(a, 494, t + 0.07, 0.1, 'square', 0.04); break;
      case 'error': tone(a, 196, t, 0.18, 'square', 0.05); tone(a, 147, t + 0.12, 0.22, 'square', 0.05); break;
      case 'delete': tone(a, 400, t, 0.3, 'sawtooth', 0.04, 80); break;
    }
  };
  S.buzz = function (kind) {
    if (!S.state || !S.state.settings.haptics) return;
    var H = S.plugin('Haptics');
    if (H) {
      if (kind === 'success') H.notification({ type: 'SUCCESS' }).catch(function () {});
      else if (kind === 'error') H.notification({ type: 'ERROR' }).catch(function () {});
      else H.impact({ style: kind === 'heavy' ? 'HEAVY' : kind === 'medium' ? 'MEDIUM' : 'LIGHT' }).catch(function () {});
    } else if (navigator.vibrate) {
      try { navigator.vibrate(kind === 'success' ? [20, 40, 30] : 10); } catch (e) { /* not allowed */ }
    }
  };

  /* ---------- files out (share sheet) ---------- */
  S.shareFile = async function (fileName, data, mime, isBase64, title) {
    if (S.native) {
      var FS = S.plugin('Filesystem');
      var opts = { path: 'share/' + fileName, data: data, directory: 'CACHE', recursive: true };
      if (!isBase64) opts.encoding = 'utf8';
      var w = await FS.writeFile(opts);
      await S.plugin('Share').share({ title: title || fileName, files: [w.uri], dialogTitle: title || 'Send or save' });
      return;
    }
    var blob = isBase64
      ? new Blob([Uint8Array.from(atob(data), function (c) { return c.charCodeAt(0); })], { type: mime })
      : new Blob([data], { type: mime });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = fileName; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };
})();
