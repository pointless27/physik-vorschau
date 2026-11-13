/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/arbeit-leistung.html
   =========================================================================
   Modelle: schlitten, treppe.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/arbeit-leistung.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      bahnMitTeilung = I.bahnMitTeilung, maennchen = I.maennchen,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 8: SCHLITTEN ZIEHEN – Arbeit W = F·s·cos θ, Leistung P = W/t
     ======================================================================= */
  function schlitten(fig) {
    var z = { F: 80, theta: 30, s: 20, dauer: 10, f: 0.6 };
    var teil = geruest(fig);
    var buehne = zeichenflaeche(teil.buehne, "ia-strasse", "Ein Schlitten wird an einem schrägen Seil gezogen",
      function (b) { return begrenze(b * 0.2, 130, 150); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var dW = zeichenflaeche(reihe, null, "Kraft-Weg-Diagramm: Die Fläche ist die Arbeit",
      function (b) { return begrenze(b * 0.36, 150, 190); }, zeichne);

    function fPar() { return z.F * Math.cos(z.theta * Math.PI / 180); }

    function zeichneBuehne() {
      var f = buehne, th = z.theta * Math.PI / 180;
      f.leeren();
      var bahn = bahnMitTeilung(f, -z.s * 0.05, z.s * 1.25, 20, 20, 30);
      var X = bahn.X, yS = bahn.y, x = X(z.f * z.s);
      s("line", { "class": "hilfslinie", x1: X(z.s), y1: yS, x2: X(z.s), y2: yS - 60 }, f.svg);
      txt(f.svg, X(z.s), yS - 64, "Ziel", "klein", "middle");
      s("path", { "class": "wagen", d: "M" + (x - 44) + " " + (yS - 8) + "H" + x + "L" + (x + 6) + " " + (yS - 18) + "H" + (x - 40) + "Z" }, f.svg);
      s("path", { "class": "achse", d: "M" + (x - 50) + " " + (yS - 2) + "H" + (x + 2) + "Q" + (x + 10) + " " + (yS - 2) + " " + (x + 10) + " " + (yS - 10) }, f.svg);
      var k = 0.55, ax = x + 6, ay = yS - 18;
      pfeil(f.svg, ax, ay, ax + z.F * k * Math.cos(th), ay - z.F * k * Math.sin(th), "kupfer");
      txt(f.svg, ax + z.F * k * Math.cos(th) + 6, ay - z.F * k * Math.sin(th), "F", "kupfer");
      if (pfeil(f.svg, ax, ay, ax + fPar() * k, ay, "blau")) {
        txtIndex(f.svg, ax + fPar() * k - 4, ay + 15, "F", "x", "blau", "end");
      }
      s("line", { "class": "hilfslinie", x1: ax + fPar() * k, y1: ay, x2: ax + z.F * k * Math.cos(th), y2: ay - z.F * k * Math.sin(th) }, f.svg);
    }

    function zeichneDiagramm() {
      var f = dW, B = f.b, H = f.h;
      f.leeren();
      var l = 44, r = 14, o = 26, u = 24, Fmax = 200;
      var X = function (x) { return l + x / z.s * (B - l - r); };
      var Y = function (F) { return H - u - F / Fmax * (H - o - u); };
      txt(f.svg, 4, 14, "Kraftanteil in Wegrichtung in N", "ia-titel");
      [0, 100, 200].forEach(function (F) {
        s("line", { "class": "gitter", x1: l, y1: Y(F), x2: B - r, y2: Y(F) }, f.svg);
        txt(f.svg, l - 5, Y(F) + 4, String(F), "klein", "end");
      });
      txt(f.svg, l, H - 6, "0 m", "klein");
      txt(f.svg, B - r, H - 6, z.s + " m", "klein", "end");
      var xj = z.f * z.s;
      s("rect", { "class": "flaeche", x: X(0), y: Y(fPar()), width: X(xj) - X(0), height: Y(0) - Y(fPar()) }, f.svg);
      s("line", { "class": "hilfslinie", x1: X(0), y1: Y(z.F), x2: X(z.s), y2: Y(z.F) }, f.svg);
      txt(f.svg, X(z.s) - 4, Y(z.F) - 5, "ganze Kraft F", "klein", "end");
      s("line", { "class": "kurve blau", x1: X(0), y1: Y(fPar()), x2: X(z.s), y2: Y(fPar()) }, f.svg);
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r, y2: Y(0) }, f.svg);
      s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: Y(0) }, f.svg);
      if (xj > 0.05 * z.s) txt(f.svg, (X(0) + X(xj)) / 2, (Y(0) + Y(fPar())) / 2 + 4, "W", "blau", "middle");
    }

    regler(teil.regler, {
      name: "Zugkraft F", min: 0, max: 200, schritt: 5, wert: z.F,
      anzeige: function (w) { return w + " N"; }
    }, function (w) { z.F = w; zeichne(); });
    regler(teil.regler, {
      name: "Winkel des Seils θ", min: 0, max: 90, schritt: 1, wert: z.theta,
      anzeige: function (w) { return w + "°"; }
    }, function (w) { z.theta = w; zeichne(); });
    regler(teil.regler, {
      name: "Weg s", min: 5, max: 50, schritt: 1, wert: z.s,
      anzeige: function (w) { return w + " m"; }
    }, function (w) { z.s = w; zeichne(); });
    regler(teil.regler, {
      name: "Dauer", min: 2, max: 30, schritt: 1, wert: z.dauer,
      anzeige: function (w) { return w + " s"; }
    }, function (w) { z.dauer = w; zeichne(); });

    abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Ziehen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * 3; },
      setze: function (t) { z.f = t / 3; zeichne(); },
      ende: function () { return 3; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["fpar", "F in Wegrichtung"], ["w", "Arbeit W"], ["p", "Leistung P = W/t"]
    ]);

    function zeichne() {
      zeichneBuehne();
      zeichneDiagramm();
      var W = fPar() * z.s;
      werte.fpar.textContent = zahl(fPar(), 1) + " N";
      werte.w.textContent = zahl(W, 0) + " J";
      werte.p.textContent = zahl(W / z.dauer, 0) + " W";
      teil.status.textContent = z.theta >= 90
        ? "Das Seil zieht senkrecht nach oben – quer zum Weg. Diese Kraft verrichtet überhaupt keine Arbeit."
        : z.theta === 0
          ? "Die ganze Kraft zeigt in Wegrichtung: W = F · s = " + zahl(W, 0) + " J."
          : "Nur der blaue Anteil der Kraft zeigt in Wegrichtung und verrichtet Arbeit: " + zahl(fPar(), 1) + " N · " + z.s +
            " m = " + zahl(W, 0) + " J. Der Rest zieht den Schlitten nur ein wenig nach oben.";
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 9: LEISTUNGSRECHNER TREPPE – P = m g h / t
     ======================================================================= */
  function treppe(fig) {
    var STOCKWERK = 3.0;                               // Höhe eines Stockwerks in m
    var z = { m: 70, stock: 3, zeit: 15 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null, "Treppe und Vergleich deiner Leistung mit Alltagsgeräten",
      function (b) { return begrenze(b * 0.4, 200, 260); }, zeichne);
    // PRÜFEN: Vergleichswerte (Dauerleistung Mensch ≈ 100 W, Radprofi ≈ 400 W über eine Stunde)
    var VERGLEICH = [["LED-Lampe", 10], ["Mensch (Dauer)", 100], ["Radprofi (1 h)", 400], ["Wasserkocher", 2000]];

    function zeichneBuehne(P) {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      /* links: Treppe mit Stufen */
      var tb = Math.min(B * 0.25, 200), stufen = z.stock * 4, sx = tb / stufen, sy = (H - 50) / stufen;
      var d = "M10 " + (H - 20);
      for (var i = 0; i < stufen; i++) d += "h" + sx.toFixed(1) + "v" + (-sy).toFixed(1);
      s("path", { "class": "achse", d: d }, f.svg);
      maennchen(f.svg, 10 + tb - 6, H - 20 - stufen * sy, 34, 1, 0.55);
      txt(f.svg, 10, 14, zahl(z.stock * STOCKWERK, 0) + " m hoch", "klein");
      /* rechts: waagerechte Balken, logarithmisch skaliert */
      var liste = VERGLEICH.concat([["Du", P]]).sort(function (a, b) { return a[1] - b[1]; });
      var x0 = tb + 30 + 92, breite = B - x0 - 70, zeile = (H - 30) / liste.length;
      var X = function (w) { return x0 + Math.min(1, Math.log(Math.max(w, 1)) / Math.log(3000)) * breite; };   // log. Achse bis 3000 W
      liste.forEach(function (e, n) {
        var y = 20 + n * zeile, du = e[0].indexOf("Du") === 0;
        txt(f.svg, x0 - 8, y + zeile * 0.5 + 4, e[0], du ? "blau klein" : "klein", "end");
        s("rect", { "class": "balken" + (du ? "" : " grau"), x: x0, y: y + zeile * 0.2, width: Math.max(2, X(e[1]) - x0), height: zeile * 0.6 }, f.svg);
        txt(f.svg, X(e[1]) + 5, y + zeile * 0.5 + 4, zahl(e[1], 0) + " W", du ? "blau klein" : "klein");
      });
      txt(f.svg, B - 8, H - 4, "Achse logarithmisch", "klein", "end");
    }

    regler(teil.regler, {
      name: "Deine Masse", min: 30, max: 120, schritt: 1, wert: z.m,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.m = w; zeichne(); });
    regler(teil.regler, {
      name: "Stockwerke (je 3 m)", min: 1, max: 10, schritt: 1, wert: z.stock,
      anzeige: function (w) { return String(w); }
    }, function (w) { z.stock = w; zeichne(); });
    regler(teil.regler, {
      name: "Gebrauchte Zeit", min: 3, max: 120, schritt: 1, wert: z.zeit,
      anzeige: function (w) { return w + " s"; }
    }, function (w) { z.zeit = w; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [["w", "Arbeit W = m g h"], ["p", "Leistung P = W/t"], ["ps", "in PS"]]);

    function zeichne() {
      var W = z.m * G * z.stock * STOCKWERK, P = W / z.zeit;
      zeichneBuehne(P);
      werte.w.textContent = zahl(W / 1000, 1) + " kJ";
      werte.p.textContent = zahl(P, 0) + " W";
      werte.ps.textContent = zahl(P / 735.5, 2) + " PS";
      teil.status.textContent = "Du hebst " + z.m + " kg um " + zahl(z.stock * STOCKWERK, 0) + " m an und leistest dabei " +
        zahl(P, 0) + " W – so viel wie " + zahl(P / 10, 0) + " LED-Lampen zusammen. Doppelt so schnell hieße doppelte Leistung, aber dieselbe Arbeit.";
    }
    zeichne();
  }

  I.modell("schlitten", schlitten);
  I.modell("treppe", treppe);
})(window.Interaktiv);
