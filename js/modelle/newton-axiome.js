/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/newton-axiome.html
   =========================================================================
   Modelle: kraftlabor, skateboard.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/newton-axiome.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, regler = I.regler,
      knopf = I.knopf, werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      zeitDiagramm = I.zeitDiagramm, bahnMitTeilung = I.bahnMitTeilung,
      maennchen = I.maennchen, geruest = I.geruest;

  /* =======================================================================
     MODELL 4: KRAFT-LABOR – Kiste auf (reibungsfreiem) Eis
     Während der Schiebedauer wirkt F: a = F/m, danach ist a = 0 und die
     Kiste gleitet gleichförmig weiter (1. und 2. Newtonsches Axiom).
     ======================================================================= */
  function kraftlabor(fig) {
    var TMAX = 8;
    var z = { F: 60, m: 30, dauer: 2, t: 1.4 };
    var teil = geruest(fig);

    function beschl() { return z.F / z.m; }
    function geschw(t) { return beschl() * Math.min(t, z.dauer); }
    function ort(t) {
      var ts = Math.min(t, z.dauer);
      return 0.5 * beschl() * ts * ts + beschl() * z.dauer * Math.max(0, t - z.dauer);
    }
    function kraft(t) { return t < z.dauer ? z.F : 0; }

    var buehne = zeichenflaeche(teil.buehne, "ia-strasse",
      "Eine Kiste auf glattem Eis, die eine Person anschiebt",
      function (b) { return begrenze(b * 0.17, 122, 134); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var hoehe = function (b) { return begrenze(b * 0.62, 140, 175); };
    var dF = zeichenflaeche(reihe, null, "Kraft-Zeit-Diagramm", hoehe, zeichne);
    var dV = zeichenflaeche(reihe, null, "Geschwindigkeit-Zeit-Diagramm", hoehe, zeichne);

    function zeichneBuehne() {
      var f = buehne, B = f.b;
      f.leeren();
      var hi = Math.max(10, ort(TMAX) * 1.06);
      var bahn = bahnMitTeilung(f, -hi * 0.06, hi, 30, 30, 34);
      var X = bahn.X, yS = bahn.y;

      /* Eis: getönte Fläche unter der Bahn */
      s("rect", { "class": "flaeche", x: 8, y: yS, width: B - 16, height: 4 }, f.svg);
      for (var n = 0; n <= Math.floor(z.t + 1e-9); n++) {
        s("circle", { "class": "strobo", cx: X(ort(n)), cy: yS, r: 3.2 }, f.svg);
      }

      var x0 = X(ort(z.t)), schiebt = z.t < z.dauer && z.F > 0;
      s("rect", { "class": "wagen", x: x0 - 22, y: yS - 34, width: 44, height: 34, rx: 2 }, f.svg);
      txt(f.svg, x0, yS - 13, zahl(z.m, 0) + " kg", "klein", "middle");
      if (schiebt) maennchen(f.svg, x0 - 40, yS, 64, 1, 0.42);

      var kv = begrenze((B - 60) / 70, 2.5, 8);
      var v = geschw(z.t);
      if (pfeil(f.svg, x0, yS - 48, x0 + v * kv, yS - 48, "blau")) {
        txt(f.svg, x0 + v * kv + 6, yS - 44, "v", "blau");
      }
      if (schiebt) {
        /* Kraftpfeil über der Person, zeigt auf die Kiste */
        var kF = begrenze((B - 60) / 900, 0.3, 0.75);
        pfeil(f.svg, x0 - 22 - z.F * kF, yS - 72, x0 - 22, yS - 72, "kupfer");
        txt(f.svg, x0 - 22 - z.F * kF - 4, yS - 68, "F", "kupfer", "end");
      }
    }

    regler(teil.regler, {
      name: "Kraft F", min: 0, max: 120, schritt: 5, wert: z.F,
      anzeige: function (w) { return w + " N"; }
    }, function (w) { z.F = w; zeichne(); });
    regler(teil.regler, {
      name: "Masse m", min: 10, max: 120, schritt: 5, wert: z.m,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.m = w; zeichne(); });
    regler(teil.regler, {
      name: "Schiebedauer", min: 0, max: 5, schritt: 0.5, wert: z.dauer,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { z.dauer = w; zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit t", min: 0, max: TMAX, schritt: 0.05, wert: z.t,
      anzeige: function (w) { return zahl(w, 1) + " s"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Abspielen", faktor: 1,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["a", "Beschleunigung a = F/m"], ["v", "Geschwindigkeit v"], ["s", "Weg s"]
    ]);

    function zeichne() {
      zeichneBuehne();
      zeitDiagramm(dF, kraft, "Kraft F in N", TMAX, z.t, {});
      zeitDiagramm(dV, geschw, "Geschwindigkeit v in m/s", TMAX, z.t, {});
      var a = z.t < z.dauer ? beschl() : 0;
      werte.a.textContent = zahl(a, 2) + " m/s²";
      werte.v.textContent = zahl(geschw(z.t), 1) + " m/s";
      werte.s.textContent = zahl(ort(z.t), 1) + " m";
      if (z.F === 0 || z.dauer === 0) {
        teil.status.textContent = "Ohne Kraft bleibt die Kiste einfach liegen – ihr Bewegungszustand ändert sich nicht.";
      } else if (z.t < z.dauer) {
        teil.status.textContent = "Die Kraft von " + z.F + " N beschleunigt die " + z.m + "-kg-Kiste mit a = F/m = " +
          zahl(beschl(), 2) + " m/s²: Jede Sekunde wird sie um " + zahl(beschl(), 2) + " m/s schneller.";
      } else {
        teil.status.textContent = "Niemand schiebt mehr – und die Kiste gleitet trotzdem mit konstant " +
          zahl(geschw(z.t), 1) + " m/s weiter. Ohne Kraft ändert sich die Geschwindigkeit nicht.";
      }
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 5: SKATEBOARD-VERSUCH – actio = reactio
     Das Seil zieht beide Personen mit derselben Kraft F zueinander:
     a_A = F/m_A, a_B = F/m_B. Der Schwerpunkt bleibt in Ruhe.
     ======================================================================= */
  function skateboard(fig) {
    var D = 8, LUECKE = 1;                             // Startabstand und Abstand am Ende (m)
    var z = { mA: 60, mB: 80, F: 40, wer: "A", f: 0.6 };
    var teil = geruest(fig);

    function aA() { return z.F / z.mA; }
    function aB() { return z.F / z.mB; }
    function dauer() { return Math.sqrt(2 * (D - LUECKE) / (aA() + aB())); }
    function xA(t) { return 0.5 * aA() * t * t; }
    function xB(t) { return D - 0.5 * aB() * t * t; }

    var flaeche = zeichenflaeche(teil.buehne, null,
      "Zwei Personen auf Skateboards ziehen sich an einem Seil zueinander",
      function (b) { return begrenze(b * 0.3, 165, 230); }, zeichne);

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, t = z.f * dauer();
      f.leeren();
      var bahn = bahnMitTeilung(f, -1, D + 1, 16, 16, 34);
      var X = bahn.X, yS = bahn.y, S = (X(1) - X(0));
      var gr = begrenze(S * 1.45, 50, 105);          // Größe der Männchen in Pixeln
      var yBrett = yS - 0.12 * gr;

      /* Schwerpunkt: bleibt stehen */
      var xs = z.mB * D / (z.mA + z.mB);
      s("line", { "class": "hilfslinie", x1: X(xs), y1: yS, x2: X(xs), y2: yS - gr * 1.3 }, f.svg);
      txt(f.svg, X(xs), yS - gr * 1.3 - 5, "Schwerpunkt", "klein", "middle");

      var pa = X(xA(t)), pb = X(xB(t));
      [[pa, z.mA, 1, "A"], [pb, z.mB, -1, "B"]].forEach(function (p) {
        s("rect", { "class": "wagen", x: p[0] - 0.22 * gr, y: yBrett - 4, width: 0.44 * gr, height: 4, rx: 2 }, f.svg);
        s("circle", { "class": "rad", cx: p[0] - 0.15 * gr, cy: yBrett + 2.5, r: 2.8 }, f.svg);
        s("circle", { "class": "rad", cx: p[0] + 0.15 * gr, cy: yBrett + 2.5, r: 2.8 }, f.svg);
        var zieht = z.wer === "beide" || z.wer === p[3];
        p.push(maennchen(f.svg, p[0], yBrett - 4, gr, p[2], zieht ? 0.6 : 0.55).hand);
        txt(f.svg, p[0], yBrett - 4 - gr - 6, p[3] + ": " + p[1] + " kg" + (zieht ? " – zieht" : ""), "klein", "middle");
      });
      /* Seil zwischen den Händen */
      s("line", { "class": "kurve duenn", x1: pa + 0.26 * gr, y1: yBrett - 4 - 0.58 * gr, x2: pb - 0.26 * gr, y2: yBrett - 4 - 0.58 * gr }, f.svg);

      /* Kräfte (gleich groß, entgegengesetzt) und Geschwindigkeiten */
      var kF = begrenze(B / 900, 0.35, 0.8), yK = yBrett - 0.3 * gr;
      pfeil(f.svg, pa, yK, pa + z.F * kF, yK, "kupfer");
      pfeil(f.svg, pb, yK, pb - z.F * kF, yK, "kupfer");
      txt(f.svg, pa + z.F * kF + 4, yK + 4, "F", "kupfer klein");
      txt(f.svg, pb - z.F * kF - 4, yK + 4, "F", "kupfer klein", "end");
      var kv = S * 0.7, yV = yBrett - 0.15 * gr;
      pfeil(f.svg, pa, yV, pa + aA() * t * kv, yV, "blau");
      pfeil(f.svg, pb, yV, pb - aB() * t * kv, yV, "blau");
    }

    var wahl = h("div", "ia-umschalter");
    wahl.setAttribute("role", "group");
    wahl.setAttribute("aria-label", "Wer zieht am Seil?");
    var wahlKnoepfe = {
      A: knopf(wahl, "A zieht", null, function () { z.wer = "A"; zeichne(); }),
      B: knopf(wahl, "B zieht", null, function () { z.wer = "B"; zeichne(); }),
      beide: knopf(wahl, "Beide ziehen", null, function () { z.wer = "beide"; zeichne(); })
    };
    teil.bedienung.insertBefore(wahl, teil.regler);

    regler(teil.regler, {
      name: "Masse von A", min: 30, max: 120, schritt: 5, wert: z.mA,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.mA = w; zeichne(); });
    regler(teil.regler, {
      name: "Masse von B", min: 30, max: 120, schritt: 5, wert: z.mB,
      anzeige: function (w) { return w + " kg"; }
    }, function (w) { z.mB = w; zeichne(); });
    regler(teil.regler, {
      name: "Zugkraft im Seil F", min: 10, max: 100, schritt: 5, wert: z.F,
      anzeige: function (w) { return w + " N"; }
    }, function (w) { z.F = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * dauer(), 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Ziehen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); rZeit.setze(z.f); zeichne(); },
      ende: dauer
    });

    var werte = werteLeiste(teil.bedienung, [
      ["aA", "Beschleunigung A"], ["aB", "Beschleunigung B"], ["treff", "Treffpunkt (ab Start A)"]
    ]);

    function zeichne() {
      Object.keys(wahlKnoepfe).forEach(function (k) {
        wahlKnoepfe[k].setAttribute("aria-pressed", k === z.wer ? "true" : "false");
      });
      rZeit.auffrischen();
      zeichneBuehne();
      werte.aA.textContent = zahl(aA(), 2) + " m/s²";
      werte.aB.textContent = zahl(aB(), 2) + " m/s²";
      /* sie treffen sich am Schwerpunkt, denn der bleibt in Ruhe */
      werte.treff.textContent = zahl(z.mB * D / (z.mA + z.mB), 1) + " m";
      var wer = z.wer === "beide" ? "Beide ziehen" : z.wer + " zieht";
      var leichter = z.mA === z.mB ? "Bei gleichen Massen treffen sie sich genau in der Mitte."
        : (z.mA < z.mB ? "A" : "B") + " ist leichter und wird deshalb stärker beschleunigt.";
      teil.status.textContent = wer + " – und trotzdem passiert genau dasselbe: Das Seil zieht beide mit " +
        z.F + " N zueinander. " + leichter;
    }
    zeichne();
  }

  I.modell("kraftlabor", kraftlabor);
  I.modell("skateboard", skateboard);
})(window.Interaktiv);
