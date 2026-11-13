/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/koordinatensysteme.html
   =========================================================================
   Modelle: polarlabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/koordinatensysteme.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      txtIndex = I.txtIndex, pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, knopf = I.knopf,
      werteLeiste = I.werteLeiste, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: POLAR-LABOR  (rechenmethoden/koordinatensysteme)
     Punkt P ziehbar; x = r cos φ, y = r sin φ,
     ê_r = (cos φ, sin φ), ê_φ = (−sin φ, cos φ).
     Ansicht „Flächenstück“: Stück zwischen r … r + Δr und φ … φ + Δφ,
     Fläche exakt ½((r+Δr)² − r²)Δφ, genähert r·Δr·Δφ.
     ======================================================================= */
  function polarlabor(fig) {
    var RMAX = 4, DR = 0.5, DPHI = 15;                 // Δφ in Grad
    var START = { r: 3, phi: 40 };
    var z = { r: START.r, phi: START.phi, ansicht: 0 };
    var teil = geruest(fig);
    var w = null, ebene = null, griff = null;
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ebene mit Polarkoordinaten-Gitter; der Punkt P lässt sich verschieben, an ihm sind die Einheitsvektoren e r und e phi eingezeichnet",
      function (b) { return begrenze(b * 0.62, 290, 420); }, aufbau);

    function rad(g) { return g * Math.PI / 180; }
    function X(x) { return w.ox + x * w.S; }
    function Y(y) { return w.oy - y * w.S; }
    function PP(r, g) { return [X(r * Math.cos(rad(g))), Y(r * Math.sin(rad(g)))]; }
    function T(p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }
    /* Bogen um den Ursprung mit Radius r von g1 bis g2 (Grad, g2 > g1) */
    function bogen(r, g1, g2) {
      var e = PP(r, g2), gross = g2 - g1 > 180 ? 1 : 0;
      return "A" + (r * w.S).toFixed(1) + " " + (r * w.S).toFixed(1) + " 0 " + gross + " 0 " + T(e);
    }

    function aufbau() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = (Math.min(B, H) / 2 - 18) / RMAX;
      w = { S: S, ox: Math.round(B / 2), oy: Math.round(H / 2) };
      var g = s("g", null, f.svg), i;
      for (i = 1; i <= RMAX; i++) s("circle", { "class": "gitter", cx: w.ox, cy: w.oy, r: i * S, fill: "none" }, g);
      for (i = 0; i < 12; i++) {
        var e = PP(RMAX, i * 30);
        s("line", { "class": "gitter", x1: w.ox, y1: w.oy, x2: e[0], y2: e[1] }, g);
      }
      s("line", { "class": "achse", x1: 6, y1: w.oy, x2: B - 6, y2: w.oy }, g);
      s("line", { "class": "achse", x1: w.ox, y1: 6, x2: w.ox, y2: H - 6 }, g);
      txt(g, B - 8, w.oy - 6, "x", "klein", "end");
      txt(g, w.ox + 6, 14, "y", "klein");
      for (i = 1; i <= RMAX; i++) txt(g, X(i) + 3, w.oy + 13, String(i), "klein");
      ebene = s("g", null, f.svg);
      griff = s("circle", { "class": "griff", r: 14, tabindex: 0, role: "slider" }, f.svg);
      var aktiv = false;
      griff.addEventListener("pointerdown", function (e) {
        aktiv = true;
        griff.classList.add("zieht");
        if (griff.setPointerCapture) griff.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      griff.addEventListener("pointermove", function (e) {
        if (!aktiv) return;
        var q = f.svg.getBoundingClientRect();
        var x = ((e.clientX - q.left) * f.b / q.width - w.ox) / w.S;
        var y = (w.oy - (e.clientY - q.top) * f.h / q.height) / w.S;
        var r = Math.sqrt(x * x + y * y), g2 = Math.atan2(y, x) * 180 / Math.PI;
        setze(Math.round(r * 20) / 20, Math.round(g2 < 0 ? g2 + 360 : g2));
      });
      function los() { aktiv = false; griff.classList.remove("zieht"); }
      griff.addEventListener("pointerup", los);
      griff.addEventListener("pointercancel", los);
      griff.addEventListener("keydown", function (e) {
        var d = { ArrowLeft: [0, 5], ArrowRight: [0, -5], ArrowUp: [0.25, 0], ArrowDown: [-0.25, 0] }[e.key];
        if (!d) return;
        e.preventDefault();
        setze(Math.round((z.r + d[0]) * 20) / 20, Math.round(z.phi + d[1]));
      });
      zeichne();
    }

    function setze(r, phi) {
      r = begrenze(r, 0, RMAX);
      phi = ((phi % 360) + 360) % 360;
      if (r === z.r && phi === z.phi) return;
      z.r = r; z.phi = phi;
      zeichne();
    }

    var ansichten = auswahl(teil.bedienung, "Ansicht", "Was soll am Punkt P gezeigt werden?",
      ["Einheitsvektoren", "Flächenstück"], function (i) { z.ansicht = i; zeichne(); });
    knopf(teil.knoepfe, "Zurücksetzen", null, function () {
      z.r = START.r; z.phi = START.phi; zeichne();
    });
    var werte = werteLeiste(teil.bedienung, [["xy", "kartesisch (x | y)"], ["pol", "polar (r | φ)"],
      ["er", "ê r = (cos φ | sin φ)"], ["ep", "ê φ = (−sin φ | cos φ)"]]);

    function zeichne() {
      if (!w) return;
      markiere(ansichten, z.ansicht);
      while (ebene.firstChild) ebene.removeChild(ebene.firstChild);
      var r = z.r, g = z.phi, c = Math.cos(rad(g)), sn = Math.sin(rad(g));
      var P = PP(r, g), O = [w.ox, w.oy];
      var x = r * c, y = r * sn;

      if (z.ansicht === 1 && r + DR <= RMAX + 1e-9) {
        /* Flächenstück zwischen r … r+Δr und φ … φ+Δφ */
        var a1 = PP(r, g), a2 = PP(r + DR, g), b2 = PP(r + DR, g + DPHI), b1 = PP(r, g + DPHI);
        var d = "M" + T(a1) + "L" + T(a2) + bogen(r + DR, g, g + DPHI) + "L" + T(b1);
        d += r > 0 ? "A" + (r * w.S).toFixed(1) + " " + (r * w.S).toFixed(1) + " 0 0 1 " + T(a1) + "Z" : "Z";
        s("path", { "class": "flaeche", d: d }, ebene);
        s("path", { "class": "kurve blau duenn", d: d }, ebene);
        s("path", { "class": "hilfslinie", d: "M" + T(O) + "L" + T(b2) }, ebene);
      }

      /* Koordinatenlinien durch P: Kreis r = const (blau), Strahl φ = const (orange) */
      if (r > 0) {
        s("circle", { "class": "kurve blau duenn", cx: O[0], cy: O[1], r: r * w.S, fill: "none" }, ebene);
        var E = PP(RMAX, g);
        s("line", { "class": "kurve kupfer duenn", x1: O[0], y1: O[1], x2: E[0], y2: E[1] }, ebene);
        /* Winkel φ am Ursprung */
        var rb = Math.min(0.7, Math.max(r * 0.5, 0.35));
        if (g > 0) {
          s("path", { "class": "kurve kupfer", d: "M" + T(PP(rb, 0)) + bogen(rb, 0, g), fill: "none" }, ebene);
          var L = PP(rb + 0.32, g / 2);
          txt(ebene, L[0], L[1] + 4, "φ", "kupfer halo", "middle");
        }
      }
      /* Hilfslinien zu den Achsen */
      s("path", { "class": "hilfslinie", d: "M" + T(P) + "L" + T([P[0], O[1]]) + "M" + T(P) + "L" + T([O[0], P[1]]) }, ebene);
      s("circle", { "class": "punkt", cx: P[0], cy: P[1], r: 3.5 }, ebene);

      if (r > 0 && z.ansicht === 0) {
        var Er = [P[0] + c * w.S, P[1] - sn * w.S], Ep = [P[0] - sn * w.S, P[1] - c * w.S];
        pfeil(ebene, P[0], P[1], Er[0], Er[1], "blau");
        pfeil(ebene, P[0], P[1], Ep[0], Ep[1], "kupfer");
        txtIndex(ebene, begrenze(Er[0] + c * 14, 14, flaeche.b - 14), begrenze(Er[1] - sn * 14 + 4, 14, flaeche.h - 6), "ê", "r", "blau halo", "middle");
        txtIndex(ebene, begrenze(Ep[0] - sn * 14, 14, flaeche.b - 14), begrenze(Ep[1] - c * 14 + 4, 14, flaeche.h - 6), "ê", "φ", "kupfer halo", "middle");
      }
      /* „P“ schräg innen hinter dem Punkt, weg von ê r und ê φ (bzw. vom Flächenstück) */
      var lx = -(c - sn) * 0.71, ly = (sn + c) * 0.71;
      txt(ebene, P[0] + lx * 22, P[1] + ly * 22 + 5, "P", "halo", "middle");

      griff.setAttribute("cx", P[0].toFixed(1));
      griff.setAttribute("cy", P[1].toFixed(1));
      griff.setAttribute("aria-valuenow", r);
      griff.setAttribute("aria-valuetext", "r = " + zahl(r, 2) + ", φ = " + g + " Grad");
      griff.setAttribute("aria-label", "Punkt P; Pfeiltasten hoch und runter ändern r, links und rechts den Winkel φ");

      werte.xy.textContent = "(" + zahl(x, 2) + " | " + zahl(y, 2) + ")";
      werte.pol.textContent = "(" + zahl(r, 2) + " | " + g + "°)";
      werte.er.textContent = r > 0 ? "(" + zahl(c, 2) + " | " + zahl(sn, 2) + ")" : "nicht festgelegt";
      werte.ep.textContent = r > 0 ? "(" + zahl(-sn, 2) + " | " + zahl(c, 2) + ")" : "nicht festgelegt";

      var status;
      if (r === 0) {
        status = "P liegt im Ursprung: Dort ist r = 0, und der Winkel φ ist gar nicht festgelegt – jeder Winkel beschreibt denselben Punkt. " +
          "Auch ê r und ê φ haben hier keine Richtung. Zieh P ein Stück nach außen.";
      } else if (z.ansicht === 1) {
        if (r + DR > RMAX + 1e-9) {
          status = "Zieh P etwas nach innen (r höchstens " + zahl(RMAX - DR, 1) + "), damit das Flächenstück ins Bild passt.";
        } else {
          /* mit dem mittleren Radius ist r·Δr·Δφ exakt: ½((r+Δr)² − r²)Δφ = (r + Δr/2)·Δr·Δφ */
          var rm = r + DR / 2;
          status = "Das getönte Stück reicht von r = " + zahl(r, 2) + " bis " + zahl(r + DR, 2) + " und von φ = " + g + "° bis " +
            (g + DPHI) + "° (Δφ = " + zahl(rad(DPHI), 3) + " im Bogenmaß). Es ist fast ein Rechteck mit den Seiten Δr und r · Δφ; " +
            "mit dem mittleren Radius " + zahl(rm, 2) + " ist seine Fläche " + zahl(rm, 2) + " · " + zahl(DR, 1) + " · " + zahl(rad(DPHI), 3) +
            " = " + zahl(rm * DR * rad(DPHI), 3) + ". Gleiche Schritte Δr und Δφ geben weiter außen größere Stücke – " +
            "deshalb steht im Flächenelement dA = r dr dφ der Faktor r.";
        }
      } else {
        status = "ê r zeigt von P aus direkt vom Ursprung weg, ê φ in die Richtung, in die P beim Vergrößern von φ wandert (gegen den Uhrzeigersinn). " +
          "Beide stehen senkrecht aufeinander und haben die Länge 1. Bewegst du P im Kreis, drehen sie sich mit – anders als ê x und ê y, die überall gleich sind.";
      }
      teil.status.textContent = status;
    }

    aufbau();
  }

  I.modell("polarlabor", polarlabor);
})(window.Interaktiv);
