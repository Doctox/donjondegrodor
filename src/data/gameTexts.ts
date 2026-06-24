/*
 * Source unique des textes visibles joueur.
 * Toute nouvelle phrase affichée à l’écran doit être ajoutée ici.
 * Les fichiers de scène/système ne doivent pas contenir de texte joueur en dur.
 */

/*
 * Convention:
 * - garder les textes en français ;
 * - garder le ton Grodor ;
 * - histoire/message = narration ;
 * - effectLabel = effet mécanique court ;
 * - ne pas mélanger texte narratif et effet mécanique.
 */

export const GAME_TEXTS = {
  hud: {
    life: "Vie",
    gold: "PO",
    attempt: "Tentative",
    floor: "Etage"
  },
  common: {
    continue: "Continuer",
    close: "Fermer",
    yes: "Oui",
    no: "Non",
    loading: "Chargement...",
    loadingProgress: (percent: number) => `Chargement... ${percent}%`,
    clickToStart: "Clique pour commencer"
  },
  mobile: {
    fullscreenButton: "Plein ecran"
  },
  inventory: {
    title: "Inventaire",
    empty: "Rien. Meme la poussiere est partie.",
    equipmentSelectedFallback: "Clique un objet equipe pour voir son nom.",
    descriptionFallback: "Description a venir.",
    unknownItem: (itemId: string) => itemId,
    equipmentSlotLabels: {
      weapon: "Armes",
      helmet: "Casques",
      amulet: "Collier",
      gloves: "Gants",
      boots: "Bottes",
      object: "Objets",
      cape: "Cape",
      belt: "Ceinture"
    }
  },
  itemEffects: {
    axeDamage: "Hache: +1 degat.",
    tinyHelmetBlock: "Casque: BLOQUE.",
    almostHeroMedallionSave: "Collier: SURVIT.",
    stickyGlovesGold: (gold: number) => `Gants Collants: +${gold} PO.`,
    mouflesReflexionFatigue: "Moufles de Réflexion : l'adversaire fatigue.",
    quarterHourCapeDelay: "Cape du Quart d'Heure : le danger prend du retard.",
    panicSandalsBlock: "Sandales de Panique: -1 coeur perdu.",
    ankleBallSlow: "Boulet au Pied: Grodor va moins vite.",
    emotionalPebbleHeal: "Objet: SOIGNE.",
    comboNoBreak: "COMBO: NE CASSE PAS.",
    comboHeal: "COMBO: SOIGNE.",
    comboMaxLife: "COMBO: +1 coeur.",
    megaComboNoBreak: "MEGA COMBO: NE CASSE PAS.",
    megaComboHeal: "MEGA COMBO: SOIGNE.",
    megaComboSurvive: "MEGA COMBO: REFUSE LA MORT.",
    itemBroke: (itemName: string) => `${itemName} casse.`,
    combined: (messages: string[]) => messages.join(" ")
  },
  miniGames: {
    lootChest: {
      title: "Coffre douteux",
      clickInstruction: "Clique le coffre pour forcer la serrure.",
      delayedClickHint: "CLIQUE !",
      exitHint: "Clique pour retourner a la tour",
      opening: "La cle gratte, coince, insiste.",
      rarity: (rarity: string) => `Rarete: ${rarity}`,
      lootObtained: (itemName: string) => `Trouvaille: ${itemName}`,
      allOwnedFallback: (gold: number) => `Tout est deja dans le sac. Grodor recupere ${gold} PO.`,
      duplicateFallback: "Grodor possede deja ce stuff. Il le laisse dans le coffre.",
      replacementChoice: {
        title: "Slot deja occupe",
        current: (itemName: string) => `Equipe: ${itemName}`,
        incoming: (itemName: string) => `Nouveau: ${itemName}`,
        keepButton: "Garder",
        replaceButton: "Remplacer",
        keepResult: "Grodor garde l'ancien equipement.",
        replaceResult: (itemName: string) => `Grodor equipe ${itemName}.`
      },
      continueButton: "Continuer",
      rarityLabels: {
        common: "commun",
        rare: "rare",
        epic: "epique",
        legendary: "legendaire"
      }
    },
    coinFlip: {
      title: "Pile ou Face",
      intro: "Une piece attend une mauvaise decision.",
      noGold: "Grodor n'a pas une seule PO a miser.",
      chooseBet: (gold: number) => `Mise: ${gold} PO`,
      chooseSide: "Choisis Pile ou Face.",
      pileButton: "Pile",
      faceButton: "Face",
      betMinus: "-",
      betPlus: "+",
      throwing: "La piece tourne trop vite pour etre honnete.",
      win: (gold: number) => `Gagne: +${gold} PO`,
      lose: (gold: number) => `Perdu: -${gold} PO`,
      resultPile: "Resultat: Pile",
      resultFace: "Resultat: Face",
      exitHint: "Clique pour retourner a la tour",
      resultPanel: {
        title: "Pile ou Face",
        message: (side: "pile" | "face") => `La piece tombe sur ${side === "pile" ? "Pile" : "Face"}.`
      }
    },
    bonneteau: {
      title: "Bonneteau",
      instruction: "Choisis une carte.",
      delayedClickHint: "CLIQUE !",
      delayedExitHint: "Clique pour retourner a la tour",
      revealed: "Carte revelee.",
      grodor: "Grodor respire mieux: +1 coeur max.",
      grodorMax: "Grodor est deja assez gonfle.",
      gold: "Trouvaille: +10 PO.",
      skull: "Crane: -1 coeur.",
      piercedPouch: (gold: number) => `Bourse percee: -${gold} PO.`,
      piercedPouchEmpty: "Bourse percee, mais deja vide."
    },
    slotMachine: {
      title: "Machine a sous",
      intro: "Une machine promet presque quelque chose.",
      instruction: "Clique la machine pour lancer les rouleaux.",
      delayedClickHint: "CLIQUE !",
      exitHint: "Clique pour retourner a la tour",
      spinning: "Les rouleaux trichent en cadence.",
      neutral: "Rien. Meme la machine semble decue.",
      goldThree: "Trois PO: +15 PO.",
      goldTwo: "Deux PO: +5 PO.",
      grodorThree: "Trois Grodor: coffre bonus.",
      grodorTwo: "Deux Grodor: +1 coeur max.",
      grodorMax: "Grodor est deja assez gonfle.",
      skullThree: "Trois cranes: mort directe.",
      skullTwo: "Deux cranes: -1 coeur.",
      pouch: (gold: number) => `Trois bourses vides: -${gold} PO.`,
      pouchMaxLife: "Trois bourses vides sans PO: -1 coeur max.",
      pouchEmpty: "Bourse vide, mais deja vide.",
      pouchTwo: (gold: number) => `Deux bourses vides: -${gold} PO.`,
      symbolLabels: {
        grodor: "Grodor",
        gold: "PO",
        skull: "Crane",
        pouch: "Bourse"
      }
    },
    dodgeChest: {
      title: "Coffre Esquive",
      intro: "Un coffre attend que Grodor soit pret.",
      instruction: "Clique Pret pour commencer.",
      readyButton: "Pret",
      target: (current: number, total: number) => `Bulle ${current}/${total}: clique vite !`,
      success: "Esquive reussie: +10 PO.",
      lateFailure: "Trop tard. Le coffre a vise large.",
      failure: "Rate: -1 coeur.",
      exitHint: "Clique pour retourner a la tour"
    },
    jump: {
      title: "Course au saut",
      intro: "Grodor court tout seul. Il faut cliquer Jump au bon moment.",
      instruction: "Grodor file vers le trou. Clique Jump juste avant le vide.",
      tip: "Chaque chute coute 1 coeur. Tant qu'il respire, il recommence.",
      jumpButton: "Jump",
      countdownStatus: "Prepare-toi...",
      countdown: (value: number) => `${value}`,
      jumping: "Le saut part. Grodor mise tout sur ses genoux.",
      success: "Grodor franchit le trou: +10 PO.",
      successDetail: (lostHearts: number) =>
        lostHearts > 0 ? `Il y laisse ${lostHearts} coeur(s), mais passe quand meme.` : "Saut propre. Fierte douteuse, bourse plus lourde.",
      retry: () => "Grodor tombe. Il recommence tant qu'il lui reste un coeur.",
      retryDetail: "Retour au depart. Le trou ricane doucement.",
      chancesLeft: (chancesLeft: number) => `${chancesLeft} coeur(s) restant(s): encore une tentative.`,
      failure: "Grodor tombe une derniere fois.",
      failureDetail: (lostHearts: number) => `Le trou gagne: -${lostHearts} coeur(s).`,
      exitHint: "Clique pour retourner a la tour"
    },
    armWrestling: {
      title: "Bras de fer",
      intro: "Un adversaire pose le coude. Grodor regrette deja.",
      countdownStatus: "Prepare ton doigt...",
      countdown: (value: number) => `${value}`,
      instruction: "Tape vite sur le bouton !",
      effort: "Grodor pousse. Le bras adverse pousse aussi.",
      success: "Victoire au bras de fer: +1 coeur max.",
      failure: "Grodor plie le bras: -1 coeur max.",
      exitHint: "Clique pour retourner a la tour"
    },
    tugOfWar: {
      title: "Tir a la corde",
      intro: "Grodor attrape la corde. Le boss a l'air beaucoup trop serein.",
      countdown: (value: number) => `${value}`,
      success: "Grodor tire le boss !",
      failure: "Le boss reprend la corde.",
      exitHint: "Clique pour retourner a la tour"
    },
    elevator: {
      title: "Ascenseur douteux",
      intro: "Le gardien de l'ascenseur tend la main vers le levier.",
      countdownStatus: "Prepare le timing...",
      countdown: (value: number) => `${value}`,
      instruction: "Stoppe le curseur au bon moment.",
      success: "Descente brutale: -2 etages.",
      neutral: (gold: number) => `Pourboire du gardien: -${gold} PO.`,
      neutralEmpty: "Le gardien reclame un pourboire, mais la bourse est vide.",
      failure: "Mauvais levier: +2 etages.",
      resultFloorDown: "-1 etage",
      resultFloorUp: "+1 etage",
      floorDown: (amount: number) => `Ascenseur: -${amount} etage(s).`,
      floorUp: (amount: number) => `Ascenseur: +${amount} etage(s).`,
      exitHint: "Clique pour retourner a la tour"
    }
  },
  result: {
    score: (score: number) => `Score : +${score}`,
    defeatBreakdownTitle: "Bilan de cette tentative",
    victoryBreakdownTitle: "Bilan de cette sortie",
    scoreLabels: {
      gloire: "Gloire",
      souffrance: "Souffrance",
      avidite: "Avidite",
      obstination: "Obstination",
      total: "Score grodorien"
    },
    buttons: {
      cell: "Retour geole",
      village: "Retour village"
    }
  },
  dungeon: {
    title: "Donjon",
    initialLastEvent: "Choisis une porte.",
    chooseDoor: "Choisis une porte pour continuer la run.",
    chooseDoorStatus: "Cliquer sur door_1, door_2 ou door_3 pour ouvrir une porte.",
    grodorSpawn: (x: number, y: number) => `Grodor au spawn: ${x}, ${y}`,
    spawnMissing: "spawn_grodor_start introuvable",
    doorReached: (doorIndex: string) => `porte ${doorIndex} atteinte`,
    doorOpened: (doorIndex: string) => `Porte ${doorIndex} ouverte`,
    pathMissing: (doorName: string) => `Aucun chemin Tiled pour ${doorName}.`,
    pathInProgress: (doorName: string) => `${doorName}: chemin Tiled en cours...`,
    returningToSpawn: "Grodor revient au point de depart.",
    nextFloorStatus: (floor: number) => `Etage ${floor}: choisis une porte.`,
    combatDebugStatus: (monsterId: string) => `Combat debug: ${monsterId}.`,
    combatWonStatus: "Combat gagne.",
    runEndedStatus: "Run terminee.",
    exitReachedStatus: "Sortie atteinte.",
    exitReachedTitle: "Sortie atteinte",
    exitReachedMessage: "Grodor apercoit enfin l'air libre.",
    exitReachedEffect: "Run terminee",
    cowardReflexTriggered: "Reflexes de Lache: coeur sauve.",
    tragicCardioTriggered: "Cardio Tragique: +1 coeur max.",
    pvDelta: (amount: number) => `${amount > 0 ? "+" : "-"}${Math.abs(amount)} PV`,
    poDelta: (amount: number, sign: "+" | "-" = amount >= 0 ? "+" : "-") => `${sign}${Math.abs(amount)} PO`
  },
  village: {
    title: "Village",
    arrivedFromDungeon: "Grodor revient du donjon.",
    chooseBuilding: "Choisis un lieu du village.",
    movingTo: (buildingName: string) => `Grodor va vers ${buildingName}.`,
    missingPath: (target: string) => `Chemin village introuvable: ${target}.`,
    bank: {
      label: "la banque",
      title: "Banque",
      message: "La banque garde les PO au chaud.",
      effectLabel: "Reserve permanente",
      carriedGold: (gold: number) => `PO portees: ${gold}`,
      bankGold: (gold: number) => `Banque: ${gold} PO`,
      depositSuccess: (gold: number) => `Depot reussi: ${gold} PO rangees.`,
      nothingToDeposit: "Rien a deposer.",
      bankerTitle: "Mr.Gold le Banquier",
      depositButton: "Déposer",
      exitButton: "Sortir"
    },
    shop: {
      label: "l'echoppe",
      title: "Echoppe",
      marcelTitle: "Marcel",
      marcelResellerTitle: "Marcel le Revendeur",
      marcelMessage: "Marcel trie ses merveilles avec un serieux douteux.",
      objectsButton: "Objets",
      passivesButton: "Passifs",
      resellButton: "Revendre",
      soon: "Bientot",
      upgradesButton: "Ameliorations",
      backToMarcel: "Retour Marcel",
      message: "Les stuffs ramenes vivants attendent leur heure.",
      effectLabel: "Bientot",
      emptyDiscoveries: "Aucun stuff decouvert pour l'instant.",
      comingSoon: "Disponible bientot",
      bankGold: (gold: number) => `Banque: ${gold} PO`,
      price: (gold: number) => `${gold} PO`,
      buyButton: "Acheter",
      ownedCount: (count: number) => `Possede : ${count}`,
      countBadge: (count: number) => `x${count}`,
      notEnoughGold: "Pas assez d'or en banque.",
      buySuccess: (itemName: string) => `${itemName} ajoute au coffre.`,
      shopTitle: "BOUTIQUE",
      goldAmount: (gold: number) => `${gold}`,
      page: (current: number, total: number) => `${current}/${total}`,
      rarity: (rarity: string) => `Rarete : ${rarity}`,
      statsTitle: "Stats",
      descriptionTitle: "Description",
      soldLabel: "Vendu",
      tooExpensive: "Trop cher",
      unavailable: "Indisponible",
      locked: "Verrouille",
      lockedPrice: "???",
      lockedDescription: "A decouvrir dans la tour",
      selectItemPrompt: "Selectionne un objet.",
      itemStats: (slot: string, count: number, breakChance: number) =>
        `Slot : ${slot}  |  Possede : ${count}  |  Casse : ${breakChance}%`,
      itemStatsUnavailable: "Stats indisponibles.",
      slotLabels: {
        weapon: "Arme",
        helmet: "Casque",
        amulet: "Amulette",
        cape: "Cape",
        gloves: "Gants",
        boots: "Bottes",
        object: "Objet",
        belt: "Ceinture"
      },
      permanentUpgradesTitle: "Ameliorations permanentes",
      passiveShopTitle: "Ameliorations passives",
      dressingName: "Dressing de Survie",
      dressingLevel: (level: number) => `Niveau ${level}/3`,
      dressingEffect: (maxItems: number) => `Depart: ${maxItems} stuffs`,
      dressingNextPrice: (gold: number) => `Prochain niveau: ${gold} PO`,
      dressingMax: "Max",
      dressingBuySuccess: (level: number, maxItems: number) => `Dressing niveau ${level}. Grodor peut partir avec ${maxItems} stuffs.`,
      cowardReflexName: "Reflexes de Lache",
      cowardReflexEffect: (percent: number) => `${percent}% d'eviter un coeur perdu.`,
      cowardReflexBuySuccess: (level: number, percent: number) => `Reflexes niveau ${level}. Grodor esquive la honte a ${percent}%.`,
      tragicCardioName: "Cardio Tragique",
      tragicCardioEffect: (percent: number) => `${percent}% d'obtenir +1 coeur max.`,
      tragicCardioBuySuccess: (level: number, percent: number) => `Cardio niveau ${level}. Depart heroique a ${percent}%.`,
      almostReliableInstinctName: "Instinct Presque Fiable",
      almostReliableInstinctEffect: "Effet a venir.",
      doorReadingName: "Lecture de Porte",
      doorReadingEffect: (percent: number) => `${percent}% de lire une porte.`,
      doorReadingBuySuccess: (level: number, percent: number) => `Lecture niveau ${level}. Grodor lit les portes a ${percent}%.`,
      passiveCurrentEffect: (effect: string) => `Niveau actuel : ${effect}`,
      passiveNextEffect: (effect: string) => `Niveau suivant : ${effect}`,
      passiveCost: (gold: number) => `Cout : ${gold} PO`,
      passiveNoNextEffect: "Niveau suivant : Niveau max",
      passiveComingSoon: "Disponible bientot.",
      upgradeButton: "Ameliorer",
      tooExpensiveUpgrade: "Trop cher",
      maxLevel: "Niveau max"
    },
    tavern: {
      label: "la taverne",
      title: "Taverne",
      message: "Une nouvelle run attend Grodor.",
      confirmMessage: "Lancer une nouvelle run ?",
      effectLabel: "Nouvelle run",
      drinkConfirm: "Es-tu sûr de vouloir boire cette bière ?",
      movingToDrink: "Grodor va vers le comptoir.",
      movingToExit: "Grodor cherche la sortie.",
      backAtBeer: "Grodor repose la chope. Pour l'instant.",
      tooMuchCarriedEquipment: (extraCount: number) =>
        `Attention : vous avez ${extraCount} stuff en trop sur vous.\nAllez a la maison de Grodor pour poser l'equipement en trop.`,
      wakeUpMessage: "Grodor se réveille avec un mal de tête.\nLa porte de la cellule a l’air mal fermée.\nAide-le à sortir."
    },
    grodorHouse: {
      label: "la maison de Grodor",
      title: "Maison de Grodor",
      message: "Le coffre permanent de Grodor.",
      effectLabel: "Coffre permanent",
      empty: "Le coffre de Grodor est vide. Meme la poussiere a demenage.",
      selectedItemFallback: "Choisis un objet du coffre.",
      chestTitle: "Coffre",
      loadoutTitle: "Depart",
      addedToLoadout: (itemName: string) => `${itemName} prepare pour le depart.`,
      removedFromLoadout: (itemName: string) => `${itemName} retourne au coffre.`,
      depositedCarriedEquipment: (itemName: string) => `${itemName} range dans le coffre.`,
      limitReached: "Grodor porte deja trop de trucs pour partir.",
      notEnoughCopies: "Pas assez d'exemplaires dans le coffre.",
      notEquipment: "Ce truc ne se porte pas vraiment.",
      removeEquipmentBeforeLeaving: "Retire un equipement dans la maison avant de partir.",
      startLimit: (current: number, max: number) => `${current}/${max}`
    },
    board: {
      label: "le panneau",
      title: "Panneau",
      message: "Les exploits discutables de Grodor.",
      effectLabel: "Stats grodoriennes",
      statLabels: {
        sortiesReussies: "Sorties reussies",
        combatsGagnes: "Combats gagnes",
        miniJeuxReussis: "Mini-jeux reussis",
        humiliations: "Humiliations",
        degatsSubis: "Degats subis",
        mortsRidicules: "Morts ridicules",
        poGagnes: "PO gagnees",
        objetsRamasses: "Objets ramasses",
        runsTotal: "Runs total",
        etagesVisites: "Etages visites",
        scoreGrodorienTotal: "Score grodorien total"
      }
    }
  },
  doorHints: {
    danger: "Danger",
    gain: "Gain",
    combat: "Combat",
    minigame: "Jeu",
    calm: "Rien",
    exit: "Sortie"
  },
  finalDoor: {
    escape: {
      title: "Sortie trouvee",
      message: "Grodor voit enfin l'air libre.",
      effectLabel: "Sortie"
    },
    bruise: {
      title: "Derniere porte brutale",
      message: "La sortie se defend encore. Grodor encaisse le choc.",
      effectLabel: "-1 coeur"
    },
    trap: {
      title: "Piege final",
      message: "La derniere porte frappe Grodor deux fois plus fort.",
      effectLabel: "-2 coeurs"
    }
  },
  legacyRun: {
    initialEvent: "Grodor cherche une sortie.",
    leftDoor: "Derriere la porte gauche : une bourse de 7 PO.",
    centerDoor: "La porte centrale grince. Piege mineur, etage suivant.",
    rightDoor: "La porte droite mene plus loin, avec 3 PO oubliees."
  },
  cell: {
    imprisoned: "Grodor est encore enferme.",
    behindBars: "Grodor attend derriere les barreaux.",
    clickToStart: "Clique sur la geole pour lancer la run."
  },
  combat: {
    chooseZone: "Choisis ou Grodor doit frapper.",
    clickHint: "Clique !",
    exitHint: "Clique pour retourner a la tour",
    temporaryDefeat: "Defaite temporaire.\nGrodor tombe au sol.",
    stunnedReturn: "Grodor revient sonne du combat.",
    closedToCell: "Combat ferme.\nRetour a la geole.",
    ratDamage: (zoneLabel: string, monsterName: string) => `Grodor frappe ${zoneLabel}.\n${monsterName} perd 1 PV.`,
    grodorDamage: (zoneLabel: string, monsterName: string) =>
      `Grodor frappe ${zoneLabel}, mais ${monsterName} riposte.\nGrodor perd 1 PV.`,
    nothing: (zoneLabel: string) => `Grodor frappe ${zoneLabel}.\nRien ne se passe.`,
    dodge: "ESQUIVE",
    pvDelta: (amount: number) => `${amount > 0 ? "+" : ""}${amount} PV`,
    victory: (monsterName: string) => `Victoire !\n${monsterName} est vaincu.`,
    zoneLabels: {
      head: "la tete",
      body: "le corps",
      legs: "les jambes"
    },
    resultPanel: {
      victoryTitle: "Combat gagne",
      deathTitle: "Grodor est tombe",
      victoryMessage: "Grodor survit au combat.",
      perfectVictoryMessage: "Grodor gagne sans perdre un seul coeur.",
      deathMessage: "Grodor s'effondre. La run est terminee.",
      victoryEffect: "Victoire",
      goldRewardEffect: (goldReward: number) => `+${goldReward} PO`,
      deathEffect: "Mort"
    }
  },
  debug: {
    title: "Debug",
    infoButton: "i",
    tabs: {
      stuff: "Stuff",
      combat: "Combat",
      grodor: "Grodor",
      events: "Events"
    },
    equipmentNone: "aucun",
    equipmentPrefix: "Stuff",
    monsterTest: "Monstre test",
    eventTest: "Mini-jeux et events",
    jumpDebugTitle: "JUMP",
    jumpDebugLaunch: "Lancer",
    jumpDebugHitbox: (enabled: boolean) => `Hitbox ${enabled ? "ON" : "OFF"}`,
    jumpDebugStatus: (enabled: boolean) => `Mini-jeux et events\nJump hitbox: ${enabled ? "ON" : "OFF"}`,
    grodorLifeFallback: "Vie de Grodor",
    grodorLife: (life: number, maxLife: number) => `Vie: ${life}/${maxLife}`,
    grodorStatus: (life: number, maxLife: number, carriedGold: number) => `Vie: ${life}/${maxLife}\nBourse: ${carriedGold} PO`,
    grodorMode: (mode: string) => `Mode Grodor: ${mode}`,
    grodorModeSprite: "Sprite actuel",
    grodorModeRigV3: "Grodor V3 rig",
    heal: "Heal +1 coeur",
    damage: "Degats -1 coeur",
    addGold: "+10 PO",
    resetAll: "Reset",
    resetAllDone: "Reset complet. Grodor recommence a zero.",
    village: "Village",
    equipmentLabels: {
      cape: "Cape",
      quarterHourCape: "Cape 1/4h",
      slip: "Slip",
      sandals: "Sandales",
      medallion: "Medaillon",
      sablierFele: "Sablier",
      helmet: "Casque",
      ankleBall: "Boulet",
      axe: "Hache",
      gloves: "Gants",
      mittens: "Moufles",
      pebble: "Caillou"
    },
    miniGameLabels: {
      lootChest: "Coffre loot",
      coinFlip: "Pile/Face",
      bonneteau: "Bonneteau",
      slotMachine: "Machine a sous",
      dodgeChest: "Coffre Esquive",
      jump: "Course au saut",
      armWrestling: "Bras de fer",
      tugOfWar: "Tir a la corde",
      elevator: "Ascenseur"
    },
    equipmentUpdated: "Equipement debug mis a jour.",
    grodorRecovered: "Debug: Grodor recupere 1 coeur.",
    grodorDamaged: "Debug: Grodor perd 1 coeur.",
    grodorGoldAdded: (gold: number) => `Debug: Grodor gagne ${gold} PO.`,
    tiledTitle: "Debug Tiled donjon",
    unnamedObject: "(sans nom)",
    tiledCounts: (collisions: number, interactives: number, spawns: number, paths: number) =>
      `collisions: ${collisions} | portes: ${interactives} | spawns: ${spawns} | paths: ${paths}`,
    tiledRatio: (width: number, height: number) => `${width}x${height} - ratio 16:9`,
    tiledLegend: "Rouge collisions / vert spawn / jaune paths"
  },
  dungeonEvents: {
    gainGoldRandom: {
      title: "Bourse capricieuse",
      message: "Grodor trouve quelques pieces qui trainaient la.",
      effectLabel: (gold: number) => `+${gold} PO`
    },
    loseHeart: {
      title: "Mauvaise surprise",
      message: "Grodor prend un mauvais coup en ouvrant la porte.",
      effectLabel: "-1 coeur"
    },
    healHeart: {
      title: "Petit miracle",
      message: "Grodor respire un grand coup et reprend du courage.",
      effectLabel: "Soin: 1 coeur"
    },
    nothingGag: {
      title: "Suspense inutile",
      message: "Grodor fixe le vide. Le vide gagne.",
      effectLabel: "Rien"
    },
    floorUp: {
      title: "Mauvais escalier",
      message: "Grodor se trompe de sens et remonte dans la tour.",
      effectLabel: "+1 etage"
    },
    floorDown: {
      title: "Marche traitresse",
      message: "Grodor descend sans vraiment l'avoir decide.",
      effectLabel: "-1 etage"
    },
    gainGold: {
      title: "Bourse chanceuse",
      message: "Grodor trouve une piece oubliee derriere la porte.",
      effectLabel: "+1 PO"
    },
    loseLife: {
      title: "Porte rancuniere",
      message: "La porte se venge sur le nez de Grodor.",
      effectLabel: "-1 coeur"
    },
    nothing: {
      title: "Rien du tout",
      message: "Grodor ne trouve rien. Meme pas une mauvaise odeur notable.",
      effectLabel: "Aucun effet"
    },
    combatRat: {
      title: "Rat teigneux",
      message: "Un Rat surgit dans le donjon.",
      effectLabel: "Combat"
    },
    combatSkeleton: {
      title: "Squelette fatigue",
      message: "Un Squelette fatigue cliquette dans le donjon.",
      effectLabel: "Combat"
    },
    combatGuard: {
      title: "Garde",
      message: "Un Garde barre la route de Grodor.",
      effectLabel: "Combat"
    },
    gainAxe: {
      title: "Hache douteuse",
      message: "Grodor ramasse une hache.",
      effectLabel: "Equipement ajoute"
    },
    gainWarUnderwear: {
      title: "Slip de Guerre",
      message: "Grodor enfile son Slip de Guerre.",
      effectLabel: "Equipement ajoute"
    },
    gainWeirdStoneTest: {
      title: "Pierre bizarre",
      message: "Grodor ramasse une pierre bizarre.",
      effectLabel: "Objet ajoute au sac"
    },
    gainTooLongCape: {
      title: "Cape Trop Longue",
      message: "Grodor s'emmele dans sa Cape Trop Longue.",
      effectLabel: "Equipement ajoute"
    },
    gainPanicSandals: {
      title: "Sandales de Panique",
      message: "Grodor chausse ses Sandales de Panique.",
      effectLabel: "Equipement ajoute"
    },
    gainAlmostHeroMedallion: {
      title: "Medaillon du Presque-Heros",
      message: "Grodor accroche le Medaillon du Presque-Heros.",
      effectLabel: "Equipement ajoute"
    },
    gainAnkleBall: {
      title: "Boulet au Pied",
      message: "Grodor traine un Boulet au Pied.",
      effectLabel: "Equipement ajoute"
    },
    gainTinyHelmet: {
      title: "Casque Trop Petit",
      message: "Grodor coiffe son Casque Trop Petit.",
      effectLabel: "Equipement ajoute"
    },
    gainStickyGloves: {
      title: "Gants Collants",
      message: "Grodor colle ses Gants Collants a ses propres doigts.",
      effectLabel: "Equipement ajoute"
    },
    gainEmotionalPebble: {
      title: "Caillou Affectif",
      message: "Grodor adopte un Caillou Affectif.",
      effectLabel: "Equipement ajoute"
    },
    gainGoldCoinTest: {
      title: "Piece de test",
      message: "Grodor range une piece de test dans son sac.",
      effectLabel: "Objet ajoute au sac"
    },
    lootChest: {
      title: "Coffre douteux",
      message: "Un coffre attend Grodor avec une patience suspecte.",
      effectLabel: "Mini-jeu"
    },
    coinFlip: {
      title: "Pile ou Face",
      message: "Une piece propose a Grodor un plan financier tres court.",
      effectLabel: "Mini-jeu"
    },
    bonneteau: {
      title: "Bonneteau",
      message: "Trois cartes attendent le doigt le moins malin.",
      effectLabel: "Mini-jeu"
    },
    slotMachine: {
      title: "Machine a sous",
      message: "Une machine promet a Grodor une fortune parfaitement improbable.",
      effectLabel: "Mini-jeu"
    },
    dodgeChest: {
      title: "Coffre Esquive",
      message: "Un coffre prepare un coup que Grodor devrait eviter.",
      effectLabel: "Mini-jeu"
    },
    jump: {
      title: "Course au saut",
      message: "Un couloir pourri propose a Grodor un saut tres mal calibre.",
      effectLabel: "Mini-jeu"
    },
    armWrestling: {
      title: "Bras de fer",
      message: "Un costaud defie Grodor dans un duel de coudes douteux.",
      effectLabel: "Mini-jeu"
    },
    tugOfWar: {
      title: "Tir a la corde",
      message: "Un boss attrape une corde et invite Grodor a tirer.",
      effectLabel: "Mini-jeu"
    },
    elevator: {
      title: "Ascenseur douteux",
      message: "Un ascenseur a levier attend Grodor.",
      effectLabel: "Mini-jeu"
    }
  },
  items: {
    goldCoinTest: "Piece de test",
    weirdStoneTest: "Pierre bizarre de test",
    tooLongCape: "Cape Trop Longue",
    quarterHourCape: "Cape du Quart d'Heure",
    warUnderwear: "Slip de Guerre",
    panicSandals: "Sandales de Panique",
    almostHeroMedallion: "Medaillon du Presque-Heros",
    sablierFele: "Sablier Fêlé",
    tinyHelmet: "Casque Trop Petit",
    ankleBall: "Boulet au Pied",
    axe: "Hache",
    stickyGloves: "Gants Collants",
    mouflesReflexion: "Moufles de Réflexion",
    emotionalPebble: "Caillou Affectif",
    soloEffects: {
      mouflesReflexion: "En Bras de Fer, la pression ennemie baisse légèrement.",
      quarterHourCape: "Une fois par mini-jeu de timing, peut transformer un echec brutal en echec moins grave."
    },
    descriptions: {
      tooLongCape: "Reduit les chances de casse de certains stuffs.",
      quarterHourCape: "Elle arrive toujours trop tard. Heureusement, parfois le danger aussi.",
      warUnderwear: "+1 coeur max pendant la run.",
      panicSandals: "Hors combat, peut annuler 1 coeur perdu.",
      almostHeroMedallion: "Sauve Grodor d'une mort chiffree, puis casse.",
      sablierFele: "Laisse a Grodor une minuscule avance sur ses propres retards. Les reactions urgentes deviennent un peu moins urgentes.",
      tinyHelmet: "En combat, peut annuler 1 coeur perdu.",
      ankleBall: "Ralentit Grodor dans Jump et le curseur de l'ascenseur.",
      axe: "En combat, ajoute +1 degat quand Grodor touche.",
      stickyGloves: "Peut ajouter des PO bonus quand Grodor gagne de l'or.",
      mouflesReflexion: "Grodor réfléchit avant de taper. Ça prend du temps, mais l'adversaire aussi fatigue.",
      emotionalPebble: "Peut rendre 1 coeur apres une perte."
    }
  },
  monsters: {
    rat: "Rat",
    skeleton: "Squelette fatigue",
    guard: "Garde"
  },
  nineSliceTest: {
    title: "Test Phaser NineSlice - cadres UI",
    frameStory: "cadre story",
    sizes: {
      short: "court",
      medium: "moyen",
      long: "long"
    },
    shortText: "Texte court.",
    storyMediumText: "Narration dynamique, texte pose par-dessus l'image.",
    storyLongText: "Version longue avec word wrap: le contenu change sans fabriquer une image differente.",
    autoSizedText: "Panneau redimensionne selon le texte: meme texture, coins fixes, contenu dynamique avec word wrap.",
    sliceLabel: (label: string, left: number, right: number, top: number, bottom: number) =>
      `${label} | L ${left} R ${right} T ${top} B ${bottom}`,
    sizeLabel: (label: string, width: number, height: number) => `${label}: ${width}x${height}`
  }
} as const;
