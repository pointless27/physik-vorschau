/* =========================================================================
   INTERAKTIVES SONNENSYSTEM (nur auf der Startseite)
   =========================================================================
   Baut in <div id="sonnensystem"> ein SVG-Modell mit Sonne, acht Planeten,
   Erdmond und Asteroidengürtel. Ein Klick auf einen Körper oder seine Bahn
   zoomt hinein und zeigt in <aside id="planet-info"> Fakten an.

   Modell:
     - Größen und Bahnradien sind NICHT maßstabsgetreu (sonst wäre Merkur
       neben Neptun unsichtbar).
     - Umlaufzeiten stehen im echten Verhältnis: 1 Erdjahr ≙ 40 s.
     - Startstellung ≈ heutige Planetenstellung, berechnet aus den mittleren
       Längen (JPL-Näherung, Standish). Abweichungen von einigen Grad sind
       normal, weil die Bahnen hier als Kreise gezeichnet werden.
     - Mond: mittlere geozentrische Länge (Meeus) → die Mondphase im Modell
       stimmt ungefähr mit der echten überein.
     - Asteroiden: Jeder Brocken kreist mit T² ∝ a³ (3. Kepler-Gesetz),
       innere also schneller als äußere.

   Fakten mit unsicheren oder veränderlichen Zahlen sind mit
   "PRÜFEN:" kommentiert.
   ========================================================================= */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var JAHR_IN_SEKUNDEN = 40;                          // 1 Erdjahr dauert im Modell 40 s
  var TAGE_PRO_SEKUNDE = 365.25 / JAHR_IN_SEKUNDEN;
  var GESAMT = 600;                                   // Breite der Übersicht in SVG-Einheiten
  var J2000 = Date.UTC(2000, 0, 1, 12);               // Bezugszeitpunkt der Bahndaten
  var ZEITLUPE = 0.15;                                // Zeitfaktor beim Hineinzoomen
  var GRAD = Math.PI / 180;

  var wenigBewegung = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -----------------------------------------------------------------------
     DATEN
     bahn    – Bahnradius im Modell (SVG-Einheiten, nicht maßstabsgetreu)
     radius  – Radius im Modell
     L0, Lr  – mittlere Länge zu J2000 [°] und ihre Änderung [° pro Jahrhundert]
     zoom    – Breite des Bildausschnitts beim Hineinzoomen
     treffer – Radius der unsichtbaren Klickfläche
     ----------------------------------------------------------------------- */
  var KOERPER = [
    {
      id: "sonne", name: "Sonne", art: "Stern · Zentrum des Sonnensystems",
      farben: ["#ffd27a", "#e2780f"], radius: 16, bahn: 0, zoom: 100, treffer: 20,
      kurz: "Ein ganz gewöhnlicher Stern – für uns aber die Quelle von fast allem: Licht, Wärme und die Schwerkraft, die das ganze System zusammenhält.",
      daten: [
        ["Durchmesser", "1,39 Mio. km (109 × Erde)"],
        ["Masse", "99,86 % des Sonnensystems"],
        ["Oberfläche", "ca. 5 500 °C"],
        ["Kern", "ca. 15 Mio. °C"],
        ["Rotation", "ca. 25 Tage (am Äquator)"],
        ["Licht bis zur Erde", "8 min 20 s"]
      ],
      fakten: [
        "Jede Sekunde verwandelt die Sonne rund 4 Millionen Tonnen Masse in Energie – Einsteins E = mc² im größten Maßstab.",
        "In die Sonne würden etwa 1,3 Millionen Erden hineinpassen.",
        // PRÜFEN: Schätzungen für die Diffusionszeit der Strahlung reichen von ~10 000 bis ~170 000 Jahren.
        "Das Sonnenlicht, das du siehst, ist an der Oberfläche gut 8 Minuten alt. Die Energie dafür hat sich aber vorher Zehntausende bis Hunderttausende Jahre vom Kern nach außen gearbeitet."
      ],
      themen: ["sternentwicklung", "sternleichen", "gravitation", "kepler"]
    },
    {
      id: "merkur", name: "Merkur", art: "Planet · Nr. 1 von 8",
      farben: ["#bdb7b0", "#6f6a66"], radius: 2.6, bahn: 40,
      L0: 252.25032350, Lr: 149472.67411175, zoom: 24, treffer: 6,
      kurz: "Der kleinste und sonnennächste Planet – ein zerkraterter Gesteinsbrocken, nur etwa 40 % größer als unser Mond.",
      daten: [
        ["Durchmesser", "4 879 km"],
        ["Abstand zur Sonne", "57,9 Mio. km (0,39 AE)"],
        ["Umlaufzeit", "88 Tage"],
        ["Rotation", "58,6 Tage"],
        ["Temperatur", "−173 bis +427 °C"],
        ["Monde", "keine"]
      ],
      fakten: [
        "Ein Sonnentag – von Mittag bis Mittag – dauert auf Merkur 176 Erdtage, also genau zwei Merkurjahre.",
        "Seine Bahn dreht sich pro Jahrhundert um 43 Bogensekunden weiter, als Newtons Gravitationsgesetz erlaubt. Erst Einsteins Allgemeine Relativitätstheorie (1915) konnte das erklären.",
        "Obwohl er der Sonne am nächsten ist, ist Merkur nicht der heißeste Planet: Ohne Atmosphäre entweicht die Wärme nachts ungehindert ins All."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "venus", name: "Venus", art: "Planet · Nr. 2 von 8",
      farben: ["#efd8a2", "#b98f48"], radius: 4.2, bahn: 58,
      L0: 181.97909950, Lr: 58517.81538729, zoom: 30, treffer: 7,
      kurz: "Fast genauso groß wie die Erde – doch unter einer dichten Wolkendecke aus CO₂ herrscht eine Hölle aus Hitze und Druck.",
      daten: [
        ["Durchmesser", "12 104 km"],
        ["Abstand zur Sonne", "108,2 Mio. km (0,72 AE)"],
        ["Umlaufzeit", "225 Tage"],
        ["Rotation", "243 Tage, rückwärts"],
        ["Temperatur", "ca. 465 °C"],
        ["Luftdruck", "ca. 92 × Erde"]
      ],
      fakten: [
        "Venus dreht sich so langsam, dass eine Umdrehung (243 Erdtage) länger dauert als ein Venusjahr (225 Erdtage).",
        "Sie rotiert rückwärts: Auf der Venus geht die Sonne im Westen auf und im Osten unter.",
        "Am Boden herrscht ein Druck wie auf der Erde in rund 900 m Wassertiefe – und mit etwa 465 °C ist es heißer als auf Merkur. Schuld ist ein extremer Treibhauseffekt."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "erde", name: "Erde", art: "Planet · Nr. 3 von 8",
      farben: ["#4f95e8", "#1d4b94"], radius: 4.5, bahn: 78,
      L0: 100.46457166, Lr: 35999.37244981, zoom: 34, treffer: 6.5,
      kurz: "Unser Zuhause – und bisher der einzige Ort im Universum, von dem wir sicher wissen, dass es dort Leben gibt.",
      daten: [
        ["Durchmesser", "12 742 km"],
        ["Abstand zur Sonne", "149,6 Mio. km (1 AE)"],
        ["Umlaufzeit", "365,25 Tage"],
        ["Rotation", "23 h 56 min"],
        ["Temperatur", "im Mittel ca. 15 °C"],
        ["Monde", "1"]
      ],
      fakten: [
        "Wir rasen mit knapp 30 km/s um die Sonne – über 100 000 km/h. Spüren können wir das nicht, weil sich unsere Geschwindigkeit kaum ändert.",
        "Am Äquator bewegt sich der Boden durch die Erdrotation mit rund 1 670 km/h.",
        "Der mittlere Abstand Erde–Sonne ist so wichtig, dass er eine eigene Einheit hat: die Astronomische Einheit, 1 AE = 149 597 870,7 km."
      ],
      themen: ["gravitation", "kepler", "impuls-schwerpunkt", "scheinkraefte", "erde-rast"]
    },
    {
      id: "mond", name: "Mond", art: "Begleiter der Erde",
      farben: ["#d6d6d6", "#8a8a8a"], radius: 1.4, bahn: 9, um: "erde",
      L0: 218.3164477, Lr: 481267.88123421, zoom: 22, treffer: 3.5,
      kurz: "Unser ständiger Begleiter: Er sorgt für Ebbe und Flut, bremst langsam die Erdrotation – und ist der einzige andere Himmelskörper, den Menschen betreten haben.",
      daten: [
        ["Durchmesser", "3 474 km"],
        ["Abstand zur Erde", "384 400 km (Mittel)"],
        ["Umlauf um die Erde", "27,3 Tage"],
        ["Mondphasen-Zyklus", "29,5 Tage"],
        ["Schwerkraft", "1,62 m/s² (≈ ⅙ g)"],
        ["Temperatur", "−173 bis +127 °C"]
      ],
      fakten: [
        "Der Mond zeigt uns immer dieselbe Seite: Er dreht sich genau einmal um sich selbst, während er die Erde einmal umrundet (gebundene Rotation).",
        "Er entfernt sich jedes Jahr um etwa 3,8 cm von der Erde – gemessen mit Laserstrahlen, die an Spiegeln der Apollo-Missionen zurückgeworfen werden.",
        "Zwölf Menschen sind zwischen 1969 und 1972 auf dem Mond gelaufen. Einer von ihnen ließ dort einen Hammer und eine Feder fallen – beide kamen gleichzeitig unten an.",
        "Im Modell siehst du die Mondphase: Die beleuchtete Seite zeigt zur Sonne, und die Stellung entspricht ungefähr der heutigen."
      ],
      themen: ["gravitation", "bewegung-1d", "impuls-schwerpunkt", "hammer-feder"]
    },
    {
      id: "mars", name: "Mars", art: "Planet · Nr. 4 von 8",
      farben: ["#de7448", "#8f3418"], radius: 3.4, bahn: 98,
      L0: -4.55343205, Lr: 19140.30268499, zoom: 24, treffer: 6,
      kurz: "Der rote Planet: eine kalte Wüste mit dünner Atmosphäre – und den höchsten Vulkanen und tiefsten Schluchten des Sonnensystems.",
      daten: [
        ["Durchmesser", "6 779 km"],
        ["Abstand zur Sonne", "227,9 Mio. km (1,52 AE)"],
        ["Umlaufzeit", "687 Tage"],
        ["Rotation", "24 h 37 min"],
        ["Temperatur", "im Mittel ca. −60 °C"],
        ["Monde", "2 (Phobos, Deimos)"]
      ],
      fakten: [
        "Seine Farbe verdankt er Eisenoxid im Staub – der Mars ist im Grunde verrostet.",
        // PRÜFEN: Höhenangaben für Olympus Mons schwanken je nach Bezugsfläche (ca. 22–26 km).
        "Der Vulkan Olympus Mons ragt rund 22 km über seine Umgebung – etwa zweieinhalbmal so hoch wie der Mount Everest über dem Meer.",
        "Sonnenuntergänge auf dem Mars sind bläulich: Der feine Staub streut blaues Licht bevorzugt nach vorne, also in Richtung der Sonne."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "guertel", name: "Asteroidengürtel", art: "Zwischen Mars und Jupiter",
      farben: ["#a39a8e", "#6d655b"], guertel: true, zoom: 330, treffer: 0,
      kurz: "Millionen Gesteinsbrocken, die sich nie zu einem Planeten zusammengefunden haben – Jupiters Schwerkraft hat sie dafür zu sehr durcheinandergewirbelt.",
      daten: [
        ["Lage", "ca. 2,2–3,2 AE"],
        ["Gesamtmasse", "ca. 3 % der Mondmasse"],
        ["Größtes Objekt", "Ceres, ca. 940 km"],
        ["Umlaufzeiten", "ca. 3–6 Jahre"]
      ],
      fakten: [
        // PRÜFEN: Typische Abstände zwischen größeren Asteroiden – Angaben meist „rund eine Million km".
        "Anders als im Film ist der Gürtel ziemlich leer: Zwischen größeren Asteroiden liegen meist Hunderttausende Kilometer. Raumsonden fliegen einfach hindurch.",
        // PRÜFEN: Anteil von Ceres an der Gürtelmasse, Literaturwerte ca. 25–40 %.
        "Der Zwergplanet Ceres allein enthält rund ein Drittel der Masse des gesamten Gürtels.",
        "Schau genau hin: Im Modell kreisen die inneren Brocken schneller als die äußeren – genau wie es das dritte Keplersche Gesetz (T² ∝ a³) vorhersagt."
      ],
      themen: ["kepler", "gravitation"]
    },
    {
      id: "jupiter", name: "Jupiter", art: "Planet · Nr. 5 von 8",
      farben: ["#e2c29c", "#9c6f45"], radius: 11, bahn: 158,
      L0: 34.39644051, Lr: 3034.74612775, zoom: 64, treffer: 13,
      kurz: "Der Riese des Sonnensystems: ein Gasplanet ohne feste Oberfläche, mit Stürmen, die größer sind als die ganze Erde.",
      daten: [
        ["Durchmesser", "139 820 km (11 × Erde)"],
        ["Abstand zur Sonne", "778,5 Mio. km (5,2 AE)"],
        ["Umlaufzeit", "11,9 Jahre"],
        ["Rotation", "9 h 56 min"],
        ["Temperatur", "ca. −110 °C (Wolkenobergrenze)"],
        // PRÜFEN: Mondzahlen ändern sich mit neuen Entdeckungen.
        ["Monde", "95 bekannte (Stand 2025)"]
      ],
      fakten: [
        "Jupiter ist zweieinhalbmal so schwer wie alle anderen Planeten zusammen.",
        // PRÜFEN: Durchgehend beobachtet seit ca. 1830.
        "Der Große Rote Fleck ist ein Wirbelsturm, in den die Erde hineinpassen würde – er wird seit fast 200 Jahren beobachtet.",
        "Kein Planet dreht sich schneller: Ein Jupitertag dauert keine 10 Stunden."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "saturn", name: "Saturn", art: "Planet · Nr. 6 von 8",
      farben: ["#ecd39d", "#a9844c"], radius: 9.5, bahn: 200,
      L0: 49.95424423, Lr: 1222.49362201, zoom: 70, treffer: 13,
      kurz: "Der Herr der Ringe – ein Gasriese, dessen Ringe aus unzähligen Eis- und Gesteinsbrocken bestehen.",
      daten: [
        ["Durchmesser", "116 460 km"],
        ["Abstand zur Sonne", "1,43 Mrd. km (9,5 AE)"],
        ["Umlaufzeit", "29,4 Jahre"],
        ["Rotation", "10 h 33 min"],
        ["Dichte", "0,69 g/cm³ (Wasser: 1)"],
        // PRÜFEN: Mondzahlen ändern sich mit neuen Entdeckungen.
        ["Monde", "274 bekannte (Stand 2025)"]
      ],
      fakten: [
        "Saturns mittlere Dichte ist kleiner als die von Wasser – in einer (sehr) großen Badewanne würde er schwimmen.",
        // PRÜFEN: Ringdicke – meist „etwa 10 m bis 1 km" angegeben.
        "Die Hauptringe spannen sich über rund 270 000 km, sind an vielen Stellen aber nur etwa zehn Meter dick.",
        "Am Nordpol dreht sich ein riesiger, sechseckiger Wolkenwirbel – das Saturn-Hexagon."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "uranus", name: "Uranus", art: "Planet · Nr. 7 von 8",
      farben: ["#a6e3e8", "#4f9fab"], radius: 6.5, bahn: 238,
      L0: 313.23810451, Lr: 428.48202785, zoom: 40, treffer: 9,
      kurz: "Ein Eisriese, der auf der Seite liegt: Seine Drehachse ist um 98° gekippt.",
      daten: [
        ["Durchmesser", "50 724 km"],
        ["Abstand zur Sonne", "2,87 Mrd. km (19,2 AE)"],
        ["Umlaufzeit", "84 Jahre"],
        ["Rotation", "17 h 14 min, rückwärts"],
        ["Temperatur", "bis −224 °C"],
        // PRÜFEN: Mondzahlen ändern sich mit neuen Entdeckungen.
        ["Monde", "29 bekannte (Stand 2025)"]
      ],
      fakten: [
        "Wegen der extremen Achsneigung herrscht an seinen Polen jeweils 42 Jahre lang Tag und danach 42 Jahre lang Nacht.",
        "Er war der erste Planet, der mit einem Teleskop entdeckt wurde: 1781 von Wilhelm Herschel.",
        "Mit bis zu −224 °C wurde in seiner Atmosphäre die tiefste Temperatur aller Planeten gemessen – kälter als beim weiter entfernten Neptun."
      ],
      themen: ["gravitation", "kepler"]
    },
    {
      id: "neptun", name: "Neptun", art: "Planet · Nr. 8 von 8",
      farben: ["#6684f2", "#26389c"], radius: 6.3, bahn: 272,
      L0: -55.12002969, Lr: 218.45945325, zoom: 40, treffer: 9,
      kurz: "Der äußerste Planet: ein tiefblauer Eisriese mit den schnellsten Winden im ganzen Sonnensystem.",
      daten: [
        ["Durchmesser", "49 244 km"],
        ["Abstand zur Sonne", "4,5 Mrd. km (30,1 AE)"],
        ["Umlaufzeit", "164,8 Jahre"],
        ["Rotation", "16 h 6 min"],
        ["Temperatur", "ca. −200 °C"],
        // PRÜFEN: Mondzahlen ändern sich mit neuen Entdeckungen.
        ["Monde", "16 bekannte (Stand 2025)"]
      ],
      fakten: [
        "Neptun wurde 1846 zuerst auf dem Papier entdeckt: Aus winzigen Störungen der Uranusbahn berechnete Urbain Le Verrier seine Position – Johann Gottfried Galle fand ihn dann am Teleskop fast genau an der vorhergesagten Stelle.",
        "Seit seiner Entdeckung hat Neptun die Sonne erst ein einziges Mal umrundet: 2011 war die erste Runde komplett.",
        "Auf Neptun wehen Stürme mit über 2 000 km/h – schneller als der Schall in der Erdatmosphäre."
      ],
      themen: ["gravitation", "kepler"]
    }
  ];

  /* Oberflächendetails, Koordinaten in Vielfachen des Radius:
     [x, y, rx, ry, Drehung°, Farbe] */
  var FLECKEN = {
    merkur:  [[-0.35, -0.25, 0.2, 0.2, 0, "rgba(60,55,50,.35)"], [0.3, 0.15, 0.15, 0.15, 0, "rgba(60,55,50,.35)"],
              [-0.1, 0.45, 0.13, 0.13, 0, "rgba(60,55,50,.3)"], [0.45, -0.4, 0.12, 0.12, 0, "rgba(60,55,50,.3)"]],
    venus:   [[-0.2, -0.3, 0.7, 0.18, -15, "rgba(255,244,210,.35)"], [0.2, 0.35, 0.6, 0.15, -10, "rgba(255,244,210,.3)"]],
    erde:    [[-0.3, -0.15, 0.32, 0.22, 30, "#4f9a5c"], [0.35, 0.3, 0.22, 0.34, -20, "#4f9a5c"],
              [0.1, -0.5, 0.2, 0.12, 0, "#5ea767"], [0, -0.95, 0.45, 0.15, 0, "#f3f6fa"],
              [0, 0.95, 0.4, 0.13, 0, "#f3f6fa"], [0.1, 0.05, 0.5, 0.05, -10, "rgba(255,255,255,.3)"]],
    mond:    [[-0.3, -0.2, 0.22, 0.22, 0, "rgba(70,70,70,.35)"], [0.25, 0.3, 0.16, 0.16, 0, "rgba(70,70,70,.35)"],
              [0.35, -0.35, 0.12, 0.12, 0, "rgba(70,70,70,.3)"], [-0.15, 0.45, 0.1, 0.1, 0, "rgba(70,70,70,.3)"]],
    mars:    [[0, -0.88, 0.38, 0.14, 0, "#f6f1ec"], [0.2, 0.2, 0.35, 0.18, 20, "rgba(90,30,15,.35)"]],
    jupiter: [[0, -0.71, 1, 0.07, 0, "#c9a274"], [0, -0.35, 1, 0.1, 0, "#a87a50"], [0, -0.03, 1, 0.05, 0, "#efdcbc"],
              [0, 0.23, 1, 0.11, 0, "#a87a50"], [0, 0.585, 1, 0.065, 0, "#c9a274"], [0.35, 0.36, 0.2, 0.11, 0, "#c3593b"]],
    saturn:  [[0, -0.42, 1, 0.08, 0, "#cfae73"], [0, 0.11, 1, 0.06, 0, "#dcc08a"], [0, 0.47, 1, 0.07, 0, "#c7a36a"]],
    neptun:  [[-0.25, 0.2, 0.22, 0.12, 0, "rgba(20,30,90,.45)"], [0.1, -0.35, 0.3, 0.05, 0, "rgba(255,255,255,.5)"]]
  };

  /* Ringe: [rx, ry, Breite, Farbe] in Vielfachen des Radius; Drehung in Grad */
  var RINGE = {
    saturn: { drehung: -22, teile: [[2.15, 0.62, 0.22, "rgba(222,204,160,.9)"], [1.68, 0.48, 0.22, "rgba(190,168,122,.8)"]] },
    uranus: { drehung: 80,  teile: [[1.7, 0.35, 0.07, "rgba(210,240,245,.55)"]] }
  };

  /* -----------------------------------------------------------------------
     Hilfsfunktionen
     ----------------------------------------------------------------------- */
  function s(tag, attr, eltern) {
    var e = document.createElementNS(NS, tag);
    if (attr) Object.keys(attr).forEach(function (k) { e.setAttribute(k, attr[k]); });
    if (eltern) eltern.appendChild(e);
    return e;
  }

  function h(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function stopp(verlauf, offset, farbe, deckkraft) {
    s("stop", { offset: offset, "stop-color": farbe, "stop-opacity": deckkraft === undefined ? 1 : deckkraft }, verlauf);
  }

  /* Reproduzierbarer Zufall, damit der Gürtel bei jedem Laden gleich aussieht */
  function zufall(saat) {
    return function () {
      saat = (saat + 0x6D2B79F5) | 0;
      var t = Math.imul(saat ^ (saat >>> 15), 1 | saat);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function tageSeitJ2000(ms) { return (ms - J2000) / 86400000; }

  function findeThema(id) {
    if (typeof SITE === "undefined") return null;
    for (var g = 0; g < SITE.fachgebiete.length; g++) {
      var kap = SITE.fachgebiete[g].kapitel;
      for (var k = 0; k < kap.length; k++) {
        for (var t = 0; t < kap[k].themen.length; t++) {
          if (kap[k].themen[t].id === id) return kap[k].themen[t];
        }
      }
    }
    return null;
  }

  /* -----------------------------------------------------------------------
     Aufbau
     ----------------------------------------------------------------------- */
  function baue() {
    var behaelter = document.getElementById("sonnensystem");
    var info = document.getElementById("planet-info");
    var hero = behaelter && behaelter.closest(".hero");
    if (!behaelter || !info || !hero) return;

    var nachId = {};
    KOERPER.forEach(function (k) {
      nachId[k.id] = k;
      if (k.Lr !== undefined) k.Ltag = k.Lr / 36525;   // ° pro Tag
      k.pos = { x: 0, y: 0 };
    });

    var svg = s("svg", {
      "class": "sonnensystem",
      viewBox: (-GESAMT / 2) + " " + (-GESAMT / 2) + " " + GESAMT + " " + GESAMT,
      role: "group",
      "aria-label": "Interaktives Modell des Sonnensystems"
    });
    behaelter.insertBefore(svg, behaelter.firstChild);

    /* Leichte Neigung beim Überfahren mit der Maus (höchstens ±4°, Wunsch
       des Betreibers 2026-11-12). Nur mit Maus, nicht bei „weniger
       Bewegung“ und nur in der Übersicht – im Erkundungsmodus setzt das
       CSS die Neigung zurück (.hero.erkunden .sonnensystem). */
    var mitMaus = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (mitMaus && !wenigBewegung) {
      behaelter.addEventListener("pointermove", function (ev) {
        if (ev.pointerType !== "mouse") return;
        var r = behaelter.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width - 0.5;    // −0,5 … 0,5
        var y = (ev.clientY - r.top) / r.height - 0.5;
        behaelter.style.setProperty("--kipp-x", (-y * 8).toFixed(2) + "deg");
        behaelter.style.setProperty("--kipp-y", (x * 8).toFixed(2) + "deg");
      });
      behaelter.addEventListener("pointerleave", function () {
        behaelter.style.removeProperty("--kipp-x");
        behaelter.style.removeProperty("--kipp-y");
      });
    }

    /* --- Farbverläufe --- */
    var defs = s("defs", null, svg);
    var glut = s("radialGradient", { id: "ss-glut" }, defs);
    stopp(glut, 0, "#f6a73b", 0.5); stopp(glut, 0.4, "#f6a73b", 0.16); stopp(glut, 1, "#f6a73b", 0);
    var sonne = s("radialGradient", { id: "ss-sonne", cx: "45%", cy: "45%", r: "60%" }, defs);
    stopp(sonne, 0, "#fff3cf"); stopp(sonne, 0.55, "#f9b24a"); stopp(sonne, 1, "#e2780f");
    var nacht = s("linearGradient", { id: "ss-nacht", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    stopp(nacht, 0, "#000", 0); stopp(nacht, 0.47, "#000", 0); stopp(nacht, 0.6, "#000", 0.55); stopp(nacht, 1, "#000", 0.8);

    KOERPER.forEach(function (k) {
      if (k.guertel || k.id === "sonne") return;
      var v = s("radialGradient", { id: "ss-farbe-" + k.id }, defs);
      stopp(v, 0, k.farben[0]); stopp(v, 0.68, k.farben[0]); stopp(v, 1, k.farben[1]);
      var clip = s("clipPath", { id: "ss-clip-" + k.id }, defs);
      s("circle", { r: k.radius }, clip);
    });

    /* --- Ebenen (Reihenfolge = Zeichenreihenfolge) --- */
    var ebeneGlut    = s("g", null, svg);
    var ebeneBahnen  = s("g", null, svg);
    var ebeneGuertel = s("g", { "class": "guertel" }, svg);
    var ebeneTreffer = s("g", null, svg);
    var ebeneKoerper = s("g", null, svg);
    var namensschild = s("text", { "class": "koerper-name" }, svg);

    s("circle", { r: 54, fill: "url(#ss-glut)" }, ebeneGlut);

    /* --- Bahnen und ihre (breiteren, unsichtbaren) Klickflächen --- */
    var bahnElement = {};
    KOERPER.forEach(function (k) {
      if (!k.bahn || k.um) return;
      bahnElement[k.id] = s("circle", { "class": "bahn", r: k.bahn }, ebeneBahnen);
      s("circle", { "class": "bahn-treffer", r: k.bahn, "data-id": k.id }, ebeneTreffer);
    });
    var mondBahnGruppe = s("g", null, ebeneBahnen);
    bahnElement.mond = s("circle", { "class": "bahn bahn-mond", r: nachId.mond.bahn }, mondBahnGruppe);
    var mondTrefferGruppe = s("g", null, ebeneTreffer);
    s("circle", { "class": "bahn-treffer bahn-treffer-mond", r: nachId.mond.bahn, "data-id": "mond" }, mondTrefferGruppe);

    /* --- Asteroidengürtel: Punkte als Null-Längen-Linien mit runden Enden --- */
    var rnd = zufall(20251110);
    var asteroiden = [];
    for (var i = 0; i < 320; i++) {
      var u = (rnd() + rnd() + rnd()) / 3;              // dichter in der Mitte
      var r = 112 + u * 22;
      var aAE = 2.2 + (r - 112) / 22 * 1.0;             // zugehörige große Halbachse in AE
      asteroiden.push({
        r: r,
        L0: rnd() * 360,
        Ltag: 360 / (365.25 * Math.pow(aAE, 1.5)),       // 3. Kepler-Gesetz: T = a^1,5 Jahre
        gross: rnd() < 0.12
      });
    }
    var pfadKlein = s("path", { "class": "asteroiden" }, ebeneGuertel);
    var pfadGross = s("path", { "class": "asteroiden asteroiden-gross" }, ebeneGuertel);
    bahnElement.guertel = ebeneGuertel;
    s("circle", {
      "class": "guertel-treffer", r: 123, "data-id": "guertel", tabindex: 0,
      role: "button", "aria-label": "Asteroidengürtel – Fakten anzeigen"
    }, ebeneTreffer);

    /* --- Himmelskörper --- */
    function ringHaelfte(gruppe, k, hinten) {
      var ring = RINGE[k.id];
      if (!ring) return;
      var g = s("g", { transform: "rotate(" + ring.drehung + ")" }, gruppe);
      ring.teile.forEach(function (t) {
        var rx = t[0] * k.radius, ry = t[1] * k.radius;
        s("path", {
          d: "M" + (-rx) + " 0A" + rx + " " + ry + " 0 0 " + (hinten ? 1 : 0) + " " + rx + " 0",
          fill: "none", stroke: t[3], "stroke-width": t[2] * k.radius
        }, g);
      });
    }

    KOERPER.forEach(function (k) {
      if (k.guertel) return;
      var gruppe = s("g", { "class": "koerper" }, ebeneKoerper);
      k.element = gruppe;

      if (k.id === "sonne") {
        s("circle", { r: k.radius, fill: "url(#ss-sonne)" }, gruppe);
      } else {
        ringHaelfte(gruppe, k, true);
        s("circle", { r: k.radius, fill: "url(#ss-farbe-" + k.id + ")" }, gruppe);
        if (FLECKEN[k.id]) {
          var details = s("g", { "clip-path": "url(#ss-clip-" + k.id + ")" }, gruppe);
          FLECKEN[k.id].forEach(function (f) {
            s("ellipse", {
              cx: f[0] * k.radius, cy: f[1] * k.radius, rx: f[2] * k.radius, ry: f[3] * k.radius,
              transform: f[4] ? "rotate(" + f[4] + " " + f[0] * k.radius + " " + f[1] * k.radius + ")" : "",
              fill: f[5]
            }, details);
          });
        }
        k.schatten = s("g", null, gruppe);
        s("circle", { r: k.radius, fill: "url(#ss-nacht)" }, k.schatten);
        ringHaelfte(gruppe, k, false);
      }

      s("circle", {
        "class": "treffer", r: k.treffer, "data-id": k.id, tabindex: 0,
        role: "button", "aria-label": k.name + " – Fakten anzeigen"
      }, gruppe);
    });

    /* --- Hinweis unter der Grafik --- */
    behaelter.append(h("p", "sonnensystem-tipp", "Klick auf Sonne, Planeten, Mond oder Asteroidengürtel"));

    /* -------------------------------------------------------------------
       Zustand
       ------------------------------------------------------------------- */
    var tag = tageSeitJ2000(Date.now());
    var zeitFaktor = 1;
    var kamera = { x: 0, y: 0, w: GESAMT };
    var auswahl = null;
    var hover = null;
    var svgBreite = svg.clientWidth || 480;
    var letzteZeit = null;
    var laeuft = false;
    var sichtbar = true;

    /* -------------------------------------------------------------------
       Bewegung und Zeichnen
       ------------------------------------------------------------------- */
    function aktualisierePositionen() {
      KOERPER.forEach(function (k) {
        if (k.guertel || !k.bahn) return;
        var w = (k.L0 + k.Ltag * tag) * GRAD;
        var basis = k.um ? nachId[k.um].pos : { x: 0, y: 0 };
        k.pos = { x: basis.x + k.bahn * Math.cos(w), y: basis.y - k.bahn * Math.sin(w) };
      });
    }

    function zeichne() {
      KOERPER.forEach(function (k) {
        if (!k.element) return;
        k.element.setAttribute("transform", "translate(" + k.pos.x.toFixed(3) + " " + k.pos.y.toFixed(3) + ")");
        if (k.schatten) {
          /* Nachtseite zeigt von der Sonne weg */
          var w = Math.atan2(k.pos.y, k.pos.x) / GRAD;
          k.schatten.setAttribute("transform", "rotate(" + w.toFixed(2) + ")");
        }
      });

      var erde = nachId.erde.pos;
      var verschiebung = "translate(" + erde.x.toFixed(3) + " " + erde.y.toFixed(3) + ")";
      mondBahnGruppe.setAttribute("transform", verschiebung);
      mondTrefferGruppe.setAttribute("transform", verschiebung);

      var klein = "", gross = "";
      asteroiden.forEach(function (a) {
        var w = (a.L0 + a.Ltag * tag) * GRAD;
        var stueck = "M" + (a.r * Math.cos(w)).toFixed(2) + " " + (-a.r * Math.sin(w)).toFixed(2) + "h0";
        if (a.gross) gross += stueck; else klein += stueck;
      });
      pfadKlein.setAttribute("d", klein);
      pfadGross.setAttribute("d", gross);

      svg.setAttribute("viewBox",
        (kamera.x - kamera.w / 2).toFixed(3) + " " + (kamera.y - kamera.w / 2).toFixed(3) + " " +
        kamera.w.toFixed(3) + " " + kamera.w.toFixed(3));

      /* Namensschild neben dem Körper unter der Maus (Größe bleibt in Pixeln gleich).
         Normalerweise rechts vom Körper; würde es dort über den Bildrand ragen
         (z. B. Neptun ganz rechts), kommt es auf die linke Seite. */
      if (hover) {
        var proPixel = kamera.w / svgBreite;
        var schrift = 13 * proPixel;
        var abstand = hover.guertel ? 0 : hover.radius + 5 * proPixel;
        var mitte = hover.guertel ? { x: 64, y: -110 } : hover.pos;
        namensschild.textContent = hover.name;
        namensschild.setAttribute("font-size", schrift.toFixed(3));
        namensschild.setAttribute("stroke-width", (3 * proPixel).toFixed(3));
        namensschild.style.display = "";
        var breite = 0;
        try { breite = namensschild.getComputedTextLength(); } catch (e) {}
        if (!breite) breite = hover.name.length * schrift * 0.6;   // Schätzung, falls Messen scheitert
        var rand = 6 * proPixel;
        var rechts = kamera.x + kamera.w / 2 - rand, links = kamera.x - kamera.w / 2 + rand;
        var oben = kamera.y - kamera.w / 2 + rand, unten = kamera.y + kamera.w / 2 - rand;
        var x = mitte.x + abstand;
        if (x + breite > rechts) x = mitte.x - abstand - breite;  // nach links ausweichen
        x = Math.max(links, Math.min(x, rechts - breite));
        var y = Math.max(oben + schrift * 0.8, Math.min(mitte.y + 4 * proPixel, unten));
        namensschild.setAttribute("x", x.toFixed(2));
        namensschild.setAttribute("y", y.toFixed(2));
      } else {
        namensschild.style.display = "none";
      }
    }

    function schritt(jetzt) {
      if (!laeuft) return;
      var dt = letzteZeit === null ? 0 : Math.min((jetzt - letzteZeit) / 1000, 0.1);
      letzteZeit = jetzt;

      /* Zeit: beim Hineinzoomen weich auf Zeitlupe abbremsen */
      var zielFaktor = auswahl ? ZEITLUPE : 1;
      zeitFaktor += (zielFaktor - zeitFaktor) * (1 - Math.exp(-dt * 3));
      if (!wenigBewegung) tag += dt * TAGE_PRO_SEKUNDE * zeitFaktor;

      aktualisierePositionen();

      /* Kamera folgt dem ausgewählten Körper (Zoom logarithmisch geglättet) */
      var ziel = auswahl && !auswahl.guertel ? auswahl.pos : { x: 0, y: 0 };
      var zielBreite = auswahl ? auswahl.zoom : GESAMT;
      var fPos = wenigBewegung ? 1 : 1 - Math.exp(-dt * 6);
      var fZoom = wenigBewegung ? 1 : 1 - Math.exp(-dt * 3.2);
      kamera.x += (ziel.x - kamera.x) * fPos;
      kamera.y += (ziel.y - kamera.y) * fPos;
      kamera.w = Math.exp(Math.log(kamera.w) + (Math.log(zielBreite) - Math.log(kamera.w)) * fZoom);

      zeichne();
      requestAnimationFrame(schritt);
    }

    function starte() {
      if (laeuft || !sichtbar || document.hidden) return;
      laeuft = true;
      letzteZeit = null;
      requestAnimationFrame(schritt);
    }
    function stoppe() { laeuft = false; }

    /* -------------------------------------------------------------------
       Auswahl, Hover, Infokasten
       ------------------------------------------------------------------- */
    function setzeHover(k) {
      if (hover && bahnElement[hover.id]) bahnElement[hover.id].classList.remove("hover");
      hover = k;
      if (hover && bahnElement[hover.id]) bahnElement[hover.id].classList.add("hover");
    }

    function markiereAuswahl() {
      Object.keys(bahnElement).forEach(function (id) {
        bahnElement[id].classList.toggle("aktiv", !!auswahl && auswahl.id === id);
      });
    }

    function mitUebergang(aenderung) {
      if (document.startViewTransition && !wenigBewegung) {
        document.startViewTransition(aenderung);
      } else {
        aenderung();
      }
    }

    function zeigeInfo(k) {
      info.innerHTML = "";

      var schliessen = h("button", "info-schliessen", "×");
      schliessen.type = "button";
      schliessen.setAttribute("aria-label", "Zurück zur Übersicht");
      schliessen.addEventListener("click", beende);

      var titel = h("h2");
      var punkt = h("span", "info-punkt");
      punkt.style.background = "radial-gradient(circle at 35% 35%, " + k.farben[0] + ", " + k.farben[1] + ")";
      titel.append(punkt, document.createTextNode(k.name));

      var daten = h("dl", "info-daten");
      k.daten.forEach(function (paar) {
        var zelle = h("div", "kennzahl");
        zelle.append(h("dt", null, paar[0]), h("dd", null, paar[1]));
        daten.append(zelle);
      });

      var fakten = h("ul", "info-fakten");
      k.fakten.forEach(function (f) { fakten.append(h("li", null, f)); });

      info.append(schliessen, h("p", "oberzeile", k.art), titel, h("p", "info-kurz", k.kurz),
                  daten, h("h3", null, "Wusstest du?"), fakten);

      /* Verweise auf Themenseiten – nur, wenn sie schon online sind */
      var ziele = [];
      (k.themen || []).forEach(function (id) {
        var t = findeThema(id);
        if (t && t.status === "online") ziele.push(t);
      });
      if (ziele.length > 0) {
        var kasten = h("div", "info-links");
        kasten.append(h("h3", null, "Mehr dazu"));
        var liste = h("ul");
        ziele.forEach(function (z) {
          var li = h("li");
          var a = h("a", null, z.titel);
          a.href = z.datei;
          li.append(a);
          liste.append(li);
        });
        kasten.append(liste);
        info.append(kasten);
      }

      /* Blättern */
      var n = KOERPER.length, i = KOERPER.indexOf(k);
      var vorher = KOERPER[(i - 1 + n) % n], nachher = KOERPER[(i + 1) % n];
      var nav = h("div", "info-nav");
      var zurueck = h("button", null, "← " + vorher.name);
      var weiter = h("button", null, nachher.name + " →");
      zurueck.type = weiter.type = "button";
      zurueck.addEventListener("click", function () { waehle(vorher.id); });
      weiter.addEventListener("click", function () { waehle(nachher.id); });
      nav.append(zurueck, weiter);
      info.append(nav);

      info.append(h("p", "info-fussnote",
        "Im Modell sind Größen und Abstände nicht maßstabsgetreu – die Umlaufzeiten stehen aber im echten Verhältnis zueinander."));

      /* Einblend-Animation neu starten */
      info.classList.remove("neu");
      void info.offsetWidth;
      info.classList.add("neu");
    }

    function waehle(id) {
      var k = nachId[id];
      if (!k) return;
      if (auswahl === k) return;
      var warGeschlossen = !auswahl;
      var aenderung = function () {
        auswahl = k;
        hero.classList.add("erkunden");
        zeigeInfo(k);
        markiereAuswahl();
      };
      if (warGeschlossen) mitUebergang(aenderung); else aenderung();
    }

    function beende() {
      if (!auswahl) return;
      var vorher = auswahl;
      var fokusImKasten = info.contains(document.activeElement);
      mitUebergang(function () {
        auswahl = null;
        hero.classList.remove("erkunden");
        markiereAuswahl();
      });
      if (fokusImKasten) {
        var ziel = svg.querySelector('[data-id="' + vorher.id + '"][tabindex]');
        if (ziel) ziel.focus();
      }
    }

    function blaettere(richtung) {
      if (!auswahl) return;
      var n = KOERPER.length, i = KOERPER.indexOf(auswahl);
      waehle(KOERPER[(i + richtung + n) % n].id);
    }

    /* -------------------------------------------------------------------
       Ereignisse
       ------------------------------------------------------------------- */
    function idAus(ziel) {
      var e = ziel && ziel.closest ? ziel.closest("[data-id]") : null;
      return e ? e.getAttribute("data-id") : null;
    }

    svg.addEventListener("pointerover", function (ev) {
      var id = idAus(ev.target);
      setzeHover(id ? nachId[id] : null);
    });
    svg.addEventListener("pointerleave", function () { setzeHover(null); });
    svg.addEventListener("focusin", function (ev) {
      var id = idAus(ev.target);
      if (id) setzeHover(nachId[id]);
    });
    svg.addEventListener("focusout", function () { setzeHover(null); });

    svg.addEventListener("click", function (ev) {
      var id = idAus(ev.target);
      if (id) waehle(id);
      else beende();
    });
    svg.addEventListener("keydown", function (ev) {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      var id = idAus(ev.target);
      if (!id) return;
      ev.preventDefault();
      waehle(id);
    });
    document.addEventListener("keydown", function (ev) {
      if (!auswahl) return;
      var elementTyp = ev.target && ev.target.tagName;
      if (elementTyp === "INPUT" || elementTyp === "TEXTAREA") return;
      if (ev.key === "Escape") beende();
      else if (ev.key === "ArrowRight") blaettere(1);
      else if (ev.key === "ArrowLeft") blaettere(-1);
    });

    /* Größe merken (für pixelgenaue Beschriftung) */
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { svgBreite = svg.clientWidth || svgBreite; }).observe(svg);
    }

    /* Nur rechnen, wenn das Modell zu sehen ist */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (eintraege) {
        sichtbar = eintraege[0].isIntersecting;
        if (sichtbar) starte(); else stoppe();
      }).observe(svg);
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stoppe(); else starte();
    });

    aktualisierePositionen();
    zeichne();
    starte();
  }

  document.addEventListener("DOMContentLoaded", baue);
})();
