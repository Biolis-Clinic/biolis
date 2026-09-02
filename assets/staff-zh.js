/* BiOLiS CLINIC — staff / ambassador cards (I-dictionary template)
   Adds Simplified Chinese + per-language vCard.
   Shared by: katsuno, nagaoka, ryu, yamamoto */
(function () {
  'use strict';

  /* ---------- UI dictionary : Chinese ---------- */
  var ZH = {
    call: '电话', email: '邮箱', line: 'LINE预约', ig: 'Instagram',
    map: '交通指南', web: '官网', save: '保存联系人',
    tagline: '设计「未来的美丽与健康」',
    qrcap: '扫码打开电子名片', qrlp: '长按图片可保存到相册',
    qrsave: '保存二维码', qrhint: '点击放大', qrclose: '关闭',
    flip: '点击翻面', docs: '医师介绍', event: '特别活动', evbadge: '进行中',
    secMain: '主要', secContact: '联系', secRef: '推荐', secShare: '分享', secMore: '其他',
    sharecard: '分享此名片', referral: '推荐表单', refcopy: '复制链接',
    recshare: '通过LINE发送招募', reccopy: '复制招募链接', refcopied: '已复制',
    shareline: '通过LINE发送', cardcopy: '复制名片', ambrecruit: '大使招募',
    shttl: '请在浏览器中打开',
    shtxt: '应用内浏览器无法保存联系人。请点击右上角菜单，选择「在浏览器中打开」。',
    shcopy: '复制链接', shclose: '关闭',
    foot: '东京都中央区八重洲1-3-18 VORT东京八重洲maxim 5F'
  };

  /* ---------- per-person : Latin name + Chinese title ---------- */
  var P = {
    katsuno:   { name: 'Risa Katsuno',      title: '护士／总经理' },
    nagaoka:   { name: 'Shinsuke Nagaoka',  title: '首席数字官（CDO）' },
    ryu:       { name: 'Terufumi Ryu',      title: '总务・财务' },
    yamamoto:  { name: 'Ryoichi Yamamoto',  title: '会长室' },
    nishimura: { name: 'Hiroshi Nishimura', title: '理事' }
  };

  var ORG = {
    ja: 'BiOLiS CLINIC 東京・八重洲',
    ko: 'BiOLiS CLINIC 도쿄·야에스',
    en: 'BiOLiS CLINIC Tokyo Yaesu',
    zh: 'BiOLiS CLINIC 东京·八重洲'
  };

  function slugOf() {
    var m = location.pathname.replace(/\/+$/, '').split('/');
    return m[m.length - 1] || '';
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    try {
      var slug = slugOf();
      var me = P[slug];
      if (typeof I === 'undefined' || !I || !I.ja) return;

      /* ---------- 1. build I.zh ---------- */
      if (!I.zh) {
        var zh = {};
        Object.keys(I.ja).forEach(function (k) {
          zh[k] = (ZH[k] !== undefined) ? ZH[k] : (I.en && I.en[k] !== undefined ? I.en[k] : I.ja[k]);
        });
        if (me) { zh.nameMain = me.name; zh.title = me.title; }
        zh.nameSub = '';
        I.zh = zh;
      }
      if (typeof CARDS === 'object' && CARDS && CARDS.ja && !CARDS.zh) CARDS.zh = CARDS.ja;

      /* ---------- 2. 中文 button + tighter switcher ---------- */
      var box = document.querySelector('.lang');
      if (box && !box.querySelector('[data-l="zh"]')) {
        var b = document.createElement('button');
        b.setAttribute('data-l', 'zh');
        b.textContent = '中文';
        b.setAttribute('onclick', "setLang('zh')");
        box.appendChild(b);
      }
      var st = document.createElement('style');
      st.textContent =
        '.lang{top:10px!important;right:10px!important;gap:1px!important;padding:2px!important;}' +
        '.lang button{font-size:9px!important;letter-spacing:.2px!important;padding:5px 7px!important;}' +
        'html[lang="zh"] #nameEn{display:none;}';
      document.head.appendChild(st);

      if (typeof detectLang === 'function') {
        var _d = detectLang;
        window.detectLang = function () {
          var n = (navigator.language || '').toLowerCase();
          if (n.indexOf('zh') === 0) return 'zh';
          return _d.apply(this, arguments);
        };
      }

      /* ---------- 3. language-aware vCard ---------- */
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
            var t = I[lg] || I.ja;
            var full = (t && t.nameMain) ? String(t.nameMain).trim() : '';
            if (full) {
              var fam, giv, p;
              if (full.indexOf('・') >= 0) {
                p = full.split('・'); giv = p[0] || ''; fam = p.slice(1).join('・');
              } else {
                p = full.split(/\s+/);
                if (p.length < 2) { fam = full; giv = ''; }
                else if (/^[\x20-\x7E]+$/.test(full)) { giv = p[0]; fam = p.slice(1).join(' '); }
                else { fam = p[0]; giv = p.slice(1).join(' '); }
              }
              v = v.replace(/^FN:[^\r\n]*/m, 'FN:' + full)
                   .replace(/^N:[^\r\n]*/m, 'N:' + fam + ';' + giv + ';;;');
            }
            if (t && t.title) v = v.replace(/^TITLE:[^\r\n]*/m, 'TITLE:' + String(t.title).trim());
            if (ORG[lg]) v = v.replace(/^ORG:[^\r\n]*/m, 'ORG:' + ORG[lg]);
            var ad = (t && t.foot) ? String(t.foot).split(/<br\s*\/?>/i)[0].replace(/<[^>]*>/g, '').trim() : '';
            if (ad) {
              var esc = ad.replace(/([;,\\])/g, '\\$1');
              v = v.replace(/^ADR([^:\r\n]*):[^\r\n]*/m, 'ADR$1:;;' + esc + ';;;;');
            }
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

      /* ---------- 4. Chinese card faces ---------- */
      (function faces() {
        var inner = document.querySelector('.flip-inner');
        if (!inner || inner.querySelector('.zhface')) return;
        var u = function (n) { return 'calc(' + n + '*var(--u))'; };
        var SANS = '"Noto Sans SC","Noto Sans JP",sans-serif';
        var SERIF = '"Noto Serif SC","Noto Serif JP",serif';
        var css = document.createElement('style');
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
          '.zhf-title{font-family:' + SANS + ';font-size:' + u(24) + ';color:#6E6455;margin-top:' + u(30) + ';}' +
          '.zhf-btm{margin-top:auto;display:flex;align-items:flex-end;justify-content:space-between;gap:' + u(20) + ';}' +
          '.zhf-contact{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;white-space:nowrap;}' +
          '.zhf-qr{width:' + u(90) + '!important;height:' + u(90) + '!important;max-width:none!important;display:block;flex:none;}' +
          '.zhb-in{position:absolute;inset:0;padding:' + u(40) + ' ' + u(60) + ';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}' +
          '.zhb-logo{width:' + u(124) + '!important;height:auto!important;max-width:none!important;display:block;}' +
          '.zhb-tag{font-family:' + SERIF + ';font-size:' + u(24) + ';letter-spacing:' + u(9) + ';text-indent:' + u(9) + ';color:#6E6455;margin-top:' + u(38) + ';}' +
          '.zhb-addr{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;margin-top:' + u(52) + ';line-height:1.6;max-width:' + u(720) + ';}' +
          '.zhb-line{font-family:' + SANS + ';font-size:' + u(21) + ';color:#3C362D;margin-top:' + u(30) + ';}';
        document.head.appendChild(css);

        var fl = document.createElement('link');
        fl.rel = 'stylesheet';
        fl.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500&family=Noto+Sans+SC:wght@400;500&display=swap';
        document.head.appendChild(fl);

        /* pull EMAIL / TEL straight out of the existing vCard */
        var mail = '', tel = '03-6262-2677';
        try {
          var vc = (typeof buildVCard === 'function') ? buildVCard() : '';
          var em = vc.match(/^EMAIL[^:\r\n]*:(.*)$/m); if (em) mail = em[1].trim();
          var tl = vc.match(/^TEL[^:\r\n]*:(.*)$/m);
          if (tl) {
            var raw = tl[1].trim().replace(/[^\d+]/g, '');
            if (/^\+81/.test(raw)) raw = '0' + raw.slice(3);
            tel = raw.length === 11 ? raw.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')
                : raw.length === 10 ? raw.replace(/(\d{2})(\d{4})(\d{4})/, '$1-$2-$3') : tl[1].trim();
          }
        } catch (e) {}

        var A = 'https://biolis-clinic.github.io/biolis/assets/';
        var nm = (me && me.name) || (I.en && I.en.nameMain) || '';
        var ti = (me && me.title) || '';

        var f = document.createElement('div');
        f.className = 'flip-face flip-front zhface';
        f.innerHTML = '<div class="zhcv"><div class="zhf-in">' +
          '<div class="zhf-top"><img class="zhf-logo" src="' + A + 'logo-h.png" alt="BiOLiS CLINIC">' +
          '<div class="zhf-org">医疗法人樱会</div></div>' +
          '<div class="zhf-name">' + nm + '</div>' +
          '<div class="zhf-title">' + ti + '</div>' +
          '<div class="zhf-btm"><div class="zhf-contact">' + mail + '　·　' + tel + '</div>' +
          '<img class="zhf-qr" alt="QR"></div></div></div>';

        var bk = document.createElement('div');
        bk.className = 'flip-face flip-back zhface';
        bk.innerHTML = '<div class="zhcv"><div class="zhb-in">' +
          '<img class="zhb-logo" src="' + A + 'logo-v.png" alt="BiOLiS CLINIC">' +
          '<div class="zhb-tag">设计「未来的美丽与健康」</div>' +
          '<div class="zhb-addr">东京都中央区八重洲1-3-18 VORT东京八重洲maxim 5F</div>' +
          '<div class="zhb-line">TEL 03-6262-2677　·　biolisclinic.com　·　@biolisclinic_official</div>' +
          '</div></div>';

        inner.appendChild(f);
        inner.appendChild(bk);

        /* lift the QR out of the card artwork so it matches the printed one */
        (function (imgEl) {
          try {
            if (!CARDS || !CARDS.ja || !CARDS.ja.f) return;
            var im = new Image(); im.crossOrigin = 'anonymous';
            im.onload = function () {
              try {
                var c = document.createElement('canvas');
                c.width = im.width; c.height = im.height;
                var x = c.getContext('2d'); x.drawImage(im, 0, 0);
                var sx = Math.round(im.width * 0.76), ex = Math.round(im.width * 0.99);
                var sy = Math.round(im.height * 0.61), ey = Math.round(im.height * 0.98);
                var d = x.getImageData(0, 0, c.width, c.height).data;
                var x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
                for (var yy = sy; yy < ey; yy++) for (var xx = sx; xx < ex; xx++) {
                  var i = (yy * c.width + xx) * 4;
                  if (d[i] < 120 && d[i + 1] < 120 && d[i + 2] < 120) {
                    if (xx < x0) x0 = xx; if (xx > x1) x1 = xx;
                    if (yy < y0) y0 = yy; if (yy > y1) y1 = yy;
                  }
                }
                var w = x1 - x0 + 1, h = y1 - y0 + 1;
                if (w < 40 || h < 40) return;
                var S = 4, o = document.createElement('canvas');
                o.width = w * S; o.height = h * S;
                var ox = o.getContext('2d'); ox.imageSmoothingEnabled = false;
                ox.drawImage(c, x0, y0, w, h, 0, 0, o.width, o.height);
                imgEl.src = o.toDataURL('image/png');
              } catch (e) {}
            };
            im.src = CARDS.ja.f;
          } catch (e) {}
        })(f.querySelector('.zhf-qr'));

        function scaleZh() {
          try {
            if (window.CSS && CSS.supports && CSS.supports('container-type', 'inline-size')) return;
            var w = inner.clientWidth || inner.getBoundingClientRect().width;
            if (!w) return;
            var s = (w / 910) + 'px';
            [f, bk].forEach(function (el) { el.style.setProperty('--u', s); });
          } catch (e) {}
        }
        scaleZh();
        window.addEventListener('resize', scaleZh);
        try { if (window.ResizeObserver) new ResizeObserver(scaleZh).observe(inner); } catch (e) {}
        setTimeout(scaleZh, 300); setTimeout(scaleZh, 1500);
      })();

      /* ---------- 5. swap the .vcf by language ---------- */
      function pick() {
        var lg = (document.documentElement.lang || 'ja').slice(0, 2);
        if (['ja', 'ko', 'en', 'zh'].indexOf(lg) < 0) lg = 'ja';
        var a = document.querySelector('a[href$=".vcf"]');
        if (a && slug) a.setAttribute('href', slug + '_' + lg + '.vcf');
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
