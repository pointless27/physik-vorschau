/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/stoesse.html
   =========================================================================
   Modelle: stosslabor, billard.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/stoesse.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      saeulen = I.saeulen, bahnMitTeilung = I.bahnMitTeilung,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 14: STOSS-LABOR (1D) – Stoßzahl e: 1 = elastisch, 0 = vollständig inelastisch
     v1' = (m1 v1 + m2 v2 − m2 e (v1 − v2)) / (m1 + m2) usw.
     ======================================================================= */
  function stosslabor(fig) {
    var BAHN = 2, W = 0.16, X1 = 0.4, X2 = 1.2;
    var z = { m1: 1, m2: 1, v1: 0.8, v2: 0, e: 1, f: 0.35 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, "ia-strasse", "Zwei Gleiter auf einer Luftkissenbahn stoßen zusammen",
      function (b) { return begrenze(b * 0.15, 112, 124); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var balken = zeichenflaeche(reihe, null, "Impulse und Energien vor und nach dem Stoß",
      function (b) { return begrenze(b * 0.28, 160, 190); }, zeichne);

    function stossZeit() { return z.v1 > z.v2 ? (X2 - X1 - W) / (z.v1 - z.v2) : Infinity; }
    function dauer() { var tc = stossZeit(); return isFinite(tc) ? tc + 1.6 : 2.5; }
    function nachher() {
      var M = z.m1 + z.m2, P = z.m1 * z.v1 + z.m2 * z.v2;
      return [(P - z.m2 * z.e * (z.v1 - z.v2)) / M, (P + z.m1 * z.e * (z.v1 - z.v2)) / M];
    }
    function zustand(t) {
      var tc = stossZeit(), n = nachher();
      if (t <= tc) return { x1: X1 + z.v1 * t, x2: X2 + z.v2 * t, u1: z.v1, u2: z.v2, nach: false };
      return { x1: X1 + z.v1 * tc + n[0] * (t - tc), x2: X2 + z.v2 * tc + n[1] * (t - tc), u1: n[0], u2: n[1], nach: true };
    }

    function zeichneBuehne() {
      var f = flaeche, p = zustand(z.f * dauer());
      f.leeren();
      var bahn = bahnMitTeilung(f, -0.1, BAHN + 0.2, 14, 10, 26), X = bahn.X, yS = bahn.y;
      [[p.x1, z.m1, p.u1, "1"], [p.x2, z.m2, p.u2, "2"]].forEach(function (g, i) {
        var hoehe = 14 + 10 * g[1];
        s("rect", { "class": "wagen", x: X(g[0] - W / 2), y: yS - hoehe, width: X(W) - X(0), height: hoehe, rx: 2 }, f.svg);
        txt(f.svg, X(g[0]), yS - hoehe / 2 + 4, zahl(g[1], 1) + " kg", "klein", "middle");
        if (pfeil(f.svg, X(g[0]), yS - hoehe - 10, X(g[0]) + g[2] * 45, yS - hoehe - 10, i ? "kupfer" : "blau")) {
          txtIndex(f.svg, X(g[0]) + g[2] * 45 + (g[2] > 0 ? 4 : -4), yS - hoehe - 6, "v", g[3] + (p.nach ? "′" : ""), i ? "kupfer klein" : "blau klein", g[2] > 0 ? "start" : "end");
        }
      });
      var xs = (z.m1 * p.x1 + z.m2 * p.x2) / (z.m1 + z.m2);
      s("line", { "class": "hilfslinie", x1: X(xs), y1: yS, x2: X(xs), y2: yS - 62 }, f.svg);
      txt(f.svg, X(xs), yS - 66, "Schwerpunkt", "klein", "middle");
    }

    function zeichneBalken() {
      var f = balken, B = f.b, H = f.h, p = zustand(z.f * dauer());
      f.leeren();
      var E0 = 0.5 * z.m1 * z.v1 * z.v1 + 0.5 * z.m2 * z.v2 * z.v2;
      var E1 = 0.5 * z.m1 * p.u1 * p.u1, E2 = 0.5 * z.m2 * p.u2 * p.u2;
      var pMax = Math.max(Math.abs(z.m1 * z.v1), Math.abs(z.m2 * z.v2), Math.abs(z.m1 * p.u1), Math.abs(z.m2 * p.u2),
                          Math.abs(z.m1 * z.v1 + z.m2 * z.v2), 0.05);
      var halb = B / 2, spalte = (halb - 20) / 3, mitte = (H - 40) / 2 + 16;
      txt(f.svg, 4, 14, "Impuls p", "ia-titel");
      saeulen(f.svg, 10, mitte, spalte, (H - 70) / 2 / pMax, [
        { name: "p₁", wert: z.m1 * p.u1, klasse: "" },
        { name: "p₂", wert: z.m2 * p.u2, klasse: "kupfer" },
        { name: "gesamt", wert: z.m1 * p.u1 + z.m2 * p.u2, klasse: "grau" }
      ], H - 6);
      txt(f.svg, halb + 4, 14, "Bewegungsenergie", "ia-titel");
      saeulen(f.svg, halb + 10, H - 24, spalte, (H - 56) / Math.max(E0, 1e-6), [
        { name: "E₁", wert: E1, klasse: "" },
        { name: "E₂", wert: E2, klasse: "kupfer" },
        { name: "Q (Wärme)", wert: Math.max(0, E0 - E1 - E2), klasse: "grau" }
      ], H - 6);
    }

    var rM1 = regler(teil.regler, { name: "Masse m₁", min: 0.2, max: 3, schritt: 0.1, wert: z.m1,
      anzeige: function (w) { return zahl(w, 1) + " kg"; } }, function (w) { z.m1 = w; zeichne(); });
    var rM2 = regler(teil.regler, { name: "Masse m₂", min: 0.2, max: 3, schritt: 0.1, wert: z.m2,
      anzeige: function (w) { return zahl(w, 1) + " kg"; } }, function (w) { z.m2 = w; zeichne(); });
    var rV1 = regler(teil.regler, { name: "Geschwindigkeit v₁", min: -1, max: 1.5, schritt: 0.05, wert: z.v1,
      anzeige: function (w) { return zahl(w, 2) + " m/s"; } }, function (w) { z.v1 = w; zeichne(); });
    var rV2 = regler(teil.regler, { name: "Geschwindigkeit v₂", min: -1.5, max: 1, schritt: 0.05, wert: z.v2,
      anzeige: function (w) { return zahl(w, 2) + " m/s"; } }, function (w) { z.v2 = w; zeichne(); });
    var rE = regler(teil.regler, { name: "Stoßzahl e", min: 0, max: 1, schritt: 0.05, wert: z.e,
      anzeige: function (w) { return zahl(w, 2) + (w === 1 ? " (elastisch)" : w === 0 ? " (bleiben kleben)" : ""); } },
      function (w) { z.e = w; zeichne(); });
    var rZeit = regler(teil.regler, { name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * dauer(), 2) + " s"; } },
      function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Abspielen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); rZeit.setze(z.f); zeichne(); },
      ende: dauer
    });
    [["Elastisch", 1], ["Vollständig inelastisch", 0]].forEach(function (v) {
      knopf(teil.knoepfe, v[0], null, function () { z.e = v[1]; rE.setze(v[1]); zeichne(); });
    });

    var werte = werteLeiste(teil.bedienung, [["nach", "nach dem Stoß v₁′ | v₂′"], ["q", "in Wärme umgewandelt Q"]]);

    function zeichne() {
      rZeit.auffrischen();
      zeichneBuehne();
      zeichneBalken();
      var n = nachher(), E0 = 0.5 * z.m1 * z.v1 * z.v1 + 0.5 * z.m2 * z.v2 * z.v2;
      var Q = E0 - 0.5 * z.m1 * n[0] * n[0] - 0.5 * z.m2 * n[1] * n[1];
      if (!isFinite(stossZeit())) {
        werte.nach.textContent = "kein Stoß";
        werte.q.textContent = "0 J";
        teil.status.textContent = "Gleiter 1 ist nicht schneller als Gleiter 2 – die beiden kommen sich nie nahe. Gib Gleiter 1 mehr Tempo nach rechts.";
        return;
      }
      werte.nach.textContent = zahl(n[0], 2) + " | " + zahl(n[1], 2) + " m/s";
      werte.q.textContent = zahl(Q, 3) + " J (" + zahl(E0 > 0 ? Q / E0 * 100 : 0, 0) + " %)";
      teil.status.textContent = "Der Gesamtimpuls (graue Säule links) ist vor und nach dem Stoß gleich – egal, wie elastisch. " +
        (z.e === 1 ? "Beim elastischen Stoß bleibt auch die Bewegungsenergie vollständig erhalten."
          : z.e === 0 ? "Beim vollständig inelastischen Stoß bleiben die Gleiter aneinander hängen, und der größtmögliche Teil der Energie wird zu Wärme."
            : "Ein Teil der Bewegungsenergie wird beim Stoß zu Wärme und Verformung (graue Säule rechts).");
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 15: BILLARD – elastischer Stoß zweier Kugeln in 2D
     Der Kraftstoß wirkt längs der Verbindungslinie der Mittelpunkte.
     ======================================================================= */
  function billard(fig) {
    var R = 1, START = -7, NACH = 6;                   // Längen in Kugelradien
    var z = { b: 0.5, verh: 1, f: 0.75 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null, "Zwei Billardkugeln stoßen schräg zusammen",
      function (b) { return begrenze(b * 0.5, 230, 330); }, zeichne);

    function stoss() {
      var B = z.b * 2 * R, xc = -Math.sqrt(4 * R * R - B * B);
      var n = [xc / (2 * R), B / (2 * R)];                         // von Kugel 2 zu Kugel 1
      var m1 = 1, m2 = z.verh, vn = n[0];                            // v1 = (1, 0)
      var v1 = [1 - 2 * m2 / (m1 + m2) * vn * n[0], -2 * m2 / (m1 + m2) * vn * n[1]];
      var v2 = [2 * m1 / (m1 + m2) * vn * n[0], 2 * m1 / (m1 + m2) * vn * n[1]];
      return { xc: xc, yc: B, tc: xc - START, v1: v1, v2: v2, n: n };
    }
    function dauer() { return stoss().tc + NACH; }
    function winkel(v) { return Math.atan2(v[1], v[0]) * 180 / Math.PI; }   // Weltkoordinaten: y nach oben

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, st = stoss(), t = z.f * dauer();
      f.leeren();
      var S = Math.min((B - 20) / 15, (H - 20) / 13), ox = 10 + 8 * S, oy = H / 2;
      var X = function (x) { return ox + x * S; }, Y = function (y) { return oy - y * S; };
      s("rect", { "class": "flaeche", x: 4, y: 4, width: B - 8, height: H - 8, rx: 6 }, f.svg);
      var p1, p2;
      if (t <= st.tc) { p1 = [START + t, st.yc]; p2 = [0, 0]; }
      else {
        var dt = t - st.tc;
        p1 = [st.xc + st.v1[0] * dt, st.yc + st.v1[1] * dt];
        p2 = [st.v2[0] * dt, st.v2[1] * dt];
        s("line", { "class": "hilfslinie", x1: X(st.xc), y1: Y(st.yc), x2: X(p1[0]), y2: Y(p1[1]) }, f.svg);
        s("line", { "class": "hilfslinie", x1: X(0), y1: Y(0), x2: X(p2[0]), y2: Y(p2[1]) }, f.svg);
      }
      s("line", { "class": "hilfslinie", x1: X(START), y1: Y(st.yc), x2: X(Math.min(p1[0], st.xc)), y2: Y(st.yc) }, f.svg);
      /* Stoßnormale zum Zeitpunkt der Berührung */
      s("line", { "class": "gitter", x1: X(-st.n[0] * 3), y1: Y(-st.n[1] * 3), x2: X(st.n[0] * 5), y2: Y(st.n[1] * 5) }, f.svg);
      s("circle", { "class": "ball", cx: X(p1[0]), cy: Y(p1[1]), r: R * S }, f.svg);
      s("circle", { "class": "ball blau", cx: X(p2[0]), cy: Y(p2[1]), r: R * S * Math.min(1.6, Math.max(0.7, Math.cbrt(z.verh))) }, f.svg);
      txt(f.svg, X(p1[0]), Y(p1[1]) + 4, "1", "klein auf-ball", "middle");
      txt(f.svg, X(p2[0]), Y(p2[1]) + 4, "2", "klein auf-ball", "middle");
    }

    regler(teil.regler, {
      name: "Versatz (Stoßparameter)", min: 0, max: 0.95, schritt: 0.01, wert: z.b,
      anzeige: function (w) { return w === 0 ? "zentral" : zahl(w * 100, 0) + " % des Durchmessers"; }
    }, function (w) { z.b = w; zeichne(); });
    regler(teil.regler, {
      name: "Massenverhältnis m₂ / m₁", min: 0.25, max: 4, schritt: 0.05, wert: z.verh,
      anzeige: function (w) { return zahl(w, 2); }
    }, function (w) { z.verh = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return Math.round(w * 100) + " %"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Stoßen", faktor: 4, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); rZeit.setze(z.f); zeichne(); },
      ende: dauer
    });

    var werte = werteLeiste(teil.bedienung, [
      ["w1", "Richtung Kugel 1"], ["w2", "Richtung Kugel 2"], ["zw", "Winkel dazwischen"], ["e2", "Energie auf Kugel 2"]
    ]);

    function zeichne() {
      var st = stoss(), w1 = winkel(st.v1), w2 = winkel(st.v2);
      var v1b = Math.hypot(st.v1[0], st.v1[1]), v2b = Math.hypot(st.v2[0], st.v2[1]);
      rZeit.auffrischen();
      zeichneBuehne();
      werte.w1.textContent = v1b < 1e-3 ? "bleibt liegen" : zahl(w1, 0) + "°";
      werte.w2.textContent = zahl(w2, 0) + "°";
      werte.zw.textContent = v1b < 1e-3 ? "–" : zahl(Math.abs(w1 - w2), 0) + "°";
      werte.e2.textContent = zahl(z.verh * v2b * v2b * 100, 0) + " %";
      teil.status.textContent = Math.abs(z.verh - 1) < 1e-9
        ? (z.b === 0 ? "Zentraler Stoß gleicher Massen: Kugel 1 bleibt liegen, Kugel 2 übernimmt die ganze Geschwindigkeit."
                     : "Gleiche Massen, elastischer Stoß: Die Kugeln laufen immer im rechten Winkel auseinander – egal, wie schräg sie sich treffen.")
        : z.verh > 1
          ? "Die gestoßene Kugel ist schwerer: Kugel 1 prallt nach hinten-seitlich ab, der Winkel zwischen den Bahnen ist größer als 90°."
          : "Die gestoßene Kugel ist leichter: Kugel 1 läuft eher geradeaus weiter, der Winkel zwischen den Bahnen ist kleiner als 90°.";
    }
    zeichne();
  }

  I.modell("stosslabor", stosslabor);
  I.modell("billard", billard);
})(window.Interaktiv);
