// La page : fenetres de texte, cadran horaire et menu. Le film (photos + clips
// pilotes par le scroll) est gere par le moteur scrollcraft, non modifie.
(function () {
  var doc = document.documentElement;
  var segs = [].slice.call(document.querySelectorAll('[data-sc-segment]'));
  var cartes = [].slice.call(document.querySelectorAll('[data-sc-copy]'));
  var W = segs.map(function (s) { return parseFloat(s.getAttribute('data-sc-w')) || 1.3; });
  var C = [0];
  W.forEach(function (w) { C.push(C[C.length - 1] + w); });
  var TOTAL = C[C.length - 1];

  // chaque fiche est lisible pendant que son produit joue, puis s'efface au fondu suivant
  cartes.forEach(function (c, i) {
    if (i === 0 || i === cartes.length - 1) return;           // ouverture et fin : gerees par le moteur
    var k = i - 1;                                             // fiche i <-> trajet k
    var from = (C[k] + (k === 0 ? 0.28 : 0.1) * W[k]) / TOTAL;
    var to = Math.min(1, (C[k + 1] + (k === 0 ? 0.12 : 0.05)) / TOTAL);
    c.setAttribute('data-sc-window', from.toFixed(4) + ' ' + to.toFixed(4) + ' 0.16 0.12');
  });

  window.__sc = ScrollCraft.mount(document);
  function relayout() { dispatchEvent(new Event('resize')); }
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);

  // ---- cadran : la carte du monde est une horloge
  var reperes = [].slice.call(document.querySelectorAll('.cadran__repere'));
  var heureEl = document.getElementById('heure');
  var astre = document.querySelector('.cadran__astre');
  var fait = document.querySelector('.cadran__fait');
  var H = segs.map(function (s) { return [parseFloat(s.dataset.h0), parseFloat(s.dataset.h1)]; });
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var actif = -1, dernier = '';

  function position() {                                        // en hauteurs d'ecran le long de la piste
    return Math.min(TOTAL, Math.max(0, scrollY / (innerHeight || 1)));
  }
  function scrollPour(i) {                                     // repere 0 = aube, repere k = produit k
    if (i === 0) return 0;
    return (C[i - 1] + 0.82 * W[i - 1]) * innerHeight;
  }
  function texteHeure(h) {
    var m = Math.round(h * 60 / 5) * 5, hh = Math.floor(m / 60), mm = m % 60;
    return hh + ' h ' + (mm < 10 ? '0' : '') + mm;
  }
  function tic() {
    requestAnimationFrame(tic);
    var t = position();
    var k = 0;
    while (k < W.length - 1 && t >= C[k + 1]) k++;
    var p = Math.min(1, Math.max(0, (t - C[k]) / W[k]));
    var idx = (k === 0 && p < 0.45) ? 0 : k + 1;
    if (idx !== actif) {
      actif = idx;
      reperes.forEach(function (r, i) { r.setAttribute('aria-current', i === idx ? 'step' : 'false'); });
      doc.dataset.etape = idx === 0 ? 'aube' : segs[k].getAttribute('data-sc-waypoint');
    }
    var txt = texteHeure(H[k][0] + (H[k][1] - H[k][0]) * p);
    if (txt !== dernier) { heureEl.textContent = txt; dernier = txt; }
    // le curseur avance de repere en repere : 12 reperes, 11 intervalles
    var f = ((k === 0 ? p : k + p)) / W.length;
    f = (k + p) / W.length;
    fait.style.transform = 'scaleX(' + f.toFixed(4) + ')';
    astre.style.left = (f * 100).toFixed(2) + '%';
    doc.classList.toggle('est-nuit', k === W.length - 1 && p > 0.5);
  }
  tic();

  reperes.forEach(function (r, i) {
    r.addEventListener('click', function () { scrollTo({ top: scrollPour(i) + 2, behavior: REDUCED ? 'auto' : 'smooth' }); });
  });
  addEventListener('keydown', function (e) {
    if (e.target.closest('dialog, input, textarea')) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    var i = Math.min(reperes.length - 1, Math.max(0, actif + (e.key === 'ArrowRight' ? 1 : -1)));
    scrollTo({ top: scrollPour(i) + 2, behavior: REDUCED ? 'auto' : 'smooth' });
  });

  // ---- menu
  var menu = document.getElementById('menu');
  document.getElementById('ouvre-menu').addEventListener('click', function () { menu.showModal(); });
  menu.addEventListener('click', function (e) { if (e.target === menu) menu.close(); });

  window.__page = { C: C, W: W, TOTAL: TOTAL, scrollPour: scrollPour };
})();
