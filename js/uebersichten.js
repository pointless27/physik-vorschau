/* =========================================================================
   ÜBERSICHTEN AUS js/daten.js
   =========================================================================
   Zahlenleiste und Bereichs-Karten (Startseite, Themenübersicht),
   Bereichsseiten mit aufklappbaren Fachgebieten. Jeder Baustein läuft
   nur, wenn sein Behälter auf der Seite existiert.
   Einbinden NACH js/seite.js – nur auf index.html, themen/index.html
   und themen/<bereich>.html.
   ========================================================================= */

(function (Seite) {
  "use strict";

  var ROOT = Seite.ROOT, el = Seite.el, iconElement = Seite.iconElement,
      themaLink = Seite.themaLink, zaehle = Seite.zaehle, kapitelId = Seite.kapitelId, findeZweig = Seite.findeZweig,
      gebieteVon = Seite.gebieteVon, zaehleZweig = Seite.zaehleZweig, zweigLink = Seite.zweigLink;

  /* ---------------------------------------------------------------------
     Übersichten aus den Daten erzeugen (falls die Behälter existieren)
     --------------------------------------------------------------------- */

  /* Startseite: Zahlenleiste im Hero */
  function baueZahlen() {
    var ziel = document.getElementById("site-zahlen");
    if (!ziel) return;

    var themen = 0, online = 0;
    SITE.fachgebiete.forEach(function (g) {
      var z = zaehle(g);
      themen += z.gesamt;
      online += z.online;
    });

    [
      [SITE.zweige.length, "Bereiche"],
      [SITE.fachgebiete.length, "Fachgebiete"],
      [themen, "Themen geplant"],
      [online, "Themen online"]
    ].forEach(function (paar) {
      var box = el("div", "zahl");
      box.append(el("b", null, String(paar[0])), el("span", null, paar[1]));
      ziel.append(box);
    });
  }

  /* Themenzahl "103 Themen" (Wunsch des Betreibers 2026-11-13: nur die
     Gesamtzahl zeigen, kein "n von m online", kein Fortschrittsbalken) */
  function themenText(n) { return n + (n === 1 ? " Thema" : " Themen"); }
  function fortschrittElement(z) {
    var fortschritt = el("div", "fortschritt");
    fortschritt.append(el("span", "fortschritt-text", themenText(z.gesamt)));
    return fortschritt;
  }

  /* ---------------------------------------------------------------------
     Bereiche (Hauptzweige)
     ---------------------------------------------------------------------
     Startseite und Themenübersicht (#bereiche): eine breite Karte je
     Bereich mit Beschreibung, Fachgebieten, Reitern der Themenseiten und
     Fortschritt; die ganze Karte führt zur Bereichsseite.
     Bereichsseite (#bereich, <body data-zweig="...">): alle Fachgebiete
     des Bereichs mit Kapiteln und Themen.
     --------------------------------------------------------------------- */

  /* Reiter der Themenseiten: Name und Icon (wie "Jedes Thema auf zwei
     Ebenen" auf der Startseite); "erklaerung" = Erklärseite ohne Reiter */
  var REITER = {
    verstehen:  ["Verstehen", '<path d="M9.5 18h5M10.3 21h3.4"/><path d="M8.6 14.6a6 6 0 1 1 6.8 0c-.9.7-1.4 1.7-1.4 3.4h-4c0-1.7-.5-2.7-1.4-3.4z"/>'],
    vertiefung: ["Vertiefung", '<path d="M16.5 3.4c-2.1-.9-3.9.1-4.3 2.9l-1.9 11.4c-.4 2.8-2.2 3.8-4.3 2.9"/>'],
    beispiele:  ["Beispiel­rechnungen", '<rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M8.5 6h7v3.2h-7z"/><path d="M9 13.2h.01M12 13.2h.01M15 13.2h.01M9 17.2h.01M12 17.2h.01M15 17.2h.01" stroke-width="2.2"/>'],
    aufgaben:   ["Aufgaben", '<path d="M4.5 19.5l1-4.4L16 4.6a2.1 2.1 0 0 1 3 3L8.5 18.1z"/><path d="M14.4 6.2l3.4 3.4"/><path d="M13 20.5h6.5"/>'],
    erklaerung: ["Erklärseite", '<path d="M12 6.5c-1.8-1.3-4.6-2-8-2v13c3.4 0 6.2.7 8 2 1.8-1.3 4.6-2 8-2v-13c-3.4 0-6.2.7-8 2z"/><path d="M12 6.5v13"/>']
  };

  /* Welche Reiter haben die Themenseiten des Bereichs? */
  function seitenartElement(zweig) {
    var box = el("div", "bereich-seitenart");
    var liste = el("ul", "bereich-reiter");
    var reiter = (zweig.reiter && zweig.reiter.length) ? zweig.reiter : ["erklaerung"];
    reiter.forEach(function (r) {
      if (!REITER[r]) return;
      var li = el("li");
      li.setAttribute("data-ebene", r);
      var icon = el("span", "reiter-icon");
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' + REITER[r][1] + '</svg>';
      li.append(icon, el("span", null, REITER[r][0]));
      liste.append(li);
    });
    box.append(liste);
    if (zweig.seitenart) box.append(el("p", "bereich-seitenart-text", zweig.seitenart));
    return box;
  }

  /* Fachgebiete eines Bereichs als Links; hat der Bereich nur ein
     Fachgebiet, stehen dort dessen Kapitel. */
  function gliederungElement(zweig) {
    var p = el("p", "karte-gebiete");
    var gebiete = gebieteVon(zweig);
    var eintraege = gebiete.length === 1
      ? gebiete[0].kapitel.map(function (k) { return [k.name, kapitelId(gebiete[0], k)]; })
      : gebiete.map(function (g) { return [g.name, g.id]; });
    eintraege.forEach(function (e, i) {
      if (i > 0) p.append(" · ");
      var a = el("a", null, e[0]);
      a.href = zweigLink(zweig, e[1]);
      p.append(a);
    });
    return p;
  }

  function bereichKarte(zweig) {
    var karte = el("section", "gebiet-karte bereich-karte einblenden");
    karte.id = "bereich-" + zweig.id;
    karte.setAttribute("data-zweig", zweig.id);   /* Hover-Farbe, siehe CSS */

    var haupt = el("div", "bereich-haupt");
    var titel = el("div", "bereich-titel");
    var h2 = el("h2");
    var link = el("a", "bereich-link", zweig.name);   /* deckt per ::after die ganze Karte ab */
    link.href = zweigLink(zweig);
    h2.append(link);
    titel.append(iconElement(zweig.id), h2);
    haupt.append(titel, el("p", "bereich-text", zweig.beschreibung), gliederungElement(zweig));

    var seite = el("div", "bereich-seite");
    seite.append(el("p", "bereich-notiz", "so sind die Seiten aufgebaut"),
      seitenartElement(zweig), fortschrittElement(zaehleZweig(zweig)));
    var weiter = el("span", "bereich-weiter", "Alle Themen des Bereichs →");
    weiter.setAttribute("aria-hidden", "true");
    seite.append(weiter);

    karte.append(haupt, seite);
    return karte;
  }

  /* Startseite und Themenübersicht: alle Bereiche untereinander */
  function baueBereiche() {
    var ziel = document.getElementById("bereiche");
    if (!ziel) return;
    SITE.zweige.forEach(function (zweig) {
      if (gebieteVon(zweig).length > 0) ziel.append(bereichKarte(zweig));
    });
  }

  /* Alte Adressen der Themenübersicht (themen/index.html#physik,
     #mechanik, #mechanik-kinematik) auf die Bereichsseiten umleiten */
  function leiteAlteAdressenUm() {
    if (!document.body.hasAttribute("data-uebersicht")) return;
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var zweig = findeZweig(id);
    if (zweig) { location.replace(zweigLink(zweig)); return; }
    SITE.fachgebiete.forEach(function (g) {
      var treffer = g.id === id || g.kapitel.some(function (k) { return kapitelId(g, k) === id; });
      var z = treffer && findeZweig(g.zweig);
      if (z) location.replace(zweigLink(z, id));
    });
  }

  /* Welche Fachgebiete offen sind, merkt sich der Browser (localStorage,
     Schlüssel "themen-offen"); ohne gemerkten Zustand sind die Gebiete
     offen, in denen schon etwas online ist. */
  function lesOffen() {
    try { return JSON.parse(localStorage.getItem("themen-offen")) || {}; }
    catch (e) { return {}; }
  }
  function schreibOffen(zustand) {
    try { localStorage.setItem("themen-offen", JSON.stringify(zustand)); } catch (e) {}
  }

  /* Bereichsseite: Kopf, Fachgebiete (einklappbar), Wechsel zu den anderen Bereichen */
  function baueBereichSeite() {
    var ziel = document.getElementById("bereich");
    if (!ziel) return;
    var zweig = findeZweig(document.body.getAttribute("data-zweig"));
    if (!zweig) return;
    var gebiete = gebieteVon(zweig);
    var gemerkt = lesOffen();
    var alleKaesten = [];

    var krume = el("nav", "brotkrume");
    krume.setAttribute("aria-label", "Brotkrume");
    var aThemen = el("a", null, "Themen");
    aThemen.href = ROOT + "themen/index.html";
    var hier = el("span", null, zweig.name);
    hier.setAttribute("aria-current", "page");
    krume.append(aThemen, el("span", "trenner", "›"), hier);

    var kopf = el("header", "bereich-kopf");
    var h1 = el("h1");
    h1.append(iconElement(zweig.id), el("span", null, zweig.name));
    var theorie = gebiete.some(function (g) {
      return g.kapitel.some(function (k) { return k.art === "theorie"; });
    });
    kopf.append(h1,
      el("p", "hero-text seitenkopf-text", zweig.beschreibung),
      seitenartElement(zweig),
      gebiete.length > 1 ? el("p", "zweig-zaehler", gebiete.length + " Fachgebiete") : "",
      el("p", "bereich-hinweis", (theorie
        ? "Kapitel mit der Notiz „Theorie“ gibt es nur in der Theorie-Vorlesung. " : "") +
        "Als „geplant“ markierte Themen kommen nach und nach dazu."));
    ziel.append(krume, kopf);

    if (gebiete.length > 1) {
      /* Leiste: Sprungmarken zu den Fachgebieten + alle auf/zu */
      var leiste = el("div", "baum-leiste");
      var sprung = el("nav", "baum-sprung");
      sprung.setAttribute("aria-label", "Fachgebiete");
      gebiete.forEach(function (g) {
        var a = el("a", null, g.name);
        a.href = "#" + g.id;
        sprung.append(a);
      });
      /* EIN Knopf: sind alle Gebiete offen, klappt er alle zu, sonst alle auf */
      var knoepfe = el("div", "baum-knoepfe");
      var umschalter = el("button", "knopf-leise");
      umschalter.type = "button";
      function alleOffen() {
        return alleKaesten.every(function (d) { return d.open; });
      }
      function beschrifte() {
        umschalter.textContent = alleOffen() ? "Alle zuklappen" : "Alle aufklappen";
      }
      umschalter.addEventListener("click", function () {
        var auf = !alleOffen();
        alleKaesten.forEach(function (d) { d.open = auf; });
        beschrifte();
      });
      knoepfe.append(umschalter);
      leiste.append(sprung, knoepfe);
      var raster = el("div", "zweig-gebiete");
      gebiete.forEach(function (gebiet) {
        raster.append(baueGebietKasten(gebiet, gemerkt, alleKaesten));
      });
      /* auch einzelnes Auf-/Zuklappen (oder ein Sprung per #id) ändert die Beschriftung */
      alleKaesten.forEach(function (d) { d.addEventListener("toggle", beschrifte); });
      beschrifte();
      ziel.append(leiste, raster);
    } else if (gebiete.length === 1) {
      /* Nur ein Fachgebiet: Kapitel direkt zeigen, ohne Aufklappen */
      var flach = el("div", "gebiet-abschnitt gebiet-flach einblenden");
      flach.id = gebiete[0].id;
      flach.append(baueKapitelInhalt(gebiete[0]));
      ziel.append(flach);
    }

    /* Wechsel zu den anderen Bereichen */
    var wechsel = el("nav", "bereich-wechsel");
    wechsel.setAttribute("aria-label", "Weitere Bereiche");
    wechsel.append(el("h2", null, "Weitere Bereiche"));
    var liste = el("div", "bereich-wechsel-liste");
    SITE.zweige.forEach(function (z) {
      if (z.id === zweig.id || gebieteVon(z).length === 0) return;
      var a = el("a");
      a.href = zweigLink(z);
      a.setAttribute("data-zweig", z.id);
      a.append(iconElement(z.id), el("span", null, z.name));
      liste.append(a);
    });
    wechsel.append(liste);
    ziel.append(wechsel);

    /* Adresse mit #id: Fachgebiet (bzw. das Fachgebiet eines Kapitels)
       aufklappen und hinscrollen */
    function zeigeZiel() {
      var id = decodeURIComponent(location.hash.slice(1));
      var e = id && document.getElementById(id);
      if (!e) return;
      var kasten = e.closest("details");
      if (kasten) kasten.open = true;
      e.scrollIntoView({ block: "start" });
    }
    zeigeZiel();
    window.addEventListener("hashchange", zeigeZiel);
  }

  /* Kapitel und Themen eines Fachgebiets; auf breiten Bildschirmen zweispaltig */
  function baueKapitelInhalt(gebiet) {
    var inhalt = el("div", "gebiet-inhalt");
    gebiet.kapitel.forEach(function (kap) {
      var gruppe = el("div", "kapitel-gruppe");
      gruppe.id = kapitelId(gebiet, kap);   // Sprungziel für die Brotkrume
      var kt = el("h4", "kapitel-titel", kap.name);
      if (kap.art === "theorie") {
        var notiz = el("span", "kapitel-art", "Theorie");
        notiz.title = "Stoff aus der Theorie-Vorlesung";
        kt.append(notiz);
      }
      gruppe.append(kt);
      inhalt.append(gruppe);
      var ul = el("ul", "themen-liste");
      kap.themen.forEach(function (t) {
        var li = el("li");
        if (t.status === "online") {
          li.append(themaLink(t));
        } else {
          var span = el("span", "geplant-eintrag");
          span.append(el("span", null, t.titel), el("span", "geplant-marke", "geplant"));
          li.append(span);
        }
        ul.append(li);
      });
      gruppe.append(ul);
    });
    return inhalt;
  }

  /* Ein Fachgebiet als <details>: Kopf (Icon, Name, Zähler) zum Aufklappen */
  function baueGebietKasten(gebiet, gemerkt, alleKaesten) {
    var z = zaehle(gebiet);
    var kasten = el("details", "gebiet-abschnitt einblenden");
    kasten.id = gebiet.id;
    kasten.open = gemerkt.hasOwnProperty(gebiet.id) ? !!gemerkt[gebiet.id] : z.online > 0;
    alleKaesten.push(kasten);

    var kopf = el("summary");
    var titel = el("span", "gebiet-titel");
    titel.append(el("h3", null, gebiet.name),
      el("span", "gebiet-zaehler", themenText(z.gesamt)));
    var pfeil = el("span", "aufklapp-pfeil");
    pfeil.setAttribute("aria-hidden", "true");
    kopf.append(iconElement(gebiet.id), titel, pfeil);
    kasten.append(kopf, el("p", "gebiet-beschreibung", gebiet.beschreibung),
      baueKapitelInhalt(gebiet));

    kasten.addEventListener("toggle", function () {
      gemerkt[gebiet.id] = kasten.open;
      schreibOffen(gemerkt);
    });
    return kasten;
  }

  /* Aufruf aus js/seite.js (DOMContentLoaded), in dieser Reihenfolge */
  Seite.baueUebersichten = function () {
    baueZahlen();
    leiteAlteAdressenUm();
    baueBereiche();
    baueBereichSeite();
  };
})(window.Seite);
