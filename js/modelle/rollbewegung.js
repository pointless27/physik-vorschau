/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/rollbewegung.html
   =========================================================================
   Modelle: zykloide, rollrennen.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/rollbewegung.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      txtIndex = I.txtIndex, pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 18: ZYKLOIDE – Punkt auf einem rollenden Rad.
     Mittelpunkt x = R·φ; Punkt im Abstand ρ: x = Rφ − ρ sin φ, y = R − ρ cos φ
     Geschwindigkeit des Punkts: ω·|AP| senkrecht zur Linie zum Auflagepunkt A
     ======================================================================= */
  function zykloide(fig) {
    var UMDR = 2, TMAX = 4;                            // 2 Umdrehungen in 4 s
    var z = { rho: 1, t: 1.3 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Rollendes Rad mit der Spur eines Punkts und dessen Geschwindigkeitspfeil",
      function (b) { var R = (b - 40) / (2 * Math.PI * UMDR + 2.6); return begrenze(2 * R + 70, 150, 260); }, zeichne);

    function lage(phi, R) {
      return [R * phi - z.rho * R * Math.sin(phi), R - z.rho * R * Math.cos(phi)];
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var R = Math.min((B - 40) / (2 * Math.PI * UMDR + 2.6), (H - 70) / 2);
      var x0 = 20 + 1.3 * R, yB = H - 34;
      var X = function (x) { return x0 + x; }, Y = function (y) { return yB - y; };
      var phi = Math.PI * z.t, w = Math.PI;            // ω = π pro Sekunde (in „Bild-Sekunden“)
      s("line", { "class": "achse", x1: 8, y1: yB, x2: B - 8, y2: yB }, f.svg);

      /* ganze Spur blass, zurückgelegter Teil kräftig */
      var alle = [], bisher = [], i, p;
      for (i = 0; i <= 240; i++) {
        var ph = i / 240 * 2 * Math.PI * UMDR;
        p = lage(ph, R);
        alle.push([X(p[0]), Y(p[1])]);
        if (ph <= phi) bisher.push([X(p[0]), Y(p[1])]);
      }
      p = lage(phi, R);
      bisher.push([X(p[0]), Y(p[1])]);
      s("polyline", { "class": "kurve schwach", points: linienzug(alle) }, f.svg);
      s("polyline", { "class": "kurve kupfer duenn", points: linienzug(bisher) }, f.svg);

      /* Rad mit Speichen */
      var mx = X(R * phi), my = Y(R);
      s("circle", { "class": "kurve", cx: mx, cy: my, r: R }, f.svg);
      for (i = 0; i < 6; i++) {
        var wi = phi + i * Math.PI / 3;
        s("line", { "class": "hilfslinie", x1: mx, y1: my, x2: mx - R * Math.sin(wi), y2: my + R * Math.cos(wi) }, f.svg);
      }
      var ax = mx, ay = yB;                             // Auflagepunkt
      var px = X(p[0]), py = Y(p[1]);
      s("line", { "class": "hilfslinie", x1: ax, y1: ay, x2: px, y2: py }, f.svg);

      /* Geschwindigkeiten (Bildmaßstab: v_S ↔ 0,9 R) */
      var k = 0.9 / w;                                  // Pixel pro (Pixel/s)
      var vS = w * R;
      pfeil(f.svg, mx, my, mx + vS * k, my, "blau");
      var vx = w * R - w * z.rho * R * Math.cos(phi), vy = -w * z.rho * R * Math.sin(phi); // Bildschirm: y nach unten
      pfeil(f.svg, px, py, px + vx * k, py + vy * k, "kupfer");
      s("circle", { "class": "punkt", cx: mx, cy: my, r: 3 }, f.svg);
      s("circle", { "class": "punkt kupfer", cx: px, cy: py, r: 5 }, f.svg);
      s("circle", { "class": "punkt", cx: ax, cy: ay, r: 3 }, f.svg);
      txtIndex(f.svg, mx + vS * k + 4, my + 4, "v", "S", "blau");
      txt(f.svg, ax, ay + 16, "A", "klein", "middle");
    }

    regler(teil.regler, {
      name: "Abstand des Punkts vom Mittelpunkt", min: 0, max: 1, schritt: 0.05, wert: z.rho,
      anzeige: function (w) { return w === 1 ? "am Rand" : zahl(w * 100, 0) + " % des Radius"; }
    }, function (w) { z.rho = w; zeichne(); });
    var rT = regler(teil.regler, {
      name: "Zeit", min: 0, max: TMAX, schritt: 0.01, wert: z.t,
      anzeige: function (w) { return zahl(w / 2, 2) + " Umdrehungen"; }
    }, function (w) { spieler.stopp(); z.t = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Rollen", faktor: 0.5,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; rT.setze(t); zeichne(); },
      ende: function () { return TMAX; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["v", "Tempo des Punkts"], ["h", "Höhe über dem Boden"]
    ]);

    function zeichne() {
      var phi = Math.PI * z.t;
      var vRel = Math.sqrt(1 - 2 * z.rho * Math.cos(phi) + z.rho * z.rho);   // |v_P| / v_S
      zeichneBuehne();
      werte.v.textContent = zahl(vRel, 2) + " × Tempo der Achse";
      werte.h.textContent = zahl(1 - z.rho * Math.cos(phi), 2) + " · R";
      teil.status.textContent = vRel < 0.03
        ? "Der Punkt berührt gerade den Boden und steht in diesem Augenblick still – ganz ohne zu schleifen."
        : "Der Punkt ist " + zahl(vRel, 2) + "-mal so schnell wie die Radachse. Sein Pfeil steht immer senkrecht auf der gestrichelten Linie zum Auflagepunkt A: Das Rad dreht sich in jedem Moment um A." +
          (z.rho === 1 ? " Ganz oben wird er doppelt so schnell wie die Achse." : "");
    }
    zeichne();
  }

  /* =======================================================================
     MODELL 19: ROLLRENNEN – vier Körper auf derselben schiefen Ebene,
     nebeneinander in Bahnen gezeichnet. a = g sin α / (1 + k)
     ======================================================================= */
  function rollrennen(fig) {
    var L = 2;                                         // Länge der Rampe in m
    var KOERPER = [
      { name: "Klotz (rutscht reibungsfrei)", kurz: "Klotz", k: 0, art: "klotz" },
      { name: "Vollkugel", kurz: "Vollkugel", k: 0.4, art: "kugel" },
      { name: "Vollzylinder", kurz: "Vollzylinder", k: 0.5, art: "zylinder" },
      { name: "Hohlzylinder", kurz: "Hohlzylinder", k: 1, art: "ring" }
    ];
    var z = { alpha: 15, r: 0.05, t: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Vier Körper rollen bzw. rutschen gleichzeitig eine schiefe Ebene hinunter, in getrennten Bahnen dargestellt",
      function (b) { return begrenze(b * 0.5, 280, 340); }, zeichne);

    function beschl(k) { return G * Math.sin(z.alpha * Math.PI / 180) / (1 + k); }
    function ankunft(k) { return Math.sqrt(2 * L / beschl(k)); }
    function dauer() { return ankunft(1) * 1.05; }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var links = 14, rechts = 26, S = (B - links - rechts) / (L + 0.2);
      var bahnH = (H - 30) / 4;
      txt(f.svg, links, 16, "Rampe " + L + " m lang, Neigung " + z.alpha + "° (Bahnen nebeneinander gezeichnet)", "klein");

      KOERPER.forEach(function (kp, i) {
        var yB = 30 + (i + 1) * bahnH - 8;
        var X = function (m) { return links + (m + 0.1) * S; };
        s("line", { "class": "achse", x1: links, y1: yB, x2: B - rechts + 10, y2: yB }, f.svg);
        s("line", { "class": "hilfslinie", x1: X(L), y1: yB - bahnH + 14, x2: X(L), y2: yB + 4 }, f.svg);
        var tA = ankunft(kp.k), tt = Math.min(z.t, tA);
        var sW = 0.5 * beschl(kp.k) * tt * tt;
        txt(f.svg, links + 2, yB - bahnH + 22, kp.kurz + (z.t >= tA ? " – im Ziel nach " + zahl(tA, 2) + " s" : ""), "klein");
        var rp = z.r * S, cx, cy = yB - rp;
        if (kp.art === "klotz") {
          s("rect", { "class": "wagen", x: X(sW) - 2 * rp, y: yB - 2 * rp, width: 2 * rp, height: 2 * rp, rx: 2 }, f.svg);
          return;
        }
        cx = X(sW) - rp;
        var th = sW / z.r;                                  // Drehwinkel = Weg / Radius
        if (kp.art === "ring") {
          s("circle", { "class": "kurve kupfer", cx: cx, cy: cy, r: rp - 2 }, f.svg);
        } else {
          s("circle", { "class": kp.art === "kugel" ? "ball" : "ball blau", cx: cx, cy: cy, r: rp }, f.svg);
        }
        s("line", { "class": "achse", x1: cx, y1: cy, x2: cx + rp * Math.sin(th), y2: cy - rp * Math.cos(th) }, f.svg);
      });
      txt(f.svg, B - rechts + 8, 34, "Ziel", "klein", "end");
    }

    regler(teil.regler, {
      name: "Neigung der Rampe", min: 3, max: 40, schritt: 1, wert: z.alpha,
      anzeige: function (w) { return w + "°"; }
    }, function (w) { spieler.stopp(); z.alpha = w; z.t = 0; zeichne(); });
    regler(teil.regler, {
      name: "Radius der Körper", min: 0.02, max: 0.08, schritt: 0.01, wert: z.r,
      anzeige: function (w) { return zahl(w * 100, 0) + " cm"; }
    }, function (w) { z.r = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Start", faktor: 1, vonVorn: true,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; zeichne(); },
      ende: dauer
    });
    knopf(teil.knoepfe, "Zurück an den Start", null, function () { spieler.stopp(); z.t = 0; zeichne(); });

    var werte = werteLeiste(teil.bedienung, KOERPER.map(function (kp, i) { return ["k" + i, kp.kurz]; }));

    function zeichne() {
      zeichneBuehne();
      KOERPER.forEach(function (kp, i) {
        werte["k" + i].textContent = zahl(ankunft(kp.k), 2) + " s · " + zahl(Math.sqrt(2 * beschl(kp.k) * L), 2) + " m/s";
      });
      teil.status.textContent = "Laufzeit und Endgeschwindigkeit auf " + L + " m Rampe. Der Hohlzylinder braucht " +
        zahl((ankunft(1) / ankunft(0.4) - 1) * 100, 0) + " % länger als die Vollkugel – bei jeder Neigung und jeder Größe, denn in a = g·sin α/(1 + k) kommen weder Masse noch Radius vor.";
    }
    zeichne();
  }

  I.modell("zykloide", zykloide);
  I.modell("rollrennen", rollrennen);
})(window.Interaktiv);
