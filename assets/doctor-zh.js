/* BiOLiS CLINIC — doctor card: Simplified Chinese + per-language vCard
   Shared by all doctor pages. Reads the page's own L / D / CARDS objects. */
(function () {
  'use strict';

  /* ---------- 1. UI dictionary : Chinese ---------- */
  var ZH = {
    call: '电话', email: '邮箱', line: 'LINE预约', ig: 'Instagram',
    map: '交通指南', web: '官网', save: '保存联系人',
    event: '特别活动', evbadge: '进行中', flip: '点击翻面',
    qrcap: '扫码打开电子名片', qrlp: '长按图片可保存到相册',
    qrhint: '点击放大', qrclose: '关闭', qrsave: '保存二维码',
    shareline: '通过LINE发送', cardcopy: '复制名片', refcopied: '已复制',
    foot: '东京都中央区八重洲1-3-18 VORT东京八重洲maxim 5F'
  };

  /* ---------- 2. per-doctor field / spec / cred ---------- */
  var DOC = {
    Sasaki:   { field: '下眼睑', spec: '下眼睑手术',         cred: '医疗美容外科医师' },
    Kaneko:   { field: '眼睑',   spec: '眼睑手术',           cred: '医疗美容外科医师' },
    Imai:     { field: '鼻部',   spec: '鼻部手术・截骨',      cred: '日本形成外科学会认证 整形外科专科医师' },
    Kim:      { field: '养肤',   spec: '养肤注射',           cred: '昵称「Emboss医生」' },
    Yarimizu: { field: '注射・养肤', spec: '麻醉科专科医师的注射・养肤', cred: '美容皮肤科医师・麻醉科医师' },
    Yoshida:  { field: '小脸·轮廓', spec: '面部吸脂・线雕提升・瘦脸针', cred: '整形外科医师' }
  };

  var ORG = {
    ja: 'BiOLiS CLINIC 東京・八重洲',
    ko: 'BiOLiS CLINIC 도쿄·야에스',
    en: 'BiOLiS CLINIC Tokyo Yaesu',
    zh: 'BiOLiS CLINIC 东京·八重洲'
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    try {
      /* ---------- 3. extend L and D ---------- */
      if (typeof L === 'object' && L) {
        Object.keys(ZH).forEach(function (k) { if (L[k]) L[k].zh = ZH[k]; });
      }
      var me = (typeof D === 'object' && D && DOC[D.key]) ? DOC[D.key] : null;
      if (me) {
        if (D.field) D.field.zh = me.field;
        if (D.spec)  D.spec.zh  = me.spec;
        if (D.cred)  D.cred.zh  = me.cred;
      }
      if (typeof CARDS === 'object' && CARDS && CARDS.ja && !CARDS.zh) CARDS.zh = CARDS.ja;

      /* ---------- 4. 中文 button ---------- */
      var box = document.querySelector('.lang');
      if (box && !box.querySelector('[data-l="zh"]')) {
        var b = document.createElement('button');
        b.setAttribute('data-l', 'zh');
        b.textContent = '中文';
        b.setAttribute('onclick', "setLang('zh')");
        box.appendChild(b);
      }
      /* shrink the switcher — it now holds four buttons */
      var st = document.createElement('style');
      st.textContent =
        '.lang{top:10px!important;right:10px!important;gap:1px!important;padding:2px!important;}' +
        '.lang button{font-size:9px!important;letter-spacing:.2px!important;padding:5px 7px!important;}';
      document.head.appendChild(st);

      /* ---------- 5. language detection ---------- */
      if (typeof detectLang === 'function') {
        var _d = detectLang;
        window.detectLang = function () {
          var n = (navigator.language || '').toLowerCase();
          if (n.indexOf('zh') === 0) return 'zh';
          return _d.apply(this, arguments);
        };
      }

      /* ---------- 6. language-aware vCard ---------- */
      var photo = '';
      try {
        fetch('https://biolis-clinic.github.io/biolis/assets/icon-192.png')
          .then(function (r) { return r.blob(); })
          .then(function (bl) {
            return new Promise(function (res, rej) {
              var fr = new FileReader();
              fr.onload = function () { res(fr.result); };
              fr.onerror = rej;
              fr.readAsDataURL(bl);
            });
          })
          .then(function (u) { photo = String(u).split(',')[1] || ''; })
          .catch(function () {});
      } catch (e) {}

      if (typeof buildVCard === 'function') {
        var base = buildVCard;
        window.buildVCard = function () {
          var v = base();
          try {
            var lg = (document.documentElement.lang || 'ja').slice(0, 2);
            if (['ja', 'ko', 'en', 'zh'].indexOf(lg) < 0) lg = 'ja';

            /* name : Japanese uses the kanji name, others the Latin name */
            var full = (lg === 'ja' && D && D.name_jp) ? D.name_jp : (D && D.name) || '';
            if (full) {
              var fam, giv, p = full.trim().split(/\s+/);
              if (p.length < 2) { fam = full.trim(); giv = ''; }
              else if (/^[\x20-\x7E]+$/.test(full)) { giv = p[0]; fam = p.slice(1).join(' '); }
              else { fam = p[0]; giv = p.slice(1).join(' '); }
              v = v.replace(/^FN:[^\r\n]*/m, 'FN:' + full.trim())
                   .replace(/^N:[^\r\n]*/m, 'N:' + fam + ';' + giv + ';;;');
            }
            if (D && D.cred && D.cred[lg]) v = v.replace(/^TITLE:[^\r\n]*/m, 'TITLE:' + D.cred[lg]);
            if (ORG[lg]) v = v.replace(/^ORG:[^\r\n]*/m, 'ORG:' + ORG[lg]);

            var ad = (typeof L === 'object' && L && L.foot && L.foot[lg]) ? String(L.foot[lg]) : '';
            ad = ad.split(/<br\s*\/?>/i)[0].replace(/<[^>]*>/g, '').trim();
            if (ad) {
              var esc = ad.replace(/([;,\\])/g, '\\$1');
              v = v.replace(/^ADR([^:\r\n]*):[^\r\n]*/m, 'ADR$1:;;' + esc + ';;;;');
            }
            /* iOS ignores social profiles without x-user */
            v = v.replace(/^X-SOCIALPROFILE([^:\r\n]*):([^\r\n]+)/mi, function (m, pr, u) {
              if (/x-user=/i.test(pr)) return m;
              var h = (u.match(/(?:instagram|twitter|x)\.com\/([^\/?#\s]+)/i) || [])[1] || '';
              return h ? ('X-SOCIALPROFILE' + pr + ';x-user=' + h + ':' + u) : m;
            });
          } catch (e) {}
          try {
            if (photo && !/^PHOTO/m.test(v)) {
              var ph = ('PHOTO;ENCODING=b;TYPE=PNG:' + photo).match(/.{1,74}/g).join('\r\n ');
              v = v.replace('END:VCARD', ph + '\r\nEND:VCARD');
            }
          } catch (e) {}
          return v;
        };
      }

      /* ---------- 6b. Simplified-Chinese card faces (HTML) ---------- */
      (function buildZhFaces() {
        var inner = document.querySelector('.flip-inner');
        if (!inner || inner.querySelector('.zhface')) return;

        var css = document.createElement('style');
        var u = function (n) { return 'calc(' + n + '*var(--u))'; };
        var SANS = '"Noto Sans SC","Noto Sans JP",sans-serif';
        var SERIF = '"Noto Serif SC","Noto Serif JP",serif';
        css.textContent =
          '.flip{container-type:inline-size;}' +
          '.zhface{display:none;background:#FCFBF8;overflow:hidden;--u:calc(100cqw / 910);}' +
          'html[lang="zh"] .zhface{display:block;}' +
          'html[lang="zh"] .flip-face:not(.zhface){display:none;}' +
          '.zhcv{position:absolute;inset:0;}' +
          '.zhf-in{position:absolute;inset:0;padding:' + u(67) + ' ' + u(70) + ' ' + u(66) + ' ' + u(90) + ';display:flex;flex-direction:column;text-align:left;}' +
          '.zhf-top{display:flex;align-items:center;justify-content:space-between;gap:' + u(20) + ';}' +
          '.zhf-logo{width:' + u(440) + '!important;height:auto!important;max-width:none!important;display:block;flex:none;}' +
          '.zhf-org{font-family:' + SANS + ';font-size:' + u(16) + ';letter-spacing:' + u(4) + ';color:#6E6455;white-space:nowrap;}' +
          '.zhf-name{font-family:' + SERIF + ';font-weight:500;font-size:' + u(58) + ';letter-spacing:' + u(6) + ';color:#2E2820;margin-top:' + u(86) + ';line-height:1.1;}' +
          '.zhf-title{font-family:' + SANS + ';font-size:' + u(24) + ';letter-spacing:' + u(0.5) + ';color:#6E6455;margin-top:' + u(30) + ';}' +
          '.zhf-btm{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:' + u(20) + ';}' +
          '.zhf-contact{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;white-space:nowrap;}' +
          '.zhf-qr{width:' + u(90) + '!important;height:' + u(90) + '!important;max-width:none!important;display:block;flex:none;}' +
          '.zhb-in{position:absolute;inset:0;padding:' + u(40) + ' ' + u(60) + ';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}' +
          '.zhb-logo{width:' + u(124) + '!important;height:auto!important;max-width:none!important;display:block;}' +
          '.zhb-tag{font-family:' + SERIF + ';font-size:' + u(24) + ';letter-spacing:' + u(9) + ';text-indent:' + u(9) + ';color:#6E6455;margin-top:' + u(38) + ';}' +
          '.zhb-addr{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;margin-top:' + u(52) + ';line-height:1.6;max-width:' + u(720) + ';}' +
          '.zhb-line{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;margin-top:' + u(30) + ';}';
        document.head.appendChild(css);

        var fonts = document.createElement('link');
        fonts.rel = 'stylesheet';
        fonts.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500&family=Noto+Sans+SC:wght@400;500&display=swap';
        document.head.appendChild(fonts);

        var A = 'https://biolis-clinic.github.io/biolis/assets/';
        var qrEl = document.querySelector('.qrimg');
        var qr = qrEl ? qrEl.getAttribute('src') : A + 'icon-192.png';

        /* the printed card artwork carries its own QR (different encoding from
           .qrimg) — lift it straight out of the card image so both match */
        function useCardQR(imgEl) {
          try {
            if (!CARDS || !CARDS.ja || !CARDS.ja.f) return;
            var im = new Image();
            im.crossOrigin = 'anonymous';
            im.onload = function () {
              try {
                var c = document.createElement('canvas');
                c.width = im.width; c.height = im.height;
                var x = c.getContext('2d');
                x.drawImage(im, 0, 0);
                var sx = Math.round(im.width * 0.76), ex = Math.round(im.width * 0.99);
                var sy = Math.round(im.height * 0.61), ey = Math.round(im.height * 0.98);
                var d = x.getImageData(0, 0, c.width, c.height).data;
                var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
                for (var yy = sy; yy < ey; yy++) {
                  for (var xx = sx; xx < ex; xx++) {
                    var i = (yy * c.width + xx) * 4;
                    if (d[i] < 120 && d[i + 1] < 120 && d[i + 2] < 120) {
                      if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
                      if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
                    }
                  }
                }
                var w = x1 - x0 + 1, h = y1 - y0 + 1;
                if (w < 40 || h < 40) return;
                var S = 4;
                var o = document.createElement('canvas');
                o.width = w * S; o.height = h * S;
                var ox = o.getContext('2d');
                ox.imageSmoothingEnabled = false;
                ox.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);
                imgEl.src = o.toDataURL('image/png');
              } catch (e) {}
            };
            im.src = CARDS.ja.f;
          } catch (e) {}
        }
        var mail = (D && D.slug ? D.slug : '') + '@biolisclinic.com';
        var tel = '03-6262-2677';
        var name = (D && D.name) || '';
        var cred = (D && D.cred && D.cred.zh) || '';

        var f = document.createElement('div');
        f.className = 'flip-face flip-front zhface';
        f.innerHTML = '<div class="zhcv"><div class="zhf-in">' +
          '<div class="zhf-top"><img class="zhf-logo" src="' + A + 'logo-h.png" alt="BiOLiS CLINIC">' +
          '<div class="zhf-org">医疗法人樱会</div></div>' +
          '<div class="zhf-name">' + name + '</div>' +
          '<div class="zhf-title">' + cred + '</div>' +
          '<div class="zhf-btm"><div class="zhf-contact">' + mail + '　·　' + tel + '</div>' +
          '<img class="zhf-qr" src="' + qr + '" alt="QR"></div>' +
          '</div></div>';

        var b = document.createElement('div');
        b.className = 'flip-face flip-back zhface';
        b.innerHTML = '<div class="zhcv"><div class="zhb-in">' +
          '<img class="zhb-logo" src="' + A + 'logo-v.png" alt="BiOLiS CLINIC">' +
          '<div class="zhb-tag">设计「未来的美丽与健康」</div>' +
          '<div class="zhb-addr">东京都中央区八重洲1-3-18 VORT东京八重洲maxim 5F</div>' +
          '<div class="zhb-line">TEL 03-6262-2677　·　biolisclinic.com　·　@biolisclinic_official</div>' +
          '</div></div>';

        inner.appendChild(f);
        inner.appendChild(b);
        useCardQR(f.querySelector('.zhf-qr'));

        /* fallback for browsers without container queries */
        function scaleZh() {
          try {
            if (window.CSS && CSS.supports && CSS.supports('container-type', 'inline-size')) return;
            var w = inner.clientWidth || inner.getBoundingClientRect().width;
            if (!w) return;
            var s = (w / 910) + 'px';
            [f, b].forEach(function (el) { el.style.setProperty('--u', s); });
          } catch (e) {}
        }
        scaleZh();
        window.addEventListener('resize', scaleZh);
        try { if (window.ResizeObserver) new ResizeObserver(scaleZh).observe(inner); } catch (e) {}
        setTimeout(scaleZh, 300); setTimeout(scaleZh, 1500);
      })();

      /* ---------- 7. swap the .vcf file by language ---------- */
      function pick() {
        var lg = (document.documentElement.lang || 'ja').slice(0, 2);
        if (['ja', 'ko', 'en', 'zh'].indexOf(lg) < 0) lg = 'ja';
        var a = document.querySelector('a[href$=".vcf"]');
        if (a && D && D.slug) a.setAttribute('href', D.slug + '_' + lg + '.vcf');
      }
      var _sl = window.setLang;
      if (typeof _sl === 'function') {
        window.setLang = function () {
          var r = _sl.apply(this, arguments);
          try { pick(); } catch (e) {}
          return r;
        };
      }
      if (typeof setLang === 'function' && typeof detectLang === 'function') setLang(detectLang());
      pick();
    } catch (e) {}
  });
})();
