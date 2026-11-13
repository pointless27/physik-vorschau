/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/rechenmethoden/operatoren-krummlinig.html
   =========================================================================
   Modelle: ringstueck.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/operatoren-krummlinig.js"></script>
   Bausteine (zeichenflaeche, regler, auswahl …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      pfeil = I.pfeil,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler,
      werteLeiste = I.werteLeiste, geruest = I.geruest, auswahl = I.auswahl,
      markiere = I.markiere;

  /* =======================================================================
     MODELL: RINGSTÜCK  (rechenmethoden/operatoren-krummlinig)
     Ebene Felder in Polarkoordinaten, entweder radial F = V(ρ) ê_ρ
     („fluss“) oder kreisend F = V(ρ) ê_φ („umlauf“). Ringstück zwischen
     ρ1 … ρ2 = ρ1 + Δρ und φ 25° … 65°.
     Fluss bzw. Umlauf über die Bögen: V(ρ)·ρ·Δφ (die geraden Seiten
     tragen nichts bei, weil das Feld längs bzw. quer zu ihnen liegt).
     Fläche exakt ½(ρ2² − ρ1²)Δφ = ρm·Δρ·Δφ mit ρm = (ρ1 + ρ2)/2.
     Für alle sechs Felder ist (außen − innen)/Fläche GENAU gleich der
     Formel 1/ρ · d(ρV)/dρ an der Stelle ρm (2, 1/ρm oder 0).
     ======================================================================= */
  function ringstueck(fig) {
    var RMAX = 4, DR = 0.5, PHI1 = 25, PHI2 = 65;
    var DPHI = (PHI2 - PHI1) * Math.PI / 180;
    var FELDER = [
      { name: "Quelle ρ", art: "fluss", V: function (r) { return r; }, formel: function () { return 2; }, ftext: "1/ρ · d(ρ · ρ)/dρ = 2",
        satz: "Außen ist das Feld stärker und der Bogen länger, also fließt mehr heraus als hinein. Pro Fläche kommt überall 2 heraus, egal wo das Stück liegt – eine gleichmäßig verteilte Quelle, kartesisch das Feld (x | y)." },
      { name: "ê ρ gleich lang", art: "fluss", V: function () { return 1; }, formel: function (m) { return 1 / m; }, ftext: "1/ρ · d(ρ · 1)/dρ = 1/ρ",
        satz: "Alle Pfeile sind gleich lang, und doch fließt außen mehr heraus, weil der äußere Bogen länger ist. Die Divergenz ist 1/ρ: nahe der Achse groß, weit außen klein. Wer nur die Ableitung von F ρ nach ρ bildet, bekommt fälschlich null." },
      { name: "Linienquelle 1/ρ", art: "fluss", V: function (r) { return 1 / r; }, formel: function () { return 0; }, ftext: "1/ρ · d(ρ · 1/ρ)/dρ = 0",
        satz: "Feld mal Bogen ist innen und außen genau gleich, denn ρ · 1/ρ = 1. Was hineinfließt, fließt wieder heraus: quellenfrei an jeder Stelle. So sieht das elektrische Feld eines langen geladenen Drahts aus." },
      { name: "starre Drehung", art: "umlauf", V: function (r) { return r; }, formel: function () { return 2; }, ftext: "1/ρ · d(ρ · ρ)/dρ = 2",
        satz: "Außen strömt es schneller, und der Weg ist länger: Der Umlauf um das Stück ist nicht null. Pro Fläche kommt überall 2 heraus, also 2ω mit ω = 1 – ein kleines Schaufelrad dreht sich überall gleich schnell." },
      { name: "ê φ gleich lang", art: "umlauf", V: function () { return 1; }, formel: function (m) { return 1 / m; }, ftext: "1/ρ · d(ρ · 1)/dρ = 1/ρ",
        satz: "Die Strömung ist überall gleich schnell, aber außen ist der Weg länger. Es bleibt ein Umlauf übrig, die Rotation ist 1/ρ." },
      { name: "Wirbel 1/ρ", art: "umlauf", V: function (r) { return 1 / r; }, formel: function () { return 0; }, ftext: "1/ρ · d(ρ · 1/ρ)/dρ = 0",
        satz: "Außen strömt es langsamer, aber der Weg ist genau so viel länger: Feld mal Bogen ist innen und außen gleich, der Umlauf ist null. Wirbelfrei, obwohl alles im Kreis strömt – wie über dem Abfluss einer Badewanne." }
    ];
    var START = { feld: 1, r1: 1.5 };
    var z = { feld: START.feld, r1: START.r1 };
    var teil = geruest(fig);
    var w = null;
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Viertel der Ebene mit Feldpfeilen und einem getönten Ringstück; an seinem inneren und äußeren Bogen sind die Feldpfeile hervorgehoben",
      function (b) { return begrenze(b * 0.8, 300, 460); }, aufbau);

    function rad(g) { return g * Math.PI / 180; }
    function P(r, g) { return [w.ox + r * Math.cos(rad(g)) * w.S, w.oy - r * Math.sin(rad(g)) * w.S]; }
    function T(p) { return p[0].toFixed(1) + " " + p[1].toFixed(1); }

    function aufbau() {
      var f = flaeche, B = f.b, H = f.h;
      var S = Math.min((B - 44) / 4.2, (H - 44) / 4.2);
      w = { S: S, ox: Math.round((B - 4.2 * S) / 2) + 16, oy: H - 26 };
      zeichne();
    }

    /* Feldpfeile werden je Feld auf eine größte Länge normiert;
       Bezug ist das größte |V| im Bereich 0,75 … 4. */
    function laenge(feld, r) {
      var vref = Math.max(Math.abs(feld.V(0.75)), Math.abs(feld.V(RMAX)));
      return 0.36 * w.S * Math.min(1, Math.abs(feld.V(r)) / vref);
    }
    function richtung(feld, g) {           // Einheitsvektor im SVG (y nach unten)
      var c = Math.cos(rad(g)), sn = Math.sin(rad(g));
      return feld.art === "fluss" ? [c, -sn] : [-sn, -c];
    }
    function feldpfeil(ebene, feld, r, g, klasse, faktor) {
      var p = P(r, g), e = richtung(feld, g), l = laenge(feld, r) * (faktor || 1);
      return pfeil(ebene, p[0] - e[0] * l / 2, p[1] - e[1] * l / 2, p[0] + e[0] * l / 2, p[1] + e[1] * l / 2, klasse);
    }

    var gruppen = [
      auswahl(teil.bedienung, "nach außen", "Felder, die von der Achse weg zeigen",
        ["Quelle ρ", "ê ρ gleich lang", "Linienquelle 1/ρ"], function (i) { z.feld = i; zeichne(); }),
      auswahl(teil.bedienung, "im Kreis", "Felder, die um die Achse kreisen",
        ["starre Drehung", "ê φ gleich lang", "Wirbel 1/ρ"], function (i) { z.feld = 3 + i; zeichne(); })
    ];
    regler(teil.regler, {
      name: "Lage des Ringstücks", min: 0.5, max: RMAX - DR, schritt: 0.25, wert: START.r1,
      anzeige: function (v) { return "ρ = " + zahl(v, 2) + " … " + zahl(v + DR, 2); }
    }, function (v) { z.r1 = v; zeichne(); });
    var werte = werteLeiste(teil.bedienung, [["innen", "innen"], ["aussen", "außen"],
      ["netto", "netto"], ["formel", "Formel"]]);
    function kachel(name, titel, inhalt) {
      werte[name].previousSibling.textContent = titel;
      werte[name].textContent = inhalt;
    }

    function zeichne() {
      if (!w) return;
      var feld = FELDER[z.feld], fluss = feld.art === "fluss";
      markiere(gruppen[0], fluss ? z.feld : -1);
      markiere(gruppen[1], fluss ? -1 : z.feld - 3);
      var f = flaeche, B = f.b, H = f.h, i, j;
      f.leeren();
      var g0 = s("g", null, f.svg);

      /* Polargitter (Viertelkreise) und Achsen */
      for (i = 1; i <= RMAX; i++) {
        var a = P(i, 0), b = P(i, 90);
        s("path", { "class": "gitter", fill: "none", d: "M" + T(a) + "A" + (i * w.S).toFixed(1) + " " + (i * w.S).toFixed(1) + " 0 0 0 " + T(b) }, g0);
        txt(g0, a[0], w.oy + 15, String(i), "klein", "middle");
      }
      s("line", { "class": "achse", x1: w.ox, y1: w.oy, x2: P(RMAX + 0.15, 0)[0], y2: w.oy }, g0);
      s("line", { "class": "achse", x1: w.ox, y1: w.oy, x2: w.ox, y2: P(RMAX + 0.15, 90)[1] }, g0);
      txt(g0, P(RMAX + 0.15, 0)[0], w.oy - 6, "x", "klein", "end");
      txt(g0, w.ox + 7, P(RMAX + 0.15, 90)[1] + 8, "y", "klein");

      /* Hintergrundfeld auf einem Raster mit Abstand 0,5 */
      for (i = 0; i < 8; i++) for (j = 0; j < 8; j++) {
        var x = 0.25 + 0.5 * i, y = 0.25 + 0.5 * j, r = Math.sqrt(x * x + y * y);
        if (r < 0.5 || r > RMAX) continue;
        feldpfeil(g0, feld, r, Math.atan2(y, x) * 180 / Math.PI, "duenn");
      }

      /* Ringstück */
      var r1 = z.r1, r2 = r1 + DR, rm = (r1 + r2) / 2;
      var A = P(r1, PHI1), Bp = P(r2, PHI1), C = P(r2, PHI2), D = P(r1, PHI2);
      var d = "M" + T(A) + "L" + T(Bp) + "A" + (r2 * w.S).toFixed(1) + " " + (r2 * w.S).toFixed(1) + " 0 0 0 " + T(C) +
        "L" + T(D) + "A" + (r1 * w.S).toFixed(1) + " " + (r1 * w.S).toFixed(1) + " 0 0 1 " + T(A) + "Z";
      s("path", { "class": "flaeche", d: d }, g0);
      s("path", { "class": "kurve blau duenn", fill: "none", d: d }, g0);
      var farbe = fluss ? "kupfer" : "blau";
      [PHI1 + 8, (PHI1 + PHI2) / 2, PHI2 - 8].forEach(function (g) {
        feldpfeil(g0, feld, r1, g, farbe, 1.15);
        feldpfeil(g0, feld, r2, g, farbe, 1.15);
      });
      /* Beschriftung der Bögen außerhalb des Stücks */
      var li = P(r1 - 0.28, (PHI1 + PHI2) / 2), la = P(r2 + 0.32, (PHI1 + PHI2) / 2);
      txt(g0, li[0], li[1] + 4, "innen", "klein halo", "middle");
      if (la[0] < B - 24 && la[1] > 12) txt(g0, la[0], la[1] + 4, "außen", "klein halo", "middle");
      s("circle", { "class": "punkt", cx: w.ox, cy: w.oy, r: 3 }, g0);

      /* Zahlen: Feld · Bogenlänge */
      var bi = r1 * DPHI, ba = r2 * DPHI, qi = feld.V(r1) * bi, qa = feld.V(r2) * ba;
      var Af = 0.5 * (r2 * r2 - r1 * r1) * DPHI, quot = (qa - qi) / Af, soll = feld.formel(rm);
      kachel("innen", fluss ? "hinein, innen (Feld · Bogen)" : "innerer Bogen (Feld · Bogen)",
        zahl(feld.V(r1), 2) + " · " + zahl(bi, 3) + " = " + zahl(qi, 3));
      kachel("aussen", fluss ? "heraus, außen (Feld · Bogen)" : "äußerer Bogen (Feld · Bogen)",
        zahl(feld.V(r2), 2) + " · " + zahl(ba, 3) + " = " + zahl(qa, 3));
      kachel("netto", fluss ? "(heraus − hinein) / Fläche" : "Umlauf / Fläche",
        zahl(qa - qi, 3) + " / " + zahl(Af, 3) + " = " + zahl(quot, 3));
      kachel("formel", (fluss ? "Divergenz" : "Rotation") + " bei ρ = " + zahl(rm, 2),
        feld.ftext + (soll === 0 || soll === 2 ? "" : " = " + zahl(soll, 3)));

      teil.status.textContent = "Das Stück reicht von ρ = " + zahl(r1, 2) + " bis " + zahl(r2, 2) + " und über " + (PHI2 - PHI1) +
        "° (" + zahl(DPHI, 3) + " im Bogenmaß); seine Fläche ist " + zahl(Af, 3) + ". " + feld.satz +
        (fluss ? " Durch die geraden Seiten fließt nichts, weil das Feld längs zu ihnen zeigt."
               : " Die geraden Seiten tragen nichts bei, weil die Strömung quer zu ihnen läuft.");
    }

    aufbau();
  }

  I.modell("ringstueck", ringstueck);
})(window.Interaktiv);
