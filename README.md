# The-pointeuse-2000
Description du projet : Application de pointage (Pointeuse)

Ce projet consiste à développer une application de pointage basée sur une navigation par calendrier. Depuis le menu principal, l'utilisateur pourra consulter un calendrier rétrospectif global. Un simple clic sur une date permettra d'afficher ou d'éditer les détails de la journée (heures travaillées, temps de pause, frais, etc.).

Lors de la sélection d'un jour, un formulaire de saisie s'ouvrira pour renseigner :

- L'heure de prise de poste et de fin de service.

- Les temps de coupure et de pause.

- L'adresse du lieu d'intervention.

- Les frais annexes (cases à cocher "Repas" et "Péage" associées à des champs de commentaires libres).

Le menu principal intégrera également un tableau de bord affichant le cumul des heures hebdomadaires et mensuelles, ainsi qu'un décompte dynamique partant d'un objectif de 507 heures. Enfin, l'application proposera des fonctionnalités de sauvegarde locale et d'exportation des données.

Cahier des charges et contraintes techniques :

- Interface : Calendrier rétrospectif interactif (similaire aux calendriers natifs sur smartphone ou PC).

- Saisie des temps : Heures de début/fin, coupures et pauses repas.

- Localisation : Champ dédié à l'adresse du lieu de travail.

- Frais professionnels : Cases à cocher (Repas / Péage) avec zones de texte facultatives.

- Suivi du temps : Affichage du total des heures par semaine et par mois.

- Objectif cible : Décompte dynamique de 507h jusqu'à 0h.

- Gestion des données : Sauvegarde au format JSON et export des données (format Excel, CSV, etc.).