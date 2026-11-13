/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/dgl-physik.html
   =========================================================================
   Modelle: daempfung.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/dgl-physik.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, werteLeiste = I.werteLeiste, geruest = I.geruest,
      auswahl = I.auswahl, markiere = I.markiere;

  /* =======================================================================
     MODELL: DÄMPFUNG  (rechenmethoden/dgl-physik)
     Gedämpfter Federschwinger  ẍ + 2γẋ + ω0² x = 0  in Einheiten ω0 = 1,
     Start x(0) = 1, ẋ(0) = 0. Charakteristische Gleichung
     λ² + 2γλ + 1 = 0  →  λ1,2 = −γ ± √(γ² − 1).
       γ < 1: x = e^(−γt) (cos ωd t + γ/ωd · sin ωd t),  ωd = √(1 − γ²)
       γ = 1: x = (1 + t) e^(−t)
       γ > 1: x = (λ2 e^(λ1 t) − λ1 e^(λ2 t)) / (λ2 − λ1)
     Oben x(t) für 0 ≤ ω0 t ≤ 20 (Hüllkurve ± e^(−γt)/ωd · ω0 im
     Schwingfall, dünn der Grenzfall zum Vergleich), unten λ1, λ2 in der
     komplexen Ebene mit gleichem Maßstab für Re und Im.
     ======================================================================= */
  function daempfung(fig) {
    var GMAX = 2, TMAX = 20;
    var FAELLE = [["ungedämpft", 0], ["schwach", 0.15], ["Grenzfall", 1], ["stark", 2]];
    var z = { g: 0.15 };
    var teil = geruest(fig);
    var w = null;

    function istGrenz(g) { return Math.abs(g - 1) < 1e-3; }
    function x(g, t) {
      if (istGrenz(g)) return (1 + t) * Math.exp(-t);
      if (g < 1) {
        var wd = Math.sqrt(1 - g * g);
        return Math.exp(-g * t) * (Math.cos(wd * t) + g / wd * Math.sin(wd * t));
      }
      var r = Math.sqrt(g * g - 1), l1 = -g + r, l2 = -g - r;
      return (l2 * Math.exp(l1 * t) - l1 * Math.exp(l2 * t)) / (l2 - l1);
    }

    var flaeche = zeichenflaeche(teil.buehne, null,
      "Oben die Auslenkung eines gedämpften Federschwingers über der Zeit, unten die beiden Lösungen der charakteristischen Gleichung als Punkte in der komplexen Zahlenebene",
      function (b) { var m = mass(b); return m.hD + m.hE; }, aufbau);

    function mass(b) {
      var hD = Math.round(begrenze(b * 0.36, 150, 220));
      var S = Math.min((b - 56) / 4.7, 72);
      return { hD: hD, S: S, hE: Math.round(2.6 * S + 34) };
    }

    function aufbau() {
      var m = mass(flaeche.b);
      w = m;
      zeichne();
    }

    var knoepfe = auswahl(teil.bedienung, "Dämpfung", "Typische Dämpfungen",
      FAELLE.map(function (f) { return f[0]; }),
      function (i) { z.g = FAELLE[i][1]; rg.setze(z.g); zeichne(); });
    var rg = regler(teil.regler, {
      name: "Dämpfung γ / ω₀", min: 0, max: GMAX, schritt: 0.05, wert: z.g,
      anzeige: function (v) { return zahl(v, 2); }
    }, function (v) { z.g = v; zeichne(); });
    var werte = werteLeiste(teil.bedienung, [["l1", "λ₁ / ω₀"], ["l2", "λ₂ / ω₀"], ["fall", "Fall"]]);

    function komplex(re, im) {
      if (Math.abs(im) < 1e-9) return zahl(re, 2);
      var r = Math.abs(re) < 1e-9 ? "" : zahl(re, 2) + (im > 0 ? " + " : " − ");
      if (!r) return (im > 0 ? "" : "−") + zahl(Math.abs(im), 2) + " i";
      return r + zahl(Math.abs(im), 2) + " i";
    }

    function zeichne() {
      if (!w) return;
      var g = z.g, f = flaeche, B = f.b, i;
      markiere(knoepfe, FAELLE.map(function (q) { return q[1]; }).indexOf(Math.round(g * 100) / 100));
      f.leeren();
      var g0 = s("g", null, f.svg);

      /* ---------- oben: x(t) ---------- */
      var l = 40, r = 14, o = 18, u = 24, H = w.hD;
      var X = function (t) { return l + t / TMAX * (B - l - r); };
      var Y = function (v) { return o + (1.12 - v) / 2.2 * (H - o - u); };
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r + 4, y2: Y(0) }, g0);
      s("line", { "class": "achse", x1: l, y1: H - u + 6, x2: l, y2: o - 6 }, g0);
      for (i = 5; i <= TMAX; i += 5) {
        s("line", { "class": "achse", x1: X(i), y1: Y(0) - 3, x2: X(i), y2: Y(0) + 3 }, g0);
        txt(g0, X(i), Y(0) + 15, String(i), "klein", "middle");
      }
      [1, -1].forEach(function (v) {
        s("line", { "class": "achse", x1: l - 3, y1: Y(v), x2: l + 3, y2: Y(v) }, g0);
        txt(g0, l - 6, Y(v) + 4, zahl(v, 0), "klein", "end");
      });
      txt(g0, B - r, Y(0) - 7, "ω₀t", "klein", "end");
      txt(g0, l + 7, o + 4, "x / x₀", "klein");

      var pts, t, n = 240;
      if (g > 0 && g < 1 && !istGrenz(g)) {          // Hüllkurve
        var A = 1 / Math.sqrt(1 - g * g);
        [1, -1].forEach(function (sg) {
          pts = [];
          for (i = 0; i <= 80; i++) { t = i / 80 * TMAX; pts.push([X(t), Y(sg * A * Math.exp(-g * t))]); }
          s("polyline", { "class": "hilfslinie", points: linienzug(pts) }, g0);
        });
      }
      if (!istGrenz(g)) {                             // Grenzfall zum Vergleich
        pts = [];
        for (i = 0; i <= n; i++) { t = i / n * TMAX; pts.push([X(t), Y(x(1, t))]); }
        s("polyline", { "class": "kurve schwach", points: linienzug(pts) }, g0);
        if (g < 1) txt(g0, X(2.6), Y(x(1, 2.6)) - 6, "Grenzfall", "klein halo");
        else txt(g0, X(1.2), Y(0) + 15, "grau: Grenzfall", "klein");
      }
      pts = [];
      for (i = 0; i <= n; i++) { t = i / n * TMAX; pts.push([X(t), Y(x(g, t))]); }
      s("polyline", { "class": "kurve blau", points: linienzug(pts) }, g0);

      /* ---------- unten: λ-Ebene ---------- */
      var S = w.S, top = H + 8;
      var ox = Math.round(B / 2 + 1.75 * S), oy = Math.round(top + 1.3 * S + 4);
      var P = function (re, im) { return [ox + re * S, oy - im * S]; };
      var g1 = s("g", null, f.svg);
      s("line", { "class": "achse", x1: P(-4.1, 0)[0], y1: oy, x2: P(0.6, 0)[0], y2: oy }, g1);
      s("line", { "class": "achse", x1: ox, y1: P(0, -1.3)[1], x2: ox, y2: P(0, 1.3)[1] }, g1);
      txt(g1, P(0.6, 0)[0], oy - 6, "Re λ", "klein", "end");
      txt(g1, ox + 6, P(0, 1.3)[1] + 9, "Im λ", "klein");
      for (i = 1; i <= 4; i++) {
        var q = P(-i, 0);
        s("line", { "class": "achse", x1: q[0], y1: oy - 3, x2: q[0], y2: oy + 3 }, g1);
        txt(g1, q[0], oy + 14, "−" + i, "klein", "middle");
      }
      txt(g1, ox + 6, P(0, 1)[1] + 4, "i", "klein");
      txt(g1, ox + 6, P(0, -1)[1] + 4, "−i", "klein");
      /* Weg der Lösungen für 0 ≤ γ ≤ 2: Halbkreis, dann reelle Achse */
      var a = P(0, 1), c = P(0, -1), lmin = P(-GMAX - Math.sqrt(GMAX * GMAX - 1), 0), lmax = P(-GMAX + Math.sqrt(GMAX * GMAX - 1), 0);
      s("path", { "class": "spur", d: "M" + a[0] + " " + a[1] + "A" + S + " " + S + " 0 0 0 " + c[0] + " " + c[1] }, g1);
      s("line", { "class": "spur", x1: lmin[0], y1: oy, x2: lmax[0], y2: oy }, g1);
      txt(g1, P(-0.72, 0.72)[0] - 4, P(-0.72, 0.72)[1] - 4, "|λ| = ω₀", "klein halo", "end");

      var l1, l2, fall;
      if (istGrenz(g)) { l1 = [-1, 0]; l2 = [-1, 0]; fall = "Grenzfall"; }
      else if (g < 1) {
        var wd = Math.sqrt(1 - g * g);
        l1 = [-g, wd]; l2 = [-g, -wd]; fall = g === 0 ? "ungedämpft" : "Schwingfall";
      } else {
        var rr = Math.sqrt(g * g - 1);
        l1 = [-g + rr, 0]; l2 = [-g - rr, 0]; fall = "Kriechfall";
      }
      var p1 = P(l1[0], l1[1]), p2 = P(l2[0], l2[1]);
      s("circle", { "class": "punkt blau", cx: p2[0], cy: p2[1], r: 5 }, g1);
      s("circle", { "class": "punkt kupfer", cx: p1[0], cy: p1[1], r: 5 }, g1);
      if (istGrenz(g)) {
        txt(g1, p1[0], p1[1] - 10, "λ₁ = λ₂", "kupfer klein halo", "middle");
      } else if (g < 1) {
        txt(g1, p1[0] - 9, p1[1] - 6, "λ₁", "kupfer klein halo", "end");
        txt(g1, p2[0] - 9, p2[1] + 14, "λ₂", "blau klein halo", "end");
      } else {
        txt(g1, p1[0], p1[1] - 10, "λ₁", "kupfer klein halo", "middle");
        txt(g1, p2[0], p2[1] - 10, "λ₂", "blau klein halo", "middle");
      }

      werte.l1.textContent = komplex(l1[0], l1[1]);
      werte.l2.textContent = komplex(l2[0], l2[1]);
      werte.fall.textContent = fall;

      var satz;
      if (g === 0) {
        satz = "Ohne Dämpfung liegen λ₁,₂ = ±i ω₀ auf der imaginären Achse. Der Realteil ist null, also klingt nichts ab: x(t) = x₀ cos ω₀t schwingt ewig weiter.";
      } else if (istGrenz(g)) {
        satz = "Aperiodischer Grenzfall: Beide Lösungen fallen bei λ = −ω₀ zusammen, und x(t) = x₀ (1 + ω₀t) e^(−ω₀t). Schneller kommt der Körper nicht in die Ruhelage zurück, ohne über sie hinauszuschwingen.";
      } else if (g < 1) {
        var wd2 = Math.sqrt(1 - g * g), rest = Math.exp(-2 * Math.PI * g / wd2);
        satz = "Schwingfall: λ₁,₂ = −γ ± i ωd liegen auf dem Halbkreis vom Radius ω₀. Der Imaginärteil ωd = " + zahl(wd2, 2) +
          " ω₀ ist die Kreisfrequenz der Schwingung. Der Realteil −γ lässt die Ausschläge mit e^(−γt) abklingen (gestrichelte Hüllkurve): Nach jeder Schwingung bleibt das " +
          zahl(rest, rest < 0.01 ? 4 : 2) + "-Fache übrig.";
      } else {
        satz = "Kriechfall: zwei reelle Lösungen λ₁ = " + zahl(l1[0], 2) + " ω₀ und λ₂ = " + zahl(l2[0], 2) +
          " ω₀. Der Anteil mit λ₂ ist schnell verschwunden. Übrig bleibt e^(λ₁t), und weil λ₁ näher an null liegt als −ω₀, kriecht der Körper langsamer zurück als im Grenzfall (dünne graue Kurve).";
      }
      teil.status.textContent = "γ = " + zahl(g, 2) + " ω₀. " + satz;
    }

    aufbau();
  }

  I.modell("daempfung", daempfung);
})(window.Interaktiv);
