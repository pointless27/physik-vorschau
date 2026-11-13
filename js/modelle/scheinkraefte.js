/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/scheinkraefte.html
   =========================================================================
   Modelle: kettenkarussell, drehscheibe.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/scheinkraefte.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL: KETTENKARUSSELL – Zentrifugalkraft              (scheinkraefte)
     Im mitrotierenden System ziehen Gewicht m·g und Zentrifugalkraft
     m·ω²·r zusammen in Kettenrichtung:  tan θ = ω²·r / g  mit
     r = ARM + L·sin θ (Fixpunkt-Iteration). θ ist von der Masse unabhängig.
     ======================================================================= */
  function kettenkarussell(fig) {
    var ARM = 2.2, L = 3.0, NABE = 6;                  // Ausleger, Kettenlänge, Nabenhöhe in m
    var z = { n: 8, t: 0 };                            // Drehzahl in U/min, Zeit fürs Abspielen
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Kettenkarussell von der Seite: drei Sitze an Ketten schwingen beim Drehen nach außen",
      function (b) { return begrenze(b * 0.5, 230, 320); }, zeichne);

    function om() { return z.n * 2 * Math.PI / 60; }
    function winkel() {                                 // Kettenwinkel gegen die Senkrechte
      var c = om() * om() / G, th = 0;
      for (var i = 0; i < 50; i++) th = Math.atan(c * (ARM + L * Math.sin(th)));
      return th;
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, th = winkel();
      f.leeren();
      var halb = ARM + L + 0.8;
      var S = Math.min((B - 16) / (2 * halb), (H - 14) / (NABE + 0.9));
      var X = function (x) { return B / 2 + x * S; };
      var Y = function (zz) { return H - 8 - zz * S; };
      s("line", { "class": "achse", x1: 8, y1: Y(0), x2: B - 8, y2: Y(0) }, f.svg);
      s("rect", { "class": "wagen", x: X(-0.16), y: Y(NABE + 0.35), width: 0.32 * S, height: (NABE + 0.35) * S }, f.svg);

      /* drei Sitze (einer bleibt leer), von hinten nach vorn gezeichnet */
      var sitze = [0, 1, 2].map(function (k) {
        var phi = om() * z.t + k * 2 * Math.PI / 3 + 0.35;
        return { sx: Math.sin(phi), tiefe: Math.cos(phi), person: k !== 1 };
      }).sort(function (a, b) { return b.tiefe - a.tiefe; });

      var vorderster = sitze.reduce(function (a, b) { return Math.abs(b.sx) > Math.abs(a.sx) ? b : a; });
      sitze.forEach(function (sitz) {
        var g = s("g", sitz.tiefe > 0.2 ? { opacity: 0.45 } : null, f.svg);
        var tipX = X(ARM * sitz.sx), tipY = Y(NABE);
        var chX = X((ARM + L * Math.sin(th)) * sitz.sx), chY = Y(NABE - L * Math.cos(th));
        s("line", { "class": "pfosten", x1: X(0), y1: Y(NABE), x2: tipX, y2: tipY }, g);
        /* Geisterbild: so hinge die Kette ohne Drehung */
        if (sitz === vorderster && th > 0.06) {
          s("line", { "class": "hilfslinie", x1: tipX, y1: tipY, x2: tipX, y2: Y(NABE - L) }, g);
        }
        s("line", { "class": "kurve duenn", x1: tipX, y1: tipY, x2: chX, y2: chY }, g);
        /* Sitz quer zur Kette, Person entlang der Kette geneigt */
        var dx = chX - tipX, dy = chY - tipY, dl = Math.sqrt(dx * dx + dy * dy) || 1;
        var ux = dx / dl, uy = dy / dl, px = -uy, py = ux;
        s("line", { "class": "kurve", x1: chX - px * 0.23 * S, y1: chY - py * 0.23 * S, x2: chX + px * 0.23 * S, y2: chY + py * 0.23 * S }, g);
        if (sitz.person) {
          s("circle", { "class": "punkt", cx: chX - ux * 0.52 * S, cy: chY - uy * 0.52 * S, r: 0.11 * S }, g);
          var p = s("g", { "class": "person" }, g);
          s("line", { x1: chX - ux * 0.42 * S, y1: chY - uy * 0.42 * S, x2: chX, y2: chY }, p);
        }
      });
      s("circle", { "class": "rad", cx: X(0), cy: Y(NABE), r: 0.18 * S }, f.svg);
    }

    regler(teil.regler, {
      name: "Drehzahl", min: 0, max: 15, schritt: 0.5, wert: z.n,
      anzeige: function (w) { return zahl(w, 1) + " U/min"; }
    }, function (w) { spieler.stopp(); z.n = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Drehen", faktor: 1, vonVorn: true,
      hole: function () { return z.t; },
      setze: function (t) { z.t = t; zeichne(); },
      ende: function () { return z.n > 0 ? Math.min(60 / z.n, 12) : 0; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["winkel", "Kettenwinkel"], ["tempo", "Bahngeschwindigkeit"],
      ["az", "Beschleunigung nach außen"], ["zug", "Zug in der Kette"]
    ]);

    function zeichne() {
      var th = winkel(), w = om(), r = ARM + L * Math.sin(th);
      zeichneBuehne();
      werte.winkel.textContent = zahl(th * 180 / Math.PI, 0) + "°";
      werte.tempo.textContent = zahl(w * r, 1) + " m/s (" + zahl(w * r * 3.6, 0) + " km/h)";
      werte.az.textContent = zahl(w * w * r, 1) + " m/s²";
      werte.zug.textContent = zahl(1 / Math.cos(th), 2) + " × Gewicht";
      teil.status.textContent = z.n === 0
        ? "Ohne Drehung hängen die Ketten senkrecht. Dreh die Drehzahl auf und schau, was passiert."
        : "Die Ketten stellen sich um " + zahl(th * 180 / Math.PI, 0) + "° schräg: Im mitdrehenden Sitz ziehen " +
          "Gewicht und Zentrifugalkraft zusammen genau in Kettenrichtung. Der leere Sitz hängt dabei genauso " +
          "schräg wie die besetzten – die Masse kürzt sich heraus.";
    }
    zeichne();
  }

  /* =======================================================================
     MODELL: DREHSCHEIBE – Corioliskraft                     (scheinkraefte)
     Scheibe (Radius 2 m) dreht von oben gesehen gegen den Uhrzeigersinn.
     Ein Ball rollt reibungsfrei mit konstantem Tempo v vom Mittelpunkt zum
     Rand. Laborsicht: gerade Bahn x = v·t. Mitdrehende Sicht: r = v·t,
     Schirmwinkel −ω·t → Rechtskurve (wie auf der Nordhalbkugel).
     ======================================================================= */
  function drehscheibe(fig) {
    var RS = 2;                                        // Scheibenradius in m
    var z = { v: 1.5, n: 10, sicht: "aussen", f: 0 };  // n in U/min, f = Anteil der Rollzeit
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Drehscheibe von oben mit Fänger am Rand; ein Ball rollt vom Mittelpunkt nach außen",
      function (b) { return begrenze(b * 0.56, 250, 340); }, zeichne);

    function om() { return z.n * 2 * Math.PI / 60; }
    function dauer() { return RS / z.v; }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = (Math.min(B, H) - 26) / (2 * RS);
      var cx = B / 2, cy = H / 2, R = RS * S;
      var t = z.f * dauer(), ph = om() * t;            // bisheriger Drehwinkel der Scheibe
      var aussen = z.sicht === "aussen";

      s("circle", { "class": "flaeche", cx: cx, cy: cy, r: R }, f.svg);
      var base = aussen ? ph : 0, k;
      for (k = 0; k < 12; k++) {
        var a = base + k * Math.PI / 6;
        s("line", { "class": "gitter", x1: cx, y1: cy, x2: cx + R * Math.cos(a), y2: cy - R * Math.sin(a) }, f.svg);
      }
      s("circle", { "class": "kurve duenn", cx: cx, cy: cy, r: R }, f.svg);

      /* Drehrichtung (kleiner Bogen außen), nur wenn sich die Scheibe dreht */
      if (z.n > 0) {
        var bogen = [];
        for (k = 0; k <= 10; k++) {
          var ba = (25 + 4 * k) * Math.PI / 180;
          bogen.push([cx + (R + 9) * Math.cos(ba), cy - (R + 9) * Math.sin(ba)]);
        }
        s("polyline", { "class": "kurve kupfer duenn", points: linienzug(bogen), fill: "none" }, f.svg);
        var e1 = bogen[10], e0 = bogen[9], ddx = e1[0] - e0[0], ddy = e1[1] - e0[1], dn = Math.sqrt(ddx * ddx + ddy * ddy);
        ddx /= dn; ddy /= dn;
        s("polygon", {
          "class": "punkt kupfer",
          points: (e1[0] + ddx * 7).toFixed(1) + "," + (e1[1] + ddy * 7).toFixed(1) + " " +
                  (e1[0] - ddy * 3.2).toFixed(1) + "," + (e1[1] + ddx * 3.2).toFixed(1) + " " +
                  (e1[0] + ddy * 3.2).toFixed(1) + "," + (e1[1] - ddx * 3.2).toFixed(1)
        }, f.svg);
      }

      /* Ziellinie (auf die Scheibe gemalt) und Fänger am Rand */
      var aF = aussen ? ph : 0;
      var fx = cx + R * Math.cos(aF), fy = cy - R * Math.sin(aF);
      s("line", { "class": "hilfslinie", x1: cx, y1: cy, x2: fx, y2: fy }, f.svg);
      s("circle", { "class": "punkt kupfer", cx: fx, cy: fy, r: 5.5 }, f.svg);
      var lx = cx + (R + 15) * Math.cos(aF), ly = cy - (R + 15) * Math.sin(aF) + 4;
      var anker = Math.cos(aF) > 0.3 ? "start" : Math.cos(aF) < -0.3 ? "end" : "middle";
      /* Schmale Bühne (Handy): Schild würde seitlich hinausragen (~42 px
         breit) → stattdessen über bzw. unter den Fänger setzen */
      if ((anker === "start" && lx + 42 > B) || (anker === "end" && lx - 42 < 0)) {
        lx = Math.min(Math.max(fx, 22), B - 22);
        ly = fy + (Math.sin(aF) >= 0 ? -12 : 20);
        anker = "middle";
      }
      txt(f.svg, lx, ly, "Fänger", "kupfer klein halo", anker);

      /* Bahn: ganze Bahn blass, bis t kräftig blau */
      var i, pkt, bisher;
      if (aussen) {
        s("line", { "class": "kurve schwach", x1: cx, y1: cy, x2: cx + R, y2: cy }, f.svg);
        if (t > 0) s("line", { "class": "kurve blau", x1: cx, y1: cy, x2: cx + z.v * t * S, y2: cy }, f.svg);
      } else {
        pkt = []; bisher = [];
        for (i = 0; i <= 72; i++) {
          var ti = dauer() * i / 72, b2 = om() * ti;
          var p = [cx + z.v * ti * S * Math.cos(b2), cy + z.v * ti * S * Math.sin(b2)];
          pkt.push(p);
          if (ti <= t) bisher.push(p);
        }
        s("polyline", { "class": "kurve schwach", points: linienzug(pkt) }, f.svg);
        if (bisher.length > 1) s("polyline", { "class": "kurve blau", points: linienzug(bisher) }, f.svg);
      }

      /* Ball mit Geschwindigkeitspfeil in der jeweiligen Sicht */
      var kv = begrenze(S * 0.5, 14, 26), bx, by, vx, vy;
      if (aussen) {
        bx = cx + z.v * t * S; by = cy; vx = z.v; vy = 0;
      } else {
        var be = om() * t, r2 = z.v * t;
        bx = cx + r2 * S * Math.cos(be); by = cy + r2 * S * Math.sin(be);
        vx = z.v * Math.cos(be) - r2 * om() * Math.sin(be);
        vy = z.v * Math.sin(be) + r2 * om() * Math.cos(be);
      }
      pfeil(f.svg, bx, by, bx + vx * kv, by + vy * kv, "blau");
      s("circle", { "class": "ball", cx: bx, cy: by, r: 6 }, f.svg);
    }

    var umschalter = h("div", "ia-umschalter");
    umschalter.setAttribute("role", "group");
    umschalter.setAttribute("aria-label", "Sicht wählen");
    var kAussen = knopf(umschalter, "Sicht von außen", null, function () { z.sicht = "aussen"; zeichne(); });
    var kMit = knopf(umschalter, "Mitdrehende Sicht", null, function () { z.sicht = "mit"; zeichne(); });
    teil.bedienung.insertBefore(umschalter, teil.regler);

    regler(teil.regler, {
      name: "Drehzahl der Scheibe", min: 0, max: 20, schritt: 1, wert: z.n,
      anzeige: function (w) { return zahl(w, 0) + " U/min"; }
    }, function (w) { z.n = w; zeichne(); });
    regler(teil.regler, {
      name: "Balltempo v", min: 0.5, max: 3, schritt: 0.1, wert: z.v,
      anzeige: function (w) { return zahl(w, 1) + " m/s"; }
    }, function (w) { z.v = w; zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * dauer(), 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Ball rollen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * dauer(); },
      setze: function (t) { z.f = t / dauer(); rZeit.setze(z.f); zeichne(); },
      ende: dauer
    });

    var werte = werteLeiste(teil.bedienung, [
      ["umlauf", "Umlaufzeit der Scheibe"], ["roll", "Rollzeit bis zum Rand"],
      ["rand", "Tempo des Scheibenrands"], ["versatz", "Verfehlt den Fänger um"]
    ]);

    function zeichne() {
      var aussen = z.sicht === "aussen", T = dauer(), versatz = RS * om() * T;
      kAussen.setAttribute("aria-pressed", aussen ? "true" : "false");
      kMit.setAttribute("aria-pressed", aussen ? "false" : "true");
      rZeit.auffrischen();
      zeichneBuehne();
      werte.umlauf.textContent = z.n > 0 ? zahl(60 / z.n, 1) + " s" : "steht";
      werte.roll.textContent = zahl(T, 2) + " s";
      werte.rand.textContent = zahl(om() * RS, 1) + " m/s";
      werte.versatz.textContent = z.n > 0 ? zahl(versatz, 1) + " m (am Rand)" : "trifft!";
      teil.status.textContent = z.n === 0
        ? "Die Scheibe steht: In beiden Sichten rollt der Ball schnurgerade zum Fänger."
        : aussen
          ? "Von außen ist nichts Geheimnisvolles zu sehen: Der Ball rollt geradeaus. Aber die Scheibe dreht " +
            "den Fänger in den " + zahl(T, 1) + " s Rollzeit um " + zahl(versatz, 1) + " m weiter."
          : "In der mitdrehenden Sicht krümmt sich die Bahn nach rechts, als drückte eine Kraft den Ball zur " +
            "Seite – die Corioliskraft. Von außen betrachtet (Sicht wechseln!) rollt er schnurgerade.";
    }
    zeichne();
  }

  I.modell("kettenkarussell", kettenkarussell);
  I.modell("drehscheibe", drehscheibe);
})(window.Interaktiv);
