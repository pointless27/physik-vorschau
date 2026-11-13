/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/impuls-schwerpunkt.html
   =========================================================================
   Modelle: rueckstoss, rakete.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/impuls-schwerpunkt.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, regler = I.regler,
      knopf = I.knopf, werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      zeitDiagramm = I.zeitDiagramm, bahnMitTeilung = I.bahnMitTeilung,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 12: RÜCKSTOSS AUF DER LUFTKISSENBAHN
     Gesamtimpuls bleibt null: m1 v1 = −m2 v2; E_Feder = ½ m1 v1² + ½ m2 v2²
     ======================================================================= */
  function rueckstoss(fig) {
    var BAHN = 2, W = 0.12;                            // Bahnlänge und Gleiterbreite in m
    var z = { m1: 0.2, m2: 0.4, E: 0.3, f: 0.5 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, "ia-strasse", "Zwei Gleiter, die eine Feder auseinanderstößt",
      function (b) { return begrenze(b * 0.17, 120, 130); }, zeichne);

    function v1() { return -Math.sqrt(2 * z.E * z.m2 / (z.m1 * (z.m1 + z.m2))); }
    function v2() { return Math.sqrt(2 * z.E * z.m1 / (z.m2 * (z.m1 + z.m2))); }
    function dauer() { return Math.min((1 - W / 2 - 0.05 - W / 2) / -v1(), (1 - W / 2 - 0.05 - W / 2) / v2()); }

    function zeichneBuehne() {
      var f = flaeche, t = z.f * dauer();
      f.leeren();
      var bahn = bahnMitTeilung(f, 0, BAHN, 16, 16, 26), X = bahn.X, yS = bahn.y;
      for (var q = 0.05; q < BAHN; q += 0.1) s("circle", { "class": "strobo", cx: X(q), cy: yS + 2, r: 1.2 }, f.svg);
      var x1 = 1 - W / 2 + v1() * t, x2 = 1 + W / 2 + v2() * t;
      var xs = (z.m1 * x1 + z.m2 * x2) / (z.m1 + z.m2);
      s("line", { "class": "hilfslinie", x1: X(xs), y1: yS, x2: X(xs), y2: yS - 74 }, f.svg);
      txt(f.svg, X(xs), yS - 78, "Schwerpunkt", "klein", "middle");
      [[x1, z.m1], [x2, z.m2]].forEach(function (g) {
        var hoehe = 16 + 22 * g[1];
        s("rect", { "class": "wagen", x: X(g[0] - W / 2), y: yS - hoehe, width: X(W) - X(0), height: hoehe, rx: 2 }, f.svg);
        txt(f.svg, X(g[0]), yS - hoehe / 2 + 4, zahl(g[1] * 1000, 0) + " g", "klein", "middle");
      });
      if (t < 0.02) {
        s("path", { "class": "kurve kupfer duenn", d: "M" + X(x1 + W / 2) + " " + (yS - 10) + "l3 -5l3 10l3 -10l3 10l3 -5" }, f.svg);
      } else {
        var kv = 50;
        pfeil(f.svg, X(x1), yS - 50, X(x1) + v1() * kv, yS - 50, "blau");
        pfeil(f.svg, X(x2), yS - 50, X(x2) + v2() * kv, yS - 50, "blau");
      }
    }

    regler(teil.regler, {
      name: "Masse links m₁", min: 0.1, max: 1, schritt: 0.05, wert: z.m1,
      anzeige: function (w) { return zahl(w * 1000, 0) + " g"; }
    }, function (w) { z.m1 = w; zeichne(); });
    regler(teil.regler, {
      name: "Masse rechts m₂", min: 0.1, max: 1, schritt: 0.05, wert: z.m2,
      anzeige: function (w) { return zahl(w * 1000, 0) + " g"; }
    }, function (w) { z.m2 = w; zeichne(); });
    regler(teil.regler, {
      name: "Energie der Feder", min: 0.05, max: 1, schritt: 0.05, wert: z.E,
      anzeige: function (w) { return zahl(w, 2) + " J"; }
    }, function (w) { z.E = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * dauer(), 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Faden durchtrennen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); rZeit.setze(z.f); zeichne(); },
      ende: dauer
    });

    var werte = werteLeiste(teil.bedienung, [
      ["v", "Geschwindigkeiten"], ["p", "Impulse"], ["e", "Energie links / rechts"]
    ]);

    function zeichne() {
      rZeit.auffrischen();
      zeichneBuehne();
      werte.v.textContent = zahl(v1(), 2) + " | " + zahl(v2(), 2) + " m/s";
      werte.p.textContent = zahl(z.m1 * v1(), 3) + " | " + zahl(z.m2 * v2(), 3) + " kg·m/s";
      werte.e.textContent = zahl(0.5 * z.m1 * v1() * v1(), 2) + " | " + zahl(0.5 * z.m2 * v2() * v2(), 2) + " J";
      teil.status.textContent = "Vorher ruhen beide, der Gesamtimpuls ist null – und das bleibt er: Beide Impulse sind gleich groß und entgegengesetzt. " +
        (z.m1 === z.m2 ? "Bei gleichen Massen sind auch die Geschwindigkeiten gleich."
          : "Der leichtere Gleiter ist schneller und bekommt auch den größeren Teil der Federenergie.");
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 13: RAKETE – Raketengleichung Δv = v_rel ln(M_i/M_f)
     ======================================================================= */
  function rakete(fig) {
    var TB = 10;                                       // Brenndauer im Modell (s)
    var z = { vrel: 3, verh: 4, t: 6 };
    var teil = geruest(fig);
    var sterne = [];
    for (var i = 0; i < 40; i++) sterne.push([Math.random(), Math.random()]);
    var szene = zeichenflaeche(teil.buehne, "ia-strasse", "Rakete im Weltall, die Treibstoff ausstößt",
      function (b) { return begrenze(b * 0.18, 120, 140); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var dV = zeichenflaeche(reihe, null, "Geschwindigkeit der Rakete über der Zeit",
      function (b) { return begrenze(b * 0.36, 160, 200); }, zeichne);

    function masse(t) { return 1 - (1 - 1 / z.verh) * Math.min(t, TB) / TB; }   // relativ zur Startmasse
    function geschw(t) { return z.vrel * Math.log(1 / masse(t)); }                  // km/s
    function weg(t) { var s0 = 0, n = 60; for (var i = 0; i < n; i++) s0 += geschw((i + 0.5) * t / n) * t / n; return s0; }

    function zeichneSzene() {
      var f = szene, B = f.b, H = f.h, t = z.t;
      f.leeren();
      var versatz = weg(t) * 120;
      sterne.forEach(function (st) {
        var x = ((st[0] * B - versatz) % B + B) % B;
        s("circle", { "class": "strobo", cx: x, cy: 8 + st[1] * (H - 16), r: 1.3 }, f.svg);
      });
      var cx = B * 0.55, cy = H / 2, lang = 120, dick = 30;
      var anteil = (masse(t) - 1 / z.verh) / (1 - 1 / z.verh);
      s("path", { "class": "wagen", d: "M" + (cx - lang / 2) + " " + (cy - dick / 2) + "H" + (cx + lang / 2 - 22) + "L" + (cx + lang / 2) + " " + cy +
        "L" + (cx + lang / 2 - 22) + " " + (cy + dick / 2) + "H" + (cx - lang / 2) + "Z" }, f.svg);
      var tank = (lang - 34) * anteil;
      if (tank > 0.5) s("rect", { "class": "balken kupfer", x: cx - lang / 2 + 4, y: cy - dick / 2 + 5, width: tank, height: dick - 10 }, f.svg);
      if (t < TB) {
        s("path", { "class": "kurve kupfer", d: "M" + (cx - lang / 2) + " " + (cy - 7) + "L" + (cx - lang / 2 - 26 - 6 * z.vrel) + " " + cy + "L" + (cx - lang / 2) + " " + (cy + 7) }, f.svg);
      }
      txt(f.svg, 8, 16, "Treibstoff: " + zahl(anteil * 100, 0) + " %", "klein");
    }

    regler(teil.regler, {
      name: "Ausströmgeschwindigkeit des Gases", min: 1, max: 4.5, schritt: 0.1, wert: z.vrel,
      anzeige: function (w) { return zahl(w, 1) + " km/s"; }
    }, function (w) { z.vrel = w; zeichne(); });
    regler(teil.regler, {
      name: "Massenverhältnis Start / leer", min: 1.5, max: 20, schritt: 0.5, wert: z.verh,
      anzeige: function (w) { return zahl(w, 1) + " (" + zahl((1 - 1 / w) * 100, 0) + " % Treibstoff)"; }
    }, function (w) { z.verh = w; zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit (Brenndauer im Modell 10 s)", min: 0, max: TB, schritt: 0.05, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Zünden", faktor: 1, vonVorn: true,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TB; }
    });

    var werte = werteLeiste(teil.bedienung, [["v", "Geschwindigkeit jetzt"], ["dv", "nach Brennschluss Δv"]]);

    function zeichne() {
      zeichneSzene();
      // PRÜFEN: 7,9 km/s = erste kosmische Geschwindigkeit (Kreisbahn knapp über der Erdoberfläche)
      zeitDiagramm(dV, geschw, "Geschwindigkeit v in km/s", TB, z.t, { linie: [7.9, "Kreisbahn um die Erde: 7,9 km/s"] });
      werte.v.textContent = zahl(geschw(z.t), 2) + " km/s";
      werte.dv.textContent = zahl(geschw(TB), 2) + " km/s";
      teil.status.textContent = "Die Rakete wird immer schneller schneller, weil sie leichter wird. Aber: Doppelt so viel Treibstoff bringt nicht " +
        "doppelt so viel Tempo – die Endgeschwindigkeit wächst nur mit dem Logarithmus des Massenverhältnisses. " +
        (geschw(TB) < 7.9 ? "Für eine Erdumlaufbahn reicht das noch nicht." : "Das reicht (ohne Luft und Schwerkraft gerechnet) für eine Erdumlaufbahn.");
    }
    zeichne();
  }

  I.modell("rueckstoss", rueckstoss);
  I.modell("rakete", rakete);
})(window.Interaktiv);
