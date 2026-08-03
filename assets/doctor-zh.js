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
    Yarimizu: { field: '注射・养肤', spec: '麻醉科专科医师的注射・养肤', cred: '美容皮肤科医师・麻醉科医师' }
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
