/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/schwingungen-wellen/ueberlagerung.html
   =========================================================================
   Modelle: zweiwellen.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/ueberlagerung.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, abspieler = I.abspieler,
      geruest = I.geruest, auswahl = I.auswahl, markiere = I.markiere,
      pfeil = I.pfeil;

  /* =======================================================================
     MODELL: ZWEI WELLEN  (schwingungen-wellen/ueberlagerung)
     Einheiten: Wellenlänge λ und Periode T der Welle 1 sind 1, also
     k1 = ω1 = 2π. Gezeigt wird oben ξ1 = cos(ωt − kz) und ξ2, unten ξ1 + ξ2
     (Kosinus, damit die stehende Welle bei t = 0 voll ausgelenkt ist).
       0 in Phase:        ξ2 = cos(ωt − kz)
       1 gegenphasig:     ξ2 = cos(ωt − kz + π)
       2 gegenläufig:     ξ2 = cos(ωt + kz)  → Summe 2 cos(kz) cos(ωt),
                          Knoten bei z = 1/4 + n/2
       3 Wellengruppe:    k2 = 1,2 k1, ω2 = √1,2 ω1 (Tiefwasser, ω ∝ √k)
                          → v_ph(Träger) = ω̄/k̄ = 0,952, v_gr = Δω/Δk = 0,477
     Punkt: ein Wellenkamm des Trägers (wandert mit ω̄/k̄),
     Dreieck: Mitte einer Gruppe (wandert mit Δω/Δk).
     ======================================================================= */
  function zweiwellen(fig) {
    var ZPI = 2 * Math.PI;
    var K2 = 1.2, W2 = Math.sqrt(1.2);
    var KM = (1 + K2) / 2, WM = (1 + W2) / 2;          // Mittelwerte (in 2π-Einheiten)
    var DK = K2 - 1, DW = W2 - 1;
    var VPH = WM / KM, VGR = DW / DK;
    var FAELLE = ["in Phase", "gegenphasig", "gegenläufig", "verschiedene Wellenlängen"];
    var XMIN = [0, 0, 0, -1.5], XMAX = [3, 3, 3, 6.5], TENDE = [4, 4, 4, 8], TEMPO = [0.8, 0.8, 0.8, 1.6];
    var z = { fall: 2, t: 0 };
    var teil = geruest(fig);
    var w = null;

    function w1(x, t) { return Math.cos(ZPI * (t - x)); }
    function w2(x, t) {
      switch (z.fall) {
        case 0: return Math.cos(ZPI * (t - x));
        case 1: return Math.cos(ZPI * (t - x) + Math.PI);
        case 2: return Math.cos(ZPI * (t + x));
        default: return Math.cos(ZPI * (W2 * t - K2 * x));
      }
    }

    var flaeche = zeichenflaeche(teil.buehne, null,
      "Oben zwei einzelne Wellen, unten ihre Summe, abhängig vom gewählten Fall und von der Zeit",
      function (b) { var m = mass(b); return m.H; }, aufbau);

    function mass(b) {
      var a = Math.round(begrenze(b * 0.045, 15, 24));
      var y1 = 30 + a, y2 = y1 + a + 34 + 2 * a;
      return { a: a, y1: y1, y2: y2, H: y2 + 2 * a + 14 };
    }

    function aufbau() { w = mass(flaeche.b); zeichne(); }

    var knoepfe = auswahl(teil.bedienung, "Fall", "Wie die zweite Welle zur ersten steht",
      FAELLE, function (i) {
        z.fall = i; z.t = 0;
        ab.stopp();
        rz.input.max = TENDE[i];
        rz.setze(0);
        spiel.faktor = TEMPO[i];
        zeichne();
      });
    var rz = regler(teil.regler, {
      name: "Zeit t / T", min: 0, max: TENDE[z.fall], schritt: 0.01, wert: 0,
      anzeige: function (v) { return zahl(v, 2); }
    }, function (v) { ab.stopp(); z.t = v; zeichne(); });
    var los = knopf(teil.knoepfe, "▶ Abspielen", "haupt", function () {});
    var spiel = {
      knopf: los, text: "▶ Abspielen", faktor: TEMPO[z.fall],
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rz.setze(t); zeichne(); },
      ende: function () { return TENDE[z.fall]; }
    };
    var ab = abspieler(spiel);

    function kurve(g, fn, X, yc, a, klasse, n, stil) {
      var pts = [], i, x, x0 = XMIN[z.fall], x1 = XMAX[z.fall];
      for (i = 0; i <= n; i++) { x = x0 + i / n * (x1 - x0); pts.push([X(x), yc - a * fn(x)]); }
      var p = s("polyline", { "class": klasse, points: linienzug(pts) }, g);
      if (stil) p.setAttribute("style", stil);
      return p;
    }

    function zeichne() {
      if (!w) return;
      var f = flaeche, B = f.b, a = w.a, y1 = w.y1, y2 = w.y2, t = z.t, fall = z.fall;
      var l = 12, r = 12, x0 = XMIN[fall], zm = XMAX[fall];
      var X = function (x) { return l + (x - x0) / (zm - x0) * (B - l - r); };
      var n = Math.round(begrenze(B * 1.2, 300, 900));
      markiere(knoepfe, fall);
      f.leeren();
      var g = s("g", null, f.svg);

      /* ---------- oben: Einzelwellen ---------- */
      txt(g, l, 16, "Welle 1 und Welle 2", "ia-titel");
      var px = B - r - 78;
      pfeil(g, px, 12, px + 28, 12, "blau duenn");
      if (fall === 2) pfeil(g, px + 76, 12, px + 48, 12, "kupfer duenn");
      else pfeil(g, px + 48, 12, px + 76, 12, "kupfer duenn");
      s("line", { "class": "hilfslinie", x1: l, y1: y1, x2: B - r, y2: y1 }, g);
      kurve(g, function (x) { return w1(x, t); }, X, y1, a, "kurve blau duenn", n);
      kurve(g, function (x) { return w2(x, t); }, X, y1, a, "kurve kupfer duenn", n,
        "stroke-dasharray:5 4");

      /* ---------- unten: Summe ---------- */
      txt(g, l, y1 + a + 26, "Summe", "ia-titel");
      s("line", { "class": "hilfslinie", x1: l, y1: y2, x2: B - r, y2: y2 }, g);
      if (fall === 2) {
        kurve(g, function (x) { return 2 * Math.abs(Math.cos(ZPI * x)); }, X, y2, a, "hilfslinie", n);
        kurve(g, function (x) { return -2 * Math.abs(Math.cos(ZPI * x)); }, X, y2, a, "hilfslinie", n);
      }
      if (fall === 3) {
        var huelle = function (x) { return 2 * Math.abs(Math.cos(Math.PI * (DW * t - DK * x))); };
        kurve(g, huelle, X, y2, a, "hilfslinie", n);
        kurve(g, function (x) { return -huelle(x); }, X, y2, a, "hilfslinie", n);
      }
      kurve(g, function (x) { return w1(x, t) + w2(x, t); }, X, y2, a, "kurve", n);

      var satz;
      if (fall === 2) {
        for (var j = 0; j < 2 * zm; j++) {
          var xk = 0.25 + j / 2;
          if (xk > zm) break;
          s("circle", { "class": "punkt kupfer", cx: X(xk), cy: y2, r: 4 }, g);
        }
        txt(g, X(0.25), y2 + 2 * a + 10, "Knoten", "klein kupfer halo", "middle");
      }
      if (fall === 3) {
        /* Mitte einer Gruppe: Δω t − Δk z = 0 (Hülle maximal), Start bei z = 0 */
        var zg = VGR * t;
        var xg = X(zg), yg = y2 - 2 * a - 6;
        s("polygon", { "class": "punkt kupfer", points: (xg - 6) + "," + (yg - 8) + " " + (xg + 6) + "," + (yg - 8) + " " + xg + "," + yg }, g);
        /* ein Kamm des Trägers: 2π(ω̄t − k̄z) = 2π·m; m = 1 → Start bei
           z = −0,91, also hinter der Gruppenmitte */
        var zc = (WM * t - 1) / KM;
        if (zc <= zm) {
          var yc = y2 - a * (w1(zc, t) + w2(zc, t));
          s("circle", { "class": "punkt", cx: X(zc), cy: yc, r: 4.5 }, g);
        }
        satz = "Welle 2 hat eine um ein Sechstel kürzere Wellenlänge (Wellenzahl 1,2-mal so groß) und, wie bei Wasserwellen, eine nur 9,5 % höhere Frequenz. Die Summe zerfällt in Wellengruppen (gestrichelte Hülle). Die Gruppenmitte (Dreieck) wandert mit " +
          zahl(VGR, 2) + " λ/T, der Wellenkamm (Punkt) mit " + zahl(VPH, 2) +
          " λ/T, also etwa doppelt so schnell. Die Kämme tauchen hinten in einer Gruppe auf und verschwinden vorne.";
      } else if (fall === 0) {
        satz = "Beide Wellen laufen nach rechts, Berg auf Berg (die orange Welle liegt genau auf der blauen). Die Summe ist eine laufende Welle mit doppelter Amplitude und vierfacher Intensität: konstruktive Interferenz.";
      } else if (fall === 1) {
        satz = "Welle 2 ist um eine halbe Wellenlänge verschoben, auf jeden Berg trifft ein Tal. Die Summe ist zu jeder Zeit überall null: destruktive Interferenz.";
      } else {
        satz = "Die Wellen laufen gegeneinander. Die Summe läuft nicht mehr: An den Knoten ruht das Seil immer, dazwischen schwingt es auf und ab, in den Bäuchen mit doppelter Amplitude (gestrichelt). Zwei Knoten liegen λ/2 auseinander.";
      }
      teil.status.textContent = "t = " + zahl(t, 2) + " T. " + satz;
    }

    aufbau();
  }

  I.modell("zweiwellen", zweiwellen);
})(window.Interaktiv);
