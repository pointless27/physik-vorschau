/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/energieerhaltung.html
   =========================================================================
   Modelle: halfpipe, federpendel.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/energieerhaltung.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      schoenerSchritt = I.schoenerSchritt, txt = I.txt, pfeil = I.pfeil,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, werteLeiste = I.werteLeiste,
      abspieler = I.abspieler, saeulen = I.saeulen,
      bahnMitTeilung = I.bahnMitTeilung, geruest = I.geruest;

  /* =======================================================================
     MODELL 10: HALFPIPE – Energieerhaltung mit und ohne Reibung
     Bahn z(x) = H (x/L)²; numerisch längs der Bahn integriert.
     ======================================================================= */
  function halfpipe(fig) {
    var L = 6, HMAX = 4, TMAX = 20, DT = 0.002;
    var z = { h0: 3, mu: 0.03, m: 60, t: 0 };
    var teil = geruest(fig);
    var daten = [];
    var flaeche = zeichenflaeche(teil.buehne, null, "Kugel in einer Halfpipe mit Energie-Säulen",
      function (b) { return begrenze(b * 0.46, 230, 320); }, zeichne);

    function hoehe(x) { return HMAX * (x / L) * (x / L); }
    function rechne() {
      daten = [];
      var x = -L * Math.sqrt(z.h0 / HMAX), v = 0, ruht = false;
      var E0 = z.m * G * z.h0;
      for (var i = 0; i <= TMAX / DT; i++) {
        var st = 2 * HMAX * x / (L * L), w = Math.sqrt(1 + st * st), sn = st / w, cs = 1 / w;
        if (i % 10 === 0) {
          var Ek = 0.5 * z.m * v * v, Ep = z.m * G * hoehe(x);
          daten.push({ x: x, v: v, Ek: Ek, Ep: Ep, Q: Math.max(0, E0 - Ek - Ep) });
        }
        if (ruht) continue;
        var a = -G * sn - (v > 0 ? 1 : v < 0 ? -1 : (sn > 0 ? -1 : 1)) * z.mu * G * cs;
        var vNeu = v + a * DT;
        if (v !== 0 && vNeu * v < 0 && Math.abs(sn) <= z.mu * cs) { v = 0; ruht = true; continue; }
        v = vNeu;
        x += v / w * DT;
      }
    }
    function punkt(t) { return daten[Math.max(0, Math.min(daten.length - 1, Math.round(t / (10 * DT))))]; }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, p = punkt(z.t);
      f.leeren();
      var breiteBahn = B * (B < 520 ? 0.62 : 0.68);
      var S = Math.min((breiteBahn - 20) / (2 * L), (H - 40) / HMAX);
      var mx = 10 + breiteBahn / 2, yB = H - 20;
      var X = function (x) { return mx + x * S; }, Y = function (zz) { return yB - zz * S; };
      var pkt = [];
      for (var i = 0; i <= 80; i++) { var x = -L + 2 * L * i / 80; pkt.push([X(x), Y(hoehe(x))]); }
      s("polyline", { "class": "kurve", points: linienzug(pkt) }, f.svg);
      s("line", { "class": "hilfslinie", x1: X(-L), y1: Y(z.h0), x2: X(L), y2: Y(z.h0) }, f.svg);
      txt(f.svg, X(L), Y(z.h0) - 5, "Starthöhe", "klein", "end");
      var st = 2 * HMAX * p.x / (L * L), w = Math.sqrt(1 + st * st), rk = 9;
      s("circle", { "class": "ball", cx: X(p.x) + st / w * rk, cy: Y(hoehe(p.x)) - rk / w, r: rk }, f.svg);

      /* Energie-Säulen */
      var E0 = z.m * G * z.h0, x0 = 10 + breiteBahn + 14, spalte = (B - x0 - 6) / 3;
      var skala = (H - 70) / (z.m * G * HMAX);
      saeulen(f.svg, x0, H - 36, spalte, skala, [
        { name: "Lage", wert: p.Ep, klasse: "" },
        { name: "Bewegung", wert: p.Ek, klasse: "kupfer" },
        { name: "Wärme", wert: p.Q, klasse: "grau" }
      ], H - 20);
      s("line", { "class": "hilfslinie", x1: x0, y1: H - 36 - E0 * skala, x2: B - 6, y2: H - 36 - E0 * skala }, f.svg);
      txt(f.svg, B - 6, H - 40 - E0 * skala, "gesamt", "klein", "end");
    }

    regler(teil.regler, {
      name: "Starthöhe", min: 0.5, max: 4, schritt: 0.1, wert: z.h0,
      anzeige: function (w) { return zahl(w, 1) + " m"; }
    }, function (w) { z.h0 = w; rechne(); zeichne(); });
    regler(teil.regler, {
      name: "Reibung μ", min: 0, max: 0.15, schritt: 0.01, wert: z.mu,
      anzeige: function (w) { return w === 0 ? "keine" : zahl(w, 2); }
    }, function (w) { z.mu = w; rechne(); zeichne(); });
    regler(teil.regler, {
      name: "Masse", min: 20, max: 100, schritt: 5, wert: z.m,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.m = w; rechne(); zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit t", min: 0, max: TMAX, schritt: 0.02, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Loslassen", faktor: 1,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["ep", "Lageenergie"], ["ek", "Bewegungsenergie"], ["q", "in Wärme umgewandelt"], ["v", "Geschwindigkeit"]
    ]);

    function zeichne() {
      var p = punkt(z.t);
      zeichneBuehne();
      werte.ep.textContent = zahl(p.Ep, 0) + " J";
      werte.ek.textContent = zahl(p.Ek, 0) + " J";
      werte.q.textContent = zahl(p.Q, 0) + " J";
      werte.v.textContent = zahl(Math.abs(p.v), 1) + " m/s";
      teil.status.textContent = z.mu === 0
        ? "Ohne Reibung pendelt die Kugel ewig hin und her und kommt immer wieder genau auf die Starthöhe: Lage- und Bewegungsenergie tauschen sich nur aus, die Summe bleibt gleich."
        : "Mit Reibung wird bei jeder Fahrt ein Teil der Energie zu Wärme. Die Summe aus allen drei Säulen bleibt aber immer gleich – Energie geht nicht verloren, sie wechselt nur die Form.";
    }
    rechne();
    zeichne();
  }

  /* =======================================================================
     MODELL 11: FEDERPENDEL – x = A cos(ωt), E_pot = ½ k x²
     ======================================================================= */
  function federpendel(fig) {
    var XMAX = 0.35;
    var z = { k: 50, m: 1, A: 0.2, f: 0.1 };
    var teil = geruest(fig);
    var szene = zeichenflaeche(teil.buehne, "ia-strasse", "Masse an einer waagerechten Feder",
      function (b) { return begrenze(b * 0.16, 110, 120); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var dE = zeichenflaeche(reihe, null, "Energie-Ort-Diagramm mit Parabel der Federenergie",
      function (b) { return begrenze(b * 0.36, 170, 220); }, zeichne);

    function omega() { return Math.sqrt(z.k / z.m); }
    function periode() { return 2 * Math.PI / omega(); }
    function lage() { var t = z.f * 2 * periode(); return { x: z.A * Math.cos(omega() * t), v: -z.A * omega() * Math.sin(omega() * t) }; }

    function zeichneSzene() {
      var f = szene, B = f.b, H = f.h, p = lage();
      f.leeren();
      var bahn = bahnMitTeilung(f, -XMAX - 0.3, XMAX + 0.08, 16, 16, 26), X = bahn.X, yS = bahn.y;
      s("line", { "class": "achse", x1: X(-XMAX - 0.25), y1: yS, x2: X(-XMAX - 0.25), y2: yS - 50 }, f.svg);
      s("line", { "class": "hilfslinie", x1: X(0), y1: yS, x2: X(0), y2: yS - 56 }, f.svg);
      var x1 = X(-XMAX - 0.25), x2 = X(p.x) - 18, n = 14, d = "M" + x1 + " " + (yS - 18);
      for (var i = 1; i < n; i++) d += "L" + (x1 + (x2 - x1) * i / n).toFixed(1) + " " + (yS - 18 + (i % 2 ? -8 : 8));
      d += "L" + x2 + " " + (yS - 18);
      s("path", { "class": "kurve duenn", d: d }, f.svg);
      s("rect", { "class": "wagen", x: X(p.x) - 18, y: yS - 34, width: 36, height: 34, rx: 2 }, f.svg);
      var kF = 120 / (z.k * XMAX);
      pfeil(f.svg, X(p.x), yS - 44, X(p.x) - z.k * p.x * kF, yS - 44, "kupfer");
      pfeil(f.svg, X(p.x), yS - 52, X(p.x) + p.v * 40, yS - 52, "blau");
    }

    function zeichneEnergie() {
      var f = dE, B = f.b, H = f.h, p = lage();
      f.leeren();
      var l = 46, r = 12, o = 26, u = 24, Emax = 0.5 * z.k * XMAX * XMAX;
      var X = function (x) { return l + (x + XMAX) / (2 * XMAX) * (B - l - r); };
      var Y = function (E) { return H - u - E / Emax * (H - o - u); };
      txt(f.svg, 4, 14, "Energie in J", "ia-titel");
      var schritt = schoenerSchritt(Emax, 3);
      for (var k = 0; k <= Emax + 1e-9; k += schritt) {
        s("line", { "class": "gitter", x1: l, y1: Y(k), x2: B - r, y2: Y(k) }, f.svg);
        txt(f.svg, l - 5, Y(k) + 4, zahl(k, schritt < 1 ? 1 : 0), "klein", "end");
      }
      [-0.3, 0, 0.3].forEach(function (x) { txt(f.svg, X(x), H - 6, zahl(x * 100, 0) + " cm", "klein", "middle"); });
      var pkt = [];
      for (var i = 0; i <= 80; i++) { var x = -XMAX + 2 * XMAX * i / 80; pkt.push([X(x), Y(0.5 * z.k * x * x)]); }
      s("polyline", { "class": "kurve", points: linienzug(pkt) }, f.svg);
      var Eg = 0.5 * z.k * z.A * z.A;
      s("line", { "class": "hilfslinie", x1: X(-z.A), y1: Y(Eg), x2: X(z.A), y2: Y(Eg) }, f.svg);
      txt(f.svg, X(z.A) + 4, Y(Eg) + 4, "gesamt", "klein");
      [-z.A, z.A].forEach(function (x) { s("line", { "class": "hilfslinie", x1: X(x), y1: Y(Eg), x2: X(x), y2: Y(0) }, f.svg); });
      var Ep = 0.5 * z.k * p.x * p.x;
      s("line", { "class": "kurve kupfer", x1: X(p.x), y1: Y(Ep), x2: X(p.x), y2: Y(Eg) }, f.svg);
      s("line", { "class": "kurve blau", x1: X(p.x), y1: Y(0), x2: X(p.x), y2: Y(Ep) }, f.svg);
      s("circle", { "class": "punkt", cx: X(p.x), cy: Y(Ep), r: 4.5 }, f.svg);
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r, y2: Y(0) }, f.svg);
      s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: Y(0) }, f.svg);
    }

    regler(teil.regler, {
      name: "Federkonstante k", min: 10, max: 200, schritt: 5, wert: z.k,
      anzeige: function (w) { return w + " N/m"; }
    }, function (w) { z.k = w; zeichne(); });
    regler(teil.regler, {
      name: "Masse m", min: 0.2, max: 5, schritt: 0.1, wert: z.m,
      anzeige: function (w) { return zahl(w, 1) + " kg"; }
    }, function (w) { z.m = w; zeichne(); });
    regler(teil.regler, {
      name: "Auslenkung A", min: 0.05, max: 0.3, schritt: 0.01, wert: z.A,
      anzeige: function (w) { return zahl(w * 100, 0) + " cm"; }
    }, function (w) { z.A = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeit (zwei Schwingungen)", min: 0, max: 1, schritt: 0.002, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * 2 * periode(), 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Schwingen lassen", faktor: 1,
      hole: function () { return z.f * 2 * periode(); },
      setze: function (t) { z.f = t / (2 * periode()); rZeit.setze(z.f); zeichne(); },
      ende: function () { return 2 * periode(); }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["T", "Schwingungsdauer"], ["eg", "Gesamtenergie"], ["ep", "Federenergie (blau)"], ["ek", "Bewegungsenergie (orange)"]
    ]);

    function zeichne() {
      var p = lage(), Eg = 0.5 * z.k * z.A * z.A, Ep = 0.5 * z.k * p.x * p.x;
      rZeit.auffrischen();
      zeichneSzene();
      zeichneEnergie();
      werte.T.textContent = zahl(periode(), 2) + " s";
      werte.eg.textContent = zahl(Eg, 2) + " J";
      werte.ep.textContent = zahl(Ep, 2) + " J";
      werte.ek.textContent = zahl(Eg - Ep, 2) + " J";
      teil.status.textContent = Math.abs(p.x) > 0.97 * z.A
        ? "Umkehrpunkt: Die Masse steht kurz still, die ganze Energie steckt in der gespannten Feder."
        : Math.abs(p.x) < 0.05 * z.A
          ? "Ruhelage: Die Feder ist entspannt, jetzt ist die ganze Energie Bewegungsenergie – die Masse ist am schnellsten."
          : "Federenergie (blau) und Bewegungsenergie (orange) ergeben zusammen immer dieselbe Gesamtenergie.";
    }
    zeichne();
  }

  I.modell("halfpipe", halfpipe);
  I.modell("federpendel", federpendel);
})(window.Interaktiv);
