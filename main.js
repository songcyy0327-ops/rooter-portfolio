import { PROJECTS, VIZ } from './projects.js';

const gallery = document.getElementById('gallery');

// ===== 히어로 미니 씨앗 (지연 로딩: 첫 화면 후 three.js+GLB, 화면 밖이면 회전 정지) =====
async function initSeed() {
  const c = document.getElementById('seed');
  if (!c) return;
  try {
    const THREE = await import('three');
    const { GLTFLoader } = await import('./libs/GLTFLoader.js');
    const renderer = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const resize = () => { const w = c.clientWidth || 240; renderer.setSize(w, w, false); };
    resize();
    window.addEventListener('resize', resize);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 3.3);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a9a, 1.2));
    const key = new THREE.DirectionalLight(0xffffff, 1.5); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5); rim.position.set(-3, 2, -2); scene.add(rim);
    const holder = new THREE.Group();
    holder.rotation.z = Math.PI / 4; // 45도 눕힘
    scene.add(holder);
    new GLTFLoader().load('models/seed.glb', (gltf) => {
      const m = gltf.scene;
      const box = new THREE.Box3().setFromObject(m);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const s = 1.85 / (Math.max(size.x, size.y, size.z) || 1);
      m.scale.setScalar(s);
      m.position.set(-center.x * s, -center.y * s, -center.z * s); // 중심을 holder 원점으로
      holder.add(m);
    });
    let running = false;
    const frame = () => { if (!running) return; holder.rotation.y += 0.02; renderer.render(scene, camera); requestAnimationFrame(frame); };
    new IntersectionObserver((es) => {
      const vis = es[0].isIntersecting;
      if (vis && !running) { running = true; frame(); } else if (!vis) { running = false; }
    }, { threshold: 0 }).observe(c);
  } catch (e) { /* WebGL 미지원 시 무시 */ }
}
if ('requestIdleCallback' in window) requestIdleCallback(() => initSeed(), { timeout: 2500 });
else addEventListener('load', () => setTimeout(initSeed, 200));

// ===== 갤러리 카드 (FRAMA식, 빨강 포인트) =====
const THUMBS = ['thumbs/01_brandi.webp', 'thumbs/06_anaconda.webp', 'thumbs/09_nyangssaem.webp', 'thumbs/08_brandi_haru.webp',
  'thumbs/02_rareraw.webp', 'thumbs/03_oliveyoung.webp', 'thumbs/04_ohou.webp', 'thumbs/05_wadiz.webp', 'thumbs/10_sheismiss.webp',
  'subs/s1.webp', 'subs/s2.webp', 'subs/s3.webp', 'subs/s4.webp', 'subs/b1.webp', 'subs/b2.webp', 'subs/b3.webp', 'subs/b4.webp']; // 9~16 서브
// 프로젝트별 관련 이미지 (개수 가변: 1장→단일, 2장→2칸, 3장+→롤링 캐러셀)
// 대표(메인) 이미지 cX_1 은 상단 대표 자리에만 사용 → 관련 이미지에서는 제외
const CASES = [
  ['cases/c0_2.webp', 'cases/c0_3.webp'],
  ['cases/c1_2.webp', 'cases/c1_3.webp'],
  ['cases/c2_2.webp', 'cases/c2_3.webp', 'cases/c2_4.webp', 'cases/c2_5.webp'],
  ['cases/c3_2.webp', 'cases/c3_3.webp'],
  ['cases/c4_2.webp', 'cases/c4_3.webp'],
  ['cases/c5_2.webp'], // 5 = ③ 올리브영 (올리브영 2)
  ['cases/c6_2.webp', 'cases/c6_3.webp'],
  ['cases/c7_2.webp', 'cases/c7_4.webp', 'cases/c7_5.webp'],
  ['cases/c8_2.webp', 'cases/c8_3.webp', 'cases/c8_4.webp'],
  [], [], [], [], [], [], [], [] // 9~16 서브(단일 히어로 이미지)
];
function renderGallery(i) {
  const imgs = CASES[i] || [];
  if (imgs.length === 0) return '';
  if (imgs.length <= 2) { // 1장→단일 / 2장→2칸 (대표 썸네일 미사용, 원본 비율 유지)
    const cls = imgs.length === 1 ? 'case-gallery one' : 'case-gallery';
    return `<div class="${cls}">` + imgs.map(s => `<img class="case-img" src="${s}" alt="">`).join('') + `</div>`;
  }
  // 3장+ : 2칸 유지하며 한 칸씩 롤링
  const slides = imgs.map(s => `<div class="cs-slide"><img class="cs-img" src="${s}" alt=""></div>`).join('');
  const dots = imgs.slice(0, imgs.length - 1).map((_, k) => `<span class="cs-dot${k === 0 ? ' on' : ''}"></span>`).join('');
  return `<div class="case-carousel two"><div class="cs-track">${slides}</div>` +
    `<button class="cs-next" aria-label="다음 이미지">&#8250;</button><div class="cs-dots">${dots}</div></div>`;
}

const reviewsEl = document.getElementById('reviews');
const moreEl = document.getElementById('more');
const anchor = moreEl || reviewsEl;
const ORDER = [0, 2, 7, 6, 1, 5, 3, 8, 4]; // 노출 순서(추천순 1,4,9,7,2,3,5,8,6 적용)
ORDER.forEach((i, pos) => {
  const d = PROJECTS[i];
  const b = document.createElement('div');
  b.className = 'gblock ' + (pos % 2 === 0 ? 'left' : 'right');
  const t = THUMBS[i];
  const imgStyle = t ? `style="background-image:url('${t}')"` : '';
  b.innerHTML =
    `<div class="gimg" ${imgStyle}></div>` +
    `<div class="col-body"><div class="gno">${d.brand}</div>` +
    `<div class="gtags">${d.skills.map(s => `<span>${s}</span>`).join('')}</div>` +
    `<div class="gtit">${d.title}</div>` +
    `<div class="gstats">${d.stats.map(s => `<div class="stat"><span class="num">${s.num}</span><span class="lab">${s.lab}</span></div>`).join('')}</div></div>`;
  b.addEventListener('click', () => openModal(i));
  gallery.insertBefore(b, anchor); // 프로젝트 블록을 추가프로젝트(#more) 앞에 배치
});

// ===== 추가(서브) 프로젝트 그리드 (첨부 레이아웃) =====
const SUB_ORDER = [12, 11, 10, 9, 16, 15, 13, 14]; // 케이펫페어·사회공헌·SEO·전문관 / TVC·오리온·네이버·유튜브
const moreGrid = document.getElementById('moreGrid');
if (moreGrid) {
  SUB_ORDER.forEach(i => {
    const d = PROJECTS[i];
    const t = THUMBS[i];
    const visual = t
      ? `<div class="mp-img" style="background-image:url('${t}')"></div>`
      : `<div class="mp-img ph"></div>`;
    const c = document.createElement('div');
    c.className = 'mp-card';
    c.innerHTML =
      visual +
      `<div class="mp-brand">${d.brand}</div>` +
      `<div class="mp-title">${d.title}</div>` +
      `<div class="mp-desc">${d.sub || d.oneline}</div>`;
    c.addEventListener('click', () => openModal(i));
    moreGrid.appendChild(c);
  });
}

// ===== 본문 시각화(그래프·도식) 렌더러 =====
function vizFor(i, sec) {
  return (VIZ[i] || []).filter(v => v.after === sec).map(renderViz).join('');
}
function renderViz(v) {
  if (v.type === 'bars') return vizBars(v);
  if (v.type === 'hbars') return vizHbars(v);
  if (v.type === 'trend') return vizTrend(v);
  if (v.type === 'flow') return vizFlow(v);
  if (v.type === 'pivot') return vizPivot(v);
  if (v.type === 'donut') return vizDonut(v);
  if (v.type === 'pairs') return vizPairs(v);
  if (v.type === 'growth') return vizGrowth(v);
  return '';
}
// 전략: 문제점 → 해결방안 페어 카드
function vizPairs(v) {
  const rows = v.rows.map(r =>
    `<div class="vz-pair"><div class="vz-pp">${r.problem}</div><div class="vz-parrow"></div><div class="vz-ps">${r.solution}</div></div>`
  ).join('');
  return `<div class="viz"><div class="viz-t">${v.title || '문제점 → 해결방안'}</div>` +
    `<div class="vz-pairs"><div class="vz-phead"><span>문제점</span><span></span><span>해결방안</span></div>${rows}</div></div>`;
}
// 성과: 성장 곡선 + 우상단 주황 딱지
function vizGrowth(v) {
  const W = 440, H = 210, padX = 50, padTop = 46, padBot = 46;
  const hi = Math.max(v.from.val, v.to.val) * 1.14 || 1;
  const x0 = padX, x1 = W - padX;
  const Y = val => H - padBot - (val / hi) * (H - padTop - padBot);
  const y0 = Y(v.from.val), y1 = Y(v.to.val);
  const cx = x0 + (x1 - x0) * 0.58;
  const line = `M ${x0} ${y0.toFixed(1)} Q ${cx.toFixed(1)} ${y0.toFixed(1)} ${x1} ${y1.toFixed(1)}`;
  const area = `${line} L ${x1} ${H - padBot} L ${x0} ${H - padBot} Z`;
  return `<div class="viz vz-growthwrap"><div class="viz-t">${v.title || ''}</div>` +
    `<div class="vz-badge">${v.badge}</div>` +
    `<svg viewBox="0 0 ${W} ${H}" class="vz-growth">` +
    `<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FE2400" stop-opacity=".22"/><stop offset="1" stop-color="#FE2400" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${area}" fill="url(#gg)"/><path d="${line}" fill="none" stroke="#FE2400" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="${x0}" cy="${y0.toFixed(1)}" r="5" fill="#bdb9b1"/><circle cx="${x1}" cy="${y1.toFixed(1)}" r="6.5" fill="#FE2400"/>` +
    `<text x="${x0}" y="${(y0 - 15).toFixed(1)}" class="vz-gpv">${v.from.disp}</text>` +
    `<text x="${x1}" y="${(y1 - 17).toFixed(1)}" class="vz-gpv hi">${v.to.disp}</text>` +
    `<text x="${x0}" y="${H - padBot + 24}" class="vz-gpx">${v.from.lab}</text>` +
    `<text x="${x1}" y="${H - padBot + 24}" class="vz-gpx">${v.to.lab}</text>` +
    `</svg></div>`;
}
function vizHbars(v) {
  const max = Math.max(...v.items.map(i => i.val));
  const rows = v.items.map(it => {
    const w = Math.max(4, Math.round(it.val / max * 100));
    return `<div class="vz-hrow"><div class="vz-hlab">${it.lab}</div>` +
      `<div class="vz-htrack"><div class="vz-hfill${it.hi ? ' hi' : ''}" style="width:${w}%"></div></div>` +
      `<div class="vz-hval">${it.disp ?? it.val}${v.unit || ''}</div></div>`;
  }).join('');
  return `<div class="viz"><div class="viz-t">${v.title}</div><div class="vz-hbars">${rows}</div></div>`;
}
function vizDonut(v) {
  const total = v.segments.reduce((s, x) => s + x.val, 0);
  const R = 54, C = 2 * Math.PI * R, pal = ['#d8d4cd', '#bdb9b1', '#e7e4df'];
  let off = 0, gi = 0;
  const rings = v.segments.map(s => {
    const len = s.val / total * C;
    const col = s.hi ? 'var(--red)' : pal[gi++ % pal.length];
    const el = `<circle cx="75" cy="75" r="${R}" fill="none" stroke="${col}" stroke-width="21" stroke-dasharray="${len.toFixed(2)} ${(C - len).toFixed(2)}" stroke-dashoffset="${(-off).toFixed(2)}" transform="rotate(-90 75 75)"/>`;
    off += len; return el;
  }).join('');
  gi = 0;
  const legend = v.segments.map(s => {
    const col = s.hi ? 'var(--red)' : pal[gi++ % pal.length];
    return `<div class="vz-lg"><span class="vz-sw" style="background:${col}"></span>${s.lab} <b>${Math.round(s.val / total * 100)}%</b></div>`;
  }).join('');
  return `<div class="viz"><div class="viz-t">${v.title}</div><div class="vz-donut">` +
    `<div class="vz-ring"><svg viewBox="0 0 150 150" class="vz-dsvg">${rings}</svg>` +
    `<div class="vz-dc"><div class="vz-dnum">${v.center || ''}</div><div class="vz-dlab">${v.centerLab || ''}</div></div></div>` +
    `<div class="vz-legend">${legend}</div></div></div>`;
}
function vizPivot(v) {
  const probs = v.problems.map(p => `<div class="vz-pcard">${p}</div>`).join('');
  return `<div class="viz"><div class="vz-pivot"><div class="vz-prob">${probs}</div>` +
    `<div class="vz-down">↓</div><div class="vz-q">“${v.question}”</div>` +
    `<div class="vz-down">↓</div><div class="vz-sol">${v.solution}</div></div></div>`;
}
function vizBars(v) {
  const max = Math.max(...v.items.map(it => it.val));
  const cols = v.items.map(it => {
    const h = Math.max(3, Math.round(it.val / max * 100));
    return `<div class="vz-col"><div class="vz-val">${it.disp ?? it.val}${v.unit || ''}</div>` +
      `<div class="vz-track"><div class="vz-fill${it.hi ? ' hi' : ''}" style="height:${h}%"></div></div>` +
      `<div class="vz-lab">${it.lab}</div></div>`;
  }).join('');
  return `<div class="viz"><div class="viz-t">${v.title}</div><div class="vz-bars">${cols}</div></div>`;
}
function vizFlow(v) {
  const steps = v.steps.map((s, i) => `<div class="vz-step"><span class="vz-sn">${String(i + 1).padStart(2, '0')}</span><span class="vz-st">${s}</span></div>` +
    (i < v.steps.length - 1 ? '<div class="vz-arr">→</div>' : '')).join('');
  return `<div class="viz"><div class="viz-t">${v.title}</div><div class="vz-flow">${steps}</div></div>`;
}
function vizTrend(v) {
  const W = 320, H = 132, P = 28;
  const vals = v.points.map(p => p.val);
  const max = Math.max(...vals), min = Math.min(...vals), rng = (max - min) || 1, n = v.points.length;
  const X = i => P + i * (W - 2 * P) / (n - 1);
  const Y = val => H - P - (val - min) / rng * (H - 2 * P);
  const line = v.points.map((p, i) => `${X(i).toFixed(1)},${Y(p.val).toFixed(1)}`).join(' ');
  const area = `${X(0).toFixed(1)},${H - P} ` + line + ` ${X(n - 1).toFixed(1)},${H - P}`;
  const dots = v.points.map((p, i) =>
    `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.val).toFixed(1)}" r="4" class="vz-dot"/>` +
    `<text x="${X(i).toFixed(1)}" y="${(Y(p.val) - 12).toFixed(1)}" class="vz-pv">${p.val}</text>` +
    `<text x="${X(i).toFixed(1)}" y="${H - 8}" class="vz-px">${p.lab}</text>`).join('');
  return `<div class="viz"><div class="viz-t">${v.title}</div>` +
    `<svg class="vz-trend" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">` +
    `<polygon points="${area}" class="vz-area"/><polyline points="${line}" class="vz-line"/>${dots}</svg></div>`;
}

// ===== 프로젝트 팝업 =====
const modal = document.getElementById('modal');
const card = document.getElementById('card');
function openModal(i) {
  const d = PROJECTS[i];
  const cls = d.tag === '뿌리' ? 'root' : '';
  const tagTxt = d.tag === '뿌리' ? '뿌리 · 0→1 구축' : '성장 · 숫자 증명';
  const t = THUMBS[i];
  const thumbHtml = (t && i < 9) ? `<div class="case-thumb" style="background-image:url('${t}')"></div>` : ''; // 서브(i>=9)는 세부 페이지에 이미지 없음
  const figs = d.stats.map(s => `<div class="case-fig"><div class="num">${s.num}</div><div class="bar"></div><div class="lab">${s.lab}</div></div>`).join('');
  card.innerHTML = `
    <div class="close" id="closeBtn"></div>
    <h2 class="case-title">${d.title}</h2>
    <p class="case-oneline">${d.oneline}</p>
    <div class="case-meta"><span><b>BRAND</b>${d.brand}</span><span><b>ROLE</b>${d.role}</span></div>
    ${figs ? `<div class="case-figures">${figs}</div>` : ''}
    ${thumbHtml}
    <div class="case-sec"><div class="lbl"><span class="en">Background</span><span class="ko">배경 · 문제</span></div><div class="body">${d.a}</div>${vizFor(i, 'a')}</div>
    <div class="case-sec"><div class="lbl"><span class="en">Goal</span><span class="ko">목표</span></div><div class="body">${d.b}</div>${vizFor(i, 'b')}</div>
    <div class="case-sec"><div class="lbl"><span class="en">Strategy</span><span class="ko">전략 · 근거</span></div><div class="body">${d.c}</div>${vizFor(i, 'c')}</div>
    <div class="case-sec"><div class="lbl"><span class="en">Result</span><span class="ko">실행 · 성과</span></div><div class="body">${d.d}</div>${vizFor(i, 'd')}</div>
    ${renderGallery(i)}`;
  modal.classList.add('open');
  modal.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  document.getElementById('closeBtn').onclick = closeModal;
  // 캐러셀(3장+) > 버튼 롤링
  const car = card.querySelector('.case-carousel');
  if (car) {
    const track = car.querySelector('.cs-track');
    const dots = [...car.querySelectorAll('.cs-dot')];
    const n = dots.length; let cur = 0;
    const go = k => { cur = (k + n) % n; track.style.transform = `translateX(-${cur * 50}%)`; dots.forEach((d, j) => d.classList.toggle('on', j === cur)); };
    car.querySelector('.cs-next').onclick = () => go(cur + 1);
  }
}
function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ===== 내비 점프 =====
document.querySelectorAll('[data-jump]').forEach(el => el.addEventListener('click', () => {
  const p = parseFloat(el.dataset.jump);
  const max = document.body.scrollHeight - innerHeight;
  scrollTo({ top: p * max, behavior: 'smooth' });
}));

// ===== 소개(Profile) 섹션 스르륵 등장 (첫 스크롤 진입 시 1회) =====
const introEl = document.getElementById('intro');
if (introEl && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => { if (e.isIntersecting) { introEl.classList.add('in'); obs.disconnect(); } });
  }, { threshold: 0.15 });
  io.observe(introEl);
} else if (introEl) {
  introEl.classList.add('in'); // 폴백: 옵저버 미지원 시 즉시 표시
}

// ===== 관련 이미지 라이트박스(클릭 시 크게 보기) =====
const lightbox = document.getElementById('lightbox');
const lbimg = document.getElementById('lbimg');
document.addEventListener('click', e => {
  const im = e.target.closest('.case-img, .cs-img');
  if (im && im.tagName === 'IMG') { lbimg.src = im.src; lightbox.classList.add('open'); }
});
lightbox.addEventListener('click', () => { lightbox.classList.remove('open'); lbimg.removeAttribute('src'); });
addEventListener('keydown', e => { if (e.key === 'Escape') { lightbox.classList.remove('open'); } });
