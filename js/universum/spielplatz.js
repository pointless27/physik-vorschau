/* =========================================================================
   GRAVITATIONS-SPIELPLATZ (themen/universum/gravitation-spielplatz.html)
   =========================================================================
   2D-Sandkasten (Canvas, ohne three.js): Körper ziehen sich nach Newton
   an, F = G m₁ m₂ / r². Szenen wählen oder selbst Körper hineinwerfen
   (Ziehen = Startgeschwindigkeit, gestrichelt die Vorhersage).

   Physik:
   - Einheiten frei gewählt: G = 1. ZEITFAKTOR Modellzeit je Sekunde bei
     Tempo 1.
   - Leapfrog (Kick-Drift-Kick) mit gemeinsamer, anpassbarer Schrittweite
     dt = eta · min sqrt((r² + eps²)^(3/2) / (G (mᵢ + mⱼ))), begrenzt auf
     [DT_MIN, DT_MAX]; Staub zusätzlich mit eigener, gröberer Grenze.
     Glättung eps (je Szene) gegen Division durch null.
   - Drei Kraftgesetze je Paar (Funktion zug):
     · Newton mit Glättung eps: a = G m / (r² + eps²) (in Richtung r̂).
     · Schwarzes Loch (sl: true): Paczyński-Wiita-Potential
       Φ = −G M / (r − r_s), r_s = 2 G M / c² (C2 = c²). Es ahmt zwei
       Effekte der ART nach: innerste stabile Kreisbahn bei 3 r_s, keine
       gebundene Bahn mit Perizentrum unter 2 r_s; Bahnen drehen sich
       (Periheldrehung, im schwachen Feld 2/3 des ART-Werts). Verschluckt
       wird unter 1,52 r_s (r = 1,9 r_s, Grenze 0,8 r). Gezeitenzerriss
       eines Körpers unter r_t = TIDE · M^(1/3) (fester Dichte-Ansatz, in
       Modelleinheiten so gewählt, dass r_t > Fangradius): er wird zu
       Staub mit Massenanteil; Staub mit Masse, der hineinfällt, erhöht M.
     · Galaxie (gal: true, Kernradius kb, Halo-Radius kR): Kraft
       g(r) = G M r / ((r² + b²) sqrt(r² + R²)) → flache Rotationskurve
       zwischen b und R (Halo aus Dunkler Materie), Potential
       Φ = G M/(2c) ln((u − c)/(u + c)), u = sqrt(r² + R²), c = sqrt(R² − b²).
       Paare mit Galaxie: b, R = Maximum beider. Dynamische Reibung (stark
       vereinfacht): Relativgeschwindigkeit gebremst mit
       γ = REIB · min(1, m_klein/m_groß) · sqrt(M/R³) · exp(−r²/R²),
       impulserhaltend. Zwei Kerne verschmelzen bei r < 1,5 b und
       v² < 0,5 · 2 M Φ (Python-Test: Szene Galaxien verschmilzt bei t ≈ 590).
     Zeitskala jedes Paares: tau = sqrt(1 / ((mᵢ + mⱼ) f)), f = a / (M r).
   - Staub = masselose Testteilchen: spüren die Körper, ziehen aber selbst
     nicht (so sind Tausende möglich). Sie verschwinden in Körpern
     (Abstand < 0,8 r), nicht in Galaxienkernen. Galaxiensterne (g = Kern,
     pop 0 Bulge, 1 Scheibe, 2 Sternentstehungsgebiet) leuchten in einem
     mitlaufenden Spiralmuster (Dichtewelle, nur gezeichnet).
   - Zusammenstöße (wenn die Szene es erlaubt): Abstand < 0,8 · (r₁ + r₂)
     → Körper verschmelzen, Impuls und Masse bleiben erhalten,
     Bewegungsenergie geht verloren. Radius r = 1,1 · m^(1/3) + 1,2.
   - Energie E = Σ ½ m v² − Σ G mᵢ mⱼ / sqrt(r² + eps²) (nur Körper);
     die Abweichung von E₀ zeigt die Rechengenauigkeit.
   - Bahndaten des ausgewählten Körpers: Zweikörper-Näherung um den
     Körper, der ihn am stärksten anzieht (größtes m/r²): Exzentrizität
     e = sqrt(1 + 2 ε h² / μ²), Umlaufzeit T = 2π sqrt(a³/μ) mit
     a = −μ/(2ε), Fluchtgeschwindigkeit sqrt(2μ/r).
   - Mitdrehen: Ansicht dreht sich mit einem Bezugskörper um den
     Schwerpunkt (mitrotierendes Bezugssystem). Spuren werden dann in
     diesem System aufgezeichnet. Geworfene Körper bekommen dort
     v = R⁻¹ v' + ω × (r − c) + v_c.
   - Monde: Antippen oder Ziehen dicht neben einem Planeten (FANG_PX) setzt
     den neuen, viel leichteren Körper in dessen Hill-Sphäre
     r_H = a · (m / 3M)^(1/3) auf den Abstand zwischen 1,04 (r_P + r_M)
     (kein Zusammenstoß) und 0,38 r_H (Python-Test: über 30 Umläufe
     stabil, ab etwa 0,45 r_H reißt der Stern ihn weg). Passt das nicht,
     ist der Planet zu leicht oder zu nah am Stern (Meldung).
   - Szenen: Chaos = pythagoreisches Dreikörperproblem (Burrau 1913),
     Trojaner an L4/L5 eines Riesenplaneten (Massenverhältnis 0,01 unter
     der Grenze 0,0385), Galaxien nach Toomre & Toomre (1972, Kerne mit
     Halo + Testteilchen; gebundene Bahn mit v = 0,6 · Fluchtgeschwindigkeit
     bei 320, erstes Perizentrum ≈ 48, Verschmelzen nach drei Begegnungen;
     seit Schritt 85 alle Längen ×6, Masse 500 → 60000, also Zeiten
     ×sqrt(6³/120) ≈ 1,34, Bahnformen unverändert),
     Swing-by: Sonde 1,4 → 3,7 (Schritt 73), Schwarzes Loch (M = 4000,
     r_s = 10): Scheibe 2,6–9 r_s, Stern auf Rosette (Perizentrum 110),
     zweiter Stern wird zerrissen (Schritt 75).
   Größenverhältnisse (Schritt 85): Stern 300 (Radius ≈ 9), kleines
   Schwarzes Loch 1000 (Schatten 6,5), großes 4000 (Schatten 26), Galaxie
   60000 (Scheibe 276, Halo 360). Echt wären die Unterschiede viel
   größer (Galaxie ~10¹¹-mal so schwer wie ein Stern), das passt nicht
   auf einen Bildschirm; die Reihenfolge stimmt aber.
   Vollbild: Rahmen (Bühne + Leiste) per Fullscreen-API, sonst Ersatz
   über CSS (.spiel-vollbild). Bewegung nur auf Knopfdruck („Start“).
   Farben: --uni-* (variablen.css); Aussehen: css/teile/universum.css
   (Abschnitt Spielplatz).
   ========================================================================= */
(function () {
  "use strict";

  var ZEITFAKTOR = 33;
  var ETA = 0.025, DT_MIN = 1e-4, DT_MAX = 0.05;
  var ETA_STAUB = 0.03, DT_MIN_STAUB = 0.004;
  var MAX_KOERPER = 40, MAX_STAUB = 2500;
  var WURF = 0.04;          /* Geschwindigkeit je Modelleinheit Ziehen */
  var C2 = 800;             /* Lichtgeschwindigkeit² (c ≈ 28): r_s = 2 M / C2 */
  var TIDE = 2.5;           /* Gezeitenradius r_t = TIDE · M^(1/3) */
  var REIB = 0.15;          /* Stärke der dynamischen Reibung im Halo */

  /* Spiralgalaxie (Kern kb, Halo kR, Scheibe rand); Szene und neuer Körper */
  var GAL = { m: 60000, kb: 24, kR: 360, rand: 276 };

  function radius(m) { return 1.1 * Math.cbrt(m) + 1.2; }
  function rsVon(m) { return 2 * m / C2; }
  function art(m) { return m >= 100 ? "stern" : (m >= 1 ? "planet" : "mond"); }
  var ART_NAME = { stern: "Stern", planet: "Planet", mond: "Mond", loch: "Schwarzes Loch", galaxie: "Galaxie" };
  /* Radius und Art passend zur Masse (Schwarzes Loch: Fangradius, Galaxie: keiner) */
  function setzeGroesse(k) {
    k.r = k.sl ? 1.9 * rsVon(k.m) : (k.gal ? 0 : radius(k.m));
    k.art = k.sl ? "loch" : (k.gal ? "galaxie" : (k.artFest || art(k.m)));
  }

  /* Kraftgesetz eines Paares: Rückgabe f mit Beschleunigung von a = m_b · f · (dx, dy);
     mitPhi: ZUG_PHI = Potential je Massenprodukt (positiv, E_pot = −mₐ m_b ZUG_PHI) */
  var ZUG_PHI = 0;
  function zug(a, b, dx, dy, eps2, mitPhi) {
    var r2 = dx * dx + dy * dy;
    if (a.gal || b.gal) {
      var bb = Math.max(a.gal ? a.kb : 0, b.gal ? b.kb : 0), RR = Math.max(a.gal ? a.kR : 0, b.gal ? b.kR : 0);
      var b2 = bb * bb, s = Math.sqrt(r2 + RR * RR);
      if (mitPhi) { var c = Math.sqrt(RR * RR - b2); ZUG_PHI = Math.log((s + c) / (s - c)) / (2 * c); }
      return 1 / ((r2 + b2) * s);
    }
    if (a.sl || b.sl) {
      var rs = (a.sl ? rsVon(a.m) : 0) + (b.sl ? rsVon(b.m) : 0);
      var r = Math.sqrt(r2 + 1e-12), d = Math.max(r - rs, 0.5 * rs);
      if (mitPhi) ZUG_PHI = 1 / d;
      return 1 / (d * d * r);
    }
    var q = r2 + eps2, w = Math.sqrt(q);
    if (mitPhi) ZUG_PHI = 1 / w;
    return 1 / (q * w);
  }

  /* Körper auf Kreisbahn um (cx, cy) mit Zentralmasse M, Winkel w (Grad) */
  function kreis(M, r, w, m, cx, cy, cvx, cvy) {
    var a = w * Math.PI / 180, v = Math.sqrt(M / r);
    return { x: (cx || 0) + r * Math.cos(a), y: (cy || 0) + r * Math.sin(a),
             vx: (cvx || 0) + v * Math.sin(a), vy: (cvy || 0) - v * Math.cos(a), m: m };
  }
  /* reproduzierbarer Zufall je Szene */
  function zufallsQuelle(saat) {
    return function () { saat = (saat * 16807) % 2147483647; return saat / 2147483647; };
  }
  /* Staubscheibe um Körper k: Radien r1…r2, Drehsinn sinn (+1 wie kreis()) */
  function scheibe(k, n, r1, r2, sinn, f, z, epsStaub) {
    var liste = [];
    for (var i = 0; i < n; i++) {
      var r = r1 + (r2 - r1) * z(), a = 2 * Math.PI * z();
      var vc = Math.sqrt(k.m * r * r / Math.pow(r * r + epsStaub * epsStaub, 1.5));
      liste.push({ x: k.x + r * Math.cos(a), y: k.y + r * Math.sin(a),
                   vx: k.vx + sinn * vc * Math.sin(a), vy: k.vy - sinn * vc * Math.cos(a), f: f });
    }
    return liste;
  }
  /* Galaxie um den Kern k (gal, kb, kR, rand): 25 % Bulge (rund, beide
     Drehsinne), 75 % Scheibe mit Flächendichte ~ exp(−r/h), h = rand/4,
     Kreisbahnen im Halo-Potential; 12 % der Scheibe sind
     Sternentstehungsgebiete (leuchten rosa in den Spiralarmen) */
  function galaxieSterne(k, n, sinn, z) {
    var liste = [], nb = Math.round(0.25 * n), h = k.rand / 4, probe = {};
    for (var i = 0; i < n; i++) {
      var bulge = i < nb, r;
      if (bulge) r = Math.min(3.5 * k.kb, 0.3 - 0.6 * k.kb * Math.log(1 - 0.98 * z()));
      else { do { r = -h * Math.log((1 - z()) * (1 - z())); } while (r < k.kb || r > k.rand); }
      var a = 2 * Math.PI * z();
      var vc = Math.sqrt(k.m * r * r * zug(probe, k, r, 0, 0));
      var s = bulge ? (z() < 0.5 ? -1 : 1) * (0.5 + 0.5 * z()) : sinn * (1 + 0.06 * (z() - 0.5));
      liste.push({ x: k.x + r * Math.cos(a), y: k.y + r * Math.sin(a),
                   vx: k.vx + s * vc * Math.sin(a), vy: k.vy - s * vc * Math.cos(a),
                   g: k, pop: bulge ? 0 : (z() < 0.12 ? 2 : 1) });
    }
    /* Spiralmuster: zwei nachlaufende Arme, Steigungswinkel 22°, Muster
       dreht mit 0,55 · v_flach / rand (langsamer als die Sterne) */
    var vflach = Math.sqrt(k.m / k.kR);
    k.arm = { sinn: sinn, r0: 2 * k.kb, tanP: Math.tan(22 * Math.PI / 180), omega: 0.55 * vflach / k.rand };
    return liste;
  }
  /* Gasscheibe um ein Schwarzes Loch: Radien r1…r2 (in r_s), Kreisbahnen
     im Paczyński-Wiita-Potential v² = M r / (r − r_s)², leicht gestört,
     damit Teilchen innerhalb 3 r_s (instabil) bald hineinstürzen */
  function gasScheibe(k, n, r1, r2, z) {
    var liste = [], rs = rsVon(k.m);
    for (var i = 0; i < n; i++) {
      var r = rs * (r1 + (r2 - r1) * Math.pow(z(), 0.8)), a = 2 * Math.PI * z();
      var vc = Math.sqrt(k.m * r) / (r - rs) * (1 + 0.012 * (z() - 0.5));
      liste.push({ x: k.x + r * Math.cos(a), y: k.y + r * Math.sin(a),
                   vx: k.vx + vc * Math.sin(a), vy: k.vy - vc * Math.cos(a), f: 1 });
    }
    return liste;
  }

  var SZENEN = [
    { id: "sonnensystem", name: "Planeten", sicht: 270, eps: 0.5, verschmelzen: true, ruhe: true, spur: 260,
      text: "Ein Stern mit drei Planeten, der äußere mit Mond, dazu ein Komet auf einer langen Ellipse und ein Gürtel aus Staub. Innen laufen die Planeten schneller (drittes Keplersches Gesetz).",
      koerper: function () {
        /* Riese außerhalb des Gürtels (110–128): seine chaotische Zone
           reicht etwa 1,3 · (m/M)^(2/7) · a ≈ 57 nach innen */
        var riese = kreis(1000, 190, 200, 6, 0, 0);
        var mond = kreis(6, 6, 0, 0.02, riese.x, riese.y, riese.vx, riese.vy);
        return [
          { x: 0, y: 0, vx: 0, vy: 0, m: 1000 },
          kreis(1000, 55, 30, 0.3), kreis(1000, 88, 120, 1), riese, mond,
          { x: -260, y: 0, vx: 0, vy: Math.sqrt(1000 * (2 / 260 - 1 / 150)), m: 0.01, name: "Komet" }
        ];
      },
      staub: function (K, sz) { return scheibe(K[0], 180, 110, 128, 1, 2, zufallsQuelle(11), sz.epsStaub); } },
    { id: "doppelstern", name: "Doppelstern", sicht: 260, eps: 0.5, verschmelzen: true, ruhe: true, spur: 320,
      text: "Zwei Sterne umkreisen ihren gemeinsamen Schwerpunkt. Ein Planet zieht weit draußen um beide, ein zweiter dicht um den schwereren Stern.",
      koerper: function () {
        var vrel = Math.sqrt(1000 / 80);
        var s1 = { x: -32, y: 0, vx: 0, vy: vrel * 0.4, m: 600 };
        var s2 = { x: 48, y: 0, vx: 0, vy: -vrel * 0.6, m: 400 };
        return [s1, s2, kreis(1000, 230, 60, 1), kreis(600, 16, 90, 0.5, s1.x, s1.y, s1.vx, s1.vy)];
      } },
    { id: "swingby", name: "Swing-by", sicht: 340, eps: 1, verschmelzen: true, ruhe: false, spur: 700, beobachte: 1,
      text: "Eine Sonde fliegt dicht hinter einem Planeten vorbei, der nach rechts zieht. Er nimmt sie ein Stück mit: Danach ist sie fast dreimal so schnell. So holen Raumsonden wie Voyager Schwung.",
      koerper: function () {
        return [{ x: -300, y: 0, vx: 2.4, vy: 0, m: 200 }, { x: 60, y: 260, vx: 0, vy: -1.4, m: 0.001, name: "Sonde" }];
      } },
    { id: "trojaner", name: "Trojaner", sicht: 230, eps: 0.5, verschmelzen: true, ruhe: true, spur: 300, dreh: 1, staubSpur: 160,
      text: "Die Ansicht dreht sich mit dem Riesenplaneten mit. 60 Grad vor und hinter ihm liegen die Lagrange-Punkte L4 und L5. Dort gefangene Brocken pendeln langsam hin und her, wie die Trojaner beim Jupiter. Probier Tempo ×10.",
      koerper: function () {
        var v = Math.sqrt(1010 / 150);
        return [{ x: 0, y: 0, vx: 0, vy: 0, m: 1000 }, { x: 150, y: 0, vx: 0, vy: -v, m: 10, name: "Riesenplanet" }];
      },
      staub: function (K) {
        var z = zufallsQuelle(5), liste = [], s = K[0], j = K[1];
        var w = Math.sqrt(1010 / Math.pow(150, 3));            /* Winkelgeschwindigkeit der Bahn */
        var cx = (s.x * s.m + j.x * j.m) / 1010, cy = (s.y * s.m + j.y * j.m) / 1010;
        [-1, 1].forEach(function (seite, f) {
          for (var i = 0; i < 60; i++) {
            var a = seite * Math.PI / 3 + (z() - 0.5) * 0.16, r = 150 + (z() - 0.5) * 6;
            var dx = j.x - s.x, dy = j.y - s.y, d = Math.hypot(dx, dy);
            var x = s.x + r / d * (dx * Math.cos(a) - dy * Math.sin(a));
            var y = s.y + r / d * (dx * Math.sin(a) + dy * Math.cos(a));
            /* mitrotierend: v = ω × (r − c), Drehsinn wie der Planet */
            liste.push({ x: x, y: y, vx: w * (y - cy), vy: -w * (x - cx), f: f });
          }
        });
        return liste;
      } },
    { id: "galaxien", name: "Galaxien", sicht: 1380, eps: 12, verschmelzen: true, ruhe: true, spur: 500,
      text: "Zwei Spiralgalaxien streifen einander. Die Gezeitenkräfte reißen lange Schweife aus Sternen heraus, wie bei den „Antennen-Galaxien“. Ihre Halos aus Dunkler Materie bremsen sie, darum fallen sie wieder zusammen und verschmelzen. Probier Tempo ×3.",
      koerper: function () {
        /* Startwerte im Python-Test: Abstand 320, v = 0,6 · Flucht, Newton-Perizentrum 40
           (seit Schritt 85 alle Längen ×6: 1920 und 240) */
        var M = GAL.m, d = 1920, mu = 2 * M, rp = 240;
        var g = { gal: true, kb: GAL.kb, kR: GAL.kR }, probe = {};
        zug(probe, g, d, 0, 0, true);
        var v = 0.6 * Math.sqrt(2 * mu * ZUG_PHI), e = v * v / 2 - mu * ZUG_PHI;
        var h = rp * Math.sqrt(2 * (e + mu / rp)), vt = h / d, vr = -Math.sqrt(v * v - vt * vt);
        function kern(s) {
          return { x: s * d / 2, y: 0, vx: s * vr / 2, vy: s * vt / 2, m: M, gal: true, kb: GAL.kb, kR: GAL.kR, rand: GAL.rand, name: "Galaxie" };
        }
        return [kern(-1), kern(1)];
      },
      staub: function (K) {
        var z = zufallsQuelle(3);
        return galaxieSterne(K[0], 700, -1, z).concat(galaxieSterne(K[1], 700, -1, z));
      } },
    { id: "schwarzes-loch", name: "Schwarzes Loch", sicht: 240, eps: 0.5, verschmelzen: true, ruhe: true, spur: 1500,
      text: "Ein Schwarzes Loch mit einer Scheibe aus heißem Gas. Näher als drei Schwarzschild-Radien gibt es keine stabile Bahn mehr, dort stürzt alles hinein. Ein Stern läuft auf einer Rosette, ein zweiter kommt zu nah und wird von den Gezeitenkräften zerrissen.",
      koerper: function () {
        var M = 4000, rs = rsVon(M);
        /* Anflug aus Abstand r0 unter dem Winkel w (Grad), Betrag fak · Flucht,
           Drehimpuls so, dass das Perizentrum (Paczyński-Wiita) rp ist */
        function anflug(m, r0, w, rp, fak, extra) {
          var v = fak * Math.sqrt(2 * M / (r0 - rs)), e = v * v / 2 - M / (r0 - rs);
          var L = rp * Math.sqrt(2 * (e + M / (rp - rs))), vt = L / r0, vr = -Math.sqrt(Math.max(0, v * v - vt * vt));
          var a = w * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
          var k = { x: r0 * c, y: r0 * s, vx: vr * c + vt * s, vy: vr * s - vt * c, m: m, artFest: "stern" };
          for (var n in extra) k[n] = extra[n];
          return k;
        }
        /* Rosette: Apozentrum 210, Perizentrum 110 (v aus Energie und Drehimpuls im PW-Potential) */
        var ra = 210, rp = 110;
        var va = Math.sqrt(2 * M * (1 / (rp - rs) - 1 / (ra - rs)) / (ra * ra / (rp * rp) - 1));
        return [
          { x: 0, y: 0, vx: 0, vy: 0, m: M, sl: true, name: "Schwarzes Loch" },
          { x: -ra, y: 0, vx: 0, vy: va, m: 10, artFest: "stern", name: "Stern auf Rosette" },
          anflug(60, 430, -38, 25, 0.8, { name: "Stern" })
        ];
      },
      staub: function (K) { return gasScheibe(K[0], 750, 2.6, 9, zufallsQuelle(17)); } },
    { id: "chaos", name: "Chaos", sicht: 200, eps: 0.6, eta: 0.006, verschmelzen: false, ruhe: true, spur: 1400,
      text: "Drei Sterne mit den Massen 3, 4 und 5 starten in Ruhe. Was folgt, ist chaotisch: Winzige Änderungen am Anfang führen zu völlig anderen Bahnen. Am Ende wird meist einer hinausgeschleudert. Probier Tempo ×3.",
      koerper: function () {
        var L = 40, M = 60;
        return [{ x: 1 * L, y: 3 * L, vx: 0, vy: 0, m: 3 * M },
                { x: -2 * L, y: -1 * L, vx: 0, vy: 0, m: 4 * M },
                { x: 1 * L, y: -1 * L, vx: 0, vy: 0, m: 5 * M }];
      } },
    { id: "stern", name: "Stern", sicht: 270, eps: 0.5, verschmelzen: true, ruhe: true, spur: 300,
      text: "Nur ein Stern. Wirf selbst Planeten hinein: Zieh in die Richtung, in die der Körper fliegen soll. Mit der Kreisbahn-Hilfe genügt ein Antippen. Tippst du dicht neben einen Planeten, kreist ein Mond um ihn.",
      koerper: function () { return [{ x: 0, y: 0, vx: 0, vy: 0, m: 1000 }]; } },
    { id: "leer", name: "Leer", sicht: 270, eps: 0.5, verschmelzen: true, ruhe: true, spur: 300, neu: "stern",
      text: "Ein leerer Raum. Setz Sterne, Schwarze Löcher oder Galaxien hinein und gib ihnen einen Schubs. Ein angetippter Körper bleibt liegen, bis ein zweiter ihn anzieht.",
      koerper: function () { return []; } }
  ];
  SZENEN.forEach(function (s) { if (s.epsStaub === undefined) s.epsStaub = 1; });

  var NEUE = [
    { id: "mond", name: "Mond", m: 0.05 },
    { id: "planet", name: "Planet", m: 5 },
    { id: "stern", name: "Stern", m: 300 },
    { id: "galaxie", name: "Galaxie", m: GAL.m, gal: true, kb: GAL.kb, kR: GAL.kR, rand: GAL.rand, sterne: 700 },
    { id: "loch", name: "Schwarzes Loch", zusatz: "klein", m: 1000, sl: true,
      titel: "Kleines Schwarzes Loch: gut dreimal so schwer wie ein Stern, wie die Reste großer Sterne" },
    { id: "loch-gross", name: "Schwarzes Loch", zusatz: "groß", m: 4000, sl: true,
      titel: "Großes Schwarzes Loch: viermal so schwer wie das kleine, wie die Riesen in den Zentren der Galaxien" },
    { id: "staub", name: "Staubwolke", m: 0, staub: true }
  ];
  var TEMPI = [{ id: 0.5, name: "×½" }, { id: 1, name: "×1" }, { id: 3, name: "×3" }, { id: 10, name: "×10" }];

  /* ===================== Physik ===================== */
  function beschleunige(K, eps2) {
    var n = K.length, i, j;
    for (i = 0; i < n; i++) { K[i].ax = 0; K[i].ay = 0; }
    for (i = 0; i < n; i++) {
      var a = K[i];
      for (j = i + 1; j < n; j++) {
        var b = K[j], dx = b.x - a.x, dy = b.y - a.y;
        var f = zug(a, b, dx, dy, eps2);
        a.ax += b.m * dx * f; a.ay += b.m * dy * f;
        b.ax -= a.m * dx * f; b.ay -= a.m * dy * f;
        if (a.gal || b.gal) reibung(a, b, dx, dy);
      }
    }
  }
  /* Dynamische Reibung im Halo: bremst die Relativbewegung, Impuls bleibt erhalten */
  function reibung(a, b, dx, dy) {
    var R = Math.max(a.gal ? a.kR : 0, b.gal ? b.kR : 0), m = a.m + b.m;
    var r2 = dx * dx + dy * dy;
    if (r2 > 9 * R * R) return;
    /* „Halo“ ist der Körper mit Galaxie; ein schwererer Fremdkörper wird voll gebremst */
    var anteil = a.gal && b.gal ? Math.min(a.m, b.m) / Math.max(a.m, b.m) : Math.min(1, (a.gal ? b.m : a.m) / (a.gal ? a.m : b.m));
    var g = REIB * anteil * Math.sqrt(m / (R * R * R)) * Math.exp(-r2 / (R * R));
    var dvx = b.vx - a.vx, dvy = b.vy - a.vy;
    a.ax += b.m / m * g * dvx; a.ay += b.m / m * g * dvy;
    b.ax -= a.m / m * g * dvx; b.ay -= a.m / m * g * dvy;
  }
  /* Staub: nur Anziehung der Körper; gibt die kürzeste Zeitskala zurück */
  function beschleunigeStaub(P, K, eps2) {
    var tau = Infinity;
    for (var i = 0; i < P.length; i++) {
      var p = P[i], ax = 0, ay = 0;
      for (var j = 0; j < K.length; j++) {
        var k = K[j], dx = k.x - p.x, dy = k.y - p.y;
        var f = zug(p, k, dx, dy, eps2);
        ax += k.m * dx * f; ay += k.m * dy * f;
        var t = 1 / (k.m * f);
        if (t < tau) tau = t;
      }
      p.ax = ax; p.ay = ay;
    }
    return Math.sqrt(tau);
  }
  function schrittweite(K, sz, tauStaub) {
    var tau = Infinity, n = K.length, eps2 = sz.eps * sz.eps;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var dx = K[j].x - K[i].x, dy = K[j].y - K[i].y;
        var t = Math.sqrt(1 / ((K[i].m + K[j].m) * zug(K[i], K[j], dx, dy, eps2 + 1e-12)));
        if (t < tau) tau = t;
      }
    }
    var dt = Math.max(DT_MIN, Math.min(DT_MAX, (sz.eta || ETA) * tau));
    if (tauStaub < Infinity) dt = Math.min(dt, Math.max(DT_MIN_STAUB, ETA_STAUB * tauStaub));
    return dt;
  }
  /* ein Leapfrog-Schritt; Rückgabe: {meldung (Zusammenstoß o. Ä.) oder "", tauStaub} */
  function schritt(K, P, dt, sz) {
    var i, k, h = dt / 2;
    for (i = 0; i < K.length; i++) {
      k = K[i];
      k.vx += k.ax * h; k.vy += k.ay * h;
      k.x += k.vx * dt; k.y += k.vy * dt;
    }
    for (i = 0; i < P.length; i++) {
      k = P[i];
      k.vx += k.ax * h; k.vy += k.ay * h;
      k.x += k.vx * dt; k.y += k.vy * dt;
    }
    var meldung = verschmelze(K, sz.verschmelzen, sz.eps * sz.eps) || zerreisse(K, P);
    beschleunige(K, sz.eps * sz.eps);
    var tauStaub = P.length ? beschleunigeStaub(P, K, sz.epsStaub * sz.epsStaub) : Infinity;
    for (i = 0; i < K.length; i++) { k = K[i]; k.vx += k.ax * h; k.vy += k.ay * h; }
    for (i = 0; i < P.length; i++) { k = P[i]; k.vx += k.ax * h; k.vy += k.ay * h; }
    return { meldung: meldung, tauStaub: tauStaub };
  }
  /* Zusammenstöße (nur wenn die Szene sie erlaubt); Schwarze Löcher
     verschlucken und Galaxien verschmelzen immer. Rückgabe: Meldung oder "" */
  function verschmelze(K, stoesse, eps2) {
    var meldung = "";
    for (var i = 0; i < K.length; i++) {
      for (var j = i + 1; j < K.length; j++) {
        var a = K[i], b = K[j], dx = b.x - a.x, dy = b.y - a.y, r2 = dx * dx + dy * dy;
        var gross, klein, m = a.m + b.m;
        if (a.gal || b.gal) {
          if (!(a.gal && b.gal)) continue;
          var bb = Math.max(a.kb, b.kb), dvx = b.vx - a.vx, dvy = b.vy - a.vy;
          if (r2 > 2.25 * bb * bb) continue;
          zug(a, b, dx, dy, 0, true);
          if (dvx * dvx + dvy * dvy > m * ZUG_PHI) continue;      /* noch nicht fest gebunden */
          gross = a.m >= b.m ? a : b; klein = gross === a ? b : a;
          gross.kR = Math.sqrt(a.kR * a.kR + b.kR * b.kR);
          gross.kb = 1.3 * bb;
          gross.rand = Math.max(a.rand, b.rand);
          gross.verschmolzen = true;            /* elliptisch: keine Spiralarme mehr */
          meldung = "Die Galaxien verschmelzen!";
        } else {
          var grenze = 0.8 * (a.r + b.r);
          if (r2 > grenze * grenze || !(stoesse || a.sl || b.sl)) continue;
          /* ein Schwarzes Loch bleibt ein Schwarzes Loch (und behält seinen Namen) */
          gross = a.sl && !b.sl ? a : (b.sl && !a.sl ? b : (a.m >= b.m ? a : b));
          klein = gross === a ? b : a;
          meldung = gross.sl ? (klein.sl ? "Zwei Schwarze Löcher verschmelzen!" :
            "Verschluckt! Das Schwarze Loch wird schwerer.") : "Zusammenstoß!";
        }
        gross.x = (a.x * a.m + b.x * b.m) / m; gross.y = (a.y * a.m + b.y * b.m) / m;
        gross.vx = (a.vx * a.m + b.vx * b.m) / m; gross.vy = (a.vy * a.m + b.vy * b.m) / m;
        gross.m = m;
        setzeGroesse(gross);
        if (klein.beobachtet) gross.beobachtet = true;
        klein.weg = gross;          /* für Auswahl, Mitdrehen und Galaxiensterne */
        K.splice(K.indexOf(klein), 1);
        j = i;
      }
    }
    return meldung;
  }
  /* Gezeitenzerriss: Ein Körper, der einem viel schwereren Schwarzen Loch
     näher kommt als r_t, zerfällt in Staub (mit Massenanteil) */
  function zerreisse(K, P) {
    var meldung = "";
    for (var i = 0; i < K.length; i++) {
      var l = K[i];
      if (!l.sl) continue;
      var rt = TIDE * Math.cbrt(l.m);
      for (var j = 0; j < K.length; j++) {
        var k = K[j];
        if (k === l || k.sl || k.gal || k.m * 3 > l.m) continue;
        var dx = k.x - l.x, dy = k.y - l.y;
        if (dx * dx + dy * dy > rt * rt) continue;
        var n = Math.min(k.art === "stern" ? 220 : (k.art === "planet" ? 120 : 50), MAX_STAUB - P.length);
        var z = zufallsQuelle(1 + Math.floor(Math.abs(k.x * 7919 + k.y * 104729)) % 2147483646);
        for (var s = 0; s < n; s++) {
          var a = 2 * Math.PI * z(), r = k.r * Math.sqrt(z());
          P.push({ x: k.x + r * Math.cos(a), y: k.y + r * Math.sin(a), vx: k.vx, vy: k.vy,
                   ax: 0, ay: 0, m: k.m / n, f: k.art === "stern" ? 8 : 0 });   /* 8: glühendes Sternengas */
        }
        k.weg = null;
        K.splice(j, 1);
        if (j < i) i--;
        j--;
        meldung = "Die Gezeitenkräfte zerreißen " + (k.art === "stern" ? "den Stern!" : (k.art === "planet" ? "den Planeten!" : "den Mond!"));
      }
    }
    return meldung;
  }
  /* Staub, der in einen Körper fällt, verschwindet; Masse fällt ins
     Schwarze Loch. Rückgabe: 0 nichts, 1 Staub weg, 2 auch Masse geändert */
  function fangeStaub(P, K) {
    var raus = 0;
    for (var j = 0; j < K.length; j++) {
      var k = K[j];
      if (k.gal) continue;
      var g = 0.8 * k.r, g2 = g * g;
      for (var i = 0; i < P.length; i++) {
        var p = P[i], dx = p.x - k.x, dy = p.y - k.y;
        if (p.raus || dx * dx + dy * dy >= g2) continue;
        p.raus = true;
        if (!raus) raus = 1;
        if (k.sl && p.m) {
          var m = k.m + p.m;
          k.vx = (k.vx * k.m + p.vx * p.m) / m; k.vy = (k.vy * k.m + p.vy * p.m) / m;
          k.m = m;
          setzeGroesse(k);
          raus = 2;
        }
      }
    }
    return raus;
  }
  function energie(K, eps2) {
    var e = 0, n = K.length;
    for (var i = 0; i < n; i++) {
      var a = K[i];
      e += 0.5 * a.m * (a.vx * a.vx + a.vy * a.vy);
      for (var j = i + 1; j < n; j++) {
        zug(a, K[j], K[j].x - a.x, K[j].y - a.y, eps2, true);
        e -= a.m * K[j].m * ZUG_PHI;
      }
    }
    return e;
  }
  function schwerpunkt(K) {
    var m = 0, x = 0, y = 0, vx = 0, vy = 0;
    K.forEach(function (k) { m += k.m; x += k.m * k.x; y += k.m * k.y; vx += k.m * k.vx; vy += k.m * k.vy; });
    return m ? { x: x / m, y: y / m, vx: vx / m, vy: vy / m } : { x: 0, y: 0, vx: 0, vy: 0 };
  }
  function kopie(K) {
    return K.map(function (k) {
      return { x: k.x, y: k.y, vx: k.vx, vy: k.vy, ax: k.ax, ay: k.ay, m: k.m, r: k.r, art: k.art,
               artFest: k.artFest, sl: k.sl, gal: k.gal, kb: k.kb, kR: k.kR, rand: k.rand };
    });
  }
  /* Körper, der k am stärksten anzieht */
  function hauptKoerper(k, K, eps2) {
    var best = null, bw = 0;
    K.forEach(function (j) {
      if (j === k) return;
      var dx = j.x - k.x, dy = j.y - k.y;
      var w = j.m * zug(k, j, dx, dy, eps2) * Math.sqrt(dx * dx + dy * dy);
      if (w > bw) { bw = w; best = j; }
    });
    return best;
  }
  /* Bahn von k um den Zentralkörper z: Kreisbahn- und Fluchtgeschwindigkeit
     aus dem Kraftgesetz des Paares (v_K² = M f r², v_F² = 2 M Φ) */
  function bahnUm(k, z, eps2) {
    var rx = k.x - z.x, ry = k.y - z.y, vx = k.vx - z.vx, vy = k.vy - z.vy;
    var r = Math.hypot(rx, ry), v2 = vx * vx + vy * vy, mu = z.m + (k.m || 0);
    var f = zug(k, z, rx, ry, eps2, true);
    var eps = v2 / 2 - mu * ZUG_PHI, h = rx * vy - ry * vx;
    var d = { um: z, r: r, v: Math.sqrt(v2), gebunden: eps < 0, flucht: Math.sqrt(2 * mu * ZUG_PHI),
              kreis: Math.sqrt(mu * f) * r, radial: r ? (rx * vx + ry * vy) / r : 0 };
    /* Ellipse und Umlaufzeit nach Kepler nur, wo das Gesetz fast newtonsch ist */
    var rs = (z.sl ? rsVon(z.m) : 0) + (k.sl ? rsVon(k.m) : 0);
    if (!z.gal && !k.gal && r > 12 * rs) {
      var ek = v2 / 2 - mu / r;
      d.e = Math.sqrt(Math.max(0, 1 + 2 * ek * h * h / (mu * mu)));
      if (ek < 0) { var a = -mu / (2 * ek); d.T = 2 * Math.PI * Math.sqrt(a * a * a / mu); }
    }
    return d;
  }
  function bahnDaten(k, K, eps2) {
    /* nur Körper, die schwerer sind, kommen als Zentralkörper in Frage */
    var z = hauptKoerper(k, K.filter(function (j) { return j.m > k.m; }), eps2);
    return z ? bahnUm(k, z, eps2) : null;
  }

  function zahl(x, stellen) { return x.toFixed(stellen).replace(".", ","); }
  function wenigBewegung() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  /* ===================== Oberfläche ===================== */
  function baue(buehne) {
    var el = window.Seite.el;
    var leinwand = buehne.querySelector(".uni-leinwand");
    var canvas = document.createElement("canvas");
    leinwand.append(canvas);
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    buehne.classList.add("uni-bereit");

    var stil = getComputedStyle(document.documentElement);
    function farbe(n) { return stil.getPropertyValue("--uni-" + n).trim(); }
    var F = { himmel: farbe("himmel-all"), text: farbe("text"), schwach: farbe("text-schwach"),
              blau: farbe("blau"), kupfer: farbe("kupfer"), violett: farbe("violett"),
              bahn: farbe("linie-bahn"), galKern: farbe("galaxie-kern"), galArm: farbe("galaxie-arm"),
              galHii: farbe("galaxie-hii"), heiss1: farbe("sonne-1"), heiss2: farbe("sonne-2") };
    var STAUB_FARBE = [F.blau, F.kupfer, F.schwach, F.violett];
    /* Farben der Staub-Eimer: 0–3 wie STAUB_FARBE, 4 Bulge, 5 Scheibe/Arm,
       6 Sternentstehung, 7 weißglühend, 8 gelbglühend; je drei Helligkeiten */
    var PAL = STAUB_FARBE.concat([F.galKern, F.galArm, F.galHii, F.heiss1, F.heiss2]);
    var HELL = [0.3, 0.55, 0.95];
    var eimer = PAL.map(function () { return [[], [], []]; });

    /* Rahmen um Bühne und Leiste (für das Vollbild) */
    var rahmen = el("div", "spiel-rahmen");
    buehne.parentNode.insertBefore(rahmen, buehne);
    rahmen.append(buehne);

    /* Infotafel */
    var info = el("div", "spiel-info");
    var titel = el("p", "spiel-titel");
    var text = el("p", "spiel-text");
    var werte = el("p", "spiel-werte");
    var wahlTafel = el("div", "spiel-auswahl");
    wahlTafel.hidden = true;
    var wahlName = el("p", "spiel-auswahl-name");
    var wahlWerte = el("p", "spiel-auswahl-werte");
    var wahlKnoepfe = el("div", "spiel-auswahl-knoepfe");
    var folgeKnopf = el("button", "uni-wahl-knopf", "Kamera folgt");
    var drehKnopf = el("button", "uni-wahl-knopf", "Mitdrehen");
    var entfKnopf = el("button", "uni-wahl-knopf", "Entfernen");
    var zuKnopf = el("button", "uni-wahl-knopf", "×");
    folgeKnopf.type = drehKnopf.type = entfKnopf.type = zuKnopf.type = "button";
    drehKnopf.title = "Die Ansicht dreht sich mit diesem Körper um den Schwerpunkt mit (rotierendes Bezugssystem).";
    zuKnopf.setAttribute("aria-label", "Auswahl aufheben");
    wahlKnoepfe.append(folgeKnopf, drehKnopf, entfKnopf, zuKnopf);
    wahlTafel.append(wahlName, wahlWerte, wahlKnoepfe);
    /* Hinweis, solange die Ansicht mitdreht (auch ohne Auswahl, z. B. Trojaner) */
    var drehInfo = el("div", "spiel-dreh");
    var drehText = el("span", "", "");
    var drehAus = el("button", "uni-wahl-knopf", "Aus");
    drehAus.type = "button";
    drehAus.setAttribute("aria-label", "Mitdrehen beenden");
    drehInfo.append(drehText, drehAus);
    drehInfo.hidden = true;
    info.append(el("p", "uni-oberzeile", "Szene"), titel, text, werte, drehInfo, wahlTafel);
    var hinweis = el("p", "spiel-hinweis", "Ziehen wirft einen Körper · Tippen setzt ihn auf eine Kreisbahn");
    var vollEcke = el("button", "spiel-ecke");
    vollEcke.type = "button";
    vollEcke.setAttribute("aria-label", "Vollbild");
    vollEcke.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
    buehne.append(info, hinweis, vollEcke);

    /* ----- Bedienung: drei schwebende Tafeln über dem Bild (HUD):
       links Neuer Körper, Mitte Ablauf + Tempo, rechts Szene + Anzeigen.
       Ist die Bühne schmal (Container-Abfrage in universum.css), stehen
       sie unter dem Bild, damit es am Handy frei bleibt. Die Leiste ist
       ein Geschwister der Bühne, Klicks lösen also keinen Wurf aus. ----- */
    var leiste = el("div", "spiel-leiste");
    function tafel(klasse, titelText) {
      var t = el("div", "spiel-tafel " + klasse);
      if (titelText) t.append(el("p", "spiel-tafel-titel", titelText));
      leiste.append(t);
      return t;
    }
    var tWerkzeug = tafel("spiel-werkzeug", "Neuer Körper");
    var tDock = tafel("spiel-dock");
    var tAnsicht = tafel("spiel-ansicht", "Szene");
    /* Höhe, die die linke Tafel unten im Bild verdeckt (für die Legende) */
    function freiUnten() {
      if (getComputedStyle(leiste).position !== "absolute") return 0;
      var b = leinwand.getBoundingClientRect(), t = tWerkzeug.getBoundingClientRect();
      return Math.max(0, b.bottom - t.top);
    }
    function wahlReihe(liste, beiKlick, symbole) {
      var reihe = el("div", "uni-wahl");
      var knoepfe = liste.map(function (x) {
        var b = el("button", "uni-wahl-knopf", x.zusatz ? "" : x.name);
        b.type = "button";
        if (x.zusatz) {
          /* zweizeilig: Name und darunter klein der Zusatz (z. B. „groß“) */
          var n = el("span", "spiel-name", x.name);
          n.append(el("small", "", x.zusatz));
          b.append(n);
          b.setAttribute("aria-label", x.name + " " + x.zusatz);
        }
        if (x.titel) b.title = x.titel;
        if (symbole && symbole[x.id]) {
          b.insertAdjacentHTML("afterbegin", '<svg viewBox="0 0 24 24" aria-hidden="true">' + symbole[x.id] + '</svg>');
        }
        b.setAttribute("aria-pressed", "false");
        b.addEventListener("click", function () { beiKlick(x); });
        reihe.append(b);
        return b;
      });
      return { reihe: reihe, setze: function (x) {
        knoepfe.forEach(function (b, i) { b.setAttribute("aria-pressed", String(liste[i] === x)); });
      } };
    }
    function knopf(textInhalt, svg) {
      var b = el("button", "uni-knopf");
      b.type = "button";
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg>';
      var t = el("span", "uni-knopf-text", textInhalt);
      b.append(t);
      b.__text = t;
      return b;
    }
    function schalter(textInhalt, an, beiKlick, erklaerung) {
      var b = el("button", "uni-schalter");
      b.type = "button";
      b.setAttribute("aria-pressed", String(an));
      if (erklaerung) b.title = erklaerung;
      b.append(el("span", "uni-schalter-text", textInhalt), el("span", "uni-schalter-bahn"));
      b.addEventListener("click", function () {
        var neu = b.getAttribute("aria-pressed") !== "true";
        b.setAttribute("aria-pressed", String(neu));
        buehne.classList.add("uni-benutzt");
        beiKlick(neu);
      });
      b.setze = function (an2) { b.setAttribute("aria-pressed", String(an2)); };
      return b;
    }

    /* Szene: Aufklappliste statt langer Knopfreihe */
    var szenenWahl = (function () {
      var huelle = el("div", "spiel-szene");
      var liste = el("select", "spiel-szene-wahl");
      liste.setAttribute("aria-label", "Szene wählen");
      SZENEN.forEach(function (s, i) {
        var o = el("option", "", s.name);
        o.value = String(i);
        liste.append(o);
      });
      liste.addEventListener("change", function () { lade(SZENEN[+liste.value]); });
      huelle.append(liste);
      return { reihe: huelle, setze: function (s) { liste.value = String(SZENEN.indexOf(s)); } };
    })();
    tAnsicht.append(szenenWahl.reihe, el("p", "spiel-tafel-titel", "Anzeigen"));

    var reiheLauf = el("div", "spiel-reihe spiel-medien");
    var START_SVG = '<path d="M7 4.5v15l12-7.5z"/>', PAUSE_SVG = '<path d="M8 5v14M16 5v14"/>';
    var startKnopf = knopf("Start", START_SVG);
    var neuKnopf = knopf("Neu", '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>');
    var umKnopf = knopf("Zeit umkehren", '<path d="M7 7h11l-3-3M17 17H6l3 3"/>');
    /* im Dock nur Symbole: Name als Tooltip und für Vorleseprogramme */
    neuKnopf.title = "Neu starten";
    neuKnopf.setAttribute("aria-label", "Neu starten");
    umKnopf.title = "Zeit umkehren";
    umKnopf.setAttribute("aria-label", "Zeit umkehren");
    reiheLauf.append(startKnopf, neuKnopf, umKnopf);
    var tempoWahl = wahlReihe(TEMPI, function (t) { tempo = t.id; tempoWahl.setze(t); });
    tempoWahl.reihe.classList.add("spiel-segment");
    tempoWahl.reihe.setAttribute("role", "group");
    tempoWahl.reihe.setAttribute("aria-label", "Tempo");
    var tempoGruppe = el("div", "spiel-tempo");
    tempoGruppe.append(el("span", "spiel-tempo-titel", "Tempo"), tempoWahl.reihe);
    tDock.append(reiheLauf, el("span", "spiel-dock-trenner"), tempoGruppe);

    /* kleine Symbole links neben dem Namen (Strichzeichnung, 24er-Raster) */
    var NEU_SYMBOLE = {
      mond: '<path d="M15 4a8 8 0 1 0 5 13A7 7 0 0 1 15 4z"/>',
      planet: '<circle cx="12" cy="12" r="5"/><path d="M4.5 15.5C2 18 3 19.5 7 18.2s9.6-5.3 12.4-8.6C21.6 7 21 5.6 17.5 6.3"/>',
      stern: '<circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
      loch: '<circle cx="12" cy="12" r="2" class="spiel-symbol-voll"/><ellipse cx="12" cy="12" rx="6.5" ry="2.8"/>',
      "loch-gross": '<circle cx="12" cy="12" r="3.6" class="spiel-symbol-voll"/><ellipse cx="12" cy="12" rx="10" ry="4.4"/>',
      galaxie: '<path d="M12 12c0-2 2-3 3.5-2s1.3 4-1.5 5-6-1-6-4.5S11 4 15 4.5s6 4.5 5 8.5M12 12c0 2-2 3-3.5 2S7.2 10 10 9s6 1 6 4.5S13 20 9 19.5 3 15 4 11"/>',
      staub: '<circle cx="6" cy="8" r="1.3"/><circle cx="12" cy="5.5" r="1.3"/><circle cx="17.5" cy="9" r="1.3"/><circle cx="9" cy="13" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="6.5" cy="18" r="1.3"/><circle cx="18" cy="19" r="1.3"/>'
    };
    var neuWahl = wahlReihe(NEUE, function (x) { neuArt = x; neuWahl.setze(x); }, NEU_SYMBOLE);
    neuWahl.reihe.classList.add("spiel-neu");
    tWerkzeug.append(neuWahl.reihe);

    var spalten = el("div", "spiel-schalter");
    var spurSchalter = schalter("Spuren", true, function (an) { spurenAn = an; zeichne(); },
      "Zeigt, wo die Körper in letzter Zeit entlanggeflogen sind.");
    var pfeilSchalter = schalter("Pfeile v und a", false, function (an) { pfeileAn = an; zeichne(); },
      "Blau: Geschwindigkeit v (wohin und wie schnell ein Körper fliegt). Orange: Beschleunigung a (wohin ihn die Schwerkraft gerade zieht).");
    var gitterSchalter = schalter("Feldgitter", false, function (an) { gitterAn = an; zeichne(); },
      "Ein Gitter, das sich zur Anziehung hin verbiegt. Wo es stark gekrümmt ist, ist die Schwerkraft groß.");
    var folgeSchalter = schalter("Schwerpunkt mittig", false, function (an) { folgen = an; pan = { x: 0, y: 0 }; },
      "Die Kamera bleibt beim gemeinsamen Schwerpunkt aller Körper.");
    spalten.append(spurSchalter, pfeilSchalter, gitterSchalter, folgeSchalter);
    tAnsicht.append(spalten);
    rahmen.append(leiste);

    /* Zoom-Knöpfe unten rechts im Bild */
    var zoomEcke = el("div", "spiel-zoom");
    function eckKnopf(beschriftung, svg) {
      var b = el("button", "spiel-ecke");
      b.type = "button";
      b.setAttribute("aria-label", beschriftung);
      b.title = beschriftung;
      b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + svg + '</svg>';
      zoomEcke.append(b);
      return b;
    }
    var zoomRein = eckKnopf("Vergrößern", '<path d="M12 5v14M5 12h14"/>');
    var zoomRaus = eckKnopf("Verkleinern", '<path d="M5 12h14"/>');
    var mitteKnopf = eckKnopf("Ansicht zurücksetzen", '<circle cx="12" cy="12" r="6"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>');
    buehne.append(zoomEcke);
    zoomRaus.addEventListener("click", function () { zoomUm(1 / 1.4); });
    zoomRein.addEventListener("click", function () { zoomUm(1.4); });
    mitteKnopf.addEventListener("click", function () { pan = { x: 0, y: 0 }; zoom = 1; folgeAuswahl = false; aktualisiereAuswahl(); });

    /* ----- Zustand ----- */
    var sz = null, K = [], P = [], zeit = 0, E0 = 0, laeuft = false, tempo = 1, neuArt = NEUE[1];
    var spurenAn = true, pfeileAn = false, gitterAn = false, folgen = false, sichtbar = true;
    var zoom = 1, pan = { x: 0, y: 0 }, mitte = { x: 0, y: 0 };
    var auswahl = null, folgeAuswahl = false;
    var dreh = null;              /* {k: Bezugskörper, phi0} */
    var rz = { cx: 0, cy: 0, cos: 1, sin: 0, vcx: 0, vcy: 0, w: 0 };   /* Rahmen dieses Bildes */
    var startV = 0, meldung = "", meldungBis = 0, tauStaub = Infinity;
    var breite = 0, hoehe = 0, dpr = 1, massstab = 1;
    var hintergrund = [];

    function neuerKoerper(k) {
      setzeGroesse(k); k.spur = []; k.ax = 0; k.ay = 0;
      return k;
    }
    function neueEnergie() { E0 = energie(K, sz.eps * sz.eps); }
    function lade(s) {
      sz = s;
      K = s.koerper().map(neuerKoerper);
      if (s.ruhe) {
        var sp = schwerpunkt(K);
        K.forEach(function (k) { k.vx -= sp.vx; k.vy -= sp.vy; k.x -= sp.x; k.y -= sp.y; });
      }
      P = s.staub ? s.staub(K, s) : [];
      P.forEach(function (p) { p.ax = 0; p.ay = 0; if (s.staubSpur) p.spur = []; });
      if (s.beobachte !== undefined) {
        K[s.beobachte].beobachtet = true;
        startV = Math.hypot(K[s.beobachte].vx, K[s.beobachte].vy);
      }
      beschleunige(K, s.eps * s.eps);
      tauStaub = P.length ? beschleunigeStaub(P, K, s.epsStaub * s.epsStaub) : Infinity;
      neueEnergie();
      zeit = 0; zoom = 1; pan = { x: 0, y: 0 };
      auswahl = null; folgeAuswahl = false;
      dreh = null;
      if (s.dreh !== undefined) setzeDreh(true, K[s.dreh]); else setzeDreh(false);
      if (s.neu) { neuArt = NEUE.filter(function (x) { return x.id === s.neu; })[0]; neuWahl.setze(neuArt); }
      szenenWahl.setze(s);
      titel.textContent = s.name;
      text.textContent = s.text;
      setzeLauf(false);
      aktualisiereAuswahl();
      rahmenZustand();
      mitte = kameraZiel();
      zeichne();
    }
    function setzeLauf(an) {
      laeuft = an;
      startKnopf.__text.textContent = an ? "Pause" : "Start";
      startKnopf.querySelector("svg").innerHTML = an ? PAUSE_SVG : START_SVG;
      rahmen.classList.toggle("spiel-laeuft", an);
      letzte = null;
    }
    startKnopf.addEventListener("click", function () { setzeLauf(!laeuft); });
    neuKnopf.addEventListener("click", function () { lade(sz); });
    umKnopf.addEventListener("click", function () {
      /* Leapfrog ist zeitumkehrbar: alle Geschwindigkeiten umdrehen */
      K.concat(P).forEach(function (k) { k.vx = -k.vx; k.vy = -k.vy; });
      meldung = "Zeit läuft rückwärts";
      meldungBis = performance.now() + 2500;
      zeichne();
    });

    /* ----- Mitdrehen ----- */
    function setzeDreh(an, bezug) {
      var k = bezug || (sz && sz.dreh !== undefined ? K[sz.dreh] : null) || auswahl;
      if (an && k && K.indexOf(k) >= 0 && K.length > 1) {
        var c = schwerpunkt(K);
        dreh = { k: k, phi0: Math.atan2(k.y - c.y, k.x - c.x) };
      } else {
        dreh = null;
        an = false;
      }
      aktualisiereDreh();
      pan = { x: 0, y: 0 };
      K.forEach(function (x) { x.spur = []; });
      P.forEach(function (p) { if (p.spur) p.spur = []; });
      rahmenZustand();
      mitte = kameraZiel();
    }
    /* Mitdrehen gibt es nur für einen Körper, der etwas umkreist */
    function aktualisiereDreh() {
      drehInfo.hidden = !dreh;
      if (dreh) {
        var t = "Ansicht dreht mit „" + name(dreh.k) + "“";
        if (drehText.textContent !== t) drehText.textContent = t;
      }
      var kann = !!(auswahl && sz && K.length > 1 && bahnDaten(auswahl, K, sz.eps * sz.eps));
      drehKnopf.hidden = !kann;
      drehKnopf.setAttribute("aria-pressed", String(!!dreh && dreh.k === auswahl));
    }
    drehKnopf.addEventListener("click", function () {
      setzeDreh(!(dreh && dreh.k === auswahl), auswahl);
    });
    drehAus.addEventListener("click", function () { setzeDreh(false); });

    /* ----- Bezugsrahmen und Kamera ----- */
    function rahmenZustand() {
      if (dreh && dreh.k.weg) { var n = dreh.k; while (n.weg) n = n.weg; dreh.k = n; }
      if (dreh && (K.indexOf(dreh.k) < 0 || K.length < 2)) setzeDreh(false);
      if (!dreh) { rz = { cx: 0, cy: 0, cos: 1, sin: 0, vcx: 0, vcy: 0, w: 0 }; return; }
      var c = schwerpunkt(K), k = dreh.k;
      var dx = k.x - c.x, dy = k.y - c.y, r2 = dx * dx + dy * dy;
      var th = -(Math.atan2(dy, dx) - dreh.phi0);
      rz = { cx: c.x, cy: c.y, cos: Math.cos(th), sin: Math.sin(th), vcx: c.vx, vcy: c.vy,
             w: r2 > 0 ? (dx * (k.vy - c.vy) - dy * (k.vx - c.vx)) / r2 : 0 };
    }
    function inRahmen(x, y) {
      if (!dreh) return [x, y];
      var dx = x - rz.cx, dy = y - rz.cy;
      return [dx * rz.cos - dy * rz.sin, dx * rz.sin + dy * rz.cos];
    }
    function ausRahmen(fx, fy) {
      if (!dreh) return [fx, fy];
      return [rz.cx + fx * rz.cos + fy * rz.sin, rz.cy - fx * rz.sin + fy * rz.cos];
    }
    /* Vektor (ohne Verschiebung) in den Rahmen drehen und zurück */
    function vekRein(vx, vy) { return dreh ? [vx * rz.cos - vy * rz.sin, vx * rz.sin + vy * rz.cos] : [vx, vy]; }
    function vekRaus(vx, vy) { return dreh ? [vx * rz.cos + vy * rz.sin, -vx * rz.sin + vy * rz.cos] : [vx, vy]; }
    /* Geschwindigkeit im Rahmen (v') → von außen gesehen (v) am Ort (x, y) */
    function vonAussen(x, y, vfx, vfy) {
      var v = vekRaus(vfx, vfy);
      if (!dreh) return v;
      return [v[0] + rz.vcx - rz.w * (y - rz.cy), v[1] + rz.vcy + rz.w * (x - rz.cx)];
    }
    function imRahmen(x, y, vx, vy) {
      if (!dreh) return [vx, vy];
      return vekRein(vx - rz.vcx + rz.w * (y - rz.cy), vy - rz.vcy - rz.w * (x - rz.cx));
    }
    function kameraZiel() {
      var z = [0, 0];
      if (auswahl && folgeAuswahl) z = inRahmen(auswahl.x, auswahl.y);
      else if (folgen && !dreh) { var c = schwerpunkt(K); z = [c.x, c.y]; }
      return { x: z[0] + pan.x, y: z[1] + pan.y };
    }
    function bildschirm(fx, fy) {
      return [breite / 2 + (fx - mitte.x) * massstab, hoehe / 2 + (fy - mitte.y) * massstab];
    }
    function rahmenVon(px, py) {
      return [mitte.x + (px - breite / 2) / massstab, mitte.y + (py - hoehe / 2) / massstab];
    }
    function welt(px, py) { var f = rahmenVon(px, py); return ausRahmen(f[0], f[1]); }
    function zeigeWelt(x, y) { var f = inRahmen(x, y); return bildschirm(f[0], f[1]); }
    function setzeMassstab() { massstab = Math.min(breite, hoehe) / (2 * sz.sicht) * zoom; }
    /* Zoomen um einen Bildschirmpunkt (bleibt fest) */
    function zoomUm(faktor, px, py) {
      if (px === undefined) { px = breite / 2; py = hoehe / 2; }
      var vorher = rahmenVon(px, py);
      zoom = Math.max(0.12, Math.min(12, zoom * faktor));
      setzeMassstab();
      var nachher = rahmenVon(px, py);
      pan.x += vorher[0] - nachher[0]; pan.y += vorher[1] - nachher[1];
      mitte.x += vorher[0] - nachher[0]; mitte.y += vorher[1] - nachher[1];
      zeichne();
    }

    /* ----- Größe ----- */
    function messe() {
      var r = leinwand.getBoundingClientRect();
      if (!r.width || !r.height) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      breite = r.width; hoehe = r.height;
      canvas.width = Math.round(breite * dpr);
      canvas.height = Math.round(hoehe * dpr);
      hintergrund = [];
      var z = zufallsQuelle(7);
      var n = Math.round(breite * hoehe / 2600);
      for (var i = 0; i < n; i++) hintergrund.push([z() * breite, z() * hoehe, z()]);
      zeichne();
    }

    /* ===================== Zeichnen ===================== */
    function koerperFarbe(k) {
      if (k.beobachtet || k.sl) return F.violett;
      if (k.gal) return F.galKern;
      return k.art === "stern" ? F.kupfer : (k.art === "planet" ? F.blau : F.text);
    }
    /* Radius auf dem Bildschirm (für Zeichnen und Antippen) */
    function zeichenRadius(k) {
      if (k.sl) return schattenRadius(k);
      if (k.gal) return Math.max(8, 1.5 * k.kb * massstab);
      return Math.max(k.art === "mond" ? 1.8 : 2.6, k.r * massstab);
    }
    function pfeil(x0, y0, x1, y1, f, breiteLinie) {
      var l = Math.hypot(x1 - x0, y1 - y0);
      if (l < 3) return;
      ctx.strokeStyle = f; ctx.fillStyle = f; ctx.lineWidth = breiteLinie || 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      var w = Math.atan2(y1 - y0, x1 - x0), s = Math.min(9, l * 0.5);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - s * Math.cos(w - 0.4), y1 - s * Math.sin(w - 0.4));
      ctx.lineTo(x1 - s * Math.cos(w + 0.4), y1 - s * Math.sin(w + 0.4));
      ctx.fill();
    }
    /* Feldgitter: Gitterpunkte in Richtung der Schwerebeschleunigung
       verschoben (begrenzt) – eine Sehhilfe, kein Bild der Raumzeit */
    function zeichneGitter() {
      var abstand = 34, maxPx = 30;
      var spaltenN = Math.ceil(breite / abstand) + 2, zeilenN = Math.ceil(hoehe / abstand) + 2;
      var punkte = [];
      for (var j = 0; j < zeilenN; j++) {
        var reihe = [];
        for (var i = 0; i < spaltenN; i++) {
          var w = welt((i - 1) * abstand, (j - 1) * abstand);
          var gx = 0, gy = 0, naechst = Infinity;
          for (var n = 0; n < K.length; n++) {
            var k = K[n], dx = k.x - w[0], dy = k.y - w[1], r2 = dx * dx + dy * dy, s2 = r2 + 36;
            var f = k.m / (s2 * Math.sqrt(s2));
            gx += f * dx; gy += f * dy;
            if (r2 < naechst) naechst = r2;
          }
          var g = Math.hypot(gx, gy);
          if (g > 0) {
            var d = Math.min(maxPx / massstab * Math.tanh(3 * g), 0.7 * Math.sqrt(naechst));
            w = [w[0] + gx / g * d, w[1] + gy / g * d];
          }
          reihe.push(zeigeWelt(w[0], w[1]));
        }
        punkte.push(reihe);
      }
      ctx.strokeStyle = F.bahn;
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 1;
      ctx.beginPath();
      punkte.forEach(function (reihe) {
        reihe.forEach(function (p, i2) { if (i2) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      });
      for (var i3 = 0; i3 < spaltenN; i3++) {
        for (var j3 = 0; j3 < zeilenN; j3++) {
          var p = punkte[j3][i3];
          if (j3) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
    /* Sternhimmel; hinter einem Schwarzen Loch als Gravitationslinse
       (Punktlinse): Bilder bei θ± = (β ± sqrt(β² + 4 θ_E²)) / 2, Helligkeit
       μ± = (u² + 2) / (2u sqrt(u² + 4)) ± 1/2 mit u = β/θ_E. θ_E = 9 sqrt(r_s)
       ist frei gewählt (die Entfernungen des Himmels sind unbestimmt). */
    function zeichneHimmel(loecher) {
      var linsen = loecher.map(function (k) {
        var p = zeigeWelt(k.x, k.y), rs = rsVon(k.m);
        return [p[0], p[1], Math.max(8, 9 * Math.sqrt(rs) * massstab), schattenRadius(k)];
      });
      ctx.fillStyle = F.text;
      for (var i = 0; i < hintergrund.length; i++) {
        var s = hintergrund[i], hell = 0.15 + 0.45 * s[2], gr = s[2] > 0.85 ? 1.6 : 1;
        var L = null, ub = 6;
        for (var j = 0; j < linsen.length; j++) {
          var u0 = Math.hypot(s[0] - linsen[j][0], s[1] - linsen[j][1]) / linsen[j][2];
          if (u0 < ub) { ub = u0; L = linsen[j]; }
        }
        if (!L) { ctx.globalAlpha = hell; ctx.fillRect(s[0], s[1], gr, gr); continue; }
        var dx = s[0] - L[0], dy = s[1] - L[1], beta = Math.hypot(dx, dy) || 0.01, u = beta / L[2];
        var wz = Math.sqrt(u * u + 4), mu = (u * u + 2) / (2 * u * wz), ex = dx / beta, ey = dy / beta;
        var bilder = [[(u + wz) / 2, mu + 0.5], [-(wz - u) / 2, mu - 0.5]];
        for (var b = 0; b < 2; b++) {
          var th = bilder[b][0] * L[2];
          if (Math.abs(th) < L[3] * 1.08) continue;       /* hinter dem Schatten */
          var m = Math.min(5, bilder[b][1]), g2 = gr * Math.min(2.2, Math.sqrt(m));
          ctx.globalAlpha = Math.min(1, hell * Math.sqrt(m));
          ctx.fillRect(L[0] + ex * th - g2 / 2, L[1] + ey * th - g2 / 2, g2, g2);
        }
      }
      ctx.globalAlpha = 1;
    }
    /* sichtbarer Schatten eines Schwarzen Lochs: 2,6 r_s (Photonenring) */
    function schattenRadius(k) { return Math.max(3.5, 2.6 * rsVon(k.m) * massstab); }

    /* Staub und Galaxiensterne, nach Farbe und Helligkeit gesammelt und
       mit „lighter“ gezeichnet: Wo viele Sterne stehen, leuchtet es heller */
    function zeichneStaub(loecher) {
      var gr = Math.max(1.3, Math.min(2.4, massstab * 1.2));
      var heiss = loecher.map(function (k) { var rs = rsVon(k.m); k.gas = 0; return [k.x, k.y, rs * rs, k]; });
      for (var i = 0; i < P.length; i++) {
        var p = P[i], q = zeigeWelt(p.x, p.y);
        if (q[0] < -3 || q[1] < -3 || q[0] > breite + 3 || q[1] > hoehe + 3) continue;
        var c = p.f || 0, stufe = 2;
        if (p.g) {
          if (p.pop === 0) { c = 4; stufe = 1; }
          else { c = 5; stufe = 0; var w = armGewicht(p); if (w > 0.5) { stufe = 2; if (p.pop === 2) c = 6; } else if (w > 0.2) stufe = 1; }
        }
        /* Gas nahe einem Schwarzen Loch glüht: innen weiß, weiter außen gelb, dann orange */
        for (var j = 0; j < heiss.length; j++) {
          var dx = p.x - heiss[j][0], dy = p.y - heiss[j][1], x2 = (dx * dx + dy * dy) / heiss[j][2];
          if (x2 < 121) { c = x2 < 20 ? 7 : (x2 < 49 ? 8 : 1); stufe = 2; heiss[j][3].gas++; break; }
        }
        eimer[c][stufe].push(q[0], q[1]);
      }
      ctx.globalCompositeOperation = "lighter";
      for (c = 0; c < eimer.length; c++) {
        for (var st = 0; st < 3; st++) {
          var e = eimer[c][st];
          if (!e.length) continue;
          ctx.globalAlpha = HELL[st];
          ctx.fillStyle = PAL[c];
          ctx.beginPath();
          for (var n = 0; n < e.length; n += 2) ctx.rect(e[n] - gr / 2, e[n + 1] - gr / 2, gr, gr);
          ctx.fill();
          e.length = 0;
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    /* Dichtewelle: Wie stark ein Scheibenstern gerade in einem Spiralarm
       steht (0…1). Aus, wenn der Kern weg oder verschmolzen ist; schwächer,
       wenn eine andere Galaxie nah ist (dann formen Gezeiten die Arme). */
    function armGewicht(p) {
      var k = p.g, a = k.arm;
      if (!a || k.weg !== undefined || k.verschmolzen || k.armStaerke <= 0) return 0;
      var dx = p.x - k.x, dy = p.y - k.y, r = Math.sqrt(dx * dx + dy * dy);
      if (r < 1.5 * k.kb || r > 1.3 * k.rand) return 0;
      var phi = -a.sinn * Math.atan2(dy, dx);
      var psi = 2 * (phi - a.omega * zeit) + 2 * Math.log(r / a.r0) / a.tanP;
      var w = Math.pow((1 + Math.cos(psi)) / 2, 2);
      if (r > k.rand) w *= (1.3 * k.rand - r) / (0.3 * k.rand);
      return w * k.armStaerke;
    }
    /* Spiralmuster als weiches Bild, einmal je Galaxie vorgezeichnet (für
       Drehsinn +1 zur Zeit 0: Arme bei Winkel ln(r/r0)/tan(P) + kπ). Es
       dreht sich starr mit omega (Dichtewelle), siehe zeichneArme. */
    function armBild(k) {
      var a = k.arm, n = 256, S = n / 2 / (1.25 * k.rand), L = k.kb / 4;   /* L: Längenmaßstab (früher kb = 4) */
      var c = document.createElement("canvas");
      c.width = c.height = n;
      var x = c.getContext("2d");
      if (!x) return null;
      x.globalCompositeOperation = "lighter";
      var z = zufallsQuelle(4242);
      for (var arm = 0; arm < 2; arm++) {
        for (var r = 1.5 * k.kb; r < k.rand; r += 0.6 * L) {
          var w = Math.log(r / a.r0) / a.tanP + arm * Math.PI;
          var px = n / 2 + r * S * Math.cos(w), py = n / 2 + r * S * Math.sin(w);
          var rb = (0.09 * r + 1.2 * L) * S, aussen = 1 - r / k.rand;
          var g = x.createRadialGradient(px, py, 0, px, py, rb);
          g.addColorStop(0, F.galArm);
          g.addColorStop(1, "rgba(0,0,0,0)");
          x.globalAlpha = 0.3 * (0.4 + 0.6 * aussen);
          x.fillStyle = g;
          x.beginPath(); x.arc(px, py, rb, 0, 2 * Math.PI); x.fill();
          /* Sternentstehungsgebiete: kleine rosa Knoten am Innenrand der Arme */
          if (z() < 0.12) {
            var kx = px + (z() - 0.5) * rb, ky = py + (z() - 0.5) * rb, kr = 0.35 * rb;
            g = x.createRadialGradient(kx, ky, 0, kx, ky, kr);
            g.addColorStop(0, F.galHii);
            g.addColorStop(1, "rgba(0,0,0,0)");
            x.globalAlpha = 0.55;
            x.fillStyle = g;
            x.beginPath(); x.arc(kx, ky, kr, 0, 2 * Math.PI); x.fill();
          }
        }
      }
      return c;
    }
    function zeichneArme(k, p) {
      if (!k.arm || k.verschmolzen || !(k.armStaerke > 0)) return;
      if (k.armBild === undefined) k.armBild = armBild(k);
      if (!k.armBild) return;
      var gr = 2.5 * k.rand * massstab;
      ctx.save();
      ctx.translate(p[0], p[1]);
      if (dreh) ctx.rotate(Math.atan2(rz.sin, rz.cos));
      ctx.rotate(-k.arm.sinn * k.arm.omega * zeit);
      ctx.scale(1, k.arm.sinn);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.9 * k.armStaerke;
      ctx.drawImage(k.armBild, -gr / 2, -gr / 2, gr, gr);
      ctx.restore();
    }
    /* Stärke der Arme je Galaxie: 1 allein, 0 bei naher Begegnung */
    function armStaerken() {
      K.forEach(function (k) {
        if (!k.gal) return;
        var d = Infinity;
        K.forEach(function (j) { if (j !== k && j.m > 0.2 * k.m) d = Math.min(d, Math.hypot(j.x - k.x, j.y - k.y)); });
        k.armStaerke = Math.max(0, Math.min(1, (d - 1.5 * k.rand) / (2 * k.rand)));
      });
    }

    function zeichneSpur(s, n, staerke) {
      var stueck = Math.max(4, Math.ceil(n / 12));
      for (var a = 0; a < n - 1; a += stueck) {
        var e = Math.min(n - 1, a + stueck);
        ctx.globalAlpha = (0.08 + 0.55 * (e / n)) * (staerke || 1);
        ctx.beginPath();
        var p = bildschirm(s[a][0], s[a][1]);
        ctx.moveTo(p[0], p[1]);
        for (var i = a + 1; i <= e; i++) { p = bildschirm(s[i][0], s[i][1]); ctx.lineTo(p[0], p[1]); }
        ctx.stroke();
      }
    }

    var ziel = null;   /* Wurf: Startpunkt (Welt), Anfang und Ende (Rahmen), Vorhersage */
    function zeichne() {
      if (!sz || !breite) return;
      setzeMassstab();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = F.himmel;
      ctx.fillRect(0, 0, breite, hoehe);
      var loecher = K.filter(function (k) { return k.sl; });
      zeichneHimmel(loecher);
      if (gitterAn) zeichneGitter();

      if (spurenAn) {
        ctx.lineWidth = 1.4;
        K.forEach(function (k) {
          if (k.spur.length < 2) return;
          ctx.strokeStyle = koerperFarbe(k);
          zeichneSpur(k.spur, k.spur.length, k.gal ? 0.3 : 1);
        });
        if (sz.staubSpur) {
          ctx.lineWidth = 0.8;
          ctx.globalAlpha = 0.18;
          P.forEach(function (p) {
            if (!p.spur || p.spur.length < 2) return;
            ctx.strokeStyle = STAUB_FARBE[p.f || 0];
            ctx.beginPath();
            p.spur.forEach(function (q, i) {
              var s = bildschirm(q[0], q[1]);
              if (i) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]);
            });
            ctx.stroke();
          });
          ctx.globalAlpha = 1;
        }
      }

      /* Staub und Sterne der Galaxien */
      armStaerken();
      zeichneStaub(loecher);

      /* Körper */
      K.forEach(function (k) {
        var p = zeigeWelt(k.x, k.y);
        var r = zeichenRadius(k);
        var fa = koerperFarbe(k), g;
        if (k.gal) {
          /* Kern einer Galaxie: schwaches Leuchten der Scheibe (unaufgelöste
             Sterne, nur ungestört) und weiches Leuchten des Bulges */
          if (k.armStaerke > 0 && !k.verschmolzen) {
            var rd = k.rand * massstab;
            g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rd);
            g.addColorStop(0, F.galArm);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalCompositeOperation = "lighter";
            ctx.globalAlpha = 0.14 * k.armStaerke;
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p[0], p[1], rd, 0, 2 * Math.PI); ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            ctx.globalAlpha = 1;
          }
          zeichneArme(k, p);
          var rg = Math.max(10, 3 * k.kb * massstab);
          g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rg);
          g.addColorStop(0, F.galKern);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = k.verschmolzen ? 0.75 : 0.55;
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p[0], p[1], rg, 0, 2 * Math.PI); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.fillStyle = F.heiss1;
          ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, 2 * Math.PI); ctx.fill();
        } else if (k.sl) {
          /* Schwarzes Loch: Schatten (2,6 r_s) mit hellem Photonenring; heißes
             Gas in der Nähe (bis 11 r_s, gezählt in zeichneStaub) leuchtet */
          ctx.globalCompositeOperation = "lighter";
          if (k.gas) {
            var ra = r * 11 / 2.6;
            g = ctx.createRadialGradient(p[0], p[1], r, p[0], p[1], ra);
            g.addColorStop(0, F.heiss1);
            g.addColorStop(0.25, F.heiss2);
            g.addColorStop(0.6, F.kupfer);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalAlpha = Math.min(0.55, 0.08 + k.gas / 900);
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p[0], p[1], ra, 0, 2 * Math.PI); ctx.fill();
          }
          g = ctx.createRadialGradient(p[0], p[1], r, p[0], p[1], r * 1.9);
          g.addColorStop(0, F.heiss2);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(p[0], p[1], r * 1.9, 0, 2 * Math.PI); ctx.fill();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#000";
          ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 2 * Math.PI); ctx.fill();
          ctx.strokeStyle = F.heiss1;
          ctx.globalAlpha = 0.85;
          ctx.lineWidth = Math.max(1, Math.min(2.2, r * 0.08));
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else {
          if (k.art === "stern") {
            var rg2 = r * 3.2;
            g = ctx.createRadialGradient(p[0], p[1], r * 0.4, p[0], p[1], rg2);
            g.addColorStop(0, fa);
            g.addColorStop(1, "rgba(0,0,0,0)");
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(p[0], p[1], rg2, 0, 2 * Math.PI); ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = fa;
          ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 2 * Math.PI); ctx.fill();
        }
        if (k.beobachtet) {
          ctx.font = "600 12px Inter, sans-serif";
          ctx.fillStyle = F.violett;
          ctx.fillText("Sonde", p[0] + r + 5, p[1] - r - 3);
        }
        if (k === auswahl) {
          ctx.strokeStyle = F.text;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.arc(p[0], p[1], r + 6, 0, 2 * Math.PI); ctx.stroke();
          ctx.setLineDash([]);
        }
      });

      /* Pfeile: Geschwindigkeit (blau) und Beschleunigung (orange) */
      if (pfeileAn) {
        K.forEach(function (k) {
          var p = zeigeWelt(k.x, k.y);
          var v = imRahmen(k.x, k.y, k.vx, k.vy), a = vekRein(k.ax, k.ay);
          var lv = Math.hypot(v[0], v[1]), la = Math.hypot(a[0], a[1]);
          /* v: 12 px je Einheit, sehr schnelle Körper (am Schwarzen Loch) gekappt */
          if (lv > 0) {
            var l1 = Math.min(12 * lv, 160);
            pfeil(p[0], p[1], p[0] + v[0] / lv * l1, p[1] + v[1] / lv * l1, F.blau, 2);
          }
          if (la > 0) {
            var l = 45 * Math.tanh(la * 3);
            pfeil(p[0], p[1], p[0] + a[0] / la * l, p[1] + a[1] / la * l, F.kupfer, 2);
          }
        });
        zeichneLegende();
      }

      /* Wurf: Pfeil, Kreisbahn, Fluchtkreis und Vorhersage */
      if (ziel) {
        nachfuehren();
        /* Pfeil = Zugstrecke, angesetzt am (beim Mond verschobenen) Startpunkt */
        var a0 = zeigeWelt(ziel.x0, ziel.y0);
        var a1 = [a0[0] + (ziel.fx1 - ziel.fx0) * massstab, a0[1] + (ziel.fy1 - ziel.fy0) * massstab];
        if (ziel.bahn && ziel.bahn.length > 1) {
          ctx.setLineDash([4, 5]);
          ctx.strokeStyle = F.text;
          ctx.globalAlpha = 0.55;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ziel.bahn.forEach(function (q2, i2) {
            var s = bildschirm(q2[0], q2[1]);
            if (i2) ctx.lineTo(s[0], s[1]); else ctx.moveTo(s[0], s[1]);
          });
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        var zb = zentralBahn(ziel.x0, ziel.y0, ziel.um);
        ctx.font = "600 11px Inter, sans-serif";
        if (zb) {
          /* gestrichelter Pfeil: genau diese Geschwindigkeit ergibt eine Kreisbahn */
          var vf = imRahmen(ziel.x0, ziel.y0, zb.kreisV[0], zb.kreisV[1]);
          var k1 = [a0[0] + vf[0] / WURF * massstab, a0[1] + vf[1] / WURF * massstab];
          ctx.globalAlpha = 0.6;
          ctx.setLineDash([3, 3]);
          pfeil(a0[0], a0[1], k1[0], k1[1], F.text, 1.4);
          ctx.setLineDash([]);
          ctx.fillStyle = F.text;
          ctx.fillText("Kreisbahn", k1[0] + 6, k1[1] - 6);
          /* Fluchtkreis: Endet der Wurfpfeil außerhalb, kommt der Körper nie zurück
             (Energie, unabhängig von der Richtung); im Mitdrehen nicht gezeigt */
          if (!dreh) {
            var mx = a0[0] + zb.um.vx / WURF * massstab, my = a0[1] + zb.um.vy / WURF * massstab;
            var rf = zb.flucht / WURF * massstab;
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = F.text;
            ctx.lineWidth = 1;
            ctx.setLineDash([2, 5]);
            ctx.beginPath(); ctx.arc(mx, my, rf, 0, 2 * Math.PI); ctx.stroke();
            ctx.setLineDash([]);
            ctx.globalAlpha = 0.6;
            ctx.fillText("Flucht", mx - 16, my - rf - 5);
          }
          ctx.globalAlpha = 1;
        }
        pfeil(a0[0], a0[1], a1[0], a1[1], F.kupfer, 2);
        ctx.fillStyle = F.kupfer;
        /* Vorschau in echter Größe: Schwarzes Loch mit Schatten, Galaxie als Ring der Scheibe */
        var rr = neuArt.staub ? 4 : (neuArt.sl ? Math.max(3.5, 2.6 * rsVon(neuArt.m) * massstab) :
          (neuArt.gal ? 7 : Math.max(2.6, radius(neuArt.m) * massstab)));
        ctx.beginPath(); ctx.arc(a0[0], a0[1], rr, 0, 2 * Math.PI); ctx.fill();
        if (neuArt.gal) {
          ctx.strokeStyle = F.kupfer;
          ctx.globalAlpha = 0.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath(); ctx.arc(a0[0], a0[1], neuArt.rand * massstab, 0, 2 * Math.PI); ctx.stroke();
          ctx.setLineDash([]);
          ctx.globalAlpha = 1;
        }
        var vw = wurfGeschwindigkeit();
        ctx.font = "600 12px Inter, sans-serif";
        ctx.fillStyle = F.text;
        ctx.fillText("v = " + zahl(Math.hypot(vw[0], vw[1]), 1) + (zb ? " · " + bahnArt(zb, vw) : ""), a1[0] + 8, a1[1] + 4);
      }
      zeigeWerte();
    }
    /* Was für eine Bahn der Wurf ergibt (Zweikörper-Näherung) */
    function bahnArt(zb, v) {
      var vx = v[0] - zb.um.vx, vy = v[1] - zb.um.vy, vb = Math.hypot(vx, vy);
      if (vb >= zb.flucht) return "fliegt davon";
      var radial = (vx * zb.ex + vy * zb.ey) / zb.kreis;
      if (Math.abs(vb / zb.kreis - 1) < 0.04 && Math.abs(radial) < 0.12) return "Kreisbahn";
      return "Ellipse";
    }
    function zeichneLegende() {
      var schmal = breite < 520;
      var zeilen = [[F.blau, schmal ? "v: Geschwindigkeit" : "v: Geschwindigkeit (wohin er fliegt)"],
                    [F.kupfer, schmal ? "a: Beschleunigung" : "a: Beschleunigung (wohin die Schwerkraft zieht)"]];
      ctx.font = "500 12px Inter, sans-serif";
      var w = 0;
      zeilen.forEach(function (z) { w = Math.max(w, ctx.measureText(z[1]).width); });
      var x = 12, y = hoehe - 12 - zeilen.length * 18 - 8 - freiUnten();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = F.himmel;
      ctx.fillRect(x, y, w + 52, zeilen.length * 18 + 10);
      ctx.globalAlpha = 1;
      zeilen.forEach(function (z, i) {
        var yy = y + 14 + i * 18;
        pfeil(x + 8, yy - 4, x + 34, yy - 4, z[0], 2);
        ctx.fillStyle = F.text;
        ctx.fillText(z[1], x + 42, yy);
      });
    }

    function zeigeWerte() {
      var teile = [K.length + " Körper"];
      if (P.length) teile.push(P.length + " Staubteilchen");
      teile.push("Zeit " + Math.round(zeit));
      /* Mit Galaxien bremst die dynamische Reibung: Energie bleibt dann nicht erhalten */
      var reibt = K.some(function (k) { return k.gal; }) && K.length > 1;
      if (reibt) teile.push("Halo bremst");
      else if (E0 !== 0 && K.length > 1) {
        var E = energie(K, sz.eps * sz.eps), abw = Math.abs((E - E0) / E0) * 100;
        teile.push("Energie erhalten auf " + (abw < 0.01 ? "unter 0,01" : zahl(abw, abw < 1 ? 2 : 1)) + " %");
      }
      var b = K.filter(function (k) { return k.beobachtet; })[0];
      if (b) teile.push("Sonde: " + zahl(startV, 1) + " → " + zahl(Math.hypot(b.vx, b.vy), 1));
      var t = teile.join(" · ");
      if (meldung && performance.now() < meldungBis) t += " · " + meldung;
      if (werte.textContent !== t) werte.textContent = t;
      if (auswahl) zeigeAuswahl();
    }

    /* ----- Auswahl ----- */
    function name(k) { return k.name || ART_NAME[k.art]; }
    function zeigeAuswahl() {
      var eps2 = sz.eps * sz.eps;
      var d = bahnDaten(auswahl, K, eps2);
      var m = auswahl.m;
      var zeile1 = name(auswahl) + " · Masse " + (m < 0.1 ? zahl(m, 3) : (m < 10 ? zahl(m, 1) : Math.round(m)));
      var gleich = K.some(function (j) { return j !== auswahl && j.m >= auswahl.m; });
      var zeile2 = gleich ?
        "Kein schwererer Körper da, um den er kreisen könnte. Bei gleich schweren Körpern gibt es keine einfache Ellipse." :
        "Der schwerste Körper hier. Die anderen kreisen um ihn, er selbst wackelt nur ein wenig.";
      if (d) {
        zeile2 = "Abstand zu „" + name(d.um) + "“ " + Math.round(d.r);
        if (d.um.sl) zeile2 += " = " + zahl(d.r / rsVon(d.um.m), 1) + " Schwarzschild-Radien";
        zeile2 += " · v = " + zahl(d.v, 2) + (d.um.sl && d.v > 0.1 * Math.sqrt(C2) ? " = " + zahl(d.v / Math.sqrt(C2), 2) + " c" : "") +
          " (Flucht: " + zahl(d.flucht, 2) + ")\n";
        if (!d.gebunden) {
          zeile2 += "Ungebunden: fliegt davon" + (d.e !== undefined ? " (Hyperbel, e = " + zahl(d.e, 2) + ")" : "");
        } else if (d.e !== undefined) {
          zeile2 += (d.e < 0.03 ? "Fast eine Kreisbahn" : "Ellipse, e = " + zahl(d.e, 2)) +
            (d.T ? " · Umlaufzeit " + Math.round(d.T) : "");
        } else if (d.um.sl) {
          zeile2 += d.r < 3 * rsVon(d.um.m) ? "Innerhalb von 3 Schwarzschild-Radien: keine stabile Bahn, er stürzt bald hinein." :
            "Gebunden. So nah am Schwarzen Loch ist die Bahn keine Ellipse mehr, sie dreht sich bei jedem Umlauf weiter.";
        } else {
          zeile2 += Math.abs(d.v / d.kreis - 1) < 0.05 ? "Fast eine Kreisbahn im Halo" : "Gebunden an die Galaxie";
        }
      }
      if (auswahl.sl) {
        var rs = rsVon(m);
        zeile2 += "\nHorizont (Schwarzschild-Radius) " + zahl(rs, 1) + ". Stabile Kreisbahnen erst ab dem Dreifachen, " +
          zahl(3 * rs, 1) + ". Zerreißt Sterne näher als " + Math.round(TIDE * Math.cbrt(m)) + ".";
      }
      if (auswahl.gal) {
        var n = 0;
        P.forEach(function (p) { if (p.g === auswahl) n++; });
        zeile2 += "\n" + (auswahl.verschmolzen ? "Aus zwei Galaxien verschmolzen, jetzt elliptisch. " : "") +
          n + " Sterne. Fast die ganze Masse steckt im unsichtbaren Halo aus Dunkler Materie.";
      }
      if (wahlName.textContent !== zeile1) wahlName.textContent = zeile1;
      if (wahlWerte.textContent !== zeile2) wahlWerte.textContent = zeile2;
    }
    function aktualisiereAuswahl() {
      if (auswahl && auswahl.weg) { while (auswahl.weg) auswahl = auswahl.weg; }
      if (auswahl && K.indexOf(auswahl) < 0) auswahl = null;
      wahlTafel.hidden = !auswahl;
      folgeKnopf.setAttribute("aria-pressed", String(folgeAuswahl && !!auswahl));
      aktualisiereDreh();
      if (auswahl) zeigeAuswahl();
    }
    folgeKnopf.addEventListener("click", function () {
      folgeAuswahl = !folgeAuswahl; pan = { x: 0, y: 0 }; aktualisiereAuswahl();
    });
    entfKnopf.addEventListener("click", entferneAuswahl);
    zuKnopf.addEventListener("click", function () { auswahl = null; folgeAuswahl = false; aktualisiereAuswahl(); zeichne(); });
    function entferneAuswahl() {
      if (!auswahl) return;
      auswahl.weg = null;          /* Sterne einer Galaxie verlieren ihre Spiralarme */
      K.splice(K.indexOf(auswahl), 1);
      auswahl = null; folgeAuswahl = false;
      beschleunige(K, sz.eps * sz.eps);
      neueEnergie();
      rahmenZustand();
      aktualisiereAuswahl();
      zeichne();
    }

    /* ===================== Rechnen ===================== */
    function rechne(modellzeit) {
      var t = 0, schleifen = 0, eps2 = sz.eps * sz.eps;
      while (t < modellzeit && schleifen < 6000) {
        var dt = Math.min(schrittweite(K, sz, tauStaub), modellzeit - t);
        var e = schritt(K, P, dt, sz);
        tauStaub = e.tauStaub;
        if (e.meldung) {
          neueEnergie();
          meldung = e.meldung;
          meldungBis = performance.now() + 3000;
          aktualisiereAuswahl();
        }
        if (P.length && schleifen % 4 === 0) {
          var gefangen = fangeStaub(P, K);
          if (gefangen) P = P.filter(function (p) { return !p.raus; });
          if (gefangen === 2) neueEnergie();
        }
        t += dt;
        schleifen++;
      }
      zeit += t;
      /* weit Entflogene entfernen */
      var sp = schwerpunkt(K), weg = false, grenze = 40 * sz.sicht;
      K = K.filter(function (k) {
        var bleibt = Math.hypot(k.x - sp.x, k.y - sp.y) < grenze;
        if (!bleibt) { weg = true; k.weg = null; }
        return bleibt;
      });
      if (P.length) P = P.filter(function (p) { return Math.abs(p.x - sp.x) + Math.abs(p.y - sp.y) < grenze; });
      if (weg) { beschleunige(K, eps2); neueEnergie(); aktualisiereAuswahl(); }
      rahmenZustand();
      K.forEach(function (k) {
        k.spur.push(inRahmen(k.x, k.y));
        if (k.spur.length > sz.spur) k.spur.shift();
      });
      if (sz.staubSpur) {
        P.forEach(function (p) {
          if (!p.spur) p.spur = [];
          p.spur.push(inRahmen(p.x, p.y));
          if (p.spur.length > sz.staubSpur) p.spur.shift();
        });
      }
    }

    var letzte = null;
    function bild(jetzt) {
      /* außerhalb des Bildschirms: nichts rechnen und zeichnen (spart Akku) */
      if (!sichtbar && !imVollbild()) { letzte = jetzt; requestAnimationFrame(bild); return; }
      if (laeuft && sz) {
        var dtReal = letzte === null ? 1 / 60 : Math.min(0.05, Math.max(0, (jetzt - letzte) / 1000));
        rechne(dtReal * ZEITFAKTOR * tempo);
      }
      letzte = jetzt;
      if (sz) {
        rahmenZustand();
        var z = kameraZiel(), dx = z.x - mitte.x, dy = z.y - mitte.y;
        var bewegt = Math.abs(dx) + Math.abs(dy) > 0.01;
        var f = folgeAuswahl ? 0.35 : 0.12;
        mitte.x += dx * f; mitte.y += dy * f;
        if (laeuft || bewegt) zeichne();
      }
      requestAnimationFrame(bild);
    }

    /* ===================== Werfen ===================== */
    /* der neue Körper als Probe (Masse und Art wie unter „Neuer Körper“) */
    function neuProbe(x, y) {
      return { x: x, y: y, vx: 0, vy: 0, m: neuArt.staub ? 0 : neuArt.m, sl: neuArt.sl, gal: neuArt.gal, kb: neuArt.kb, kR: neuArt.kR };
    }
    /* Mond: Startpunkt dicht neben einem Planeten (oder in seiner Hill-
       Sphäre) und der neue Körper viel leichter → Bahn um den Planeten,
       Abstand zwischen 1,04 (r_P + r_M) und 0,38 r_H (Kopfkommentar) */
    var FANG_PX = 45;
    function mondZiel(x, y) {
      if (neuArt.sl || neuArt.gal) return null;
      var m = neuArt.staub ? 0 : neuArt.m, eps2 = sz.eps * sz.eps, best = null, bd = Infinity;
      K.forEach(function (j) {
        if (j.sl || j.gal || j.m < 20 * m) return;
        var haupt = hauptKoerper(j, K.filter(function (q) { return q.m > 10 * j.m; }), eps2);
        if (!haupt) return;
        var rH = Math.hypot(j.x - haupt.x, j.y - haupt.y) * Math.cbrt(j.m / (3 * haupt.m));
        var d = Math.hypot(x - j.x, y - j.y);
        if (d < bd && d <= Math.max(FANG_PX / massstab, rH)) { bd = d; best = { k: j, haupt: haupt, rH: rH, d: d }; }
      });
      if (!best) return null;
      var j = best.k, rmin = 1.04 * (j.r + radius(m));
      if (rmin > 0.42 * best.rH) return { zuLeicht: j, haupt: best.haupt };
      var s = Math.min(Math.max(best.d, rmin), Math.max(rmin, 0.38 * best.rH));
      var ux = best.d > 1e-9 ? (x - j.x) / best.d : 1, uy = best.d > 1e-9 ? (y - j.y) / best.d : 0;
      return { k: j, s: s, ux: ux, uy: uy };
    }
    /* Startpunkt eines Mondes wandert mit seinem Planeten mit */
    function nachfuehren() {
      if (!ziel || !ziel.um) return;
      if (K.indexOf(ziel.um) < 0) { ziel.um = null; return; }
      ziel.x0 = ziel.um.x + ziel.ux * ziel.s;
      ziel.y0 = ziel.um.y + ziel.uy * ziel.s;
    }
    /* Bahn um den Körper, der am Startpunkt am stärksten zieht (beim Mond:
       um seinen Planeten): Kreisbahn- und Fluchtgeschwindigkeit nach dem
       Kraftgesetz des Paares */
    function zentralBahn(x, y, um) {
      var probe = neuProbe(x, y), eps2 = sz.eps * sz.eps;
      var z = um || hauptKoerper(probe, K, eps2);
      if (!z) return null;
      var dx = x - z.x, dy = y - z.y, r = Math.hypot(dx, dy);
      if (r < z.r * 1.2 || r === 0) return null;
      var d = bahnUm(probe, z, eps2);
      /* Drehsinn wie die Körper der Szenen (gegen den Uhrzeigersinn auf dem Bildschirm) */
      d.kreisV = [z.vx + d.kreis * dy / r, z.vy - d.kreis * dx / r];
      d.ex = dx / r; d.ey = dy / r;
      return d;
    }
    function wurfGeschwindigkeit() {
      var dfx = ziel.fx1 - ziel.fx0, dfy = ziel.fy1 - ziel.fy0;
      /* nur angetippt: genau auf eine Kreisbahn setzen */
      if (Math.hypot(dfx, dfy) * massstab < 6) {
        var zb = zentralBahn(ziel.x0, ziel.y0, ziel.um);
        if (zb) return zb.kreisV;
      }
      return vonAussen(ziel.x0, ziel.y0, dfx * WURF, dfy * WURF);
    }
    function vorhersage() {
      if (!ziel) return;
      nachfuehren();
      var probe = kopie(K);
      var v = wurfGeschwindigkeit();
      var neu = neuProbe(ziel.x0, ziel.y0);
      neu.vx = v[0]; neu.vy = v[1];
      if (neuArt.staub) { neu.m = 1e-6; neu.r = 0.5; neu.art = "mond"; } else setzeGroesse(neu);
      probe.push(neu);
      var ref = dreh ? probe[K.indexOf(dreh.k)] : null;
      beschleunige(probe, sz.eps * sz.eps);
      function aufnehmen() {
        if (!ref) return inRahmen(neu.x, neu.y);
        /* Rahmen der Zukunft: aus der Kopie berechnet */
        var c = schwerpunkt(probe), th = -(Math.atan2(ref.y - c.y, ref.x - c.x) - dreh.phi0);
        var dx = neu.x - c.x, dy = neu.y - c.y, co = Math.cos(th), si = Math.sin(th);
        return [dx * co - dy * si, dx * si + dy * co];
      }
      var bahn = [aufnehmen()], t = 0, i = 0;
      var horizont = Math.min(400, 6 * sz.sicht / Math.max(1, Math.hypot(v[0], v[1])) + 150);
      while (t < horizont && i < 2500) {
        var dt = schrittweite(probe, sz, Infinity);
        schritt(probe, [], dt, sz);
        if (probe.indexOf(neu) < 0) break;
        t += dt; i++;
        if (i % 3 === 0) bahn.push(aufnehmen());
      }
      ziel.bahn = bahn;
    }
    var wurfZaehler = 1;
    function werfe() {
      nachfuehren();
      var v = wurfGeschwindigkeit();
      if (neuArt.staub) {
        var z = zufallsQuelle(9973 * wurfZaehler++);
        var streu = 8 / massstab, vb = Math.hypot(v[0], v[1]);
        for (var i = 0; i < 60 && P.length < MAX_STAUB; i++) {
          var a = 2 * Math.PI * z(), r = streu * Math.sqrt(z());
          P.push({ x: ziel.x0 + r * Math.cos(a), y: ziel.y0 + r * Math.sin(a),
                   vx: v[0] + (z() - 0.5) * 0.08 * vb, vy: v[1] + (z() - 0.5) * 0.08 * vb,
                   ax: 0, ay: 0, f: 3, spur: sz.staubSpur ? [] : undefined });
        }
        tauStaub = beschleunigeStaub(P, K, sz.epsStaub * sz.epsStaub);
        return;
      }
      if (K.length >= MAX_KOERPER) {
        meldung = "Höchstens " + MAX_KOERPER + " Körper";
        meldungBis = performance.now() + 2500;
        return;
      }
      var k = neuProbe(ziel.x0, ziel.y0);
      k.vx = v[0]; k.vy = v[1];
      k.name = neuArt.sl ? "Schwarzes Loch" : (neuArt.gal ? "Galaxie" : undefined);
      K.push(neuerKoerper(k));
      if (neuArt.gal) {
        /* Sterne der Galaxie; Drehsinn wie die Bahn um den Hauptkörper
           (prograd: so entstehen die schönsten Gezeitenschweife) */
        k.rand = neuArt.rand;
        var hk = hauptKoerper(k, K, sz.eps * sz.eps), sinn = 1;
        if (hk) sinn = (k.x - hk.x) * (k.vy - hk.vy) - (k.y - hk.y) * (k.vx - hk.vx) > 0 ? -1 : 1;
        var sterne = galaxieSterne(k, Math.min(neuArt.sterne, MAX_STAUB - P.length), sinn, zufallsQuelle(7919 * wurfZaehler++));
        sterne.forEach(function (p) { p.ax = 0; p.ay = 0; if (sz.staubSpur) p.spur = []; P.push(p); });
        /* Galaxien sind riesig: so weit herauszoomen, dass die ganze Scheibe ins Bild passt */
        var halb = Math.min(breite, hoehe) / 2;
        var fk = inRahmen(k.x, k.y);
        var d = Math.max(Math.abs(fk[0] - mitte.x), Math.abs(fk[1] - mitte.y)) + 1.15 * k.rand;
        if (d * massstab > halb) { zoom = Math.max(0.12, zoom * halb / (d * massstab)); setzeMassstab(); }
      }
      var m = verschmelze(K, sz.verschmelzen, sz.eps * sz.eps);
      if (m) { meldung = m; meldungBis = performance.now() + 2500; }
      beschleunige(K, sz.eps * sz.eps);
      if (P.length) tauStaub = beschleunigeStaub(P, K, sz.epsStaub * sz.epsStaub);
      neueEnergie();
      aktualisiereAuswahl();
    }

    /* ----- Zeiger: Werfen, Auswählen, Verschieben, zwei Finger ----- */
    var zeiger = {}, modus = null, start = null, zwei = null, letzteVorhersage = 0;
    function lokal(ev) {
      var r = canvas.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top];
    }
    function anzahl() { return Object.keys(zeiger).length; }
    function treffer(p) {
      var best = null, bd = Infinity;
      K.forEach(function (k) {
        var s = zeigeWelt(k.x, k.y);
        var r = zeichenRadius(k);
        var d = Math.hypot(s[0] - p[0], s[1] - p[1]);
        if (d < Math.max(r + 6, 14) && d < bd) { bd = d; best = k; }
      });
      return best;
    }
    function verschiebe(dxPx, dyPx) {
      pan.x -= dxPx / massstab; pan.y -= dyPx / massstab;
      mitte.x -= dxPx / massstab; mitte.y -= dyPx / massstab;
    }
    canvas.addEventListener("contextmenu", function (ev) { ev.preventDefault(); });
    canvas.addEventListener("pointerdown", function (ev) {
      if (!sz) return;
      canvas.setPointerCapture(ev.pointerId);
      var p = lokal(ev);
      zeiger[ev.pointerId] = p;
      buehne.classList.add("uni-benutzt");
      if (anzahl() === 2) {
        var ids = Object.keys(zeiger), a = zeiger[ids[0]], b = zeiger[ids[1]];
        ziel = null; modus = "zwei";
        zwei = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
        zeichne();
        return;
      }
      if (anzahl() > 2) return;
      start = p;
      if (ev.button === 1 || ev.button === 2 || ev.shiftKey) { modus = "schieben"; return; }
      var t = treffer(p);
      if (t) { modus = "waehlen"; start.k = t; return; }
      modus = "wurf";
      var w = welt(p[0], p[1]), f = rahmenVon(p[0], p[1]);
      ziel = { x0: w[0], y0: w[1], fx0: f[0], fy0: f[1], fx1: f[0], fy1: f[1] };
      var mz = mondZiel(w[0], w[1]);
      if (mz && mz.zuLeicht) {
        meldung = "Um „" + name(mz.zuLeicht) + "“ kann hier kein Mond kreisen, „" + name(mz.haupt) + "“ ist zu nah";
        meldungBis = performance.now() + 3500;
      } else if (mz) {
        ziel.um = mz.k; ziel.ux = mz.ux; ziel.uy = mz.uy; ziel.s = mz.s;
      }
      vorhersage();
      zeichne();
    });
    canvas.addEventListener("pointermove", function (ev) {
      if (!zeiger[ev.pointerId]) return;
      var alt = zeiger[ev.pointerId], p = lokal(ev);
      zeiger[ev.pointerId] = p;
      if (modus === "zwei" && anzahl() === 2) {
        var ids = Object.keys(zeiger), a = zeiger[ids[0]], b = zeiger[ids[1]];
        var d = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        verschiebe(m[0] - zwei.m[0], m[1] - zwei.m[1]);
        zoomUm(d / zwei.d, m[0], m[1]);
        zwei = { d: d, m: m };
      } else if (modus === "schieben") {
        verschiebe(p[0] - alt[0], p[1] - alt[1]);
        zeichne();
      } else if (modus === "wurf" && ziel) {
        var f = rahmenVon(p[0], p[1]);
        ziel.fx1 = f[0]; ziel.fy1 = f[1];
        var jetzt = performance.now();
        if (jetzt - letzteVorhersage > 25) { vorhersage(); letzteVorhersage = jetzt; }
        zeichne();
      }
    });
    function loslassen(ev, abbruch) {
      if (!zeiger[ev.pointerId]) return;
      var p = zeiger[ev.pointerId];
      delete zeiger[ev.pointerId];
      if (modus === "zwei") { if (anzahl() === 0) modus = null; return; }
      if (!abbruch && modus === "wurf" && ziel) werfe();
      if (!abbruch && modus === "waehlen" && start && Math.hypot(p[0] - start[0], p[1] - start[1]) < 8) {
        auswahl = auswahl === start.k ? null : start.k;
        folgeAuswahl = false;
        aktualisiereAuswahl();
      }
      ziel = null; modus = null; start = null;
      zeichne();
    }
    canvas.addEventListener("pointerup", function (ev) { loslassen(ev, false); });
    canvas.addEventListener("pointercancel", function (ev) { loslassen(ev, true); });

    canvas.addEventListener("wheel", function (ev) {
      ev.preventDefault();
      var p = lokal(ev);
      zoomUm(ev.deltaY < 0 ? 1.12 : 1 / 1.12, p[0], p[1]);
    }, { passive: false });

    /* ===================== Vollbild ===================== */
    function echtesVollbild() { return (document.fullscreenElement || document.webkitFullscreenElement) === rahmen; }
    function imVollbild() { return echtesVollbild() || rahmen.classList.contains("spiel-vollbild"); }
    function ersatzVollbild(an) {
      rahmen.classList.toggle("spiel-vollbild", an);
      document.documentElement.classList.toggle("spiel-vollbild-offen", an);
      nachVollbild();
    }
    function vollbild() {
      if (echtesVollbild()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
      }
      if (rahmen.classList.contains("spiel-vollbild")) { ersatzVollbild(false); return; }
      var anfrage = rahmen.requestFullscreen || rahmen.webkitRequestFullscreen;
      if (!anfrage) { ersatzVollbild(true); return; }
      try {
        var r = anfrage.call(rahmen);
        if (r && r.catch) r.catch(function () { ersatzVollbild(true); });
      } catch (e) { ersatzVollbild(true); }
    }
    function nachVollbild() {
      var an = imVollbild();
      vollEcke.setAttribute("aria-label", an ? "Vollbild beenden" : "Vollbild");
      vollEcke.classList.toggle("an", an);
      setTimeout(messe, 60);
      try { buehne.focus({ preventScroll: true }); } catch (e) {}
    }
    vollEcke.addEventListener("click", vollbild);
    document.addEventListener("fullscreenchange", nachVollbild);
    document.addEventListener("webkitfullscreenchange", nachVollbild);

    /* ----- Tasten (wenn die Bühne den Fokus hat) ----- */
    buehne.addEventListener("keydown", function (ev) {
      if (ev.target !== buehne) return;
      if (ev.key === " ") { ev.preventDefault(); setzeLauf(!laeuft); }
      else if (ev.key === "r" || ev.key === "R") lade(sz);
      else if (ev.key === "f" || ev.key === "F") vollbild();
      else if (ev.key === "+") zoomUm(1.2);
      else if (ev.key === "-") zoomUm(1 / 1.2);
      else if (ev.key === "Delete" || ev.key === "Backspace") { ev.preventDefault(); entferneAuswahl(); }
      else if (ev.key === "Escape" && rahmen.classList.contains("spiel-vollbild")) ersatzVollbild(false);
    });

    tempoWahl.setze(TEMPI[1]);
    neuWahl.setze(NEUE[1]);
    messe();
    var anfang = (location.hash || "").slice(1);
    lade(SZENEN.filter(function (s) { return s.id === anfang; })[0] || SZENEN[0]);
    window.addEventListener("resize", messe);
    if (window.ResizeObserver) new ResizeObserver(messe).observe(leinwand);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) { sichtbar = e[e.length - 1].isIntersecting; }).observe(buehne);
    }
    requestAnimationFrame(bild);
    if (wenigBewegung()) rahmen.classList.add("spiel-ruhig");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.querySelector('[data-universum="spielplatz"]');
    if (b && window.Seite) baue(b);
  });
})();
