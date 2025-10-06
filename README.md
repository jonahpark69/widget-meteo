# 🌤️ Widget Météo Pixel Art

> Application desktop **Electron.js** en style **pixel art** : météo en direct, fonds dynamiques, mascotte animée, thermomètre rétro.

---

## 📑 Table des matières

* [Présentation](#-présentation)
* [Objectifs du projet](#-objectifs-du-projet)
* [Fonctionnalités](#-fonctionnalités)
* [Design & identité visuelle](#-design--identité-visuelle)
* [Structure du projet](#-structure-du-projet)
* [Installation](#-installation)
* [Configuration API](#-configuration-api)
* [Utilisation](#-utilisation)
* [Technologies utilisées](#-technologies-utilisées)
* [Villes intégrées par défaut](#-villes-intégrées-par-défaut)
* [Captures d’écran](#-captures-décran)
* [Futures améliorations](#-futures-améliorations)
* [Licence](#-licence)

---

## 🎯 Présentation

Le **Widget Météo Pixel Art** est une appli desktop **Electron** minimaliste, esthétique et interactive : météo **temps réel**, **fonds dynamiques** selon la météo, **mascotte animée** et thermomètre **pixel art**.

---

## 🥅 Objectifs du projet

* Expérience rétro mais moderne en **pixel art**.
* Météo **visuelle et ludique** (backgrounds animés).
* Application **rapide, légère et fonctionnelle**.
* Expérimentation d’**Electron.js** pour le desktop.

---

## ✨ Fonctionnalités

* 📍 **Changement de ville** via boutons
* 💾 **Sauvegarde** des villes (récupération rapide)
* ⛅ **8 styles météo** : ciel clair, nuageux léger, nuageux dense, pluie légère, pluie forte, orage, brouillard, neige
* 🌙 **Mode nuit** + phrase dédiée : *« Nuit noire, esprit clair. »*
* 🖼️ **Backgrounds pixel art** fidèles aux palettes
* 🐾 **Mascotte animée** (sprite sheet)
* 🌡️ **Thermomètre** pixel art (température en temps réel)
* 🔄 **Mise à jour automatique** des données
* 📶 **Mode hors ligne partiel** (dernières données mises en cache)

---

## 🖌️ Design & identité visuelle

* **Style** : Rétro / Pixel Art
* **Dimensions** : `320 × 240 px`
* **Palettes météo (ciel)** :

  * **Ciel clair** : `#87CEEB`, `#FFD700`, `#FFFFFF`
  * **Nuageux léger** : `#B0E0E6`, `#F0F8FF`, `#C0C0C0`
  * **Nuageux dense** : `#A9A9A9`, `#808080`, `#D3D3D3`
  * **Pluie légère** : `#708090`, `#A9A9A9`, `#B0C4DE`
  * **Pluie forte** : `#2F4F4F`, `#00008B`, `#4682B4`
  * **Orage** : `#1C1C1C`, `#4B0082`, `#FFFF00`
  * **Brouillard** : `#DCDCDC`, `#F5F5F5`, `#C0C0C0`
  * **Neige** : `#FFFFFF`, `#E0FFFF`, `#AFEEEE`
* **Mascotte** : animation sprite 6 frames
* **Police** : même typo que **Egg Timer** (projet associé)

---

## 📂 Structure du projet

```
widget-meteo/
├─ assets/
│  ├─ backgrounds/   # fonds pixel art par météo
│  ├─ icons/         # icônes météo + thermomètre
│  └─ sprites/       # sprite de la mascotte
├─ main.js           # processus principal Electron
├─ index.html        # interface utilisateur
├─ style.css         # styles du widget
├─ script.js         # logique + appels API
├─ package.json      # config + scripts
└─ README.md         # documentation
```

---

## ⚙️ Installation

```bash
# Cloner
git clone https://github.com/utilisateur/widget-meteo.git
cd widget-meteo

# Installer les dépendances
npm install

# Lancer en développement
npm start
```

---

## 🔑 Configuration API

Le widget utilise **OpenWeatherMap**.

1. Crée un compte : [https://openweathermap.org/api](https://openweathermap.org/api)
2. Récupère ta **clé API**
3. Dans `script.js`, remplace :

```js
const API_KEY = "TA_CLE_ICI";
```

> Option : charger la clé depuis un fichier `config.js` non versionné (`.gitignore`).

---

## ▶️ Utilisation

* Cliquer sur les **boutons de ville**.
* Les **backgrounds**, **icônes** et **température** se mettent à jour automatiquement.
* En **mode nuit**, un background spécial + une phrase dédiée s’affichent.

---

## 🛠️ Technologies utilisées

* **Electron.js** — Application desktop
* **HTML5 / CSS3** — Interface & styles
* **JavaScript Vanilla** — Logique & API
* **OpenWeatherMap API** — Données météo
* **Pixel Art Design** — Illustrations & animations

---

## 🌍 Villes intégrées par défaut

Compiègne · Paris · Lyon · Marseille · Séoul 🇰🇷 · Daejeon 🇰🇷 · Busan 🇰🇷

---

## 📸 Captures d’écran

*(À ajouter après finalisation du design)*

* Écran principal — ciel clair
* Mode nuit — pluie forte
* Animation mascotte

---

## 📅 Futures améliorations

* 🎵 Effets sonores selon la météo
* 📱 Version responsive pour mobile
* 💾 Mode hors ligne complet (cache météo)
* 🎨 Animations supplémentaires pour la mascotte
* 🌍 Villes favorites illimitées

---

## 📜 Licence

Projet **privé** — usage personnel uniquement.

