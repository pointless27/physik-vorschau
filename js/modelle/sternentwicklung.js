/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/astrophysik/sternentwicklung.html
   =========================================================================
   Modelle: hrspur.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/sternentwicklung.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var s = I.s, h = I.h, zahl = I.zahl, begrenze = I.begrenze, txt = I.txt,
      linienzug = I.linienzug, zeichenflaeche = I.zeichenflaeche,
      werteLeiste = I.werteLeiste, geruest = I.geruest,
      tausender = I.tausender, auswahl = I.auswahl, markiere = I.markiere,
      hoch10 = I.hoch10;

  /* =======================================================================
     MODELL: HR-SPUR – Lebenswege im Hertzsprung-Russell-Diagramm
     (sternentwicklung)
     Statisches Bild, keine Animation (Wunsch des Betreibers 2026-11-12):
     Man wählt einen von fünf Sternen, die je einen Massenbereich vertreten,
     und sieht dessen ganzen Weg mit nummerierten Phasen. Darunter steht die
     Liste der Phasen mit Dauer und Erklärung.
     Gestaltung nach dem Vorbild klassischer HR-Poster: dunkle Tafel,
     farbige Bereiche (Hauptreihe, Riesen, Überriesen, Weiße Zwerge),
     Farbleiste der Spektralklassen. Alle Farben kommen aus den
     --hr-…-Variablen in Abschnitt 1 von css/stil.css.
     Spuren: schematisch nach veröffentlichten Entwicklungsrechnungen
     (Sonnen-Metallizität), Stützstellen [T_eff in K, L in L☉], zwischen
     den Stützstellen als Catmull-Rom-Kurve geglättet.
     PRÜFEN: Stützstellen und Phasendauern mit Entwicklungsgittern
     (z. B. MIST/PARSEC) abgleichen; Werte auf etwa 0,1 dex gerundet.
     PRÜFEN: Eta Carinae (Masse, Leuchtkraft, heutige Temperatur) ist sehr
     unsicher, der Stern ist ein Doppelstern in einem Staubnebel.
     ======================================================================= */
  var T_SONNE = 5772;
  var HR_STERNE = [
    {
      name: "Proxima Centauri", kurzname: "Proxima Cen", masse: 0.12, typ: "M5,5 V",
      leben: "rund 4 Billionen Jahre", ende: "Weißer Zwerg aus Helium", heute: [3040, 0.0017],
      kurz: "Ein Roter Zwerg und unser nächster Nachbarstern (4,2 Lichtjahre). Er ist vollständig konvektiv und verbrennt seinen Wasserstoff so sparsam, dass er das heutige Weltalter um mehr als das Hundertfache überdauern wird.",
      phasen: [
        { name: "Protostern auf der Hayashi-Linie", dauer: "einige 100 Mio. Jahre",
          text: "Die vollständig konvektive Gaskugel schrumpft bei fast gleicher Oberflächentemperatur. Ihre Leuchtkraft sinkt, weil die Oberfläche kleiner wird.",
          p: [[3000, 0.1], [3000, 0.01], [3030, 0.003], [3040, 0.0017]] },
        { name: "Hauptreihe", dauer: "rund 4 Billionen Jahre",
          text: "Wasserstoff fusioniert im Kern zu Helium. Weil der ganze Stern durchmischt wird, verbrennt er fast seinen gesamten Vorrat. Gegen Ende wird er heißer und heller.",
          p: [[3040, 0.0017], [3100, 0.002], [3600, 0.006], [5000, 0.02]] },
        { name: "Wasserstoff aufgebraucht", dauer: "einige 100 Mrd. Jahre",
          text: "Ohne Schalenbrennen gibt es keinen Riesenast: Der Stern zieht sich zusammen, wird noch heißer, und die Fusion erlischt.",
          p: [[5000, 0.02], [8000, 0.01], [12000, 0.002]] },
        { name: "Weißer Zwerg kühlt aus", dauer: "Billionen Jahre",
          text: "Ein Weißer Zwerg aus Helium strahlt seine gespeicherte Wärme ab und wird immer dunkler und röter. Kein Roter Zwerg hat dieses Stadium bisher erreicht.",
          p: [[12000, 0.002], [6000, 1.3e-4], [4000, 2.5e-5]] }
      ]
    },
    {
      name: "Sonne", kurzname: "Sonne", masse: 1.0, typ: "G2 V",
      leben: "rund 12 Mrd. Jahre", ende: "Weißer Zwerg (etwa 0,55 M☉) mit planetarischem Nebel", heute: [5772, 1],
      kurz: "Ein ganz durchschnittlicher Stern. Mit 4,57 Milliarden Jahren hat die Sonne knapp die Hälfte ihrer Zeit auf der Hauptreihe hinter sich.",
      phasen: [
        { name: "Protostern auf der Hayashi-Linie", dauer: "rund 10 Mio. Jahre",
          text: "Die junge Sonne ist groß, kühl und vollständig konvektiv. Sie schrumpft und bezieht ihre Energie noch aus der Kontraktion, nicht aus Fusion.",
          p: [[4400, 10], [4300, 1], [4350, 0.5]] },
        { name: "Henyey-Linie", dauer: "rund 30 Mio. Jahre",
          text: "Im Inneren übernimmt die Strahlung den Energietransport. Die Oberfläche wird heißer, bis im Kern das Wasserstoffbrennen zündet.",
          p: [[4350, 0.5], [5000, 0.55], [5600, 0.7]] },
        { name: "Hauptreihe", dauer: "rund 10 Mrd. Jahre",
          text: "Ruhiges Wasserstoffbrennen über die pp-Kette. Weil sich im Kern Helium ansammelt, wird die Sonne langsam heller: Am Anfang leuchtete sie etwa 30 % schwächer als heute.",
          p: [[5600, 0.7], [5772, 1.0], [5800, 1.4], [5750, 2.0]] },
        { name: "Unterriese", dauer: "rund 700 Mio. Jahre",
          text: "Der Heliumkern brennt nicht, Wasserstoff fusioniert in einer Schale darum. Der Kern schrumpft, die Hülle dehnt sich aus und kühlt ab.",
          p: [[5750, 2.0], [5000, 2.5], [4700, 4]] },
        { name: "Roter Riese", dauer: "rund 600 Mio. Jahre",
          text: "Die Hülle bläht sich auf über 150 Sonnenradien auf. Der entartete Heliumkern heizt sich auf, bis an der Spitze das Helium schlagartig zündet: der Helium-Flash.",
          p: [[4700, 4], [4200, 30], [3500, 400], [3100, 2500]] },
        { name: "Heliumbrennen im Kern", dauer: "rund 100 Mio. Jahre", sprung: true,
          text: "Nach dem Flash (gestrichelt) springt der Stern in einen kleineren, heißeren Zustand und brennt Helium ruhig zu Kohlenstoff und Sauerstoff.",
          p: [[3100, 2500], [4700, 50], [4800, 45]] },
        { name: "Asymptotischer Riesenast (AGB)", dauer: "rund 20 Mio. Jahre",
          text: "Helium und Wasserstoff brennen in zwei Schalen um einen Kern aus Kohlenstoff und Sauerstoff. Der Stern wird noch größer, pulsiert und verliert durch Sternwind einen Großteil seiner Hülle.",
          p: [[4800, 45], [3800, 300], [3200, 3000], [3000, 6000]] },
        { name: "Planetarischer Nebel", dauer: "rund 10 000 Jahre",
          text: "Der freigelegte heiße Kern wandert bei fast gleicher Leuchtkraft quer durch das Diagramm und bringt die abgestoßene Hülle zum Leuchten.",
          p: [[3000, 6000], [10000, 6000], [30000, 5800], [100000, 5000], [120000, 500]] },
        { name: "Weißer Zwerg kühlt aus", dauer: "Milliarden Jahre",
          text: "Ohne Fusion bleibt nur die gespeicherte Wärme. Der erdgroße Rest kühlt bei gleichbleibendem Radius aus und wird immer schwächer.",
          p: [[120000, 500], [100000, 15], [25000, 0.05], [10000, 1.3e-3], [5000, 8e-5]] }
      ]
    },
    {
      name: "Sirius A", kurzname: "Sirius A", masse: 2.0, typ: "A1 V",
      leben: "rund 1,4 Mrd. Jahre", ende: "Weißer Zwerg (etwa 0,6 M☉) mit planetarischem Nebel", heute: [9940, 25],
      kurz: "Der hellste Stern am Nachthimmel, erst rund 240 Millionen Jahre alt. Sein Begleiter Sirius B ist schon ein Weißer Zwerg – er war ursprünglich der schwerere der beiden und hat sich deshalb schneller entwickelt.",
      phasen: [
        { name: "Protostern auf der Hayashi-Linie", dauer: "rund 2 Mio. Jahre",
          text: "Kurze, fast senkrechte Kontraktion des vollständig konvektiven Protosterns.",
          p: [[4600, 20], [4500, 8]] },
        { name: "Henyey-Linie", dauer: "rund 10 Mio. Jahre",
          text: "Das Innere wird strahlend, die Oberfläche heizt sich auf fast 10 000 K auf. Bei zwei Sonnenmassen ist dieser waagerechte Weg viel länger als bei der Sonne.",
          p: [[4500, 8], [6500, 12], [9000, 16]] },
        { name: "Hauptreihe", dauer: "rund 1,1 Mrd. Jahre",
          text: "Wasserstoffbrennen über den CNO-Zyklus in einem konvektiven Kern – zehnmal kürzer als bei der Sonne, obwohl der Stern nur doppelt so schwer ist.",
          p: [[9000, 16], [9940, 25], [9000, 35], [7500, 40]] },
        { name: "Hertzsprung-Lücke", dauer: "rund 15 Mio. Jahre",
          text: "Der Kern schrumpft rasch, die Hülle dehnt sich aus. Die Überquerung ist so schnell, dass man in diesem Bereich kaum Sterne findet.",
          p: [[7500, 40], [5500, 35], [4800, 40]] },
        { name: "Roter Riese", dauer: "rund 30 Mio. Jahre",
          text: "Wasserstoff-Schalenbrennen treibt den Stern den Riesenast hinauf. Mit gut zwei Sonnenmassen liegt Sirius A an der Grenze, oberhalb derer Helium ohne Flash zündet.",
          p: [[4800, 40], [4300, 150], [3900, 700]] },
        { name: "Heliumbrennen im Kern", dauer: "rund 200 Mio. Jahre",
          text: "Ruhiges Heliumbrennen zu Kohlenstoff und Sauerstoff bei mittlerer Leuchtkraft.",
          p: [[3900, 700], [5000, 80], [5100, 90]] },
        { name: "Asymptotischer Riesenast (AGB)", dauer: "rund 30 Mio. Jahre",
          text: "Zwei Brennschalen, thermische Pulse und starker Sternwind: Der größte Teil der Masse geht verloren.",
          p: [[5100, 90], [4000, 600], [3300, 6000], [3200, 10000]] },
        { name: "Planetarischer Nebel", dauer: "einige 1000 Jahre",
          text: "Der heiße Kern legt sich frei und bringt die abgestoßene Hülle zum Leuchten.",
          p: [[3200, 10000], [30000, 10000], [120000, 8000], [150000, 800]] },
        { name: "Weißer Zwerg kühlt aus", dauer: "Milliarden Jahre",
          text: "Ein Kohlenstoff-Sauerstoff-Zwerg von gut einer halben Sonnenmasse kühlt langsam aus – so wie es Sirius B heute schon tut.",
          p: [[150000, 800], [100000, 15], [25000, 0.05], [10000, 1.3e-3], [5000, 8e-5]] }
      ]
    },
    {
      name: "Beteigeuze", kurzname: "Beteigeuze", masse: 18, typ: "M1–M2 Ia",
      leben: "rund 10 Mio. Jahre", ende: "Supernova (Typ II) und Neutronenstern", heute: [3600, 1.2e5],
      // PRÜFEN: Entfernung (500–700 Lichtjahre) und Zeitpunkt der Supernova sind unsicher.
      kurz: "Der rote Schulterstern des Orion, etwa 550 Lichtjahre entfernt. Als Roter Überriese ist er fast 900 Sonnenradien groß und wird vermutlich innerhalb der nächsten 100 000 Jahre als Supernova explodieren.",
      phasen: [
        { name: "Hauptreihe", dauer: "rund 8 Mio. Jahre",
          text: "Ein so schwerer Stern erreicht die Hauptreihe schon, während er noch Gas aufsammelt. Er verbrennt Wasserstoff über den CNO-Zyklus bei rund 30 000 K.",
          p: [[33000, 4e4], [30000, 6e4], [25000, 1e5]] },
        { name: "Hertzsprung-Lücke", dauer: "rund 10 000 Jahre",
          text: "Das Kernbrennen erlischt, die Hülle dehnt sich auf etwa das Fünfzigfache aus. Die Leuchtkraft bleibt fast gleich: Der Stern wandert waagerecht nach rechts.",
          p: [[25000, 1e5], [12000, 1.1e5], [6000, 1.2e5], [3600, 1.2e5]] },
        { name: "Roter Überriese: Heliumbrennen", dauer: "rund 1 Mio. Jahre",
          text: "Im Kern brennt Helium zu Kohlenstoff und Sauerstoff. In dieser Phase sehen wir Beteigeuze heute.",
          p: [[3600, 1.2e5], [3500, 1.3e5]] },
        { name: "Späte Brennphasen", dauer: "wenige 1000 Jahre",
          text: "Kohlenstoff, Neon, Sauerstoff und Silizium brennen nacheinander, das Silizium nur noch etwa einen Tag. Außen ändert sich kaum etwas.",
          p: [[3500, 1.3e5], [3450, 1.4e5]] },
        { name: "Kernkollaps-Supernova", dauer: "Sekundenbruchteile",
          text: "Der Eisenkern kollabiert zum Neutronenstern, die Hülle wird abgesprengt. Für Wochen leuchtet die Supernova so hell wie Milliarden Sonnen.",
          p: [[3450, 1.4e5]] }
      ]
    },
    {
      name: "Eta Carinae", kurzname: "Eta Carinae", masse: 100, typ: "LBV, veränderlich",
      leben: "rund 3 Mio. Jahre", ende: "Schwarzes Loch, vielleicht mit Supernova (Typ Ib/c)", heute: [22000, 4.6e6],
      kurz: "Einer der schwersten Sterne der Milchstraße, etwa 7500 Lichtjahre entfernt. Beim „Großen Ausbruch“ um 1843 schleuderte er über zehn Sonnenmassen Gas ab und war zeitweise der zweithellste Stern am Himmel.",
      phasen: [
        { name: "Hauptreihe", dauer: "rund 2,5 Mio. Jahre",
          text: "So nah an der Eddington-Grenze treibt der Strahlungsdruck schon auf der Hauptreihe starke Winde: Der Stern verliert laufend Masse.",
          p: [[50000, 1.5e6], [45000, 2.2e6], [38000, 3e6]] },
        { name: "Leuchtkräftiger Blauer Veränderlicher (LBV)", dauer: "einige 10 000 Jahre",
          text: "Der Stern wird instabil und stößt in heftigen Ausbrüchen ganze Schichten ab; seine Temperatur springt hin und her. Ein Roter Überriese wird er nie. In dieser Phase ist Eta Carinae heute.",
          p: [[38000, 3e6], [25000, 4.2e6], [14000, 5.2e6], [22000, 4.6e6], [9000, 5.6e6], [18000, 4.7e6]] },
        { name: "Wolf-Rayet-Stern", dauer: "einige 100 000 Jahre",
          text: "Die Wasserstoffhülle ist fort, die heißen Brennzonen liegen frei. Starke Winde tragen nacheinander die Asche des Wasserstoff- und des Heliumbrennens ab.",
          p: [[18000, 4.7e6], [40000, 2.4e6], [80000, 1.2e6], [140000, 7e5]] },
        { name: "Kernkollaps", dauer: "Sekunden",
          text: "Der Kern kollabiert. Bei so schweren Sternen entsteht vermutlich ein Schwarzes Loch – mit einer Supernova vom Typ Ib/c oder fast ohne Lichtblitz.",
          p: [[140000, 7e5]] }
      ]
    }
  ];

  /* Bekannte Sterne als Orientierung (heutige Lage). PRÜFEN: Literaturwerte, gerundet */
  var HR_BEKANNT = [
    ["Rigel", 12100, 1.2e5], ["Canopus", 7400, 1.07e4],
    ["Arktur", 4290, 170], ["Aldebaran", 3900, 440], ["Spica", 25300, 2e4],
    ["Sirius B", 25000, 0.026], ["Procyon B", 7740, 5e-4]
  ];
  /* Massen entlang der Nullalter-Hauptreihe. PRÜFEN: gerundet */
  var HR_MASSEN = [[0.1, 2900, 1.2e-3], [1, 5800, 1], [3, 12500, 90], [10, 25000, 6000], [60, 45000, 4e5]];
  /* Nullalter-Hauptreihe (gerundet; PRÜFEN) */
  var HR_ZAMS = [[2800, 1e-3], [3200, 5e-3], [3700, 0.03], [4500, 0.15], [5300, 0.5], [5800, 1], [6500, 2.5],
    [7500, 7], [9000, 20], [12000, 100], [17000, 800], [25000, 8000], [35000, 60000], [45000, 400000], [52000, 1.2e6]];

  function masseText(m) { return zahl(m, m < 1 ? 2 : m < 10 ? 1 : 0) + " M☉"; }
  function spektralKlasse(T) {
    return T >= 30000 ? "o" : T >= 10000 ? "b" : T >= 7500 ? "a" : T >= 6000 ? "f" : T >= 5200 ? "g" : T >= 3700 ? "k" : "m";
  }
  /* Glatte Kurve durch Punkte (Catmull-Rom als kubische Bézierkurven).
     Liefert den Pfad und die Steuerpunkte jedes Abschnitts. */
  function glatt(pts) {
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1), teile = [], i;
    for (i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      var c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += "C" + c1[0].toFixed(1) + " " + c1[1].toFixed(1) + " " + c2[0].toFixed(1) + " " + c2[1].toFixed(1) +
           " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
      teile.push([p1, c1, c2, p2]);
    }
    return { d: d, teile: teile };
  }

  function hrspur(fig) {
    var TMIN = 2400, TMAX = 200000, LMIN = 1e-5, LMAX = 1e8;
    var z = { stern: 1 };
    var teil = geruest(fig);
    teil.knoepfe.remove();
    fig.insertBefore(teil.bedienung, teil.buehne);           // Auswahl über dem Bild
    var flaeche = zeichenflaeche(teil.buehne, "hr-tafel",
      "Hertzsprung-Russell-Diagramm mit dem Lebensweg des gewählten Sterns",
      function (b) { return b < 480 ? b * 1.2 : begrenze(b * 0.78, 360, 600); }, zeichne);
    var werteHuelle = h("div", "hr-werte");
    fig.insertBefore(werteHuelle, teil.status);
    var werte = werteLeiste(werteHuelle, [
      ["masse", "Masse"], ["typ", "Spektraltyp heute"], ["leben", "Lebensdauer"], ["ende", "Endstadium"]
    ]);
    var liste = h("ol", "hr-phasen");
    fig.insertBefore(liste, fig.querySelector("figcaption"));

    var knoepfe = auswahl(teil.bedienung, "Stern:", "Stern wählen",
      HR_STERNE.map(function (st) { return st.name + " (" + masseText(st.masse) + ")"; }),
      function (i) { z.stern = i; markiere(knoepfe, i); zeichne(); });
    markiere(knoepfe, z.stern);

    function zeichne() {
      var f = flaeche, B = f.b, H = f.h, st = HR_STERNE[z.stern], schmal = B < 480;
      f.leeren();
      var l = schmal ? 46 : 62, r = 14, o = 16, u = 66;
      var lg = function (x) { return Math.log(x) / Math.LN10; };
      var X = function (T) { return l + (lg(TMAX) - lg(T)) / (lg(TMAX) - lg(TMIN)) * (B - l - r); };
      var Y = function (L) { return o + (lg(LMAX) - lg(L)) / (lg(LMAX) - lg(LMIN)) * (H - o - u); };
      var dex = (H - o - u) / (lg(LMAX) - lg(LMIN));          // Pixel pro Zehnerpotenz in L
      var XY = function (q) { return [X(q[0]), Y(q[1])]; };
      var nr = I.neueNr(), gid = "hr-farbe-" + nr, fid = "hr-weich-" + nr, cid = "hr-clip-" + nr;

      /* Tafel, Farbverlauf nach Temperatur, Weichzeichner, Ausschnitt */
      s("rect", { "class": "hr-himmel", x: 0, y: 0, width: B, height: H, rx: 14 }, f.svg);
      var defs = s("defs", null, f.svg);
      var verlauf = s("linearGradient", { id: gid, gradientUnits: "userSpaceOnUse", x1: X(TMAX), y1: 0, x2: X(TMIN), y2: 0 }, defs);
      [["o", 40000], ["b", 20000], ["a", 9000], ["f", 6800], ["g", 5600], ["k", 4300], ["m", 3000]].forEach(function (k) {
        s("stop", { offset: (X(k[1]) - X(TMAX)) / (X(TMIN) - X(TMAX)), "class": "hr-stop-" + k[0] }, verlauf);
      });
      var weich = s("filter", { id: fid, filterUnits: "userSpaceOnUse", x: 0, y: 0, width: B, height: H }, defs);
      s("feGaussianBlur", { stdDeviation: schmal ? 6 : 10 }, weich);
      s("rect", { x: l, y: o, width: B - l - r, height: H - o - u }, s("clipPath", { id: cid }, defs));
      var bild = s("g", { "clip-path": "url(#" + cid + ")" }, f.svg);
      var farbe = "url(#" + gid + ")", unscharf = "url(#" + fid + ")";

      /* Leuchtende Bereiche */
      var zams = glatt(HR_ZAMS.map(XY)).d;
      s("path", { "class": "hr-band", d: zams, stroke: farbe, "stroke-width": 1.0 * dex, "stroke-opacity": 0.5, filter: unscharf }, bild);
      s("path", { "class": "hr-band", d: zams, stroke: farbe, "stroke-width": 0.35 * dex, "stroke-opacity": 0.55 }, bild);
      s("path", { "class": "hr-band", d: glatt([[30000, 2.5e5], [12000, 2e5], [6000, 1.6e5], [3500, 1.6e5]].map(XY)).d,
        stroke: farbe, "stroke-width": 1.3 * dex, "stroke-opacity": 0.4, filter: unscharf }, bild);
      s("ellipse", { "class": "hr-k", cx: X(4300), cy: Y(170), rx: (X(3400) - X(5600)) / 2, ry: 0.75 * dex,
        "fill-opacity": 0.45, filter: unscharf }, bild);
      var zwerg = function (T) { return [T, 1.44e-4 * Math.pow(T / T_SONNE, 4)]; };   // R = 0,012 R☉
      s("path", { "class": "hr-band", d: glatt([zwerg(40000), zwerg(15000), zwerg(5000)].map(XY)).d,
        stroke: farbe, "stroke-width": 1.0 * dex, "stroke-opacity": 0.4, filter: unscharf }, bild);

      /* Gitter und Linien gleichen Radius: L/L☉ = R² (T/T☉)⁴ */
      var e;
      for (e = -4; e <= 6; e++) s("line", { "class": "hr-gitter", x1: l, y1: Y(Math.pow(10, e)), x2: B - r, y2: Y(Math.pow(10, e)) }, bild);
      [0.01, 0.1, 1, 10, 100, 1000].forEach(function (R) {
        var P = [], T;
        for (T = TMIN; T <= TMAX * 1.3; T *= 1.25) P.push([X(T), Y(R * R * Math.pow(T / T_SONNE, 4))]);
        s("polyline", { "class": "hr-radius", points: linienzug(P) }, bild);
        if (schmal && (R === 0.1 || R === 10 || R === 1000)) return;
        var To = Math.pow(LMAX / (R * R), 0.25) * T_SONNE, xs, ys;
        if (To < TMAX) { xs = X(To) + 5; ys = o + 13; } else { xs = l + 5; ys = Y(R * R * Math.pow(TMAX / T_SONNE, 4)) - 5; }
        txt(f.svg, xs, ys, (R < 1 ? zahl(R, R < 0.1 ? 2 : 1) : tausender(R)) + " R☉", "hr-zahl");
      });

      /* Belegte Flächen (für das Schild „… heute“) */
      var belegt = [];
      function merke(x, y, breite, anker) {
        var x1 = anker === "end" ? x - breite : anker === "middle" ? x - breite / 2 : x;
        belegt.push([x1, y - 11, x1 + breite, y + 3]);
      }

      /* Namen der Bereiche */
      function gedreht(text, a, b, abstand, schrift) {
        var pa = XY(a), pb = XY(b), dx = pb[0] - pa[0], dy = pb[1] - pa[1], len = Math.sqrt(dx * dx + dy * dy);
        var nx = dy / len, ny = -dx / len, w = Math.atan2(dy, dx) * 180 / Math.PI;
        if (w > 90 || w < -90) { w += 180; nx = -nx; ny = -ny; }
        var x = (pa[0] + pb[0]) / 2 + nx * abstand, y = (pa[1] + pb[1]) / 2 + ny * abstand;
        var t = txt(f.svg, x, y, text, "hr-gebiet", "middle");
        t.setAttribute("transform", "rotate(" + w.toFixed(1) + " " + x.toFixed(1) + " " + y.toFixed(1) + ")");
        var wb = text.length * 9.4, rad = w * Math.PI / 180;
        var aw = wb * Math.abs(Math.cos(rad)) + 12 * Math.abs(Math.sin(rad)), ah = wb * Math.abs(Math.sin(rad)) + 12 * Math.abs(Math.cos(rad));
        belegt.push([x - aw / 2, y - ah / 2 - 4, x + aw / 2, y + ah / 2 - 4]);
        if (schrift) t.setAttribute("font-size", schrift);
        return t;
      }
      gedreht("HAUPTREIHE", [17000, 800], [9000, 20], -0.55 * dex);
      txt(f.svg, X(4300), Y(1500), "RIESEN", "hr-gebiet", "middle");
      merke(X(4300), Y(1500), 6 * 9.4, "middle");
      txt(f.svg, X(schmal ? 9000 : 8000), Y(4e5), "ÜBERRIESEN", "hr-gebiet", "middle");
      merke(X(schmal ? 9000 : 8000), Y(4e5), 10 * 9.4, "middle");
      gedreht("WEISSE ZWERGE", zwerg(25000), zwerg(9000), -0.75 * dex);

      /* Massen auf der Hauptreihe */
      HR_MASSEN.forEach(function (m) {
        if (schmal && m[0] !== 1 && m[0] !== 10) return;
        var mt = zahl(m[0], m[0] < 1 ? 1 : 0) + " M☉";
        txt(f.svg, X(m[1]) - 9, Y(m[2]) + 15, mt, "hr-masse", "end");
        merke(X(m[1]) - 9, Y(m[2]) + 15, mt.length * 6.6, "end");
      });

      /* Bekannte Sterne und die übrigen wählbaren Sterne (heutige Lage) */
      var orte = HR_BEKANNT.slice();
      HR_STERNE.forEach(function (o2, i) { if (i !== z.stern) orte.push([o2.kurzname, o2.heute[0], o2.heute[1]]); });
      orte.forEach(function (q) {
        var x = X(q[1]), y = Y(q[2]), rr = 2.4 + 0.55 * Math.max(0, lg(q[2]) + 2);
        s("circle", { "class": "hr-punkt hr-" + spektralKlasse(q[1]), cx: x, cy: y, r: rr }, f.svg);
        belegt.push([x - rr, y - rr, x + rr, y + rr]);
        if (schmal) return;
        var rechts = x < B - r - 80;
        txt(f.svg, rechts ? x + rr + 4 : x - rr - 4, y + 4, q[0], "hr-name", rechts ? "start" : "end");
        merke(rechts ? x + rr + 4 : x - rr - 4, y + 4, q[0].length * 6.4, rechts ? "start" : "end");
      });

      /* Lebensweg des gewählten Sterns */
      var spur = s("g", null, bild), marken = [], start = [], probe = [];
      st.phasen.forEach(function (ph, i) {
        var pts = ph.p.map(XY);
        start.push(pts[0]);
        probe.push.apply(probe, pts);
        if (pts.length < 2) return;
        var weg;
        if (ph.sprung) {
          s("line", { "class": "hr-spur hr-sprung", x1: pts[0][0], y1: pts[0][1], x2: pts[1][0], y2: pts[1][1] }, spur);
          weg = glatt(pts.slice(1));
        } else {
          weg = glatt(pts);
        }
        s("path", { "class": "hr-spur-glanz", d: weg.d }, spur);
        s("path", { "class": "hr-spur", d: weg.d }, spur);
        weg.teile.forEach(function (c) {
          [0.25, 0.5, 0.75].forEach(function (u2) {
            var v = 1 - u2;
            probe.push([v * v * v * c[0][0] + 3 * v * v * u2 * c[1][0] + 3 * v * u2 * u2 * c[2][0] + u2 * u2 * u2 * c[3][0],
                        v * v * v * c[0][1] + 3 * v * v * u2 * c[1][1] + 3 * v * u2 * u2 * c[2][1] + u2 * u2 * u2 * c[3][1]]);
          });
        });
        /* Richtungspfeil in der Mitte der Phase */
        var teile = weg.teile;
        if (!teile.length) return;
        var t4 = teile[Math.floor((teile.length - 1) / 2)];
        var mx = (t4[0][0] + 3 * t4[1][0] + 3 * t4[2][0] + t4[3][0]) / 8, my = (t4[0][1] + 3 * t4[1][1] + 3 * t4[2][1] + t4[3][1]) / 8;
        var tx = t4[3][0] + t4[2][0] - t4[1][0] - t4[0][0], ty = t4[3][1] + t4[2][1] - t4[1][1] - t4[0][1];
        var tl = Math.sqrt(tx * tx + ty * ty), seg = Math.hypot(t4[3][0] - t4[0][0], t4[3][1] - t4[0][1]);
        if (tl < 1e-6 || seg < 24) return;
        tx /= tl; ty /= tl;
        s("polygon", { "class": "hr-pfeil", points: linienzug([
          [mx + tx * 6, my + ty * 6], [mx - tx * 4 + ty * 4.5, my - ty * 4 - tx * 4.5], [mx - tx * 4 - ty * 4.5, my - ty * 4 + tx * 4.5]
        ]) }, spur);
      });

      /* Ende: Supernova, Schwarzes Loch oder Weißer Zwerg */
      var letzte = st.phasen[st.phasen.length - 1], ende = XY(letzte.p[letzte.p.length - 1]);
      if (/Loch/.test(st.ende)) {
        s("circle", { "class": "hr-loch", cx: ende[0], cy: ende[1], r: 7 }, f.svg);
        s("circle", { "class": "hr-heute", cx: ende[0], cy: ende[1], r: 11 }, f.svg);
      } else if (/Supernova/.test(st.ende)) {
        var zacken = [], k;
        for (k = 0; k < 16; k++) {
          var rr = k % 2 ? 6 : 16, a = k / 16 * 2 * Math.PI;
          zacken.push([ende[0] + rr * Math.cos(a), ende[1] + rr * Math.sin(a)]);
        }
        s("polygon", { "class": "hr-explosion", points: linienzug(zacken) }, f.svg);
      } else {
        s("circle", { "class": "hr-punkt hr-" + spektralKlasse(letzte.p[letzte.p.length - 1][0]), cx: ende[0], cy: ende[1], r: 3.5 }, f.svg);
      }

      /* Heutige Lage */
      var jetzt = XY(st.heute);
      s("circle", { "class": "hr-heute", cx: jetzt[0], cy: jetzt[1], r: 11 }, f.svg);

      /* Nummern am Beginn jeder Phase; bei Überlappung zur Seite rücken
         (auch weg vom Endsymbol) */
      marken.push(ende);
      start.forEach(function (p, i) {
        var x = p[0], y = p[1], versuch = 0, rund = [[0, 0], [0, -22], [22, 0], [0, 22], [-22, 0], [18, -18], [-18, -18], [18, 18], [-18, 18], [0, -42], [40, 0], [-40, 0], [0, 42]];
        function frei(px, py) {
          return marken.every(function (m) { return Math.hypot(m[0] - px, m[1] - py) > 19; }) &&
                 px > l + 9 && px < B - r - 9 && py > o + 9 && py < H - u - 9;
        }
        for (versuch = 0; versuch < rund.length; versuch++) {
          if (frei(x + rund[versuch][0], y + rund[versuch][1])) break;
        }
        if (versuch === rund.length) versuch = 0;
        var mx = x + rund[versuch][0], my = y + rund[versuch][1];
        if (versuch > 0) s("line", { "class": "hr-leitlinie", x1: x, y1: y, x2: mx, y2: my }, f.svg);
        marken.push([mx, my]);
        var g = s("g", { "class": "hr-marke" }, f.svg);
        s("circle", { cx: mx, cy: my, r: 8.5 }, g);
        txt(g, mx, my + 4, String(i + 1), null, "middle");
      });

      /* Schild „… heute“ an die Stelle mit den wenigsten Überschneidungen */
      var schild = st.kurzname + " heute", bw = schild.length * 6.6;
      var kandidaten = [[15, -10, 0], [-15, -10, 1], [15, 20, 0], [-15, 20, 1], [-bw / 2, -18, 0], [-bw / 2, 30, 0]];
      var bester = null;
      kandidaten.forEach(function (k) {
        var x0 = jetzt[0] + k[0] - (k[2] ? bw : 0), y0 = jetzt[1] + k[1];
        var bx1 = x0 - 4, bx2 = x0 + bw + 4, by1 = y0 - 13, by2 = y0 + 5;
        var wert = 0;
        probe.forEach(function (q) { if (q[0] > bx1 && q[0] < bx2 && q[1] > by1 && q[1] < by2) wert += 1; });
        marken.forEach(function (q) { if (q[0] > bx1 - 8 && q[0] < bx2 + 8 && q[1] > by1 - 8 && q[1] < by2 + 8) wert += 5; });
        belegt.forEach(function (q) { if (q[0] < bx2 && q[2] > bx1 && q[1] < by2 && q[3] > by1) wert += 6; });
        if (bx1 < l || bx2 > B - r || by1 < o || by2 > H - u) wert += 1000;
        if (!bester || wert < bester.wert) bester = { wert: wert, x: x0, y: y0 };
      });
      txt(f.svg, bester.x, bester.y, schild, "hr-titel klein");

      /* Achsen: Zahlen, Spektralleiste, Titel */
      for (e = -4; e <= 6; e++) {
        if (schmal && e % 2 !== 0) continue;
        if (e === 0) txt(f.svg, l - 6, Y(1) + 4, "1", "hr-zahl", "end");
        else hoch10(f.svg, l - 6, Y(Math.pow(10, e)) + 4, e, "hr-zahl", "end");
      }
      (schmal ? [100000, 10000, 3000] : [100000, 30000, 10000, 6000, 3000]).forEach(function (T) {
        txt(f.svg, X(T), H - u + 15, tausender(T), "hr-zahl", "middle");
      });
      var yl = H - u + 22, hl = 16;
      s("rect", { x: l, y: yl, width: B - l - r, height: hl, rx: 3, fill: farbe }, f.svg);
      [["O", 200000, 30000, "hell"], ["B", 30000, 10000, "hell"], ["A", 10000, 7500, "dunkel"], ["F", 7500, 6000, "dunkel"],
       ["G", 6000, 5200, "dunkel"], ["K", 5200, 3700, "dunkel"], ["M", 3700, TMIN, "hell"]].forEach(function (k) {
        if (X(k[2]) - X(k[1]) < 11) return;
        txt(f.svg, (X(k[1]) + X(k[2])) / 2, yl + 12, k[0], "hr-klasse-" + k[3], "middle");
      });
      txt(f.svg, (l + B - r) / 2, H - 9, schmal ? "Temperatur in K" : "Oberflächentemperatur in Kelvin", "hr-achse", "middle");
      txt(f.svg, l, H - 9, "← heißer", "hr-zahl");
      txt(f.svg, B - r, H - 9, "kühler →", "hr-zahl", "end");
      var ty2 = (o + H - u) / 2, ya = txt(f.svg, 17, ty2, "Leuchtkraft (Sonne = 1)", "hr-achse", "middle");
      ya.setAttribute("transform", "rotate(-90 17 " + ty2.toFixed(1) + ")");

      /* Beschreibung, Kennzahlen, Phasenliste */
      f.svg.setAttribute("aria-label", "Hertzsprung-Russell-Diagramm mit dem Lebensweg von " + st.name + ": " +
        st.phasen.map(function (ph, i) { return (i + 1) + ". " + ph.name; }).join(", ") + ".");
      werte.masse.textContent = masseText(st.masse);
      werte.typ.textContent = st.typ;
      werte.leben.textContent = st.leben;
      werte.ende.textContent = st.ende;
      teil.status.textContent = st.kurz;
      while (liste.firstChild) liste.removeChild(liste.firstChild);
      st.phasen.forEach(function (ph, i) {
        var li = h("li");
        var kopf = h("p");
        kopf.append(h("strong", null, ph.name), h("span", "dauer", " · " + ph.dauer));
        var inhalt = h("div");
        inhalt.append(kopf, h("p", null, ph.text));
        li.append(h("span", "nr", String(i + 1)), inhalt);
        liste.append(li);
      });
    }
    zeichne();
  }

  I.modell("hrspur", hrspur);
})(window.Interaktiv);
