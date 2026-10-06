// Calcciopoli · jugadores ilustrados.
// Cada cuadro se pinta grande, como una ilustración (siluetas con músculo,
// sombreado en bandas duras, pliegues), se reduce a píxeles con una paleta
// corta y después se terminan a mano los detalles finos píxel por píxel
// (ojos, cejas, boca, números, escudo, tapones).
const P4 = (() => {
  // ---------- color ----------
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const hex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); };
  const sh = (h, f) => { const [r, g, b] = rgb(h); return hex(r * f, g * f, b * f); };
  const lum = (h) => { const [r, g, b] = rgb(h); return 0.299 * r + 0.587 * g + 0.114 * b; };
  // 0 muy oscuro · 1 sombra · 2 base · 3 luz · 4 brillo (sombras hacia violeta, luces hacia crema)
  const ramp = (c) => {
    const L = lum(c) / 255;
    return [mix(sh(c, 0.4 + L * 0.12), '#24142e', 0.35), mix(sh(c, 0.7 + L * 0.06), '#38244a', 0.16), c, mix(c, '#fff3dc', 0.26), mix(c, '#fffaf0', 0.52)];
  };
  const skinRamp = (c) => [mix(sh(c, 0.48), '#45182a', 0.32), mix(sh(c, 0.76), '#7a2e3c', 0.16), c, mix(c, '#ffe6cc', 0.3), mix(c, '#fff3e6', 0.5)];
  const LIGHT = [-0.55, -0.83];

  // ---------- geometría ----------
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const dirv = (ang) => [Math.sin(ang), Math.cos(ang)]; // 0 = hacia abajo, + = hacia adelante (derecha)
  const STY = { fat: 1, small: false };
  function limbPoly(A, B, wA, wB, bumps = []) {
    wA *= STY.fat; wB *= STY.fat;
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L, ny = dx / L;
    const left = [], right = [];
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      let wl = (wA + (wB - wA) * t) / 2, wr = wl;
      for (const b of bumps) {
        const k = Math.exp(-((t - b.t) ** 2) / (2 * (b.s || 0.13) ** 2)) * b.w * STY.fat;
        if (b.side > 0) wr += k; else wl += k;
      }
      const cx = A[0] + dx * t, cy = A[1] + dy * t;
      left.push([cx + nx * wl, cy + ny * wl]);
      right.push([cx - nx * wr, cy - ny * wr]);
    }
    return [...left, ...right.reverse()];
  }
  function smoothPath(g, pts) {
    g.beginPath();
    const n = pts.length, mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const m = mid(pts[n - 1], pts[0]);
    g.moveTo(m[0], m[1]);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n], mm = mid(p, q); g.quadraticCurveTo(p[0], p[1], mm[0], mm[1]); }
    g.closePath();
  }
  // Sombreado cilíndrico en bandas duras respecto del eje A→B.
  function shade(g, shapeFn, A, B, width, rp, o = {}) {
    const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1;
    let nx = -dy / L, ny = dx / L;
    if (nx * LIGHT[0] + ny * LIGHT[1] < 0) { nx = -nx; ny = -ny; }
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2, w = width / 2 + 2;
    g.save();
    shapeFn(); g.clip();
    const gr = g.createLinearGradient(mx + nx * w, my + ny * w, mx - nx * w, my - ny * w);
    const lit = o.lit ?? 0.36;
    const a1 = Math.max(0.06, lit - 0.2), a2 = Math.min(0.88, lit + 0.32);
    const hiT = o.shine ? Math.max(0.02, a1 - 0.1) : 0;
    if (o.shine) { gr.addColorStop(0, rp[4]); gr.addColorStop(hiT, rp[4]); gr.addColorStop(hiT + 0.001, rp[3]); } else gr.addColorStop(0, rp[3]);
    gr.addColorStop(a1, rp[3]); gr.addColorStop(a1 + 0.001, rp[2]);
    gr.addColorStop(a2, rp[2]); gr.addColorStop(a2 + 0.001, rp[1]);
    if (o.deep) { gr.addColorStop(0.9, rp[1]); gr.addColorStop(0.901, rp[0]); gr.addColorStop(1, rp[0]); } else gr.addColorStop(1, rp[1]);
    g.fillStyle = gr;
    g.fillRect(-3000, -3000, 8000, 8000);
    if (o.endShade) {
      const g2 = g.createLinearGradient(A[0], A[1], B[0], B[1]);
      g2.addColorStop(0, 'rgba(0,0,0,0)'); g2.addColorStop(o.endAt || 0.72, 'rgba(0,0,0,0)'); g2.addColorStop((o.endAt || 0.72) + 0.001, o.endShade); g2.addColorStop(1, o.endShade);
      g.fillStyle = g2; g.fillRect(-3000, -3000, 8000, 8000);
    }
    g.restore();
  }
  function stroke(g, pts, color, w) {
    g.strokeStyle = color; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round';
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.stroke();
  }

  // ---------- poses ----------
  // Medidas de la ilustración (unidades grandes; la figura mide ~860).
  const M = { torso: 285, neck: 50, head: 62, thigh: 222, shin: 212, upper: 158, fore: 150, foot: 74 };
  const GROUND = 1130;

  // De lado (mirando a la derecha). legs/arms: [lejana, cercana].
  // legs: { a: ángulo del muslo (0 abajo, + adelante), k: flexión de rodilla, f: inclinación del pie }
  // arms: { a: ángulo del brazo, e: flexión del codo }
  function sidePose(p) {
    const lean = p.lean || 0, tw = p.twist ?? 0.35;
    let H0 = [500 + (p.dx || 0), 670];
    const up = dirv(Math.PI - lean); // hacia arriba del torso
    const fw = [Math.cos(lean), Math.sin(lean)]; // hacia adelante del torso
    const N = add(H0, up, M.torso);
    const legs = p.legs.map((L, i) => {
      const hip = add(H0, fw, i ? 34 : -30);
      const knee = add(hip, dirv(L.a), M.thigh);
      const ankle = add(knee, dirv(L.a - L.k), M.shin);
      const fa = (L.a - L.k) + Math.PI / 2 - (L.p || 0);
      const toe = add(ankle, [Math.sin(fa), Math.cos(fa)], M.foot);
      return { hip, knee, ankle, toe, far: !i };
    });
    // apoyo en el piso (salvo que esté en el aire)
    const low = Math.max(...legs.flatMap((l) => [l.ankle[1] + 26, l.toe[1] + 16]));
    const dy = (p.air ? -(p.air || 0) : GROUND - low) - (p.lift || 0);
    const sh = (q) => [q[0], q[1] + dy];
    H0 = sh(H0);
    const NN = sh(N);
    legs.forEach((l) => { l.hip = sh(l.hip); l.knee = sh(l.knee); l.ankle = sh(l.ankle); l.toe = sh(l.toe); });
    const arms = p.arms.map((A, i) => {
      const s = add(add(NN, fw, i ? 74 : -84), up, i ? -52 : -44);
      const el = add(s, dirv(A.a), M.upper);
      const ha = add(el, dirv(A.a + (A.e || 0)), M.fore);
      return { sh: s, el, ha, far: !i, fist: A.fist ?? 0 };
    });
    const ht = p.headTilt || 0;
    const head = add(NN, dirv(Math.PI - lean * 0.6 - ht), M.neck + M.head * 0.78);
    // contorno del torso: espalda y pecho
    const P = (base, f, u) => add(add(base, fw, f), up, u);
    // marcas con nombre (en 3/4: espalda a la izquierda, pecho a la derecha)
    const mk = {
      nl: P(NN, -32, 2), nr: P(NN, 30, -2),
      shl: P(NN, -106, -40), shr: P(NN, 96, -40), shl2: P(NN, -84, -16), shr2: P(NN, 76, -14),
      al: P(NN, -108, -96), ar: P(NN, 94, -110), ml: P(NN, -96, -170), mr: P(NN, 82, -170),
      wl: P(H0, -88, 40), wr: P(H0, 72, 40), hl: P(H0, -96, -12), hr: P(H0, 86, -12),
      sw: [P(H0, -96, 34), P(H0, -100, -70), P(H0, 96, -70), P(H0, 92, 34)],
      crest: P(NN, 46, -84),
      folds: [[P(NN, -60, -104), P(NN, -26, -166), P(NN, -14, -236)], [P(NN, 50, -150), P(NN, 26, -214)]],
      lights: [[P(NN, -37, -78), P(NN, -11, -128)], [P(NN, -55, -158), P(NN, -43, -198)]],
    };
    const torso = [mk.nl, mk.shl2, mk.shl, mk.al, mk.ml, mk.wl, mk.hl, mk.hr, mk.wr, mk.mr, mk.ar, mk.shr, mk.shr2, mk.nr];
    const pose = { view: 'side', lean, H0, N: NN, up, fw, legs, arms, head, torso, mk, tw, facing: 1 };
    // giro de todo el cuerpo (caído, barrida): se gira el esqueleto y se apoya en el piso
    if (p.rot) {
      rotatePose(pose, p.rot, lerp2(NN, H0, 0.5));
      const pts = [pose.head, pose.N, pose.H0, ...pose.legs.flatMap((l) => [l.knee, l.ankle, l.toe]), ...pose.arms.flatMap((A) => [A.el, A.ha])];
      const lowY = Math.max(...pts.map((q) => q[1])) + 30;
      movePose(pose, [0, GROUND - lowY]);
    }
    return pose;
  }

  // De frente (el arquero). legs: { a: apertura (+ hacia afuera), k: flexión (rodillas afuera) }
  // arms: { a: ángulo desde abajo hacia afuera/arriba, e: codo }
  function frontPose(p) {
    let H0 = [500, 670];
    const lean = p.tilt || 0;
    const legs = p.legs.map((L, i) => {
      const s = i ? 1 : -1;
      const hip = [H0[0] + s * 62, H0[1]];
      // f: muslo hacia la cámara; se acorta en perspectiva
      const f = L.f ?? L.k * 0.55;
      const knee = add(hip, [Math.sin(s * L.a) * M.thigh, Math.cos(s * L.a) * M.thigh * Math.cos(f)]);
      const sa = s * (L.a - (L.f == null ? L.k * 0.35 : 0));
      const ankle = add(knee, [Math.sin(sa) * M.shin, Math.cos(sa) * M.shin * Math.cos(f - L.k)]);
      const toe = add(ankle, L.f == null ? [s * 30, 20] : [s * 8, 14 + 16 * Math.cos(f - L.k)], 1);
      return { hip, knee, ankle, toe, side: s };
    });
    const low = Math.max(...legs.map((l) => l.ankle[1] + 40));
    const dy = (p.air != null ? -p.air : GROUND - low) - (p.lift || 0);
    const sh = (q) => [q[0], q[1] + dy];
    H0 = sh(H0);
    legs.forEach((l) => { l.hip = sh(l.hip); l.knee = sh(l.knee); l.ankle = sh(l.ankle); l.toe = sh(l.toe); });
    const N = [H0[0], H0[1] - M.torso];
    const arms = p.arms.map((A, i) => {
      const s = i ? 1 : -1;
      const sh0 = [N[0] + s * 92, N[1] + 46];
      const f = A.f || 0, ef = A.ef || 0;
      const el = add(sh0, [s * Math.sin(A.a) * M.upper, Math.cos(A.a) * M.upper * Math.cos(f)]);
      const a2 = A.a + (A.e || 0);
      const ha = add(el, [s * Math.sin(a2) * M.fore, Math.cos(a2) * M.fore * Math.cos(f + ef)]);
      return { sh: sh0, el, ha, side: s };
    });
    const head = [N[0], N[1] - M.neck - M.head * 0.75];
    const Q = (x, y) => [N[0] + x, N[1] + y];
    const mk = {
      nl: Q(-34, 2), nr: Q(34, 2), shl: Q(-90, 26), shr: Q(90, 26), shl2: Q(-62, 10), shr2: Q(62, 10),
      al: Q(-100, 80), ar: Q(100, 80), ml: Q(-86, 160), mr: Q(86, 160),
      wl: [H0[0] - 78, H0[1] - 40], wr: [H0[0] + 78, H0[1] - 40], hl: [H0[0] - 88, H0[1] + 22], hr: [H0[0] + 88, H0[1] + 22],
      sw: [[H0[0] - 92, H0[1] - 36], [H0[0] - 98, H0[1] + 60], [H0[0] + 98, H0[1] + 60], [H0[0] + 92, H0[1] - 36]],
      crest: Q(40, 70),
      folds: [[Q(-60, 90), Q(-30, 170), Q(-24, 230)], [Q(60, 90), Q(30, 170), Q(24, 230)], [Q(-10, 200), Q(10, 250)]],
      lights: [[Q(-50, 60), Q(-30, 120)], [Q(40, 120), Q(50, 170)]],
    };
    const torso = [mk.nl, mk.shl2, mk.shl, mk.al, mk.ml, mk.wl, mk.hl, mk.hr, mk.wr, mk.mr, mk.ar, mk.shr, mk.shr2, mk.nr];
    const pose = { view: 'front', H0, N, legs, arms, head, torso, mk, lean, armsUp: arms.every((A) => A.ha[1] < N[1]) };
    // giro de todo el cuerpo (estirada del arquero): se gira el esqueleto, no la imagen
    if (p.rot) {
      const pv = [H0[0], H0[1] - 140];
      rotatePose(pose, p.rot, pv);
      const off = [W / 2 - pv[0], 660 - pv[1]];
      movePose(pose, off);
    }
    return pose;
  }
  const mapMk = (m, f) => { const o = {}; for (const k in m) o[k] = typeof m[k][0] === 'number' ? f(m[k]) : m[k].map((q) => (typeof q[0] === 'number' ? f(q) : q.map(f))); return o; };
  function movePose(pose, o) {
    const T = (q) => [q[0] + o[0], q[1] + o[1]];
    pose.H0 = T(pose.H0); pose.N = T(pose.N); pose.head = T(pose.head);
    pose.torso = pose.torso.map(T); pose.mk = mapMk(pose.mk, T);
    pose.legs.forEach((l) => { l.hip = T(l.hip); l.knee = T(l.knee); l.ankle = T(l.ankle); l.toe = T(l.toe); });
    pose.arms.forEach((A) => { A.sh = T(A.sh); A.el = T(A.el); A.ha = T(A.ha); });
  }
  function rotatePose(pose, a, c) {
    const R = (q) => { const x = q[0] - c[0], y = q[1] - c[1]; return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)]; };
    pose.H0 = R(pose.H0); pose.N = R(pose.N); pose.head = R(pose.head);
    pose.torso = pose.torso.map(R); pose.mk = mapMk(pose.mk, R);
    pose.legs.forEach((l) => { l.hip = R(l.hip); l.knee = R(l.knee); l.ankle = R(l.ankle); l.toe = R(l.toe); });
    pose.arms.forEach((A) => { A.sh = R(A.sh); A.el = R(A.el); A.ha = R(A.ha); });
    pose.rot = a;
  }

  // ---------- peinados (coordenadas en radios de cabeza; de lado mira a la derecha) ----------
  const HAIR = {
    back: {
      short: [[-1.0, 0.3], [-1.08, -0.4], [-0.78, -0.98], [0, -1.16], [0.78, -0.98], [1.08, -0.4], [1.0, 0.3], [0.6, 0.5], [0, 0.56], [-0.6, 0.5]],
      curly: [[-1.12, 0.3], [-1.22, -0.44], [-0.88, -1.12], [0, -1.32], [0.88, -1.12], [1.22, -0.44], [1.12, 0.3], [0.6, 0.56], [0, 0.62], [-0.6, 0.56]],
      long: [[-1.1, 1.4], [-1.14, -0.4], [-0.78, -0.98], [0, -1.16], [0.78, -0.98], [1.14, -0.4], [1.1, 1.4], [0, 1.5]],
    },
    side: {
      short: [[-0.98, 0.12], [-1.06, -0.36], [-0.82, -0.86], [-0.28, -1.13], [0.36, -1.08], [0.8, -0.74], [0.95, -0.42], [0.66, -0.5], [0.3, -0.5], [0.0, -0.36], [-0.32, -0.06], [-0.56, 0.26]],
      fringe: [[-0.98, 0.12], [-1.08, -0.4], [-0.84, -0.9], [-0.3, -1.16], [0.4, -1.1], [0.86, -0.78], [1.02, -0.3], [0.8, -0.38], [0.66, -0.18], [0.48, -0.32], [0.18, -0.3], [-0.12, -0.24], [-0.36, 0.0], [-0.56, 0.28]],
      curly: [[-1.06, 0.2], [-1.2, -0.3], [-1.04, -0.92], [-0.42, -1.3], [0.34, -1.26], [0.9, -0.92], [1.06, -0.46], [0.74, -0.5], [0.36, -0.52], [0.02, -0.38], [-0.3, -0.04], [-0.58, 0.32]],
      long: [[-0.82, 1.5], [-1.12, 0.6], [-1.08, -0.4], [-0.82, -0.9], [-0.28, -1.13], [0.38, -1.08], [0.82, -0.72], [0.95, -0.4], [0.64, -0.48], [0.28, -0.46], [0.0, -0.3], [-0.3, 0.1], [-0.4, 0.8], [-0.46, 1.36]],
      buzz: [[-0.96, 0.0], [-1.02, -0.4], [-0.8, -0.86], [-0.28, -1.08], [0.34, -1.04], [0.76, -0.74], [0.88, -0.5], [0.6, -0.56], [0.26, -0.56], [-0.04, -0.4], [-0.34, -0.14], [-0.6, 0.12]],
    },
    front: {
      short: [[-1.0, 0.1], [-1.06, -0.4], [-0.76, -0.96], [0, -1.14], [0.76, -0.96], [1.06, -0.4], [1.0, 0.1], [0.88, -0.28], [0.52, -0.52], [0, -0.56], [-0.52, -0.52], [-0.88, -0.28]],
      fringe: [[-1.0, 0.1], [-1.08, -0.42], [-0.78, -0.98], [0, -1.16], [0.78, -0.98], [1.08, -0.42], [1.0, 0.1], [0.88, -0.22], [0.56, -0.3], [0.3, -0.16], [0.02, -0.34], [-0.3, -0.2], [-0.58, -0.36], [-0.88, -0.22]],
      curly: [[-1.12, 0.14], [-1.22, -0.44], [-0.88, -1.12], [0, -1.32], [0.88, -1.12], [1.22, -0.44], [1.12, 0.14], [0.92, -0.3], [0.54, -0.54], [0, -0.58], [-0.54, -0.54], [-0.92, -0.3]],
      long: [[-1.12, 1.4], [-1.14, -0.4], [-0.78, -0.98], [0, -1.16], [0.78, -0.98], [1.14, -0.4], [1.12, 1.4], [0.86, 1.2], [0.9, -0.2], [0.52, -0.52], [0, -0.56], [-0.52, -0.52], [-0.9, -0.2], [-0.86, 1.2]],
      buzz: [[-0.98, -0.1], [-1.02, -0.46], [-0.74, -0.94], [0, -1.1], [0.74, -0.94], [1.02, -0.46], [0.98, -0.1], [0.86, -0.36], [0.5, -0.6], [0, -0.64], [-0.5, -0.6], [-0.86, -0.36]],
    },
  };

  // ---------- dibujo de la ilustración ----------
  const W = 1000, HH = 1200;
  function paint(pose, kit, res = 1) {
    const cv = document.createElement('canvas'); cv.width = Math.round(W * res); cv.height = Math.round(HH * res);
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.scale(res, res);
    const S = ramp(kit.shirt), T = ramp(kit.trim || '#f4f1ea'), Sl = ramp(kit.sleeve || kit.shirt), Sh = ramp(kit.shorts), So = ramp(kit.socks), St = ramp(kit.sockTrim || kit.trim || kit.socks);
    const B = ramp(kit.boots || '#20202a'), K = skinRamp(kit.skin), Hr = ramp(kit.hair), Gl = ramp(kit.gloves || '#f2f2ee');
    const side = pose.view === 'side';
    const dimR = (rp) => [rp[0], rp[1], rp[1], rp[2], rp[3]];

    const drawLeg = (L, far) => {
      const d = far ? dimR : (x) => x;
      const front = side ? 1 : -L.side;
      // muslo con cuádriceps adelante
      const thigh = limbPoly(L.hip, L.knee, 116, 80, [{ t: 0.42, w: 16, side: front }, { t: 0.3, w: 8, side: -front }]);
      shade(g, () => smoothPath(g, thigh), L.hip, L.knee, 110, d(K), { shine: !far });
      g.fillStyle = d(K)[2]; g.beginPath(); g.arc(L.knee[0], L.knee[1], 36, 0, 7); g.fill();
      // rótula con luz
      g.fillStyle = d(K)[3]; g.beginPath(); g.ellipse(L.knee[0] + (side ? 12 : -L.side * 6), L.knee[1] - 6, 13, 11, 0, 0, 7); g.fill();
      // pantorrilla: gemelo atrás
      const shin = limbPoly(L.knee, L.ankle, 76, 44, [{ t: 0.26, w: 22, side: -front, s: 0.15 }]);
      const sockTop = kit.sockHigh ? 0.08 : 0.18;
      shade(g, () => smoothPath(g, shin), L.knee, L.ankle, 76, d(K), { shine: !far });
      // medias (con canillera marcada) desde debajo de la rodilla
      const sockA = lerp2(L.knee, L.ankle, sockTop);
      const sock = limbPoly(sockA, L.ankle, 80, 48, [{ t: 0.12, w: 20, side: -front, s: 0.15 }]);
      shade(g, () => smoothPath(g, sock), sockA, L.ankle, 80, d(So), { endShade: 'rgba(30,10,40,0.18)', endAt: 0.8 });
      const band = limbPoly(sockA, lerp2(sockA, L.ankle, 0.13), 86, 84, [{ t: 0.5, w: 16, side: -front, s: 0.5 }]);
      shade(g, () => smoothPath(g, band), sockA, L.ankle, 86, d(St));
      if (kit.sockStripe) { const b2 = limbPoly(lerp2(sockA, L.ankle, 0.18), lerp2(sockA, L.ankle, 0.23), 84, 82, [{ t: 0.5, w: 14, side: -front, s: 0.5 }]); shade(g, () => smoothPath(g, b2), sockA, L.ankle, 86, d(St)); }
      // short (pierna)
      const top = lerp2(L.hip, L.knee, -0.14), bot = lerp2(L.hip, L.knee, 0.5);
      const sh1 = limbPoly(top, bot, 138, 126, [{ t: 0.55, w: 10, side: front }]);
      shade(g, () => smoothPath(g, sh1), top, bot, 136, d(Sh), { deep: true, lit: 0.32 });
      if (kit.shortsTrim) stroke(g, [lerp2(top, bot, 0.15).map((v, i) => v + (i ? 0 : front * 50)), lerp2(top, bot, 0.98).map((v, i) => v + (i ? 0 : front * 56))], d(ramp(kit.shortsTrim))[2], 12);
      stroke(g, [lerp2(top, bot, 0.3), lerp2(top, bot, 0.55).map((v, i) => v + (i ? 6 : 8)), lerp2(top, bot, 0.82)], d(Sh)[1], 9); // pliegue
      // ruedo del short
      const hemA = lerp2(top, bot, 0.93);
      shade(g, () => smoothPath(g, limbPoly(hemA, bot, 132, 128)), hemA, bot, 130, d(Sh), { lit: 0.2, deep: true });
      // pantalón largo (DT, cuarto árbitro): cubre la pierna hasta el tobillo
      if (kit.trousers) {
        shade(g, () => smoothPath(g, limbPoly(top, L.knee, 138, 104)), top, L.knee, 124, d(Sh), { deep: true, lit: 0.3 });
        shade(g, () => smoothPath(g, limbPoly(L.knee, lerp2(L.knee, L.ankle, 1.04), 100, 84)), L.knee, L.ankle, 92, d(Sh), { deep: true, lit: 0.25 });
        stroke(g, [lerp2(top, L.knee, 0.35), lerp2(top, L.knee, 0.8)], d(Sh)[1], 8);
        stroke(g, [lerp2(L.knee, L.ankle, 0.1), lerp2(L.knee, L.ankle, 0.9)], d(Sh)[3], 6); // raya del planchado
      }
      // sombra que el short proyecta sobre el muslo, y la de la rodilla sobre la canilla
      if (!kit.trousers) {
        g.save(); smoothPath(g, thigh); g.clip();
        g.fillStyle = 'rgba(30,8,40,0.42)'; smoothPath(g, limbPoly(bot, lerp2(L.hip, L.knee, 0.64), 150, 140)); g.fill();
        g.restore();
        g.save(); smoothPath(g, shin); g.clip();
        g.fillStyle = 'rgba(30,8,40,0.3)'; smoothPath(g, limbPoly(L.knee, lerp2(L.knee, L.ankle, 0.12), 100, 100)); g.fill();
        g.restore();
      }
      // botín con suela, puntera y tapones
      const heel = add(L.ankle, [side ? -26 : L.side * -10, 20]);
      const toe = L.toe;
      const boot = limbPoly(heel, toe, 58, 36, [{ t: 0.15, w: 8, side: 1 }]);
      shade(g, () => smoothPath(g, boot), heel, toe, 58, d(B), { lit: 0.3, shine: !far });
      const soleA = add(heel, [0, 22]), soleB = add(toe, [-4, 12]);
      stroke(g, [soleA, soleB], d(ramp(kit.sole || '#e8e4dc'))[1], 9);
      if (kit.bootStripe) stroke(g, [lerp2(heel, toe, 0.25), lerp2(heel, toe, 0.55).map((v, i) => v + (i ? 6 : 0))], d(ramp(kit.bootStripe))[2], 9);
    };

    const drawArm = (A, far) => {
      const d = far ? dimR : (x) => x;
      const sleeveLen = kit.long ? 1 : 0.5;
      const up = limbPoly(A.sh, A.el, 72, 54, [{ t: 0.36, w: 12, side: 1 }]);
      const armR = kit.long ? Sl : K;
      shade(g, () => smoothPath(g, up), A.sh, A.el, 70, d(armR), { shine: !far });
      g.fillStyle = d(armR)[2]; g.beginPath(); g.arc(A.el[0], A.el[1], 25, 0, 7); g.fill();
      const fo = limbPoly(A.el, A.ha, 54, 40, [{ t: 0.28, w: 11, side: -1 }]);
      shade(g, () => smoothPath(g, fo), A.el, A.ha, 54, d(armR), { shine: !far });
      // mano: puño con nudillos (o guante)
      const hr = kit.gk ? d(Gl) : d(K);
      const dd = [A.ha[0] - A.el[0], A.ha[1] - A.el[1]], L = Math.hypot(...dd) || 1;
      const hc = add(A.ha, [dd[0] / L, dd[1] / L], kit.gk ? 22 : 16);
      g.save(); g.translate(hc[0], hc[1]); g.rotate(Math.atan2(dd[1], dd[0]) - Math.PI / 2);
      const hw = kit.gk ? 38 : 30, hh = kit.gk ? 42 : 34;
      shade(g, () => { g.beginPath(); g.ellipse(0, 0, hw, hh, 0, 0, 7); }, [0, -hh], [0, hh], hw * 2, hr, { lit: 0.42 });
      if (kit.gk) { g.fillStyle = hr[1]; g.fillRect(-hw * 0.7, hh * 0.1, hw * 1.4, 7); g.fillStyle = ramp(kit.gloveTrim || kit.shirt)[2]; g.fillRect(-hw * 0.8, -hh * 0.75, hw * 1.6, 12); }
      else { g.fillStyle = hr[1]; for (let i = -1; i <= 1; i++) g.fillRect(i * 9 - 2, hh * 0.45, 4, 9); }
      g.restore();
      // manga con puño de color
      const sA = lerp2(A.sh, A.el, -0.1), sB = lerp2(A.sh, A.el, sleeveLen === 1 ? 1.05 : 0.56);
      const sl = limbPoly(sA, sB, far ? 78 : 92, 80, [{ t: 0.2, w: 10, side: 1 }]);
      shade(g, () => smoothPath(g, sl), sA, sB, 98, d(Sl), { deep: true, shine: !far });
      stroke(g, [lerp2(sA, sB, 0.35), lerp2(sA, sB, 0.7).map((v, i) => v + (i ? 4 : -6))], d(Sl)[1], 8); // pliegue
      const cA = lerp2(sA, sB, 0.9);
      shade(g, () => smoothPath(g, limbPoly(cA, sB, 84, 82)), cA, sB, 84, d(T));
      if (kit.long) { const fa = lerp2(A.el, A.ha, 0.84), c2 = limbPoly(lerp2(A.el, A.ha, 0.74), fa, 58, 56); shade(g, () => smoothPath(g, c2), A.el, A.ha, 58, d(T)); }
    };

    const drawTorso = () => {
      const m = pose.mk;
      const t = [m.nl, m.shl2, m.shl, m.al, m.ml, m.wl, m.hl, m.hr, m.wr, m.mr, m.ar, m.shr, m.shr2, m.nr];
      const a = lerp2(m.al, m.wl, 0.5), b = lerp2(m.ar, m.wr, 0.5);
      // cintura del short
      shade(g, () => smoothPath(g, m.sw), m.sw[0], m.sw[3], 200, Sh, { deep: true, lit: 0.3 });
      shade(g, () => smoothPath(g, t), a, b, 330, S, { lit: 0.4 });
      // dibujo de la camiseta
      g.save(); smoothPath(g, t); g.clip();
      const alt = ramp(kit.alt || kit.shirt);
      const across = (f) => [lerp2(m.shl, m.shr, f), lerp2(m.hl, m.hr, f)];
      const quad = (poly) => shade(g, () => { g.beginPath(); g.moveTo(...poly[0]); poly.forEach((q) => g.lineTo(...q)); g.closePath(); }, a, b, 250, alt, { lit: 0.42 });
      if (kit.pattern === 'stripes') {
        for (const f of [0.18, 0.5, 0.82]) { const [q1, q2] = across(f); quad([add(q1, [-17, -30]), add(q1, [17, -30]), add(q2, [17, 30]), add(q2, [-17, 30])]); }
      } else if (kit.pattern === 'hoops') {
        for (const v of [0.2, 0.5, 0.8]) { const q1 = lerp2(m.shl, m.hl, v), q2 = lerp2(m.shr, m.hr, v); quad([add(q1, [-40, -22]), add(q2, [40, -22]), add(q2, [40, 22]), add(q1, [-40, 22])]); }
      } else if (kit.pattern === 'band' || kit.pattern === 'sash') {
        const sash = kit.pattern === 'sash';
        const q1 = lerp2(m.shl, m.hl, sash ? 0.0 : 0.4), q2 = lerp2(m.shr, m.hr, sash ? 0.9 : 0.4);
        stroke(g, [add(q1, [-30, 0]), add(q2, [30, 0])], alt[2], 56); stroke(g, [add(q1, [-30, -20]), add(q2, [30, -20])], alt[3], 10);
      } else if (kit.pattern === 'center') {
        const [q1, q2] = across(0.5); quad([add(q1, [-30, -40]), add(q1, [30, -40]), add(q2, [30, 40]), add(q2, [-30, 40])]);
      } else if (kit.pattern === 'checks') {
        for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2) {
          const a1 = lerp2(lerp2(m.shl, m.shr, i / 4), lerp2(m.hl, m.hr, i / 4), j / 4), a2 = lerp2(lerp2(m.shl, m.shr, (i + 1) / 4), lerp2(m.hl, m.hr, (i + 1) / 4), j / 4);
          const b1 = lerp2(lerp2(m.shl, m.shr, i / 4), lerp2(m.hl, m.hr, i / 4), (j + 1) / 4), b2 = lerp2(lerp2(m.shl, m.shr, (i + 1) / 4), lerp2(m.hl, m.hr, (i + 1) / 4), (j + 1) / 4);
          quad([add(a1, [-20, -6]), add(a2, [20, -6]), add(b2, [20, 6]), add(b1, [-20, 6])]);
        }
      } else if (kit.pattern === 'halves') {
        const [q1, q2] = across(0.5); g.fillStyle = alt[2]; g.beginPath(); g.moveTo(...add(q1, [0, -60])); g.lineTo(3000, -1000); g.lineTo(3000, 2000); g.lineTo(...add(q2, [0, 60])); g.closePath(); g.fill();
      }
      if (!STY.small) for (const f of m.folds) stroke(g, f, S[1], 18);
      if (!STY.small) for (const f of m.lights) stroke(g, f, S[3], 12);
      g.restore();
      // ruedo y cuello
      stroke(g, [m.wl, lerp2(m.wl, m.wr, 0.5), m.wr], S[1], 12);
      // la camiseta proyecta sombra sobre el short
      {
        const dn = side ? [-pose.up[0], -pose.up[1]] : [0, 1];
        g.save(); g.globalCompositeOperation = 'source-atop';
        g.fillStyle = 'rgba(30,8,40,0.4)';
        g.beginPath(); g.moveTo(...add(m.hl, dn, -2)); g.lineTo(...add(m.hr, dn, -2)); g.lineTo(...add(m.hr, dn, 30)); g.lineTo(...add(m.hl, dn, 30)); g.closePath(); g.fill();
        g.restore();
      }
      if (side) stroke(g, [m.nl, lerp2(m.nl, m.nr, 0.5).map((v, i) => v + (i ? 16 : 0)), m.nr], T[2], 16);
      else if (pose.back) stroke(g, [m.nl, [pose.N[0], pose.N[1] + 6], m.nr], T[2], 14);
      else { stroke(g, [m.nl, [pose.N[0], pose.N[1] + (kit.vneck ? 44 : 22)], m.nr], T[2], 16); stroke(g, [add(m.nl, [6, 10]), [pose.N[0], pose.N[1] + (kit.vneck ? 52 : 30)], add(m.nr, [-6, 10])], T[1], 6); }
    };

    const drawHead = () => {
      const c = pose.head, r = M.head;
      const f = side ? 1 : 0;
      // cuello con sombra bajo la mandíbula
      const nB = pose.N, nT = side ? add(c, [-10, r * 0.5]) : [c[0], c[1] + r * 0.6];
      const neck = limbPoly(nB, nT, 66, 58);
      shade(g, () => smoothPath(g, neck), nB, nT, 66, K, { lit: 0.26, deep: true });
      g.fillStyle = K[1]; g.beginPath(); g.ellipse(nT[0] + (side ? 6 : 0), nT[1] + 4, 30, 16, 0, 0, 7); g.fill();
      // cráneo y mandíbula
      const pts = [];
      for (let a = 0; a < Math.PI * 2; a += 0.15) {
        let x = Math.cos(a) * r * (side ? 0.9 : 0.88), y = Math.sin(a) * r;
        if (y > 0) {
          x *= 1 - 0.28 * (y / r);
          if (side && x > 0) x += 10 * (y / r);
        }
        pts.push([c[0] + x, c[1] + y * 1.04]);
      }
      shade(g, () => smoothPath(g, pts), [c[0] - 30, c[1] - 30], [c[0] + 30, c[1] + 30], r * 2, K, { lit: 0.42, shine: true });
      if (side) {
        // nariz, mentón, oreja, cuenca del ojo
        g.fillStyle = K[2]; g.beginPath(); g.moveTo(c[0] + r * 0.78, c[1] - 4); g.lineTo(c[0] + r * 1.04, c[1] + 22); g.lineTo(c[0] + r * 0.78, c[1] + 28); g.fill();
        g.fillStyle = K[1]; g.beginPath(); g.moveTo(c[0] + r * 0.8, c[1] + 26); g.lineTo(c[0] + r * 1.0, c[1] + 23); g.lineTo(c[0] + r * 0.78, c[1] + 31); g.fill();
        g.fillStyle = K[1]; g.beginPath(); g.ellipse(c[0] - r * 0.14, c[1] + 6, 15, 21, 0.1, 0, 7); g.fill();
        g.fillStyle = K[0]; g.beginPath(); g.ellipse(c[0] - r * 0.12, c[1] + 8, 6, 11, 0.1, 0, 7); g.fill();
        g.fillStyle = K[1]; g.beginPath(); g.ellipse(c[0] + r * 0.5, c[1] - 6, 16, 10, 0, 0, 7); g.fill();
        g.fillStyle = K[1]; g.beginPath(); g.ellipse(c[0] + r * 0.3, c[1] + r * 0.82, 26, 10, -0.3, 0, 7); g.fill();
      } else if (pose.back) {
        g.fillStyle = K[1];
        g.beginPath(); g.ellipse(c[0] - r * 0.86, c[1] + 6, 10, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(c[0] + r * 0.86, c[1] + 6, 10, 18, 0, 0, 7); g.fill();
      } else {
        g.fillStyle = K[1];
        if (!STY.small) { g.beginPath(); g.ellipse(c[0] - r * 0.3, c[1] - 4, 15, 9, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(c[0] + r * 0.3, c[1] - 4, 15, 9, 0, 0, 7); g.fill(); }
        g.beginPath(); g.moveTo(c[0] + 2, c[1]); g.lineTo(c[0] + 14, c[1] + 26); g.lineTo(c[0] - 4, c[1] + 28); g.fill();
        g.beginPath(); g.ellipse(c[0] - r * 0.86, c[1] + 6, 10, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(c[0] + r * 0.86, c[1] + 6, 10, 18, 0, 0, 7); g.fill();
      }
      // barba
      if (kit.beard && !pose.back) {
        g.save(); smoothPath(g, pts); g.clip();
        g.fillStyle = kit.beard === 'stubble' ? K[1] : Hr[1];
        g.beginPath();
        if (side) g.ellipse(c[0] + r * 0.3, c[1] + r * 0.75, r * 0.75, r * 0.42, 0, 0, 7); else g.ellipse(c[0], c[1] + r * 0.8, r * 0.85, r * 0.42, 0, 0, 7);
        g.fill();
        if (kit.beard === 'full') { g.fillStyle = Hr[0]; g.beginPath(); if (side) g.ellipse(c[0] + r * 0.25, c[1] + r * 0.95, r * 0.6, r * 0.2, 0, 0, 7); else g.ellipse(c[0], c[1] + r * 1.0, r * 0.6, r * 0.2, 0, 0, 7); g.fill(); }
        g.restore();
      }
      // pelo
      const style = kit.hairStyle || 'short';
      const st = style === 'bun' ? 'short' : style;
      const tmpl = pose.back ? (st === 'long' ? HAIR.back.long : st === 'curly' ? HAIR.back.curly : HAIR.back.short) : HAIR[side ? 'side' : 'front'][st] || HAIR.side.short;
      const hp = tmpl.map(([x, y]) => [c[0] + x * r, c[1] + y * r]);
      shade(g, () => smoothPath(g, hp), [c[0] - 30, c[1] - 50], [c[0] + 30, c[1] + 10], r * 2, Hr, { lit: 0.32, deep: true });
      // mechones con luz
      g.save(); smoothPath(g, hp); g.clip();
      for (let i = 0; i < 4; i++) {
        const y0 = c[1] - r * (0.95 - i * 0.16), x0 = c[0] - r * (side ? 0.6 : 0.5) + i * 6;
        stroke(g, [[x0, y0], [x0 + r * 0.45, y0 - r * 0.08], [x0 + r * 0.8, y0 + r * 0.06]], Hr[3], 7);
      }
      if (style === 'curly') for (let i = 0; i < 12; i++) { const a = -Math.PI + i * 0.3; g.fillStyle = Hr[i % 3 ? 1 : 3]; g.beginPath(); g.arc(c[0] + Math.cos(a) * r * 0.85, c[1] + Math.sin(a) * r * 0.85 - 8, 9, 0, 7); g.fill(); }
      g.restore();
      if (style === 'bun') {
        const bc = side ? [c[0] - r * 0.9, c[1] - r * 0.8] : [c[0], c[1] - r * 1.2];
        shade(g, () => { g.beginPath(); g.ellipse(bc[0], bc[1], 30, 25, -0.5, 0, 7); }, [bc[0] - 20, bc[1] - 20], [bc[0] + 20, bc[1] + 20], 50, Hr, { lit: 0.35, deep: true });
        g.fillStyle = ramp(kit.band || '#2a4aa8')[2]; g.beginPath(); g.ellipse(bc[0] + (side ? 22 : 0), bc[1] + 18, 10, 9, 0, 0, 7); g.fill();
      }
      return { c, r, pts };
    };

    // orden de dibujo
    const farLeg = side ? pose.legs[0] : null, nearLeg = side ? pose.legs[1] : null;
    const farArm = side ? pose.arms[0] : null, nearArm = side ? pose.arms[1] : null;
    let headInfo;
    if (side) {
      drawArm(farArm, true);
      drawLeg(farLeg, true);
      drawLeg(nearLeg, false);
      drawTorso();
      headInfo = drawHead();
      // sombra del brazo cercano sobre la camiseta
      {
        const m = pose.mk, t = [m.nl, m.shl2, m.shl, m.al, m.ml, m.wl, m.hl, m.hr, m.wr, m.mr, m.ar, m.shr, m.shr2, m.nr];
        const o = [16, 20], A = nearArm;
        g.save(); smoothPath(g, t); g.clip();
        g.fillStyle = 'rgba(30,8,40,0.34)';
        smoothPath(g, limbPoly(add(A.sh, o), add(A.el, o), 92, 62)); g.fill();
        smoothPath(g, limbPoly(add(A.el, o), add(A.ha, o), 54, 46)); g.fill();
        g.restore();
      }
      drawArm(nearArm, false);
    } else {
      // de frente: los brazos arriba de la cabeza van detrás si están levantados
      const armsUp = pose.armsUp;
      if (armsUp) pose.arms.forEach((A) => drawArm(A, false));
      pose.legs.forEach((L) => drawLeg(L, false));
      drawTorso();
      headInfo = drawHead();
      if (!armsUp) pose.arms.forEach((A) => drawArm(A, false));
    }
    const pal = [...S, ...T, ...Sl, ...Sh, ...So, ...St, ...B, ...K, ...Hr, ...(kit.gk ? Gl : []), ...ramp(kit.sole || '#e8e4dc'), '#1a1018'];
    if (kit.alt) pal.push(...ramp(kit.alt));
    if (kit.band) pal.push(...ramp(kit.band));
    if (kit.bootStripe) pal.push(...ramp(kit.bootStripe));
    if (kit.shortsTrim) pal.push(...ramp(kit.shortsTrim));
    if (kit.gloveTrim) pal.push(...ramp(kit.gloveTrim));
    return { cv, pal, head: headInfo, S, T, K, Hr, Sh };
  }

  // ---------- reducción a píxeles ----------
  function pixelate(src, scale, palette, box, small) {
    const [bx, by, bw, bh] = box;
    const W = Math.ceil(bw / scale), H = Math.ceil(bh / scale);
    const sg = src.getContext('2d').getImageData(0, 0, src.width, src.height).data;
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const og = out.getContext('2d', { willReadFrequently: true }), im = og.createImageData(W, H), d = im.data;
    const P = [...new Set(palette)].map(rgb);
    const solid = new Uint8Array(W * H);
    const m = Math.floor(scale * (small ? 0.12 : 0.22)), thr = small ? 0.34 : 0.5;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = by + y * scale + m; yy < by + (y + 1) * scale - m; yy++) for (let xx = bx + x * scale + m; xx < bx + (x + 1) * scale - m; xx++) {
        if (xx < 0 || yy < 0 || xx >= src.width || yy >= src.height) continue;
        const i = (yy * src.width + xx) * 4;
        const al = sg[i + 3] / 255;
        r += sg[i] * al; g += sg[i + 1] * al; b += sg[i + 2] * al; a += al; n++;
      }
      if (!n || a / n < thr) continue;
      r /= a; g /= a; b /= a;
      let best = 0, bd = 1e9;
      for (let k = 0; k < P.length; k++) {
        const dr = r - P[k][0], dg = g - P[k][1], db = b - P[k][2];
        const dd = dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11;
        if (dd < bd) { bd = dd; best = k; }
      }
      const j = (y * W + x) * 4;
      d[j] = P[best][0]; d[j + 1] = P[best][1]; d[j + 2] = P[best][2]; d[j + 3] = 255;
      solid[y * W + x] = 1;
    }
    // limpieza: un píxel suelto de un color rodeado de otro se iguala (menos ruido)
    const src2 = new Uint8ClampedArray(d);
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!solid[i]) continue;
      const c = (k) => (src2[k * 4] << 16) | (src2[k * 4 + 1] << 8) | src2[k * 4 + 2];
      const me = c(i), nb = [i - 1, i + 1, i - W, i + W].filter((k) => solid[k]);
      if (nb.length < 4) continue;
      const cs = nb.map(c);
      if (cs.every((v) => v !== me) && cs.filter((v) => v === cs[0]).length >= 3) { const k = nb[cs.findIndex((v) => v === cs[0])]; d[i * 4] = src2[k * 4]; d[i * 4 + 1] = src2[k * 4 + 1]; d[i * 4 + 2] = src2[k * 4 + 2]; }
    }
    // borde de abajo y de la derecha (lado en sombra) un tono más oscuro
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!solid[i]) continue;
      const openB = y === H - 1 || !solid[i + W], openR = x === W - 1 || !solid[i + 1], openT = y === 0 || !solid[i - W];
      if ((openB && !openT) || (openR && x > 0 && solid[i - 1])) { const j = i * 4; d[j] *= 0.7; d[j + 1] *= 0.66; d[j + 2] *= 0.76; }
    }
    // borde de arriba y de la izquierda (lado de la luz) un poco más claro
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!solid[i]) continue;
      const openT = !solid[i - W], openL = !solid[i - 1], openB = !solid[i + W];
      if ((openT && !openB) || (openL && solid[i + 1] && !openT && y > 0)) {
        const j = i * 4, k = openT ? 0.22 : 0.12;
        d[j] += (255 - d[j]) * k; d[j + 1] += (246 - d[j + 1]) * k; d[j + 2] += (228 - d[j + 2]) * k;
      }
    }
    og.putImageData(im, 0, 0);
    return out;
  }

  // ---------- terminación a mano (píxel por píxel) ----------
  const FONT = { 0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111' };
  function finish(cv, info, pose, kit, scale, box) {
    const g = cv.getContext('2d');
    const im = g.getImageData(0, 0, cv.width, cv.height), d = im.data;
    const W = cv.width;
    const to = (q) => [Math.floor((q[0] - box[0]) / scale), Math.floor((q[1] - box[1]) / scale)];
    const set = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= cv.height) return; const i = (y * W + x) * 4; if (!d[i + 3]) return; const [r, gg, b] = rgb(c); d[i] = r; d[i + 1] = gg; d[i + 2] = b; };
    const setAny = (x, y, c) => { if (x < 0 || y < 0 || x >= W || y >= cv.height) return; const i = (y * W + x) * 4; const [r, gg, b] = rgb(c); d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; };
    const { c, r } = info.head;
    const R = r / scale;
    const big = R >= 5;
    const eye = '#1a1018', white = '#efe8e0';
    if (scale >= 40) {
      // de lejos no se distinguen ojos ni números: solo una sombra de pelo/cara
    } else if (pose.back) {
      // número grande en la espalda
      if (kit.num) {
        const [x0, y0] = to(lerp2(pose.N, pose.H0, 0.3));
        const col = kit.numColor || (lum(kit.shirt) > 150 ? ramp(kit.trim || '#1c1c2a')[1] : '#f4f1ea');
        const s = String(kit.num), wpx = s.length * 4 - 1;
        let x = x0 - Math.floor(wpx / 2);
        for (const ch of s) { const fg = FONT[ch]; if (fg) for (let i = 0; i < 15; i++) if (fg[i] === '1') set(x + (i % 3), y0 + Math.floor(i / 3), col); x += 4; }
      }
    } else if (pose.view === 'side') {
      const [ex, ey] = to([c[0] + r * 0.52, c[1] - 4]);
      set(ex, ey, eye);
      if (big) { set(ex - 1, ey, white); set(ex - 1, ey - 1, info.Hr[0]); set(ex, ey - 1, info.Hr[0]); set(ex + 1, ey - 1, info.Hr[0]); }
      const [mx, my] = to([c[0] + r * 0.62, c[1] + r * 0.55]);
      set(mx, my, info.K[0]);
      if (big) set(mx - 1, my, info.K[1]);
    } else {
      const [lx, ly] = to([c[0] - r * 0.32, c[1] - 2]);
      const [rx] = to([c[0] + r * 0.32, c[1] - 2]);
      set(lx, ly, eye); set(rx, ly, eye);
      if (big) { set(lx - 1, ly - 1, info.Hr[0]); set(lx, ly - 1, info.Hr[0]); set(rx, ly - 1, info.Hr[0]); set(rx + 1, ly - 1, info.Hr[0]); set(lx - 1, ly, white); set(rx + 1, ly, white); }
      const [mx, my] = to([c[0], c[1] + r * 0.55]);
      set(mx, my, info.K[0]); if (big) set(mx - 1, my, info.K[0]);
    }
    // escudo en el pecho
    if (kit.crest && scale <= 12 && !pose.back) {
      const t = pose.torso;
      const q = pose.mk.crest;
      const [x, y] = to(q);
      const cr = ramp(kit.crest);
      set(x, y, cr[3]); set(x + 1, y, cr[2]); set(x, y + 1, cr[2]); set(x + 1, y + 1, cr[1]);
      if (scale <= 8) { set(x, y + 2, cr[1]); set(x + 1, y - 1, cr[4]); }
    }
    // número en el short (pierna cercana)
    if (kit.num && scale <= 9 && !pose.back) {
      const L = pose.view === 'side' ? pose.legs[1] : pose.legs[0];
      const [x0, y0] = to(lerp2(L.hip, L.knee, 0.22).map((v, i) => v + (i ? 0 : (pose.view === 'side' ? 6 : -10))));
      const col = kit.numColor || (lum(kit.shorts) > 140 ? '#1c1c2a' : '#f2efe6');
      // numMirror: el sprite se va a dibujar espejado, así que el número va al revés para que se lea bien
      const m = kit.numMirror, s = m ? [...String(kit.num)].reverse().join('') : String(kit.num);
      let x = x0 - Math.floor((s.length * 4 - 1) / 2);
      for (const ch of s) { const fg = FONT[ch]; if (fg) for (let i = 0; i < 15; i++) if (fg[i] === '1') set(x + (m ? 2 - (i % 3) : i % 3), y0 + Math.floor(i / 3), col); x += 4; }
    }
    // tapones bajo la suela
    if (scale <= 9) for (const L of pose.legs) {
      const a = to(add(L.ankle, [0, 44])), b = to(add(L.toe, [-10, 26]));
      for (const q of [a, lerp2(a, b, 0.5).map(Math.round)]) { const i = ((q[1] + 1) * W + q[0]) * 4; if (q[1] + 1 < cv.height && !d[i + 3]) setAny(q[0], q[1] + 1, '#3a3640'); }
    }
    g.putImageData(im, 0, 0);
  }

  // ---------- API ----------
  const cache = new Map();
  // Devuelve { cv, ox, oy } con el origen en el punto de apoyo (entre los pies).
  // small: versión para la vista del partido (miembros más gruesos y cabeza un poco más grande para que se lean)
  function sprite(poseParams, kit, view, scale, key, small) {
    const k = key ? `${key}|${view}|${scale}|${small ? 's' : ''}|${kit.id || JSON.stringify(kit)}` : null;
    if (k && cache.has(k)) return cache.get(k);
    const head0 = M.head;
    // lejos (escala ≥ 40) se acerca a lo que muestra una cámara de TV: proporciones reales y casi sin rasgos
    const far = small && scale >= 40;
    if (small) { STY.fat = far ? 1.22 : 1.32; STY.small = true; M.head = head0 * (far ? 1.12 : 1.22); }
    let pose, info;
    // los jugadores chicos se pintan a menor resolución: mismo resultado, mucho más rápido
    const res = scale >= 48 ? 0.125 : scale >= 24 ? 0.25 : scale >= 8 ? 0.5 : 1;
    try {
      pose = view === 'side' ? sidePose(poseParams) : frontPose(poseParams);
      pose.back = view === 'back';
      info = paint(pose, kit, res);
    } finally { STY.fat = 1; STY.small = false; M.head = head0; }
    const blk = Math.max(1, Math.round(scale * res));
    const cv = pixelate(info.cv, blk, info.pal, [0, 0, Math.round(W * res), Math.round(HH * res)], small);
    const box = [0, 0, W, HH];
    finish(cv, info, pose, kit, scale, box);
    const mid = lerp2(pose.N, pose.H0, 0.5);
    const out = { cv, ox: pose.H0[0] / scale, oy: GROUND / scale, hip: [pose.H0[0] / scale, pose.H0[1] / scale], c: [mid[0] / scale, mid[1] / scale], toe: pose.legs.map((l) => [l.toe[0] / scale, l.toe[1] / scale]), ankle: pose.legs.map((l) => [l.ankle[0] / scale, l.ankle[1] / scale]), hand: pose.arms.map((a) => [a.ha[0] / scale, a.ha[1] / scale]) };
    if (k) cache.set(k, out);
    return out;
  }

  // Pelota pintada a mano a su tamaño final (r en píxeles), con gajos que giran.
  // ---------- pelota oficial: blanca con triadas azules ----------
  // Una esfera de verdad: 12 círculos blancos (vértices del icosaedro) y, entre
  // cada tres, una triada azul con puntas rojas; costuras de 32 paneles,
  // luz desde arriba a la izquierda y brillo. Cada píxel mira qué parte de la
  // pelota cae ahí, según cómo está girada (spin).
  const PHI = (1 + Math.sqrt(5)) / 2;
  const nrm = (v) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const ICO = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]].map(nrm);
  const DOD = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++) {
    const [a, b, c] = [ICO[i], ICO[j], ICO[k]];
    const dot = (u, v) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    if (dot(a, b) > 0.4 && dot(b, c) > 0.4 && dot(a, c) > 0.4) DOD.push(nrm([a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]]));
  }
  const PANELS = ICO.concat(DOD);
  const DEG = 180 / Math.PI;
  // rampas de color: de la luz a la sombra
  const RAMP = {
    w: ['#fffdf6', '#f3ecda', '#e0d6bc', '#c4b797', '#968a6c', '#6a6150'],
    b: ['#5a88e6', '#3563c8', '#2349a6', '#18347e', '#0f2356', '#0a1838'],
    r: ['#ff6a5c', '#e8383c', '#bb2430', '#8a1a26', '#5e121c', '#3e0c14'],
    l: ['#c9d8f8', '#9fb8ee', '#7896d8', '#5672b4', '#3a508a', '#263760'],
  };
  const RAMP_RGB = Object.fromEntries(Object.entries(RAMP).map(([k, v]) => [k, v.map(rgb)]));
  const BLIGHT = nrm([-0.5, -0.62, 0.6]);
  // rotación de la pelota: una triada mirando a cámara, y el giro alrededor de un eje casi de frente
  const rotAxis = (ax, t) => {
    const [x, y, z] = nrm(ax), c = Math.cos(t), s = Math.sin(t), C = 1 - c;
    return [[c + x * x * C, x * y * C - z * s, x * z * C + y * s], [y * x * C + z * s, c + y * y * C, y * z * C - x * s], [z * x * C - y * s, z * y * C + x * s, c + z * z * C]];
  };
  const mul = (A, B) => A.map((row) => [0, 1, 2].map((j) => row[0] * B[0][j] + row[1] * B[1][j] + row[2] * B[2][j]));
  const BASE = (() => { // deja una triada mirando a cámara
    const from = DOD[0], to = nrm([-0.08, 0.06, 1]);
    const ax = [from[1] * to[2] - from[2] * to[1], from[2] * to[0] - from[0] * to[2], from[0] * to[1] - from[1] * to[0]];
    return rotAxis(ax, Math.acos(from[0] * to[0] + from[1] * to[1] + from[2] * to[2]));
  })();
  // material de un punto de la pelota (coordenadas propias): 'w', 'b', 'r' o 'l' y si es costura
  function material(p, pxd) {
    let d1 = 999, d2 = 999;
    for (const c of ICO) { const a = Math.acos(Math.min(1, p[0] * c[0] + p[1] * c[1] + p[2] * c[2])) * DEG; if (a < d1) { d2 = d1; d1 = a; } else if (a < d2) d2 = a; }
    let dt = 999, dt2 = 999;
    for (const c of DOD) { const a = Math.acos(Math.min(1, p[0] * c[0] + p[1] * c[1] + p[2] * c[2])) * DEG; if (a < dt) { dt2 = dt; dt = a; } else if (a < dt2) dt2 = a; }
    let m = 'w';
    const fine = pxd < 3.5, mid = pxd < 7;    // nivel de detalle según el tamaño
    const edge = fine ? 27.5 : mid ? 26.5 : 25;
    if (d1 >= edge) {
      if (dt2 - dt < Math.min(4, Math.max(1.6, pxd * 0.9))) m = 'w';                    // donde se juntan dos triadas
      else if (dt > 15) m = fine && Math.floor((dt - 15) / 1.5) % 2 ? 'w' : 'r'; // punta roja (a rayas de cerca)
      else if (fine && d1 < edge + 1.4 && dt > 3) m = 'w';                  // filo blanco junto al círculo
      else if (mid && dt > 4 && dt < 13 && d1 > 30 && d1 < 30 + Math.max(1.3, pxd * 0.6)) m = 'l'; // llamarada clara
      else m = 'b';
    } else if (fine && d1 > edge - 3.4 && d1 < edge - 2.1) m = 'b';          // línea fina del círculo
    let seam = false;
    if (pxd < 5) {
      let s1 = 9, s2 = 9;
      for (const c of PANELS) { const a = Math.acos(Math.min(1, p[0] * c[0] + p[1] * c[1] + p[2] * c[2])); if (a < s1) { s2 = s1; s1 = a; } else if (a < s2) s2 = a; }
      seam = (s2 - s1) * DEG < Math.max(0.8, pxd * 0.4);
    }
    return [m, seam];
  }
  function ball(r, spin = 0) {
    const s = Math.ceil(r * 2) + 2;
    const cv = document.createElement('canvas'); cv.width = s; cv.height = s;
    const g = cv.getContext('2d'), im = g.createImageData(s, s), d = im.data;
    const c = s / 2;
    const Rm = mul(rotAxis([0.25, 0.35, 1], spin), BASE);
    const pxd = DEG / r;
    // pelotas chicas: varias muestras por píxel y promedio; grandes: una por píxel, en bandas
    const ss = 1;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      let acc = [0, 0, 0], n = 0;
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        let nx = (x + (sx + 0.5) / ss - c) / r, ny = (y + (sy + 0.5) / ss - c) / r, d2 = nx * nx + ny * ny;
        if (d2 > 1 + 0.3 / r) continue;
        if (d2 > 0.999) { const q = Math.sqrt(d2 / 0.999); nx /= q; ny /= q; d2 = 0.999; }
        const nz = Math.sqrt(1 - d2);
        // punto en la pelota: la inversa de la rotación (transpuesta)
        const p = [Rm[0][0] * nx + Rm[1][0] * ny + Rm[2][0] * nz, Rm[0][1] * nx + Rm[1][1] * ny + Rm[2][1] * nz, Rm[0][2] * nx + Rm[1][2] * ny + Rm[2][2] * nz];
        const [m, seam] = material(p, pxd);
        const lam = Math.max(0, nx * BLIGHT[0] + ny * BLIGHT[1] + nz * BLIGHT[2]);
        const spec = Math.pow(Math.max(0, 2 * lam * nz - BLIGHT[2]), 18);
        let lit = 0.3 + lam * 0.78 + spec * 0.5;
        if (d2 > 0.8 && nx + ny > 0.45) lit -= 0.18;                       // borde en sombra
        let band = lit > 1.0 ? 0 : lit > 0.8 ? 1 : lit > 0.6 ? 2 : lit > 0.4 ? 3 : lit > 0.24 ? 4 : 5;
        if (seam) band = Math.min(5, band + 1);
        const col = RAMP_RGB[m][band];
        acc[0] += col[0]; acc[1] += col[1]; acc[2] += col[2]; n++;
      }
      if (!n) continue;
      const i = (y * s + x) * 4, cover = n / (ss * ss);
      d[i] = acc[0] / n; d[i + 1] = acc[1] / n; d[i + 2] = acc[2] / n; d[i + 3] = ss > 1 ? Math.round(255 * Math.min(1, cover * 1.25)) : 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  }

  // ---------- poses de juego ----------
  // ---------- interpolación de poses (Catmull-Rom sobre cada número) ----------
  function cr(p0, p1, p2, p3, t) {
    if (typeof p1 === 'number') {
      const a0 = p0 ?? p1, a3 = p3 ?? p2;
      const t2 = t * t, t3 = t2 * t;
      return 0.5 * (2 * p1 + (-a0 + p2) * t + (2 * a0 - 5 * p1 + 4 * p2 - a3) * t2 + (-a0 + 3 * p1 - 3 * p2 + a3) * t3);
    }
    if (Array.isArray(p1)) return p1.map((_, i) => cr(p0?.[i], p1[i], p2[i], p3?.[i], t));
    const o = {};
    for (const k of new Set([...Object.keys(p1), ...Object.keys(p2)])) o[k] = cr(p0?.[k] ?? p1[k] ?? p2[k], p1[k] ?? p2[k], p2[k] ?? p1[k], p3?.[k] ?? p2[k] ?? p1[k], t);
    return o;
  }
  function keyed(keys, u, loop) {
    const n = keys.length;
    if (loop) u = ((u % 1) + 1) % 1; else u = Math.max(0, Math.min(1, u));
    let i = 0;
    while (i < n - 1 && keys[i + 1][0] <= u) i++;
    let j = i + 1, t0 = keys[i][0], t1;
    if (j >= n) { if (!loop) return keys[n - 1][1]; j = 0; t1 = 1 + keys[0][0]; } else t1 = keys[j][0];
    const t = (u - t0) / (t1 - t0 || 1);
    const at = (k) => (loop ? keys[((k % n) + n) % n][1] : keys[Math.max(0, Math.min(n - 1, k))][1]);
    return cr(at(i - 1), at(i), at(j), at(j === 0 && loop ? 1 : j + 1), t);
  }

  // Carrera: fases reales de un paso (apoyo, despegue, vuelo, recogida de la pierna, alcance).
  const RUN_LEG = [
    [0.0, { a: 0.42, k: 0.16, p: -0.08 }], // contacto: pierna casi estirada, apoya el talón
    [0.12, { a: 0.18, k: 0.46, p: 0.0 }], // amortigua: la rodilla cede
    [0.25, { a: -0.14, k: 0.36, p: 0.12 }], // apoyo medio, empuja
    [0.38, { a: -0.5, k: 0.28, p: 0.8 }], // despegue en punta de pie
    [0.5, { a: -0.42, k: 1.35, p: 0.95 }], // el talón sube hacia la cola
    [0.62, { a: -0.04, k: 2.05, p: 0.55 }], // recogida máxima
    [0.75, { a: 0.55, k: 1.6, p: 0.12 }], // rodilla adelante y arriba
    [0.88, { a: 0.8, k: 0.7, p: -0.1 }], // alcance: la pierna se abre para apoyar
  ];
  const run = (u, amp = 1) => {
    const L0 = keyed(RUN_LEG, u + 0.5, true), L1 = keyed(RUN_LEG, u, true);
    const sc = (L) => ({ a: L.a * amp, k: L.k * amp, p: L.p * amp });
    const arm = (legA) => { const a = -0.95 * legA * amp; return { a, e: 1.35 + 0.45 * Math.max(0, a) + 0.15 * Math.max(0, -a) }; };
    // vuelo: entre el despegue de un pie y el contacto del otro el cuerpo sube
    const fu = ((u % 0.5) + 0.5) % 0.5;
    const lift = fu > 0.36 && fu < 0.5 ? Math.sin(((fu - 0.36) / 0.14) * Math.PI) * 18 * amp : 0;
    const bob = Math.cos(fu / 0.5 * Math.PI * 2) * 0.02;
    return { lean: (0.17 + bob) * amp, twist: 0.4, headTilt: -0.08 * amp, lift, legs: [sc(L0), sc(L1)], arms: [arm(L0.a), arm(L1.a)] };
  };

  // Remate con la derecha (pierna cercana): último paso, apoyo, pierna atrás, golpe, seguimiento, aterrizaje.
  const KICK = [
    [0.0, { lean: 0.2, twist: 0.4, headTilt: 0.05, lift: 0, legs: [{ a: 0.62, k: 0.36, p: -0.05 }, { a: -0.45, k: 1.25, p: 0.85 }], arms: [{ a: -0.55, e: 1.45 }, { a: 0.5, e: 1.6 }] }],
    [0.2, { lean: 0.06, twist: 0.45, headTilt: 0.18, lift: 0, legs: [{ a: 0.22, k: 0.34, p: 0.0 }, { a: -0.62, k: 2.0, p: 0.95 }], arms: [{ a: 1.15, e: 0.55 }, { a: -0.85, e: 0.75 }] }],
    [0.38, { lean: 0.0, twist: 0.5, headTilt: 0.24, lift: 0, legs: [{ a: 0.14, k: 0.46, p: 0.0 }, { a: -0.08, k: 1.7, p: 1.0 }], arms: [{ a: 1.55, e: 0.38 }, { a: -1.0, e: 0.7 }] }],
    [0.5, { lean: -0.1, twist: 0.5, headTilt: 0.3, lift: 0, legs: [{ a: 0.3, k: 0.58, p: 0.0 }, { a: 0.55, k: 0.48, p: 1.05 }], arms: [{ a: 1.75, e: 0.35 }, { a: -0.95, e: 0.75 }] }],
    [0.66, { lean: -0.2, twist: 0.5, headTilt: 0.1, lift: 0, legs: [{ a: -0.02, k: 0.22, p: 0.45 }, { a: 1.22, k: 0.12, p: 0.75 }], arms: [{ a: 1.15, e: 0.5 }, { a: -0.5, e: 1.0 }] }],
    [0.83, { lean: -0.06, twist: 0.45, headTilt: 0.0, lift: 0, legs: [{ a: -0.12, k: 0.3, p: 0.3 }, { a: 0.78, k: 0.75, p: 0.35 }], arms: [{ a: 0.6, e: 0.9 }, { a: -0.2, e: 1.1 }] }],
    [1.0, { lean: 0.08, twist: 0.4, headTilt: -0.05, lift: 0, legs: [{ a: -0.32, k: 0.42, p: 0.6 }, { a: 0.3, k: 0.35, p: 0.0 }], arms: [{ a: 0.25, e: 1.0 }, { a: 0.05, e: 1.0 }] }],
  ];
  // Celebración: carrera, salto con los brazos arriba, cae de rodillas y se desliza por el pasto.
  const CELE = [
    [0.0, { lean: 0.12, twist: 0.45, headTilt: 0.0, lift: 0, legs: [{ a: -0.35, k: 0.3, p: 0.85 }, { a: 0.7, k: 1.2, p: 0.1 }], arms: [{ a: 1.5, e: 0.6 }, { a: 1.8, e: 0.5 }] }],
    [0.16, { lean: -0.05, twist: 0.5, headTilt: 0.15, lift: 70, legs: [{ a: 0.55, k: 1.9, p: 0.7 }, { a: 0.75, k: 2.05, p: 0.7 }], arms: [{ a: 3.0, e: 0.2 }, { a: 2.45, e: 0.15 }] }],
    [0.3, { lean: -0.22, twist: 0.5, headTilt: 0.3, lift: 0, legs: [{ a: 0.18, k: 1.72, p: 1.2 }, { a: 0.28, k: 1.82, p: 1.2 }], arms: [{ a: 3.2, e: 0.12 }, { a: 2.45, e: 0.1 }] }],
    [0.65, { lean: -0.38, twist: 0.5, headTilt: 0.5, lift: 0, legs: [{ a: 0.06, k: 1.62, p: 1.25 }, { a: 0.12, k: 1.68, p: 1.25 }], arms: [{ a: 3.3, e: 0.1 }, { a: 2.4, e: 0.12 }] }],
    [1.0, { lean: -0.3, twist: 0.5, headTilt: 0.55, lift: 0, legs: [{ a: 0.04, k: 1.6, p: 1.25 }, { a: 0.1, k: 1.66, p: 1.25 }], arms: [{ a: 3.2, e: 0.2 }, { a: 2.3, e: 0.25 }] }],
  ];
  // Arquero de frente: listo, rebotando en las puntas de los pies.
  const READY = [
    [0.0, { lift: 0, legs: [{ a: 0.3, k: 0.62 }, { a: 0.3, k: 0.62 }], arms: [{ a: 0.95, e: -0.45 }, { a: 0.95, e: -0.45 }] }],
    [0.5, { lift: 10, legs: [{ a: 0.28, k: 0.42 }, { a: 0.28, k: 0.42 }], arms: [{ a: 1.05, e: -0.35 }, { a: 1.05, e: -0.35 }] }],
  ];
  // Estirada: carga, impulso con la pierna del lado de la pelota, vuelo y caída.
  const DIVE = [
    [0.0, { rot: 0, legs: [{ a: 0.32, k: 0.85 }, { a: 0.32, k: 0.85 }], arms: [{ a: 0.85, e: -0.35 }, { a: 0.85, e: -0.35 }] }],
    [0.18, { rot: 0.28, legs: [{ a: 0.12, k: 0.95 }, { a: 0.48, k: 0.25 }], arms: [{ a: 2.6, e: 0.4 }, { a: 2.2, e: 0.2 }] }],
    [0.42, { rot: 0.95, legs: [{ a: 0.1, k: 0.75 }, { a: 0.22, k: 0.1 }], arms: [{ a: 3.3, e: -0.1 }, { a: 2.75, e: 0.05 }] }],
    [0.7, { rot: 1.38, legs: [{ a: 0.06, k: 0.45 }, { a: 0.14, k: 0.08 }], arms: [{ a: 3.4, e: -0.05 }, { a: 2.92, e: 0.0 }] }],
    [1.0, { rot: 1.56, legs: [{ a: 0.16, k: 0.7 }, { a: 0.2, k: 0.35 }], arms: [{ a: 3.3, e: -0.1 }, { a: 2.85, e: 0.12 }] }],
  ];

  // Carrera vista de frente o de espaldas: las mismas fases, con el muslo y el brazo acortados en perspectiva.
  const runFront = (u, amp = 1) => {
    const p = run(u, amp);
    return { lift: p.lift, legs: p.legs.map((L) => ({ a: 0.06, f: L.a, k: L.k })), arms: p.arms.map((A) => ({ a: 0.16, e: 0.1, f: A.a, ef: A.e })) };
  };
  // Convierte una pose de costado a la vista de frente/espaldas (muslos y brazos en escorzo).
  const toFront = (p) => ({ lift: p.lift || 0, legs: p.legs.map((L, i) => ({ a: 0.07, f: L.a, k: L.k })), arms: p.arms.map((A) => ({ a: 0.22, e: 0.1, f: A.a, ef: A.e })) });
  const POSES = {
    run,
    runFront,
    toFront,
    kickBack: (u) => toFront(keyed(KICK, u, false)),
    armsUp: (u = 0) => ({ lift: Math.max(0, Math.sin(u * 6.28)) * 26, legs: [{ a: 0.1, f: 0.1, k: 0.25 }, { a: 0.1, f: 0.1, k: 0.25 }], arms: [{ a: 2.65 + Math.sin(u * 6.28) * 0.1, e: 0.15 }, { a: 2.65 - Math.sin(u * 6.28) * 0.1, e: 0.15 }] }),
    header: (u = 0) => ({ lift: 0, legs: [{ a: 0.1, f: 0.5, k: 1.2 }, { a: 0.1, f: 0.2, k: 0.9 }], arms: [{ a: 0.9, e: 0.6 }, { a: 0.9, e: 0.6 }] }),
    slide: () => ({ lean: -1.05, twist: 0.4, legs: [{ a: 1.25, k: 0.75, p: 0.2 }, { a: 1.5, k: 0.05, p: 0.6 }], arms: [{ a: -0.7, e: 0.4 }, { a: 0.9, e: 0.7 }], headTilt: 0.4 }),
    fallen: () => ({ lean: 0.05, twist: 0.5, rot: -1.5, legs: [{ a: 0.15, k: 0.4, p: 0.4 }, { a: -0.1, k: 0.2, p: 0.5 }], arms: [{ a: 0.6, e: 0.5 }, { a: 1.2, e: 0.4 }] }),
    idleFront: () => ({ legs: [{ a: 0.08, f: 0, k: 0.06 }, { a: 0.08, f: 0, k: 0.06 }], arms: [{ a: 0.14, e: 0.12, f: 0, ef: 0.3 }, { a: 0.14, e: 0.12, f: 0, ef: 0.3 }] }),
    idle: (u = 0) => ({ lean: 0.04 + Math.sin(u * 6.28) * 0.01, twist: 0.5, legs: [{ a: -0.08, k: 0.1, p: 0 }, { a: 0.12, k: 0.14, p: 0 }], arms: [{ a: -0.06, e: 0.38 + Math.sin(u * 6.28) * 0.04 }, { a: 0.12, e: 0.42 }] }),
    // Tanda de penales: abrazados en el círculo central (de frente o de espaldas;
    // los antebrazos caen sobre los hombros del de al lado).
    linked: (u = 0) => ({ legs: [{ a: 0.1, f: 0, k: 0.06 + Math.sin(u * 6.28) * 0.03 }, { a: 0.1, f: 0, k: 0.06 }], arms: [{ a: 1.5, e: -0.7, f: 0, ef: 0 }, { a: 1.5, e: -0.7, f: 0, ef: 0 }] }),
    // Los que pierden, en el pasto (de costado): sentado apoyado en las manos,
    // de rodillas con las manos en la cabeza, de rodillas mirando el piso y tirado boca arriba.
    sitBack: () => ({ lean: -0.35, twist: 0.5, legs: [{ a: 1.5, k: 1.3, p: 0 }, { a: 1.3, k: 1.0, p: 0 }], arms: [{ a: -0.6, e: 0.2 }, { a: -0.4, e: 0.3 }], headTilt: 0.5 }),
    kneelHead: () => ({ lean: 0.3, twist: 0.5, legs: [{ a: 0, k: 1.6, p: 0.9 }, { a: 0.1, k: 1.6, p: 0.9 }], arms: [{ a: 2.9, e: 2.7 }, { a: 2.7, e: 2.8 }], headTilt: -0.3 }),
    kneelDown: () => ({ lean: 0.6, twist: 0.5, legs: [{ a: 0, k: 1.6, p: 0.9 }, { a: 0.1, k: 1.6, p: 0.9 }], arms: [{ a: 0.3, e: 0.4 }, { a: 0.2, e: 0.3 }], headTilt: -0.6 }),
    lieBack: () => ({ lean: 0, twist: 0.5, rot: 1.55, legs: [{ a: 0.5, k: 0.9, p: 0.3 }, { a: 0.05, k: 0.1, p: 0.4 }], arms: [{ a: 2.3, e: 2.4 }, { a: 3.3, e: 0.3 }], headTilt: 0 }),
    kick: (u) => keyed(KICK, u, false),
    celebrate: (u) => keyed(CELE, u, false),
    keeperReady: (u = 0) => keyed(READY, u, true),
    keeperDive: (dir, u) => {
      const p = keyed(DIVE, u, false);
      const q = { ...p, rot: dir * p.rot };
      if (dir < 0) { q.legs = [p.legs[1], p.legs[0]]; q.arms = [p.arms[1], p.arms[0]]; }
      return q;
    },
  };
  return { sprite, ball, POSES, ramp, rgb, mix, keyed, lum };
})();

export { P4 };
