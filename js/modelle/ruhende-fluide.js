/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/ruhende-fluide.html
   =========================================================================
   Modelle: tauchgang, auftrieb.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/ruhende-fluide.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      maennchen = I.maennchen, geruest = I.geruest, tausender = I.tausender,
      auswahl = I.auswahl, markiere = I.markiere;

  /* =======================================================================
     MODELL: TAUCHGANG – Druck in der Tiefe                 (ruhende-fluide)
     p = p0 + ρ·g·h (Meerwasser ρ = 1025 kg/m³); Luftballon bei gleicher
     Temperatur: V = V0 · p0 / p (Boyle-Mariotte)
     ======================================================================= */
  function tauchgang(fig) {
    var RHO = 1025, P0 = 101325, TMAX = 40;
    var z = { t: 10 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ein Taucher mit Luftballon im Meer; je tiefer er taucht, desto kleiner wird der Ballon",
      function (b) { return begrenze(b * 0.55, 270, 360); }, zeichne);

    function druck(t) { return P0 + RHO * G * t; }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var o = 34, S = (H - o - 12) / TMAX;
      var Y = function (t) { return o + t * S; };
      s("rect", { "class": "flaeche", x: 8, y: o, width: B - 16, height: H - o - 6 }, f.svg);
      s("line", { "class": "kurve blau duenn", x1: 8, y1: o, x2: B - 8, y2: o }, f.svg);
      txt(f.svg, 12, o - 8, "Meeresoberfläche", "klein");
      for (var k = 10; k <= TMAX; k += 10) {
        s("line", { "class": "gitter", x1: 8, y1: Y(k), x2: B - 8, y2: Y(k) }, f.svg);
        txt(f.svg, 14, Y(k) - 4, k + " m", "klein");
        txt(f.svg, B - 14, Y(k) - 4, zahl(druck(k) / 1e5, 1) + " bar", "klein", "end");
      }
      txt(f.svg, B - 14, o - 8, "Gesamtdruck", "klein", "end");

      /* Taucher (aufrecht) mit Ballon; gestrichelt: Ballongröße an der Oberfläche */
      var x = B * 0.5, yF = Y(z.t) + 22, gr = 38;
      var hand = maennchen(f.svg, x, Math.min(yF, H - 8), gr, 1, 0.95).hand;
      var r0 = 20, r = r0 * Math.pow(P0 / druck(z.t), 1 / 3);
      var bx = hand[0] + 6, by = hand[1] - 16 - r;
      s("line", { "class": "kurve duenn", x1: hand[0], y1: hand[1], x2: bx, y2: by + r }, f.svg);
      s("circle", { "class": "hilfslinie", cx: bx, cy: by, r: r0 }, f.svg);
      s("circle", { "class": "ball", cx: bx, cy: by, r: r }, f.svg);
      txt(f.svg, bx + r0 + 8, by + 4, zahl(P0 / druck(z.t) * 100, 0) + " %", "klein halo");
    }

    var rT = regler(teil.regler, {
      name: "Tauchtiefe", min: 0, max: TMAX, schritt: 0.5, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " m"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▼ Abtauchen", faktor: 5, vonVorn: true,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["wasser", "Wasserdruck"], ["gesamt", "Gesamtdruck"], ["cm2", "Last auf 1 cm²"], ["ballon", "Ballonvolumen"]
    ]);

    function zeichne() {
      var p = druck(z.t);
      zeichneBuehne();
      werte.wasser.textContent = zahl((p - P0) / 1e5, 2) + " bar";
      werte.gesamt.textContent = zahl(p / 1e5, 2) + " bar";
      werte.cm2.textContent = zahl(p * 1e-4, 1) + " N (wie " + zahl(p * 1e-4 / G, 1) + " kg)";
      werte.ballon.textContent = zahl(P0 / p * 100, 0) + " %";
      teil.status.textContent = z.t === 0
        ? "An der Oberfläche drückt nur die Luft – rund 1 bar, so viel wie 1 kg auf jedem Quadratzentimeter."
        : "In " + zahl(z.t, 1) + " m Tiefe drückt das Wasser zusätzlich mit " + zahl((p - P0) / 1e5, 1) +
          " bar – alle 10 m kommt etwa 1 bar dazu. Die Luft im Ballon wird zusammengepresst: Er hat nur noch " +
          zahl(P0 / p * 100, 0) + " % seines Volumens." + (z.t >= 10 && z.t < 12
            ? " Schon in 10 m Tiefe hat sich das Volumen halbiert."
            : "");
    }
    zeichne();
  }

  /* =======================================================================
     MODELL: AUFTRIEB – Archimedisches Prinzip               (ruhende-fluide)
     Würfel, 10 cm Kantenlänge. Schwimmt er (ρ_K < ρ_Fl), taucht er zum
     Anteil ρ_K/ρ_Fl ein; sonst sinkt er, der Auftrieb ρ_Fl·g·V bleibt.
     ======================================================================= */
  function auftrieb(fig) {
    var KOERPER = [["Kork", 240], ["Holz", 450], ["Eis", 917], ["Mensch", 985], ["Aluminium", 2700], ["Stahl", 7850], ["Gold", 19300]];
    var FLUESSIG = [["Alkohol", 789], ["Wasser", 1000], ["Totes Meer", 1240], ["Quecksilber", 13534]];
    // PRÜFEN: Mensch mit Luft in der Lunge ≈ 985 kg/m³; Totes Meer ≈ 1240 kg/m³
    var V = 1e-3;
    var z = { k: 2, f: 1 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ein Würfel in einem Becken mit Flüssigkeit; Pfeile zeigen Gewichtskraft und Auftrieb",
      function (b) { return begrenze(b * 0.5, 250, 320); }, zeichne);

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var rk = KOERPER[z.k][1], rf = FLUESSIG[z.f][1];
      var a = begrenze(H * 0.26, 56, 84);
      var boden = H - 14, spiegel = boden - 2.3 * a, xl = B * 0.18, xr = B * 0.82, cx = B / 2;
      s("rect", { "class": "flaeche", x: xl, y: spiegel, width: xr - xl, height: boden - spiegel }, f.svg);
      s("line", { "class": "kurve blau duenn", x1: xl, y1: spiegel, x2: xr, y2: spiegel }, f.svg);
      s("path", { "class": "achse", d: "M" + xl + " " + (spiegel - 1.1 * a) + "V" + boden + "H" + xr + "V" + (spiegel - 1.1 * a) }, f.svg);
      txt(f.svg, xr - 6, boden - 8, FLUESSIG[z.f][0], "klein", "end");

      var schwimmt = rk < rf, anteil = schwimmt ? rk / rf : 1;
      var oben = schwimmt ? spiegel - (1 - anteil) * a : boden - a;
      s("rect", { "class": "turm", x: cx - a / 2, y: oben, width: a, height: a }, f.svg);
      txt(f.svg, cx, oben + a / 2 + 4, KOERPER[z.k][0], "klein halo", "middle");

      /* Kräfte: Länge relativ zur größeren der beiden möglichen Kräfte */
      var FG = rk * V * G, FA = rf * V * G * anteil, Fref = Math.max(FG, rf * V * G), lmax = 1.15 * a;
      var yS = oben + a / 2, yA = schwimmt ? spiegel + (oben + a - spiegel) / 2 : yS;
      if (pfeil(f.svg, cx + 12, yS, cx + 12, yS + lmax * FG / Fref, "kupfer")) {
        txtIndex(f.svg, cx + 18, yS + lmax * FG / Fref - 2, "F", "G", "kupfer");
      }
      if (pfeil(f.svg, cx - 12, yA, cx - 12, yA - lmax * FA / Fref, "blau")) {
        txtIndex(f.svg, cx - 18, yA - lmax * FA / Fref + 10, "F", "A", "blau", "end");
      }
    }

    var kK = auswahl(teil.bedienung, "Körper:", "Körper wählen", KOERPER.map(function (k) { return k[0]; }),
      function (i) { z.k = i; zeichne(); });
    var kF = auswahl(teil.bedienung, "Flüssigkeit:", "Flüssigkeit wählen", FLUESSIG.map(function (k) { return k[0]; }),
      function (i) { z.f = i; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["dichten", "Dichte Körper / Flüssigkeit"], ["fg", "Gewichtskraft"], ["fa", "Auftrieb ganz eingetaucht"], ["erg", "Ergebnis"]
    ]);

    function zeichne() {
      var rk = KOERPER[z.k][1], rf = FLUESSIG[z.f][1], name = KOERPER[z.k][0], fl = FLUESSIG[z.f][0];
      markiere(kK, z.k); markiere(kF, z.f);
      zeichneBuehne();
      werte.dichten.textContent = tausender(rk) + " / " + tausender(rf) + " kg/m³";
      werte.fg.textContent = zahl(rk * V * G, 1) + " N";
      werte.fa.textContent = zahl(rf * V * G, 1) + " N";
      var satz;
      if (rk < rf) {
        werte.erg.textContent = "schwimmt, " + zahl(rk / rf * 100, 0) + " % unten";
        satz = name + " ist leichter als " + fl + " und schwimmt. Er taucht genau so tief ein, bis die verdrängte Flüssigkeit " +
          "so viel wiegt wie der Würfel selbst: " + zahl(rk / rf * 100, 0) + " % seines Volumens liegen unter der Oberfläche." +
          (z.k === 2 && z.f === 1 ? " Genau so ist es beim Eisberg – der größte Teil bleibt unsichtbar." : "");
      } else {
        werte.erg.textContent = "sinkt, wiegt noch " + zahl((rk - rf) * V * G, 1) + " N";
        satz = name + " ist dichter als " + fl + " und sinkt. Der Auftrieb trägt aber trotzdem " +
          zahl(rf / rk * 100, 0) + " % des Gewichts – in der Flüssigkeit wiegt der Würfel nur noch " +
          zahl((rk - rf) * V * G, 1) + " statt " + zahl(rk * V * G, 1) + " N." +
          (z.k === 2 && z.f === 0 ? " Eiswürfel gehen in hochprozentigem Alkohol tatsächlich unter." : "");
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  I.modell("tauchgang", tauchgang);
  I.modell("auftrieb", auftrieb);
})(window.Interaktiv);
