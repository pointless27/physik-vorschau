/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/differentialoperatoren.html
   =========================================================================
   Modelle: feldlabor.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/differentialoperatoren.js"></script>
   Bausteine (zeichenflaeche, knopf, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, zeichenflaeche = I.zeichenflaeche, knopf = I.knopf,
      werteLeiste = I.werteLeiste, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: FELD-LABOR  (rechenmethoden/differentialoperatoren)
     Ebene Vektorfelder F(x, y) mit exakter Divergenz ∂Fx/∂x + ∂Fy/∂y und
     z-Komponente der Rotation ∂Fy/∂x − ∂Fx/∂y. Ein Prüfkreis (Radius R)
     ist ziehbar. Ansicht „Fluss“: Normalanteile F·n̂ auf dem Rand;
     Ansicht „Wirbel“: Tangentialanteile F·t̂ und ein Schaufelrad.
     Zum Vergleich werden Fluss/Fläche und Zirkulation/Fläche numerisch
     über den Kreisrand berechnet (72 Stützstellen) – bei glatten Feldern
     stimmen sie mit div F bzw. rot F in der Kreismitte überein (bei
     diesen Feldern sogar exakt, weil die Ableitungen linear sind).
     ======================================================================= */
  var FELDER = [
    { name: "Quelle", formel: "(x | y)",
      F: function (x, y) { return [x, y]; },
      div: function () { return 2; }, rot: function () { return 0; } },
    { name: "Dehnung", formel: "(x | 0)",
      F: function (x) { return [x, 0]; },
      div: function () { return 1; }, rot: function () { return 0; } },
    { name: "Wirbel", formel: "(−y | x)",
      F: function (x, y) { return [-y, x]; },
      div: function () { return 0; }, rot: function () { return 2; } },
    { name: "Scherung", formel: "(y | 0)",
      F: function (x, y) { return [y, 0]; },
      div: function () { return 0; }, rot: function () { return -1; } },
    { name: "Strudel", formel: "(−y | x) / (x² + y²)", singulaer: true,
      F: function (x, y) { var q = x * x + y * y; return q < 1e-12 ? [0, 0] : [-y / q, x / q]; },
      div: function () { return 0; }, rot: function () { return 0; } },
    { name: "Sattel", formel: "(x | −y)",
      F: function (x, y) { return [x, -y]; },
      div: function () { return 0; }, rot: function () { return 0; } }
  ];
  var R = 0.75;                                        // Radius des Prüfkreises
  var NRAND = 12;                                      // Pfeile auf dem Rand

  function feldlabor(fig) {
    var START = { x: 1.5, y: 1, feld: 0, ansicht: 0 };
    var z = { x: START.x, y: START.y, feld: START.feld, ansicht: START.ansicht };
    var teil = geruest(fig);
    var w = null, ebene = null, feldEbene = null, griff = null;
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ebene mit einem Vektorfeld aus Pfeilen und einem verschiebbaren gestrichelten Prüfkreis; am Kreisrand sind die Anteile des Feldes quer zum Rand oder längs des Rands eingezeichnet",
      function (b) { return begrenze(b * 0.62, 290, 420); }, aufbau);

    function X(x) { return w.ox + x * w.S; }
    function Y(y) { return w.oy - y * w.S; }

    function aufbau() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = (H / 2 - 12) / 3.4;
      w = { S: S, ox: Math.round(B / 2), oy: Math.round(H / 2), xmax: (B / 2 - 10) / S, ymax: 3.4 };
      var g = s("g", null, f.svg);
      s("line", { "class": "gitter", x1: 6, y1: w.oy, x2: B - 6, y2: w.oy }, g);
      s("line", { "class": "gitter", x1: w.ox, y1: 6, x2: w.ox, y2: H - 6 }, g);
      txt(g, B - 8, w.oy - 6, "x", "klein", "end");
      txt(g, w.ox + 6, 14, "y", "klein");
      feldEbene = s("g", null, f.svg);
      ebene = s("g", null, f.svg);
      griff = s("circle", { "class": "griff", r: 16, tabindex: 0, role: "slider" }, f.svg);
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
        setze(Math.round(x * 20) / 20, Math.round(y * 20) / 20);
      });
      function los() { aktiv = false; griff.classList.remove("zieht"); }
      griff.addEventListener("pointerup", los);
      griff.addEventListener("pointercancel", los);
      griff.addEventListener("keydown", function (e) {
        var d = { ArrowLeft: [-0.25, 0], ArrowRight: [0.25, 0], ArrowUp: [0, 0.25], ArrowDown: [0, -0.25] }[e.key];
        if (!d) return;
        e.preventDefault();
        setze(z.x + d[0], z.y + d[1]);
      });
      zeichneFeld();
      zeichne();
    }

    function setze(x, y) {
      x = begrenze(x, -w.xmax + R, w.xmax - R);
      y = begrenze(y, -w.ymax + R, w.ymax - R);
      x = Math.round(x * 100) / 100; y = Math.round(y * 100) / 100;
      if (x === z.x && y === z.y) return;
      z.x = x; z.y = y;
      zeichne();
    }

    /* Längenfaktor der Pfeile: größter Pfeil im Bild ≈ 0,85 Gitterabstände */
    function massstab() {
      var feld = FELDER[z.feld], max = 0, x, y;
      for (x = -Math.floor(w.xmax); x <= Math.floor(w.xmax); x++) {
        for (y = -3; y <= 3; y++) {
          if (feld.singulaer && x * x + y * y < 1.5) continue;
          var v = feld.F(x, y), l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
          if (l > max) max = l;
        }
      }
      return max > 0 ? 0.85 / max : 1;
    }

    /* Pfeil der Länge |v|·k (Weltlängen), höchstens kappe, mittig oder ab Punkt */
    function feldPfeil(e, x, y, v, k, klasse, mittig, kappe) {
      var l = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
      if (l < 1e-9) return;
      var L = Math.min(l * k, kappe || 1e9), ux = v[0] / l, uy = v[1] / l;
      var a = mittig ? L / 2 : 0;
      pfeil(e, X(x - ux * a), Y(y - uy * a), X(x + ux * (L - a)), Y(y + uy * (L - a)), klasse);
    }

    function zeichneFeld() {
      while (feldEbene.firstChild) feldEbene.removeChild(feldEbene.firstChild);
      var feld = FELDER[z.feld], k = massstab(), x, y;
      for (x = -Math.floor(w.xmax); x <= Math.floor(w.xmax); x++) {
        for (y = -3; y <= 3; y++) {
          if (feld.singulaer && x === 0 && y === 0) continue;
          feldPfeil(feldEbene, x, y, feld.F(x, y), k, "duenn", true, 0.95);
        }
      }
      if (feld.singulaer) s("circle", { "class": "punkt kupfer", cx: X(0), cy: Y(0), r: 3.5 }, feldEbene);
    }

    var felder = auswahl(teil.bedienung, "Feld", "Welches Vektorfeld soll gezeigt werden?",
      FELDER.map(function (f) { return f.name; }),
      function (i) { z.feld = i; zeichneFeld(); zeichne(); });
    var ansichten = auswahl(teil.bedienung, "Am Rand zeigen", "Welche Anteile des Feldes sollen am Kreisrand gezeigt werden?",
      ["quer: Fluss (div)", "längs: Wirbel (rot)"], function (i) { z.ansicht = i; zeichne(); });
    knopf(teil.knoepfe, "Zurücksetzen", null, function () {
      z.x = START.x; z.y = START.y; z.feld = START.feld; z.ansicht = START.ansicht;
      zeichneFeld(); zeichne();
    });
    var werte = werteLeiste(teil.bedienung, [["F", "Feld F(x | y)"], ["mitte", "Kreismitte"],
      ["div", "div F"], ["rot", "rot F (z-Anteil)"]]);

    /* Fluss und Zirkulation über den Kreisrand, je durch die Kreisfläche geteilt */
    function randIntegrale(feld, cx, cy) {
      var n = 72, fluss = 0, zirk = 0, i, ds = 2 * Math.PI * R / n;
      for (i = 0; i < n; i++) {
        var a = 2 * Math.PI * (i + 0.5) / n, c = Math.cos(a), sn = Math.sin(a);
        var v = feld.F(cx + R * c, cy + R * sn);
        fluss += (v[0] * c + v[1] * sn) * ds;
        zirk += (-v[0] * sn + v[1] * c) * ds;
      }
      var A = Math.PI * R * R;
      return { fluss: fluss / A, zirk: zirk / A };
    }

    function schaufelrad(e, cx, cy, rot) {
      var px = X(cx), py = Y(cy), r = 13, i;
      s("circle", { "class": "flaeche kupfer", cx: px, cy: py, r: r }, e);
      for (i = 0; i < 4; i++) {
        var a = Math.PI / 8 + i * Math.PI / 2;
        s("line", { "class": "kurve kupfer duenn", x1: px, y1: py, x2: px + r * Math.cos(a), y2: py - r * Math.sin(a) }, e);
      }
      if (Math.abs(rot) < 1e-6) return;
      /* Drehpfeil: Bogen über 120°, Richtung nach Vorzeichen */
      var rr = r + 7, a1 = Math.PI / 6, a2 = 5 * Math.PI / 6;
      var start = rot > 0 ? a1 : a2, ende = rot > 0 ? a2 : a1;
      s("path", { "class": "kurve kupfer duenn", d: "M" + (px + rr * Math.cos(start)).toFixed(1) + " " + (py - rr * Math.sin(start)).toFixed(1) +
        "A" + rr + " " + rr + " 0 0 " + (rot > 0 ? 0 : 1) + " " + (px + rr * Math.cos(ende)).toFixed(1) + " " + (py - rr * Math.sin(ende)).toFixed(1) }, e);
      var tx = rot > 0 ? -Math.sin(ende) : Math.sin(ende), ty = rot > 0 ? -Math.cos(ende) : Math.cos(ende);
      var ex = px + rr * Math.cos(ende), ey = py - rr * Math.sin(ende);
      pfeil(e, ex - tx * 7, ey - ty * 7, ex + tx, ey + ty, "kupfer");
    }

    function zeichne() {
      if (!w) return;
      markiere(felder, z.feld);
      markiere(ansichten, z.ansicht);
      while (ebene.firstChild) ebene.removeChild(ebene.firstChild);
      var feld = FELDER[z.feld], k = massstab(), cx = z.x, cy = z.y, i;
      var umschliesst = feld.singulaer && cx * cx + cy * cy < R * R;

      s("circle", { "class": "flaeche", cx: X(cx), cy: Y(cy), r: R * w.S }, ebene);
      s("circle", { "class": "hilfslinie", cx: X(cx), cy: Y(cy), r: R * w.S }, ebene);

      /* Randpfeile: Normal- bzw. Tangentialanteil; Maßstab je Bild so, dass
         der größte Randpfeil 0,6 Einheiten lang ist (Verhältnisse bleiben) */
      var rand = [], maxRand = 0;
      for (i = 0; i < NRAND; i++) {
        var a = 2 * Math.PI * i / NRAND, c = Math.cos(a), sn = Math.sin(a);
        var px = cx + R * c, py = cy + R * sn, v = feld.F(px, py);
        var anteil = z.ansicht === 0 ? v[0] * c + v[1] * sn : -v[0] * sn + v[1] * c;
        rand.push([px, py, c, sn, anteil]);
        maxRand = Math.max(maxRand, Math.abs(anteil));
      }
      var kr = maxRand > 1e-9 ? 0.6 / maxRand : 0;
      rand.forEach(function (q) {
        var vek = z.ansicht === 0 ? [q[4] * q[2], q[4] * q[3]] : [-q[4] * q[3], q[4] * q[2]];
        feldPfeil(ebene, q[0], q[1], vek, kr, z.ansicht === 0 ? "kupfer" : "blau", false, 0.9);
      });
      var dv = feld.div(cx, cy), rt = feld.rot(cx, cy);
      if (z.ansicht === 1 && !umschliesst) schaufelrad(ebene, cx, cy, rt);
      else s("circle", { "class": "punkt", cx: X(cx), cy: Y(cy), r: 3 }, ebene);

      griff.setAttribute("cx", X(cx).toFixed(1));
      griff.setAttribute("cy", Y(cy).toFixed(1));
      griff.setAttribute("aria-valuetext", "Kreismitte bei x = " + zahl(cx, 2) + ", y = " + zahl(cy, 2));
      griff.setAttribute("aria-label", "Prüfkreis; mit den Pfeiltasten verschieben");

      var v0 = feld.F(cx, cy);
      werte.F.textContent = feld.formel;
      werte.mitte.textContent = "(" + zahl(cx, 2) + " | " + zahl(cy, 2) + ")";
      var r0 = cx * cx + cy * cy < 1e-9 && feld.singulaer;
      werte.div.textContent = r0 ? "nicht definiert" : zahl(dv, 2);
      werte.rot.textContent = r0 ? "nicht definiert" : zahl(rt, 2);

      var ri = randIntegrale(feld, cx, cy), status;
      if (umschliesst) {
        status = "Der Kreis umschließt die Mitte des Strudels, wo das Feld unendlich groß wird und nicht definiert ist. " +
          (z.ansicht === 1 ? "Längs des Rands strömt es jetzt überall gegen den Uhrzeigersinn: Zirkulation durch Fläche = " + zahl(ri.zirk, 2) +
            ". Der ganze Wirbel steckt im einen Punkt in der Mitte – außerhalb ist rot F überall null. Zieh den Kreis von der Mitte weg."
          : "Quer zum Rand fließt nichts: Fluss durch Fläche = " + zahl(ri.fluss, 2) + ". Schalte auf „längs“ um.");
      } else if (z.ansicht === 0) {
        status = "Orange: der Anteil des Feldes quer zum Rand (nach außen = heraus). Netto fließt " +
          (Math.abs(ri.fluss) < 0.005 ? "genauso viel hinein wie heraus" : ri.fluss > 0 ? "mehr heraus als hinein" : "mehr hinein als heraus") +
          ": Fluss durch Fläche = " + zahl(ri.fluss, 2) + ", passend zu div F = " + zahl(dv, 2) + ". " +
          (z.feld === 1 ? "Die Pfeile laufen alle parallel – und trotzdem ist div F ≠ 0, weil sie nach rechts länger werden: rechts fließt mehr heraus, als links hineinkommt." :
           z.feld === 5 ? "Links und rechts fließt es heraus, oben und unten hinein – beides gleich stark, deshalb div F = 0." :
           z.feld === 0 ? "Überall im Bild fließt mehr heraus als hinein: Das Feld hat überall Quellen, nicht nur im Ursprung." :
           "Schalte auf „längs“, um die Rotation zu sehen.");
      } else {
        status = "Blau: der Anteil des Feldes längs des Rands. Zirkulation durch Fläche = " + zahl(ri.zirk, 2) +
          ", passend zu rot F = " + zahl(rt, 2) + ". " +
          (Math.abs(rt) < 1e-6 ? "Das Schaufelrad dreht sich nicht" + (z.feld === 4 ? " – obwohl das Wasser im Kreis um die Mitte strömt: Innen ist die Strömung schneller, außen langsamer, und das gleicht die Drehung genau aus." : ".") :
           "Das Schaufelrad dreht sich " + (rt > 0 ? "gegen den Uhrzeigersinn" : "im Uhrzeigersinn") +
           (z.feld === 3 ? " – obwohl alle Pfeile geradeaus zeigen: Oben strömt es schneller nach rechts als unten." : "."));
      }
      teil.status.textContent = status;
    }

    aufbau();
  }

  I.modell("feldlabor", feldlabor);
})(window.Interaktiv);
