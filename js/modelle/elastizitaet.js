/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/elastizitaet.html
   =========================================================================
   Modelle: zugstab, querkontraktion.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/elastizitaet.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, regler = I.regler,
      werteLeiste = I.werteLeiste, geruest = I.geruest, laenge = I.laenge,
      tausender = I.tausender, auswahl = I.auswahl, markiere = I.markiere;

  /* =======================================================================
     MODELL: ZUGSTAB – Hookesches Gesetz und Querkontraktion  (elastizitaet)
     Stab L = 1 m, Ø 20 mm, unten hängt die Masse m:
       σ = m·g / A,  ε = σ / E,  ΔL = ε·L,  ΔD = −ν·ε·D
     Die Verformung wird im Bild um eine Zehnerpotenz vergrößert, damit man
     sie sieht (Hinweis im Bild).
     ======================================================================= */
  function zugstab(fig) {
    var L0 = 1, D0 = 0.02, A0 = Math.PI * D0 * D0 / 4, MMAX = 100;
    var STOFFE = [
      { name: "Gummi", E: 7e6, nu: 0.5 },
      { name: "Plexiglas", E: 3e9, nu: 0.4 },
      { name: "Beton", E: 30e9, nu: 0.2 },
      { name: "Glas", E: 70e9, nu: 0.22 },
      { name: "Stahl", E: 210e9, nu: 0.3 },
      { name: "Diamant", E: 1.2e12, nu: 0.1 }        // PRÜFEN: ν von Diamant je nach Quelle 0,07–0,2
    ];
    var z = { stoff: 4, m: 50 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ein Stab hängt an der Decke, unten zieht ein Gewicht; daneben die Verlängerung aller Werkstoffe im Vergleich",
      function (b) { return begrenze(b * 0.5, 250, 320); }, zeichne);

    function dehnung(st) { return z.m * G / (A0 * st.E); }
    function vergroesserung(st) {                     // so stark, dass die Dehnung bei 100 kg sichtbar wird
      var e100 = MMAX * G / (A0 * st.E);
      return Math.max(1, Math.pow(10, Math.floor(Math.log(0.35 / e100) / Math.LN10)));
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, st = STOFFE[z.stoff];
      f.leeren();
      var eps = dehnung(st), M = vergroesserung(st);
      /* schmal = Handy: Stab weiter links, Vergleichsspalten enger */
      var schmal = B < 440;
      var cx = schmal ? 58 : begrenze(B * 0.2, 70, 140), oben = 24, Dd = 24;
      var Ld = (H - oben - 62) / 1.48;
      var lJ = Ld * (1 + M * eps), dJ = Math.max(3, Dd * (1 - st.nu * M * eps));

      /* Decke */
      s("line", { "class": "achse", x1: cx - 50, y1: oben, x2: cx + 50, y2: oben }, f.svg);
      for (var k = 0; k <= 10; k++) {
        s("line", { "class": "achse", x1: cx - 50 + k * 10, y1: oben, x2: cx - 56 + k * 10, y2: oben - 7 }, f.svg);
      }
      /* Stab: unverformt gestrichelt, verformt gefüllt */
      s("rect", { "class": "turm", x: cx - dJ / 2, y: oben, width: dJ, height: lJ }, f.svg);
      s("rect", { "class": "hilfslinie", x: cx - Dd / 2, y: oben, width: Dd, height: Ld }, f.svg);
      /* Gewicht mit Kraftpfeil */
      var yE = oben + lJ;
      if (z.m > 0) {
        var gb = 30 + 18 * Math.sqrt(z.m / MMAX), gh = 18 + 12 * Math.sqrt(z.m / MMAX);
        s("line", { "class": "kurve duenn", x1: cx, y1: yE, x2: cx, y2: yE + 5 }, f.svg);
        s("rect", { "class": "wagen", x: cx - gb / 2, y: yE + 5, width: gb, height: gh, rx: 3 }, f.svg);
        txt(f.svg, cx, yE + 5 + gh / 2 + 4, zahl(z.m, 0) + " kg", "klein", "middle");
        pfeil(f.svg, cx + gb / 2 + 10, yE + 8, cx + gb / 2 + 10, yE + 8 + 10 + 26 * z.m / MMAX, "kupfer");
      }
      /* Maß ΔL rechts neben dem Stab */
      if (lJ - Ld > 4) {
        var mx = cx + Dd / 2 + 12;
        s("line", { "class": "achse", x1: mx - 4, y1: oben + Ld, x2: mx + 4, y2: oben + Ld }, f.svg);
        s("line", { "class": "achse", x1: mx - 4, y1: yE, x2: mx + 4, y2: yE }, f.svg);
        s("line", { "class": "achse", x1: mx, y1: oben + Ld, x2: mx, y2: yE }, f.svg);
        txt(f.svg, mx + 6, (oben + Ld + yE) / 2 + 4, "ΔL", "blau klein");
      }
      /* Hinweis unter dem Stab; auf schmalen Bühnen (Handy) so weit nach
         rechts schieben, dass er links nicht abgeschnitten wird (~5,7 px
         pro Zeichen; rechts ist bis zur Balkenbeschriftung bei xB Platz) */
      var hinweis = M === 1 ? (schmal ? "echter Maßstab" : "Verformung in echtem Maßstab")
                            : (schmal ? "" : "Verformung ") + tausender(M) + "-fach vergrößert";
      txt(f.svg, Math.max(cx, 4 + hinweis.length * 5.7 / 2), H - 6, hinweis, "klein", "middle");

      /* Vergleich: Verlängerung aller Werkstoffe (logarithmische Balken 1 nm … 1 m) */
      var xL = cx + (schmal ? 62 : 90), xB = xL + (schmal ? 56 : 66), xR = B - 12;
      var wB = Math.max(30, xR - xB - (schmal ? 52 : 62));
      txt(f.svg, xL, 18, "Verlängerung bei " + zahl(z.m, 0) + " kg", "ia-titel");
      STOFFE.forEach(function (st2, i) {
        var y = 44 + i * ((H - 72) / (STOFFE.length - 1)), dL = dehnung(st2) * L0;
        var aktiv = i === z.stoff;
        txt(f.svg, xL, y + 4, st2.name, aktiv ? "blau klein" : "klein");
        s("line", { "class": "gitter", x1: xB, y1: y, x2: xB + wB, y2: y }, f.svg);
        if (dL > 0) {
          var anteil = begrenze((Math.log(dL) / Math.LN10 + 9) / 9, 0.02, 1);
          s("rect", { "class": aktiv ? "balken" : "balken grau", x: xB, y: y - 5, width: anteil * wB, height: 10 }, f.svg);
        }
        txt(f.svg, xR, y + 4, laenge(dL), aktiv ? "blau klein" : "klein", "end");
      });
      txt(f.svg, xB, H - 6, "1 nm", "klein");
      txt(f.svg, xB + wB, H - 6, "1 m", "klein", "end");
    }

    var knoepfe = auswahl(teil.bedienung, null, "Werkstoff wählen", STOFFE.map(function (st) { return st.name; }),
      function (i) { z.stoff = i; zeichne(); });
    regler(teil.regler, {
      name: "Angehängte Masse", min: 0, max: MMAX, schritt: 1, wert: z.m,
      anzeige: function (w) { return zahl(w, 0) + " kg"; }
    }, function (w) { z.m = w; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["sigma", "Spannung σ"], ["eps", "Dehnung ε"], ["dl", "Verlängerung ΔL"], ["dd", "Dünner um"]
    ]);

    function zeichne() {
      var st = STOFFE[z.stoff], eps = dehnung(st), sigma = z.m * G / A0;
      markiere(knoepfe, z.stoff);
      zeichneBuehne();
      werte.sigma.textContent = zahl(sigma / 1e6, 2) + " MPa";
      werte.eps.textContent = eps >= 1e-3 ? zahl(eps * 100, eps >= 0.01 ? 1 : 2) + " %"
                                          : zahl(eps * 1e6, 1) + " · 10⁻⁶";
      werte.dl.textContent = laenge(eps * L0);
      werte.dd.textContent = laenge(st.nu * eps * D0);
      var satz;
      if (z.m === 0) {
        satz = "Häng ein Gewicht an den Stab – und vergleiche dann die Werkstoffe.";
      } else {
        satz = "Der Stab aus " + st.name + " (1 m lang, 2 cm dick) wird um " + laenge(eps * L0) +
          " länger und dabei um " + laenge(st.nu * eps * D0) + " dünner.";
        if (z.stoff === 0 && eps > 0.1) {
          satz += " Bei so großer Dehnung gilt das Hookesche Gesetz für Gummi nur noch grob.";
        } else if (z.stoff !== 0) {
          satz += " Ein gleich dicker Gummistab würde sich " + tausender(st.E / STOFFE[0].E) + "-mal so stark dehnen.";
        }
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  /* =======================================================================
     MODELL: QUERKONTRAKTION – Länge, Dicke, Volumen          (elastizitaet)
     Länge (1 + ε), Dicke (1 − ν·ε) in beiden Querrichtungen; Volumen exakt
     (1 + ε)(1 − ν·ε)² − 1, für kleine ε ≈ ε·(1 − 2ν)
     ======================================================================= */
  function querkontraktion(fig) {
    var VORGABEN = [["Kork", 0], ["Stahl", 0.3], ["Gummi", 0.5], ["Auxetischer Schaum", -0.7]];
    // PRÜFEN: Kork ν ≈ 0; auxetische Schäume erreichen etwa ν ≈ −0,7
    var z = { eps: 0.2, nu: 0.5 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ein Block wird gedehnt oder gestaucht; der ursprüngliche Umriss ist gestrichelt",
      function (b) { return begrenze(b * 0.36, 190, 250); }, zeichne);

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var L = 1.6, D = 1;
      var S = Math.min((B - 120) / (L * 1.32), (H - 46) / (D * 1.26));
      var cx = B / 2, cy = (H - 20) / 2 + 4;
      var lJ = L * (1 + z.eps) * S, dJ = D * (1 - z.nu * z.eps) * S;
      s("rect", { "class": "turm", x: cx - lJ / 2, y: cy - dJ / 2, width: lJ, height: dJ }, f.svg);
      s("rect", { "class": "hilfslinie", x: cx - L * S / 2, y: cy - D * S / 2, width: L * S, height: D * S }, f.svg);
      /* Zug- bzw. Druckpfeile an den Enden */
      var a = 30 * Math.min(1, Math.abs(z.eps) / 0.2) + 8;
      if (z.eps > 0) {
        pfeil(f.svg, cx + lJ / 2 + 4, cy, cx + lJ / 2 + 4 + a, cy, "kupfer");
        pfeil(f.svg, cx - lJ / 2 - 4, cy, cx - lJ / 2 - 4 - a, cy, "kupfer");
      } else if (z.eps < 0) {
        pfeil(f.svg, cx + lJ / 2 + 4 + a, cy, cx + lJ / 2 + 4, cy, "kupfer");
        pfeil(f.svg, cx - lJ / 2 - 4 - a, cy, cx - lJ / 2 - 4, cy, "kupfer");
      }
      txt(f.svg, cx, H - 8, "Länge " + (z.eps >= 0 ? "+" : "") + zahl(z.eps * 100, 0) + " %   ·   Dicke " +
          (z.nu * z.eps > 0 ? "−" : "+") + zahl(Math.abs(z.nu * z.eps) * 100, 1) + " %", "klein", "middle");
    }

    var knoepfe = auswahl(teil.bedienung, "Werkstoff:", "Querkontraktionszahl vorwählen",
      VORGABEN.map(function (v) { return v[0]; }),
      function (i) { z.nu = VORGABEN[i][1]; rNu.setze(z.nu); zeichne(); });
    regler(teil.regler, {
      name: "Dehnung ε", min: -0.2, max: 0.3, schritt: 0.01, wert: z.eps,
      anzeige: function (w) { return (w > 0 ? "+" : "") + zahl(w * 100, 0) + " %"; }
    }, function (w) { z.eps = w; zeichne(); });
    var rNu = regler(teil.regler, {
      name: "Querkontraktionszahl ν", min: -0.8, max: 0.5, schritt: 0.05, wert: z.nu,
      anzeige: function (w) { return zahl(w, 2); }
    }, function (w) { z.nu = w; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["laenge", "Länge"], ["dicke", "Dicke"], ["vol", "Volumen (exakt)"], ["naeh", "Näherung ε(1 − 2ν)"]
    ]);

    function prozent(x, stellen) { return (x > 0 ? "+" : "") + zahl(x * 100, stellen) + " %"; }
    function zeichne() {
      markiere(knoepfe, VORGABEN.map(function (v) { return v[1]; }).indexOf(Math.round(z.nu * 100) / 100));
      zeichneBuehne();
      var dV = (1 + z.eps) * Math.pow(1 - z.nu * z.eps, 2) - 1;
      werte.laenge.textContent = prozent(z.eps, 0);
      werte.dicke.textContent = prozent(-z.nu * z.eps, 1);
      werte.vol.textContent = prozent(dV, 1);
      werte.naeh.textContent = prozent(z.eps * (1 - 2 * z.nu), 1);
      var satz;
      if (z.eps === 0) {
        satz = "Ohne Dehnung passiert nichts. Zieh am Block (positive Dehnung) oder drück ihn zusammen.";
      } else if (Math.abs(z.nu - 0.5) < 0.01) {
        satz = "Bei ν = 0,5 bleibt das Volumen (für kleine Dehnungen) gleich – wie bei Gummi: Was länger wird, wird im gleichen Maß dünner.";
      } else if (Math.abs(z.nu) < 0.01) {
        satz = "Bei ν = 0 ändert sich die Dicke überhaupt nicht – so verhält sich Kork. Darum lässt sich ein Korken in den Flaschenhals drücken, ohne dass er dicker wird und klemmt.";
      } else if (z.nu < 0) {
        satz = "Auxetisch: Beim " + (z.eps > 0 ? "Ziehen wird das Material dicker statt dünner" : "Stauchen wird es dünner statt dicker") +
          ". Möglich machen das Hohlräume, die sich wie ein Scherengitter aufklappen.";
      } else {
        satz = "Der Block wird " + (z.eps > 0 ? "länger und dünner" : "kürzer und dicker") +
          ", aber nicht so stark, dass das Volumen gleich bleibt: Es ändert sich um " + prozent(dV, 1) + ".";
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  I.modell("zugstab", zugstab);
  I.modell("querkontraktion", querkontraktion);
})(window.Interaktiv);
