/* =========================================================================
   THEMEN-LANDKARTE (themen/landkarte.html)
   =========================================================================
   Zeichnet alle Online-Themen als Karte: eine Spalte je Fachgebiet,
   Pfeile von jeder Voraussetzung zum Thema, das sie braucht. Die
   Voraussetzungen stehen im Feld "braucht" der Themen in js/daten.js –
   ein neues Thema erscheint hier also von selbst.

   Anordnung (automatisch): Ein Thema steht immer mindestens eine Zeile
   unter allen Themen, die es braucht. Reihum wird das Thema platziert,
   das am weitesten oben stehen darf (bei Gleichstand in der Reihenfolge
   von daten.js), und zwar in der ersten freien Zeile seiner Spalte.

   Bedienung: Klick auf ein Thema (oder Auswahl in der Liste) zeigt seinen
   Lernpfad: blau alles, was man vorher braucht, lila alles, was darauf
   aufbaut. Adresse #<themen-id> wählt beim Öffnen ein Thema aus.
   Aussehen: css/teile/werkzeuge.css (Abschnitt Landkarte).
   ========================================================================= */
(function () {
  "use strict";

  var ZEILE = 72;        /* Höhe einer Zeile in px (Knoten + Abstand) */
  var KNOTEN_H = 60;     /* Höhe eines Knotens in px (bis vier Zeilen Text) */
  var KOPF_H = 80;       /* Platz für die Spaltenköpfe (bis drei Zeilen) */
  var MIN_BREITE = 900;  /* schmaler wird die Karte nicht (darunter: waagerecht scrollen) */

  /* Lange zusammengesetzte Wörter dürfen in den schmalen Kästen umbrechen:
     weiches Trennzeichen nach häufigen Wortanfängen (hyphens:auto allein
     wirkt nicht in jedem Browser). */
  var TRENN = /(Differential|Koordinaten|Gravitations|Erhaltungs|Volumen|Flächen|Phasen|Wärme|Integral|Energie|Thermo|Trägheits|Elektro|Astro|Schwingungs|Grundlagen)(?=[a-zäöüß]{4,})/g;
  function trenne(text) { return text.replace(TRENN, "$1­"); }

  function kurzTitel(titel) {
    return titel.split(":")[0];
  }

  /* ----- Daten sammeln ----- */
  function sammle() {
    var zweigNr = {};
    SITE.zweige.forEach(function (z, i) { zweigNr[z.id] = i; });
    var gebiete = SITE.fachgebiete.map(function (g, i) { return { g: g, i: i }; })
      .sort(function (a, b) { return (zweigNr[a.g.zweig] - zweigNr[b.g.zweig]) || (a.i - b.i); })
      .map(function (x) { return x.g; });

    var themen = [], nachId = {}, spalten = [];
    gebiete.forEach(function (g) {
      var liste = [];
      g.kapitel.forEach(function (k) {
        k.themen.forEach(function (t) {
          if (t.status !== "online") return;
          var th = { t: t, id: t.id, gebiet: g, nr: themen.length, braucht: [], danach: [] };
          themen.push(th);
          nachId[t.id] = th;
          liste.push(th);
        });
      });
      if (liste.length) spalten.push({ gebiet: g, themen: liste, belegt: {} });
    });
    spalten.forEach(function (s, i) { s.themen.forEach(function (th) { th.spalte = i; }); });
    themen.forEach(function (th) {
      (th.t.braucht || []).forEach(function (id) {
        var p = nachId[id];
        if (!p) { console.warn("Landkarte: " + th.id + " braucht unbekanntes/geplantes Thema " + id); return; }
        th.braucht.push(p);
        p.danach.push(th);
      });
    });
    return { themen: themen, nachId: nachId, spalten: spalten };
  }

  /* ----- Zeilen vergeben (siehe Kopfkommentar) ----- */
  function ordne(d) {
    var offen = d.themen.slice(), zeilen = 0;
    while (offen.length) {
      var best = null, bestMin = Infinity;
      offen.forEach(function (th) {
        var bereit = th.braucht.every(function (p) { return p.zeile !== undefined; });
        if (!bereit) return;
        var min = 0;
        th.braucht.forEach(function (p) { min = Math.max(min, p.zeile + 1); });
        if (min < bestMin || (min === bestMin && th.nr < best.nr)) { best = th; bestMin = min; }
      });
      if (!best) {   /* Kreis in "braucht" – Rest einfach anhängen */
        console.warn("Landkarte: Kreis in den Voraussetzungen bei", offen.map(function (t) { return t.id; }));
        best = offen[0]; bestMin = 0;
      }
      var s = d.spalten[best.spalte], z = bestMin;
      while (s.belegt[z]) z++;
      s.belegt[z] = true;
      best.zeile = z;
      zeilen = Math.max(zeilen, z + 1);
      offen.splice(offen.indexOf(best), 1);
    }
    d.zeilen = zeilen;
  }

  /* alle Vorgänger bzw. Nachfolger (transitiv) */
  function huelle(th, feld) {
    var gesehen = {}, liste = [];
    (function geh(x) {
      x[feld].forEach(function (y) {
        if (gesehen[y.id]) return;
        gesehen[y.id] = true;
        liste.push(y);
        geh(y);
      });
    })(th);
    return { menge: gesehen, liste: liste };
  }

  function baue(wurzel) {
    var S = window.Seite, el = S.el;
    var d = sammle();
    ordne(d);

    /* ----- Gerüst ----- */
    var info = el("div", "karte-info");
    info.setAttribute("aria-live", "polite");
    var steuer = el("div", "karte-steuer");
    var wahl = el("select", "karte-wahl");
    wahl.setAttribute("aria-label", "Thema auswählen");
    var leer = el("option", null, "Thema auswählen …");
    leer.value = "";
    wahl.append(leer);
    d.spalten.forEach(function (s) {
      var gruppe = el("optgroup");
      gruppe.label = s.gebiet.name;
      s.themen.slice().sort(function (a, b) { return a.zeile - b.zeile; }).forEach(function (th) {
        var o = el("option", null, th.t.titel);
        o.value = th.id;
        gruppe.append(o);
      });
      wahl.append(gruppe);
    });
    var legende = el("p", "karte-legende");
    legende.innerHTML =
      '<span class="karte-farbe vorher"></span> brauchst du vorher ' +
      '<span class="karte-farbe danach"></span> baut darauf auf';
    steuer.append(wahl, legende);
    var text = el("div", "karte-text");
    info.append(steuer, text);

    var rahmen = el("div", "karte-rahmen");
    var flaeche = el("div", "karte-flaeche");
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "karte-linien");
    svg.setAttribute("aria-hidden", "true");
    flaeche.append(svg);
    rahmen.append(flaeche);
    wurzel.append(info, rahmen);

    /* Spaltenköpfe und Knoten */
    d.spalten.forEach(function (s) {
      var kopf = el("a", "karte-spaltenkopf");
      var zweig = S.findeZweig(s.gebiet.zweig);
      kopf.href = S.zweigLink(zweig, s.gebiet.id);
      kopf.setAttribute("data-zweig", s.gebiet.zweig);
      kopf.append(S.iconElement(s.gebiet.id), el("span", null, trenne(s.gebiet.name)));
      s.kopf = kopf;
      flaeche.append(kopf);
    });
    d.themen.forEach(function (th) {
      var k = el("button", "karte-knoten");
      k.type = "button";
      k.setAttribute("data-zweig", th.gebiet.zweig);
      k.setAttribute("aria-pressed", "false");
      k.title = th.t.titel;
      k.append(el("span", "karte-knoten-text", trenne(kurzTitel(th.t.titel))));
      k.addEventListener("click", function () { waehle(gewaehlt === th ? null : th, false); });
      k.addEventListener("mouseenter", function () { flaeche.classList.add("schwebt"); markiereNah(th, true); });
      k.addEventListener("mouseleave", function () { flaeche.classList.remove("schwebt"); markiereNah(th, false); });
      th.knoten = k;
      flaeche.append(k);
    });

    /* Kanten: eine pro "braucht"-Eintrag */
    var kanten = [];
    d.themen.forEach(function (th) {
      th.braucht.forEach(function (p) {
        var pfad = document.createElementNS(svgNS, "path");
        pfad.setAttribute("class", "karte-kante");
        svg.append(pfad);
        kanten.push({ von: p, nach: th, pfad: pfad });
      });
    });

    /* ----- Maße setzen (bei jeder Größenänderung) ----- */
    function lege() {
      var breite = Math.max(MIN_BREITE, rahmen.clientWidth);
      var n = d.spalten.length, sb = breite / n, rand = Math.min(10, sb * 0.06);
      var hoehe = KOPF_H + d.zeilen * ZEILE;
      flaeche.style.width = breite + "px";
      flaeche.style.height = hoehe + "px";
      svg.setAttribute("width", breite);
      svg.setAttribute("height", hoehe);
      svg.setAttribute("viewBox", "0 0 " + breite + " " + hoehe);
      d.spalten.forEach(function (s, i) {
        s.kopf.style.left = (i * sb + rand) + "px";
        s.kopf.style.width = (sb - 2 * rand) + "px";
        s.kopf.style.height = (KOPF_H - 14) + "px";
      });
      d.themen.forEach(function (th) {
        th.x = th.spalte * sb + rand;
        th.y = KOPF_H + th.zeile * ZEILE;
        th.b = sb - 2 * rand;
        th.knoten.style.left = th.x + "px";
        th.knoten.style.top = th.y + "px";
        th.knoten.style.width = th.b + "px";
        th.knoten.style.height = KNOTEN_H + "px";
      });
      kanten.forEach(function (k) {
        var a = k.von, b = k.nach, dpath;
        if (a.spalte === b.spalte && b.zeile === a.zeile + 1) {
          var xm = a.x + a.b / 2;
          dpath = "M" + xm + " " + (a.y + KNOTEN_H) + "V" + b.y;
        } else if (a.spalte === b.spalte) {
          /* gleiche Spalte, aber Zeilen dazwischen: Bogen rechts vorbei */
          var xr = a.x + a.b, y1 = a.y + KNOTEN_H / 2, y2 = b.y + KNOTEN_H / 2;
          var bauch = Math.min(rand * 1.6 + 6, 22);
          dpath = "M" + xr + " " + y1 + "C" + (xr + bauch) + " " + y1 + " " +
            (xr + bauch) + " " + y2 + " " + xr + " " + y2;
        } else {
          var x1 = a.x + a.b / 2, ya = a.y + KNOTEN_H, x2 = b.x + b.b / 2, yb = b.y;
          var dy = Math.max(24, (yb - ya) * 0.5);
          dpath = "M" + x1 + " " + ya + "C" + x1 + " " + (ya + dy) + " " +
            x2 + " " + (yb - dy) + " " + x2 + " " + yb;
        }
        k.pfad.setAttribute("d", dpath);
      });
    }

    /* ----- Hervorheben ----- */
    function markiereNah(th, an) {
      kanten.forEach(function (k) {
        if (k.von === th || k.nach === th) k.pfad.classList.toggle("nah", an);
      });
    }

    var gewaehlt = null;
    function waehle(th, scrollen) {
      gewaehlt = th;
      wahl.value = th ? th.id : "";
      var vor = th ? huelle(th, "braucht") : null;
      var nach = th ? huelle(th, "danach") : null;
      flaeche.classList.toggle("mit-auswahl", !!th);
      d.themen.forEach(function (x) {
        var k = x.knoten;
        k.classList.toggle("gewaehlt", x === th);
        k.setAttribute("aria-pressed", String(x === th));
        k.classList.toggle("vorher", !!(vor && vor.menge[x.id]));
        k.classList.toggle("danach", !!(nach && nach.menge[x.id]));
      });
      kanten.forEach(function (k) {
        var istVor = !!(th && (k.nach === th || vor.menge[k.nach.id]) && vor.menge[k.von.id]);
        var istNach = !!(th && (k.von === th || nach.menge[k.von.id]) && nach.menge[k.nach.id]);
        k.pfad.classList.toggle("vorher", istVor);
        k.pfad.classList.toggle("danach", istNach);
      });
      /* hervorgehobene Kanten nach oben legen */
      kanten.forEach(function (k) {
        if (k.pfad.classList.contains("vorher") || k.pfad.classList.contains("danach")) svg.append(k.pfad);
      });
      zeigeText(th, vor, nach);
      try {
        history.replaceState(null, "", th ? "#" + th.id : location.pathname + location.search);
      } catch (e) {}
      if (th && scrollen) {
        var r = th.knoten.getBoundingClientRect();
        var ziel = window.scrollY + r.top - window.innerHeight * 0.45;
        window.scrollTo({ top: Math.max(0, ziel), behavior: wenigBewegung() ? "auto" : "smooth" });
        rahmen.scrollLeft = Math.max(0, th.x - rahmen.clientWidth / 2 + th.b / 2);
      }
    }

    function themaLink(th) {
      var a = el("a", null, th.t.titel);
      a.href = S.ROOT + th.t.datei;
      return a;
    }

    function zeigeText(th, vor, nach) {
      text.textContent = "";
      if (!th) {
        text.append(el("p", "karte-tipp",
          "Klick auf ein Thema: Dann siehst du, welche Themen du vorher kennen solltest " +
          "und welche darauf aufbauen. Oben stehen die Grundlagen, nach unten wird es " +
          "anspruchsvoller."));
        return;
      }
      var kopf = el("p", "karte-titel");
      var link = themaLink(th);
      link.className = "karte-titel-link";
      kopf.append(link, el("span", "karte-gebiet", th.gebiet.name));
      text.append(kopf);

      var pfad = el("p", "karte-pfad");
      if (vor.liste.length === 0) {
        pfad.append(el("span", "karte-pfad-titel", "Vorher: "), "nichts, du kannst direkt hier einsteigen.");
      } else {
        /* Lernpfad von oben nach unten (Zeile, dann Spalte) */
        var reihe = vor.liste.slice().sort(function (a, b) {
          return (a.zeile - b.zeile) || (a.spalte - b.spalte);
        });
        pfad.append(el("span", "karte-pfad-titel",
          "Lernpfad (" + reihe.length + (reihe.length === 1 ? " Thema" : " Themen") + " vorher): "));
        reihe.forEach(function (x, i) {
          if (i > 0) pfad.append(el("span", "karte-pfeil", " → "));
          var a = themaLink(x);
          a.textContent = kurzTitel(x.t.titel);
          a.title = x.t.titel;
          pfad.append(a);
        });
      }
      text.append(pfad);

      var weiter = el("p", "karte-weiter");
      if (th.danach.length === 0) {
        weiter.append(el("span", "karte-pfad-titel danach", "Darauf baut auf: "),
          nach.liste.length ? "" : "bisher noch nichts, die Karte wächst aber mit.");
      } else {
        weiter.append(el("span", "karte-pfad-titel danach", "Darauf baut direkt auf: "));
        th.danach.forEach(function (x, i) {
          if (i > 0) weiter.append(", ");
          var a = themaLink(x);
          a.textContent = kurzTitel(x.t.titel);
          a.title = x.t.titel;
          weiter.append(a);
        });
      }
      text.append(weiter);
    }

    function wenigBewegung() {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    wahl.addEventListener("change", function () {
      waehle(d.nachId[wahl.value] || null, true);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && gewaehlt) waehle(null, false);
    });

    lege();
    var zeit = null;
    window.addEventListener("resize", function () {
      clearTimeout(zeit);
      zeit = setTimeout(lege, 80);
    });
    /* Schriften verändern die Breite nicht, aber die Leiste rechts kann
       nach dem Laden erscheinen – einmal nachmessen */
    window.addEventListener("load", lege);

    var start = decodeURIComponent((location.hash || "").slice(1));
    waehle(d.nachId[start] || null, !!d.nachId[start]);

    /* Zahl für den Einleitungstext */
    var zahl = document.getElementById("karte-anzahl");
    if (zahl) zahl.textContent = String(d.themen.length);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var wurzel = document.getElementById("landkarte");
    if (wurzel && window.SITE && window.Seite) baue(wurzel);
  });
})();
