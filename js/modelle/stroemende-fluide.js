/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/stroemende-fluide.html
   =========================================================================
   Modelle: venturi, rohrstroemung.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/stroemende-fluide.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest, tausender = I.tausender, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: VENTURI-ROHR – Kontinuität und Bernoulli    (stroemende-fluide)
     Waagerechtes Rohr (Ø 40 mm) mit Engstelle; Volumenstrom Q.
       v = Q/A,  Steighöhe h = h1 − (v² − v1²)/(2g)   (ideal, ohne Reibung)
     Die Teilchen bewegen sich mit der örtlichen Geschwindigkeit (Zeitlupe).
     ======================================================================= */
  function venturi(fig) {
    var D1 = 0.04, LP = 1.0, H1 = 0.5, HROHR = 0.65, N = 400;
    var z = { Q: 1.0, d2: 20, t: 0 };                 // Q in L/s, d2 in mm, t in s
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Waagerechtes Rohr mit Engstelle und drei Steigrohren; in der Engstelle fließt das Wasser schneller und die Wassersäule ist niedriger",
      function (b) { return begrenze(b * 0.5, 260, 330); }, zeichne);

    function durchm(sr) {                              // sr = relative Lage 0 … 1
      var d2 = z.d2 / 1000;
      if (sr <= 0.32 || sr >= 0.68) return D1;
      if (sr >= 0.4 && sr <= 0.6) return d2;
      var u = sr < 0.4 ? (sr - 0.32) / 0.08 : (0.68 - sr) / 0.08;
      return D1 + (d2 - D1) * (0.5 - 0.5 * Math.cos(Math.PI * u));
    }
    function tempo(sr) { var d = durchm(sr); return z.Q / 1000 / (Math.PI * d * d / 4); }
    function hoehe(sr) { return H1 - (tempo(sr) * tempo(sr) - tempo(0) * tempo(0)) / (2 * G); }
    /* Laufzeit vom Rohranfang bis sr: τ(sr) = ∫ ds / v */
    function laufzeiten() {
      var tau = [0];
      for (var i = 1; i <= N; i++) tau.push(tau[i - 1] + (LP / N) / tempo((i - 0.5) / N));
      return tau;
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var l = 14, r = 14, rW = begrenze(H * 0.08, 18, 26), yc = H - 18 - rW;
      var X = function (sr) { return l + sr * (B - l - r); };
      var R = function (sr) { return rW * durchm(sr) / D1; };
      var Sh = (yc - rW - 26) / HROHR;

      /* Rohr: Wasserfüllung und Wände */
      var oberK = [], unterK = [], i;
      for (i = 0; i <= 80; i++) { var sr = i / 80; oberK.push([X(sr), yc - R(sr)]); unterK.push([X(sr), yc + R(sr)]); }
      s("polygon", { "class": "flaeche", points: linienzug(oberK.concat(unterK.slice().reverse())) }, f.svg);
      s("polyline", { "class": "kurve duenn", points: linienzug(oberK) }, f.svg);
      s("polyline", { "class": "kurve duenn", points: linienzug(unterK) }, f.svg);

      /* Steigrohre */
      [0.16, 0.5, 0.84].forEach(function (sr) {
        var x = X(sr), yR = yc - R(sr), yTop = yc - rW - HROHR * Sh, hh = hoehe(sr);
        var yW = yc - rW - begrenze(hh, 0, HROHR) * Sh;
        if (hh > 0) s("rect", { "class": "flaeche", x: x - 5, y: yW, width: 10, height: yR - yW }, f.svg);
        s("line", { "class": "kurve duenn", x1: x - 5, y1: yTop, x2: x - 5, y2: yR }, f.svg);
        s("line", { "class": "kurve duenn", x1: x + 5, y1: yTop, x2: x + 5, y2: yR }, f.svg);
        if (hh > 0) {
          s("line", { "class": "kurve blau duenn", x1: x - 5, y1: yW, x2: x + 5, y2: yW }, f.svg);
          txt(f.svg, x + 10, yW + 4, zahl(Math.min(hh, HROHR) * 100, 0) + " cm" + (hh > HROHR ? "+" : ""), "klein halo");
        } else {
          txt(f.svg, x + 10, yc - rW - 8, "saugt Luft an!", "kupfer klein halo");
        }
      });
      /* Bezugslinie: Höhe ohne Strömung */
      s("line", { "class": "hilfslinie", x1: X(0.05), y1: yc - rW - H1 * Sh, x2: X(0.95), y2: yc - rW - H1 * Sh }, f.svg);

      /* Wasserteilchen: gleiche Laufzeitabstände → Abstand ∝ Tempo */
      if (z.Q > 0) {
        var tau = laufzeiten(), T = tau[N], K = 14;
        [-0.55, 0, 0.55].forEach(function (zeile, j) {
          for (var k = 0; k < K; k++) {
            var ziel = ((z.t + (k + j / 3) * T / K) % T + T) % T, lo = 0, hi = N;
            while (hi - lo > 1) { var m = (lo + hi) >> 1; if (tau[m] <= ziel) lo = m; else hi = m; }
            var srP = (lo + (ziel - tau[lo]) / (tau[hi] - tau[lo])) / N;
            s("circle", { "class": "strobo", cx: X(srP), cy: yc + zeile * R(srP), r: 2.6 }, f.svg);
          }
        });
      }
    }

    regler(teil.regler, {
      name: "Durchfluss", min: 0, max: 1.4, schritt: 0.05, wert: z.Q,
      anzeige: function (w) { return zahl(w, 2) + " L/s"; }
    }, function (w) { z.Q = w; zeichne(); });
    regler(teil.regler, {
      name: "Durchmesser der Engstelle", min: 10, max: 40, schritt: 1, wert: z.d2,
      anzeige: function (w) { return zahl(w, 0) + " mm"; }
    }, function (w) { z.d2 = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Strömung zeigen (Zeitlupe)", faktor: 0.25,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; zeichne(); },
      ende: function () { return 8; }, vonVorn: true
    });

    var werte = werteLeiste(teil.bedienung, [
      ["v1", "Tempo im weiten Rohr"], ["v2", "Tempo in der Engstelle"], ["dp", "Druckunterschied"], ["h2", "Säule in der Mitte"]
    ]);

    function zeichne() {
      var v1 = tempo(0), v2 = tempo(0.5), h2 = hoehe(0.5);
      zeichneBuehne();
      werte.v1.textContent = zahl(v1, 2) + " m/s";
      werte.v2.textContent = zahl(v2, 2) + " m/s";
      werte.dp.textContent = zahl(1000 * (v2 * v2 - v1 * v1) / 2 / 100, 1) + " hPa";
      werte.h2.textContent = h2 >= 0 ? zahl(h2 * 100, 0) + " cm" : "leer (Unterdruck)";
      var satz;
      if (z.Q === 0) {
        satz = "Ohne Strömung stehen alle drei Wassersäulen gleich hoch: Der Druck ist überall gleich.";
      } else if (z.d2 >= 40) {
        satz = "Ohne Engstelle fließt das Wasser überall gleich schnell, und alle Säulen stehen gleich hoch.";
      } else if (h2 >= 0) {
        satz = "In der Engstelle muss dieselbe Wassermenge durch einen kleineren Querschnitt – sie fließt " +
          zahl(v2 / v1, 1) + "-mal so schnell. Dafür ist der Druck dort kleiner: Die mittlere Säule steht " +
          zahl((H1 - h2) * 100, 0) + " cm tiefer (Bernoulli).";
      } else {
        satz = "Die Engstelle ist so eng, dass der Druck dort unter den Luftdruck fällt: Das mittlere Röhrchen saugt Luft an – " +
          "genau so funktioniert eine Wasserstrahlpumpe.";
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  /* =======================================================================
     MODELL: ROHRSTRÖMUNG – Hagen-Poiseuille und Reynolds-Zahl
                                                         (stroemende-fluide)
     v(r) = Δp/(4ηL)·(R² − r²),  v_max = Δp R²/(4ηL),  v̄ = v_max/2,
     Q = π R⁴ Δp/(8ηL),  Re = ρ v̄ (2R)/η  (laminar bis etwa 2300)
     ======================================================================= */
  function rohrstroemung(fig) {
    var FL = [
      { name: "Wasser", eta: 1e-3, rho: 1000 },
      { name: "Olivenöl", eta: 0.08, rho: 910 },      // PRÜFEN: Olivenöl ≈ 0,08 Pa·s bei 20 °C
      { name: "Honig", eta: 10, rho: 1400 }           // PRÜFEN: Honig je nach Sorte und Temperatur 2–20 Pa·s
    ];
    var RMAX = 5e-3;
    var z = { fl: 0, R: 3e-3, dp: 50 };              // dp = Druckgefälle in Pa pro Meter Rohr
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Rohr von der Seite mit parabelförmigem Geschwindigkeitsprofil: in der Mitte am schnellsten, an der Wand null",
      function (b) { return begrenze(b * 0.42, 220, 280); }, zeichne);

    function vmax(R) { return z.dp * R * R / (4 * FL[z.fl].eta); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var yc = H / 2, RpxMax = H / 2 - 24, Rpx = RpxMax * z.R / RMAX;
      var x0 = 54, Vmax = B - x0 - 30, Vpx = Vmax * Math.pow(z.R / RMAX, 2);
      s("rect", { "class": "flaeche", x: 14, y: yc - Rpx, width: B - 28, height: 2 * Rpx }, f.svg);
      [yc - Rpx, yc + Rpx].forEach(function (y, n) {
        s("line", { "class": "achse", x1: 14, y1: y, x2: B - 14, y2: y }, f.svg);
        for (var x = 20; x < B - 14; x += 12) {
          s("line", { "class": "achse", x1: x, y1: y, x2: x - 5, y2: y + (n ? 6 : -6) }, f.svg);
        }
      });
      s("line", { "class": "achse", x1: x0, y1: yc - Rpx, x2: x0, y2: yc + Rpx }, f.svg);
      /* Profil: Parabel exakt als quadratische Bézierkurve */
      s("path", {
        "class": "kurve blau",
        d: "M" + x0 + " " + (yc - Rpx).toFixed(1) + "Q" + (x0 + 2 * Vpx).toFixed(1) + " " + yc + " " + x0 + " " + (yc + Rpx).toFixed(1)
      }, f.svg);
      for (var k = -4; k <= 4; k++) {
        var y = yc + k * Rpx / 5, len = Vpx * (1 - k * k / 25);
        if (Rpx > 8 || k === 0) pfeil(f.svg, x0, y, x0 + len, y, "blau duenn");
      }
      if (Vpx > 30) {
        s("line", { "class": "hilfslinie", x1: x0 + Vpx / 2, y1: yc - Rpx, x2: x0 + Vpx / 2, y2: yc + Rpx }, f.svg);
        txt(f.svg, x0 + Vpx / 2 + 4, yc + Rpx - 6, "Mittelwert", "klein halo");
      }
      txt(f.svg, 16, yc - Rpx - 10, "Wand: v = 0", "klein");
      txt(f.svg, B - 16, 14, "Pfeillänge: Tempo im Vergleich zum 5-mm-Rohr", "klein", "end");
    }

    var knoepfe = auswahl(teil.bedienung, null, "Flüssigkeit wählen", FL.map(function (x) { return x.name; }),
      function (i) { z.fl = i; zeichne(); });
    regler(teil.regler, {
      name: "Rohrradius R", min: 0.5, max: 5, schritt: 0.1, wert: z.R * 1000,
      anzeige: function (w) { return zahl(w, 1) + " mm"; }
    }, function (w) { z.R = w / 1000; zeichne(); });
    regler(teil.regler, {
      name: "Druckgefälle", min: 5, max: 200, schritt: 5, wert: z.dp,
      anzeige: function (w) { return zahl(w, 0) + " Pa pro m"; }
    }, function (w) { z.dp = w; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["vmax", "Tempo in der Mitte"], ["q", "Durchfluss"], ["anteil", "Durchfluss im Vergleich zu R = 5 mm"], ["re", "Reynolds-Zahl"]
    ]);

    function tempoText(v) {
      if (v >= 1) return zahl(v, 2) + " m/s";
      if (v >= 0.01) return zahl(v * 100, 1) + " cm/s";
      if (v >= 1e-4) return zahl(v * 1000, 2) + " mm/s";
      return zahl(v * 1e6, 1) + " µm/s";
    }
    function stromText(q) {                            // q in m³/s
      if (q * 6e4 >= 1) return zahl(q * 6e4, 2) + " L/min";
      if (q * 6e7 >= 0.1) return zahl(q * 6e7, 1) + " mL/min";
      return zahl(q * 6e10, 1) + " µL/min";
    }
    function zeichne() {
      var fl = FL[z.fl], vm = vmax(z.R), q = Math.PI * Math.pow(z.R, 4) * z.dp / (8 * fl.eta);
      var re = fl.rho * (vm / 2) * 2 * z.R / fl.eta;
      markiere(knoepfe, z.fl);
      zeichneBuehne();
      werte.vmax.textContent = tempoText(vm);
      werte.q.textContent = stromText(q);
      werte.anteil.textContent = zahl(Math.pow(z.R / RMAX, 4) * 100, Math.pow(z.R / RMAX, 4) < 0.1 ? 2 : 0) + " %";
      werte.re.textContent = (re >= 10 ? tausender(re) : zahl(re, re >= 0.01 ? 2 : 5)) + (re > 2300 ? " – turbulent!" : " – laminar");
      teil.status.textContent = re > 2300
        ? "Die Reynolds-Zahl liegt über etwa 2300: Die Strömung wird turbulent, das Parabelprofil zerfällt in Wirbel. " +
          "Hagen-Poiseuille gilt dann nicht mehr – in Wirklichkeit fließt weniger, als die Formel verspricht."
        : "Laminar: Die Schichten gleiten geordnet aneinander vorbei, in der Mitte am schnellsten. Halbierst du den Radius, " +
          "sinkt der Durchfluss auf ein Sechzehntel (R⁴!)." +
          (z.fl === 2 ? " Honig ist 10 000-mal zäher als Wasser – bei gleichem Druck fließt 10 000-mal weniger." : "");
    }
    zeichne();
  }

  I.modell("venturi", venturi);
  I.modell("rohrstroemung", rohrstroemung);
})(window.Interaktiv);
