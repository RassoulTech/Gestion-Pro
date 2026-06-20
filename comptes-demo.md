# Comptes Démo & Identifiants de Test — GestionPro

Voici la liste des comptes de test et de démonstration générés dans la base de données via le script d'initialisation (`prisma/seed.ts`).

---

## 1. Administrateur Système (ADMIN)
Ce compte unique est autorisé à accéder au tableau de bord d'administration globale (`/admin`).
- **Email** : `dionemhd1@gmail.com`
- **Mot de passe** : `Admin123!`
- **Rôle** : `ADMIN`

---

## 2. Comptes Vendeurs de Démonstration (par Forfait)

### 2.1. Compte Démo Starter (Forfait Gratuit)
- **Email** : `demo.starter@mongestionpro.com`
- **Mot de passe** : `DemoStarter2025!`
- **Rôle** : `VENDEUR`
- **Forfait lié** : `STARTER` (Gratuit, limité à 1 boutique et 15 produits)
- **Boutique par défaut** : *Ma Boutique Starter*

### 2.2. Compte Démo Standard (Forfait Pro)
- **Email** : `demo.standard@mongestionpro.com`
- **Mot de passe** : `DemoStandard2025!`
- **Rôle** : `VENDEUR`
- **Forfait lié** : `PRO` (Payant, jusqu'à 3 boutiques et 40 produits)
- **Boutique par défaut** : *Ma Boutique Standard*

### 2.3. Compte Démo Premium (Forfait Enterprise)
- **Email** : `demo.premium@mongestionpro.com`
- **Mot de passe** : `DemoPremium2025!`
- **Rôle** : `VENDEUR`
- **Forfait lié** : `ENTERPRISE` (Payant, boutiques, produits et membres illimités)
- **Boutique par défaut** : *Ma Boutique Premium*
