/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/bewegung-3d.html
   =========================================================================
   Modelle: wurf, bezugssystem.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/bewegung-3d.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      schoenerSchritt = I.schoenerSchritt, txt = I.txt, txtIndex = I.txtIndex,
      pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 2: SCHRÄGER WURF
     x(t) = v0·cos φ · t,  z(t) = h + v0·sin φ · t − ½·g·t²
     ======================================================================= */
  function wurfBahn(v0, phiGrad, hoehe) {
    var p = phiGrad * Math.PI / 180;
    var vx = v0 * Math.cos(p), vz = v0 * Math.sin(p);
    var T = (vz + Math.sqrt(vz * vz + 2 * G * hoehe)) / G;
    var ts = begrenze(vz / G, 0, T);
    return {
      vx: vx, vz: vz, T: T, weite: vx * T,
      ts: ts, xs: vx * ts, zmax: hoehe + vz * ts - 0.5 * G * ts * ts,
      x: function (t) { return vx * t; },
      z: function (t) { return hoehe + vz * t - 0.5 * G * t * t; }
    };
  }

  function wurf(fig) {
    var z = { phi: 30, v0: 15, h: 0, f: 0.22 };      // f = Anteil der Flugzeit
    var spuren = [];
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Flugbahn eines schräg geworfenen Balls mit Geschwindigkeitspfeilen",
      function (b) { return begrenze(b * 0.55, 230, 360); }, zeichne);

    function bahn() { return wurfBahn(z.v0, z.phi, z.h); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, b = bahn();
      f.leeren();
      /* Maßstab hängt nur von v0 und h ab (größte mögliche Weite bzw. Höhe),
         nicht vom Winkel – so springt das Bild beim Drehen des Winkels nicht */
      function rahmen(v0, hh) {
        return [v0 * Math.sqrt(v0 * v0 + 2 * G * hh) / G, hh + v0 * v0 / (2 * G)];
      }
      var rm = rahmen(z.v0, z.h), xMax = Math.max(6, rm[0]), zMax = Math.max(3, rm[1]);
      spuren.forEach(function (sp) {
        var a = rahmen(sp.v0, sp.h);
        xMax = Math.max(xMax, a[0]); zMax = Math.max(zMax, a[1]);
      });
      var l = 44, r = 16, o = 14, u = 40;
      var S = Math.min((B - l - r) / (xMax * 1.05), (H - o - u) / (zMax * 1.12));
      var X = function (x) { return l + x * S; };
      var Y = function (zz) { return H - u - zz * S; };

      /* Gitter mit Meter-Teilung (gleicher Schritt in x und z) */
      var sichtX = (B - l - r) / S, sichtZ = (H - o - u) / S;
      var schritt = schoenerSchritt(Math.max(sichtX, sichtZ), B < 480 ? 4 : 7);
      for (var k = schritt; k <= sichtX + 1e-9; k += schritt) {
        s("line", { "class": "gitter", x1: X(k), y1: Y(0), x2: X(k), y2: o }, f.svg);
        txt(f.svg, X(k), Y(0) + 17, zahl(k, schritt < 1 ? 1 : 0), "klein", "middle");
      }
      for (k = schritt; k <= sichtZ + 1e-9; k += schritt) {
        s("line", { "class": "gitter", x1: l, y1: Y(k), x2: B - r, y2: Y(k) }, f.svg);
        txt(f.svg, l - 6, Y(k) + 4, zahl(k, schritt < 1 ? 1 : 0), "klein", "end");
      }
      txt(f.svg, l - 6, Y(0) + 17, "0", "klein", "end");
      txt(f.svg, l + 6, o + 4, "alle Längen in m", "klein");
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r, y2: Y(0) }, f.svg);
      s("line", { "class": "achse", x1: l, y1: Y(0), x2: l, y2: o }, f.svg);
      if (z.h > 0) s("rect", { "class": "turm", x: l - 12, y: Y(z.h), width: 12, height: z.h * S }, f.svg);

      /* frühere Würfe als blasse Spuren; Winkel-Beschriftungen bei
         (fast) gleicher Weite übereinander stapeln */
      var belegt = [];
      spuren.forEach(function (sp) {
        var a = wurfBahn(sp.v0, sp.phi, sp.h), pkt = [];
        for (var i = 0; i <= 60; i++) { var t = a.T * i / 60; pkt.push([X(a.x(t)), Y(a.z(t))]); }
        s("polyline", { "class": "spur", points: linienzug(pkt) }, f.svg);
        var lx = X(a.weite), stufe = belegt.filter(function (x) { return Math.abs(x - lx) < 26; }).length;
        belegt.push(lx);
        txt(f.svg, lx, Y(0) - 8 - stufe * 13, sp.phi + "°", "klein", "middle");
      });

      /* aktuelle Bahn: gestrichelt vorhergesagt, durchgezogen geflogen */
      var t = z.f * b.T, alle = [], bisher = [];
      for (var i = 0; i <= 80; i++) {
        var ti = b.T * i / 80, p = [X(b.x(ti)), Y(b.z(ti))];
        alle.push(p);
        if (ti <= t) bisher.push(p);
      }
      bisher.push([X(b.x(t)), Y(b.z(t))]);
      s("polyline", { "class": "hilfslinie", points: linienzug(alle) }, f.svg);
      s("polyline", { "class": "kurve blau", points: linienzug(bisher) }, f.svg);

      /* Gipfel und Landepunkt */
      if (b.ts > 0 && b.ts < b.T) {
        s("line", { "class": "hilfslinie", x1: X(b.xs), y1: Y(b.zmax), x2: X(b.xs), y2: Y(0) }, f.svg);
        s("circle", { "class": "punkt", cx: X(b.xs), cy: Y(b.zmax), r: 3 }, f.svg);
        txt(f.svg, X(b.xs), Y(b.zmax) - 9, "Gipfel " + zahl(b.zmax, 1) + " m", "klein", "middle");
      }
      if (b.weite > 0.05) {
        var nahRechts = X(b.weite) > B - 70;
        txt(f.svg, X(b.weite), H - 6, "Weite " + zahl(b.weite, 1) + " m", "blau klein",
            nahRechts ? "end" : "middle");
      }

      /* Ball mit Geschwindigkeitspfeilen */
      var bx = X(b.x(t)), by = Y(b.z(t)), vzt = b.vz - G * t, kv = begrenze(B / 220, 2.4, 3.6);
      pfeil(f.svg, bx, by, bx + b.vx * kv, by - vzt * kv, "duenn");
      if (pfeil(f.svg, bx, by, bx + b.vx * kv, by, "blau")) {
        txtIndex(f.svg, bx + b.vx * kv + 5, by + 15, "v", "x", "blau");
      }
      if (pfeil(f.svg, bx, by, bx, by - vzt * kv, "kupfer")) {
        txtIndex(f.svg, bx - 7, by - vzt * kv + (vzt > 0 ? 6 : 4), "v", "z", "kupfer", "end");
      }
      s("circle", { "class": "ball", cx: bx, cy: by, r: 6 }, f.svg);
    }

    var rPhi = regler(teil.regler, {
      name: "Abwurfwinkel φ", min: 0, max: 90, schritt: 1, wert: z.phi,
      anzeige: function (w) { return w + "°"; }
    }, function (w) { z.phi = w; zeichne(); });
    regler(teil.regler, {
      name: "Abwurfgeschwindigkeit v₀", min: 5, max: 30, schritt: 0.5, wert: z.v0,
      anzeige: function (w) { return zahl(w, 1) + " m/s"; }
    }, function (w) { z.v0 = w; zeichne(); });
    regler(teil.regler, {
      name: "Abwurfhöhe h", min: 0, max: 20, schritt: 0.5, wert: z.h,
      anzeige: function (w) { return zahl(w, 1) + " m"; }
    }, function (w) { z.h = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt im Flug", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * bahn().T, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var wurfKnopf = knopf(teil.knoepfe, "", "haupt", function () {});
    var spieler = abspieler({
      knopf: wurfKnopf, text: "▶ Werfen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * bahn().T; },
      setze: function (t) { var T = bahn().T; z.f = T > 0 ? t / T : 0; rZeit.setze(z.f); zeichne(); },
      ende: function () { return bahn().T; },
      amEnde: function () {
        var letzte = spuren[spuren.length - 1];
        if (!letzte || letzte.phi !== z.phi || letzte.v0 !== z.v0 || letzte.h !== z.h) {
          spuren.push({ phi: z.phi, v0: z.v0, h: z.h });
          if (spuren.length > 5) spuren.shift();
        }
        zeichne();
      }
    });
    knopf(teil.knoepfe, "Spuren löschen", null, function () { spuren = []; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["T", "Flugzeit"], ["weite", "Wurfweite"], ["gipfel", "Gipfelhöhe"], ["best", "Weitester Winkel"]
    ]);

    function zeichne() {
      var b = bahn();
      rZeit.auffrischen();
      zeichneBuehne();
      /* weitester Winkel für dieses v0 und h: tan φ* = v0 / v_Aufprall */
      var vAuf = Math.sqrt(z.v0 * z.v0 + 2 * G * z.h);
      var best = Math.atan(z.v0 / vAuf) * 180 / Math.PI;
      werte.T.textContent = zahl(b.T, 2) + " s";
      werte.weite.textContent = zahl(b.weite, 1) + " m";
      werte.gipfel.textContent = zahl(b.zmax, 1) + " m";
      werte.best.textContent = zahl(best, 0) + "° (" + zahl(z.v0 * vAuf / G, 1) + " m)";
      var satz;
      if (z.h === 0 && z.phi > 0 && z.phi < 90 && z.phi !== 45) {
        satz = "Vom Boden aus fliegt der Wurf unter " + (90 - z.phi) + "° genauso weit wie unter " +
          z.phi + "° – probier es aus! Am weitesten geht es unter 45°.";
      } else if (z.h === 0) {
        satz = z.phi === 45 ? "45° ist vom Boden aus der Winkel mit der größten Wurfweite."
                            : "Ganz flach oder ganz steil kommt der Ball nicht weit.";
      } else {
        satz = "Von " + zahl(z.h, 1) + " m Höhe aus fliegt ein etwas flacherer Wurf am weitesten: " +
          "bei " + zahl(z.v0, 1) + " m/s unter etwa " + zahl(best, 0) + "°.";
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 3: BEZUGSSYSTEME – Ball senkrecht vom fahrenden Wagen
     Bahnsteig-Sicht: x = u·t,   Wagen-Sicht: x' = 0 (Bahnsteig zieht vorbei)
     ======================================================================= */
  function bezugssystem(fig) {
    var Z0 = 1.0;                                      // Abwurfhöhe über dem Boden in m
    var z = { u: 3, w: 7, sicht: "boden", f: 0.5 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Ein Wagen fährt nach rechts und wirft einen Ball senkrecht nach oben",
      function (b) { return begrenze(b * 0.42, 210, 300); }, zeichne);

    function flugzeit() { return 2 * z.w / G; }
    function ballZ(t) { return Z0 + z.w * t - 0.5 * G * t * t; }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, T = flugzeit(), t = z.f * T;
      f.leeren();
      var boden = z.sicht === "boden";
      var xlo = -4, xhi = Math.max(6, z.u * T + 2);
      var zMax = Z0 + z.w * z.w / (2 * G);
      var l = 12, r = 12, o = 12, u = 30;
      var S = Math.min((B - l - r) / (xhi - xlo), (H - o - u) / (zMax * 1.08));
      var mitte = (B - (xhi - xlo) * S) / 2;
      var X = function (x) { return mitte + (x - xlo) * S; };
      var Y = function (zz) { return H - u - zz * S; };
      var wagenX = boden ? z.u * t : 0;               // Wagen in der jeweiligen Sicht
      var verschiebung = boden ? 0 : -z.u * t;        // so weit ist der Bahnsteig verschoben

      /* Bahnsteig: Boden, Meter-Striche und Laternen bewegen sich gemeinsam */
      s("line", { "class": "achse", x1: 0, y1: Y(0), x2: B, y2: Y(0) }, f.svg);
      for (var k = Math.floor(xlo - z.u * 3); k <= xhi + z.u * 3; k++) {
        var xs = X(k + verschiebung);
        if (xs < -2 || xs > B + 2) continue;
        s("line", { "class": "achse", x1: xs, y1: Y(0), x2: xs - 6, y2: Y(0) + 7 }, f.svg);
        if ((k % 4 + 4) % 4 === 2) {
          s("line", { "class": "pfosten", x1: xs, y1: Y(0), x2: xs, y2: Y(2.4) }, f.svg);
          s("circle", { "class": "laterne", cx: xs, cy: Y(2.4), r: 3.5 }, f.svg);
        }
      }
      /* Person auf dem Bahnsteig (Strichmännchen) */
      var px = X(-3 + verschiebung), m = S;
      var person = s("g", { "class": "person" }, f.svg);
      s("circle", { cx: px, cy: Y(1.62), r: 0.14 * m }, person);
      s("path", {
        d: "M" + px + " " + Y(1.48) + "V" + Y(0.85) +
           "M" + (px - 0.22 * m) + " " + Y(0) + "L" + px + " " + Y(0.85) + "L" + (px + 0.22 * m) + " " + Y(0) +
           "M" + (px - 0.26 * m) + " " + Y(1.0) + "L" + px + " " + Y(1.32) + "L" + (px + 0.26 * m) + " " + Y(1.0)
      }, person);

      /* Wagen mit Abschussrohr */
      var wx = X(wagenX);
      s("rect", { "class": "wagen", x: wx - 0.8 * S, y: Y(0.75), width: 1.6 * S, height: 0.45 * S, rx: 3 }, f.svg);
      s("rect", { "class": "wagen", x: wx - 0.09 * S, y: Y(Z0), width: 0.18 * S, height: (Z0 - 0.75) * S }, f.svg);
      s("circle", { "class": "rad", cx: wx - 0.48 * S, cy: Y(0.16), r: 0.16 * S }, f.svg);
      s("circle", { "class": "rad", cx: wx + 0.48 * S, cy: Y(0.16), r: 0.16 * S }, f.svg);

      /* Flugbahn des Balls in der gewählten Sicht */
      var pkt = [];
      for (var i = 0; i <= 60; i++) {
        var ti = T * i / 60;
        if (ti > t) break;
        pkt.push([X(boden ? z.u * ti : 0), Y(ballZ(ti))]);
      }
      var bx = X(boden ? z.u * t : 0), by = Y(ballZ(t));
      pkt.push([bx, by]);
      s("polyline", { "class": "kurve blau", points: linienzug(pkt) }, f.svg);

      /* Pfeile: Ballgeschwindigkeit (blau), Wagen bzw. Bahnsteig (kupfer) */
      var kv = begrenze(S * 0.32, 4, 9), vz = z.w - G * t;
      pfeil(f.svg, bx, by, bx + (boden ? z.u : 0) * kv, by - vz * kv, "blau");
      if (boden) {
        if (pfeil(f.svg, wx, Y(0.52), wx + z.u * kv, Y(0.52), "kupfer")) {
          txt(f.svg, wx + z.u * kv + 5, Y(0.52) + 4, "u", "kupfer klein");
        }
      } else if (z.u > 0) {
        var ax = X(xhi) - 8;
        pfeil(f.svg, ax, Y(0) + 20, ax - z.u * kv, Y(0) + 20, "kupfer");
        txt(f.svg, ax - z.u * kv - 6, Y(0) + 24, "Bahnsteig: −u", "kupfer klein", "end");
      }
      s("circle", { "class": "ball", cx: bx, cy: by, r: Math.max(5, 0.12 * S) }, f.svg);
    }

    var umschalter = h("div", "ia-umschalter");
    umschalter.setAttribute("role", "group");
    umschalter.setAttribute("aria-label", "Bezugssystem wählen");
    var kBoden = knopf(umschalter, "Sicht vom Bahnsteig", null, function () { waehle("boden"); });
    var kWagen = knopf(umschalter, "Sicht vom Wagen", null, function () { waehle("wagen"); });
    teil.bedienung.insertBefore(umschalter, teil.regler);
    function waehle(sicht) { z.sicht = sicht; zeichne(); }

    regler(teil.regler, {
      name: "Wagen-Tempo u", min: 0, max: 6, schritt: 0.5, wert: z.u,
      anzeige: function (w) { return zahl(w, 1) + " m/s"; }
    }, function (w) { z.u = w; zeichne(); });
    regler(teil.regler, {
      name: "Abschuss nach oben w", min: 3, max: 10, schritt: 0.5, wert: z.w,
      anzeige: function (w) { return zahl(w, 1) + " m/s"; }
    }, function (w) { z.w = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt im Flug", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * flugzeit(), 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spielKnopf = knopf(teil.knoepfe, "", "haupt", function () {});
    var spieler = abspieler({
      knopf: spielKnopf, text: "▶ Abschießen (Zeitlupe)", faktor: 0.5, vonVorn: true,
      hole: function () { return z.f * flugzeit(); },
      setze: function (t) { z.f = t / flugzeit(); rZeit.setze(z.f); zeichne(); },
      ende: flugzeit
    });

    var werte = werteLeiste(teil.bedienung, [
      ["T", "Flugzeit"], ["hoehe", "Steighöhe"], ["weg", "Ball waagerecht unterwegs"]
    ]);

    function zeichne() {
      var boden = z.sicht === "boden", T = flugzeit();
      kBoden.setAttribute("aria-pressed", boden ? "true" : "false");
      kWagen.setAttribute("aria-pressed", boden ? "false" : "true");
      rZeit.auffrischen();
      zeichneBuehne();
      werte.T.textContent = zahl(T, 2) + " s";
      werte.hoehe.textContent = zahl(z.w * z.w / (2 * G), 2) + " m";
      werte.weg.textContent = boden ? zahl(z.u * T, 1) + " m" : "0 m";
      teil.status.textContent = boden
        ? (z.u > 0
            ? "Vom Bahnsteig aus fliegt der Ball eine Parabel: Er behält die " + zahl(z.u, 1) +
              " m/s des Wagens bei und landet deshalb wieder genau im Rohr."
            : "Der Wagen steht – Bahnsteig und Wagen sehen dasselbe: senkrecht hoch und wieder runter.")
        : "Aus Sicht des Wagens geht der Ball einfach senkrecht hoch und wieder runter. " +
          "Dafür zieht der Bahnsteig samt Beobachter nach links vorbei.";
    }
    zeichne();
  }

  I.modell("wurf", wurf);
  I.modell("bezugssystem", bezugssystem);
})(window.Interaktiv);
