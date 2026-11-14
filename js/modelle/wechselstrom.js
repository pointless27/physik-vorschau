/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/elektrodynamik/wechselstrom.html
   =========================================================================
   Modelle: zeiger.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/wechselstrom.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, abspieler = I.abspieler,
      geruest = I.geruest, auswahl = I.auswahl, markiere = I.markiere,
      pfeil = I.pfeil, werteLeiste = I.werteLeiste, txtIndex = I.txtIndex;

  /* =======================================================================
     MODELL: ZEIGERDIAGRAMM  (elektrodynamik/wechselstrom)
     Einheiten: R = 1, ω0 = 1/√(LC) = 1, L = 2, C = 1/2 (also Güte
     Q = √(L/C)/R = 2), Û = 1. Die Quelle liefert U = Û sin(ωt), der Strom
     ist I = Î sin(ωt − φ) mit Î = Û/|Z| und tan φ = X/R.
       Widerstand:   Z = R                 → φ = 0
       Kondensator:  Z = 1/(iωC)           → φ = −90°, Î = ωC Û
       Spule:        Z = iωL               → φ = +90°, Î = Û/(ωL)
       Reihenkreis:  Z = R + i(ωL − 1/(ωC))
     Zeiger: Winkel ωt gegen die waagerechte Achse, die Höhe der Spitze ist
     der Momentanwert (deshalb sin). Zeitachse in Einheiten der Phase ωt
     (zwei Perioden), damit das Diagramm bei jeder Frequenz gleich breit ist.
     Im Reihenkreis zusätzlich dünn die Teilspannungen U_R, U_L, U_C
     (an der Spule und am Kondensator bis zu etwa Q·Û = 2Û).
     ======================================================================= */
  function zeiger(fig) {
    var ZPI = 2 * Math.PI;
    var L = 2, C = 0.5, R = 1;
    var FAELLE = ["Widerstand", "Kondensator", "Spule", "Reihenschwingkreis"];
    var PERIODEN = 8;                                   // Abspielen: so viele Perioden
    var z = { fall: 3, w: 1.5, phase: 0.3 * ZPI };      // phase = ωt
    var teil = geruest(fig);
    var w = null;

    function rechne() {
      var X, Rw;
      switch (z.fall) {
        case 0: Rw = R; X = 0; break;
        case 1: Rw = 0; X = -1 / (z.w * C); break;
        case 2: Rw = 0; X = z.w * L; break;
        default: Rw = R; X = z.w * L - 1 / (z.w * C);
      }
      var Zb = Math.sqrt(Rw * Rw + X * X);
      return { X: X, Z: Zb, I: 1 / Zb, phi: Math.atan2(X, Rw) };
    }

    var flaeche = zeichenflaeche(teil.buehne, null,
      "Links die rotierenden Zeiger von Spannung und Strom, rechts ihr zeitlicher Verlauf",
      function (b) { return mass(b).H; }, aufbau);

    function mass(b) {
      if (b >= 560) {
        var g = Math.round(begrenze(b * 0.4, 230, 300));
        return { breit: true, g: g, H: g };
      }
      var g2 = Math.round(Math.min(b, 260));
      return { breit: false, g: g2, H: g2 + 186 };
    }

    function aufbau() { w = mass(flaeche.b); zeichne(); }

    var knoepfe = auswahl(teil.bedienung, "Bauteil", "Welches Bauteil an der Wechselspannung liegt",
      FAELLE, function (i) { z.fall = i; zeichne(); });
    var rw = regler(teil.regler, {
      name: "Frequenz ω / ω₀", min: 0.25, max: 4, schritt: 0.01, wert: z.w,
      anzeige: function (v) { return zahl(v, 2); }
    }, function (v) { z.w = v; zeichne(); });
    var los = knopf(teil.knoepfe, "▶ Abspielen", "haupt", function () {});
    var ab = abspieler({
      knopf: los, text: "▶ Abspielen", faktor: 0.9 * ZPI,
      hole: function () { return z.phase; },
      setze: function (p) { z.phase = p; zeichne(); },
      ende: function () { return PERIODEN * ZPI; }
    });
    var werte = werteLeiste(teil.bedienung, [
      ["i", "Stromamplitude Î (in Û/R)"], ["phi", "Phase φ von U gegen I"], ["z", "Scheinwiderstand |Z| (in R)"]
    ]);

    function zeichne() {
      if (!w) return;
      var f = flaeche, B = f.b, g = w.g, r = rechne();
      markiere(knoepfe, z.fall);
      f.leeren();
      var wurzel = s("g", null, f.svg);
      var p = z.phase;

      /* ---------- Zeiger ---------- */
      var cx, cy, rmax = g / 2 - 22;
      if (w.breit) { cx = g / 2; cy = g / 2 + 6; } else { cx = B / 2; cy = g / 2 + 6; }
      var k = rmax / 2.2;                                // Längeneinheit (Û = 1, max. 2,1)
      s("line", { "class": "hilfslinie", x1: cx - rmax - 6, y1: cy, x2: cx + rmax + 6, y2: cy }, wurzel);
      s("line", { "class": "hilfslinie", x1: cx, y1: cy - rmax - 6, x2: cx, y2: cy + rmax + 6 }, wurzel);
      s("circle", { "class": "hilfslinie", cx: cx, cy: cy, r: k, fill: "none" }, wurzel);
      txt(wurzel, 6, 16, "Zeiger", "ia-titel");

      function spitze(laenge, winkel) {
        return [cx + laenge * k * Math.cos(winkel), cy - laenge * k * Math.sin(winkel)];
      }
      var aU = p, aI = p - r.phi;
      if (z.fall === 3) {
        /* Teilspannungen: U_R in Phase mit I, U_L 90° voraus, U_C 90° zurück */
        var uR = r.I * R, uL = r.I * z.w * L, uC = r.I / (z.w * C);
        var sR = spitze(uR, aI), sL = spitze(uL, aI + Math.PI / 2), sC = spitze(uC, aI - Math.PI / 2);
        pfeil(wurzel, cx, cy, sR[0], sR[1], "blau duenn");
        pfeil(wurzel, cx, cy, sL[0], sL[1], "blau duenn");
        pfeil(wurzel, cx, cy, sC[0], sC[1], "blau duenn");
        if (uL * k > 18) txtIndex(wurzel, sL[0] + 4, sL[1] - 4, "U", "L", "klein blau halo");
        if (uC * k > 18) txtIndex(wurzel, sC[0] + 4, sC[1] + 12, "U", "C", "klein blau halo");
      }
      var sU = spitze(1, aU), sI = spitze(r.I, aI);
      pfeil(wurzel, cx, cy, sI[0], sI[1], "kupfer");
      pfeil(wurzel, cx, cy, sU[0], sU[1], "blau");
      txt(wurzel, sU[0] + 6 * Math.cos(aU), sU[1] - 6 * Math.sin(aU) + 4, "U", "blau halo", "middle");
      if (r.I * k > 8) txt(wurzel, sI[0] + 8 * Math.cos(aI), sI[1] - 8 * Math.sin(aI) + 4, "I", "kupfer halo", "middle");

      /* ---------- Zeitverlauf ---------- */
      var x0, x1, yc, a;
      if (w.breit) { x0 = g + 24; x1 = B - 10; yc = cy; a = k; }
      else { x0 = 34; x1 = B - 10; yc = g + 92; a = 34; }
      var X = function (ph) { return x0 + ph / (2 * ZPI) * (x1 - x0); };
      var ay = a;
      txt(wurzel, x0, w.breit ? 16 : g + 12, "Verlauf über zwei Perioden", "ia-titel");
      s("line", { "class": "achse", x1: x0, y1: yc, x2: x1, y2: yc }, wurzel);
      s("line", { "class": "achse", x1: x0, y1: yc - 2.2 * ay, x2: x0, y2: yc + 2.2 * ay }, wurzel);
      txt(wurzel, x1, yc + 2.2 * ay + 12, "ωt", "klein", "end");
      var n = 240, ptsU = [], ptsI = [], i, ph;
      for (i = 0; i <= n; i++) {
        ph = i / n * 2 * ZPI;
        ptsU.push([X(ph), yc - ay * Math.sin(ph)]);
        ptsI.push([X(ph), yc - ay * r.I * Math.sin(ph - r.phi)]);
      }
      s("polyline", { "class": "kurve blau", points: linienzug(ptsU) }, wurzel);
      var kI = s("polyline", { "class": "kurve kupfer", points: linienzug(ptsI) }, wurzel);
      kI.setAttribute("style", "stroke-dasharray:6 4");
      var pm = p % (2 * ZPI), xm = X(pm);
      s("line", { "class": "hilfslinie", x1: xm, y1: yc - 2.2 * ay, x2: xm, y2: yc + 2.2 * ay }, wurzel);
      var yU = yc - ay * Math.sin(pm), yI = yc - ay * r.I * Math.sin(pm - r.phi);
      s("circle", { "class": "punkt blau", cx: xm, cy: yU, r: 4 }, wurzel);
      s("circle", { "class": "punkt kupfer", cx: xm, cy: yI, r: 4 }, wurzel);
      if (w.breit) {
        /* Projektion: Höhe der Zeigerspitze = Momentanwert */
        s("line", { "class": "hilfslinie", x1: sU[0], y1: sU[1], x2: xm, y2: yU }, wurzel);
      }

      /* ---------- Werte und Text ---------- */
      var grad = r.phi * 180 / Math.PI;
      werte.i.textContent = zahl(r.I, 2);
      werte.phi.textContent = (grad > 0.05 ? "+" : "") + zahl(Math.abs(grad) < 0.05 ? 0 : grad, 0) + "°";
      werte.z.textContent = zahl(r.Z, 2);
      var satz;
      if (z.fall === 0) {
        satz = "Am Widerstand sind Strom und Spannung in Phase. Die Frequenz ändert nichts: Î = Û/R.";
      } else if (z.fall === 1) {
        satz = "Am Kondensator eilt der Strom der Spannung um eine Viertelperiode voraus (φ = −90°). Der Blindwiderstand 1/(ωC) sinkt mit der Frequenz, darum wächst der Strom: Hohe Frequenzen kommen gut durch.";
      } else if (z.fall === 2) {
        satz = "An der Spule hinkt der Strom der Spannung um eine Viertelperiode hinterher (φ = +90°). Der Blindwiderstand ωL steigt mit der Frequenz, darum sinkt der Strom: Die Spule sperrt hohe Frequenzen.";
      } else {
        var lage = Math.abs(z.w - 1) < 0.015 ? "Resonanz: Die Zeiger der Spannungen an Spule und Kondensator sind gleich lang und heben sich auf. Der Kreis wirkt wie ein reiner Widerstand, Strom und Spannung sind in Phase, und der Strom ist maximal. An Spule und Kondensator liegt dabei je die doppelte Quellenspannung (Güte 2)."
          : z.w < 1 ? "Unterhalb der Resonanz überwiegt der Kondensator (sein Spannungszeiger ist länger als der der Spule): Der Strom eilt der Spannung voraus."
          : "Oberhalb der Resonanz überwiegt die Spule (ihr Spannungszeiger ist länger als der des Kondensators): Der Strom hinkt der Spannung hinterher.";
        satz = "Reihenschwingkreis mit R, L und C (Resonanz bei ω₀). " + lage;
      }
      teil.status.textContent = satz;
    }

    aufbau();
  }

  I.modell("zeiger", zeiger);
})(window.Interaktiv);
