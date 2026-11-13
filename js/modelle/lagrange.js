/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/lagrange.html
   =========================================================================
   Modelle: wirkungslabor, perlenring.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/lagrange.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      schoenerSchritt = I.schoenerSchritt, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, werteLeiste = I.werteLeiste,
      abspieler = I.abspieler, geruest = I.geruest, aufKreis = I.aufKreis;

  /* =======================================================================
     MODELL: WIRKUNGS-LABOR – Hamiltonsches Prinzip                (lagrange)
     Ball (m = 1 kg) senkrecht hochgeworfen, z(0) = z(T) = 0 mit T = 2 s.
     Echte Bahn z(t) = ½ g t (T − t). Probebahn = echte Bahn + η(t) mit
       η(t) = a1·sin(πt/T) + a2·sin(2πt/T),  η(0) = η(T) = 0.
     Wirkung S = ∫ (½ m ż² − m g z) dt, hier numerisch (Simpson). Weil V
     linear in z ist, gilt exakt S[Probe] − S[echt] = ½ m ∫ η̇² dt
       = m π² (a1² + 4 a2²) / (4T)  ≥ 0  (Kontrolle im Prüfskript).
     ======================================================================= */
  function wirkungslabor(fig) {
    var T = 2, M = 1, ZMAX = 8;
    var z = { a1: 1.5, a2: 0, f: 0.5 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Höhe des Balls über der Zeit: echte Wurfbahn und eine Probebahn mit gleichem Start und gleicher Landung",
      function (b) { return begrenze(b * 0.5, 240, 320); }, zeichne);

    function echt(t) { return 0.5 * G * t * (T - t); }
    function echtV(t) { return 0.5 * G * (T - 2 * t); }
    function probe(t) {
      return echt(t) + z.a1 * Math.sin(Math.PI * t / T) + z.a2 * Math.sin(2 * Math.PI * t / T);
    }
    function probeV(t) {
      return echtV(t) + z.a1 * Math.PI / T * Math.cos(Math.PI * t / T) +
        z.a2 * 2 * Math.PI / T * Math.cos(2 * Math.PI * t / T);
    }
    /* S = ∫ L dt mit der Simpsonregel (N gerade) */
    function wirkung(fz, fv) {
      var N = 200, dt = T / N, summe = 0;
      for (var i = 0; i <= N; i++) {
        var t = i * dt, L = 0.5 * M * fv(t) * fv(t) - M * G * fz(t);
        summe += L * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2);
      }
      return summe * dt / 3;
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, t = z.f * T;
      f.leeren();
      var l = 40, r = B < 440 ? 56 : 80, o = 30, u = 24;
      var X = function (tt) { return l + tt / T * (B - l - r); };
      var Y = function (zz) { return o + (ZMAX - zz) / ZMAX * (H - o - u); };
      txt(f.svg, 4, 14, "Höhe in m", "ia-titel");
      for (var k = 0; k <= ZMAX; k += 2) {
        s("line", { "class": "gitter", x1: l, y1: Y(k), x2: B - r, y2: Y(k) }, f.svg);
        txt(f.svg, l - 5, Y(k) + 4, zahl(k, 0), "klein", "end");
      }
      [0, 0.5, 1, 1.5, 2].forEach(function (tt, n) {
        txt(f.svg, X(tt), H - 6, zahl(tt, 1) + " s", "klein", n === 0 ? "start" : n === 4 ? "end" : "middle");
      });
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r, y2: Y(0) }, f.svg);
      s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: Y(0) }, f.svg);

      var pe = [], pp = [];
      for (var i = 0; i <= 100; i++) {
        var ti = i / 100 * T;
        pe.push([X(ti), Y(echt(ti))]);
        pp.push([X(ti), Y(probe(ti))]);
      }
      s("polyline", { "class": "kurve kupfer duenn", points: linienzug(pe) }, f.svg);
      s("polyline", { "class": "kurve blau", points: linienzug(pp) }, f.svg);
      /* gemeinsamer Start und gemeinsames Ziel */
      s("circle", { "class": "punkt", cx: X(0), cy: Y(0), r: 4 }, f.svg);
      s("circle", { "class": "punkt", cx: X(T), cy: Y(0), r: 4 }, f.svg);

      /* Legende oben rechts im Diagramm */
      txt(f.svg, B - r - 4, 14, "echte Bahn", "kupfer klein", "end");
      txt(f.svg, B - r - 4, 27, "deine Probebahn", "blau klein", "end");

      /* aktueller Zeitpunkt */
      s("line", { "class": "hilfslinie", x1: X(t), y1: o - 4, x2: X(t), y2: Y(0) }, f.svg);
      s("circle", { "class": "punkt kupfer", cx: X(t), cy: Y(echt(t)), r: 4 }, f.svg);
      s("circle", { "class": "punkt blau", cx: X(t), cy: Y(probe(t)), r: 4.5 }, f.svg);

      /* rechts: die beiden Bälle in echter Höhe nebeneinander */
      var xt = B - r / 2;
      s("line", { "class": "achse", x1: B - r + 10, y1: Y(0), x2: B - 6, y2: Y(0) }, f.svg);
      s("circle", { "class": "ball", cx: xt + 9, cy: Y(echt(t)) - 7, r: 7 }, f.svg);
      s("circle", { "class": "ball blau", cx: xt - 9, cy: Y(probe(t)) - 7, r: 7 }, f.svg);
    }

    var rA1 = regler(teil.regler, {
      name: "Ausbeulung a₁", min: -2.5, max: 2.5, schritt: 0.1, wert: z.a1,
      anzeige: function (w) { return zahl(w, 1) + " m"; }
    }, function (w) { z.a1 = w; zeichne(); });
    var rA2 = regler(teil.regler, {
      name: "Welle a₂", min: -1.5, max: 1.5, schritt: 0.1, wert: z.a2,
      anzeige: function (w) { return zahl(w, 1) + " m"; }
    }, function (w) { z.a2 = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * T, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Abfliegen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * T; },
      setze: function (t) { z.f = t / T; rZeit.setze(z.f); zeichne(); },
      ende: function () { return T; }
    });
    knopf(teil.knoepfe, "Echte Bahn einstellen", null, function () {
      z.a1 = 0; z.a2 = 0; rA1.setze(0); rA2.setze(0); zeichne();
    });

    var werte = werteLeiste(teil.bedienung, [
      ["se", "Wirkung der echten Bahn"], ["sp", "Wirkung deiner Bahn"],
      ["ds", "Unterschied"], ["gipfel", "Gipfelhöhe deiner Bahn"]
    ]);

    function zeichne() {
      var Se = wirkung(echt, echtV), Sp = wirkung(probe, probeV), gipfel = 0;
      for (var i = 0; i <= 200; i++) gipfel = Math.max(gipfel, probe(i / 200 * T));
      rZeit.auffrischen();
      zeichneBuehne();
      werte.se.textContent = zahl(Se, 1) + " J·s";
      werte.sp.textContent = zahl(Sp, 1) + " J·s";
      werte.ds.textContent = (Sp - Se < 0.005 ? "" : "+") + zahl(Sp - Se, 2) + " J·s";
      werte.gipfel.textContent = zahl(gipfel, 1) + " m";
      teil.status.textContent = z.a1 === 0 && z.a2 === 0
        ? "Das ist die echte Bahn – die Wurfparabel. Von allen Bahnen mit diesem Start und dieser Landung hat sie " +
          "die kleinste Wirkung."
        : "Deine Probebahn startet und landet zur selben Zeit am selben Ort wie die echte, ihre Wirkung ist aber um " +
          zahl(Sp - Se, 2) + " J·s größer. Probier es aus: Kleiner als bei der echten Bahn wird die Wirkung nie.";
    }
    zeichne();
  }

  /* =======================================================================
     MODELL: PERLE AUF DEM DREHENDEN RING                          (lagrange)
     Ring (R = 0,25 m) dreht mit ω um die senkrechte Achse; θ = Winkel der
     Perle vom tiefsten Punkt. Lagrange-Funktion pro Masse
       L/m = ½ R² (θ̇² + ω² sin²θ) + g R cos θ
     → θ̈ = sin θ (ω² cos θ − g/R)   (RK4, Start in Ruhe relativ zum Ring)
     Effektive potentielle Energie pro Masse U(θ) = −g R cos θ − ½ R² ω² sin²θ.
     Gleichgewicht: θ = 0 für ω² ≤ g/R, sonst cos θ* = g/(ω² R).
     Kleine Schwingungen: Ω² = g/R − ω² bzw. Ω² = ω² sin²θ*.
     ======================================================================= */
  function perlenring(fig) {
    var R = 0.25, DAUER = 6, DT = 0.002, JEDE = 5;
    var z = { n: 80, th0: 20, f: 0 };
    var bahn = [];
    var teil = geruest(fig);
    var reihe = h("div", "ia-diagramme");
    reihe.style.borderTop = "0"; reihe.style.marginTop = "0"; reihe.style.paddingTop = "0";
    teil.buehne.append(reihe);
    var szene = zeichenflaeche(reihe, null,
      "Ring mit Perle von vorn, in der Sicht eines Beobachters, der sich mit dem Ring mitdreht",
      function (b) { return begrenze(b * 0.7, 220, 270); }, zeichne);
    var dU = zeichenflaeche(reihe, null,
      "Energielandschaft im mitdrehenden Ring über dem Winkel der Perle",
      function (b) { return begrenze(b * 0.7, 220, 270); }, zeichne);

    function om() { return z.n * 2 * Math.PI / 60; }
    function U(th) { return -G * R * Math.cos(th) - 0.5 * R * R * om() * om() * Math.sin(th) * Math.sin(th); }
    function gleichgewicht() { var c = G / (om() * om() * R); return c >= 1 ? 0 : Math.acos(c); }
    function beschl(th) { return Math.sin(th) * (om() * om() * Math.cos(th) - G / R); }

    function rechne() {
      bahn = [];
      var th = z.th0 * Math.PI / 180, w = 0, n = Math.round(DAUER / DT);
      for (var i = 0; i <= n; i++) {
        if (i % JEDE === 0) bahn.push(th);
        var k1t = w, k1w = beschl(th);
        var k2t = w + DT / 2 * k1w, k2w = beschl(th + DT / 2 * k1t);
        var k3t = w + DT / 2 * k2w, k3w = beschl(th + DT / 2 * k2t);
        var k4t = w + DT * k3w, k4w = beschl(th + DT * k3t);
        th += DT / 6 * (k1t + 2 * k2t + 2 * k3t + k4t);
        w += DT / 6 * (k1w + 2 * k2w + 2 * k3w + k4w);
      }
    }
    function winkelJetzt() { return bahn[Math.round(z.f * (bahn.length - 1))]; }

    function zeichneRing() {
      var f = szene, B = f.b, H = f.h, th = winkelJetzt();
      f.leeren();
      var Rp = (H - 52) / 2, cx = B / 2, cy = H / 2 + 6;
      s("line", { "class": "achse", x1: cx, y1: cy - Rp - 22, x2: cx, y2: cy + Rp + 18 }, f.svg);
      s("circle", { "class": "kurve", cx: cx, cy: cy, r: Rp }, f.svg);
      /* Drehsinn: kleine Ellipse um die Achse oben */
      if (z.n > 0) {
        var bogen = [], yb = cy - Rp - 12;
        for (var k = 0; k <= 16; k++) {
          var a = Math.PI * (0.15 + 0.7 * k / 16);
          bogen.push([cx - 18 * Math.cos(a), yb + 5 * Math.sin(a)]);
        }
        s("polyline", { "class": "kurve kupfer duenn", points: linienzug(bogen) }, f.svg);
        var e = bogen[16];
        s("polygon", { "class": "punkt kupfer", points: (e[0] + 7) + "," + (e[1] - 1) + " " + (e[0] - 1) + "," + (e[1] - 4.5) + " " + (e[0] - 1) + "," + (e[1] + 3.5) }, f.svg);
      }
      txt(f.svg, cx + 26, cy - Rp - 12, "Drehachse", "klein");
      /* stabile Gleichgewichtslagen */
      var ts = gleichgewicht();
      (ts > 0 ? [ts, -ts] : [0]).forEach(function (g) {
        s("circle", { "class": "kurve kupfer duenn", cx: cx + Rp * Math.sin(g), cy: cy + Rp * Math.cos(g), r: 9 }, f.svg);
      });
      /* Abstand zur Achse und Perle */
      var px = cx + Rp * Math.sin(th), py = cy + Rp * Math.cos(th);
      s("line", { "class": "hilfslinie", x1: cx, y1: py, x2: px, y2: py }, f.svg);
      s("circle", { "class": "ball", cx: px, cy: py, r: 7 }, f.svg);
      txt(f.svg, 4, H - 6, "Kreise = Ruhelagen", "kupfer klein");
    }

    function zeichneEnergie() {
      var f = dU, B = f.b, H = f.h, th = winkelJetzt();
      f.leeren();
      var l = 40, r = 10, o = 26, u = 22, lo = 1e9, hi = -1e9, i, q;
      for (i = 0; i <= 120; i++) { q = -Math.PI + 2 * Math.PI * i / 120; lo = Math.min(lo, U(q)); hi = Math.max(hi, U(q)); }
      var luft = (hi - lo) * 0.1; lo -= luft; hi += luft;
      var X = function (w) { return l + (w + Math.PI) / (2 * Math.PI) * (B - l - r); };
      var Y = function (w) { return o + (hi - w) / (hi - lo) * (H - o - u); };
      txt(f.svg, 4, 14, "Energielandschaft in J/kg (mitdrehend)", "ia-titel");
      var schritt = schoenerSchritt(hi - lo, 3);
      for (var k = Math.ceil(lo / schritt) * schritt; k <= hi + 1e-9; k += schritt) {
        s("line", { "class": "gitter", x1: l, y1: Y(k), x2: B - r, y2: Y(k) }, f.svg);
        txt(f.svg, l - 5, Y(k) + 4, zahl(k, schritt < 1 ? 1 : 0), "klein", "end");
      }
      [-180, -90, 0, 90, 180].forEach(function (g, n) {
        txt(f.svg, X(g * Math.PI / 180), H - 6, (g < 0 ? "−" : "") + Math.abs(g) + "°", "klein", n === 0 ? "start" : n === 4 ? "end" : "middle");
      });
      s("line", { "class": "achse", x1: l, y1: H - u, x2: B - r, y2: H - u }, f.svg);
      s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: H - u }, f.svg);
      var pkt = [];
      for (i = 0; i <= 160; i++) { q = -Math.PI + 2 * Math.PI * i / 160; pkt.push([X(q), Y(U(q))]); }
      s("polyline", { "class": "kurve", points: linienzug(pkt) }, f.svg);
      var E = U(z.th0 * Math.PI / 180);
      s("line", { "class": "hilfslinie", x1: l, y1: Y(E), x2: B - r, y2: Y(E) }, f.svg);
      s("circle", { "class": "punkt kupfer", cx: X(aufKreis(th)), cy: Y(U(th)), r: 5 }, f.svg);
    }

    var rN = regler(teil.regler, {
      name: "Drehzahl des Rings", min: 0, max: 150, schritt: 1, wert: z.n,
      anzeige: function (w) { return w + " U/min"; }
    }, function (w) { spieler.stopp(); z.n = w; rechne(); zeichne(); });
    regler(teil.regler, {
      name: "Loslassen bei", min: 0, max: 170, schritt: 1, wert: z.th0,
      anzeige: function (w) { return w + "° vom tiefsten Punkt"; }
    }, function (w) { spieler.stopp(); z.th0 = w; z.f = 0; rZeit.setze(0); rechne(); zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeit", min: 0, max: 1, schritt: 0.002, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * DAUER, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Loslassen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * DAUER; },
      setze: function (t) { z.f = t / DAUER; rZeit.setze(z.f); zeichne(); },
      ende: function () { return DAUER; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["nk", "Kritische Drehzahl"], ["gg", "Ruhelage"], ["T", "Dauer einer kleinen Schwingung"]
    ]);

    function zeichne() {
      var w = om(), ts = gleichgewicht(), nk = Math.sqrt(G / R) * 60 / (2 * Math.PI);
      var O2 = ts > 0 ? w * w * Math.sin(ts) * Math.sin(ts) : G / R - w * w;
      zeichneRing();
      zeichneEnergie();
      werte.nk.textContent = zahl(nk, 1) + " U/min";
      werte.gg.textContent = ts > 0 ? "± " + zahl(ts * 180 / Math.PI, 0) + "°" : "ganz unten (0°)";
      werte.T.textContent = O2 > 1e-3 ? zahl(2 * Math.PI / Math.sqrt(O2), 2) + " s" : "sehr lang";
      teil.status.textContent = ts === 0
        ? "Unterhalb von " + zahl(nk, 0) + " U/min ist der tiefste Punkt die Ruhelage: Die Perle pendelt um den Boden " +
          "des Rings – je näher an der kritischen Drehzahl, desto träger."
        : "Oberhalb von " + zahl(nk, 0) + " U/min wird der Boden zum Buckel: Die Perle wandert hinauf und pendelt um eine " +
          "neue Ruhelage bei " + zahl(ts * 180 / Math.PI, 0) + "°. Je schneller der Ring, desto höher – die Mitte (90°) " +
          "erreicht sie aber nie.";
    }
    rechne();
    zeichne();
  }

  I.modell("wirkungslabor", wirkungslabor);
  I.modell("perlenring", perlenring);
})(window.Interaktiv);
