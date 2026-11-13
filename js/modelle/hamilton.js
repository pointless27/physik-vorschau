/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/hamilton.html
   =========================================================================
   Modelle: phasenraum, liouville.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/hamilton.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze,
      txt = I.txt, linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, werteLeiste = I.werteLeiste,
      abspieler = I.abspieler, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere, aufKreis = I.aufKreis;

  /* -----------------------------------------------------------------------
     Gemeinsame Helfer: Pendel im Phasenraum              (hamilton, noether)
     Pendel mit l = 1 m, m = 1 kg: p = m l² θ̇ hat den Zahlenwert von θ̇,
     H = p²/(2 m l²) − m g l cos θ (in J); Separatrix bei H = m g l.
     ----------------------------------------------------------------------- */
  var OM0 = Math.sqrt(G);                              // √(g/l) für l = 1 m

  /* ein RK4-Schritt der kanonischen Gleichungen q̇ = p, ṗ = −g sin q
     (harmonisch: ṗ = −g q) */
  function pendelSchritt(q, p, dt, harmonisch) {
    function kraft(x) { return harmonisch ? -G * x : -G * Math.sin(x); }
    var k1q = p, k1p = kraft(q);
    var k2q = p + dt / 2 * k1p, k2p = kraft(q + dt / 2 * k1q);
    var k3q = p + dt / 2 * k2p, k3p = kraft(q + dt / 2 * k2q);
    var k4q = p + dt * k3p, k4p = kraft(q + dt * k3q);
    return [q + dt / 6 * (k1q + 2 * k2q + 2 * k3q + k4q),
            p + dt / 6 * (k1p + 2 * k2p + 2 * k3p + k4p)];
  }


  /* vollständiges elliptisches Integral 1. Art, K(k) = π / (2 AGM(1, √(1 − k²))) */
  function ellK(k) {
    var a = 1, b = Math.sqrt(1 - k * k);
    for (var i = 0; i < 40 && Math.abs(a - b) > 1e-15; i++) { var c = (a + b) / 2; b = Math.sqrt(a * b); a = c; }
    return Math.PI / (2 * a);
  }

  /* Rahmen eines Phasenraum-Diagramms (θ waagerecht von −180° bis 180°,
     p senkrecht von −PMAX bis PMAX) mit Höhenlinien von H.
     box = {l, o, b, h}; liefert X(θ), Y(p) und eine beschnittene Gruppe. */
  function phasenRahmen(svg, box, PMAX, harmonisch) {
    var X = function (q) { return box.l + (q + Math.PI) / (2 * Math.PI) * box.b; };
    var Y = function (p) { return box.o + (PMAX - p) / (2 * PMAX) * box.h; };
    var id = "ia-clip-" + (I.neueNr());
    var clip = s("clipPath", { id: id }, s("defs", null, svg));
    s("rect", { x: box.l, y: box.o, width: box.b, height: box.h }, clip);
    [-180, -90, 0, 90, 180].forEach(function (g, n) {
      var x = X(g * Math.PI / 180);
      s("line", { "class": "gitter", x1: x, y1: box.o, x2: x, y2: box.o + box.h }, svg);
      txt(svg, x, box.o + box.h + 15, (g < 0 ? "−" : "") + Math.abs(g) + "°", "klein",
        n === 0 ? "start" : n === 4 ? "end" : "middle");
    });
    for (var k = -8; k <= 8; k += 4) {
      s("line", { "class": "gitter", x1: box.l, y1: Y(k), x2: box.l + box.b, y2: Y(k) }, svg);
      txt(svg, box.l - 5, Y(k) + 4, zahl(k, 0), "klein", "end");
    }
    var bild = s("g", { "clip-path": "url(#" + id + ")" }, svg);
    var i, pkt, unten, phi;
    /* Höhenlinien H = e·m g l (bezogen auf den Aufhängepunkt) */
    var stufen = harmonisch ? [0.15, 0.5, 1, 2, 3.5] : [-0.75, -0.3, 0.3, 1.6, 2.6];
    stufen.forEach(function (e) {
      pkt = [];
      if (harmonisch) {                                // Ellipsen θ = A cos φ, p = A ω0 sin φ
        var A = Math.sqrt(2 * e);
        for (i = 0; i <= 120; i++) { phi = 2 * Math.PI * i / 120; pkt.push([X(A * Math.cos(phi)), Y(A * OM0 * Math.sin(phi))]); }
        s("polyline", { "class": "kurve schwach", points: linienzug(pkt) }, bild);
      } else if (e < 1) {                              // Schwingung: geschlossene Kurve
        var qm = Math.acos(-e);
        for (i = 0; i <= 120; i++) {
          phi = 2 * Math.PI * i / 120;
          var q = qm * Math.cos(phi), w = Math.sqrt(Math.max(0, 2 * G * (e + Math.cos(q))));
          pkt.push([X(q), Y(Math.sin(phi) >= 0 ? w : -w)]);
        }
        s("polyline", { "class": "kurve schwach", points: linienzug(pkt) }, bild);
      } else {                                         // Überschlag: oben und unten offen
        unten = [];
        for (i = 0; i <= 120; i++) {
          var q2 = -Math.PI + 2 * Math.PI * i / 120, w2 = Math.sqrt(2 * G * (e + Math.cos(q2)));
          pkt.push([X(q2), Y(w2)]); unten.push([X(q2), Y(-w2)]);
        }
        s("polyline", { "class": "kurve schwach", points: linienzug(pkt) }, bild);
        s("polyline", { "class": "kurve schwach", points: linienzug(unten) }, bild);
      }
    });
    if (!harmonisch) {                                 // Separatrix p = ±2 √(g l) cos(θ/2)
      pkt = []; unten = [];
      for (i = 0; i <= 120; i++) {
        var q3 = -Math.PI + 2 * Math.PI * i / 120, w3 = 2 * OM0 * Math.cos(q3 / 2);
        pkt.push([X(q3), Y(w3)]); unten.push([X(q3), Y(-w3)]);
      }
      s("polyline", { "class": "kurve kupfer duenn", points: linienzug(pkt) }, bild);
      s("polyline", { "class": "kurve kupfer duenn", points: linienzug(unten) }, bild);
    }
    s("line", { "class": "achse", x1: box.l, y1: Y(0), x2: box.l + box.b, y2: Y(0) }, svg);
    s("line", { "class": "achse", x1: box.l, y1: box.o, x2: box.l, y2: box.o + box.h }, svg);
    txt(svg, box.l + 6, box.o + 12, "Impuls p in kg·m²/s", "klein halo");
    txt(svg, box.l + box.b - 4, Y(0) - 6, "Winkel θ", "klein halo", "end");
    return { X: X, Y: Y, bild: bild };
  }

  /* Bahn im Phasenraum als Linienzug; bricht beim Sprung über ±180° um */
  function phasenBahn(eltern, liste, X, Y, klasse) {
    var stueck = [], alt = null;
    liste.forEach(function (pq) {
      var q = aufKreis(pq[0]);
      if (alt !== null && Math.abs(q - alt) > Math.PI) {
        if (stueck.length > 1) s("polyline", { "class": klasse, points: linienzug(stueck) }, eltern);
        stueck = [];
      }
      stueck.push([X(q), Y(pq[1])]);
      alt = q;
    });
    if (stueck.length > 1) s("polyline", { "class": klasse, points: linienzug(stueck) }, eltern);
  }

  /* =======================================================================
     MODELL: PHASENRAUM DES PENDELS                                (hamilton)
     Kanonische Gleichungen q̇ = ∂H/∂p = p, ṗ = −∂H/∂q = −g sin q (l = 1 m,
     m = 1 kg), RK4. Energie über der Ruhelage E = H + m g l.
     Periode: Schwingung T = 4 K(k)/ω0 mit k² = E/(2 m g l);
              Überschlag T = 2 κ K(κ)/ω0 mit κ² = 2 m g l / E.
     ======================================================================= */
  function phasenraum(fig) {
    var PMAX = 9, DAUER = 8, DT = 0.002, JEDE = 5;
    var z = { q0: 60, p0: 0, f: 0 };
    var bahn = [];
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Links ein Pendel, rechts sein Phasenraum mit dem Winkel nach rechts und dem Impuls nach oben",
      function (b) { return b >= 540 ? begrenze(b * 0.44, 250, 330) : Math.round(b * 0.7) + 160; }, zeichne);

    function rechne() {
      bahn = [];
      var q = z.q0 * Math.PI / 180, p = z.p0, n = Math.round(DAUER / DT);
      for (var i = 0; i <= n; i++) {
        if (i % JEDE === 0) bahn.push([q, p]);
        var r = pendelSchritt(q, p, DT, false); q = r[0]; p = r[1];
      }
    }
    function jetzt() { return bahn[Math.round(z.f * (bahn.length - 1))]; }
    function energie() { return z.p0 * z.p0 / 2 + G * (1 - Math.cos(z.q0 * Math.PI / 180)); }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, pq = jetzt();
      f.leeren();
      var breit = B >= 540, pend, box;
      if (breit) {
        var w = Math.min(H, B * 0.32);
        pend = { x: w / 2, y: H / 2, L: w * 0.36 };
        box = { l: w + 34, o: 10, b: B - w - 44, h: H - 32 };
      } else {
        pend = { x: B / 2, y: 80, L: 60 };
        box = { l: 34, o: 168, b: B - 44, h: H - 190 };
      }
      /* Pendel: Kreis der möglichen Lagen, Stange, Kugel */
      s("circle", { "class": "hilfslinie", cx: pend.x, cy: pend.y, r: pend.L }, f.svg);
      var bx = pend.x + pend.L * Math.sin(pq[0]), by = pend.y + pend.L * Math.cos(pq[0]);
      s("line", { "class": "kurve duenn", x1: pend.x, y1: pend.y, x2: bx, y2: by }, f.svg);
      s("circle", { "class": "punkt", cx: pend.x, cy: pend.y, r: 3.5 }, f.svg);
      s("circle", { "class": "ball", cx: bx, cy: by, r: 9 }, f.svg);
      txt(f.svg, pend.x, pend.y + pend.L + 30, "θ = " + zahl(aufKreis(pq[0]) * 180 / Math.PI, 0) + "°", "klein", "middle");

      var ph = phasenRahmen(f.svg, box, PMAX, false);
      phasenBahn(ph.bild, bahn, ph.X, ph.Y, "kurve blau");
      s("circle", { "class": "punkt kupfer", cx: ph.X(aufKreis(pq[0])), cy: ph.Y(pq[1]), r: 5.5 }, ph.bild);
    }

    regler(teil.regler, {
      name: "Startwinkel", min: -180, max: 180, schritt: 1, wert: z.q0,
      anzeige: function (w) { return zahl(w, 0) + "°"; }
    }, function (w) { spieler.stopp(); z.q0 = w; z.f = 0; rZeit.setze(0); rechne(); zeichne(); });
    regler(teil.regler, {
      name: "Startimpuls (Anschubsen)", min: -8, max: 8, schritt: 0.1, wert: z.p0,
      anzeige: function (w) { return zahl(w, 1) + " kg·m²/s"; }
    }, function (w) { spieler.stopp(); z.p0 = w; z.f = 0; rZeit.setze(0); rechne(); zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeit", min: 0, max: 1, schritt: 0.001, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * DAUER, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Pendeln lassen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * DAUER; },
      setze: function (t) { z.f = t / DAUER; rZeit.setze(z.f); zeichne(); },
      ende: function () { return DAUER; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["E", "Energie über der Ruhelage"], ["art", "Bewegungsart"], ["T", "Dauer eines Umlaufs"]
    ]);

    function zeichne() {
      var E = energie(), E2 = 2 * G, T;          // E2 = Energie der Separatrix (2 m g l)
      zeichneBuehne();
      werte.E.textContent = zahl(E, 2) + " J";
      if (Math.abs(E - E2) < 0.02) {
        werte.art.textContent = "Grenzfall";
        werte.T.textContent = "unendlich";
      } else if (E < E2) {
        T = 4 * ellK(Math.sqrt(E / E2)) / OM0;
        werte.art.textContent = E < 1e-6 ? "Ruhe" : "Schwingung";
        werte.T.textContent = E < 1e-6 ? "–" : zahl(T, 2) + " s";
      } else {
        var ka = Math.sqrt(E2 / E);
        T = 2 * ka * ellK(ka) / OM0;
        werte.art.textContent = "Überschlag";
        werte.T.textContent = zahl(T, 2) + " s";
      }
      teil.status.textContent = E < 1e-6
        ? "Das Pendel hängt ruhig – im Phasenraum ist das ein einziger Punkt in der Mitte."
        : Math.abs(E - E2) < 0.02
          ? "Grenzfall: Die Energie reicht genau, um das Pendel bis ganz nach oben zu bringen. " +
            (Math.abs(z.p0) < 0.05
              ? "Steht es dort still, bleibt es (instabil) kopfüber stehen"
              : "Es schleicht immer langsamer hinauf") +
            " – die orangefarbene Separatrix trennt Schwingen von Überschlagen."
          : E < E2
            ? "Das Pendel schwingt: Im Phasenraum läuft der Punkt auf einer geschlossenen Kurve im Uhrzeigersinn. " +
              "Jede Kurve gehört zu einer festen Energie – der Punkt kann seine Kurve nie verlassen."
            : "Das Pendel überschlägt sich: Der Impuls wechselt nie das Vorzeichen, der Punkt läuft am rechten (oder linken) " +
              "Rand aus dem Bild und kommt mit gleichem Impuls am anderen Rand wieder herein – θ = 180° und θ = −180° sind dieselbe Lage.";
    }
    rechne();
    zeichne();
  }

  /* =======================================================================
     MODELL: LIOUVILLE – eine Wolke im Phasenraum                  (hamilton)
     Der Rand einer kreisförmigen Wolke von Anfangszuständen (Ellipse mit
     Halbachsen 0,35 rad und 0,35·ω0 kg·m²/s) wird mit RK4 (dt = 0,01 s)
     mitgeführt. Fläche per Gaußscher Trapezformel (Schnürsenkelformel):
     bleibt konstant (Satz von Liouville), auch wenn sich die Wolke beim
     Pendel zu einem langen Band verzerrt.
     ======================================================================= */
  function liouville(fig) {
    var PMAX = 9, DAUER = 6, DT = 0.01, N = 900, PRO = 5;  // PRO = RK4-Schritte je gespeichertem Bild
    var RQ = 0.35, RP = 0.35 * OM0;
    var z = { harm: false, q0: 100, f: 0 };
    var bilder = [];
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Phasenraum mit einer Wolke von Anfangszuständen, die mit der Zeit mitgeführt wird",
      function (b) { return begrenze(b * 0.55, 240, 340); }, zeichne);

    function rechne() {
      var q = new Float64Array(N), p = new Float64Array(N), i, b, k;
      var mq = z.q0 * Math.PI / 180;
      for (i = 0; i < N; i++) {
        var phi = 2 * Math.PI * i / N;
        q[i] = mq + RQ * Math.cos(phi); p[i] = RP * Math.sin(phi);
      }
      bilder = [[Float64Array.from(q), Float64Array.from(p)]];
      var anzahl = Math.round(DAUER / DT / PRO);
      for (b = 1; b <= anzahl; b++) {
        for (k = 0; k < PRO; k++) {
          for (i = 0; i < N; i++) { var r = pendelSchritt(q[i], p[i], DT, z.harm); q[i] = r[0]; p[i] = r[1]; }
        }
        bilder.push([Float64Array.from(q), Float64Array.from(p)]);
      }
    }
    function bildJetzt() { return bilder[Math.round(z.f * (bilder.length - 1))]; }
    function inhalt(bild) {                           // Schnürsenkelformel
      var a = 0, q = bild[0], p = bild[1];
      for (var i = 0; i < N; i++) { var j = (i + 1) % N; a += q[i] * p[j] - q[j] * p[i]; }
      return Math.abs(a) / 2;
    }
    function umfang(bild) {                           // in skalierten Koordinaten (θ, p/ω0)
      var u = 0, q = bild[0], p = bild[1];
      for (var i = 0; i < N; i++) {
        var j = (i + 1) % N, dq = q[j] - q[i], dp = (p[j] - p[i]) / OM0;
        u += Math.sqrt(dq * dq + dp * dp);
      }
      return u;
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, bild = bildJetzt();
      f.leeren();
      var ph = phasenRahmen(f.svg, { l: 34, o: 8, b: B - 44, h: H - 30 }, PMAX, z.harm);
      function zug(b) {
        var pkt = [];
        for (var i = 0; i < N; i += 2) pkt.push([ph.X(b[0][i]), ph.Y(b[1][i])]);
        return linienzug(pkt);
      }
      s("polygon", { "class": "hilfslinie", points: zug(bilder[0]) }, ph.bild);
      s("polygon", { "class": "flaeche", points: zug(bild) }, ph.bild);
      s("polygon", { "class": "kurve blau duenn", points: zug(bild) }, ph.bild);
      /* ein markierter Randpunkt zeigt die Drehung der Wolke */
      s("circle", { "class": "punkt kupfer", cx: ph.X(bild[0][0]), cy: ph.Y(bild[1][0]), r: 4 }, ph.bild);
    }

    var knoepfe = auswahl(teil.bedienung, "System:", "System wählen",
      ["Pendel", "Harmonischer Oszillator"], function (i) {
        spieler.stopp(); z.harm = i === 1; markiere(knoepfe, i); rechne(); zeichne();
      });
    markiere(knoepfe, 0);
    regler(teil.regler, {
      name: "Startlage der Wolke", min: 0, max: 130, schritt: 5, wert: z.q0,
      anzeige: function (w) { return "θ = " + w + "°"; }
    }, function (w) { spieler.stopp(); z.q0 = w; z.f = 0; rZeit.setze(0); rechne(); zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeit", min: 0, max: 1, schritt: 0.005, wert: z.f,
      anzeige: function (w) { return "t = " + zahl(w * DAUER, 2) + " s"; }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });
    var spieler = abspieler({
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Laufen lassen", faktor: 1, vonVorn: true,
      hole: function () { return z.f * DAUER; },
      setze: function (t) { z.f = t / DAUER; rZeit.setze(z.f); zeichne(); },
      ende: function () { return DAUER; }
    });

    var werte = werteLeiste(teil.bedienung, [
      ["a0", "Fläche am Anfang"], ["a", "Fläche jetzt"], ["u", "Rand länger als am Anfang"]
    ]);

    function zeichne() {
      var b = bildJetzt(), a0 = inhalt(bilder[0]), a = inhalt(b), u = umfang(b) / umfang(bilder[0]);
      zeichneBuehne();
      werte.a0.textContent = zahl(a0, 2) + " J·s";
      werte.a.textContent = zahl(a, 2) + " J·s";
      werte.u.textContent = "× " + zahl(u, 1);
      teil.status.textContent = z.harm
        ? "Beim harmonischen Oszillator brauchen alle Zustände gleich lang für eine Runde: Die Wolke dreht sich als " +
          "Ganzes und behält ihre Form. Ihre Fläche bleibt gleich."
        : "Beim Pendel brauchen weite Schwingungen länger als enge: Die Wolke wird zu einem immer längeren Band " +
          "verschert. Der Rand wird länger – die Fläche bleibt trotzdem gleich. Das ist der Satz von Liouville.";
    }
    rechne();
    zeichne();
  }

  I.modell("phasenraum", phasenraum);
  I.modell("liouville", liouville);
})(window.Interaktiv);
