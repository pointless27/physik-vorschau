/* =========================================================================
   INTERAKTIVES UNIVERSUM – Schwarzes Loch: Hineinfallen und
   Spaghettifizierung (gehört zu js/universum/schwarzes-loch.js)
   =========================================================================
   window.LochFall:
     MASSEN               die drei wählbaren Schwarzen Löcher
     R_START, R_ENDE      Fall von 400 r_s bis knapp vor den Horizont
     tabelle(masseInSonnen) → { zustand(r), rs, ts, r1, r2 }
     Koerper(behaelter)   3D-Astronaut in einem eigenen kleinen Canvas
     zeit(s), zahlHtml(x) Formatierung

   Physik (Einheiten r_s = c = 1, nachgerechnet in Python, Schritt 62):
   - Freier Fall aus der Ruhe im Unendlichen: dr/dτ = −√(1/r) (exakt in
     Schwarzschild, τ = Eigenzeit). Eigenzeit ab Start:
     τ = 2/3 (r₀^1,5 − r^1,5). Koordinatenzeit (Uhr weit weg):
     t(r) = −2/3 r^1,5 − 2√r + ln((√r + 1)/(√r − 1)) + konst.
     Geschwindigkeit gegenüber ruhenden Beobachtern: β = √(1/r).
   - Gezeiten im mitfallenden System (exakt für radialen Fall in
     Schwarzschild): längs k = 1/r³ (Dehnung), quer −1/(2r³)
     (Stauchung), in physikalischen Einheiten k = c²/(r_s² r³).
   - Körper: m = 75 kg, h = 1,8 m. Zug in der Mitte eines Stabs:
     T = m k h / 8. Reißen bei T ≈ 10 kN (Schätzung, etwa 1 t Gewicht)
     → Stufe 1. Die Teile (Kopf, Rumpf, Glieder) sind etwa halb so groß;
     der Zug wächst mit der Größe hoch 4, also reißen sie bei 16-fachem k
     → Stufe 2 (Spaghetti).
   - Nach dem Reißen fliegen die Teile frei (Geodätenabweichung):
     ξ'' = diag(−1/(2r³), 1/r³, −1/(2r³)) ξ. Weil die Gleichung linear
     ist, gilt ξ(τ) = A(τ) ξ₀ + B(τ) v₀ mit zwei Lösungen je Richtung.
   ========================================================================= */
(function () {
  "use strict";
  var THREE = window.THREE, U = window.Universum3D;
  if (!THREE || !U) return;

  var G = 6.674e-11, C = 2.998e8, M_SONNE = 1.989e30, ERDE_G = 9.81;
  var MASSE_MENSCH = 75, GROESSE = 1.8, REISSKRAFT = 1.0e4;   // PRÜFEN: Reißkraft nur grob geschätzt
  var K1 = 8 * REISSKRAFT / (MASSE_MENSCH * GROESSE);        // 593 1/s²
  var R_START = 400, R_ENDE = 1.02, N = 2000;

  var MASSEN = [
    { id: "stellar", name: "10 Sonnenmassen", kurz: "10 M☉", M: 10 },
    { id: "sgr", name: "Sagittarius A*", kurz: "Sgr A*", M: 4.3e6 },
    { id: "m87", name: "M87*", kurz: "M87*", M: 6.5e9 }
  ];

  function tFern(r) { var s = Math.sqrt(r); return -2 / 3 * r * s - 2 * s + Math.log((s + 1) / (s - 1)); }

  /* Lineare Gleichung x'' = k(r) x längs (kr = 1/r³) und quer
     (kq = −1/(2r³)) von r_a nach r_b, Startwerte y = [xl, vl, xq, vq] */
  function integriere(y, ra, rb) {
    var T = 2 / 3 * (Math.pow(ra, 1.5) - Math.pow(rb, 1.5)), n = 24, h = T / n, q = Math.pow(ra, 1.5);
    function f(t, z) {
      var r = Math.pow(q - 1.5 * t, 2 / 3), k = 1 / (r * r * r);
      return [z[1], k * z[0], z[3], -0.5 * k * z[2]];
    }
    function plus(a, b, s) { return [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2], a[3] + s * b[3]]; }
    for (var i = 0, t = 0; i < n; i++, t += h) {
      var k1 = f(t, y), k2 = f(t + h / 2, plus(y, k1, h / 2)), k3 = f(t + h / 2, plus(y, k2, h / 2)), k4 = f(t + h, plus(y, k3, h));
      y = [0, 1, 2, 3].map(function (j) { return y[j] + h / 6 * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]); });
    }
    return y;
  }

  function tabelle(masse) {
    var rs = 2 * G * masse * M_SONNE / (C * C), ts = rs / C;
    var r1 = Math.pow(K1 * ts * ts, -1 / 3), r2 = Math.pow(16 * K1 * ts * ts, -1 / 3);
    var lnA = Math.log(R_START), lnB = Math.log(R_ENDE);
    var rr = new Float64Array(N), s1 = [], s2a = [], s2b = [];
    for (var i = 0; i < N; i++) rr[i] = Math.exp(lnA + (lnB - lnA) * i / (N - 1));
    function stufe(rStart, start, ziel) {
      var y = start.slice(), rAlt = rStart;
      for (var j = 0; j < N; j++) {
        if (rr[j] > rStart) { ziel.push(start.slice()); continue; }
        y = integriere(y, rAlt, rr[j]); rAlt = rr[j];
        ziel.push(y.slice());
      }
    }
    stufe(r1, [1, 0, 1, 0], s1);
    stufe(r2, [1, 0, 1, 0], s2a);
    stufe(r2, [0, 1, 0, 1], s2b);
    /* Stufe-1-Werte genau bei r2 (Startpunkt der Spaghetti) */
    var bei2 = r2 > R_ENDE && r2 < r1 ? integriere([1, 0, 1, 0], r1, r2) : [1, 0, 1, 0];
    function lies(feld, f) {
      var i0 = Math.floor(f), i1 = Math.min(N - 1, i0 + 1), w = f - i0;
      return feld[i0].map(function (v, j) { return v + (feld[i1][j] - v) * w; });
    }
    function zustand(r) {
      r = Math.max(R_ENDE, Math.min(R_START, r));
      var f = Math.max(0, Math.min(N - 1, (Math.log(r) - lnA) / (lnB - lnA) * (N - 1)));
      var k = 1 / (r * r * r) / (ts * ts);                 // 1/s²
      var st = r <= r2 ? 2 : r <= r1 ? 1 : 0;
      return {
        r: r, km: r * rs / 1000, beta: Math.sqrt(1 / r),
        tau: 2 / 3 * (Math.pow(R_START, 1.5) - Math.pow(r, 1.5)) * ts,
        fern: (tFern(r) - tFern(R_START)) * ts,
        deltaG: k * GROESSE / ERDE_G,
        zugKg: MASSE_MENSCH * k * GROESSE / 8 / ERDE_G,
        stufe: st,
        a1: lies(s1, f), a2: lies(s2a, f), b2: lies(s2b, f), bei2: bei2
      };
    }
    return {
      zustand: zustand, rs: rs, ts: ts, r1: r1, r2: r2,
      /* Eigenzeit vom Horizont bis zum Reißen (falls innen) */
      nachHorizont: r1 < 1 ? 2 / 3 * (1 - Math.pow(r1, 1.5)) * ts : 0
    };
  }

  /* ---------------------------------------------------------------------
     Formatierung
     --------------------------------------------------------------------- */
  function komma(x, stellen) { return x.toFixed(stellen).replace(".", ","); }
  function zahlHtml(x) {
    if (x === 0) return "0";
    var a = Math.abs(x);
    if (a >= 1e5 || a < 1e-3) {
      var e = Math.floor(Math.log10(a)), m = x / Math.pow(10, e);
      if (Math.abs(m) >= 9.95) { m /= 10; e++; }
      return komma(m, 1) + "&nbsp;·&nbsp;10<sup>" + String(e).replace("-", "−") + "</sup>";
    }
    var st = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
    var s = komma(x, st);
    if (a >= 1000) s = String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return s;
  }
  function zeit(s) {
    if (s < 1e-3) return zahlHtml(s * 1e6) + "&nbsp;µs";
    if (s < 1) return zahlHtml(s * 1e3) + "&nbsp;ms";
    if (s < 120) return zahlHtml(s) + "&nbsp;s";
    if (s < 7200) return zahlHtml(s / 60) + "&nbsp;min";
    if (s < 172800) return zahlHtml(s / 3600) + "&nbsp;h";
    if (s < 3.156e7 * 2) return zahlHtml(s / 86400) + "&nbsp;Tage";
    return zahlHtml(s / 3.156e7) + "&nbsp;Jahre";
  }

  /* ---------------------------------------------------------------------
     Astronaut: Teile in Metern, y = Körperachse (zeigt vom Loch weg),
     Ursprung ≈ Schwerpunkt. form: "kugel" r | "kapsel" r, l | "kiste" x,y,z
     --------------------------------------------------------------------- */
  var TEILE = [
    { form: "kugel", r: 0.155, p: [0, 0.67, 0], farbe: "anzug" },                   // Helm
    { form: "kugel", r: 0.125, p: [0, 0.68, 0.065], s: [1, 0.78, 0.7], farbe: "visier" },
    { form: "kapsel", r: 0.19, l: 0.34, p: [0, 0.24, 0], farbe: "anzug" },            // Rumpf
    { form: "kiste", x: 0.34, y: 0.46, z: 0.17, p: [0, 0.27, -0.24], farbe: "anzug-dunkel" },
    { form: "kapsel", r: 0.165, l: 0.06, p: [0, -0.08, 0], farbe: "anzug" },          // Becken
    { form: "kapsel", r: 0.07, l: 0.22, p: [-0.28, 0.33, 0], farbe: "anzug" },
    { form: "kapsel", r: 0.07, l: 0.22, p: [0.28, 0.33, 0], farbe: "anzug" },
    { form: "kapsel", r: 0.06, l: 0.22, p: [-0.31, 0.03, 0.02], farbe: "anzug" },
    { form: "kapsel", r: 0.06, l: 0.22, p: [0.31, 0.03, 0.02], farbe: "anzug" },
    { form: "kugel", r: 0.068, p: [-0.31, -0.16, 0.03], farbe: "anzug-dunkel" },
    { form: "kugel", r: 0.068, p: [0.31, -0.16, 0.03], farbe: "anzug-dunkel" },
    { form: "kapsel", r: 0.092, l: 0.3, p: [-0.11, -0.36, 0], farbe: "anzug" },
    { form: "kapsel", r: 0.092, l: 0.3, p: [0.11, -0.36, 0], farbe: "anzug" },
    { form: "kapsel", r: 0.076, l: 0.3, p: [-0.11, -0.72, 0], farbe: "anzug" },
    { form: "kapsel", r: 0.076, l: 0.3, p: [0.11, -0.72, 0], farbe: "anzug" },
    { form: "kiste", x: 0.13, y: 0.1, z: 0.26, p: [-0.11, -0.9, 0.04], farbe: "anzug-dunkel" },
    { form: "kiste", x: 0.13, y: 0.1, z: 0.26, p: [0.11, -0.9, 0.04], farbe: "anzug-dunkel" }
  ];

  function Koerper(behaelter) {
    var canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    behaelter.appendChild(canvas);
    this.canvas = canvas;
    try {
      this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    } catch (e) { this.renderer = null; return; }
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.szene = new THREE.Scene();
    this.kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100);
    var warm = new THREE.DirectionalLight(U.farbe("kupfer"), 2.6);   // Glühen der Scheibe von unten
    warm.position.set(0.4, -1, 0.6);
    var kalt = new THREE.DirectionalLight(U.farbe("blau"), 1.1);
    kalt.position.set(-0.6, 0.7, 0.8);
    this.szene.add(warm, kalt, new THREE.AmbientLight(0xffffff, 0.35));

    var gruppe = new THREE.Group(), self = this, zufall = U.zufall(77), punkte = [], farben = [];
    this.teile = TEILE.map(function (t) {
      var geo;
      if (t.form === "kugel") geo = new THREE.SphereGeometry(t.r, 24, 16);
      else if (t.form === "kapsel") geo = new THREE.CapsuleGeometry(t.r, t.l, 6, 16);
      else geo = new THREE.BoxGeometry(t.x, t.y, t.z);
      var farbe = U.farbe(t.farbe);
      var mat = new THREE.MeshStandardMaterial({ color: farbe, roughness: t.farbe === "visier" ? 0.15 : 0.7, metalness: t.farbe === "visier" ? 0.6 : 0.05 });
      var m = new THREE.Mesh(geo, mat);
      if (t.s) m.scale.set(t.s[0], t.s[1], t.s[2]);
      m.position.set(t.p[0], t.p[1], t.p[2]);
      gruppe.add(m);
      /* Punkte für die Spaghetti-Stufe: gleichmäßig im Teil verteilt */
      geo.computeBoundingBox();
      var bb = geo.boundingBox, gr = new THREE.Vector3(), n;
      bb.getSize(gr);
      if (t.s) gr.multiply(new THREE.Vector3(t.s[0], t.s[1], t.s[2]));
      n = Math.max(30, Math.round(gr.x * gr.y * gr.z * 9000));
      var start = punkte.length;
      for (var i = 0; i < n; i++) {
        var o;
        do { o = [zufall() - 0.5, zufall() - 0.5, zufall() - 0.5]; } while (t.form !== "kiste" && o[0] * o[0] + o[1] * o[1] + o[2] * o[2] > 0.25);
        punkte.push({ teil: m, o: [o[0] * gr.x, o[1] * gr.y, o[2] * gr.z] });
        farben.push(farbe.r, farbe.g, farbe.b);
      }
      return { mesh: m, p0: t.p.slice(), von: start, bis: punkte.length };
    });
    this.szene.add(gruppe);
    this.gruppe = gruppe;
    var pos = new Float32Array(punkte.length * 3);
    var pgeo = new THREE.BufferGeometry();
    pgeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    pgeo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(farben), 3));
    this.wolke = new THREE.Points(pgeo, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true }));
    this.wolke.visible = false;
    this.wolke.frustumCulled = false;
    this.szene.add(this.wolke);
    this.punkte = punkte;
    this.breite = 0; this.hoehe = 0;
  }

  /* z = LochFall-Zustand, drehung = Blickwinkel um die Körperachse (rad).
     Rückgabe: Länge des Maßstabsbalkens in m und in CSS-Pixeln */
  Koerper.prototype.zeige = function (z, drehung) {
    if (!this.renderer) return null;
    var w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (w < 2 || h < 2) return null;
    if (w !== this.breite || h !== this.hoehe) { this.breite = w; this.hoehe = h; this.renderer.setSize(w, h, false); }
    var a1 = z.a1, ymin = 0, ymax = 0, xmax = 0.4, i, t;
    if (z.stufe < 2) {
      this.gruppe.visible = true; this.wolke.visible = false;
      /* vor dem Reißen: leichte Andeutung der Last (übertrieben, echte
         Dehnung wäre unsichtbar klein) */
      var last = z.stufe === 0 ? Math.min(1, z.zugKg * ERDE_G / REISSKRAFT) : 0;
      for (i = 0; i < this.teile.length; i++) {
        t = this.teile[i];
        var y = t.p0[1] * (z.stufe === 1 ? a1[0] : 1 + 0.06 * last);
        var x = t.p0[0] * (z.stufe === 1 ? a1[2] : 1 - 0.02 * last), zz = t.p0[2] * (z.stufe === 1 ? a1[2] : 1);
        t.mesh.position.set(x, y, zz);
        ymin = Math.min(ymin, y - 0.2); ymax = Math.max(ymax, y + 0.2); xmax = Math.max(xmax, Math.abs(x) + 0.2);
      }
    } else {
      this.gruppe.visible = false; this.wolke.visible = true;
      var b = z.bei2, a2 = z.a2, b2 = z.b2, attr = this.wolke.geometry.attributes.position, arr = attr.array;
      for (i = 0; i < this.teile.length; i++) {
        t = this.teile[i];
        /* Teil-Mittelpunkt und -Geschwindigkeit im Moment des 2. Reißens */
        var c0 = [t.p0[0] * b[2], t.p0[1] * b[0], t.p0[2] * b[2]], v0 = [t.p0[0] * b[3], t.p0[1] * b[1], t.p0[2] * b[3]];
        for (var j = t.von; j < t.bis; j++) {
          var o = this.punkte[j].o;
          var px = (c0[0] + o[0]) * a2[2] + v0[0] * b2[2];
          var py = (c0[1] + o[1]) * a2[0] + v0[1] * b2[0];
          var pz = (c0[2] + o[2]) * a2[2] + v0[2] * b2[2];
          arr[j * 3] = px; arr[j * 3 + 1] = py; arr[j * 3 + 2] = pz;
          if (py < ymin) ymin = py; if (py > ymax) ymax = py;
          if (Math.abs(px) > xmax) xmax = Math.abs(px);
        }
      }
      attr.needsUpdate = true;
    }
    /* Kamera: ganzer Körper im Bild, von der Seite, langsam drehend */
    var halbH = Math.max(1.05, (ymax - ymin) / 2 * 1.12), mitte = (ymax + ymin) / 2, asp = w / h;
    halbH = Math.max(halbH, xmax * 1.15 / asp);
    var k = this.kamera;
    k.left = -halbH * asp; k.right = halbH * asp; k.top = mitte + halbH; k.bottom = mitte - halbH;
    k.position.set(Math.sin(drehung) * 10, mitte + 1.2, Math.cos(drehung) * 10);
    k.lookAt(0, mitte, 0);
    k.updateProjectionMatrix();
    this.renderer.render(this.szene, k);
    /* Maßstab: 1, 2 oder 5 · 10^n m, höchstens 40 % der Höhe */
    var ziel = halbH * 2 * 0.4, e = Math.pow(10, Math.floor(Math.log10(ziel))), m = e;
    if (5 * e <= ziel) m = 5 * e; else if (2 * e <= ziel) m = 2 * e;
    return { meter: m, px: m / (halbH * 2) * h };
  };

  window.LochFall = {
    MASSEN: MASSEN, R_START: R_START, R_ENDE: R_ENDE, ERDE_G: ERDE_G,
    tabelle: tabelle, Koerper: Koerper, zeit: zeit, zahlHtml: zahlHtml
  };
})();
