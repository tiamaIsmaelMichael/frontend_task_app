# Task Master - Backend

Ce dossier contient le backend de l’application **Task Master**, une application de gestion de tâches moderne et efficace.

## Fonctionnalités

- API RESTful pour la gestion des tâches (CRUD)
- Authentification JWT (JSON Web Token)
- Sécurité des mots de passe avec bcryptjs
- Connexion à une base de données MongoDB
- Middleware CORS pour la communication avec le frontend

## Technologies utilisées

- Node.js
- Express.js
- MongoDB & Mongoose
- JWT (jsonwebtoken)
- bcryptjs
- dotenv
- nodemon (développement)

## Installation

1. **Cloner le dépôt**  
   ```bash
   git clone https://github.com/votre-utilisateur/task-master.git
   cd task-master/backend
   ```

2. **Installer les dépendances**  
   ```bash
   npm install
   ```

3. **Créer un fichier `.env`**  
   Exemple de contenu :
   ```
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. **Lancer le serveur en développement**  
   ```bash
   npm run dev
   ```

   Pour lancer en production :
   ```bash
   npm start
   ```

## Scripts

- `npm run dev` : Démarre le serveur avec nodemon (rechargement automatique)
- `npm start` : Démarre le serveur en mode production

## Structure du projet


Le frontend de **Task Master** est une application React, organisée pour la clarté et la maintenabilité.

```
frontend/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── assets/                # Images, logos, icônes
│   ├── components/            # Composants réutilisables (Sidebar, Footer, Header, etc.)
│   │   ├── Sidebar.jsx
│   │   ├── Sidebar.css
│   │   ├── Footer.jsx
│   │   ├── Footer.css
│   │   └── ...
│   ├── pages/                 # Pages principales (Home, Dashboard, Login, Register, etc.)
│   │   ├── Home.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ...
│   ├── services/              # Fichiers pour les appels API (ex: api.js)
│   ├── App.js                 # Composant racine
│   ├── index.js               # Point d'entrée React
│   ├── index.css              # Styles globaux
│   └── ...
├── package.json
└── README.md

```
backend/
├── models/         # Schémas Mongoose
├── routes/         # Routes Express (API)
├── controllers/    # Logique métier
├── middleware/     # Middlewares personnalisés
├── server.js       # Point d'entrée principal
├── .env            # Variables d'environnement (à créer)
└── package.json
```

## Auteur

- [tiamaIsmaelMichael]

---

**N’hésitez pas à contribuer ou à signaler un bug !**
