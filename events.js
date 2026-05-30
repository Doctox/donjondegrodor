const eventPool = [
  {
    weight: 5,
    run() {
      if (state.activePact) {
        return startGoldChestMiniGame("gain", randomInt(2, 5));
      }
      return startPactMiniGame();
    },
  },
  {
    weight: 12,
    run() {
      const gold = randomInt(1, 3);
      if (Math.random() < 0.45) {
        return addGold(gold, `Tu ouvres un coffre poussiéreux. Pas de piège cette fois, juste de la monnaie. +${gold} PO.`);
      }
      return startGoldChestMiniGame("gain", gold);
    },
  },
  {
    weight: 9,
    run() {
      if (Math.random() < 0.40) {
        return addGold(2, "Tu donnes un grand coup de pied dans un coffre en bois. Il s'ouvre sagement. +2 PO.");
      }
      return startGoldChestMiniGame("gain", 2);
    },
  },
  {
    weight: 7,
    run() {
      if (Math.random() < 0.45) {
        return startGoldChestMiniGame("gain", 5);
      }
      return takeDamage(1, "Le coffre te mord. Les meubles du donjon ont un syndicat très agressif. -1 cœur.");
    },
  },
  {
    weight: 7,
    run() {
      if (Math.random() < 0.18) {
        return "Tu marches sur une dalle. Elle claque, tousse, puis abandonne. Même le piège te trouve fatigant.";
      }
      return takeDamage(1, "Grodor marche sur une dalle. La dalle fait “clic”. Grodor fait “oh”. -1 cœur.");
    },
  },
  {
    weight: 7,
    run() {
      return takeDamage(1, `${randomFrom([
        "Grodor évite un piège avec grâce. Puis se cogne contre le panneau “Attention au piège”",
        "Une pierre tombe du plafond. Grodor l’esquive. Une deuxième, plus petite, réussit. Dommage.",
        "Un panneau “Quai 9 ¾” pend sur le mur d’en face. Grodor fonce. Le mur gagne.",
      ])} -1 cœur.`);
    },
  },
  {
    weight: 5,
    run() {
      return addItem("Casque Trop Petit", "Tu enfiles un casque trop petit. Tes pensées se tassent pour payer moins cher.");
    },
  },
  {
    weight: 4,
    run() {
      const gainedHeart = !hasItem("Slip de Guerre") && gainMaxLife();
      const text = gainedHeart
        ? "Tu trouves un slip de guerre sur un petit présentoir solennel. Le tissu exige le respect. +1 cœur maximum."
        : "Tu trouves un slip de guerre sur un petit présentoir solennel. Il promet un cœur, mais 6 est déjà beaucoup pour Grodor. Maximum atteint.";
      return addItem("Slip de Guerre", text);
    },
  },
  {
    weight: 4,
    run() {
      return addItem("Medaillon du Presque-Heros", "Un médaillon vibre dans ta main. Il fait le bruit d'un plan B pas rassurant.");
    },
  },
  {
    weight: 4,
    run() {
      return addItem("Sandales de Panique", "Ces sandales regardent déjà la sortie. Grodor appelle ça du leadership.");
    },
  },
  {
    weight: 4,
    run() {
      return addItem("Hache Emoussee", "Grodor ramasse la hache. Même Gimli demanderait un reçu. Effet : Hache Emoussee.");
    },
  },
  {
    weight: 5,
    run() {
      return randomDungeonItemText();
    },
  },
  {
    weight: 8,
    run() {
      return startCombat(monsters.rat);
    },
  },
  {
    weight: 7,
    run() {
      return startCombat(monsters.skeleton);
    },
  },
  {
    weight: 5,
    run() {
      return startCombat(monsters.guard);
    },
  },
  {
    weight: 7,
    run() {
      if (Math.random() < 0.45) {
        state.life = Math.min(state.maxLife, state.life + 1);
        return `${randomFrom([
          "Une petite bouteille marquée “Bois-moi” roule jusqu’à Grodor. Il boit. Rien ne grandit, sauf son courage.",
          "Une vieille femme tend une pomme rouge à Grodor. Il croque sans réfléchir. Pour une fois, le conte se trompe.",
        ])} Effet : Soigne.`;
      }
      return takeDamage(1, `${randomFrom([
        "Un capitaine pirate nommé Jack Boit-de-l’Eau arrive en tanguant. Il tend sa bouteille à Grodor. Une gorgée plus tard, Grodor tangue aussi.",
        "Grodor trouve une tasse de thé fumante. Le Chapelier Fou crie “pas celle-là !”. Trop tard.",
      ])} -1 cœur.`);
    },
  },
  {
    weight: 5,
    run() {
      const gold = randomInt(1, 4);
      if (Math.random() < 0.5) {
        return addGold(gold, `Un coffre en fer blanc traîne là. Tu le secoues jusqu'a ce que l'or tombe. +${gold} PO.`);
      }
      return startGoldChestMiniGame("gain", gold);
    },
  },
  {
    weight: 5,
    run() {
      const gold = randomInt(2, 6);
      if (Math.random() < 0.35) {
        return takeDamage(1, "Tu fouilles un tonneau. Il contenait un ressort, une brique et une opinion très basse de toi. -1 cœur.");
      }
      return startGoldChestMiniGame("gain", gold);
    },
  },
  {
    weight: 5,
    run() {
      const loss = Math.min(state.carriedGold, randomInt(1, 3));
      return loss > 0
        ? startGoldChestMiniGame("loss", loss)
        : "Vous avez trouvé un coffre. Il tente de réclamer des PO, mais ta bourse est vide.";
    },
  },
  {
    weight: 4,
    run() {
      if (state.life < state.maxLife) {
        state.life += 1;
        return `${randomFrom([
          "Une petite bouteille marquée “Bois-moi” roule jusqu’à Grodor. Il boit. Rien ne grandit, sauf son courage.",
          "Une vieille femme tend une pomme rouge à Grodor. Il croque sans réfléchir. Pour une fois, le conte se trompe.",
        ])} Effet : Soigne.`;
      }
      return "Tu trouves une soupe tiède dans un casque. Tu es déjà en forme, luxe insolent.";
    },
  },
  {
    weight: 4,
    run() {
      if (Math.random() < 0.5) {
        return startGoldChestMiniGame("gain", 3);
      }
      return "Un vieux coffre s'ouvre tout seul. Vide, évidemment. Le théâtre coûte moins cher que l'or.";
    },
  },
  {
    weight: 4,
    run() {
      const loss = Math.min(state.carriedGold, 2);
      return loss
        ? startGoldChestMiniGame("loss", loss)
        : "Vous avez trouvé un coffre. Il cherche des PO à voler, mais ne trouve que du silence.";
    },
  },
  {
    weight: 4,
    run() {
      return takeDamage(1, "Une arbalète sort du mur. Grodor retient son souffle. Son ventre gargouille. L’arbalète tire. -1 cœur.");
    },
  },
  {
    weight: 4,
    run() {
      if (Math.random() < 0.55) {
        return "Grodor entre dans une salle remplie de leviers. Il en tire un avec confiance. Le donjon réfléchit. Puis rien.";
      }
      return takeDamage(1, "Tu entres dans une salle remplie de leviers. Tu les touches tous, comme un audit idiot. -1 cœur.");
    },
  },
  {
    weight: 4,
    run() {
      const gold = randomInt(1, 5);
      if (Math.random() < 0.50) {
        return addGold(gold, `Tu ouvres une boîte à bijoux abandonnée. +${gold} PO.`);
      }
      return startGoldChestMiniGame("gain", gold);
    },
  },
  {
    weight: 7,
    run() {
      return startMiniGame("double");
    },
  },
  {
    weight: 6,
    run() {
      return startMiniGame("slots");
    },
  },
  {
    weight: 6,
    run() {
      return startMiniGame("cards");
    },
  },
  {
    weight: 5,
    run() {
      return startMiniGame("arm");
    },
  },
  {
    weight: 4,
    run() {
      if (!state.inventory.length) {
        return "Une petite créature maigre sort de l’ombre en murmurant : « Mon précieux… » Elle fouille le sac de Grodor. Rien. Elle repart en soufflant : « Décevant. »";
      }
      const lost = removeRandomItem();
      return `${randomFrom([
        "Deux yeux apparaissent. Puis une queue. Puis un sourire. Le chat disparaît. Grodor se sent plus léger.",
        "Grodor se retrouve face à un sorcier aux lunettes rondes. “Expelliarmus !” Un objet s’envole. Grodor applaudit, puis comprend.",
        "Une armure se réveille et tend la main. Grodor lui donne son objet par réflexe. L’armure repart avec.",
      ])} Effet : Objet perdu : ${lost}.`;
    },
  },
  {
    weight: 3,
    run() {
      if (Math.random() < 0.4) {
        return instantDeath("Tu entres dans une salle marquée 'Test de confiance'. Le sol n'avait pas signé.");
      }
      return startGoldChestMiniGame("gain", 4);
    },
  },
  {
    weight: 4,
    run() {
      return "Tu découvres une fresque racontant la chute d'un grand héros. La ressemblance est juridiquement troublante.";
    },
  },
  {
    weight: 4,
    run() {
      const gold = randomInt(1, 4);
      return startGoldChestMiniGame("gain", gold);
    },
  },
  {
    weight: 4,
    run() {
      shiftFloors(-2);
      return `${randomFrom([
        "Grodor tombe sur ses fesses quelques étages plus bas. Il repart comme si de rien n’était.",
        "Grodor trouve un escalier. Ah… non. C’était un toboggan. Un cri traverse tout le donjon.",
      ])} -2 étages.`;
    },
  },
  {
    weight: 6,
    run() {
      shiftFloors(2);
      return `${randomFrom([
        "Grodor entre dans un vieux monte-charge. Il appuie sur le 1. Le monte-charge remonte de deux étages.",
        "Un tapis magique passe sous Grodor. Il monte deux étages.",
        "Une main géante sort du mur, attrape Grodor par le col, et le range deux étages plus haut.",
        "Grodor s’assoit sur un vieux trône. Le trône tousse, puis l’expédie deux étages plus haut.",
      ])} +2 étages.`;
    },
  },
  {
    weight: 3,
    run() {
      if (Math.random() < 0.42) {
        shiftFloors(-2);
        return "Une trappe s'ouvre sous tes pieds. Tes genoux signent une plainte. -2 étages.";
      }
      shiftFloors(2);
      return "Une trappe s'ouvre sous tes pieds, puis un ressort idiot corrige l'erreur. Le donjon te renvoie plus haut, par mépris. +2 étages.";
    },
  },
  {
    weight: 3,
    run() {
      if (Math.random() < 0.5) {
        state.life = Math.min(state.maxLife, state.life + 1);
        return "Un petit autel soigne tes bosses. Ton honneur reste hors garantie. +1 cœur.";
      }
      return takeDamage(1, "Un petit autel promet de te bénir. Il éternue en vieux latin. -1 cœur.");
    },
  },
  {
    weight: 3,
    run() {
      const gold = randomInt(4, 8);
      if (Math.random() < 0.3) {
        return startGoldChestMiniGame("gain", gold);
      }
      return takeDamage(1, "Tu trouves une caisse marquée 'salaires des gardes'. Les gardes connaissent la comptabilité défensive. -1 cœur.");
    },
  },
  {
    weight: 3,
    run() {
      return "Un miroir magique te montre ton avenir. Il est court, flou et mal cadré.";
    },
  },
  {
    weight: 3,
    run() {
      const loss = Math.min(state.carriedGold, randomInt(2, 5));
      return loss
        ? startGoldChestMiniGame("loss", loss)
        : "Vous avez trouvé un coffre. Il grogne contre une bourse vide, puis abandonne.";
    },
  },
  {
    weight: 3,
    run() {
      if (Math.random() < 0.6) {
        return startGoldChestMiniGame("gain", 1);
      }
      return takeDamage(1, "Tu bats un vieux tapis. Il a plus d'expérience que toi, pauvre carpette. -1 cœur.");
    },
  },
  {
    weight: 3,
    run() {
      return "Tu passes devant une porte 'Boss final'. Derrière, un placard. Il a une aura de meuble important.";
    },
  },
  {
    weight: 3,
    run() {
      if (state.carriedGold >= 10) {
        return "Ta bourse pèse lourd. Le donjon fait semblant de regarder ailleurs.";
      }
      return "Tu secoues ta bourse. Elle répond par un silence socialement violent.";
    },
  },
  {
    weight: 7,
    run() {
      return "Grodor arrive devant une immense peinture d’une grosse dame. Elle demande le mot de passe. Grodor répond : « Grodor. » La dame hésite, puis le laisse passer.";
    },
  },
  {
    weight: 7,
    run() {
      return "La salle est vide. Grodor attend le piège. Le piège attend Grodor. Rien ne se passe.";
    },
  },
  {
    weight: 6,
    run() {
      const loss = Math.min(state.carriedGold, randomInt(1, 4));
      return loss
        ? startGoldChestMiniGame("loss", loss)
        : "Vous avez trouvé un coffre. Il secoue ta bourse vide et la repose avec pitié.";
    },
  },
  {
    weight: 1,
    run() {
      return instantDeath(randomFrom([
        "Grodor ouvre une porte. Une voix murmure : « Avada Kedavra. ».",
        "Grodor franchit une porte. Une grosse dame en robe rouge lève une petite couronne de travers. « Qu’on lui coupe la tête ! » Mauvaise porte.",
        "Grodor pousse une porte. Un homme à crochet sourit dans l’ombre. Derrière lui, quelque chose fait tic-tac.",
      ]));
    },
  },
  {
    weight: 1,
    run() {
      return instantDeath(randomFrom([
        "Grodor ouvre une porte. Une voix murmure : « Avada Kedavra. ».",
        "Grodor franchit une porte. Une grosse dame en robe rouge lève une petite couronne de travers. « Qu’on lui coupe la tête ! » Mauvaise porte.",
        "Grodor pousse une porte. Un homme à crochet sourit dans l’ombre. Derrière lui, quelque chose fait tic-tac.",
      ]));
    },
  },
];
