// Mobile nav toggle
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.getElementById('menuToggle');
  var nav = document.getElementById('siteNav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // Scroll-spy: highlight active nav link
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.site-nav a[href^="#"]');

  function onScroll() {
    var scrollY = window.scrollY + 80;
    sections.forEach(function (sec) {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        navLinks.forEach(function (l) { l.classList.remove('active'); });
        var active = document.querySelector('.site-nav a[href="#' + sec.id + '"]');
        if (active) active.classList.add('active');
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ===================== Aurora Canvas =====================
  (function () {
    var canvas = document.getElementById('auroraCanvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');

    var blobs = [
      { x: 0.15, y: 0.2,  r: 0.42, color: '#6366f1', fx: 0.000006, fy: 0.000005 },
      { x: 0.75, y: 0.65, r: 0.36, color: '#8b5cf6', fx: 0.000005, fy: 0.000004 },
      { x: 0.5,  y: 0.1,  r: 0.34, color: '#06b6d4', fx: 0.000004, fy: 0.000006 },
      { x: 0.82, y: 0.35, r: 0.30, color: '#ec4899', fx: 0.0000045, fy: 0.0000055 },
    ];

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;
    }
    resize();
    window.addEventListener('resize', resize);

    var t = 0;
    function draw() {
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      blobs.forEach(function (b) {
        // Very slow Lissajous drift — fluid, organic feel
        var px = (b.x + Math.sin(t * b.fx * 1000 + 1.2) * 0.18 + Math.cos(t * b.fx * 700 + 0.5) * 0.06) * w;
        var py = (b.y + Math.cos(t * b.fy * 1000 + 2.5) * 0.14 + Math.sin(t * b.fy * 800 + 1.0) * 0.06) * h;
        var radius = b.r * Math.min(w, h);

        var grad = ctx.createRadialGradient(px, py, 0, px, py, radius);
        grad.addColorStop(0,   hexToRgba(b.color, 0.22));
        grad.addColorStop(0.5, hexToRgba(b.color, 0.10));
        grad.addColorStop(1,   hexToRgba(b.color, 0));

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      t++;
      requestAnimationFrame(draw);
    }
    draw();

    function hexToRgba(hex, alpha) {
      var r = parseInt(hex.slice(1,3),16);
      var g = parseInt(hex.slice(3,5),16);
      var b = parseInt(hex.slice(5,7),16);
      return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }
  })();

  // ===================== Typewriter for hero name =====================
  (function () {
    var el = document.getElementById('heroNameText');
    if (!el) return;
    var text = 'Xinyu Guan ';
    var i = 0;
    function type() {
      if (i <= text.length) {
        el.textContent = text.slice(0, i);
        i++;
        setTimeout(type, i === 1 ? 400 : 60);
      }
    }
    type();
  })();

  // WeChat copy button
  var wechatBtn = document.getElementById('wechatCopyBtn');
  if (wechatBtn) {
    wechatBtn.addEventListener('click', function () {
      copyToClipboard(wechatBtn.getAttribute('data-wechat'), 'WeChat ID copied!');
    });
  }

  // Contact Me button — copy email
  var contactBtn = document.getElementById('contactMeBtn');
  if (contactBtn) {
    contactBtn.addEventListener('click', function () {
      copyToClipboard(contactBtn.getAttribute('data-email'), 'Email copied!');
    });
  }

  // Phone copy button
  var phoneBtn = document.getElementById('phoneCopyBtn');
  if (phoneBtn) {
    phoneBtn.addEventListener('click', function () {
      copyToClipboard(phoneBtn.getAttribute('data-phone'), 'Phone number copied!');
    });
  }

  function copyToClipboard(text, msg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(msg);
      }).catch(function () {
        legacyCopy(text, msg);
      });
      return;
    }
    legacyCopy(text, msg);
  }

  function legacyCopy(text, msg) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2em;height:2em;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    var success = false;
    try { success = document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
    showToast(success ? msg : text);
  }

  function showToast(msg) {
    var existing = document.getElementById('copy-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.id = 'copy-toast';
    toast.textContent = msg;
    toast.style.cssText = [
      'position:fixed', 'bottom:28px', 'left:50%', 'transform:translateX(-50%)',
      'background:#334155', 'color:#fff', 'padding:8px 20px', 'border-radius:8px',
      'font-size:0.85rem', 'font-weight:600', 'z-index:9999',
      'box-shadow:0 4px 16px rgba(0,0,0,0.18)', 'letter-spacing:0.01em',
      'transition:opacity 0.3s'
    ].join(';');
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2000);
  }

  // Header shadow on scroll
  var header = document.getElementById('siteHeader');
  window.addEventListener('scroll', function () {
    header.style.boxShadow = window.scrollY > 10 ? '0 2px 16px rgba(0,0,0,0.08)' : '';
  }, { passive: true });

  // History toggle button
  var historyBtn = document.getElementById('historyToggleBtn');
  var newsList = document.getElementById('newsList');
  if (historyBtn && newsList) {
    historyBtn.addEventListener('click', function () {
      var oldItems = newsList.querySelectorAll('[data-old]');
      var showing = historyBtn.classList.toggle('showing');
      oldItems.forEach(function (item) {
        item.classList.toggle('hidden', !showing);
      });
      historyBtn.innerHTML = showing
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>Hide History'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>History';
    });
  }
});
