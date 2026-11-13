/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/drehbewegung.html
   =========================================================================
   Modelle: traegheitsrad, drehstuhl.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/drehbewegung.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, regler = I.regler,
      knopf = I.knopf, werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      saeulen = I.saeulen, geruest = I.geruest;

  /* =======================================================================
     MODELL 16: TRÄGHEITSRAD – ein fallendes Gewicht treibt über eine
     Schnur ein Rad mit zwei verschiebbaren Zusatzmassen an.
     I = I0 + 2·M·d²,  a = m·g / (m + I/r²),  α = a/r
     ======================================================================= */
  function traegheitsrad(fig) {
    var R_NABE = 0.08, I0 = 0.004, M_Z = 0.4, HOEHE = 0.5;   // m, kg·m², kg, m
    var z = { d: 0.15, m: 0.2, f: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Rad mit zwei verschiebbaren Zusatzmassen, angetrieben von einem fallenden Gewicht, daneben Energie-Säulen",
      function (b) { return begrenze(b * 0.55, 270, 340); }, zeichne);

    function traegheit() { return I0 + 2 * M_Z * z.d * z.d; }
    function mEff() { return traegheit() / (R_NABE * R_NABE); }   // „Ersatzmasse“ I/r²
    function beschl() { return z.m * G / (z.m + mEff()); }
    function dauer() { return Math.sqrt(2 * HOEHE / beschl()); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var t = z.f * dauer(), a = beschl(), sW = 0.5 * a * t * t, v = a * t;
      var S = Math.min((H - 30) / 1.3, (B * 0.56) / 0.7);
      var cx = 16 + 0.34 * S, cy = 14 + 0.34 * S;
      var theta = 0.5 * (a / R_NABE) * t * t;

      /* Schnur und Gewicht (Schnur rechts an der Nabe, läuft senkrecht nach unten) */
      var L0 = 0.4, xS = cx + R_NABE * S, yG = cy + (L0 + sW) * S;
      s("line", { "class": "achse", x1: xS, y1: cy, x2: xS, y2: yG }, f.svg);
      s("line", { "class": "hilfslinie", x1: xS - 26, y1: cy + L0 * S, x2: xS + 40, y2: cy + L0 * S }, f.svg);
      s("line", { "class": "hilfslinie", x1: xS - 26, y1: cy + (L0 + HOEHE) * S, x2: xS + 40, y2: cy + (L0 + HOEHE) * S }, f.svg);
      txt(f.svg, xS + 44, cy + L0 * S + 4, "Start", "klein");
      txt(f.svg, xS + 44, cy + (L0 + HOEHE) * S + 4, "0,5 m tiefer", "klein");
      var bG = 0.05 * S, hG = 0.06 * S;
      s("rect", { "class": "wagen", x: xS - bG / 2, y: yG, width: bG, height: hG, rx: 2 }, f.svg);
      txt(f.svg, xS, yG + hG + 13, zahl(z.m * 1000, 0) + " g", "klein", "middle");

      /* Rad: Stange mit zwei Zusatzmassen, dreht im Uhrzeigersinn */
      var c = Math.cos(theta), sn = Math.sin(theta), l = 0.32 * S;
      s("line", { "class": "achse", x1: cx - c * l, y1: cy - sn * l, x2: cx + c * l, y2: cy + sn * l }, f.svg);
      s("circle", { "class": "wagen", cx: cx, cy: cy, r: R_NABE * S }, f.svg);
      s("circle", { "class": "punkt", cx: cx, cy: cy, r: 2.5 }, f.svg);
      s("circle", { "class": "ball blau", cx: cx + c * z.d * S, cy: cy + sn * z.d * S, r: 0.03 * S }, f.svg);
      s("circle", { "class": "ball", cx: cx - c * z.d * S, cy: cy - sn * z.d * S, r: 0.03 * S }, f.svg);

      /* Energie-Säulen: Anteile der anfänglichen Lageenergie */
      var E0 = z.m * G * HOEHE, w = v / R_NABE;
      var x0 = cx + 0.36 * S + 70, spalte = Math.min(70, (B - x0 - 6) / 3);
      var skala = (H - 80) / E0;
      saeulen(f.svg, x0, H - 40, spalte, skala, [
        { name: "Lage", wert: z.m * G * (HOEHE - sW), klasse: "" },
        { name: "Gewicht", wert: 0.5 * z.m * v * v, klasse: "kupfer" },
        { name: "Rad", wert: 0.5 * traegheit() * w * w, klasse: "grau" }
      ], H - 24);
      s("line", { "class": "hilfslinie", x1: x0, y1: H - 40 - E0 * skala, x2: x0 + 3 * spalte, y2: H - 40 - E0 * skala }, f.svg);
      txt(f.svg, x0, H - 46 - E0 * skala, "Energie", "ia-titel");
    }

    regler(teil.regler, {
      name: "Abstand der Zusatzmassen", min: 0.05, max: 0.3, schritt: 0.01, wert: z.d,
      anzeige: function (w) { return zahl(w * 100, 0) + " cm"; }
    }, function (w) { spieler.stopp(); z.d = w; z.f = 0; zeichne(); });
    regler(teil.regler, {
      name: "Fallgewicht", min: 0.05, max: 0.5, schritt: 0.05, wert: z.m,
      anzeige: function (w) { return zahl(w * 1000, 0) + " g"; }
    }, function (w) { spieler.stopp(); z.m = w; z.f = 0; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Loslassen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); zeichne(); },
      ende: dauer
    });
    knopf(teil.knoepfe, "Zurück", null, function () { spieler.stopp(); z.f = 0; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["i", "Trägheitsmoment"], ["a", "Beschleunigung"], ["t", "Fallzeit (0,5 m)"], ["n", "Drehzahl am Ende"]
    ]);

    function zeichne() {
      var T = dauer(), anteil = mEff() / (z.m + mEff());
      zeichneBuehne();
      werte.i.textContent = zahl(traegheit(), 3).replace(/0+$/, "").replace(/,$/, "") + " kg·m²";
      werte.a.textContent = zahl(beschl(), 3) + " m/s²";
      werte.t.textContent = zahl(T, 2) + " s";
      werte.n.textContent = zahl(beschl() * T / R_NABE / (2 * Math.PI), 2) + " U/s";
      teil.status.textContent = "Am Ende stecken " + zahl(anteil * 100, 0) +
        " % der Lageenergie in der Drehung des Rades und nur " + zahl((1 - anteil) * 100, 0) +
        " % in der Bewegung des Gewichts. " + (z.d >= 0.2
          ? "Die Zusatzmassen sitzen weit außen: Weil ihr Beitrag mit dem Quadrat des Abstands wächst, ist das Rad sehr träge."
          : "Schieb die Zusatzmassen nach außen: Doppelter Abstand bedeutet vierfachen Beitrag zum Trägheitsmoment.");
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 17: DREHSTUHL – Drehimpulserhaltung von oben gesehen.
     L = I·ω bleibt konstant, I = I_K + 2·m_H·d²
     ======================================================================= */
  function drehstuhl(fig) {
    var I_K = 1.2, M_H = 2.5, D_AUS = 0.75, D_EIN = 0.25;               // kg·m², kg je Hantel, m
    var z = { d: D_AUS, f0: 0.4, phi: 0.3, t: 0, tAlt: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Person auf einem Drehstuhl mit zwei Hanteln, von oben gesehen, daneben Säulen für Trägheitsmoment, Drehzahl, Drehimpuls und Energie",
      function (b) { return begrenze(b * 0.5, 250, 320); }, zeichne);

    function traegheit(d) { return I_K + 2 * M_H * d * d; }
    function drehimpuls() { return traegheit(D_AUS) * 2 * Math.PI * z.f0; }
    function omega() { return drehimpuls() / traegheit(z.d); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, phi = z.phi, w = omega();
      f.leeren();
      var breiteL = Math.min(B * 0.55, H * 1.1);
      var S = Math.min((breiteL - 20) / 2, (H - 20) / 2) / 0.9;
      var cx = breiteL / 2, cy = H / 2;
      function P(xb, yb, winkel) {
        var c = Math.cos(winkel), sn = Math.sin(winkel);
        return [cx + (xb * c - yb * sn) * S, cy - (xb * sn + yb * c) * S];
      }
      var beta = (Math.PI / 3) * (D_AUS - z.d) / (D_AUS - D_EIN);
      function hand(seite, winkel) { return P(seite * z.d * Math.cos(beta), z.d * Math.sin(beta), winkel); }

      s("circle", { "class": "hilfslinie", cx: cx, cy: cy, r: 0.25 * S }, f.svg);
      /* Drehrichtung: Bogen gegen den Uhrzeigersinn */
      var rb = 0.86 * S, a1 = 0.35, a2 = 1.05;
      s("path", { "class": "kurve duenn", d: "M" + (cx + rb * Math.cos(a1)).toFixed(1) + " " + (cy - rb * Math.sin(a1)).toFixed(1) +
        "A" + rb.toFixed(1) + " " + rb.toFixed(1) + " 0 0 0 " + (cx + rb * Math.cos(a2)).toFixed(1) + " " + (cy - rb * Math.sin(a2)).toFixed(1) }, f.svg);
      pfeil(f.svg, cx + rb * Math.cos(a2 - 0.05), cy - rb * Math.sin(a2 - 0.05), cx + rb * Math.cos(a2 + 0.12), cy - rb * Math.sin(a2 + 0.12), "duenn");

      /* Spuren der blauen Hantel in den letzten Zehntelsekunden */
      for (var k = 5; k >= 1; k--) {
        var q = hand(1, phi - w * 0.06 * k);
        s("circle", { "class": "strobo", cx: q[0], cy: q[1], r: Math.max(3, 0.05 * S * (1 - k * 0.12)) }, f.svg);
      }
      /* Körper: Schultern als Ellipse, Kopf, Arme, Hanteln */
      var sl = P(-0.2, 0, phi), sr = P(0.2, 0, phi), hl = hand(-1, phi), hr = hand(1, phi);
      s("ellipse", { "class": "wagen", cx: cx, cy: cy, rx: 0.22 * S, ry: 0.12 * S,
        transform: "rotate(" + (-phi * 180 / Math.PI).toFixed(1) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ")" }, f.svg);
      var kopf = P(0, 0.02, phi);
      s("circle", { "class": "wagen", cx: kopf[0], cy: kopf[1], r: 0.09 * S }, f.svg);
      var nase = P(0, 0.13, phi);
      s("circle", { "class": "punkt", cx: nase[0], cy: nase[1], r: 2.5 }, f.svg);
      s("line", { "class": "person", x1: sl[0], y1: sl[1], x2: hl[0], y2: hl[1] }, f.svg);
      s("line", { "class": "person", x1: sr[0], y1: sr[1], x2: hr[0], y2: hr[1] }, f.svg);
      s("circle", { "class": "ball", cx: hl[0], cy: hl[1], r: 0.06 * S }, f.svg);
      s("circle", { "class": "ball blau", cx: hr[0], cy: hr[1], r: 0.06 * S }, f.svg);
      s("circle", { "class": "punkt", cx: cx, cy: cy, r: 2.5 }, f.svg);

      /* Säulen relativ zu den Werten mit ausgestreckten Armen */
      var I0 = traegheit(D_AUS), q0 = I0 / traegheit(z.d);
      var x0 = breiteL + 8, spalte = Math.min(64, (B - x0 - 6) / 4), yN = H - 40;
      var skala = (H - 80) / 2.8;
      saeulen(f.svg, x0, yN, spalte, skala, [
        { name: "I", wert: 1 / q0, klasse: "grau" },
        { name: "ω", wert: q0, klasse: "" },
        { name: "L", wert: 1, klasse: "kupfer" },
        { name: "E", wert: q0, klasse: "grau" }
      ], H - 24);
      s("line", { "class": "hilfslinie", x1: x0, y1: yN - skala, x2: x0 + 4 * spalte, y2: yN - skala }, f.svg);
      txt(f.svg, x0, 16, "relativ zu ausgestreckten Armen", "klein");
      txt(f.svg, x0 + 4 * spalte, yN - skala - 4, "1", "klein", "end");
    }

    regler(teil.regler, {
      name: "Anschwung (Arme ausgestreckt)", min: 0.1, max: 0.6, schritt: 0.05, wert: z.f0,
      anzeige: function (w) { return zahl(w, 2) + " U/s"; }
    }, function (w) { z.f0 = w; zeichne(); });
    regler(teil.regler, {
      name: "Abstand der Hanteln von der Achse", min: D_EIN, max: D_AUS, schritt: 0.01, wert: z.d,
      anzeige: function (w) { return zahl(w * 100, 0) + " cm"; }
    }, function (w) { z.d = w; zeichne(); });

    abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Drehen", faktor: 1,
      hole: function () { return z.t; },
      setze: function (t) {
        if (t > z.tAlt) z.phi += omega() * (t - z.tAlt);
        z.t = t; z.tAlt = t;
        zeichne();
      },
      ende: function () { return 600; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["i", "Trägheitsmoment"], ["n", "Drehzahl"], ["l", "Drehimpuls"], ["e", "Rotationsenergie"]
    ]);

    function zeichne() {
      var I = traegheit(z.d), w = omega(), q = traegheit(D_AUS) / I;
      zeichneBuehne();
      werte.i.textContent = zahl(I, 2) + " kg·m²";
      werte.n.textContent = zahl(w / (2 * Math.PI), 2) + " U/s";
      werte.l.textContent = zahl(drehimpuls(), 2) + " kg·m²/s";
      werte.e.textContent = zahl(0.5 * I * w * w, 1) + " J";
      teil.status.textContent = q < 1.02
        ? "Arme ausgestreckt: großes Trägheitsmoment, langsame Drehung. Zieh die Hanteln zur Achse heran."
        : "Das Trägheitsmoment ist auf " + zahl(100 / q, 0) + " % gesunken, also dreht sich die Person " +
          zahl(q, 1) + "-mal so schnell – der Drehimpuls bleibt gleich. Die Rotationsenergie ist ebenfalls " +
          zahl(q, 1) + "-mal so groß: Die zusätzliche Energie stammt aus der Arbeit der Armmuskeln.";
    }
    zeichne();
  }

  I.modell("traegheitsrad", traegheitsrad);
  I.modell("drehstuhl", drehstuhl);
})(window.Interaktiv);
