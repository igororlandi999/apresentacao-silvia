/* Overwine — controle da apresentação
   Teclado: setas, espaço, PageUp/PageDown (passadores), Home/End, 1-9 e 0, F = tela cheia
   Mouse: clique na metade direita avança, na esquerda volta; controles no canto inferior direito */
(function () {
  'use strict';
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var cur = document.getElementById('cur');
  var tot = document.getElementById('tot');
  var bar = document.getElementById('bar');
  var params = new URLSearchParams(location.search);
  var isStatic = params.has('static');
  var index = -1;
  var leaveTimer = null;
  var lock = false;

  if (isStatic) document.body.classList.add('static');
  tot.textContent = pad(total);

  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* encaixa o palco 1920x1080 em qualquer tela, mantendo 16:9 */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  function go(n) {
    if (n < 0 || n >= total || n === index || lock) return;
    var prev = slides[index];
    var next = slides[n];
    lock = true;
    setTimeout(function () { lock = false; }, 450);

    clearTimeout(leaveTimer);
    slides.forEach(function (s) {
      if (s !== prev && s !== next) s.classList.remove('active', 'leaving', 'on');
    });

    if (prev) {
      prev.classList.remove('active');
      prev.classList.add('leaving');
      leaveTimer = setTimeout(function () { prev.classList.remove('leaving', 'on'); }, isStatic ? 0 : 1400);
    }
    /* reinicia as animações do slide de destino */
    next.classList.remove('on', 'leaving');
    void next.offsetWidth;
    next.classList.add('active');
    requestAnimationFrame(function () { next.classList.add('on'); });
    if (isStatic) next.classList.add('on');

    index = n;
    cur.textContent = pad(n + 1);
    bar.style.width = ((n + 1) / total * 100) + '%';
    if (!isStatic) history.replaceState(null, '', '#' + (n + 1));
  }
  function nextSlide() { go(index + 1); }
  function prevSlide() { go(index - 1); }

  /* pré-carrega imagens para transições sem atraso */
  slides.forEach(function (s) {
    s.querySelectorAll('img').forEach(function (img) { var i = new Image(); i.src = img.src; });
  });

  /* teclado */
  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown' || k === 'PageDown' || k === ' ' || k === 'Enter') { e.preventDefault(); nextSlide(); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp' || k === 'PageUp' || k === 'Backspace') { e.preventDefault(); prevSlide(); }
    else if (k === 'Home') { go(0); }
    else if (k === 'End') { go(total - 1); }
    else if (k === 'f' || k === 'F') { toggleFs(); }
    else if (/^[0-9]$/.test(k)) { var n = k === '0' ? 9 : parseInt(k, 10) - 1; if (n < total) go(n); }
  });

  /* clique na tela */
  document.querySelector('.viewport').addEventListener('click', function (e) {
    if (e.clientX < window.innerWidth * 0.3) prevSlide(); else nextSlide();
  });

  /* gesto de deslizar (tablet / celular) */
  var tx = null;
  document.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null) return;
    var dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) { if (dx < 0) nextSlide(); else prevSlide(); }
    tx = null;
  });

  /* controles */
  document.getElementById('btnNext').addEventListener('click', function (e) { e.stopPropagation(); nextSlide(); });
  document.getElementById('btnPrev').addEventListener('click', function (e) { e.stopPropagation(); prevSlide(); });
  document.getElementById('btnFs').addEventListener('click', function (e) { e.stopPropagation(); toggleFs(); });
  document.getElementById('controls').addEventListener('click', function (e) { e.stopPropagation(); });

  function toggleFs() {
    var d = document;
    if (!d.fullscreenElement && !d.webkitFullscreenElement) {
      var el = d.documentElement;
      (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    } else {
      (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    }
  }

  /* controles e cursor somem quando o mouse fica parado */
  var idleTimer = null;
  function wake() {
    document.body.classList.add('show-ui');
    document.body.classList.remove('idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      document.body.classList.remove('show-ui');
      document.body.classList.add('idle');
    }, 2200);
  }
  document.addEventListener('mousemove', wake);

  /* slide inicial: ?slide=N ou #N */
  var start = parseInt(params.get('slide') || location.hash.replace('#', ''), 10);
  go(isNaN(start) ? 0 : Math.max(0, Math.min(total - 1, start - 1)));
})();
