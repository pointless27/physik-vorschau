/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/bewegung-1d.html
   =========================================================================
   Modelle: bewegungslabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/bewegung-1d.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      schoenerSchritt = I.schoenerSchritt, txt = I.txt, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      zeitDiagramm = I.zeitDiagramm, geruest = I.geruest;

  /* =======================================================================
     MODELL 1: BEWEGUNGS-LABOR (eine Dimension)
     s(t) = v0·t + ½·a·t²,  v(t) = v0 + a·t,  a konstant
     ======================================================================= */
  function bewegungslabor(fig) {
    var TMAX = 10;                                     // Zeitspanne in s
    var z = { v0: 4, a: 1.5, t: 4 };
    var teil = geruest(fig);

    function ort(t) { return z.v0 * t + 0.5 * z.a * t * t; }
    function geschw(t) { return z.v0 + z.a * t; }

    var strasse = zeichenflaeche(teil.buehne, "ia-strasse",
      "Ein Auto auf einer geraden Straße mit Pfeilen für Geschwindigkeit und Beschleunigung",
      function (b) { return begrenze(b * 0.16, 112, 124); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var hoehe = function (b) { return begrenze(b * 0.7, 140, 175); };
    var dS = zeichenflaeche(reihe, null, "Ort-Zeit-Diagramm", hoehe, zeichne);
    var dV = zeichenflaeche(reihe, null, "Geschwindigkeit-Zeit-Diagramm", hoehe, zeichne);
    var dA = zeichenflaeche(reihe, null, "Beschleunigung-Zeit-Diagramm", hoehe, zeichne);

    /* --- Straße mit Auto --- */
    function zeichneStrasse() {
      var f = strasse, B = f.b, H = f.h;
      f.leeren();
      var lo = 0, hi = 0;
      for (var i = 0; i <= 100; i++) {
        var w = ort(i / 100 * TMAX);
        lo = Math.min(lo, w); hi = Math.max(hi, w);
      }
      var rand = Math.max((hi - lo) * 0.06, 2);
      lo -= rand; hi += rand;
      if (hi - lo < 20) { var m = (hi + lo) / 2; lo = m - 10; hi = m + 10; }
      var l = 28, r = 28;
      var X = function (sw) { return l + (sw - lo) / (hi - lo) * (B - l - r); };
      var yS = H - 34;

      s("line", { "class": "achse", x1: 8, y1: yS, x2: B - 8, y2: yS }, f.svg);
      var schritt = schoenerSchritt(hi - lo, B < 480 ? 4 : 7);
      for (var k = Math.ceil(lo / schritt) * schritt; k <= hi; k += schritt) {
        s("line", { "class": "achse", x1: X(k), y1: yS, x2: X(k), y2: yS + 5 }, f.svg);
        txt(f.svg, X(k), yS + 19, zahl(k, 0) + " m", "klein", "middle");
      }
      txt(f.svg, X(0), yS + 31, "Start", "klein", "middle");

      /* Stroboskop: wo war das Auto nach 0, 1, 2 … Sekunden? */
      for (var n = 0; n <= Math.floor(z.t + 1e-9); n++) {
        s("circle", { "class": "strobo", cx: X(ort(n)), cy: yS, r: 3.2 }, f.svg);
      }

      /* Auto (zeigt in Fahrtrichtung) */
      var x0 = X(ort(z.t)), v = geschw(z.t);
      var auto = s("g", {
        transform: "translate(" + x0.toFixed(1) + " " + yS + ")" + (v < -1e-9 ? " scale(-1 1)" : "")
      }, f.svg);
      s("rect", { "class": "wagen", x: -20, y: -18, width: 40, height: 11, rx: 3 }, auto);
      s("path", { "class": "wagen", d: "M-11 -18L-7 -27H6L11 -18Z" }, auto);
      s("circle", { "class": "rad", cx: -11, cy: -5, r: 4.6 }, auto);
      s("circle", { "class": "rad", cx: 11, cy: -5, r: 4.6 }, auto);

      /* Pfeile: Geschwindigkeit (blau) und Beschleunigung (kupfer) */
      var kv = begrenze((B - 60) / 45, 3, 8);
      var yv = yS - 40, ya = yS - 58;
      if (pfeil(f.svg, x0, yv, x0 + v * kv, yv, "blau")) {
        txt(f.svg, x0 + v * kv + (v > 0 ? 6 : -6), yv + 4, "v", "blau", v > 0 ? "start" : "end");
      }
      if (pfeil(f.svg, x0, ya, x0 + z.a * kv * 4, ya, "kupfer")) {
        txt(f.svg, x0 + z.a * kv * 4 + (z.a > 0 ? 6 : -6), ya + 4, "a", "kupfer", z.a > 0 ? "start" : "end");
      }
    }


    /* --- Regler, Knöpfe, Werte --- */
    var rV0 = regler(teil.regler, {
      name: "Startgeschwindigkeit v₀", min: -10, max: 15, schritt: 0.5, wert: z.v0,
      anzeige: function (w) { return zahl(w, 1) + " m/s"; }
    }, function (w) { z.v0 = w; zeichne(); });
    var rA = regler(teil.regler, {
      name: "Beschleunigung a", min: -3, max: 3, schritt: 0.1, wert: z.a,
      anzeige: function (w) { return zahl(w, 1) + " m/s²"; }
    }, function (w) { z.a = w; zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit t", min: 0, max: TMAX, schritt: 0.05, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });

    var spielKnopf = knopf(teil.knoepfe, "", "haupt", function () {});
    var spieler = abspieler({
      knopf: spielKnopf, text: "▶ Abspielen", faktor: 1,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });
    [
      ["Anfahren", 0, 2],
      ["Gleichmäßig fahren", 8, 0],
      ["Bremsen", 14, -2]
    ].forEach(function (v) {
      knopf(teil.knoepfe, v[0], null, function () {
        z.v0 = v[1]; z.a = v[2];
        rV0.setze(z.v0); rA.setze(z.a);
        zeichne();
      });
    });

    var werte = werteLeiste(teil.bedienung, [
      ["s", "Ort s"], ["v", "Geschwindigkeit v"], ["a", "Beschleunigung a"]
    ]);

    function zustandSatz() {
      var v = geschw(z.t), a = z.a, eps = 0.05;
      var richtung = v > 0 ? "vorwärts" : "rückwärts";
      if (Math.abs(v) < eps && Math.abs(a) < eps) return "Das Auto steht still.";
      if (Math.abs(v) < eps) return "Genau jetzt steht das Auto für einen Augenblick still – " +
        "die Beschleunigung setzt es aber sofort wieder in Bewegung.";
      if (Math.abs(a) < eps) return "Das Auto fährt gleichmäßig " + richtung +
        ": Beschleunigung null, die Geschwindigkeit bleibt konstant.";
      if (v * a > 0) return "Das Auto fährt " + richtung + " und wird schneller – " +
        "Geschwindigkeit und Beschleunigung zeigen in dieselbe Richtung.";
      return "Das Auto fährt " + richtung + " und wird langsamer – " +
        "die Beschleunigung zeigt gegen die Fahrtrichtung, es bremst.";
    }

    function zeichne() {
      zeichneStrasse();
      zeitDiagramm(dS, ort, "Ort s in m", TMAX, z.t, { tangente: geschw });
      zeitDiagramm(dV, geschw, "Geschwindigkeit v in m/s", TMAX, z.t, { flaeche: true });
      zeitDiagramm(dA, function () { return z.a; }, "Beschleunigung a in m/s²", TMAX, z.t, {});
      var v = geschw(z.t);
      werte.s.textContent = zahl(ort(z.t), 1) + " m";
      werte.v.textContent = zahl(v, 1) + " m/s (" + zahl(v * 3.6, 0) + " km/h)";
      werte.a.textContent = zahl(z.a, 1) + " m/s²";
      teil.status.textContent = zustandSatz();
    }
    zeichne();
  }

  I.modell("bewegungslabor", bewegungslabor);
})(window.Interaktiv);
