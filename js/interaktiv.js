/* =========================================================================
   INTERAKTIVE GRAFIKEN – gemeinsame Bausteine
   =========================================================================
   Die Modelle selbst stehen in js/modelle/<themen-id>.js – eine Datei je
   Themenseite (Liste aller Modelle: _doku/modelle.md). Einbinden im
   <head> der Themenseite nach js/seite.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/<themen-id>.js"></script>
   Im Text eine Hülle anlegen – den Rest baut das Modell:
     <figure class="interaktiv" data-modell="NAME">
       <span class="titel">Zum Ausprobieren</span>
       <figcaption>Was man hier sieht und ausprobieren kann …</figcaption>
     </figure>

   Neues Modell: in der Datei der Seite eine Funktion NAME(fig) schreiben
   und am Dateiende mit I.modell("NAME", NAME) anmelden.

   Regeln:
     - Farben nur über CSS-Klassen (.achse, .kurve, .blau, .kupfer …), damit
       das dunkle Schema automatisch stimmt (css/teile/interaktiv.css).
     - Die SVGs werden in echter Pixelgröße gezeichnet (1 SVG-Einheit =
       1 CSS-Pixel) und bei Größenänderung neu berechnet. So bleibt die
       Schrift auch am Handy lesbar.
     - In der Welt der Grafik gilt überall derselbe Maßstab für x und z –
       ein 45°-Wurf sieht also auch wirklich nach 45° aus.
     - Bewegung nur auf Knopfdruck. Bei prefers-reduced-motion springt
       „Abspielen“ sofort ans Ende; der Zeit-Regler funktioniert immer.
   ========================================================================= */

(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  var G = 9.81;                                        // Erdbeschleunigung in m/s²
  var wenigBewegung = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var zaehler = 0;                                     // für eindeutige ids (clipPath)

  /* -----------------------------------------------------------------------
     Hilfsfunktionen
     ----------------------------------------------------------------------- */
  function s(tag, attr, eltern) {
    var e = document.createElementNS(NS, tag);
    if (attr) Object.keys(attr).forEach(function (k) {
      var w = attr[k];
      e.setAttribute(k, typeof w === "number" ? +w.toFixed(2) : w);
    });
    if (eltern) eltern.appendChild(e);
    return e;
  }

  function h(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  /* Zahl deutsch formatieren: Komma, echtes Minuszeichen, kein „−0,0“ */
  function zahl(x, stellen) {
    var f = Math.pow(10, stellen);
    x = Math.round(x * f) / f;
    if (x === 0) x = 0;
    return x.toFixed(stellen).replace(".", ",").replace("-", "−");
  }

  function begrenze(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* „Schöne“ Teilung für Achsen: 1, 2 oder 5 mal Zehnerpotenz */
  function schoenerSchritt(spanne, anzahl) {
    var roh = spanne / anzahl;
    var p = Math.pow(10, Math.floor(Math.log(roh) / Math.LN10));
    var m = roh / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  function txt(eltern, x, y, inhalt, klasse, anker) {
    var t = s("text", { x: x, y: y }, eltern);
    if (klasse) t.setAttribute("class", klasse);
    if (anker) t.setAttribute("text-anchor", anker);
    t.textContent = inhalt;
    return t;
  }

  /* Größe mit tiefgestelltem Index, z. B. v mit x → „vₓ“ */
  function txtIndex(eltern, x, y, gross, index, klasse, anker) {
    var t = txt(eltern, x, y, gross, klasse, anker);
    var tief = s("tspan", { dy: 4, "font-size": "0.75em" }, t);
    tief.textContent = index;
    return t;
  }

  /* Pfeil als Linie + selbst gezeichnete Spitze (keine <marker>, damit
     die Farbe sicher der CSS-Klasse folgt) */
  function pfeil(eltern, x1, y1, x2, y2, klasse) {
    var dx = x2 - x1, dy = y2 - y1, l = Math.sqrt(dx * dx + dy * dy);
    if (l < 3) return null;
    var g = s("g", { "class": "pfeil" + (klasse ? " " + klasse : "") }, eltern);
    var spitze = Math.min(10, l * 0.6), ux = dx / l, uy = dy / l;
    var bx = x2 - ux * spitze, by = y2 - uy * spitze;
    s("line", { x1: x1, y1: y1, x2: bx, y2: by }, g);
    s("polygon", {
      points: x2.toFixed(1) + "," + y2.toFixed(1) + " " +
              (bx + uy * 4.5).toFixed(1) + "," + (by - ux * 4.5).toFixed(1) + " " +
              (bx - uy * 4.5).toFixed(1) + "," + (by + ux * 4.5).toFixed(1)
    }, g);
    return g;
  }

  function linienzug(punkte) {
    return punkte.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ");
  }

  /* -----------------------------------------------------------------------
     Bausteine der Bedienoberfläche
     ----------------------------------------------------------------------- */

  /* Zeichenfläche: SVG in echter Pixelbreite; hoeheAus(breite) legt die
     Höhe fest. Bei Größenänderung (auch beim ersten Anzeigen eines
     versteckten Tabs) wird neu gezeichnet. */
  function zeichenflaeche(eltern, klasse, beschreibung, hoeheAus, neuZeichnen) {
    var huelle = h("div", "ia-flaeche" + (klasse ? " " + klasse : ""));
    var svg = s("svg", { "class": "abb", role: "img", "aria-label": beschreibung }, huelle);
    eltern.append(huelle);
    var f = { svg: svg, b: 0, h: 0 };
    f.messe = function () {
      var b = Math.round(huelle.clientWidth) || 640;
      if (b === f.b) return false;
      f.b = b;
      f.h = Math.round(hoeheAus(b));
      svg.setAttribute("viewBox", "0 0 " + f.b + " " + f.h);
      return true;
    };
    f.leeren = function () { while (svg.firstChild) svg.removeChild(svg.firstChild); };
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { if (f.messe()) neuZeichnen(); }).observe(huelle);
    } else {
      window.addEventListener("resize", function () { if (f.messe()) neuZeichnen(); });
    }
    f.messe();
    return f;
  }

  /* Schieberegler mit Beschriftung und Wertanzeige */
  function regler(eltern, def, beiAenderung) {
    var feld = h("label", "ia-regler");
    var kopf = h("span", "ia-regler-kopf");
    var ausgabe = h("output");
    kopf.append(h("span", null, def.name), ausgabe);
    var input = h("input");
    input.type = "range";
    input.min = def.min; input.max = def.max; input.step = def.schritt;
    input.value = def.wert;
    feld.append(kopf, input);
    eltern.append(feld);
    function anzeigen() {
      ausgabe.textContent = def.anzeige(+input.value);
      input.setAttribute("aria-valuetext", ausgabe.textContent);
    }
    input.addEventListener("input", function () { anzeigen(); beiAenderung(+input.value); });
    anzeigen();
    return {
      input: input,
      setze: function (w) { input.value = w; anzeigen(); },
      auffrischen: anzeigen
    };
  }

  function knopf(eltern, text, klasse, beiKlick) {
    var k = h("button", "ia-knopf" + (klasse ? " " + klasse : ""), text);
    k.type = "button";
    k.addEventListener("click", beiKlick);
    eltern.append(k);
    return k;
  }

  /* Kennzahlen-Kacheln (gleicher Stil wie im Sonnensystem) */
  function werteLeiste(eltern, namen) {
    var dl = h("dl", "ia-werte");
    var felder = {};
    namen.forEach(function (paar) {
      var zelle = h("div", "kennzahl");
      var dd = h("dd");
      zelle.append(h("dt", null, paar[1]), dd);
      dl.append(zelle);
      felder[paar[0]] = dd;
    });
    eltern.append(dl);
    return felder;
  }

  /* Abspielen: t läuft von der aktuellen Stelle (bzw. von 0) bis ende().
     faktor < 1 = Zeitlupe. */
  function abspieler(def) {
    var laeuft = false, letzte = null;
    var k = def.knopf;
    function anzeigen() { k.textContent = laeuft ? "❚❚ Anhalten" : def.text; }
    function schritt(jetzt) {
      if (!laeuft) return;
      var dt = letzte === null ? 0 : Math.min((jetzt - letzte) / 1000, 0.1);
      letzte = jetzt;
      var t = def.hole() + dt * def.faktor;
      if (t >= def.ende()) {
        def.setze(def.ende());
        stopp();
        if (def.amEnde) def.amEnde();
        return;
      }
      def.setze(t);
      requestAnimationFrame(schritt);
    }
    function start() {
      if (def.vonVorn || def.hole() >= def.ende() - 1e-9) def.setze(0);
      if (wenigBewegung || def.ende() <= 0) {         // ohne Animation: gleich ans Ende
        def.setze(def.ende());
        if (def.amEnde) def.amEnde();
        return;
      }
      laeuft = true;
      letzte = null;
      anzeigen();
      requestAnimationFrame(schritt);
    }
    function stopp() { laeuft = false; anzeigen(); }
    k.addEventListener("click", function () { if (laeuft) stopp(); else start(); });
    anzeigen();
    return { stopp: stopp };
  }

  /* Diagramm einer Größe über der Zeit (0 … tmax), Kurve bis tJetzt
     hervorgehoben. opt.tangente = Funktion der Steigung (zeichnet die
     Tangente im aktuellen Punkt), opt.flaeche = Fläche unter der Kurve tönen */
  function zeitDiagramm(f, fn, titel, tmax, tJetzt, opt) {
    var B = f.b, H = f.h;
    f.leeren();
    var min = 0, max = 0, punkte = [], i;
    for (i = 0; i <= 120; i++) {
      var w = fn(i / 120 * tmax);
      min = Math.min(min, w); max = Math.max(max, w);
    }
    if (opt.linie) { min = Math.min(min, opt.linie[0]); max = Math.max(max, opt.linie[0]); }
    if (max - min < 1e-9) { max = 1; min = -1; }
    var luft = (max - min) * 0.08;
    var lo = min < 0 ? min - luft : 0, hi = max > 0 ? max + luft : 0;
    var l = 40, r = 10, o = 26, u = 22;
    var X = function (t) { return l + t / tmax * (B - l - r); };
    var Y = function (w) { return o + (hi - w) / (hi - lo) * (H - o - u); };

    var id = "ia-clip-" + (++zaehler);
    var clip = s("clipPath", { id: id }, s("defs", null, f.svg));
    s("rect", { x: l, y: o - 4, width: B - l - r, height: H - o - u + 8 }, clip);

    txt(f.svg, 4, 14, titel, "ia-titel");
    var schritt = schoenerSchritt(hi - lo, 3);
    for (var k = Math.ceil(lo / schritt) * schritt; k <= hi + 1e-9; k += schritt) {
      s("line", { "class": "gitter", x1: l, y1: Y(k), x2: B - r, y2: Y(k) }, f.svg);
      txt(f.svg, l - 5, Y(k) + 4, zahl(k, schritt < 1 ? 1 : 0), "klein", "end");
    }
    [0, tmax / 2, tmax].forEach(function (t, n) {
      txt(f.svg, X(t), H - 6, zahl(t, 0) + " s", "klein", n === 0 ? "start" : n === 2 ? "end" : "middle");
    });
    s("line", { "class": "achse", x1: l, y1: Y(0), x2: B - r, y2: Y(0) }, f.svg);
    s("line", { "class": "achse", x1: l, y1: o - 4, x2: l, y2: H - u }, f.svg);

    if (opt.linie) {
      /* waagerechte Bezugslinie, z. B. eine Endgeschwindigkeit */
      s("line", { "class": "hilfslinie", x1: l, y1: Y(opt.linie[0]), x2: B - r, y2: Y(opt.linie[0]) }, f.svg);
      txt(f.svg, B - r - 2, Y(opt.linie[0]) - 4, opt.linie[1], "klein", "end");
    }
    var bild = s("g", { "clip-path": "url(#" + id + ")" }, f.svg);
    var bisher = [];
    for (i = 0; i <= 120; i++) {
      var t = i / 120 * tmax;
      punkte.push([X(t), Y(fn(t))]);
      if (t <= tJetzt) bisher.push([X(t), Y(fn(t))]);
    }
    bisher.push([X(tJetzt), Y(fn(tJetzt))]);
    if (opt.flaeche) {
      s("polygon", {
        "class": "flaeche",
        points: X(0).toFixed(1) + "," + Y(0).toFixed(1) + " " + linienzug(bisher) + " " +
                X(tJetzt).toFixed(1) + "," + Y(0).toFixed(1)
      }, bild);
    }
    s("polyline", { "class": "kurve schwach", points: linienzug(punkte) }, bild);
    s("polyline", { "class": "kurve blau", points: linienzug(bisher) }, bild);
    if (opt.tangente) {
      var dt = tmax * 0.16, t1 = tJetzt - dt, t2 = tJetzt + dt, w0 = fn(tJetzt), m = opt.tangente(tJetzt);
      s("line", {
        "class": "kurve kupfer duenn",
        x1: X(t1), y1: Y(w0 + m * (t1 - tJetzt)), x2: X(t2), y2: Y(w0 + m * (t2 - tJetzt))
      }, bild);
    }
    s("circle", { "class": "punkt kupfer", cx: X(tJetzt), cy: Y(fn(tJetzt)), r: 4.5 }, f.svg);
  }

  /* Säulendiagramm: liste = [{name, wert, klasse}], Säulen nebeneinander ab
     x0 mit Spaltenbreite spalte; yNull = Höhe der Nulllinie, skala = Pixel
     pro Einheit (negative Werte zeigen nach unten); yText = Beschriftung */
  function saeulen(svg, x0, yNull, spalte, skala, liste, yText) {
    s("line", { "class": "achse", x1: x0, y1: yNull, x2: x0 + spalte * liste.length, y2: yNull }, svg);
    liste.forEach(function (e, i) {
      var x = x0 + i * spalte, hoch = e.wert * skala;
      if (Math.abs(hoch) > 0.3) {
        s("rect", {
          "class": "balken" + (e.klasse ? " " + e.klasse : ""),
          x: x + spalte * 0.2, y: Math.min(yNull, yNull - hoch), width: spalte * 0.6, height: Math.abs(hoch)
        }, svg);
      }
      txt(svg, x + spalte / 2, yText, e.name, "klein", "middle");
    });
  }

  /* Gerade Bahn mit Meter-Teilung von lo bis hi (Meter); liefert X(m) und
     die Höhe der Bahnlinie. Für Auto, Kiste, Skateboards. */
  function bahnMitTeilung(f, lo, hi, l, r, unten) {
    var B = f.b, yS = f.h - unten;
    var X = function (m) { return l + (m - lo) / (hi - lo) * (B - l - r); };
    s("line", { "class": "achse", x1: 8, y1: yS, x2: B - 8, y2: yS }, f.svg);
    var schritt = schoenerSchritt(hi - lo, B < 480 ? 4 : 7);
    for (var k = Math.ceil(lo / schritt) * schritt; k <= hi + 1e-9; k += schritt) {
      s("line", { "class": "achse", x1: X(k), y1: yS, x2: X(k), y2: yS + 5 }, f.svg);
      txt(f.svg, X(k), yS + 19, zahl(k, schritt < 1 ? 1 : 0) + " m", "klein", "middle");
    }
    return { X: X, y: yS };
  }

  /* Strichmännchen, Füße bei (x, yFuss), Größe in Pixeln; richtung +1 =
     Arme nach rechts, −1 = nach links; armHoehe = Höhe der Hände über den
     Füßen als Anteil der Größe. Liefert die Position der Hand. */
  function maennchen(eltern, x, yFuss, groesse, richtung, armHoehe) {
    var g = s("g", { "class": "person" }, eltern);
    var k = groesse;
    var kopf = yFuss - 0.93 * k, schulter = yFuss - 0.78 * k, huefte = yFuss - 0.48 * k;
    s("circle", { cx: x, cy: kopf, r: 0.07 * k }, g);
    s("path", {
      d: "M" + x + " " + (kopf + 0.07 * k) + "V" + huefte +
         "M" + (x - 0.12 * k) + " " + yFuss + "L" + x + " " + huefte + "L" + (x + 0.12 * k) + " " + yFuss +
         "M" + x + " " + schulter + "L" + (x + richtung * 0.26 * k) + " " + (yFuss - armHoehe * k)
    }, g);
    return { hand: [x + richtung * 0.26 * k, yFuss - armHoehe * k] };
  }

  /* Grundgerüst: alles vor die figcaption setzen */
  function geruest(fig) {
    var unterschrift = fig.querySelector("figcaption");
    var teile = {
      buehne: h("div", "ia-buehne"),
      bedienung: h("div", "ia-bedienung"),
      regler: h("div", "ia-regler-gruppe"),
      knoepfe: h("div", "ia-knoepfe"),
      status: h("p", "ia-status")
    };
    teile.bedienung.append(teile.regler, teile.knoepfe);
    teile.status.setAttribute("aria-live", "polite");
    [teile.buehne, teile.bedienung, teile.status].forEach(function (e) {
      fig.insertBefore(e, unterschrift);
    });
    return teile;
  }

  /* -----------------------------------------------------------------------
     Gemeinsame Helfer der Kontinuumsmechanik-Modelle
     ----------------------------------------------------------------------- */

  /* Länge in Metern mit passender Einheit (m, cm, mm, µm, nm) */
  function laenge(m) {
    var a = Math.abs(m);
    if (a < 1e-12) return "0 mm";
    if (a >= 1) return zahl(m, 2) + " m";
    if (a >= 0.01) return zahl(m * 100, 1) + " cm";
    if (a >= 1e-3) return zahl(m * 1000, 2) + " mm";
    if (a >= 1e-6) return zahl(m * 1e6, a >= 1e-5 ? 0 : 1) + " µm";
    return zahl(m * 1e9, 0) + " nm";
  }

  /* Ganze Zahl mit schmalem Tausender-Abstand: 10 000 */
  function tausender(x) {
    return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }

  /* Gruppe von Auswahlknöpfen (eine Zeile); liefert die Knöpfe */
  function auswahl(eltern, titel, beschreibung, namen, beiWahl) {
    var gruppe = h("div", "ia-umschalter");
    gruppe.setAttribute("role", "group");
    gruppe.setAttribute("aria-label", beschreibung);
    if (titel) gruppe.append(h("span", "ia-gruppe-titel", titel));
    var liste = namen.map(function (name, i) {
      return knopf(gruppe, name, null, function () { beiWahl(i); });
    });
    eltern.insertBefore(gruppe, eltern.querySelector(".ia-regler-gruppe"));
    return liste;
  }
  function markiere(liste, aktiv) {
    liste.forEach(function (k, i) { k.setAttribute("aria-pressed", i === aktiv ? "true" : "false"); });
  }

  /* Winkel auf −π … π zurückführen (Pendel-Modelle) */
  function aufKreis(q) { return q - 2 * Math.PI * Math.floor((q + Math.PI) / (2 * Math.PI)); }

  /* Zehnerpotenz als Beschriftung: „10“ mit hochgestelltem Exponenten */
  function hoch10(eltern, x, y, e, klasse, anker) {
    var t = txt(eltern, x, y, "10", klasse, anker);
    var sp = s("tspan", { dy: -5, "font-size": "0.72em" }, t);
    sp.textContent = String(e).replace("-", "−");
    return t;
  }

  /* Fortlaufende Nummer für eindeutige ids (clipPath, Verläufe) */
  function neueNr() { return ++zaehler; }

  /* -----------------------------------------------------------------------
     Schnittstelle für die Modell-Dateien (js/modelle/*.js)
     ----------------------------------------------------------------------- */
  var MODELLE = {};
  window.Interaktiv = {
    NS: NS,
    G: G,
    wenigBewegung: wenigBewegung,
    s: s,
    h: h,
    zahl: zahl,
    begrenze: begrenze,
    schoenerSchritt: schoenerSchritt,
    txt: txt,
    txtIndex: txtIndex,
    pfeil: pfeil,
    linienzug: linienzug,
    zeichenflaeche: zeichenflaeche,
    regler: regler,
    knopf: knopf,
    werteLeiste: werteLeiste,
    abspieler: abspieler,
    zeitDiagramm: zeitDiagramm,
    saeulen: saeulen,
    bahnMitTeilung: bahnMitTeilung,
    maennchen: maennchen,
    geruest: geruest,
    laenge: laenge,
    tausender: tausender,
    auswahl: auswahl,
    markiere: markiere,
    aufKreis: aufKreis,
    hoch10: hoch10,
    neueNr: neueNr,
    /* Modell anmelden: I.modell("wurf", wurf) */
    modell: function (name, baue) { MODELLE[name] = baue; }
  };

  /* -----------------------------------------------------------------------
     Start: alle Hüllen mit bekanntem Modell aufbauen
     ----------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("figure.interaktiv[data-modell]").forEach(function (fig) {
      var baue = MODELLE[fig.getAttribute("data-modell")];
      if (!baue) return;
      fig.classList.add("bereit");
      baue(fig);
    });
  });
})();
