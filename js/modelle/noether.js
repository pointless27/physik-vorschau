/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/noether.html
   =========================================================================
   Modelle: symmetrielabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/noether.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      zeitDiagramm = I.zeitDiagramm, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: SYMMETRIE-LABOR – Noether-Theorem                     (noether)
     Puck (m = 1 kg) gleitet reibungsfrei auf einer Fläche mit der
     potentiellen Energie V = ½ m (ωx² x² + ωy² y²). Exakte Lösung je Achse:
       x(t) = x0 cos ωt + (v0/ω) sin ωt   (ω = 0: x0 + v0 t).
     Ebene (ωx = ωy = 0): pₓ und L erhalten; Rinne (ωx = 0): nur pₓ;
     runde Mulde (ωx = ωy): nur L; ovale Mulde (ωy = 2ωx): keins von beiden.
     Die Energie ist immer erhalten (V hängt nicht von der Zeit ab).
     ======================================================================= */
  function symmetrielabor(fig) {
    var OM = 2 * Math.PI / 5, V0 = 0.25, X0 = -0.5, Y0 = 0.35, DAUER = 5, XW = 1.6, YW = 1;
    var LAND = [
      { name: "Ebene", wx: 0, wy: 0 },
      { name: "Rinne", wx: 0, wy: OM },
      { name: "Runde Mulde", wx: OM, wy: OM },
      { name: "Ovale Mulde", wx: OM, wy: 2 * OM }
    ];
    var z = { land: 1, alpha: 30, f: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Puck auf einer Fläche von oben gesehen, mit Höhenlinien der Landschaft und seiner Bahn",
      function (b) { return begrenze(b * 0.5, 210, 300); }, zeichne);
    var reihe = h("div", "ia-diagramme");
    teil.buehne.append(reihe);
    var dP = zeichenflaeche(reihe, null, "Impuls in x-Richtung über der Zeit",
      function (b) { return begrenze(b * 0.5, 140, 170); }, zeichne);
    var dL = zeichenflaeche(reihe, null, "Drehimpuls um die Mitte über der Zeit",
      function (b) { return begrenze(b * 0.5, 140, 170); }, zeichne);

    function achse(x0, v0, w, t) {
      return w === 0 ? [x0 + v0 * t, v0]
        : [x0 * Math.cos(w * t) + v0 / w * Math.sin(w * t), -x0 * w * Math.sin(w * t) + v0 * Math.cos(w * t)];
    }
    function zustand(t) {
      var la = LAND[z.land], a = z.alpha * Math.PI / 180;
      var X = achse(X0, V0 * Math.cos(a), la.wx, t), Y = achse(Y0, V0 * Math.sin(a), la.wy, t);
      return { x: X[0], vx: X[1], y: Y[0], vy: Y[1] };
    }
    function px(t) { return zustand(t).vx; }
    function Lz(t) { var q = zustand(t); return q.x * q.vy - q.y * q.vx; }
    function energie() {
      var q = zustand(0), la = LAND[z.land];
      return 0.5 * (q.vx * q.vx + q.vy * q.vy) + 0.5 * (la.wx * la.wx * q.x * q.x + la.wy * la.wy * q.y * q.y);
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, la = LAND[z.land], t = z.f * DAUER, i;
      f.leeren();
      var S = Math.min((B - 16) / (2 * XW), (H - 16) / (2 * YW)), cx = B / 2, cy = H / 2;
      var X = function (x) { return cx + x * S; }, Y = function (y) { return cy - y * S; };
      var id = "ia-clip-" + (I.neueNr());
      var clip = s("clipPath", { id: id }, s("defs", null, f.svg));
      s("rect", { x: X(-XW), y: Y(YW), width: 2 * XW * S, height: 2 * YW * S }, clip);
      s("rect", { "class": "flaeche", x: X(-XW), y: Y(YW), width: 2 * XW * S, height: 2 * YW * S, rx: 6 }, f.svg);
      var bild = s("g", { "clip-path": "url(#" + id + ")" }, f.svg);
      /* Höhenlinien der Landschaft */
      if (la.wy > 0 && la.wx === 0) {
        [0.25, 0.5, 0.75].forEach(function (y) {   // nicht bis an den Rand: dort stehen die Schilder
          s("line", { "class": "hilfslinie", x1: X(-XW), y1: Y(y), x2: X(XW), y2: Y(y) }, bild);
          s("line", { "class": "hilfslinie", x1: X(-XW), y1: Y(-y), x2: X(XW), y2: Y(-y) }, bild);
        });
        s("line", { "class": "gitter", x1: X(-XW), y1: Y(0), x2: X(XW), y2: Y(0) }, bild);
      } else if (la.wx > 0) {
        [0.3, 0.6, 0.9, 1.2, 1.5].forEach(function (rr) {
          s("ellipse", { "class": "hilfslinie", cx: X(0), cy: Y(0), rx: rr * S, ry: rr * la.wx / la.wy * S }, bild);
        });
      }
      s("circle", { "class": "punkt", cx: X(0), cy: Y(0), r: 2.5 }, bild);
      /* Bahn */
      var ganz = [], bisher = [];
      for (i = 0; i <= 200; i++) {
        var ti = i / 200 * DAUER, q = zustand(ti);
        ganz.push([X(q.x), Y(q.y)]);
        if (ti <= t) bisher.push([X(q.x), Y(q.y)]);
      }
      var qj = zustand(t);
      bisher.push([X(qj.x), Y(qj.y)]);
      s("polyline", { "class": "kurve schwach", points: linienzug(ganz) }, bild);
      s("polyline", { "class": "kurve blau", points: linienzug(bisher) }, bild);
      /* Kraft (kupfer) und Impuls (blau) */
      var fx = -la.wx * la.wx * qj.x, fy = -la.wy * la.wy * qj.y;
      pfeil(bild, X(qj.x), Y(qj.y), X(qj.x + fx * 0.25), Y(qj.y + fy * 0.25), "kupfer");
      pfeil(bild, X(qj.x), Y(qj.y), X(qj.x + qj.vx * 0.7), Y(qj.y + qj.vy * 0.7), "blau");
      s("circle", { "class": "ball", cx: X(qj.x), cy: Y(qj.y), r: 7 }, bild);
      txt(f.svg, X(-XW) + 6, Y(-YW) - 7, "Impuls", "blau klein halo");
      txt(f.svg, X(-XW) + 58, Y(-YW) - 7, "Kraft", "kupfer klein halo");
      txt(f.svg, X(XW) - 6, Y(YW) + 15, la.name, "klein halo", "end");
    }

    var knoepfe = auswahl(teil.bedienung, "Landschaft:", "Landschaft wählen",
      LAND.map(function (la) { return la.name; }), function (i) {
        spieler.stopp(); z.land = i; markiere(knoepfe, i); zeichne();
      });
    markiere(knoepfe, z.land);
    regler(teil.regler, {
      name: "Startrichtung", min: 0, max: 360, schritt: 5, wert: z.alpha,
      anzeige: function (w) { return w + "°"; }
    }, function (w) { spieler.stopp(); z.alpha = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeit", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * DAUER, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Anstoßen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * DAUER; },
      setze: function (t) { z.f = t / DAUER; rZeit.setze(z.f); zeichne(); },
      ende: function () { return DAUER; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["E", "Energie"], ["p", "Impuls pₓ erhalten?"], ["L", "Drehimpuls erhalten?"]
    ]);

    function zeichne() {
      var la = LAND[z.land], t = z.f * DAUER, pErh = la.wx === 0, LErh = la.wx === la.wy;
      rZeit.auffrischen();
      zeichneBuehne();
      zeitDiagramm(dP, px, "Impuls pₓ in kg·m/s", DAUER, t, {});
      zeitDiagramm(dL, Lz, "Drehimpuls um die Mitte in kg·m²/s", DAUER, t, {});
      werte.E.textContent = zahl(energie() * 1000, 1) + " mJ, bleibt gleich";
      werte.p.textContent = pErh ? "ja" : "nein";
      werte.L.textContent = LErh ? "ja" : "nein";
      teil.status.textContent = [
        "Auf der Ebene ist jede Stelle und jede Richtung gleichwertig: Impuls und Drehimpuls bleiben beide erhalten.",
        "Die Rinne sieht überall entlang x gleich aus – verschieben ändert nichts. Deshalb bleibt pₓ erhalten. " +
          "Drehen ändert die Rinne aber, und der Drehimpuls schwankt.",
        "Die runde Mulde sieht nach jeder Drehung um die Mitte gleich aus: Der Drehimpuls bleibt erhalten. " +
          "Verschieben ändert sie – pₓ schwankt.",
        "Die ovale Mulde ist weder verschiebbar noch drehbar, ohne sich zu ändern: Weder pₓ noch der Drehimpuls " +
          "bleiben erhalten. Nur die Energie – denn die Landschaft ändert sich nicht mit der Zeit."
      ][z.land];
    }
    zeichne();
  }

  I.modell("symmetrielabor", symmetrielabor);
})(window.Interaktiv);
