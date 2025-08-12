// ==============================
// Widget Météo — villes + API + auto-refresh + fondu + UI Prompt + flip jour/nuit en temps réel
// ==============================

// 30 minutes
const AUTO_REFRESH_MS = 30 * 60 * 1000;

// --- Sélecteurs DOM ---
const cityEl   = document.querySelector(".city");
const bgEl     = document.querySelector(".background");
const iconEl   = document.getElementById("weather-icon");
const mascotEl = document.querySelector(".mascot");
const tempEl   = document.getElementById("temperature");
const phraseEl = document.getElementById("phrase") || document.querySelector(".phrase");

// Boutons header
const headerButtons = document.querySelectorAll(".buttons button");
const btnPrev = headerButtons?.[0] || null;
const btnNext = headerButtons?.[1] || null;

// --- Villes ---
const STORAGE_KEY = "widget-meteo-cities";
const STORAGE_IDX = "widget-meteo-current-index";
const DEFAULT_CITIES = ["Compiègne", "Paris", "Lyon", "Marseille"];

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
// Effet fondu (robuste)
// ==============================
const FADE_MS = 220;

// Applique les transitions une seule fois
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
// Mapping WMO
// ==============================
function mapWmoToStyle(wmo) {
  if ([0].includes(wmo)) return "Ciel-clair";
  if ([1, 2].includes(wmo)) return "Nuageux-leger";
  if ([3].includes(wmo)) return "Nuageux-dense";
  if ([45, 48].includes(wmo)) return "Brouillard";
  if ([51, 53, 55, 61, 66, 80].includes(wmo)) return "Pluie-legere";
  if ([56, 57, 63, 65, 67, 81, 82].includes(wmo)) return "Pluie-forte";
  if ([71, 73, 75, 77, 85, 86].includes(wmo)) return "Neige";
  if ([95, 96, 99].includes(wmo)) return "Orage";
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
// État courant pour flip jour/nuit en temps réel
// ==============================
let lastState = {
  styleKey: null,
  tempC: null,
  cityLabel: null,
  sunriseUTC: null,
  sunsetUTC: null,
  utcOffsetSeconds: 0,
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

// Planifie le prochain basculement jour/nuit précisément au lever/coucher
function scheduleDayNightFlip() {
  clearDayNightTimers();
  const nowUTC = Date.now();
  const isNightNow = computeIsNightFromUTC(nowUTC);
  if (isNightNow == null) return;

  lastState.isNight = isNightNow;

  // Détermine la prochaine bascule : si nuit, prochaine = lever du soleil ; sinon, coucher
  const nextBoundaryUTC = isNightNow ? lastState.sunriseUTC : lastState.sunsetUTC;
  let delay = Math.max(0, nextBoundaryUTC - nowUTC);

  // Sécurité : si les heures sont déjà échues (ex. changement de jour), on limite à 30 min
  if (delay === 0) delay = 30 * 60 * 1000;

  dayNightTimer = setTimeout(() => {
    // On re-applique le style à l'identique (même météo), mais on inverse le flag nuit
    if (lastState.styleKey && lastState.cityLabel) {
      const flippedNight = !lastState.isNight;
      applyStyle(lastState.styleKey, lastState.tempC, lastState.cityLabel, flippedNight);
      lastState.isNight = flippedNight;
      // On reprogramme un flip pour l'autre frontière
      scheduleDayNightFlip();
    }
  }, delay);

  // Tick de sécurité : on vérifie toutes les 10 minutes qu'on est dans le bon état
  safetyTick = setInterval(() => {
    const now = Date.now();
    const shouldNight = computeIsNightFromUTC(now);
    if (shouldNight != null && shouldNight !== lastState.isNight && lastState.styleKey) {
      applyStyle(lastState.styleKey, lastState.tempC, lastState.cityLabel, shouldNight);
      lastState.isNight = shouldNight;
      scheduleDayNightFlip(); // réajuste les timers
    }
  }, 10 * 60 * 1000);
}

// Applique style (avec option nuit)
function applyStyle(styleKey, tempC, cityName, isNight = false) {
  const cb = `?t=${Date.now()}`;

  const bgPath = isNight
    ? `assets/backgrounds/Nuit.png${cb}`
    : `assets/backgrounds/${styleKey}.png${cb}`;

  // Icône météo spéciale nuit
  const iconPath = isNight
    ? `assets/icons/icone-nuit.svg${cb}`
    : `assets/icons/icone-${styleKey}.svg${cb}`;

  const mascotPath = `assets/mascot/mascotte-${styleKey}.gif${cb}`;

  // Cross-fades
  crossfadeImage(bgEl, bgPath);
  crossfadeImage(iconEl, iconPath);
  crossfadeImage(mascotEl, mascotPath);

  // Données
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
// API Open-Meteo
// ==============================
async function geocodeCity(name) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=fr&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");
  const data = await res.json();
  if (!data.results?.length) throw new Error("City not found");
  const { latitude, longitude, name: label, country_code } = data.results[0];
  return { lat: latitude, lon: longitude, label, countryCode: country_code };
}

async function getCurrentWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const data = await res.json();
  const temp = data?.current?.temperature_2m;
  const wmo  = data?.current?.weather_code;
  const sunrise = data?.daily?.sunrise?.[0];
  const sunset = data?.daily?.sunset?.[0];
  const utcOffsetSeconds = data?.utc_offset_seconds ?? 0;
  if (typeof temp !== "number" || typeof wmo !== "number" || !sunrise || !sunset) {
    throw new Error("Invalid weather data");
  }
  return { tempC: temp, wmo, sunrise, sunset, utcOffsetSeconds };
}

// Détection Nuit (corrigée pour fuseaux horaires lointains, ex: Séoul)
function isNightTime(sunriseStr, sunsetStr, utcOffsetSeconds = 0) {
  // Les champs sunrise/sunset d'Open-Meteo sont des heures LOCALES sans offset.
  // On calcule donc leur équivalent UTC et on compare à l'heure UTC actuelle.
  const sunriseUTC = Date.parse(sunriseStr + "Z") - utcOffsetSeconds * 1000;
  const sunsetUTC  = Date.parse(sunsetStr  + "Z") - utcOffsetSeconds * 1000;
  const nowUTC = Date.now();
  return { isNight: (nowUTC < sunriseUTC || nowUTC > sunsetUTC), sunriseUTC, sunsetUTC };
}

// Rafraîchit météo
let refreshing = false;
async function refreshWeather(cityName) {
  if (refreshing) return;
  refreshing = true;

  // ✅ Micro‑optimisation #1 : éviter un flip pendant un changement de ville
  clearDayNightTimers();

  try {
    // ✅ Micro‑optimisation #2 : label de ville visible immédiatement
    if (cityEl && cityName) cityEl.textContent = cityName;

    const { lat, lon, label } = await geocodeCity(cityName);
    const { tempC, wmo, sunrise, sunset, utcOffsetSeconds } = await getCurrentWeather(lat, lon);
    const styleKey = mapWmoToStyle(wmo);
    const { isNight, sunriseUTC, sunsetUTC } = isNightTime(sunrise, sunset, utcOffsetSeconds);

    // Mémorise l'état courant pour flips temps réel
    lastState = {
      styleKey,
      tempC,
      cityLabel: label,
      sunriseUTC,
      sunsetUTC,
      utcOffsetSeconds,
      isNight
    };

    applyStyle(styleKey, tempC, label, isNight);
    scheduleDayNightFlip(); // programme le basculement automatique
  } catch (_) {
    // En cas d'erreur, on applique un style par défaut et on nettoie les timers
    applyStyle("Nuageux-leger", 20, cityName, false);
    clearDayNightTimers();
  } finally {
    refreshing = false;
  }
}

// ==============================
// Navigation
// ==============================
async function gotoPrevCity() {
  setCurrentIndex(currentIndex - 1);
  const target = getCurrentCity();
  if (cityEl) cityEl.textContent = target; // feedback immédiat
  await refreshWeather(target);
}
async function gotoNextCity() {
  setCurrentIndex(currentIndex + 1);
  const target = getCurrentCity();
  if (cityEl) cityEl.textContent = target; // feedback immédiat
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

// ==============================
// Init
// ==============================
async function init() {
  if (cityEl) {
    cityEl.textContent = getCurrentCity();
    cityEl.title = "Cliquer pour changer/ajouter une ville";
    cityEl.style.cursor = "pointer";
    cityEl.addEventListener("click", () => { promptAddOrSwitchCity().catch(() => {}); });
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









