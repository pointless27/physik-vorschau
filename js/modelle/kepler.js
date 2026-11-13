/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/kepler.html
   =========================================================================
   Modelle: keplerbahn.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/kepler.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 21: KEPLERBAHN – Planet auf einer Ellipse, Sonne im Brennpunkt.
     Ort aus der Kepler-Gleichung M = E − ε sin E (M = 2π t/T),
     Tempo aus der Vis-viva-Gleichung v = v_E · √(2/r − 1/a)  (r, a in AE),
     T = a^1,5 Jahre. 12 Sektoren gleicher Zeit zeigen den Flächensatz.
     ======================================================================= */
  function keplerbahn(fig) {
    var V_ERDE = 29.78;                                 // km/s bei 1 AE
    var z = { e: 0.5, a: 1.5, f: 0 };                   // f = Bruchteil des Umlaufs
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ellipsenbahn eines Planeten mit der Sonne im Brennpunkt und zwölf Flächenstücken, die in gleichen Zeiten überstrichen werden",
      function (b) { return begrenze(b * 0.55, 240, 330); }, zeichne);

    function exzentrisch(M) {
      var E = M;
      for (var i = 0; i < 30; i++) E -= (E - z.e * Math.sin(E) - M) / (1 - z.e * Math.cos(E));
      return E;
    }
    function ort(f) {                                   // in Einheiten von a, Sonne im Ursprung
      var E = exzentrisch(2 * Math.PI * f), b = Math.sqrt(1 - z.e * z.e);
      return [Math.cos(E) - z.e, b * Math.sin(E)];
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, bb = Math.sqrt(1 - z.e * z.e);
      f.leeren();
      var S = Math.min((B - 40) / 2, (H - 30) / (2 * bb));
      var mx = B / 2, my = H / 2;
      var sx = mx + z.e * S;                             // Sonne im rechten Brennpunkt
      function P(p) { return [sx + p[0] * S, my - p[1] * S]; }
      for (var k = 0; k < 12; k++) {
        var pkt = [[sx, my]];
        for (var i = 0; i <= 16; i++) pkt.push(P(ort((k + i / 16) / 12)));
        var attr = { points: linienzug(pkt), stroke: "currentColor", "stroke-opacity": 0.18 };
        if (k % 2) attr["class"] = "flaeche"; else attr.fill = "none";
        s("polygon", attr, f.svg);
      }
      s("ellipse", { "class": "kurve", cx: mx, cy: my, rx: S, ry: bb * S }, f.svg);
      s("circle", { "class": "punkt kupfer", cx: sx, cy: my, r: 8 }, f.svg);
      var p = ort(z.f), q = P(p), r = Math.sqrt(p[0] * p[0] + p[1] * p[1]);
      s("line", { "class": "achse", x1: sx, y1: my, x2: q[0], y2: q[1] }, f.svg);
      /* Geschwindigkeitspfeil tangential, Länge ∝ Tempo */
      var E = exzentrisch(2 * Math.PI * z.f), tx = -Math.sin(E), ty = bb * Math.cos(E);
      var tl = Math.sqrt(tx * tx + ty * ty), v = Math.sqrt(2 / r - 1);   // in Einheiten √(GM/a)
      var lp = 0.22 * S * v;
      pfeil(f.svg, q[0], q[1], q[0] + tx / tl * lp, q[1] - ty / tl * lp, "blau");
      s("circle", { "class": "ball blau", cx: q[0], cy: q[1], r: 7 }, f.svg);
      txt(f.svg, P([1 - z.e, 0])[0] + 6, my + 16, "Perihel", "klein");
      txt(f.svg, P([-1 - z.e, 0])[0] - 6, my + 16, "Aphel", "klein", "end");
    }

    regler(teil.regler, {
      name: "Exzentrizität ε", min: 0, max: 0.9, schritt: 0.05, wert: z.e,
      anzeige: function (w) { return zahl(w, 2); }
    }, function (w) { z.e = w; zeichne(); });
    regler(teil.regler, {
      name: "Große Halbachse a", min: 0.4, max: 30, schritt: 0.1, wert: z.a,
      anzeige: function (w) { return zahl(w, 1) + " AE"; }
    }, function (w) { z.a = w; zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return zahl(w * 12, 1) + " von 12 Zwölfteln"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Umlauf abspielen", faktor: 1 / 8,
      hole: function () { return z.f; },
      setze: function (t) { z.f = t; rT.setze(t); zeichne(); },
      ende: function () { return 1; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["t", "Umlaufzeit"], ["r", "Abstand zur Sonne"], ["v", "Tempo"], ["pa", "Perihel- : Aphel-Tempo"]
    ]);

    function zeichne() {
      var p = ort(z.f), r = Math.sqrt(p[0] * p[0] + p[1] * p[1]);   // in Einheiten von a
      var v = V_ERDE * Math.sqrt((2 / r - 1) / z.a);
      zeichneBuehne();
      werte.t.textContent = zahl(Math.pow(z.a, 1.5), z.a < 3 ? 2 : 1) + " Jahre";
      werte.r.textContent = zahl(r * z.a, 2) + " AE";
      werte.v.textContent = zahl(v, 1) + " km/s";
      werte.pa.textContent = zahl((1 + z.e) / (1 - z.e), 1) + " : 1";
      teil.status.textContent = z.e === 0
        ? "Eine Kreisbahn: Der Planet läuft gleichmäßig, alle zwölf Flächenstücke sind gleich geformt."
        : "Im Perihel ist der Planet " + zahl((1 + z.e) / (1 - z.e), 1) +
          "-mal so schnell wie im Aphel – genau im umgekehrten Verhältnis der Abstände. Darum sind die Flächenstücke nahe der Sonne kurz und breit, weit draußen lang und schmal, aber alle gleich groß.";
    }
    zeichne();
  }

  I.modell("keplerbahn", keplerbahn);
})(window.Interaktiv);
