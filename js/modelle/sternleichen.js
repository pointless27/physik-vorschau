/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/astrophysik/sternleichen.html
   =========================================================================
   Modelle: sonnenpresse.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/sternleichen.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest, tausender = I.tausender, hoch10 = I.hoch10;

  /* =======================================================================
     MODELL: SONNENPRESSE – die Sonne zusammendrücken          (sternleichen)
     Masse fest 1 M☉, Radius R logarithmisch von 696 000 km bis R_s:
       ρ = M / (4/3 π R³),  g = G M / R²,  v_F = √(2 G M / R),
       R_s = 2 G M / c²,  Uhrengang an der Oberfläche √(1 − R_s/R)
     Die Fluchtgeschwindigkeit nach Newton erreicht c genau bei R_s.
     ======================================================================= */
  function sonnenpresse(fig) {
    var GK = 6.674e-11, C = 2.998e8, MS = 1.989e30, JAHR = 3.156e7;
    var RS = 2 * GK * MS / (C * C);                    // 2954 m
    var R_SONNE = 6.957e8, R_ERDE = 6.371e6, HALBMARATHON = 21098;
    var LMAX = Math.log(R_SONNE) / Math.LN10, LMIN = Math.log(RS) / Math.LN10;
    var MARKEN = [
      { r: R_SONNE, name: "Sonne heute", zeile: 0, anker: "start" },
      { r: 5.56e6, name: "Weißer Zwerg", zeile: 1, anker: "middle" },   // Masse-Radius-Beziehung (Nauenberg 1972) für 1 M☉
      { r: 1.2e4, name: "Neutronenstern", zeile: 0, anker: "end" },     // PRÜFEN: hängt von der Zustandsgleichung ab (etwa 11–13 km)
      { r: RS, name: "Schwarzes Loch", zeile: 1, anker: "end" }
    ];
    var z = { w: 0 };                                  // Regler 0 … 1000
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Eine Kugel mit der Masse der Sonne wird zusammengedrückt; oben eine Skala der Radien von der Sonne bis zum Schwarzen Loch, darunter die Kugel im Größenvergleich",
      function (b) { return begrenze(b * 0.5, 270, 320); }, zeichne);

    function radiusVon(w) { return Math.pow(10, LMAX - (LMAX - LMIN) * w / 1000); }
    function radius() { return radiusVon(z.w); }
    function kmText(r) {
      return r >= 1e4 ? tausender(r / 1000) + " km" : zahl(r / 1000, 2) + " km";
    }
    function gross(x) {                                // 28 · 1 200 · 3,8 Mio. · 94 Mrd.
      if (x < 1e4) return tausender(x);
      if (x < 1e6) return tausender(Math.round(x / 100) * 100);
      if (x < 1e9) return zahl(x / 1e6, x < 1e7 ? 1 : 0) + " Mio.";
      if (x < 1e12) return zahl(x / 1e9, x < 1e10 ? 1 : 0) + " Mrd.";
      return zahl(x / 1e12, x < 1e13 ? 1 : 0) + " Bio.";
    }
    function teeloeffel(kg) {                          // Masse von 5 cm³
      if (kg < 1) return zahl(kg * 1000, 0) + " g";
      if (kg < 1000) return zahl(kg, kg < 10 ? 1 : 0) + " kg";
      var t = kg / 1000;
      return (t < 1e4 ? zahl(t, t < 10 ? 1 : 0) : gross(t)) + " t";
    }
    function uhrText(r) {
      if (r <= RS * 1.0001) return "stehen still";
      var f = 1 - Math.sqrt(1 - RS / r);
      if (f >= 0.01) return zahl(f * 100, 0) + " %";
      var sek = f * JAHR;
      if (sek < 120) return zahl(sek, 0) + " s pro Jahr";
      if (sek < 7200) return zahl(sek / 60, 0) + " min pro Jahr";
      if (sek < 2 * 86400) return zahl(sek / 3600, 1) + " h pro Jahr";
      return zahl(sek / 86400, 1) + " Tage pro Jahr";
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, R = radius();
      f.leeren();
      /* Skala: 10⁹ m (links) bis 10³ m (rechts), also 1 Mio. km bis 1 km */
      var xl = 22, xr = B - 22, yS = 62;
      function xVon(r) { return xl + (9 - Math.log(r) / Math.LN10) / 6 * (xr - xl); }
      s("line", { "class": "achse", x1: xl, y1: yS, x2: xr, y2: yS }, f.svg);
      for (var e = 9; e >= 3; e--) {
        var xe = xVon(Math.pow(10, e));
        s("line", { "class": "achse", x1: xe, y1: yS - 4, x2: xe, y2: yS + 4 }, f.svg);
        if (e === 3) txt(f.svg, xe, yS + 18, "1", "klein", "middle");
        else hoch10(f.svg, xe, yS + 18, e - 3, "klein", "middle");
      }
      txt(f.svg, xr, yS + 32, "Radius in km", "klein", "end");
      s("line", { "class": "kurve blau", x1: xVon(R_SONNE), y1: yS, x2: xVon(R), y2: yS }, f.svg);
      MARKEN.forEach(function (m) {
        var xm = xVon(m.r), yT = m.zeile === 0 ? 16 : 32;
        s("line", { "class": "hilfslinie", x1: xm, y1: yT + 4, x2: xm, y2: yS }, f.svg);
        var xT = m.anker === "start" ? xm - 4 : m.anker === "end" ? xm + 4 : xm;
        txt(f.svg, xT, yT, m.name, "klein halo", m.anker);
      });
      s("circle", { "class": "punkt kupfer", cx: xVon(R), cy: yS, r: 5.5 }, f.svg);

      /* Größenvergleich: das größere der beiden Objekte füllt rmax */
      var oben = yS + 42, cy = oben + (H - oben) / 2 - 4, rmax = (H - oben) / 2 - 12;
      var cx = B / 2, rv, k;
      if (R >= 7e7) {                                   // Sonne heute als Umriss um die Kugel
        k = rmax / R_SONNE;
        s("circle", { "class": "hilfslinie", cx: cx, cy: cy, r: rmax }, f.svg);
        txt(f.svg, cx + rmax * 0.72 + 6, cy - rmax * 0.72, "Sonne heute", "klein", "start");
      } else if (R >= 7e5) {                            // Erde daneben, beide nebeneinander mittig
        rmax = Math.min(rmax, (B - 60) / 4);
        k = rmax / Math.max(R, R_ERDE);
        var rO = Math.max(R * k, 2), rk = Math.max(R_ERDE * k, 2), luecke = 28;
        var start = B / 2 - (2 * rO + luecke + 2 * rk) / 2;
        cx = start + rO;
        var cxv = start + 2 * rO + luecke + rk;
        s("circle", { "class": "kurve kupfer duenn", cx: cxv, cy: cy, r: rk, fill: "none" }, f.svg);
        txt(f.svg, cxv, cy + rk + 15, "Erde", "klein kupfer", "middle");
      } else {                                          // Halbmarathon als Strecke darunter
        rv = HALBMARATHON;
        k = rmax / Math.max(R, rv);
        var lb = rv * k, yb = cy + rmax + 4;
        s("line", { "class": "kurve kupfer", x1: cx - lb / 2, y1: yb, x2: cx + lb / 2, y2: yb }, f.svg);
        txt(f.svg, cx, yb - 6, "Halbmarathon, 21 km", "klein kupfer halo", "middle");
      }
      var rObj = Math.max(R * k, 1.5);
      if (R <= RS * 1.0001) {
        s("circle", { "class": "loch", cx: cx, cy: cy, r: rObj }, f.svg);
      } else {
        s("circle", { "class": R >= 7e7 ? "ball" : "ball blau", cx: cx, cy: cy, r: rObj }, f.svg);
      }
    }

    var reg = regler(teil.regler, {
      name: "Radius der Kugel (Masse = 1 Sonnenmasse)", min: 0, max: 1000, schritt: 1, wert: 0,
      anzeige: function (w) { return kmText(radiusVon(w)); }
    }, function (w) { z.w = w; zeichne(); });
    var los = knopf(teil.knoepfe, "", "haupt");
    abspieler({
      knopf: los, text: "▶ Zusammendrücken", faktor: 110,
      hole: function () { return z.w; },
      setze: function (w) { z.w = w; reg.setze(Math.round(w)); zeichne(); },
      ende: function () { return 1000; }
    });
    knopf(teil.knoepfe, "Zurück zur Sonne", null, function () { z.w = 0; reg.setze(0); zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["loeffel", "Ein Teelöffel wiegt"], ["g", "Schwerkraft (Erde = 1)"],
      ["v", "Fluchtgeschwindigkeit"], ["uhr", "Uhren gehen langsamer um"]
    ]);

    function zeichne() {
      var R = radius();
      zeichneBuehne();
      var rho = MS / (4 / 3 * Math.PI * R * R * R);
      var g = GK * MS / (R * R) / G;
      var v = Math.min(Math.sqrt(2 * GK * MS / R), C);
      werte.loeffel.textContent = teeloeffel(rho * 5e-6);
      werte.g.textContent = gross(g);
      werte.v.textContent = v > 0.01 * C ? zahl(v / C * 100, v > 0.995 * C ? 0 : 1) + " % von c"
                                          : tausender(v / 1000) + " km/s";
      werte.uhr.textContent = uhrText(R);
      var satz;
      if (R >= 4e8) {
        satz = "Ein ganz normaler Stern wie die Sonne: Der Druck des heißen Gases trägt das Gewicht, die Kernfusion hält das Gas heiß. Drück die Sonne zusammen!";
      } else if (R >= 7e7) {
        satz = "Deutlich kleiner als die Sonne: Halten könnte sich die Kugel so nur, wenn ihr Gas viel heißer würde. Ohne Fusion schrumpft sie weiter.";
      } else if (R >= 1.2e7) {
        satz = "Schon kleiner als Jupiter. Ohne Kernfusion würde die Kugel immer weiter schrumpfen – bis sich die Elektronen gegenseitig im Weg stehen.";
      } else if (R >= 3e6) {
        satz = "So groß wie die Erde: ein Weißer Zwerg. Eine Sonnenmasse hat dann etwa 5600 km Radius, und das Gedränge der Elektronen hält sie. Ein Teelöffel ihrer Materie wiegt Tonnen.";
      } else if (R >= 3e4) {
        satz = "Diese Größe hat keine bekannte Sternleiche. Wird ein Sternkern schwerer als etwa 1,4 Sonnenmassen, hält der Elektronendruck nicht mehr, und er stürzt in Sekundenbruchteilen gleich auf die Größe eines Neutronensterns zusammen.";
      } else if (R >= 8e3) {
        satz = "Ein Neutronenstern: Elektronen und Protonen sind zu Neutronen verschmolzen, der ganze Stern ist so dicht wie ein Atomkern – nur etwa 20 km im Durchmesser.";
      } else if (R > RS * 1.0001) {
        satz = "Hier hält auch die Kernmaterie nicht mehr: Kein Druck kann den Kollaps aufhalten. Die Fluchtgeschwindigkeit liegt schon bei " +
          zahl(v / C * 100, 0) + " % der Lichtgeschwindigkeit.";
      } else {
        satz = "Ein Schwarzes Loch: Bei 2,95 km Radius erreicht die Fluchtgeschwindigkeit die Lichtgeschwindigkeit. Nichts, auch kein Licht, kommt mehr heraus – diese Grenze heißt Ereignishorizont.";
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  I.modell("sonnenpresse", sonnenpresse);
})(window.Interaktiv);
