/* =========================================================================
   GLOSSAR (themen/glossar.html)
   =========================================================================
   Baut aus js/glossar-daten.js (von Hand gepflegt) und
   js/symbole-daten.js (ERZEUGT von werkzeuge/formelsammlung.py aus den
   Symbollisten aller Themenseiten):
   1. Fachbegriffe von A bis Z, mit Link auf die erklärende Themenseite
      (nur wenn online). Anker: glossar.html#g-<begriff-ohne-umlaute>.
   2. Formelzeichen-Tabelle. Die Spalte „Kommt vor in“ entsteht
      automatisch: alle Online-Themen, in deren Symbolliste das Zeichen
      mit einer passenden Bedeutung (Feld s) steht.
   3. Suche über beides. Kurze Eingaben (bis 3 Zeichen, auch „omega“ usw.)
      gelten als Formelzeichen; darunter erscheinen dann alle Stellen aus
      den Symbollisten der Themenseiten, gruppiert nach Bedeutung.
   Aussehen: css/teile/werkzeuge.css (Abschnitt Glossar).
   ========================================================================= */
(function () {
  "use strict";

  var GRIECHISCH = { alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε",
    zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν",
    xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ", phi: "φ", varphi: "φ", chi: "χ", psi: "ψ",
    omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Sigma: "Σ", Phi: "Φ", Psi: "Ψ",
    Omega: "Ω", nabla: "∇" };
  var TEX = { "α": "\\alpha", "β": "\\beta", "γ": "\\gamma", "δ": "\\delta", "ε": "\\varepsilon",
    "ζ": "\\zeta", "η": "\\eta", "θ": "\\theta", "ϑ": "\\vartheta", "κ": "\\kappa", "λ": "\\lambda",
    "μ": "\\mu", "ν": "\\nu", "ξ": "\\xi", "π": "\\pi", "ρ": "\\rho", "σ": "\\sigma", "τ": "\\tau",
    "φ": "\\varphi", "ϕ": "\\phi", "χ": "\\chi", "ψ": "\\psi", "ω": "\\omega", "Γ": "\\Gamma",
    "Δ": "\\Delta", "Θ": "\\Theta", "Λ": "\\Lambda", "Σ": "\\Sigma", "Φ": "\\Phi", "Ψ": "\\Psi",
    "Ω": "\\Omega", "∇": "\\nabla", "⊙": "\\odot", "⊥": "\\perp", "∥": "\\parallel", "∞": "\\infty" };

  function normiere(t) {
    return t.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue")
      .replace(/ß/g, "ss").replace(/[èé]/g, "e");
  }
  function anker(b) {
    return "g-" + normiere(b).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
  function ersterBuchstabe(b) {
    var c = normiere(b).charAt(0).toUpperCase();
    return /[A-Z]/.test(c) ? c : "#";
  }
  function kurzTitel(t) { return t.split(":")[0]; }

  /* Symbol-Schlüssel wie "R_E", "v_0", "ω_⊥" → KaTeX */
  function texVon(z) {
    var teile = z.split("_"), basis = teile[0], index = teile.slice(1).join("_");
    var t = basis.split("").map(function (c) { return TEX[c] || c; }).join(" ");
    if (index) {
      if (/^[0-9]+$/.test(index)) t += "_{" + index + "}";
      else if (/^[^A-Za-z0-9]$/.test(index) || TEX[index]) t += "_{" + (TEX[index] || index) + "}";
      else t += "_\\text{" + index.replace(/[{}\\]/g, "") + "}";
    }
    return t;
  }
  function setzeTex(el, tex) {
    if (window.katex) {
      try { katex.render(tex, el, { throwOnError: false }); return; } catch (e) {}
    }
    el.textContent = tex;
  }

  function baue() {
    var S = window.Seite, el = S.el;
    var B = (window.GLOSSAR_BEGRIFFE || []).slice();
    var Z = window.GLOSSAR_ZEICHEN || [];
    var SYM = window.SYMBOLE || {};

    /* Online-Themen in der Reihenfolge von daten.js */
    var themen = [], themaVon = {};
    SITE.fachgebiete.forEach(function (g) {
      g.kapitel.forEach(function (k) {
        k.themen.forEach(function (t) {
          if (t.status !== "online") return;
          var e = { t: t, g: g };
          themen.push(e);
          themaVon[t.id] = e;
        });
      });
    });
    function themaLink(id, a, text) {
      var e = themaVon[id];
      if (!e) return null;
      var l = el("a", null, text || kurzTitel(e.t.titel));
      l.href = S.ROOT + e.t.datei + (a ? "#" + a : "");
      l.title = e.t.titel;
      return l;
    }

    /* ----- 1. Fachbegriffe ----- */
    B.sort(function (x, y) { return x.b.localeCompare(y.b, "de"); });
    var behaelter = document.getElementById("gl-begriffe");
    var abc = document.getElementById("gl-abc");
    var gruppen = {}, eintraege = [];
    B.forEach(function (x) {
      var buchstabe = ersterBuchstabe(x.b);
      if (!gruppen[buchstabe]) {
        var g = el("section", "gl-gruppe");
        g.id = "buchstabe-" + buchstabe;
        g.append(el("h3", "gl-buchstabe", buchstabe));
        var liste = el("div", "gl-liste");
        g.append(liste);
        behaelter.append(g);
        gruppen[buchstabe] = { el: g, liste: liste, eintraege: [] };
      }
      var art = el("article", "gl-eintrag");
      art.id = anker(x.b);
      art.append(el("h4", "gl-begriff", x.b));
      art.append(el("p", "gl-text", x.t));
      var fuss = el("p", "gl-fuss");
      if (x.auch && x.auch.length) fuss.append(el("span", "gl-auch", "auch: " + x.auch.join(", ")));
      var link = null;
      if (x.th) {
        link = themaLink(x.th, x.a);
        if (link) {
          link.textContent = "→ " + link.textContent;
          var gebiet = themaVon[x.th].g;
          fuss.append(link, el("span", "gl-gebiet", gebiet.name));
        }
      } else if (x.seite) {
        link = el("a", null, "→ " + x.seite[1]);
        link.href = S.ROOT + x.seite[0];
        fuss.append(link);
      }
      if (fuss.childNodes.length) art.append(fuss);
      gruppen[buchstabe].liste.append(art);
      var e = { x: x, el: art, gruppe: gruppen[buchstabe],
                name: normiere(x.b), voll: normiere([x.b].concat(x.auch || []).join(" ") + " " + x.t) };
      gruppen[buchstabe].eintraege.push(e);
      eintraege.push(e);
    });
    var abcLinks = {};
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (c) {
      var a = el("a", "gl-abc-link", c);
      if (gruppen[c]) a.href = "#buchstabe-" + c;
      else { a.setAttribute("aria-disabled", "true"); a.classList.add("leer"); }
      abc.append(a);
      abcLinks[c] = a;
    });

    /* ----- 2. Formelzeichen ----- */
    var tabelleOrt = document.getElementById("gl-zeichen");
    var huelle = el("div", "tabelle-huelle");
    var tab = el("table", "gl-tabelle");
    var kopf = el("thead");
    var kz = el("tr");
    ["Zeichen", "Bedeutung", "Einheit", "Kommt vor in"].forEach(function (t) { kz.append(el("th", null, t)); });
    kopf.append(kz);
    var rumpf = el("tbody");
    tab.append(kopf, rumpf);
    huelle.append(tab);
    tabelleOrt.append(huelle);
    var zeilen = [];
    Z.forEach(function (x) {
      var re = new RegExp(x.s, "i");
      var vor = themen.filter(function (e) {
        var l = SYM[e.t.id];
        return l && Object.prototype.hasOwnProperty.call(l, x.z) && re.test(l[x.z]);
      });
      var tr = el("tr");
      var tdZ = el("td", "gl-z");
      setzeTex(tdZ, x.tex);
      var tdE = el("td", "gl-einheit");
      if (x.e) setzeTex(tdE, x.e); else tdE.textContent = "–";
      var tdT = el("td", "gl-themen");
      vor.slice(0, 4).forEach(function (e, i) {
        if (i) tdT.append(", ");
        tdT.append(themaLink(e.t.id));
      });
      if (vor.length > 4) {
        var mehr = el("span", "gl-mehr", " und " + (vor.length - 4) + " weitere");
        mehr.title = vor.slice(4).map(function (e) { return kurzTitel(e.t.titel); }).join(", ");
        tdT.append(mehr);
      }
      if (!vor.length) tdT.textContent = "–";
      tr.append(tdZ, el("td", "gl-bed", x.b), tdE, tdT);
      rumpf.append(tr);
      zeilen.push({ x: x, el: tr, text: normiere(x.b) });
    });

    /* ----- 3. Suche ----- */
    var feld = document.getElementById("gl-suche");
    var info = document.getElementById("gl-anzahl");
    var treffer = document.getElementById("gl-treffer");
    var leerB = document.getElementById("gl-keine-begriffe");
    function zeichenAnfrage(q) {
      var roh = q.trim().replace(/^\\/, "");
      if (GRIECHISCH[roh]) return GRIECHISCH[roh];
      var m = roh.match(/^([A-Za-z]+)_(.+)$/);
      if (m && GRIECHISCH[m[1]]) return GRIECHISCH[m[1]] + "_" + m[2];
      return roh.length <= 3 || /_/.test(roh) ? roh : null;
    }
    function zeigeTreffer(q, zq) {
      treffer.textContent = "";
      if (!q) return;
      var nq = normiere(q.trim());
      var gruppenT = {}, reihenfolge = [];
      themen.forEach(function (e) {
        var l = SYM[e.t.id];
        if (!l) return;
        Object.keys(l).forEach(function (z) {
          var passt = zq ? (z === zq || z.indexOf(zq + "_") === 0) : (nq.length >= 3 && normiere(l[z]).indexOf(nq) >= 0);
          if (!passt) return;
          /* Zusätze weg: „ (in K)“, „, 9,81 m/s²“, „ ≈ 8,99·10⁹ …“ – aber 1/(4π ε₀) bleibt */
          var bed = l[z].replace(/\s+\([^)]*\)/g, "").replace(/,\s*[0-9≈−-].*$/, "")
            .replace(/\s*≈.*$/, "").trim();
          var schluessel = z + "|" + normiere(bed);
          if (!gruppenT[schluessel]) { gruppenT[schluessel] = { z: z, bed: bed, themen: [] }; reihenfolge.push(schluessel); }
          if (gruppenT[schluessel].themen.indexOf(e) < 0) gruppenT[schluessel].themen.push(e);
        });
      });
      if (!reihenfolge.length) return;
      reihenfolge.sort(function (a, b) {
        var x = gruppenT[a], y = gruppenT[b];
        return (x.z.length - y.z.length) || x.z.localeCompare(y.z) || (y.themen.length - x.themen.length);
      });
      var gezeigt = reihenfolge.slice(0, 60);
      treffer.append(el("h3", "gl-treffer-titel",
        "Auf den Themenseiten (" + reihenfolge.length + (reihenfolge.length === 1 ? " Bedeutung)" : " Bedeutungen)")));
      var ul = el("ul", "gl-treffer-liste");
      gezeigt.forEach(function (s) {
        var g = gruppenT[s], li = el("li");
        var z = el("span", "gl-treffer-z");
        setzeTex(z, texVon(g.z));
        li.append(z, el("span", "gl-treffer-bed", g.bed));
        var t = el("span", "gl-treffer-themen");
        g.themen.slice(0, 5).forEach(function (e, i) { if (i) t.append(", "); t.append(themaLink(e.t.id)); });
        if (g.themen.length > 5) t.append(" und " + (g.themen.length - 5) + " weitere");
        li.append(t);
        ul.append(li);
      });
      treffer.append(ul);
      if (reihenfolge.length > gezeigt.length) treffer.append(el("p", "gl-hinweis", "… und weitere. Gib mehr ein, um die Liste einzugrenzen."));
    }
    function filtere() {
      var q = feld.value.trim(), nq = normiere(q), zq = q ? zeichenAnfrage(q) : null;
      var nB = 0, nZ = 0;
      eintraege.forEach(function (e) {
        var ja = !q || (nq.length <= 2 ? e.name.indexOf(nq) === 0 : e.voll.indexOf(nq) >= 0);
        e.el.hidden = !ja;
        if (ja) nB++;
      });
      Object.keys(gruppen).forEach(function (c) {
        var sichtbar = gruppen[c].eintraege.some(function (e) { return !e.el.hidden; });
        gruppen[c].el.hidden = !sichtbar;
        abcLinks[c].classList.toggle("leer", !sichtbar);
      });
      zeilen.forEach(function (r) {
        var ja = !q || (zq && (r.x.z === zq || r.x.z.indexOf(zq + "_") === 0)) ||
          (nq.length >= 3 && r.text.indexOf(nq) >= 0);
        r.el.hidden = !ja;
        if (ja) nZ++;
      });
      leerB.hidden = nB > 0;
      document.getElementById("gl-keine-zeichen").hidden = nZ > 0;
      info.textContent = q ? nB + " Begriffe und " + nZ + " Formelzeichen gefunden" :
        B.length + " Begriffe und " + Z.length + " Formelzeichen";
      zeigeTreffer(q, zq);
    }
    feld.addEventListener("input", filtere);
    filtere();

    /* Sprung auf einen Begriff (#g-entropie): hervorheben */
    function markiereZiel() {
      var id = decodeURIComponent((location.hash || "").slice(1));
      var ziel = id && document.getElementById(id);
      document.querySelectorAll(".gl-eintrag.ziel").forEach(function (x) { x.classList.remove("ziel"); });
      if (ziel && ziel.classList.contains("gl-eintrag")) {
        ziel.classList.add("ziel");
        setTimeout(function () { ziel.scrollIntoView({ block: "center" }); }, 0);
      }
    }
    window.addEventListener("hashchange", markiereZiel);
    markiereZiel();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("gl-begriffe") && window.Seite) baue();
  });
})();
