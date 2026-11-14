/* =========================================================================
   ZENTRALE DATEN-DATEI
   =========================================================================
   Hier – und NUR hier – wird gepflegt:
     1. die Hauptzweige (zweige)
     2. die komplette Themen-Struktur (Fachgebiete → Kapitel → Themen)

   Navigation, Startseite, Themenübersicht und Brotkrumen auf den
   Themenseiten werden automatisch aus diesen Daten erzeugt.
   Eine neue Seite hinzufügen = HTML-Datei anlegen + hier EINEN Eintrag
   ergänzen. Sonst muss nirgendwo etwas angepasst werden.

   Aufbau:
     zweige      – die fünf Hauptzweige. Ihre Reihenfolge ist die
                   Reihenfolge auf Startseite und Themenübersicht. Felder:
                   id, name, kurzname (optional, für enge Stellen),
                   datei (Bereichsseite mit allen Fachgebieten),
                   untertitel (kurze Zeile im Menü „Themen“),
                   beschreibung, reiter (Reiter der Themenseiten; leer =
                   Erklärseite), seitenart (ein Satz zum Seitenaufbau).
     fachgebiete – flache Liste; jedes Fachgebiet nennt in "zweig" die id
                   seines Hauptzweigs. Innerhalb eines Zweigs zählt die
                   Reihenfolge in dieser Liste.

   Felder eines Kapitels:
     name   – Anzeigename
     art    – optional "theorie": Kapitel, das (fast) nur in der
              Theorie-Vorlesung vorkommt. Erscheint in der Übersicht mit
              der Notiz "Theorie". Alle anderen Kapitel verbinden
              Experiment und Theorie auf derselben Seite.

   Felder eines Themas:
     id     – eindeutiger Kurzname (klein, ohne Umlaute, mit Bindestrichen).
              Muss mit data-thema im <body> der Themenseite übereinstimmen.
     titel  – Anzeigename
     datei  – Pfad der HTML-Datei relativ zur Website-Wurzel
              (themen/<fachgebiet-id>/<id>.html)
     status – "online"  → wird verlinkt
              "geplant" → erscheint ausgegraut ohne Link
     stichworte – optional, Liste weiterer Namen des Themas für die
              Themensuche im Kopf (z. B. ["Noether-Theorem"]). Die Suche
              findet nur Online-Themen über Titel, Fachgebiet, Kapitel, id
              und diese Stichworte, nie über den Seitentext.
     braucht – optional (bei Online-Themen gepflegt), ids der Themen, die
              man vorher kennen sollte. Nur die direkten Voraussetzungen
              eintragen, nicht deren Voraussetzungen. Daraus zeichnet
              themen/landkarte.html die Themen-Landkarte (js/landkarte.js).

   PRÜFEN: Die geplanten Themen außerhalb von Mechanik und Wärmelehre
   stammen aus den Datei- und Kapitelnamen der Mitschriften (Stand
   2026-11-11), nicht aus deren Inhalt. Vor dem Schreiben eines Gebiets
   mit der Mitschrift abgleichen und hier anpassen.
   ========================================================================= */

var SITE = {

  zweige: [
    {
      id: "methoden",
      name: "Mathematische Grundlagen der Physik",
      kurzname: "Mathe-Grundlagen",
      datei: "themen/grundlagen.html",
      untertitel: "Vektoren, Koordinaten, Integrale",
      beschreibung: "Um Physik zu verstehen, brauchen wir etwas Mathematik – hier wird sie erklärt: Vektoren, Koordinaten und Vektoranalysis, anschaulich und ohne Umweg über Beweise.",
      reiter: ["verstehen", "beispiele", "aufgaben"],
      seitenart: "Drei Reiter: „Verstehen“ erklärt die Mathematik selbst, dazu Beispielrechnungen und Aufgaben."
    },
    {
      id: "physik",
      name: "Physik",
      datei: "themen/physik.html",
      untertitel: "Von der Mechanik bis zur Kernphysik",
      beschreibung: "Von der Mechanik bis zur Kernphysik. Experiment und Theorie stehen zusammen: Jede Seite zeigt das Phänomen und seine Herleitung.",
      reiter: ["verstehen", "vertiefung", "beispiele", "aufgaben"],
      seitenart: "Vier Reiter: anschaulich für alle, mit Herleitung, Beispielrechnungen und Aufgaben fürs Studium."
    },
    {
      id: "mathematik",
      name: "Mathematik",
      datei: "themen/mathematik.html",
      untertitel: "Analysis, Lineare Algebra, DGL",
      beschreibung: "Die Mathe-Module des Studiums: Analysis, Lineare Algebra, Differentialgleichungen und Funktionentheorie.",
      reiter: ["verstehen", "vertiefung", "beispiele", "aufgaben"],
      seitenart: "Vier Reiter: anschaulich für alle, mit Definitionen und Herleitungen, Beispielrechnungen und Aufgaben fürs Studium."
    },
    {
      id: "kosmos",
      name: "Astrophysik & Kosmologie",
      kurzname: "Astrophysik",
      datei: "themen/astrophysik-kosmologie.html",
      untertitel: "Sterne, Galaxien, Universum",
      beschreibung: "Wie Sterne leuchten, leben und sterben, was Galaxien zusammenhält und wie das Universum entstanden ist.",
      reiter: [],
      seitenart: "Erklärseiten: ein durchgehender Text zum Lesen. Wer nachrechnen möchte, klappt die Rechenkästen auf."
    },
    {
      id: "alltagsphysik",
      name: "Physik im Alltag",
      kurzname: "Alltag",
      datei: "themen/physik-im-alltag.html",
      untertitel: "Himmel, Strom, Technik, Wetter",
      beschreibung: "Warum ist der Himmel blau? Wie funktioniert Strom? Die Physik hinter den Dingen, die uns jeden Tag begegnen.",
      reiter: [],
      seitenart: "Erklärseiten: ein durchgehender Text zum Lesen. Wer nachrechnen möchte, klappt die Rechenkästen auf."
    }
  ],

  /* Werkzeug-Seiten (Landkarte, Formelsammlung, Glossar, Energie-Leiter):
     stehen im Menü „Themen“ unter „Nachschlagen“ und
     werden von der Themensuche gefunden. id = data-seite im <body>
     (markiert den Menüeintrag), Icon in ICONS (js/seite.js). */
  extras: [
    { id: "landkarte", name: "Themen-Landkarte", zeile: "Was baut worauf auf?", datei: "themen/landkarte.html", stichworte: ["Lernpfad", "Voraussetzungen", "Wissensgraph"] },
    { id: "formelsammlung", name: "Formelsammlung", zeile: "Alle Merkkästen, zum Ausdrucken", datei: "themen/formelsammlung.html", stichworte: ["Formeln", "Spickzettel", "PDF", "drucken"] },
    { id: "glossar", name: "Glossar", zeile: "Fachbegriffe und Formelzeichen", datei: "themen/glossar.html", stichworte: ["Begriffe", "Lexikon", "Formelzeichen", "Symbole", "Einheiten"] },
    { id: "energie-leiter", name: "Energie-Leiter", zeile: "Von 10⁻²⁴ bis 10⁴⁸ Joule", datei: "themen/energie-leiter.html", stichworte: ["Energie", "Joule", "Größenordnung", "Umrechner", "kWh", "Kalorien"] }
  ],

  fachgebiete: [

    /* =====================================================================
       ZWEIG 1: MATHEMATISCHE GRUNDLAGEN DER PHYSIK
       ===================================================================== */

    {
      id: "rechenmethoden",
      zweig: "methoden",
      name: "Mathematische Grundlagen",
      beschreibung: "Vektoren, Matrizen und Vektoranalysis – das Rüstzeug, mit dem in der Physik gerechnet wird, ohne Umweg über die Beweise.",
      kapitel: [
        {
          name: "Vektoren & Matrizen",
          themen: [
            { id: "vektoren", titel: "Vektorrechnung", datei: "themen/rechenmethoden/vektoren.html", status: "online" },
            { id: "matrizen", titel: "Matrizen und Determinanten", datei: "themen/rechenmethoden/matrizen.html", status: "online", braucht: ["vektoren"] }
          ]
        },
        {
          name: "Koordinaten & Vektoranalysis",
          themen: [
            { id: "koordinatensysteme", titel: "Krummlinige Koordinatensysteme", datei: "themen/rechenmethoden/koordinatensysteme.html", status: "online", braucht: ["vektoren"] },
            { id: "differentialoperatoren", titel: "Gradient, Divergenz und Rotation", datei: "themen/rechenmethoden/differentialoperatoren.html", status: "online", braucht: ["vektoren"] },
            { id: "operatoren-krummlinig", titel: "Differentialoperatoren in krummlinigen Koordinaten", datei: "themen/rechenmethoden/operatoren-krummlinig.html", status: "online", braucht: ["koordinatensysteme", "differentialoperatoren"] }
          ]
        },
        {
          name: "Integrieren & Differentialgleichungen",
          themen: [
            { id: "kurvenintegrale", titel: "Kurven-, Flächen- und Volumenintegrale", datei: "themen/rechenmethoden/kurvenintegrale.html", status: "online", braucht: ["koordinatensysteme"] },
            { id: "integralsaetze", titel: "Die Integralsätze von Gauß und Stokes", datei: "themen/rechenmethoden/integralsaetze.html", status: "online", braucht: ["differentialoperatoren", "kurvenintegrale"] },
            { id: "dgl-physik", titel: "Differentialgleichungen in der Physik", datei: "themen/rechenmethoden/dgl-physik.html", status: "online" }
          ]
        }
      ]
    },


    /* =====================================================================
       ZWEIG 2: PHYSIK
       Experiment und Theorie werden NICHT getrennt: ein Thema = eine Seite.
       Kapitel mit art: "theorie" enthalten Stoff, den es nur in der
       Theorie-Vorlesung gibt (z. B. Lagrange-Formalismus).
       ===================================================================== */
    {
      id: "mechanik",
      zweig: "physik",
      name: "Klassische Mechanik",
      beschreibung: "Bewegung, Kräfte, Energie und Impuls – von der fallenden Kaffeetasse bis zur Planetenbahn.",
      kapitel: [
        {
          name: "Kinematik",
          themen: [
            { id: "bewegung-1d", titel: "Bewegung in einer Dimension", datei: "themen/mechanik/bewegung-1d.html", status: "online" },
            { id: "bewegung-3d", titel: "Bewegung in drei Dimensionen", datei: "themen/mechanik/bewegung-3d.html", status: "online", braucht: ["bewegung-1d", "vektoren"] }
          ]
        },
        {
          name: "Dynamik",
          themen: [
            { id: "newton-axiome", titel: "Die Newtonschen Axiome", datei: "themen/mechanik/newton-axiome.html", status: "online", braucht: ["bewegung-3d"] },
            { id: "kraefte", titel: "Kräfte im Alltag: Gewicht, Reibung, Federn", datei: "themen/mechanik/kraefte.html", status: "online", braucht: ["newton-axiome"] }
          ]
        },
        {
          name: "Arbeit & Energie",
          themen: [
            { id: "arbeit-leistung", titel: "Arbeit und Leistung", datei: "themen/mechanik/arbeit-leistung.html", status: "online", braucht: ["kraefte", "kurvenintegrale"] },
            { id: "energieerhaltung", titel: "Energieformen und Energieerhaltung", datei: "themen/mechanik/energieerhaltung.html", status: "online", braucht: ["arbeit-leistung"] }
          ]
        },
        {
          name: "Impuls & Stöße",
          themen: [
            { id: "impuls-schwerpunkt", titel: "Schwerpunkt und Impulserhaltung", datei: "themen/mechanik/impuls-schwerpunkt.html", status: "online", braucht: ["newton-axiome"] },
            { id: "stoesse", titel: "Elastische und inelastische Stöße", datei: "themen/mechanik/stoesse.html", status: "online", braucht: ["impuls-schwerpunkt", "energieerhaltung"] }
          ]
        },
        {
          name: "Rotation",
          themen: [
            { id: "drehbewegung", titel: "Drehbewegung: Drehmoment, Trägheitsmoment, Drehimpuls", datei: "themen/mechanik/drehbewegung.html", status: "online", braucht: ["impuls-schwerpunkt", "energieerhaltung"] },
            { id: "rollbewegung", titel: "Rollbewegung", datei: "themen/mechanik/rollbewegung.html", status: "online", braucht: ["drehbewegung"] },
            { id: "kreisel", titel: "Trägheitstensor und Kreisel", datei: "themen/mechanik/kreisel.html", status: "online", braucht: ["drehbewegung", "matrizen"] },
            { id: "scheinkraefte", titel: "Scheinkräfte: Zentrifugal- und Corioliskraft", datei: "themen/mechanik/scheinkraefte.html", status: "online", braucht: ["drehbewegung"] }
          ]
        },
        {
          name: "Gravitation",
          themen: [
            { id: "gravitation", titel: "Das Newtonsche Gravitationsgesetz", datei: "themen/mechanik/gravitation.html", status: "online", braucht: ["energieerhaltung"] },
            { id: "kepler", titel: "Planetenbewegung und die Keplerschen Gesetze", datei: "themen/mechanik/kepler.html", status: "online", braucht: ["gravitation", "drehbewegung"] }
          ]
        },
        {
          name: "Kontinuumsmechanik",
          themen: [
            { id: "elastizitaet", titel: "Elastizität: Dehnung, Kompression und Scherung", datei: "themen/mechanik/elastizitaet.html", status: "online", braucht: ["kraefte"] },
            { id: "ruhende-fluide", titel: "Ruhende Fluide: Druck und Auftrieb", datei: "themen/mechanik/ruhende-fluide.html", status: "online", braucht: ["kraefte"] },
            { id: "stroemende-fluide", titel: "Strömende Fluide: Bernoulli und Viskosität", datei: "themen/mechanik/stroemende-fluide.html", status: "online", braucht: ["ruhende-fluide", "energieerhaltung"] }
          ]
        },
        {
          name: "Analytische Mechanik",
          art: "theorie",
          themen: [
            { id: "lagrange", titel: "Der Lagrange-Formalismus", datei: "themen/mechanik/lagrange.html", status: "online", braucht: ["energieerhaltung", "koordinatensysteme", "dgl-physik"] },
            { id: "noether", titel: "Symmetrien und Erhaltungssätze", datei: "themen/mechanik/noether.html", status: "online", braucht: ["lagrange", "drehbewegung"] },
            { id: "hamilton", titel: "Der Hamilton-Formalismus", datei: "themen/mechanik/hamilton.html", status: "online", braucht: ["lagrange"] }
          ]
        }
      ]
    },

    {
      id: "thermodynamik",
      zweig: "physik",
      name: "Thermodynamik & Statistische Physik",
      beschreibung: "Wärme, Temperatur und die Frage, warum manche Vorgänge nur in eine Richtung laufen – vom Gas im Kolben bis zur Statistik vieler Teilchen.",
      kapitel: [
        {
          name: "Gase",
          themen: [
            { id: "ideales-gas", titel: "Das ideale Gas und die kinetische Gastheorie", datei: "themen/thermodynamik/ideales-gas.html", status: "online", braucht: ["impuls-schwerpunkt", "ruhende-fluide"] },
            { id: "reale-gase", titel: "Reale Gase und die Van-der-Waals-Gleichung", datei: "themen/thermodynamik/reale-gase.html", status: "online", braucht: ["ideales-gas"] }
          ]
        },
        {
          name: "Wärme & Energie",
          themen: [
            { id: "waermekapazitaet", titel: "Wärmekapazität und Wärmetransport", datei: "themen/thermodynamik/waermekapazitaet.html", status: "online", braucht: ["ideales-gas"] },
            { id: "transportphaenomene", titel: "Diffusion, Wärmeleitung und Viskosität", datei: "themen/thermodynamik/transportphaenomene.html", status: "online", braucht: ["waermekapazitaet", "stroemende-fluide"] },
            { id: "hauptsaetze", titel: "Die Hauptsätze der Thermodynamik", datei: "themen/thermodynamik/hauptsaetze.html", status: "online", braucht: ["waermekapazitaet", "energieerhaltung"] },
            { id: "kreisprozesse", titel: "Kreisprozesse: Wärmekraftmaschine und Wärmepumpe", datei: "themen/thermodynamik/kreisprozesse.html", status: "online", braucht: ["hauptsaetze"] }
          ]
        },
        {
          name: "Thermodynamische Potentiale",
          art: "theorie",
          themen: [
            { id: "potentiale", titel: "Thermodynamische Potentiale und Maxwell-Relationen", datei: "themen/thermodynamik/potentiale.html", status: "online", braucht: ["hauptsaetze"] },
            { id: "phasenuebergaenge", titel: "Phasenübergänge", datei: "themen/thermodynamik/phasenuebergaenge.html", status: "online", braucht: ["potentiale", "reale-gase"] }
          ]
        },
        {
          name: "Statistische Physik",
          art: "theorie",
          themen: [
            { id: "ensembles", titel: "Ensembles und Zustandssumme", datei: "themen/thermodynamik/ensembles.html", status: "online", braucht: ["potentiale"] },
            { id: "quantenstatistik", titel: "Quantenstatistik: Fermi- und Bose-Gase", datei: "themen/thermodynamik/quantenstatistik.html", status: "online", braucht: ["ensembles"] },
            { id: "ising", titel: "Das Ising-Modell: Simulation und Quantenphasenübergang", datei: "themen/thermodynamik/ising.html", status: "online", braucht: ["ensembles", "phasenuebergaenge"], stichworte: ["Monte-Carlo", "Metropolis", "Wolff-Algorithmus", "Querfeld", "Heisenberg-Modell", "Hubbard-Modell", "Onsager"] }
          ]
        }
      ]
    },

    {
      id: "schwingungen-wellen",
      zweig: "physik",
      name: "Schwingungen & Wellen",
      beschreibung: "Pendel, Saiten und Schall: was schwingt, wie Wellen sich ausbreiten und warum sich Wellen überlagern.",
      kapitel: [
        {
          name: "Schwingungen",
          themen: [
            { id: "harmonische-schwingung", titel: "Der harmonische Oszillator", datei: "themen/schwingungen-wellen/harmonische-schwingung.html", status: "online", braucht: ["kraefte", "dgl-physik"] },
            { id: "erzwungene-schwingung", titel: "Gedämpfte und erzwungene Schwingungen, Resonanz", datei: "themen/schwingungen-wellen/erzwungene-schwingung.html", status: "online", braucht: ["harmonische-schwingung"] },
            { id: "gekoppelte-schwingungen", titel: "Gekoppelte Schwingungen", datei: "themen/schwingungen-wellen/gekoppelte-schwingungen.html", status: "online", braucht: ["harmonische-schwingung", "matrizen"] }
          ]
        },
        {
          name: "Wellen",
          themen: [
            { id: "wellen", titel: "Wellen und die Wellengleichung", datei: "themen/schwingungen-wellen/wellen.html", status: "online", braucht: ["gekoppelte-schwingungen"], stichworte: ["Wellengleichung", "Phasengeschwindigkeit", "Wellenlänge", "Dispersion", "Intensität"] },
            { id: "ueberlagerung", titel: "Überlagerung, stehende Wellen und Schwebung", datei: "themen/schwingungen-wellen/ueberlagerung.html", status: "online", braucht: ["wellen"], stichworte: ["Interferenz", "stehende Welle", "Eigenschwingung", "Oberton", "Fourier", "Gruppengeschwindigkeit", "Reflexion"] },
            { id: "schall", titel: "Schall und Doppler-Effekt", datei: "themen/schwingungen-wellen/schall.html", status: "online", braucht: ["wellen", "hauptsaetze"], stichworte: ["Schallgeschwindigkeit", "Dezibel", "Schallpegel", "Schalldruck", "Doppler-Effekt", "Machkegel", "Überschallknall", "Ultraschall"] }
          ]
        }
      ]
    },

    {
      id: "elektrodynamik",
      zweig: "physik",
      name: "Elektrodynamik",
      beschreibung: "Ladungen, Ströme und Felder – bis zu den Maxwell-Gleichungen und dem Licht als elektromagnetischer Welle.",
      kapitel: [
        {
          name: "Elektrostatik",
          themen: [
            { id: "coulomb", titel: "Ladung und Coulomb-Gesetz", datei: "themen/elektrodynamik/coulomb.html", status: "online", braucht: ["gravitation"] },
            { id: "elektrisches-feld", titel: "Das elektrische Feld und der Satz von Gauß", datei: "themen/elektrodynamik/elektrisches-feld.html", status: "online", braucht: ["coulomb", "integralsaetze"] },
            { id: "potential-spannung", titel: "Potential und Spannung", datei: "themen/elektrodynamik/potential-spannung.html", status: "online", braucht: ["elektrisches-feld"] },
            { id: "kondensator", titel: "Kondensator und Dielektrika", datei: "themen/elektrodynamik/kondensator.html", status: "online", braucht: ["potential-spannung"] }
          ]
        },
        {
          name: "Ströme & Magnetfelder",
          themen: [
            { id: "strom-widerstand", titel: "Elektrischer Strom und Widerstand", datei: "themen/elektrodynamik/strom-widerstand.html", status: "online", braucht: ["potential-spannung"] },
            { id: "magnetfeld", titel: "Magnetfelder und Lorentzkraft", datei: "themen/elektrodynamik/magnetfeld.html", status: "online", braucht: ["strom-widerstand"] },
            { id: "magnetostatik", titel: "Biot-Savart und das Ampèresche Gesetz", datei: "themen/elektrodynamik/magnetostatik.html", status: "online", braucht: ["magnetfeld", "integralsaetze"] },
            { id: "magnetismus-materie", titel: "Magnetismus in Materie", datei: "themen/elektrodynamik/magnetismus-materie.html", status: "online", braucht: ["magnetostatik"] }
          ]
        },
        {
          name: "Zeitabhängige Felder",
          themen: [
            { id: "induktion", titel: "Elektromagnetische Induktion", datei: "themen/elektrodynamik/induktion.html", status: "online", braucht: ["magnetostatik"] },
            { id: "wechselstrom", titel: "Wechselstrom und Schwingkreis", datei: "themen/elektrodynamik/wechselstrom.html", status: "online", braucht: ["induktion", "kondensator", "erzwungene-schwingung"] },
            { id: "maxwell", titel: "Die Maxwell-Gleichungen", datei: "themen/elektrodynamik/maxwell.html", status: "geplant" }
          ]
        },
        {
          name: "Elektromagnetische Wellen",
          themen: [
            { id: "em-wellen", titel: "Elektromagnetische Wellen", datei: "themen/elektrodynamik/em-wellen.html", status: "geplant" },
            { id: "dipolstrahlung", titel: "Wie Antennen strahlen: der Hertzsche Dipol", datei: "themen/elektrodynamik/dipolstrahlung.html", status: "geplant" }
          ]
        },
        {
          name: "Methoden der Elektrodynamik",
          art: "theorie",
          themen: [
            { id: "multipole", titel: "Multipolentwicklung", datei: "themen/elektrodynamik/multipole.html", status: "geplant" },
            { id: "randwertprobleme", titel: "Randwertprobleme und Greensche Funktionen", datei: "themen/elektrodynamik/randwertprobleme.html", status: "geplant" },
            { id: "eichung", titel: "Potentiale und Eichfreiheit", datei: "themen/elektrodynamik/eichung.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "optik",
      zweig: "physik",
      name: "Optik",
      beschreibung: "Licht als Strahl und als Welle: Linsen, Interferenz, Beugung und der Laser.",
      kapitel: [
        {
          name: "Geometrische Optik",
          themen: [
            { id: "reflexion-brechung", titel: "Reflexion und Brechung", datei: "themen/optik/reflexion-brechung.html", status: "geplant" },
            { id: "linsen", titel: "Linsen und optische Abbildung", datei: "themen/optik/linsen.html", status: "geplant" },
            { id: "optische-instrumente", titel: "Optische Instrumente: Lupe, Mikroskop, Teleskop", datei: "themen/optik/optische-instrumente.html", status: "geplant" }
          ]
        },
        {
          name: "Wellenoptik",
          themen: [
            { id: "interferenz", titel: "Interferenz", datei: "themen/optik/interferenz.html", status: "geplant" },
            { id: "kohaerenz", titel: "Kohärenz", datei: "themen/optik/kohaerenz.html", status: "geplant" },
            { id: "beugung", titel: "Beugung an Spalt und Gitter", datei: "themen/optik/beugung.html", status: "geplant" },
            { id: "aufloesung", titel: "Das Auflösungsvermögen", datei: "themen/optik/aufloesung.html", status: "geplant" }
          ]
        },
        {
          name: "Licht in Materie",
          themen: [
            { id: "polarisation", titel: "Polarisation und Doppelbrechung", datei: "themen/optik/polarisation.html", status: "geplant" },
            { id: "dispersion", titel: "Dispersion", datei: "themen/optik/dispersion.html", status: "geplant" },
            { id: "laser", titel: "Grundlagen des Lasers", datei: "themen/optik/laser.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "relativitaet",
      zweig: "physik",
      name: "Relativitätstheorie",
      beschreibung: "Warum bewegte Uhren langsamer gehen und Masse eine Form von Energie ist.",
      kapitel: [
        {
          name: "Spezielle Relativitätstheorie",
          themen: [
            { id: "lorentz", titel: "Relativitätsprinzip und Lorentz-Transformation", datei: "themen/relativitaet/lorentz.html", status: "geplant" },
            { id: "zeitdilatation", titel: "Zeitdilatation und Längenkontraktion", datei: "themen/relativitaet/zeitdilatation.html", status: "geplant" },
            { id: "relativistische-dynamik", titel: "Relativistische Energie und Impuls", datei: "themen/relativitaet/relativistische-dynamik.html", status: "geplant" }
          ]
        },
        {
          name: "Kovariante Formulierung",
          art: "theorie",
          themen: [
            { id: "vierervektoren", titel: "Vierervektoren und Minkowski-Raum", datei: "themen/relativitaet/vierervektoren.html", status: "geplant" },
            { id: "kovariante-elektrodynamik", titel: "Kovariante Elektrodynamik", datei: "themen/relativitaet/kovariante-elektrodynamik.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "quantenphysik",
      zweig: "physik",
      name: "Quantenphysik",
      beschreibung: "Licht als Teilchen, Elektronen als Wellen – und die Schrödingergleichung, die beides beschreibt.",
      kapitel: [
        {
          name: "Der Weg zur Quantenphysik",
          themen: [
            { id: "hohlraumstrahlung", titel: "Hohlraumstrahlung und das Plancksche Gesetz", datei: "themen/quantenphysik/hohlraumstrahlung.html", status: "geplant" },
            { id: "photoeffekt", titel: "Photoeffekt und Compton-Effekt", datei: "themen/quantenphysik/photoeffekt.html", status: "geplant" },
            { id: "materiewellen", titel: "Materiewellen und Welle-Teilchen-Dualismus", datei: "themen/quantenphysik/materiewellen.html", status: "geplant" }
          ]
        },
        {
          name: "Schrödingergleichung",
          themen: [
            { id: "schroedingergleichung", titel: "Die Schrödingergleichung", datei: "themen/quantenphysik/schroedingergleichung.html", status: "geplant" },
            { id: "potentialtopf", titel: "Potentialtopf und Tunneleffekt", datei: "themen/quantenphysik/potentialtopf.html", status: "geplant" },
            { id: "quanten-oszillator", titel: "Der quantenmechanische Oszillator", datei: "themen/quantenphysik/quanten-oszillator.html", status: "geplant" }
          ]
        },
        {
          name: "Formalismus",
          art: "theorie",
          themen: [
            { id: "formalismus", titel: "Zustände, Operatoren und Messung", datei: "themen/quantenphysik/formalismus.html", status: "geplant" },
            { id: "drehimpuls-qm", titel: "Drehimpuls und Spin", datei: "themen/quantenphysik/drehimpuls-qm.html", status: "geplant" },
            { id: "stoerungstheorie", titel: "Störungstheorie", datei: "themen/quantenphysik/stoerungstheorie.html", status: "geplant" }
          ]
        },
        {
          name: "Höhere Quantenmechanik",
          art: "theorie",
          themen: [
            { id: "streutheorie", titel: "Streutheorie", datei: "themen/quantenphysik/streutheorie.html", status: "geplant" },
            { id: "vielteilchen", titel: "Vielteilchensysteme und zweite Quantisierung", datei: "themen/quantenphysik/vielteilchen.html", status: "geplant" },
            { id: "dirac", titel: "Relativistische Quantenmechanik: die Dirac-Gleichung", datei: "themen/quantenphysik/dirac.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "atomphysik",
      zweig: "physik",
      name: "Atom- & Molekülphysik",
      beschreibung: "Vom Wasserstoffatom bis zum Periodensystem: warum Atome scharfe Spektrallinien haben und wie Moleküle zusammenhalten.",
      kapitel: [
        {
          name: "Das Wasserstoffatom",
          themen: [
            { id: "bohr", titel: "Das Bohrsche Atommodell", datei: "themen/atomphysik/bohr.html", status: "geplant" },
            { id: "wasserstoffatom", titel: "Das Wasserstoffatom", datei: "themen/atomphysik/wasserstoffatom.html", status: "geplant" },
            { id: "feinstruktur", titel: "Feinstruktur und Hyperfeinstruktur", datei: "themen/atomphysik/feinstruktur.html", status: "geplant" },
            { id: "zeeman", titel: "Atome im Magnetfeld: Stern-Gerlach und Zeeman-Effekt", datei: "themen/atomphysik/zeeman.html", status: "geplant" }
          ]
        },
        {
          name: "Atome mit vielen Elektronen",
          themen: [
            { id: "auswahlregeln", titel: "Übergänge und Auswahlregeln", datei: "themen/atomphysik/auswahlregeln.html", status: "geplant" },
            { id: "alkaliatome", titel: "Alkaliatome", datei: "themen/atomphysik/alkaliatome.html", status: "geplant" },
            { id: "mehrelektronen", titel: "Helium, Pauli-Prinzip und Periodensystem", datei: "themen/atomphysik/mehrelektronen.html", status: "geplant" },
            { id: "roentgen", titel: "Röntgenstrahlung", datei: "themen/atomphysik/roentgen.html", status: "geplant" }
          ]
        },
        {
          name: "Moleküle",
          themen: [
            { id: "molekuelbindung", titel: "Die chemische Bindung", datei: "themen/atomphysik/molekuelbindung.html", status: "geplant" },
            { id: "molekuelspektren", titel: "Rotation und Schwingung von Molekülen", datei: "themen/atomphysik/molekuelspektren.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "festkoerper",
      zweig: "physik",
      name: "Festkörperphysik",
      beschreibung: "Kristalle, Gitterschwingungen und Elektronen in Metallen – die Physik hinter jedem Computerchip.",
      kapitel: [
        {
          name: "Struktur",
          themen: [
            { id: "bindungstypen", titel: "Bindungstypen im Festkörper", datei: "themen/festkoerper/bindungstypen.html", status: "geplant" },
            { id: "kristallgitter", titel: "Kristallgitter und reziprokes Gitter", datei: "themen/festkoerper/kristallgitter.html", status: "geplant" },
            { id: "strukturbestimmung", titel: "Strukturbestimmung mit Röntgenbeugung", datei: "themen/festkoerper/strukturbestimmung.html", status: "geplant" }
          ]
        },
        {
          name: "Gitterdynamik",
          themen: [
            { id: "phononen", titel: "Gitterschwingungen und Phononen", datei: "themen/festkoerper/phononen.html", status: "geplant" },
            { id: "anharmonisch", titel: "Wärmeausdehnung und Wärmeleitung", datei: "themen/festkoerper/anharmonisch.html", status: "geplant" }
          ]
        },
        {
          name: "Elektronen im Festkörper",
          themen: [
            { id: "elektronengas", titel: "Das freie Elektronengas", datei: "themen/festkoerper/elektronengas.html", status: "geplant" },
            { id: "spintronik", titel: "Spintronik: Elektronik mit dem Spin", datei: "themen/festkoerper/spintronik.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "kernphysik",
      zweig: "physik",
      name: "Kern- & Teilchenphysik",
      beschreibung: "Was Atomkerne zusammenhält, warum manche zerfallen und woraus alles besteht.",
      kapitel: [
        {
          name: "Atomkerne",
          themen: [
            { id: "kernaufbau", titel: "Aufbau und Größe der Atomkerne", datei: "themen/kernphysik/kernaufbau.html", status: "geplant" },
            { id: "bindungsenergie", titel: "Bindungsenergie und Kernmodelle", datei: "themen/kernphysik/bindungsenergie.html", status: "geplant" }
          ]
        },
        {
          name: "Radioaktivität",
          themen: [
            { id: "radioaktiver-zerfall", titel: "Radioaktiver Zerfall", datei: "themen/kernphysik/radioaktiver-zerfall.html", status: "geplant" },
            { id: "strahlung-materie", titel: "Strahlung in Materie und Detektoren", datei: "themen/kernphysik/strahlung-materie.html", status: "geplant" }
          ]
        },
        {
          name: "Kernreaktionen & Teilchen",
          themen: [
            { id: "spaltung-fusion", titel: "Kernspaltung und Kernfusion", datei: "themen/kernphysik/spaltung-fusion.html", status: "geplant" },
            { id: "standardmodell", titel: "Elementarteilchen und Standardmodell", datei: "themen/kernphysik/standardmodell.html", status: "geplant" }
          ]
        }
      ]
    },

    /* =====================================================================
       ZWEIG 3: MATHEMATIK
       ===================================================================== */
    {
      id: "analysis",
      zweig: "mathematik",
      name: "Analysis",
      beschreibung: "Analysis 1 und 2: von Zahlen und Grenzwerten bis zur Integration in mehreren Dimensionen.",
      kapitel: [
        {
          name: "Analysis 1: Zahlen, Folgen, Reihen",
          themen: [
            { id: "zahlen", titel: "Reelle und komplexe Zahlen", datei: "themen/analysis/zahlen.html", status: "geplant" },
            { id: "folgen-reihen", titel: "Folgen und Reihen", datei: "themen/analysis/folgen-reihen.html", status: "geplant" }
          ]
        },
        {
          name: "Analysis 1: Funktionen einer Variablen",
          themen: [
            { id: "stetigkeit", titel: "Funktionen und Stetigkeit", datei: "themen/analysis/stetigkeit.html", status: "geplant" },
            { id: "ableitung", titel: "Die Ableitung: Begriff und Techniken", datei: "themen/analysis/ableitung.html", status: "geplant" },
            { id: "integration", titel: "Integration", datei: "themen/analysis/integration.html", status: "geplant" },
            { id: "funktionenfolgen", titel: "Funktionenfolgen und Potenzreihen", datei: "themen/analysis/funktionenfolgen.html", status: "geplant" },
            { id: "taylor", titel: "Taylorentwicklung", datei: "themen/analysis/taylor.html", status: "geplant" }
          ]
        },
        {
          name: "Analysis 2: Mehrere Variablen",
          themen: [
            { id: "metrische-raeume", titel: "Metrische und normierte Räume", datei: "themen/analysis/metrische-raeume.html", status: "geplant" },
            { id: "mehrdim-ableitung", titel: "Differentialrechnung im Rⁿ", datei: "themen/analysis/mehrdim-ableitung.html", status: "geplant" },
            { id: "extrema", titel: "Extremwerte mit und ohne Nebenbedingungen", datei: "themen/analysis/extrema.html", status: "geplant" },
            { id: "implizite-funktionen", titel: "Umkehrsatz und implizite Funktionen", datei: "themen/analysis/implizite-funktionen.html", status: "geplant" },
            { id: "mehrfachintegrale", titel: "Mehrfachintegrale und Transformationsformel", datei: "themen/analysis/mehrfachintegrale.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "lineare-algebra",
      zweig: "mathematik",
      name: "Lineare Algebra",
      beschreibung: "Lineare Algebra 1 und 2: Vektorräume, Matrizen, Eigenwerte – die Grundlage für Quantenmechanik und Numerik.",
      kapitel: [
        {
          name: "Lineare Algebra 1",
          themen: [
            { id: "algebraische-strukturen", titel: "Gruppen, Ringe und Körper", datei: "themen/lineare-algebra/algebraische-strukturen.html", status: "geplant" },
            { id: "vektorraeume", titel: "Vektorräume, Basis und Dimension", datei: "themen/lineare-algebra/vektorraeume.html", status: "geplant" },
            { id: "lineare-abbildungen", titel: "Lineare Abbildungen und Matrizen", datei: "themen/lineare-algebra/lineare-abbildungen.html", status: "geplant" },
            { id: "gleichungssysteme", titel: "Lineare Gleichungssysteme", datei: "themen/lineare-algebra/gleichungssysteme.html", status: "geplant" },
            { id: "determinanten", titel: "Determinanten", datei: "themen/lineare-algebra/determinanten.html", status: "geplant" }
          ]
        },
        {
          name: "Lineare Algebra 2",
          themen: [
            { id: "eigenwerte", titel: "Eigenwerte und Diagonalisierung", datei: "themen/lineare-algebra/eigenwerte.html", status: "geplant" },
            { id: "jordan", titel: "Die Jordansche Normalform", datei: "themen/lineare-algebra/jordan.html", status: "geplant" },
            { id: "skalarprodukte", titel: "Euklidische und unitäre Vektorräume", datei: "themen/lineare-algebra/skalarprodukte.html", status: "geplant" },
            { id: "spektralsatz", titel: "Spektralsatz und Hauptachsentransformation", datei: "themen/lineare-algebra/spektralsatz.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "dgl",
      zweig: "mathematik",
      name: "Gewöhnliche Differentialgleichungen",
      beschreibung: "Die Theorie hinter jeder Bewegungsgleichung: Lösungsverfahren, Existenz und Stabilität.",
      kapitel: [
        {
          name: "Grundlagen",
          themen: [
            { id: "dgl-elementar", titel: "Elementare Lösungsmethoden", datei: "themen/dgl/dgl-elementar.html", status: "geplant" },
            { id: "picard-lindeloef", titel: "Existenz und Eindeutigkeit: der Satz von Picard-Lindelöf", datei: "themen/dgl/picard-lindeloef.html", status: "geplant" }
          ]
        },
        {
          name: "Lineare Differentialgleichungen",
          themen: [
            { id: "lineare-systeme", titel: "Lineare Systeme und Matrixexponential", datei: "themen/dgl/lineare-systeme.html", status: "geplant" },
            { id: "dgl-hoeherer-ordnung", titel: "Lineare Differentialgleichungen höherer Ordnung", datei: "themen/dgl/dgl-hoeherer-ordnung.html", status: "geplant" }
          ]
        },
        {
          name: "Qualitative Theorie",
          themen: [
            { id: "stabilitaet", titel: "Stabilität und Phasenporträts", datei: "themen/dgl/stabilitaet.html", status: "geplant" }
          ]
        }
      ]
    },

    {
      id: "funktionentheorie",
      zweig: "mathematik",
      name: "Funktionentheorie",
      beschreibung: "Analysis mit komplexen Zahlen – mit dem Residuensatz als Werkzeug für schwierige Integrale.",
      kapitel: [
        {
          name: "Holomorphe Funktionen",
          themen: [
            { id: "holomorphie", titel: "Komplexe Differenzierbarkeit", datei: "themen/funktionentheorie/holomorphie.html", status: "geplant" },
            { id: "cauchy", titel: "Cauchyscher Integralsatz und Integralformel", datei: "themen/funktionentheorie/cauchy.html", status: "geplant" }
          ]
        },
        {
          name: "Reihen & Residuen",
          themen: [
            { id: "laurent", titel: "Laurentreihen und Singularitäten", datei: "themen/funktionentheorie/laurent.html", status: "geplant" },
            { id: "residuensatz", titel: "Der Residuensatz", datei: "themen/funktionentheorie/residuensatz.html", status: "geplant" },
            { id: "konforme-abbildungen", titel: "Konforme Abbildungen", datei: "themen/funktionentheorie/konforme-abbildungen.html", status: "geplant" }
          ]
        }
      ]
    },

    /* =====================================================================
       ZWEIG 4: ASTROPHYSIK & KOSMOLOGIE
       ===================================================================== */
    {
      id: "astrophysik",
      zweig: "kosmos",
      name: "Astrophysik & Kosmologie",
      beschreibung: "Wie Sterne leuchten, leben und sterben und wie das Universum entstanden ist.",
      kapitel: [
        {
          name: "Leben und Tod der Sterne",
          themen: [
            { id: "sternentwicklung", titel: "Sternentwicklung: Vom Gasnebel zum Weißen Zwerg", datei: "themen/astrophysik/sternentwicklung.html", status: "online", braucht: ["gravitation", "ideales-gas"] },
            { id: "sternleichen", titel: "Weiße Zwerge, Neutronensterne und Schwarze Löcher", datei: "themen/astrophysik/sternleichen.html", status: "online", braucht: ["sternentwicklung", "quantenstatistik"] }
          ]
        },
        {
          name: "Sternphysik",
          themen: [
            { id: "sternlicht", titel: "Was uns das Sternlicht verrät: Helligkeit und Spektren", datei: "themen/astrophysik/sternlicht.html", status: "geplant" },
            { id: "sternaufbau", titel: "Der innere Aufbau der Sterne", datei: "themen/astrophysik/sternaufbau.html", status: "geplant" },
            { id: "sternatmosphaeren", titel: "Sternatmosphären", datei: "themen/astrophysik/sternatmosphaeren.html", status: "geplant" }
          ]
        },
        {
          name: "Galaxien & Kosmos",
          themen: [
            { id: "milchstrasse", titel: "Die Milchstraße", datei: "themen/astrophysik/milchstrasse.html", status: "geplant" },
            { id: "kosmologie", titel: "Das expandierende Universum", datei: "themen/astrophysik/kosmologie.html", status: "geplant" },
            { id: "fruehes-universum", titel: "Die thermische Geschichte des Universums", datei: "themen/astrophysik/fruehes-universum.html", status: "geplant" },
            { id: "hintergrundstrahlung", titel: "Die kosmische Hintergrundstrahlung", datei: "themen/astrophysik/hintergrundstrahlung.html", status: "geplant" }
          ]
        }
      ]
    },

    /* =====================================================================
       ZWEIG 5: PHYSIK IM ALLTAG
       (Kapitel "Bewegung und Schwerkraft": die früheren
       Wissenswertes-Artikel, seit 2026-11-13 normale Themen)
       ===================================================================== */
    {
      id: "alltag",
      zweig: "alltagsphysik",
      name: "Physik im Alltag",
      beschreibung: "Himmelsfarben, Strom aus der Steckdose, Mikrowelle und GPS: Die Physik aus dem Studium steckt in vielen Dingen, die wir täglich erleben.",
      kapitel: [
        {
          name: "Bewegung und Schwerkraft",
          themen: [
            { id: "hammer-feder", titel: "Hammer und Feder auf dem Mond", datei: "themen/alltag/hammer-feder.html", status: "online", braucht: ["bewegung-1d"], stichworte: ["Apollo 15", "freier Fall"] },
            { id: "usain-bolt", titel: "Usain Bolts Weltrekord, nachgerechnet", datei: "themen/alltag/usain-bolt.html", status: "online", braucht: ["bewegung-1d"], stichworte: ["Sprint", "100 Meter"] },
            { id: "erde-rast", titel: "Warum spüren wir nicht, dass die Erde rast?", datei: "themen/alltag/erde-rast.html", status: "online", braucht: ["bewegung-1d", "scheinkraefte"], stichworte: ["Erdrotation", "Relativitätsprinzip"] }
          ]
        },
        {
          name: "Licht, Farben und Klang",
          themen: [
            { id: "himmelsfarbe", titel: "Warum der Himmel blau und der Sonnenuntergang rot ist", datei: "themen/alltag/himmelsfarbe.html", status: "geplant" },
            { id: "regenbogen", titel: "Wie ein Regenbogen entsteht", datei: "themen/alltag/regenbogen.html", status: "geplant" },
            { id: "brille", titel: "Wie Brille und Kontaktlinse scharf machen", datei: "themen/alltag/brille.html", status: "geplant" },
            { id: "stimme-aufnahme", titel: "Warum die eigene Stimme auf Aufnahmen fremd klingt", datei: "themen/alltag/stimme-aufnahme.html", status: "geplant" }
          ]
        },
        {
          name: "Strom und Elektrizität",
          themen: [
            { id: "strom", titel: "Wie funktioniert Strom?", datei: "themen/alltag/strom.html", status: "geplant" },
            { id: "steckdose", titel: "Woher der Strom aus der Steckdose kommt", datei: "themen/alltag/steckdose.html", status: "geplant" },
            { id: "tuerklinke", titel: "Warum es an der Türklinke funkt", datei: "themen/alltag/tuerklinke.html", status: "geplant" },
            { id: "akku", titel: "Wie ein Akku Energie speichert", datei: "themen/alltag/akku.html", status: "geplant" },
            { id: "solarzelle", titel: "Wie eine Solarzelle aus Licht Strom macht", datei: "themen/alltag/solarzelle.html", status: "geplant" },
            { id: "touchscreen", titel: "Woher der Touchscreen weiß, wo dein Finger ist", datei: "themen/alltag/touchscreen.html", status: "geplant" }
          ]
        },
        {
          name: "Wetter und Natur",
          themen: [
            { id: "gewitter", titel: "Blitz und Donner", datei: "themen/alltag/gewitter.html", status: "geplant" },
            { id: "wolken", titel: "Wie Wolken entstehen und warum sie nicht herunterfallen", datei: "themen/alltag/wolken.html", status: "geplant" },
            { id: "eis-glatt", titel: "Warum Eis so rutschig ist", datei: "themen/alltag/eis-glatt.html", status: "geplant" },
            { id: "schiffe", titel: "Warum ein Schiff aus Stahl schwimmt", datei: "themen/alltag/schiffe.html", status: "geplant" }
          ]
        },
        {
          name: "Zu Hause",
          themen: [
            { id: "mikrowelle", titel: "Wie die Mikrowelle Essen erwärmt", datei: "themen/alltag/mikrowelle.html", status: "geplant" },
            { id: "kuehlschrank", titel: "Kühlschrank und Wärmepumpe", datei: "themen/alltag/kuehlschrank.html", status: "geplant" },
            { id: "induktionsherd", titel: "Der Induktionsherd", datei: "themen/alltag/induktionsherd.html", status: "geplant" },
            { id: "kochen-berge", titel: "Warum Nudeln in den Bergen länger brauchen", datei: "themen/alltag/kochen-berge.html", status: "geplant" }
          ]
        },
        {
          name: "Unterwegs",
          themen: [
            { id: "fahrrad", titel: "Warum ein fahrendes Fahrrad nicht umfällt", datei: "themen/alltag/fahrrad.html", status: "geplant" },
            { id: "fliegen", titel: "Warum ein Flugzeug fliegt", datei: "themen/alltag/fliegen.html", status: "geplant" },
            { id: "sicherheitsgurt", titel: "Warum Gurt und Airbag Leben retten", datei: "themen/alltag/sicherheitsgurt.html", status: "geplant" },
            { id: "gps", titel: "GPS: Relativitätstheorie in der Hosentasche", datei: "themen/alltag/gps.html", status: "geplant" }
          ]
        }
      ]
    }
  ]
};
