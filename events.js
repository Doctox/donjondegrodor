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
      return addGold(2, "Une bourse traîne sous une dalle. Elle appartenait sûrement à quelqu'un de moins nigaud. +2 PO.");
    },
  },
  {
    weight: 7,
    run() {
      if (Math.random() < 0.45) {
        return addGold(5, "Le coffre contient des pièces et une notice de sécurité ignorée. Hodor prend le tout, comme un âne diplômé. +5 PO.");
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
      return takeDamage(1, "Tu marches sur une dalle. Elle le prend comme une critique architecturale, espèce de sabot. -1 cœur.");
    },
  },
  {
    weight: 7,
    run() {
      return takeDamage(1, "Tu descends trois marches avec panache. Les sept suivantes choisissent ton visage, grosse quiche. -1 cœur.");
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
      if (!hasItem("Slip de Guerre")) {
        state.maxLife += 1;
        state.life += 1;
      }
      return addItem("Slip de Guerre", "Tu trouves un slip de guerre sur un petit présentoir solennel. Le tissu exige le respect. +1 cœur maximum.");
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
      return addItem("Sandales de Panique", "Ces sandales regardent déjà la sortie. Hodor appelle ça du leadership.");
    },
  },
  {
    weight: 4,
    run() {
      return addItem("Hache Emoussee", "Tu récupères une hache émoussée. Elle a l'air dangereuse pour le mobilier mou.");
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
        return "Tu bois l'eau louche. Elle avait le goût d'une erreur, mais une erreur nourrissante. +1 cœur.";
      }
      return takeDamage(1, "Tu bois l'eau louche. Le donjon respecte ton engagement dans la mauvaise idée, sombre buse. -1 cœur.");
    },
  },
  {
    weight: 5,
    run() {
      const gold = randomInt(1, 4);
      return addGold(gold, `Tu trouves une tirelire en forme de démon triste. Tu l'achèves avec une compassion rentable. +${gold} PO.`);
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
        ? `Un péage fantôme te réclame ${loss} PO. Tu paies une route qui n'existe pas, gros jambon.`
        : "Un péage fantôme te réclame de l'argent. Ta pauvreté passe sans ticket.";
    },
  },
  {
    weight: 4,
    run() {
      if (state.life < state.maxLife) {
        state.life += 1;
        return "Tu trouves une soupe tiède dans un casque. C'est honteux, donc parfaitement local. +1 cœur.";
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
        ? `Tu glisses sur une flaque de mystère. ${loss} PO roulent sous une grille qui avait l'air d'attendre ça.`
        : "Tu glisses sur une flaque de mystère. Aucun argent perdu, juste une posture sociale.";
    },
  },
  {
    weight: 4,
    run() {
      return takeDamage(1, "Une arbalète automatique tire sur tout ce qui respire fort. Hodor est une preuve sonore. -1 cœur.");
    },
  },
  {
    weight: 4,
    run() {
      if (Math.random() < 0.55) {
        return "Tu entres dans une salle remplie de leviers. Tu n'en touches aucun. Le donjon note l'anomalie.";
      }
      return takeDamage(1, "Tu entres dans une salle remplie de leviers. Tu les touches tous, comme un audit idiot. -1 cœur.");
    },
  },
  {
    weight: 4,
    run() {
      const gold = randomInt(1, 5);
      return addGold(gold, `Un marchand invisible te vend de l'air premium. Tu refuses et fouilles sa caisse théorique. +${gold} PO.`);
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
    weight: 4,
    run() {
      if (!state.inventory.length) {
        return "Une malédiction cherche un objet à casser. Tes poches vides la mettent mal à l'aise.";
      }
      const lost = removeRandomItem();
      return `Une malédiction administrative confisque ton objet : ${lost}. Motif : existence mal déclarée.`;
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
      return "Tu trouves un escalier pressé d'en finir. Hodor négocie avec ses genoux. -2 étages.";
    },
  },
  {
    weight: 6,
    run() {
      shiftFloors(2);
      return "Un monte-charge grincheux remonte de 2 étages. Le service client refuse tout sourire.";
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
      return "Une trappe s'ouvre sous tes pieds, puis un ressort idiot corrige l'erreur. Tu remontes de 2 étages.";
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
        return addGold(gold, `Tu trouves une caisse marquée "salaires des gardes". Hodor invente l'impôt inverse. +${gold} PO.`);
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
        ? `Une bourse vivante mord ta bourse normale et avale ${loss} PO. L'économie locale applaudit.`
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
      return "Une statue te regarde. Même en pierre, elle attendait mieux.";
    },
  },
  {
    weight: 7,
    run() {
      return "La salle est vide. Tu remportes un duel intellectuel contre rien, de peu.";
    },
  },
  {
    weight: 6,
    run() {
      const loss = Math.min(state.carriedGold, randomInt(1, 4));
      state.carriedGold -= loss;
      return loss
        ? `Une main sort du mur, te vole et applaudit ta vigilance avec mépris. -${loss} PO.`
        : "Une main sort du mur, fouille ta bourse vide, puis te rend ta pauvreté.";
    },
  },
  {
    weight: 1,
    run() {
      return instantDeath("Tu ouvres la porte. Derrière, une décision de game design te regarde sans remords.");
    },
  },
  {
    weight: 1,
    run() {
      return instantDeath('Une pancarte indique "Ne pas entrer". Hodor lit, réfléchit, puis trahit la lecture.');
    },
  },
];
