# Donjon de Grodor

**Donjon de Grodor** est un petit jeu web/mobile humoristique en français, basé sur le hasard, les runs courts et les humiliations répétées d’un héros pas vraiment qualifié.

Le joueur incarne **Grodor**, un personnage massif, naïf et obstiné, envoyé dans un donjon qui semble avoir été conçu pour tester sa dignité plus que ses compétences.

Le jeu est actuellement en développement.

---

## Jouer au jeu

Version web jouable :

**https://doctox.github.io/donjon-de-hodor/**

Nom officiel du projet :

**Donjon de Grodor**

Nom historique de développement :

**Le Donjon de Hodor**

---

## Concept

Donjon de Grodor est un jeu de type **rogue-lite / gamble humoristique**.

Chaque run repose sur une part importante d’aléatoire :

- nombre d’étages ;
- portes ;
- événements ;
- combats ;
- mini-jeux ;
- objets ;
- gains de pièces d’or ;
- humiliations ;
- sorties miraculeuses.

Le but n’est pas de prouver que le joueur est fort.

Le but est de survivre au chaos, accumuler des pièces, améliorer Grodor, gonfler sa gloire ridicule et recommencer après chaque catastrophe.

---

## Boucle de jeu

La boucle principale est simple :

1. Grodor quitte sa cellule.
2. Il entre dans le donjon.
3. Il choisit des portes et subit des événements aléatoires.
4. Il affronte des monstres ou des mini-jeux.
5. Il trouve, casse, revend ou subit des objets.
6. Il meurt honteusement ou sort miraculeusement.
7. Il revient au village.
8. Il améliore ses chances avant de repartir.

---

## Fonctionnalités actuelles

Le jeu contient déjà :

- une interface jouable sur mobile ;
- une boucle de run ;
- un village ;
- une banque ;
- une échoppe ;
- un comptoir de revente ;
- un panneau de statistiques ;
- des combats ;
- des mini-jeux ;
- un inventaire ;
- des objets avec effets et descriptions ;
- des monstres ;
- des améliorations permanentes ;
- une sauvegarde locale ;
- une base Supabase préparée pour certaines fonctionnalités en ligne.

---

## Statistiques

Le joueur peut suivre plusieurs statistiques de carrière, notamment :

- sorties miraculeuses ;
- humiliations ;
- pièces d’or planquées ;
- dignité estimée.

Le jeu prévoit aussi une logique de **Gloire Grodorienne**, pensée comme un score de carrière.

Cette gloire ne mesure pas le talent pur du joueur. Elle mesure plutôt la quantité totale d’absurdité traversée par Grodor.

---

## Objets

Les objets sont à la fois mécaniques et humoristiques.

Exemples d’objets :

- **Casque Trop Petit**
- **Slip de Guerre**
- **Médaillon du Presque-Héros**
- **Sandales de Panique**
- **Hache Émoussée**
- **Boulet au Pied**
- **Chaussette Porte-Bonheur**
- **Caillou Affectif**
- **Cape Trop Longue**
- **Gants Collants**

Certains objets aident réellement.  
D’autres sont douteux.  
Certains sont probablement là pour nuire à la dignité de Grodor.

---

## Progression permanente

Entre les runs, le joueur peut améliorer Grodor avec des bonus permanents.

Exemples d’améliorations :

- **Cardio Tragique**
- **Colis Suspect**
- **Instinct Presque Fiable**
- **Réflexes de Lâche**
- **Lecture de Porte**

Ces améliorations restent dans le ton du jeu : elles peuvent aider, mais elles ne rendent jamais Grodor réellement compétent.

---

## Direction artistique

Le jeu utilise une direction artistique :

- cartoon ;
- lisible ;
- mobile-first ;
- volontairement naïve ;
- centrée sur l’humour et les situations absurdes.

Les assets incluent :

- sprites de Grodor ;
- poses du personnage ;
- décors de donjon ;
- village ;
- portes ;
- arène ;
- objets ;
- monstres ;
- interface utilisateur.

---

## Technologies utilisées

Le projet est développé en web statique avec :

- HTML ;
- CSS ;
- JavaScript ;
- GitHub Pages ;
- Supabase préparé pour certaines fonctionnalités.

---

## Structure générale du projet

```txt
index.html              Interface principale du jeu
styles.css              Mise en forme et responsive mobile
script.js               Boucle principale, état du jeu, sauvegarde, village
events.js               Événements aléatoires
items.js                Objets et effets
monsters.js             Monstres, récompenses et danger
upgrades.js             Améliorations permanentes
supabase-config.js      Configuration Supabase
assets/                 Images, sprites, décors, objets, monstres et UI
```
---

## Statut du projet

Le jeu est en prototype avancé jouable.

---

## Publication envisagée

Pistes envisagées :

version web publique ;
Google Play à terme ;
itch.io comme vitrine secondaire ;
pack de soutien ;
cosmétiques optionnels.

Le projet ne vise pas une monétisation agressive.
L’objectif est de conserver un jeu honnête, drôle et accessible.

---

## Création et crédits

Créateur / porteur du projet : Jean-Marie PEETERS

Le projet a été conçu, dirigé, arbitré, assemblé et validé par Jean-Marie PEETERS.

Le développement, la rédaction, certaines idées de structuration, l’assistance technique et la génération/itération de contenus ont été réalisés avec l’aide de services OpenAI, notamment ChatGPT et Codex.

Cette mention est volontairement conservée par transparence sur le mode de création du projet.

---

## Domaine et contact

Nom de domaine officiel :

donjondegrodor.fr

Adresse de contact :

contact@donjondegrodor.fr

---

## Droits

© 2026 Jean-Marie PEETERS — Donjon de Grodor. Tous droits réservés.

Les visuels, textes, personnages, logos, assets, mécaniques spécifiques, descriptions d’objets et éléments originaux du projet ne peuvent pas être reproduits ou réutilisés sans autorisation.
