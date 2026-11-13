/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/kraefte.html
   =========================================================================
   Modelle: schiefeEbene, fallschirm.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/kraefte.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      zeitDiagramm = I.zeitDiagramm, maennchen = I.maennchen,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 6: SCHIEFE EBENE MIT REIBUNG (kraefte)
     Haftet, solange m g sin α ≤ μ_H m g cos α; sonst a = g (sin α − μ_Gl cos α)
     ======================================================================= */
  function schiefeEbene(fig) {
    var L = 4;                                         // Länge der Rampe in m
    var z = { alpha: 20, muH: 0.5, muG: 0.3, m: 5, f: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Kiste auf einer schiefen Ebene mit eingezeichneten Kräften",
      function (b) { return begrenze(b * 0.5, 230, 330); }, zeichne);

    function rad() { return z.alpha * Math.PI / 180; }
    function haftet() { return Math.tan(rad()) <= z.muH + 1e-9; }
    function beschl() { return haftet() ? 0 : G * (Math.sin(rad()) - z.muG * Math.cos(rad())); }
    function dauer() { return haftet() ? 0 : Math.sqrt(2 * (L - 0.6) / beschl()); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, a = rad();
      f.leeren();
      var S = Math.min((B - 80) / (L * Math.cos(a)), (H - 115) / (L * Math.sin(a) + 0.4));
      var xU = 40 + L * Math.cos(a) * S, yU = H - 30;          // unteres Ende der Rampe
      var xO = 40, yO = yU - L * Math.sin(a) * S;               // oberes Ende
      s("polygon", { "class": "flaeche", points: xO + "," + yO + " " + xU + "," + yU + " " + xO + "," + yU }, f.svg);
      s("path", { "class": "achse", d: "M" + xO + " " + yO + "L" + xU + " " + yU + "M10 " + yU + "H" + (B - 10) }, f.svg);
      if (z.alpha > 0) {
        var rb = 34;
        s("path", { "class": "hilfslinie", d: "M" + (xU - rb) + " " + yU + "A" + rb + " " + rb + " 0 0 1 " +
          (xU - rb * Math.cos(a)).toFixed(1) + " " + (yU - rb * Math.sin(a)).toFixed(1) }, f.svg);
        txt(f.svg, xU - rb - 8, yU - 6, "α", null, "end");
      }

      /* Kiste: Abstand s vom oberen Ende (rutscht nach rechts unten) */
      var t = z.f * dauer(), sW = 0.3 + 0.5 * beschl() * t * t;
      var d = [Math.cos(a), Math.sin(a)], n = [Math.sin(a), -Math.cos(a)];
      var w = begrenze(0.6 * S, 30, 54), px = xO + d[0] * sW * S, py = yO + d[1] * sW * S;
      s("rect", { "class": "wagen", x: -w / 2, y: -w, width: w, height: w, rx: 2,
        transform: "translate(" + px.toFixed(1) + " " + py.toFixed(1) + ") rotate(" + z.alpha + ")" }, f.svg);
      var cx = px + n[0] * w / 2, cy = py + n[1] * w / 2;

      /* Kräfte: Länge der Gewichtskraft fest, die anderen im Verhältnis */
      var k = H * 0.22, fg = 1, fh = Math.sin(a), fn = Math.cos(a);
      var fr = haftet() ? fh : z.muG * fn;
      pfeil(f.svg, cx, cy, cx, cy + fg * k, "duenn");
      txtIndex(f.svg, cx + 6, cy + fg * k, "F", "G", null);
      pfeil(f.svg, cx, cy, cx + n[0] * fn * k, cy + n[1] * fn * k, "");
      txtIndex(f.svg, cx + n[0] * fn * k + 6, cy + n[1] * fn * k, "F", "N", null);
      if (pfeil(f.svg, cx, cy, cx + d[0] * fh * k, cy + d[1] * fh * k, "blau")) {
        txtIndex(f.svg, cx + d[0] * fh * k + 4, cy + d[1] * fh * k + 14, "F", "Hang", "blau");
      }
      if (pfeil(f.svg, px - d[0] * w * 0.1, py - d[1] * w * 0.1, px - d[0] * (w * 0.1 + fr * k), py - d[1] * (w * 0.1 + fr * k), "kupfer")) {
        txtIndex(f.svg, px - d[0] * (w * 0.1 + fr * k) - 4, py - d[1] * (w * 0.1 + fr * k) + 16, "F", "R", "kupfer", "end");
      }
    }

    regler(teil.regler, {
      name: "Neigung α", min: 0, max: 60, schritt: 1, wert: z.alpha,
      anzeige: function (w) { return w + "°"; }
    }, function (w) { z.alpha = w; z.f = 0; zeichne(); });
    var rH = regler(teil.regler, {
      name: "Haftreibungszahl", min: 0, max: 1, schritt: 0.05, wert: z.muH,
      anzeige: function (w) { return zahl(w, 2); }
    }, function (w) { z.muH = w; if (z.muG > w) { z.muG = w; rG.setze(w); } z.f = 0; zeichne(); });
    var rG = regler(teil.regler, {
      name: "Gleitreibungszahl", min: 0, max: 1, schritt: 0.05, wert: z.muG,
      anzeige: function (w) { return zahl(w, 2); }
    }, function (w) { z.muG = w; if (w > z.muH) { z.muH = w; rH.setze(w); } zeichne(); });
    regler(teil.regler, {
      name: "Masse m", min: 1, max: 20, schritt: 1, wert: z.m,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.m = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Loslassen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { var T = dauer(); z.f = T > 0 ? t / T : 0; zeichne(); },
      ende: dauer
    });
    knopf(teil.knoepfe, "Zurück nach oben", null, function () { spieler.stopp(); z.f = 0; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["fh", "Hangabtriebskraft"], ["haft", "max. Haftreibung"], ["a", "Beschleunigung"], ["grenz", "Grenzwinkel"]
    ]);

    function zeichne() {
      var a = rad(), FH = z.m * G * Math.sin(a), FN = z.m * G * Math.cos(a);
      zeichneBuehne();
      werte.fh.textContent = zahl(FH, 1) + " N";
      werte.haft.textContent = zahl(z.muH * FN, 1) + " N";
      werte.a.textContent = zahl(beschl(), 2) + " m/s²";
      werte.grenz.textContent = zahl(Math.atan(z.muH) * 180 / Math.PI, 1) + "°";
      teil.status.textContent = haftet()
        ? "Die Kiste bleibt liegen: Die Haftreibung könnte bis zu " + zahl(z.muH * FN, 1) +
          " N aufbringen, gebraucht werden nur " + zahl(FH, 1) + " N. Erst ab " +
          zahl(Math.atan(z.muH) * 180 / Math.PI, 1) + "° rutscht sie – egal, wie schwer sie ist."
        : "Die Kiste rutscht: Der Hangabtrieb (" + zahl(FH, 1) + " N) ist größer als die maximale Haftreibung (" +
          zahl(z.muH * FN, 1) + " N). Beim Rutschen bremst nur noch die schwächere Gleitreibung (" +
          zahl(z.muG * FN, 1) + " N).";
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 7: FALLSCHIRMSPRUNG – Luftreibung F_L = ½ c_w ρ A v²
     Numerisch integriert; der Schirm öffnet sich über 3 s.
     ======================================================================= */
  function fallschirm(fig) {
    var TMAX = 60, DT = 0.01, RHO = 1.2, CA_ZU = 0.45, CA_AUF = 35, OEFFNEN_DAUER = 3, H0 = 4000;
    // PRÜFEN: c_w·A Bauchlage ≈ 0,45 m², offener Schirm ≈ 35 m² (typische Lehrbuchgrößen)
    var z = { m: 80, oeffnen: 25, t: 15 };
    var teil = geruest(fig);
    var bahn = [];

    function cA(t) {
      if (t < z.oeffnen) return CA_ZU;
      if (t < z.oeffnen + OEFFNEN_DAUER) return CA_ZU + (CA_AUF - CA_ZU) * (t - z.oeffnen) / OEFFNEN_DAUER;
      return CA_AUF;
    }
    function rechne() {
      bahn = [];
      var v = 0, hh = H0;
      for (var i = 0; i <= TMAX / DT; i++) {
        var t = i * DT, FL = 0.5 * RHO * cA(t) * v * v, a = G - FL / z.m;
        if (i % 10 === 0) bahn.push({ v: v, h: hh, a: a, FL: FL });
        v += a * DT; hh -= v * DT;
      }
    }
    function punkt(t) { return bahn[Math.max(0, Math.min(bahn.length - 1, Math.round(t / (10 * DT))))]; }

    var szene = zeichenflaeche(teil.buehne, "ia-strasse", "Fallschirmspringer mit Gewichtskraft und Luftwiderstand",
      function (b) { return begrenze(b * 0.24, 150, 180); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var dV = zeichenflaeche(reihe, null, "Geschwindigkeit-Zeit-Diagramm", function (b) { return begrenze(b * 0.62, 150, 180); }, zeichne);
    var dA = zeichenflaeche(reihe, null, "Beschleunigung-Zeit-Diagramm", function (b) { return begrenze(b * 0.62, 150, 180); }, zeichne);

    function zeichneSzene() {
      var f = szene, B = f.b, H = f.h, p = punkt(z.t), offen = z.t >= z.oeffnen;
      f.leeren();
      var cx = B / 2, cy = H * 0.62;
      if (offen) {
        var auf = Math.min(1, (z.t - z.oeffnen) / OEFFNEN_DAUER), rw = 28 + 34 * auf;
        s("path", { "class": "wagen", d: "M" + (cx - rw) + " " + (cy - 60) + "Q" + cx + " " + (cy - 60 - 40 * auf - 8) + " " + (cx + rw) + " " + (cy - 60) + "Z" }, f.svg);
        s("path", { "class": "hilfslinie", d: "M" + (cx - rw) + " " + (cy - 60) + "L" + cx + " " + (cy - 20) + "L" + (cx + rw) + " " + (cy - 60) }, f.svg);
        maennchen(f.svg, cx, cy + 30, 50, 1, 0.75);
      } else {
        /* Bauchlage: liegendes Männchen */
        var g = s("g", { "class": "person" }, f.svg);
        s("circle", { cx: cx - 26, cy: cy, r: 5 }, g);
        s("path", { d: "M" + (cx - 21) + " " + cy + "H" + (cx + 10) + "L" + (cx + 26) + " " + (cy - 8) + "M" + (cx + 10) + " " + cy + "L" + (cx + 26) + " " + (cy + 6) +
          "M" + (cx - 12) + " " + cy + "L" + (cx - 20) + " " + (cy - 14) + "M" + (cx - 12) + " " + cy + "L" + (cx - 20) + " " + (cy + 14) }, g);
      }
      var k = H * 0.28 / (z.m * G);
      var FL = Math.min(p.FL, 2.6 * z.m * G);
      pfeil(f.svg, cx + 48, cy, cx + 48, cy + z.m * G * k, "kupfer");
      txtIndex(f.svg, cx + 56, cy + z.m * G * k, "F", "G", "kupfer");
      if (pfeil(f.svg, cx - 48, cy, cx - 48, cy - FL * k, "blau")) {
        txtIndex(f.svg, cx - 56, cy - FL * k + 8, "F", "L", "blau", "end");
      }
      txt(f.svg, 8, 16, "Höhe: " + zahl(Math.max(0, p.h), 0) + " m", "klein");
      txt(f.svg, B - 8, 16, offen ? "Schirm offen" : "freier Fall", "klein", "end");
    }

    regler(teil.regler, {
      name: "Masse mit Ausrüstung", min: 50, max: 120, schritt: 5, wert: z.m,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.m = w; rechne(); zeichne(); });
    regler(teil.regler, {
      name: "Schirm öffnen nach", min: 5, max: 50, schritt: 1, wert: z.oeffnen,
      anzeige: function (w) { return w + " s"; }
    }, function (w) { z.oeffnen = w; rechne(); zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit t", min: 0, max: TMAX, schritt: 0.1, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Springen (4-fach schneller)", faktor: 4,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["v", "Geschwindigkeit"], ["fl", "Luftwiderstand"], ["fg", "Gewichtskraft"]
    ]);

    function zeichne() {
      var p = punkt(z.t);
      var vZu = Math.sqrt(2 * z.m * G / (RHO * CA_ZU)), vAuf = Math.sqrt(2 * z.m * G / (RHO * CA_AUF));
      zeichneSzene();
      zeitDiagramm(dV, function (t) { return punkt(t).v; }, "Geschwindigkeit v in m/s", TMAX, z.t,
        { linie: [vZu, "Endgeschw. " + zahl(vZu * 3.6, 0) + " km/h"] });
      zeitDiagramm(dA, function (t) { return punkt(t).a; }, "Beschleunigung a in m/s²", TMAX, z.t, {});
      werte.v.textContent = zahl(p.v, 1) + " m/s (" + zahl(p.v * 3.6, 0) + " km/h)";
      werte.fl.textContent = zahl(p.FL, 0) + " N";
      werte.fg.textContent = zahl(z.m * G, 0) + " N";
      var satz;
      if (z.t < z.oeffnen) {
        satz = p.FL < 0.97 * z.m * G
          ? "Noch ist der Luftwiderstand kleiner als die Gewichtskraft – der Springer wird schneller, aber immer langsamer schneller."
          : "Luftwiderstand und Gewicht sind fast gleich groß: Der Springer fällt nahezu gleichmäßig mit rund " + zahl(vZu * 3.6, 0) + " km/h.";
      } else if (p.FL > 1.03 * z.m * G) {
        satz = "Der Schirm ist offen: Der Luftwiderstand ist jetzt viel größer als das Gewicht und bremst kräftig ab.";
      } else {
        satz = "Mit offenem Schirm stellt sich eine neue, kleine Endgeschwindigkeit ein: etwa " + zahl(vAuf, 1) + " m/s (" + zahl(vAuf * 3.6, 0) + " km/h).";
      }
      teil.status.textContent = satz;
    }
    rechne();
    zeichne();
  }

  I.modell("schiefeEbene", schiefeEbene);
  I.modell("fallschirm", fallschirm);
})(window.Interaktiv);
