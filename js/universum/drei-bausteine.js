/* =========================================================================
   INTERAKTIVES UNIVERSUM – gemeinsame 3D-Bausteine (three.js)
   =========================================================================
   Wird von allen 3D-Modellen unter js/universum/ genutzt. Braucht
   extern/three/three.min.js (three.js r159, MIT, globale Variable THREE –
   die letzte Fassung ohne ES-Module, darum läuft sie unter file://).

   Schnittstelle window.Universum3D:
     farbe(name)          THREE.Color aus der CSS-Variable --uni-<name>
                          (css/teile/variablen.css) – Farben NUR dort ändern
     zufall(saat)         reproduzierbarer Zufall 0…1
     gauss(r)             normalverteilt (Mittel 0, Streuung 1)
     rauschen(saat)       3D-Rauschen 0…1 in JS: f(x, y, z)
     GLSL_RAUSCHEN        dasselbe als GLSL-Text: rausch(p), fbm(p)
     punkteWolke(n, opt)  Partikel (Sterne, Elektronenwolke, Galaxien …)
     glanzMaterial(opt)   leuchtende Hülle (Fresnel), z. B. Zellmembran
     blickMaterial(opt)   Leuchtfleck auf einer Fläche, die zur Kamera zeigt
     Beschriftungen       HTML-Schilder, die 3D-Punkten folgen
     band(z, a, b, c, d)  0 → 1 zwischen a und b, 1 → 0 zwischen c und d
     wenigBewegung        true bei prefers-reduced-motion
   ========================================================================= */
(function () {
  "use strict";
  var THREE = window.THREE;
  if (!THREE) return;

  /* Keine Farbraum-Umrechnung: Farben wirken genau wie im CSS angegeben */
  if (THREE.ColorManagement) THREE.ColorManagement.enabled = false;

  var wenigBewegung = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------------------------------------------------------------------
     Farben aus CSS-Variablen
     --------------------------------------------------------------------- */
  var farbSpeicher = {};
  function farbe(name) {
    if (!farbSpeicher[name]) {
      var wert = getComputedStyle(document.documentElement)
        .getPropertyValue("--uni-" + name).trim();
      farbSpeicher[name] = new THREE.Color(wert || "#ffffff");
    }
    return farbSpeicher[name].clone();
  }

  /* ---------------------------------------------------------------------
     Zufall und Rauschen (reproduzierbar, damit jede Galaxie bei jedem
     Laden gleich aussieht)
     --------------------------------------------------------------------- */
  function zufall(saat) {
    var a = (saat * 2654435761) >>> 0;
    return function () {
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      var t = a ^ (a >>> 15);
      t = Math.imul(t, 2246822519) >>> 0;
      t ^= t >>> 13;
      return (t >>> 0) / 4294967296;
    };
  }
  function gauss(r) {
    var u = 1 - r(), v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* Wertrauschen auf einem Gitter, weich interpoliert */
  function rauschen(saat) {
    var r = zufall(saat), werte = new Float32Array(4096), i;
    for (i = 0; i < 4096; i++) werte[i] = r();
    function w(x, y, z) {
      var h = (Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791)) >>> 0;
      return werte[h & 4095];
    }
    function glatt(t) { return t * t * (3 - 2 * t); }
    return function (x, y, z) {
      var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
      var fx = glatt(x - xi), fy = glatt(y - yi), fz = glatt(z - zi);
      function lx(yy, zz) { return w(xi, yy, zz) + (w(xi + 1, yy, zz) - w(xi, yy, zz)) * fx; }
      var a = lx(yi, zi) + (lx(yi + 1, zi) - lx(yi, zi)) * fy;
      var b = lx(yi, zi + 1) + (lx(yi + 1, zi + 1) - lx(yi, zi + 1)) * fy;
      return a + (b - a) * fz;
    };
  }

  var GLSL_RAUSCHEN = [
    "float u_hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }",
    "float rausch(vec3 x) {",
    "  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(mix(u_hash(i), u_hash(i + vec3(1,0,0)), f.x),",
    "                 mix(u_hash(i + vec3(0,1,0)), u_hash(i + vec3(1,1,0)), f.x), f.y),",
    "             mix(mix(u_hash(i + vec3(0,0,1)), u_hash(i + vec3(1,0,1)), f.x),",
    "                 mix(u_hash(i + vec3(0,1,1)), u_hash(i + vec3(1,1,1)), f.x), f.y), f.z);",
    "}",
    "float fbm(vec3 p) {",
    "  float s = 0.0, a = 0.5;",
    "  for (int k = 0; k < 5; k++) { s += a * rausch(p); p = p * 2.03 + vec3(1.7, 9.2, 3.1); a *= 0.5; }",
    "  return s / 0.97;",
    "}"
  ].join("\n");

  /* ---------------------------------------------------------------------
     Punktwolken: jede Partikel hat Farbe, Größe (in Einheiten des
     Objekts) und eine Phase fürs Funkeln. Zu kleine Punkte werden nicht
     kleiner als uMin Pixel, sondern blasser – so bleiben ferne Galaxien
     sichtbar, ohne zu flimmern.
     opt.fest = true: Größe in Bildschirmpixeln (Hintergrundsterne, Marken)
     --------------------------------------------------------------------- */
  var PUNKT_VS = [
    "uniform float uSkala; uniform float uPix; uniform float uMin; uniform float uMax;",
    "uniform float uAlpha; uniform float uZeit; uniform float uFunkeln; uniform float uDpr;",
    "attribute float aGroesse; attribute vec3 aFarbe; attribute float aPhase;",
    "varying vec3 vFarbe; varying float vA;",
    "void main() {",
    "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
    "  gl_Position = projectionMatrix * mv;",
    "  float a = 1.0;",
    "#ifdef FEST",
    "  float s = aGroesse * uDpr;",
    "#else",
    "  float s = aGroesse * uSkala * uPix / max(-mv.z, 1e-4);",
    "  if (s < uMin) { a = s / uMin; s = uMin; }",
    "  if (s > uMax) { a *= uMax / s; s = uMax; }",
    "#endif",
    "  float f = 1.0 - uFunkeln * (0.5 + 0.5 * sin(uZeit * (2.0 + 3.0 * fract(aPhase * 7.3)) + aPhase * 6.2832));",
    "  vA = a * f * uAlpha;",
    "  vFarbe = aFarbe;",
    "  gl_PointSize = s;",
    "}"
  ].join("\n");
  var PUNKT_FS = [
    "varying vec3 vFarbe; varying float vA;",
    "void main() {",
    "  vec2 d = gl_PointCoord - 0.5;",
    "  float r2 = dot(d, d) * 4.0;",
    "  if (r2 > 1.0) discard;",
    "  float g = exp(-r2 * 3.5) * (1.0 - r2);",
    "  gl_FragColor = vec4(vFarbe, g * vA);",
    "}"
  ].join("\n");

  function punkteWolke(n, opt) {
    opt = opt || {};
    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(n * 3), farb = new Float32Array(n * 3);
    var groesse = new Float32Array(n), phase = new Float32Array(n);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aFarbe", new THREE.BufferAttribute(farb, 3));
    geo.setAttribute("aGroesse", new THREE.BufferAttribute(groesse, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uSkala: { value: 1 }, uPix: { value: 800 }, uMin: { value: 1.2 },
        uMax: { value: opt.max || 60 }, uAlpha: { value: 1 }, uZeit: { value: 0 },
        uFunkeln: { value: opt.funkeln || 0 }, uDpr: { value: 1 }
      },
      vertexShader: PUNKT_VS, fragmentShader: PUNKT_FS,
      defines: opt.fest ? { FEST: "" } : {},
      transparent: true, depthWrite: false,
      blending: opt.normal ? THREE.NormalBlending : THREE.AdditiveBlending
    });
    var punkte = new THREE.Points(geo, mat);
    punkte.frustumCulled = false;
    var anzahl = 0;
    /* setze(x, y, z, farbe, groesse[, phase]) – hängt einen Punkt an */
    punkte.userData.setze = function (x, y, z, c, g, ph) {
      if (anzahl >= n) return;
      var i = anzahl++;
      pos[3 * i] = x; pos[3 * i + 1] = y; pos[3 * i + 2] = z;
      farb[3 * i] = c.r; farb[3 * i + 1] = c.g; farb[3 * i + 2] = c.b;
      groesse[i] = g; phase[i] = ph === undefined ? Math.random() : ph;
    };
    punkte.userData.fertig = function () { geo.setDrawRange(0, anzahl); };
    punkte.userData.punktWolke = true;
    return punkte;
  }

  /* ---------------------------------------------------------------------
     Leuchtende Hülle (Fresnel): Rand hell, Mitte durchsichtig, mit
     wogendem Rauschen. Für Membranen, Atmosphären, Felder, Hologramme.
     --------------------------------------------------------------------- */
  function glanzMaterial(opt) {
    opt = opt || {};
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uFarbe: { value: opt.farbe || new THREE.Color(1, 1, 1) },
        uFarbe2: { value: opt.farbe2 || opt.farbe || new THREE.Color(1, 1, 1) },
        uAlpha: { value: 1 }, uRand: { value: opt.rand === undefined ? 1.0 : opt.rand },
        uKern: { value: opt.kern || 0.08 }, uPotenz: { value: opt.potenz || 2.2 },
        uRausch: { value: opt.rausch || 2.0 }, uZeit: { value: 0 },
        uWabern: { value: opt.wabern || 0 }, uStreifen: { value: opt.streifen || 0 }
      },
      vertexShader: [
        GLSL_RAUSCHEN,
        "uniform float uZeit; uniform float uWabern;",
        "varying vec3 vN; varying vec3 vV; varying vec3 vP;",
        "void main() {",
        "  vec3 p = position;",
        "  if (uWabern > 0.0) p += normal * uWabern * (rausch(normal * 2.5 + uZeit * 0.25) - 0.5);",
        "  vP = position;",
        "#ifdef USE_INSTANCING",
        "  vec4 lp = instanceMatrix * vec4(p, 1.0);",
        "  vec3 nn = mat3(instanceMatrix) * normal;",
        "  vP += instanceMatrix[3].xyz * 0.37;",
        "#else",
        "  vec4 lp = vec4(p, 1.0);",
        "  vec3 nn = normal;",
        "#endif",
        "  vec4 mv = modelViewMatrix * lp;",
        "  vN = normalize(normalMatrix * nn);",
        "  vV = normalize(-mv.xyz);",
        "  gl_Position = projectionMatrix * mv;",
        "}"
      ].join("\n"),
      fragmentShader: [
        GLSL_RAUSCHEN,
        "uniform vec3 uFarbe; uniform vec3 uFarbe2; uniform float uAlpha; uniform float uRand;",
        "uniform float uKern; uniform float uPotenz; uniform float uRausch; uniform float uZeit;",
        "uniform float uStreifen;",
        "varying vec3 vN; varying vec3 vV; varying vec3 vP;",
        "void main() {",
        "  float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), uPotenz);",
        "  float n = fbm(vP * uRausch + vec3(0.0, uZeit * 0.12, 0.0));",
        "  vec3 c = mix(uFarbe, uFarbe2, smoothstep(0.35, 0.7, n));",
        "  float a = (uKern + f * uRand) * (0.65 + 0.7 * n);",
        "  if (uStreifen > 0.0) a *= 0.75 + 0.25 * sin(vP.y * uStreifen - uZeit * 3.0);",
        "  gl_FragColor = vec4(c, clamp(a, 0.0, 1.0) * uAlpha);",
        "}"
      ].join("\n"),
      transparent: true, depthWrite: false,
      side: opt.seite || THREE.FrontSide,
      blending: opt.normal ? THREE.NormalBlending : THREE.AdditiveBlending
    });
    return mat;
  }

  /* ---------------------------------------------------------------------
     Leuchtfleck auf einem Quadrat (Korona, Galaxienkern, Halo).
     Das Quadrat dreht der Aufrufer zur Kamera (quaternion kopieren).
     --------------------------------------------------------------------- */
  function blickMaterial(opt) {
    opt = opt || {};
    return new THREE.ShaderMaterial({
      uniforms: {
        uFarbe: { value: opt.farbe || new THREE.Color(1, 1, 1) },
        uFarbe2: { value: opt.farbe2 || opt.farbe || new THREE.Color(1, 1, 1) },
        uAlpha: { value: 1 }, uPotenz: { value: opt.potenz || 2.5 },
        uStrahlen: { value: opt.strahlen || 0 }, uZeit: { value: 0 },
        uStaerke: { value: opt.staerke || 1 }
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() { vUv = uv * 2.0 - 1.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
      ].join("\n"),
      fragmentShader: [
        GLSL_RAUSCHEN,
        "uniform vec3 uFarbe; uniform vec3 uFarbe2; uniform float uAlpha; uniform float uPotenz;",
        "uniform float uStrahlen; uniform float uZeit; uniform float uStaerke;",
        "varying vec2 vUv;",
        "void main() {",
        "  float r = length(vUv);",
        "  if (r > 1.0) discard;",
        "  float g = pow(1.0 - r, uPotenz);",
        "  if (uStrahlen > 0.0) {",
        "    float w = atan(vUv.y, vUv.x);",
        "    float s = rausch(vec3(w * 3.0, r * 2.0 - uZeit * 0.15, uZeit * 0.05));",
        "    g *= 1.0 + uStrahlen * (s - 0.4) * (1.0 - r);",
        "  }",
        "  vec3 c = mix(uFarbe2, uFarbe, pow(1.0 - r, 2.0));",
        "  gl_FragColor = vec4(c, clamp(g * uStaerke, 0.0, 1.0) * uAlpha);",
        "}"
      ].join("\n"),
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending
    });
  }

  /* ---------------------------------------------------------------------
     HTML-Schilder, die einem Punkt im Raum folgen
     --------------------------------------------------------------------- */
  function Beschriftungen(behaelter) {
    this.behaelter = behaelter;
    this.liste = [];
    this.v = new THREE.Vector3();
  }
  /* neu(text, klasse) → Schild; schild.welt (Vector3) setzt der Aufrufer
     jedes Bild neu, schild.alpha (0…1) ebenso */
  Beschriftungen.prototype.neu = function (text, klasse) {
    var el = document.createElement("div");
    el.className = "uni-schild" + (klasse ? " " + klasse : "");
    var punkt = document.createElement("span");
    punkt.className = "uni-schild-punkt";
    var t = document.createElement("span");
    t.className = "uni-schild-text";
    t.textContent = text;
    el.append(punkt, t);
    el.setAttribute("aria-hidden", "true");
    this.behaelter.appendChild(el);
    var schild = { el: el, welt: new THREE.Vector3(), alpha: 0, sichtbar: false,
      immerLinks: /\blinks\b/.test(klasse || ""), links: /\blinks\b/.test(klasse || ""),
      mitte: /\bmass\b/.test(klasse || "") };
    this.liste.push(schild);
    return schild;
  };
  Beschriftungen.prototype.aktualisiere = function (kamera, breite, hoehe) {
    for (var i = 0; i < this.liste.length; i++) {
      var s = this.liste[i];
      var zeigen = s.alpha > 0.02;
      if (zeigen) {
        this.v.copy(s.welt).project(kamera);
        if (this.v.z > 1 || this.v.z < -1 || Math.abs(this.v.x) > 1.05 || Math.abs(this.v.y) > 1.05) zeigen = false;
      }
      if (zeigen) {
        var x = (this.v.x * 0.5 + 0.5) * breite, y = (-this.v.y * 0.5 + 0.5) * hoehe;
        /* nah am rechten Rand: Text links vom Punkt, damit er nicht hinausläuft */
        var links = s.immerLinks || (!s.mitte && x > breite - 200);
        if (links !== s.links) { s.el.classList.toggle("links", links); s.links = links; }
        s.el.style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px)";
        s.el.style.opacity = Math.min(1, s.alpha).toFixed(3);
        if (!s.sichtbar) { s.el.style.visibility = "visible"; s.sichtbar = true; }
      } else if (s.sichtbar) {
        s.el.style.visibility = "hidden"; s.sichtbar = false;
      }
    }
  };

  /* ---------------------------------------------------------------------
     Kleinkram
     --------------------------------------------------------------------- */
  function glatt(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }
  function band(z, a, b, c, d) {
    return glatt(a, b, z) * (1 - glatt(c, d, z));
  }

  window.Universum3D = {
    farbe: farbe, zufall: zufall, gauss: gauss, rauschen: rauschen,
    GLSL_RAUSCHEN: GLSL_RAUSCHEN, punkteWolke: punkteWolke,
    glanzMaterial: glanzMaterial, blickMaterial: blickMaterial,
    Beschriftungen: Beschriftungen, glatt: glatt, band: band,
    wenigBewegung: wenigBewegung
  };
})();
