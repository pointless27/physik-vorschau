/* =========================================================================
   FORMELSAMMLUNG (themen/formelsammlung.html)
   =========================================================================
   Baut die Formelsammlung aus js/formelsammlung-daten.js (FORMELSAMMLUNG,
   erzeugt von werkzeuge/formelsammlung.py aus den Merkkästen der
   Themenseiten). Reihenfolge und Titel kommen aus js/daten.js; es
   erscheinen nur Online-Themen. Jede Themenkarte trägt die Symbolliste
   ihrer Seite als data-symbole, damit die Formel-Tooltips aus
   js/seite.js auch hier stimmen.

   Auswahl eines Fachgebiets (Knöpfe oben, Adresse #<fachgebiet-id>)
   blendet die übrigen aus – auch beim Drucken. Druckansicht:
   css/teile/werkzeuge.css (@media print).
   ========================================================================= */
(function () {
  "use strict";

  function baue(wurzel) {
    var S = window.Seite, el = S.el;
    var D = window.FORMELSAMMLUNG || {};

    var zweigNr = {};
    SITE.zweige.forEach(function (z, i) { zweigNr[z.id] = i; });
    var gebiete = SITE.fachgebiete.map(function (g, i) { return { g: g, i: i }; })
      .sort(function (a, b) { return (zweigNr[a.g.zweig] - zweigNr[b.g.zweig]) || (a.i - b.i); })
      .map(function (x) { return x.g; });

    var bloecke = [], summe = 0, themenZahl = 0;
    gebiete.forEach(function (g) {
      var themen = [];
      g.kapitel.forEach(function (k) {
        k.themen.forEach(function (t) {
          if (t.status === "online" && D[t.id]) themen.push(t);
        });
      });
      if (!themen.length) return;

      var block = el("section", "fs-gebiet");
      block.id = g.id;
      var h2 = el("h2", "fs-gebiet-titel");
      h2.append(S.iconElement(g.id), el("span", null, g.name));
      block.append(h2);
      var spalten = el("div", "fs-spalten");
      var zahl = 0;
      themen.forEach(function (t) {
        var eintrag = D[t.id];
        var karte = el("article", "fs-thema");
        karte.setAttribute("data-symbole", JSON.stringify(eintrag.symbole || {}));
        var kopf = el("h3", "fs-thema-titel");
        var a = el("a", null, t.titel);
        a.href = S.ROOT + t.datei;
        kopf.append(a);
        karte.append(kopf);
        eintrag.kaesten.forEach(function (k) {
          var kasten = el("div", "fs-kasten");
          if (k.titel && !/^(Merke|Das Wichtigste in Kürze)$/.test(k.titel)) {
            kasten.append(el("p", "fs-kasten-titel", k.titel));
          }
          var inhalt = el("div", "fs-inhalt");
          inhalt.innerHTML = k.html;
          kasten.append(inhalt);
          karte.append(kasten);
          zahl++;
        });
        var tab = eintrag.kaesten[0].tab;
        var mehr = el("a", "fs-mehr", "Zur Herleitung →");
        mehr.href = S.ROOT + t.datei + (tab && tab !== "verstehen" ? "#" + tab : "");
        karte.append(mehr);
        spalten.append(karte);
      });
      block.append(spalten);
      wurzel.append(block);
      bloecke.push({ g: g, block: block, zahl: zahl });
      summe += zahl;
      themenZahl += themen.length;
    });

    /* ----- Auswahl und Drucken ----- */
    var leiste = document.getElementById("fs-leiste");
    var knoepfe = [];
    function knopf(text, id, n) {
      var b = el("button", "fs-wahl");
      b.type = "button";
      b.append(el("span", null, text));
      if (n !== undefined) b.append(el("span", "fs-zahl", String(n)));
      b.addEventListener("click", function () { zeige(id); });
      b.__id = id;
      knoepfe.push(b);
      return b;
    }
    var wahl = el("div", "fs-wahlen");
    wahl.setAttribute("role", "group");
    wahl.setAttribute("aria-label", "Fachgebiet auswählen");
    wahl.append(knopf("Alle", "", summe));
    bloecke.forEach(function (b) { wahl.append(knopf(b.g.name, b.g.id, b.zahl)); });
    var druck = el("button", "knopf-leise fs-drucken", "Drucken oder als PDF speichern");
    druck.type = "button";
    druck.addEventListener("click", function () { window.print(); });
    if (leiste) leiste.append(wahl, druck);

    var druckTitel = document.getElementById("fs-druck-titel");
    function zeige(id) {
      var gefunden = bloecke.some(function (b) { return b.g.id === id; });
      if (!gefunden) id = "";
      bloecke.forEach(function (b) { b.block.hidden = !!id && b.g.id !== id; });
      knoepfe.forEach(function (b) { b.setAttribute("aria-pressed", String(b.__id === id)); });
      if (druckTitel) {
        var name = id ? bloecke.filter(function (b) { return b.g.id === id; })[0].g.name : "alle Fachgebiete";
        druckTitel.textContent = "Formelsammlung: " + name;
      }
      try { history.replaceState(null, "", id ? "#" + id : location.pathname + location.search); } catch (e) {}
    }
    zeige(decodeURIComponent((location.hash || "").slice(1)));

    var info = document.getElementById("fs-anzahl");
    if (info) info.textContent = summe + " Merkkästen aus " + themenZahl + " Themen";

    /* Formeln setzen (KaTeX ist hier schon geladen: defer-Skripte laufen
       vor DOMContentLoaded, starteFormeln() kam also vor diesem Inhalt) */
    if (window.renderMathInElement) {
      renderMathInElement(wurzel, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$",  right: "$",  display: false }
        ]
      });
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var wurzel = document.getElementById("formelsammlung");
    if (wurzel && window.SITE && window.Seite) baue(wurzel);
  });
})();
