/* =========================================================================
   INTERAKTIVES UNIVERSUM – Größenverhältnisse (themen/universum/groessenverhaeltnisse.html)
   =========================================================================
   Logarithmischer Zoom über 42 Zehnerpotenzen: vom Proton (10^-15 m) bis
   zum beobachtbaren Universum (10^27 m). Braucht extern/three/three.min.js
   und js/universum/drei-bausteine.js.

   IDEE DES MASSSTABS
   z = log10(Bildbreite in Metern). Die Szene wird jedes Bild neu skaliert:
   ein Meter sind s = 10 / 10^z Szenen-Einheiten, die Kamera schaut immer
   auf den Ursprung, und alle Körper werden relativ zum aktuellen Fokus
   verschoben ((pos − fokus) · s). So bleibt three.js immer im Bereich
   0,01 … 10 000 Einheiten, obwohl die echten Größen 42 Zehnerpotenzen
   überspannen. Positionen in Metern (doppelte Genauigkeit in JS).

   Alles ist ineinander geschachtelt wie bei „Powers of Ten“: das Proton
   im Ursprung, darum die Elektronenwolke, die DNA, die Zelle in der
   Fingerspitze, der Mensch auf der Erde … Der Fokus gleitet zwischen den
   Stationen von einem Mittelpunkt zum nächsten (fokusBei).

   Farben: CSS-Variablen --uni-* in css/teile/variablen.css.
   Neue Station: Eintrag in STATIONEN (nach z sortiert) + ggf. Körper in
   KOERPER und Schilder in SCHILDER.
   ========================================================================= */
(function () {
  "use strict";
  var THREE = window.THREE, U = window.Universum3D;

  /* ---------------------------------------------------------------------
     Vektoren in Metern (Arrays, doppelte Genauigkeit)
     --------------------------------------------------------------------- */
  function plus(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mal(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function laenge(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); }
  function einheitV(a) { return mal(a, 1 / laenge(a)); }
  function kreuz(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function weg(a, b) { return laenge(plus(b, mal(a, -1))); }
  function mische(a, b, t) { return plus(a, mal(plus(b, mal(a, -1)), t)); }

  /* ---------------------------------------------------------------------
     Echte Größen und Lagen (alle Werte in Metern)
     --------------------------------------------------------------------- */
  var AE = 1.495979e11, LJ = 9.4607e15;
  var R_ERDE = 6.371e6, R_MOND = 1.7374e6, R_SONNE = 6.957e8, A0 = 5.29e-11;
  var O = [0, 0, 0];                                   // Proton = Ursprung
  var VIRUS = [0.12e-6, 0.06e-6, -0.04e-6];            // schwebt neben der DNA
  var ZELLE = [-1.5e-6, 0.8e-6, 0.6e-6];               // Zellkern-Mitte = Ursprung
  var SAND = plus(ZELLE, [0.32e-3, 0.27e-3, 0.06e-3]); // Sandkorn auf der Haut
  var FINGER = [0.31, 0.70, 0.06];                     // Fingerspitze (Mensch-Koordinaten)
  var MENSCH = mal(FINGER, -1);                        // Füße des Menschen
  var MENSCH_MITTE = plus(MENSCH, [0, 0.9, 0]);
  var ERDE = plus(MENSCH, [0, -R_ERDE, 0]);            // der Mensch steht „oben“
  /* Sonne ~35° über dem Horizont des Menschen; die Erdbahnebene enthält
     die Sonnenrichtung und ist so wenig wie möglich gekippt */
  var D_SONNE = einheitV([0.8, 0.55, 0.0]);
  var N_EKL = einheitV(plus([0, 1, 0], mal(D_SONNE, -D_SONNE[1])));
  var SONNE = plus(ERDE, mal(D_SONNE, AE));
  var E1 = mal(D_SONNE, -1), E2 = kreuz(N_EKL, E1);    // Basis der Bahnebene (Sonne → Erde = E1)
  function bahn(r, phi) { return plus(mal(E1, r * Math.cos(phi)), mal(E2, r * Math.sin(phi))); }
  var MOND = plus(ERDE, mal(einheitV(bahn(1, 1.9)), 3.844e8));
  /* Mars so auf seine Bahn gesetzt, dass er gerade den mittleren Abstand
     von 225 Mio. km zur Erde hat (Kosinussatz) */
  var MARS_WINKEL = Math.acos((1 + 1.524 * 1.524 - Math.pow(2.25e11 / AE, 2)) / (2 * 1.524));
  var MARS = plus(SONNE, bahn(1.524 * AE, MARS_WINKEL));
  var LICHTTAG = 2.998e8 * 86400;                       // 173 AE – Voyager 1 Ende 2026
  var VOYAGER = plus(SONNE, mal(einheitV(plus(bahn(1, 2.6), mal(N_EKL, 0.7))), LICHTTAG));
  var PROXIMA = plus(SONNE, mal(himmelsRichtung(14.495, -62.68), 4.24 * LJ));
  var D_GAL = einheitV([-0.8, 0, -0.6]);
  var GALAXIS = plus(SONNE, mal(D_GAL, 2.46e20));       // 26 000 Lj zum Zentrum
  var D_AND = einheitV([0.55, 0.35, 0.76]);
  var ANDROMEDA = plus(GALAXIS, mal(D_AND, 2.37e22));   // 2,5 Mio. Lj
  var M33 = plus(ANDROMEDA, mal(einheitV([-0.6, -0.3, 0.5]), 7.3e21));
  var LMC = plus(GALAXIS, mal(einheitV([0.2, -0.9, 0.4]), 1.5e21));
  var SMC = plus(GALAXIS, mal(einheitV([0.35, -0.85, 0.25]), 1.9e21));
  var LOKAL = plus(GALAXIS, mal(D_AND, 0.45 * 2.37e22)); // Schwerpunkt der Lokalen Gruppe
  var D_VIRGO = einheitV([-0.3, 0.25, 0.92]);
  var D_ATTR = einheitV([-0.5, -0.2, 0.84]);
  var VIRGO = plus(LOKAL, mal(D_VIRGO, 5.1e23));        // 54 Mio. Lj
  var ATTRAKTOR = plus(LOKAL, mal(D_ATTR, 2.2e24));     // ~230 Mio. Lj
  var NETZ_MITTE = plus(LOKAL, mal(D_ATTR, 1.2e24));
  var R_UNIVERSUM = 4.4e26;                              // 46,5 Mrd. Lj

  var Z_MIN = -14.9, Z_MAX = 27.6;
  var K = 10;  // Szenen-Einheiten je Bildbreite

  /* ---------------------------------------------------------------------
     Stationen (nach z sortiert). z = log10(Bildbreite) für eine gute
     Ansicht, neigung = Blickwinkel von oben in Grad.
     --------------------------------------------------------------------- */
  var STATIONEN = [
    { id: "proton", titel: "Proton", reich: "Mikrokosmos", z: -14.55, fokus: O, neigung: 18,
      groesse: 1.7e-15, groesseText: "Durchmesser ≈ 1,7 Femtometer",
      text: "Ganz unten auf der Leiter: ein Proton, der Kern des Wasserstoffatoms. Es besteht aus drei Quarks – zwei up-Quarks und einem down-Quark –, die von der starken Kernkraft zusammengehalten werden. Die Kugeln sind nur ein Bild: Quarks sind, soweit wir wissen, punktförmig.",
      fakt: "Die drei Quarks bringen nur rund 1 % der Protonmasse mit. Der Rest steckt in der Bewegungs- und Feldenergie im Inneren – E = mc² in Aktion." },
    { id: "atom", titel: "Wasserstoffatom", reich: "Mikrokosmos", z: -9.55, fokus: O, neigung: 20,
      groesse: 1.06e-10, groesseText: "Durchmesser ≈ 0,1 Nanometer",
      text: "Das Proton ist jetzt ein winziger Punkt in der Mitte einer Wolke. Sie zeigt, wo man das Elektron antreffen kann – einen festen Ort hat es nicht. Das Atom ist rund 60 000-mal so breit wie sein Kern.",
      fakt: "Wäre der Atomkern so groß wie ein Fußball, wäre das Atom fast 14 km breit – und dazwischen nichts als leerer Raum." },
    { id: "dna", titel: "DNA-Doppelhelix", reich: "Mikrokosmos", z: -8.05, fokus: O, neigung: 12,
      groesse: 2e-9, groesseText: "Breite ≈ 2 Nanometer",
      text: "Atome bilden Moleküle. In der DNA steht der Bauplan deines Körpers: zwei Stränge, zur Doppelhelix verdreht und durch Basenpaare verbunden. Unser Wasserstoffatom ist Teil einer Wasserstoffbrücke zwischen zwei Basen – solche Brücken halten die Stränge zusammen.",
      fakt: "Die DNA einer einzigen Zelle wäre ausgerollt rund 2 Meter lang – und passt doch in einen Zellkern von wenigen Mikrometern." },
    { id: "virus", titel: "Virus", reich: "Mikrokosmos", z: -6.75, fokus: VIRUS, neigung: 18,
      groesse: 1e-7, groesseText: "Durchmesser ≈ 100 Nanometer",
      text: "Zum Vergleich schwebt hier ein Coronavirus mit seinen Stacheln. Viren sind so klein, dass ein Lichtmikroskop sie nicht mehr scharf zeigt: Seine Auflösungsgrenze liegt bei etwa 200 nm, rund der halben Wellenlänge des sichtbaren Lichts.",
      fakt: "Ein Virus ist rund 50-mal so breit wie die DNA-Doppelhelix – und etwa 200-mal kleiner als eine menschliche Zelle." },
    { id: "zelle", titel: "Menschliche Zelle", reich: "Unsere Welt", z: -4.35, fokus: ZELLE, neigung: 24,
      groesse: 2e-5, groesseText: "Durchmesser ≈ 20 Mikrometer",
      text: "Die DNA liegt im Zellkern, der Kommandozentrale der Zelle. Drumherum schwimmen Mitochondrien, die Kraftwerke der Zelle, alles umhüllt von der Zellmembran. Diese Zelle sitzt in der Haut deiner Fingerspitze.",
      fakt: "Dein Körper besteht aus rund 30 Billionen Zellen. Eine Zelle ist etwa 10 000-mal so breit wie die DNA-Doppelhelix." },
    { id: "sandkorn", titel: "Sandkorn", reich: "Unsere Welt", z: -2.85, fokus: SAND, neigung: 30,
      groesse: 5e-4, groesseText: "Durchmesser ≈ 0,5 Millimeter",
      text: "Ein Sandkorn auf deiner Haut – darunter liegen Hunderte Hautzellen. Sandkörner sind zwischen 0,06 und 2 mm groß. Das bloße Auge erkennt Dinge ab etwa 0,1 mm: ein Sandkorn siehst du gerade noch, eine Zelle nicht mehr.",
      fakt: "Ein Sandkorn dieser Größe ist rund 25 Hautzellen breit." },
    { id: "mensch", titel: "Du", reich: "Unsere Welt", z: 0.55, fokus: MENSCH_MITTE, neigung: 9,
      groesse: 1.75, groesseText: "Größe ≈ 1,75 Meter",
      text: "Das bist du – ungefähr in der Mitte der Leiter. Bis zum Proton sind es rund 15 Zehnerpotenzen nach unten, bis zum Rand des beobachtbaren Universums knapp 27 nach oben. Zoom heraus und schau zu, wie aus der Wiese unter dir eine Landschaft und schließlich ein Planet wird.",
      fakt: "Ein Mensch besteht aus etwa 7 · 10²⁷ Atomen – mehr als es Sterne im beobachtbaren Universum gibt." },
    { id: "erde", titel: "Erde", reich: "Sonnensystem", z: 7.5, fokus: ERDE, neigung: 18,
      groesse: 1.2742e7, groesseText: "Durchmesser = 12 742 km",
      text: "Von weit oben werden aus Feldern und Wäldern Kontinente, und der Horizont krümmt sich zur Kugel. Die Luftschicht, in der alles Wetter passiert, ist nur gut 10 km dick – im Vergleich zur Erde dünner als die Schale eines Apfels.",
      fakt: "Die Internationale Raumstation fliegt nur rund 400 km hoch – gerade einmal 3 % des Erddurchmessers über dem Boden.",
      link: { id: "gravitation", text: "Gravitation" } },
    { id: "mond", titel: "Mond", reich: "Sonnensystem", z: 8.75, fokus: mische(ERDE, MOND, 0.5), neigung: 55,
      groesse: 3.844e8, groesseText: "Abstand ≈ 384 400 km",
      text: "Der Mond ist im Mittel 384 400 km entfernt – rund 30 Erddurchmesser. Er hat etwa ein Viertel des Erddurchmessers. Im richtigen Maßstab liegen die beiden viel weiter auseinander, als die meisten Bilder es zeigen.",
      fakt: "Licht braucht knapp 1,3 Sekunden bis zum Mond – die Apollo-Astronauten waren etwa drei Tage unterwegs.",
      link: { id: "gravitation", text: "Gravitation" } },
    { id: "mars", titel: "Mars", reich: "Sonnensystem", z: 11.72, fokus: SONNE, neigung: 55,
      groesse: 2.25e11, groesseText: "Abstand ≈ 225 Mio. km (im Mittel)",
      text: "Mars ist im Mittel rund 225 Millionen km von der Erde entfernt – je nachdem, wo die beiden auf ihren Bahnen stehen, zwischen etwa 55 und 400 Millionen km. Hier taucht auch die Sonne auf: 109-mal so breit wie die Erde und 150 Millionen km entfernt (1 Astronomische Einheit, AE).",
      fakt: "Ein Funksignal zum Mars ist je nach Stellung der Planeten 3 bis 22 Minuten unterwegs.",
      link: { id: "kepler", text: "Keplersche Gesetze" } },
    { id: "voyager", titel: "Voyager 1", reich: "Sonnensystem", z: 13.5, fokus: mische(SONNE, VOYAGER, 0.5), neigung: 30,
      groesse: LICHTTAG, groesseText: "Abstand ≈ 173 AE (1 Lichttag)",
      text: "Die Raumsonde Voyager 1 ist das am weitesten entfernte Objekt, das Menschen je gebaut haben. 1977 gestartet, fliegt sie mit rund 17 km/s aus dem Sonnensystem hinaus. 2012 hat sie die Heliopause durchquert – die Grenze, an der der Sonnenwind endet.",
      fakt: "Ende 2026 ist Voyager 1 einen Lichttag von uns entfernt: Ein Funkbefehl ist 24 Stunden unterwegs – und die Antwort noch einmal 24." },
    { id: "proxima", titel: "Proxima Centauri", reich: "Milchstraße", z: 16.72, fokus: mische(SONNE, PROXIMA, 0.5), neigung: 20,
      groesse: 4.24 * LJ, groesseText: "Abstand = 4,24 Lichtjahre",
      text: "Proxima Centauri ist der Stern, der der Sonne am nächsten liegt: 4,24 Lichtjahre oder rund 40 Billionen km. Ein kleiner roter Zwerg, der zum Alpha-Centauri-System gehört. Um die Sonne liegt die Oortsche Wolke, eine riesige Hülle aus eisigen Brocken – die Heimat vieler Kometen.",
      fakt: "Wäre die Sonne ein Sandkorn von 0,5 mm, läge Proxima Centauri rund 14 km entfernt. Voyager 1 bräuchte für die Strecke etwa 75 000 Jahre.",
      link: { id: "sternentwicklung", text: "Sternentwicklung" } },
    { id: "milchstrasse", titel: "Milchstraße", reich: "Milchstraße", z: 21.12, fokus: GALAXIS, neigung: 50,
      groesse: 1e5 * LJ, groesseText: "Durchmesser: über 100 000 Lichtjahre",
      text: "Unsere Galaxie: eine flache Scheibe aus 100 bis 400 Milliarden Sternen mit Spiralarmen und einem Balken in der Mitte. Die Sonne liegt etwa 26 000 Lichtjahre vom Zentrum entfernt. Dort sitzt ein Schwarzes Loch mit rund 4 Millionen Sonnenmassen.",
      fakt: "Für einen Umlauf um das Zentrum braucht die Sonne rund 230 Millionen Jahre – seit es Dinosaurier gibt, ungefähr einmal.",
      link: { id: "sternleichen", text: "Sternleichen und Schwarze Löcher" } },
    { id: "lokale-gruppe", titel: "Lokale Gruppe", reich: "Kosmos", z: 22.5, fokus: LOKAL, neigung: 42,
      groesse: 1e7 * LJ, groesseText: "Durchmesser ≈ 10 Mio. Lichtjahre",
      text: "Die Milchstraße hat Nachbarn: die Andromeda-Galaxie, 2,5 Millionen Lichtjahre entfernt, die kleinere Dreiecksgalaxie und Dutzende Zwerggalaxien wie die Magellanschen Wolken. Zusammen bilden sie die Lokale Gruppe.",
      fakt: "Andromeda kommt mit rund 110 km/s auf uns zu. Ob die beiden Galaxien in einigen Milliarden Jahren verschmelzen, ist nach neuen Messungen offen." },
    { id: "virgo", titel: "Virgo-Superhaufen", reich: "Kosmos", z: 24.15, fokus: VIRGO, neigung: 30,
      groesse: 1.1e8 * LJ, groesseText: "Durchmesser ≈ 110 Mio. Lichtjahre",
      text: "Die Lokale Gruppe ist nur ein kleines Grüppchen am Rand eines viel größeren Verbunds: des Virgo-Superhaufens mit über 100 Galaxiengruppen und -haufen. In seiner Mitte liegt der Virgo-Haufen mit weit über 1 000 Galaxien, rund 54 Millionen Lichtjahre entfernt. Jeder Punkt ist hier eine ganze Galaxie (stark vergrößert).",
      fakt: "Licht vom Virgo-Haufen ist 54 Millionen Jahre zu uns unterwegs – es startete gut 10 Millionen Jahre nach dem Aussterben der Dinosaurier." },
    { id: "laniakea", titel: "Laniakea-Superhaufen", reich: "Kosmos", z: 25.0, fokus: NETZ_MITTE, neigung: 24,
      groesse: 5.2e8 * LJ, groesseText: "Durchmesser ≈ 520 Mio. Lichtjahre",
      text: "Galaxien sammeln sich in Haufen, die durch lange Fäden verbunden sind; dazwischen liegen riesige, fast leere Blasen. Der Virgo-Superhaufen ist Teil von Laniakea. Seine Grenze ist durch die Bewegung der Galaxien festgelegt: Innerhalb von Laniakea strömen alle auf den „Großen Attraktor“ zu – die wandernden Lichtpunkte zeigen diese Strömung, stark beschleunigt. Die Fäden sind ein Modell, keine Karte.",
      fakt: "„Laniakea“ ist Hawaiianisch und bedeutet „unermesslicher Himmel“." },
    { id: "universum", titel: "Beobachtbares Universum", reich: "Kosmos", z: 27.25, fokus: ERDE, neigung: 18,
      groesse: 2 * R_UNIVERSUM, groesseText: "Durchmesser ≈ 93 Mrd. Lichtjahre",
      text: "Weiter können wir nicht sehen: Licht von noch weiter weg hatte seit dem Urknall vor 13,8 Milliarden Jahren nicht genug Zeit, uns zu erreichen. Weil sich das Universum seitdem ausgedehnt hat, liegt dieser Rand heute rund 46 Milliarden Lichtjahre entfernt. Die leuchtende Hülle steht für die kosmische Hintergrundstrahlung, das älteste Licht, das wir sehen.",
      fakt: "Das beobachtbare Universum ist eine Kugel mit dir im Mittelpunkt – für jeden Beobachter eine andere. Dahinter geht es vermutlich weiter." }
  ];

  /* Zusätzliche Blickwinkel zwischen den Stationen: beim Herauszoomen vom
     Menschen schaut die Kamera schräg auf die Landschaft (wie beim Steigflug) */
  var BLICKE = [{ z: 3.6, neigung: 22 }, { z: 5.6, neigung: 30 }];

  /* Vergleiche für die Bildbreite: [Name, Größe als Text, Meter] */
  var VERGLEICHE = [
    ["ein Proton", "1,7 fm", 1.7e-15], ["ein Urankern", "15 fm", 1.5e-14],
    ["Gammastrahlung (Wellenlänge)", "≈ 1 pm", 1e-12],
    ["ein Wasserstoffatom", "0,1 nm", 1.06e-10], ["ein Wassermolekül", "0,28 nm", 2.8e-10],
    ["ein Zuckermolekül", "≈ 1 nm", 9e-10], ["die DNA-Doppelhelix (Breite)", "2 nm", 2e-9],
    ["ein Hämoglobin-Molekül", "6,5 nm", 6.5e-9], ["ein Ribosom", "25 nm", 2.5e-8],
    ["ein Coronavirus", "100 nm", 1e-7], ["grünes Licht (Wellenlänge)", "530 nm", 5.3e-7],
    ["ein Bakterium (E. coli)", "2 µm", 2e-6], ["ein rotes Blutkörperchen", "7,5 µm", 7.5e-6],
    ["eine menschliche Zelle", "20 µm", 2e-5], ["ein Haar (Dicke)", "0,07 mm", 7e-5],
    ["ein Sandkorn", "0,5 mm", 5e-4], ["eine Ameise", "5 mm", 5e-3],
    ["ein Zuckerwürfel", "1,6 cm", 1.6e-2], ["ein Tennisball", "6,7 cm", 6.7e-2],
    ["ein Fußball", "22 cm", 0.22], ["ein Mensch", "1,75 m", 1.75], ["ein Linienbus", "12 m", 12],
    ["ein Blauwal", "25 m", 25], ["ein Fußballfeld", "105 m", 105], ["der Eiffelturm", "330 m", 330],
    ["der Burj Khalifa", "828 m", 828], ["der Mount Everest (Höhe)", "8,8 km", 8849],
    ["der Bodensee (Länge)", "63 km", 6.3e4], ["die Flughöhe der ISS", "≈ 400 km", 4e5],
    ["Deutschland (Nord–Süd)", "≈ 880 km", 8.8e5], ["der Mond", "3 474 km", 3.474e6],
    ["die Erde", "12 742 km", 1.2742e7], ["Jupiter", "139 820 km", 1.398e8],
    ["der Abstand Erde–Mond", "384 400 km", 3.844e8], ["die Sonne", "1,39 Mio. km", 1.3927e9],
    ["der Abstand Erde–Sonne", "1 AE", AE], ["der Riesenstern Beteigeuze", "≈ 7 AE", 1.0e12],
    ["die Neptunbahn", "60 AE", 9e12], ["der Abstand zu Voyager 1", "≈ 173 AE", 2.59e13],
    ["ein Lichtjahr", "9,46 Billionen km", LJ], ["der Abstand zu Alpha Centauri", "4,4 Lj", 4.13e16],
    ["der Abstand zu Sirius", "8,6 Lj", 8.1e16], ["der Orionnebel", "≈ 24 Lj", 2.3e17],
    ["der Kugelsternhaufen Omega Centauri", "≈ 170 Lj", 1.6e18],
    ["der Abstand zu den Plejaden", "444 Lj", 4.2e18], ["der Abstand zum Orionnebel", "1 344 Lj", 1.27e19],
    ["der Abstand zum Zentrum der Milchstraße", "26 000 Lj", 2.46e20],
    ["die Milchstraße", "100 000 Lj", 9.5e20], ["der Abstand zu Andromeda", "2,5 Mio. Lj", 2.37e22],
    ["die Lokale Gruppe", "≈ 10 Mio. Lj", 9.5e22], ["der Abstand zum Virgo-Haufen", "54 Mio. Lj", 5.1e23],
    ["der Laniakea-Superhaufen", "520 Mio. Lj", 4.9e24],
    ["das beobachtbare Universum", "93 Mrd. Lj", 8.8e26]
  ];

  /* Planeten: Name, Bahnradius in AE, Farbe, Winkel auf der Bahn (frei
     gewählt – die Stellung entspricht keinem bestimmten Datum) */
  var PLANETEN = [
    ["Merkur", 0.387, "merkur", 2.2], ["Venus", 0.723, "venus", 4.0], ["Erde", 1.0, "erde", 0],
    ["Mars", 1.524, "mars", MARS_WINKEL], ["Jupiter", 5.203, "jupiter", 3.3], ["Saturn", 9.537, "saturn", 5.2],
    ["Uranus", 19.19, "uranus", 0.8], ["Neptun", 30.07, "neptun", 2.6]
  ];

  /* Nachbarsterne: Name, Rektaszension (h), Deklination (°), Abstand (Lj), Farbe */
  var STERNE = [
    ["Proxima Centauri", 14.495, -62.68, 4.24, "stern-m"],
    ["Alpha Centauri", 14.66, -60.83, 4.37, "stern-g"], ["Barnards Pfeilstern", 17.96, 4.69, 5.96, "stern-m"],
    ["Wolf 359", 10.94, 7.01, 7.86, "stern-m"], ["Lalande 21185", 11.06, 35.97, 8.31, "stern-m"],
    ["Sirius", 6.75, -16.72, 8.60, "stern-a"], ["Ross 154", 18.83, -23.84, 9.69, "stern-m"],
    ["Epsilon Eridani", 3.55, -9.46, 10.47, "stern-k"], ["Procyon", 7.66, 5.22, 11.46, "stern-f"],
    ["61 Cygni", 21.12, 38.75, 11.40, "stern-k"], ["Tau Ceti", 1.73, -15.94, 11.91, "stern-g"],
    ["Epsilon Indi", 22.05, -56.79, 11.87, "stern-k"]
  ];
  function himmelsRichtung(ra, dek) {
    var a = ra / 24 * 2 * Math.PI, d = dek * Math.PI / 180;
    return [Math.cos(d) * Math.cos(a), Math.sin(d), -Math.cos(d) * Math.sin(a)];
  }

  /* ---------------------------------------------------------------------
     Bausteine für die Körper
     --------------------------------------------------------------------- */
  var F = function (n) { return U.farbe(n); };
  var schmal = window.matchMedia && window.matchMedia("(max-width: 52rem)").matches;
  function anzahl(n) { return schmal ? Math.round(n * 0.55) : n; }

  function blickFlaeche(groesse, mat) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(groesse, groesse), mat);
    m.userData.blick = true;
    return m;
  }
  function standard(farbe, opt) {
    opt = opt || {};
    return new THREE.MeshStandardMaterial({
      color: farbe, roughness: opt.rau === undefined ? 0.45 : opt.rau, metalness: 0.05,
      emissive: opt.leuchten ? farbe.clone().multiplyScalar(opt.leuchten) : new THREE.Color(0, 0, 0),
      transparent: true, flatShading: !!opt.flach
    });
  }
  function kugelPunkt(r) {   // gleichverteilt in der Einheitskugel
    var x, y, z;
    do { x = r() * 2 - 1; y = r() * 2 - 1; z = r() * 2 - 1; } while (x * x + y * y + z * z > 1);
    return [x, y, z];
  }
  function richtung(r) { var p = kugelPunkt(r); return einheitV(p[0] === 0 && p[1] === 0 && p[2] === 0 ? [1, 0, 0] : p); }

  /* ---------- Proton: drei Quarks im Gluonenfeld ---------- */
  function bauProton() {
    var g = new THREE.Group();
    var feld = new THREE.Mesh(new THREE.SphereGeometry(0.85, 64, 48),
      U.glanzMaterial({ farbe: F("proton-feld"), farbe2: F("violett"), rand: 1.1, kern: 0.05, rausch: 2.6, wabern: 0.07 }));
    g.add(feld);
    g.add(blickFlaeche(2.2, U.blickMaterial({ farbe: F("proton-feld"), farbe2: F("violett"), potenz: 2.4, staerke: 0.35 })));
    var namen = ["quark-rot", "quark-gruen", "quark-blau"];
    var quarks = [], kerne = [], scheine = [];
    for (var i = 0; i < 3; i++) {
      var q = new THREE.Group();
      var kernMat = new THREE.MeshBasicMaterial({ color: F(namen[i]), transparent: true });
      var schein = U.blickMaterial({ farbe: new THREE.Color(1, 1, 1), farbe2: F(namen[i]), potenz: 1.8, staerke: 1.0 });
      q.add(new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), kernMat));
      q.add(blickFlaeche(0.75, schein));
      g.add(q); quarks.push(q); kerne.push(kernMat); scheine.push(schein);
    }
    var gluonen = U.punkteWolke(3 * 90, { funkeln: 0.35, max: 30 });
    var r = U.zufall(11), wei = new THREE.Color(1, 1, 1);
    for (i = 0; i < 270; i++) gluonen.userData.setze(0, 0, 0, wei.clone().lerp(F("proton-feld"), 0.5), 0.022 + 0.02 * r(), r());
    gluonen.userData.fertig();
    g.add(gluonen);
    var see = U.punkteWolke(320, { funkeln: 0.95, max: 24 });
    for (i = 0; i < 320; i++) {
      var p = kugelPunkt(r), c = F(namen[i % 3]).lerp(wei, 0.3);
      see.userData.setze(p[0] * 0.8, p[1] * 0.8, p[2] * 0.8, c, 0.025, r());
    }
    see.userData.fertig();
    g.add(see);
    g.userData.quarks = quarks;
    var farbe = namen.map(F);
    g.userData.jedesBild = function (ctx) {
      var t = ctx.zeit, i, k;
      for (i = 0; i < 3; i++) {
        var ph = i * 2.0944;
        quarks[i].position.set(
          0.34 * Math.cos(t * 0.8 + ph) + 0.06 * Math.sin(t * 2.3 + i),
          0.22 * Math.sin(t * 0.63 + ph * 1.3) + 0.05 * Math.cos(t * 1.9 + i),
          0.30 * Math.sin(t * 0.8 + ph) + 0.05 * Math.sin(t * 2.7 + 2 * i));
      }
      /* Farbladung wird ständig ausgetauscht: Farben wandern weiter */
      var schritt = Math.floor(t / 1.8) % 3;
      for (i = 0; i < 3; i++) {
        var f = farbe[(i + schritt) % 3];
        kerne[i].color.copy(f); scheine[i].uniforms.uFarbe2.value.copy(f);
      }
      /* Gluonen: Teilchenströme zwischen den Quarks */
      var arr = gluonen.geometry.attributes.position.array, n = 0;
      for (k = 0; k < 3; k++) {
        var a = quarks[k].position, b = quarks[(k + 1) % 3].position;
        for (i = 0; i < 90; i++) {
          var s = ((i / 90) + t * 0.35 * (k % 2 ? 1 : -1)) % 1;
          if (s < 0) s += 1;
          var w = Math.sin(s * Math.PI) * 0.06 * Math.sin(t * 5 + i * 0.7 + k);
          arr[n++] = a.x + (b.x - a.x) * s + w;
          arr[n++] = a.y + (b.y - a.y) * s + w * 0.7;
          arr[n++] = a.z + (b.z - a.z) * s - w * 0.5;
        }
      }
      gluonen.geometry.attributes.position.needsUpdate = true;
    };
    return g;
  }

  /* ---------- Wasserstoffatom: Elektronenwolke (1s-Zustand) ---------- */
  function bauAtom() {   // Einheit: Pikometer
    var g = new THREE.Group(), n = anzahl(9000);
    var wolke = U.punkteWolke(n, { funkeln: 0.85, max: 22 });
    var r = U.zufall(23), a0 = A0 / 1e-12, c1 = F("wolke"), c2 = F("blau");
    for (var i = 0; i < n; i++) {
      /* Abstand nach |ψ|² · r²: Gamma-Verteilung mit k = 3 */
      var rad = -(a0 / 2) * Math.log((1 - r()) * (1 - r()) * (1 - r()));
      var d = richtung(r);
      wolke.userData.setze(d[0] * rad, d[1] * rad, d[2] * rad, c1.clone().lerp(c2, r()), 1.5, r());
    }
    wolke.userData.fertig();
    g.add(wolke);
    g.add(blickFlaeche(a0 * 4.5, U.blickMaterial({ farbe: c1, farbe2: c2, potenz: 2.2, staerke: 0.3 })));
    return g;
  }

  /* ---------- DNA-Doppelhelix ---------- */
  function bauDNA() {   // Einheit: Nanometer
    var g = new THREE.Group();
    var N = 120, mitte = 60, steig = 0.34, dreh = 2 * Math.PI / 10.5, R = 1.0, versatz = 2.4;
    function strang(i, b) {
      var w = i * dreh + (b ? versatz : 0);
      return new THREE.Vector3((i - mitte) * steig, R * Math.cos(w), R * Math.sin(w));
    }
    var m0 = strang(mitte, 0).add(strang(mitte, 1)).multiplyScalar(0.5);
    m0.x = 0;
    var kugeln = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 14, 10), standard(new THREE.Color(1, 1, 1), { rau: 0.3 }), 4 * N);
    var staebe = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.085, 0.085, 1, 8), standard(new THREE.Color(1, 1, 1), { rau: 0.4, leuchten: 0.25 }), 2 * N);
    var mat = new THREE.Matrix4(), q = new THREE.Quaternion(), y = new THREE.Vector3(0, 1, 0);
    var ca = F("dna-a"), cb = F("dna-b"), b1 = F("base-1"), b2 = F("base-2"), k = 0, s = 0, r = U.zufall(5);
    for (var i = 0; i < N; i++) {
      for (var h = 0; h < 2; h++) {
        var t = i + h * 0.5;
        var pa = strang(t, 0).sub(m0), pb = strang(t, 1).sub(m0);
        mat.makeTranslation(pa.x, pa.y, pa.z); kugeln.setMatrixAt(k, mat); kugeln.setColorAt(k++, ca);
        mat.makeTranslation(pb.x, pb.y, pb.z); kugeln.setMatrixAt(k, mat); kugeln.setColorAt(k++, cb);
      }
      var A = strang(i, 0).sub(m0), B = strang(i, 1).sub(m0), M = A.clone().add(B).multiplyScalar(0.5);
      var dir = B.clone().sub(A), len = dir.length() * 0.5;
      q.setFromUnitVectors(y, dir.normalize());
      var tausch = r() < 0.5;
      [[A, M, tausch ? b1 : b2], [M, B, tausch ? b2 : b1]].forEach(function (teil) {
        var mitteT = teil[0].clone().add(teil[1]).multiplyScalar(0.5);
        mat.compose(mitteT, q, new THREE.Vector3(1, len, 1));
        staebe.setMatrixAt(s, mat); staebe.setColorAt(s++, teil[2]);
      });
    }
    kugeln.frustumCulled = staebe.frustumCulled = false;
    g.add(kugeln, staebe);
    return g;
  }

  /* ---------- Virus mit Stacheln ---------- */
  function bauVirus() {   // Einheit: Nanometer
    var g = new THREE.Group(), dreh = new THREE.Group();
    dreh.add(new THREE.Mesh(new THREE.IcosahedronGeometry(42, 3), standard(F("virus"), { rau: 0.6, leuchten: 0.12 })));
    dreh.add(new THREE.Mesh(new THREE.SphereGeometry(47, 48, 32),
      U.glanzMaterial({ farbe: F("virus"), farbe2: F("virus-spitze"), rand: 0.9, kern: 0.0, rausch: 0.05 })));
    var n = 74, stiel = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.4, 2.2, 12, 8), standard(F("virus-spitze"), { rau: 0.5 }), n);
    var kopf = new THREE.InstancedMesh(new THREE.SphereGeometry(4, 12, 8), standard(F("virus-spitze"), { rau: 0.4, leuchten: 0.3 }), n);
    var mat = new THREE.Matrix4(), q = new THREE.Quaternion(), y = new THREE.Vector3(0, 1, 0);
    for (var i = 0; i < n; i++) {
      var phi = Math.acos(1 - 2 * (i + 0.5) / n), th = Math.PI * (1 + Math.sqrt(5)) * i;
      var d = new THREE.Vector3(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
      q.setFromUnitVectors(y, d);
      mat.compose(d.clone().multiplyScalar(47), q, new THREE.Vector3(1, 1, 1)); stiel.setMatrixAt(i, mat);
      mat.compose(d.clone().multiplyScalar(54), q, new THREE.Vector3(1, 0.75, 1)); kopf.setMatrixAt(i, mat);
    }
    stiel.frustumCulled = kopf.frustumCulled = false;
    dreh.add(stiel, kopf);
    g.add(dreh);
    g.userData.jedesBild = function (ctx) { dreh.rotation.set(ctx.zeit * 0.05, ctx.zeit * 0.08, 0); };
    return g;
  }

  /* ---------- Zelle mit Kern und Mitochondrien ---------- */
  var KERN_LOKAL = [1.5, -0.8, -0.6];   // Zellkern relativ zur Zellmitte (µm) → Kern-Mitte = Ursprung
  var MITO_MARKE = [-5, 3, 4];           // ein Mitochondrium mit Schild
  function bauZelle() {   // Einheit: Mikrometer
    var g = new THREE.Group(), r = U.zufall(31);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(10, 96, 64),
      U.glanzMaterial({ farbe: F("zelle"), farbe2: F("violett"), rand: 1.0, kern: 0.035, rausch: 0.28, wabern: 0.6 })));
    g.add(new THREE.Mesh(new THREE.SphereGeometry(9.7, 64, 48),
      U.glanzMaterial({ farbe: F("zelle"), rand: 0.0, kern: 0.05, rausch: 0.2, seite: THREE.BackSide })));
    var kern = new THREE.Group();
    kern.position.set(KERN_LOKAL[0], KERN_LOKAL[1], KERN_LOKAL[2]);
    kern.add(new THREE.Mesh(new THREE.SphereGeometry(3, 64, 48),
      U.glanzMaterial({ farbe: F("kern"), farbe2: F("blau"), rand: 1.3, kern: 0.06, rausch: 0.9, wabern: 0.15 })));
    var kk = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 24),
      U.glanzMaterial({ farbe: F("kern"), rand: 1.0, kern: 0.25, rausch: 2 }));
    kk.position.set(0.9, 0.7, 0.4);
    kern.add(kk);
    var chrom = U.punkteWolke(anzahl(2600), { funkeln: 0.25, max: 18 }), rau = U.rauschen(4), i, p;
    for (i = 0; i < 2600; i++) {
      p = kugelPunkt(r);
      if (rau(p[0] * 4, p[1] * 4, p[2] * 4) < 0.5) continue;   // Chromatin klumpt
      chrom.userData.setze(p[0] * 2.8, p[1] * 2.8, p[2] * 2.8, F("kern").lerp(F("blau"), r()), 0.09, r());
    }
    chrom.userData.fertig();
    kern.add(chrom);
    g.add(kern);
    var mitoMat = standard(F("mito"), { rau: 0.5, leuchten: 0.3 });
    var mitoGeo = new THREE.CapsuleGeometry(0.45, 1.5, 6, 14);
    for (i = 0; i < 16; i++) {
      var m = new THREE.Mesh(mitoGeo, mitoMat);
      if (i === 0) p = MITO_MARKE;
      else {
        do { p = mal(richtung(r), 4.8 + r() * 4); } while (weg(p, KERN_LOKAL) < 4.4);
      }
      m.position.set(p[0], p[1], p[2]);
      m.rotation.set(r() * 6.3, r() * 6.3, r() * 6.3);
      g.add(m);
    }
    var blasen = U.punkteWolke(anzahl(1600), { funkeln: 0.3, max: 16 });
    for (i = 0; i < 1600; i++) {
      p = mal(kugelPunkt(r), 9.3);
      if (weg(p, KERN_LOKAL) < 3.3) continue;
      blasen.userData.setze(p[0], p[1], p[2], r() < 0.6 ? F("kupfer") : F("blau"), 0.07 + 0.08 * r(), r());
    }
    blasen.userData.fertig();
    g.add(blasen);
    return g;
  }

  /* ---------- Hautgewebe: viele Zellen nebeneinander ---------- */
  function bauGewebe() {   // Einheit: Mikrometer, Mitte = Zellmitte
    var r = U.zufall(41), abst = 21, rad = 720, liste = [];
    for (var a = -40; a <= 40; a++) {
      for (var b = -40; b <= 40; b++) {
        var x = (a + (b % 2 ? 0.5 : 0)) * abst, z = b * abst * 0.866;
        if ((a === 0 && b === 0) || Math.sqrt(x * x + z * z) > rad * (0.72 + 0.28 * r())) continue;
        liste.push([x + U.gauss(r) * 1.2, U.gauss(r) * 1.5, z + U.gauss(r) * 1.2]);
      }
    }
    var mat = U.glanzMaterial({ farbe: F("zelle"), farbe2: F("violett"), rand: 0.55, kern: 0.02, rausch: 0.5 });
    var zellen = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), mat, liste.length);
    var m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    liste.forEach(function (p, i) {
      var k = 0.85 + 0.3 * r();
      e.set(r() * 3, r() * 3, r() * 3);
      m.compose(new THREE.Vector3(p[0], p[1], p[2]), q.setFromEuler(e), new THREE.Vector3(10 * k, 8 * k, 10 * k));
      zellen.setMatrixAt(i, m);
    });
    zellen.frustumCulled = false;
    var g = new THREE.Group();
    g.add(zellen);
    return g;
  }

  /* ---------- Sandkorn (Quarzkorn mit Facetten) ---------- */
  function bauSand() {   // Einheit: 0,25 mm (Radius)
    var geo = new THREE.IcosahedronGeometry(1, 4), pos = geo.attributes.position, v = new THREE.Vector3();
    var n1 = U.rauschen(7), n2 = U.rauschen(8);
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var f = 1 + 0.22 * (n1(v.x * 1.6 + 5, v.y * 1.6, v.z * 1.6) - 0.5) + 0.07 * (n2(v.x * 5, v.y * 5, v.z * 5) - 0.5);
      pos.setXYZ(i, v.x * f * 1.15, v.y * f * 0.82, v.z * f);
    }
    geo.computeVertexNormals();
    var g = new THREE.Group(), korn = new THREE.Mesh(geo, standard(F("sand"), { rau: 0.85, flach: true, leuchten: 0.08 }));
    g.add(korn);
    g.userData.jedesBild = function (ctx) { korn.rotation.y = ctx.zeit * 0.04; };
    return g;
  }

  /* ---------- Mensch: Figur mit Schatten, steht auf der Erde ---------- */
  function bauMensch() {   // Einheit: Meter, Füße im Ursprung
    var g = new THREE.Group(), figur = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: F("mensch"), roughness: 0.7, metalness: 0, transparent: true });
    function teil(geo, x, y, z, sx, sy, sz) {
      var m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      if (sx) m.scale.set(sx, sy, sz);
      m.renderOrder = 1;
      figur.add(m); return m;
    }
    function glied(r, von, bis) {
      var a = new THREE.Vector3(von[0], von[1], von[2]), b = new THREE.Vector3(bis[0], bis[1], bis[2]);
      var d = b.clone().sub(a), l = Math.max(0.001, d.length() - 2 * r);
      var m = teil(new THREE.CapsuleGeometry(r, l, 6, 16), (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    }
    teil(new THREE.SphereGeometry(0.105, 32, 24), 0, 1.64, 0, 0.9, 1.08, 0.95);
    glied(0.05, [0, 1.56, 0], [0, 1.44, 0]);
    teil(new THREE.CapsuleGeometry(0.16, 0.34, 8, 20), 0, 1.2, 0, 1.12, 1, 0.68);
    teil(new THREE.SphereGeometry(0.15, 24, 16), 0, 0.94, 0, 1.12, 0.75, 0.72);
    glied(0.068, [0.1, 0.92, 0], [0.11, 0.07, 0.0]);
    glied(0.068, [-0.1, 0.92, 0], [-0.11, 0.07, 0.0]);
    teil(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), 0.11, 0.045, 0.05, 1, 1, 1).rotation.x = Math.PI / 2;
    teil(new THREE.CapsuleGeometry(0.045, 0.12, 4, 10), -0.11, 0.045, 0.05, 1, 1, 1).rotation.x = Math.PI / 2;
    glied(0.047, [0.2, 1.42, 0], [0.29, 0.80, 0.05]);
    glied(0.047, [-0.2, 1.42, 0], [-0.29, 0.80, 0.05]);
    teil(new THREE.SphereGeometry(0.05, 20, 14), 0.295, 0.765, 0.05, 0.8, 1.2, 0.6);
    teil(new THREE.SphereGeometry(0.05, 20, 14), -0.295, 0.765, 0.05, 0.8, 1.2, 0.6);
    glied(0.009, [0.302, 0.74, 0.058], FINGER);
    g.add(figur);
    /* Schlagschatten: die Figur entlang der Sonnenrichtung flach auf den
       Boden gedrückt. LessDepth: überlappende Teile dunkeln nicht doppelt. */
    var schattenMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.42, depthFunc: THREE.LessDepth });
    var schatten = figur.clone();
    schatten.traverse(function (o) { if (o.isMesh) { o.material = schattenMat; o.renderOrder = 2; } });
    var L = D_SONNE;
    schatten.matrixAutoUpdate = false;
    schatten.matrix.set(1, -L[0] / L[1], 0, 0, 0, 0, 0, 0.012, 0, -L[2] / L[1], 1, 0, 0, 0, 0, 1);
    g.add(schatten);
    var kontakt = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 1 } },
      vertexShader: "varying vec2 vU; void main(){ vU = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform float uAlpha; varying vec2 vU; void main(){ float r = length(vU); gl_FragColor = vec4(0.0, 0.0, 0.0, pow(max(1.0 - r, 0.0), 1.6) * 0.45 * uAlpha); }",
      transparent: true, depthWrite: false
    }));
    kontakt.rotation.x = -Math.PI / 2; kontakt.position.y = 0.006; kontakt.renderOrder = 2;
    g.add(kontakt);
    return g;
  }

  /* ---------- Erde: EINE Kugel vom Grashalm bis zum Planeten ----------
     Ringe um den Standort des Menschen, deren Abstand nach außen
     exponentiell wächst: unter den Füßen wenige Zentimeter, am
     Gegenpol einige Grad. Eckpunkte in Metern relativ zu den Füßen (exakt
     gekrümmt), dazu die Richtung vom Erdmittelpunkt (für Kontinente und
     Licht) und Kartenkoordinaten in Metern (für Gras, Felder). */
  function erdGitter() {
    var N = schmal ? 520 : 720, M = schmal ? 200 : 288, lam = 16.5, eL = Math.exp(lam);
    var nv = 1 + N * M, pos = new Float32Array(nv * 3), ri = new Float32Array(nv * 3), ka = new Float32Array(nv * 2);
    ri[1] = 1;
    var k = 1, i, j;
    for (i = 1; i <= N; i++) {
      var a = Math.PI * (Math.exp(lam * i / N) - 1) / (eL - 1);
      var sa = Math.sin(a), ca = Math.cos(a), y = -2 * R_ERDE * Math.pow(Math.sin(a / 2), 2), bogen = a * R_ERDE;
      for (j = 0; j < M; j++, k++) {
        var ph = j / M * 2 * Math.PI, cp = Math.cos(ph), sp = Math.sin(ph);
        pos[3 * k] = R_ERDE * sa * cp; pos[3 * k + 1] = y; pos[3 * k + 2] = R_ERDE * sa * sp;
        ri[3 * k] = sa * cp; ri[3 * k + 1] = ca; ri[3 * k + 2] = sa * sp;
        ka[2 * k] = bogen * cp; ka[2 * k + 1] = bogen * sp;
      }
    }
    var idx = new Uint32Array((M + (N - 1) * M * 2) * 3), n = 0;
    for (j = 0; j < M; j++) { idx[n++] = 0; idx[n++] = 1 + (j + 1) % M; idx[n++] = 1 + j; }
    for (i = 1; i < N; i++) {
      var s1 = 1 + (i - 1) * M, s2 = 1 + i * M;
      for (j = 0; j < M; j++) {
        var j1 = (j + 1) % M, A = s1 + j, B = s1 + j1, C = s2 + j, D = s2 + j1;
        idx[n++] = A; idx[n++] = B; idx[n++] = C;
        idx[n++] = B; idx[n++] = D; idx[n++] = C;
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aRichtung", new THREE.BufferAttribute(ri, 3));
    geo.setAttribute("aKarte", new THREE.BufferAttribute(ka, 2));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    return geo;
  }
  var ERD_FARBEN = ["tief", "wald", "wiese", "feld-1", "feld-2", "stadtlicht", "atmo", "tag-horizont"];
  /* Standort des Menschen: Frankfurt am Main. Ost-, Nord- und Oben-Richtung
     dort in Erdkoordinaten (x zum Nullmeridian, y zum Nordpol) – damit
     wird jede Szenenrichtung in Breite/Länge fürs Satellitenbild umgerechnet. */
  var HEIM_BREITE = 50.11 * Math.PI / 180, HEIM_LAENGE = 8.68 * Math.PI / 180;
  var HEIM_OBEN = [Math.cos(HEIM_BREITE) * Math.cos(HEIM_LAENGE), Math.sin(HEIM_BREITE), -Math.cos(HEIM_BREITE) * Math.sin(HEIM_LAENGE)];
  var HEIM_NORD = [-Math.sin(HEIM_BREITE) * Math.cos(HEIM_LAENGE), Math.cos(HEIM_BREITE), Math.sin(HEIM_BREITE) * Math.sin(HEIM_LAENGE)];
  var HEIM_OST = [-Math.sin(HEIM_LAENGE), 0, -Math.cos(HEIM_LAENGE)];
  var ANISO = 4;   // setzt start() nach den Fähigkeiten der Grafikkarte
  function bauErde() {   // Einheit: Meter, Ursprung = Füße des Menschen
    var bild = new THREE.TextureLoader().load(window.UNIVERSUM_ERDBILD || "");
    bild.anisotropy = ANISO;
    var uni = {
      uBild: { value: bild },
      uSonne: { value: new THREE.Vector3(D_SONNE[0], D_SONNE[1], D_SONNE[2]) },
      uOst: { value: new THREE.Vector3().fromArray(HEIM_OST) },
      uNord: { value: new THREE.Vector3().fromArray(HEIM_NORD) },
      uOben: { value: new THREE.Vector3().fromArray(HEIM_OBEN) },
      uAlpha: { value: 1 }, uZ: { value: 0 }, uMpE: { value: 1 }, uRaum: { value: 0 }
    };
    ERD_FARBEN.forEach(function (n) { uni["u_" + n.replace("-", "")] = { value: F(n) }; });
    var mat = new THREE.ShaderMaterial({
      uniforms: uni, transparent: true,
      vertexShader: [
        "attribute vec3 aRichtung; attribute vec2 aKarte;",
        "varying vec3 vP; varying vec2 vK; varying vec3 vNw; varying vec3 vWp;",
        "void main() {",
        "  vP = aRichtung; vK = aKarte; vNw = normalize(mat3(modelMatrix) * aRichtung);",
        "  vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        U.GLSL_RAUSCHEN,
        "uniform sampler2D uBild; uniform vec3 uSonne, uOst, uNord, uOben;",
        "uniform vec3 u_tief, u_wald, u_wiese, u_feld1, u_feld2, u_stadtlicht, u_atmo, u_taghorizont;",
        "uniform float uAlpha, uZ, uMpE, uRaum;",
        "varying vec3 vP; varying vec2 vK; varying vec3 vNw; varying vec3 vWp;",
        "float hash2(vec2 c) { return fract(sin(dot(c, vec2(127.1, 311.7))) * 43758.5453); }",
        "void main() {",
        "  vec3 p = normalize(vP);",
        /* Satellitenbild: Szenenrichtung → Breite/Länge. Zwei Varianten der
           Längen-Koordinate, damit an der Datumsgrenze keine Naht entsteht */
        "  vec3 g = uOst * p.x - uNord * p.z + uOben * p.y;",
        "  float br = asin(clamp(g.y, -1.0, 1.0)), la = atan(-g.z, g.x);",
        "  vec2 uvA = vec2(la / 6.2831853 + 0.5, 0.5 + br / 3.14159265);",
        "  vec2 uvB = vec2(fract(uvA.x + 0.5) - 0.5, uvA.y);",
        "  vec2 dxA = dFdx(uvA), dyA = dFdy(uvA), dxB = dFdx(uvB), dyB = dFdy(uvB);",
        "  bool b = abs(dxA.x) + abs(dyA.x) > abs(dxB.x) + abs(dyB.x);",
        "  vec3 bild = textureGrad(uBild, uvA, b ? dxB : dxA, b ? dyB : dyA).rgb;",
        "  float meer = smoothstep(0.03, 0.1, bild.b - max(bild.r, bild.g));",
        "  float eis = smoothstep(0.55, 0.75, min(bild.r, min(bild.g, bild.b)));",
        "  float land = 1.0 - meer;",
        "  vec3 wasser = u_tief * (0.8 + 0.35 * fbm(p * 24.0));",
        "  vec3 boden = bild * 1.08;",
        /* Nah: Wiese, Felder und Wälder dort, wo das Satellitenbild grün ist */
        "  float heim = smoothstep(0.995, 0.9999, p.y);",
        "  float gruen = max(land * (1.0 - eis) * smoothstep(-0.02, 0.04, bild.g - bild.r), heim);",
        "  float nah = 1.0 - smoothstep(3.8, 5.6, uZ);",
        "  if (nah * gruen > 0.001) {",
        "    float wald = smoothstep(0.6, 0.66, fbm(vec3(vK / 9000.0, 3.0))) * smoothstep(250.0, 900.0, length(vK));",
        "    vec3 lokal = mix(u_wiese, u_wald, wald);",
        "    float feldSicht = smoothstep(1.4, 2.4, uZ);",
        "    if (feldSicht > 0.001) {",
        "      vec2 r = mat2(0.92, -0.39, 0.39, 0.92) * vK;",
        "      vec2 gr = vec2(320.0, 210.0) * (0.8 + 0.4 * hash2(floor(r / 2400.0)));",
        "      vec2 zelle = floor(r / gr); float hz = hash2(zelle);",
        "      vec3 feld = hz < 0.3 ? u_feld1 : hz < 0.55 ? u_feld2 : hz < 0.85 ? u_wiese : u_wald;",
        "      feld *= 0.85 + 0.3 * hash2(zelle + 7.0);",
        "      vec2 f = fract(r / gr);",
        "      feld = mix(u_wald * 0.75, feld, smoothstep(0.0, 0.025, min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y))));",
        "      feld = mix(feld, u_wald * 0.9, wald);",
        "      float nahFrei = smoothstep(40.0, 260.0, length(vK));",     // direkt um den Menschen Wiese
        "      lokal = mix(lokal, feld, feldSicht * nahFrei);",
        "    }",
        "    boden = mix(boden, lokal, nah * gruen);",
        "  }",
        /* Feinstruktur in jeder Zoomstufe (Gras, Erde) */
        "  float det = 0.0, gs = 0.0, k0 = floor(uZ) - 2.0;",
        "  for (int i = 0; i < 4; i++) {",
        "    float k = k0 + float(i), sk = pow(10.0, k);",
        "    float gw = smoothstep(-2.4, -1.4, k - uZ) * (1.0 - smoothstep(-0.3, 0.7, k - uZ));",
        "    det += gw * (rausch(vec3(vK / sk, k * 7.13)) - 0.5); gs += gw;",
        "  }",
        "  boden *= 1.0 + det / max(gs, 1e-3) * 0.6 * nah;",
        "  vec3 albedo = mix(wasser, boden, land);",
        /* Licht: Sonne, Glanz auf dem Meer, Stadtlichter auf der Nachtseite */
        "  vec3 N = normalize(vNw), L = normalize(uSonne), V = normalize(cameraPosition - vWp);",
        "  float nl = dot(N, L), tag = clamp((nl + 0.06) / 1.06, 0.0, 1.0);",
        "  vec3 c = albedo * (tag * vec3(1.0, 0.97, 0.92) * 1.2 + 0.06 * u_atmo * smoothstep(-0.3, 0.2, nl));",
        "  float rf = max(dot(reflect(-L, N), V), 0.0);",
        "  c += meer * (pow(rf, 70.0) * 0.8 + pow(rf, 8.0) * 0.07) * step(0.0, nl);",
        "  float nacht = 1.0 - smoothstep(-0.12, 0.04, nl);",
        "  float stadt = land * (1.0 - eis) * smoothstep(0.75, 0.88, rausch(p * 160.0)) * smoothstep(0.5, 0.7, rausch(p * 12.0 + 2.0));",
        "  c += nacht * stadt * u_stadtlicht * 0.8;",
        /* Dunst: am Kugelrand (vom All aus) und Luftperspektive am Boden */
        "  float fr = pow(1.0 - max(dot(N, V), 0.0), 3.0);",
        "  c = mix(c, u_atmo * (0.15 + 0.85 * tag), fr * 0.5 * uRaum * tag);",
        "  float dist = length(vWp - cameraPosition) * uMpE;",
        "  c = mix(c, u_taghorizont * (0.35 + 0.65 * tag), (1.0 - exp(-dist / 60000.0)) * (1.0 - uRaum) * 0.6);",
        "  gl_FragColor = vec4(c, uAlpha);",
        "}"
      ].join("\n")
    });
    mat.extensions = { derivatives: true, shaderTextureLOD: true };
    var g = new THREE.Group(), m = new THREE.Mesh(erdGitter(), mat);
    m.frustumCulled = false; m.renderOrder = -1;
    g.add(m);
    g.userData.jedesBild = function (ctx) {
      uni.uZ.value = ctx.z; uni.uMpE.value = 1 / ctx.s; uni.uRaum.value = U.glatt(4.2, 5.6, ctx.z);
    };
    return g;
  }

  /* ---------- Wolken und Lufthülle (nur von weit oben) ---------- */
  var ERD_VS = [
    "varying vec3 vPl; varying vec3 vNw; varying vec3 vWp;",
    "void main() {",
    "  vPl = position; vNw = normalize(mat3(modelMatrix) * normal);",
    "  vec4 wp = modelMatrix * vec4(position, 1.0); vWp = wp.xyz;",
    "  gl_Position = projectionMatrix * viewMatrix * wp;",
    "}"
  ].join("\n");
  function bauErdhuelle() {   // Einheit: Erdradius, Mitte = Erdmittelpunkt
    var g = new THREE.Group();
    var sonne = { value: new THREE.Vector3(D_SONNE[0], D_SONNE[1], D_SONNE[2]) };
    var wolken = new THREE.ShaderMaterial({
      uniforms: { uSonne: sonne, uAlpha: { value: 1 }, uZeit: { value: 0 }, uAbend: { value: F("abendrot") } },
      vertexShader: ERD_VS, transparent: true, depthWrite: false,
      fragmentShader: [
        U.GLSL_RAUSCHEN,
        "uniform vec3 uSonne; uniform vec3 uAbend; uniform float uAlpha; uniform float uZeit;",
        "varying vec3 vPl; varying vec3 vNw; varying vec3 vWp;",
        "void main() {",
        "  vec3 p = normalize(vPl);",
        "  vec3 q = p * 2.2;",
        "  vec2 w = vec2(fbm(q + 1.3), fbm(q + 5.7));",
        "  float d = fbm(p * vec3(3.0, 6.5, 3.0) + vec3(w * 2.0 - 1.0, 0.0) + vec3(uZeit * 0.004, 0.0, 0.0));",
        "  float wolke = smoothstep(0.57, 0.83, d) * (0.5 + 0.5 * fbm(p * 26.0));",
        "  float nl = dot(normalize(vNw), normalize(uSonne));",
        "  float tag = clamp((nl + 0.05) / 1.05, 0.0, 1.0);",
        "  vec3 c = vec3(0.03 + 1.05 * tag);",
        "  c = mix(c, uAbend * 0.9, smoothstep(0.25, 0.0, nl) * smoothstep(-0.2, 0.02, nl) * 0.6);",
        "  gl_FragColor = vec4(c, wolke * 0.88 * uAlpha);",
        "}"
      ].join("\n")
    });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.0025, 192, 128), wolken));
    var luft = new THREE.ShaderMaterial({
      uniforms: { uSonne: sonne, uFarbe: { value: F("atmo") }, uAbend: { value: F("abendrot") }, uAlpha: { value: 1 } },
      vertexShader: ERD_VS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      fragmentShader: [
        "uniform vec3 uSonne; uniform vec3 uFarbe; uniform vec3 uAbend; uniform float uAlpha;",
        "varying vec3 vPl; varying vec3 vNw; varying vec3 vWp;",
        "void main() {",
        "  vec3 N = normalize(vNw), V = normalize(cameraPosition - vWp);",
        "  float f = 1.0 - abs(dot(N, V));",
        "  float a = pow(f, 3.0) * (1.0 - smoothstep(0.9, 1.0, f)) * 2.2;",
        "  float nl = dot(N, normalize(uSonne));",
        "  vec3 c = mix(uFarbe, uAbend, smoothstep(0.3, -0.05, nl) * 0.7);",
        "  gl_FragColor = vec4(c, a * clamp(nl * 0.9 + 0.3, 0.0, 1.0) * uAlpha);",
        "}"
      ].join("\n")
    });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1.025, 160, 110), luft));
    return g;
  }

  /* ---------- Mond ---------- */
  function bauMond() {   // Einheit: Mondradius
    var mat = new THREE.ShaderMaterial({
      uniforms: { uSonne: { value: new THREE.Vector3(D_SONNE[0], D_SONNE[1], D_SONNE[2]) }, uFarbe: { value: F("mond") }, uAlpha: { value: 1 } },
      vertexShader: ERD_VS, transparent: true,
      fragmentShader: [
        U.GLSL_RAUSCHEN,
        "uniform vec3 uSonne; uniform vec3 uFarbe; uniform float uAlpha;",
        "varying vec3 vPl; varying vec3 vNw; varying vec3 vWp;",
        "void main() {",
        "  vec3 p = normalize(vPl);",
        "  float mare = smoothstep(0.55, 0.62, fbm(p * 1.7 + 4.0));",
        "  float krater = smoothstep(0.62, 0.8, rausch(p * 26.0)) * 0.25;",
        "  vec3 c = uFarbe * (1.0 - 0.42 * mare) * (0.85 + 0.3 * fbm(p * 9.0)) * (1.0 - krater);",
        "  float diff = max(dot(normalize(vNw), normalize(uSonne)), 0.0);",
        "  gl_FragColor = vec4(c * (0.02 + 1.1 * diff), uAlpha);",
        "}"
      ].join("\n")
    });
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat));
    return g;
  }

  /* ---------- Kreisbahn als Linie ---------- */
  function kreis(radius, farbe, deckkraft) {
    var pkt = [];
    for (var i = 0; i < 256; i++) {
      var p = bahn(radius, i / 256 * 2 * Math.PI);
      pkt.push(new THREE.Vector3(p[0], p[1], p[2]));
    }
    var m = new THREE.LineBasicMaterial({ color: farbe, transparent: true, opacity: deckkraft, depthWrite: false });
    return new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pkt), m);
  }
  function bauMondbahn() {   // Einheit: Mondabstand
    var g = new THREE.Group();
    g.add(kreis(1, F("blau"), 0.38));
    return g;
  }

  /* ---------- Sonne mit Granulation und Korona ---------- */
  function bauSonne() {   // Einheit: Sonnenradius
    var g = new THREE.Group();
    var mat = new THREE.ShaderMaterial({
      uniforms: { uZeit: { value: 0 }, uAlpha: { value: 1 }, c1: { value: F("sonne-1") }, c2: { value: F("sonne-2") }, c3: { value: F("sonne-3") } },
      vertexShader: [
        "varying vec3 vP; varying vec3 vN; varying vec3 vV;",
        "void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }"
      ].join("\n"),
      fragmentShader: [
        U.GLSL_RAUSCHEN,
        "uniform float uZeit; uniform float uAlpha; uniform vec3 c1, c2, c3;",
        "varying vec3 vP; varying vec3 vN; varying vec3 vV;",
        "void main() {",
        "  float n = fbm(vP * 3.2 + vec3(0.0, uZeit * 0.04, 0.0));",
        "  float k = rausch(vP * 22.0 + uZeit * 0.12);",
        "  float t = n * 0.75 + k * 0.25;",
        "  vec3 c = mix(c3, c2, smoothstep(0.28, 0.55, t));",
        "  c = mix(c, c1, smoothstep(0.52, 0.78, t));",
        "  float mu = max(dot(normalize(vN), normalize(vV)), 0.0);",
        "  c *= 0.5 + 0.6 * pow(mu, 0.45);",
        "  gl_FragColor = vec4(c * 1.15, uAlpha);",
        "}"
      ].join("\n"),
      transparent: true
    });
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), mat));
    g.add(blickFlaeche(7, U.blickMaterial({ farbe: F("sonne-1"), farbe2: F("sonne-3"), potenz: 2.6, staerke: 1.1, strahlen: 1.6 })));
    g.add(blickFlaeche(22, U.blickMaterial({ farbe: F("sonne-2"), farbe2: F("sonne-3"), potenz: 3.5, staerke: 0.55 })));
    return g;
  }

  /* ---------- Marke: ein Leuchtpunkt fester Pixelgröße ---------- */
  function bauMarke(farbe, px) {
    return function () {
      var g = new THREE.Group(), p = U.punkteWolke(2, { fest: true });
      p.userData.setze(0, 0, 0, F(farbe), px, 0);
      p.userData.setze(0, 0, 0, new THREE.Color(1, 1, 1), px * 0.4, 0);
      p.userData.fertig();
      g.add(p);
      return g;
    };
  }

  /* ---------- Planetenbahnen und Planeten ---------- */
  function bauBahnen() {   // Einheit: AE, Mitte = Sonne
    var g = new THREE.Group();
    var marken = U.punkteWolke(PLANETEN.length, { fest: true });
    PLANETEN.forEach(function (pl) {
      g.add(kreis(pl[1], F("linie-bahn"), pl[0] === "Erde" ? 0.7 : 0.4));
      var p = bahn(pl[1], pl[3]);
      marken.userData.setze(p[0], p[1], p[2], F(pl[2]), pl[1] > 4 ? 9 : 7, 0);
    });
    marken.userData.fertig();
    g.add(marken);
    return g;
  }

  /* ---------- Kuipergürtel und Oortsche Wolke ---------- */
  function bauKuiper() {   // Einheit: AE
    var n = anzahl(5000), w = U.punkteWolke(n, { max: 10 }), r = U.zufall(51), c = F("eis-komet");
    for (var i = 0; i < n; i++) {
      var rad = 30 + 20 * r() + Math.abs(U.gauss(r)) * 4, phi = r() * 2 * Math.PI;
      var p = plus(bahn(rad, phi), mal(N_EKL, U.gauss(r) * 2.5));
      w.userData.setze(p[0], p[1], p[2], c, 0.35, r());
    }
    w.userData.fertig();
    var g = new THREE.Group(); g.add(w); return g;
  }
  function bauOort() {   // Einheit: AE
    var n = anzahl(11000), w = U.punkteWolke(n, { max: 10, funkeln: 0.2 }), r = U.zufall(52), c = F("eis-komet"), c2 = F("blau");
    for (var i = 0; i < n; i++) {
      var p;
      if (r() < 0.72) {   // äußere, kugelförmige Wolke
        p = mal(richtung(r), 2e4 + 8e4 * Math.pow(r(), 0.7));
      } else {            // innere, abgeflachte Hills-Wolke
        var rad = 2e3 * Math.pow(10, r());
        p = plus(bahn(rad, r() * 6.283), mal(N_EKL, U.gauss(r) * rad * 0.35));
      }
      w.userData.setze(p[0], p[1], p[2], c.clone().lerp(c2, r() * 0.5), 420, r());
    }
    w.userData.fertig();
    var g = new THREE.Group(); g.add(w); return g;
  }

  /* ---------- Nachbarsterne in echten Richtungen ---------- */
  function bauNachbarn() {   // Einheit: Lichtjahr, Mitte = Sonne
    var r = U.zufall(61), n = 360, w = U.punkteWolke(n + STERNE.length, { max: 26 });
    STERNE.forEach(function (s) {
      var d = mal(himmelsRichtung(s[1], s[2]), s[3]);
      w.userData.setze(d[0], d[1], d[2], F(s[4]), s[4] === "stern-a" ? 0.55 : 0.4, 0);
    });
    var klassen = ["stern-m", "stern-m", "stern-m", "stern-m", "stern-k", "stern-g", "stern-f"];
    for (var i = 0; i < n; i++) {
      var d2 = mal(richtung(r), 5 + 25 * Math.cbrt(r()));
      w.userData.setze(d2[0], d2[1], d2[2], F(klassen[Math.floor(r() * klassen.length)]), 0.16 + 0.12 * r(), r());
    }
    w.userData.fertig();
    var g = new THREE.Group(); g.add(w); return g;
  }

  /* ---------- Spiralgalaxie aus Partikeln ---------- */
  function bauGalaxie(opt) {
    return function () {
      var g = new THREE.Group(), r = U.zufall(opt.saat), n = anzahl(opt.n);
      var w = U.punkteWolke(n, { max: 14 });
      var kern = F(opt.kern || "galaxie-kern"), arm = F(opt.arm || "galaxie-arm"), hii = F("galaxie-hii"), wei = new THREE.Color(1, 1, 1);
      var r0 = opt.balken || 0.1, steig = Math.tan(opt.steigung * Math.PI / 180), pkt = opt.punkt || 0.006;
      for (var i = 0; i < n; i++) {
        var u = r(), x, y, z, c, gr = pkt;
        if (u < 0.17) {                       // Kern (Bulge)
          var b = mal(kugelPunkt(r), Math.abs(U.gauss(r)) * 0.11 + 0.01);
          x = b[0]; y = b[1] * 0.6; z = b[2]; c = kern.clone().lerp(wei, r() * 0.3); gr = pkt * 1.6;
        } else if (u < 0.24 && opt.balken) {  // Balken
          x = (r() - 0.5) * 2 * opt.balken; y = U.gauss(r) * 0.02; z = U.gauss(r) * 0.035;
          c = kern.clone(); gr = pkt * 1.3;
        } else if (u < 0.76) {                // Spiralarme
          var k = Math.floor(r() * opt.arme), t = Math.pow(r(), 0.75);
          var rad = r0 + (1 - r0) * t + U.gauss(r) * 0.025;
          var w0 = opt.versatz + k * 2 * Math.PI / opt.arme + Math.log(rad / r0) / steig + U.gauss(r) * (0.16 + 0.1 * t);
          x = rad * Math.cos(w0); z = rad * Math.sin(w0); y = U.gauss(r) * 0.012;
          if (r() < 0.05) { c = hii.clone(); gr = pkt * 2.2; }
          else c = arm.clone().lerp(wei, r() * 0.55).lerp(kern, (1 - t) * 0.35);
        } else {                              // Scheibe zwischen den Armen
          var rr = Math.min(1.1, -0.3 * Math.log(1 - r() * 0.97)), ww = r() * 2 * Math.PI;
          x = rr * Math.cos(ww); z = rr * Math.sin(ww); y = U.gauss(r) * 0.02;
          c = kern.clone().lerp(arm, Math.min(1, rr)).multiplyScalar(0.7); gr = pkt * 0.85;
        }
        w.userData.setze(x, y, z, c, gr, r());
      }
      w.userData.fertig();
      g.add(w);
      var dunst = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3),
        U.blickMaterial({ farbe: kern, farbe2: arm, potenz: 1.6, staerke: 0.22 }));
      dunst.rotation.x = -Math.PI / 2;
      g.add(dunst);
      g.add(blickFlaeche(0.75, U.blickMaterial({ farbe: kern, farbe2: kern, potenz: 2.2, staerke: 0.75 })));
      if (opt.normale) g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().fromArray(opt.normale).normalize());
      var huelle = new THREE.Group();
      huelle.add(g);
      return huelle;
    };
  }

  /* ---------- Zwerggalaxien (unregelmäßige Wolken) ---------- */
  function bauWolke(saat, n) {
    return function () {
      var g = new THREE.Group(), r = U.zufall(saat), w = U.punkteWolke(n, { max: 12 }), c = F("galaxie-arm"), k = F("galaxie-kern");
      for (var i = 0; i < n; i++) {
        var p = kugelPunkt(r), s = Math.abs(U.gauss(r)) * 0.45;
        w.userData.setze(p[0] * s * 1.5 + (r() < 0.3 ? (r() - 0.5) * 0.8 : 0), p[1] * s * 0.6, p[2] * s, c.clone().lerp(k, r() * 0.5), 0.04, r());
      }
      w.userData.fertig();
      g.add(w);
      return g;
    };
  }
  function bauZwerge() {   // Einheit: 1e21 m, Mitte = Lokale Gruppe
    var r = U.zufall(71), n = anzahl(32 * 220), w = U.punkteWolke(n, { max: 10 }), c = F("galaxie-arm"), k = F("galaxie-kern");
    var mw = mal(plus(GALAXIS, mal(LOKAL, -1)), 1e-21), an = mal(plus(ANDROMEDA, mal(LOKAL, -1)), 1e-21), i = 0;
    for (var z = 0; z < 32; z++) {
      var mitte = plus(z % 2 ? mw : an, mal(richtung(r), 0.6 + 2.6 * r())), gr = 0.015 + 0.035 * r();
      for (var j = 0; j < 220 && i < n; j++, i++) {
        var p = plus(mitte, mal(kugelPunkt(r), gr * Math.abs(U.gauss(r))));
        w.userData.setze(p[0], p[1], p[2], c.clone().lerp(k, r()), 0.006, r());
      }
    }
    w.userData.fertig();
    var g = new THREE.Group(); g.add(w); return g;
  }

  /* ---------- Kosmisches Netz: Knoten (Haufen) und Fäden ---------- */
  function netzPunkte(w, opt) {
    var r = U.zufall(opt.saat), knoten = opt.knoten.slice(), i, j;
    while (knoten.length < opt.anzahlKnoten) {
      knoten.push({ p: mal(kugelPunkt(r), opt.radius), m: 0.3 + Math.pow(r(), 3) * 2 });
    }
    var kanten = (opt.kanten || []).slice(), schon = {};
    kanten.forEach(function (k) { schon[k[0] + "-" + k[1]] = true; });
    for (i = 0; i < knoten.length; i++) {
      var nah = [];
      for (j = 0; j < knoten.length; j++) if (j !== i) nah.push([weg(knoten[i].p, knoten[j].p), j]);
      nah.sort(function (a, b) { return a[0] - b[0]; });
      for (j = 0; j < 3; j++) {
        if (nah[j][0] > opt.maxLaenge) break;
        var a = Math.min(i, nah[j][1]), b = Math.max(i, nah[j][1]);
        if (!schon[a + "-" + b]) { schon[a + "-" + b] = true; kanten.push([a, b]); }
      }
    }
    var summe = 0, kum = [], biege = [];
    kanten.forEach(function (k) {
      summe += weg(knoten[k[0]].p, knoten[k[1]].p); kum.push(summe);
      biege.push(mal(richtung(r), weg(knoten[k[0]].p, knoten[k[1]].p) * 0.12));
    });
    var mSumme = 0, mKum = [];
    knoten.forEach(function (k) { mSumme += k.m; mKum.push(mSumme); });
    function suche(liste, x) { var lo = 0, hi = liste.length - 1; while (lo < hi) { var mi = (lo + hi) >> 1; if (liste[mi] < x) lo = mi + 1; else hi = mi; } return lo; }
    var c1 = F("netz-1"), c2 = F("netz-2"), ck = F("netz-knoten"), crot = F("kupfer");
    for (i = 0; i < opt.n; i++) {
      var u = r(), p, c, gr = opt.groesse;
      if (u < 0.66) {
        var ki = suche(kum, r() * summe), kk = kanten[ki], A = knoten[kk[0]].p, B = knoten[kk[1]].p, t = r();
        p = plus(mische(A, B, t), mal(biege[ki], Math.sin(Math.PI * t)));
        p = plus(p, mal(kugelPunkt(r), opt.streu * (0.5 + Math.sin(Math.PI * t))));
        c = c1.clone().lerp(c2, r() * 0.6);
      } else if (u < 0.95) {
        var kn = knoten[suche(mKum, r() * mSumme)];
        p = plus(kn.p, mal(kugelPunkt(r), opt.knotenRadius * Math.sqrt(kn.m) * Math.abs(U.gauss(r))));
        c = ck.clone().lerp(c2, r() * 0.4); gr *= 1.25;
      } else {
        p = mal(kugelPunkt(r), opt.radius); c = c1.clone().multiplyScalar(0.5);
      }
      if (opt.rotverschiebung) c.lerp(crot, Math.min(1, laenge(p) / opt.radius) * 0.45);
      w.userData.setze(p[0], p[1], p[2], c, gr, r());
    }
    w.userData.fertig();
  }
  function bauNetz() {   // Einheit: 1e24 m, Mitte = Lokale Gruppe
    var n = anzahl(95000), w = U.punkteWolke(n, { max: 12 });
    var virgo = mal(D_VIRGO, 0.51), gegen = plus(mal(D_VIRGO, -1.7), [0.15, -0.1, 0]), attr = mal(D_ATTR, 2.2);
    netzPunkte(w, {
      saat: 81, n: n, radius: 16, anzahlKnoten: 95, maxLaenge: 8.5, streu: 0.22, knotenRadius: 0.32, groesse: 0.035,
      knoten: [{ p: virgo, m: 1.6 }, { p: gegen, m: 0.6 }, { p: attr, m: 2.6 }], kanten: [[0, 1], [0, 2]]
    });
    var g = new THREE.Group(); g.add(w); return g;
  }
  function bauKosmos() {   // Einheit: 1e26 m, Mitte = Erde
    var n = anzahl(120000), w = U.punkteWolke(n, { max: 8 });
    netzPunkte(w, {
      saat: 91, n: n, radius: R_UNIVERSUM / 1e26, anzahlKnoten: 650, maxLaenge: 1.4, streu: 0.03,
      knotenRadius: 0.04, groesse: 0.0075, knoten: [], rotverschiebung: true
    });
    var g = new THREE.Group(); g.add(w); return g;
  }

  /* ---------- Kosmische Hintergrundstrahlung als Hülle ---------- */
  function bauCMB() {   // Einheit: Radius des beobachtbaren Universums
    var mat = new THREE.ShaderMaterial({
      uniforms: { uAlpha: { value: 1 }, kalt: { value: F("cmb-kalt") }, mitte: { value: F("cmb-mitte") }, warm: { value: F("cmb-warm") } },
      vertexShader: [
        "varying vec3 vP; varying vec3 vN; varying vec3 vV;",
        "void main() { vP = position; vec4 mv = modelViewMatrix * vec4(position, 1.0);",
        "  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }"
      ].join("\n"),
      fragmentShader: [
        U.GLSL_RAUSCHEN,
        "uniform float uAlpha; uniform vec3 kalt, mitte, warm;",
        "varying vec3 vP; varying vec3 vN; varying vec3 vV;",
        "void main() {",
        "  float n = fbm(normalize(vP) * 7.0) * 0.7 + rausch(normalize(vP) * 40.0) * 0.3;",
        "  vec3 c = n < 0.5 ? mix(kalt, mitte, smoothstep(0.3, 0.5, n)) : mix(mitte, warm, smoothstep(0.5, 0.7, n));",
        "  float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));",
        "  float a = gl_FrontFacing ? 0.025 + 0.7 * pow(f, 3.5) : 0.22;",
        "  gl_FragColor = vec4(c, a * uAlpha);",
        "}"
      ].join("\n"),
      transparent: true, depthWrite: false, side: THREE.DoubleSide
    });
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(1, 128, 96), mat));
    return g;
  }

  /* ---------- Gestrichelte Strecke von a nach b (Einheit = Länge) ---------- */
  function bauStrecke(a, b) {
    return function () {
      var d = einheitV(plus(b, mal(a, -1)));
      var geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(d[0], d[1], d[2])]);
      var l = new THREE.Line(geo, new THREE.LineDashedMaterial({ color: F("kupfer"), dashSize: 0.016, gapSize: 0.011, transparent: true, opacity: 0.9, depthWrite: false }));
      l.computeLineDistances();
      l.frustumCulled = false;
      var g = new THREE.Group(); g.add(l); return g;
    };
  }

  /* ---------- Heliopause (Grenze des Sonnenwinds, ~120 AE, schematisch rund) ---------- */
  function bauHeliopause() {   // Einheit: AE
    var g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(121, 64, 48),
      U.glanzMaterial({ farbe: F("blau"), farbe2: F("violett"), rand: 0.55, kern: 0.008, rausch: 0.03, wabern: 4 })));
    return g;
  }

  /* ---------- Virgo-Superhaufen: Galaxiengruppen um den Virgo-Haufen ---------- */
  function bauVirgo() {   // Einheit: 1e22 m, Mitte = Virgo-Haufen
    var n = anzahl(26000), w = U.punkteWolke(n, { max: 9 }), r = U.zufall(111);
    var kern = F("galaxie-kern"), arm = F("galaxie-arm"), wei = new THREE.Color(1, 1, 1);
    var lg = mal(plus(LOKAL, mal(VIRGO, -1)), 1e-22);
    var a1 = einheitV(lg), a2 = einheitV(kreuz(a1, [0.3, 1, 0.2])), nn = kreuz(a1, a2);
    var gruppen = [], summe = 0, kum = [], i;
    for (i = 0; i < 150; i++) {
      var rad = 8 + 55 * Math.pow(r(), 0.8), ph = r() * 2 * Math.PI;
      gruppen.push({ p: plus(plus(mal(a1, rad * Math.cos(ph)), mal(a2, rad * Math.sin(ph))), mal(nn, U.gauss(r) * 6)), m: 0.3 + Math.pow(r(), 2) * 1.5 });
    }
    gruppen.push({ p: lg, m: 0.5 });
    gruppen.forEach(function (gr) { summe += gr.m; kum.push(summe); });
    for (i = 0; i < n; i++) {
      var u = r(), p, c;
      if (u < 0.22) {          // Virgo-Haufen: dicht, viele elliptische (gelbliche) Galaxien
        p = [U.gauss(r) * 3.4, U.gauss(r) * 2.3, U.gauss(r) * 2.7];
        c = kern.clone().lerp(wei, r() * 0.4);
      } else if (u < 0.82) {   // Gruppen
        var x = r() * summe, k = 0;
        while (kum[k] < x) k++;
        var grp = gruppen[k];
        p = plus(grp.p, mal(kugelPunkt(r), (0.6 + 0.9 * grp.m) * Math.abs(U.gauss(r))));
        c = arm.clone().lerp(wei, r() * 0.5);
      } else {                 // lockere Fäden zur Mitte
        var gf = gruppen[Math.floor(r() * gruppen.length)], t = r();
        p = plus(mal(gf.p, 1 - t), mal(kugelPunkt(r), 1.6));
        c = arm.clone().multiplyScalar(0.6);
      }
      w.userData.setze(p[0], p[1], p[2], c, 0.28, r());
    }
    w.userData.fertig();
    var g = new THREE.Group(); g.add(w);
    g.add(blickFlaeche(14, U.blickMaterial({ farbe: kern, farbe2: kern, potenz: 2.4, staerke: 0.35 })));
    return g;
  }

  /* ---------- Laniakea: Strömung der Galaxien zum Großen Attraktor ---------- */
  function bauLaniakea() {   // Einheit: 1e24 m, Mitte = Großer Attraktor
    var n = anzahl(4000), r = U.zufall(121), R = 2.7;
    var pos = new Float32Array(n * 3), farb = new Float32Array(n * 3), gr = new Float32Array(n), ph = new Float32Array(n);
    var c1 = F("kupfer"), c2 = F("netz-2");
    for (var i = 0; i < n; i++) {
      var p = mal(kugelPunkt(r), R);
      pos[3 * i] = p[0]; pos[3 * i + 1] = p[1]; pos[3 * i + 2] = p[2];
      var c = c1.clone().lerp(c2, r());
      farb[3 * i] = c.r; farb[3 * i + 1] = c.g; farb[3 * i + 2] = c.b;
      gr[i] = 0.02 + 0.02 * r(); ph[i] = r();
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aFarbe", new THREE.BufferAttribute(farb, 3));
    geo.setAttribute("aGroesse", new THREE.BufferAttribute(gr, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(ph, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: { uSkala: { value: 1 }, uPix: { value: 800 }, uMin: { value: 1.2 }, uMax: { value: 8 }, uAlpha: { value: 1 },
        uDpr: { value: 1 }, uFluss: { value: 0 } },
      vertexShader: [
        "uniform float uSkala, uPix, uMin, uMax, uAlpha, uFluss;",
        "attribute float aGroesse; attribute vec3 aFarbe; attribute float aPhase;",
        "varying vec3 vFarbe; varying float vA;",
        "void main() {",
        "  float t = fract(uFluss * 0.045 + aPhase);",
        "  vec3 p = position * (1.0 - 0.93 * t);",
        "  vec4 mv = modelViewMatrix * vec4(p, 1.0);",
        "  gl_Position = projectionMatrix * mv;",
        "  float s = aGroesse * uSkala * uPix / max(-mv.z, 1e-4), a = 1.0;",
        "  if (s < uMin) { a = s / uMin; s = uMin; }",
        "  gl_PointSize = min(s, uMax);",
        "  vA = a * sin(3.14159 * t) * uAlpha; vFarbe = aFarbe;",
        "}"
      ].join("\n"),
      fragmentShader: "varying vec3 vFarbe; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d, d) * 4.0; if (r2 > 1.0) discard; gl_FragColor = vec4(vFarbe, exp(-r2 * 3.5) * vA); }",
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
    var strom = new THREE.Points(geo, mat);
    strom.frustumCulled = false;
    var g = new THREE.Group();
    g.add(strom);
    g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48),
      U.glanzMaterial({ farbe: F("violett"), farbe2: F("kupfer"), rand: 0.35, kern: 0.0, rausch: 0.9, wabern: 0.12 })));
    g.userData.jedesBild = function (ctx) { mat.uniforms.uFluss.value = U.wenigBewegung ? 4 : ctx.zeit; };
    return g;
  }

  /* ---------------------------------------------------------------------
     Alle Körper. sicht = [a, b, c, d]: blendet zwischen z = a und b ein,
     zwischen c und d wieder aus.
     --------------------------------------------------------------------- */
  var KOERPER = [
    { id: "proton", pos: O, einheit: 1e-15, sicht: [-99, -98, -13.0, -12.2], bau: bauProton },
    { id: "kern-marke", pos: O, einheit: 1, sicht: [-13.4, -12.7, -9.0, -8.4], bau: bauMarke("proton-feld", 6) },
    { id: "atom", pos: O, einheit: 1e-12, sicht: [-12.4, -11.4, -8.4, -7.7], bau: bauAtom },
    { id: "dna", pos: O, einheit: 1e-9, sicht: [-9.3, -8.7, -6.6, -5.9], bau: bauDNA },
    { id: "virus", pos: VIRUS, einheit: 1e-9, sicht: [-8.1, -7.5, -5.2, -4.5], bau: bauVirus },
    { id: "zelle", pos: ZELLE, einheit: 1e-6, sicht: [-6.4, -5.7, -3.0, -2.2], bau: bauZelle },
    { id: "gewebe", pos: ZELLE, einheit: 1e-6, sicht: [-4.1, -3.3, -2.1, -1.4], bau: bauGewebe },
    { id: "sand", pos: SAND, einheit: 0.25e-3, sicht: [-4.4, -3.7, -1.3, -0.7], bau: bauSand },
    { id: "mensch", pos: MENSCH, einheit: 1, sicht: [-0.95, -0.6, 2.4, 3.2], bau: bauMensch },
    { id: "erde", pos: MENSCH, einheit: 1, sicht: [-1.0, -0.4, 10.3, 11.0], bau: bauErde },
    { id: "erdhuelle", pos: ERDE, einheit: R_ERDE, sicht: [4.8, 5.8, 10.3, 11.0], bau: bauErdhuelle },
    { id: "mond", pos: MOND, einheit: R_MOND, sicht: [6.8, 7.5, 10.3, 11.0], bau: bauMond },
    { id: "mondbahn", pos: ERDE, einheit: 3.844e8, sicht: [8.0, 8.6, 10.4, 11.2], bau: bauMondbahn },
    { id: "strecke-mond", pos: ERDE, einheit: weg(ERDE, MOND), sicht: [7.9, 8.4, 9.6, 10.1], bau: bauStrecke(ERDE, MOND) },
    { id: "erde-marke", pos: ERDE, einheit: 1, sicht: [8.3, 8.9, 10.6, 11.2], bau: bauMarke("erde", 6) },
    { id: "mond-marke", pos: MOND, einheit: 1, sicht: [8.3, 8.9, 10.6, 11.2], bau: bauMarke("mond", 4) },
    { id: "sonne", pos: SONNE, einheit: R_SONNE, sicht: [8.5, 9.5, 14.0, 15.0], bau: bauSonne },
    { id: "sonne-marke", pos: SONNE, einheit: 1, sicht: [10.0, 10.7, 19.0, 19.6], bau: bauMarke("sonne-2", 10) },
    { id: "bahnen", pos: SONNE, einheit: AE, sicht: [10.6, 11.2, 14.4, 15.3], bau: bauBahnen },
    { id: "strecke-mars", pos: ERDE, einheit: weg(ERDE, MARS), sicht: [10.8, 11.3, 12.4, 12.9], bau: bauStrecke(ERDE, MARS) },
    { id: "kuiper", pos: SONNE, einheit: AE, sicht: [12.5, 13.0, 14.6, 15.4], bau: bauKuiper },
    { id: "heliopause", pos: SONNE, einheit: AE, sicht: [12.6, 13.2, 14.8, 15.5], bau: bauHeliopause },
    { id: "strecke-voyager", pos: SONNE, einheit: weg(SONNE, VOYAGER), sicht: [12.4, 12.9, 14.6, 15.2], bau: bauStrecke(SONNE, VOYAGER) },
    { id: "voyager", pos: VOYAGER, einheit: 1, sicht: [12.3, 12.9, 15.0, 15.6], bau: bauMarke("voyager", 6) },
    { id: "oort", pos: SONNE, einheit: AE, sicht: [14.8, 15.6, 17.4, 18.2], bau: bauOort },
    { id: "nachbarn", pos: SONNE, einheit: LJ, sicht: [16.0, 16.7, 18.8, 19.6], bau: bauNachbarn },
    { id: "strecke-proxima", pos: SONNE, einheit: weg(SONNE, PROXIMA), sicht: [15.8, 16.3, 17.4, 17.9], bau: bauStrecke(SONNE, PROXIMA) },
    { id: "milchstrasse", pos: GALAXIS, einheit: 4.75e20, sicht: [19.0, 19.8, 23.6, 24.4],
      bau: bauGalaxie({ saat: 101, n: 95000, arme: 4, steigung: 13, balken: 0.18, versatz: 0.644 - Math.log(0.518 / 0.18) / Math.tan(13 * Math.PI / 180), punkt: 0.0055 }) },
    { id: "andromeda", pos: ANDROMEDA, einheit: 1.04e21, sicht: [21.0, 21.7, 24.4, 25.2],
      bau: bauGalaxie({ saat: 102, n: 60000, arme: 2, steigung: 10, balken: 0.08, versatz: 0.3, punkt: 0.006, normale: [0.45, 0.75, 0.5] }) },
    { id: "m33", pos: M33, einheit: 2.8e20, sicht: [21.4, 22.0, 24.0, 24.8],
      bau: bauGalaxie({ saat: 103, n: 14000, arme: 2, steigung: 24, balken: 0, versatz: 1.2, punkt: 0.008, normale: [-0.3, 0.8, 0.4] }) },
    { id: "lmc", pos: LMC, einheit: 7e19, sicht: [20.4, 21.0, 22.8, 23.5], bau: bauWolke(104, 3500) },
    { id: "smc", pos: SMC, einheit: 3.5e19, sicht: [20.4, 21.0, 22.8, 23.5], bau: bauWolke(105, 1800) },
    { id: "zwerge", pos: LOKAL, einheit: 1e21, sicht: [21.8, 22.4, 23.6, 24.2], bau: bauZwerge },
    { id: "virgo", pos: VIRGO, einheit: 1e22, sicht: [22.9, 23.6, 24.7, 25.4], bau: bauVirgo },
    { id: "netz", pos: LOKAL, einheit: 1e24, sicht: [24.3, 24.9, 26.4, 27.1], bau: bauNetz },
    { id: "laniakea", pos: ATTRAKTOR, einheit: 1e24, sicht: [24.3, 24.8, 25.7, 26.3], bau: bauLaniakea },
    { id: "kosmos", pos: ERDE, einheit: 1e26, sicht: [25.3, 26.1, 99, 100], bau: bauKosmos },
    { id: "cmb", pos: ERDE, einheit: R_UNIVERSUM, sicht: [25.8, 26.6, 99, 100], bau: bauCMB }
  ];

  /* Schilder: Text, Lage in Metern, sicht wie oben. klasse "hier" = orange
     („Du bist hier“), "mass" = Entfernungsangabe, "links" = Text links */
  var SCHILDER = [
    { text: "Atomkern (Proton)", pos: O, sicht: [-13.2, -12.6, -9.3, -8.7] },
    { text: "Elektronenwolke", pos: [A0 * 1.9, A0 * 1.4, 0], sicht: [-10.8, -10.3, -8.9, -8.4] },
    { text: "DNA-Strang", pos: [8e-9, 1.1e-9, 0], sicht: [-8.7, -8.3, -7.1, -6.6] },
    { text: "Virus", pos: plus(VIRUS, [0, 62e-9, 0]), sicht: [-7.5, -7.1, -5.7, -5.2] },
    { text: "Zellkern", pos: [0, 3.3e-6, 0], sicht: [-5.8, -5.3, -4.0, -3.5] },
    { text: "Mitochondrium", pos: plus(ZELLE, mal(MITO_MARKE, 1e-6)), sicht: [-5.1, -4.7, -4.0, -3.6] },
    { text: "Zellmembran", pos: plus(ZELLE, [0, 10.3e-6, 0]), sicht: [-5.0, -4.6, -3.7, -3.2] },
    { text: "Hautzellen", pos: plus(ZELLE, [-0.42e-3, 0, 0.3e-3]), sicht: [-3.6, -3.2, -2.4, -1.9] },
    { text: "Sandkorn", pos: plus(SAND, [0, 0.3e-3, 0]), sicht: [-3.6, -3.2, -1.8, -1.3] },
    { text: "Du", pos: plus(MENSCH, [0, 1.86, 0]), sicht: [-0.5, -0.1, 2.3, 2.9], klasse: "hier" },
    { text: "Erde", pos: plus(ERDE, [0, R_ERDE * 1.12, 0]), sicht: [6.4, 6.9, 9.6, 10.1] },
    { text: "Mond", pos: plus(MOND, [0, R_MOND * 1.3, 0]), sicht: [8.0, 8.4, 10.6, 11.1] },
    { text: "384 400 km", pos: mische(ERDE, MOND, 0.5), sicht: [8.2, 8.6, 9.6, 10.1], klasse: "mass" },
    { text: "Sonne", pos: SONNE, sicht: [10.3, 10.8, 17.6, 18.1] },
    { text: "225 Mio. km", pos: mische(ERDE, MARS, 0.5), sicht: [11.0, 11.4, 12.4, 12.9], klasse: "mass" },
    { text: "Kuipergürtel", pos: plus(SONNE, bahn(44 * AE, 2.0)), sicht: [12.6, 13.0, 14.4, 14.9] },
    { text: "Heliopause", pos: plus(SONNE, bahn(121 * AE, 4.4)), sicht: [12.9, 13.3, 14.4, 14.9] },
    { text: "Voyager 1", pos: VOYAGER, sicht: [12.6, 13.0, 15.0, 15.5] },
    { text: "≈ 173 AE = 1 Lichttag", pos: mische(SONNE, VOYAGER, 0.5), sicht: [12.9, 13.2, 14.4, 14.9], klasse: "mass" },
    { text: "Oortsche Wolke", pos: plus(SONNE, bahn(7e4 * AE, 0.6)), sicht: [15.4, 15.9, 17.0, 17.5] },
    { text: "4,24 Lichtjahre", pos: mische(SONNE, PROXIMA, 0.5), sicht: [16.0, 16.4, 17.4, 17.9], klasse: "mass" },
    { text: "Du bist hier", pos: SONNE, sicht: [18.9, 19.3, 23.3, 23.9], klasse: "hier" },
    { text: "Sagittarius A*", pos: GALAXIS, sicht: [20.2, 20.6, 21.8, 22.3] },
    { text: "Milchstraße", pos: GALAXIS, sicht: [21.8, 22.2, 23.2, 23.6] },
    { text: "Große Magellansche Wolke", pos: LMC, sicht: [21.0, 21.4, 21.9, 22.2] },
    { text: "Andromeda-Galaxie", pos: ANDROMEDA, sicht: [21.7, 22.1, 23.2, 23.6] },
    { text: "Dreiecksgalaxie", pos: M33, sicht: [22.0, 22.3, 23.0, 23.4] },
    { text: "Lokale Gruppe", pos: LOKAL, sicht: [23.2, 23.6, 25.0, 25.4], klasse: "hier" },
    { text: "Virgo-Haufen", pos: VIRGO, sicht: [23.3, 23.7, 25.0, 25.4], klasse: "links" },
    { text: "Großer Attraktor", pos: ATTRAKTOR, sicht: [24.4, 24.8, 25.9, 26.3] },
    { text: "Grenze von Laniakea", pos: plus(ATTRAKTOR, [0, 2.7e24, 0]), sicht: [24.5, 24.9, 25.7, 26.1] },
    { text: "Du bist hier", pos: ERDE, sicht: [26.1, 26.5, 99, 100], klasse: "hier" },
    { text: "Kosmische Hintergrundstrahlung", pos: plus(ERDE, [0, R_UNIVERSUM, 0]), sicht: [26.4, 26.8, 99, 100] }
  ];
  PLANETEN.forEach(function (pl) {
    var lg = Math.log10(pl[1] * AE);
    SCHILDER.push({ text: pl[0], pos: plus(SONNE, bahn(pl[1] * AE, pl[3])),
      sicht: pl[0] === "Erde" ? [10.1, 10.5, 12.8, 13.2] : pl[0] === "Mars" ? [10.9, 11.2, 13.0, 13.4] : [lg - 0.3, lg + 0.1, lg + 0.9, lg + 1.3] });
  });
  STERNE.forEach(function (s) {
    var nah = s[0] === "Proxima Centauri";
    SCHILDER.push({ text: s[0], pos: plus(SONNE, mal(himmelsRichtung(s[1], s[2]), s[3] * LJ)),
      sicht: nah ? [15.9, 16.3, 18.4, 18.9] : s[0] === "Alpha Centauri" ? [16.3, 16.6, 18.6, 19.1] : [17.0, 17.4, 18.6, 19.1],
      klasse: s[0] === "Alpha Centauri" ? "links" : undefined });
  });

  /* ---------------------------------------------------------------------
     Zahlen und Einheiten
     --------------------------------------------------------------------- */
  function zahl(x, stellen) {
    return x.toLocaleString("de-DE", { maximumSignificantDigits: stellen || 2 }).replace(/\./g, " ");
  }
  function hochzahl(m) {
    var e = Math.floor(Math.log10(m) + 1e-9), man = m / Math.pow(10, e);
    if (man >= 9.95) { man = 1; e++; }
    return zahl(man, 2) + " · 10<sup>" + String(e).replace("-", "−") + "</sup> m";
  }
  function lesbar(m) {
    var tabelle = [[1e-12, 1e-15, "fm"], [1e-9, 1e-12, "pm"], [1e-6, 1e-9, "nm"], [1e-3, 1e-6, "µm"],
      [1e-2, 1e-3, "mm"], [1, 1e-2, "cm"], [1e3, 1, "m"], [1e9, 1e3, "km"], [1.5e10, 1e9, "Mio. km"],
      [0.05 * LJ, AE, "AE"], [1e6 * LJ, LJ, "Lichtjahre"], [1e9 * LJ, 1e6 * LJ, "Mio. Lichtjahre"]];
    for (var i = 0; i < tabelle.length; i++) {
      if (m < tabelle[i][0]) return zahl(m / tabelle[i][1]) + " " + tabelle[i][2];
    }
    return zahl(m / (1e9 * LJ)) + " Mrd. Lichtjahre";
  }
  function rundeSchoen(x) {   // 1, 2 oder 5 · 10^n, höchstens x
    var e = Math.pow(10, Math.floor(Math.log10(x))), m = x / e;
    return (m >= 5 ? 5 : m >= 2 ? 2 : 1) * e;
  }

  /* ---------------------------------------------------------------------
     Fokus und Blickwinkel zwischen den Stationen
     --------------------------------------------------------------------- */
  function abschnitt(z) {
    for (var i = 0; i < STATIONEN.length - 1; i++) if (z <= STATIONEN[i + 1].z) return i;
    return STATIONEN.length - 2;
  }
  function fokusBei(z) {
    var S = STATIONEN;
    if (z <= S[0].z) return S[0].fokus;
    if (z >= S[S.length - 1].z) return S[S.length - 1].fokus;
    var i = abschnitt(z), a = S[i], b = S[i + 1], D = weg(a.fokus, b.fokus);
    if (D === 0) return a.fokus;
    /* erst losgleiten, wenn das nächste Ziel weniger als ~3 Bildbreiten entfernt ist */
    var za = Math.min(Math.max(Math.log10(D) - 0.5, a.z), b.z - 0.3);
    return mische(a.fokus, b.fokus, U.glatt(za, b.z, z));
  }
  var NEIGUNGEN = STATIONEN.map(function (s) { return { z: s.z, neigung: s.neigung }; })
    .concat(BLICKE).sort(function (a, b) { return a.z - b.z; });
  function neigungBei(z) {
    var S = NEIGUNGEN;
    if (z <= S[0].z) return S[0].neigung;
    if (z >= S[S.length - 1].z) return S[S.length - 1].neigung;
    for (var i = 0; i < S.length - 1 && z > S[i + 1].z; i++);
    return S[i].neigung + (S[i + 1].neigung - S[i].neigung) * U.glatt(S[i].z, S[i + 1].z, z);
  }
  function naechsteStation(z) {
    var best = 0;
    for (var i = 1; i < STATIONEN.length; i++) if (Math.abs(STATIONEN[i].z - z) < Math.abs(STATIONEN[best].z - z)) best = i;
    return best;
  }

  /* ---------------------------------------------------------------------
     Entschlüsseln-Effekt für Überschriften (nach Vorbild „Decrypted
     Text“ von reactbits.dev, ohne React)
     --------------------------------------------------------------------- */
  var ZEICHEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·+−×";
  function entschluessle(el, text) {
    if (el._lauf) cancelAnimationFrame(el._lauf);
    if (U.wenigBewegung) { el.textContent = text; return; }
    var start = performance.now(), dauer = 520;
    function schritt(t) {
      var p = Math.min(1, (t - start) / dauer), fertig = Math.floor(p * text.length), s = text.slice(0, fertig);
      for (var i = fertig; i < text.length; i++) s += text[i] === " " ? " " : ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)];
      el.textContent = s;
      if (p < 1) el._lauf = requestAnimationFrame(schritt);
      else el._lauf = null;
    }
    el._lauf = requestAnimationFrame(schritt);
    clearTimeout(el._ende);
    el._ende = setTimeout(function () { if (el._lauf) cancelAnimationFrame(el._lauf); el._lauf = null; el.textContent = text; }, dauer + 120);
  }

  /* ---------------------------------------------------------------------
     Kleine DOM-Helfer
     --------------------------------------------------------------------- */
  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  var ICON = {
    kleiner: '<path d="M15 6l-6 6 6 6"/>',
    groesser: '<path d="M9 6l6 6-6 6"/>',
    flug: '<path d="M7 5l12 7-12 7z"/>',
    stopp: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5"/>',
    vollbild: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'
  };
  function knopf(icon, text, titel) {
    var b = el("button", "uni-knopf");
    b.type = "button";
    b.title = titel;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[icon] + "</svg>";
    var t = el("span", "uni-knopf-text", text);
    b.appendChild(t);
    return b;
  }

  /* ---------------------------------------------------------------------
     Start
     --------------------------------------------------------------------- */
  function start(buehne) {
    if (!THREE || !U) return;
    var huelle = buehne.querySelector(".uni-leinwand");
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch (e) {
      buehne.classList.add("uni-fehler");
      return;
    }
    buehne.classList.add("uni-bereit");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    ANISO = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    huelle.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    var szene = new THREE.Scene();
    var FOV = 50, TAN = Math.tan(FOV * Math.PI / 360);
    var kamera = new THREE.PerspectiveCamera(FOV, 1, 0.02, 2e5);
    szene.add(kamera);
    /* Licht: im Mikrokosmos schräg von der Kamera, bei Mensch und Erde
       aus der echten Sonnenrichtung (passt zum Schlagschatten) */
    var licht = new THREE.DirectionalLight(0xffffff, 3.2);
    szene.add(licht);
    var kameraLicht = new THREE.Vector3(), sonnenLicht = new THREE.Vector3(D_SONNE[0], D_SONNE[1], D_SONNE[2]);
    szene.add(new THREE.HemisphereLight(0xc8d8ff, 0x2a1a10, 1.1));

    /* ----- Oberfläche ----- */
    var schilderEbene = el("div", "uni-schilder");
    var info = el("div", "uni-info");
    info.setAttribute("aria-live", "polite");
    var infoKopf = el("p", "uni-oberzeile");
    var infoTitel = el("h2", "uni-titel");
    var infoGroesse = el("p", "uni-groesse");
    var infoText = el("p", "uni-text");
    var infoFakt = el("p", "uni-fakt");
    var infoLink = el("a", "uni-link");
    var infoMehr = el("button", "uni-mehr", "Mehr lesen");
    infoMehr.type = "button";
    infoMehr.setAttribute("aria-expanded", "false");
    info.append(infoKopf, infoTitel, infoGroesse, infoText, infoFakt, infoLink, infoMehr);
    infoMehr.addEventListener("click", function () {
      var offen = info.classList.toggle("uni-info-offen");
      infoMehr.setAttribute("aria-expanded", offen ? "true" : "false");
      infoMehr.textContent = offen ? "Weniger" : "Mehr lesen";
    });

    var leiter = el("nav", "uni-leiter");
    leiter.setAttribute("aria-label", "Stationen von klein nach groß");
    var schiene = el("div", "uni-schiene");
    var zeiger = el("div", "uni-zeiger");
    schiene.appendChild(zeiger);
    for (var e10 = -15; e10 <= 27; e10 += 3) {
      var strich = el("span", "uni-strich");
      strich.style.top = posProzent(e10) + "%";
      strich.innerHTML = "10<sup>" + String(e10).replace("-", "−") + "</sup>";
      schiene.appendChild(strich);
    }
    var stationsKnoepfe = STATIONEN.map(function (s, i) {
      var b = el("button", "uni-station");
      b.type = "button";
      b.style.top = posProzent(s.z) + "%";
      b.setAttribute("aria-label", "Station " + (i + 1) + ": " + s.titel);
      b.appendChild(el("span", "uni-station-name", s.titel));
      b.addEventListener("click", function (ev) { ev.stopPropagation(); stoppeRundflug(); fliege(s.z); });
      schiene.appendChild(b);
      return b;
    });
    leiter.appendChild(schiene);

    var unten = el("div", "uni-unten");
    var knoepfe = el("div", "uni-knoepfe");
    var bKleiner = knopf("kleiner", "Kleiner", "Zur nächstkleineren Station");
    var bGroesser = knopf("groesser", "Größer", "Zur nächstgrößeren Station");
    var bFlug = knopf("flug", "Rundflug", "Automatisch durch alle Stationen fliegen");
    var bVoll = knopf("vollbild", "Vollbild", "Vollbild ein/aus");
    knoepfe.append(bKleiner, bGroesser, bFlug);
    if (buehne.requestFullscreen) knoepfe.append(bVoll);
    var mass = el("div", "uni-mass");
    var massBalken = el("div", "uni-mass-balken");
    var massText = el("span", "uni-mass-text");
    mass.append(massBalken, massText);
    var breiteText = el("p", "uni-bildbreite");
    var vergleichText = el("p", "uni-vergleich");
    var anzeige = el("div", "uni-anzeige");
    anzeige.append(mass, breiteText, vergleichText);
    /* Schieber für die Größe (nur auf dem Handy sichtbar, Wunsch 2026-11-13):
       links klein (Proton), rechts groß (Universum); Wert = z */
    var schieberZeile = el("div", "uni-schieber");
    var schieber = el("input");
    schieber.type = "range";
    schieber.min = Z_MIN; schieber.max = Z_MAX; schieber.step = "0.01";
    schieber.setAttribute("aria-label", "Größe: links klein, rechts groß");
    schieberZeile.append(el("span", "uni-schieber-ende", "Proton"), schieber, el("span", "uni-schieber-ende", "Universum"));
    unten.append(knoepfe, schieberZeile, anzeige);
    var hinweis = el("p", "uni-hinweis", "Mausrad: zoomen · Ziehen: drehen");
    if (window.matchMedia && window.matchMedia("(pointer: coarse)").matches) hinweis.textContent = "Zwei Finger: zoomen · Wischen: drehen";
    buehne.append(schilderEbene, info, leiter, unten, hinweis);

    function posProzent(z) { return ((Z_MAX - z) / (Z_MAX - Z_MIN) * 100).toFixed(3); }

    var schilder = new U.Beschriftungen(schilderEbene);
    SCHILDER.forEach(function (s) { s.schild = schilder.neu(s.text, s.klasse); });

    /* ----- Hintergrund: Sternhimmel, Mikro-Staub, Warp-Streifen ----- */
    var himmel = (function () {
      var n = 3200, w = U.punkteWolke(n, { fest: true }), r = U.zufall(201);
      var farben = ["stern-m", "stern-k", "stern-g", "stern-f", "stern-a", "stern-a"].map(F);
      for (var i = 0; i < n; i++) {
        var d = richtung(r);
        if (i < 1300) {   // Band der Milchstraße am Himmel (galaktische Ebene = waagerecht)
          d = einheitV([d[0], U.gauss(r) * 0.09, d[2]]);
        }
        var p = mal(d, 1500);
        w.userData.setze(p[0], p[1], p[2], farben[Math.floor(r() * farben.length)].lerp(new THREE.Color(1, 1, 1), 0.5),
          (i < 1300 ? 0.9 : 1.1) + Math.pow(r(), 6) * 2.6, r());
      }
      w.userData.fertig();
      w.material.uniforms.uFunkeln.value = 0.25;
      w.material.depthTest = false; w.renderOrder = -10;
      szene.add(w);
      return w;
    })();
    var staub = (function () {
      var n = 700, w = U.punkteWolke(n, { fest: true, funkeln: 0.6 }), r = U.zufall(202), c1 = F("violett"), c2 = F("blau");
      for (var i = 0; i < n; i++) {
        var p = mal(richtung(r), 120 + 200 * r());
        w.userData.setze(p[0], p[1], p[2], c1.clone().lerp(c2, r()), 1 + 1.8 * r(), r());
      }
      w.userData.fertig();
      w.material.depthTest = false; w.renderOrder = -10;
      szene.add(w);
      return w;
    })();
    /* Taghimmel über dem Menschen: Blau mit Sonne, verblasst beim Aufsteigen ins All */
    var tagHimmel = (function () {
      var mat = new THREE.ShaderMaterial({
        uniforms: { uAlpha: { value: 0 }, uSonne: { value: new THREE.Vector3(D_SONNE[0], D_SONNE[1], D_SONNE[2]) },
          uHorizont: { value: F("tag-horizont") }, uZenit: { value: F("tag-zenit") } },
        vertexShader: "varying vec3 vR; void main(){ vR = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
        fragmentShader: [
          "uniform float uAlpha; uniform vec3 uSonne, uHorizont, uZenit; varying vec3 vR;",
          "void main() {",
          "  vec3 r = normalize(vR);",
          "  vec3 c = mix(uHorizont, uZenit, pow(max(r.y, 0.0), 0.5));",
          "  float s = max(dot(r, normalize(uSonne)), 0.0);",
          "  c += vec3(1.0, 0.96, 0.88) * (step(0.99996, s) * 2.0 + pow(s, 400.0) * 0.6 + pow(s, 12.0) * 0.18);",
          "  gl_FragColor = vec4(c, uAlpha);",
          "}"
        ].join("\n"),
        side: THREE.BackSide, depthWrite: false, depthTest: false, transparent: true
      });
      var m = new THREE.Mesh(new THREE.SphereGeometry(1000, 48, 24), mat);
      m.renderOrder = -20; m.frustumCulled = false;
      szene.add(m);
      return m;
    })();
    var warp = (function () {
      var n = 520, pos = new Float32Array(n * 6), farb = new Float32Array(n * 6), basis = [], r = U.zufall(203);
      for (var i = 0; i < n; i++) {
        var w0 = r() * 2 * Math.PI, rad = 0.6 + 7 * Math.sqrt(r());
        basis.push([Math.cos(w0) * rad, Math.sin(w0) * rad, -2 - 78 * r()]);
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(farb, 3));
      var mat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
      var linien = new THREE.LineSegments(geo, mat);
      linien.frustumCulled = false;
      kamera.add(linien);
      return { linien: linien, pos: pos, farb: farb, basis: basis, mat: mat };
    })();
    var warpFarbe = F("warp");
    function aktualisiereWarp(v, dt) {
      var st = Math.min(1, Math.abs(v) / 2.2);
      warp.mat.opacity = U.wenigBewegung ? 0 : st * 0.85;
      if (warp.mat.opacity < 0.01) { warp.linien.visible = false; return; }
      warp.linien.visible = true;
      var len = 0.5 + Math.min(14, Math.abs(v) * 3.5);
      for (var i = 0; i < warp.basis.length; i++) {
        var b = warp.basis[i];
        b[2] += -v * dt * 26;
        if (b[2] > -1) b[2] -= 79;
        if (b[2] < -80) b[2] += 79;
        var j = i * 6, hinten = v < 0 ? -len : len;
        warp.pos[j] = b[0]; warp.pos[j + 1] = b[1]; warp.pos[j + 2] = b[2];
        warp.pos[j + 3] = b[0]; warp.pos[j + 4] = b[1]; warp.pos[j + 5] = b[2] + hinten;
        var hell = Math.min(1, (80 + b[2]) / 60);
        warp.farb[j] = warpFarbe.r * hell; warp.farb[j + 1] = warpFarbe.g * hell; warp.farb[j + 2] = warpFarbe.b * hell;
        warp.farb[j + 3] = 0; warp.farb[j + 4] = 0; warp.farb[j + 5] = 0;
      }
      warp.linien.geometry.attributes.position.needsUpdate = true;
      warp.linien.geometry.attributes.color.needsUpdate = true;
    }
    var grundFarben = { mikro: F("himmel-mikro"), welt: F("himmel-welt"), all: F("himmel-all") };
    var grund = new THREE.Color();

    /* ----- Körper bauen (bei Bedarf) und Materialien einsammeln ----- */
    var punktMats = [himmel.material, staub.material], zeitMats = [himmel.material, staub.material];
    function baue(k) {
      if (k.obj) return;
      var obj = k.bau();
      k.obj = obj; k.mats = []; k.blick = []; k.punktMats = [];
      obj.traverse(function (o) {
        if (o.userData.blick) k.blick.push(o);
        var m = o.material;
        if (!m || k.mats.indexOf(m) >= 0) return;
        if (m.uniforms && m.uniforms.uAlpha) m.userData.basis = 1;
        else m.userData.basis = m.opacity;
        k.mats.push(m);
        if (m.uniforms && m.uniforms.uPix) { punktMats.push(m); k.punktMats.push(m); }
        if (m.uniforms && m.uniforms.uZeit) zeitMats.push(m);
      });
      obj.visible = false;
      szene.add(obj);
    }
    function setzeAlpha(k, a) {
      for (var i = 0; i < k.mats.length; i++) {
        var m = k.mats[i];
        if (m.uniforms && m.uniforms.uAlpha) m.uniforms.uAlpha.value = a * m.userData.basis;
        else m.opacity = a * m.userData.basis;
      }
    }

    /* ----- Zustand ----- */
    var Z = { z: STATIONEN[6].z, ziel: STATIONEN[6].z, v: 0, gier: 0.75, gierV: 0, neigungNutzer: 0,
      letzteEingabe: -1e9, flug: null, rundflug: null, station: -1, laeuft: true, sichtbar: true };
    var hash = decodeURIComponent((location.hash || "").slice(1));
    STATIONEN.forEach(function (s) { if (s.id === hash) Z.z = Z.ziel = s.z; });
    var zMatch = /^z=(-?[\d.]+)$/.exec(hash);
    if (zMatch) Z.z = Z.ziel = Math.min(Z_MAX, Math.max(Z_MIN, parseFloat(zMatch[1])));

    function begrenze(z) { return Math.min(Z_MAX, Math.max(Z_MIN, z)); }
    function eingabe() { Z.letzteEingabe = performance.now(); buehne.classList.add("uni-benutzt"); }
    function fliege(ziel, dauer) {
      ziel = begrenze(ziel);
      if (U.wenigBewegung) { Z.z = Z.ziel = ziel; Z.flug = null; return; }
      Z.flug = { von: Z.z, nach: ziel, start: performance.now(), dauer: dauer || Math.max(1200, Math.abs(ziel - Z.z) * 520) };
    }
    function schrittStation(richt) {
      stoppeRundflug(); eingabe();
      var i = naechsteStation(Z.ziel);
      if (richt > 0 && STATIONEN[i].z <= Z.ziel + 0.05) i++;
      if (richt < 0 && STATIONEN[i].z >= Z.ziel - 0.05) i--;
      i = Math.max(0, Math.min(STATIONEN.length - 1, i));
      fliege(STATIONEN[i].z);
    }
    bKleiner.addEventListener("click", function () { schrittStation(-1); });
    bGroesser.addEventListener("click", function () { schrittStation(1); });

    /* Rundflug: von der aktuellen Station bis zum Universum (oben: von ganz unten) */
    function stoppeRundflug() {
      if (!Z.rundflug) return;
      clearTimeout(Z.rundflug.uhr);
      Z.rundflug = null;
      buehne.classList.remove("uni-im-flug");
      bFlug.querySelector("svg").innerHTML = ICON.flug;
      bFlug.querySelector(".uni-knopf-text").textContent = "Rundflug";
    }
    function rundflugWeiter() {
      if (!Z.rundflug) return;
      var i = Z.rundflug.i;
      if (i >= STATIONEN.length) { stoppeRundflug(); return; }
      fliege(STATIONEN[i].z);
      var dauer = Z.flug ? Z.flug.dauer : 0;
      Z.rundflug.i++;
      Z.rundflug.uhr = setTimeout(rundflugWeiter, dauer + (U.wenigBewegung ? 4200 : 3000));
    }
    bFlug.addEventListener("click", function () {
      if (Z.rundflug) { stoppeRundflug(); return; }
      var i = naechsteStation(Z.z);
      if (i >= STATIONEN.length - 1) i = 0;
      else if (Math.abs(STATIONEN[i].z - Z.z) < 0.1) i++;
      Z.rundflug = { i: i, uhr: null };
      buehne.classList.add("uni-im-flug");
      bFlug.querySelector("svg").innerHTML = ICON.stopp;
      bFlug.querySelector(".uni-knopf-text").textContent = "Anhalten";
      rundflugWeiter();
    });
    bVoll.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else buehne.requestFullscreen();
    });

    /* ----- Mausrad, Ziehen, Zwei-Finger-Zoom, Tastatur ----- */
    buehne.addEventListener("wheel", function (ev) {
      var d = ev.deltaY * (ev.deltaMode === 1 ? 33 : ev.deltaMode === 2 ? 400 : 1);
      ev.preventDefault();      // über der Bühne scrollt die Seite nie mit – auch nicht am Ende der Skala
      if (!d) return;
      stoppeRundflug(); Z.flug = null; eingabe();
      Z.ziel = begrenze(Z.ziel + Math.max(-0.6, Math.min(0.6, d * 0.0024)));
    }, { passive: false });

    var zeiger2 = {}, ziehen = null;
    var leinwand = renderer.domElement;
    leinwand.addEventListener("pointerdown", function (ev) {
      leinwand.setPointerCapture(ev.pointerId);
      zeiger2[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      ziehen = { x: ev.clientX, y: ev.clientY, abst: null };
      stoppeRundflug(); eingabe();
    });
    leinwand.addEventListener("pointermove", function (ev) {
      if (!zeiger2[ev.pointerId]) return;
      zeiger2[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(zeiger2);
      if (ids.length >= 2) {
        var a = zeiger2[ids[0]], b = zeiger2[ids[1]], abst = Math.hypot(a.x - b.x, a.y - b.y);
        if (ziehen.abst) { Z.flug = null; Z.ziel = begrenze(Z.ziel - Math.log10(abst / ziehen.abst) * 1.6); }
        ziehen.abst = abst;
        return;
      }
      var dx = ev.clientX - ziehen.x, dy = ev.clientY - ziehen.y;
      ziehen.x = ev.clientX; ziehen.y = ev.clientY;
      Z.gier -= dx * 0.006;
      Z.gierV = -dx * 0.006 * 60;
      Z.neigungNutzer = Math.max(-1.3, Math.min(1.3, Z.neigungNutzer + dy * 0.005));
      eingabe();
    });
    function loslassen(ev) {
      delete zeiger2[ev.pointerId];
      if (!Object.keys(zeiger2).length) ziehen = null;
      else if (ziehen) ziehen.abst = null;
    }
    leinwand.addEventListener("pointerup", loslassen);
    leinwand.addEventListener("pointercancel", loslassen);

    buehne.addEventListener("keydown", function (ev) {
      if (ev.target === schieber) return;          // Pfeiltasten bedient der Schieber selbst
      var t = ev.key, genutzt = true;
      if (t === "+" || t === "=" || t === "ArrowUp") Z.ziel = begrenze(Z.ziel - 0.3);
      else if (t === "-" || t === "ArrowDown") Z.ziel = begrenze(Z.ziel + 0.3);
      else if (t === "ArrowLeft") Z.gier += 0.15;
      else if (t === "ArrowRight") Z.gier -= 0.15;
      else if (t === "PageUp") schrittStation(1);
      else if (t === "PageDown") schrittStation(-1);
      else genutzt = false;
      if (genutzt) { ev.preventDefault(); stoppeRundflug(); Z.flug = null; eingabe(); }
    });

    /* Leiter: Klicken springt, Ziehen schiebt */
    function zAusLeiter(ev) {
      var r = schiene.getBoundingClientRect();
      var t = Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height));
      return Z_MAX - t * (Z_MAX - Z_MIN);
    }
    var leiterZiehen = false;
    schiene.addEventListener("pointerdown", function (ev) {
      if (ev.target.closest(".uni-station")) return;
      leiterZiehen = true; schiene.setPointerCapture(ev.pointerId);
      stoppeRundflug(); eingabe(); Z.flug = null; Z.ziel = zAusLeiter(ev);
    });
    schiene.addEventListener("pointermove", function (ev) { if (leiterZiehen) { Z.ziel = zAusLeiter(ev); eingabe(); } });
    schiene.addEventListener("pointerup", function () { leiterZiehen = false; });
    schiene.addEventListener("pointercancel", function () { leiterZiehen = false; });

    /* Schieber: während des Ziehens folgt das Bild dem Schieber, sonst folgt
       der Schieber dem Bild (Mausrad, Knöpfe, Rundflug) */
    var schieberZiehen = false;
    schieber.addEventListener("input", function () {
      schieberZiehen = true;
      stoppeRundflug(); eingabe(); Z.flug = null; Z.ziel = begrenze(+schieber.value);
    });
    ["change", "pointerup", "pointercancel", "touchend", "blur"].forEach(function (typ) {
      schieber.addEventListener(typ, function () { schieberZiehen = false; });
    });

    /* ----- Größe, Sichtbarkeit ----- */
    var breite = 1, hoehe = 1;
    function groesseAnpassen() {
      breite = Math.max(1, buehne.clientWidth); hoehe = Math.max(1, buehne.clientHeight);
      renderer.setSize(breite, hoehe);
      kamera.aspect = breite / hoehe;
      kamera.updateProjectionMatrix();
    }
    groesseAnpassen();
    if (window.ResizeObserver) new ResizeObserver(groesseAnpassen).observe(buehne);
    else window.addEventListener("resize", groesseAnpassen);
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (e) { Z.sichtbar = e[0].isIntersecting; }).observe(buehne);
    }

    /* ----- Anzeige: Station, Maßstab, Leiter ----- */
    function zeigeStation(i) {
      var s = STATIONEN[i];
      Z.station = i;
      infoKopf.textContent = "Station " + (i + 1) + " von " + STATIONEN.length + " · " + s.reich;
      entschluessle(infoTitel, s.titel);
      infoGroesse.innerHTML = s.groesseText + ' <span class="uni-hoch">(' + hochzahl(s.groesse) + ")</span>";
      infoText.textContent = s.text;
      infoFakt.textContent = s.fakt;
      var thema = s.link && window.Seite && window.Seite.findeThema(s.link.id);
      if (thema && thema.thema.status === "online") {
        infoLink.href = window.Seite.ROOT + thema.thema.datei;
        infoLink.textContent = "Mehr dazu: " + s.link.text;
        infoLink.hidden = false;
      } else infoLink.hidden = true;
      stationsKnoepfe.forEach(function (b, j) {
        b.classList.toggle("aktiv", j === i);
        if (j === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      info.classList.remove("uni-neu"); void info.offsetWidth; info.classList.add("uni-neu");
    }
    var altText = {};
    function setzeText(e, html, schluessel) {
      if (altText[schluessel] !== html) { altText[schluessel] = html; e.innerHTML = html; }
    }
    function aktualisiereAnzeige(W, s, abstand) {
      var i = naechsteStation(Z.z);
      if (i !== Z.station) zeigeStation(i);
      buehne.classList.toggle("uni-unterwegs", Math.abs(STATIONEN[i].z - Z.z) > 1.1);
      zeiger.style.top = posProzent(Z.z) + "%";
      if (!schieberZiehen && schieber.offsetParent && Math.abs(schieber.value - Z.z) > 0.005) schieber.value = Z.z.toFixed(2);
      /* Maßstabsbalken: 1, 2 oder 5 · 10^n, etwa 110 px */
      var sichtBreite = 2 * abstand * TAN * kamera.aspect / s;     // Meter über die ganze Bühne
      var mProPx = sichtBreite / breite, m = rundeSchoen(110 * mProPx);
      massBalken.style.width = (m / mProPx).toFixed(1) + "px";
      setzeText(massText, lesbar(m), "mass");
      setzeText(breiteText, "Bildausschnitt ≈ " + lesbar(W) + " <span class=\"uni-hoch\">(" + hochzahl(W) + ")</span>", "breite");
      var best = null, bestD = 0.55;
      VERGLEICHE.forEach(function (v) { var d = Math.abs(Math.log10(v[2] / W)); if (d < bestD) { bestD = d; best = v; } });
      setzeText(vergleichText, best ? "etwa so groß wie " + best[0] + " (" + best[1] + ")" : "", "vergleich");
    }

    /* ----- Hauptschleife ----- */
    var tAlt = performance.now(), q = new THREE.Quaternion(), puffer = new THREE.Vector2();
    function bild(t) {
      requestAnimationFrame(bild);
      var dt = Math.min(0.05, (t - tAlt) / 1000);
      tAlt = t;
      if (!Z.sichtbar || document.hidden) return;
      var zeit = t / 1000;

      if (Z.flug) {
        var p = Math.min(1, (t - Z.flug.start) / Z.flug.dauer);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        Z.ziel = Z.flug.von + (Z.flug.nach - Z.flug.von) * e;
        if (p >= 1) Z.flug = null;
      }
      var zVorher = Z.z;
      Z.z += (Z.ziel - Z.z) * (1 - Math.exp(-dt * (Z.flug ? 14 : 7)));
      if (Math.abs(Z.ziel - Z.z) < 1e-4) Z.z = Z.ziel;
      var v = dt > 0 ? (Z.z - zVorher) / dt : 0;
      Z.v += (v - Z.v) * (1 - Math.exp(-dt * 8));

      if (!ziehen) {
        Z.gier += Z.gierV * dt; Z.gierV *= Math.exp(-dt * 3);
        if (!U.wenigBewegung && t - Z.letzteEingabe > 5000) Z.gier += dt * 0.035;
      }

      var z = Z.z, W = Math.pow(10, z), s = K / W, f = fokusBei(z);
      var neig = Math.max(-1.45, Math.min(1.45, neigungBei(z) * Math.PI / 180 + Z.neigungNutzer));
      var abstand = kamera.aspect >= 1 ? K / (2 * TAN) : K / (2 * TAN * kamera.aspect);
      kamera.position.set(abstand * Math.cos(neig) * Math.sin(Z.gier), abstand * Math.sin(neig), abstand * Math.cos(neig) * Math.cos(Z.gier));
      kamera.lookAt(0, 0, 0);
      kamera.updateMatrixWorld();

      var ctx = { zeit: zeit, z: z, s: s };
      for (var i = 0; i < KOERPER.length; i++) {
        var k = KOERPER[i], a = U.band(z, k.sicht[0], k.sicht[1], k.sicht[2], k.sicht[3]);
        if (a <= 0.003) { if (k.obj) k.obj.visible = false; continue; }
        baue(k);
        var o = k.obj;
        o.visible = true;
        o.position.set((k.pos[0] - f[0]) * s, (k.pos[1] - f[1]) * s, (k.pos[2] - f[2]) * s);
        o.scale.setScalar(k.einheit * s);
        setzeAlpha(k, a);
        var j;
        if (k.blick.length) {
          o.updateMatrixWorld();
          for (j = 0; j < k.blick.length; j++) {
            k.blick[j].parent.getWorldQuaternion(q);
            k.blick[j].quaternion.copy(q.invert().multiply(kamera.quaternion));
          }
        }
        for (j = 0; j < k.punktMats.length; j++) k.punktMats[j].uniforms.uSkala.value = k.einheit * s;
        if (o.userData.jedesBild) o.userData.jedesBild(ctx);
      }

      /* Licht */
      kameraLicht.set(-0.6, 0.8, 0.5).normalize().applyQuaternion(kamera.quaternion);
      licht.position.copy(kameraLicht).lerp(sonnenLicht, U.band(z, -1.6, -0.9, 3.0, 4.0)).normalize().multiplyScalar(10);

      /* Hintergrund */
      tagHimmel.position.copy(kamera.position);
      tagHimmel.material.uniforms.uAlpha.value = U.band(z, -1.4, -0.5, 3.8, 5.6);
      himmel.position.copy(kamera.position);
      himmel.material.uniforms.uAlpha.value = U.band(z, 4.4, 6.6, 20.0, 21.4) * 0.9 + U.band(z, 21.4, 23, 99, 100) * 0.12;
      staub.position.copy(kamera.position);
      staub.rotation.y = zeit * 0.01;
      staub.material.uniforms.uAlpha.value = 1 - U.glatt(-2.2, -0.4, z);
      var mikro = 1 - U.glatt(-2.5, -0.5, z), all = U.glatt(3.6, 5.8, z);
      grund.copy(grundFarben.welt).lerp(grundFarben.mikro, mikro).lerp(grundFarben.all, all);
      renderer.setClearColor(grund);
      aktualisiereWarp(Z.v, dt);

      var uPix = renderer.getDrawingBufferSize(puffer).y / (2 * TAN);
      for (i = 0; i < punktMats.length; i++) {
        var u = punktMats[i].uniforms;
        u.uPix.value = uPix; u.uDpr.value = dpr; u.uMin.value = 1.3 * dpr;
        if (!punktMats[i].userData.maxGesetzt) { u.uMax.value *= dpr; punktMats[i].userData.maxGesetzt = true; }
      }
      for (i = 0; i < zeitMats.length; i++) zeitMats[i].uniforms.uZeit.value = zeit;

      renderer.render(szene, kamera);

      /* Schilder */
      for (i = 0; i < SCHILDER.length; i++) {
        var sch = SCHILDER[i];
        sch.schild.alpha = U.band(z, sch.sicht[0], sch.sicht[1], sch.sicht[2], sch.sicht[3]);
        if (sch.schild.alpha > 0.02) sch.schild.welt.set((sch.pos[0] - f[0]) * s, (sch.pos[1] - f[1]) * s, (sch.pos[2] - f[2]) * s);
      }
      schilder.aktualisiere(kamera, breite, hoehe);
      aktualisiereAnzeige(W, s, abstand);
    }
    requestAnimationFrame(bild);

    /* Körper im Leerlauf vorbauen, damit beim Zoomen nichts ruckelt
       (zuerst die Nachbarn der Startansicht) */
    var reihe = KOERPER.slice().sort(function (a, b) {
      function mitte(k) { return Math.abs((k.sicht[1] + k.sicht[2]) / 2 - Z.z); }
      return mitte(a) - mitte(b);
    });
    function vorbauen() {
      var k = reihe.shift();
      if (!k) return;
      baue(k);
      if (window.requestIdleCallback) requestIdleCallback(vorbauen, { timeout: 400 });
      else setTimeout(vorbauen, 30);
    }
    setTimeout(vorbauen, 600);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.querySelector('[data-universum="groessen"]');
    if (b) start(b);
  });
})();
