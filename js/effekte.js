/* =========================================================================
   DEKO UND EFFEKTE
   =========================================================================
   Physik-Zeichnungen in den Seitenrändern (anklickbar mit Erklärung),
   Einblenden beim Scrollen, Blur-Text, Count-Up, Spotlight, Partikelfeld
   (Startseite und Kopf der Astrophysik-Themen), Lese-Fortschritt.
   Neue Deko nur mit Eintrag in DEKO_INFO; Details _doku/design.md.
   Einbinden NACH js/seite.js (und ggf. js/uebersichten.js) auf jeder Seite.
   ========================================================================= */

(function (Seite) {
  "use strict";

  var el = Seite.el, findeThema = Seite.findeThema, themaLink = Seite.themaLink, zaehle = Seite.zaehle;

  /* ---------------------------------------------------------------------
     Deko in den Seitenrändern: kleine Physik-Zeichnungen (nur auf sehr
     breiten Bildschirmen sichtbar, siehe CSS .rand-deko). Wellenpaket und
     Interferenzmuster werden hier wirklich ausgerechnet, nicht gemalt.
     --------------------------------------------------------------------- */
  function svgWellenpaket() {
    var kurve = [], oben = [], unten = [];
    for (var x = 0; x <= 320; x += 2) {
      var u = (x - 160) / 62;
      var huelle = Math.exp(-u * u) * 52;                    // Gauß-Einhüllende
      var y = 70 - huelle * Math.cos(0.22 * (x - 160));      // Trägerwelle darin
      kurve.push(x + "," + y.toFixed(1));
      oben.push(x + "," + (70 - huelle).toFixed(1));
      unten.push(x + "," + (70 + huelle).toFixed(1));
    }
    return '<svg viewBox="0 0 320 140" fill="none" stroke="currentColor" stroke-linecap="round">' +
      '<path d="M0 70H320" stroke-width="1" stroke-opacity="0.5" stroke-dasharray="4 5"/>' +
      '<polyline points="' + oben.join(" ") + '" stroke-width="1" stroke-opacity="0.5" stroke-dasharray="3 4"/>' +
      '<polyline points="' + unten.join(" ") + '" stroke-width="1" stroke-opacity="0.5" stroke-dasharray="3 4"/>' +
      '<polyline points="' + kurve.join(" ") + '" stroke-width="1.6"/>' +
      '<text class="beschriftung" x="238" y="26">ψ(x, t)</text>' +
      '</svg>';
  }

  function svgDoppelspalt() {
    var s = '<svg viewBox="0 0 320 230" fill="none" stroke="currentColor" stroke-linecap="round">';
    /* ebene Wellenfronten von links */
    for (var x = 16; x <= 96; x += 20) {
      s += '<path d="M' + x + ' 40V190" stroke-width="1.2" stroke-opacity="0.6"/>';
    }
    /* Blende mit zwei Spalten */
    s += '<path d="M120 18V88M120 106V124M120 142V212" stroke-width="4"/>';
    /* Kreiswellen aus beiden Spalten (werden nach außen schwächer) */
    [97, 133].forEach(function (y0) {
      for (var r = 14; r <= 126; r += 14) {
        var op = Math.max(0.12, 0.6 - r / 220).toFixed(2);
        s += '<path d="M120 ' + (y0 - r) + 'A' + r + ' ' + r + ' 0 0 1 120 ' + (y0 + r) +
             '" stroke-width="1.1" stroke-opacity="' + op + '"/>';
      }
    });
    /* Schirm rechts mit Interferenzmuster: Intensität cos²(ky)·Gauß */
    var muster = [];
    for (var y = 20; y <= 210; y += 2) {
      var v = (y - 115);
      var I = Math.pow(Math.cos(0.19 * v), 2) * Math.exp(-(v * v) / (58 * 58));
      muster.push((300 - 34 * I).toFixed(1) + "," + y);
    }
    s += '<path d="M300 18V212" stroke-width="2.5"/>';
    s += '<polyline points="' + muster.join(" ") + '" stroke-width="1.5"/>';
    return s + '</svg>';
  }

  function svgFeynman() {
    function pfeil(x, y, winkel) {
      return '<polygon points="-5,-3.5 5,0 -5,3.5" fill="currentColor" stroke="none" ' +
             'transform="translate(' + x + ' ' + y + ') rotate(' + winkel + ')"/>';
    }
    return '<svg viewBox="0 0 260 180" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M18 18L110 56L202 18"/>' +            // oberes Elektron
      '<path d="M18 162L110 124L202 162"/>' +         // unteres Elektron
      '<path d="M110 56q7 8.5 0 17t0 17t0 17t0 17"/>' + // Photon (Wellenlinie)
      pfeil(64, 37, 22.4) + pfeil(156, 37, -22.4) +
      pfeil(64, 143, -22.4) + pfeil(156, 143, 22.4) +
      '<circle cx="110" cy="56" r="2.6" fill="currentColor" stroke="none"/>' +
      '<circle cx="110" cy="124" r="2.6" fill="currentColor" stroke="none"/>' +
      '<text class="beschriftung" x="6" y="12">e⁻</text>' +
      '<text class="beschriftung" x="206" y="12">e⁻</text>' +
      '<text class="beschriftung" x="6" y="176">e⁻</text>' +
      '<text class="beschriftung" x="206" y="176">e⁻</text>' +
      '<text class="beschriftung" x="122" y="95">γ</text>' +
      '</svg>';
  }

  function baueRandDeko() {
    var deko = el("div", "rand-deko");

    var welle = el("div", "deko-welle");     welle.innerHTML = svgWellenpaket();
    var spalt = el("div", "deko-spalt");     spalt.innerHTML = svgDoppelspalt();
    var feyn  = el("div", "deko-feynman");   feyn.innerHTML  = svgFeynman();
    welle.setAttribute("data-info", "wellenpaket");
    spalt.setAttribute("data-info", "doppelspalt");
    feyn.setAttribute("data-info", "feynman");

    var f1 = el("div", "deko-formel deko-formel-1");
    f1.innerHTML = "iħ ∂ψ/<span class=\"deko-luft\">∂t</span> = Ĥ<span class=\"deko-luft\">ψ</span>";
    var f2 = el("div", "deko-formel deko-formel-2", "E = mc²");
    var f3 = el("div", "deko-formel deko-formel-3");
    f3.innerHTML = "∂<sub>μ</sub>F<sup>μν</sup> = μ<sub class=\"deko-tief\">0</sub> J<sup>ν</sup>";
    f1.setAttribute("data-info", "schroedinger");
    f2.setAttribute("data-info", "emc2");
    f3.setAttribute("data-info", "maxwell");

    deko.append(welle, spalt, feyn, f1, f2, f3);
    document.body.append(deko);
  }

  /* ---------------------------------------------------------------------
     Erklärungen zur Deko: Jedes Element mit data-info="schlüssel" (die
     Zeichnungen und Formeln in den Seitenrändern, die handschriftlichen
     Notizen am Sonnensystem) wird anklickbar und öffnet einen kleinen
     Infokasten. Texte hier pflegen. thema = id einer Themenseite für
     „Mehr dazu“ – der Link erscheint erst, wenn das Thema online ist.
     --------------------------------------------------------------------- */
  var DEKO_INFO = {
    wellenpaket: {
      gebiet: "Quantenmechanik",
      titel: "Ein Wellenpaket",
      text: [
        "In der Quantenmechanik wird ein Teilchen – etwa ein Elektron – durch eine Welle beschrieben, die Wellenfunktion ψ. Ein Wellenpaket ist nur in einem kleinen Bereich nennenswert groß: Dort hält sich das Teilchen am wahrscheinlichsten auf.",
        "Die Zeichnung ist echt berechnet: eine Kosinuswelle unter einer Glockenkurve (gestrichelt). Je schmaler das Paket, desto mehr verschiedene Wellenlängen stecken darin – und desto ungenauer ist der Impuls des Teilchens bestimmt. Das ist die Heisenbergsche Unschärferelation."
      ]
    },
    doppelspalt: {
      gebiet: "Optik und Quantenphysik",
      titel: "Der Doppelspalt",
      text: [
        "Von links laufen gerade Wellenfronten auf eine Wand mit zwei schmalen Spalten. Hinter jedem Spalt breitet sich eine Kreiswelle aus, und beide überlagern sich: Trifft Berg auf Berg, verstärken sie sich, trifft Berg auf Tal, löschen sie sich aus. Die Kurve am Schirm rechts zeigt die Helligkeit – helle und dunkle Streifen im Wechsel.",
        "Thomas Young bewies damit Anfang des 19. Jahrhunderts, dass Licht eine Welle ist. Die große Überraschung kam später: Schickt man einzelne Elektronen nacheinander durch zwei Spalte, baut sich Punkt für Punkt dasselbe Streifenmuster auf. Auch Materie verhält sich wie eine Welle."
      ]
    },
    feynman: {
      gebiet: "Teilchenphysik",
      titel: "Ein Feynman-Diagramm",
      text: [
        "Zwei Elektronen (e⁻) fliegen aufeinander zu und stoßen sich ab. Nach der Quantenelektrodynamik passiert das, indem sie ein Photon austauschen (γ, die Wellenlinie) – das Lichtteilchen überträgt die elektrische Kraft. Die Zeit läuft in der Zeichnung von links nach rechts.",
        "Richard Feynman erfand diese Bildersprache Ende der 1940er-Jahre. Jedes Diagramm steht für einen ganz bestimmten Term einer Rechnung, man kann die Bilder also wörtlich in Formeln übersetzen. 1965 erhielt Feynman für seine Arbeiten zur Quantenelektrodynamik den Nobelpreis."
      ]
    },
    schroedinger: {
      gebiet: "Quantenmechanik",
      titel: "Die Schrödinger-Gleichung",
      text: [
        "Die Grundgleichung der Quantenmechanik, aufgestellt 1926 von Erwin Schrödinger. Sie sagt, wie sich die Wellenfunktion ψ eines Teilchens mit der Zeit verändert – und spielt damit dieselbe Rolle wie Newtons F = m·a in der klassischen Mechanik.",
        "ħ („h quer“) ist das reduzierte Plancksche Wirkungsquantum, eine winzige Naturkonstante von rund 10⁻³⁴ J·s. Ĥ, der Hamilton-Operator, steht für die Energie des Systems. Löst man die Gleichung für das Wasserstoffatom, erhält man genau die Energiestufen, die man im Licht leuchtender Gase misst."
      ],
      thema: "newton-axiome"
    },
    emc2: {
      gebiet: "Relativitätstheorie",
      titel: "E = mc²",
      text: [
        "Albert Einstein fand 1905 heraus, dass Masse und Energie zwei Seiten derselben Sache sind. Die Formel sagt, wie viel Energie E in einer Masse m steckt; c ist die Lichtgeschwindigkeit, knapp 300 000 Kilometer pro Sekunde.",
        "Weil c² so riesig ist, steckt in wenig Masse enorm viel Energie: Ein einziges Gramm entspricht etwa 9 · 10¹³ Joule – so viel, wie ein großes Kraftwerk in gut einem Tag liefert. Die Sonne wandelt auf diese Weise jede Sekunde rund vier Millionen Tonnen Masse in Licht und Wärme um."
      ],
      thema: "energieerhaltung"
    },
    maxwell: {
      gebiet: "Elektrodynamik und Relativitätstheorie",
      titel: "Die Maxwell-Gleichungen in kovarianter Form",
      text: [
        "James Clerk Maxwell vereinte in den 1860er-Jahren Elektrizität, Magnetismus und Licht in vier Gleichungen. In der Sprache der Relativitätstheorie schrumpfen die beiden Gleichungen mit Quellen (das Gaußsche Gesetz und das Ampère-Maxwell-Gesetz) auf diese eine Zeile zusammen.",
        "F ist der Feldstärketensor: Er fasst elektrisches und magnetisches Feld in einem Objekt zusammen. J ist die Viererstromdichte aus Ladungsdichte und Stromdichte, μ₀ die magnetische Feldkonstante. Die Indizes μ und ν laufen über Zeit und die drei Raumrichtungen. Weil die Gleichung in jedem gleichförmig bewegten Bezugssystem dieselbe Form hat, sieht man ihr direkt an, dass die Elektrodynamik mit Einsteins spezieller Relativitätstheorie verträglich ist."
      ]
    },
    kepler3: {
      gebiet: "Himmelsmechanik",
      titel: "Das dritte Keplersche Gesetz",
      text: [
        "Johannes Kepler entdeckte 1619: Das Quadrat der Umlaufzeit T eines Planeten ist proportional zur dritten Potenz seines mittleren Abstands a von der Sonne. Weiter draußen ist die Bahn also nicht nur länger – der Planet ist auch langsamer.",
        "Beispiel Mars: Er ist 1,52-mal so weit von der Sonne entfernt wie die Erde, also ist T² = 1,52³ ≈ 3,5 und damit T ≈ 1,9 Erdjahre – tatsächlich braucht er 687 Tage. Im Modell nebenan hält sich jeder Asteroid an dieses Gesetz: Die inneren Brocken überholen die äußeren."
      ],
      thema: "kepler"
    },
    gravitation: {
      gebiet: "Klassische Mechanik",
      titel: "Newtons Gravitationsgesetz",
      text: [
        "Isaac Newton veröffentlichte 1687 die Erkenntnis, dass dieselbe Kraft, die einen Apfel fallen lässt, auch den Mond auf seiner Bahn hält. Zwei Massen m und M ziehen sich an – umso schwächer, je weiter sie voneinander entfernt sind: Bei doppeltem Abstand r bleibt nur ein Viertel der Kraft.",
        "G ist die Gravitationskonstante, 6,67 · 10⁻¹¹ N·m²/kg² – eine winzige Zahl. Deshalb spürst du die Anziehung zwischen zwei Menschen nicht, wohl aber die der riesigen Erde."
      ],
      thema: "gravitation"
    }
  };

  function baueDekoInfo() {
    var ziele = Array.prototype.filter.call(document.querySelectorAll("[data-info]"), function (z) {
      return DEKO_INFO[z.getAttribute("data-info")];
    });
    if (ziele.length === 0) return;

    var kasten = el("div", "deko-info");
    kasten.setAttribute("role", "dialog");
    kasten.hidden = true;
    document.body.append(kasten);
    var aktiv = null;

    function platziere() {
      if (!aktiv) return;
      var r = aktiv.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { schliesse(false); return; }
      var b = kasten.offsetWidth, h = kasten.offsetHeight;
      var vb = document.documentElement.clientWidth, vh = window.innerHeight;
      var links = Math.max(12, Math.min(r.left + r.width / 2 - b / 2, vb - b - 12));
      var oben = r.bottom + 10;                                  // bevorzugt darunter …
      if (oben + h > vh - 10) oben = r.top - h - 10;             // … sonst darüber
      oben = Math.max(70, Math.min(oben, vh - h - 10));          // nie unter die Kopfzeile
      kasten.style.left = Math.round(links) + "px";
      kasten.style.top = Math.round(oben) + "px";
    }

    function oeffne(ziel) {
      var info = DEKO_INFO[ziel.getAttribute("data-info")];
      if (aktiv) aktiv.setAttribute("aria-expanded", "false");
      aktiv = ziel;
      ziel.setAttribute("aria-expanded", "true");
      kasten.innerHTML = "";
      kasten.setAttribute("aria-label", info.titel);

      var zu = el("button", "deko-info-zu", "×");
      zu.type = "button";
      zu.setAttribute("aria-label", "Erklärung schließen");
      zu.addEventListener("click", function () { schliesse(true); });
      kasten.append(zu, el("p", "deko-info-gebiet", info.gebiet), el("h3", null, info.titel));
      info.text.forEach(function (absatz) { kasten.append(el("p", null, absatz)); });

      var fund = info.thema && findeThema(info.thema);
      if (fund && fund.thema.status === "online") {
        var mehr = el("p", "deko-info-mehr");
        mehr.append(themaLink(fund.thema));
        kasten.append(mehr);
      }
      kasten.hidden = false;
      kasten.classList.remove("neu");
      void kasten.offsetWidth;                                   // Einblend-Animation neu starten
      kasten.classList.add("neu");
      platziere();
    }

    function schliesse(fokusZurueck) {
      if (!aktiv) return;
      aktiv.setAttribute("aria-expanded", "false");
      if (fokusZurueck) aktiv.focus();
      aktiv = null;
      kasten.hidden = true;
    }

    ziele.forEach(function (z) {
      var info = DEKO_INFO[z.getAttribute("data-info")];
      z.classList.add("deko-klickbar");
      z.setAttribute("role", "button");
      z.setAttribute("tabindex", "0");
      z.setAttribute("aria-expanded", "false");
      z.setAttribute("aria-label", "Was ist das? " + info.titel);
      z.title = "Was ist das?";
      z.addEventListener("click", function (ev) {
        ev.stopPropagation();
        if (aktiv === z) schliesse(false); else oeffne(z);
      });
      z.addEventListener("keydown", function (ev) {
        if (ev.key !== "Enter" && ev.key !== " ") return;
        ev.preventDefault();
        if (aktiv === z) schliesse(false); else oeffne(z);
      });
    });

    document.addEventListener("click", function (ev) {
      if (aktiv && !kasten.contains(ev.target)) schliesse(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && aktiv) schliesse(true);
    });
    window.addEventListener("scroll", platziere, { passive: true });
    window.addEventListener("resize", platziere);
  }

  /* Elemente mit Klasse "einblenden" erscheinen, sobald sie in Sicht kommen */
  function baueEinblenden() {
    var kandidaten = document.querySelectorAll(".einblenden");
    if (kandidaten.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      kandidaten.forEach(function (e) { e.classList.add("sichtbar"); });
      return;
    }

    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (eintrag) {
        if (eintrag.isIntersecting) {
          eintrag.target.classList.add("sichtbar");
          beobachter.unobserve(eintrag.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px" });

    kandidaten.forEach(function (e, i) {
      e.style.transitionDelay = Math.min(i, 6) * 60 + "ms";
      beobachter.observe(e);
    });
  }

  /* ---------------------------------------------------------------------
     Effekte (nach dem Vorbild von reactbits.dev, aber ohne React):
       - Blur-Text: Wörter einer Überschrift erscheinen nacheinander
         ([data-worte] an der Überschrift)
       - Count-Up: Zahlen zählen hoch, sobald sie sichtbar werden
       - Spotlight: Lichtkegel folgt der Maus über Karten, dazu leichtes
         3D-Kippen bei kleinen Karten
       - Partikel: ruhig driftende Punkte hinter dem Hero (Canvas)
     Alle Effekte beachten prefers-reduced-motion.
     --------------------------------------------------------------------- */
  var wenigBewegung = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Wörter in Spans packen, ohne vorhandene Elemente (<span>, <br>) zu zerstören */
  function baueWortAnimation() {
    var zaehler = 0;
    function verpacke(knoten) {
      Array.prototype.slice.call(knoten.childNodes).forEach(function (kind) {
        if (kind.nodeType === 3) {                       // Textknoten
          var teile = kind.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          teile.forEach(function (teil) {
            if (teil === "") return;
            if (/^\s+$/.test(teil)) { frag.append(teil); return; }
            var w = el("span", "wort", teil);
            w.style.setProperty("--i", zaehler++);
            frag.append(w);
          });
          kind.replaceWith(frag);
        } else if (kind.nodeType === 1 && kind.tagName !== "BR") {
          verpacke(kind);
        }
      });
    }
    document.querySelectorAll("[data-worte]").forEach(verpacke);
  }

  /* Zahlen von 0 bis zum Zielwert hochzählen */
  function baueCountUp() {
    var ziele = document.querySelectorAll(".zahl b");
    if (ziele.length === 0) return;
    if (wenigBewegung || !("IntersectionObserver" in window)) return;

    function zaehle(elem) {
      var ziel = parseInt(elem.textContent, 10);
      if (isNaN(ziel)) return;
      var start = null, dauer = 1100;
      function schritt(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dauer, 1);
        var e = 1 - Math.pow(1 - p, 3);                   // weich auslaufend
        elem.textContent = Math.round(ziel * e);
        if (p < 1) requestAnimationFrame(schritt);
      }
      elem.textContent = "0";
      requestAnimationFrame(schritt);
    }

    var beobachter = new IntersectionObserver(function (eintraege) {
      eintraege.forEach(function (e) {
        if (e.isIntersecting) { zaehle(e.target); beobachter.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    ziele.forEach(function (z) { beobachter.observe(z); });
  }

  /* Spotlight + Tilt auf Karten */
  function baueSpotlight() {
    var karten = document.querySelectorAll(
      ".gebiet-karte, .gebiet-abschnitt");
    if (karten.length === 0) return;
    if (!window.matchMedia || !window.matchMedia("(hover: hover)").matches) return;

    karten.forEach(function (karte) {
      karte.classList.add("spotlight");
      /* breite Bereichs-Karten nur mit Lichtkegel, ohne Kippen */
      var kippen = karte.classList.contains("gebiet-karte") &&
                   !karte.classList.contains("bereich-karte");

      /* Lage der Karte OHNE Kippung, beim Hineinfahren gemessen (in
         Seitenkoordinaten, damit Scrollen nichts verschiebt). Würde man bei
         jeder Bewegung messen, käme der schon gekippte Umriss heraus und der
         Halo säße neben dem Zeiger. */
      var basis = null;
      function miss() {
        var r = karte.getBoundingClientRect();
        basis = { l: r.left + window.scrollX, t: r.top + window.scrollY };
      }
      karte.addEventListener("mouseenter", miss);
      karte.addEventListener("mousemove", function (ev) {
        if (!basis) miss();
        var x = ev.pageX - basis.l, y = ev.pageY - basis.t;
        karte.style.setProperty("--mx", x + "px");
        karte.style.setProperty("--my", y + "px");
        if (kippen && !wenigBewegung) {
          var rx = ((y / karte.offsetHeight) - 0.5) * -6;   // max. ±3°
          var ry = ((x / karte.offsetWidth) - 0.5) * 6;
          karte.style.transform =
            "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" +
            ry.toFixed(2) + "deg) translateY(-3px)";
        }
      });
      karte.addEventListener("mouseleave", function () {
        basis = null;
        karte.style.transform = "";
      });
    });
  }

  /* Partikelfeld: hinter dem Hero der Startseite und (Wunsch des Betreibers
     2026-11-12) hinter dem Seitenkopf der Astrophysik-Themen – dort weichen
     die Sterne der Maus leicht aus. Optionen: klasse (CSS), dichte (Fläche
     in px² pro Punkt), rand (px, um die das Feld über den Behälter ragt),
     maus (Ausweichen an/aus). */
  function bauePartikel(hero, opt) {
    if (!hero) return;
    opt = opt || {};
    var rand = opt.rand || 0;

    var canvas = document.createElement("canvas");
    canvas.className = opt.klasse || "hero-partikel";
    canvas.setAttribute("aria-hidden", "true");
    hero.prepend(canvas);
    var ctx = canvas.getContext("2d");
    var punkte = [], breite = 0, hoehe = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var maus = null;   // Zeigerposition in Leinwand-Koordinaten

    function farbe() {
      return getComputedStyle(document.documentElement).getPropertyValue("--text-schwach").trim() || "#888";
    }

    function groesse() {
      var r = hero.getBoundingClientRect();
      breite = r.width + 2 * rand; hoehe = r.height + 2 * rand;
      canvas.width = breite * dpr; canvas.height = hoehe * dpr;
      canvas.style.width = breite + "px"; canvas.style.height = hoehe + "px";
      if (rand) { canvas.style.left = -rand + "px"; canvas.style.top = -rand + "px"; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var anzahl = Math.round(breite * hoehe / (opt.dichte || 16000));  // Hero: ~70 Punkte
      punkte = [];
      for (var i = 0; i < anzahl; i++) {
        punkte.push({
          x: Math.random() * breite, y: Math.random() * hoehe,
          r: 0.7 + Math.random() * 1.3,
          vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12,
          ox: 0, oy: 0,   // Auslenkung durch die Maus
          phase: Math.random() * Math.PI * 2
        });
      }
    }

    var RADIUS = 110, STOSS = 24;   // px: Wirkungsbereich und größte Auslenkung
    function zeichne(t) {
      ctx.clearRect(0, 0, breite, hoehe);
      ctx.fillStyle = farbe();
      punkte.forEach(function (p) {
        if (!wenigBewegung) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = breite; if (p.x > breite) p.x = 0;
          if (p.y < 0) p.y = hoehe;  if (p.y > hoehe)  p.y = 0;
        }
        /* Ausweichen: Ziel-Auslenkung weg vom Zeiger, weich nachgeführt –
           verlässt die Maus das Feld, gleiten die Sterne zurück */
        var zx = 0, zy = 0;
        if (maus) {
          var dx = p.x - maus.x, dy = p.y - maus.y, d = Math.sqrt(dx * dx + dy * dy);
          if (d < RADIUS && d > 0.01) {
            var k = STOSS * Math.pow(1 - d / RADIUS, 2) / d;
            zx = dx * k; zy = dy * k;
          }
        }
        p.ox += (zx - p.ox) * 0.08;
        p.oy += (zy - p.oy) * 0.08;
        var funkeln = 0.35 + 0.35 * Math.sin(t / 900 + p.phase);  // leises Funkeln
        ctx.globalAlpha = funkeln;
        ctx.beginPath();
        ctx.arc(p.x + p.ox, p.y + p.oy, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    if (opt.maus && !wenigBewegung) {
      hero.addEventListener("pointermove", function (ev) {
        if (ev.pointerType !== "mouse") return;
        var r = canvas.getBoundingClientRect();
        maus = { x: ev.clientX - r.left, y: ev.clientY - r.top };
      });
      hero.addEventListener("pointerleave", function () { maus = null; });
    }

    var laeuft = false;
    function schleife(t) {
      if (!laeuft) return;
      zeichne(t);
      requestAnimationFrame(schleife);
    }
    function starte() {
      if (laeuft) return;
      laeuft = true;
      requestAnimationFrame(schleife);
    }
    function stoppe() { laeuft = false; }

    groesse();
    /* Der Hero ändert seine Höhe auch ohne Fenster-Resize (Erkundungsmodus) */
    if ("ResizeObserver" in window) new ResizeObserver(groesse).observe(hero);
    else window.addEventListener("resize", groesse);
    zeichne(0);                                          // erstes Bild sofort
    if (wenigBewegung) return;                           // ein ruhiges Standbild
    document.addEventListener("visibilitychange", function () {
      document.hidden ? stoppe() : starte();
    });
    starte();
  }

  /* Astrophysik-Themen: Sternenfeld hinter Titel und Untertitel (nicht
     hinter dem Lesetext – dort wird gelesen) */
  function baueAstroKopf() {
    var id = document.body.getAttribute("data-thema");
    var fund = id && findeThema(id);
    if (!fund || fund.gebiet.id !== "astrophysik") return;
    var kopf = document.querySelector("article.thema > header");
    if (!kopf) return;
    kopf.classList.add("sternen-kopf");
    bauePartikel(kopf, { klasse: "kopf-partikel", dichte: 4500, rand: 24, maus: true });
  }

  /* ---------------------------------------------------------------------
     Lese-Fortschritt: dünner Balken am oberen Fensterrand auf Themenseiten
     (Wunsch des Betreibers 2026-11-12, mit leichtem Leuchten)
     --------------------------------------------------------------------- */
  function baueLeseFortschritt() {
    var b = document.body;
    if (!b.hasAttribute("data-thema")) return;
    var balken = el("div", "lese-fortschritt");
    balken.setAttribute("aria-hidden", "true");
    b.append(balken);

    function setze() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var anteil = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      balken.style.transform = "scaleX(" + anteil.toFixed(4) + ")";
    }
    var geplant = false;
    function spaeter() {
      if (geplant) return;
      geplant = true;
      requestAnimationFrame(function () { geplant = false; setze(); });
    }
    window.addEventListener("scroll", spaeter, { passive: true });
    window.addEventListener("resize", spaeter);
    document.addEventListener("tabgewechselt", spaeter);   // Reiter ändern die Seitenhöhe
    setze();
  }

  /* Aufruf aus js/seite.js (DOMContentLoaded), in dieser Reihenfolge */
  Seite.baueEffekte = function () {
    baueRandDeko();
    baueDekoInfo();     // nach baueRandDeko: macht Deko und Notizen anklickbar
    baueEinblenden();   // muss nach dem Erzeugen der Karten laufen
    baueWortAnimation();
    baueCountUp();
    baueSpotlight();
    bauePartikel(document.querySelector(".hero"));
    baueAstroKopf();
    baueLeseFortschritt();
  };
})(window.Seite);
