# 🧠 Fake News Detector with DistilBERT, FastAPI & React

Ce projet vise à détecter automatiquement les fake news à partir de titres ou d’articles grâce à un modèle DistilBERT finement entraîné pour la classification binaire (real / fake).

L’application combine un backend FastAPI pour l’inférence et une interface React moderne pour interagir facilement avec l’IA. Elle inclut aussi des explications XAI : SHAP et visualisation d’attention pour comprendre les prédictions.

---

## 📌 Objectifs

- Nettoyer et prétraiter le texte.
- Entraîner un modèle DistilBERT pour la classification de fake news.
- Exposer une API RESTful avec FastAPI.
- Afficher une explication XAI avec SHAP (importance des mots).
- Visualiser les cartes d’attention du modèle BERT.

---

## 🛠️ Technologies Utilisées

| Technologie       | Rôle                                                        |
|-------------------|-------------------------------------------------------------|
| 🤖 DistilBERT      | Modèle NLP pour la classification de texte                  |
| ⚡ FastAPI         | Backend de l’API RESTful                                    |
| 🐍 Python          | Langage principal                                           |
| ⚛️ ReactJS         | Frontend interactif                                         |
| 🧩 SHAP            | Explication XAI                                             |
| 🔬 Attention Viz   | Carte thermique des poids d’attention du modèle             |

---

## 📁 Structure du Projet

Voici l’architecture générale de l’application :

![Structure de l'application](docs/App%20structure.png)

---

## 🏗️ Schéma d’Architecture

Voir le schéma complet dans `/docs/architecture.png`.

---

## 🖥️ Interface Utilisateur

- Page d'accueil : `/docs/home.jpg`
- Résultat fake news : `/docs/fake.jpg`
- Résultat réel : `/docs/real.jpg`
- Explication XAI :
  - SHAP :  `/docs/xai.jpg`
  - Attention Viz : `/docs/attention.jpg`

---

## ⚙️ Installation & Lancement

### 1️⃣ Cloner le projet
```bash
git clone https://github.com/hass-sml/fake-news-detector.git
cd fake-news-detector
```
---

### 2️⃣ Installer le backend
```bash
cd backend
python -m venv .venv
```
➡️ Activer l’environnement virtuel :
- Linux / Mac :
```bash
source .venv/bin/activate
```
- Windows :
```bash
.venv\Scripts\activate
```
➡️ Installer les dépendances :
```bash
pip install -r requirements.txt
```
---

### 3️⃣ Lancer le serveur FastAPI

```bash
uvicorn app:app --reload
``` 

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs

---

### 4️⃣ Installer et lancer le frontend
```bash
cd ../frontend
npm install
npm run dev
```
- Frontend: http://localhost:5173

---

## 📮 Exemple d’appel API
```curl
curl -X POST "http://localhost:8000/predict" \
  -H "Content-Type: application/json" \
  -d '{"text": "Moroccan King Hassan II is expanding renewable energy to Tanzania in 2030."}'
```
Réponse attendue :
```
{
  "prediction": "fake",
  "probability": 0.98,
  "tokens": ["Moroccan", "King", "Hassan", "II", ...],
  "scores": [0.1, 0.3, -0.5, ...]
}
```
---

## 🎓 Fonctionnalités XAI

- SHAP : importance de chaque mot.
- Attention Viz : visualisation des poids d’attention du modèle.

---

## 👨‍💻 Auteur

El Hassan SEMLALI  
_NLP & Fake News Guardian_

---

💙 Merci d’utiliser ce projet pour lutter contre la désinformation.
