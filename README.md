🌤️ Widget Météo Pixel Art

📑 Table des matières

Présentation

Objectifs du projet

Fonctionnalités

Design et identité visuelle

Structure du projet

Installation

Configuration API

Utilisation

Technologies utilisées

Villes intégrées par défaut

Captures d’écran

Futures améliorations

Licence

🎯 Présentation
Le Widget Météo Pixel Art est une application desktop développée avec Electron.js, combinant un affichage météo en direct et un design rétro inspiré du pixel art.
Il se veut minimaliste, esthétique et interactif, avec des animations, des fonds dynamiques selon la météo, et une mascotte animée.

🥅 Objectifs du projet
Proposer une expérience rétro mais moderne en pixel art.

Offrir une météo visuelle et ludique grâce à des backgrounds animés.

Créer une application rapide, légère et fonctionnelle.

Expérimenter Electron.js pour la création d’applications desktop.

✨ Fonctionnalités
📍 Changement de ville via boutons.

💾 Sauvegarde des villes pour les retrouver facilement.

⛅ Météo dynamique avec 8 styles :

Ciel clair

Nuageux léger

Nuageux dense

Pluie légère

Pluie forte

Orage

Brouillard

Neige

🌙 Mode nuit avec icône et phrase personnalisée :

"Nuit noire, esprit clair."

🖼️ Backgrounds pixel art fidèles aux palettes définies.

🐾 Mascotte animée via sprite sheet.

🌡️ Thermomètre pixel art affichant la température en temps réel.

🔄 Mise à jour automatique des données météo.

📶 Mode hors ligne partiel (affiche les dernières données enregistrées).

🖌️ Design et identité visuelle
Style : Rétro / Pixel Art
Dimensions du widget : 320 × 240 px
Palette météo :

Ciel clair → #87CEEB, #FFD700, #FFFFFF

Nuageux léger → #B0E0E6, #F0F8FF, #C0C0C0

Nuageux dense → #A9A9A9, #808080, #D3D3D3

Pluie légère → #708090, #A9A9A9, #B0C4DE

Pluie forte → #2F4F4F, #00008B, #4682B4

Orage → #1C1C1C, #4B0082, #FFFF00

Brouillard → #DCDCDC, #F5F5F5, #C0C0C0

Neige → #FFFFFF, #E0FFFF, #AFEEEE

Mascotte : Animation sprite en 6 frames.
Police : Même typographie que le projet Egg Timer.

📂 Structure du projet
bash
Copier
Modifier
widget-meteo/
│
├── assets/
│   ├── backgrounds/       # Fonds pixel art par météo
│   ├── icons/             # Icônes météo et thermomètre
│   ├── sprites/           # Sprite de la mascotte
│
├── main.js                # Fichier principal Electron
├── index.html             # Interface utilisateur
├── style.css              # Styles du widget
├── script.js              # Logique et gestion API
├── package.json           # Config et dépendances
└── README.md              # Documentation
⚙️ Installation
Cloner le projet

bash
Copier
Modifier
git clone https://github.com/utilisateur/widget-meteo.git
cd widget-meteo
Installer les dépendances

bash
Copier
Modifier
npm install
Lancer en mode développement

bash
Copier
Modifier
npm start
🔑 Configuration API
Ce projet utilise OpenWeatherMap API.

Crée un compte sur https://openweathermap.org/api.

Récupère ta clé API.

Dans script.js, remplace :

javascript
Copier
Modifier
const API_KEY = "TA_CLE_ICI";
▶️ Utilisation
Clique sur les boutons de changement de ville.

Les backgrounds, icônes et température se mettent à jour automatiquement.

En mode nuit, un background spécial et une phrase dédiée s’affichent.

🛠️ Technologies utilisées
Electron.js – Application desktop

HTML5 / CSS3 – Structure et design

JavaScript Vanilla – Logique et API

OpenWeatherMap API – Données météo

Pixel Art Design – Illustrations et animations

🌍 Villes intégrées par défaut

Compiègne

Paris

Lyon

Marseille

Séoul 🇰🇷

Daejeon 🇰🇷

Busan 🇰🇷

📸 Captures d’écran
(À insérer après la finalisation du design)

Écran principal – Ciel clair

Mode nuit – Pluie forte

Animation mascotte

📅 Futures améliorations
🎵 Effets sonores selon la météo.

📱 Version responsive pour mobile.

💾 Mode hors ligne complet avec cache météo.

🎨 Plus d’animations pour la mascotte.

🌍 Ajout de villes favorites illimitées.

📜 Licence
Projet privé – Usage personnel uniquement.
