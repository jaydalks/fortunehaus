(function () {
  'use strict';

  /* ─────────────────────────────────────────────────
     FORTUNE HAUS — HERO MESH GRADIENT SHADER
     Vanilla WebGL port of @paper-design/shaders-react MeshGradient
     Brand palette: Espresso #3C2415 · Pale Oak #DDD9CE · Black #000
  ───────────────────────────────────────────────── */

  var canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  var gl = canvas.getContext('webgl', { alpha: false, antialias: false }) ||
           canvas.getContext('experimental-webgl', { alpha: false, antialias: false });

  if (!gl) {
    // WebGL unavailable — hero CSS background-color takes over gracefully
    canvas.style.display = 'none';
    return;
  }

  /* ── Shaders ── */

  var VS = [
    'attribute vec2 a_pos;',
    'void main() {',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FS = [
    'precision highp float;',
    'uniform float u_time;',
    'uniform vec2  u_res;',

    /* ── Gradient noise helpers ── */
    'vec2 hash2(vec2 p) {',
    '  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));',
    '  return -1.0 + 2.0 * fract(sin(p) * 43758.5453);',
    '}',

    'float gnoise(vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  float a = dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0));',
    '  float b = dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));',
    '  float c = dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));',
    '  float d = dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));',
    '  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y) * 0.7 + 0.5;',
    '}',

    /* ── Fractional Brownian Motion — 5 octaves ── */
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  float a = 0.5;',
    '  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);', /* slight rotation per octave */
    '  for (int i = 0; i < 5; i++) {',
    '    v += a * gnoise(p);',
    '    p = rot * p * 2.1;',
    '    a *= 0.48;',
    '  }',
    '  return v;',
    '}',

    /* ── Brand palette ── */
    /* Espresso #3C2415 */ 'vec3 C_ESP  = vec3(0.235, 0.141, 0.082);',
    /* Espresso mid     */ 'vec3 C_MID  = vec3(0.360, 0.224, 0.132);',
    /* Espresso warm    */ 'vec3 C_WARM = vec3(0.490, 0.318, 0.196);',
    /* Near-black       */ 'vec3 C_DARK = vec3(0.040, 0.024, 0.012);',
    /* Pale oak         */ 'vec3 C_OAK  = vec3(0.863, 0.851, 0.808);',

    'void main() {',
    '  vec2 uv = gl_FragCoord.xy / u_res;',

    /* Correct for non-square aspect */
    '  float aspect = u_res.x / u_res.y;',
    '  vec2 p = vec2(uv.x * aspect, uv.y);',

    '  float t = u_time * 0.055;',  /* slow, meditative speed */

    /* Layer 1 — coarse domain warp */
    '  vec2 q = vec2(',
    '    fbm(p * 1.6 + vec2(0.00, 0.00) + t),',
    '    fbm(p * 1.6 + vec2(5.20, 1.30) + t * 0.85)',
    '  );',

    /* Layer 2 — finer warp driven by q */
    '  vec2 r = vec2(',
    '    fbm(p * 2.2 + 1.4 * q + vec2(1.70, 9.20) + t * 1.1),',
    '    fbm(p * 2.2 + 1.4 * q + vec2(8.30, 2.80) + t * 0.90)',
    '  );',

    /* Final value field */
    '  float f = fbm(p * 1.8 + 2.2 * r + t * 0.4);',
    '  f = clamp(f, 0.0, 1.0);',

    /* ── Color ramp — dark to warm espresso ── */
    '  vec3 col = C_DARK;',
    '  col = mix(col, C_ESP,  smoothstep(0.10, 0.42, f));',
    '  col = mix(col, C_MID,  smoothstep(0.36, 0.66, f));',
    '  col = mix(col, C_WARM, smoothstep(0.58, 0.88, f));',

    /* Subtle pale-oak breath — keeps warmth without washing out */
    '  float breath = fbm(p * 0.9 - t * 0.3);',
    '  col = mix(col, C_OAK * 0.35, smoothstep(0.7, 1.0, f) * smoothstep(0.6, 1.0, breath) * 0.18);',

    /* Warm focal glow — top-centre, bleeds down */
    '  float cx = 1.0 - abs(uv.x - 0.5) * 2.2;',
    '  float cy = smoothstep(0.9, 0.0, uv.y);',
    '  col += C_MID * max(0.0, cx) * cy * 0.22;',

    /* Vignette — pulls corners to near-black */
    '  vec2 vig = uv * 2.0 - 1.0;',
    '  float v = 1.0 - dot(vig * vec2(0.45, 0.55), vig * vec2(0.45, 0.55));',
    '  col *= pow(max(0.0, v), 0.38) * 0.35 + 0.65;',

    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  /* ── Compile helper ── */
  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('Fortune Haus shader compile error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  var vs = compile(gl.VERTEX_SHADER, VS);
  var fs = compile(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) { canvas.style.display = 'none'; return; }

  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('Fortune Haus shader link error:', gl.getProgramInfoLog(prog));
    canvas.style.display = 'none';
    return;
  }
  gl.useProgram(prog);

  /* ── Fullscreen quad ── */
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
    gl.STATIC_DRAW);

  var aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var uTime = gl.getUniformLocation(prog, 'u_time');
  var uRes  = gl.getUniformLocation(prog, 'u_res');

  /* ── Resize ── */
  function resize() {
    var w = canvas.parentElement.offsetWidth  || window.innerWidth;
    var h = canvas.parentElement.offsetHeight || window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2); /* cap at 2× for perf */
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Render loop ── */
  var start = performance.now();
  var raf;

  function render() {
    var t = (performance.now() - start) * 0.001;
    gl.uniform1f(uTime, t);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(render);
  }

  /* Pause when tab is hidden to save GPU */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(raf);
    } else {
      start = performance.now() - (raf || 0); /* resume smoothly */
      render();
    }
  });

  render();

}());
