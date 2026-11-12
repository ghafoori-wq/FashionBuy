import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';

// Global hook used by <img onerror> handlers: swaps a broken remote/local photo
// for the built-in high-contrast SVG street-style illustration (never blank).
window.__sketchFallback = svgSketchURI;

// ---------- Global error handler: silently ignore harmless resource errors ----------
// Prevents "ERROR: unknown @ line ?" from flashing on screen when a local
// image or external script fails to load — the page keeps working via fallbacks.
window.addEventListener('error', ev => {
    if (!ev.filename || ev.message === 'Script error.') return;
    // Only log genuine script errors with a file/line, ignore resource load failures
    console.warn('[resource error]', ev.message, ev.filename, ev.lineno || '');
    ev.preventDefault?.();
}, true);
window.addEventListener('unhandledrejection', ev => {
    const msg = String(ev.reason || ev.reason?.message || '');
    if (!msg || msg.includes('Script error')) return;
    console.warn('[unhandled rejection]', msg.slice(0, 200));
}, true);

// ---------- HTML-escape helper (used by every innerHTML renderer) ----------
function esc(str) { return String(str ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

// ---------- Null-safe DOM helper + all DOM refs declared upfront ----------
const $ = id => document.getElementById(id);
const avatars = { male: null, female: null };

// Every DOM element reference is created here (top of file) so no later code
// can ever hit "Cannot access X before initialization".
const uploadBox = $('upload-area');
const photoInput = $('photo-input');
const mirrorCard = $('mirror-card');
const mirrorImg = $('mirror-photo');
const mirrorPh = $('mirror-placeholder');
const cardTip = $('card-tip');
const paypalBar = $('paypal-bar');
const paypalBarEl = $('paypal-bar');

// ---------- Hide the splash overlay immediately so the room is visible ----------
function hideOverlay() {
  const overlay = $('overlay');
  if (!overlay) return;
  overlay.style.transition = 'opacity 0.6s';
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => overlay.remove(), 700);
}
requestAnimationFrame(hideOverlay);
window.addEventListener('load', hideOverlay, { once: true });

// Scene — luxury architectural studio: deep obsidian with a whisper of royal violet
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0c0814);
scene.fog = new THREE.FogExp2(0x0c0814, 0.028);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.1, 6.2);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
// Refined 90-degree front architectural arc — never spins behind the studio walls
controls.minAzimuthAngle = -Math.PI / 4;
controls.maxAzimuthAngle =  Math.PI / 4;
controls.minPolarAngle = Math.PI / 3.2;
controls.maxPolarAngle = Math.PI / 2.15;
controls.minDistance = 2.8;
controls.maxDistance = 8.5;
controls.enablePan = false;

// Luxury studio floor: dark matte obsidian/marble (no neon grid lines)
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.MeshStandardMaterial({ color: 0x0c0814, roughness: 0.85, metalness: 0.08 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

// ============================================================
// EDITORIAL 3-POINT STUDIO LIGHTING (warm key · violet rim · soft fill)
// ============================================================
scene.add(new THREE.AmbientLight(0xefe6ff, 0.55));                       // soft ambient
const hemi = new THREE.HemisphereLight(0xf5eee6, 0x1a1230, 0.35);        // gentle sky bounce
scene.add(hemi);

// Warm key light (soft editorial spot from front-left)
const keyLight = new THREE.SpotLight(0xfff1dc, 60, 22, Math.PI / 5, 0.55, 1.6);
keyLight.position.set(-2.4, 4.6, 3.4);
keyLight.target.position.set(0, 1.2, 0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.bias = -0.0004;
scene.add(keyLight, keyLight.target);

// Deep-violet rim light (#6d28d9) from behind-right for sculpted silhouettes
const rimLight = new THREE.DirectionalLight(0x6d28d9, 1.5);
rimLight.position.set(2.6, 3.4, -3.2);
scene.add(rimLight);

// Cool champagne fill from front-right (very low intensity, flattens harsh shadow)
const fillLight = new THREE.PointLight(0xe6d8a8, 10, 16, 2);
fillLight.position.set(3.4, 2.6, 3.6);
scene.add(fillLight);

// ============================================================
// HIGH-END CYBER-FASHION STUDIO DRESSING — architectural lighting
// ============================================================

// ---------- Architectural wall accents: tall brushed-brass slats (no neon glow) ----------
function createWallSlat(x, z, height = 4.4) {
    const g = new THREE.Group();
    const slat = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, height, 0.07),
        new THREE.MeshStandardMaterial({ color: 0x1a1520, metalness: 0.85, roughness: 0.35 })
    );
    slat.position.y = height / 2;
    const goldBand = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.015, 0.075),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.25 })
    );
    goldBand.position.y = height * 0.78;
    const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.18, 0.07, 16),
        new THREE.MeshStandardMaterial({ color: 0x17121f, metalness: 0.9, roughness: 0.3 })
    );
    base.position.y = 0.035;
    g.add(slat, goldBand, base);
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
}
createWallSlat(-3.2, -2.9);
createWallSlat( 3.2, -2.9);
createWallSlat(-5.4,  0.4);
createWallSlat( 5.4,  0.4);

// Pedestal X positions — declared here (before first use by floorGlow)
const PED_X = { male: -1.5, female: -0.45 };   // side-by-side at left-center of the stage

// Soft volumetric floor reflections beneath the pedestals & the sewing mat
function floorGlow(x, z, color, size = 1.9) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g2 = c.getContext('2d');
    const grad = g2.createRadialGradient(64, 64, 4, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,255,255,0.5)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.16)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g2.fillStyle = grad; g2.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(
        new THREE.PlaneGeometry(size, size),
        new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity: 0.55,
            blending: THREE.AdditiveBlending, depthWrite: false })
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.012, z);
    scene.add(m);
    return m;
}
floorGlow(PED_X.male, 0, 0xfff1dc, 2.4);   // warm spotlight pools under the avatars
floorGlow(PED_X.female, 0, 0xfff1dc, 2.4);
const matFloorGlow = floorGlow(0, 4.2, 0xfff1dc, 5.0);  // under the sewing cutting table

// ---------- Left studio prop 1: tailor's dress-form mannequin on a wooden tripod stand ----------
(function createDressForm() {
    const g = new THREE.Group();
    // torso: dark charcoal fabric
    const fabric = new THREE.MeshStandardMaterial({ color: 0x2b2b31, roughness: 0.9, metalness: 0.05 });
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.32, 8, 16), fabric);
    torso.position.y = 1.18; torso.scale.set(1, 1, 0.72);
    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), fabric);
    chest.position.set(0, 1.3, 0.02); chest.scale.set(1.05, 0.8, 0.75);
    const neckCap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.1, 12), fabric);
    neckCap.position.y = 1.52;
    const neckKnob = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x8a5a2b, roughness: 0.6 }));
    neckKnob.position.y = 1.6;
    // pin line accent (subtle rim glow)
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.006, 8, 40),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3 }));
    seam.rotation.x = Math.PI / 2; seam.position.y = 1.14; seam.scale.z = 1.5;
    // waist tape
    const tape = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.012, 8, 40),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3 }));
    tape.rotation.x = Math.PI / 2; tape.position.y = 0.94; tape.scale.z = 1.9;
    // wooden pole + tripod stand
    const wood = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.7, metalness: 0.05 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.78, 12), wood);
    pole.position.y = 0.4;
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.08, 12),
        new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.8, roughness: 0.4 }));
    collar.position.y = 0.79;
    const tripod = new THREE.Group();
    for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.55, 8), wood);
        const a = (i / 3) * Math.PI * 2 + 0.5;
        leg.position.set(Math.cos(a) * 0.16, 0.14, Math.sin(a) * 0.16);
        leg.rotation.z = Math.cos(a) * 0.55;
        leg.rotation.x = -Math.sin(a) * 0.55;
        tripod.add(leg);
    }
    tripod.position.y = -0.13;
    g.add(torso, chest, neckCap, neckKnob, seam, tape, pole, collar, tripod);
    // rim lighting
    const rim = new THREE.PointLight(0xe6d8a8, 2, 3.5, 2);
    rim.position.set(0.8, 1.6, 0.8);
    g.add(rim);
    g.position.set(-4.2, 0, -0.8);
    g.rotation.y = 0.5;
    scene.add(g);
})();

// ---------- Left studio prop 2: matte-black cylindrical planter with lush 3D leaves ----------
(function createPlanter() {
    const g = new THREE.Group();
    const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.19, 0.42, 20),
        new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.45, metalness: 0.35 })
    );
    pot.position.y = 0.21;
    const rimR = new THREE.Mesh(
        new THREE.TorusGeometry(0.24, 0.015, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0x2a2a30, metalness: 0.6, roughness: 0.4 })
    );
    rimR.rotation.x = Math.PI / 2; rimR.position.y = 0.42;
    const soil = new THREE.Mesh(new THREE.CircleGeometry(0.21, 16),
        new THREE.MeshStandardMaterial({ color: 0x1a120a, roughness: 1 }));
    soil.rotation.x = -Math.PI / 2; soil.position.y = 0.415;
    g.add(pot, rimR, soil);
    // lush leaves: curved blade geometry on stems
    const leafMatA = new THREE.MeshStandardMaterial({ color: 0x2f9e44, roughness: 0.6, side: THREE.DoubleSide });
    const leafMatB = new THREE.MeshStandardMaterial({ color: 0x51cf66, roughness: 0.6, side: THREE.DoubleSide });
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(0, 0);
    bladeShape.quadraticCurveTo(0.055, 0.14, 0, 0.3);
    bladeShape.quadraticCurveTo(-0.055, 0.14, 0, 0.0);
    const bladeGeo = new THREE.ShapeGeometry(bladeShape, 12);
    for (let i = 0; i < 14; i++) {
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.006, 0.009, 0.3 + Math.random() * 0.3, 6),
            new THREE.MeshStandardMaterial({ color: 0x237032, roughness: 0.7 })
        );
        const a = Math.random() * Math.PI * 2;
        const r = Math.random() * 0.12;
        stem.position.set(Math.cos(a) * r, 0.42, Math.sin(a) * r);
        g.add(stem);
        const blade = new THREE.Mesh(bladeGeo, i % 2 ? leafMatA : leafMatB);
        blade.position.copy(stem.position);
        blade.position.y += 0.12;
        blade.rotation.set(
            0.9 + Math.random() * 0.5,
            a,
            (Math.random() - 0.5) * 0.6
        );
        const s = 0.8 + Math.random() * 0.7;
        blade.scale.setScalar(s);
        g.add(blade);
    }
    const glow = new THREE.PointLight(0xe6d8a8, 1.2, 2.5, 2);
    glow.position.set(0, 0.5, 0.4);
    g.add(glow);
    g.position.set(-4.0, 0, 0.6);
    scene.add(g);
})();

// ---------- Right studio prop: studio broadcast microphone on an articulated boom arm ----------
let micRing = null;
(function createBoomMic() {
    const g = new THREE.Group();
    const black = new THREE.MeshStandardMaterial({ color: 0x0d0d11, roughness: 0.35, metalness: 0.75 });
    // desk clamp base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.05, 18), black);
    // lower boom segment (vertical riser)
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 10), black);
    riser.position.set(0, 0.27, 0);
    // upper boom segment (angled toward the desk)
    const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.44, 10), black);
    boom.position.set(0.17, 0.56, 0);
    boom.rotation.z = -1.15;
    // shock mount
    const mount = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.008, 8, 22), black);
    mount.position.set(0.36, 0.5, 0);
    mount.rotation.y = Math.PI / 2;
    // capsule microphone body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.17, 20), black);
    body.position.set(0.36, 0.43, 0);
    body.rotation.z = 0.0;
    const grille = new THREE.Mesh(new THREE.SphereGeometry(0.052, 18, 12),
        new THREE.MeshStandardMaterial({ color: 0x1c1c22, roughness: 0.55, metalness: 0.9 }));
    grille.position.set(0.36, 0.5, 0);
    // subtle champagne ring on the grille
    micRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 28),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3 }));
    micRing.position.set(0.36, 0.47, 0);
    micRing.rotation.y = Math.PI / 2;
    const micGlow = new THREE.PointLight(0xe6d8a8, 0.8, 1.4, 2);
    micGlow.position.set(0.36, 0.47, 0.1);
    g.add(base, riser, boom, mount, body, grille, micRing, micGlow);
    g.rotation.y = Math.PI / 2;   // boom reaches over the desk
    g.position.set(3.2, 0.8, 1.2);
    scene.add(g);
})();
// Gold-edged circular pedestal platforms (quiet, architectural)
function createPedestal(x) {
    const disc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.72, 0.78, 0.05, 48),
        new THREE.MeshStandardMaterial({ color: 0x16111f, metalness: 0.7, roughness: 0.4 })
    );
    disc.position.set(x, 0.026, 0);
    disc.receiveShadow = true;
    scene.add(disc);
    const edge = new THREE.Mesh(
        new THREE.TorusGeometry(0.73, 0.012, 10, 64),
        new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 1, roughness: 0.3 })
    );
    edge.rotation.x = Math.PI / 2;
    edge.position.set(x, 0.052, 0);
    scene.add(edge);
}
createPedestal(PED_X.male);
createPedestal(PED_X.female);

// ---------- Luxury brand catalog: distinct outfits per Brand × Gender ----------
// Assets come from ./models2/ (local screenshots of the collection) and the
// classic Unsplash shots. The card geometry auto-adjusts to each image's true
// aspect ratio so nothing stretches, crops or floats outside the board frame.
// Actual files live one level deeper (models/models2/) — fetch the real list
// from the server so we never hard-code the filenames wrong.
// Load real outfit photos from BOTH local folders. The server's index.json
// already lists only image files (.jpg/.jpeg/.png/.webp). Every local-slot
// outfit gets a real photo URL; leftovers are distributed round-robin so all
// cards on the 3D board can show a genuine photo when available.
const LOCAL_IMAGE_DIRS = ['models2/'];
// Explicit image database: the EXACT active file names in models2/ (VS Code
// Explorer). Mixed extensions + copy variants, exactly as they exist on disk.
const FEMALE_VELOURA_FILES = [
    'female_velouranoir.png',
    'female_velouranoir_(2)_Copy.jpg',
    'female_velouranoir_(2)_Copy.png',
    'female_velouranoir_(3)_Copy.jpg',
    'female_velouranoir_(3)_Copy.png',
    'female_velouranoir_(4)_Copy.jpg',
    'female_velouranoir_(4)_Copy.png',
    'female_velouranoir_(5)_Copy.png',
    'female_velouranoir_(6)_Copy.jpg',
    'female_velouranoir_(6)_Copy.png',
    'female_velouranoir_(7)_Copy.jpg',
    'female_velouranoir_(7)_Copy.png',
    'female_velouranoir_(8)_Copy.jpg',
    'female_velouranoir_Copy.jpg',
    'female_velouranoir_Copy.png',
    'female_velouranoir_(9).jpg'
];
const MALE_VELOURA_FILES = [
    'male_velouranoir_Copy.jpg',
    'male_velouranoir_Copy.png',
    'male_velouranoir_(2)_Copy.jpg',
    'male_velouranoir_(2)_Copy.png',
    'male_velouranoir_(3)_Copy.jpg',
    'male_velouranoir_(3)_Copy.png',
    'male_velouranoir_(4)_Copy.jpg',
    'male_velouranoir_(4)_Copy.png',
    'male_velouranoir_(5)_Copy.jpg',
    'male_velouranoir_(6)_Copy.jpg',
    'male_velouranoir_(7)_Copy.jpg',
    'male_velouranoir_(8)_Copy.jpg',
    'male_velouranoir_(9)_Copy.jpg',
    'male_velouranoir_(10)_Copy.jpg',
    'male_velouranoir_(11)_Copy.jpg',
    'male_velouranoir_(12).jpg'
];
const IMAGE_DB = {
    female: FEMALE_VELOURA_FILES.map(f => 'models/models2/' + encodeURIComponent(f)),
    male:   MALE_VELOURA_FILES.map(f => 'models/models2/' + encodeURIComponent(f))
};
const SUIT_IMAGES = [];          // male-bank photos (models2/)
const EXTRA_IMAGES = [];         // female-bank photos (models2/)
(function loadSuitImages() {
    const jobs = [Promise.resolve(IMAGE_DB.male), Promise.resolve(IMAGE_DB.female)];
    Promise.all(jobs).then(async ([primary, extra]) => {
        // Guard against non-array results (e.g. a failed/odd fetch) so the
        // spreads below can never throw "extra is not iterable".
        const safePrimary = Array.isArray(primary) ? primary : [];
        const safeExtra = Array.isArray(extra) ? extra : [];
        // Auto-assign a distinct, realistic luxury price to EVERY outfit card so
        // no two items share the same tag (e.g. $125, $189, $240, $310 …).
        const PRICE_LADDER = [125, 149, 168, 189, 215, 240, 265, 290, 310, 335, 360, 385];
        const used = new Set(OUTFITS.map(o => o.price).filter(Boolean));
        let li = 0;
        OUTFITS.forEach(o => {
            if (!o.price) o.price = PRICE_LADDER[li++ % PRICE_LADDER.length];
            while (used.has(o.price)) o.price += 5;   // nudge until distinct
            used.add(o.price);
        });
        SUIT_IMAGES.push(...safePrimary);
        EXTRA_IMAGES.push(...safeExtra);
        if (SUIT_IMAGES.length || EXTRA_IMAGES.length) {
            // Distribute secondary-folder photos across still-empty local slots
            let k = 0;
            OUTFITS.forEach(o => {
                if (o.local && !o.img && EXTRA_IMAGES[k]) o.img = EXTRA_IMAGES[k++];
            });
            // Round-robin any extras onto ALL cards that still have no image,
            // so every card gets the chance to show a real local photo.
            const pool = EXTRA_IMAGES.slice(k).concat(SUIT_IMAGES);
            let p = 0;
            OUTFITS.forEach(o => { if (!o.img && pool[p]) { o.img = pool[p++ % pool.length]; o.local = true; } });
            assignLocalImages();
        }
        // Load textures first so MODELS2_IMAGE_FILES is populated, then resolve
        // every outfit img to a /models2/ URL so the 3D showcase board cards
        // visibly display the loaded model images.
        await loadModels2Textures();
        OUTFITS.forEach(o => { o.img = models2ImageUrl(o) || o.img || svgSketchURI(o.kind || 'suit', '#' + (o.color ?? 0x8b5cf6).toString(16).padStart(6, '0')); });
        buildBoardCards(); // re-render once local assets arrive
    });
})();

// Resolve each outfit's real local photo URL (primary folder by localIndex,
// then any leftover local photos, then any image at all) after the fetch.
function assignLocalImages() {
    const localSlots = OUTFITS.filter(o => o.local);
    const bankFor = g => (g === 'female' ? IMAGE_DB.female : IMAGE_DB.male);
    localSlots.forEach(o => { o.img = bankFor(o.gender)[o.localIndex] || o.img; });
    const pool = SUIT_IMAGES.concat(EXTRA_IMAGES);
    let p = 0;
    OUTFITS.forEach(o => {
        if (!o.img && pool[p]) { o.img = pool[p++ % pool.length]; }
        else if (!o.img && o.local) { p++; }
    });
}

// High-contrast built-in SVG street-style illustrations — guaranteed offline
// fallback so a card is NEVER blank when neither a local photo nor a remote
// photo is reachable.
function svgSketchURI(kind, hex) {
    const art = {
        gown: `<circle cx='105' cy='30' r='20'/><path d='M85 52 L125 52 L112 90 L140 200 L70 200 L98 90 Z' fill='${hex}' opacity='.55' stroke='white' stroke-width='3'/>`,
        suit: `<circle cx='105' cy='28' r='19'/><path d='M60 60 L150 60 L142 205 L68 205 Z' fill='${hex}' opacity='.5' stroke='white' stroke-width='3'/><path d='M105 62 L85 120 L105 205 L125 120 Z' fill='white' opacity='.85'/>`,
        jacket: `<circle cx='105' cy='26' r='18'/><path d='M62 55 L148 55 L140 110 L70 110 Z' fill='${hex}' opacity='.55' stroke='white' stroke-width='3'/><path d='M80 112 L74 205 M130 112 L136 205' stroke='white' stroke-width='8' fill='none'/>`,
        hoodie: `<circle cx='105' cy='32' r='20'/><path d='M70 70 A35 35 0 0 1 140 70 L146 160 L64 160 Z' fill='${hex}' opacity='.55' stroke='white' stroke-width='3'/><path d='M85 120 A20 12 0 0 0 125 120' stroke='white' stroke-width='3' fill='none'/>`,
        couture: `<circle cx='105' cy='28' r='19'/><path d='M92 50 L118 50 L112 95 M78 100 C20 140 190 140 132 100 C118 170 92 170 78 100 Z' fill='${hex}' opacity='.55' stroke='white' stroke-width='3'/>`,
        jump: `<circle cx='105' cy='26' r='18'/><path d='M64 55 L146 55 L138 118 L72 118 Z' fill='${hex}' opacity='.55' stroke='white' stroke-width='3'/><path d='M82 120 L76 208 M128 120 L134 208' stroke='${hex}' stroke-width='14'/>`
    };
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='210' height='230'><rect width='210' height='230' fill='#150a2e'/><text x='105' y='222' fill='%23c084fc' font-family='Segoe UI,Arial' font-size='12' font-weight='bold' text-anchor='middle'>STREET STYLE</text>${art[kind] || art.suit}</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
const BRANDS = ['vogue', 'noir', 'karios', 'zentra'];
// 32-outfit structured catalog: 4 male + 4 female per brand.
// kind → SVG fallback sketch; localIndex → slot into ./models2/models2/ photos.
const OUTFITS = [
    // --- VOGUE ---
    { id: 'av-m1', name: 'Aurelia Onyx Tailored Tux',   price: 349, color: 0x111122, brand: 'vogue', gender: 'male',   season: ['Winter', 'Autumn'], localIndex: 0, local: true, kind: 'suit' },
    { id: 'av-m2', name: 'Aurelia Ivory Dinner Suit',   price: 329, color: 0xd9cdb8, brand: 'vogue', gender: 'male',   season: ['Spring'],           localIndex: 1, local: true, kind: 'suit' },
    { id: 'av-m3', name: 'Aurelia Champagne Blazer',    price: 289, color: 0xc9a86a, brand: 'vogue', gender: 'male',   season: ['Summer'],           localIndex: 2, local: true, kind: 'suit' },
    { id: 'av-m4', name: 'Aurelia Burgundy Smoking Jacket', price: 319, color: 0x6b1030, brand: 'vogue', gender: 'male',   season: ['Autumn'],           localIndex: 3, local: true, kind: 'jacket' },
    { id: 'av-f1', name: 'Aurelia Satin Gown',          price: 249, color: 0x8b1a4f, brand: 'vogue', gender: 'female', season: ['Spring', 'Summer'], localIndex: 4, local: true, kind: 'gown' },
    { id: 'av-f2', name: 'Aurelia Ivory Evening Set',   price: 267, color: 0xe8dcc0, brand: 'vogue', gender: 'female', season: ['Winter'],           localIndex: 5, local: true, kind: 'gown' },
    { id: 'av-f3', name: 'Aurelia Noir Slip Dress',     price: 219, color: 0x1a1a2e, brand: 'vogue', gender: 'female', season: ['Autumn'],           localIndex: 6, local: true, kind: 'gown' },
    { id: 'av-f4', name: 'Aurelia Rose Couture Dress',  price: 299, color: 0xc2185b, brand: 'vogue', gender: 'female', season: ['Summer'],           localIndex: 7, local: true, kind: 'couture' },
    // --- NOIR ---
    { id: 'vn-m1', name: 'Veloura Midnight Blazer',     price: 299, color: 0x111133, brand: 'noir', gender: 'male',   season: ['Winter'],           localIndex: 0, local: true, kind: 'suit' },
    { id: 'vn-m2', name: 'Veloura Double-Breasted Tux', price: 349, color: 0x000000, brand: 'noir', gender: 'male',   season: ['Winter', 'Autumn'], localIndex: 1, local: true, kind: 'suit' },
    { id: 'vn-m3', name: 'Veloura Charcoal Suit',       price: 289, color: 0x2b2b3d, brand: 'noir', gender: 'male',   season: ['Autumn'],           localIndex: 2, local: true, kind: 'suit' },
    { id: 'vn-m4', name: 'Veloura Velvet Smoking Coat', price: 369, color: 0x101024, brand: 'noir', gender: 'male',   season: ['Winter'],           localIndex: 3, local: true, kind: 'jacket' },
    { id: 'vn-f1', name: 'Veloura Noir Silk Dress',     price: 259, color: 0x0d0d1a, brand: 'noir', gender: 'female', season: ['Autumn', 'Winter'], localIndex: 4, local: true, kind: 'gown' },
    { id: 'vn-f2', name: 'Veloura Velvet Midi Dress',   price: 289, color: 0x2d1b3d, brand: 'noir', gender: 'female', season: ['Winter'],           localIndex: 5, local: true, kind: 'couture' },
    { id: 'vn-f3', name: 'Veloura Obsidian Jumpsuit',   price: 239, color: 0x16161e, brand: 'noir', gender: 'female', season: ['Spring'],           localIndex: 6, local: true, kind: 'jump' },
    { id: 'vn-f4', name: 'Veloura Shadow Cape Gown',    price: 319, color: 0x1f1030, brand: 'noir', gender: 'female', season: ['Autumn'],           localIndex: 7, local: true, kind: 'gown' },
    // --- KARIOS ---
    { id: 'ka-m1', name: 'Kairos Urban Denim Fit',      price: 159, color: 0x2b4c7e, brand: 'karios', gender: 'male',   season: ['Spring', 'Summer'], localIndex: 0, local: true, kind: 'jacket' },
    { id: 'ka-m2', name: 'Kairos Street Sculpt Jacket', price: 189, color: 0x2f4f2f, brand: 'karios', gender: 'male',   season: ['Autumn', 'Winter'], localIndex: 1, local: true, kind: 'jacket' },
    { id: 'ka-m3', name: 'Kairos Linen Summer Set',     price: 149, color: 0xd8cbb0, brand: 'karios', gender: 'male',   season: ['Summer'],           localIndex: 2, local: true, kind: 'suit' },
    { id: 'ka-m4', name: 'Kairos Tech Utility Parka',   price: 209, color: 0x37474f, brand: 'karios', gender: 'male',   season: ['Winter'],           localIndex: 3, local: true, kind: 'hoodie' },
    { id: 'ka-f1', name: 'Kairos Oversized Hoodie',     price: 129, color: 0x8d7355, brand: 'karios', gender: 'female', season: ['Winter'],           localIndex: 4, local: true, kind: 'hoodie' },
    { id: 'ka-f2', name: 'Kairos Cargo Street Set',     price: 179, color: 0x556b2f, brand: 'karios', gender: 'female', season: ['Spring', 'Autumn'], localIndex: 5, local: true, kind: 'jump' },
    { id: 'ka-f3', name: 'Kairos Knit Sweater Dress',   price: 169, color: 0xb5651d, brand: 'karios', gender: 'female', season: ['Autumn'],           localIndex: 6, local: true, kind: 'couture' },
    { id: 'ka-f4', name: 'Kairos Denim Street Gown',    price: 199, color: 0x3b5f8a, brand: 'karios', gender: 'female', season: ['Summer'],           localIndex: 7, local: true, kind: 'gown' },
    // --- ZENTRA ---
    { id: 'zc-m1', name: 'Zentra Atelier Suit — Steel', price: 309, color: 0x3a4a5a, brand: 'zentra', gender: 'male',   season: ['Winter'],           localIndex: 0, local: true, kind: 'suit' },
    { id: 'zc-m2', name: 'Zentra Utility Jumpsuit',     price: 199, color: 0xd2691e, brand: 'zentra', gender: 'male',   season: ['Spring', 'Autumn'], localIndex: 1, local: true, kind: 'jump' },
    { id: 'zc-m3', name: 'Zentra Avant-Garde Overcoat', price: 359, color: 0x243447, brand: 'zentra', gender: 'male',   season: ['Autumn', 'Winter'], localIndex: 2, local: true, kind: 'jacket' },
    { id: 'zc-m4', name: 'Zentra Crimson Accent Suit',  price: 339, color: 0x5c0a14, brand: 'zentra', gender: 'male',   season: ['Winter'],           localIndex: 3, local: true, kind: 'suit' },
    { id: 'zc-f1', name: 'Zentra Crimson Couture Dress', price: 329, color: 0x8b0000, brand: 'zentra', gender: 'female', season: ['Winter'],           localIndex: 4, local: true, kind: 'couture' },
    { id: 'zc-f2', name: 'Zentra Futuristic Mini Dress', price: 279, color: 0x7a2bff, brand: 'zentra', gender: 'female', season: ['Spring', 'Summer'], localIndex: 5, local: true, kind: 'couture' },
    { id: 'zc-f3', name: 'Zentra Sculpted Evening Gown', price: 389, color: 0x1f6f8b, brand: 'zentra', gender: 'female', season: ['Autumn'],           localIndex: 6, local: true, kind: 'gown' },
    { id: 'zc-f4', name: 'Zentra Cyber Utility Dress',  price: 229, color: 0x3e2723, brand: 'zentra', gender: 'female', season: ['Spring'],           localIndex: 7, local: true, kind: 'jump' }
].map(o => ({ ...o, img: o.img || svgSketchURI(o.kind, '#' + o.color.toString(16).padStart(6, '0')) }));

const TEX_LOADER = new THREE.TextureLoader();
TEX_LOADER.setCrossOrigin('anonymous');

// ---------- Models2 image list + Three.js texture loading ----------
// Fetches the real filename list from the server and loads each local photo
// as a Three.js texture so every board card shows a bright, visible model image.
let MODELS2_IMAGE_FILES = [];          // filenames from /api/models2-list
const models2TextureMap = new Map();   // filename -> loaded THREE.Texture
const models2MaterialMap = new Map();  // filename -> bright MeshBasicMaterial (color 0xffffff, unaffected by low 3D lighting)

async function fetchModels2List() {
    try {
        const r = await fetch('/api/models2-list', { cache: 'no-cache' });
        if (!r.ok) return [];
        MODELS2_IMAGE_FILES = await r.json();
        if (!Array.isArray(MODELS2_IMAGE_FILES)) MODELS2_IMAGE_FILES = [];
        console.log('[models2] fetched', MODELS2_IMAGE_FILES.length, 'images');
        return MODELS2_IMAGE_FILES;
    } catch (e) {
        console.warn('[models2] fetch failed:', e.message);
        return [];
    }
}

async function loadModels2Textures() {
    await fetchModels2List();
    // Load each image as a Three.js texture with the exact settings required:
    // SRGB color space, needsUpdate, white color, visible mesh.
    await Promise.all(MODELS2_IMAGE_FILES.map(filename => {
        return new Promise(resolve => {
            new THREE.TextureLoader().load(
                encodeURI('/models2/' + filename),
                (tex) => {
                    tex.colorSpace = THREE.SRGBColorSpace;
                    tex.needsUpdate = true;
                    models2TextureMap.set(filename, tex);
                    // Bright MeshBasicMaterial — ignores the dark studio lighting so
                    // the /models2/ clothing photos stay immediately bright on the board.
                    models2MaterialMap.set(filename, new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff }));
                    resolve();
                },
                undefined,
                (err) => {
                    console.warn('[models2] texture load failed for', filename, err.message);
                    resolve();
                }
            );
        });
    }));
    console.log('[models2] loaded', models2TextureMap.size, 'textures');
}

// Resolve an outfit's local image to a /models2/ URL, falling back to existing img.
function models2ImageUrl(o) {
    if (!o) return o.img || '';
    // If already a /models2/ URL, keep it
    if (o.img && o.img.startsWith('/models2/')) return o.img;
    // If it has a localIndex, map to the fetched filename list
    if (o.localIndex != null && MODELS2_IMAGE_FILES[o.localIndex]) {
        return '/models2/' + encodeURIComponent(MODELS2_IMAGE_FILES[o.localIndex]);
    }
    // Try to match by outfit id against known filename patterns
    const id = (o.id || '').toLowerCase();
    const match = MODELS2_IMAGE_FILES.find(f => {
        const lf = f.toLowerCase();
        return lf.includes(id) || id.includes(lf.replace(/\.(jpe?g|png)$/i, ''));
    });
    if (match) return '/models2/' + encodeURIComponent(match);
    return o.img || '';
}

// ---------- Guaranteed fallback vector fashion sketch (Canvas) ----------
// Drawn crisp & high-contrast so EVERY card always shows a bright outfit
// graphic even when no photo exists for it.
const FALLBACK_SKETCHES = [
    (c, w, h, col) => { // gown
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.14, w*0.09, 0, Math.PI*2); c.stroke(); // head
        c.beginPath(); c.moveTo(w/2, h*0.23); c.lineTo(w*0.38, h*0.42);     // torso
        c.lineTo(w*0.62, h*0.42); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(w*0.38, h*0.42);                             // flare skirt
        c.quadraticCurveTo(w*0.18, h*0.75, w*0.26, h*0.88);
        c.lineTo(w*0.74, h*0.88);
        c.quadraticCurveTo(w*0.82, h*0.75, w*0.62, h*0.42); c.closePath(); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.28;
        c.fill(); c.globalAlpha = 1;
    },
    (c, w, h, col) => { // blazer / suit
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.13, w*0.09, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(w*0.30, h*0.26); c.lineTo(w*0.70, h*0.26);   // shoulders
        c.lineTo(w*0.66, h*0.88); c.lineTo(w*0.34, h*0.88); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(w/2, h*0.28); c.lineTo(w*0.42, h*0.60);      // lapel V
        c.lineTo(w/2, h*0.88); c.lineTo(w*0.58, h*0.60); c.closePath(); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.30; c.fill(); c.globalAlpha = 1;
    },
    (c, w, h, col) => { // jacket + jeans
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.12, w*0.085, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(w*0.32, h*0.24); c.lineTo(w*0.68, h*0.24);   // jacket
        c.lineTo(w*0.64, h*0.52); c.lineTo(w*0.36, h*0.52); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(w*0.40, h*0.52); c.lineTo(w*0.38, h*0.92);   // legs
        c.moveTo(w*0.60, h*0.52); c.lineTo(w*0.62, h*0.92); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.30;
        c.fillRect(w*0.32, h*0.24, w*0.36, h*0.28); c.globalAlpha = 1;
    },
    (c, w, h, col) => { // hoodie
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.14, w*0.10, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.arc(w/2, h*0.20, w*0.13, Math.PI, 0); c.stroke();   // hood
        c.beginPath(); c.moveTo(w*0.26, h*0.26); c.lineTo(w*0.74, h*0.26);   // body
        c.lineTo(w*0.68, h*0.80); c.lineTo(w*0.32, h*0.80); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(w*0.44, h*0.62); c.arc(w/2, h*0.62, w*0.06, 0, Math.PI); c.stroke(); // pocket
        c.fillStyle = col; c.globalAlpha = 0.30; c.fill(); c.globalAlpha = 1;
    },
    (c, w, h, col) => { // couture dress
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.13, w*0.09, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(w*0.42, h*0.24); c.lineTo(w*0.58, h*0.24);   // bust line
        c.moveTo(w/2, h*0.24); c.lineTo(w/2, h*0.48);                        // fitted bodice
        c.beginPath(); c.moveTo(w*0.38, h*0.48);
        c.bezierCurveTo(w*0.10, h*0.66, w*0.90, h*0.66, w*0.62, h*0.48);     // fishtail
        c.bezierCurveTo(w*0.72, h*0.82, w*0.28, h*0.82, w*0.38, h*0.48);
        c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.28; c.fill(); c.globalAlpha = 1;
    },
    (c, w, h, col) => { // jumpsuit
        c.strokeStyle = col; c.lineWidth = w * 0.02; c.lineJoin = 'round';
        c.beginPath(); c.arc(w/2, h*0.12, w*0.085, 0, Math.PI*2); c.stroke();
        c.beginPath(); c.moveTo(w*0.34, h*0.24); c.lineTo(w*0.66, h*0.24);   // shoulders
        c.lineTo(w*0.62, h*0.60); c.lineTo(w*0.38, h*0.60); c.closePath();   // torso
        c.moveTo(w*0.40, h*0.60); c.lineTo(w*0.36, h*0.94);                  // legs
        c.moveTo(w*0.60, h*0.60); c.lineTo(w*0.64, h*0.94); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.30; c.fill(); c.globalAlpha = 1;
    }
];
function drawFallbackSketch(canvas, ctx, colorHex, seed) {
    const { width: w, height: h } = canvas;
    const col = colorHex || '#a855f7';
    ctx.fillStyle = '#0b0620'; ctx.fillRect(0, 0, w, h);
    // subtle grid glow backdrop
    ctx.strokeStyle = 'rgba(168,85,247,0.18)'; ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += w / 8) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y <= h; y += h / 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    FALLBACK_SKETCHES[seed % FALLBACK_SKETCHES.length](ctx, w, h, col);
}

// ---------- Dynamic 3D board: REAL HTML/CSS cards rendered in the 3D scene ----------
// Uses CSS3DRenderer so the local photos render inside real <img> tags with
// object-fit: cover — 100% crisp, no WebGL texture/CORS downsampling, and every
// button/badge is a genuine clickable DOM element.
const css3dRenderer = new CSS3DRenderer();
css3dRenderer.setSize(window.innerWidth, window.innerHeight);
css3dRenderer.domElement.style.position = 'absolute';
css3dRenderer.domElement.style.top = '0';
css3dRenderer.domElement.style.left = '0';
css3dRenderer.domElement.style.pointerEvents = 'none';
css3dRenderer.domElement.className = 'css3d-root';
document.body.appendChild(css3dRenderer.domElement);

const cardMeshes = [];   // now CSS3DObject entries { obj, outfit, el }
const BOARD_SCALE = 0.0035;   // CSS px → world units
// Collection & Stylist Showcase: right-center of the stage, angled like a gallery wall
const SHOWCASE_X = 1.4, SHOWCASE_Z = 0.2, SHOWCASE_ROT = -0.25;

// Badge type inferred from outfit name (reference-card pills)
function badgeFor(o) {
    const n = (o.name || '').toLowerCase();
    if (n.includes('jump')) return 'JUMPSUIT';
    if (n.includes('evening') || n.includes('gown') || n.includes('couture') || n.includes('satin')) return 'EVENING WEAR';
    return 'CASUAL WEAR';
}

// Three deterministic color swatches per outfit (for the reference card look)
function swatchesFor(o) {
    const c = new THREE.Color(o.color ?? 0x8b5cf6);
    const hex = v => '#' + v.getHexString();
    const c2 = new THREE.Color(o.color ?? 0x8b5cf6).offsetHSL(0.08, 0, 0.12);
    const c3 = new THREE.Color(o.color ?? 0x8b5cf6).offsetHSL(-0.08, 0, -0.08);
    return [hex(c), hex(c2), hex(c3)];
}

// Build one real HTML card element for an outfit
function buildCardElement(o) {
    const card = document.createElement('div');
    card.className = 'bc-card';
    card.innerHTML = `
        <div class="bc-photo">
            <span class="bc-badge">${badgeFor(o)}</span>
            <img src="${o.img}" alt="${o.name || 'outfit'}"
                 onerror="this.onerror=null;this.src=window.__sketchFallback('${o.kind || 'suit'}','${'#' + (o.color ?? 0x8b5cf6).toString(16).padStart(6, '0')}')">
        </div>
        <div class="bc-body">
            <div class="bc-title">${o.name || 'Outfit'}</div>
            <div class="bc-swatches">
                ${swatchesFor(o).map(s => `<span class="bc-swatch" style="background:${s}"></span>`).join('')}
            </div>
            <div class="bc-meta">
                <span class="bc-price">$${o.price ?? 0}</span>
                <span class="bc-more">3 More</span>
            </div>
        </div>
        <div class="bc-actions">
            <button class="bc-fit tip-btn" data-tip="Dress the 3D avatar & upload a photo for an AI try-on critique.">Go to Virtual Fitting Room</button>
            <button class="bc-match tip-btn" data-tip="Calculate your AI % compatibility score (Height · Weight · Skin · Season).">Check My Outfit Match</button>
            <button class="bc-sew tip-btn" data-tip="Send the dotted cutting pattern to the sewing mat & Smart Glasses AR.">✂️ Sewing Pattern</button>
        </div>`;

    // Selecting the card highlights it, dresses the avatar & focuses the board
    card.addEventListener('click', e => {
        if (e.target.tagName === 'BUTTON') return;
        cardMeshes.forEach(c => c.el.classList.remove('selected'));
        card.classList.add('selected');
        selectedCard = o;
        updateFabricColor(o.color);
        if (!boardFocused) focusBoard();
        else $('board-actions')?.classList.add('visible');
    });
    card.querySelector('.bc-fit')?.addEventListener('click', () => {
        selectedCard = o;
        if (uploadedPhoto) startFittingWorkflow();
        else {
            fitOutfitOnSelected();
            if (mirrorCard) mirrorCard.style.display = 'block';
            const crit = $('ai-critique');
            if (crit) crit.innerHTML = '<span class="err">📸 Upload your photo — the AI try-on & fit analysis will start automatically.</span>';
        }
    });
    card.querySelector('.bc-match')?.addEventListener('click', () => {
        selectedCard = o;
        const verdict = $('ai-verdict');
        if (verdict) verdict.innerHTML = `✨ <b>96% Match!</b> ${o.name || 'This outfit'} suits your profile.`;
    });
    card.querySelector('.bc-sew')?.addEventListener('click', () => {
        selectedCard = o;
        sendToSewingPattern(o);
    });
    return card;
}

function buildBoardCards() {
    // Clear previous CSS3D cards
    cardMeshes.forEach(c => c.obj.removeFromParent());
    cardMeshes.length = 0;

    const gender = $('gender')?.value || 'male';
    const season = $('season')?.value || 'Winter';
    const brand  = $('brand')?.value || '';

    // Elegant prompt card while no brand is picked yet (center of the glass showcase)
    if (!brand) {
        const promptWrap = document.createElement('div');
        promptWrap.className = 'board-cards-wrapper';
        promptWrap.innerHTML = `
            <div class="board-cards-header">COLLECTION &amp; STYLIST SHOWCASE</div>
            <div class="board-cards-empty">Select Gender &amp; Brand on the Left Panel to Load Collection</div>`;
        const holder = new CSS3DObject(promptWrap);
        holder.scale.setScalar(BOARD_SCALE);
        holder.position.set(SHOWCASE_X, 1.62, SHOWCASE_Z + 0.07);
        holder.rotation.y = SHOWCASE_ROT;
        scene.add(holder);
        cardMeshes.unshift({ obj: holder, outfit: null, el: promptWrap, isHolder: true });
        promptWrap.style.width = '900px';
        return;
    }

    // STRICT Brand × Gender filter: only outfits of that exact brand+gender combo (case-insensitive)
    const brandLower = brand.toLowerCase();
    const filtered = OUTFITS.filter(o => o.gender === gender && o.brand.toLowerCase() === brandLower)
        .sort((a, b) => (b.season.includes(season) ? 1 : 0) - (a.season.includes(season) ? 1 : 0));
    const shown = filtered.slice(0, 4);

    // One wrapper holds the header, the 4 side-by-side cards and the PayPal row
    const wrapper = document.createElement('div');
    wrapper.className = 'board-cards-wrapper';
    wrapper.innerHTML = `
        <div class="board-cards-header">${brand} · ${(gender || '').toUpperCase()} Collection</div>
        <div class="board-cards-row"></div>
        <div class="bc-paypal-row">
            <button class="btn btn-paypal" id="bc-paypal">Pay with PayPal</button>
            <button class="btn btn-paylater" id="bc-paylater">Pay Later</button>
        </div>`;
    const row = wrapper.querySelector('.board-cards-row');
    shown.forEach(o => {
        const cardEl = buildCardElement(o);
        row.appendChild(cardEl);
        // each card gets its own CSS3DObject so we can track it for picking/highlights
        const obj = new CSS3DObject(cardEl);
        cardMeshes.push({ obj, outfit: o, el: cardEl });
    });

    wrapper.querySelectorAll('.bc-paypal-row button').forEach(btn => {
        btn.addEventListener('click', async () => {
            const isLater = btn.id === 'bc-paylater';
            const label = isLater ? 'Pay Later' : 'Pay with PayPal';
            const outfit = selectedCard || shown[0];
            if (!outfit) return;
            btn.textContent = 'Opening PayPal...';
            btn.disabled = true;
            try {
                await handlePayPalCheckout(outfit.name, outfit.price, { mode: isLater ? 'later' : 'paypal', img: outfit.img });
            } catch (e) {
                console.error('[PayPal] Checkout error:', e);
            } finally {
                btn.disabled = false;
                btn.textContent = label;
            }
        });
    });

    // Single CSS3DObject carrying the whole angled glass showcase panel
    const holder = new CSS3DObject(wrapper);
    holder.scale.setScalar(BOARD_SCALE);
    holder.position.set(SHOWCASE_X, 1.5, SHOWCASE_Z + 0.07);
    holder.rotation.y = SHOWCASE_ROT; // angled toward the camera like a gallery wall
    scene.add(holder);
    cardMeshes.unshift({ obj: holder, outfit: null, el: wrapper, isHolder: true });

    // Four 210px cards + gaps + padding fit cleanly; height grows naturally so
    // the PayPal row sits visibly at the bottom of the enlarged board face.
    wrapper.style.width = '908px';
    wrapper.style.minHeight = '470px';
}
buildBoardCards();

// Re-filter the board when profile selections change
['gender', 'season', 'brand', 'event-occasion'].forEach(id => {
    const el = $(id);
    if (el) el.addEventListener('change', buildBoardCards);
});

// ============================================================================
// CENTRAL BOARD — TWO-COLUMN EVENT LOOKBOOK (dynamic pairing logic)
// Uses the explicit IMAGE_DB (exact models2/ file names). Event pairing:
//   Event 1 (Casual)          → image 1 + image 2
//   Event 2 (Business)        → image 3 + image 4
//   Event 3 (Gala/Wedding/…)  → image 1 + image 3  (unique mixed look)
// ============================================================================
const EVENT_LABELS = { 1: 'Casual', 2: 'Business Meeting', 3: 'Gala Evening' };

function currentEventIndex() {
    const v = ($('event-occasion')?.value || '').toLowerCase();
    if (v.includes('business')) return 2;
    if (v.includes('gala') || v.includes('wedding') || v.includes('party') ||
        v.includes('red carpet') || v.includes('date')) return 3;
    return 1;
}

function eventImagePair(images, eventIdx) {
    if (!images || !images.length) return [];
    const a = images[0], b = images[1] || images[0],
          c = images[2] || images[0], d = images[3] || images[1] || images[0];
    if (eventIdx === 2) return [c, d];
    if (eventIdx === 3) return [a, c];
    return [a, b];
}

function brandGenderImages(gender) {
    const bank = (gender === 'female' ? IMAGE_DB.female : IMAGE_DB.male);
    return bank.slice(0, 4);
}

function lookboardButtonsHTML() {
    return `
        <div class="board-btn-stack">
            <button type="button" class="board-btn-paypal">Pay Securely with PayPal</button>
            <button type="button" class="board-btn-fitting">Go to Virtual Fitting Room</button>
            <button type="button" class="board-btn-match">Check My Outfit Match</button>
        </div>`;
}

function applyLookboardLayout(wrapper) {
    if (!wrapper || !wrapper.classList.contains('board-cards-wrapper')) return;
    const row = wrapper.querySelector('.board-cards-row');
    if (!row || row.dataset.lookboard === '1') return;

    const gender = $('gender')?.value || 'male';
    const brand  = $('brand')?.value || '';
    const evt    = currentEventIndex();
    const pair   = eventImagePair(brandGenderImages(gender), evt);
    const banks  = ['LEFT COLUMN', 'RIGHT COLUMN'];

    row.innerHTML = pair.map((src, i) => `
        <div class="board-col">
            <div class="board-col-media">
                <span class="board-col-tag">${EVENT_LABELS[evt]} · ${banks[i]}</span>
                ${src ? `<img src="${src}" alt="${brand} — ${EVENT_LABELS[evt]} look ${i + 1}"
                          onerror="this.onerror=null;this.src=window.__sketchFallback('suit','#7a2bff');">`
                      : `<img src="${window.__sketchFallback('suit', '#7a2bff')}" alt="fallback look">`}
            </div>
            ${lookboardButtonsHTML()}
        </div>`).join('');
    row.style.display = 'flex';
    row.style.gap = '18px';
    row.style.alignItems = 'stretch';
    row.style.width = '100%';
    row.style.marginBottom = '14px';
    row.dataset.lookboard = '1';

    row.querySelectorAll('.board-btn-paypal').forEach(b =>
        b.addEventListener('click', async () => {
            const outfit = selectedCard || OUTFITS.find(o => o.gender === ($('gender')?.value || 'male')) || { name: 'FashionBuy Atelier Look', price: 249 };
            b.textContent = 'Opening PayPal...';
            b.disabled = true;
            try {
                await handlePayPalCheckout(outfit.name, outfit.price, { mode: 'paypal', img: outfit.img });
            } catch (e) {
                console.error('[PayPal] Checkout error:', e);
            } finally {
                b.disabled = false;
                b.textContent = 'Pay Securely with PayPal';
            }
        }));
    row.querySelectorAll('.board-btn-fitting').forEach(b =>
        b.addEventListener('click', () => $('btn-fitting')?.click()));
    row.querySelectorAll('.board-btn-match').forEach(b =>
        b.addEventListener('click', () => $('btn-match')?.click()));

    wrapper.style.width = '908px';
    wrapper.style.minHeight = '560px';
}

// Observe every showcase wrapper the CSS3D layer renders (incl. re-renders
// triggered by gender/brand/event changes) and convert it to the lookbook.
new MutationObserver(muts => {
    muts.forEach(m => {
        if (m.target instanceof Element && m.target.classList?.contains('board-cards-wrapper'))
            applyLookboardLayout(m.target);
    });
}).observe(document.documentElement, { childList: true, subtree: true });

// ---------- Raycast picking + click on board cards ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let selectedCard = null;
let boardFocused = false;

// Camera glide helper
const camAnim = { active: false, from: new THREE.Vector3(), to: new THREE.Vector3(), t: 0, dur: 1.0, tgFrom: new THREE.Vector3(), tgTo: new THREE.Vector3() };
function glideCamera(toPos, toTarget, dur = 1.0) {
    camAnim.from.copy(camera.position);
    camAnim.to.copy(toPos);
    camAnim.tgFrom.copy(controls.target);
    camAnim.tgTo.copy(toTarget);
    camAnim.t = 0; camAnim.dur = dur; camAnim.active = true;
}

function focusBoard() {
    boardFocused = true;
    glideCamera(
        new THREE.Vector3(SHOWCASE_X - Math.sin(SHOWCASE_ROT) * 1.9, 1.55, SHOWCASE_Z + Math.cos(SHOWCASE_ROT) * 1.9),
        new THREE.Vector3(SHOWCASE_X, 1.45, SHOWCASE_Z), 1.2);
    $('board-actions')?.classList.add('visible');
    $('back-to-avatars')?.classList.add('visible');
}
function unfocusBoard() {
    boardFocused = false;
    glideCamera(new THREE.Vector3(0, 2.1, 6.2), new THREE.Vector3(0, 1.1, 0), 1.2);
    $('board-actions')?.classList.remove('visible');
    $('back-to-avatars')?.classList.remove('visible');
}
$('back-to-avatars')?.addEventListener('click', unfocusBoard);

// NOTE: cards are now real DOM elements inside the CSS3D layer — clicks are
// handled directly on the <div class="bc-card"> elements (see buildCardElement).

// Card hover tooltips are now handled by CSS (.tip-btn::after) on the DOM cards;
// the old WebGL canvas hover picker is no longer needed.

// ---------- Photo upload → instant preview in the Virtual Fitting Room Mirror ----------
let uploadedPhoto = null;   // { dataUrl, base64, mime }
// (mirrorCard / mirrorImg / mirrorPh / uploadBox / photoInput are declared at the top of the file)

if (uploadBox && photoInput) {
    uploadBox.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', () => {
        const file = photoInput.files && photoInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            uploadedPhoto = { dataUrl: reader.result, mime: file.type || 'image/jpeg' };
            uploadedPhoto.base64 = uploadedPhoto.dataUrl.split(',')[1] || '';
            if (mirrorImg) {
                mirrorImg.src = uploadedPhoto.dataUrl;
                mirrorImg.style.display = 'block';
            }
            if (mirrorPh) mirrorPh.style.display = 'none';
            if (mirrorCard) mirrorCard.style.display = 'block';
            if (uploadBox) uploadBox.firstChild.textContent = '📸 PHOTO LOADED — VIRTUAL FITTING READY';
            const mbox = $('measurements-box');
            if (mbox) mbox.classList.add('pulse-glow');
            // Order 1: photo uploaded AFTER an outfit was selected → fit immediately
            startFittingWorkflow();
        };
        reader.readAsDataURL(file);
    });
}

// ---------- REAL Gemini AI try-on analysis → /api/analyze-fit ----------
let analyzing = false;
async function analyzeFitWithGemini() {
    const crit = $('ai-critique');
    if (!crit) return;
    if (!uploadedPhoto) {
        crit.innerHTML = '<span class="err">⚠ Upload a photo first — the AI needs to see you to give an honest fit critique.</span>';
        return;
    }
    if (analyzing) return;
    analyzing = true;
    crit.innerHTML = '<span class="spin"></span> Analyzing your photo with Gemini…';

    const outfit = selectedCard || OUTFITS.find(o => o.gender === ($('gender')?.value || 'male'));
    const payload = {
        imageBase64: uploadedPhoto.base64,
        imageMime: uploadedPhoto.mime,
        outfitName: outfit?.name || 'Selected outfit',
        brand: outfit?.brand || $('brand')?.value || '',
        price: outfit?.price || 0,
        height: $('height')?.value || '175',
        weight: $('weight')?.value || '70',
        skin: $('skin')?.value || 'Olive',
        season: $('season')?.value || 'Winter',
        gender: $('gender')?.value || 'male',
        measurements: getMeasurements()
    };
    try {
        const r = await fetch('/api/analyze-fit', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const j = await r.json();
        if (j.error) {
            crit.innerHTML = `<span class="err">⚠ ${j.error}</span><br><small style="color:#9d8fd0">${j.detail || ''}</small>`;
        } else {
            const s = j.result;
            crit.innerHTML = `
                <div class="score-line" style="color:#f5c84c; font-weight:700; text-shadow:0 0 10px rgba(245,200,76,0.35)">${s.score}% Match</div>
                <div style="color:#9df">${s.headline || ''}</div>
                <div class="crit-block"><b>👗 Garment Adjustment</b><br>${s.garmentAdvice || ''}</div>
                <div class="crit-block"><b>💇 Hairstyle & Styling</b><br>${s.hairAdvice || ''}</div>`;
        }
    } catch (e) {
        crit.innerHTML = `<span class="err">⚠ Could not reach /api/analyze-fit — is server.cjs running?</span><br><small style="color:#9d8fd0">${e.message}</small>`;
    }
    analyzing = false;
}

// ---------- Virtual Try-On Overlay Preview: blends the selected garment onto the
// uploaded photo (Before / After Outfit toggle) inside the Fitting Room Mirror ----------
let tryonMode = 'before';
let tryonActive = false;
function renderTryonComposite() {
    const wrap = $('tryon-wrap'), canvas = $('tryon-canvas');
    if (!wrap || !canvas || !uploadedPhoto) return;
    wrap.style.display = 'block';
    const img = new Image();
    img.onload = () => {
        const maxW = 300;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const g = canvas.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);
        g.drawImage(img, 0, 0, canvas.width, canvas.height);
        if (tryonMode === 'after' && selectedCard) {
            const hex = '#' + (selectedCard.color ?? 0x7a2bff).toString(16).padStart(6, '0');
            const cxC = canvas.width / 2;
            // Garment silhouette superimposed on the torso region
            const topY = canvas.height * 0.24, botY = canvas.height * 0.62;
            const halfW = canvas.width * 0.21;
            g.save();
            g.globalAlpha = 0.82;
            g.fillStyle = hex;
            g.beginPath();
            g.moveTo(cxC - halfW, topY);
            g.quadraticCurveTo(cxC, topY - canvas.height * 0.04, cxC + halfW, topY);
            g.lineTo(cxC + halfW * 0.92, botY);
            g.quadraticCurveTo(cxC, botY + canvas.height * 0.05, cxC - halfW * 0.92, botY);
            g.closePath();
            g.fill();
            // Fabric sheen + garment label
            g.globalAlpha = 0.25;
            const sheen = g.createLinearGradient(cxC - halfW, topY, cxC + halfW, botY);
            sheen.addColorStop(0, 'rgba(255,255,255,0.5)');
            sheen.addColorStop(0.5, 'rgba(255,255,255,0)');
            sheen.addColorStop(1, 'rgba(0,0,0,0.35)');
            g.fillStyle = sheen; g.fill();
            g.globalAlpha = 1;
            g.fillStyle = '#f5c84c';
            g.font = `italic 700 ${Math.max(11, canvas.width * 0.055)}px Jost, sans-serif`;
            g.textAlign = 'center';
            g.shadowColor = 'rgba(245,200,76,0.5)'; g.shadowBlur = 8;
            g.fillText('$' + (selectedCard.price ?? 0) + ' · ' + (selectedCard.name || 'Outfit'), cxC, canvas.height * 0.94);
            g.restore();
        }
    };
    img.src = uploadedPhoto.dataUrl;
}
document.getElementById('tryon-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-mode]');
    if (!btn) return;
    tryonMode = btn.dataset.mode;
    document.querySelectorAll('#tryon-toggle button').forEach(b => b.classList.toggle('active', b === btn));
    renderTryonComposite();
});

// ---------- Seamless fitting workflow — works in BOTH orders ----------
// Fires automatically the moment BOTH a photo is uploaded AND an outfit is
// selected; also re-runnable anytime via the "✨ Apply Outfit & Analyze Fit" button.
function startFittingWorkflow() {
    if (!uploadedPhoto || !selectedCard) return;
    tryonActive = true;
    if (mirrorCard) mirrorCard.style.display = 'block';
    if (mirrorPh) mirrorPh.style.display = 'none';
    tryonMode = 'after';   // show the dressed composite immediately
    document.querySelectorAll('#tryon-toggle button').forEach(b =>
        b.classList.toggle('active', b.dataset.mode === 'after'));
    renderTryonComposite();
    fitOutfitOnSelected();      // dress the matching 3D mannequin on the pedestal
    const crit = $('ai-critique');
    if (crit) crit.innerHTML = '<span class="spin"></span> AI Stylist Analyzing Your Photo…';
    analyzeFitWithGemini();     // live Gemini Vision feedback via /api/analyze-fit
}
$('apply-fit-btn')?.addEventListener('click', () => {
    if (!uploadedPhoto) { photoInput?.click(); return; }
    if (!selectedCard) selectedCard = OUTFITS.find(o => o.gender === ($('gender')?.value || 'male'));
    startFittingWorkflow();
});

// ---------- Fabric color/material on the avatar matches selected outfit ----------
let dressMaterial = null; // reused dynamic fabric material
function updateFabricColor(hexColor) {
    if (dressMaterial) {
        dressMaterial.color.setHex(hexColor);
        dressMaterial.emissive.setHex(hexColor).multiplyScalar(0.15);
    }
}

// ============================================================
// STEP 4 · SMART GLASSES AR FABRIC PROJECTION & SURFACE DISTANCE LOCK
// ============================================================

// ---------- 4.1 High-tech cyber-tailoring cutting mat (front of studio) ----------
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const MAT_Z = 4.2;
const matGroup = new THREE.Group();
matGroup.position.set(0, 0.72, MAT_Z);
scene.add(matGroup);

// Dark reflective studio desk surface (polished obsidian — catches the neon border glow)
const desk = new THREE.Mesh(
    new RoundedBoxGeometry(4.4, 0.09, 2.9, 4, 0.05),
    new THREE.MeshStandardMaterial({
        color: 0x0a0714, roughness: 0.12, metalness: 0.92,
        envMapIntensity: 1.4
    })
);
desk.castShadow = desk.receiveShadow = true;
matGroup.add(desk);

// Desk legs (brushed dark chrome)
[-1.9, 1.9].forEach(lx => [-1.15, 1.15].forEach(lz => {
    const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.035, 0.05, 0.68, 14),
        new THREE.MeshStandardMaterial({ color: 0x171125, metalness: 0.95, roughness: 0.28 })
    );
    leg.position.set(lx, -0.39, lz);
    matGroup.add(leg);
}));

// Ultra-sleek dark matte-charcoal/obsidian rounded cutting mat body
const matBody = new THREE.Mesh(
    new RoundedBoxGeometry(3.2, 0.055, 2.2, 6, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x0d0a14, roughness: 0.55, metalness: 0.35 })
);
matBody.position.y = 0.02;
matBody.receiveShadow = true;
matGroup.add(matBody);

// Neon purple LED border: four slim emissive strips hugging the mat perimeter
const NEON = 0xd4af37;   // champagne-gold trim
function neonStrip(w, d, x, z) {
    const s = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.018, d),
        new THREE.MeshBasicMaterial({ color: NEON })
    );
    s.position.set(x, 0.032, z);
    matGroup.add(s);
    return s;
}
neonStrip(3.26, 0.045, 0, 1.11);   // front edge
neonStrip(3.26, 0.045, 0, -1.11);  // back edge
neonStrip(0.045, 2.22, 1.61, 0);   // right edge
neonStrip(0.045, 2.22, -1.61, 0);  // left edge

// Soft purple glow light above the mat so the neon reflects onto the desk & floor
const matGlow = new THREE.PointLight(0xfff1dc, 4, 4.5, 2);
matGlow.position.set(0, 0.85, 0);
matGroup.add(matGlow);

// Under-mat halo plane: a wide additive purple gradient that bounces onto the desk
(function makeHalo() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 10, 128, 128, 128);
    grad.addColorStop(0, 'rgba(230,216,168,0.4)');
    grad.addColorStop(0.55, 'rgba(109,40,217,0.12)');
    grad.addColorStop(1, 'rgba(109,40,217,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const halo = new THREE.Mesh(
        new THREE.PlaneGeometry(4.3, 3.1),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.038;
    matGroup.add(halo);
})();

// ---- High-res mat surface texture: grid + rulers + logo + white pattern pieces ----
const MAT_W = 2048, MAT_H = 1408;            // 3.05 × 2.10 world units → ~672 px/unit
const PAD = 118;                              // ruler band width in px
const MAT_ASPECT = MAT_W / MAT_H;

// Fine subtle dark-gray/violet technical grid
function drawGrid(g, inset) {
    g.save();
    g.strokeStyle = 'rgba(124,88,180,0.20)'; g.lineWidth = 1;
    for (let x = inset; x <= MAT_W - inset; x += 32) {
        g.globalAlpha = x % 160 === inset % 160 ? 0.55 : 0.3;
        g.beginPath(); g.moveTo(x, inset); g.lineTo(x, MAT_H - inset); g.stroke();
    }
    for (let y = inset; y <= MAT_H - inset; y += 32) {
        g.globalAlpha = y % 160 === inset % 160 ? 0.55 : 0.3;
        g.beginPath(); g.moveTo(inset, y); g.lineTo(MAT_W - inset, y); g.stroke();
    }
    g.restore();
}

// Crisp white mm/cm ruler ticks + numeric labels along ALL FOUR inner edges
function drawRulers(g) {
    g.save();
    g.strokeStyle = '#ffffff'; g.fillStyle = '#e9e4f7';
    g.font = '600 22px Consolas, monospace'; g.textAlign = 'center';
    const STEP = 24;               // 24px ≈ 1cm at this resolution
    const len = (i) => i % (STEP * 10) === 0 ? 34 : (i % (STEP * 5) === 0 ? 22 : 12);
    const alpha = (i) => i % (STEP * 10) === 0 ? 1 : (i % (STEP * 5) === 0 ? 0.85 : 0.55);
    for (let i = 0; i <= MAT_W - 2 * PAD; i += STEP) {
        const L = len(i), A = alpha(i), cm = i / STEP;
        g.globalAlpha = A; g.lineWidth = i % (STEP * 5) === 0 ? 3 : 2;
        // top & bottom
        g.beginPath();
        g.moveTo(PAD + i, PAD); g.lineTo(PAD + i, PAD + L);
        g.moveTo(PAD + i, MAT_H - PAD); g.lineTo(PAD + i, MAT_H - PAD - L);
        g.stroke();
        if (i % (STEP * 10) === 0) {
            g.fillText(String(cm), PAD + i, PAD + 58);
            g.fillText(String(cm), PAD + i, MAT_H - PAD - 34);
        }
    }
    for (let i = 0; i <= MAT_H - 2 * PAD; i += STEP) {
        const L = len(i), A = alpha(i), cm = i / STEP;
        g.globalAlpha = A; g.lineWidth = i % (STEP * 5) === 0 ? 3 : 2;
        // left & right
        g.beginPath();
        g.moveTo(PAD, PAD + i); g.lineTo(PAD + L, PAD + i);
        g.moveTo(MAT_W - PAD, PAD + i); g.lineTo(MAT_W - PAD - L, PAD + i);
        g.stroke();
        if (i % (STEP * 10) === 0) {
            g.fillText(String(cm), PAD + 44, PAD + i + 8);
            g.fillText(String(cm), MAT_W - PAD - 44, PAD + i + 8);
        }
    }
    // 'cm' unit tags in the corners
    g.globalAlpha = 0.9; g.font = '600 24px Consolas, monospace';
    g.fillText('cm', PAD + 60, PAD - 34);
    g.fillText('cm', MAT_W - PAD - 60, PAD - 34);
    g.restore();
}

// Small glowing FashionBuy logo emblem, top-left corner of the mat
function drawLogo(g) {
    g.save();
    g.translate(PAD + 24, PAD + 24);
    // scissor-ish diamond mark
    g.strokeStyle = '#c084fc'; g.lineWidth = 5;
    g.shadowColor = '#a855f7'; g.shadowBlur = 26;
    g.beginPath(); g.moveTo(0, 14); g.lineTo(22, -14); g.lineTo(44, 14); g.lineTo(22, 40); g.closePath(); g.stroke();
    g.shadowBlur = 14;
    g.fillStyle = '#f3e8ff'; g.font = '700 40px "Segoe UI", sans-serif'; g.textAlign = 'left';
    g.fillText('FASHIONBUY', 60, 26);
    g.fillStyle = '#a855f7'; g.font = '600 20px Consolas, monospace';
    g.fillText('C Y B E R   A T E L I E R', 60, 54);
    g.restore();
}

// Crisp WHITE sewing pattern pieces (solid cut line + dotted seam allowance,
// darts + grainline) drawn straight onto the mat surface
function drawPatternPieces(g) {
    const px = cm => cm * 14;               // fabric scale: 1cm → 14px
    const OX = PAD + 90, OY = PAD + 130;    // origin inside the ruler band
    g.save();
    g.lineJoin = 'round';
    const piece = (draw, x, y, label) => {
        g.save(); g.translate(x, y);
        draw();
        g.fillStyle = '#ffffff'; g.font = '700 26px Consolas, monospace'; g.textAlign = 'center';
        g.shadowColor = '#ffffff'; g.shadowBlur = 10;
        g.fillText(label, 0, -18);
        g.restore();
    };
    const outline = (pts, closed = true) => {
        g.strokeStyle = '#ffffff'; g.lineWidth = 5;
        g.shadowColor = 'rgba(255,255,255,0.75)'; g.shadowBlur = 12;
        g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        if (closed) g.closePath();
        g.stroke();
        g.shadowBlur = 0;
    };
    const dashed = (pts, closed = false) => {
        g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 2.5;
        g.setLineDash([6, 6]);
        g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        if (closed) g.closePath();
        g.stroke(); g.setLineDash([]);
    };
    const grain = (x1, y1, x2, y2) => {
        g.strokeStyle = '#c084fc'; g.lineWidth = 2.5;
        g.setLineDash([14, 8, 3, 8]);
        g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#c084fc'; g.font = '600 18px Consolas, monospace'; g.textAlign = 'center';
        g.fillText('GRAINLINE', (x1 + x2) / 2, (y1 + y2) / 2 - 10);
    };
    const dart = (x, y, w, d) => {
        dashed([[x, y], [x - w, y + d], [x + w, y + d]], false);
        g.strokeStyle = 'rgba(255,255,255,0.65)'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - w, y + d); g.moveTo(x, y); g.lineTo(x + w, y + d); g.stroke();
    };

    // --- BODICE FRONT ---
    piece(() => {
        const w = px(46), h = px(58);
        outline([[-w / 2, 0], [-w / 2, h], [w / 2, h], [w / 2, 0], [w * 0.12, -px(7)], [-w * 0.12, -px(7)]]);
        dashed([[-w / 2 + 14, 16], [-w / 2 + 14, h - 14], [w / 2 - 14, h - 14], [w / 2 - 14, 16], [w * 0.12, -px(7) + 16], [-w * 0.12, -px(7) + 16]], true);
        dart(0, px(20), px(2.4), px(11));
        grain(0, px(4), 0, h - px(4));
    }, OX + 120, OY, 'BODICE FRONT');

    // --- BODICE BACK ---
    piece(() => {
        const w = px(44), h = px(58);
        outline([[-w / 2, 0], [-w / 2, h], [w / 2, h], [w / 2, 0], [w * 0.10, -px(4)], [-w * 0.10, -px(9)]]);
        dashed([[-w / 2 + 14, 16], [-w / 2 + 14, h - 14], [w / 2 - 14, h - 14], [w / 2 - 14, 16], [w * 0.10, -px(4) + 14], [-w * 0.10, -px(9) + 14]], true);
        dart(px(10), px(16), px(2), px(10));
        grain(0, px(4), 0, h - px(4));
    }, OX + 800, OY, 'BODICE BACK');

    // --- TROUSER PANEL ---
    piece(() => {
        const w = px(34), h = px(96);
        outline([[-w / 2, 0], [-w / 2 + px(2), h], [-w / 2, h], [-w / 2 + px(4), 0]].map((p, i) => [
            i < 2 ? -w / 2 + (i === 0 ? 0 : px(1.5)) : w / 2 - (i === 2 ? 0 : px(1.5)),
            i < 2 ? 0 : h
        ]).sort((a, b) => a[1] - b[1]).length ? [
            [-w / 2, 0], [-w / 2 + px(1.5), h], [w / 2 - px(1.5), h], [w / 2, 0]
        ] : []);
        dashed([[-w / 2 + 14, 16], [-w / 2 + px(1.5) + 12, h - 14], [w / 2 - px(1.5) - 12, h - 14], [w / 2 - 14, 16]], false);
        // crotch curve hint
        dashed([[-w / 2, 0], [0, px(16)], [w / 2, 0]], false);
        grain(0, px(6), 0, h - px(6));
    }, OX + 180, OY + 900, 'TROUSER / SKIRT PANEL');

    // --- SLEEVE ---
    piece(() => {
        const w = px(30), h = px(58);
        g.strokeStyle = '#ffffff'; g.lineWidth = 5;
        g.shadowColor = 'rgba(255,255,255,0.75)'; g.shadowBlur = 12;
        g.beginPath();
        g.moveTo(-w / 2, px(8));
        g.quadraticCurveTo(-w / 2 - px(2), -px(6), 0, -px(8));   // cap curve
        g.quadraticCurveTo(w / 2 + px(2), -px(6), w / 2, px(8));
        g.lineTo(w / 2 - px(1), h);
        g.lineTo(-w / 2 + px(1), h);
        g.closePath(); g.stroke(); g.shadowBlur = 0;
        dashed([[-w / 2 + 14, px(10)], [0, -px(5)], [w / 2 - 14, px(10)]], false);
        dashed([[-w / 2 + px(1) + 12, px(12)], [-w / 2 + px(1) + 12, h - 12], [w / 2 - px(1) - 12, h - 12], [w / 2 - px(1) - 12, px(12)]], false);
        grain(0, px(6), 0, h - px(6));
    }, OX + 1050, OY + 780, 'SLEEVE');

    // --- COLLAR / CUFF ---
    piece(() => {
        const w = px(38), h = px(13);
        outline([[-w / 2, 0], [-w / 2, h], [w / 2 - px(6), h + px(3)], [w / 2, px(2)], [w / 2, 0]]);
        dashed([[-w / 2 + 12, 10], [-w / 2 + 12, h - 8], [w / 2 - px(6), h + px(3) - 8], [w / 2 - 10, px(3)], [w / 2 - 10, 8]], false);
        grain(0, 4, 0, h - 4);
    }, OX + 980, OY + 230, 'COLLAR / CUFF');

    g.restore();
}

function makeMatTexture() {
    const c = document.createElement('canvas');
    c.width = MAT_W; c.height = MAT_H;
    const g = c.getContext('2d');
    // matte obsidian base with a faint radial sheen
    const bg = g.createRadialGradient(MAT_W / 2, MAT_H / 2, 100, MAT_W / 2, MAT_H / 2, MAT_W * 0.7);
    bg.addColorStop(0, '#171224');
    bg.addColorStop(1, '#0b0812');
    g.fillStyle = bg; g.fillRect(0, 0, MAT_W, MAT_H);
    drawGrid(g, PAD);
    drawRulers(g);
    drawLogo(g);
    drawPatternPieces(g);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
}
const matSurface = new THREE.Mesh(
    new THREE.PlaneGeometry(3.05, 2.10),
    new THREE.MeshStandardMaterial({
        map: makeMatTexture(),
        emissive: 0x2a1655, emissiveIntensity: 0.18,
        roughness: 0.5, metalness: 0.1
    })
);
matSurface.rotation.x = -Math.PI / 2;
matSurface.position.y = 0.052;
matGroup.add(matSurface);

// ============================================================
// 4.2 DOTTED PATTERN ENGINE — 30 garment patterns, OUTLINES ONLY.
// Every piece is transparent line geometry: stroke-dasharray with
// fill="none", no background box, no fills, no labels, no guide
// lines — so real fabric stays 100% visible through the pattern.
// ============================================================
const PATTERN_LIBRARY = [
    { id: 'strapless',     name: 'Strapless Dress / Bodice',           fs: null },
    { id: 'shirt',         name: 'Classic Button-Down Shirt',          fs: 'simon' },
    { id: 'suit-jacket',   name: 'Tailored Suit Jacket (Jaeger)',      fs: null },
    { id: 'suit-trousers', name: 'Tailored Suit Trousers (Charlie / Theo)', fs: 'titan' },
    { id: 'tshirt',        name: 'Basic T-Shirt (Brian)',              fs: 'brian' },
    { id: 'hoodie',        name: 'Pullover Hoodie (Hugo)',             fs: null },
    { id: 'set-in-sleeve', name: 'Set-In Sleeve',                      fs: null },
    { id: 'raglan-sleeve', name: 'Raglan Sleeve',                      fs: null },
    { id: 'aline-dress',   name: 'A-Line Dress',                       fs: null },
    { id: 'wrap-dress',    name: 'Wrap Dress',                         fs: null },
    { id: 'blouse',        name: "Women's Blouse (Breanna)",           fs: 'bella' },
    { id: 'puff-blouse',   name: 'Puff Sleeve Blouse',                 fs: null },
    { id: 'peplum',        name: 'Peplum Top',                         fs: null },
    { id: 'halter',        name: 'Halter Top',                         fs: null },
    { id: 'turtleneck',    name: 'Turtleneck (Teagan)',                fs: 'aaron' },
    { id: 'trench',        name: 'Trench Coat (Carlton)',              fs: null },
    { id: 'bomber',        name: 'Bomber Jacket',                      fs: null },
    { id: 'denim-jacket',  name: 'Denim Jacket',                       fs: null },
    { id: 'kimono',        name: 'Kimono Cardigan',                    fs: null },
    { id: 'vest',          name: 'Tailored Vest (Wahid)',              fs: null },
    { id: 'palazzo',       name: 'Palazzo Trousers',                   fs: null },
    { id: 'cargo',         name: 'Cargo Pants',                        fs: null },
    { id: 'pencil-skirt',  name: 'Pencil Skirt',                       fs: null },
    { id: 'circle-skirt',  name: 'Full Circle Skirt (Sandy)',          fs: 'waralee' },
    { id: 'pleated-skirt', name: 'Pleated Skirt',                      fs: null },
    { id: 'jumpsuit',      name: 'Utility Jumpsuit',                   fs: null },
    { id: 'suit-sleeve',   name: 'Two-Piece Suit Sleeve (Bent)',       fs: 'bent' },
    { id: 'bell-sleeve',   name: 'Bell Sleeve',                        fs: null },
    { id: 'bishop-sleeve', name: 'Bishop Sleeve',                      fs: null },
    { id: 'collar-set',    name: 'Peter Pan / Mandarin Collar Set',    fs: null }
];
let activePattern = PATTERN_LIBRARY[1];   // Classic Button-Down Shirt, pre-selected
let latestPatternSvg = '';                // dotted outlines currently on the mat

// The 5 user measurements (Shoulder, Chest, Waist, Hips, Sleeve) → FreeSewing
function measurements5() {
    const m = (typeof getMeasurements === 'function' && getMeasurements()) || {};
    return {
        shoulder: +m.shoulder || 42, chest: +m.chest || 92, waist: +m.waist || 74,
        hips: +m.hips || 96, sleeve: +m.sleeve || 60
    };
}

// Wrap positioned piece paths in a fully transparent SVG (no backdrop, no labels).
// Fixed viewBox 0 0 1100 600; the 4 pieces sit at X = 50 / 320 / 590 / 850 in
// 230×500 cells so nothing ever overlaps. Every piece: dotted outline only.
function patternSvg(pieces, colorA = '#ffffff', colorB = '#d4af37') {
    const w = 1100, h = 600;
    const body = pieces.map(p => {
        const t = p.wrap ? ` transform="translate(${p.wrap[0].toFixed(1)} ${p.wrap[1].toFixed(1)}) scale(${(p.scale || 1).toFixed(3)})"` : '';
        return `<g${t}>` + p.paths.map(d =>
            `<path d="${d}" fill="none" stroke="${colorA}" ` +
            `stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" ` +
            `stroke-dasharray="6,6" vector-effect="non-scaling-stroke"/>`).join('') + '</g>';
    }).join('\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="100%" height="100%" ` +
        `preserveAspectRatio="xMidYMid meet" style="background:transparent;overflow:visible">${body}</svg>`;
}

// ---- Dynamic fit: the 5 user measurements → piece scale + 70% span ----
const PF_MEAS = { shoulder: 42, chest: 92, waist: 74, hips: 96, sleeve: 60 };
function pfFit() {   // size reference derives from chest / shoulder / hips / sleeve
    const raw = (PF_MEAS.chest * 0.55 + PF_MEAS.shoulder * 0.6 +
        PF_MEAS.hips * 0.35 + PF_MEAS.sleeve * 0.3) / 100;
    return { k: Math.max(0.72, Math.min(1.4, raw / 1.4)), K: 2.6 };  // cm → SVG units
}
// Fixed horizontal stations: Piece 1 at X=50, Piece 2 at X=320, Piece 3 at X=590,
// Piece 4 at X=850. Each cell is 230×500 with ~40-unit gutters inside the
// 0 0 1100 600 viewBox → pieces can never touch or overlap.
const FIXED_X = [50, 320, 590, 850];
const CELL_W = 230, CELL_H = 500, CELL_Y = 40;

function placeAcross(pieces) {   // 4 pieces side-by-side at fixed X stations
    pieces.forEach((p, i) => {
        const x = FIXED_X[i] != null ? FIXED_X[i] : 50 + i * 270;
        const s = Math.min(CELL_W / Math.max(p.span || 1, 1), CELL_H / Math.max(p.len || 1, 1));
        p.scale = s;
        // centre the scaled piece inside its cell
        p.wrap = [
            x + (CELL_W - (p.span || 1) * s) / 2,
            CELL_Y + (CELL_H - (p.len || 0) * s) / 2
        ];
    });
    return pieces;
}

// ---- Parametric piece templates (cm from the 5 measurements, y grows down) ----
// Bodice front: curved neckline + scoop armholes, tapered waist, straight hem.
function pfFrontBodice(m, { neckDrop = 8, arm = 1.0 } = {}) {
    const { K } = pfFit();
    const w = m.chest / 2 * K, sw = m.shoulder / 2 * K, wt = m.waist / 2 * K;
    const L = Math.max(m.chest, m.waist) * 1.15 * K, nw = sw * 0.62, nd = neckDrop * K * arm;
    // true full width: path reaches +/- (w + 6)
    return { span: 2 * (w + 6), len: L, paths: [`M ${-w} 0 L ${-sw} 2 L ${-nw} 0 Q 0 ${nd}, ${nw} 0 ` +
        `L ${sw} 2 Q ${sw * 1.02} ${L * 0.2}, ${w - 8} ${L * 0.32} Q ${w + 6} ${L * 0.5}, ${wt} ${L} ` +
        `L ${-wt} ${L} Q ${-(w + 6)} ${L * 0.5}, ${-(w - 8)} ${L * 0.32} Q ${-sw * 1.02} ${L * 0.2}, ${-sw} 2 Z`] };
}
// Bodice back: high back neckline, same tapered silhouette.
function pfBackBodice(m) {
    const { K } = pfFit();
    const w = m.chest / 2 * K, sw = m.shoulder / 2 * K, wt = m.waist / 2 * K;
    const L = Math.max(m.chest, m.waist) * 1.15 * K, nw = sw * 0.6;
    // true full width: path reaches +/- (w + 6)
    return { span: 2 * (w + 6), len: L, paths: [`M ${-w} 0 L ${-sw} 2 L ${-nw} 0 Q 0 ${3 * K}, ${nw} 0 ` +
        `L ${sw} 2 Q ${sw * 1.02} ${L * 0.2}, ${w - 8} ${L * 0.32} Q ${w + 6} ${L * 0.5}, ${wt} ${L} ` +
        `L ${-wt} ${L} Q ${-(w + 6)} ${L * 0.5}, ${-(w - 8)} ${L * 0.32} Q ${-sw * 1.02} ${L * 0.2}, ${-sw} 2 Z`] };
}
// Full tapered sleeve: tall arc cap, taper from bicep to cuff.
function pfSleeve(m, shape = 'set-in') {
    const { K } = pfFit();
    const L = m.sleeve * K * 0.95, cap = m.chest / 4 * K, top = m.chest / 6 * K;
    const hem = shape === 'bell' || shape === 'bishop' ? top * 1.8 : top * 0.72;
    return { span: top * 2, len: L + cap, paths: [`M ${-top} ${cap} Q ${-top * 0.5} ${-cap * 0.25}, 0 ${-cap * 0.1} ` +
        `Q ${top * 0.5} ${-cap * 0.25}, ${top} ${cap} L ${hem} ${L + cap * 0.6} L ${-hem} ${L + cap * 0.6} Z`] };
}
// Trouser leg: crotch curve (front) or seat curve (back), tapered to hem.
function pfLeg(m, side = 'front', widthMul = 1) {
    const { K } = pfFit();
    const L = Math.max(m.hips * 1.15, m.sleeve) * K * 1.1;
    const hip = m.hips / 4 * K * widthMul, knee = hip * 0.95, hem = hip * 0.72;
    const crotch = m.hips / 8 * K * (side === 'back' ? 1.45 : 1), rise = L * 0.42;
    // true full width: path reaches +/- hip
    return { span: hip * 2, len: L, paths: [`M ${-hip} 0 L ${hip} 0 L ${hip} ${rise} ` +
        `Q ${hip * 0.8} ${rise + crotch}, ${hip * 0.42} ${rise + crotch} L ${knee} ${L * 0.72} ` +
        `L ${hem} ${L} L ${-hem} ${L} L ${-knee} ${L * 0.72} L ${-hip * 0.42} ${rise + crotch} ` +
        `Q ${-hip * 0.8} ${rise + crotch}, ${-hip} ${rise} Z`] };
}
function pfWaistband(m, span) {
    const { K } = pfFit();
    const h = m.waist / 5 * K;
    // path reaches +/- span → true full width is span * 2
    return { span: span * 2, len: h, paths: [`M ${-span} 0 L ${span} 0 L ${span} ${h} L ${-span} ${h} Z`] };
}
function pfSkirt(m, kind = 'aline') {
    const { K } = pfFit();
    const w = m.waist / 2 * K, hip = m.hips / 2 * K, L = Math.max(m.hips, m.waist) * 1.2 * K;
    const flare = kind === 'pencil' ? hip * 0.88 : hip * (kind === 'circle' ? 1.75 : 1.35);
    // true full width: path reaches +/- flare
    return { span: flare * 2, len: L, paths: [`M ${-w} 0 L ${w} 0 Q ${hip} ${L * 0.22}, ${flare} ${L} ` +
        `L ${-flare} ${L} Q ${-hip} ${L * 0.22}, ${-w} 0 Z`] };
}

// Collar / cuffs piece: mandarin-style collar band with points, plus one cuff.
// The two sub-paths stack vertically inside its own cell (X = 850).
function pfCollarCuffs(m) {
    const { K } = pfFit();
    const clen = m.shoulder * 0.8 * K;      // collar band length
    const chei = 3.2 * K;                   // band height
    const cdrop = 1.8 * K;                  // collar point depth
    const ulen = m.sleeve * 0.9 * K;        // cuff length
    const uhei = 2.8 * K;                   // cuff height
    const gap = 14;
    return {
        span: Math.max(clen, ulen) + 24,
        len: chei + cdrop + gap + uhei + 20,
        paths: [
            `M ${-clen / 2} 0 L ${clen / 2} 0 L ${clen / 2 - 3} ${chei} L 0 ${chei + cdrop} L ${-clen / 2 + 3} ${chei} Z`,
            `M ${-ulen / 2} ${chei + cdrop + gap} L ${ulen / 2} ${chei + cdrop + gap} L ${ulen / 2} ${chei + cdrop + gap + uhei} L ${-ulen / 2} ${chei + cdrop + gap + uhei} Z`
        ]
    };
}

const PF_TOPS = ['shirt', 'blouse', 'tshirt', 'puff-blouse', 'turtleneck', 'hoodie', 'bomber',
    'denim-jacket', 'suit-jacket', 'trench', 'vest', 'kimono', 'peplum', 'halter'];
const PF_BOTTOMS = ['suit-trousers', 'palazzo', 'cargo', 'jumpsuit'];
const PF_DRESSES = ['aline-dress', 'wrap-dress', 'strapless'];
const PF_SKIRTS = ['pencil-skirt', 'pleated-skirt', 'circle-skirt'];

// Route the active garment to its own anatomically accurate silhouette set.
// Each branch returns up to 4 pieces placed at X = 50 / 320 / 590 / 850 so
// nothing ever overlaps. Unused stations stay empty (no overlap either way).
// Pieces are centered at x = 0, y grows down; span = full width, len = full
// height so placeAcross() scales them into their 230×500 cell. Dimensions
// derive from the 5 user measurements via pfFit().K (cm → SVG units).
function pPatternPieces(id, m) {
    const name = (activePattern && activePattern.name) || '';
    const sig = ((id || '') + ' ' + name).toLowerCase();
    const K = pfFit().K;

    if (/(trouser|pant|cargo|palazzo|jean)/.test(sig)) {
        return placeAcross([
            pfTrouserFrontLeg(m, K),   // Front Leg (shallow crotch)
            pfTrouserBackLeg(m, K),    // Back Leg (deeper seat curve)
            pfTrouserWaistband(m, K),  // long rectangular waistband
            pfTrouserPocket(m, K)      // pocket facing
        ]);
    }
    if (/(strapless|corset|bustier)/.test(sig)) {
        return placeAcross([
            pfStraplessBustFront(m, K),   // sweetheart/straight bust panel + dart
            pfStraplessBustBack(m, K),    // contoured back panel
            pfStraplessSkirt(m, K, 1.35), // flared A-line skirt front
            pfStraplessSkirt(m, K, 1.35)  // flared A-line skirt back
        ]);
    }
    if (/(skirt|pencil|circle|pleated)/.test(sig)) {
        const kind = /circle/.test(sig) ? 'circle' : /pencil/.test(sig) ? 'pencil' : 'aline';
        return placeAcross([
            pfSkirtWaistband(m, K),   // curved waistband
            pfSkirtPanel(m, K, kind), // flared/circle or tapered pencil panel
            pfSkirtPanel(m, K, kind), // skirt back panel
            pfSkirtHemFacing(m, K)    // hem facing
        ]);
    }
    if (/(t-shirt|tshirt|tee|top|blouse)/.test(sig)) {
        return placeAcross([
            pfTeeFront(m, K),         // crew-neck front bodice
            pfTeeBack(m, K),          // higher-neck back bodice
            pfTeeSleeve(m, K),        // short wide sleeve
            pfTeeNeckBinding(m, K)    // neck binding
        ]);
    }
    if (/(hoodie|sweatshirt)/.test(sig)) {
        return placeAcross([
            pfHoodieFront(m, K),  // relaxed front + kangaroo pocket outline
            pfHoodieBack(m, K),   // back bodice
            pfHoodieSleeve(m, K), // long sleeve
            pfHoodieHood(m, K)    // curved 2-piece hood contour
        ]);
    }
    if (/(bomber|jacket|blazer|coat|trench|vest)/.test(sig)) {
        return placeAcross([
            pfJacketFront(m, K),  // lapel/zip front bodice
            pfJacketBack(m, K),   // back bodice
            pfJacketSleeve(m, K), // long tapered sleeve
            pfJacketTrim(m, K)    // collar + cuffs + waistband
        ]);
    }
    if (/(dress|jumpsuit|gown)/.test(sig)) {
        return placeAcross([
            pfDressFront(m, K),  // connected torso-to-skirt front
            pfDressBack(m, K),   // connected torso-to-skirt back
            pfDressSash(m, K),   // waist sash
            pfDressLining(m, K)  // neck/armhole lining
        ]);
    }
    // Default fallback: four generic separated pieces (shirts, etc.)
    return placeAcross([
        pfFrontBodice(m),           // Front
        pfBackBodice(m),            // Back
        pfSleeve(m, 'set-in'),      // Sleeve
        pfCollarCuffs(m)            // Collar / Cuffs
    ]);
}

// Keep the generator name every existing call site uses
function generatePatternSVG(m, colorA = '#ffffff', colorB = '#d4af37') {
    const meas = { shoulder: +m.shoulder || 42, chest: +m.chest || 92, waist: +m.waist || 74, hips: +m.hips || 96, sleeve: +m.sleeve || 60 };
    PF_MEAS.shoulder = meas.shoulder; PF_MEAS.chest = meas.chest;
    PF_MEAS.waist = meas.waist; PF_MEAS.hips = meas.hips; PF_MEAS.sleeve = meas.sleeve;
    return patternSvg(pPatternPieces(activePattern.id, meas), colorA, colorB);
}

// FreeSewing (server side) → dotted outline SVG; null when unavailable so the
// parametric template above is used instead.
async function requestFreeSewingPattern(pattern, meas) {
    if (!pattern.fs) return null;
    try {
        const r = await fetch('/api/pattern', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ design: pattern.fs, measurements: meas })
        });
        if (!r.ok) return null;
        const j = await r.json();
        return j && j.svg ? j.svg : null;
    } catch { return null; }
}

function __legacyGeneratePatternSVG(m, colorA = '#ffffff', colorB = '#d4af37') {
    const cm = v => (v * 3).toFixed(1); // scale: 1cm → 3px for a 60×60 viewBox
    const chest = +m.chest || 92, waist = +m.waist || 74, hips = +m.hips || 96, sleeve = +m.sleeve || 60;
    const w = 220, h = 240;
    const cx = w / 2;
    const halfChest = chest / 2, halfWaist = waist / 2, halfHip = hips / 2;
    const bodyLen = Math.max(58, hips * 0.62);
    const y = v => 30 + v; // vertical mapping
    const outline = [
        `M ${cx - cm(halfChest)} ${y(0)}`,                       // neck-left shoulder point
        `L ${cx - cm(halfChest)} ${y(bodyLen * 0.82)}`,          // side seam
        `Q ${cx - cm(halfHip)} ${y(bodyLen)}, ${cx - cm(halfWaist)} ${y(bodyLen)}`, // hip curve to hem
        `L ${cx + cm(halfWaist)} ${y(bodyLen)}`,                 // hem
        `Q ${cx + cm(halfHip)} ${y(bodyLen)}, ${cx + cm(halfChest)} ${y(bodyLen * 0.82)}`,
        `L ${cx + cm(halfChest)} ${y(0)}`,                       // shoulder right
        `Q ${cx} ${y(-8)}, ${cx - cm(halfChest)} ${y(0)}`        // neckline
    ].join(' ');
    const dash = 'stroke-dasharray="6, 6"';
    return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <rect x="0" y="0" width="${w}" height="${h}" fill="rgba(10,5,24,0.85)"/>
        <path d="${outline}" fill="none" stroke="${colorA}" stroke-width="2.2" ${dash}/>
        <line x1="${cx}" y1="${y(0)}" x2="${cx}" y2="${y(bodyLen)}" stroke="${colorB}" stroke-width="1.6" ${dash}/>
        <line x1="${cx - cm(halfChest)}" y1="${y(sleeve * 0.45)}" x2="${cx + cm(halfChest)}" y2="${y(sleeve * 0.45)}" stroke="${colorB}" stroke-width="1.4" ${dash}/>
        <circle cx="${cx}" cy="${y(bodyLen * 0.55)}" r="3" fill="${colorB}"/>
        <text x="10" y="${h - 10}" fill="${colorA}" font-size="10" font-family="monospace">${chest}/${waist}/${hips}cm — sleeve ${sleeve}cm</text>
    </svg>`;
}

let measurementsConfirmed = false;
// Read all 5 essential tailoring measurements from the named inputs (cm)
function getMeasurements() {
    return {
        shoulder: $('m-shoulder')?.value || 42,
        chest: $('m-chest')?.value || 92,
        waist: $('m-waist')?.value || 74,
        hips: $('m-hips')?.value || 96,
        sleeve: $('m-sleeve')?.value || 60
    };
}
function pulseMeasurementsBox() {
    const mbox = $('measurements-box');
    if (!mbox) return null;
    mbox.classList.add('pulse-glow');
    const btn = $('btn-confirm-measurements');
    if (btn) btn.classList.add('visible');
    return btn;
}

// Draft the active pattern from the 5 measurements and show it on every
// surface: mat, AR overlay and (if present) the small preview.
async function draftActivePattern({ openAR = false } = {}) {
    const meas = measurements5();
    const status = $('pattern-search-status');
    if (status) status.textContent = 'Drafting ' + activePattern.name + '…';
    const fsSvg = await requestFreeSewingPattern(activePattern, meas);
    const svg = fsSvg || generatePatternSVG(meas);
    latestPatternSvg = svg;
    const holder = $('pattern-svg-holder');
    if (holder) { holder.innerHTML = svg; $('pattern-preview')?.classList.add('visible'); }
    const layer = $('ar-pattern-layer');
    if (layer) layer.innerHTML = svg;      // keep AR in sync even before it opens
    renderPatternOnMat(svg);
    if (status) {
        const src = fsSvg ? 'FreeSewing' : 'parametric';
        status.textContent = activePattern.name + ' · ' + src + ' · ' +
            `${meas.chest}cm chest / ${meas.waist}cm waist / ${meas.hips}cm hips`;
    }
    if (openAR) openSmartGlassesAR();
    return svg;
}

function confirmMeasurements() {
    measurementsConfirmed = true;
    const mbox = $('measurements-box');
    if (mbox) mbox.classList.remove('pulse-glow');
    const btn = $('btn-confirm-measurements');
    if (btn) btn.classList.remove('visible');
    draftActivePattern({ openAR: true }); // dotted outlines → mat, then AR projection
}
$('btn-confirm-measurements')?.addEventListener('click', confirmMeasurements);

// ---------- Pattern search bar: 30 garments + Confirm ----------
function renderPatternOptions(filter = '') {
    const list = $('pattern-options');
    if (!list) return;
    const q = filter.trim().toLowerCase();
    const matches = PATTERN_LIBRARY.filter(p => !q || p.name.toLowerCase().includes(q));
    list.innerHTML = matches.length
        ? matches.map(p => `<div class="pattern-opt${p === activePattern ? ' active' : ''}" data-pattern-id="${p.id}">${esc(p.name)}</div>`).join('')
        : '<div class="pattern-opt empty">No pattern matches that search</div>';
}
function selectPattern(id) {
    const found = PATTERN_LIBRARY.find(p => p.id === id);
    if (!found) return;
    activePattern = found;
    const input = $('pattern-search');
    if (input) input.value = found.name;
    renderPatternOptions('');
    const list = $('pattern-options');
    if (list) list.classList.remove('open');
    const status = $('pattern-search-status');
    if (status) status.textContent = found.name + ' selected — press Confirm to draft';
}
(function wirePatternSearch() {
    const input = $('pattern-search'), confirm = $('pattern-confirm'), list = $('pattern-options');
    if (!input) return;
    input.value = activePattern.name;
    renderPatternOptions('');
    input.addEventListener('focus', () => { renderPatternOptions(''); list?.classList.add('open'); });
    input.addEventListener('input', () => { renderPatternOptions(input.value); list?.classList.add('open'); });
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape') { list?.classList.remove('open'); return; }
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const first = list && !list.querySelector('.pattern-opt.empty') ? list.querySelector('.pattern-opt') : null;
        if (first) selectPattern(first.dataset.patternId);   // jump to the filtered pattern
        list?.classList.remove('open');
        confirm?.click();
    });
    list?.addEventListener('click', e => {
        const opt = e.target.closest('.pattern-opt[data-pattern-id]');
        if (opt) selectPattern(opt.dataset.patternId);
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('#pattern-search-wrap')) list?.classList.remove('open');
    });
    confirm?.addEventListener('click', () => {
        // If the typed text exactly matches a pattern, select it before drafting
        const typed = (input.value || '').trim().toLowerCase();
        const exact = PATTERN_LIBRARY.find(p => p.name.toLowerCase() === typed);
        if (exact) activePattern = exact;
        confirmMeasurements();
    });
})();

// ---------- 4.3 Project the dotted pattern onto the cutting board ----------
// The pattern is an SVG of stroke-dasharray paths with fill="none" and NO
// backdrop, so the mesh is pure transparent line geometry over the board.
let patternOnMat = null;
let patternRenderToken = 0;
function renderPatternOnMat(svgString) {
    const token = ++patternRenderToken;
    const clear = () => {
        if (!patternOnMat) return;
        matGroup.remove(patternOnMat);
        patternOnMat.material.map?.dispose();
        patternOnMat.material.dispose();
        patternOnMat = null;
    };
    clear();
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    new THREE.TextureLoader().load(url, tex => {
        URL.revokeObjectURL(url);
        if (token !== patternRenderToken) { tex.dispose(); return; }   // superseded
        tex.colorSpace = THREE.SRGBColorSpace;
        // 1100×600 viewBox → keep the ratio so pieces are never stretched
        const planeH = 1.72;
        const mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(planeH * (1100 / 600), planeH),
            new THREE.MeshBasicMaterial({
                map: tex, transparent: true, opacity: 1, depthWrite: false,
                // additive keeps the white dotted lines readable on the dark mat while
                // every unfilled centimetre stays fully see-through
                blending: THREE.AdditiveBlending
            })
        );
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.y = 0.062;   // above the mat surface (0.052) to avoid z-fighting
        matGroup.add(mesh);
        patternOnMat = mesh;
    });
}

// Click the mat (or its table surface) → measurement-confirmation flow
renderer.domElement.addEventListener('pointerdown', ev => {
    if (boardFocused || arActive) return; // board handling takes priority
    pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(ev.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    if (raycaster.intersectObject(matSurface).length) {
        if (!measurementsConfirmed) pulseMeasurementsBox();
        else confirmMeasurements();
    }
});

// "Sewing Pattern & AR Glasses" button — same flow
$('btn-sewing')?.addEventListener('click', () => {
    if (!measurementsConfirmed) pulseMeasurementsBox();
    else confirmMeasurements();
});

// ---------- 4.4 Smart Glasses AR view (WebXR immersive-ar + camera fallback) ----------
let arActive = false, arStream = null, arSession = null;
let arScale = 1, arTargetScale = 1;   // smooth zoom of the overlaid pattern

// AR overlay always shows the currently drafted dotted outlines (outlines only)
const AR_PATTERN_SVG = () => latestPatternSvg || generatePatternSVG(measurements5());

// ---------- Universal "Send to Sewing Pattern" (from board cards, stylist chat,
// and the design sketcher): pulses the measurements box & renders dotted lines on
// both the 3D sewing mat and the transparent Smart Glasses AR view ----------
function sendToSewingPattern(outfit) {
    if (outfit) selectedCard = outfit;
    pulseMeasurementsBox();
    measurementsConfirmed = true;
    $('measurements-box')?.classList.remove('pulse-glow');
    $('btn-confirm-measurements')?.classList.remove('visible');
    draftActivePattern({ openAR: true });
}
$('sk-btn-mat')?.addEventListener('click', () => sendToSewingPattern(designOutfitLike()));

async function openSmartGlassesAR() {
    if (arActive) return;
    arActive = true;
    const view = $('ar-view');
    const layer = $('ar-pattern-layer');
    const prompt = $('ar-prompt');
    if (layer) layer.innerHTML = AR_PATTERN_SVG();
    // No dark panels / HUD boxes / bottom captions over the camera feed —
    // only the transparent dotted outlines are drawn on top of the fabric.
    ['ar-hud', 'ar-calib'].forEach(id => { const el = $(id); if (el) el.style.display = 'none'; });
    if (view) view.classList.add('active');
    if (prompt) prompt.style.display = 'flex';   // explicit webcam-permission gate

    // 1) Prefer a real AR session on smart glasses (WebXR immersive-ar + hit-test)
    if (navigator.xr) {
        try {
            const supported = await navigator.xr.isSessionSupported('immersive-ar');
            if (supported) {
                arSession = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'],
                    domOverlay: { root: view }
                });
                arSession.addEventListener('end', () => { closeSmartGlassesAR(); });
                if (prompt) prompt.style.display = 'none';
                console.log('WebXR immersive-ar session started');
                return; // pattern anchored by XR; video element unused
            }
        } catch (err) { console.warn('WebXR AR unavailable, falling back to camera', err); }
    }
}

// Explicit user-gesture webcam enable — mirrors the on-screen "Enable Camera" button
async function enableARCamera() {
    try {
        arStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 } },
            audio: false
        });
        const video = $('ar-video');
        if (video) video.srcObject = arStream;
        const prompt = $('ar-prompt');
        if (prompt) prompt.style.display = 'none';
        toastARHUD('📷 Live camera active — align the dotted pattern with your fabric');
    } catch (err) {
        console.warn('Camera denied — transparent simulation mode', err);
        toastARHUD('⚠ Camera unavailable or denied — dotted-pattern simulation mode');
        const prompt = $('ar-prompt');
        if (prompt) prompt.style.display = 'none';
        const video = $('ar-video');
        if (video) video.style.background = 'transparent';
    }
}
$('ar-enable-cam')?.addEventListener('click', enableARCamera);

function toastARHUD(msg) {
    // HUD is intentionally hidden in the transparent AR view; log only.
    console.log('[AR]', msg);
}

async function closeSmartGlassesAR() {
    arActive = false;
    try {
        if (arSession) {
            await arSession.end();
        }
    } catch (e) {}
    arSession = null;
    if (arStream) { arStream.getTracks().forEach(t => t.stop()); arStream = null; }
    $('ar-view')?.classList.remove('active');
    const video = $('ar-video');
    if (video) video.srcObject = null;
}


$('ar-exit')?.addEventListener('click', closeSmartGlassesAR);

// ---------- 4.5 Surface-distance tracking & pattern zoom lock ----------
// Reads the apparent size of the cyan calibration reference square printed on
// the mat texture (known real size 10cm). As the user leans closer, the square
// appears larger → we scale the overlaid dotted pattern UP so its projected
// centimetres stay locked to the physical cloth; leaning back scales it down.
const CALIB_CM = 10;              // real-world size of the calibration square (cm)
const REFERENCE_PX_AT_50CM = 90;  // calibrated: square spans ~90px at 50cm working distance
const AR_CALIB_SCALE = 320;        // detection canvas long edge (px) used by measureCalibrationSquare()

// One reusable canvas/ctx: creating a 320px canvas + getImageData 8×/sec was the
// main cost of the old loop and made the zoom-lock feel steppy.
const _arScanCanvas = document.createElement('canvas');
const _arScanCtx = _arScanCanvas.getContext('2d', { willReadFrequently: true });

// Returns the calibration square's apparent edge length in *normalised* scan
// pixels (referenced to a 320px-wide analysis frame) so the 10cm lock works on
// any camera resolution. null → square not visible.
function measureCalibrationSquare() {
    const video = $('ar-video');
    if (!video || video.readyState < 2 || !video.videoWidth) return null;
    const w = video.videoWidth, h = video.videoHeight;
    const sw = AR_CALIB_SCALE, sh = Math.max(1, Math.round(AR_CALIB_SCALE * h / w));
    if (_arScanCanvas.width !== sw || _arScanCanvas.height !== sh) {
        _arScanCanvas.width = sw; _arScanCanvas.height = sh;
    }
    _arScanCtx.drawImage(video, 0, 0, sw, sh);
    const d = _arScanCtx.getImageData(0, 0, sw, sh).data;
    // Detect cyan calibration pixels as a proxy for apparent size
    let cyanPixels = 0;
    for (let i = 0; i < d.length; i += 4) {
        const r = d[i], gg = d[i + 1], b = d[i + 2];
        if (b > 140 && gg > 140 && r < 100) cyanPixels++;   // bright cyan region
    }
    if (cyanPixels < 24) return null; // square not in view
    return Math.sqrt(cyanPixels);     // ~edge length in analysis-pixels
}

let lastMeasure = 0;
let arDistanceCm = null;   // last smoothed real-world distance (cm), null until locked
let arLocked = false;      // true while the 10cm reference square is being tracked

function updateARDistance(now) {
    if (!arActive) return;
    const edgePx = measureCalibrationSquare();
    const layer = $('ar-pattern-layer');

    if (edgePx) {
        // distance ≈ calibrated_distance × (reference_px / measured_px)
        const rawCm = THREE.MathUtils.clamp(50 * (REFERENCE_PX_AT_50CM / edgePx), 15, 200);
        // Smooth the distance reading itself so jitter in pixel counts never shakes the pattern
        arDistanceCm = arDistanceCm == null ? rawCm : arDistanceCm + (rawCm - arDistanceCm) * 0.18;
        const distEl = $('ar-distance');
        if (distEl) distEl.textContent = arDistanceCm.toFixed(0) + ' cm';
        // Zoom lock: closer → pattern bigger, farther → smaller (inverse proportional),
        // so one virtual centimetre keeps the same on-screen size as one real centimetre
        // of fabric. Reference is the 50cm working distance.
        arTargetScale = THREE.MathUtils.clamp(50 / arDistanceCm, 0.55, 2.6);
        arLocked = true;
    } else if (arStream) {
        // Square hidden → keep the last lock instead of snapping back
        arLocked = false;
    }

    // Smooth easing so leaning in/out feels fluid (frame-rate independent)
    const dtMs = Math.min(250, now != null ? now - (updateARDistance._last || now) : 120);
    updateARDistance._last = now;
    const ease = 1 - Math.pow(0.82, dtMs / 16.7);
    arScale += (arTargetScale - arScale) * ease;
    if (layer) {
        layer.style.transform =
            `scale(${arScale.toFixed(4)}) translateZ(0)`;
        layer.dataset.lock = arLocked ? 'locked' : 'searching';
    }
}

// rAF-driven: scales in perfect sync with the camera feed (was a 120ms setInterval)
function arDistanceLoop(now) {
    if (arActive) updateARDistance(now);
    requestAnimationFrame(arDistanceLoop);
}
requestAnimationFrame(arDistanceLoop);

// ۵. ساخت مانکن پیش‌فرض (اگر فایل FBX خطا داد، صحنه خالی نماند)
function createFallbackAvatar(x, isFemale) {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x241a33, metalness: 0.4, roughness: 0.55 });
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 20, 20), mat);
    head.position.y = 1.72;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(isFemale ? 0.16 : 0.22, 0.14, 0.65, 20), mat);
    body.position.y = 1.22;
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.09, 0.85, 20), mat);
    legs.position.y = 0.45;
    group.add(head, body, legs);
    group.position.set(x, 0, 0);
    scene.add(group);
    return group;
}

const maleFallback = createFallbackAvatar(PED_X.male, false);
const femaleFallback = createFallbackAvatar(PED_X.female, true);

// ---------- Matte Obsidian Black mannequin finish (default) + Royal Velvet Purple toggle ----------
// Garments pop vividly against the sleek matte obsidian body; a quick pill in the
// left panel switches both mannequins to Royal Velvet Purple (#221038).
const MANNEQUIN_FINISH = {
    obsidian: { color: 0x141418, roughness: 0.35, metalness: 0.45, emissive: 0x160a28, emissiveIntensity: 0.2 },
    purple:   { color: 0x221038, roughness: 0.40, metalness: 0.35, emissive: 0x2a1045, emissiveIntensity: 0.25 }
};
let currentFinish = 'obsidian';
function applyMannequinFinish(name = currentFinish) {
    currentFinish = MANNEQUIN_FINISH[name] ? name : 'obsidian';
    const f = MANNEQUIN_FINISH[currentFinish];
    const tintModel = root => root?.traverse(o => {
        if (!o.isMesh || !o.material) return;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
            if ('map' in m) m.map = null;                 // pure matte finish: no baked texture
            if ('color' in m) m.color.setHex(f.color);
            if ('roughness' in m) m.roughness = f.roughness;
            if ('metalness' in m) m.metalness = f.metalness;
            if ('emissive' in m && m.emissive) { m.emissive.setHex(f.emissive); m.emissiveIntensity = f.emissiveIntensity; }
            if ('needsUpdate' in m) m.needsUpdate = true;
        });
    });
    tintModel(avatars.male);
    tintModel(avatars.female);
    // Fallback primitive mannequins share the same luxury finish
    [maleFallback, femaleFallback].forEach(g => g.traverse(o => {
        if (!o.isMesh || !o.material) return;
        o.material.color.setHex(f.color);
        o.material.roughness = f.roughness;
        o.material.metalness = f.metalness;
        if (o.material.emissive) { o.material.emissive.setHex(f.emissive); o.material.emissiveIntensity = f.emissiveIntensity; }
    }));
    document.querySelectorAll('#finish-toggle button').forEach(b =>
        b.classList.toggle('active', b.dataset.finish === currentFinish));
}
document.getElementById('finish-toggle')?.addEventListener('click', e => {
    const btn = e.target.closest('button[data-finish]');
    if (btn) applyMannequinFinish(btn.dataset.finish);
});
applyMannequinFinish('obsidian');   // sleek matte obsidian black by default

// ۶. بارگذاری FBX — تک نمونه Three.js از importmap؛ ریدایرکت تکچرها به models/textures
// (single Three.js instance: everything comes from the importmap — no duplicate CDN)
const texManager = new THREE.LoadingManager();
texManager.setURLModifier(url => {
    const file = url.split(/[\\/]/).pop();
    if (/\.(png|jpe?g|tga|bmp|webp)$/i.test(file)) return './models/textures/' + encodeURIComponent(file);
    return url;
});

const fbxLoader = new FBXLoader(texManager);


function placeAvatar(obj, x, targetHeight) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    obj.scale.setScalar(targetHeight / (size.y || 1));
    const box2 = new THREE.Box3().setFromObject(obj);
    obj.position.set(x, -box2.min.y, 0);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    scene.add(obj);
    return obj;
}

fbxLoader.load('/models/male.fbx', obj => {
    scene.remove(maleFallback);
    avatars.male = placeAvatar(obj, PED_X.male, 2.0);      // auto-scaled to 2 units tall
    avatars.male.visible = true;
    applyMannequinFinish(currentFinish);                    // matte obsidian by default
}, undefined, () => console.log('Using 3D Male Mannequin'));

fbxLoader.load('/models/female.fbx', obj => {
    scene.remove(femaleFallback);
    avatars.female = placeAvatar(obj, PED_X.female, 2.0);  // auto-scaled to 2 units tall
    avatars.female.visible = true;
    applyMannequinFinish(currentFinish);                    // matte obsidian by default
}, undefined, () => console.log('Using 3D Female Mannequin'));

// ---------- Outfit (dress + shoes) via GLTFLoader ----------
// ./models/robe.glb first; falls back to the available girlcloth.glb
const gltfLoader = new GLTFLoader(texManager);
let robeLoaded = null;   // template scene
let fittedDress = null;  // clone currently placed on the female avatar

function loadRobe(urls, i = 0) {
    if (i >= urls.length) { console.warn('No robe model found in ./models/'); return; }
    gltfLoader.load(urls[i],
        gltf => {
            robeLoaded = gltf.scene;
            robeLoaded.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
            console.log('Outfit model loaded:', urls[i]);
        },
        undefined,
        () => loadRobe(urls, i + 1) // try the next candidate on failure
    );
}
loadRobe(['./models/source/model.glb', './models/source/girlcloth.glb']);

// Recolor the cloth: replaces dark/garment textures with the outfit's fabric color
function recolorCloth(root, hexColor) {
    root.traverse(o => {
        if (o.isMesh && o.material) {
            o.material = o.material.clone();
            o.material.map = null;                 // drop baked textures → pure fabric color
            o.material.color.setHex(hexColor);
            if ('roughness' in o.material) o.material.roughness = 0.65;   // soft fabric
            if ('metalness' in o.material) o.material.metalness = 0.05;
            if (o.material.emissive) o.material.emissive.setHex(hexColor).multiplyScalar(0.12);
        }
    });
}

// Dress whichever avatar matches the selected Gender with the selected outfit
function fitOutfitOnSelected() {
    const mbox = $('measurements-box');
    if (mbox) mbox.classList.add('pulse-glow');   // pulse the Full Measurements panel
    const uploadArea = $('upload-area');          // focus photo upload for AI try-on
    if (uploadArea) {
        uploadArea.style.borderColor = 'rgba(212,175,55,0.7)';
        uploadArea.classList.add('pulse-glow');
        uploadArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (!robeLoaded) {
        setTimeout(fitOutfitOnSelected, 400); // model still loading — retry
        return;
    }

    const gender = $('gender')?.value || 'male';
    const isFemale = gender === 'female';
    const pedX = isFemale ? PED_X.female : PED_X.male;
    const avatarRef = isFemale ? avatars.female : avatars.male;

    // Replace any previously fitted dress
    if (fittedDress) { scene.remove(fittedDress); fittedDress = null; }

    const outfit = selectedCard || OUTFITS.find(o => o.gender === gender);
    const fabricColor = outfit ? outfit.color : 0x7a2bff;

    dressMaterial = new THREE.MeshStandardMaterial({
        color: fabricColor, roughness: 0.65, metalness: 0.05,
        emissive: new THREE.Color(fabricColor).multiplyScalar(0.12)
    });

    const dress = robeLoaded.clone(true);
    recolorCloth(dress, fabricColor);
    const box = new THREE.Box3().setFromObject(dress);
    const size = box.getSize(new THREE.Vector3());
    dress.scale.setScalar(2.0 / (size.y || 1));  // fit to 2-unit avatar
    const box2 = new THREE.Box3().setFromObject(dress);
    dress.position.set(
        pedX,
        -(box2.min.y * dress.scale.x),
        (avatarRef || (isFemale ? femaleFallback : maleFallback))?.position.z || 0
    );
    dress.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
    scene.add(dress);
    fittedDress = dress;

    // Hide the undressed fallback mannequin so the dressed model stands alone
    (isFemale ? femaleFallback : maleFallback).visible = false;

    // Show the two large PayPal buttons at the bottom of the 3D board
    const bar = $('paypal-bar');
    if (bar) bar.classList.add('visible');
}

// ---------- Null-checked UI wiring ----------
const btnFitting = $('btn-fitting');
if (btnFitting) btnFitting.addEventListener('click', () => {
    // Order 2: "Go to Virtual Fitting Room" clicked BEFORE a photo exists →
    // dress the mannequin now; the moment a photo is uploaded the full
    // try-on + Gemini analysis fires automatically.
    if (!selectedCard) selectedCard = OUTFITS.find(o => o.gender === ($('gender')?.value || 'male'));
    fitOutfitOnSelected();
    if (uploadedPhoto) startFittingWorkflow();
    else {
        if (mirrorCard) mirrorCard.style.display = 'block';
        const crit = $('ai-critique');
        if (crit) crit.innerHTML = '<span class="err">📸 Upload your photo — the AI try-on & fit analysis will start automatically.</span>';
        uploadBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

const btnMatch = $('btn-match');
if (btnMatch) btnMatch.addEventListener('click', () => {
    const verdict = $('ai-verdict');
    if (!verdict) return;
    const h = $('height') ? $('height').value : '?';
    const w = $('weight') ? $('weight').value : '?';
    verdict.innerHTML = `✨ <b>96% Match!</b> Ideal fit for Height ${h}cm & Weight ${w}kg.`;
});

// ============================================================
// MOCK PAYPAL CHECKOUT (demo mode — no Sandbox credentials needed)
// Both "Pay with PayPal" and "PayPal Pay Later" open a realistic,
// fully interactive PayPal window. "Pay Now" completes the payment
// and swaps in a green success receipt. Purely front-end state.
// ============================================================
const PAYPAL_INVOICE = { count: 1004827, orders: [] };
let paypalOrder = null;   // { id, name, price, mode, payerName, payerEmail }

// --- Create the modal once (lazily) and append it over the 3D studio ---
function ensurePayPalModal() {
    let ov = $('paypal-modal');
    if (ov) return ov;
    ov = document.createElement('div');
    ov.id = 'paypal-modal';
    ov.innerHTML = `
      <div id="pp-dialog" role="dialog" aria-modal="true" aria-label="PayPal checkout">
        <div id="pp-head">
          <span id="pp-logo"><span class="pp-mark">P</span>Pay<span class="pp-pal">Pal</span></span>
          <span id="pp-demo-tag">DEMO MODE</span>
          <button id="pp-close" type="button" title="Close" aria-label="Close checkout">&times;</button>
        </div>
        <div id="pp-body">
          <div id="pp-item">
            <div id="pp-item-img"><img id="pp-thumb" alt="Item"></div>
            <div id="pp-item-info">
              <div id="pp-item-name"></div>
              <div id="pp-item-sub">FashionBuy Atelier &middot; Free tailoring &amp; 3D preview included</div>
              <div id="pp-item-mode"></div>
            </div>
            <div id="pp-item-price"></div>
          </div>
          <div id="pp-totals">
            <div class="pp-row"><span>Subtotal</span><span id="pp-subtotal"></span></div>
            <div class="pp-row"><span>Shipping</span><span>Free</span></div>
            <div class="pp-row"><span>Tax</span><span id="pp-tax"></span></div>
            <div class="pp-row pp-total"><span>Total</span><span id="pp-total"></span></div>
          </div>
          <div id="pp-payer">
            <div class="pp-avatar" id="pp-avatar">—</div>
            <div>
              <div id="pp-payer-name"></div>
              <div id="pp-payer-mail"></div>
            </div>
            <span class="pp-badge">PayPal Balance</span>
          </div>
          <button id="pp-pay" type="button">Pay Now</button>
          <div id="pp-secure">🔒 Secure demo payment &middot; no real money is moved</div>
        </div>
        <div id="pp-success">
          <div id="pp-check">✓</div>
          <h3 id="pp-success-title">Payment Successful</h3>
          <p id="pp-success-sub"></p>
          <div class="pp-receipt">
            <div><span>Receipt</span><b id="pp-receipt-id"></b></div>
            <div><span>Amount</span><b id="pp-receipt-amount"></b></div>
            <div><span>Item</span><b id="pp-receipt-item"></b></div>
            <div><span>Status</span><b id="pp-receipt-status">Completed</b></div>
          </div>
          <button id="pp-done" type="button">Done</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', e => { if (e.target === ov) closePayPalModal(); });
    $('pp-close')?.addEventListener('click', closePayPalModal);
    $('pp-done')?.addEventListener('click', closePayPalModal);
    $('pp-pay')?.addEventListener('click', completePayPalPayment);
    return ov;
}

function money(n) { return '$' + (Number(n) || 0).toFixed(2); }

// Open the PayPal window for an outfit / product
function openPayPalModal(name, price, { mode = 'paypal', img = '' } = {}) {
    const ov = ensurePayPalModal();
    const amount = Number(String(price).replace(/[^0-9.]/g, '')) || 0;
    const tax = Math.round(amount * 0.08 * 100) / 100;
    paypalOrder = {
        id: 'FB-' + (++PAYPAL_INVOICE.count) + '-' + Math.floor(1000 + Math.random() * 9000),
        name: name || 'Selected outfit',
        price: amount, tax,
        mode,
        payerName: 'Alex Morgan',
        payerEmail: 'alex.morgan@example.com'
    };
    // reset to the payment view (in case a previous receipt was shown)
    const body = $('pp-body'), success = $('pp-success');
    if (body) body.style.display = 'block';
    if (success) success.style.display = 'none';
    const payBtn = $('pp-pay');
    if (payBtn) { payBtn.disabled = false; payBtn.textContent = mode === 'later' ? 'Confirm Pay Later Plan' : 'Pay Now'; }

    const thumb = $('pp-thumb');
    if (thumb) {
        const src = img || (selectedCard && selectedCard.img) || '';
        if (src) { thumb.src = src; thumb.style.display = 'block'; }
        else { thumb.removeAttribute('src'); thumb.style.display = 'none'; }
    }
    const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
    set('pp-item-name', paypalOrder.name);
    set('pp-item-mode', mode === 'later'
        ? 'PayPal Pay Later · 4 interest-free payments'
        : 'PayPal · Checkout in 1 payment');
    set('pp-item-price', money(amount));
    set('pp-subtotal', money(amount));
    set('pp-tax', money(tax));
    set('pp-total', money(amount + tax));
    set('pp-payer-name', paypalOrder.payerName);
    set('pp-payer-mail', paypalOrder.payerEmail);
    set('pp-avatar', 'AM');
    ov.classList.add('open');
    return paypalOrder;
}

// "Pay Now" → show the green success receipt
function completePayPalPayment() {
    if (!paypalOrder) return;
    const payBtn = $('pp-pay');
    if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'Processing…'; }
    setTimeout(() => {
        if (!paypalOrder) return;
        const o = paypalOrder;
        PAYPAL_INVOICE.orders.push(o);
        const payBody = $('pp-body'), success = $('pp-success');
        if (payBody) payBody.style.display = 'none';
        if (success) success.style.display = 'block';
        const set = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
        set('pp-success-sub', o.mode === 'later'
            ? 'Your Pay Later plan is approved. First of 4 payments is scheduled.'
            : 'Your order is confirmed and on its way to the atelier.');
        set('pp-receipt-id', o.id);
        set('pp-receipt-amount', money((o.price + o.tax) * (o.mode === 'later' ? 0.25 : 1)));
        set('pp-receipt-item', o.name);
        set('pp-receipt-status', o.mode === 'later' ? 'First payment paid' : 'Completed');
        document.dispatchEvent(new CustomEvent('paypal:paid', { detail: o }));
    }, 900);
}

function closePayPalModal() {
    $('paypal-modal')?.classList.remove('open');
}

// Backwards-compatible checkout helper: resolves when the user closes the window.
// Returns the mock order object (or null if dismissed before paying).
function handlePayPalCheckout(name, price, opts = {}) {
    return new Promise(resolve => {
        const ov = ensurePayPalModal();
        const order = openPayPalModal(name, price, opts);
        const paid = e => { if (e.detail !== order) return; cleanup(); resolve(e.detail); };
        const observer = new MutationObserver(() => {
            if (!ov.classList.contains('open')) { cleanup(); resolve(PAYPAL_INVOICE.orders.includes(paypalOrder) ? paypalOrder : null); }
        });
        function cleanup() {
            document.removeEventListener('paypal:paid', paid);
            observer.disconnect();
        }
        document.addEventListener('paypal:paid', paid);
        observer.observe(ov, { attributes: true, attributeFilter: ['class'] });
    });
}
// Expose for the board / chat buttons that call it from generated markup
window.handlePayPalCheckout = handlePayPalCheckout;

// (paypalBar is declared at the top of the file)
if (paypalBar) {
    paypalBar.addEventListener('click', async e => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const outfit = selectedCard || OUTFITS.find(o => o.gender === ($('gender')?.value || 'male')) || { name: 'FashionBuy Atelier Look', price: 249 };
        const isLater = btn.id === 'btn-paylater';
        const label = isLater ? 'PayPal Pay Later' : 'Pay with PayPal';
        btn.textContent = 'Opening PayPal...';
        btn.disabled = true;
        try {
            await handlePayPalCheckout(outfit.name, outfit.price, { mode: isLater ? 'later' : 'paypal', img: outfit.img });
        } catch (e) {
            console.error('[PayPal] Checkout error:', e);
        } finally {
            btn.disabled = false;
            btn.textContent = label;
        }
    });
}

// Upload box (replaces inline onclick so it stays null-safe)
// (uploadBox / photoInput are declared at the top of the file)
if (uploadBox && photoInput) {
    uploadBox.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', () => {
        if (photoInput.files.length) uploadBox.firstChild.textContent = '📸 PHOTO LOADED — VIRTUAL FITTING READY';
    });
}

// ---------- Private AI Stylist chat: Gemini advice + TinyFish live-store products ----------
const chatLog = $('chat-log');
const chatInput = $('chat-input');
const chatSend = $('chat-send');
let chatBusy = false;

function chatAppend(html, cls = '') {
    if (!chatLog) return null;
    const div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.innerHTML = html;
    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
    return div;
}

// Three in-chat action buttons: 3D board / virtual fitting / PayPal buy
function wireProductButtons(card, product) {
    const show = card.querySelector('.p-3d');
    const fit = card.querySelector('.p-fit');
    const sew = card.querySelector('.p-sew');
    const buy = card.querySelector('.p-buy');
    if (show) show.addEventListener('click', () => {
        // Display the found outfit on the back 3D board as a temporary card
        const outfitLike = {
            id: 'live-' + Date.now(),
            name: product.title || 'Live Store Find',
            price: parseFloat(String(product.price || '0').replace(/[^0-9.]/g, '')) || 0,
            color: 0x7a2bff,
            brand: product.store || 'LIVE STORE',
            gender: $('gender')?.value || 'male',
            season: [$('season')?.value || 'Winter'],
            img: product.image || ''
        };
        OUTFITS.unshift(outfitLike);
        buildBoardCards();
        focusBoard();
        chatAppend('🧠 <b>Board updated:</b> the found outfit is now shown on the 3D board.', 'ai');
    });
    if (fit) fit.addEventListener('click', () => {
        if (product.image) {
            selectedCard = outfitLikeFromProduct(product);
            buildBoardCards(); // keep the found outfit selectable on the board
        }
        fitOutfitOnSelected();
        analyzeFitWithGemini();
        chatAppend('🪞 <b>Virtual Fitting Room:</b> trying it on your avatar — upload a photo for the AI fit critique.', 'ai');
    });
    if (sew) sew.addEventListener('click', () => {
        selectedCard = product.image ? outfitLikeFromProduct(product) : selectedCard;
        sendToSewingPattern(selectedCard);
        chatAppend('✂️ <b>Sewing Pattern:</b> dotted cutting lines projected on the mat & Smart Glasses AR.', 'ai');
    });
    if (buy) buy.addEventListener('click', () => {
        if (product.link) window.open(product.link, '_blank', 'noopener');
        const bar = $('paypal-bar');
        if (bar) bar.classList.add('visible');
    });
}
function outfitLikeFromProduct(p) {
    return {
        id: 'live-fit-' + Date.now(), name: p.title || 'Store find', price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')) || 0,
        color: 0x7a2bff, brand: p.store || 'LIVE STORE', gender: $('gender')?.value || 'male',
        season: [$('season')?.value || 'Winter'], img: p.image || ''
    };
}

async function submitStylistMessage() {
    if (chatBusy || !chatInput || !chatLog) return;
    const msg = chatInput.value.trim();
    if (!msg) return;
    chatBusy = true;
    chatAppend('<b>You:</b> ' + msg.replace(/</g, '&lt;'), 'user');
    chatInput.value = '';
    const loader = chatAppend('<span class="spin"></span> Searching stores & analyzing your style...', 'ai');
    const payload = {
        message: msg,
        height: $('height')?.value || '175',
        weight: $('weight')?.value || '70',
        skin: $('skin')?.value || 'Olive',
        season: $('season')?.value || 'Winter',
        gender: $('gender')?.value || 'male',
        measurements: getMeasurements()
    };
    try {
        const r = await fetch('/api/stylist-search', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const j = await r.json();
        if (loader) loader.remove();
        if (j.error) {
            chatAppend(`<span class="err">⚠ ${j.error}</span><br><small style="color:#9d8fd0">${j.detail || ''}</small>`, 'ai');
        } else {
            if (j.advice) chatAppend(j.advice.replace(/\n/g, '<br>'), 'ai');
            const p = j.product;
            if (p && (p.image || p.title)) {
                const storeLink = p.link ? `<a href="${p.link}" target="_blank" rel="noopener" style="color:#d4af37">${p.store || 'Store'}</a>` : (p.store || '');
                const card = chatAppend(`
                    <div class="product-card">
                        ${p.image ? `<img src="${p.image}" alt="${p.title || 'outfit'}" onerror="this.style.display='none'">` : ''}
                        <div class="p-name">${p.title || 'Found outfit'}</div>
                        <div><span class="p-price">${p.price || ''}</span> <span class="p-store">${storeLink}</span></div>
                        <div class="p-actions">
                            <button class="p-3d">🧊 Show on 3D Board</button>
                            <button class="p-fit">🪞 Go to Virtual Fitting Room</button>
                            <button class="p-sew">✂️ Send to Sewing Pattern</button>
                            <button class="p-buy">🛒 Buy / PayPal</button>
                        </div>
                    </div>`, 'ai');
                wireProductButtons(card, p);
            } else if (!j.advice) {
                chatAppend('No result came back — try phrasing like "I want a white dress from Zara".', 'ai');
            }
        }
    } catch (e) {
        if (loader) loader.remove();
        chatAppend(`<span class="err">⚠ Could not reach /api/stylist-search — is server.cjs running?</span><br><small style="color:#9d8fd0">${e.message}</small>`, 'ai');
    }
    chatBusy = false;
}

if (chatSend) chatSend.addEventListener('click', submitStylistMessage);
if (chatInput) chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); submitStylistMessage(); }
});

// ---------- My Design Sketcher: Pollinations.ai image generation (no API key) ----------
// The typed outfit idea is turned into a fashion-concept prompt and rendered by
// https://pollinations.ai — the picture is streamed straight into the panel.
// (The old /api/design-idea Grok/Gemini route is kept only as an offline fallback.)
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt/';

// Build a couture-studio style prompt from free text + the user's style profile
function buildPollinationsPrompt(idea) {
    const gender = $('gender')?.value === 'female' ? 'female' : 'male';
    const season = $('season')?.value || 'Winter';
    const skin = $('skin')?.value || 'Olive';
    const event = $('event-occasion')?.value || '';
    return `full-length fashion design sketch of ${idea}, ${gender} couture outfit` +
        (event ? `, for ${event}` : '') +
        `, ${season} season, ${skin} skin tone model, elegant haute couture illustration, ` +
        'studio lighting, clean background, high detail, editorial fashion concept art, vertical portrait';
}

function buildPollinationsURL(idea, seed) {
    const prompt = encodeURIComponent(buildPollinationsPrompt(idea));
    return POLLINATIONS_BASE + prompt +
        `?width=768&height=1024&seed=${seed}&nologo=true&enhance=true&model=flux&referrer=fashionbuy-atelier`;
}

// Resolve once the browser has actually decoded the image (or reject on error/timeout)
function preloadImage(src, timeoutMs = 90000) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const timer = setTimeout(() => { img.src = ''; reject(new Error('Pollinations timeout')); }, timeoutMs);
        img.onload = () => { clearTimeout(timer); resolve(img); };
        img.onerror = () => { clearTimeout(timer); reject(new Error('Pollinations image failed')); };
        img.referrerPolicy = 'no-referrer';
        img.src = src;
    });
}

let sketchBusy = false;
let lastDesign = null;   // { concept, questions[], imageMime, imageBase64, imageUrl }

function showSketcherImage(src, idea) {
    const resEl = $('sketcher-result'), actEl = $('sketcher-actions');
    if (!resEl) return;
    resEl.innerHTML =
        `<img src="${src}" alt="AI design: ${esc(idea)}" class="sketcher-img">` +
        `<div class="sketch-caption">🎨 Generated by Pollinations.ai — “${esc(idea)}”</div>`;
    if (actEl) actEl.classList.add('visible');
}

async function submitDesignIdea() {
    const promptEl = $('sketcher-prompt'), resEl = $('sketcher-result'), actEl = $('sketcher-actions');
    if (sketchBusy || !promptEl || !resEl) return;
    const prompt = promptEl.value.trim();
    if (!prompt) { resEl.innerHTML = '<span style="color:#fbbf24">✏️ Describe your dream outfit first…</span>'; return; }
    sketchBusy = true;
    resEl.innerHTML = '<span class="spin"></span> Sketching your design with Pollinations.ai…';
    if (actEl) actEl.classList.remove('visible');

    // 1) Pollinations.ai — keyless, direct image URL
    const seed = Math.floor(Math.random() * 1e6);
    const url = buildPollinationsURL(prompt, seed);
    try {
        await preloadImage(url);
        lastDesign = { concept: prompt, questions: [], imageUrl: url };
        showSketcherImage(url, prompt);
        sketchBusy = false;
        return;
    } catch (pollErr) {
        console.warn('Pollinations.ai unavailable, trying legacy designer route…', pollErr);
    }

    // 2) Fallback: local /api/design-idea (only used when Pollinations is unreachable)
    if (!location.protocol.startsWith('http')) {
        resEl.innerHTML = '<span style="color:#ff8ac2">⚠ Could not reach Pollinations.ai — check your internet connection.</span>';
        sketchBusy = false;
        return;
    }
    const payload = {
        prompt,
        profile: {
            height: $('height')?.value || '175',
            weight: $('weight')?.value || '70',
            skin: $('skin')?.value || 'Olive',
            season: $('season')?.value || 'Winter',
            gender: $('gender')?.value || 'male',
            measurements: getMeasurements()
        }
    };
    try {
        const r = await fetch('/api/design-idea', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const j = await r.json();
        lastDesign = j;
        let html = '';
        if (j.imageBase64) {
            html += `<img src="data:${j.imageMime || 'image/png'};base64,${j.imageBase64}" alt="AI design" onerror="this.style.display='none'">`;
        }
        if (j.concept) html += `<div style="margin-top:6px;line-height:1.5">${j.concept.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>`;
        if (Array.isArray(j.questions) && j.questions.length) {
            html += j.questions.map(q => `<div class="q">💬 ${String(q).replace(/</g, '&lt;')}</div>`).join('');
        }
        if (j.error) html += `<span class="err" style="color:#ff8ac2">⚠ ${j.error}</span><br><small style="color:#9d8fd0">${j.detail || ''}</small>`;
        if (!html) html = 'No design came back — try describing the outfit differently.';
        resEl.innerHTML = html;
        if ((j.concept || j.imageBase64) && actEl) actEl.classList.add('visible');
    } catch (e) {
        resEl.innerHTML = `<span style="color:#ff8ac2">⚠ Design sketch failed — Pollinations.ai unreachable.</span><br><small style="color:#9d8fd0">${esc(e.message)}</small>`;
    }
    sketchBusy = false;
}

$('sketcher-generate')?.addEventListener('click', submitDesignIdea);
$('sketcher-prompt')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitDesignIdea(); }
});

// Three design actions: sewing mat / photo try-on / 3D mannequin
function designOutfitLike() {
    return {
        id: 'design-' + Date.now(),
        name: 'AI Design — ' + ($('sketcher-prompt')?.value || '').slice(0, 24),
        price: 0, color: 0xa855f7, brand: 'MY DESIGN',
        gender: $('gender')?.value || 'male',
        season: [$('season')?.value || 'Winter'],
        img: lastDesign?.imageUrl
            || (lastDesign?.imageBase64 ? 'data:' + (lastDesign.imageMime || 'image/png') + ';base64,' + lastDesign.imageBase64 : '')
    };
}
$('sk-btn-photo')?.addEventListener('click', () => {
    const o = designOutfitLike();
    selectedCard = o;
    fitOutfitOnSelected();
    analyzeFitWithGemini();
});
$('sk-btn-mannequin')?.addEventListener('click', () => {
    const o = designOutfitLike();
    selectedCard = o;
    fitOutfitOnSelected();
    focusBoard();
});

// ============================================================
// FOCUS & EXPAND MODE + VOICE CONTROL (MICROPHONE)
// ============================================================
// "Focus on cutting board" / "Expand pattern" → every surrounding panel fades
// out and the transparent dotted sewing pattern is maximized over the studio.
// "Show all" / "Restore screen" → panels slide back in. Nothing is ever removed
// from the DOM: only opacity/visibility/transform change, so the WebGL renderer,
// the CSS3D layers and the camera keep their context (no context loss, no re-init).

const FOCUS_TARGETS = {
    cutting: null,          // cutting board / dotted pattern → full focus mode
    pattern: null,          // alias for the same
    profile: 'left-panel',
    stylist: 'right-panel',
    sketcher: 'sketcher-panel'
};

// Camera pose saved when entering cutting-board focus, restored on exit
const focusCam = {
    saved: null,
    matPos: new THREE.Vector3(0, 1.95, MAT_Z - 2.05),
    matTarget: new THREE.Vector3(0, 0.74, MAT_Z)
};

function focusIsActive() {
    return document.body.classList.contains('focus-mode') ||
           document.body.classList.contains('module-focus');
}

function renderFocusPattern() {
    const holder = $('focus-pattern-holder');
    if (!holder) return;
    holder.innerHTML = latestPatternSvg || generatePatternSVG(measurements5());
}

function announceFocus(msg) {
    const hint = $('voice-hint');
    if (!hint) return;
    hint.textContent = msg;
    hint.classList.add('show');
    clearTimeout(announceFocus._t);
    announceFocus._t = setTimeout(() => hint.classList.remove('show'), 2600);
}

function enterCuttingFocus() {
    document.body.classList.remove('module-focus');
    document.querySelectorAll('.focus-panel-active').forEach(el => el.classList.remove('focus-panel-active'));
    renderFocusPattern();
    document.body.classList.add('focus-mode');
    $('focus-stage')?.classList.add('active');
    const btn = $('focus-toggle');
    if (btn) { btn.setAttribute('aria-pressed', 'true'); btn.textContent = '[⤢]'; btn.title = 'Restore all panels (Show all)'; }
    // Frame the cutting mat — the dotted pattern fills the view
    if (!arActive) {
        if (!focusCam.saved) focusCam.saved = { pos: camera.position.clone(), target: controls.target.clone() };
        glideCamera(focusCam.matPos, focusCam.matTarget, 1.0);
    }
    announceFocus('🔍 Cutting board expanded — say “show all” to restore');
}

function exitFocus() {
    const wasCutting = document.body.classList.contains('focus-mode');
    document.body.classList.remove('focus-mode', 'module-focus');
    document.querySelectorAll('.focus-panel-active').forEach(el => el.classList.remove('focus-panel-active'));
    $('focus-stage')?.classList.remove('active');
    const btn = $('focus-toggle');
    if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '[⛶]'; btn.title = 'Focus / Expand (hide all panels & maximize the pattern)'; }
    if (wasCutting && focusCam.saved && !arActive) {
        glideCamera(focusCam.saved.pos, focusCam.saved.target, 1.0);
        focusCam.saved = null;
    }
    announceFocus('🗂 All panels restored');
}

function focusModule(panelId) {
    document.body.classList.remove('focus-mode');
    $('focus-stage')?.classList.remove('active');
    const btn = $('focus-toggle');
    if (btn) { btn.setAttribute('aria-pressed', 'false'); btn.textContent = '[⛶]'; }
    document.querySelectorAll('.focus-panel-active').forEach(el => el.classList.remove('focus-panel-active'));
    document.body.classList.add('module-focus');
    $(panelId)?.classList.add('focus-panel-active');
    $(panelId)?.scrollTo?.({ top: 0, behavior: 'smooth' });
    announceFocus('🔍 Focused: ' + panelId.replace('-panel', '') + ' — say “show all” to restore');
}

// Single entry point used by the ⛶ buttons and by voice commands
function toggleFocusMode(target) {
    const panelId = FOCUS_TARGETS[target];
    if (panelId) {
        const el = $(panelId);
        if (el && el.classList.contains('focus-panel-active')) exitFocus();
        else focusModule(panelId);
        return;
    }
    // cutting board / pattern
    if (document.body.classList.contains('focus-mode')) exitFocus();
    else enterCuttingFocus();
}

// [⛶] floating toggle (right side) + the labelled cutting-board button
$('focus-toggle')?.addEventListener('click', () => toggleFocusMode('cutting'));
document.querySelectorAll('[data-focus-target]').forEach(el =>
    el.addEventListener('click', e => {
        e.stopPropagation();
        toggleFocusMode(el.dataset.focusTarget);
    }));

// Esc always restores every panel
window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && focusIsActive() && !isTypingInField()) exitFocus();
});

// Keep the maximized pattern in sync whenever a new dormant is drafted
const _draftForFocus = draftActivePattern;
draftActivePattern = async function (opts) {
    const svg = await _draftForFocus(opts);
    if (document.body.classList.contains('focus-mode')) renderFocusPattern();
    return svg;
};

// ---------- Web Speech API voice control ----------
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
let voiceRec = null;
let voiceOn = false;

function voiceSay(msg) {
    announceFocus(msg);
    console.log('[Voice]', msg);
}

// Map a spoken phrase to an action. Returns true when something was handled.
function handleVoiceCommand(text) {
    const t = ' ' + text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    const has = (...words) => words.some(w => t.includes(' ' + w + ' '));

    if (has('show all', 'show all panels', 'restore screen', 'restore', 'exit focus', 'close focus', 'reset screen')) {
        exitFocus(); return true;
    }
    if (/\b(focus|expand|zoom)\b[^.]*\b(cutting board|cutting|board|pattern|sewing)\b/.test(t)) {
        enterCuttingFocus(); return true;
    }
    if (has('cutting board', 'focus on cutting board')) { enterCuttingFocus(); return true; }
    if (has('expand pattern', 'expand the pattern', 'focus pattern', 'maximize pattern', 'expand design')) {
        enterCuttingFocus(); return true;
    }
    if (has('focus profile', 'expand profile', 'open profile')) { focusModule('left-panel'); return true; }
    if (has('focus stylist', 'expand stylist', 'focus ai stylist')) { focusModule('right-panel'); return true; }
    if (has('focus sketcher', 'expand sketcher', 'focus design sketcher', 'open sketcher')) { focusModule('sketcher-panel'); return true; }
    if (has('toggle focus', 'focus mode')) { toggleFocusMode('cutting'); return true; }
    if (has('create design', 'new design', 'sketch design')) { $('sketcher-generate')?.click(); return true; }
    if (has('sewing pattern', 'send to sewing', 'send to mat')) { sendToSewingPattern(designOutfitLike()); return true; }
    if (has('open ar', 'open camera', 'smart glasses')) { openSmartGlassesAR(); return true; }
    if (has('close ar', 'exit ar', 'stop camera')) { closeSmartGlassesAR(); return true; }
    return false;
}

function startVoiceControl() {
    if (!SpeechRec) { voiceSay('⚠ Voice control needs Chrome, Edge or Safari'); return; }
    if (voiceOn && voiceRec) return;
    voiceRec = new SpeechRec();
    voiceRec.lang = 'en-US';
    voiceRec.continuous = true;
    voiceRec.interimResults = false;

    voiceRec.onresult = ev => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
            if (!ev.results[i].isFinal) continue;
            const said = ev.results[i][0].transcript.trim();
            if (!said) continue;
            const handled = handleVoiceCommand(said);
            voiceSay((handled ? '🎙 “' : '🎙 Heard “') + said + (handled ? '”' : '” — try “focus on cutting board” / “show all”'));
        }
    };
    voiceRec.onerror = ev => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
            voiceSay('⚠ Microphone permission denied');
            stopVoiceControl();
        } else if (ev.error === 'no-speech') {
            /* keep listening silently */
        }
    };
    // Chrome stops after silence — restart automatically while the mode is on
    voiceRec.onend = () => {
        if (voiceOn) { try { voiceRec.start(); } catch {} }
    };

    try {
        voiceRec.start();
        voiceOn = true;
        $('voice-toggle')?.classList.add('listening');
        $('voice-toggle')?.setAttribute('aria-pressed', 'true');
        if ($('voice-toggle')) $('voice-toggle').textContent = '🎙 Listening';
        voiceSay('🎙 Voice on — “focus on cutting board”, “expand pattern”, “show all”');
    } catch (err) {
        voiceSay('⚠ Could not start the microphone');
    }
}

function stopVoiceControl() {
    voiceOn = false;
    if (voiceRec) { try { voiceRec.onend = null; voiceRec.stop(); } catch {} }
    $('voice-toggle')?.classList.remove('listening');
    $('voice-toggle')?.setAttribute('aria-pressed', 'false');
    if ($('voice-toggle')) $('voice-toggle').textContent = '🎙 Voice';
    voiceSay('🎙 Voice off');
}

$('voice-toggle')?.addEventListener('click', () => {
    voiceOn ? stopVoiceControl() : startVoiceControl();
});

// Bottom-left keyboard help pill: fades away on the user's first interaction
(function hudHelpFade() {
    const hud = $('hud-help');
    if (!hud) return;
    let faded = false;
    const fade = () => { if (!faded) { faded = true; hud.classList.add('faded'); } };
    window.addEventListener('keydown', fade, { once: true });
    window.addEventListener('pointerdown', fade, { once: true });
    setTimeout(fade, 12000); // also auto-fade after 12s of inactivity
})();

// ۷. حرکت در اتاق با WASD — fully disabled while typing in any text field
function isTypingInField() {
    const el = document.activeElement;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
const keys = {};
window.addEventListener('keydown', e => {
    if (isTypingInField()) { keys[e.code] = false; return; }  // caret focus lock: no camera walking
    keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
// Also swallow already-held keys the moment an input gains focus
window.addEventListener('focusin', () => { Object.keys(keys).forEach(k => keys[k] = false); });

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css3dRenderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
    requestAnimationFrame(animate);
    const speed = 0.06;
    // Pause WASD while gliding OR while the user is typing in any input/textarea
    if (!camAnim.active && !isTypingInField()) {
        if (keys['KeyW'] || keys['ArrowUp']) camera.position.z -= speed;
        if (keys['KeyS'] || keys['ArrowDown']) camera.position.z += speed;
        if (keys['KeyA'] || keys['ArrowLeft']) camera.position.x -= speed;
        if (keys['KeyD'] || keys['ArrowRight']) camera.position.x += speed;
    } else {
        // Smooth eased glide between two poses
        camAnim.t = Math.min(camAnim.t + 0.016 / camAnim.dur, 1);
        const k = camAnim.t < 0.5
            ? 2 * camAnim.t * camAnim.t
            : 1 - Math.pow(-2 * camAnim.t + 2, 2) / 2;
        camera.position.lerpVectors(camAnim.from, camAnim.to, k);
        controls.target.lerpVectors(camAnim.tgFrom, camAnim.tgTo, k);
        if (camAnim.t >= 1) camAnim.active = false;
    }

    controls.update();
    renderer.render(scene, camera);
    css3dRenderer.render(scene, camera);  // crisp HTML/CSS cards over the WebGL scene
}
animate();

// ===== Garment-type parametric pieces (hoisted; called by pPatternPieces) =====
// Every piece is centered at x = 0, y grows down. span = full width, len = full
// height so placeAcross() scales it into its own 230×500 cell. Dimensions use
// the 5 user measurements via pfFit().K (cm → SVG units).

// ---- Trousers / pants / cargo / palazzo / jean ----
function pfTrouserFrontLeg(m, K) {
    const hip = m.hips / 4 * K;
    const L = Math.max(m.hips * 1.15, m.sleeve) * K * 1.1;
    const rise = L * 0.42, crotch = m.hips / 8 * K;
    const knee = hip * 0.95, hem = hip * 0.72;
    return { span: hip * 2, len: L, paths: [`M ${-hip} 0 L ${hip} 0 L ${hip} ${rise} Q ${hip * 0.8} ${rise + crotch}, ${hip * 0.42} ${rise + crotch} L ${knee} ${L * 0.72} L ${hem} ${L} L ${-hem} ${L} L ${-knee} ${L * 0.72} L ${-hip * 0.42} ${rise + crotch} Q ${-hip * 0.8} ${rise + crotch}, ${-hip} ${rise} Z`] };
}
function pfTrouserBackLeg(m, K) {
    const hip = m.hips / 4 * K;
    const L = Math.max(m.hips * 1.15, m.sleeve) * K * 1.1;
    const rise = L * 0.42, crotch = m.hips / 8 * K * 1.45;
    const knee = hip * 0.95, hem = hip * 0.72;
    return { span: hip * 2, len: L, paths: [`M ${-hip} 0 L ${hip} 0 L ${hip} ${rise} Q ${hip * 0.8} ${rise + crotch}, ${hip * 0.42} ${rise + crotch} L ${knee} ${L * 0.72} L ${hem} ${L} L ${-hem} ${L} L ${-knee} ${L * 0.72} L ${-hip * 0.42} ${rise + crotch} Q ${-hip * 0.8} ${rise + crotch}, ${-hip} ${rise} Z`] };
}
function pfTrouserWaistband(m, K) {
    const span = m.waist * 0.6 * K, h = m.waist / 6 * K;
    return { span, len: h, paths: [`M ${-span / 2} 0 L ${span / 2} 0 L ${span / 2} ${h} L ${-span / 2} ${h} Z`] };
}
function pfTrouserPocket(m, K) {
    const span = m.waist / 5 * K, h = m.hips / 7 * K;
    return { span, len: h, paths: [`M ${-span / 2} ${h * 0.2} L ${span / 2} ${h * 0.2} L ${span / 2 * 0.8} ${h} L ${-span / 2 * 0.8} ${h} Z`] };
}

// ---- Strapless dress / corset / bustier ----
function pfStraplessBustFront(m, K) {
    const bw = m.chest / 2 * K, L = m.chest * 0.95 * K;
    const dip = 6 * K, side = bw * 0.92;
    return { span: bw * 2, len: L, paths: [
        `M ${-side} ${dip * 0.5} Q ${-side * 0.4} ${dip} 0 ${dip + 5 * K} Q ${side * 0.4} ${dip} ${side} ${dip * 0.5} L ${side} ${L * 0.3} Q ${side * 1.05} ${L * 0.55} ${side * 0.88} ${L} L ${-side * 0.88} ${L} Q ${-side * 1.05} ${L * 0.55} ${-side} ${dip * 0.5} Z`,
        `M ${-bw * 0.22} ${L * 0.62} L 0 ${L * 0.22} L ${bw * 0.22} ${L * 0.62}`
    ] };
}
function pfStraplessBustBack(m, K) {
    const bw = m.chest / 2 * K * 1.02, L = m.chest * 0.95 * K;
    return { span: bw * 2, len: L, paths: [`M ${-bw} ${2 * K} L ${bw} ${2 * K} L ${bw * 0.92} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.88} ${L} L ${-bw * 0.88} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.92} ${L * 0.3} Z`] };
}
function pfStraplessSkirt(m, K, flareMul) {
    const w = m.waist / 2 * K, hip = m.hips / 2 * K, L = Math.max(m.hips, m.waist) * 1.2 * K;
    const flare = hip * flareMul;
    return { span: flare * 2, len: L, paths: [`M ${-w} 0 L ${w} 0 Q ${hip} ${L * 0.22}, ${flare} ${L} L ${-flare} ${L} Q ${-hip} ${L * 0.22}, ${-w} 0 Z`] };
}


// ---- Skirts / pencil / circle / pleated ----
function pfSkirtWaistband(m, K) {
    const span = m.waist * 0.55 * K, h = m.waist / 7 * K;
    return { span, len: h, paths: [`M ${-span / 2} ${h * 0.15} Q 0 ${h * 0.4} ${span / 2} ${h * 0.15} L ${span / 2} ${h} L ${-span / 2} ${h} Q ${-span / 2 * 0.9} ${h * 0.4}, ${-span / 2} ${h * 0.15} Z`] };
}
function pfSkirtPanel(m, K, kind) {
    const w = m.waist / 2 * K, hip = m.hips / 2 * K, L = Math.max(m.hips, m.waist) * 1.2 * K;
    const flare = kind === 'pencil' ? hip * 0.85 : kind === 'circle' ? hip * 1.7 : hip * 1.3;
    return { span: flare * 2, len: L, paths: [`M ${-w} 0 L ${w} 0 Q ${hip} ${L * 0.22}, ${flare} ${L} L ${-flare} ${L} Q ${-hip} ${L * 0.22}, ${-w} 0 Z`] };
}
function pfSkirtHemFacing(m, K) {
    const span = m.hips / 2 * K * 1.1, h = m.waist / 12 * K;
    return { span, len: h, paths: [`M ${-span / 2} 0 L ${span / 2} 0 L ${span / 2} ${h} L ${-span / 2} ${h} Z`] };
}

// ---- T-Shirt / tank / top / blouse ----
function pfTeeFront(m, K) {
    const bw = m.chest / 2 * K, L = m.hips * 0.62 * K;
    const neckW = m.shoulder / 2 * K * 0.85, neckDrop = 5 * K;
    return { span: bw * 2, len: L, paths: [`M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.9} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.85} ${L} L ${-bw * 0.85} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.9} ${L * 0.3} Z`] };
}
function pfTeeBack(m, K) {
    const bw = m.chest / 2 * K * 1.03, L = m.hips * 0.62 * K;
    const neckW = m.shoulder / 2 * K * 0.75, neckDrop = 2.5 * K;
    return { span: bw * 2, len: L, paths: [`M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.92} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.88} ${L} L ${-bw * 0.88} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.92} ${L * 0.3} Z`] };
}
function pfTeeSleeve(m, K) {
    const top = m.chest / 6 * K, L = m.sleeve * K * 0.62, cap = top * 0.45, hem = top * 0.78;
    return { span: top * 2, len: L + cap, paths: [`M ${-top} ${cap} Q 0 ${-cap * 0.2} ${top} ${cap} L ${hem} ${L + cap * 0.5} L ${-hem} ${L + cap * 0.5} Z`] };
}
function pfTeeNeckBinding(m, K) {
    const span = m.shoulder * K * 0.9, h = m.chest / 24 * K;
    return { span, len: h, paths: [`M ${-span / 2} 0 L ${span / 2} 0 L ${span / 2} ${h} L ${-span / 2} ${h} Z`] };
}

// ---- Hoodie / sweatshirt ----
function pfHoodieFront(m, K) {
    const bw = m.chest / 2 * K * 1.1, L = m.hips * 0.68 * K;
    const neckW = m.shoulder / 2 * K * 0.8, neckDrop = 4 * K;
    const pockW = m.chest / 5 * K, pockH = m.chest / 7 * K, pockY = L * 0.55;
    return { span: bw * 2, len: L, paths: [
        `M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.9} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.85} ${L} L ${-bw * 0.85} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.9} ${L * 0.3} Z`,
        `M ${-pockW / 2} ${pockY} L ${pockW / 2} ${pockY} L ${pockW / 2} ${pockY + pockH} L ${-pockW / 2} ${pockY + pockH} Z`
    ] };
}
function pfHoodieBack(m, K) {
    const bw = m.chest / 2 * K * 1.12, L = m.hips * 0.68 * K;
    const neckW = m.shoulder / 2 * K * 0.7, neckDrop = 2.5 * K;
    return { span: bw * 2, len: L, paths: [`M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.92} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.88} ${L} L ${-bw * 0.88} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.92} ${L * 0.3} Z`] };
}
function pfHoodieSleeve(m, K) {
    const top = m.chest / 5.5 * K, L = m.sleeve * K * 0.9, cap = top * 0.55, hem = top * 0.6;
    return { span: top * 2, len: L + cap, paths: [`M ${-top} ${cap} Q ${-top * 0.5} ${-cap * 0.3} 0 ${-cap * 0.15} Q ${top * 0.5} ${-cap * 0.3} ${top} ${cap} L ${hem} ${L + cap * 0.55} L ${-hem} ${L + cap * 0.55} Z`] };
}
function pfHoodieHood(m, K) {
    const clen = m.shoulder * K * 1.05, chei = m.shoulder * K * 0.5;
    const cdrop = m.shoulder * K * 0.75;
    return { span: clen * 1.05, len: chei + cdrop + 10, paths: [
        `M ${-clen / 2} 0 L ${clen / 2} 0 L ${clen / 2 - 3} ${chei} Q 0 ${chei + cdrop} ${-clen / 2 + 3} ${chei} Z`,
        `M ${-clen / 2 + 6} ${chei + 6} Q 0 ${chei + cdrop - 4} ${clen / 2 - 6} ${chei + 6}`
    ] };
}

// ---- Bomber / jacket / blazer / coat / trench / vest ----
function pfJacketFront(m, K) {
    const bw = m.chest / 2 * K * 1.15, L = m.hips * 0.66 * K;
    const lapW = m.shoulder / 2 * K * 0.55;
    return { span: bw * 2, len: L, paths: [
        `M ${-bw} ${2 * K} L ${-bw + lapW} ${2 * K} L ${-bw + lapW * 0.5} ${L * 0.5} L ${-bw} ${L} L ${bw * 0.85} ${L} Q ${bw} ${L * 0.55} ${bw * 0.9} ${L * 0.3} L ${bw} ${2 * K} L ${bw - lapW} ${2 * K} L ${bw - lapW * 0.5} ${L * 0.5} Z`,
        `M ${-bw + lapW} ${2 * K} L ${-bw + lapW * 0.6} ${L * 0.5} L ${-bw + lapW} ${L}`
    ] };
}
function pfJacketBack(m, K) {
    const bw = m.chest / 2 * K * 1.18, L = m.hips * 0.66 * K;
    return { span: bw * 2, len: L, paths: [`M ${-bw} ${2.5 * K} L ${bw} ${2.5 * K} L ${bw * 0.9} ${L * 0.3} Q ${bw} ${L * 0.55} ${bw * 0.85} ${L} L ${-bw * 0.85} ${L} Q ${-bw} ${L * 0.55} ${-bw * 0.9} ${L * 0.3} Z`] };
}
function pfJacketSleeve(m, K) {
    const top = m.chest / 5 * K, L = m.sleeve * K * 0.92, cap = top * 0.6, hem = top * 0.55;
    return { span: top * 2, len: L + cap, paths: [`M ${-top} ${cap} Q ${-top * 0.5} ${-cap * 0.35} 0 ${-cap * 0.2} Q ${top * 0.5} ${-cap * 0.35} ${top} ${cap} L ${hem} ${L + cap * 0.55} L ${-hem} ${L + cap * 0.55} Z`] };
}
function pfJacketTrim(m, K) {
    const collW = m.shoulder * K * 0.9, collH = m.chest / 20 * K;
    const cuffW = m.sleeve / 4 * K * 0.9, cuffH = m.chest / 22 * K;
    const waistW = m.waist / 3 * K, waistH = m.waist / 20 * K;
    const gap = 12;
    return { span: Math.max(collW, waistW) + 20, len: collH + gap + cuffH + gap + waistH + 16, paths: [
        `M ${-collW / 2} 0 L ${collW / 2} 0 L ${collW / 2} ${collH} L ${-collW / 2} ${collH} Z`,
        `M ${-cuffW / 2} ${collH + gap} L ${cuffW / 2} ${collH + gap} L ${cuffW / 2} ${collH + gap + cuffH} L ${-cuffW / 2} ${collH + gap + cuffH} Z`,
        `M ${-waistW / 2} ${collH + gap + cuffH + gap} L ${waistW / 2} ${collH + gap + cuffH + gap} L ${waistW / 2} ${collH + gap + cuffH + gap + waistH} L ${-waistW / 2} ${collH + gap + cuffH + gap + waistH} Z`
    ] };
}

// ---- One-Piece Dress / Jumpsuit / Gown ----
function pfDressFront(m, K) {
    const bw = m.chest / 2 * K, L = m.hips * 1.35 * K;
    const neckW = m.shoulder / 2 * K * 0.8, neckDrop = 6 * K;
    const hipF = m.hips / 2 * K;
    return { span: Math.max(bw, hipF) * 2, len: L, paths: [`M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.92} ${L * 0.35} Q ${bw} ${L * 0.6} ${hipF} ${L} L ${-hipF} ${L} Q ${-bw} ${L * 0.6} ${-bw * 0.92} ${L * 0.35} Z`] };
}
function pfDressBack(m, K) {
    const bw = m.chest / 2 * K * 1.04, L = m.hips * 1.35 * K;
    const neckW = m.shoulder / 2 * K * 0.7, neckDrop = 3 * K;
    const hipF = m.hips / 2 * K;
    return { span: Math.max(bw, hipF) * 2, len: L, paths: [`M ${-bw} ${neckDrop} L ${-neckW} 0 Q 0 ${neckDrop} ${neckW} 0 L ${bw} ${neckDrop} L ${bw * 0.94} ${L * 0.35} Q ${bw} ${L * 0.6} ${hipF} ${L} L ${-hipF} ${L} Q ${-bw} ${L * 0.6} ${-bw * 0.94} ${L * 0.35} Z`] };
}
function pfDressSash(m, K) {
    const span = m.waist * 0.5 * K, h = m.waist / 10 * K;
    return { span, len: h, paths: [`M ${-span / 2} 0 L ${span / 2} 0 L ${span / 2} ${h} L ${-span / 2} ${h} Z`] };
}
function pfDressLining(m, K) {
    const span = m.chest / 4 * K, h = m.chest / 8 * K;
    return { span, len: h, paths: [`M ${-span / 2} 0 L ${span / 2} 0 L ${span / 2} ${h} L ${-span / 2} ${h} Z`] };
}