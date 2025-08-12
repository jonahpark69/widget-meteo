// ==============================
// Widget Météo — Visual Crossing (gratuit) + hors‑ligne partiel “à la Apple”
// - Cache “dernière météo connue” (TTL 60 min)
// - Cross‑fade, flip jour/nuit via sunrise/sunset API
// - Ajout / Navigation / Suppression de ville (clic droit sur le nom)
// ==============================

// 30 minutes
const AUTO_REFRESH_MS = 30 * 60 * 1000;
const WEATHER_TTL = 60 * 60 * 1000; // 60 min

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// RENSEIGNE ICI TA CLÉ VISUAL CROSSING
// (Laisse ta vraie clé si tu l’as déjà mise)
const VC_API_KEY = "UX549SPMKN2PSTZY895LSUDYJ";
// <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// --- Sélecteurs DOM ---
const cityEl   = document.querySelector(".city");
const bgEl     = document.querySelector(".background");
const iconEl   = document.getElementById("weather-icon");
const mascotEl = document.querySelector(".mascot");
const tempEl   = document.getElementById("temperature");
const phraseEl = document.querySelector(".phrase") || document.getElementById("phrase");

// Boutons header
const headerButtons = document.querySelectorAll(".buttons button");
const btnPrev = headerButtons?.[0] || null;
const btnNext = headerButtons?.[1] || null;

// --- Villes ---
const STORAGE_KEY = "widget-meteo-cities";
const STORAGE_IDX = "widget-meteo-current-index";
const DEFAULT_CITIES = ["Compiègne", "Paris", "Lyon", "Marseille", "Séoul, KR", "Daejeon, KR", "Busan, KR"];


let cities = loadCities();
let currentIndex = loadIndex();

function loadCities() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : null;
    if (Array.isArray(arr) && arr.length) return arr;
  } catch {}
  return [...DEFAULT_CITIES];
}
function saveCities() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}
function loadIndex() {
  const raw = localStorage.getItem(STORAGE_IDX);
  const n = raw != null ? Number(raw) : 0;
  return Number.isInteger(n) && n >= 0 && n < cities.length ? n : 0;
}
function saveIndex() {
  localStorage.setItem(STORAGE_IDX, String(currentIndex));
}
function getCurrentCity() {
  return cities[currentIndex] || cities[0] || "Compiègne";
}
function setCurrentIndex(i) {
  if (!cities.length) return;
  currentIndex = ((i % cities.length) + cities.length) % cities.length;
  saveIndex();
}

// ==============================
// Mini cache "dernière météo connue"
// ==============================
function cacheKey(cityName) {
  return `weather:${(cityName || "").toLowerCase()}`;
}
function saveWeatherCache(cityName, payload) {
  const data = { ...payload, cachedAt: Date.now() };
  try { localStorage.setItem(cacheKey(cityName), JSON.stringify(data)); } catch {}
}
function loadWeatherCache(cityName) {
  try {
    const raw = localStorage.getItem(cacheKey(cityName));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function removeWeatherCache(cityName) {
  try { localStorage.removeItem(cacheKey(cityName)); } catch {}
}
function isFresh(cached) {
  return cached && (Date.now() - (cached.cachedAt || 0)) < WEATHER_TTL;
}

// ==============================
// Effet fondu (robuste)
// ==============================
const FADE_MS = 220;

[bgEl, iconEl, mascotEl].forEach(el => {
  if (!el) return;
  el.style.transition = `opacity ${FADE_MS}ms linear`;
  el.style.opacity = "1";
});

function crossfadeImage(el, nextSrc) {
  if (!el || !nextSrc) return;

  const clean = (s) => (s || "").split("?")[0];
  const cur = clean(el.src);
  const nxt = clean(nextSrc);
  if (cur === nxt) return;

  if (el.__fadeTimer) { clearTimeout(el.__fadeTimer); el.__fadeTimer = null; }
  if (el.__fadeInTimer) { clearTimeout(el.__fadeInTimer); el.__fadeInTimer = null; }

  let imgLoaded = false;
  let fadedOut = false;

  const img = new Image();
  img.onload = () => {
    imgLoaded = true;
    if (fadedOut) doSwap();
  };
  img.onerror = () => {
    el.style.opacity = "1";
  };
  img.src = nextSrc;

  el.style.opacity = "0";
  el.__fadeTimer = setTimeout(() => {
    fadedOut = true;
    if (imgLoaded) doSwap();
  }, FADE_MS);

  function doSwap() {
    el.src = nextSrc;
    el.__fadeInTimer = setTimeout(() => {
      el.style.opacity = "1";
    }, 16);
  }
}

// ==============================
// Mapping Visual Crossing -> style + phrases
// `icon` : clear-day, clear-night, partly-cloudy-day, partly-cloudy-night,
// cloudy, rain, thunderstorm, fog, snow, etc.
// ==============================
function mapVCToStyle(iconStr, conditionsStr) {
  const s = (iconStr || "").toLowerCase();

  if (s.includes("clear")) return "Ciel-clair";
  if (s.includes("partly-cloudy")) return "Nuageux-leger";
  if (s.includes("cloudy")) return "Nuageux-dense";
  if (s.includes("fog")) return "Brouillard";
  if (s.includes("snow")) return "Neige";
  if (s.includes("thunder")) return "Orage";
  if (s.includes("rain") || s.includes("drizzle")) {
    const c = (conditionsStr || "").toLowerCase();
    if (c.includes("light") || c.includes("faible") || c.includes("petite")) return "Pluie-legere";
    return "Pluie-forte";
  }
  return "Nuageux-leger";
}

const PHRASES = {
  "Ciel-clair":      "Mode solaire activé !",
  "Nuageux-leger":   "Un nuage a spawn.",
  "Nuageux-dense":   "Chargement des nuages...",
  "Pluie-legere":    "Petite mise à jour aquatique.",
  "Pluie-forte":     "Erreur 404 : soleil introuvable.",
  "Orage":           "Attention : boss météo en approche !",
  "Brouillard":      "Graphismes en basse résolution.",
  "Neige":           "Pixelflakes en téléchargement."
};

// ==============================
// État pour flip jour/nuit (via heures API)
// ==============================
let lastState = {
  styleKey: null,
  tempC: null,
  cityLabel: null,
  sunriseUTC: null,
  sunsetUTC: null,
  tzOffsetSeconds: 0,
  isNight: null,
};
let dayNightTimer = null;
let safetyTick = null;

function clearDayNightTimers() {
  if (dayNightTimer) { clearTimeout(dayNightTimer); dayNightTimer = null; }
  if (safetyTick)   { clearInterval(safetyTick); safetyTick = null; }
}

function computeIsNightFromUTC(nowUTC) {
  const { sunriseUTC, sunsetUTC } = lastState;
  if (typeof sunriseUTC !== "number" || typeof sunsetUTC !== "number") return null;
  return (nowUTC < sunriseUTC) || (nowUTC > sunsetUTC);
}

// Planifie la prochaine bascule jour/nuit
function scheduleDayNightFlip() {
  clearDayNightTimers();
  const nowUTC = Date.now();
  const isNightNow = computeIsNightFromUTC(nowUTC);
  if (isNightNow == null) return;

  lastState.isNight = isNightNow;

  const nextBoundaryUTC = isNightNow ? lastState.sunriseUTC : lastState.sunsetUTC;
  let delay = Math.max(0, nextBoundaryUTC - nowUTC);
  if (delay === 0) delay = 30 * 60 * 1000;

  dayNightTimer = setTimeout(() => {
    if (lastState.styleKey && lastState.cityLabel) {
      const flippedNight = !lastState.isNight;
      applyStyle(lastState.styleKey, lastState.tempC, lastState.cityLabel, flippedNight);
      lastState.isNight = flippedNight;
      scheduleDayNightFlip();
    }
  }, delay);

  // Tick sécu toutes les 10 min
  safetyTick = setInterval(() => {
    const now = Date.now();
    const shouldNight = computeIsNightFromUTC(now);
    if (shouldNight != null && shouldNight !== lastState.isNight && lastState.styleKey) {
      applyStyle(lastState.styleKey, lastState.tempC, lastState.cityLabel, shouldNight);
      lastState.isNight = shouldNight;
      scheduleDayNightFlip();
    }
  }, 10 * 60 * 1000);
}

// Applique style (avec option nuit)
function applyStyle(styleKey, tempC, cityName, isNight = false) {
  const cb = `?t=${Date.now()}`;

  const bgPath = isNight
    ? `assets/backgrounds/Nuit.png${cb}`
    : `assets/backgrounds/${styleKey}.png${cb}`;

  const iconPath = isNight
    ? `assets/icons/icone-nuit.svg${cb}`
    : `assets/icons/icone-${styleKey}.svg${cb}`;

  const mascotPath = `assets/mascot/mascotte-${styleKey}.gif${cb}`;

  crossfadeImage(bgEl, bgPath);
  crossfadeImage(iconEl, iconPath);
  crossfadeImage(mascotEl, mascotPath);

  if (tempEl && Number.isFinite(tempC)) tempEl.textContent = `${Math.round(tempC)}°`;
  if (cityEl && cityName) cityEl.textContent = cityName;

  if (phraseEl) {
    if (isNight) {
      phraseEl.textContent = "Nuit noire, esprit clair.";
    } else if (PHRASES[styleKey]) {
      phraseEl.textContent = PHRASES[styleKey];
    }
  }
}

// ==============================
// Visual Crossing API (adresse directe)
// https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/{CITY}?unitGroup=metric&include=current,days&key=...&lang=fr
// ==============================
async function fetchVC(cityName) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(cityName)}?unitGroup=metric&include=current,days&lang=fr&key=${encodeURIComponent(VC_API_KEY)}&contentType=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`VC HTTP ${res.status}`);
  return res.json();
}

function parseVC(data, cityName) {
  const tempC = data?.currentConditions?.temp;
  const iconStr = data?.currentConditions?.icon || "";
  const conditionsStr = data?.currentConditions?.conditions || "";
  const tzOffsetHours = data?.tzoffset ?? 0; // ex: 2 pour +02:00
  const tzOffsetSeconds = Math.round(tzOffsetHours * 3600);

  const day0 = Array.isArray(data?.days) ? data.days[0] : null;
  const sunrise = day0?.sunrise; // "06:13:00"
  const sunset  = day0?.sunset;  // "21:34:00"

  if (typeof tempC !== "number" || !sunrise || !sunset) {
    throw new Error("VC invalid payload");
  }

  const styleKey = mapVCToStyle(iconStr, conditionsStr);

  // sunrise/sunset sont en heure locale -> convertissons en UTC
  const localDateISO = (day0?.datetime) || new Date().toISOString().slice(0,10); // "YYYY-MM-DD"
  const sunriseLocal = `${localDateISO}T${sunrise}`;
  const sunsetLocal  = `${localDateISO}T${sunset}`;

  const sunriseUTC = Date.parse(sunriseLocal + "Z") - tzOffsetSeconds * 1000;
  const sunsetUTC  = Date.parse(sunsetLocal  + "Z") - tzOffsetSeconds * 1000;
  const nowUTC = Date.now();
  const isNight = (nowUTC < sunriseUTC || nowUTC > sunsetUTC);

  return { tempC, styleKey, isNight, sunriseUTC, sunsetUTC, tzOffsetSeconds, label: data?.resolvedAddress || cityName };
}

// ==============================
// Rafraîchit météo (avec cache partiel)
// ==============================
let refreshing = false;
async function refreshWeather(cityName) {
  if (refreshing) return;
  refreshing = true;

  // évite un flip pendant switch ville
  clearDayNightTimers();

  try {
    if (cityEl && cityName) cityEl.textContent = cityName;

    // 1) Afficher le cache s’il est frais
    const cached = loadWeatherCache(cityName);
    if (cached && isFresh(cached)) {
      applyStyle(cached.styleKey, cached.tempC, cityName, cached.isNight);
    }

    // 2) Si offline → on s’arrête là (cache ou fallback)
    if (!navigator.onLine) {
      if (!(cached && isFresh(cached))) {
        applyStyle("Nuageux-leger", 20, cityName, false);
      }
      return;
    }

    // 3) Online → appel Visual Crossing
    const data = await fetchVC(cityName);
    const { tempC, styleKey, isNight, sunriseUTC, sunsetUTC, tzOffsetSeconds, label } = parseVC(data, cityName);

    // Mémorise l’état
    lastState = { styleKey, tempC, cityLabel: label, sunriseUTC, sunsetUTC, tzOffsetSeconds, isNight };

    // Applique & planifie flip
    applyStyle(styleKey, tempC, label, isNight);
    scheduleDayNightFlip();

    // 4) Sauvegarde “dernière météo connue”
    saveWeatherCache(label, { styleKey, tempC, isNight, sunriseUTC, sunsetUTC, tzOffsetSeconds });
  } catch (e) {
    console.error("Visual Crossing fetch failed:", e);
    const cached = loadWeatherCache(cityName);
    if (cached) {
      applyStyle(cached.styleKey, cached.tempC, cityName, cached.isNight);
    } else {
      applyStyle("Nuageux-leger", 20, cityName, false);
    }
    clearDayNightTimers();
  } finally {
    refreshing = false;
  }
}

// ==============================
// Ajout / Suppression / Navigation
// ==============================
async function gotoPrevCity() {
  setCurrentIndex(currentIndex - 1);
  const target = getCurrentCity();
  if (cityEl) cityEl.textContent = target;
  await refreshWeather(target);
}
async function gotoNextCity() {
  setCurrentIndex(currentIndex + 1);
  const target = getCurrentCity();
  if (cityEl) cityEl.textContent = target;
  await refreshWeather(target);
}
async function promptAddOrSwitchCity() {
  const current = (cityEl?.textContent || "").trim();
  const name = (await uiPrompt("Changer/Ajouter une ville :", current)) || "";
  if (!name) return;

  const idx = cities.findIndex(c => c.toLowerCase() === name.toLowerCase());
  if (idx >= 0) {
    setCurrentIndex(idx);
    const target = cities[idx];
    if (cityEl) cityEl.textContent = target;
    await refreshWeather(target);
    return;
  }
  cities.push(name);
  saveCities();
  setCurrentIndex(cities.length - 1);
  if (cityEl) cityEl.textContent = name;
  await refreshWeather(name);
}

async function deleteCurrentCity() {
  const cityToDelete = getCurrentCity();
  if (!cityToDelete) return;

  if (!confirm(`Supprimer la ville "${cityToDelete}" ?`)) return;

  // Nettoie le cache de cette ville
  removeWeatherCache(cityToDelete);

  // Retire la ville de la liste
  cities = cities.filter(c => c.toLowerCase() !== cityToDelete.toLowerCase());
  saveCities();

  // Répare l'index courant
  if (cities.length === 0) {
    cities = [...DEFAULT_CITIES];
    saveCities();
    currentIndex = 0;
  } else if (currentIndex >= cities.length) {
    currentIndex = cities.length - 1;
  }
  saveIndex();

  await refreshWeather(getCurrentCity());
}

// ==============================
// UI Prompt
// ==============================
function uiPrompt(message, defaultValue = "") {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 99999;
      background: rgba(0,0,0,.55); display: grid; place-items: center;
      font-family: inherit;
    `;
    const box = document.createElement("div");
    box.style.cssText = `
      width: 320px; max-width: 90vw; padding: 14px;
      border: 2px solid #00776e; border-radius: 12px;
      background: #0b1f1d; color: #fff; display: grid; gap: 10px;
    `;
    box.innerHTML = `
      <div style="font-size:16px;">${message}</div>
      <input type="text" id="uiPromptInput" value="${defaultValue.replace(/"/g, "&quot;")}"
        style="padding: 8px; border:2px solid #2b5e59; border-radius:8px; background:#031615; color:#fff; font-size:16px;"/>
      <div style="display:flex; gap:8px; justify-content:flex-end;">
        <button id="uiPromptCancel" style="padding:8px 12px; background:#222; color:#ddd; border:2px solid #444; border-radius:8px; cursor:pointer;">Annuler</button>
        <button id="uiPromptOk" style="padding:8px 12px; background:#0f6e65; color:#fff; border:2px solid #2b8c84; border-radius:8px; cursor:pointer;">OK</button>
      </div>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    const input = box.querySelector("#uiPromptInput");
    const btnOk = box.querySelector("#uiPromptOk");
    const btnCancel = box.querySelector("#uiPromptCancel");

    const cleanup = (val) => { overlay.remove(); resolve(val); };
    btnOk.onclick = () => cleanup(input.value.trim() || null);
    btnCancel.onclick = () => cleanup(null);
    overlay.addEventListener("click", (e) => { if (e.target === overlay) cleanup(null); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btnOk.click();
      if (e.key === "Escape") btnCancel.click();
    });
    setTimeout(() => { input.focus(); input.select(); }, 0);
  });
}

// ==============================
// Init
// ==============================
async function init() {
  if (cityEl) {
    cityEl.textContent = getCurrentCity();
    cityEl.title = "Cliquer pour changer/ajouter une ville (clic droit pour supprimer)";
    cityEl.style.cursor = "pointer";
    cityEl.addEventListener("click", () => { promptAddOrSwitchCity().catch(() => {}); });
    // Clic droit = suppression de la ville courante
    cityEl.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      deleteCurrentCity().catch(() => {});
    });
  }
  if (btnPrev) btnPrev.addEventListener("click", gotoPrevCity);
  if (btnNext) btnNext.addEventListener("click", gotoNextCity);

  await refreshWeather(getCurrentCity());

  if (AUTO_REFRESH_MS > 0) {
    setInterval(() => {
      refreshWeather(getCurrentCity());
    }, AUTO_REFRESH_MS);
  }
}

document.addEventListener("DOMContentLoaded", init);














