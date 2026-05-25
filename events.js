const eventPool = [
  {
    weight: 12,
    run() {
      const gold = randomInt(1, 3);
      return addGold(gold, `Tu trouves un coffre derrière un panneau "Pas un coffre". Le camouflage avait un budget. +${gold} PO.`);
    },
  },
  {
    weight: 9,
    run() {
      return addGold(2, `${randomFrom([
        "Une bourse est posée là. Grodor a comme un sentiment de déjà-vu.",
        "Une bourse est posée par terre. Ce n’était pas celle de ton dernier passage ?",
        "Une bourse au nom de Grodor est posée par terre. Pratique. Inquiétant, mais pratique.",
      ])} +2 PO.`);
    },
  },
  {
    weight: 7,
    run() {
      if (Math.random() < 0.45) {
        return addGold(5, "Le coffre contient des pièces et une notice de sécurité ignorée. Grodor prend le tout, comme un âne diplômé. +5 PO.");
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
      return addGold(gold, `${randomFrom([
        "Grodor éternue. Quelques pièces tombent du plafond. Personne ne revendique le miracle.",
        "Quelqu’un jette quelques pièces dans un puits. Mauvais puits. Grodor les reçoit sur le crâne.",
      ])} +${gold} PO.`);
    },
  },
  {
    weight: 5,
    run() {
      const gold = randomInt(2, 6);
      if (Math.random() < 0.35) {
        return takeDamage(1, "Tu fouilles un tonneau. Il contenait un ressort, une brique et une opinion très basse de toi. -1 cœur.");
      }
      return addGold(gold, `Tu fouilles un tonneau et trouves ${gold} PO dans une substance qui refuse de se présenter.`);
    },
  },
  {
    weight: 5,
    run() {
      const loss = Math.min(state.carriedGold, randomInt(1, 3));
      state.carriedGold -= loss;
      return loss > 0
        ? `${randomFrom([
          "Une barrière fantôme descend devant Grodor. Une main transparente réclame des PO. Grodor paie. La barrière était déjà ouverte.",
          "Un gamin en pyjama vert promet le Pays Imaginaire contre quelques PO. Grodor paie. Le gamin s’envole. Grodor reste au sol.",
          "Un vieil homme en robe bloque le passage. « Vous ne passerez pas sans payer. » Grodor paie. La porte d’à côté était ouverte.",
        ])} -${loss} PO.`
        : "Un péage fantôme te réclame de l'argent. Ta pauvreté passe sans ticket.";
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
        return addGold(3, "Un vieux coffre s'ouvre tout seul. Il voulait finir sa journée avant toi. +3 PO.");
      }
      return "Un vieux coffre s'ouvre tout seul. Vide, évidemment. Le théâtre coûte moins cher que l'or.";
    },
  },
  {
    weight: 4,
    run() {
      const loss = Math.min(state.carriedGold, 2);
      state.carriedGold -= loss;
      return loss
        ? `Grodor trébuche et part en roulade héroïque. Ses pièces, elles, choisissent la fuite. -${loss} PO.`
        : "Tu glisses sur une flaque de mystère. Aucun argent perdu, juste une posture sociale.";
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
      return addGold(gold, `${randomFrom([
        "Une dame très correcte se présente comme Mary Popièce. Elle sort des PO de son sac, ouvre une porte qui n’était pas là, puis s’envole avec son parapluie.",
        "Un petit elfe nommé Dobourse apparaît. Il offre une chaussette à Grodor. Elle était pleine de PO.",
      ])} +${gold} PO.`);
    },
  },
  {
    weight: 2,
    run() {
      return startMiniGame("double");
    },
  },
  {
    weight: 1,
    run() {
      return startMiniGame("slots");
    },
  },
  {
    weight: 1,
    run() {
      return startMiniGame("cards");
    },
  },
  {
    weight: 1,
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
      return addGold(4, "Tu entres dans une salle marquée 'Test de confiance'. Le sol tient, probablement par erreur. +4 PO.");
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
      return addGold(gold, `Un coffre minuscule contient ${gold} PO et un mot: "ne dépense pas tout en fromage, benêt".`);
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
        return addGold(gold, `Tu trouves une caisse marquée "salaires des gardes". Grodor invente l'impôt inverse. +${gold} PO.`);
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
      state.carriedGold -= loss;
      return loss
        ? `${randomFrom([
          "Grodor gronde sa bourse. Elle ouvre grand la bouche et recrache quelques PO dans sa figure.",
          "La bourse de Grodor sème des PO derrière lui. Grodor ne remarque rien. Le Petit Poucet faisait ça avec des cailloux.",
        ])} -${loss} PO.`
        : "Une bourse vivante essaie de voler ton argent. Elle repart avec une crise existentielle.";
    },
  },
  {
    weight: 3,
    run() {
      if (Math.random() < 0.6) {
        return addGold(1, "Tu bats un vieux tapis. Il tousse, insulte ton lignage, puis lâche 1 PO.");
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
      state.carriedGold -= loss;
      return loss
        ? `Une main sort de derrière un tableau et pique la bourse de Grodor. Le tableau ricane. -${loss} PO.`
        : "Une main sort du mur, attrape la bourse de Grodor, la secoue. Rien. Elle la repose avec pitié.";
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
