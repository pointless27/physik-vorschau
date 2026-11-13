/* =========================================================================
   GEMEINSAMES JAVASCRIPT ALLER SEITEN
   =========================================================================
   Aufgaben dieser Datei (Kern, auf JEDER Seite):
     - KaTeX-Start (starteFormeln), Farbschema mit Hell/Dunkel-Knopf
     - Kopfzeile (Navigation, Themensuche) und Fußzeile
     - Tab-System der Themenseiten (leere Tabs werden ausgeblendet)
     - Seitenleiste mit Inhaltsverzeichnis auf Themenseiten (mit Scrollspy)
     - Brotkrumen + "Weitere Themen"-Links aus js/daten.js
     - Blättern: Pfeile zum vorherigen/nächsten Thema des Fachgebiets
     - Formel-Tooltips (#symbole)
   Weitere Teile (nach dieser Datei einbinden):
     - js/uebersichten.js  Startseite, Themenübersicht, Bereichsseiten
                           (nur auf diesen Seiten)
     - js/effekte.js       Rand-Deko, Einblenden, Effekte, Lese-Fortschritt
                           (auf jeder Seite)

   Jede Seite bindet ein:  js/daten.js, js/seite.js, [js/uebersichten.js,]
   js/effekte.js
   (mit korrektem relativem Pfad). Aus dem Pfad des <script>-Tags wird
   automatisch der Weg zur Website-Wurzel bestimmt – deshalb funktionieren
   alle erzeugten Links in jeder Ordnertiefe, lokal wie auf GitHub Pages.
   ========================================================================= */

/* KaTeX-Start: Seiten mit Formeln binden auto-render so ein –
     <script defer src="…/extern/katex/contrib/auto-render.min.js" onload="starteFormeln()"></script>
   Einstellungen (Begrenzer $…$ und $$…$$) nur hier ändern. */
function starteFormeln() {
  renderMathInElement(document.body, {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "$",  right: "$",  display: false }
    ]
  });
}

(function () {
  "use strict";

  /* Weg zur Website-Wurzel, z. B. "" (Startseite) oder "../../" (Themenseite) */
  var ROOT = (function () {
    var src = document.currentScript.getAttribute("src");
    return src.slice(0, src.indexOf("js/seite.js"));
  })();

  /* ---------------------------------------------------------------------
     Icons der Fachgebiete (schlichte Strich-Grafiken, Schlüssel = id des
     Fachgebiets in js/daten.js). Fehlt ein Eintrag, wird "standard"
     genommen – ein neues Fachgebiet funktioniert also auch ohne Icon.
     --------------------------------------------------------------------- */
  var ICONS = {
    /* Hauptzweige */
    methoden:      '<path d="M3.5 20.5L20.5 3.5M3.5 20.5h17M3.5 20.5V3.5"/><path d="M8 20.5v-2M12.5 20.5v-2M17 20.5v-2M3.5 16h2M3.5 11.5h2M3.5 7h2"/>',
    physik:        '<circle cx="12" cy="12" r="1.8"/><ellipse cx="12" cy="12" rx="10" ry="3.8"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="3.8" transform="rotate(-60 12 12)"/>',
    mathematik:    '<path d="M4 20V4M4 20h16"/><path d="M4.5 16.5c4.5 0 5-9 9.5-9 3 0 4.5 2.5 5.5 4.5"/>',
    kosmos:        '<circle cx="12" cy="12" r="5.2"/><path d="M17 9.6c3.3-1 5.4-.8 5.6.2.4 1.6-4.3 4.4-10.4 6.3S1.8 18.6 1.4 17c-.2-1 1.4-2.3 4.2-3.6"/>',
    alltagsphysik: '<path d="M9.5 18h5M10.3 21h3.4"/><path d="M8.6 14.6a6 6 0 1 1 6.8 0c-.9.7-1.4 1.7-1.4 3.4h-4c0-1.7-.5-2.7-1.4-3.4z"/>',
    /* Fachgebiete */
    rechenmethoden:'<path d="M4 20h16M4 20V4"/><path d="M4 20L17 7"/><path d="M11 7h6v6"/>',
    mechanik:      '<circle cx="12" cy="12" r="2.6"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(-28 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4.3" transform="rotate(28 12 12)"/>',
    thermodynamik: '<path d="M14 14.8V4.5a2 2 0 1 0-4 0v10.3a4.3 4.3 0 1 0 4 0z"/><path d="M12 8.5v6.8"/>',
    "schwingungen-wellen": '<path d="M2 12c1.7-6 3.3-6 5 0s3.3 6 5 0 3.3-6 5 0 3.3 6 5 0"/>',
    elektrodynamik:'<path d="M13 2L5 13.5h6L10 22l8-11.5h-6z"/>',
    optik:         '<path d="M12 3c2.2 3 2.2 15 0 18-2.2-3-2.2-15 0-18z"/><path d="M1.5 8H12l9.5 4M1.5 16H12l9.5-4"/>',
    relativitaet:  '<path d="M5 3.5l14 17M19 3.5L5 20.5"/><ellipse cx="12" cy="3.5" rx="7" ry="1.6"/><ellipse cx="12" cy="20.5" rx="7" ry="1.6"/>',
    quantenphysik: '<path d="M1.5 12h3c1.2 0 1.6-3 2.6-3s1.6 7 2.7 7 1.5-11 2.2-11 1.1 11 2.2 11 1.7-7 2.7-7 1.4 3 2.6 3h3"/>',
    atomphysik:    '<circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="10"/><circle cx="18" cy="12" r="1.1" fill="currentColor"/>',
    festkoerper:   '<path d="M4.5 4.5h15M4.5 12h15M4.5 19.5h15M4.5 4.5v15M12 4.5v15M19.5 4.5v15"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
    kernphysik:    '<circle cx="9.3" cy="10" r="3.3"/><circle cx="14.7" cy="10" r="3.3"/><circle cx="12" cy="14.6" r="3.3"/>',
    analysis:      '<path d="M15.5 3.2c-2-.8-3.6.2-4 2.8l-1.9 12c-.4 2.6-2 3.6-4 2.8"/><path d="M15 15.5l4 4M19 15.5l-4 4"/>',
    "lineare-algebra": '<path d="M7 4H4v16h3M17 4h3v16h-3"/><path d="M8.5 8.5h1M14.5 8.5h1M8.5 15.5h1M14.5 15.5h1"/>',
    dgl:           '<path d="M12 12c.6-1.1 2.3-.8 2.4.6.2 1.8-2 3-3.7 2.3-2.5-1-2.8-4.4-.9-6.2 2.6-2.4 7-1.4 8.3 1.8 1.6 4-1.4 8.2-5.6 8.4C7.3 19.1 3.6 15.2 4.2 10.5"/><path d="M2.6 12.5l1.6-2 2 1.6"/>',
    funktionentheorie: '<path d="M2.5 12h19M12 2.5v19"/><circle cx="12" cy="12" r="6.3"/><path d="M16.2 5.6l1.9 1.6-1.4 2.1"/>',
    astrophysik:   '<path d="M12 2.8l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.6l-5.4 2.9 1.1-6.1L3.2 9.2l6.1-.8z"/>',
    universum:     '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><path d="M8.6 10.2c2.2-1.1 4.6-1.1 6.8 0"/>',
    alltag:        '<path d="M9.5 18h5M10.3 21h3.4"/><path d="M8.6 14.6a6 6 0 1 1 6.8 0c-.9.7-1.4 1.7-1.4 3.4h-4c0-1.7-.5-2.7-1.4-3.4z"/>',
    standard:      '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3 2"/>'
  };

  function iconElement(id) {
    var huelle = document.createElement("span");
    huelle.className = "karten-icon";
    huelle.setAttribute("aria-hidden", "true");
    huelle.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[id] || ICONS.standard) + '</svg>';
    return huelle;
  }

  /* ---------------------------------------------------------------------
     Farbschema: data-theme am <html>-Element ist IMMER gesetzt ("light"
     oder "dark"); das CSS kennt nur :root[data-theme="dark"]
     (css/teile/variablen.css). Der Knopf legt eine feste Wahl in
     localStorage ab; ohne Wahl gilt die Systemeinstellung – auch wenn sie
     sich ändert, während die Seite offen ist.
     --------------------------------------------------------------------- */
  var systemDunkel = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function lesSchema() {
    try { return localStorage.getItem("farbschema"); } catch (e) { return null; }
  }
  function setzSchema(wert) {
    if (wert !== "dark" && wert !== "light") wert = systemDunkel && systemDunkel.matches ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", wert);
  }
  setzSchema(lesSchema()); // sofort anwenden, bevor die Seite gezeichnet wird
  if (systemDunkel && systemDunkel.addEventListener) {
    systemDunkel.addEventListener("change", function () {
      if (lesSchema()) return;              // feste Wahl im Knopf hat Vorrang
      setzSchema(null);
      var knopf = document.querySelector(".schema-knopf");
      if (knopf) knopf.textContent = aktuellDunkel() ? "☀" : "☾";
    });
  }

  function aktuellDunkel() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  /* ---------------------------------------------------------------------
     Hilfsfunktionen
     --------------------------------------------------------------------- */
  function el(tag, klasse, inhalt) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (inhalt !== undefined) e.textContent = inhalt;
    return e;
  }

  /* Thema anhand seiner id in SITE finden; liefert auch Gebiet und Kapitel */
  function findeThema(id) {
    for (var g = 0; g < SITE.fachgebiete.length; g++) {
      var gebiet = SITE.fachgebiete[g];
      for (var k = 0; k < gebiet.kapitel.length; k++) {
        var kapitel = gebiet.kapitel[k];
        for (var t = 0; t < kapitel.themen.length; t++) {
          if (kapitel.themen[t].id === id) {
            return { gebiet: gebiet, kapitel: kapitel, thema: kapitel.themen[t] };
          }
        }
      }
    }
    return null;
  }

  function themaLink(thema) {
    var a = el("a", null, thema.titel);
    a.href = ROOT + thema.datei;
    return a;
  }

  /* Themen eines Gebiets zählen: {online: n, gesamt: m} */
  function zaehle(gebiet) {
    var online = 0, gesamt = 0;
    gebiet.kapitel.forEach(function (kap) {
      kap.themen.forEach(function (t) {
        gesamt++;
        if (t.status === "online") online++;
      });
    });
    return { online: online, gesamt: gesamt };
  }

  /* Hauptzweige: Zweig-Objekt zu einer id, seine Fachgebiete, seine Zählung */
  /* Kapitel haben in daten.js keine id – sie wird aus Fachgebiet und Name
     gebildet, z. B. "mechanik-kinematik" (Sprungziel im Themenbaum) */
  function kapitelId(gebiet, kap) {
    var name = kap.name.toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return gebiet.id + "-" + name;
  }

  function findeZweig(id) {
    var zweige = SITE.zweige || [];
    for (var i = 0; i < zweige.length; i++) {
      if (zweige[i].id === id) return zweige[i];
    }
    return null;
  }
  function gebieteVon(zweig) {
    return SITE.fachgebiete.filter(function (g) { return g.zweig === zweig.id; });
  }
  function zaehleZweig(zweig) {
    var summe = { online: 0, gesamt: 0 };
    gebieteVon(zweig).forEach(function (g) {
      var z = zaehle(g);
      summe.online += z.online;
      summe.gesamt += z.gesamt;
    });
    return summe;
  }

  /* Link zur Bereichsseite eines Hauptzweigs (optional mit Sprungziel) */
  function zweigLink(zweig, ziel) {
    return ROOT + (zweig.datei || "themen/index.html") + (ziel ? "#" + ziel : "");
  }

  /* ---------------------------------------------------------------------
     Kopf- und Fußzeile
     --------------------------------------------------------------------- */
  function baueKopf() {
    var header = el("header", "seitenkopf");
    var innen = el("div", "seitenkopf-innen");

    var marke = el("a", "marke");
    marke.href = ROOT + "index.html";
    marke.append(el("span", "marke-symbol", "ψ"), el("span", null, "Physik verstehen"));

    /* Menü: "Themen" klappt die Bereiche auf, daneben die Themensuche.
       Zur Startseite führt das Logo. */
    var nav = el("nav", "hauptnav");
    nav.setAttribute("aria-label", "Hauptmenü");
    var hier = location.pathname.replace(/\\/g, "/");
    nav.append(baueThemenMenue(hier.indexOf("/themen/") !== -1),
      baueSuche());

    var knopf = el("button", "schema-knopf");
    knopf.type = "button";
    knopf.setAttribute("aria-label", "Farbschema umschalten");
    function beschrifte() { knopf.textContent = aktuellDunkel() ? "☀" : "☾"; }
    beschrifte();
    knopf.addEventListener("click", function () {
      var neu = aktuellDunkel() ? "light" : "dark";
      try { localStorage.setItem("farbschema", neu); } catch (e) {}
      setzSchema(neu);
      beschrifte();
    });

    innen.append(marke, nav, knopf);
    header.append(innen);
    document.body.prepend(header);
  }

  /* Aufklappmenü "Themen": öffnet per Klick/Antippen, mit Maus auch beim
     Überfahren. Schließt bei Klick daneben, Esc oder wenn der Fokus das
     Menü verlässt. */
  function baueThemenMenue(aktiv) {
    var huelle = el("div", "nav-menue");
    var knopf = el("button", "nav-knopf" + (aktiv ? " aktiv" : ""));
    knopf.type = "button";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", "themen-menue");
    var pfeil = el("span", "nav-pfeil");
    pfeil.setAttribute("aria-hidden", "true");
    knopf.append(el("span", null, "Themen"), pfeil);

    var menue = el("div", "themen-menue");
    menue.id = "themen-menue";
    var aktuell = document.body.getAttribute("data-zweig");
    (SITE.zweige || []).forEach(function (z) {
      if (gebieteVon(z).length === 0) return;
      var a = el("a", "menue-eintrag");
      a.href = zweigLink(z);
      a.setAttribute("data-zweig", z.id);
      if (z.id === aktuell) a.setAttribute("aria-current", "page");
      var text = el("span", "menue-text");
      text.append(el("span", "menue-name", z.name));
      if (z.untertitel) text.append(el("span", "menue-zeile", z.untertitel));
      a.append(iconElement(z.id), text);
      menue.append(a);
    });
    /* Zusatz unter den Bereichen: Übersicht der geplanten 3D-Modelle */
    var uni = el("a", "menue-eintrag menue-zusatz");
    uni.href = ROOT + "themen/interaktives-universum.html";
    if (document.body.getAttribute("data-seite") === "universum") uni.setAttribute("aria-current", "page");
    var uniText = el("span", "menue-text");
    uniText.append(el("span", "menue-name", "Interaktives Universum"),
      el("span", "menue-zeile", "3D-Modelle – in Vorbereitung"));
    uni.append(iconElement("universum"), uniText);
    menue.append(uni);
    var alle = el("a", "menue-alle", "Alle Bereiche im Überblick →");
    alle.href = ROOT + "themen/index.html";
    menue.append(alle);
    huelle.append(knopf, menue);

    var offen = false, perHover = false, zeit = null;
    function setze(zustand) {
      offen = zustand;
      knopf.setAttribute("aria-expanded", String(zustand));
      huelle.classList.toggle("offen", zustand);
    }
    knopf.addEventListener("click", function () {
      /* per Maus schon geöffnet: Klick lässt es offen (statt zu schließen) */
      if (offen && perHover) { perHover = false; return; }
      perHover = false;
      setze(!offen);
    });
    if (window.matchMedia && window.matchMedia("(hover: hover)").matches) {
      huelle.addEventListener("mouseenter", function () {
        clearTimeout(zeit);
        if (!offen) { setze(true); perHover = true; }
      });
      huelle.addEventListener("mouseleave", function () {
        if (perHover) zeit = setTimeout(function () { setze(false); perHover = false; }, 200);
      });
    }
    document.addEventListener("click", function (ev) {
      if (offen && !huelle.contains(ev.target)) { setze(false); perHover = false; }
    });
    document.addEventListener("keydown", function (ev) {
      if (offen && ev.key === "Escape") { setze(false); perHover = false; knopf.focus(); }
    });
    huelle.addEventListener("focusout", function (ev) {
      if (offen && ev.relatedTarget && !huelle.contains(ev.relatedTarget)) {
        setze(false); perHover = false;
      }
    });
    return huelle;
  }

  /* ---------------------------------------------------------------------
     Themensuche in der Kopfzeile (Lupe neben "Themen"). Sie findet nur
     die Online-Themen aus js/daten.js: über Titel, Fachgebiet, Kapitel,
     id und das optionale Feld "stichworte" eines Themas, NICHT über den
     Seitentext. Groß-/Kleinschreibung und Umlaute (ä = ae) sind egal,
     alle eingegebenen Wörter müssen vorkommen. Öffnen per Klick, mit "/"
     oder Strg+K; Pfeiltasten wählen, Enter öffnet, Esc schließt.
     --------------------------------------------------------------------- */
  var SUCH_MAX = 8;   /* höchstens so viele Treffer zeigen */

  function normiere(text) {
    return String(text).toLowerCase()
      .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }

  var suchBestand = null;
  function suchEintraege() {
    if (suchBestand) return suchBestand;
    suchBestand = [];
    SITE.fachgebiete.forEach(function (g) {
      g.kapitel.forEach(function (k) {
        k.themen.forEach(function (t) {
          if (t.status !== "online") return;
          suchBestand.push({
            thema: t, gebiet: g, kapitel: k,
            titel: " " + normiere(t.titel),
            rest: " " + normiere([g.name, k.name, t.id].concat(t.stichworte || []).join(" "))
          });
        });
      });
    });
    return suchBestand;
  }

  /* Treffer nach Punkten: Wortanfang im Titel zählt am meisten, dann
     irgendwo im Titel, dann Wortanfang in Fachgebiet/Kapitel/Stichwort.
     Gleichstand: Reihenfolge in daten.js. */
  function sucheThemen(anfrage) {
    var woerter = normiere(anfrage).split(" ").filter(Boolean);
    if (woerter.length === 0) return [];
    var treffer = [];
    suchEintraege().forEach(function (e, nr) {
      var punkte = 0;
      for (var i = 0; i < woerter.length; i++) {
        var w = woerter[i];
        if (e.titel.indexOf(" " + w) !== -1) punkte += 4;
        else if (w.length > 1 && e.titel.indexOf(w) !== -1) punkte += 2;
        else if (e.rest.indexOf(" " + w) !== -1) punkte += 1;
        else return;
      }
      treffer.push({ e: e, punkte: punkte, nr: nr });
    });
    treffer.sort(function (a, b) { return b.punkte - a.punkte || a.nr - b.nr; });
    return treffer.map(function (t) { return t.e; });
  }

  /* Titel mit hervorgehobenen Suchwörtern (<mark>) */
  function markiere(titel, anfrage) {
    var klein = titel.toLowerCase();
    var bereiche = [];
    anfrage.toLowerCase().split(/\s+/).filter(Boolean).forEach(function (w) {
      var pos = klein.indexOf(w);
      while (pos !== -1) {
        bereiche.push([pos, pos + w.length]);
        pos = klein.indexOf(w, pos + w.length);
      }
    });
    bereiche.sort(function (a, b) { return a[0] - b[0]; });
    var span = el("span", "menue-name"), stelle = 0;
    bereiche.forEach(function (b) {
      if (b[1] <= stelle) return;
      var anfang = Math.max(b[0], stelle);
      if (anfang > stelle) span.append(titel.slice(stelle, anfang));
      span.append(el("mark", null, titel.slice(anfang, b[1])));
      stelle = b[1];
    });
    span.append(titel.slice(stelle));
    return span;
  }

  function baueSuche() {
    var huelle = el("div", "nav-suche");
    var knopf = el("button", "nav-knopf such-knopf");
    knopf.type = "button";
    knopf.setAttribute("aria-expanded", "false");
    knopf.setAttribute("aria-controls", "such-feld");
    knopf.setAttribute("aria-label", "Themen durchsuchen");
    knopf.title = "Themen durchsuchen (Taste /)";
    knopf.innerHTML = '<svg class="such-lupe" viewBox="0 0 24 24" aria-hidden="true">' +
      '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5l5 5"/></svg>';
    knopf.append(el("span", "such-wort", "Suche"));

    var feld = el("div", "such-feld");
    feld.id = "such-feld";
    var eingabe = el("input", "such-eingabe");
    eingabe.type = "search";
    eingabe.placeholder = "Thema suchen, z. B. Impuls";
    eingabe.setAttribute("aria-label", "Thema suchen");
    eingabe.setAttribute("autocomplete", "off");
    eingabe.setAttribute("spellcheck", "false");
    eingabe.setAttribute("role", "combobox");
    eingabe.setAttribute("aria-controls", "such-liste");
    eingabe.setAttribute("aria-autocomplete", "list");
    eingabe.setAttribute("aria-expanded", "false");
    var liste = el("ul", "such-liste");
    liste.id = "such-liste";
    liste.setAttribute("role", "listbox");
    liste.setAttribute("aria-label", "Gefundene Themen");
    var hinweis = el("p", "such-hinweis");
    hinweis.setAttribute("aria-live", "polite");
    feld.append(eingabe, liste, hinweis);
    huelle.append(knopf, feld);

    var offen = false, links = [], gewaehlt = -1;

    function waehle(nr) {
      links.forEach(function (a, i) {
        a.classList.toggle("aktiv", i === nr);
        a.parentNode.setAttribute("aria-selected", String(i === nr));
      });
      gewaehlt = nr;
      if (nr >= 0) {
        eingabe.setAttribute("aria-activedescendant", links[nr].parentNode.id);
        links[nr].scrollIntoView({ block: "nearest" });
      } else {
        eingabe.removeAttribute("aria-activedescendant");
      }
    }

    function zeigeTreffer() {
      var anfrage = eingabe.value.trim();
      var treffer = sucheThemen(anfrage);
      liste.textContent = "";
      hinweis.textContent = "";
      links = [];
      treffer.slice(0, SUCH_MAX).forEach(function (e, i) {
        var li = el("li");
        li.id = "such-treffer-" + i;
        li.setAttribute("role", "option");
        var a = el("a", "menue-eintrag such-treffer");
        a.href = ROOT + e.thema.datei;
        a.tabIndex = -1;
        var text = el("span", "menue-text");
        text.append(markiere(e.thema.titel, anfrage),
          el("span", "menue-zeile", e.gebiet.name + " · " + e.kapitel.name));
        a.append(iconElement(e.gebiet.id), text);
        a.addEventListener("mousemove", function () { if (gewaehlt !== i) waehle(i); });
        li.append(a);
        liste.append(li);
        links.push(a);
      });
      eingabe.setAttribute("aria-expanded", String(links.length > 0));
      waehle(links.length ? 0 : -1);

      if (!anfrage) {
        hinweis.textContent = "Findet jedes Thema, das schon online ist: nach Titel, Fachgebiet oder Kapitel.";
      } else if (treffer.length === 0) {
        hinweis.append("Kein passendes Thema gefunden. ");
        var alle = el("a", null, "Alle Themen im Überblick");
        alle.href = ROOT + "themen/index.html";
        hinweis.append(alle);
      } else if (treffer.length > SUCH_MAX) {
        hinweis.textContent = (treffer.length - SUCH_MAX) + " weitere Treffer: genauer suchen.";
      }
    }

    function setze(zustand) {
      offen = zustand;
      knopf.setAttribute("aria-expanded", String(zustand));
      huelle.classList.toggle("offen", zustand);
      if (zustand) {
        zeigeTreffer();
        eingabe.focus();
        eingabe.select();
      }
    }

    knopf.addEventListener("click", function () { setze(!offen); });
    eingabe.addEventListener("input", zeigeTreffer);
    eingabe.addEventListener("keydown", function (ev) {
      if (ev.key === "ArrowDown" && links.length) {
        ev.preventDefault(); waehle((gewaehlt + 1) % links.length);
      } else if (ev.key === "ArrowUp" && links.length) {
        ev.preventDefault(); waehle((gewaehlt - 1 + links.length) % links.length);
      } else if (ev.key === "Enter" && gewaehlt >= 0) {
        ev.preventDefault(); location.href = links[gewaehlt].href;
      }
    });
    document.addEventListener("click", function (ev) {
      if (offen && !huelle.contains(ev.target)) setze(false);
    });
    huelle.addEventListener("focusout", function (ev) {
      if (offen && ev.relatedTarget && !huelle.contains(ev.relatedTarget)) setze(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (offen && ev.key === "Escape") { setze(false); knopf.focus(); return; }
      var ziel = ev.target, tippt = ziel && (ziel.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(ziel.tagName));
      var kuerzel = (ev.key === "/" && !tippt && !ev.ctrlKey && !ev.metaKey && !ev.altKey) ||
        ((ev.ctrlKey || ev.metaKey) && (ev.key === "k" || ev.key === "K"));
      if (kuerzel && !offen) { ev.preventDefault(); setze(true); }
    });
    return huelle;
  }

  function baueFuss() {
    var footer = el("footer", "seitenfuss");
    footer.append(el("p", null,
      "Eine wachsende Physik-Seite aus dem Studium heraus – " +
      "Erklärungen für alle, Tiefe fürs Studium."));
    /* Rechtliches/Credits; Impressum und Datenschutz sind noch Entwürfe
       mit Platzhaltern (vor dem Veröffentlichen ausfüllen, siehe
       _doku/lizenzen.md) */
    var links = el("p", "fuss-links");
    [["impressum.html", "Impressum"], ["datenschutz.html", "Datenschutz"],
     ["credits.html", "Credits & Danksagungen"]].forEach(function (l, i) {
      if (i > 0) links.append(" · ");
      var a = el("a", null, l[1]);
      a.href = ROOT + l[0];
      links.append(a);
    });
    footer.append(links);
    document.body.append(footer);
  }

  /* ---------------------------------------------------------------------
     Tab-System der Themenseiten
     ---------------------------------------------------------------------
     Erwartet: <div class="tabs"> mit <section class="tab" id="..."
     data-titel="..."> als Kinder. Leere Sektionen werden entfernt, für den
     Rest werden Knöpfe erzeugt. Der Start-Tab kommt aus dem URL-Hash
     (#vertiefung, oder #id einer Überschrift innerhalb eines Tabs) oder
     aus der zuletzt selbst gewählten Ebene (localStorage "modus":
     "laie" → Verstehen, "studium" → Vertiefung; gesetzt beim Klick auf
     den Reiter "Verstehen" bzw. "Vertiefung").
     Bei jedem Wechsel wird das Ereignis "tabgewechselt" ausgelöst
     (detail = die sichtbare Sektion) – die Seitenleiste hört darauf.
     --------------------------------------------------------------------- */
  function baueTabs() {
    var container = document.querySelector(".tabs");
    if (!container) return;

    var sektionen = Array.prototype.slice.call(container.children).filter(function (s) {
      return s.matches("section.tab");
    });

    /* Leere Tabs (noch ohne Inhalt) ausblenden */
    var gefuellt = [];
    sektionen.forEach(function (s) {
      if (s.textContent.trim() === "") { s.remove(); } else { gefuellt.push(s); }
    });
    if (gefuellt.length === 0) return;

    var leiste = el("div", "tab-leiste");
    leiste.setAttribute("role", "tablist");

    function zeige(id, hashSetzen) {
      var sichtbar = null;
      gefuellt.forEach(function (s) {
        var an = (s.id === id);
        s.hidden = !an;
        if (an) sichtbar = s;
        var knopf = leiste.querySelector('[data-ziel="' + s.id + '"]');
        if (knopf) {
          knopf.classList.toggle("aktiv", an);
          knopf.setAttribute("aria-selected", an ? "true" : "false");
        }
      });
      if (hashSetzen && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
      document.dispatchEvent(new CustomEvent("tabgewechselt", { detail: sichtbar }));
    }

    /* Kurzformen für schmale Fenster; eine Sektion kann auch selbst
       data-kurz="..." angeben. CSS zeigt je nach Breite .lang oder .kurz. */
    var KURZ = { "Beispielrechnungen": "Beispiele" };

    gefuellt.forEach(function (s) {
      var titel = s.getAttribute("data-titel") || s.id;
      var knopf = el("button", "tab-knopf");
      knopf.append(el("span", "lang", titel),
        el("span", "kurz", s.getAttribute("data-kurz") || KURZ[titel] || titel));
      knopf.type = "button";
      knopf.setAttribute("role", "tab");
      knopf.setAttribute("data-ziel", s.id);
      knopf.addEventListener("click", function () {
        zeige(s.id, true);
        /* Ebene merken: Wer selbst "Verstehen" oder "Vertiefung" wählt,
           bekommt das nächste Thema auf derselben Ebene geöffnet.
           (Beispiele/Aufgaben ändern die gemerkte Ebene nicht.) */
        var ebene = s.id === "vertiefung" ? "studium" : s.id === "verstehen" ? "laie" : null;
        /* Seiten ohne „Vertiefung“ (Mathematische Grundlagen) lassen die
           gemerkte Ebene unverändert. */
        var zweiEbenen = gefuellt.some(function (t) { return t.id === "vertiefung"; });
        if (ebene && zweiEbenen) { try { localStorage.setItem("modus", ebene); } catch (e) {} }
      });
      leiste.append(knopf);
    });
    container.prepend(leiste);

    /* Start-Tab bestimmen */
    var start = null;
    var hash = location.hash.replace("#", "");
    var hashZiel = hash ? document.getElementById(hash) : null;
    if (hashZiel) {
      /* Hash zeigt auf einen Tab selbst oder auf eine Überschrift darin */
      var tab = hashZiel.closest("section.tab");
      if (tab && gefuellt.indexOf(tab) !== -1) start = tab.id;
    }
    if (!start) {
      var modus = null;
      try { modus = localStorage.getItem("modus"); } catch (e) {}
      if (modus === "studium" && gefuellt.some(function (s) { return s.id === "vertiefung"; })) {
        start = "vertiefung";
      }
    }
    zeige(start || gefuellt[0].id, false);

    /* Beim Sprung auf eine Überschrift in einem anderen Tab: Tab öffnen */
    window.addEventListener("hashchange", function () {
      var ziel = document.getElementById(location.hash.replace("#", ""));
      var tab = ziel && ziel.closest("section.tab");
      if (tab && tab.hidden) {
        zeige(tab.id, false);
        ziel.scrollIntoView();
      }
    });
    if (hashZiel && hashZiel.matches("section.tab")) {
      /* #vertiefung o. ä. wählt nur den Tab – der Browser soll nicht am
         Seitentitel vorbei nach unten springen */
      setTimeout(function () { window.scrollTo(0, 0); }, 0);
    } else if (hashZiel && hashZiel.closest("section.tab")) {
      setTimeout(function () { hashZiel.scrollIntoView(); }, 0);
    }
  }

  /* ---------------------------------------------------------------------
     Seitenleiste der Themenseiten: "Auf dieser Seite" (Überschriften des
     aktiven Tabs) + später "Weitere Themen". Wird nur erzeugt, wenn ein
     <article class="thema"> existiert.
     --------------------------------------------------------------------- */
  function baueSeitenleiste() {
    var artikel = document.querySelector("article.thema");
    if (!artikel) return null;

    var leiste = el("aside", "seitenleiste");
    var ivz = el("div", "inhaltsverzeichnis");
    ivz.append(el("h2", null, "Auf dieser Seite"));
    var ul = el("ul");
    ivz.append(ul);
    leiste.append(ivz);
    artikel.append(leiste);

    function ueberschriftText(h) {
      var kopie = h.cloneNode(true);
      kopie.querySelectorAll(".schwierigkeit").forEach(function (b) { b.remove(); });
      return kopie.textContent.trim();
    }

    /* Scrollspy: eintraege = Überschriften des sichtbaren Teils mit ihrem
       Link. Aktiv ist die letzte Überschrift, die schon oben unter der
       Kopfzeile (bzw. Tab-Leiste) angekommen ist. */
    var eintraege = [];
    var gewaehlt = null;   // zuletzt angeklickter Eintrag (für das Seitenende)

    function fuelle(sektion) {
      ul.innerHTML = "";
      eintraege = [];
      gewaehlt = null;
      var koepfe = sektion ? sektion.querySelectorAll("h2, h3") : [];
      ivz.hidden = (koepfe.length === 0);
      Array.prototype.forEach.call(koepfe, function (h, i) {
        if (!h.id) h.id = (sektion.id || "abschnitt") + "-" + (i + 1);
        var li = el("li", h.tagName === "H3" ? "ebene-3" : null);
        var a = el("a", null, ueberschriftText(h));
        a.href = "#" + h.id;
        li.append(a);
        ul.append(li);
        /* scroll-margin-top = Stelle, an der ein Sprung die Überschrift
           absetzt (5,5rem bzw. 9rem unter der Tab-Leiste) */
        var eintrag = { h: h, a: a, rand: parseFloat(getComputedStyle(h).scrollMarginTop) || 0 };
        a.addEventListener("click", function () { gewaehlt = eintrag; });
        eintraege.push(eintrag);
      });
      markiere();
    }

    function markiere() {
      if (eintraege.length === 0) return;
      var aktiv = null;
      for (var i = 0; i < eintraege.length; i++) {
        if (eintraege[i].h.getBoundingClientRect().top <= eintraege[i].rand + 30) aktiv = eintraege[i];
        else break;
      }
      /* Ganz unten kann der Browser kurze Schluss-Abschnitte nicht mehr bis
         nach oben scrollen: dann den angeklickten bzw. den letzten nehmen */
      var doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        var oben = gewaehlt && gewaehlt.h.getBoundingClientRect().top;
        aktiv = (gewaehlt && oben >= 0 && oben < window.innerHeight)
          ? gewaehlt : eintraege[eintraege.length - 1];
      }
      eintraege.forEach(function (e) {
        var an = (e === aktiv);
        e.a.classList.toggle("aktiv", an);
        if (an) e.a.setAttribute("aria-current", "location");
        else e.a.removeAttribute("aria-current");
      });
    }

    var geplant = false;
    function spaeterMarkieren() {
      if (geplant) return;
      geplant = true;
      requestAnimationFrame(function () { geplant = false; markiere(); });
    }
    window.addEventListener("scroll", spaeterMarkieren, { passive: true });
    window.addEventListener("resize", spaeterMarkieren);
    /* Scrollt man selbst weiter, gilt der letzte Klick nicht mehr */
    ["wheel", "touchstart", "keydown"].forEach(function (art) {
      window.addEventListener(art, function () { gewaehlt = null; }, { passive: true });
    });

    document.addEventListener("tabgewechselt", function (ev) { fuelle(ev.detail); });
    /* Seiten mit Reitern: aktiver Reiter; Erklärseiten (Zweig „Entdecken“)
       ohne Reiter: der ganze Text in <section class="erklaerung"> */
    fuelle(document.querySelector(".tabs > section.tab:not([hidden])") ||
           artikel.querySelector(".erklaerung"));
    return leiste;
  }

  /* ---------------------------------------------------------------------
     Brotkrumen und "Weitere Themen" auf Themenseiten
     (aktiv, wenn <body data-thema="..."> gesetzt ist)
     --------------------------------------------------------------------- */
  function baueThemenRahmen(leiste) {
    var id = document.body.getAttribute("data-thema");
    if (!id) return;
    var fund = findeThema(id);
    if (!fund) return;

    /* Brotkrume über dem Inhalt */
    var krume = el("nav", "brotkrume");
    var aThemen = el("a", null, "Themen");
    aThemen.href = ROOT + "themen/index.html";
    var aGebiet = el("a", null, fund.gebiet.name);
    krume.setAttribute("aria-label", "Brotkrume");
    krume.append(aThemen, el("span", "trenner", "›"));
    var zweig = findeZweig(fund.gebiet.zweig);
    var aKapitel = el("a", null, fund.kapitel.name);
    if (zweig) {
      var aZweig = el("a", null, zweig.name);
      aZweig.href = zweigLink(zweig);
      krume.append(aZweig, el("span", "trenner", "›"));
      aGebiet.href = zweigLink(zweig, fund.gebiet.id);
      aKapitel.href = zweigLink(zweig, kapitelId(fund.gebiet, fund.kapitel));
    }
    /* Bereich mit nur einem Fachgebiet: Fachgebiet nicht doppelt nennen */
    if (!zweig || gebieteVon(zweig).length > 1) {
      krume.append(aGebiet, el("span", "trenner", "›"));
    }
    krume.append(aKapitel);
    var main = document.querySelector("main");
    if (main) main.prepend(krume);

    /* Geschwister-Themen verlinken – in der Seitenleiste, sonst unten */
    var andere = fund.kapitel.themen.filter(function (t) {
      return t.id !== id && t.status === "online";
    });
    if (andere.length > 0) {
      var kasten = el("aside", "weitere-themen");
      kasten.append(el("h2", null, "Weitere Themen aus „" + fund.kapitel.name + "“"));
      var ul = el("ul");
      andere.forEach(function (t) {
        var li = el("li");
        li.append(themaLink(t));
        ul.append(li);
      });
      kasten.append(ul);
      (leiste || main).append(kasten);
    }

    baueBlaettern(fund);
  }

  /* ---------------------------------------------------------------------
     Blättern: Pfeile zum vorherigen / nächsten Thema unter dem Inhalt.
     Reihenfolge = Reihenfolge in js/daten.js, nur Themen mit Status
     "online", nur innerhalb des Fachgebiets (z. B. Klassische Mechanik).
     Beim ersten Thema fehlt "zurück", beim letzten "weiter".
     --------------------------------------------------------------------- */
  function baueBlaettern(fund) {
    var artikel = document.querySelector("article.thema");
    if (!artikel) return;
    var folge = [];
    fund.gebiet.kapitel.forEach(function (kap) {
      kap.themen.forEach(function (t) {
        if (t.status === "online" || t.id === fund.thema.id) folge.push(t);
      });
    });
    var pos = folge.indexOf(fund.thema);
    var vorher = pos > 0 ? folge[pos - 1] : null;
    var nachher = pos < folge.length - 1 ? folge[pos + 1] : null;
    if (!vorher && !nachher) return;

    var nav = el("nav", "blaettern");
    nav.setAttribute("aria-label", "Vorheriges und nächstes Thema");
    function pfeil(thema, richtung) {
      var a = el("a", "blaettern-" + richtung);
      a.href = ROOT + thema.datei;
      a.rel = richtung === "zurueck" ? "prev" : "next";
      a.append(el("span", "blaettern-pfeil", richtung === "zurueck" ? "←" : "→"));
      var text = el("span", "blaettern-text");
      text.append(el("span", "blaettern-notiz", richtung === "zurueck" ? "Vorheriges Thema" : "Nächstes Thema"),
                  el("span", "blaettern-titel", thema.titel));
      a.append(text);
      return a;
    }
    if (vorher) nav.append(pfeil(vorher, "zurueck"));
    if (nachher) nav.append(pfeil(nachher, "weiter"));
    var leiste = artikel.querySelector(".seitenleiste");
    artikel.insertBefore(nav, leiste);
  }

  /* ---------------------------------------------------------------------
     Formel-Tooltips: Jede Seite mit Formeln gibt im <head> eine
     Symbolliste an,
       <script type="application/json" id="symbole">
         { "G": "Gravitationskonstante", "R_E": "Erdradius", "ω": "…" }
       </script>
     Alle passenden kursiven Buchstaben in den KaTeX-Formeln bekommen dann
     einen Tooltip (Maus: Überfahren, Touch: Antippen). Schlüssel: Buchstabe
     oder Buchstabe_Index (Index ohne 	ext, griechisch als Zeichen); fehlt
     der Index-Schlüssel, gilt der des bloßen Buchstabens.
     Hat ein Buchstabe in einem Abschnitt eine andere Bedeutung (z. B. in
     einer Aufgabe), bekommt der umgebende Kasten ein Attribut
       data-symbole='{"d": "Durchmesser des Rohrs"}'
     – der nächste solche Kasten gilt vor der Seitenliste.
     Prüfen: werkzeuge/symbole.py (fehlende und unbenutzte Einträge).
     --------------------------------------------------------------------- */
  function baueFormelTipps() {
    var quelle = document.getElementById("symbole");
    if (!quelle) return;
    var liste;
    try { liste = JSON.parse(quelle.textContent); }
    catch (e) { console.warn("Symbolliste (#symbole) ist kein gültiges JSON:", e); return; }

    function ohneLeer(t) { return t.replace(/[​\s]/g, ""); }
    /* für werkzeuge/symbole.py: Symbole ohne Eintrag, benutzte Einträge */
    var bericht = window.formelTippsBericht = { fehlt: {}, benutzt: {} };

    /* Nur der INDEX (unten), nicht der Exponent: r^2 ist kein r_2.
       KaTeX stapelt beides in .vlist; jedes Teil hat ein style.top
       relativ zu einer Hilfslinie (.pstrut). Liegt es weniger hoch als die
       Hilfslinie (top > −Höhe), sitzt es unter der Grundlinie = Index. */
    function indexVon(msupsub) {
      var vlist = msupsub.querySelector(".vlist");
      if (!vlist) return "";
      var index = "";
      Array.prototype.forEach.call(vlist.children, function (teil) {
        var stuetze = teil.querySelector(".pstrut");
        if (!stuetze || !teil.style.top) return;
        if (parseFloat(teil.style.top) > -parseFloat(stuetze.style.height)) index += ohneLeer(teil.textContent);
      });
      return index;
    }

    /* Abschnitts-Listen (data-symbole) einmal einlesen */
    function abschnittsListe(knoten) {
      if (!knoten.__symbole) {
        try { knoten.__symbole = JSON.parse(knoten.getAttribute("data-symbole")); }
        catch (e) { console.warn("data-symbole ist kein gültiges JSON:", knoten); knoten.__symbole = {}; }
      }
      return knoten.__symbole;
    }
    function bedeutung(schluessel, sp) {
      for (var k = sp.closest("[data-symbole]"); k; k = k.parentElement && k.parentElement.closest("[data-symbole]")) {
        var l = abschnittsListe(k);
        if (Object.prototype.hasOwnProperty.call(l, schluessel)) return l[schluessel];
      }
      if (Object.prototype.hasOwnProperty.call(liste, schluessel)) {
        bericht.benutzt[schluessel] = true;
        return liste[schluessel];
      }
      return null;
    }

    /* KaTeX fasst benachbarte kursive Buchstaben („G M m“) zu EINEM Element
       zusammen – vorher in Einzelbuchstaben aufteilen */
    Array.prototype.forEach.call(document.querySelectorAll(".katex-html .mathnormal"), function (sp) {
      var zeichen = Array.from(ohneLeer(sp.textContent));
      if (zeichen.length < 2 || sp.children.length) return;
      zeichen.forEach(function (z, i) {
        var teil = el("span", sp.className, z);
        if (i === zeichen.length - 1 && sp.getAttribute("style")) teil.setAttribute("style", sp.getAttribute("style"));
        sp.parentNode.insertBefore(teil, sp);
      });
      sp.remove();
    });

    Array.prototype.forEach.call(document.querySelectorAll(".katex-html .mathnormal"), function (sp) {
      if (sp.closest(".msupsub")) return;            // Buchstaben im Index selbst nicht
      var buchstabe = ohneLeer(sp.textContent);
      var ziel = sp;
      var akzent = sp.closest(".accent");             // ec{F}: ganzes Zeichen samt Pfeil
      if (akzent && akzent.querySelectorAll(".mathnormal").length === 1) ziel = akzent;
      var index = ziel.nextElementSibling;
      var schluessel = [buchstabe];
      if (index && index.classList.contains("msupsub")) {
        var t = indexVon(index);                      // z. B. "E" bei R_	ext{E}^2
        if (t) schluessel.unshift(buchstabe + "_" + t);
        /* Buchstabe + Index liegen gemeinsam in einem .mord – den markieren */
        var eltern = ziel.parentElement;
        if (eltern.classList.contains("mord") && eltern.children.length === 2) ziel = eltern;
      }
      for (var i = 0; i < schluessel.length; i++) {
        var text = bedeutung(schluessel[i], sp);
        if (text !== null) {
          ziel.setAttribute("data-symbol", text);
          ziel.classList.add("symbol");
          return;
        }
      }
      var f = bericht.fehlt[schluessel[0]] || (bericht.fehlt[schluessel[0]] = []);
      if (f.length < 2) {                            // Formel + Ort (Kasten bzw. Abschnitt)
        var tex = sp.closest(".katex").querySelector("annotation");
        var kasten = sp.closest(".aufgabe, .beispiel, .rechnung");
        var ort = kasten ? kasten.querySelector("h3, summary") : null;
        if (!ort) {
          var tab = sp.closest(".tab, .erklaerung");
          var hs = tab ? tab.querySelectorAll("h2, h3") : [];
          for (var j = 0; j < hs.length; j++) {
            if (hs[j].compareDocumentPosition(sp) & Node.DOCUMENT_POSITION_FOLLOWING) ort = hs[j];
          }
        }
        f.push({ tex: tex ? tex.textContent : "", ort: ort ? ort.textContent.replace(/\s+/g, " ").trim().slice(0, 40) : "" });
      }
    });

    /* KaTeX legt Bruchteile, Indizes und Akzente als Ebenen mit 3em hohen
       Hilfsstreben übereinander. Die verdecken Symbole darunter für die
       Maus (Tooltip nur am oberen Rand). Darum fangen in Formeln nur die
       Symbole selbst den Zeiger (CSS-Regel .formel-tipps in stil.css). */
    document.documentElement.classList.add("formel-tipps");

    var tipp = el("div", "formel-tipp");
    tipp.setAttribute("role", "tooltip");
    tipp.hidden = true;
    document.body.append(tipp);
    var aktuell = null;

    function zeige(ziel) {
      aktuell = ziel;
      tipp.textContent = ziel.getAttribute("data-symbol");
      tipp.hidden = false;
      var r = ziel.getBoundingClientRect();
      var b = tipp.offsetWidth, h = tipp.offsetHeight;
      var x = r.left + r.width / 2 - b / 2;
      x = Math.max(8, Math.min(x, document.documentElement.clientWidth - b - 8));
      var y = r.top - h - 8;
      if (y < 72) y = r.bottom + 8;                   // nicht unter die Kopfzeile
      tipp.style.left = (x + window.scrollX) + "px";
      tipp.style.top = (y + window.scrollY) + "px";
    }
    function verstecke() { aktuell = null; tipp.hidden = true; }

    document.addEventListener("mouseover", function (ev) {
      var z = ev.target.closest && ev.target.closest(".symbol");
      if (z && z !== aktuell) zeige(z);
      else if (!z && aktuell) verstecke();
    });
    document.addEventListener("click", function (ev) {   // Touch: Antippen
      var z = ev.target.closest && ev.target.closest(".symbol");
      if (z) { if (z === aktuell) verstecke(); else zeige(z); }
      else if (aktuell) verstecke();
    });
    window.addEventListener("scroll", function () { if (aktuell) verstecke(); }, { passive: true });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") verstecke(); });
  }

  /* ---------------------------------------------------------------------
     Schnittstelle für js/uebersichten.js und js/effekte.js
     --------------------------------------------------------------------- */
  var Seite = window.Seite = {
    ROOT: ROOT, el: el, iconElement: iconElement, findeThema: findeThema,
    themaLink: themaLink, zaehle: zaehle, kapitelId: kapitelId,
    findeZweig: findeZweig, gebieteVon: gebieteVon, zaehleZweig: zaehleZweig,
    zweigLink: zweigLink,
    baueUebersichten: null,   /* setzt js/uebersichten.js */
    baueEffekte: null         /* setzt js/effekte.js */
  };

  /* ---------------------------------------------------------------------
     Los geht's – Reihenfolge wichtig: Effekte erst, wenn alle Karten und
     Übersichten stehen
     --------------------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    baueKopf();
    baueTabs();
    var leiste = baueSeitenleiste();
    baueThemenRahmen(leiste);
    if (Seite.baueUebersichten) Seite.baueUebersichten();
    baueFuss();
    if (Seite.baueEffekte) Seite.baueEffekte();
    /* Formeln setzt KaTeX beim Laden – Tooltips erst danach anbringen */
    if (document.readyState === "complete") baueFormelTipps();
    else window.addEventListener("load", baueFormelTipps);
  });
})();
