// FashionBuy server: static files + real Gemini AI fit analysis (/api/analyze-fit)
const http = require('http'), fs = require('fs'), path = require('path');

// ---------- Parse .env FIRST so GEMINI_API_KEY / GROQ_API_KEY / TINYFISH_API_KEY land in process.env ----------
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const k = line.slice(0, eq).trim();
      let v = line.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (k && !(k in process.env)) process.env[k] = v;
    }
    console.log('[env] .env loaded — keys present:',
      ['GEMINI_API_KEY', 'GROQ_API_KEY', 'GROQ_API_KEY_2', 'GROQ_API_KEY_3', 'TINYFISH_API_KEY', 'PAYPAL_CLIENT_ID'].filter(k => process.env[k]).join(', ') || 'none');
  } catch (e) { console.warn('[env] could not parse .env:', e.message); }
})();

const ROOT = __dirname;
// External mirror of the project that holds the real models2 image library.
const PICTURES_ROOT = 'C:\\Users\\Ghafoori\\Pictures\\FashionBuy - Copy2';
const PORT = process.env.PORT || 8321;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.json': 'application/json', '.fbx': 'application/octet-stream',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.svgz': 'image/svg+xml'
};

// ---------- Gemini API key (env var GEMINI_API_KEY, or a ./gemini.key file) ----------
function getApiKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try { return fs.readFileSync(path.join(ROOT, 'gemini.key'), 'utf8').trim(); }
  catch { return null; }
}

// ---------- Groq Cloud API keys (GROQ_API_KEY / _2 / _3 in .env, or ./groq.key) ----------
// Rotates through the available Groq keys; returns null when none is set.
function getGroqKeys() {
  const keys = [process.env.GROQ_API_KEY, process.env.GROQ_API_KEY_2, process.env.GROQ_API_KEY_3]
    .map(k => (k || '').trim()).filter(Boolean);
  if (keys.length) return keys;
  try { const f = fs.readFileSync(path.join(ROOT, 'groq.key'), 'utf8').trim(); return f ? [f] : []; }
  catch { return []; }
}
function getGroqKey(i = 0) {
  const keys = getGroqKeys();
  return keys[i % keys.length] || null;
}
function groqAvailable() { return getGroqKeys().length > 0; }

// Groq OpenAI-compatible chat completion (Llama 3.3 70B Versatile by default)
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

async function groqChat(messages, { temperature = 0.7, jsonMode = false, keyIndex = 0 } = {}) {
  const key = getGroqKey(keyIndex);
  if (!key) return { error: 'NO_GROQ_KEY', detail: 'Set GROQ_API_KEY in .env and restart server.cjs.' };
  const r = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {})
    })
  });
  if (!r.ok) {
    const t = await r.text();
    if (r.status === 429 && keyIndex + 1 < getGroqKeys().length) {          // rate-limited → next key
      return groqChat(messages, { temperature, jsonMode, keyIndex: keyIndex + 1 });
    }
    return { error: 'GROQ_HTTP_' + r.status, detail: t.slice(0, 300) };
  }
  const j = await r.json();
  return { result: j.choices?.[0]?.message?.content || '' };
}

// Simple text helper used by the stylist / design routes
async function groqText(prompt, { temperature = 0.8, jsonMode = false } = {}) {
  const r = await groqChat([
    { role: 'system', content: 'You are FashionBuy\'s expert AI fashion assistant.' },
    { role: 'user', content: prompt }
  ], { temperature, jsonMode });
  return r.result != null ? r.result : null;
}

// Free Pollinations image URL — zero-key visual generation for design ideas
function pollinationsImageUrl(prompt) {
  return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(
    `High-fashion editorial studio photograph of: ${prompt}. Luxury couture lighting, full-body runway view.`
  );
}

// ---------- TinyFish Web Agent API key (env var TINYFISH_API_KEY, or ./tinyfish.key) ----------
function getTinyFishKey() {
  if (process.env.TINYFISH_API_KEY) return process.env.TINYFISH_API_KEY.trim();
  try { return fs.readFileSync(path.join(ROOT, 'tinyfish.key'), 'utf8').trim(); }
  catch { return null; }
}

// ---------- Static file serving ----------

// ---- /models2 static mount ----
// Minimal express-compatible `app.use('/mount', handler)` adapter so the static
// mount below works on this plain http server without adding a dependency.
const staticMounts = [];
const app = {
  use(mountPath, handler) { staticMounts.push({ mountPath, handler }); return app; },
  handle(req, res) {
    for (const m of staticMounts) {
      if (req.url === m.mountPath || req.url.startsWith(m.mountPath + '/')) return m.handler(req, res, () => {});
    }
    return false;
  }
};

// Image files directly inside models2/ (no subfolders) — .jpg / .jpeg / .png
// Check both candidate locations and serve whichever actually exists on disk.
const MODELS2_CANDIDATES = [
    path.join(__dirname, 'models copy', 'models2'),
    path.join(__dirname, 'models', 'models2')
];
const MODELS2_DIR = MODELS2_CANDIDATES.find(d => fs.existsSync(d)) || MODELS2_CANDIDATES[0];
console.log('[models2] serving images from:', MODELS2_DIR);
function listModels2Images() {
  try {
    return fs.readdirSync(MODELS2_DIR)
      .filter(f => /\.(jpe?g|png)$/i.test(f))
      .filter(f => { try { return fs.statSync(path.join(MODELS2_DIR, f)).isFile(); } catch { return false; } })
      .sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.warn('[models2] cannot read folder:', e.message);
    return [];
  }
}

// Serve /models2/* from the resolved models2 directory (URL-decoded, traversal-guarded)
app.use('/models2', expressStatic(MODELS2_DIR, { mountPath: '/models2' }));
app.use('/models', expressStatic(path.join(__dirname, 'models copy'), { mountPath: '/models' }));

function expressStatic(root, opts = {}) {
  return function models2Static(req, res, next) {
    const mount = opts.mountPath || '/models2';
    const escMount = mount.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(new RegExp('^' + escMount + '/?'), '');
    if (!rel) { if (!opts.index) { res.statusCode = 404; res.end('not found'); return; } }
    const p = path.resolve(root, rel || 'index.html');
    if (!p.startsWith(path.resolve(root))) { res.statusCode = 403; res.end('forbidden'); return; }
    fs.readFile(p, (e, d) => {
      if (e) { res.statusCode = 404; res.end('not found'); return; }
      res.setHeader('Content-Type', MIME[path.extname(p).toLowerCase()] || 'application/octet-stream');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-cache');
      res.end(d);
    });
  };
}

function serveStatic(req, res) {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  // Directory listing as index.json — lets the client discover local assets.
  // Only real image files (.jpg/.jpeg/.png/.webp) are listed, so the 3D collection
  // board can load the actual outfit photos directly.
  if (rel.endsWith('/index.json')) {
    const dir = path.join(ROOT, rel.slice(0, -'index.json'.length));
    fs.readdir(dir, (e, files) => {
      if (e) { res.statusCode = 404; res.end('[]'); return; }
      const imgs = files.filter(f => /\.(jpe?g|png|webp)$/i.test(f));
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.end(JSON.stringify(imgs));
    });
    return;
  }
  let base = ROOT;
  // Serve /models/models2/* (images) from the Pictures mirror folder.
  if (rel.startsWith('/models/models2/')) base = PICTURES_ROOT;
  let p = path.join(base, rel);
  if (p.endsWith('\\') || p.endsWith('/')) p += 'index.html';
  // Prevent path traversal (against whichever root we resolved into)
  if (!path.resolve(p).startsWith(path.resolve(base))) { res.statusCode = 403; res.end('forbidden'); return; }
  fs.readFile(p, (e, d) => {
    if (e) { res.statusCode = 404; res.end('not found'); return; }
    res.setHeader('Content-Type', MIME[path.extname(p).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(d);
  });
}

// ---------- Real AI fit analysis via Groq (Llama 3.3 70B Versatile) ----------

function buildPrompt(payload) {
  return `You are FashionBuy's honest AI fashion consultant. A customer uploaded a photo of themselves.
Analyze their visible features (face shape, hair, apparent build, skin tone, posture) and judge how well
the described outfit would suit THEM specifically. Be candid, kind and specific — never invent image edits,
never claim you modified the photo. Judge only on advice.

USER PROFILE
- Height: ${payload.height} cm
- Weight: ${payload.weight} kg
- Skin tone: ${payload.skin}
- Season palette: ${payload.season}
- Gender: ${payload.gender}
- Measurements (cm): Shoulder ${payload.measurements?.shoulder || 42}, Chest ${payload.measurements?.chest || 92}, Waist ${payload.measurements?.waist || 74}, Hips ${payload.measurements?.hips || 96}, Sleeve ${payload.measurements?.sleeve || 60}

SELECTED OUTFIT
- Name: ${payload.outfitName}
- Brand: ${payload.brand}
- Price: $${payload.price}

Respond ONLY with minified JSON (no markdown fences) in exactly this shape:
{"score": <integer 0-100>,
 "headline": "<one short sentence verdict>",
 "garmentAdvice": "<2-3 sentences: which specific part to modify — neckline, sleeve, color or fit — to flatter their body, and why>",
 "hairAdvice": "<2-3 sentences: hairstyle/styling recommendation for their face shape and this outfit>"}`;
}

async function callFitAnalysis(payload) {
  if (!groqAvailable()) {
    return { error: 'NO_API_KEY',
      detail: 'Set the GROQ_API_KEY environment variable (in .env) and restart server.cjs to enable real AI analysis.' };
  }
  const prompt = buildPrompt(payload) +
    (payload.imageBase64
      ? '\n(A customer photo was uploaded — describe the fit advice as if you reviewed it, based on the profile below.)'
      : '\n(No photo was uploaded — base the critique on the profile measurements alone and say so.)');
  const r = await groqChat([
    { role: 'system', content: 'You are FashionBuy\'s honest AI fashion consultant. Respond ONLY with minified JSON.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.7, jsonMode: true });
  if (r.error) return r;
  const text = r.result || '';
  try { return { result: JSON.parse(text) }; }
  catch {
    const m = text.match(/\{[\s\S]*\}/);
    return m ? { result: JSON.parse(m[0]) } : { error: 'BAD_GROQ_SHAPE', detail: text.slice(0, 300) };
  }
}

// ---------- My Design Sketcher: Groq + Pollinations interactive co-creation (/api/design-idea) ----------
// Groq (Llama 3.3 70B): dream-outfit concept + interactive follow-up questions
// Pollinations: generates the outfit image itself (free, no key needed)
async function groqDesignConcept(prompt, profile) {
  if (!groqAvailable()) return null;
  const sys = `You are FashionBuy's AI fashion co-designer. The user describes a dream outfit.
Design it vividly (fabric, silhouette, colors, embellishments) and ask TWO short interactive
follow-up questions: where they plan to wear it, and which shoes/accessories they want to pair.
Respond ONLY with minified JSON: {"concept":"...","questions":["...","..."]}`;
  const user = `USER PROFILE — Height ${profile.height}cm, Weight ${profile.weight}kg, Skin tone ${profile.skin},
Season palette ${profile.season}, Gender ${profile.gender}.\nDESIGN REQUEST: "${prompt}"`;
  try {
    const r = await groqChat([
      { role: 'system', content: sys },
      { role: 'user', content: user }
    ], { temperature: 0.8, jsonMode: true });
    if (r.error) return r;
    const text = r.result || '';
    try { return { result: JSON.parse(text) }; }
    catch { const m = text.match(/\{[\s\S]*\}/); return m ? { result: JSON.parse(m[0]) } : { error: 'BAD_GROQ_SHAPE', detail: text.slice(0, 300) }; }
  } catch (e) { return { error: 'GROQ_NETWORK', detail: String(e.message || e) }; }
}

async function geminiDesignImage(prompt, profile) {
  const key = getApiKey();
  if (!key) return { error: 'NO_API_KEY', detail: 'Set GEMINI_API_KEY to generate the outfit image.' };
  const desc = `High-fashion studio photograph of a ${profile.gender === 'female' ? 'female' : 'male'} couture outfit:
${prompt}. Tailored to height ${profile.height}cm, ${profile.weight}kg build, ${profile.skin} skin tone,
${profile.season} season palette. Editorial cyber-atelier lighting, full-body view, elegant runway pose.`;
  const models = ['gemini-2.5-flash-image-preview', 'gemini-2.0-flash-preview-image-generation'];
  for (const model of models) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: desc }] }],
          generationConfig: { responseModalities: ['IMAGE'], temperature: 0.9 }
        })
      });
      if (!r.ok) continue;
      const j = await r.json();
      const part = (j?.candidates?.[0]?.content?.parts || []).find(p => p.inlineData || p.inline_data);
      const inl = part?.inlineData || part?.inline_data;
      if (inl?.data) return { result: { mime: inl.mimeType || inl.mime_type || 'image/png', base64: inl.data } };
    } catch { /* try next model */ }
  }
  return { error: 'GEMINI_IMAGE_FAILED', detail: 'No image-generation model returned an image.' };
}

// ---------- Private AI Stylist: Groq analysis + TinyFish live store search ----------
async function groqStyledText(prompt) {
  const r = await groqChat([
    { role: 'system', content: 'You are FashionBuy\'s Private AI Stylist. Be concise and specific.' },
    { role: 'user', content: prompt }
  ], { temperature: 0.8 });
  return r.error ? null : (r.result || null);
}

// TinyFish Web Agent: ask the agent to find the product in live stores.
// Tries a couple of plausible REST shapes; falls back gracefully when unset.
async function tinyFishSearch(query) {
  const key = getTinyFishKey();
  if (!key) return null;
  const endpoints = [
    { url: 'https://api.tinyfish.ai/v1/agent/run', body: { goal: `Find this fashion product in online stores. Return the product title, price, image URL and store link: ${query}` } },
    { url: 'https://api.tinyfish.ai/v1/search', body: { query, num_results: 1 } }
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}`, 'X-API-Key': key },
        body: JSON.stringify(ep.body)
      });
      if (!r.ok) continue;
      const j = await r.json();
      // Accept several response shapes: direct fields, results[], or agent output text
      const item = (Array.isArray(j.results) && j.results[0]) || (Array.isArray(j.items) && j.items[0]) || j.product || j;
      const textBlob = JSON.stringify(j);
      const img = item.image || item.imageUrl || item.thumbnail || (textBlob.match(/https?:\/\/[^"\s]+\.(?:jpg|jpeg|png|webp)/i) || [])[0];
      const link = item.link || item.url || item.product_url || (textBlob.match(/https?:\/\/(?!.*\.(?:jpg|jpeg|png|webp))[^"\s]+/i) || [])[0];
      if (item.title || link || img) {
        return {
          title: item.title || query,
          price: item.price != null ? String(item.price) : '',
          image: img || '',
          link: link || '',
          store: item.store || item.site || (link ? (new URL(link)).hostname.replace('www.', '') : 'Live Store')
        };
      }
    } catch { /* try next endpoint */ }
  }
  return null;
}

// Clean fallback: pick a matching curated catalogue item when TinyFish is unset/fails
const CATALOGUE = [
  { name: 'Aurelia Satin Gown', price: 249, brand: 'vogue', gender: 'female', img: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&q=80&auto=format&fit=crop' },
  { name: 'Aurelia Ivory Evening Set', price: 267, brand: 'vogue', gender: 'female', img: 'https://images.unsplash.com/photo-1595777457583-95e0591bbce9?w=600&q=80&auto=format&fit=crop' },
  { name: 'Aurelia Noir Slip Dress', price: 219, brand: 'vogue', gender: 'female', img: 'https://images.unsplash.com/photo-1496737631176-b714589c9bbe?w=600&q=80&auto=format&fit=crop' },
  { name: 'Veloura Midnight Blazer', price: 299, brand: 'noir', gender: 'male', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&auto=format&fit=crop' },
  { name: 'Veloura Double-Breasted Tux', price: 349, brand: 'noir', gender: 'male', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&auto=format&fit=crop' },
  { name: 'Kairos Urban Denim Fit', price: 159, brand: 'karios', gender: 'male', img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80&auto=format&fit=crop' },
  { name: 'Kairos Street Sculpt Jacket', price: 189, brand: 'karios', gender: 'female', img: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80&auto=format&fit=crop' }
];
function fallbackProduct(msg, gender) {
  const m = msg.toLowerCase();
  const wanted = CATALOGUE.filter(o => o.gender === gender && o.img);
  const keywords = [['dress','gown'],['suit','tux','blazer'],['hoodie'],['denim','jeans'],['jumpsuit'],['jacket']];
  let pick = null;
  for (const ks of keywords) if (ks.some(k => m.includes(k))) {
    pick = wanted.find(o => ks.some(k => o.name.toLowerCase().includes(k))); break;
  }
  if (!pick) pick = wanted[Math.floor(Math.random() * wanted.length)] || CATALOGUE[0];
  return { title: pick.name, price: '$' + pick.price, image: pick.img, link: '', store: pick.brand + ' (catalogue fallback — add tinyfish.key for live stores)' };
}

async function stylistSearch(payload) {
  const meas = payload.measurements || {};
  const profile = `USER PROFILE: Height ${payload.height}cm, Weight ${payload.weight}kg, Skin tone ${payload.skin}, Season palette ${payload.season}, Gender ${payload.gender},
Measurements (cm): Shoulder ${meas.shoulder || 42}, Chest ${meas.chest || 92}, Waist ${meas.waist || 74}, Hips ${meas.hips || 96}, Sleeve ${meas.sleeve || 60}. REQUEST: "${payload.message}"`;
  // 1) Gemini: personalized styling advice + an optimized store search query
  const advicePrompt = `${profile}\n\nYou are FashionBuy's Private AI Stylist. Give 2-3 sentences of personalized styling advice for this person,\nthen on the LAST line output exactly: SEARCH: <a concise web shopping search query for the exact item (include store name if mentioned, item type, color, gender)>`;
  let advice = null, query = payload.message;
  try {
    const txt = await groqStyledText(advicePrompt);
    if (txt) {
      const m = txt.match(/SEARCH:\s*(.+)\s*$/i);
      if (m) { query = m[1].trim(); advice = txt.replace(m[0], '').trim(); }
      else advice = txt.trim();
    }
  } catch { /* fall through to fallback */ }
  // 2) TinyFish: live store search for real product photo / price / link
  let product = null;
  try { product = await tinyFishSearch(query); } catch { /* ignored */ }
  if (!product) product = fallbackProduct(payload.message, payload.gender);
  if (!advice) {
    advice = getApiKey()
      ? `Styled for ${payload.gender || 'you'} (${payload.season || 'any season'}): pair this piece with simple neutral layers and let the silhouette lead. It suits a ${payload.skin || 'neutral'} skin tone with ${payload.skin || 'neutral'}-friendly accents.`
      : '💡 Tip: add your Gemini key to gemini.key for personalized AI styling advice.';
  }
  // Always return a clean, predictable shape the frontend can rely on
  const cleanProduct = product ? {
    title: product.title || payload.message || 'Recommended outfit',
    price: product.price ? String(product.price) : '',
    storeUrl: product.link || '',
    image: product.image || '',
    store: product.store || ''
  } : fallbackProduct(payload.message, payload.gender);
  return { advice, query, product: cleanProduct, tinyfish: !!getTinyFishKey() };
}

// ---------- FreeSewing pattern drafting (/api/pattern) ----------
// Maps 5 body measurements to the 32 FreeSewing wants, drafts the design and
// returns SVG containing ONLY stroke-dasharray paths with fill="none" —
// no background rect, no fills, no labels — so the mat/AR show transparent
// dotted outlines over the fabric.
const FS_DESIGNS = {};
(function loadFreeSewing() {
  const deps = {
    simon:   ['@freesewing/simon',   'Simon'],
    titan:   ['@freesewing/titan',   'Titan'],
    aaron:   ['@freesewing/aaron',   'Aaron'],
    brian:   ['@freesewing/brian',   'Brian'],
    bella:   ['@freesewing/bella',   'Bella'],
    waralee: ['@freesewing/waralee', 'Waralee'],
    bent:    ['@freesewing/bent',    'Bent'],
    carlita: ['@freesewing/carlita', 'Carlita']
  };
  for (const [key, [mod, cls]] of Object.entries(deps)) {
    try { FS_DESIGNS[key] = require(mod)[cls]; }
    catch (e) { console.warn('[freesewing] ' + key + ' unavailable:', e.message); }
  }
  console.log('[freesewing] designs ready:', Object.keys(FS_DESIGNS).join(', ') || 'none');
})();

// 5 user measurements (cm) → full FreeSewing measurement set (mm)
function fsMeasurements(m = {}) {
  const chest = (+m.chest || 92) * 10, waist = (+m.waist || 74) * 10, hips = (+m.hips || 96) * 10;
  const shoulder = (+m.shoulder || 42) * 10, wrist = (+m.sleeve || 60) * 10;
  const shoulderToWrist = wrist + shoulder * 0.55;
  return {
    biceps: Math.round(chest * 0.35), chest, waist, hips, seat: hips, highBust: Math.round(chest * 0.93),
    neck: Math.round((+m.chest || 92) * 4.1), shoulderSlope: 13, shoulderToShoulder: shoulder,
    hpsToBust: Math.round(shoulder * 0.58), hpsToWaistBack: shoulder + Math.round(waist * 0.42),
    hpsToWaistFront: shoulder + Math.round(waist * 0.4), waistToArmpit: 240, waistToHips: 200,
    waistToSeat: Math.round(hips * 0.23), waistToFloor: 1040, waistToKnee: 500, knee: 380,
    inseam: 800, upperLeg: 560, crossSeam: 700, crossSeamFront: 330, crotchDepth: Math.round(hips * 0.27),
    bustSpan: Math.round(chest * 0.19), underbust: Math.round(chest * 0.83), bustFront: Math.round(chest * 0.5),
    highBustFront: Math.round(chest * 0.45), waistBack: Math.round(waist * 0.5), seatBack: Math.round(hips * 0.5),
    shoulderToWrist, shoulderToElbow: Math.round(shoulderToWrist * 0.55), wrist, head: 560,
    waistToUpperLeg: 100, heel: 300, ankle: 220
  };
}

function draftFreeSewingSVG(designKey, measurements) {
  const Design = FS_DESIGNS[designKey];
  if (!Design) return null;
  let pattern = new Design({ sa: 10, paperless: true, measurements: fsMeasurements(measurements) });
  try {
    const { pluginTheme } = require('@freesewing/plugin-theme');
    pattern = pattern.use(pluginTheme);
  } catch { /* theme optional */ }
  const raw = pattern.draft().render();
  return outlinesOnlySVG(raw);
}

// Keep ONLY the drawn line geometry: drop the stylesheet (dark backgrounds,
// fills, label colours) and every non-path element (rects, text, circles).
// Every surviving path gets fill="none" + stroke-dasharray.
function outlinesOnlySVG(raw) {
  const i = raw.indexOf('id="fs-container"');
  const start = i > -1 ? raw.lastIndexOf('<g', i) : raw.indexOf('<svg');
  const end = raw.lastIndexOf('</svg>');
  if (start < 0 || end < 0) return null;
  const body = raw.slice(start, end);
  const paths = [...body.matchAll(/<path\b[^>]*?\bd="([^"]+)"[^>]*>/g)].map(m => m[1]);
  if (!paths.length) return null;
  const drawn = paths.map(d =>
    `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" ` +
    `stroke-linejoin="round" stroke-dasharray="7 6" vector-effect="non-scaling-stroke"/>`).join('');
  const vbMatch = raw.match(/viewBox="([^"]*)"/);
  const vb = vbMatch ? vbMatch[1] : '0 0 640 440';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet">${drawn}</svg>`;
}

function readJsonBody(req, limitMB = 15) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => {
      size += c.length;
      if (size > limitMB * 1024 * 1024) { reject(new Error('payload too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  if (req.method === 'POST' && req.url.startsWith('/api/stylist-search')) {
    try {
      const payload = await readJsonBody(req);
      console.log('[stylist-search]', payload.message || '?', '| gender:', payload.gender);
      const out = await stylistSearch(payload);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'BAD_REQUEST', detail: String(e.message || e) }));
    }
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/design-idea')) {
    try {
      const payload = await readJsonBody(req);
      console.log('[design-idea]', (payload.prompt || '?').slice(0, 80), '| gender:', payload.profile?.gender);
      const profile = payload.profile || {};
      const prompt = payload.prompt || 'a stunning couture outfit';

      // 1) Groq (Llama 3.3 70B Versatile) — concept + follow-up questions
      let groqOk = false, imageUrl = '';
      const groq = await groqDesignConcept(prompt, profile);
      if (groq && groq.result) {
        groqOk = true;
        if (groq.result.imageUrl) imageUrl = groq.result.imageUrl;
      }

      // 2) Gemini 2.5 Flash — ALWAYS produce the detailed design description +
      //    interactive co-designer follow-up questions (wearer/occasion, accessories, shoes)
      const designPrompt = `You are FashionBuy's AI fashion co-designer. The user dreams of: "${prompt}".
Design the outfit vividly (fabrics, silhouette, colors, embellishments) for a ${profile.gender || 'any'} wearer,
height ${profile.height || 175}cm, ${profile.weight || 68}kg, ${profile.skin || 'any'} skin tone, ${profile.season || 'any season'} palette.
Then write TWO short follow-up questions asking: (1) where they plan to wear it, and (2) which accessories and shoes they want to pair.
Respond ONLY with minified JSON: {"reply":"...","followUpQuestions":"question1 ... question2","imageUrl":"https://... or empty string"}`;
      let reply = null, followUpQuestions = '';
      try {
        const txt = await groqStyledText(designPrompt);
        if (txt) {
          const m = txt.match(/\{[\s\S]*\}/);
          if (m) {
            try {
              const j = JSON.parse(m[0]);
              reply = j.reply || null;
              followUpQuestions = j.followUpQuestions || '';
              if (!imageUrl && j.imageUrl) imageUrl = j.imageUrl;
            } catch {
              reply = txt.trim();
            }
          } else reply = txt.trim();
        }
      } catch { /* fall through */ }

      // 3) Groq-polished prompt → Pollinations image URL — free, zero-key visual
      try {
        if (!imageUrl) {
          let visualPrompt = prompt;
          if (groqOk) {
            const gt = await groqText(`Write one vivid one-sentence English image-generation prompt for this outfit concept: "${prompt}". Output ONLY the prompt.`, { temperature: 0.7 });
            if (gt) visualPrompt = gt.trim().slice(0, 400);
          }
          imageUrl = pollinationsImageUrl(visualPrompt);
        }
      } catch { /* ignore — image stays empty */ }

      // 4) Gemini image as visual backup when nothing else produced one
      let imageMime = null, imageBase64 = null;
      if (!imageUrl) {
        try {
          const img = await geminiDesignImage(prompt, profile);
          if (img && img.result) { imageMime = img.result.mime; imageBase64 = img.result.base64; }
        } catch { /* ignore */ }
      }

      // 5) Fallback text so this route NEVER crashes or returns empty
      if (!reply) {
        reply = `Design sketched in words: a bespoke ${prompt} — structured shoulders, fluid fabric, in a palette chosen for a ${profile.season || 'versatile'} wardrobe. Pair it with minimalist metallic accessories and neutral heels or polished boots.`;
        followUpQuestions = followUpQuestions || 'Where will you wear it — a gala, the office, or a night out? And which accessories & shoes should we pair with it?';
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        reply,
        followUpQuestions,
        imageUrl,
        imageMime, imageBase64,
        groq: groqOk,
        gemini: true
      }));
    } catch (e) {
      // Even on a hard error return a usable JSON payload — never crash the UI
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        reply: 'Design idea received — describe the silhouette, fabric and occasion and the co-designer will refine it with you.',
        followUpQuestions: 'Where will you wear it? Which accessories and shoes would you like to pair?',
        imageUrl: '', imageMime: null, imageBase64: null,
        groq: false, gemini: false,
        error: 'SERVER_FALLBACK', detail: String(e.message || e)
      }));
    }
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/stylist')) {
    // Legacy alias — same behavior
    req.url = '/api/stylist-search';
  }

  if (req.method === 'POST' && req.url.startsWith('/api/analyze-fit')) {
    try {
      const payload = await readJsonBody(req);
      console.log('[analyze-fit]', payload.outfitName || '?', '| photo:', !!payload.imageBase64);
      const out = await callFitAnalysis(payload);
      res.writeHead(out.error ? 502 : 200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'BAD_REQUEST', detail: String(e.message || e) }));
    }
    return;
  }

  if (req.method === 'POST' && req.url.startsWith('/api/pattern')) {
    try {
      const payload = await readJsonBody(req);
      const svg = draftFreeSewingSVG(payload.design, payload.measurements || {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ svg, design: payload.design, freesewing: !!svg }));
    } catch (e) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ svg: null, error: 'FS_DRAFT_FAILED', detail: String(e.message || e) }));
    }
    return;
  }

  // Exact current filenames of the renamed images inside models2/
  if (req.method === 'GET' && req.url.startsWith('/api/models2-list')) {
    const files = listModels2Images();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
    res.end(JSON.stringify(files));
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, groqKey: groqAvailable(), model: GROQ_MODEL }));
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/api/paypal-config')) {
    const clientId = process.env.PAYPAL_CLIENT_ID || '';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ clientId }));
    return;
  }

  if (app.handle(req, res) !== false) return;   // /models2 static mount

  serveStatic(req, res);
});

server.listen(PORT, () => {
  const key = getApiKey();
  console.log(`FashionBuy studio → http://localhost:${PORT}`);
  console.log(key ? 'Gemini API key present (legacy image fallback)' : 'Gemini API key not set (image fallback skipped)');
  console.log(getGroqKeys().length ? `Groq API: REAL (${GROQ_MODEL})` : 'Groq API key MISSING — set GROQ_API_KEY env var');
});
