/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/thermodynamik/ising.html
   =========================================================================
   Modelle: isinggitter.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/ising.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      regler = I.regler, knopf = I.knopf, werteLeiste = I.werteLeiste,
      geruest = I.geruest, auswahl = I.auswahl, markiere = I.markiere,
      tausender = I.tausender;

  /* =======================================================================
     MODELL: ISINGGITTER  (thermodynamik/ising)
     Metropolis-Simulation des zweidimensionalen Ising-Modells
       H = −J Σ_<ij> s_i s_j,  s_i = ±1,  J = k_B = 1,
     auf einem L × L-Gitter mit periodischen Rändern. Ein Sweep = L² Versuche
     an zufällig gewählten Plätzen; Annahme mit min(1, e^(−ΔE/T)),
     ΔE = 2 s_k Σ_Nachbarn s_i ∈ {−8, −4, 0, 4, 8} (Tabelle wie auf der
     Seite). Links das Gitter (orange = +1, blau = −1), rechts bzw. darunter
     m über den letzten Sweeps. Bewegung nur auf Knopfdruck; bei
     prefers-reduced-motion rechnet „Simulieren“ 200 Sweeps auf einmal.
     ======================================================================= */
  function isinggitter(fig) {
    var L = 48, N = L * L, TC = 2 / Math.log(1 + Math.SQRT2);
    var SPUR = 300;                                   // so viele Sweeps zeigt das m-Diagramm
    var FAELLE = [["kalt (1,5)", 1.5], ["kritisch (2,27)", 2.27], ["heiß (3,5)", 3.5]];
    var z = { T: 2.27, sweeps: 0, versuche: 0, angenommen: 0 };
    var spin = new Int8Array(N), spur = [];
    var laeuft = false;
    var teil = geruest(fig);
    var w = null;

    /* ---------- Physik ---------- */
    function neu(geordnet) {
      for (var i = 0; i < N; i++) spin[i] = geordnet ? 1 : (Math.random() < 0.5 ? 1 : -1);
      z.sweeps = 0; z.versuche = 0; z.angenommen = 0;
      spur = [magnetisierung()];
    }
    function magnetisierung() {
      var M = 0;
      for (var i = 0; i < N; i++) M += spin[i];
      return M / N;
    }
    function sweep() {
      var p4 = Math.exp(-4 / z.T), p8 = Math.exp(-8 / z.T), n, k, x, y, summe, dE, an = 0;
      for (n = 0; n < N; n++) {
        k = (Math.random() * N) | 0;
        x = k % L; y = (k - x) / L;
        summe = spin[y * L + (x + 1) % L] + spin[y * L + (x + L - 1) % L] +
                spin[((y + 1) % L) * L + x] + spin[((y + L - 1) % L) * L + x];
        dE = 2 * spin[k] * summe;
        if (dE <= 0 || Math.random() < (dE === 4 ? p4 : p8)) { spin[k] = -spin[k]; an++; }
      }
      z.sweeps++; z.versuche += N; z.angenommen += an;
      spur.push(magnetisierung());
      if (spur.length > SPUR + 1) spur.shift();
    }

    /* ---------- Zeichnen ---------- */
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Gitter aus 48 mal 48 Spins einer Metropolis-Simulation des Ising-Modells, orange Spin oben, blau Spin unten, daneben die Magnetisierung über den letzten Sweeps",
      function (b) { var m = mass(b); return m.H; }, aufbau);

    function mass(b) {
      var breit = b >= 560;
      var zelle = breit ? begrenze(Math.floor(b * 0.5 / L), 4, 7) : begrenze(Math.floor(b / L), 3, 7);
      var seite = zelle * L;
      if (breit) return { breit: true, zelle: zelle, seite: seite, gx: 0, gy: 4, dx: seite + 28, dy: 4, dB: b - seite - 28, dH: seite, H: seite + 8 };
      return { breit: false, zelle: zelle, seite: seite, gx: Math.round((b - seite) / 2), gy: 4, dx: 0, dy: seite + 22, dB: b, dH: 150, H: seite + 22 + 150 + 4 };
    }
    function aufbau() { w = mass(flaeche.b); zeichne(); }

    function zeichne() {
      if (!w) return;
      var f = flaeche, i, x, y, d = [];
      markiere(knoepfe, FAELLE.map(function (q) { return q[1]; }).indexOf(Math.round(z.T * 100) / 100));
      f.leeren();
      var g = s("g", null, f.svg), c = w.zelle;
      /* Gitter: orange Grund, blaue Läufe je Zeile */
      s("rect", { "class": "punkt kupfer", x: w.gx, y: w.gy, width: w.seite, height: w.seite, "fill-opacity": 0.75 }, g);
      for (y = 0; y < L; y++) {
        x = 0;
        while (x < L) {
          if (spin[y * L + x] < 0) {
            var x0 = x;
            while (x < L && spin[y * L + x] < 0) x++;
            d.push("M" + (w.gx + x0 * c) + " " + (w.gy + y * c) + "h" + (x - x0) * c + "v" + c + "h" + (-(x - x0) * c) + "z");
          } else x++;
        }
      }
      if (d.length) s("path", { "class": "punkt blau", d: d.join(""), "fill-opacity": 0.85, "shape-rendering": "crispEdges" }, g);
      s("rect", { "class": "achse", x: w.gx, y: w.gy, width: w.seite, height: w.seite, fill: "none" }, g);

      /* Verlauf von m über die letzten Sweeps */
      var l = w.dx + 34, r = w.dx + w.dB - 10, o = w.dy + 24, u = w.dy + w.dH - 22;
      var X = function (n) { return l + n / SPUR * (r - l); };
      var Y = function (m) { return o + (1 - m) / 2 * (u - o); };
      s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: u }, g);
      s("line", { "class": "achse", x1: l, y1: u, x2: r, y2: u }, g);
      s("line", { "class": "hilfslinie", x1: l, y1: Y(0), x2: r, y2: Y(0) }, g);
      [1, 0, -1].forEach(function (m) {
        s("line", { "class": "achse", x1: l - 3, y1: Y(m), x2: l, y2: Y(m) }, g);
        txt(g, l - 6, Y(m) + 4, zahl(m, 0), "klein", "end");
      });
      txt(g, l + 8, o - 12, "m", "klein");
      txt(g, r, u + 15, "letzte " + SPUR + " Sweeps", "klein", "end");
      if (spur.length > 1) {
        var pts = [], start = SPUR - (spur.length - 1);
        for (i = 0; i < spur.length; i++) pts.push([X(start + i), Y(spur[i])]);
        s("polyline", { "class": "kurve blau duenn", points: linienzug(pts) }, g);
      }
      werteAnzeigen();
    }

    /* ---------- Bedienung ---------- */
    var knoepfe = auswahl(teil.bedienung, "Temperatur", "Typische Temperaturen in Einheiten von J/kB",
      FAELLE.map(function (q) { return q[0]; }),
      function (i) { z.T = FAELLE[i][1]; rg.setze(z.T); zeichne(); });
    var rg = regler(teil.regler, {
      name: "Temperatur kB T / J", min: 0.5, max: 5, schritt: 0.01, wert: z.T,
      anzeige: function (v) { return zahl(v, 2); }
    }, function (v) { z.T = v; zeichne(); });
    var start = knopf(teil.knoepfe, "▶ Simulieren", "haupt", function () { if (laeuft) halt(); else los(); });
    knopf(teil.knoepfe, "Neu: geordnet", null, function () { neu(true); zeichne(); });
    knopf(teil.knoepfe, "Neu: zufällig", null, function () { neu(false); zeichne(); });
    var werte = werteLeiste(teil.bedienung, [["m", "Magnetisierung m"], ["sw", "Sweeps"], ["an", "Annahmequote"]]);

    function werteAnzeigen() {
      werte.m.textContent = zahl(spur[spur.length - 1], 2);
      werte.sw.textContent = tausender(z.sweeps);
      werte.an.textContent = z.versuche ? zahl(100 * z.angenommen / z.versuche, 1) + " %" : "–";
      var T = z.T, txtT;
      if (T < TC - 0.15) txtT = "Unterhalb von Tc ≈ 2,27: Große Bereiche gleicher Spins wachsen zusammen, |m| wird groß. Aus einem zufälligen Start bleiben oft lange Streifen stehen.";
      else if (T <= TC + 0.15) txtT = "Nahe Tc ≈ 2,27: Inseln aller Größen, m schwankt stark und nur langsam (kritisches Verlangsamen).";
      else txtT = "Oberhalb von Tc ≈ 2,27: nur kleine Inseln, m schwankt schnell um null.";
      teil.status.textContent = txtT;
    }

    function halt() { laeuft = false; start.textContent = "▶ Simulieren"; }
    function los() {
      if (I.wenigBewegung) {                          // ohne Animation: gleich 200 Sweeps
        for (var n = 0; n < 200; n++) sweep();
        zeichne();
        return;
      }
      laeuft = true; start.textContent = "❚❚ Anhalten";
      requestAnimationFrame(schritt);
    }
    function schritt() {
      if (!laeuft) return;
      if (fig.offsetParent === null) { halt(); return; }   // Reiter gewechselt
      sweep();
      zeichne();
      requestAnimationFrame(schritt);
    }

    /* Startbild: zufällig, dann 150 Sweeps bei Tc (ohne Bewegung vorab gerechnet) */
    neu(false);
    for (var n0 = 0; n0 < 150; n0++) sweep();
    aufbau();
  }

  I.modell("isinggitter", isinggitter);
})(window.Interaktiv);
