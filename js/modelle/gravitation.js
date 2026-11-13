/* =========================================================================
   INTERAKTIVE GRAFIKEN DER SEITE themen/mechanik/gravitation.html
   =========================================================================
   Modelle: kanone.
   Einbinden im <head> der Seite, NACH js/interaktiv.js:
     <script src="../../js/interaktiv.js"></script>
     <script src="../../js/modelle/gravitation.js"></script>
   Bausteine (zeichenflaeche, regler, knopf …) kommen aus js/interaktiv.js
   über das Objekt Interaktiv (hier kurz I); Liste in _doku/modelle.md.
   ========================================================================= */

(function (I) {
  "use strict";

  var G = I.G, s = I.s, zahl = I.zahl, begrenze = I.begrenze,
      schoenerSchritt = I.schoenerSchritt, txt = I.txt, txtIndex = I.txtIndex,
      pfeil = I.pfeil, linienzug = I.linienzug,
      zeichenflaeche = I.zeichenflaeche, regler = I.regler, knopf = I.knopf,
      werteLeiste = I.werteLeiste, abspieler = I.abspieler,
      geruest = I.geruest;

  /* =======================================================================
     MODELL: NEWTONS KANONENBERG                                (gravitation)
     Kugel waagerecht vom Gipfel eines 420 km hohen Bergs (r0 = R + 420 km)
     abgeschossen; nur die Gravitation der Erde wirkt (keine Luft, keine
     Erddrehung). Bahn = Kegelschnitt
       r(φ) = r0·q / (1 + (q − 1)·cos φ),   q = v²·r0 / (G·M)
     (φ = seit dem Abschuss überstrichener Winkel; q = 1 Kreis, q < 1 Abschuss
     im Apogäum, 1 < q < 2 im Perigäum, q ≥ 2 ungebunden).
     Zeit über die Kepler-Gleichung: Ellipse M = E − e·sin E,
     Hyperbel M = e·sinh H − H, mit M = n·t, n = √(GM/a³).
     ======================================================================= */
  function kanone(fig) {
    var GM = 3.986e14, R = 6.371e6, BERG = 420e3, R0 = R + BERG;   // SI-Einheiten
    var R_SICHT = 4 * R;          // Bahnteile weiter draußen bestimmen den Bildausschnitt nicht
    var V_KREIS = Math.sqrt(GM / R0) / 1000, V_FLUCHT = Math.sqrt(2 * GM / R0) / 1000;  // km/s
    var z = { v: 6, f: 0 };       // v in km/s, f = Anteil der Flugzeit
    var spuren = [];
    var teil = geruest(fig);
    var flaeche = zeichenflaeche(teil.buehne, null,
      "Erde mit sehr hohem Berg, von dem eine Kanonenkugel waagerecht abgeschossen wird; je nach Tempo schlägt sie auf, umkreist die Erde oder entkommt",
      function (b) { return begrenze(b * 0.62, 300, 460); }, zeichne);

    function bahnFuer(vkm) {
      var v = vkm * 1000, q = v * v * R0 / GM;
      if (Math.abs(q - 2) < 1e-6) q = 2 - 1e-6;       // exakt parabolisch: mit Schrittweite 0,1 nie erreicht
      var e = Math.abs(q - 1), s0 = q >= 1 ? 1 : -1;  // s0: Perigäum oben (beim Berg) oder unten
      var b = { v: vkm, q: q, e: e, p: R0 * q };
      b.r = function (phi) { return b.p / (1 + (q - 1) * Math.cos(phi)); };
      if (q < 2) {                                      // Ellipse
        b.a = R0 / (2 - q);                             // Vis-viva: 1/a = 2/r0 − v²/GM
        b.n = Math.sqrt(GM / Math.pow(b.a, 3));
        b.M0 = q >= 1 ? 0 : Math.PI;                    // Abschuss im Perigäum bzw. Apogäum
        b.T = 2 * Math.PI / b.n;
        b.rPeri = b.a * (1 - e);
        b.rApo = b.a * (1 + e);
        if (b.rPeri < R) {                              // nur bei q < 1 möglich: trifft die Erde
          var Eauf = 2 * Math.PI - Math.acos((1 - R / b.a) / e);
          b.ende = (Eauf - e * Math.sin(Eauf) - Math.PI) / b.n;
          b.phiEnde = Math.acos((b.p / R - 1) / (q - 1));
          b.art = "aufschlag";
        } else {
          b.ende = b.T;
          b.phiEnde = 2 * Math.PI;
          b.art = e < 0.015 ? "kreis" : "ellipse";
        }
      } else {                                          // Hyperbel: endet, wenn sie das Bild verlassen hat
        b.a = R0 / (q - 2);
        b.n = Math.sqrt(GM / Math.pow(b.a, 3));
        b.M0 = 0;
        var rGrenze = 1.3 * R_SICHT;
        var Hgr = Math.log((rGrenze / b.a + 1) / e + Math.sqrt(Math.pow((rGrenze / b.a + 1) / e, 2) - 1));
        b.ende = (e * Math.sinh(Hgr) - Hgr) / b.n;
        b.phiEnde = Math.acos((b.p / rGrenze - 1) / (q - 1));
        b.art = "flucht";
      }
      /* Ort und Geschwindigkeit zur Zeit t (s nach dem Abschuss);
         x nach rechts, y nach oben, Erdmitte im Ursprung, Einheiten m bzw. m/s */
      b.zustand = function (t) {
        var M = b.M0 + b.n * t, xp, yp, vxp, vyp, fak, i, d;
        if (q < 2) {
          var k = Math.floor(M / (2 * Math.PI)), Mr = M - 2 * Math.PI * k;
          var E = e > 0.8 ? Math.PI : Mr;
          for (i = 0; i < 60; i++) {
            d = (E - e * Math.sin(E) - Mr) / (1 - e * Math.cos(E));
            E -= d;
            if (Math.abs(d) < 1e-12) break;
          }
          var wb = Math.sqrt(1 - e * e);
          xp = b.a * (Math.cos(E) - e); yp = b.a * wb * Math.sin(E);
          fak = b.n / (1 - e * Math.cos(E));
          vxp = -b.a * Math.sin(E) * fak; vyp = b.a * wb * Math.cos(E) * fak;
        } else {
          var H = Math.log(2 * M / e + 1.8), wh = Math.sqrt(e * e - 1);
          for (i = 0; i < 60; i++) {
            d = (e * Math.sinh(H) - H - M) / (e * Math.cosh(H) - 1);
            H -= d;
            if (Math.abs(d) < 1e-12) break;
          }
          xp = b.a * (e - Math.cosh(H)); yp = b.a * wh * Math.sinh(H);
          fak = b.n / (e * Math.cosh(H) - 1);
          vxp = -b.a * Math.sinh(H) * fak; vyp = b.a * wh * Math.cosh(H) * fak;
        }
        /* Perifokal → Bild: Perigäumsrichtung (0, s0), Bewegungsrichtung dort (s0, 0) */
        return { x: s0 * yp, y: s0 * xp, vx: s0 * vyp, vy: s0 * vxp };
      };
      return b;
    }

    function bahn() { return bahnFuer(z.v); }

    /* Punkte der Bahn vom Abschuss bis zum Winkel bis (polar, 360 pro Umlauf) */
    function bahnPunkte(b, bis) {
      var pkt = [], n = Math.max(2, Math.ceil(bis / (2 * Math.PI) * 360));
      for (var i = 0; i <= n; i++) {
        var phi = bis * i / n, r = b.r(phi);
        pkt.push([r * Math.sin(phi), r * Math.cos(phi)]);
      }
      return pkt;
    }

    function zeitText(sek, dativ) {
      if (sek < 90) return zahl(sek, 0) + " s";
      if (sek < 100 * 60) return zahl(sek / 60, 0) + " min";
      if (sek < 48 * 3600) {
        var hh = Math.floor(sek / 3600), mm = Math.round((sek - hh * 3600) / 60);
        if (mm === 60) { hh++; mm = 0; }
        return hh + " h " + mm + " min";
      }
      return zahl(sek / 86400, 0) + (dativ ? " Tagen" : " Tage");
    }
    function km(meter) {
      var stufe = meter >= 1e8 ? 1e6 : 1000;          // ab 100 000 km auf Tausender runden
      return String(Math.round(meter / stufe) * stufe / 1000).replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " km";
    }

    function zeichneBuehne() {
      var f = flaeche, B = f.b, H = f.h, b = bahn();
      f.leeren();

      /* Bildausschnitt: Erde, Berg und die aktuelle Bahn (soweit innerhalb
         R_SICHT); frühere, größere Bahnen dürfen aus dem Bild laufen */
      var box = [-R, R, -R, R0];
      function erweitere(pkt) {
        pkt.forEach(function (p) {
          if (p[0] * p[0] + p[1] * p[1] > R_SICHT * R_SICHT) return;
          box[0] = Math.min(box[0], p[0]); box[1] = Math.max(box[1], p[0]);
          box[2] = Math.min(box[2], p[1]); box[3] = Math.max(box[3], p[1]);
        });
      }
      var alle = bahnPunkte(b, b.phiEnde);
      erweitere(alle);
      var spurBahnen = spuren.map(function (v) { var sb = bahnFuer(v); return { b: sb, pkt: bahnPunkte(sb, sb.phiEnde) }; });
      var rand = 16;
      var S = Math.min((B - 2 * rand) / (box[1] - box[0]), (H - 2 * rand) / (box[3] - box[2]));
      var cx = B / 2 - S * (box[0] + box[1]) / 2, cy = H / 2 + S * (box[2] + box[3]) / 2;
      var X = function (x) { return cx + x * S; };
      var Y = function (y) { return cy - y * S; };
      function bild(pkt) { return pkt.map(function (p) { return [X(p[0]), Y(p[1])]; }); }

      /* Erde und Berg (maßstabsgetreu) */
      s("circle", { "class": "flaeche", cx: X(0), cy: Y(0), r: R * S }, f.svg);
      s("circle", { "class": "kurve blau duenn", cx: X(0), cy: Y(0), r: R * S }, f.svg);
      if (R * S > 40) txt(f.svg, X(0), Y(0) + 4, "Erde", "klein", "middle");
      var halb = 1.4 * BERG / R;                        // halbe Fußbreite des Bergs als Winkel
      s("polygon", {
        "class": "turm",
        points: linienzug(bild([[-0.995 * R * Math.sin(halb), 0.995 * R * Math.cos(halb)], [0, R0],
                                [0.995 * R * Math.sin(halb), 0.995 * R * Math.cos(halb)]]))
      }, f.svg);
      s("rect", { "class": "rad", x: X(0) - 9, y: Y(R0) - 3, width: 11, height: 4.5, rx: 1 }, f.svg);
      txt(f.svg, X(0) - 14, Y(R0) - 6, "Berg, 420 km hoch", "klein halo", "end");

      /* Maßstab unten links */
      var stueck = schoenerSchritt(B * 0.22 / S, 1);
      s("line", { "class": "achse", x1: rand, y1: H - rand, x2: rand + stueck * S, y2: H - rand }, f.svg);
      s("line", { "class": "achse", x1: rand, y1: H - rand - 4, x2: rand, y2: H - rand + 2 }, f.svg);
      s("line", { "class": "achse", x1: rand + stueck * S, y1: H - rand - 4, x2: rand + stueck * S, y2: H - rand + 2 }, f.svg);
      txt(f.svg, rand, H - rand - 7, km(stueck), "klein");

      /* frühere Schüsse als blasse Spuren, Beschriftung außen am Aufschlag
         bzw. rechts an der Umlaufbahn; zu nahe Beschriftungen nach unten
         schieben (Platz des Berg-Schilds ist von Anfang an belegt) */
      var belegt = [[X(0) - 60, Y(R0) - 6]];
      spurBahnen.forEach(function (sp) {
        s("polyline", { "class": "spur", points: linienzug(bild(sp.pkt)) }, f.svg);
        if (sp.b.art === "flucht") return;
        var phi = sp.b.art === "aufschlag" ? sp.b.phiEnde : Math.PI / 2, r = sp.b.r(phi);
        var ux = Math.sin(phi), uy = Math.cos(phi);
        var lx = X(r * ux) + ux * 12, ly = Y(r * uy) - uy * 12 + 4;
        var anker = Math.abs(ux) < 0.1 ? "middle" : ux > 0 ? "start" : "end";
        if (anker === "start" && lx > B - 62) { lx -= 24; anker = "end"; }      // kein Platz außen: nach innen
        if (lx < 0 || lx > B || ly < 12 || ly > H - 4) return;
        if (Math.abs(lx - X(0)) < 50 && Math.abs(ly - Y(R0)) < 22) return;     // direkt am Berg: kein Platz
        for (var n = 0; n < 6 && belegt.some(function (p) {
          return Math.abs(p[0] - lx) < 56 && Math.abs(p[1] - ly) < 13;
        }); n++) ly += 13;
        belegt.push([lx, ly]);
        txt(f.svg, lx, ly, zahl(sp.b.v, 1) + " km/s", "klein halo", anker);
      });

      /* aktuelle Bahn: gestrichelt vorhergesagt, durchgezogen geflogen */
      var t = z.f * b.ende, zu = b.zustand(t);
      var phiJetzt = Math.atan2(zu.x, zu.y);
      if (phiJetzt < 0) phiJetzt += 2 * Math.PI;
      if (z.f >= 1 || phiJetzt > b.phiEnde) phiJetzt = b.phiEnde;
      s("polyline", { "class": "hilfslinie", points: linienzug(bild(alle)) }, f.svg);
      if (z.f > 0) s("polyline", { "class": "kurve blau", points: linienzug(bild(bahnPunkte(b, phiJetzt))) }, f.svg);

      /* Kugel mit Geschwindigkeit (blau, Länge ∝ Tempo) und Schwerkraft
         (kupfer, zur Erdmitte, Länge ∝ 1/r²) */
      var bx = X(zu.x), by = Y(zu.y), r = Math.sqrt(zu.x * zu.x + zu.y * zu.y);
      var vb = Math.sqrt(zu.vx * zu.vx + zu.vy * zu.vy), kv = 5.5 / 1000;      // 5,5 px pro km/s
      var gl = 34 * Math.pow(R0 / r, 2);
      if (pfeil(f.svg, bx, by, bx - zu.x / r * gl, by + zu.y / r * gl, "kupfer")) {
        txtIndex(f.svg, bx - zu.x / r * gl + 6, by + zu.y / r * gl + 4, "F", "G", "kupfer");
      }
      if (pfeil(f.svg, bx, by, bx + zu.vx * kv, by - zu.vy * kv, "blau")) {
        txt(f.svg, bx + zu.vx * kv + (zu.vx >= 0 ? 6 : -6), by - zu.vy * kv - 5, "v", "blau",
            zu.vx >= 0 ? "start" : "end");
      }
      s("circle", { "class": "ball", cx: bx, cy: by, r: 5.5 }, f.svg);
    }

    regler(teil.regler, {
      name: "Abschussgeschwindigkeit v", min: 1, max: 12, schritt: 0.1, wert: z.v,
      anzeige: function (w) { return zahl(w, 1) + " km/s"; }
    }, function (w) { spieler.stopp(); z.v = w; z.f = 0; rZeit.setze(0); zeichne(); });
    var rZeit = regler(teil.regler, {
      name: "Zeitpunkt im Flug", min: 0, max: 1, schritt: 0.002, wert: z.f,
      anzeige: function (w) { return "t = " + zeitText(w * bahn().ende); }
    }, function (w) { spieler.stopp(); z.f = w; zeichne(); });

    /* Abspieltempo: kurze Flüge etwa in Echtzeit ×250, lange in rund 7 s */
    var ablauf = {
      knopf: knopf(teil.knoepfe, "", "haupt", function () {}), text: "▶ Abfeuern", faktor: 250, vonVorn: true,
      hole: function () { return z.f * bahn().ende; },
      setze: function (t) { z.f = t / bahn().ende; rZeit.setze(z.f); zeichne(); },
      ende: function () { return bahn().ende; },
      amEnde: function () {
        if (spuren[spuren.length - 1] !== z.v) {
          spuren.push(z.v);
          if (spuren.length > 5) spuren.shift();
        }
        zeichne();
      }
    };
    var spieler = abspieler(ablauf);
    knopf(teil.knoepfe, "Spuren löschen", null, function () { spuren = []; zeichne(); });

    var werte = werteLeiste(teil.bedienung, [
      ["bahn", "Bahn"], ["zeit", "Flugzeit"], ["hoehe", "Größte Höhe"], ["jetzt", "Tempo jetzt"],
      ["grenzen", "Kreisbahn / Flucht"]
    ]);

    function zeichne() {
      var b = bahn(), zu = b.zustand(z.f * b.ende);
      var r = Math.sqrt(zu.x * zu.x + zu.y * zu.y);
      ablauf.faktor = Math.max(250, b.ende / 7);
      rZeit.auffrischen();
      zeichneBuehne();
      var vJetzt = Math.sqrt(GM * (2 / r - (2 - b.q) / R0)) / 1000;           // Vis-viva
      werte.bahn.textContent = { aufschlag: "Aufschlag", kreis: "Kreis", ellipse: "Ellipse", flucht: "Hyperbel" }[b.art];
      werte.zeit.textContent = b.art === "flucht" ? "kommt nie zurück"
        : zeitText(b.ende) + (b.art === "aufschlag" ? "" : " pro Umlauf");
      werte.hoehe.textContent = b.art === "flucht" ? "unbegrenzt"
        : b.q < 1 ? km(BERG) + " (Gipfel)" : km(b.rApo - R);
      werte.jetzt.textContent = zahl(vJetzt, 2) + " km/s";
      werte.grenzen.textContent = zahl(V_KREIS, 2) + " / " + zahl(V_FLUCHT, 2) + " km/s";

      var satz;
      if (b.art === "aufschlag") {
        satz = "Die Kugel fällt und schlägt nach " + zeitText(b.ende) + " " + km(R * b.phiEnde) +
          " vom Berg entfernt auf. " + (z.v < 7
            ? "Schneller geschossen fliegt sie weiter, denn der Boden krümmt sich unter ihr weg."
            : "Knapp! Etwas schneller, und der Boden krümmt sich schneller weg, als die Kugel fällt.");
      } else if (b.art === "kreis") {
        satz = "Kreisbahn: Die Kugel fällt ununterbrochen, aber der Boden krümmt sich genauso schnell unter ihr weg. " +
          "Nach " + zeitText(b.T) + " ist sie wieder am Berg – genau wie die Raumstation ISS, die in dieser Höhe kreist.";
      } else if (b.art === "ellipse" && b.q < 1) {
        satz = "Gerade noch vorbei: Auf der anderen Seite kommt die Kugel der Erde bis auf " + km(b.rPeri - R) +
          " nahe und ist nach " + zeitText(b.T) + " wieder am Berg.";
      } else if (b.art === "ellipse") {
        satz = "Eine Ellipse: Auf der anderen Seite der Erde steigt die Kugel bis auf " + km(b.rApo - R) +
          " Höhe" + (b.rApo > R_SICHT ? " (weit außerhalb des Bildes)" : "") + " und ist nach " +
          zeitText(b.T, true) + " wieder am Berg. Weit draußen ist sie langsam, nahe der Erde schnell.";
      } else {
        satz = "Schneller als die Fluchtgeschwindigkeit von " + zahl(V_FLUCHT, 2) + " km/s: Die Kugel kommt nie mehr " +
          "zurück. Die Erde bremst sie zwar, aber ihre Anziehung wird mit wachsendem Abstand so schnell schwächer, dass das Tempo nie ganz aufgebraucht wird.";
      }
      teil.status.textContent = satz;
    }
    zeichne();
  }

  I.modell("kanone", kanone);
})(window.Interaktiv);
