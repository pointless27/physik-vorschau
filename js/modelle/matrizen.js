/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/matrizen.html
   =========================================================================
   Modelle: matrixlabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/matrizen.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, knopf = I.knopf,
      werteLeiste = I.werteLeiste, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: MATRIX-LABOR – eine 2×2-Matrix als Abbildung der Ebene
     (rechenmethoden/matrizen). Die Spalten von M sind die Bilder der
     Einheitsvektoren; ihre Spitzen lassen sich ziehen (Raster 0,5).
     Gezeigt: verformtes Gitter, Bild des Einheitsquadrats (Fläche = |det M|)
     und Bild eines „F“ (macht Spiegelungen sichtbar).
     ======================================================================= */
  function matrixlabor(fig) {
    var C30 = Math.cos(Math.PI / 6), S30 = 0.5;
    var VORLAGEN = [
      { name: "Streckung", s1: [2, 0], s2: [0, 1] },
      { name: "Scherung", s1: [1, 0], s2: [1, 1] },
      { name: "Drehung 30°", s1: [C30, S30], s2: [-S30, C30] },
      { name: "Spiegelung", s1: [-1, 0], s2: [0, 1] },
      { name: "Zusammenklappen", s1: [1, 0.5], s2: [2, 1] }
    ];
    var START = { s1: [1.5, 0.5], s2: [0.5, 1.5] };
    var FIGUR = [[0.2, 0.15], [0.4, 0.15], [0.4, 0.42], [0.65, 0.42], [0.65, 0.56], [0.4, 0.56],
                 [0.4, 0.7], [0.8, 0.7], [0.8, 0.85], [0.2, 0.85]];
    var z = { s1: START.s1.slice(), s2: START.s2.slice(), vorlage: -1 };
    var teil = geruest(fig);
    var w = null, ebene = null, griffe = {};
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Koordinatengitter, das von einer 2×2-Matrix verformt wird; die Bilder der beiden Einheitsvektoren lassen sich verschieben",
      function (b) { return begrenze(b * 0.62, 280, 420); }, aufbau);

    function X(x) { return w.ox + x * w.S; }
    function Y(y) { return w.oy - y * w.S; }
    function bild(p) { return [z.s1[0] * p[0] + z.s2[0] * p[1], z.s1[1] * p[0] + z.s2[1] * p[1]]; }
    function P(p) { var q = bild(p); return X(q[0]).toFixed(1) + " " + Y(q[1]).toFixed(1); }
    /* Zahl kurz: ganze und halbe Zahlen ohne Nullen, sonst zwei Stellen */
    function kurz(v) {
      var t = zahl(v, 2);
      return t.indexOf(",") < 0 ? t : t.replace(/0+$/, "").replace(/,$/, "");
    }
    function paar(v) { return "(" + kurz(v[0]) + " | " + kurz(v[1]) + ")"; }

    function aufbau() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = begrenze(Math.min((B - 24) / 7, (H - 24) / 6), 24, 60);
      w = { S: S, ox: Math.round(B / 2), oy: Math.round(H / 2) };
      w.nx = Math.floor((B / 2 - 16) / S);
      w.ny = Math.floor((H / 2 - 16) / S);
      var g = s("g", null, f.svg), i, x, y;
      for (i = -w.nx - 1; i <= w.nx + 1; i++) {
        x = X(i);
        if (x > 2 && x < B - 2) s("line", { "class": i === 0 ? "achse" : "gitter", x1: x, y1: 2, x2: x, y2: H - 2 }, g);
      }
      for (i = -w.ny - 1; i <= w.ny + 1; i++) {
        y = Y(i);
        if (y > 2 && y < H - 2) s("line", { "class": i === 0 ? "achse" : "gitter", x1: 2, y1: y, x2: B - 2, y2: y }, g);
      }
      txt(g, B - 8, w.oy - 6, "x", "klein", "end");
      txt(g, w.ox + 6, 14, "y", "klein");
      txt(g, X(1), w.oy + 14, "1", "klein", "middle");
      txt(g, w.ox - 5, Y(1) + 4, "1", "klein", "end");
      ebene = s("g", null, f.svg);

      ["s1", "s2"].forEach(function (k) {
        var c = s("circle", { "class": "griff" + (k === "s2" ? " kupfer" : ""), r: 14, tabindex: 0, role: "slider" }, f.svg);
        var aktiv = false;
        c.addEventListener("pointerdown", function (e) {
          aktiv = true;
          c.classList.add("zieht");
          if (c.setPointerCapture) c.setPointerCapture(e.pointerId);
          e.preventDefault();
        });
        c.addEventListener("pointermove", function (e) {
          if (!aktiv) return;
          var r = f.svg.getBoundingClientRect();
          var px = (e.clientX - r.left) * f.b / r.width, py = (e.clientY - r.top) * f.h / r.height;
          setze(k, Math.round(2 * (px - w.ox) / w.S) / 2, Math.round(2 * (w.oy - py) / w.S) / 2);
        });
        function los() { aktiv = false; c.classList.remove("zieht"); }
        c.addEventListener("pointerup", los);
        c.addEventListener("pointercancel", los);
        c.addEventListener("keydown", function (e) {
          var d = { ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0], ArrowUp: [0, 0.5], ArrowDown: [0, -0.5] }[e.key];
          if (!d) return;
          e.preventDefault();
          /* nach einer Vorlage mit krummen Werten (Drehung) aufs Raster */
          setze(k, Math.round(2 * (z[k][0] + d[0])) / 2, Math.round(2 * (z[k][1] + d[1])) / 2);
        });
        griffe[k] = c;
      });
      zeichne();
    }

    function setze(k, x, y) {
      x = begrenze(x, -w.nx, w.nx);
      y = begrenze(y, -w.ny, w.ny);
      if (x === z[k][0] && y === z[k][1]) return;
      z[k] = [x, y];
      z.vorlage = -1;
      zeichne();
    }

    /* Beschriftung „M êx“ hinter der Pfeilspitze, im Bild gehalten */
    function schild(v, index, klasse) {
      var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      var ux = l ? v[0] / l : -0.7, uy = l ? v[1] / l : -0.7;
      var px = begrenze(X(v[0]) + ux * 26, 20, flaeche.b - 20);
      var py = begrenze(Y(v[1]) - uy * 26 + 4, 16, flaeche.h - 8);
      txtIndex(ebene, px, py, "M ê", index, "halo " + klasse, "middle");
    }

    var vorlagen = auswahl(teil.bedienung, "Beispiel", "Typische Matrizen zum Ausprobieren",
      VORLAGEN.map(function (v) { return v.name; }), function (i) {
        z.s1 = VORLAGEN[i].s1.slice();
        z.s2 = VORLAGEN[i].s2.slice();
        z.vorlage = i;
        zeichne();
      });
    knopf(teil.knoepfe, "Zurücksetzen", null, function () {
      z.s1 = START.s1.slice(); z.s2 = START.s2.slice(); z.vorlage = -1; zeichne();
    });
    var werte = werteLeiste(teil.bedienung, [["m", "Matrix M"], ["s1", "1. Spalte = M êx"],
      ["s2", "2. Spalte = M êy"], ["det", "det M = Flächenfaktor"]]);

    function zeigeMatrix() {
      var dd = werte.m, g = h("span", "ia-matrix");
      dd.textContent = "";
      [z.s1[0], z.s2[0], z.s1[1], z.s2[1]].forEach(function (v) { g.append(h("span", null, kurz(v))); });
      dd.append(g);
    }

    function zeichne() {
      if (!w) return;
      markiere(vorlagen, z.vorlage);
      while (ebene.firstChild) ebene.removeChild(ebene.firstChild);
      var a = z.s1, b = z.s2, K = 12, k;
      var det = a[0] * b[1] - b[0] * a[1];
      if (Math.abs(det) < 1e-9) det = 0;

      /* verformtes Gitter: Bilder der Linien x = k und y = k */
      var gg = s("g", null, ebene);
      for (k = -K; k <= K; k++) {
        s("path", { "class": "gitter bild", d: "M" + P([k, -K]) + "L" + P([k, K]) }, gg);
        s("path", { "class": "gitter bild", d: "M" + P([-K, k]) + "L" + P([K, k]) }, gg);
      }
      /* vorher: Einheitsquadrat und F gestrichelt */
      s("path", { "class": "hilfslinie", d: "M" + X(0) + " " + Y(0) + "H" + X(1) + "V" + Y(1) + "H" + X(0) + "Z" }, ebene);
      s("path", {
        "class": "figur vorher",
        d: "M" + FIGUR.map(function (p) { return X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); }).join("L") + "Z"
      }, ebene);
      /* nachher: Parallelogramm und F */
      s("path", { "class": "flaeche", d: "M" + P([0, 0]) + "L" + P([1, 0]) + "L" + P([1, 1]) + "L" + P([0, 1]) + "Z" }, ebene);
      s("path", { "class": "kurve blau duenn", d: "M" + P([1, 0]) + "L" + P([1, 1]) + "L" + P([0, 1]) }, ebene);
      if (det !== 0) {
        s("path", { "class": "figur", d: "M" + FIGUR.map(P).join("L") + "Z" }, ebene);
      } else {
        /* zusammengeklappt: das F wird zu einer Strecke */
        s("path", { "class": "kurve kupfer", d: "M" + FIGUR.map(P).join("L") + "Z" }, ebene);
      }

      var O = [X(0), Y(0)];
      pfeil(ebene, O[0], O[1], X(a[0]), Y(a[1]), "blau");
      pfeil(ebene, O[0], O[1], X(b[0]), Y(b[1]), "kupfer");
      schild(a, "x", "blau");
      schild(b, "y", "kupfer");
      [["s1", a], ["s2", b]].forEach(function (e) {
        var c = griffe[e[0]], nr = e[0] === "s1" ? "1. Spalte (Bild von ê x)" : "2. Spalte (Bild von ê y)";
        c.setAttribute("cx", X(e[1][0]).toFixed(1));
        c.setAttribute("cy", Y(e[1][1]).toFixed(1));
        c.setAttribute("aria-valuenow", e[1][0]);
        c.setAttribute("aria-valuetext", nr + " = " + paar(e[1]));
        c.setAttribute("aria-label", nr + ", mit den Pfeiltasten verschieben");
      });

      zeigeMatrix();
      werte.s1.textContent = paar(a);
      werte.s2.textContent = paar(b);
      werte.det.textContent = kurz(a[0]) + "·" + (b[1] < 0 ? "(" + kurz(b[1]) + ")" : kurz(b[1])) + " − " +
        (b[0] < 0 ? "(" + kurz(b[0]) + ")" : kurz(b[0])) + "·" + (a[1] < 0 ? "(" + kurz(a[1]) + ")" : kurz(a[1])) +
        " = " + kurz(det);

      var la = Math.sqrt(a[0] * a[0] + a[1] * a[1]), lb = Math.sqrt(b[0] * b[0] + b[1] * b[1]);
      var ortho = Math.abs(la - 1) < 1e-6 && Math.abs(lb - 1) < 1e-6 && Math.abs(a[0] * b[0] + a[1] * b[1]) < 1e-6;
      var status;
      if (det === 0) {
        status = "Die beiden Spalten liegen auf einer Geraden: Die ganze Ebene wird auf eine Linie gequetscht, " +
          "das Quadrat hat keine Fläche mehr – det M = 0. Diese Abbildung lässt sich nicht rückgängig machen, M hat keine Inverse.";
      } else if (ortho && det > 0) {
        status = "Eine Drehung: Längen und Winkel bleiben erhalten, die Fläche auch (det M = 1). " +
          "Die Spalten sind senkrechte Einheitsvektoren; die Inverse ist einfach die Transponierte.";
      } else if (ortho) {
        status = "Eine Spiegelung: Längen und Winkel bleiben erhalten, aber das F ist seitenverkehrt – deshalb ist det M = −1.";
      } else if (det < 0) {
        status = "det M ist negativ: Das F erscheint seitenverkehrt, die Abbildung enthält eine Spiegelung. " +
          "Flächen werden mit |det M| = " + kurz(-det) + " multipliziert.";
      } else if (Math.abs(det - 1) < 1e-9) {
        status = "det M = 1: Die Form ändert sich, die Fläche aber nicht – das Parallelogramm ist genau so groß wie das Quadrat.";
      } else {
        status = "Das Einheitsquadrat (Fläche 1) wird zum Parallelogramm mit der Fläche det M = " + kurz(det) +
          ". Jede andere Fläche wird um denselben Faktor " + (det > 1 ? "vergrößert" : "verkleinert") +
          ". Das F bleibt richtig herum lesbar.";
      }
      teil.status.textContent = status;
    }

    aufbau();
  }

  I.modell("matrixlabor", matrixlabor);
})(window.Interaktiv);
