/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/schwingungen-wellen/schall.html
   =========================================================================
   Modelle: machkegel.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/schall.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      abspieler = I.abspieler, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere, pfeil = I.pfeil;

  /* =======================================================================
     MODELL: MACHKEGEL  (schwingungen-wellen/schall)
     Einheiten: Schallgeschwindigkeit c = 1, Periode T = 1, also λ = 1.
     Die Quelle fährt mit v = Ma · c nach rechts und sendet zu den Zeiten
     n = 0, 1, 2, … je einen Wellenberg aus. Der Berg n ist zur Zeit t ein
     Kreis um den damaligen Ort der Quelle mit Radius t − n.
     Gehörte Frequenz (Quelle bewegt, Beobachter ruht):
       vorne  f'/f = 1/(1 − Ma)   (nur für Ma < 1)
       hinten f'/f = 1/(1 + Ma)
     Machkegel für Ma > 1: halber Öffnungswinkel θ mit sin θ = 1/Ma.
     ======================================================================= */
  function machkegel(fig) {
    var MACH = [0, 0.5, 1, 1.5];
    var FAELLE = ["steht", "Ma 0,5", "Ma 1", "Ma 1,5"];
    var TENDE = 12;
    var BREITE = 22;                   // sichtbare Breite in Wellenlängen
    var z = { fall: 1, t: TENDE };
    var teil = geruest(fig);

    var flaeche = zeichenflaeche(teil.buehne, null,
      "Wellenberge einer bewegten Schallquelle als Kreise, abhängig von ihrem Tempo und von der Zeit",
      function (b) { return Math.round(begrenze(b * 0.5, 190, 300)); }, zeichne);

    var knoepfe = auswahl(teil.bedienung, "Tempo", "Tempo der Quelle als Machzahl",
      FAELLE, function (i) {
        z.fall = i;
        ab.stopp();
        z.t = TENDE;
        rz.setze(TENDE);
        zeichne();
      });
    var rz = regler(teil.regler, {
      name: "Zeit t / T", min: 0, max: TENDE, schritt: 0.05, wert: TENDE,
      anzeige: function (v) { return zahl(v, 1); }
    }, function (v) { ab.stopp(); z.t = v; zeichne(); });
    var los = knopf(teil.knoepfe, "▶ Abspielen", "haupt", function () {});
    var ab = abspieler({
      knopf: los, text: "▶ Abspielen", faktor: 2.4,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rz.setze(t); zeichne(); },
      ende: function () { return TENDE; }
    });

    function zeichne() {
      var f = flaeche, B = f.b, H = f.h;
      if (!B) return;
      var ma = MACH[z.fall], t = z.t;
      var u = B / BREITE;                                    // Pixel je Wellenlänge
      var xEnde = ma === 0 ? 0.5 * B : 0.66 * B;             // Ort der Quelle bei t = TENDE
      var yc = H / 2 + 8;
      var xQ = function (zeit) { return xEnde - ma * (TENDE - zeit) * u; };
      markiere(knoepfe, z.fall);
      f.leeren();
      var g = s("g", null, f.svg);

      s("line", { "class": "hilfslinie", x1: 0, y1: yc, x2: B, y2: yc }, g);

      /* Wellenberge */
      for (var n = 0; n <= Math.floor(t); n++) {
        var r = (t - n) * u;
        if (r < 0.5) continue;
        s("circle", { "class": "kurve blau duenn", cx: xQ(n).toFixed(1), cy: yc, r: r.toFixed(1) }, g);
      }

      /* Machkegel bzw. Schallmauer */
      var xq = xQ(t);
      if (ma > 1 && t > 0) {
        var th = Math.asin(1 / ma);
        var lang = t * Math.sqrt(ma * ma - 1) * u;          // bis zum Berührpunkt des ältesten Bergs
        [-1, 1].forEach(function (sg) {
          s("line", { "class": "kurve kupfer", x1: xq.toFixed(1), y1: yc,
            x2: (xq - lang * Math.cos(th)).toFixed(1), y2: (yc + sg * lang * Math.sin(th)).toFixed(1) }, g);
        });
      }
      if (ma === 1) {
        s("line", { "class": "kurve kupfer duenn", x1: xq, y1: yc - 0.42 * H, x2: xq, y2: yc + 0.42 * H }, g);
      }

      /* Quelle mit Geschwindigkeitspfeil */
      s("circle", { "class": "punkt kupfer", cx: xq.toFixed(1), cy: yc, r: 5 }, g);
      if (ma > 0) pfeil(g, xq + 8, yc, xq + 8 + 1.6 * ma * u, yc, "kupfer duenn");

      /* gehörte Frequenzen links und rechts oben */
      var hinten = "hinten: " + zahl(1 / (1 + ma), 2) + " f";
      var vorne = ma < 1 ? "vorne: " + zahl(1 / (1 - ma), 2) + " f" : (ma === 1 ? "vorne: alles gleichzeitig" : "vorne: noch still");
      txt(g, 8, 16, hinten, "klein halo");
      txt(g, B - 8, 16, vorne, "klein halo", "end");

      var satz;
      if (ma === 0) {
        satz = "Die Quelle steht. Die Wellenberge sind Kreise mit gleichem Abstand λ, vorne und hinten hört man dieselbe Frequenz f.";
      } else if (ma < 1) {
        satz = "Die Quelle fährt mit der halben Schallgeschwindigkeit. Vorne liegen die Berge im Abstand λ/2, ein ruhender Beobachter hört die doppelte Frequenz. Hinten ist der Abstand 1,5 λ, die Frequenz sinkt auf zwei Drittel.";
      } else if (ma === 1) {
        satz = "Die Quelle ist so schnell wie ihr eigener Schall. Alle Berge berühren sich in der Quelle und stauen sich zu einer Druckfront (orange Linie), der Schallmauer. Vor der Quelle kommt nichts an, bevor sie selbst da ist.";
      } else {
        satz = "Die Quelle ist 1,5-mal so schnell wie der Schall und überholt ihre Wellenberge. Diese berühren zwei Geraden (orange), im Raum einen Kegel mit sin θ = 1/Ma, also θ = " +
          zahl(Math.asin(1 / ma) * 180 / Math.PI, 1) + "°. Wo der Kegel vorbeistreicht, hört man den Überschallknall; davor ist es still.";
      }
      teil.status.textContent = "t = " + zahl(t, 1) + " T. " + satz;
    }

    zeichne();
  }

  I.modell("machkegel", machkegel);
})(window.Interaktiv);
