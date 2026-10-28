/* SHARK export image: a riso-style poster, 1080 x 1350, drawn on a canvas. */
(function () {
  'use strict';
  var S = window.SHARK, SP = window.SHARK_SPRITES, I = SP.INK;

  function fit(ctx, text, font, size, maxW, minSize) {
    var s = size;
    while (s > (minSize || 18)) {
      ctx.font = font.replace('{s}', s);
      if (ctx.measureText(text).width <= maxW) break;
      s -= 2;
    }
    ctx.font = font.replace('{s}', s);
    return s;
  }
  // Halftone dots that shrink away from a corner
  function halftone(ctx, cx, cy, radius, color, step) {
    ctx.fillStyle = color;
    step = step || 26;
    for (var y = cy - radius; y <= cy + radius; y += step) {
      for (var x = cx - radius; x <= cx + radius; x += step) {
        var d = Math.hypot(x - cx, y - cy);
        if (d > radius) continue;
        var r = (1 - d / radius) * step * 0.48;
        if (r < 1.2) continue;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  function grain(ctx, W, H) {
    var img = ctx.getImageData(0, 0, W, H), d = img.data, seed = 7;
    for (var i = 0; i < d.length; i += 4) {
      seed = (seed * 16807) % 2147483647;
      var n = ((seed / 2147483647) - 0.5) * 26;
      d[i] += n; d[i + 1] += n; d[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  S.exportCard = async function (clientId) {
    try {
      await Promise.all([
        document.fonts.load('40px "Press Start 2P"'),
        document.fonts.load('700 40px "Space Mono"'),
        document.fonts.load('400 40px "Space Mono"')
      ]);
    } catch (e) { /* fall back to system fonts */ }
    var L = S.ladder(), idx = L.findIndex(function (r) { return r.c.id === clientId; });
    var r = L[idx], c = r.c, top = idx === 0;
    var W = 1080, H = 1350;
    var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    x.imageSmoothingEnabled = false;

    // paper and inks
    x.fillStyle = I.paper; x.fillRect(0, 0, W, H);
    halftone(x, W - 40, 40, 560, 'rgba(255,72,176,0.9)');
    halftone(x, 40, H - 40, 600, 'rgba(0,120,191,0.85)', 30);

    // frame with an offset second-colour print
    x.lineWidth = 10;
    x.strokeStyle = I.pink; x.strokeRect(54, 54, W - 96, H - 96);
    x.strokeStyle = I.black; x.strokeRect(44, 44, W - 96, H - 96);

    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    x.fillStyle = I.black; x.font = '26px "Press Start 2P"';
    x.fillText('OFFICIAL TITLE', W / 2, 140);

    // the sprite, printed twice slightly out of register
    var grid = top ? SP.clamGrid() : SP.fishGrid(r.days >= 30 ? 'panic' : 'nervous');
    var scale = top ? 17 : 22;
    var gw = grid[0].length * scale, gh = grid.length * scale;
    var sx = Math.round((W - gw) / 2), sy = top ? 178 : 200;
    SP.draw(x, grid, sx + 14, sy + 12, scale, { flat: 'rgba(0,120,191,0.9)' });
    SP.draw(x, grid, sx, sy, scale, { body: c.color });

    // title
    var title = top ? 'THE CLAM' : '#' + (idx + 1) + ' ON THE LADDER';
    var ty = 640;
    fit(x, title, '{s}px "Press Start 2P"', top ? 96 : 60, W - 200, 28);
    x.fillStyle = I.pink; x.fillText(title, W / 2 + 7, ty + 7);
    x.fillStyle = I.black; x.fillText(title, W / 2, ty);

    // name
    fit(x, c.name, '700 {s}px "Space Mono"', 64, W - 220, 30);
    x.fillStyle = I.black; x.fillText(c.name, W / 2, 735);

    // the box
    var bx = 120, by = 790, bw = W - 240, bh = 300;
    x.fillStyle = I.black; x.fillRect(bx + 14, by + 14, bw, bh);
    x.fillStyle = '#FFFFFF'; x.fillRect(bx, by, bw, bh);
    x.lineWidth = 6; x.strokeStyle = I.black; x.strokeRect(bx, by, bw, bh);
    x.beginPath(); x.moveTo(bx + bw * 0.56, by + 30); x.lineTo(bx + bw * 0.56, by + bh - 30); x.stroke();

    x.textAlign = 'left';
    x.fillStyle = I.black; x.font = '20px "Press Start 2P"';
    x.fillText('OUTSTANDING', bx + 36, by + 66);
    var list = S.totalsList(r.totals);
    var amtSize = list.length > 2 ? 40 : list.length > 1 ? 46 : 54;
    list.forEach(function (p, i) {
      var t = S.money(p[1], p[0]);
      fit(x, t, '700 {s}px "Space Mono"', amtSize, bw * 0.56 - 60, 24);
      x.fillText(t, bx + 36, by + 140 + i * (amtSize + 16));
    });
    var rx = bx + bw * 0.56 + 34;
    x.font = '18px "Press Start 2P"'; x.fillText('LATE SINCE', rx, by + 66);
    x.font = '700 36px "Space Mono"'; x.fillText(S.fmtDate(r.since), rx, by + 120);
    x.font = '18px "Press Start 2P"'; x.fillText('DAYS LATE', rx, by + 186);
    x.font = '40px "Press Start 2P"'; x.fillText(String(r.days), rx, by + 250);

    // footer
    x.textAlign = 'center';
    x.font = '700 40px "Space Mono"'; x.fillStyle = I.black;
    x.fillText('Settle up and swim free.', W / 2, 1160);
    SP.drawWordmark(x, W / 2, 1186, 48, I.black);
    x.font = '13px "Press Start 2P"';
    x.fillText('AN UNTAMED GAME NOBODY WANTS TO WIN', W / 2, 1268);

    grain(x, W, H);
    return cv.toDataURL('image/png');
  };
})();
