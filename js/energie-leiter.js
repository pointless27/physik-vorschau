/* =========================================================================
   ENERGIE-LEITER (themen/energie-leiter.html)
   =========================================================================
   Von einem WLAN-Photon bis zu verschmelzenden Schwarzen Löchern: 72
   Zehnerpotenzen Energie auf einer Leiter. Oben eine klebende Übersicht
   (logarithmische Achse mit allen Sprossen), darunter die Sprossen mit
   Erklärung als Klappkarten, dazwischen der Faktor bis zur nächsten
   als Abzeichen auf der Leiter. Der Umrechner
   rechnet eine eigene Energie in Joule um und zeigt die Nachbarn.

   Neue Sprosse: Eintrag in ENERGIEN (Wert in Joule, nach Wert sortiert
   oder nicht – es wird sortiert). thema = id einer Themenseite; verlinkt
   wird nur, wenn sie online ist. rund: true → „rund“ vor dem Wert
   (Schätzungen). Alle Werte mit Python nachgerechnet (Schritt 73).
   Aussehen: css/teile/werkzeuge.css (Abschnitt Energie-Leiter).
   ========================================================================= */
(function () {
  "use strict";

  var ENERGIEN = [
    { name: "Ein Photon deines WLANs", wert: 1.59e-24, zusatz: "bei 2,4 GHz", gruppe: "Teilchen",
      text: "Funkwellen bestehen wie Licht aus Photonen. Jedes trägt nach Planck die Energie E = h · f, und bei so niedriger Frequenz ist das winzig. Funkwellen können darum keine Moleküle aufbrechen." },
    { name: "Ein Luftmolekül bei Zimmertemperatur", wert: 6.07e-21, zusatz: "Mittelwert bei 20 °C", gruppe: "Teilchen", thema: "ideales-gas",
      text: "So viel Bewegungsenergie hat ein Stickstoff- oder Sauerstoffmolekül im Mittel. Die Temperatur ist nichts anderes als ein Maß für diese Energie." },
    { name: "Ein Photon grünen Lichts", wert: 3.75e-19, zusatz: "2,3 eV bei 530 nm", gruppe: "Teilchen",
      text: "Genug, um in deinem Auge ein Sehpigment umzuklappen. Das ist rund 60-mal mehr als die Wärmeenergie eines Moleküls. Deshalb leuchten Dinge bei Zimmertemperatur nicht sichtbar." },
    { name: "Ein Wasserstoffatom ionisieren", wert: 2.18e-18, zusatz: "13,6 eV", gruppe: "Teilchen",
      text: "Diese Energie braucht man, um das Elektron ganz vom Proton zu lösen. Chemische Bindungen liegen in derselben Größenordnung, bei einigen Elektronenvolt." },
    { name: "Ein Röntgenphoton beim Arzt", wert: 9.61e-15, zusatz: "60 keV", gruppe: "Teilchen",
      text: "Über zwanzigtausendmal mehr als ein Photon sichtbaren Lichts. Darum gehen Röntgenstrahlen durch Weichteile hindurch und werden erst von Knochen merklich geschluckt." },
    { name: "Die Masse eines Elektrons", wert: 8.19e-14, zusatz: "511 keV, E = mc²", gruppe: "Teilchen",
      text: "Nach Einstein ist Masse eine Form von Energie. Trifft ein Elektron auf ein Positron, sein Antiteilchen, entstehen zwei Photonen mit je 511 keV. Davon lebt die PET-Untersuchung im Krankenhaus." },
    { name: "Eine Kernfusion", wert: 2.82e-12, zusatz: "17,6 MeV", gruppe: "Teilchen",
      text: "Verschmelzen ein Deuterium- und ein Tritiumkern zu Helium, wird so viel frei. Diese Reaktion wollen Fusionskraftwerke wie ITER nutzen." },
    { name: "Ein Urankern wird gespalten", wert: 3.20e-11, zusatz: "rund 200 MeV", gruppe: "Teilchen",
      text: "Die Reaktion im Kernkraftwerk. Pro Kern wird mehr als zehn Millionen Mal so viel frei wie beim Verbrennen eines einzelnen Moleküls." },
    { name: "Die Masse eines Protons", wert: 1.50e-10, zusatz: "938 MeV, E = mc²", gruppe: "Teilchen",
      text: "Nur etwa ein Prozent davon stammt aus der Masse seiner drei Quarks. Der Rest ist Bewegungs- und Feldenergie in seinem Inneren." },
    { name: "Eine fliegende Mücke", wert: 3.1e-7, zusatz: "2,5 mg bei 0,5 m/s", gruppe: "Alltag",
      text: "Bewegungsenergie E = ½ m v². Klein, aber verteilt auf unvorstellbar viele Teilchen." },
    { name: "Ein Proton im LHC", wert: 1.09e-6, zusatz: "6,8 TeV", gruppe: "Teilchen",
      text: "So viel Energie hat ein einzelnes Proton im größten Teilchenbeschleuniger der Welt am CERN. Gut das Dreifache der Mücke, aber in einem einzigen Teilchen." },
    { name: "Ein Tastendruck", wert: 2.4e-3, zusatz: "0,6 N über 4 mm", gruppe: "Alltag", thema: "arbeit-leistung",
      text: "Arbeit ist Kraft mal Weg: Du drückst eine Taste mit etwa 0,6 Newton vier Millimeter tief." },
    { name: "Einen Apfel einen Meter hochheben", wert: 0.981, zusatz: "100 g, E = m g h", gruppe: "Alltag", thema: "energieerhaltung",
      text: "So kannst du dir ein Joule merken: Es ist ungefähr die Lageenergie, die ein Apfel gewinnt, wenn du ihn vom Tisch auf Kopfhöhe hebst." },
    { name: "Ein harter Tennisaufschlag", wert: 86, zusatz: "57 g bei 200 km/h", gruppe: "Alltag",
      text: "Die Bewegungsenergie wächst mit dem Quadrat der Geschwindigkeit. Der leichte Ball hat darum fast hundertmal so viel Energie wie der gehobene Apfel." },
    { name: "Usain Bolt in vollem Lauf", wert: 7.1e3, zusatz: "94 kg bei 12,3 m/s", gruppe: "Alltag", thema: "usain-bolt",
      text: "Seine Bewegungsenergie zwischen 60 und 80 Metern im Weltrekordlauf 2009, als er am schnellsten war." },
    { name: "Ein voller Handy-Akku", wert: 6.2e4, zusatz: "17 Wh", gruppe: "Technik",
      text: "4500 mAh bei 3,85 V. Erstaunlich wenig: nur etwa ein Siebzehntel dessen, was in einem Schokoriegel steckt." },
    { name: "Ein Auto mit 100 km/h", wert: 5.8e5, zusatz: "1,5 t", gruppe: "Technik", thema: "energieerhaltung",
      text: "Beim Bremsen wird diese Bewegungsenergie in den Bremsscheiben zu Wärme. Bei doppelter Geschwindigkeit ist es viermal so viel." },
    { name: "Ein Schokoriegel", wert: 1.05e6, zusatz: "50 g, 250 kcal", gruppe: "Alltag",
      text: "Genug für rund 150-mal Usain Bolts Bewegungsenergie, wenn deine Muskeln ohne Verluste arbeiten würden. Tatsächlich wird nur etwa ein Viertel zu Bewegung, der Rest zu Wärme." },
    { name: "Eine Kilowattstunde", wert: 3.6e6, zusatz: "1 kWh", gruppe: "Technik",
      text: "Die Einheit auf der Stromrechnung: ein Gerät mit 1000 Watt eine Stunde lang. So viel wie dreieinhalb Schokoriegel." },
    { name: "Dein Energiebedarf an einem Tag", wert: 8.37e6, zusatz: "2000 kcal", gruppe: "Alltag",
      text: "Über den Tag verteilt arbeitet dein Körper also ungefähr wie eine 100-Watt-Glühbirne." },
    { name: "Ein Liter Benzin", wert: 3.2e7, zusatz: "verbrannt", gruppe: "Technik",
      text: "Fast viermal dein Tagesbedarf in einer Flasche. Diese enorme Energiedichte macht Benzin so schwer ersetzbar." },
    { name: "Ein Blitz", wert: 1e9, zusatz: "", gruppe: "Erde", rund: true, thema: "gewitter",
      text: "Klingt gewaltig, reicht aber nur für etwa 280 kWh. Das ist ungefähr ein Monat Strom für einen Haushalt. Der Blitz ist so zerstörerisch, weil er seine Energie in Millisekunden abgibt." },
    { name: "Ein Jahr Strom für einen Haushalt", wert: 1.26e10, zusatz: "3500 kWh", gruppe: "Technik",
      text: "Etwa so viel verbraucht ein Haushalt mit drei Personen in Deutschland im Jahr." },
    { name: "Die Raumstation ISS im Flug", wert: 1.23e13, zusatz: "420 t bei 7,66 km/s", gruppe: "Technik", thema: "kepler",
      text: "Ihre Bewegungsenergie. Raumkapseln brauchen einen Hitzeschild, weil genau diese Energie beim Abbremsen in der Atmosphäre zu Wärme wird." },
    { name: "Ein Kernkraftwerk an einem Tag", wert: 1.21e14, zusatz: "1,4 GW elektrisch", gruppe: "Technik",
      text: "Die elektrische Energie, die ein großer Kraftwerksblock in 24 Stunden liefert." },
    { name: "Ein Jahr Strom für Deutschland", wert: 1.8e18, zusatz: "rund 500 TWh", gruppe: "Technik",
      text: "Der gesamte Stromverbrauch des Landes in einem Jahr." },
    { name: "Das Erdbeben vor Japan 2011", wert: 2e18, zusatz: "Magnitude 9", gruppe: "Erde", rund: true,
      text: "So viel Energie hat das Tōhoku-Beben als Erdbebenwellen abgestrahlt, geschätzt aus seiner Magnitude. Fast genau der Jahresstrom Deutschlands, freigesetzt in wenigen Minuten." },
    { name: "Der Energieverbrauch der Menschheit in einem Jahr", wert: 6.2e20, zusatz: "rund 620 EJ", gruppe: "Erde",
      text: "Alle Primärenergie zusammen: Öl, Kohle, Gas, Kernkraft und erneuerbare Energien." },
    { name: "Sonnenlicht auf der Erde in einer Stunde", wert: 6.25e20, zusatz: "1361 W/m² auf die Erdscheibe", gruppe: "Erde",
      text: "In einer einzigen Stunde trifft so viel Sonnenenergie auf die Erde, wie die Menschheit in einem ganzen Jahr verbraucht." },
    { name: "Der Asteroid, der die Dinosaurier auslöschte", wert: 4e23, zusatz: "vor 66 Millionen Jahren", gruppe: "Erde", rund: true,
      text: "Die Schätzungen für den Einschlag von Chicxulub schwanken stark. Ein oft genannter Wert entspricht dem Energieverbrauch der Menschheit von rund 600 Jahren." },
    { name: "Ein Riesen-Flare auf der Sonne", wert: 1e25, zusatz: "wie 1859", gruppe: "Weltall", rund: true,
      text: "Die größten Ausbrüche auf der Sonne setzen so viel in wenigen Minuten frei. Beim Carrington-Ereignis 1859 sprühten Telegrafenleitungen Funken, und Polarlichter waren bis in die Karibik zu sehen." },
    { name: "Die Sonne in einer Sekunde", wert: 3.83e26, zusatz: "Leuchtkraft × 1 s", gruppe: "Weltall", thema: "sternentwicklung",
      text: "Dafür verwandelt sie in jeder Sekunde gut vier Millionen Tonnen Masse in Energie, durch Kernfusion in ihrem Kern." },
    { name: "Die Drehung der Erde", wert: 2.14e29, zusatz: "Rotationsenergie", gruppe: "Erde", thema: "drehbewegung",
      text: "Die Gezeiten bremsen die Erde ganz langsam ab: Ein Tag wird pro Jahrhundert knapp zwei Millisekunden länger." },
    { name: "Die Erde auf ihrer Bahn", wert: 2.65e33, zusatz: "29,8 km/s um die Sonne", gruppe: "Weltall", thema: "kepler",
      text: "Die Bewegungsenergie unseres ganzen Planeten. Sie ist über zehntausendmal größer als die seiner Drehung." },
    { name: "Eine Supernova", wert: 1e44, zusatz: "Bewegungsenergie der Hülle", gruppe: "Weltall", rund: true, thema: "sternleichen",
      text: "Wenn der Kern eines schweren Sterns kollabiert, fliegt die Hülle mit dieser Energie davon. Noch rund hundertmal mehr tragen die Neutrinos fort." },
    { name: "Die Sonne in ihrem ganzen Leben", wert: 1.21e44, zusatz: "10 Milliarden Jahre", gruppe: "Weltall", thema: "sternentwicklung",
      text: "Alles, was die Sonne auf der Hauptreihe abstrahlt, grob mit ihrer heutigen Leuchtkraft gerechnet. Eine Supernova setzt fast ebenso viel in Sekunden frei." },
    { name: "Die Masse der Sonne", wert: 1.79e47, zusatz: "E = mc²", gruppe: "Weltall",
      text: "Die ganze Sonne in Energie umgerechnet. In ihrem Leben setzt sie davon weniger als ein Promille wirklich um." },
    { name: "Zwei Schwarze Löcher verschmelzen", wert: 5.4e47, zusatz: "3 Sonnenmassen, 2015", gruppe: "Weltall", thema: "sternleichen",
      text: "Beim Ereignis GW150914 wurden in Sekundenbruchteilen drei Sonnenmassen als Gravitationswellen abgestrahlt. Es war die erste direkte Messung von Gravitationswellen überhaupt." }
  ];

  var MIN_EXP = -24, MAX_EXP = 48;

  var EINHEITEN = [
    ["J", 1], ["kJ", 1e3], ["MJ", 1e6], ["GJ", 1e9],
    ["Wh", 3600], ["kWh", 3.6e6], ["MWh", 3.6e9], ["TWh", 3.6e15],
    ["kcal", 4184], ["eV", 1.602176634e-19], ["keV", 1.602176634e-16],
    ["MeV", 1.602176634e-13], ["GeV", 1.602176634e-10], ["TeV", 1.602176634e-7]
  ];

  /* ----- Zahlen ----- */
  var HOCH = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
  function hoch(n) { return String(n).split("").map(function (c) { return HOCH[c] || c; }).join(""); }
  function komma(x, stellen) {
    return x.toFixed(stellen).replace(".", ",");
  }
  function zerlege(w) {
    var e = Math.floor(Math.log10(w) + 1e-9);
    var m = w / Math.pow(10, e);
    if (Math.round(m * 10) / 10 >= 10) { m /= 10; e += 1; }
    return { m: m, e: e };
  }
  /* „1,6 · 10⁻²⁴ J“; zwischen 0,01 und 9999 J als gewöhnliche Zahl */
  function joule(w) {
    if (w >= 0.01 && w < 1e4) {
      var s = w >= 100 ? String(Math.round(w)) : komma(w, w >= 10 ? 0 : (w >= 1 ? 1 : 2));
      if (w >= 1000) s = String(Math.round(w / 100) * 100);
      return s + " J";
    }
    var z = zerlege(w);
    var mt = komma(z.m, 1).replace(/,0$/, "");
    return (mt === "1" ? "" : mt + " · ") + "10" + hoch(z.e) + " J";
  }
  /* Faktor als Wort: 3,4 · 270 · 34 Millionen · eine Milliarde · 10²⁵ */
  var WOERTER = [[1e21, "Trilliarden", "eine Trilliarde"], [1e18, "Trillionen", "eine Trillion"],
                 [1e15, "Billiarden", "eine Billiarde"], [1e12, "Billionen", "eine Billion"],
                 [1e9, "Milliarden", "eine Milliarde"], [1e6, "Millionen", "eine Million"],
                 [1e3, "Tausend", "tausend"]];
  function ohneNull(t) { return t.replace(/,0$/, ""); }
  function malText(f) {
    if (f < 10) return ohneNull(komma(f, 1));
    if (f < 100) return String(Math.round(f));
    if (f < 1e6) {   /* zwei gültige Stellen, Tausender mit schmalem Abstand */
      var stufe = Math.pow(10, Math.floor(Math.log10(f)) - 1);
      return String(Math.round(f / stufe) * stufe).replace(/\B(?=(\d{3})+$)/g, " ");
    }
    for (var i = 0; i < WOERTER.length; i++) {
      if (f >= WOERTER[i][0]) {
        var m = f / WOERTER[i][0];
        if (m >= 1000) break;
        var t = m < 10 ? ohneNull(komma(m, 1)) : String(Math.round(m));
        return t === "1" ? WOERTER[i][2] : t + " " + WOERTER[i][1];
      }
    }
    return "10" + hoch(Math.round(Math.log10(f)));
  }
  function faktorText(f) {
    return f < 1.15 ? "fast gleich viel" : "× " + malText(f);
  }
  function lage(w) { return (Math.log10(w) - MIN_EXP) / (MAX_EXP - MIN_EXP) * 100; }

  function wenigBewegung() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function baue() {
    var S = window.Seite, el = S.el;
    var liste = ENERGIEN.slice().sort(function (a, b) { return a.wert - b.wert; });

    /* ----- Übersicht (klebt oben) ----- */
    var achse = document.getElementById("el-achse");
    var spur = el("div", "el-spur");
    for (var e = MIN_EXP; e <= MAX_EXP; e += 6) {
      var t = el("span", "el-marke" + (e % 12 === 0 ? "" : " el-marke-klein"));
      t.style.left = lage(Math.pow(10, e)) + "%";
      t.append(el("span", "el-marke-text", "10" + hoch(e)));
      spur.append(t);
    }
    var punkte = [];
    liste.forEach(function (x, i) {
      var p = el("button", "el-punkt");
      p.type = "button";
      p.style.left = lage(x.wert) + "%";
      p.setAttribute("aria-label", x.name + ": " + joule(x.wert));
      p.title = x.name;
      p.addEventListener("click", function () { springe(i); });
      spur.append(p);
      punkte.push(p);
    });
    var eigen = el("span", "el-eigen");
    eigen.hidden = true;
    spur.append(eigen);
    var jetzt = el("p", "el-jetzt");
    achse.append(spur, jetzt);

    /* ----- Die Leiter -----
       Jede Sprosse ist eine Klappkarte: zu sieht man Gruppe, Name und
       Wert, ein Klick öffnet die Erklärung (weiches Aufklappen über
       grid-template-rows in werkzeuge.css). Zwischen zwei Sprossen sitzt
       der Faktor als Abzeichen mittig auf der Leiter. */
    var leiter = document.getElementById("el-leiter");
    var sprossen = [], karten = [];
    var PFEIL = '<svg class="el-pfeil" viewBox="0 0 20 20" aria-hidden="true" focusable="false">' +
                '<path d="M5 7.5l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    function klappe(i, auf) {
      var k = karten[i];
      if (auf === undefined) auf = k.knopf.getAttribute("aria-expanded") !== "true";
      k.knopf.setAttribute("aria-expanded", auf ? "true" : "false");
      k.karte.classList.toggle("offen", auf);
    }

    liste.forEach(function (x, i) {
      if (i > 0) {
        var f = x.wert / liste[i - 1].wert;
        var sprung = el("div", "el-sprung");
        sprung.append(el("span", "el-faktor", faktorText(f)));
        if (f > 1e5) sprung.classList.add("weit");
        leiter.append(sprung);
      }
      var z = zerlege(x.wert);
      var sp = el("article", "el-sprosse");
      sp.id = "sprosse-" + (i + 1);
      sp.setAttribute("data-gruppe", x.gruppe);
      var exp = el("div", "el-exp");
      exp.append("10", el("sup", null, String(z.e).replace("-", "−")));

      var karte = el("div", "el-karte");
      var kopf = el("h3", "el-kopf");
      var knopf = el("button", "el-knopf");
      knopf.type = "button";
      knopf.id = "el-knopf-" + (i + 1);
      knopf.setAttribute("aria-expanded", "false");
      knopf.setAttribute("aria-controls", "el-inhalt-" + (i + 1));
      var links = el("span", "el-titel");
      links.append(el("span", "el-gruppe", x.gruppe), el("span", "el-name", x.name));
      var rechts = el("span", "el-wert");
      rechts.append(el("strong", null, (x.rund ? "rund " : "") + joule(x.wert)));
      if (x.zusatz) rechts.append(el("span", "el-zusatz", x.zusatz));
      knopf.append(links, rechts);
      knopf.insertAdjacentHTML("beforeend", PFEIL);
      knopf.addEventListener("click", function () { klappe(i); });
      kopf.append(knopf);

      var inhalt = el("div", "el-inhalt");
      inhalt.id = "el-inhalt-" + (i + 1);
      inhalt.setAttribute("role", "region");
      inhalt.setAttribute("aria-labelledby", knopf.id);
      var innen = el("div", "el-innen");
      innen.append(el("p", "el-text", x.text));
      if (x.thema) {
        var f2 = S.findeThema(x.thema);
        if (f2 && f2.thema.status === "online") {
          var a = el("a", "el-link", "Mehr dazu: " + f2.thema.titel + " →");
          a.href = S.ROOT + f2.thema.datei;
          innen.append(a);
        }
      }
      inhalt.append(innen);
      karte.append(kopf, inhalt);

      sp.append(exp, el("div", "el-holm"), karte);
      leiter.append(sp);
      sprossen.push(sp);
      karten.push({ karte: karte, knopf: knopf });
    });

    /* Sprung aus der Übersicht oder dem Umrechner: hinscrollen und aufklappen */
    function springe(i) {
      klappe(i, true);
      var r = sprossen[i].getBoundingClientRect();
      var oben = window.scrollY + r.top - (achse.getBoundingClientRect().bottom + 16);
      window.scrollTo({ top: Math.max(0, oben), behavior: wenigBewegung() ? "auto" : "smooth" });
    }

    /* aktive Sprosse beim Scrollen: die oberste unterhalb der Übersicht */
    var aktiv = -1;
    function aktualisiere() {
      var grenze = achse.getBoundingClientRect().bottom + 40;
      var neu = 0;
      for (var i = 0; i < sprossen.length; i++) {
        if (sprossen[i].getBoundingClientRect().top <= grenze + 80) neu = i;
      }
      var amEnde = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
      if (amEnde) neu = sprossen.length - 1;
      if (neu === aktiv) return;
      if (aktiv >= 0) { punkte[aktiv].classList.remove("aktiv"); sprossen[aktiv].classList.remove("aktiv"); }
      aktiv = neu;
      punkte[aktiv].classList.add("aktiv");
      sprossen[aktiv].classList.add("aktiv");
      jetzt.textContent = liste[aktiv].name + ": " + (liste[aktiv].rund ? "rund " : "") + joule(liste[aktiv].wert);
    }
    window.addEventListener("scroll", aktualisiere, { passive: true });
    window.addEventListener("resize", aktualisiere);
    aktualisiere();

    /* ----- Umrechner ----- */
    var eingabe = document.getElementById("el-zahl");
    var einheit = document.getElementById("el-einheit");
    var ausgabe = document.getElementById("el-ergebnis");
    EINHEITEN.forEach(function (u) {
      var o = el("option", null, u[0]);
      o.value = String(u[1]);
      einheit.append(o);
    });
    einheit.value = String(3.6e6);

    function lies(text) {
      var s = text.replace(/\s/g, "").replace(/,/g, ".").replace(/[·×x*]/g, "*");
      var m = s.match(/^([0-9]*\.?[0-9]+)?(?:\*?10\^?([−-]?\d+)|e([−-]?\d+))?$/i);
      if (!m || (!m[1] && !m[2])) return NaN;
      var basis = m[1] ? parseFloat(m[1]) : 1;
      var ex = m[2] || m[3];
      return basis * (ex ? Math.pow(10, parseInt(ex.replace("−", "-"), 10)) : 1);
    }

    function rechne() {
      var w = lies(eingabe.value) * parseFloat(einheit.value);
      ausgabe.textContent = "";
      if (!isFinite(w) || w <= 0) {
        eigen.hidden = true;
        ausgabe.append(el("p", "el-hinweis", "Gib eine positive Zahl ein, zum Beispiel 2,5 oder 3e8 oder 10^20."));
        return;
      }
      var kopf = el("p", "el-ergebnis-wert");
      kopf.append("= ", el("strong", null, joule(w)));
      ausgabe.append(kopf);
      if (Math.log10(w) < MIN_EXP || Math.log10(w) > MAX_EXP) {
        eigen.hidden = true;
        ausgabe.append(el("p", "el-hinweis", "Das liegt außerhalb der Leiter (10⁻²⁴ bis 10⁴⁸ J)."));
        return;
      }
      eigen.hidden = false;
      eigen.style.left = lage(w) + "%";
      /* die drei nächsten Sprossen (logarithmisch) */
      var nah = liste.map(function (x, i) { return { x: x, i: i, d: Math.abs(Math.log10(x.wert / w)) }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, 3);
      var ul = el("ul", "el-vergleich");
      nah.forEach(function (n) {
        var r = w / n.x.wert;
        var li = el("li");
        /* mitten im Satz: „eine Kilowattstunde“ statt „Eine …“ */
        var mitte = n.x.name.replace(/^(Ein|Eine|Einen|Dein|Die|Der|Das|Zwei)\b/, function (w) { return w.toLowerCase(); });
        var b = el("button", "el-zu", r >= 0.9 ? mitte : n.x.name);
        b.type = "button";
        b.addEventListener("click", function () { springe(n.i); });
        if (r >= 0.9 && r <= 1.1) li.append("etwa so viel wie ", b);
        else if (r > 1) li.append(malText(r) + "-mal so viel wie ", b);
        else li.append(b, ": " + malText(1 / r) + "-mal so viel");
        ul.append(li);
      });
      ausgabe.append(ul);
    }
    eingabe.addEventListener("input", rechne);
    einheit.addEventListener("change", rechne);
    rechne();
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (document.getElementById("el-leiter") && window.Seite) baue();
  });
})();
