/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/kreisel.html
   =========================================================================
   Modelle: praezession.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/kreisel.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL 20: PRÄZESSION – Rad an waagerechter Achse, einseitig auf einer
     Spitze gelagert. ω_P = m·g·r / (I·ω), D = r × m·g (waagerecht, ⊥ Achse)
     Darstellung: Schrägansicht von leicht oben (Blickhöhe 22°).
     ======================================================================= */
  function praezession(fig) {
    var M = 2.0, R_RAD = 0.15, ERHEB = 22 * Math.PI / 180;   // kg, m, Blickwinkel
    var I = 0.5 * M * R_RAD * R_RAD;                          // Vollscheibe
    var z = { f: 20, r: 0.2, phi: -0.5, spin: 0, t: 0, tAlt: 0 };
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Schnell drehendes Rad an einer waagerechten Achse, die auf einer Spitze ruht und im Kreis wandert; Pfeile für Drehimpuls und Drehmoment",
      function (b) { return begrenze(b * 0.55, 260, 340); }, zeichne);

    function omega() { return 2 * Math.PI * z.f; }
    function drehimpuls() { return I * omega(); }
    function drehmoment() { return M * G * z.r; }
    function omegaP() { return drehmoment() / drehimpuls(); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h;
      f.leeren();
      var S = Math.min((B - 40) / 0.75, (H - 40) / 0.62);
      var cx = B / 2, cy = 40 + 0.2 * S;               // Spitze (Lagerpunkt)
      var ce = Math.cos(ERHEB), se = Math.sin(ERHEB);
      /* Welt: x nach rechts, y in die Tiefe, z nach oben */
      function P(x, y, zz) { return [cx + x * S, cy - (zz * ce + y * se) * S]; }
      var c = Math.cos(z.phi), sn = Math.sin(z.phi);
      var u = [c, sn, 0], v = [-sn, c, 0];             // Achsrichtung, Querrichtung
      function auf(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
      function plus(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
      function Pv(a) { return P(a[0], a[1], a[2]); }

      /* Präzessionskreis des Radmittelpunkts und Ständer */
      var kreis = [];
      for (var i = 0; i <= 72; i++) {
        var w = i / 72 * 2 * Math.PI;
        kreis.push(P(z.r * Math.cos(w), z.r * Math.sin(w), 0));
      }
      s("polyline", { "class": "hilfslinie", points: linienzug(kreis) }, f.svg);
      var fuss = P(0, 0, -0.42), spitze = P(0, 0, 0);
      s("line", { "class": "achse", x1: fuss[0] - 40, y1: fuss[1], x2: fuss[0] + 40, y2: fuss[1] }, f.svg);
      s("line", { "class": "achse", x1: fuss[0], y1: fuss[1], x2: spitze[0], y2: spitze[1] }, f.svg);

      /* Rad: Kreis in der Ebene senkrecht zur Achse, Speichen drehen mit */
      var mitte = auf(u, z.r);
      var rand = [], hinten = Math.sin(z.phi) > 0;      // Rad liegt hinter dem Lager?
      for (i = 0; i <= 72; i++) {
        var t = i / 72 * 2 * Math.PI;
        rand.push(Pv(plus(mitte, plus(auf(v, R_RAD * Math.cos(t)), [0, 0, R_RAD * Math.sin(t)]))));
      }
      var achseEnde = Pv(auf(u, z.r + 0.05)), pm = Pv(mitte);
      function zeichneRad() {
        s("polygon", { "class": "wagen", points: linienzug(rand), "fill-opacity": 0.85 }, f.svg);
        for (var k = 0; k < 3; k++) {
          var tt = z.spin + k * Math.PI / 3;
          var a = Pv(plus(mitte, plus(auf(v, R_RAD * Math.cos(tt)), [0, 0, R_RAD * Math.sin(tt)])));
          var b = Pv(plus(mitte, plus(auf(v, -R_RAD * Math.cos(tt)), [0, 0, -R_RAD * Math.sin(tt)])));
          s("line", { "class": "hilfslinie", x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, f.svg);
        }
      }
      if (hinten) zeichneRad();
      s("line", { "class": "kurve", x1: spitze[0], y1: spitze[1], x2: achseEnde[0], y2: achseEnde[1] }, f.svg);
      if (!hinten) zeichneRad();
      s("circle", { "class": "punkt", cx: spitze[0], cy: spitze[1], r: 3.5 }, f.svg);
      s("circle", { "class": "punkt", cx: pm[0], cy: pm[1], r: 3 }, f.svg);

      /* Pfeile: L entlang der Achse (Länge ∝ L), D am Lager entlang v, Gewicht */
      var lL = 0.3 * z.f / 40;                         // Pfeillänge ∝ L
      var lEnde = Pv(auf(u, z.r + 0.05 + lL));
      pfeil(f.svg, achseEnde[0], achseEnde[1], lEnde[0], lEnde[1], "kupfer");
      txt(f.svg, lEnde[0] + 6, lEnde[1] - 4, "L", "kupfer");
      var dEnde = Pv(auf(v, 0.07 + z.r * 0.6));
      pfeil(f.svg, spitze[0], spitze[1], dEnde[0], dEnde[1], "blau");
      txt(f.svg, dEnde[0] + 6, dEnde[1] - 4, "D", "blau");
      pfeil(f.svg, pm[0], pm[1], pm[0], pm[1] + 0.16 * S, "duenn");
      txt(f.svg, pm[0] + 6, pm[1] + 0.16 * S, "m g", "klein");
      txt(f.svg, 8, 16, "Präzession gegen den Uhrzeigersinn (von oben gesehen)", "klein");
    }

    regler(teil.regler, {
      name: "Drehzahl des Rades", min: 5, max: 40, schritt: 1, wert: z.f,
      anzeige: function (w) { return w + " U/s"; }
    }, function (w) { z.f = w; zeichne(); });
    regler(teil.regler, {
      name: "Abstand Rad – Lager", min: 0.1, max: 0.3, schritt: 0.01, wert: z.r,
      anzeige: function (w) { return zahl(w * 100, 0) + " cm"; }
    }, function (w) { z.r = w; zeichne(); });

    abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Loslassen", faktor: 1,
      hole: function () { return z.t; },
      setze: function (t) {
        if (t > z.tAlt) {
          z.phi += omegaP() * (t - z.tAlt);
          z.spin += Math.min(omega(), 9) * (t - z.tAlt);   // Speichen sichtbar langsamer
        }
        z.t = t; z.tAlt = t;
        zeichne();
      },
      ende: function () { return 600; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["l", "Drehimpuls"], ["d", "Drehmoment"], ["wp", "Präzession"], ["tp", "ein Umlauf"]
    ]);

    function zeichne() {
      var wp = omegaP(), q = wp / omega();
      zeichneBuehne();
      werte.l.textContent = zahl(drehimpuls(), 2) + " kg·m²/s";
      werte.d.textContent = zahl(drehmoment(), 2) + " N·m";
      werte.wp.textContent = zahl(wp, 2) + " 1/s";
      werte.tp.textContent = zahl(2 * Math.PI / wp, 1) + " s";
      teil.status.textContent = (q > 0.1
        ? "Achtung: Das Rad dreht so langsam, dass die Formel nur noch grob stimmt (Präzession " + zahl(q * 100, 0) +
          " % der Drehung) – ein echtes Rad würde merklich absacken und taumeln. "
        : "") + "Das Drehmoment der Gewichtskraft zeigt waagerecht zur Seite. Es verändert nur die Richtung des Drehimpulses, nicht seine Länge: Die Achse weicht seitlich aus, statt herunterzufallen. Halbe Drehzahl heißt doppelt so schnelle Präzession.";
    }
    zeichne();
  }

  I.modell("praezession", praezession);
})(window.Interaktiv);
