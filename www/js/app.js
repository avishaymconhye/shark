/* SHARK app: screens, sheets, the ladder, the PAID moment. */
(function () {
  'use strict';
  var S = window.SHARK, SP = window.SHARK_SPRITES, esc = S.esc;
  var $ = function (q, r) { return (r || document).querySelector(q); };
  var view = 'ladder';
  var sheets = [];

  /* =============== RENDER =============== */
  S.render = function () {
    $('#hud').innerHTML = hud();
    var main = $('#screen');
    var keep = main.scrollTop;
    main.innerHTML = view === 'ladder' ? ladderHTML() : view === 'shore' ? shoreHTML() : settingsHTML();
    if (view === 'ladder') main.scrollTop = keep;
    document.body.dataset.view = view;
    document.body.classList.toggle('has-sheet', sheets.length > 0);
    sheets.forEach(function (sh) { refreshSheet(sh); });
  };

  function hud() {
    if (view !== 'ladder') {
      var title = view === 'shore' ? 'OFF THE HOOK' : 'SETTINGS';
      return '<div class="hud-top"><button class="ibtn" data-act="go" data-v="ladder" aria-label="Back to the ladder">' + SP.icon('back') + '</button>' +
        '<h1 class="hud-title px misreg">' + title + '</h1><span class="ibtn-space"></span></div>';
    }
    return '<div class="hud-top"><div class="brand">' + SP.wordmarkSVG() + '</div><div class="hud-btns">' +
      '<button class="ibtn" data-act="go" data-v="shore" aria-label="Off the hook">' + SP.coinSVG(2.6) + '</button>' +
      '<button class="ibtn" data-act="go" data-v="settings" aria-label="Settings">' + SP.icon('gear') + '</button></div></div>' + scoreHTML();
  }

  function scoreHTML() {
    var L = S.ladder(), tot = {};
    L.forEach(function (r) { for (var k in r.totals) tot[k] = S.round2((tot[k] || 0) + r.totals[k]); });
    var list = S.totalsList(tot);
    var main = list.length ? list[0] : ['MUR', 0];
    var extra = list.slice(1).map(function (p) { return '+ ' + S.money(p[1], p[0]); }).join('  ');
    return '<div class="score">' +
      '<div class="score-cell"><span class="lbl px">OWED</span><span class="big">' + S.money(main[1], main[0]) + '</span>' +
      (extra ? '<span class="extra">' + extra + '</span>' : '') + '</div>' +
      '<div class="score-cell right"><span class="lbl px">LATE</span><span class="big px">' + (L.length < 10 ? '0' : '') + L.length + '</span></div></div>';
  }

  function moodFor(i, days) { return i <= 2 ? (days >= 30 ? 'panic' : 'nervous') : days >= 30 ? 'uneasy' : 'calm'; }
  function fishScale(r, max) {
    if (r.value == null || !max) return 4;
    return Math.max(3, Math.min(6, Math.round(3 + 3 * Math.sqrt(r.value / max))));
  }

  function ladderHTML() {
    var L = S.ladder();
    if (!L.length) {
      return '<div class="empty">' +
        '<div class="empty-spr bob">' + SP.fishSVG('paper', 'sleep', 6) + '<span class="zz px">Z<i>z</i></span></div>' +
        '<p class="empty-title px misreg">LADDER EMPTY</p>' +
        '<p class="empty-sub">Nobody owes you a thing. Enjoy it while it lasts.</p>' +
        '<button class="btn pink" data-act="newClient">+ NEW FISH</button></div>';
    }
    var max = Math.max.apply(null, L.map(function (r) { return r.value || 0; }));
    var rows = L.map(function (r, i) {
      var c = r.c, top = i === 0, side = i % 2 === 0 ? 'left' : 'right';
      var mood = moodFor(i, r.days);
      var spr = top ? SP.clamSVG(5) : SP.fishSVG(c.color, mood, fishScale(r, max));
      var amts = S.totalsList(r.totals).map(function (p) { return '<span class="amt">' + S.money(p[1], p[0]) + '</span>'; }).join('');
      return '<div class="row ' + side + (top ? ' boss' : '') + '" style="--d:' + (i * 60) + 'ms">' +
        '<span class="rank px">' + (i + 1) + '</span>' +
        '<div class="rung"></div>' +
        '<button class="fig ' + (top ? 'quake' : i <= 2 ? 'tremble' : 'bob') + '" data-act="open" data-id="' + c.id + '" aria-label="Open ' + esc(c.name) + '">' +
        '<span class="spr' + (side === 'left' && !top ? ' flip' : '') + '">' + spr + '</span></button>' +
        '<button class="tag" data-act="open" data-id="' + c.id + '">' +
        (top ? '<span class="crown px">THE CLAM</span>' : '') +
        '<span class="nm">' + esc(c.name) + '</span>' + amts + '</button></div>';
    }).join('');
    return '<div class="ladder">' + rows + '</div><div class="ladder-base"></div>';
  }

  function shoreHTML() {
    var list = S.shore();
    if (!list.length) {
      return '<div class="empty"><div class="empty-spr">' + SP.coinSVG(9) + '</div><p class="empty-title px misreg">NOTHING YET</p>' +
        '<p class="empty-sub">Clients you mark PAID land here.</p></div>';
    }
    var collected = {}, daysSum = 0, daysN = 0;
    var cards = list.map(function (c) {
      var paid = {}, first = null;
      c.debts.forEach(function (d) {
        paid[d.cur] = S.round2((paid[d.cur] || 0) + d.amount);
        collected[d.cur] = S.round2((collected[d.cur] || 0) + d.amount);
        if (!first || d.since < first) first = d.since;
      });
      var took = c.offHookAt && first ? Math.max(0, S.daysBetween(first, S.isoDay(new Date(c.offHookAt)))) : null;
      if (took != null) { daysSum += took; daysN++; }
      return '<button class="shore-card" data-act="shoreItem" data-id="' + c.id + '">' +
        '<span class="shore-spr">' + SP.fishSVG(c.color, 'happy', 3) + '</span>' +
        '<span class="shore-who"><b>' + esc(c.name) + '</b><small>' +
        (c.offHookAt ? 'Paid ' + S.fmtDate(S.isoDay(new Date(c.offHookAt))) : 'Paid') + (took != null ? ' · took ' + took + (took === 1 ? ' day' : ' days') : '') +
        '</small></span><span class="shore-amt">' + S.totalsList(paid).map(function (p) { return S.money(p[1], p[0]); }).join('<br>') + '</span></button>';
    }).join('');
    var col = S.totalsList(collected);
    return '<div class="pad"><div class="score"><div class="score-cell"><span class="lbl px">COLLECTED</span>' +
      col.map(function (p, i) { return '<span class="' + (i ? 'extra' : 'big') + '">' + (i ? '+ ' : '') + S.money(p[1], p[0]) + '</span>'; }).join('') +
      '</div><div class="score-cell right"><span class="lbl px">AVG DAYS</span><span class="big px">' + (daysN ? Math.round(daysSum / daysN) : '-') + '</span></div></div>' +
      '<div class="shore-list">' + cards + '</div></div>';
  }

  function settingsHTML() {
    var s = S.state.settings;
    var seg = function (act, cur, opts) {
      return '<div class="seg">' + opts.map(function (o) {
        return '<button class="' + (cur === o[0] ? 'on' : '') + '" data-act="' + act + '" data-v="' + o[0] + '">' + o[1] + '</button>';
      }).join('') + '</div>';
    };
    var since = s.lastBackup ? 'Last backup ' + S.fmtDate(S.isoDay(new Date(s.lastBackup))) : 'No backup yet';
    return '<div class="pad settings">' +
      '<h3 class="sec px">LOOK</h3>' + seg('theme', s.theme, [['system', 'AUTO'], ['light', 'LIGHT'], ['dark', 'DARK']]) +
      '<h3 class="sec px">FEEDBACK</h3>' +
      '<div class="set-row"><span>Sounds</span>' + seg('sound', s.sound ? 'on' : 'off', [['on', 'ON'], ['off', 'OFF']]) + '</div>' +
      '<div class="set-row"><span>Vibration</span>' + seg('haptics', s.haptics ? 'on' : 'off', [['on', 'ON'], ['off', 'OFF']]) + '</div>' +
      '<h3 class="sec px">FISH SIZE</h3>' +
      '<p class="note">Fish grow with what they owe. To size debts in euros or dollars, set your rate here. Leave empty to skip.</p>' +
      '<label class="rate">1 EUR = Rs <input inputmode="decimal" data-rate="EUR" value="' + esc(s.rates.EUR) + '" placeholder="rate"></label>' +
      '<label class="rate">1 USD = Rs <input inputmode="decimal" data-rate="USD" value="' + esc(s.rates.USD) + '" placeholder="rate"></label>' +
      '<h3 class="sec px">BACKUP</h3>' +
      '<p class="note">' + since + '. Everything lives on this phone only.</p>' +
      '<div class="two"><button class="btn" data-act="backup">' + SP.icon('share', 2) + ' BACK UP</button>' +
      '<button class="btn" data-act="restore">RESTORE</button></div>' +
      '<div class="about">' + SP.wordmarkSVG('about-mark') + '<p class="px">AN UNTAMED GAME<br>NOBODY WANTS TO WIN</p><small>Version ' + S.VERSION + '</small></div>' +
      '</div>';
  }

  /* =============== SHEETS =============== */
  function openSheet(render, opts) {
    var wrap = document.createElement('div');
    wrap.className = 'sheet-wrap';
    wrap.innerHTML = '<div class="backdrop" data-act="closeSheet"></div><div class="sheet' + (opts && opts.cls ? ' ' + opts.cls : '') +
      '" role="dialog" aria-modal="true"><div class="handle"></div><div class="sheet-body"></div></div>';
    $('#sheets').appendChild(wrap);
    var sh = { el: wrap, render: render };
    sheets.push(sh);
    refreshSheet(sh);
    document.body.classList.add('has-sheet');
    S.sfx('open');
    return sh;
  }
  function refreshSheet(sh) {
    var html = sh.render();
    if (html == null) { removeSheet(sh); return; }
    var body = sh.el.querySelector('.sheet-body');
    var active = document.activeElement && sh.el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT';
    if (!active) body.innerHTML = html;
  }
  function removeSheet(sh) {
    var i = sheets.indexOf(sh);
    if (i >= 0) sheets.splice(i, 1);
    document.body.classList.toggle('has-sheet', sheets.length > 0);
    sh.el.classList.add('out');
    setTimeout(function () { sh.el.remove(); }, 180);
  }
  function closeSheet() { if (sheets.length) removeSheet(sheets[sheets.length - 1]); }
  function closeAll() { while (sheets.length) removeSheet(sheets[sheets.length - 1]); }

  /* ---------- client sheet ---------- */
  function clientSheet(id) {
    return function () {
      var L = S.ladder(), idx = L.findIndex(function (r) { return r.c.id === id; });
      if (idx < 0) return null;
      var r = L[idx], c = r.c, top = idx === 0;
      var open = S.openDebts(c);
      return '<div class="sh-head"><div class="sh-spr">' + (top ? SP.clamSVG(3) : SP.fishSVG(c.color, moodFor(idx, r.days), 3)) + '</div>' +
        '<div class="sh-who"><h2>' + esc(c.name) + '</h2>' +
        (top ? '<span class="chip yellow px">THE CLAM</span>' : '<span class="chip px">#' + (idx + 1) + ' ON THE LADDER</span>') + '</div>' +
        '<button class="ibtn" data-act="editClient" data-id="' + c.id + '" aria-label="Edit client">' + SP.icon('pencil') + '</button></div>' +
        '<div class="owes"><span class="lbl px">OWES YOU</span>' +
        S.totalsList(r.totals).map(function (p) { return '<span class="owe">' + S.money(p[1], p[0]) + '</span>'; }).join('') + '</div>' +
        '<div class="stats"><div class="stat"><span class="lbl px">LATE SINCE</span><span class="v">' + S.fmtDate(r.since) + '</span></div>' +
        '<div class="stat"><span class="lbl px">DAYS LATE</span><span class="v px">' + r.days + '</span></div></div>' +
        '<div class="debts"><span class="lbl px">DEBTS</span>' + open.map(function (d) {
          var part = S.paidSoFar(d);
          return '<button class="debt" data-act="debt" data-id="' + c.id + '" data-d="' + d.id + '"><span class="dl"><b>' + esc(d.what || 'Unnamed job') + '</b>' +
            '<small>Since ' + S.fmtDate(d.since) + (part ? ' · ' + S.money(part, d.cur) + ' paid' : '') + '</small></span>' +
            '<span class="da">' + S.money(S.balance(d), d.cur) + '</span></button>';
        }).join('') + '</div>' +
        '<button class="btn yellow huge" data-act="paid" data-id="' + c.id + '">' + SP.icon('check', 3) + ' PAID!</button>' +
        '<div class="' + (c.phone ? 'three' : 'two') + '">' +
        '<button class="btn" data-act="addDebt" data-id="' + c.id + '">+ DEBT</button>' +
        '<button class="btn blue" data-act="export" data-id="' + c.id + '">' + SP.icon('share', 2) + ' IMAGE</button>' +
        (c.phone ? '<button class="btn green" data-act="chat" data-id="' + c.id + '">' + SP.icon('chat', 2) + ' CHAT</button>' : '') +
        '</div>';
    };
  }

  /* ---------- forms ---------- */
  function curSeg(cur) {
    return '<div class="seg cur">' + S.CURS.map(function (k) {
      return '<button type="button" class="' + (k === cur ? 'on' : '') + '" data-act="cur" data-v="' + k + '">' + k + '</button>';
    }).join('') + '</div><input type="hidden" name="cur" value="' + cur + '">';
  }
  function debtFields(d) {
    d = d || { what: '', amount: '', cur: 'MUR', since: S.today() };
    return '<label>What for<input name="what" maxlength="60" autocomplete="off" placeholder="e.g. Brand film" value="' + esc(d.what) + '"></label>' +
      '<label>Amount owed<div class="amtrow"><input name="amount" inputmode="decimal" autocomplete="off" placeholder="0" value="' + esc(d.amount) + '">' + curSeg(d.cur) + '</div></label>' +
      '<label>Late since<input name="since" type="date" max="' + S.today() + '" value="' + esc(d.since) + '"></label>';
  }
  function clientForm(id) {
    var c = id ? S.find(id) : null;
    return function () {
      return '<h2 class="sh-title px misreg">' + (c ? 'EDIT FISH' : 'NEW FISH') + '</h2>' +
        '<p class="sh-sub">' + (c ? 'Fix the name or number.' : 'Drop a client in the water.') + '</p>' +
        '<form data-form="client" data-id="' + (c ? c.id : '') + '" novalidate>' +
        '<label>Client name<input name="name" maxlength="60" autocomplete="off" placeholder="e.g. Baie Bleue Hotel" value="' + esc(c ? c.name : '') + '"></label>' +
        '<label>WhatsApp number <em>optional</em><input name="phone" type="tel" inputmode="tel" autocomplete="off" placeholder="+230" value="' + esc(c ? c.phone || '' : '') + '"></label>' +
        (c ? '' : debtFields()) +
        '<p class="err" hidden></p>' +
        '<button class="btn pink huge" type="submit">' + (c ? 'SAVE' : SP.icon('up', 2) + ' DROP IN THE WATER') + '</button>' +
        (c ? '<button class="btn danger" type="button" data-act="deleteClient" data-id="' + c.id + '">' + SP.icon('trash', 2) + ' DELETE CLIENT</button>' : '') +
        '</form>';
    };
  }
  function debtForm(cid, did) {
    var c = S.find(cid), d = did ? c.debts.find(function (x) { return x.id === did; }) : null;
    return function () {
      return '<h2 class="sh-title px misreg">' + (d ? 'EDIT DEBT' : 'ADD DEBT') + '</h2><p class="sh-sub">' + esc(c.name) + '</p>' +
        '<form data-form="debt" data-id="' + cid + '" data-d="' + (d ? d.id : '') + '" novalidate>' + debtFields(d) +
        '<p class="err" hidden></p><button class="btn pink huge" type="submit">' + (d ? 'SAVE' : '+ ADD DEBT') + '</button></form>';
    };
  }
  function debtMenu(cid, did) {
    return function () {
      var c = S.find(cid), d = c && c.debts.find(function (x) { return x.id === did; });
      if (!d || d.paidAt) return null;
      return '<h2 class="sh-title px">' + esc(d.what || 'Unnamed job') + '</h2>' +
        '<p class="sh-sub">' + S.money(S.balance(d), d.cur) + ' left · since ' + S.fmtDate(d.since) + '</p>' +
        '<div class="stack"><button class="btn yellow" data-act="partPaid" data-id="' + cid + '" data-d="' + did + '">PART PAID</button>' +
        '<button class="btn" data-act="editDebt" data-id="' + cid + '" data-d="' + did + '">' + SP.icon('pencil', 2) + ' EDIT</button>' +
        '<button class="btn danger" data-act="deleteDebt" data-id="' + cid + '" data-d="' + did + '">' + SP.icon('trash', 2) + ' DELETE</button></div>';
    };
  }
  function partForm(cid, did) {
    var c = S.find(cid), d = c.debts.find(function (x) { return x.id === did; });
    return function () {
      return '<h2 class="sh-title px misreg">PART PAID</h2><p class="sh-sub">' + esc(d.what || 'Unnamed job') + ' · ' + S.money(S.balance(d), d.cur) + ' left</p>' +
        '<form data-form="part" data-id="' + cid + '" data-d="' + did + '" novalidate>' +
        '<label>How much came in (' + d.cur + ')<input name="amount" inputmode="decimal" autocomplete="off" placeholder="0"></label>' +
        '<label>On<input name="date" type="date" max="' + S.today() + '" value="' + S.today() + '"></label>' +
        '<p class="err" hidden></p><button class="btn yellow huge" type="submit">' + SP.coinSVG(2.5) + ' ADD PAYMENT</button></form>';
    };
  }
  function shoreMenu(id) {
    return function () {
      var c = S.find(id);
      if (!c) return null;
      return '<h2 class="sh-title px">' + esc(c.name) + '</h2><p class="sh-sub">Off the hook.</p>' +
        '<div class="stack"><button class="btn" data-act="putBack" data-id="' + id + '">' + SP.icon('back', 2) + ' PUT BACK ON THE LADDER</button>' +
        '<button class="btn danger" data-act="forget" data-id="' + id + '">' + SP.icon('trash', 2) + ' DELETE FROM HISTORY</button></div>';
    };
  }
  function imageSheet(dataUrl, id) {
    return function () {
      return '<h2 class="sh-title px misreg">EXPORT</h2>' +
        '<img class="card-prev" src="' + dataUrl + '" alt="Export image preview">' +
        '<button class="btn blue huge" data-act="shareImage" data-id="' + id + '">' + SP.icon('share', 3) + ' SHARE</button>' +
        '<p class="note center">Best sent one to one.</p>';
    };
  }

  /* =============== CONFIRM AND TOAST =============== */
  function confirmBox(title, text, yes, cb) {
    var el = document.createElement('div');
    el.className = 'modal';
    el.innerHTML = '<div class="modal-box"><h2 class="px misreg">' + title + '</h2><p>' + text + '</p>' +
      '<div class="two"><button class="btn" data-m="no">NO</button><button class="btn danger" data-m="yes">' + yes + '</button></div></div>';
    document.body.appendChild(el);
    S.buzz('medium');
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-m]');
      if (!b && e.target !== el) return;
      el.remove();
      if (b && b.dataset.m === 'yes') cb();
    });
  }
  var toastTimer = null;
  S.toast = function (msg, undo) {
    var t = $('#toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (undo ? '<button class="btn yellow sm" data-act="undo">UNDO</button>' : '');
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, undo ? 6000 : 2600);
  };

  /* =============== PAID! =============== */
  function celebrate(c, totals) {
    var el = $('#overlay');
    var coins = '';
    for (var i = 0; i < 18; i++) {
      var a = (i / 18) * Math.PI * 2 + (i % 2) * 0.2, dist = 140 + (i * 37) % 110;
      coins += '<span class="coin" style="--dx:' + Math.round(Math.cos(a) * dist) + 'px;--dy:' + Math.round(Math.sin(a) * dist - 60) + 'px;--r:' + (i * 47 % 360) + 'deg;--t:' + (i % 5) * 40 + 'ms">' + SP.coinSVG(4) + '</span>';
    }
    var amts = S.totalsList(totals).map(function (p) { return '+' + S.money(p[1], p[0]); }).join('<br>');
    el.innerHTML = '<div class="celebrate" data-act="closeCelebrate">' +
      '<div class="burst">' + coins + '</div>' +
      '<div class="paid-word px">PAID!</div>' +
      '<div class="paid-amt">' + amts + '</div>' +
      '<div class="swim-lane"><span class="swimmer">' + SP.fishSVG(c.color, 'happy', 5) + '</span></div>' +
      '<p class="px off">OFF THE HOOK</p>' +
      '<p class="paid-who">' + esc(c.name) + '</p></div>';
    el.classList.add('show');
    S.sfx('paid'); S.buzz('success');
    clearTimeout(celebrate.t);
    celebrate.t = setTimeout(function () { endCelebrate(c); }, 2600);
  }
  function endCelebrate(c) {
    var el = $('#overlay');
    if (!el.classList.contains('show')) return;
    el.classList.remove('show');
    el.innerHTML = '';
    if (c) S.toast(c.name + ' is off the hook', true);
  }

  /* =============== ACTIONS =============== */
  function markPaid(id) {
    var c = S.find(id); if (!c) return;
    S.snapshot();
    var totals = S.totals(c), now = new Date().toISOString();
    S.openDebts(c).forEach(function (d) { d.paidAt = now; });
    c.offHookAt = now;
    S.save();
    closeAll();
    S.render();
    celebrate(c, totals);
    celebrate.client = c;
  }

  async function exportImage(id) {
    S.toast('Printing...');
    try {
      var url = await S.exportCard(id);
      $('#toast').classList.remove('show');
      openSheet(imageSheet(url, id), { cls: 'tall' });
      S.lastImage = url;
    } catch (e) { S.toast('Could not make the image'); S.sfx('error'); }
  }
  async function shareImage(id) {
    var c = S.find(id);
    var name = 'SHARK_' + (c ? c.name : 'client').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') + '.png';
    try { await S.shareFile(name, S.lastImage.split(',')[1], 'image/png', true, 'Send ' + (c ? c.name : 'image')); }
    catch (e) { if (!/cancel/i.test(String(e && e.message))) S.toast('Sharing did not work'); }
  }

  async function backup() {
    var data = JSON.stringify({ format: 'shark-backup', version: 1, exportedAt: new Date().toISOString(), data: S.state }, null, 1);
    try {
      await S.shareFile('SHARK_backup_' + S.today() + '.json', data, 'application/json', false, 'SHARK backup');
      S.state.settings.lastBackup = new Date().toISOString();
      S.save(); S.render();
    } catch (e) { if (!/cancel/i.test(String(e && e.message))) S.toast('Backup did not work'); }
  }
  function restore() {
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        var j = null;
        try { j = JSON.parse(rd.result); } catch (e) { j = null; }
        if (!j || j.format !== 'shark-backup' || !j.data) { S.toast('That is not a SHARK backup'); S.sfx('error'); return; }
        var n = (j.data.clients || []).length;
        confirmBox('RESTORE?', 'Replace everything on this phone with this backup (' + n + (n === 1 ? ' client' : ' clients') + ')?', 'REPLACE', function () {
          S.snapshot();
          var keep = S.state.settings;
          S.state = S.migrate(j.data);
          S.state.settings.lastBackup = keep.lastBackup;
          S.save(); applyTheme(); S.render();
          S.toast('Backup restored', true);
        });
      };
      rd.readAsText(f);
    };
    inp.click();
  }

  function formError(form, msg) {
    var e = form.querySelector('.err');
    e.textContent = msg; e.hidden = false;
    S.sfx('error'); S.buzz('error');
  }
  function readDebt(form) {
    var f = form.elements;
    var amount = S.parseAmount(f.amount.value);
    if (!(amount > 0)) return { err: 'Enter how much they owe.' };
    var since = f.since.value || S.today();
    if (since > S.today()) return { err: 'Late since cannot be in the future.' };
    return { what: f.what.value.trim(), amount: amount, cur: f.cur.value, since: since };
  }

  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    var kind = form.dataset.form, f = form.elements;
    if (kind === 'client') {
      var name = f.name.value.trim();
      if (!name) return formError(form, 'Give the client a name.');
      var phone = f.phone.value.trim();
      if (form.dataset.id) {
        var c = S.find(form.dataset.id);
        S.snapshot(); c.name = name; c.phone = phone; S.save();
        closeSheet(); S.render(); S.sfx('tap'); S.toast('Saved');
        return;
      }
      var d = readDebt(form);
      if (d.err) return formError(form, d.err);
      var id = S.uid('c');
      S.snapshot();
      S.state.clients.push({ id: id, name: name, phone: phone, color: S.colorFor(id + name), createdAt: new Date().toISOString(),
        debts: [{ id: S.uid('d'), what: d.what, amount: d.amount, cur: d.cur, since: d.since, paidAt: null, payments: [] }] });
      S.save(); closeAll(); S.render();
      S.sfx('drop'); S.buzz('medium');
      var L = S.ladder(), rank = L.findIndex(function (r) { return r.c.id === id; }) + 1;
      S.toast(name + (rank === 1 ? ' is the new Clam' : ' lands on rung #' + rank), true);
      flash(id);
    } else if (kind === 'debt') {
      var cl = S.find(form.dataset.id);
      var dd = readDebt(form);
      if (dd.err) return formError(form, dd.err);
      S.snapshot();
      if (form.dataset.d) {
        var ex = cl.debts.find(function (x) { return x.id === form.dataset.d; });
        if (dd.amount < S.paidSoFar(ex)) return formError(form, 'They already paid ' + S.money(S.paidSoFar(ex), ex.cur) + ' of this.');
        Object.assign(ex, dd);
      } else {
        cl.debts.push({ id: S.uid('d'), what: dd.what, amount: dd.amount, cur: dd.cur, since: dd.since, paidAt: null, payments: [] });
        cl.offHookAt = null;
      }
      S.save(); closeSheet(); if (form.dataset.d) closeSheet();
      S.render(); S.sfx('drop'); S.toast('Debt saved', true);
    } else if (kind === 'part') {
      var c2 = S.find(form.dataset.id), d2 = c2.debts.find(function (x) { return x.id === form.dataset.d; });
      var amt = S.parseAmount(f.amount.value), left = S.balance(d2);
      if (!(amt > 0)) return formError(form, 'Enter the amount that came in.');
      if (amt > left) return formError(form, 'Only ' + S.money(left, d2.cur) + ' is left on this debt.');
      S.snapshot();
      d2.payments.push({ amount: amt, date: f.date.value || S.today() });
      if (S.balance(d2) <= 0) d2.paidAt = new Date().toISOString();
      var allDone = !S.openDebts(c2).length;
      if (allDone) c2.offHookAt = new Date().toISOString();
      S.save(); closeAll(); S.render();
      if (allDone) { var shown = {}; shown[d2.cur] = amt; celebrate(c2, shown); celebrate.client = c2; }
      else { S.sfx('coin'); S.buzz('light'); S.toast(S.money(amt, d2.cur) + ' in. ' + S.money(S.balance(d2), d2.cur) + ' to go', true); }
    }
  });

  function flash(id) {
    setTimeout(function () {
      var b = document.querySelector('.fig[data-id="' + id + '"]');
      if (!b) return;
      var row = b.closest('.row');
      row.classList.add('fresh');
      row.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(function () { row.classList.remove('fresh'); }, 1600);
    }, 60);
  }

  /* =============== CLICKS =============== */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act, id = b.dataset.id, did = b.dataset.d;
    switch (act) {
      case 'go': S.sfx('tap'); S.buzz(); view = b.dataset.v; $('#screen').scrollTop = 0; S.render(); break;
      case 'newClient': S.buzz(); openSheet(clientForm(null)); break;
      case 'open': S.buzz(); openSheet(clientSheet(id)); break;
      case 'closeSheet': closeSheet(); break;
      case 'editClient': S.buzz(); openSheet(clientForm(id)); break;
      case 'addDebt': S.buzz(); openSheet(debtForm(id, null)); break;
      case 'debt': S.buzz(); openSheet(debtMenu(id, did)); break;
      case 'editDebt': S.buzz(); openSheet(debtForm(id, did)); break;
      case 'partPaid': S.buzz(); openSheet(partForm(id, did)); break;
      case 'paid': S.buzz('heavy'); markPaid(id); break;
      case 'export': S.buzz(); exportImage(id); break;
      case 'shareImage': shareImage(id); break;
      case 'chat': {
        var c = S.find(id);
        var num = String(c.phone || '').replace(/[^0-9]/g, '');
        if (num.length === 8) num = '230' + num;
        window.location.href = 'https://wa.me/' + num;
        break;
      }
      case 'cur': {
        var form = b.closest('form');
        form.querySelectorAll('.seg.cur button').forEach(function (x) { x.classList.toggle('on', x === b); });
        form.elements.cur.value = b.dataset.v;
        S.sfx('tap');
        break;
      }
      case 'deleteClient': {
        var cc = S.find(id);
        confirmBox('DELETE?', 'Remove ' + esc(cc.name) + ' and all their debts?', 'DELETE', function () {
          S.snapshot();
          S.state.clients = S.state.clients.filter(function (x) { return x.id !== id; });
          S.save(); closeAll(); S.render(); S.sfx('delete');
          S.toast(cc.name + ' deleted', true);
        });
        break;
      }
      case 'deleteDebt': {
        var c3 = S.find(id), d3 = c3.debts.find(function (x) { return x.id === did; });
        confirmBox('DELETE?', 'Remove "' + esc(d3.what || 'Unnamed job') + '" (' + S.money(S.balance(d3), d3.cur) + ')?', 'DELETE', function () {
          S.snapshot();
          c3.debts = c3.debts.filter(function (x) { return x.id !== did; });
          if (!c3.debts.length) S.state.clients = S.state.clients.filter(function (x) { return x.id !== id; });
          S.save(); closeSheet(); S.render(); S.sfx('delete');
          S.toast('Debt deleted', true);
        });
        break;
      }
      case 'shoreItem': S.buzz(); openSheet(shoreMenu(id)); break;
      case 'putBack': {
        var c4 = S.find(id);
        S.snapshot();
        c4.debts.forEach(function (d) { if (d.paidAt && d.paidAt === c4.offHookAt) d.paidAt = null; });
        if (!S.openDebts(c4).length) c4.debts.forEach(function (d) { if (S.round2(d.amount - S.paidSoFar(d)) > 0) d.paidAt = null; });
        c4.offHookAt = null;
        S.save(); closeAll(); view = 'ladder'; S.render(); S.sfx('drop');
        S.toast(c4.name + ' is back on the ladder', true);
        break;
      }
      case 'forget': {
        var c5 = S.find(id);
        confirmBox('DELETE?', 'Remove ' + esc(c5.name) + ' from your history?', 'DELETE', function () {
          S.snapshot();
          S.state.clients = S.state.clients.filter(function (x) { return x.id !== id; });
          S.save(); closeAll(); S.render(); S.sfx('delete'); S.toast('Deleted', true);
        });
        break;
      }
      case 'undo':
        if (S.undo()) {
          endCelebrate(null); closeAll(); applyTheme(); S.render(); S.sfx('undo');
          $('#toast').classList.remove('show');
        }
        break;
      case 'closeCelebrate': clearTimeout(celebrate.t); endCelebrate(celebrate.client); break;
      case 'theme': S.state.settings.theme = b.dataset.v; S.save(); applyTheme(); S.render(); S.sfx('tap'); break;
      case 'sound': S.state.settings.sound = b.dataset.v === 'on'; S.save(); S.render(); S.sfx('coin'); break;
      case 'haptics': S.state.settings.haptics = b.dataset.v === 'on'; S.save(); S.render(); S.buzz('medium'); break;
      case 'backup': backup(); break;
      case 'restore': restore(); break;
      case 'splash': hideSplash(); break;
    }
  });
  document.addEventListener('change', function (e) {
    var r = e.target.closest('[data-rate]');
    if (!r) return;
    var v = r.value.trim();
    S.state.settings.rates[r.dataset.rate] = v === '' ? '' : String(S.parseAmount(v) || '');
    S.save();
    S.toast(v ? 'Rate saved' : 'Rate cleared');
  });

  /* =============== THEME =============== */
  function applyTheme() {
    var t = S.state.settings.theme;
    var dark = t === 'dark' || (t === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.body.classList.toggle('dark', dark);
    document.documentElement.classList.remove('pre-dark');
    try { localStorage.setItem('shark_theme', t); } catch (e) { /* not needed */ }
    var SB = S.plugin('StatusBar');
    if (SB) {
      try { SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' }).catch(function () {}); } catch (e) { /* edge to edge */ }
    }
  }

  /* =============== SPLASH =============== */
  function showSplash() {
    var el = $('#splash');
    el.innerHTML = '<div class="splash-in" data-act="splash">' + SP.wordmarkSVG('splash-mark') +
      '<p class="px tagline">AN UNTAMED GAME<br>NOBODY WANTS TO WIN</p>' +
      '<p class="px press">PRESS START</p>' +
      '<div class="splash-sea"><span class="splash-fin">' + SP.finSVG('fin') + '</span></div></div>';
    setTimeout(hideSplash, 1900);
  }
  function hideSplash() {
    var el = $('#splash');
    if (el.classList.contains('gone')) return;
    el.classList.add('gone');
    setTimeout(function () { el.remove(); }, 400);
  }

  /* =============== START =============== */
  async function start() {
    await S.load();
    applyTheme();
    $('#water').innerHTML = '<span class="water-fin">' + SP.finSVG('fin') + '</span>';
    $('#fab').innerHTML = SP.icon('plus', 3.2);
    showSplash();
    S.render();
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
        if (S.state.settings.theme === 'system') applyTheme();
      });
    }
    var App = S.plugin('App');
    if (App) {
      App.addListener('backButton', function () {
        if ($('.modal')) { $('.modal').remove(); return; }
        if ($('#overlay').classList.contains('show')) { endCelebrate(celebrate.client); return; }
        if (sheets.length) closeSheet();
        else if (view !== 'ladder') { view = 'ladder'; S.render(); }
        else App.minimizeApp();
      });
      App.addListener('pause', function () { S.saveNow(); });
      // Days late change at midnight, so redraw when the app comes back
      App.addListener('resume', function () { S.render(); });
    }
    // Midnight tick for the browser preview too
    setInterval(function () { if (!sheets.length) S.render(); }, 60 * 60 * 1000);
  }
  document.addEventListener('DOMContentLoaded', start);
})();
