# MCP Server Google

Un serveur MCP développé en TypeScript qui permet d'accéder à vos emails Gmail et à votre agenda Google Calendar de manière sécurisée.

## 🚀 Fonctionnalités

- **📧 Récupération d'emails** : Accès aux 10 derniers emails de votre boîte Gmail
- **📅 Consultation d'agenda** : Récupération des événements du jour depuis Google Calendar
- **🔐 Authentification OAuth2** : Sécurisation via l'API Google OAuth2
- **🛡️ Gestion des tokens** : Sauvegarde automatique des tokens d'authentification

## 🛠️ Technologies utilisées

- **TypeScript** - Langage de développement
- **Node.js** - Runtime JavaScript
- **Google APIs** - Gmail et Calendar APIs
- **MCP SDK** - Model Context Protocol
- **OAuth2** - Authentification sécurisée

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- Compte Google avec Gmail et Calendar activés
- Projet Google Cloud Platform avec les APIs activées

## ⚙️ Installation

1. **Cloner le repository**

   ```bash
   git clone <repository-url>
   cd MCP-Server-Google
   ```

2. **Installer les dépendances**

   ```bash
   npm install
   ```

3. **Configuration Google Cloud Platform**

   - Créer un projet sur [Google Cloud Console](https://console.cloud.google.com/)
   - Activer les APIs Gmail et Google Calendar
   - Créer des identifiants OAuth2
   - Télécharger le fichier de configuration

4. **Configuration des variables d'environnement**
   Créer un fichier `.env` à la racine du projet :
   ```env
   GOOGLE_CLIENT_ID=votre_client_id
   GOOGLE_CLIENT_SECRET=votre_client_secret
   GOOGLE_REDIRECT_URI=votre_callback_uri
   ```

## 🚀 Utilisation

### Démarrage du serveur

```bash
npm run dev
```

### Authentification

1. Le serveur démarre demandez pour vous connectez, cela vous retournera une URL
2. Ouvrir l'URL dans votre navigateur
3. Autoriser l'accès à vos données Google
4. Le token est automatiquement sauvegardé

## 📁 Structure du projet

```

MCP-Server-Google/
├── config/
│ └── google-config.ts # Configuration Google OAuth2
├── helpers/
│ └── html-helper.ts # Utilitaires pour le nettoyage HTML
├── src/
│ └── server.ts # Serveur MCP principal
├── dist/ # Code compilé
├── token.json # Tokens d'authentification (généré)
├── .env # Variables d'environnement
└── package.json

```

## 🔧 Configuration des APIs Google

### APIs requises

- **Gmail API** : Pour accéder aux emails
- **Google Calendar API** : Pour accéder à l'agenda
- **Google+ API** : Pour les informations de profil

### Scopes OAuth2

- `https://www.googleapis.com/auth/gmail.readonly`
- `https://www.googleapis.com/auth/calendar.readonly`
- `openid`, `profile`, `email`

## 🔒 Sécurité

- Authentification OAuth2 sécurisée
- Tokens stockés localement
- Accès en lecture seule aux données
- Pas de stockage de mots de passe

## 📝 Exemples d'utilisation

### Via MCP Client

```typescript
// Authentification
const url = await mcpClient.callTool("getAuthUrl");

// Récupération d'emails
const emails = await mcpClient.callTool("getMyGmail");

// Récupération d'agenda
const calendar = await mcpClient.callTool("getMyCalendar");
```

## 🐛 Dépannage

### Problème d'authentification

- Vérifier que le fichier `.env` est correctement configuré
- S'assurer que les APIs Google sont activées
- Vérifier que l'URL de redirection correspond à la configuration

### Erreur de token

- Supprimer le fichier `token.json` et réauthentifier
- Vérifier que le token n'a pas expiré
