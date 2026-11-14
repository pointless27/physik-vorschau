/* =========================================================================
   INTERAKTIVES UNIVERSUM – Modell „Schwarzes Loch & Gravitationslinse“
   =========================================================================
   Seite: themen/universum/schwarzes-loch.html, Doku: _doku/universum.md.

   Das Bild entsteht durch Raytracing in der Schwarzschild-Raumzeit: Für
   jeden Bildpunkt verfolgt ein Fragment-Shader einen Lichtstrahl rückwärts
   von der Kamera aus. Einheiten: Schwarzschild-Radius r_s = c = 1.

   Physik (in der Seite erklärt, in Python nachgeprüft):
   - Lichtbahn: In Schwarzschild-Koordinaten (r, φ) als flache Polar-
     koordinaten gelesen gehorcht ein Lichtstrahl exakt der Gleichung
     d²x/dλ² = −1,5 · h² · x / r⁵ mit h = |x × dx/dλ| (erhalten). Sie
     ergibt die Bahngleichung u'' + u = 1,5 u² (u = 1/r). Integration mit
     Runge-Kutta 4, Schrittweite ∝ r. Einfang für b < 3√3/2 ≈ 2,598.
   - Kamera = ruhender Beobachter: Der lokale Blickwinkel α wird über
     tan β = tan α / √(1 − 1/r) in die Koordinatenrichtung umgerechnet;
     Stoßparameter b = r sin α / √(1 − 1/r).
   - Scheibe: dünn, in der Ebene y = 0, von der ISCO (r = 3) bis r = 15.
     Temperatur T ∝ r^(−3/4) (1 − √(3/r))^(1/4) (Shakura-Sunyaev mit
     Innenrand-Bedingung), Maximum bei r = 49/12. Frequenzfaktor
     g = 1 / (u^t (1 − Ω b_y)) · 1/√(1 − 1/r_Kamera) mit
     u^t = 1/√(1 − 1,5/r), Ω = √(0,5/r³) (Kepler). Beobachtet: T·g,
     Helligkeit ∝ (gT)⁴ (bolometrisch). Farbe = Planck-Spektrum, mit
     CIE-1931-Normspektralwerten (Fit von Wyman, Sloan & Shirley 2013)
     nach linearem sRGB umgerechnet – physikalisch, darum NICHT aus CSS.
   - Hintergrund: Milchstraße (einmal in eine Würfeltextur gerendert),
     Sterne prozedural mit Bildpunkt-Fußabdruck (fwidth), so dass
     Vergrößerung durch die Linse die Sterne heller und zu Bögen macht.

   - Helligkeit im sichtbaren Licht: Planck-Strahler bei 555 nm,
     I ∝ 1/(exp(25 924 K / T) − 1); beobachtet bei T·g (exakt für
     Schwarzkörper, weil I_ν/ν³ erhalten bleibt).
   - Ansicht „Hineinfallen“: Kamera fällt frei aus der Ruhe im Unendlichen,
     Geschwindigkeit gegenüber ruhenden Beobachtern β = √(1/r). Aberration
     und Doppler (Lorentz-Transformation) im Shader; Körper und
     Spaghettifizierung in js/universum/schwarzes-loch-fall.js.

   Darstellung: HDR-Zielbild (halbe Gleitkommazahlen) → Bloom (Dual-
   Filter) → ACES-Filmkurve. Die Auflösung passt sich der Bildrate an.
   Ohne Gleitkomma-Zielbilder: direkte Ausgabe ohne Bloom.
   ========================================================================= */
(function () {
  "use strict";
  var THREE = window.THREE, U = window.Universum3D;
  if (!THREE || !U) return;

  /* ---------------------------------------------------------------------
     Physikalische Größen (Einheiten: r_s = c = 1)
     --------------------------------------------------------------------- */
  var R_IN = 3, R_AUS = 15;
  var B_KRIT = 1.5 * Math.sqrt(3);           // 2,598: Rand des Schattens (Stoßparameter)
  var RS_KM_SONNE = 2.954;                   // r_s je Sonnenmasse in km (Sgr A*: 1,27 · 10⁷ km)
  var ZEITFAKTOR = 6;                        // r_s/c je Sekunde: Innenrand ≈ 7,7 s je Umlauf
  var R_MIN = 3.4, R_MAX = 120;
  var FOV = 52;                              // senkrechter Bildwinkel in Grad
  var TAN = Math.tan(FOV * Math.PI / 360);
  var TAN_FALL = Math.tan(35 * Math.PI / 180); // beim Hineinfallen 70°
  var F = window.LochFall;
  /* Fallrichtung: 22° über der Scheibe */
  var FALL_N = [Math.cos(0.384) * Math.sin(0.5), Math.sin(0.384), Math.cos(0.384) * Math.cos(0.5)];

  /* ---------------------------------------------------------------------
     Ansichten. r = Abstand (r_s), hoehe = Blick über der Scheibe (Grad),
     dreh = Drehung um die Achse (Grad, nur für den Hintergrund wichtig).
     --------------------------------------------------------------------- */
  var ANSICHTEN = [
    { id: "scheibe", titel: "Schwarzes Loch mit Scheibe", r: 28, hoehe: 8, dreh: 20,
      an: { scheibe: true, galaxie: false, hilfe: true },
      kurz: "Scheibe aus Gas von 3 bis 15 Schwarzschild-Radien",
      text: "Heißes Gas kreist in einer flachen Scheibe um das Schwarze Loch. Trotzdem siehst du die Rückseite der Scheibe als Bogen über dem Loch: Ihr Licht wird auf dem Weg zu dir über das Loch gebogen. Unter dem Loch taucht auf dieselbe Weise die Unterseite der Scheibe auf.",
      fakt: "Würde man die Sonne zu einem Schwarzen Loch zusammenpressen, wäre es nur 6 km breit." },
    { id: "schatten", titel: "Der Schatten", r: 22, hoehe: 12, dreh: 40,
      an: { scheibe: true, galaxie: false, hilfe: true },
      kurz: "Schatten 2,6-mal so groß wie der Horizont",
      text: "In der Mitte bleibt es schwarz. Dieser Schatten ist rund 2,6-mal so groß wie der Ereignishorizont, denn auch Licht, das knapp am Horizont vorbeifliegen würde, wird eingefangen. Sein Rand ist der Photonenring: Licht, das das Loch ein- oder mehrmals umrundet hat, bevor es zu dir entkommt.",
      fakt: "Auf einer Kugel mit 1,5 Schwarzschild-Radien kann Licht im Kreis um das Loch laufen." },
    { id: "doppler", titel: "Hell und dunkel", r: 27, hoehe: 18, dreh: 65,
      an: { scheibe: true, galaxie: false, hilfe: true },
      kurz: "Gas am Innenrand: halbe Lichtgeschwindigkeit",
      text: "Die Seite der Scheibe, die auf dich zukommt, leuchtet viel heller und bläulicher als die andere (Dopplereffekt). Dazu verliert alles Licht Energie, wenn es aus der Nähe des Lochs herausklettert. Schalte die Rot- und Blauverschiebung aus, dann leuchtet die Scheibe ringsum gleich.",
      fakt: "Echte Scheiben leuchten vor allem im Ultravioletten oder im Röntgenlicht." },
    { id: "oben", titel: "Von oben", r: 44, hoehe: 76, dreh: 100,
      an: { scheibe: true, galaxie: false, hilfe: false },
      kurz: "Blick fast senkrecht auf die Scheibe",
      text: "Von oben wird die Scheibe zu einem Ring um den Schatten. Ungefähr so blicken wir auf das Schwarze Loch in der Galaxie M87, das 2019 als erstes überhaupt fotografiert wurde. Auch von oben ist der Schatten größer als der Horizont, und eine Seite bleibt etwas heller.",
      fakt: "Der Schatten von M87* erscheint am Himmel so groß wie ein Tennisball auf dem Mond." },
    { id: "seite", titel: "Genau von der Seite", r: 27, hoehe: 1.2, dreh: 140,
      an: { scheibe: true, galaxie: false, hilfe: true },
      kurz: "Blick in der Ebene der Scheibe",
      text: "Von der Seite ist die Scheibe nur ein dünner Strich. Trotzdem umgibt den Schatten ein leuchtender Rahmen: Bilder der Ober- und der Unterseite, deren Licht um das Loch herumgelenkt wurde. Schalte die Lichtablenkung aus und vergleiche.",
      fakt: "Ohne Lichtablenkung wäre hier nur ein Strich vor einer kleinen schwarzen Kugel zu sehen." },
    { id: "linse", titel: "Gravitationslinse", r: 40, hoehe: 8, dreh: 20,
      an: { scheibe: false, galaxie: true, hilfe: true },
      kurz: "Eine Galaxie weit hinter dem Loch",
      text: "Weit hinter dem Schwarzen Loch steht eine Galaxie, fest an ihrem Platz. Liegt sie genau dahinter, kommt ihr Licht von allen Seiten um das Loch herum bei dir an, und du siehst sie als Ring: den Einstein-Ring. Dreh die Ansicht ein wenig oder verschiebe die Galaxie mit dem Regler, dann zerfällt der Ring in zwei Bilder.",
      fakt: "Ganze Galaxienhaufen wirken als Linsen und machen ferne Galaxien für Teleskope sichtbar." },
    { id: "nah", titel: "Ganz nah dran", r: 8, hoehe: 11, dreh: 200,
      an: { scheibe: true, galaxie: false, hilfe: false },
      kurz: "Abstand: 8 Schwarzschild-Radien",
      text: "Aus acht Schwarzschild-Radien Abstand füllt der Schatten einen großen Teil des Himmels, die Scheibe reicht bis zum Horizont. Sterne hinter dem Loch erscheinen mehrfach und verzerrt. Um hier stillzustehen, bräuchtest du ein Triebwerk mit gewaltigem Schub.",
      fakt: "Am Innenrand der Scheibe dauert ein Umlauf beim Schwarzen Loch der Milchstraße nur etwa 33 Minuten." },
    { id: "fallen", titel: "Hineinfallen", fall: true, r: 400, hoehe: 22, dreh: 29,
      an: { scheibe: true, galaxie: false, hilfe: false },
      kurz: "Freier Fall bis zum Horizont",
      text: "Jetzt fällst du selbst hinein. Vor dir wird alles heller und blauer, hinter dir röter, und der Schatten wächst. Die Tafel „Dein Körper“ zeigt, was die Gezeitenkräfte mit dir machen: Bei einem kleinen Schwarzen Loch reißen sie dich weit vor dem Horizont auseinander, bei einem großen spürst du am Horizont nichts.",
      fakt: "Für einen fernen Beobachter erreichst du den Horizont nie: Dein Bild wird immer langsamer und röter." }
  ];

  var KNOPF_NAME = { scheibe: "Mit Scheibe", schatten: "Schatten", doppler: "Hell und dunkel", oben: "Von oben",
    seite: "Von der Seite", linse: "Linse", nah: "Nah dran", fallen: "Hineinfallen" };

  /* ---------------------------------------------------------------------
     Planck-Farben: 256 Temperaturen von 1000 K bis 100 000 K
     (logarithmisch). rgb = Farbe mit größtem Anteil 1, a = Leuchtdichte Y
     derselben Farbe → im Shader rgb / a = Farbe mit Leuchtdichte 1.
     --------------------------------------------------------------------- */
  function planckTabelle() {
    function lappen(l, m, s1, s2) { var t = (l - m) / (l < m ? s1 : s2); return Math.exp(-0.5 * t * t); }
    var daten = new Uint8Array(256 * 4);
    for (var i = 0; i < 256; i++) {
      var T = Math.pow(10, 3 + 2 * i / 255), X = 0, Y = 0, Z = 0;
      for (var l = 380; l <= 780; l += 2) {
        var lm = l * 1e-9;
        var B = 1 / (Math.pow(lm, 5) * (Math.exp(0.014388 / (lm * T)) - 1));
        X += B * (1.056 * lappen(l, 599.8, 37.9, 31.0) + 0.362 * lappen(l, 442.0, 16.0, 26.7) - 0.065 * lappen(l, 501.1, 20.4, 26.2));
        Y += B * (0.821 * lappen(l, 568.8, 46.9, 40.5) + 0.286 * lappen(l, 530.9, 16.3, 31.1));
        Z += B * (1.217 * lappen(l, 437.0, 11.8, 36.0) + 0.681 * lappen(l, 459.0, 26.0, 13.8));
      }
      X /= Y; Z /= Y; Y = 1;
      var R = Math.max(0, 3.2406 * X - 1.5372 * Y - 0.4986 * Z);
      var G = Math.max(0, -0.9689 * X + 1.8758 * Y + 0.0415 * Z);
      var Bl = Math.max(0, 0.0557 * X - 0.2040 * Y + 1.0570 * Z);
      var m = Math.max(R, G, Bl), Yn = (0.2126 * R + 0.7152 * G + 0.0722 * Bl) / m;
      daten[i * 4] = Math.round(255 * R / m);
      daten[i * 4 + 1] = Math.round(255 * G / m);
      daten[i * 4 + 2] = Math.round(255 * Bl / m);
      daten[i * 4 + 3] = Math.max(1, Math.round(255 * Yn));
    }
    var tex = new THREE.DataTexture(daten, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }

  /* ---------------------------------------------------------------------
     GLSL-Bausteine
     --------------------------------------------------------------------- */
  var VOLLBILD_VS = "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

  var GLSL_GRAD = [
    "vec3 h33(vec3 p) {",
    "  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));",
    "  return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;",
    "}",
    "float gnoise(vec3 x) {",   // Gradientenrauschen, etwa −0,7 … 0,7
    "  vec3 i = floor(x), f = fract(x);",
    "  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);",
    "  return mix(mix(mix(dot(h33(i), f), dot(h33(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),",
    "                 mix(dot(h33(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(h33(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),",
    "             mix(mix(dot(h33(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(h33(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),",
    "                 mix(dot(h33(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(h33(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);",
    "}",
    "float gfbm(vec3 p, int n) {",
    "  float s = 0.0, a = 0.5;",
    "  for (int k = 0; k < 6; k++) { if (k >= n) break; s += a * gnoise(p); p = p * 2.03 + vec3(3.1, 1.7, 7.3); a *= 0.5; }",
    "  return s;",
    "}"
  ].join("\n");

  /* Milchstraße für die Würfeltextur (einmal beim Start gerendert) */
  var HIMMEL_VS = "varying vec3 vRicht; void main() { vRicht = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }";
  var HIMMEL_FS = [
    "uniform vec3 uN, uZ, uKern, uArm, uHii;",
    "varying vec3 vRicht;",
    U.GLSL_RAUSCHEN,
    GLSL_GRAD,
    "void main() {",
    "  vec3 d = normalize(vRicht);",
    "  float lat = asin(clamp(dot(d, uN), -1.0, 1.0));",
    "  float lon = atan(dot(d, cross(uN, uZ)), dot(d, uZ));",
    "  float dicke = 0.075 + 0.07 * exp(-lon * lon / 0.6);",
    "  float wellig = lat + 0.025 * gfbm(d * 3.0, 3);",
    "  float band = exp(-wellig * wellig / (dicke * dicke));",
    "  float bauch = exp(-(lon * lon / 0.16 + lat * lat / 0.02));",
    "  float n1 = fbm(d * 4.0), n2 = fbm(d * 13.0 + 7.0), n3 = fbm(d * 40.0 + 2.0);",
    "  float licht = band * (0.25 + 1.1 * n1 * n1 + 0.45 * n2 + 0.25 * n3) + 1.4 * bauch * (0.7 + 0.6 * n2);",
    /* Staubbänder: dunkle Fäden genau in der Mitte des Bandes */
    "  float staub = smoothstep(0.46, 0.7, fbm(d * 8.0 + 3.0)) * exp(-pow(wellig / (0.45 * dicke), 2.0));",
    "  staub = max(staub, smoothstep(0.55, 0.78, fbm(d * 21.0 + 1.0)) * band * 0.7);",
    "  licht *= 1.0 - 0.9 * staub;",
    "  vec3 farbe = mix(uArm, uKern, clamp(bauch * 1.6 + 0.35 * exp(-lon * lon / 1.5), 0.0, 1.0));",
    "  vec3 c = farbe * licht * 0.05;",
    "  float nebel = smoothstep(0.6, 0.82, fbm(d * 6.0 + 19.0)) * band * (1.0 - staub);",
    "  c += uHii * nebel * 0.02;",
    /* unaufgelöste schwache Sterne als feines Korn, im Band dichter */
    "  float korn = pow(rausch(d * 700.0), 14.0) + 0.6 * pow(rausch(d * 1500.0 + 3.0), 18.0);",
    "  c += vec3(0.9, 0.93, 1.0) * korn * (0.04 + 0.25 * band);",
    "  c += vec3(0.006, 0.007, 0.012) * (0.4 + band);",   // Grundhelligkeit des Nachthimmels
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n");

  /* Hauptshader: Raytracing */
  function raytraceFS(schritte, direkt) {
    return [
      "#define SCHRITTE " + schritte,
      direkt ? "#define DIREKT" : "",
      "uniform vec2 uAufl;",
      "uniform vec3 uKamPos, uKamR, uKamO, uKamV, uBeta;",
      "uniform float uGamma, uMessen;",
      "uniform float uPix, uTanH, uZeit, uScheibe, uLinse, uVerschiebung, uTemp, uGalaxie, uGenau, uHell, uBelichtung;",
      "uniform vec3 uGalRicht, uGalE1, uGalE2, uGalKern, uGalArm, uGalHii;",
      "uniform samplerCube uHimmel;",
      "uniform sampler2D uPlanck;",
      "varying vec2 vUv;",
      "const float R_IN = 3.0;",
      "const float R_AUS = 15.0;",
      "const float F_MAX = 0.2140249;",
      GLSL_GRAD,
      "float hash1(vec4 p) { return fract(sin(dot(p, vec4(12.9898, 78.233, 37.719, 4.581))) * 43758.5453); }",
      "vec4 hash4(vec4 p) {",
      "  return fract(sin(vec4(dot(p, vec4(127.1, 311.7, 74.7, 17.3)), dot(p, vec4(269.5, 183.3, 246.1, 51.9)),",
      "                        dot(p, vec4(113.5, 271.9, 124.6, 93.1)), dot(p, vec4(41.3, 157.2, 92.8, 211.7)))) * 43758.5453);",
      "}",
      /* Planck-Farbe mit Leuchtdichte 1 */
      "vec3 planck(float T) {",
      "  float u = clamp((log2(T) * 0.30103 - 3.0) * 0.5, 0.0, 1.0);",
      "  vec4 c = texture2D(uPlanck, vec2(u * (255.0 / 256.0) + 0.5 / 256.0, 0.5));",
      "  return c.rgb / max(c.a, 0.004);",
      "}",
      /* Helligkeit eines Planck-Strahlers im sichtbaren Licht (bei 555 nm,
         bis auf einen festen Faktor): hc/(λk) = 25 924 K */
      "float sicht(float T) { return 1.0 / (exp(min(25924.0 / max(T, 300.0), 80.0)) - 1.0); }",
      /* Muster der Scheibe: Fäden entlang der Bahn (radial feiner als längs) */
      /* Wolken, die die Kepler-Scherung zu nachlaufenden Spiralfäden zieht
         (Winkel um −1,4 · ln r gedreht); dazu große helle und dunkle Flecken */
      "float muster(float r, float pc, float k) {",
      "  float lr = log(r);",
      "  vec3 o = vec3(k * 5.3, k * 2.9, k * 7.1);",
      "  float ps = pc - 1.4 * lr;",
      "  vec2 cs = vec2(cos(ps), sin(ps));",
      "  vec2 cg = vec2(cos(pc), sin(pc));",
      "  float n0 = gfbm(vec3(cg * 1.1, lr * 2.4) + o.yzx, 2);",
      "  float n1 = gfbm(vec3(cs * 3.2, lr * 8.0) + o, 4);",
      "  float n2 = gfbm(vec3(cs * 11.0, lr * 26.0) + o.zxy, 3);",
      "  float rillen = sin(lr * 60.0 + 8.0 * n1 + 4.0 * n2);",
      "  return 0.9 * n0 + 1.15 * n1 + 0.5 * n2 + 0.05 * rillen;",
      "}",
      /* Dichte mit Kepler-Drehung; zwei versetzte Phasen überblenden, damit
         die differentielle Rotation das Muster nicht endlos aufwickelt */
      "float dichte(float r, float phi) {",
      "  float om = sqrt(0.5 / (r * r * r));",
      "  float P = 40.0;",
      "  float ph = uZeit / P;",
      "  float a = fract(ph), b = fract(ph + 0.5);",
      "  float wa = 1.0 - abs(2.0 * a - 1.0), wb = 1.0 - wa;",
      "  float ka = mod(floor(ph), 37.0), kb = mod(floor(ph + 0.5), 37.0) + 0.5;",
      "  float m = (muster(r, phi + om * a * P, ka) * wa + muster(r, phi + om * b * P, kb) * wb) / sqrt(wa * wa + wb * wb);",
      "  return clamp(0.85 + m, 0.04, 2.6);",
      "}",
      /* Scheibe an der Stelle q: rgb = Strahlung, a = Deckkraft */
      "vec4 scheibe(vec3 q, float r, vec3 rd, float by, float gKam) {",
      "  float phi = atan(q.z, q.x);",
      "  float dd = dichte(r, phi);",
      "  float f = pow(r, -0.75) * pow(max(1.0 - sqrt(R_IN / r), 0.0), 0.25);",
      "  float T = uTemp * (f / F_MAX) * (0.82 + 0.18 * dd);",
      "  float g = 1.0;",
      "  if (uVerschiebung > 0.5) {",
      "    float om = sqrt(0.5 / (r * r * r));",
      "    float ut = uLinse > 0.5 ? inversesqrt(max(1.0 - 1.5 / r, 1e-3)) : inversesqrt(max(1.0 - 0.5 / r, 1e-3));",
      "    g = gKam / (ut * (1.0 - om * by));",
      "  }",
      "  float To = T * g;",
      "  float I = sicht(To) / sicht(0.72 * uTemp) * uHell * (0.55 + 0.45 * dd);",
      "  float rand = smoothstep(R_IN * 0.98, R_IN * 1.12, r) * (1.0 - smoothstep(R_AUS * 0.55, R_AUS, r + 2.2 * (dd - 0.85)));",
      "  float tau = 1.6 * dd * rand;",
      "  float a = 1.0 - exp(-tau / max(abs(rd.y), 0.06));",
      "  return vec4(planck(To) * I, a);",
      "}",
      /* Sterne: eine Schicht = Gitter auf den Würfelseiten, je Zelle
         höchstens ein Stern; Breite nach Fußabdruck des Bildpunkts */
      "vec3 sternSchicht(vec3 d, float fp, float N, float dichteS, float hell, float saat, float gB) {",
      "  vec3 a = abs(d); vec2 uv; float fl;",
      "  if (a.x >= a.y && a.x >= a.z) { fl = d.x > 0.0 ? 0.0 : 1.0; uv = d.yz / a.x; }",
      "  else if (a.y >= a.z) { fl = d.y > 0.0 ? 2.0 : 3.0; uv = d.zx / a.y; }",
      "  else { fl = d.z > 0.0 ? 4.0 : 5.0; uv = d.xy / a.z; }",
      "  vec2 zelle = floor((uv * 0.5 + 0.5) * N);",
      "  vec4 h = hash4(vec4(zelle, fl, saat));",
      "  float da = step(hash1(vec4(zelle, fl, saat + 3.7)), dichteS);",
      "  vec2 su = (zelle + 0.2 + 0.6 * h.xy) / N * 2.0 - 1.0;",
      "  vec3 sd;",
      "  if (fl < 1.5) sd = vec3(fl < 0.5 ? 1.0 : -1.0, su.x, su.y);",
      "  else if (fl < 3.5) sd = vec3(su.y, fl < 2.5 ? 1.0 : -1.0, su.x);",
      "  else sd = vec3(su.x, su.y, fl < 4.5 ? 1.0 : -1.0);",
      "  sd = normalize(sd);",
      "  vec3 kr = cross(d, sd);",
      "  float th2 = dot(kr, kr);",
      "  float zw = 2.0 / N;",
      /* Punktstern, im Quellbild so breit wie der Fußabdruck des Bildpunkts.
         Helligkeit = Flächenhelligkeit · Raumwinkel des Bildpunkts (uPix²):
         wo die Linse vergrößert (kleiner Fußabdruck), wird der Stern heller */
      "  float sig2 = 0.00005 * 0.00005 + 0.36 * fp * fp;",
      "  float F = hell * 0.08 * pow(10.0, 2.0 * h.z * h.z * h.z);",
      "  float wert = da * F * uPix * uPix / (6.2832 * sig2) * exp(-th2 / (2.0 * sig2));",
      "  float mittel = dichteS * hell * 0.74 * uPix * uPix / (zw * zw);",
      "  float k = smoothstep(0.1, 0.3, sqrt(sig2) / zw);",
      /* Sterntemperaturen meist 3300 … 7500 K, wenige heiße blaue; Farben
         wie auf Fotos etwas weniger satt; gB = Frequenzfaktor beim Beobachter */
      "  float T = 3300.0 + 4200.0 * h.w + 9000.0 * pow(h.w, 6.0);",
      "  vec3 fs = mix(planck(T * gB), vec3(1.0), 0.3) * (sicht(T * gB) / sicht(T));",
      "  return mix(fs * wert, vec3(0.85, 0.9, 1.0) * mittel * (sicht(5500.0 * gB) / sicht(5500.0)), k);",
      "}",
      /* Galaxie hinter dem Loch (Ansicht Gravitationslinse) */
      "vec3 galaxie(vec3 d) {",
      "  float c = dot(d, uGalRicht);",
      "  if (c < 0.95) return vec3(0.0);",
      "  vec2 xy = vec2(dot(d, uGalE1), dot(d, uGalE2)) / c / 0.13;",
      "  xy = mat2(0.87, 0.5, -0.5, 0.87) * xy;",
      "  xy.y /= 0.62;",
      "  float r = length(xy);",
      "  if (r > 1.7) return vec3(0.0);",
      "  float th = atan(xy.y, xy.x);",
      "  float n = gfbm(vec3(xy * 5.0, 1.3), 4);",
      "  float spirale = 0.5 + 0.5 * cos(2.0 * (th - 2.3 * log(r + 0.03)) + 2.2 * n);",
      "  float arm = pow(spirale, 2.5);",
      "  float sch = exp(-r / 0.3) * (1.0 - smoothstep(1.0, 1.7, r));",
      "  float kern = exp(-r * r / 0.01) + 0.4 * exp(-r * r / 0.05);",
      "  vec3 col = uGalKern * kern * 2.5;",
      "  col += mix(uGalKern * 0.25, uGalArm * 1.3, arm) * sch * (0.55 + 0.9 * (n + 0.5));",
      "  float hii = smoothstep(0.25, 0.45, gnoise(vec3(xy * 16.0, 4.0))) * arm * sch;",
      "  col += uGalHii * hii * 2.5;",
      "  float staub = smoothstep(0.55, 0.9, 1.0 - spirale) * smoothstep(0.15, 0.4, r) * sch;",
      "  col *= 1.0 - 0.6 * staub;",
      "  return col * 0.65;",
      "}",
      "vec3 beschleunigung(vec3 p, float k) { float r2 = dot(p, p); return -k * p / (r2 * r2 * sqrt(r2)); }",
      "vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }",
      /* Filmkurve: je Farbkanal (helle Stellen werden weiß) gemischt mit einer
         Kurve nur auf die Helligkeit (Farben bleiben satt) */
      "vec3 film(vec3 c) {",
      "  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));",
      "  vec3 b = c * (aces(vec3(l)).x / max(l, 1e-5));",
      "  return clamp(mix(aces(c), b, 0.4), 0.0, 1.0);",
      "}",
      "void main() {",
      "  vec2 ndc = vUv * 2.0 - 1.0;",
      "  vec3 d = normalize(uKamV + ndc.x * uTanH * (uAufl.x / uAufl.y) * uKamR + ndc.y * uTanH * uKamO);",
      /* fallende Kamera: Richtung und Frequenz in das System eines ruhenden
         Beobachters umrechnen (Aberration, Doppler; uBeta = Geschwindigkeit) */
      "  float gAb = 1.0;",
      "  if (uGamma > 1.00001) {",
      "    vec3 nf = -d;",
      "    float vn = dot(uBeta, nf);",
      "    vec3 ns = normalize((nf / uGamma + uBeta * (1.0 + uGamma / (uGamma + 1.0) * vn)) / (1.0 + vn));",
      "    d = -ns;",
      "    gAb = uGamma * (1.0 - dot(uBeta, ns));",
      "  }",
      "  vec3 p = uKamPos;",
      "  float r0 = length(p);",
      "  vec3 n0 = p / r0;",
      "  float dr = dot(d, n0);",
      "  float lapse = sqrt(max(1.0 - 1.0 / r0, 1e-4));",
      "  vec3 v = d;",
      "  if (uLinse > 0.5) v = normalize(d + (lapse - 1.0) * dr * n0);",
      "  vec3 L = cross(p, v);",
      "  float h2 = dot(L, L);",
      "  float sinA = length(cross(n0, d));",
      "  float bWahr = uLinse > 0.5 ? r0 * sinA / lapse : r0 * sinA;",
      "  float by = -bWahr * L.y / max(sqrt(h2), 1e-6);",       // L_y des Photons (läuft zur Kamera)
      "  float gKam = (uLinse > 0.5 ? 1.0 / lapse : 1.0) * gAb;",
      "  float kk = 1.5 * h2 * uLinse;",
      "  float rEsc = max(2.0 * r0, 60.0);",
      "  vec3 farbe = vec3(0.0);",
      "  float A = 0.0, frei = 0.0;",
      "  for (int i = 0; i < SCHRITTE; i++) {",
      "    float r = length(p);",
      "    if (r < 1.0 || (uLinse > 0.5 && r < 1.5 && dot(p, v) < 0.0)) break;",
      "    if (r > rEsc && dot(p, v) > 0.0) { frei = 1.0; break; }",
      "    float dt = uGenau * max(0.05 * r, 0.03);",
      "    vec3 k1v = beschleunigung(p, kk), k1p = v;",
      "    vec3 k2v = beschleunigung(p + 0.5 * dt * k1p, kk), k2p = v + 0.5 * dt * k1v;",
      "    vec3 k3v = beschleunigung(p + 0.5 * dt * k2p, kk), k3p = v + 0.5 * dt * k2v;",
      "    vec3 k4v = beschleunigung(p + dt * k3p, kk), k4p = v + dt * k3v;",
      "    vec3 pn = p + dt / 6.0 * (k1p + 2.0 * k2p + 2.0 * k3p + k4p);",
      "    vec3 vn = v + dt / 6.0 * (k1v + 2.0 * k2v + 2.0 * k3v + k4v);",
      "    if (uScheibe > 0.5 && p.y * pn.y < 0.0) {",
      "      float t = p.y / (p.y - pn.y);",
      "      vec3 q = mix(p, pn, t);",
      "      float rq = length(q.xz);",
      "      if (rq > R_IN * 0.98 && rq < R_AUS) {",
      "        vec4 s = scheibe(q, rq, normalize(mix(v, vn, t)), by, gKam);",
      "        farbe += (1.0 - A) * s.a * s.rgb;",
      "        A += (1.0 - A) * s.a;",
      "        if (A > 0.995) break;",
      "      }",
      "    }",
      "    p = pn; v = vn;",
      "  }",
      /* Hintergrund (außerhalb jeder Verzweigung, wegen fwidth/Mipmaps) */
      "  vec3 dir = normalize(v);",
      "  float fp = sqrt(max(length(cross(dFdx(dir), dFdy(dir))), 1e-12));",   // √(Raumwinkel des Bildpunkts im Quellbild)
      /* Hintergrund rot- oder blauverschoben (wie ein 5500-K-Strahler) */
      "  vec3 tint = planck(5500.0 * gKam) / planck(5500.0) * (sicht(5500.0 * gKam) / sicht(5500.0));",
      "  vec3 hg = textureCube(uHimmel, dir).rgb * tint;",
      "  hg += sternSchicht(dir, fp, 56.0, 0.55, 1.0, 1.0, gKam) + sternSchicht(dir, fp, 170.0, 0.4, 0.22, 2.0, gKam);",
      "  hg += galaxie(dir) * uGalaxie * tint;",
      "  farbe += (1.0 - A) * frei * hg;",
      /* Messbild für die Belichtungsautomatik: log2 der Leuchtdichte */
      "  if (uMessen > 0.5) {",
      "    float lm = dot(farbe, vec3(0.2126, 0.7152, 0.0722));",
      "    gl_FragColor = vec4(clamp((log2(lm + 1e-5) + 16.0) / 24.0, 0.0, 1.0), 0.0, 0.0, 1.0);",
      "    return;",
      "  }",
      "#ifdef DIREKT",
      "  vec3 c = pow(film(farbe * uBelichtung), vec3(1.0 / 2.2));",
      "  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;",
      "  gl_FragColor = vec4(c, 1.0);",
      "#else",
      "  gl_FragColor = vec4(farbe, 1.0);",
      "#endif",
      "}"
    ].join("\n");
  }

  /* Bloom (Dual-Filter nach M. Bjørge, ARM 2015) und Endbild */
  var RUNTER_FS = [
    "uniform sampler2D tQuelle; uniform vec2 uTexel; uniform float uErste; varying vec2 vUv;",
    "void main() {",
    "  vec2 o = uTexel;",
    "  vec3 c = texture2D(tQuelle, vUv).rgb * 4.0",
    "    + texture2D(tQuelle, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tQuelle, vUv + vec2(o.x, -o.y)).rgb",
    "    + texture2D(tQuelle, vUv + vec2(-o.x, o.y)).rgb + texture2D(tQuelle, vUv + vec2(o.x, o.y)).rgb;",
    "  c /= 8.0;",
    "  if (uErste > 0.5) {",
    "    c = min(c, vec3(40.0));",
    "    float l = max(c.r, max(c.g, c.b));",
    "    c *= max(l - 1.0, 0.0) / max(l, 1e-4);",
    "  }",
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n");
  var HOCH_FS = [
    "uniform sampler2D tKlein, tHier; uniform vec2 uTexel; varying vec2 vUv;",
    "void main() {",
    "  vec2 o = uTexel;",
    "  vec3 c = texture2D(tKlein, vUv + vec2(-2.0 * o.x, 0.0)).rgb + texture2D(tKlein, vUv + vec2(2.0 * o.x, 0.0)).rgb",
    "    + texture2D(tKlein, vUv + vec2(0.0, -2.0 * o.y)).rgb + texture2D(tKlein, vUv + vec2(0.0, 2.0 * o.y)).rgb",
    "    + 2.0 * (texture2D(tKlein, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tKlein, vUv + vec2(o.x, -o.y)).rgb",
    "    + texture2D(tKlein, vUv + vec2(-o.x, o.y)).rgb + texture2D(tKlein, vUv + vec2(o.x, o.y)).rgb);",
    "  gl_FragColor = vec4(c / 12.0 + texture2D(tHier, vUv).rgb, 1.0);",
    "}"
  ].join("\n");
  var ENDBILD_FS = [
    "uniform sampler2D tHdr, tBloom; uniform float uBloom, uBelichtung, uRoh; varying vec2 vUv;",
    "vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }",
    "vec3 film(vec3 c) {",
    "  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));",
    "  vec3 b = c * (aces(vec3(l)).x / max(l, 1e-5));",
    "  return clamp(mix(aces(c), b, 0.4), 0.0, 1.0);",
    "}",
    "void main() {",
    "  vec3 c = texture2D(tHdr, vUv).rgb;",
    "  if (uRoh < 0.5) {",
    "    c += texture2D(tBloom, vUv).rgb * uBloom;",
    "    c = pow(film(c * uBelichtung), vec3(1.0 / 2.2));",
    "    c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;",
    "  }",
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n");

  /* ---------------------------------------------------------------------
     Vektor-Helfer und Lichtstrahl in JavaScript (für Beschriftungen und
     Einstein-Ring; dieselbe Physik wie im Shader)
     --------------------------------------------------------------------- */
  function v3(x, y, z) { return [x, y, z]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function norm(a) { return mul(a, 1 / len(a)); }

  /* Kamera aus Abstand r, Höhe (rad) und Drehung (rad) */
  function kameraAus(r, h, w) {
    var pos = v3(r * Math.cos(h) * Math.sin(w), r * Math.sin(h), r * Math.cos(h) * Math.cos(w));
    var vor = norm(mul(pos, -1));
    var rechts = norm(cross(vor, [0, 1, 0]));
    var oben = cross(rechts, vor);
    return { pos: pos, vor: vor, rechts: rechts, oben: oben, r: r };
  }

  /* Kamera beim Hineinfallen: an r · FALL_N, Blick zum Loch, gedreht um
     gier (links/rechts) und nick (oben/unten) */
  function fallKamera(r, gier, nick) {
    var n = FALL_N, f0 = mul(n, -1);
    var o0 = norm(add([0, 1, 0], mul(f0, -f0[1]))), r0 = cross(f0, o0);
    var vor = norm(add(add(mul(f0, Math.cos(nick) * Math.cos(gier)), mul(r0, Math.cos(nick) * Math.sin(gier))), mul(o0, Math.sin(nick))));
    var rechts = norm(cross(vor, o0));
    return { pos: mul(n, r), vor: vor, rechts: rechts, oben: cross(rechts, vor), r: r };
  }

  /* Strahl durch den Bildpunkt (nx, ny ∈ −1…1). opt.scheibe: Treffer der
     Scheibe sammeln; Rückgabe: treffer[], frei (entkommen), richtung */
  function verfolge(kam, aspekt, nx, ny, linse, opt) {
    var d = norm(add(kam.vor, add(mul(kam.rechts, nx * TAN * aspekt), mul(kam.oben, ny * TAN))));
    var p = kam.pos.slice(), r0 = len(p), n0 = mul(p, 1 / r0), dr = dot(d, n0);
    var lapse = Math.sqrt(1 - 1 / r0);
    var v = linse ? norm(add(d, mul(n0, (lapse - 1) * dr))) : d;
    var L = cross(p, v), kk = linse ? 1.5 * dot(L, L) : 0;
    var rEsc = Math.max(2 * r0, 60), treffer = [], frei = false;
    function acc(q) { var r2 = dot(q, q); return mul(q, -kk / (r2 * r2 * Math.sqrt(r2))); }
    for (var i = 0; i < 3000; i++) {
      var r = len(p);
      if (r < 1 || (linse && r < 1.5 && dot(p, v) < 0)) break;
      if (r > rEsc && dot(p, v) > 0) { frei = true; break; }
      var dt = Math.max(0.025 * r, 0.015);
      var k1v = acc(p), k1p = v;
      var k2v = acc(add(p, mul(k1p, dt / 2))), k2p = add(v, mul(k1v, dt / 2));
      var k3v = acc(add(p, mul(k2p, dt / 2))), k3p = add(v, mul(k2v, dt / 2));
      var k4v = acc(add(p, mul(k3p, dt))), k4p = add(v, mul(k3v, dt));
      var pn = add(p, mul(add(add(k1p, mul(k2p, 2)), add(mul(k3p, 2), k4p)), dt / 6));
      var vn = add(v, mul(add(add(k1v, mul(k2v, 2)), add(mul(k3v, 2), k4v)), dt / 6));
      if (opt && opt.scheibe && p[1] * pn[1] < 0) {
        var t = p[1] / (p[1] - pn[1]);
        var q = add(p, mul(add(pn, mul(p, -1)), t)), rq = Math.hypot(q[0], q[2]);
        if (rq > R_IN && rq < R_AUS) {
          treffer.push({ r: rq, oben: v[1] < 0, fern: q[0] * kam.pos[0] + q[2] * kam.pos[2] < 0 });
          if (treffer.length >= (opt.max || 1)) break;
        }
      }
      p = pn; v = vn;
    }
    return { treffer: treffer, frei: frei, richtung: norm(v) };
  }

  /* Winkelradius (rad) des Schattens bzw. des Horizonts ohne Ablenkung */
  function schattenWinkel(r) { return Math.asin(Math.min(1, B_KRIT * Math.sqrt(1 - 1 / r) / r)); }
  function horizontWinkel(r) { return Math.asin(Math.min(1, 1 / r)); }

  /* ---------------------------------------------------------------------
     Kleine DOM-Helfer, Titel-Effekt (wie im Modell Größenverhältnisse)
     --------------------------------------------------------------------- */
  function el(tag, klasse, text) {
    var e = document.createElement(tag);
    if (klasse) e.className = klasse;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  var ICON = {
    zurueck: '<path d="M15 6l-6 6 6 6"/>',
    weiter: '<path d="M9 6l6 6-6 6"/>',
    flug: '<path d="M7 5l12 7-12 7z"/>',
    vollbild: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
    optionen: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    neu: '<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4 4v4.5h4.5"/>'
  };
  function knopf(icon, text, titel) {
    var b = el("button", "uni-knopf");
    b.type = "button";
    b.title = titel;
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[icon] + "</svg>";
    b.appendChild(el("span", "uni-knopf-text", text));
    return b;
  }
  var ZEICHEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789·+−×";
  function entschluessle(e, text) {
    if (e._lauf) cancelAnimationFrame(e._lauf);
    if (U.wenigBewegung) { e.textContent = text; return; }
    var start = performance.now(), dauer = 520;
    function schritt(t) {
      var p = Math.min(1, (t - start) / dauer), fertig = Math.floor(p * text.length), s = text.slice(0, fertig);
      for (var i = fertig; i < text.length; i++) s += text[i] === " " ? " " : ZEICHEN[Math.floor(Math.random() * ZEICHEN.length)];
      e.textContent = s;
      e._lauf = p < 1 ? requestAnimationFrame(schritt) : null;
    }
    e._lauf = requestAnimationFrame(schritt);
    clearTimeout(e._ende);
    e._ende = setTimeout(function () { if (e._lauf) cancelAnimationFrame(e._lauf); e._lauf = null; e.textContent = text; }, dauer + 120);
  }
  function zahl(x, stellen) { return x.toFixed(stellen).replace(".", ","); }
  function tausender(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " "); }

  /* ---------------------------------------------------------------------
     Start
     --------------------------------------------------------------------- */
  function start(buehne) {
    var huelle = buehne.querySelector(".uni-leinwand");
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch (e) {
      buehne.classList.add("uni-fehler");
      return;
    }
    buehne.classList.add("uni-bereit");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.autoClear = false;
    huelle.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    var hdr = !!(renderer.capabilities.isWebGL2 &&
      (renderer.extensions.has("EXT_color_buffer_float") || renderer.extensions.has("EXT_color_buffer_half_float")));
    var grob = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    var schmal = window.matchMedia && window.matchMedia("(max-width: 52rem)").matches;

    /* ----- Vollbild-Viereck ----- */
    var vollKamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var vollSzene = new THREE.Scene();
    var viereck = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    viereck.frustumCulled = false;
    vollSzene.add(viereck);
    function zeichne(mat, ziel) {
      viereck.material = mat;
      renderer.setRenderTarget(ziel || null);
      renderer.render(vollSzene, vollKamera);
    }

    /* ----- Himmel: Milchstraße einmal in eine Würfeltextur ----- */
    var seite = grob || schmal ? 512 : 1024;
    var himmelZiel = new THREE.WebGLCubeRenderTarget(seite, {
      type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
      generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter
    });
    (function () {
      var uZ = norm([-0.62, -0.08, -0.78]);                    // Richtung zum Zentrum der Milchstraße
      var uN = norm(cross(uZ, norm([0.55, 0.8, -0.2])));       // Bandebene schräg durchs Bild
      var mat = new THREE.ShaderMaterial({
        uniforms: {
          uN: { value: new THREE.Vector3(uN[0], uN[1], uN[2]) }, uZ: { value: new THREE.Vector3(uZ[0], uZ[1], uZ[2]) },
          uKern: { value: U.farbe("galaxie-kern") }, uArm: { value: U.farbe("galaxie-arm") }, uHii: { value: U.farbe("galaxie-hii") }
        },
        vertexShader: HIMMEL_VS, fragmentShader: HIMMEL_FS, side: THREE.BackSide, depthWrite: false
      });
      var sz = new THREE.Scene();
      sz.add(new THREE.Mesh(new THREE.SphereGeometry(50, 64, 32), mat));
      var cc = new THREE.CubeCamera(1, 100, himmelZiel);
      cc.update(renderer, sz);
      mat.dispose();
    })();

    /* ----- Zielbilder ----- */
    var typ = hdr ? THREE.HalfFloatType : THREE.UnsignedByteType;
    function ziel() {
      return new THREE.WebGLRenderTarget(4, 4, { type: typ, depthBuffer: false, stencilBuffer: false,
        minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    }
    var zielHdr = ziel(), runter = [], hoch = [], STUFEN = 5;
    /* Belichtungsautomatik (nur beim Hineinfallen): kleines Messbild */
    var MESS_B = 48, MESS_H = 27;
    var messZiel = new THREE.WebGLRenderTarget(MESS_B, MESS_H, { type: THREE.UnsignedByteType, depthBuffer: false, stencilBuffer: false });
    var messPuffer = new Uint8Array(MESS_B * MESS_H * 4), messZaehler = 0;
    if (hdr) for (var s = 0; s < STUFEN; s++) { runter.push(ziel()); if (s < STUFEN - 1) hoch.push(ziel()); }

    var uniforms = {
      uAufl: { value: new THREE.Vector2(1, 1) },
      uKamPos: { value: new THREE.Vector3() }, uKamR: { value: new THREE.Vector3() },
      uKamO: { value: new THREE.Vector3() }, uKamV: { value: new THREE.Vector3() },
      uBeta: { value: new THREE.Vector3() }, uGamma: { value: 1 }, uMessen: { value: 0 },
      uPix: { value: 0.001 }, uTanH: { value: TAN }, uZeit: { value: 37 }, uScheibe: { value: 1 }, uLinse: { value: 1 },
      uVerschiebung: { value: 1 }, uTemp: { value: 4000 }, uGalaxie: { value: 0 }, uGenau: { value: grob ? 1.3 : 1 },
      uHell: { value: 0.6 }, uBelichtung: { value: 1.0 },
      uGalRicht: { value: new THREE.Vector3(0, 0, -1) }, uGalE1: { value: new THREE.Vector3(1, 0, 0) }, uGalE2: { value: new THREE.Vector3(0, 1, 0) },
      uGalKern: { value: U.farbe("galaxie-kern") }, uGalArm: { value: U.farbe("galaxie-arm") }, uGalHii: { value: U.farbe("galaxie-hii") },
      uHimmel: { value: himmelZiel.texture }, uPlanck: { value: planckTabelle() }
    };
    var rayMat = new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: VOLLBILD_VS, fragmentShader: raytraceFS(grob ? 240 : 320, !hdr),
      depthTest: false, depthWrite: false
    });
    rayMat.extensions.derivatives = true;
    var runterMat = new THREE.ShaderMaterial({ uniforms: { tQuelle: { value: null }, uTexel: { value: new THREE.Vector2() }, uErste: { value: 0 } },
      vertexShader: VOLLBILD_VS, fragmentShader: RUNTER_FS, depthTest: false, depthWrite: false });
    var hochMat = new THREE.ShaderMaterial({ uniforms: { tKlein: { value: null }, tHier: { value: null }, uTexel: { value: new THREE.Vector2() } },
      vertexShader: VOLLBILD_VS, fragmentShader: HOCH_FS, depthTest: false, depthWrite: false });
    var endMat = new THREE.ShaderMaterial({ uniforms: { tHdr: { value: zielHdr.texture }, tBloom: { value: null },
      uBloom: { value: 0.07 }, uBelichtung: { value: 1.0 }, uRoh: { value: hdr ? 0 : 1 } },
      vertexShader: VOLLBILD_VS, fragmentShader: ENDBILD_FS, depthTest: false, depthWrite: false });

    /* ----- Zustand ----- */
    var Z = {
      r: 24, hoehe: 8 * Math.PI / 180, dreh: 20 * Math.PI / 180,
      ziel: null, flug: null, ansicht: 0, sichtbar: true,
      scheibe: true, linse: true, verschiebung: true, galaxie: false, hilfe: true,
      temp: 4000, versatz: 0, letzteEingabe: performance.now(), rundflug: null, zeit: 37,
      qual: grob ? 0.6 : 0.8, drehV: 0, galBasis: null, autoBel: 1,
      fall: { r: F.R_START, laeuft: false, masse: 0, gier: 0, nick: 0, drehung: 0.6, zieht: false }
    };
    var tabellen = {}, koerper = null;
    function fallModus() { return !!ANSICHTEN[Z.ansicht].fall; }
    function fallTabelle() {
      var m = F.MASSEN[Z.fall.masse];
      return tabellen[m.id] || (tabellen[m.id] = F.tabelle(m.M));
    }

    /* ----- Oberfläche ----- */
    buehne.classList.add("uni-loch");
    var hilfeEbene = el("div", "uni-hilfe");
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("aria-hidden", "true");
    var kreisSchatten = document.createElementNS(svgNS, "circle");
    kreisSchatten.setAttribute("class", "uni-hilfe-schatten");
    var kreisHorizont = document.createElementNS(svgNS, "circle");
    kreisHorizont.setAttribute("class", "uni-hilfe-horizont");
    svg.append(kreisSchatten, kreisHorizont);
    hilfeEbene.appendChild(svg);
    /* Schild: text = lang, kurz = für schmale Bühnen; Text steht rechts
       vom Punkt (bzw. links bei Klasse „links“), außer er passt dort nicht */
    function schild(text, klasse, kurz) {
      var e = el("div", "uni-schild" + (klasse ? " " + klasse : ""));
      e.append(el("span", "uni-schild-punkt"), el("span", "uni-schild-text", text));
      hilfeEbene.appendChild(e);
      return { el: e, text: e.lastChild, lang: text, kurz: kurz === undefined ? text : kurz, links: (" " + (klasse || "") + " ").indexOf(" links ") >= 0, x: 0, y: 0, an: false };
    }
    var SCH = {
      schatten: schild("Schatten", "ohne-punkt"),
      horizont: schild("Horizont ohne Lichtablenkung", "horizont", ""),
      ring: schild("Photonenring"),
      rueck: schild("Rückseite der Scheibe, über das Loch gebogen", "", "Rückseite der Scheibe"),
      unter: schild("Unterseite der Scheibe"),
      zu: schild("kommt auf dich zu", "links"),
      weg: schild("fliegt von dir weg"),
      bild1: schild("Bild 1"),
      bild2: schild("Bild 2"),
      einstein: schild("Einstein-Ring")
    };

    var info = el("div", "uni-info");
    info.setAttribute("aria-live", "polite");
    var infoKopf = el("p", "uni-oberzeile");
    var infoTitel = el("h2", "uni-titel");
    var infoKurz = el("p", "uni-groesse");
    var infoText = el("p", "uni-text");
    var infoFakt = el("p", "uni-fakt");
    var infoLink = el("a", "uni-link");
    var infoMehr = el("button", "uni-mehr", "Mehr lesen");
    infoMehr.type = "button";
    infoMehr.setAttribute("aria-expanded", "false");
    info.append(infoKopf, infoTitel, infoKurz, infoText, infoFakt, infoLink, infoMehr);
    infoMehr.addEventListener("click", function () {
      var offen = info.classList.toggle("uni-info-offen");
      infoMehr.setAttribute("aria-expanded", offen ? "true" : "false");
      infoMehr.textContent = offen ? "Weniger" : "Mehr lesen";
    });
    var thema = window.Seite && window.Seite.findeThema && window.Seite.findeThema("sternleichen");
    if (thema && thema.thema.status === "online") {
      infoLink.href = window.Seite.ROOT + thema.thema.datei;
      infoLink.textContent = "Mehr dazu: Schwarze Löcher";
    } else infoLink.hidden = true;

    /* Einstellungen (rechts oben; auf dem Handy über den Knopf „Optionen“) */
    var einst = el("div", "uni-einstellungen");
    einst.id = "uni-einst-" + Math.floor(Math.random() * 1e6);
    einst.setAttribute("role", "group");
    einst.setAttribute("aria-label", "Einstellungen");
    var darstellung = el("div", "uni-einst-darstellung");   // beim Hineinfallen ausgeblendet
    einst.appendChild(darstellung);
    darstellung.appendChild(el("p", "uni-einst-titel", "Einstellungen"));
    function schalter(name, text, titel) {
      var b = el("button", "uni-schalter");
      b.type = "button";
      b.title = titel;
      b.append(el("span", "uni-schalter-text", text), el("span", "uni-schalter-bahn"));
      b.addEventListener("click", function () {
        Z[name] = !Z[name];
        if (name === "galaxie" && Z.galaxie) { galBasisAus(kameraAus(Z.r, Z.hoehe, Z.dreh)); Z.versatz = 0; linsenRegler.value = "0"; }
        stoppeRundflug(); eingabe();
        aktualisiereSchalter();
      });
      darstellung.appendChild(b);
      return b;
    }
    var schalterListe = {
      scheibe: schalter("scheibe", "Akkretionsscheibe", "Scheibe aus heißem Gas ein- oder ausblenden"),
      linse: schalter("linse", "Lichtablenkung", "Ohne Lichtablenkung liefe das Licht geradeaus"),
      verschiebung: schalter("verschiebung", "Rot-/Blauverschiebung", "Dopplereffekt und Gravitations-Rotverschiebung"),
      galaxie: schalter("galaxie", "Galaxie dahinter", "Eine Galaxie weit hinter dem Schwarzen Loch"),
      hilfe: schalter("hilfe", "Beschriftung", "Hilfslinien und Beschriftungen")
    };
    darstellung.appendChild(el("p", "uni-einst-titel", "Temperatur der Scheibe"));
    var wahl = el("div", "uni-wahl");
    var TEMPS = [[4000, "4000 K"], [6500, "6500 K"], [15000, "15 000 K"]];
    var tempKnoepfe = TEMPS.map(function (t) {
      var b = el("button", "uni-wahl-knopf", t[1]);
      b.type = "button";
      b.title = "Höchste Temperatur der Scheibe: " + t[1];
      b.addEventListener("click", function () { Z.temp = t[0]; eingabe(); aktualisiereSchalter(); });
      wahl.appendChild(b);
      return b;
    });
    darstellung.appendChild(wahl);

    /* Masse des Schwarzen Lochs: ändert in den Ansichten nur den Maßstab
       (Anzeige unten links), beim Hineinfallen die Gezeitenkräfte */
    einst.appendChild(el("p", "uni-einst-titel", "Masse des Schwarzen Lochs"));
    var masseWahl = el("div", "uni-wahl");
    var masseKnoepfe = F.MASSEN.map(function (m, i) {
      var b = el("button", "uni-wahl-knopf", m.kurz);
      b.type = "button";
      b.title = "Schwarzes Loch mit " + (m.id === "stellar" ? "" : "der Masse von ") + m.name;
      b.addEventListener("click", function () {
        Z.fall.masse = i; eingabe();
        if (fallModus()) { Z.fall.r = F.R_START; Z.fall.laeuft = true; Z.belZiel = 0; }
        fallKnoepfe();
      });
      masseWahl.appendChild(b);
      return b;
    });
    einst.appendChild(masseWahl);

    /* alle Ansichten zum Anklicken */
    einst.appendChild(el("p", "uni-einst-titel", "Ansichten"));
    var ansichtListe = el("div", "uni-ansichten");
    var ansichtKnoepfe = ANSICHTEN.map(function (a, i) {
      var b = el("button", "uni-ansicht-knopf", KNOPF_NAME[a.id] || a.titel);
      b.type = "button";
      b.title = a.titel;
      b.addEventListener("click", function () { stoppeRundflug(); eingabe(); fliege(i); buehne.classList.remove("uni-einst-offen"); bOpt.setAttribute("aria-expanded", "false"); });
      ansichtListe.appendChild(b);
      return b;
    });
    einst.appendChild(ansichtListe);

    var unten = el("div", "uni-unten");
    var knoepfe = el("div", "uni-knoepfe");
    var bZurueck = knopf("zurueck", "Zurück", "Vorige Ansicht");
    var bWeiter = knopf("weiter", "Weiter", "Nächste Ansicht");
    var bFlug = knopf("flug", "Rundflug", "Automatisch durch alle Ansichten fliegen");
    var bVoll = knopf("vollbild", "Vollbild", "Vollbild ein/aus");
    var bOpt = knopf("optionen", "Optionen", "Einstellungen ein- und ausblenden");
    bOpt.classList.add("uni-knopf-optionen");
    bOpt.setAttribute("aria-controls", einst.id);
    bOpt.setAttribute("aria-expanded", "false");
    knoepfe.append(bZurueck, bWeiter, bFlug);
    if (buehne.requestFullscreen) knoepfe.append(bVoll);
    knoepfe.append(bOpt);
    var linsenZeile = el("div", "uni-schieber uni-schieber-linse");
    var linsenRegler = el("input");
    linsenRegler.type = "range"; linsenRegler.min = "-10"; linsenRegler.max = "10"; linsenRegler.step = "0.05"; linsenRegler.value = "0";
    linsenRegler.setAttribute("aria-label", "Galaxie seitlich verschieben (Grad)");
    var bHinter = el("button", "uni-wahl-knopf", "hinter das Loch");
    bHinter.type = "button";
    bHinter.title = "Galaxie genau hinter das Loch stellen (von hier aus gesehen)";
    linsenZeile.append(el("span", "uni-schieber-ende", "Galaxie verschieben"), linsenRegler, bHinter);

    /* Hineinfallen: Masse, Start/Halt, Neu, Abstand */
    var fallZeile = el("div", "uni-fall-zeile");
    var bFallen = knopf("pause", "Anhalten", "Fall anhalten oder weiterlaufen lassen");
    var bNeu = knopf("neu", "Neu", "Zurück an den Anfang");
    var fallRegler = el("input");
    fallRegler.type = "range"; fallRegler.min = "0"; fallRegler.max = "1000"; fallRegler.step = "1"; fallRegler.value = "0";
    fallRegler.setAttribute("aria-label", "Abstand: links weit weg, rechts am Horizont");
    var reglerZeile = el("div", "uni-schieber uni-fall-regler");
    reglerZeile.append(el("span", "uni-schieber-ende", "weit weg"), fallRegler, el("span", "uni-schieber-ende", "Horizont"));
    var fallKnopfZeile = el("div", "uni-fall-knoepfe");
    fallKnopfZeile.append(bFallen, bNeu);
    fallZeile.append(fallKnopfZeile, reglerZeile);
    var LN_A = Math.log(F.R_START), LN_B = Math.log(F.R_ENDE);
    function fallKnoepfe() {
      masseKnoepfe.forEach(function (b, i) { b.setAttribute("aria-pressed", i === Z.fall.masse ? "true" : "false"); });
      var amEnde = Z.fall.r <= F.R_ENDE + 1e-6;
      bFallen.querySelector("svg").innerHTML = Z.fall.laeuft ? ICON.pause : ICON.flug;
      bFallen.lastChild.textContent = Z.fall.laeuft ? "Anhalten" : amEnde ? "Nochmal" : "Fallen";
    }
    bFallen.addEventListener("click", function () {
      eingabe();
      if (!Z.fall.laeuft && Z.fall.r <= F.R_ENDE + 1e-6) Z.fall.r = F.R_START;
      Z.fall.laeuft = !Z.fall.laeuft; fallKnoepfe();
    });
    bNeu.addEventListener("click", function () { eingabe(); Z.fall.r = F.R_START; Z.fall.laeuft = false; Z.fall.gier = 0; Z.fall.nick = 0; fallKnoepfe(); });
    fallRegler.addEventListener("input", function () {
      Z.fall.zieht = true; Z.fall.laeuft = false; eingabe();
      Z.fall.r = Math.exp(LN_A + (LN_B - LN_A) * fallRegler.value / 1000); fallKnoepfe();
    });
    ["change", "pointerup", "pointercancel", "blur"].forEach(function (typ) { fallRegler.addEventListener(typ, function () { Z.fall.zieht = false; }); });

    var koerperTafel = el("div", "uni-koerper");
    koerperTafel.appendChild(el("p", "uni-einst-titel", "Dein Körper"));
    var koerperBild = el("div", "uni-koerper-bild");
    var koerperMass = el("span", "uni-koerper-mass");
    var koerperMassText = el("span", "uni-koerper-mass-text");
    koerperMass.appendChild(koerperMassText);
    koerperBild.append(koerperMass, el("span", "uni-koerper-pfeil", "zum Schwarzen Loch"));
    var werte = el("dl", "uni-koerper-werte");
    function wert(name) { var d = el("dd"); werte.append(el("dt", null, name), d); return d; }
    var wAbstand = wert("Abstand"), wTempo = wert("Tempo"), wGezeit = wert("Kopf zu Füßen"), wUhr = wert("Deine Uhr"), wFern = wert("Uhr weit weg");
    var koerperStatus = el("p", "uni-koerper-status");
    koerperStatus.setAttribute("aria-live", "polite");
    koerperTafel.append(koerperBild, werte, koerperStatus);
    var anzeige = el("div", "uni-anzeige");
    var abstandText = el("span", "uni-mass-text");
    var sgrText = el("p", "uni-vergleich");
    anzeige.append(abstandText, sgrText);
    unten.append(knoepfe, linsenZeile, fallZeile, anzeige);
    var hinweis = el("p", "uni-hinweis", "Ziehen: drehen · Mausrad: näher/weiter");
    if (grob) hinweis.textContent = "Wischen: drehen · zwei Finger: näher/weiter";
    var rechts = el("div", "uni-rechts");   // Einstellungen und (beim Hineinfallen) Körpertafel
    rechts.append(einst, koerperTafel);
    buehne.append(hilfeEbene, info, rechts, unten, hinweis);

    function aktualisiereSchalter() {
      Object.keys(schalterListe).forEach(function (k) {
        schalterListe[k].setAttribute("aria-pressed", Z[k] ? "true" : "false");
      });
      schalterListe.verschiebung.disabled = !Z.scheibe;
      tempKnoepfe.forEach(function (b, i) { b.setAttribute("aria-pressed", TEMPS[i][0] === Z.temp ? "true" : "false"); });
      wahl.classList.toggle("aus", !Z.scheibe);
      linsenZeile.hidden = !Z.galaxie;
      buehne.classList.toggle("uni-mit-regler", Z.galaxie);
      hilfeNeu = true;
    }
    bOpt.addEventListener("click", function () {
      var offen = buehne.classList.toggle("uni-einst-offen");
      bOpt.setAttribute("aria-expanded", offen ? "true" : "false");
    });

    /* ----- Ansichten, Flüge, Rundflug ----- */
    function zeigeAnsicht(i) {
      var a = ANSICHTEN[i];
      Z.ansicht = i;
      infoKopf.textContent = "Ansicht " + (i + 1) + " von " + ANSICHTEN.length;
      ansichtKnoepfe.forEach(function (b, j) {
        if (j === i) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");
      });
      entschluessle(infoTitel, a.titel);
      infoKurz.textContent = a.kurz;
      infoText.textContent = a.text;
      infoFakt.textContent = a.fakt;
      info.classList.remove("uni-neu"); void info.offsetWidth; info.classList.add("uni-neu");
      Z.scheibe = a.an.scheibe; Z.galaxie = a.an.galaxie; Z.hilfe = a.an.hilfe;
      Z.linse = true; Z.verschiebung = true;
      if (a.id === "linse") {
        Z.versatz = 0; linsenRegler.value = "0";
        galBasisAus(kameraAus(a.r, a.hoehe * Math.PI / 180, a.dreh * Math.PI / 180));
      }
      buehne.classList.toggle("uni-fall-modus", !!a.fall);
      uniforms.uTanH.value = a.fall ? TAN_FALL : TAN;
      zielB = 0; zielGroessen();
      if (a.fall) {
        if (!koerper) koerper = new F.Koerper(koerperBild);
        Z.fall.r = F.R_START; Z.fall.gier = 0; Z.fall.nick = 0; Z.belZiel = 0;
        Z.fall.laeuft = !U.wenigBewegung;
        fallKnoepfe();
      } else Z.fall.laeuft = false;
      aktualisiereSchalter();
      if (history.replaceState) history.replaceState(null, "", "#" + a.id);
    }
    function winkelNah(von, nach) {
      var d = (nach - von) % (2 * Math.PI);
      if (d > Math.PI) d -= 2 * Math.PI;
      if (d < -Math.PI) d += 2 * Math.PI;
      return von + d;
    }
    function fliege(i, sofort) {
      var a = ANSICHTEN[i];
      zeigeAnsicht(i);
      if (a.fall) { Z.flug = null; return; }
      var nach = { r: a.r, hoehe: a.hoehe * Math.PI / 180, dreh: winkelNah(Z.dreh, a.dreh * Math.PI / 180) };
      if (sofort || U.wenigBewegung) { Z.r = nach.r; Z.hoehe = nach.hoehe; Z.dreh = nach.dreh; Z.flug = null; return; }
      Z.flug = { von: { r: Z.r, hoehe: Z.hoehe, dreh: Z.dreh }, nach: nach, start: performance.now(), dauer: 2600 };
    }
    function stoppeRundflug() {
      if (Z.rundflug) { clearInterval(Z.rundflug); Z.rundflug = null; buehne.classList.remove("uni-im-flug"); }
      bFlug.lastChild.textContent = "Rundflug";
    }
    function eingabe() { Z.letzteEingabe = performance.now(); buehne.classList.add("uni-benutzt"); }
    bZurueck.addEventListener("click", function () { stoppeRundflug(); eingabe(); fliege((Z.ansicht + ANSICHTEN.length - 1) % ANSICHTEN.length); });
    bWeiter.addEventListener("click", function () { stoppeRundflug(); eingabe(); fliege((Z.ansicht + 1) % ANSICHTEN.length); });
    bFlug.addEventListener("click", function () {
      if (Z.rundflug) { stoppeRundflug(); return; }
      eingabe();
      buehne.classList.add("uni-im-flug");
      bFlug.lastChild.textContent = "Stopp";
      /* der Rundflug lässt das Hineinfallen aus */
      function naechste() { var j = (Z.ansicht + 1) % ANSICHTEN.length; return ANSICHTEN[j].fall ? (j + 1) % ANSICHTEN.length : j; }
      fliege(naechste());
      Z.rundflug = setInterval(function () { fliege(naechste()); }, 11000);
    });
    bVoll.addEventListener("click", function () {
      if (document.fullscreenElement) document.exitFullscreen();
      else buehne.requestFullscreen().catch(function () {});
    });
    linsenRegler.addEventListener("input", function () { Z.versatz = +linsenRegler.value; eingabe(); stoppeRundflug(); hilfeNeu = true; });
    bHinter.addEventListener("click", function () {
      galBasisAus(kameraAus(Z.r, Z.hoehe, Z.dreh)); Z.versatz = 0; linsenRegler.value = "0";
      eingabe(); stoppeRundflug(); hilfeNeu = true;
    });

    /* ----- Ziehen, Mausrad, zwei Finger, Tasten ----- */
    var zeiger = {}, ziehen = false, pinchAbstand = 0;
    var cv = renderer.domElement;
    function begrenzeHoehe(h) { return Math.max(-1.5, Math.min(1.5, h)); }
    function zoom(faktor) {
      if (fallModus()) {   /* beim Hineinfallen: Rad und zwei Finger verschieben den Abstand */
        Z.fall.r = Math.max(F.R_ENDE, Math.min(F.R_START, Z.fall.r * faktor));
        if (Z.fall.laeuft) { Z.fall.laeuft = false; fallKnoepfe(); }
        return;
      }
      Z.r = Math.max(R_MIN, Math.min(R_MAX, Z.r * faktor)); Z.flug = null; hilfeNeu = true;
    }
    cv.addEventListener("pointerdown", function (ev) {
      cv.setPointerCapture(ev.pointerId);
      zeiger[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      ziehen = true; stoppeRundflug(); eingabe(); Z.flug = null; Z.drehV = 0;
      var ids = Object.keys(zeiger);
      if (ids.length === 2) {
        var a = zeiger[ids[0]], b = zeiger[ids[1]];
        pinchAbstand = Math.hypot(a.x - b.x, a.y - b.y);
      }
    });
    cv.addEventListener("pointermove", function (ev) {
      var z = zeiger[ev.pointerId];
      if (!z) return;
      var ids = Object.keys(zeiger);
      if (ids.length === 2) {
        z.x = ev.clientX; z.y = ev.clientY;
        var a = zeiger[ids[0]], b = zeiger[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchAbstand > 0 && d > 0) zoom(pinchAbstand / d);
        pinchAbstand = d;
        return;
      }
      var dx = ev.clientX - z.x, dy = ev.clientY - z.y;
      z.x = ev.clientX; z.y = ev.clientY;
      var k = 3.2 / Math.max(300, buehne.clientHeight);
      if (fallModus()) {   /* umsehen */
        Z.fall.gier -= dx * k * 0.8;
        Z.fall.nick = Math.max(-1.35, Math.min(1.35, Z.fall.nick + dy * k * 0.8));
        eingabe(); return;
      }
      Z.dreh -= dx * k;
      Z.drehV = -dx * k * 60;
      Z.hoehe = begrenzeHoehe(Z.hoehe + dy * k);
      eingabe(); hilfeNeu = true;
    });
    function los(ev) {
      delete zeiger[ev.pointerId];
      if (Object.keys(zeiger).length < 2) pinchAbstand = 0;
      if (!Object.keys(zeiger).length) ziehen = false;
    }
    cv.addEventListener("pointerup", los);
    cv.addEventListener("pointercancel", los);
    buehne.addEventListener("wheel", function (ev) {
      if (!ev.target.closest(".uni-leinwand")) return;
      ev.preventDefault();
      stoppeRundflug(); eingabe();
      var d = ev.deltaMode === 1 ? ev.deltaY * 33 : ev.deltaY;
      zoom(Math.exp(Math.max(-200, Math.min(200, d)) * 0.0012));
    }, { passive: false });
    buehne.addEventListener("keydown", function (ev) {
      var k = ev.key, ok = true;
      if (ev.target.closest("input")) return;
      if (fallModus()) {
        if (k === "ArrowLeft") Z.fall.gier -= 0.08;
        else if (k === "ArrowRight") Z.fall.gier += 0.08;
        else if (k === "ArrowUp") Z.fall.nick = Math.min(1.35, Z.fall.nick + 0.06);
        else if (k === "ArrowDown") Z.fall.nick = Math.max(-1.35, Z.fall.nick - 0.06);
        else if (k === "+" || k === "=") zoom(1 / 1.1);
        else if (k === "-" || k === "_") zoom(1.1);
        else if (k === " ") bFallen.click();
        else if (k === "PageDown") fliege((Z.ansicht + 1) % ANSICHTEN.length);
        else if (k === "PageUp") fliege((Z.ansicht + ANSICHTEN.length - 1) % ANSICHTEN.length);
        else return;
        ev.preventDefault(); eingabe(); return;
      }
      if (k === "ArrowLeft") Z.dreh += 0.08;
      else if (k === "ArrowRight") Z.dreh -= 0.08;
      else if (k === "ArrowUp") Z.hoehe = begrenzeHoehe(Z.hoehe + 0.06);
      else if (k === "ArrowDown") Z.hoehe = begrenzeHoehe(Z.hoehe - 0.06);
      else if (k === "+" || k === "=") zoom(1 / 1.15);
      else if (k === "-" || k === "_") zoom(1.15);
      else if (k === "PageDown") fliege((Z.ansicht + 1) % ANSICHTEN.length);
      else if (k === "PageUp") fliege((Z.ansicht + ANSICHTEN.length - 1) % ANSICHTEN.length);
      else ok = false;
      if (ok) { ev.preventDefault(); stoppeRundflug(); eingabe(); Z.flug = null; hilfeNeu = true; }
    });

    /* ----- Größe, Sichtbarkeit, Auflösung ----- */
    var breite = 1, hoehe = 1, zielB = 0, zielH = 0;
    function zielGroessen() {
      var w = Math.max(64, Math.round(breite * dpr * Z.qual)), h = Math.max(64, Math.round(hoehe * dpr * Z.qual));
      if (w === zielB && h === zielH) return;
      zielB = w; zielH = h;
      zielHdr.setSize(w, h);
      uniforms.uAufl.value.set(w, h);
      uniforms.uPix.value = 2 * uniforms.uTanH.value / h;
      var bw = w, bh = h;
      for (var i = 0; i < runter.length; i++) {
        bw = Math.max(2, Math.round(bw / 2)); bh = Math.max(2, Math.round(bh / 2));
        runter[i].setSize(bw, bh);
        if (i < hoch.length) hoch[i].setSize(bw, bh);
      }
    }
    function groesseAnpassen() {
      breite = Math.max(1, buehne.clientWidth); hoehe = Math.max(1, buehne.clientHeight);
      renderer.setSize(breite, hoehe);
      svg.setAttribute("viewBox", "0 0 " + breite + " " + hoehe);
      Object.keys(SCH).forEach(function (k) { SCH[k].zuKurz = false; });
      zielGroessen();
      hilfeNeu = true;
    }
    groesseAnpassen();
    if (window.ResizeObserver) new ResizeObserver(groesseAnpassen).observe(buehne);
    else window.addEventListener("resize", groesseAnpassen);
    if (window.IntersectionObserver) new IntersectionObserver(function (e) { Z.sichtbar = e[0].isIntersecting; }).observe(buehne);

    /* Bildrate messen und Auflösung anpassen (je 40 Bilder) */
    var messung = { n: 0, summe: 0 };
    function messe(dtMs) {
      if (dtMs > 200) return;
      messung.n++; messung.summe += dtMs;
      if (messung.n < 40) return;
      var mittel = messung.summe / messung.n, alt = Z.qual;
      messung.n = 0; messung.summe = 0;
      if (mittel > 26) Z.qual = Math.max(0.35, Z.qual * 0.82);
      else if (mittel < 18.5) Z.qual = Math.min(Math.min(1.4, 2600 / (breite * dpr)), Z.qual * 1.1);   // über 1: Kantenglättung
      if (Math.abs(alt - Z.qual) > 1e-3) zielGroessen();
    }

    /* ----- Hilfslinien und Schilder ----- */
    var hilfeNeu = true, hilfeZeit = 0, hilfeStand = "";
    function setzeSchild(s, x, y) { s.an = true; s.x = x; s.y = y; }
    function zuPx(nx, ny) { return [(nx + 1) / 2 * breite, (1 - ny) / 2 * hoehe]; }
    function suche(kam, aspekt, von, nach, n, pruef, opt) {
      for (var i = 0; i <= n; i++) {
        var t = i / n, nx = von[0] + (nach[0] - von[0]) * t, ny = von[1] + (nach[1] - von[1]) * t;
        var e = verfolge(kam, aspekt, nx, ny, Z.linse, opt);
        if (pruef(e)) return [nx, ny];
      }
      return null;
    }
    function berechneHilfe(kam) {
      Object.keys(SCH).forEach(function (k) { SCH[k].an = false; });
      var aspekt = breite / hoehe, cx = breite / 2, cy = hoehe / 2, pxProTan = hoehe / 2 / TAN;
      var rS = Math.tan(schattenWinkel(Z.r)) * pxProTan, rH = Math.tan(horizontWinkel(Z.r)) * pxProTan;
      var nS = rS / (hoehe / 2);   // Schattenradius in Bildkoordinaten (y)
      kreisSchatten.setAttribute("cx", cx); kreisSchatten.setAttribute("cy", cy); kreisSchatten.setAttribute("r", rS);
      kreisHorizont.setAttribute("cx", cx); kreisHorizont.setAttribute("cy", cy); kreisHorizont.setAttribute("r", rH);
      kreisSchatten.style.display = Z.linse ? "" : "none";
      kreisHorizont.style.display = rH > 6 ? "" : "none";
      if (Z.linse) setzeSchild(SCH.schatten, cx, cy - 0.62 * rS);
      else setzeSchild(SCH.schatten, cx, cy - rH - 18);
      if (rH > 6 && Z.linse) setzeSchild(SCH.horizont, cx + rH * 0.5, cy + rH * 0.866);
      if (Z.linse && rS < hoehe * 0.45) {
        var w = -0.65;
        setzeSchild(SCH.ring, cx + rS * Math.cos(w) + 1, cy + rS * Math.sin(w) - 1);
      }
      var flach = Math.abs(Z.hoehe) < 0.75;
      if (Z.scheibe) {
        var o = { scheibe: true, max: 1 };
        if (Z.linse && flach && nS < 0.8) {
          var p = suche(kam, aspekt, [0, nS * 0.95], [0, 0.98], 70, function (e) {
            var t = e.treffer[0]; return t && t.fern && t.r > 5.5;
          }, o);
          if (p) { var q = zuPx(p[0], p[1]); setzeSchild(SCH.rueck, q[0], q[1]); }
          /* die Unterseite liegt hinter dem durchscheinenden Außenrand der
             vorderen Scheibe: darum auch den zweiten Treffer prüfen */
          p = suche(kam, aspekt, [0, -nS * 0.6], [0, -0.98], 90, function (e) {
            return e.treffer.some(function (t) { return t.fern && t.oben !== (Z.hoehe > 0) && t.r > 4.5; });
          }, { scheibe: true, max: 2 });
          if (p) { q = zuPx(p[0], p[1]); setzeSchild(SCH.unter, q[0], q[1]); }
        }
        var sx = nS * hoehe / breite;
        var pl = suche(kam, aspekt, [-sx, 0], [-0.98, 0], 70, function (e) { var t = e.treffer[0]; return t && t.r > 7; }, o);
        var pr = suche(kam, aspekt, [sx, 0], [0.98, 0], 70, function (e) { var t = e.treffer[0]; return t && t.r > 7; }, o);
        if (Z.verschiebung && pl && pr) {
          q = zuPx(pl[0], pl[1]); setzeSchild(SCH.zu, q[0], q[1]);
          q = zuPx(pr[0], pr[1]); setzeSchild(SCH.weg, q[0], q[1]);
        }
      }
      if (Z.galaxie) {
        var g = galaxieRichtung();
        var winkel = function (nx, ny) { return Math.acos(Math.max(-1, Math.min(1, dot(verfolge(kam, aspekt, nx, ny, Z.linse).richtung, g.richt)))); };
        var fehl = Math.acos(Math.max(-1, Math.min(1, dot(g.richt, norm(mul(kam.pos, -1))))));
        if (fehl < 0.3 * Math.PI / 180 && Z.linse) {
          /* Einstein-Ring: kleinster Winkel zur Galaxie entlang der Senkrechten */
          var best = null, bestW = 9;
          for (var i = 1; i <= 80; i++) {
            var ny = nS + (0.98 - nS) * i / 80, ww = winkel(0, ny);
            if (ww < bestW) { bestW = ww; best = ny; }
          }
          if (best !== null && bestW < 0.05) { q = zuPx(0, best); setzeSchild(SCH.einstein, q[0], q[1]); }
        } else {
          /* zwei Bilder: Minima des Winkels entlang der Linie durch die Mitte
             in Richtung der Galaxie (Bild 1 auf ihrer Seite, Bild 2 gegenüber) */
          var ux = dot(g.richt, kam.rechts), uy = dot(g.richt, kam.oben), ul = Math.hypot(ux, uy) || 1;
          var lx = ux / ul / (TAN * aspekt), ly = uy / ul / TAN, sk = 0.98 / Math.max(Math.abs(lx), Math.abs(ly));
          lx *= sk; ly *= sk;
          var werte = [], N = 200;
          for (i = 0; i <= N; i++) {
            var tt = -1 + 2 * i / N, e = verfolge(kam, aspekt, tt * lx, tt * ly, Z.linse);
            werte.push(e.frei ? Math.acos(Math.max(-1, Math.min(1, dot(e.richtung, g.richt)))) : 9);
          }
          var b1 = null, b2 = null;
          for (i = 1; i < N; i++) {
            if (!(werte[i] < werte[i - 1] && werte[i] <= werte[i + 1] && werte[i] < 0.08)) continue;
            var t2 = -1 + 2 * i / N;
            if (t2 > 0 && (!b1 || werte[i] < b1[1])) b1 = [t2, werte[i]];
            if (t2 < 0 && (!b2 || werte[i] < b2[1])) b2 = [t2, werte[i]];
          }
          if (b1) { q = zuPx(b1[0] * lx, b1[0] * ly); setzeSchild(SCH.bild1, q[0], q[1]); }
          if (b2 && Z.linse) { q = zuPx(b2[0] * lx, b2[0] * ly); setzeSchild(SCH.bild2, q[0], q[1]); }
        }
      }
    }
    /* Bereiche, die Infotafel und Einstellungen verdecken (Bühnen-Pixel) */
    function tafel(e) {
      if (!e.offsetParent) return null;
      var a = e.getBoundingClientRect(), b = buehne.getBoundingClientRect();
      return { l: a.left - b.left, r: a.right - b.left, o: a.top - b.top, u: a.bottom - b.top };
    }
    function zeigeSchilder() {
      var eng = breite < 640, ti = tafel(info), te = tafel(einst);
      Object.keys(SCH).forEach(function (k) {
        var s = SCH[k], text = eng || s.zuKurz ? s.kurz : s.lang, an = s.an && Z.hilfe && text !== "";
        s.el.style.visibility = an ? "visible" : "hidden";
        if (!an) return;
        if (s.text.textContent !== text) { s.text.textContent = text; s.breite = 0; }
        s.el.style.transform = "translate(" + s.x.toFixed(1) + "px," + s.y.toFixed(1) + "px)";
        if (/ohne-punkt/.test(s.el.className)) return;
        var w = s.breite || (s.breite = s.text.offsetWidth + 18);
        var grenzeL = 4, grenzeR = breite - 4;
        if (ti && s.y > ti.o - 12 && s.y < ti.u + 12 && s.x > ti.r) grenzeL = ti.r + 4;
        if (te && s.y > te.o - 12 && s.y < te.u + 12 && s.x < te.l) grenzeR = te.l - 4;
        var passtR = s.x + w < grenzeR, passtL = s.x - w > grenzeL;
        if (!passtR && !passtL && !s.zuKurz && s.kurz !== s.lang) s.zuKurz = true;   // passt nirgends: Kurztext
        var links = s.links ? passtL || !passtR : !passtR && passtL;
        s.el.classList.toggle("links", links);
      });
      hilfeEbene.classList.toggle("an", Z.hilfe);
    }

    /* Galaxie: fest im Raum. Ihre Lage merkt sich galBasisAus (genau hinter
       dem Loch, von einer Kamera aus gesehen); der Regler dreht sie seitlich */
    function galBasisAus(kam) { Z.galBasis = { hinten: norm(mul(kam.pos, -1)), rechts: kam.rechts, oben: kam.oben }; }
    function galaxieRichtung() {
      if (!Z.galBasis) galBasisAus(kameraAus(Z.r, Z.hoehe, Z.dreh));
      var b = Z.galBasis, a = Z.versatz * Math.PI / 180;
      var richt = norm(add(mul(b.hinten, Math.cos(a)), mul(b.rechts, Math.sin(a))));
      var e1 = norm(cross(b.oben, richt)), e2 = cross(richt, e1);
      return { richt: richt, e1: e1, e2: e2 };
    }

    /* ----- Anzeige unten links ----- */
    var altAnzeige = "";
    function aktualisiereAnzeige() {
      var grad = Math.round(Z.hoehe * 180 / Math.PI);
      var lage = grad === 0 ? "genau in der Ebene der Scheibe" : Math.abs(grad) + "° " + (grad > 0 ? "über" : "unter") + " der Scheibe";
      if (!Z.scheibe) lage = "";
      var m = F.MASSEN[Z.fall.masse], km = Z.r * RS_KM_SONNE * m.M, sgr;
      if (km < 1e6) sgr = tausender(km) + " km";
      else if (km < 1e9) sgr = tausender(km / 1e6) + " Mio. km";
      else if (km < 1e12) sgr = tausender(km / 1e9) + " Mrd. km";
      else sgr = zahl(km / 9.461e12, 2) + " Lichtjahre";
      var html = "Abstand " + (Z.r < 10 ? zahl(Z.r, 1) : Math.round(Z.r)) + " r<sub>s</sub>" + (lage ? " · " + lage : "") +
        "|bei " + (m.id === "stellar" ? "10 Sonnenmassen" : m.name) + ": " + sgr;
      if (html !== altAnzeige) {
        altAnzeige = html;
        var t = html.split("|");
        abstandText.innerHTML = t[0];
        sgrText.textContent = t[1];
      }
    }

    /* ----- Hineinfallen: Körpertafel und Werte ----- */
    var fallText = { zeit: 0 };
    function setze(e, html) { if (e._html !== html) { e._html = html; e.innerHTML = html; } }
    function zeigeFall(t, dt) {
      var tab = fallTabelle(), z = tab.zustand(Z.fall.r), m = F.MASSEN[Z.fall.masse];
      if (!U.wenigBewegung) Z.fall.drehung += dt * 0.35;
      var mass = koerper ? koerper.zeige(z, Z.fall.drehung) : null;
      if (mass) {
        koerperMass.style.height = mass.px.toFixed(1) + "px";
        setze(koerperMassText, (mass.meter >= 1 ? F.zahlHtml(mass.meter) : String(+mass.meter.toPrecision(1)).replace(".", ",")) + "&nbsp;m");
      }
      if (!Z.fall.zieht) fallRegler.value = String(Math.round(1000 * (Math.log(Z.fall.r) - LN_A) / (LN_B - LN_A)));
      if (t - fallText.zeit < 90) return;
      fallText.zeit = t;
      var amEnde = Z.fall.r <= F.R_ENDE + 1e-6;
      setze(wAbstand, F.zahlHtml(z.r) + "&nbsp;r<sub>s</sub> = " + F.zahlHtml(z.km) + "&nbsp;km");
      setze(wTempo, Math.round(z.beta * 100) + "&nbsp;% der Lichtgeschw.");
      setze(wGezeit, z.stufe ? "zerrissen" : F.zahlHtml(z.deltaG) + "&nbsp;g Unterschied");
      setze(wUhr, F.zeit(z.tau));
      setze(wFern, amEnde ? "läuft ewig weiter" : F.zeit(z.fern));
      var st;
      if (z.stufe === 2) st = "Spaghettifizierung: Auch die Einzelteile reißen und werden zu langen, dünnen Fäden gezogen, längs gedehnt und quer gestaucht.";
      else if (z.stufe === 1) st = "Dein Körper reißt. Die Teile fliegen frei weiter: Was näher am Loch ist, fällt schneller.";
      else if (amEnde) st = "Du überquerst den Horizont und spürst nichts Besonderes. Zerrissen wirst du erst " + F.zeit(tab.nachHorizont) + " später, weit innen.";
      else if (z.deltaG < 0.01) st = "Du spürst nichts: Im freien Fall bist du schwerelos.";
      else if (z.deltaG < 0.3) st = "Ein leichtes Ziehen an Kopf und Füßen.";
      else if (z.deltaG < 3) st = "Unangenehm: als hinge ein schweres Gewicht an deinen Füßen.";
      else st = "Lebensgefährlich: Kopf und Füße werden mit " + F.zahlHtml(Math.round(z.zugKg)) + "&nbsp;kg Zug auseinandergezogen.";
      if (amEnde && z.stufe) st += " Die Reste erreichen den Horizont.";
      setze(koerperStatus, st);
      koerperTafel.classList.toggle("gefahr", z.stufe > 0 || z.deltaG >= 3);
    }

    /* ----- Hauptschleife ----- */
    var tAlt = performance.now();
    function bild(t) {
      requestAnimationFrame(bild);
      /* der erste Zeitstempel kann vor dem Start liegen: nie negativ */
      var dtMs = Math.max(0, t - tAlt), dt = Math.min(0.05, dtMs / 1000);
      tAlt = t;
      if (!Z.sichtbar || document.hidden) return;
      messe(dtMs);

      var imFall = fallModus();
      if (imFall && Z.fall.laeuft) {
        /* Zeitraffer: gleichmäßig in ln r, am Ende etwas langsamer */
        var lr = Math.log(Z.fall.r);
        Z.fall.r = Math.exp(lr - dt * 0.24 * (0.4 + 0.6 * Math.min(1, lr / 3)));
        if (Z.fall.r <= F.R_ENDE) { Z.fall.r = F.R_ENDE; Z.fall.laeuft = false; fallKnoepfe(); }
      }
      if (imFall) {
        /* nichts weiter: die Kamera folgt dem Fall */
      } else if (Z.flug) {
        var p = Math.min(1, (t - Z.flug.start) / Z.flug.dauer);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        var f = Z.flug;
        Z.r = Math.exp(Math.log(f.von.r) + (Math.log(f.nach.r) - Math.log(f.von.r)) * e);
        Z.hoehe = f.von.hoehe + (f.nach.hoehe - f.von.hoehe) * e;
        Z.dreh = f.von.dreh + (f.nach.dreh - f.von.dreh) * e;
        hilfeNeu = true;
        if (p >= 1) Z.flug = null;
      } else if (!ziehen) {
        Z.dreh += Z.drehV * dt; Z.drehV *= Math.exp(-dt * 3);
        if (!U.wenigBewegung && !Z.galaxie && t - Z.letzteEingabe > 6000) Z.dreh += dt * 0.025;
      }
      if (!U.wenigBewegung) Z.zeit += dt * ZEITFAKTOR;

      var kam = imFall ? fallKamera(Z.fall.r, Z.fall.gier, Z.fall.nick) : kameraAus(Z.r, Z.hoehe, Z.dreh);
      /* Geschwindigkeit der Kamera gegenüber ruhenden Beobachtern */
      var beta = imFall && Z.linse ? Math.sqrt(1 / Z.fall.r) : 0, gamma = 1 / Math.sqrt(1 - beta * beta);
      uniforms.uBeta.value.set(-FALL_N[0] * beta, -FALL_N[1] * beta, -FALL_N[2] * beta);
      uniforms.uGamma.value = gamma;
      uniforms.uKamPos.value.fromArray(kam.pos);
      uniforms.uKamR.value.fromArray(kam.rechts);
      uniforms.uKamO.value.fromArray(kam.oben);
      uniforms.uKamV.value.fromArray(kam.vor);
      uniforms.uZeit.value = Z.zeit;
      uniforms.uScheibe.value = Z.scheibe ? 1 : 0;
      uniforms.uLinse.value = Z.linse ? 1 : 0;
      uniforms.uVerschiebung.value = Z.verschiebung ? 1 : 0;
      uniforms.uTemp.value = Z.temp;
      uniforms.uGalaxie.value = Z.galaxie ? 1 : 0;
      /* Belichtung: ohne Scheibe etwas heller; beim Hineinfallen wie eine
         Kamera mit Belichtungsautomatik, weil vorn alles blauverschoben ist */
      var bel = Z.scheibe ? 1.0 : 1.15;
      if (imFall) {
        if (messZaehler++ % 10 === 0) {
          /* hellste 25 % des Messbilds sollen etwa bei 0,9 liegen */
          var aA = uniforms.uAufl.value.clone(), aP = uniforms.uPix.value;
          uniforms.uAufl.value.set(MESS_B, MESS_H); uniforms.uPix.value = 2 * uniforms.uTanH.value / MESS_H;
          uniforms.uMessen.value = 1;
          zeichne(rayMat, messZiel);
          uniforms.uMessen.value = 0; uniforms.uAufl.value.copy(aA); uniforms.uPix.value = aP;
          renderer.readRenderTargetPixels(messZiel, 0, 0, MESS_B, MESS_H, messPuffer);
          var lw = [];
          for (var mi = 0; mi < MESS_B * MESS_H; mi++) lw.push(messPuffer[mi * 4]);
          lw.sort(function (a, b) { return b - a; });
          var summe = 0, nOben = Math.round(lw.length / 4);
          for (mi = 0; mi < nOben; mi++) summe += lw[mi];
          var hell = Math.pow(2, summe / nOben / 255 * 24 - 16);
          var erstes = !Z.belZiel;
          Z.belZiel = Math.max(0.01, Math.min(2.5, 0.55 / Math.max(hell, 1e-4)));
          if (erstes) Z.autoBel = Z.belZiel;
        }
        Z.autoBel *= Math.pow((Z.belZiel || 1) / Z.autoBel, Math.min(1, dt * 3));
        bel = Z.autoBel;
      }
      if (imFall) endMat.uniforms.uBelichtung.value = bel;
      else endMat.uniforms.uBelichtung.value += (bel - endMat.uniforms.uBelichtung.value) * Math.min(1, 1 - Math.exp(-dt * 4));
      uniforms.uBelichtung.value = endMat.uniforms.uBelichtung.value;
      if (Z.galaxie) {
        var g = galaxieRichtung();
        uniforms.uGalRicht.value.fromArray(g.richt);
        uniforms.uGalE1.value.fromArray(g.e1);
        uniforms.uGalE2.value.fromArray(g.e2);
      }

      /* Raytracing → HDR-Bild → Bloom → Bildschirm */
      zeichne(rayMat, zielHdr);
      if (hdr) {
        var quelle = zielHdr;
        for (var i = 0; i < runter.length; i++) {
          runterMat.uniforms.tQuelle.value = quelle.texture;
          runterMat.uniforms.uTexel.value.set(1 / quelle.width, 1 / quelle.height);
          runterMat.uniforms.uErste.value = i === 0 ? 1 : 0;
          zeichne(runterMat, runter[i]);
          quelle = runter[i];
        }
        var klein = runter[runter.length - 1];
        for (i = hoch.length - 1; i >= 0; i--) {
          hochMat.uniforms.tKlein.value = klein.texture;
          hochMat.uniforms.tHier.value = runter[i].texture;
          hochMat.uniforms.uTexel.value.set(0.5 / klein.width, 0.5 / klein.height);
          zeichne(hochMat, hoch[i]);
          klein = hoch[i];
        }
        endMat.uniforms.tBloom.value = hoch[0].texture;
      }
      zeichne(endMat, null);

      /* Beschriftungen: nur neu rechnen, wenn sich Blick oder Abstand
         geändert haben (die Drehung um die Achse ändert das Bild nicht) */
      if (imFall) { zeigeFall(t, dt); return; }
      var stand = [Z.r.toFixed(2), Z.hoehe.toFixed(3), Z.scheibe, Z.linse, Z.galaxie, Z.versatz, Z.verschiebung, breite, hoehe,
        Z.galBasis ? Z.galBasis.hinten.join() : ""].join("|");
      if (Z.hilfe && (hilfeNeu || stand !== hilfeStand) && t - hilfeZeit > 180) {
        hilfeStand = stand; hilfeNeu = false; hilfeZeit = t;
        berechneHilfe(kam);
      }
      zeigeSchilder();
      aktualisiereAnzeige();
    }

    /* Startansicht aus der Adresse (#scheibe, #linse …) */
    var erste = 0, hash = (location.hash || "").slice(1);
    ANSICHTEN.forEach(function (a, i) { if (a.id === hash) erste = i; });
    fliege(erste, true);
    aktualisiereSchalter();
    requestAnimationFrame(bild);
    buehne._loch = { Z: Z, hdr: hdr, uniforms: uniforms, ende: endMat.uniforms };   // für Tests (Konsole)
  }

  document.addEventListener("DOMContentLoaded", function () {
    var b = document.querySelector('[data-universum="schwarzes-loch"]');
    if (b) start(b);
  });
})();
