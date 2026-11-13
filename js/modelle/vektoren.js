/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/vektoren.html
   =========================================================================
   Modelle: vektorlabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/vektoren.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, knopf = I.knopf,
      werteLeiste = I.werteLeiste, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: VEKTOR-LABOR  (rechenmethoden/vektoren)
     Zwei Vektoren a, b in der xy-Ebene; ihre Spitzen lassen sich ziehen
     (Raster 1) oder per Tastatur verschieben (Tab, Pfeiltasten).
       Summe          a + b mit Parallelogramm, |a + b| ≤ |a| + |b|
       Skalarprodukt  a·b = ax·bx + ay·by = |a||b| cos α, Schatten von b auf a
       Kreuzprodukt   (a × b)z = ax·by − ay·bx = ± Fläche des Parallelogramms
                      (positiv: zeigt aus dem Bildschirm heraus)
     ======================================================================= */
  function vektorlabor(fig) {
    var START = { a: [4, 1], b: [1, 3] };
    var z = { a: START.a.slice(), b: START.b.slice(), modus: 0 };
    var teil = geruest(fig);
    var w = null, ebene = null, griffe = {};
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Koordinatengitter mit den Vektoren a und b, deren Spitzen sich verschieben lassen",
      function (b) { return begrenze(b * 0.62, 270, 400); }, aufbau);

    function X(x) { return w.ox + x * w.S; }
    function Y(y) { return w.oy - y * w.S; }
    function betrag(v) { return Math.sqrt(v[0] * v[0] + v[1] * v[1]); }
    function kl(n) { return n < 0 ? "(" + zahl(n, 0) + ")" : zahl(n, 0); }
    function paar(v) { return "(" + zahl(v[0], 0) + " | " + zahl(v[1], 0) + ")"; }

    /* Gitter, Achsen und Griffe – nur bei Größenänderung neu */
    function aufbau() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = begrenze(Math.min((B - 24) / 13, (H - 24) / 9), 22, 46);
      w = { S: S, ox: Math.round(B / 2), oy: Math.round(H / 2) };
      w.nx = Math.floor((B / 2 - 16) / S);
      w.ny = Math.floor((H / 2 - 16) / S);
      ["a", "b"].forEach(function (k) {
        z[k] = [begrenze(z[k][0], -w.nx, w.nx), begrenze(z[k][1], -w.ny, w.ny)];
      });
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

      ["a", "b"].forEach(function (k) {
        var c = s("circle", { "class": "griff" + (k === "b" ? " kupfer" : ""), r: 14, tabindex: 0, role: "slider" }, f.svg);
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
          setze(k, Math.round((px - w.ox) / w.S), Math.round((w.oy - py) / w.S));
        });
        function los() { aktiv = false; c.classList.remove("zieht"); }
        c.addEventListener("pointerup", los);
        c.addEventListener("pointercancel", los);
        c.addEventListener("keydown", function (e) {
          var d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
          if (!d) return;
          e.preventDefault();
          setze(k, z[k][0] + d[0], z[k][1] + d[1]);
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
      zeichne();
    }

    /* Beschriftung hinter der Pfeilspitze, im Bild gehalten */
    function schild(v, inhalt, klasse) {
      var l = betrag(v), ux = l ? v[0] / l : -0.7, uy = l ? v[1] / l : -0.7;
      var px = begrenze(X(v[0]) + ux * 24, 12, flaeche.b - 12);
      var py = begrenze(Y(v[1]) - uy * 24 + 4, 16, flaeche.h - 6);
      var t = txt(ebene, px, py, inhalt, "halo " + klasse, "middle");
      t.setAttribute("font-style", "italic");
    }

    /* Winkelbogen von a nach b (kürzerer Weg), optional mit Drehpfeil */
    function bogen(a, b, r, mitPfeil, mitAlpha) {
      var ta = Math.atan2(a[1], a[0]), tb = Math.atan2(b[1], b[0]);
      var d = tb - ta;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d <= -Math.PI) d += 2 * Math.PI;
      if (Math.abs(d) < 0.05) return;
      var P = function (t, rr) { return [w.ox + rr * Math.cos(t), w.oy - rr * Math.sin(t)]; };
      var p0 = P(ta, r), p1 = P(tb, r);
      s("path", {
        "class": "achse",
        d: "M" + p0[0].toFixed(1) + " " + p0[1].toFixed(1) + "A" + r + " " + r + " 0 0 " + (d > 0 ? 0 : 1) +
           " " + p1[0].toFixed(1) + " " + p1[1].toFixed(1)
      }, ebene);
      if (mitPfeil && Math.abs(d) > 0.45) {
        var q = P(tb - 0.35 * Math.sign(d), r);
        pfeil(ebene, q[0], q[1], p1[0], p1[1], "duenn text");
      }
      if (mitAlpha) {
        var m = P(ta + d / 2, r + 12);
        txt(ebene, m[0], m[1] + 4, "α", "klein halo", "middle");
      }
    }

    var ansicht = auswahl(teil.bedienung, "Ansicht", "Welche Verknüpfung gezeigt wird",
      ["Summe", "Skalarprodukt", "Kreuzprodukt"], function (i) { z.modus = i; zeichne(); });
    knopf(teil.knoepfe, "Zurücksetzen", null, function () {
      z.a = START.a.slice(); z.b = START.b.slice(); zeichne();
    });
    var werte = werteLeiste(teil.bedienung, [["a", "Vektor a"], ["b", "Vektor b"], ["w1", ""], ["w2", ""], ["w3", ""]]);
    function wert(k, titel, inhalt) {
      werte[k].previousSibling.textContent = titel;
      werte[k].textContent = inhalt;
    }

    function zeichne() {
      if (!w) return;
      markiere(ansicht, z.modus);
      while (ebene.firstChild) ebene.removeChild(ebene.firstChild);
      var a = z.a, b = z.b, O = [X(0), Y(0)], A = [X(a[0]), Y(a[1])], Bp = [X(b[0]), Y(b[1])];
      var su = [a[0] + b[0], a[1] + b[1]], Sm = [X(su[0]), Y(su[1])];
      var la = betrag(a), lb = betrag(b);
      var dot = a[0] * b[0] + a[1] * b[1], kreuz = a[0] * b[1] - a[1] * b[0];
      var alpha = la && lb ? Math.acos(begrenze(dot / (la * lb), -1, 1)) * 180 / Math.PI : null;
      var status;

      if (z.modus === 0) {
        pfeil(ebene, A[0], A[1], Sm[0], Sm[1], "kupfer duenn");
        pfeil(ebene, Bp[0], Bp[1], Sm[0], Sm[1], "blau duenn");
        pfeil(ebene, O[0], O[1], Sm[0], Sm[1], "text");
        if (betrag(su) > 0) schild(su, "a + b", "");
        wert("w1", "a + b", paar(su));
        wert("w2", "Länge |a + b|", zahl(betrag(su), 2));
        wert("w3", "|a| + |b|", zahl(la + lb, 2));
        if (!la || !lb) status = "Ein Nullvektor ändert die Summe nicht.";
        else if (!betrag(su)) status = "b ist der Gegenvektor von a: Die Summe ist der Nullvektor.";
        else if (!kreuz && dot > 0) status = "a und b zeigen in dieselbe Richtung – nur dann ist die Summe so lang wie beide zusammen.";
        else status = "Erst a, dann b – oder erst b, dann a (dünne Pfeile): Beide Wege enden an derselben Spitze. " +
          "Die Summe ist kürzer als |a| + |b|, weil die Pfeile nicht in dieselbe Richtung zeigen.";
      } else if (z.modus === 1) {
        if (la) {
          var ux = a[0] / la, uy = a[1] / la, t = dot / la, L = 60;
          var F = [X(ux * t), Y(uy * t)];
          s("line", { "class": "hilfslinie", x1: X(-ux * L), y1: Y(-uy * L), x2: X(ux * L), y2: Y(uy * L) }, ebene);
          s("line", { "class": "schatten", x1: O[0], y1: O[1], x2: F[0], y2: F[1] }, ebene);
          var dx = Bp[0] - F[0], dy = Bp[1] - F[1], dl = Math.sqrt(dx * dx + dy * dy);
          if (lb && dl > 12) {
            s("line", { "class": "hilfslinie", x1: Bp[0], y1: Bp[1], x2: F[0], y2: F[1] }, ebene);
            var e = t >= 0 ? [-ux, uy] : [ux, -uy], p = [dx / dl, dy / dl];
            var p1 = [F[0] + 8 * e[0], F[1] + 8 * e[1]];
            s("path", {
              "class": "hilfslinie",
              d: "M" + p1[0].toFixed(1) + " " + p1[1].toFixed(1) +
                 "L" + (p1[0] + 8 * p[0]).toFixed(1) + " " + (p1[1] + 8 * p[1]).toFixed(1) +
                 "L" + (F[0] + 8 * p[0]).toFixed(1) + " " + (F[1] + 8 * p[1]).toFixed(1)
            }, ebene);
          }
          if (lb) bogen(a, b, 26, false, true);
        }
        wert("w1", "a · b", zahl(a[0], 0) + "·" + kl(b[0]) + " + " + kl(a[1]) + "·" + kl(b[1]) + " = " + zahl(dot, 0));
        wert("w2", "Winkel α", alpha === null ? "–" : zahl(alpha, 1) + "°");
        wert("w3", "Schatten von b auf a", la ? zahl(dot / la, 2) : "–");
        if (!la || !lb) status = "Mit dem Nullvektor ist das Skalarprodukt immer null.";
        else if (dot > 0 && !kreuz) status = "a und b zeigen in dieselbe Richtung: Der Schatten ist so lang wie b selbst, das Skalarprodukt ist |a| · |b|.";
        else if (dot > 0) status = "Spitzer Winkel: b hat einen Anteil in Richtung a – das Skalarprodukt ist positiv.";
        else if (dot === 0) status = "Rechter Winkel: b wirft keinen Schatten auf a – das Skalarprodukt ist null.";
        else status = "Stumpfer Winkel: Der Schatten von b fällt nach hinten, das Skalarprodukt ist negativ.";
      } else {
        if (kreuz) {
          s("path", {
            "class": "flaeche",
            d: "M" + O.join(" ") + "L" + A.join(" ") + "L" + Sm.join(" ") + "L" + Bp.join(" ") + "Z"
          }, ebene);
          s("line", { "class": "hilfslinie", x1: A[0], y1: A[1], x2: Sm[0], y2: Sm[1] }, ebene);
          s("line", { "class": "hilfslinie", x1: Bp[0], y1: Bp[1], x2: Sm[0], y2: Sm[1] }, ebene);
          bogen(a, b, 30, true, false);
          var M = [(O[0] + Sm[0]) / 2, (O[1] + Sm[1]) / 2];
          s("circle", { "class": "zeiger", cx: M[0], cy: M[1], r: 10 }, ebene);
          if (kreuz > 0) {
            s("circle", { "class": "punkt", cx: M[0], cy: M[1], r: 2.8 }, ebene);
          } else {
            s("path", { "class": "kurve duenn", d: "M" + (M[0] - 5) + " " + (M[1] - 5) + "l10 10m0 -10l-10 10" }, ebene);
          }
          txt(ebene, M[0], M[1] + 25, kreuz > 0 ? "a × b zeigt heraus" : "a × b zeigt hinein", "klein halo", "middle");
        }
        wert("w1", "a × b (in z)", zahl(a[0], 0) + "·" + kl(b[1]) + " − " + kl(a[1]) + "·" + kl(b[0]) + " = " + zahl(kreuz, 0));
        wert("w2", "Fläche", zahl(Math.abs(kreuz), 0) + " Kästchen");
        wert("w3", "Winkel α", alpha === null ? "–" : zahl(alpha, 1) + "°");
        if (kreuz > 0) status = "Von a nach b dreht man gegen den Uhrzeigersinn. Rechte Hand: Daumen a, Zeigefinger b – " +
          "der Mittelfinger und damit a × b zeigt aus dem Bildschirm heraus, auf dich zu.";
        else if (kreuz < 0) status = "Von a nach b dreht man im Uhrzeigersinn: a × b zeigt in den Bildschirm hinein. " +
          "Vertauschst du die Reihenfolge, kehrt sich das Vorzeichen um.";
        else status = "a und b liegen auf einer Geraden: Sie spannen keine Fläche auf, das Kreuzprodukt ist null.";
      }

      pfeil(ebene, O[0], O[1], A[0], A[1], "blau");
      pfeil(ebene, O[0], O[1], Bp[0], Bp[1], "kupfer");
      schild(a, "a", "blau");
      schild(b, "b", "kupfer");
      [["a", A, a], ["b", Bp, b]].forEach(function (e) {
        var c = griffe[e[0]];
        c.setAttribute("cx", e[1][0].toFixed(1));
        c.setAttribute("cy", e[1][1].toFixed(1));
        c.setAttribute("aria-valuenow", e[2][0]);
        c.setAttribute("aria-valuetext", "Vektor " + e[0] + " = " + paar(e[2]));
        c.setAttribute("aria-label", "Spitze von Vektor " + e[0] + ", mit den Pfeiltasten verschieben");
      });
      wert("a", "Vektor a", paar(a));
      wert("b", "Vektor b", paar(b));
      teil.status.textContent = status;
    }

    aufbau();
  }

  I.modell("vektorlabor", vektorlabor);
})(window.Interaktiv);
