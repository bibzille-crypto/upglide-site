const questions = [
  {
    text: "Connaissez-vous votre marge réelle après tous les coûts variables ?",
    category: "Marge réelle",
    answers: [
      { label: "Oui, par produit et par canal", value: 12.5 },
      { label: "À peu près, au niveau global", value: 7 },
      { label: "Non, pas de façon fiable", value: 1 },
    ],
  },
  {
    text: "Savez-vous quels produits créent réellement le plus de profit ?",
    category: "Rentabilité produit",
    answers: [
      { label: "Oui, et cela guide nos décisions", value: 12.5 },
      { label: "Nous avons une intuition, sans calcul complet", value: 6 },
      { label: "Non, nous pilotons surtout les ventes", value: 1 },
    ],
  },
  {
    text: "Votre trésorerie reste-t-elle confortable quand les ventes accélèrent ?",
    category: "Cash et stock",
    answers: [
      { label: "Oui, la croissance est anticipée et financée", value: 12.5 },
      { label: "Cela dépend fortement des périodes", value: 6 },
      { label: "Non, la croissance met le cash sous tension", value: 1 },
    ],
  },
  {
    text: "Mesurez-vous l’impact complet des remises, retours et frais logistiques ?",
    category: "Coûts cachés",
    answers: [
      { label: "Oui, régulièrement et par segment", value: 12.5 },
      { label: "Partiellement", value: 6 },
      { label: "Très peu ou pas du tout", value: 1 },
    ],
  },
  {
    text: "Vos coûts d’acquisition sont-ils reliés à la marge, et pas seulement au CA ?",
    category: "Acquisition",
    answers: [
      { label: "Oui, nos objectifs intègrent la contribution au profit", value: 12.5 },
      { label: "Parfois, selon les campagnes", value: 6 },
      { label: "Non, nous suivons surtout ROAS et chiffre d’affaires", value: 1 },
    ],
  },
  {
    text: "Disposez-vous d’indicateurs simples pour arbitrer chaque semaine ?",
    category: "Pilotage",
    answers: [
      { label: "Oui, ils sont fiables et réellement utilisés", value: 12.5 },
      { label: "Nous avons beaucoup de données, mais peu de synthèse", value: 6 },
      { label: "Non, les décisions se prennent surtout au ressenti", value: 1 },
    ],
  },
  {
    text: "Votre stock est-il piloté selon sa rotation et son impact sur le cash ?",
    category: "Gestion du stock",
    answers: [
      { label: "Oui, avec des seuils et décisions clairs", value: 12.5 },
      { label: "Seulement sur les références principales", value: 6 },
      { label: "Non, il immobilise régulièrement trop de trésorerie", value: 1 },
    ],
  },
  {
    text: "Votre équipe sait-elle quelles actions amélioreront le profit ce trimestre ?",
    category: "Priorisation",
    answers: [
      { label: "Oui, nous avons une roadmap partagée", value: 12.5 },
      { label: "Nous avons plusieurs pistes, sans ordre net", value: 6 },
      { label: "Non, nous avançons surtout selon les urgences", value: 1 },
    ],
  },
];

const leverMessages = {
  "Marge réelle":
    "Votre chiffre d’affaires ne semble pas suffisamment relié à une lecture fiable de la marge après coûts variables.",
  "Rentabilité produit":
    "Certains produits peuvent vendre beaucoup sans contribuer réellement au profit.",
  "Cash et stock":
    "Votre croissance peut immobiliser du cash ou créer une tension de trésorerie.",
  "Coûts cachés":
    "Les remises, retours, frais logistiques ou remboursements peuvent réduire ce qu’il reste vraiment après la vente.",
  Acquisition:
    "Vos campagnes peuvent générer du chiffre d’affaires sans garantir une contribution réelle au profit.",
  Pilotage:
    "Vous avez peut-être des données, mais pas encore une lecture assez simple pour arbitrer vite.",
  "Gestion du stock":
    "Le stock peut bloquer du cash ou masquer des produits moins rentables qu’ils n’en ont l’air.",
  Priorisation:
    "Le sujet principal semble être la difficulté à savoir quelle action mérite d’être lancée en premier.",
};

const quiz = document.querySelector("[data-quiz]");
const result = document.querySelector("[data-result]");
const questionNode = document.querySelector("[data-question]");
const answersNode = document.querySelector("[data-answers]");
const countNode = document.querySelector("[data-count]");
const progressNode = document.querySelector("[data-progress]");
const scoreNode = document.querySelector("[data-score]");
const resultTitle = document.querySelector("[data-result-title]");
const resultCopy = document.querySelector("[data-result-copy]");
const primaryLeverNode = document.querySelector("[data-primary-lever]");
const secondaryLeversNode = document.querySelector("[data-secondary-levers]");
const watchLeversNode = document.querySelector("[data-watch-levers]");
const restartButton = document.querySelector("[data-restart]");

let currentQuestion = 0;
let score = 0;
let categoryScores = [];

const showQuestion = () => {
  const question = questions[currentQuestion];
  countNode.textContent = `Question ${currentQuestion + 1} sur ${questions.length}`;
  progressNode.style.width = `${((currentQuestion + 1) / questions.length) * 100}%`;
  questionNode.textContent = question.text;
  answersNode.innerHTML = "";

  question.answers.forEach((answer) => {
    const button = document.createElement("button");
    button.className = "answer-button";
    button.type = "button";
    button.textContent = answer.label;
    button.addEventListener("click", () => selectAnswer(answer.value, question.category));
    answersNode.appendChild(button);
  });
};

const selectAnswer = (value, category) => {
  score += value;
  categoryScores.push({ category, value });
  currentQuestion += 1;

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
};

const showResult = () => {
  const roundedScore = Math.round(score);
  const sortedCategories = [...categoryScores].sort((a, b) => a.value - b.value);
  const primaryLever = sortedCategories[0];
  const secondaryLevers = sortedCategories.slice(1, 3);
  const watchLevers = sortedCategories
    .slice(3)
    .filter((item) => item.value < 12.5)
    .slice(0, 3);

  scoreNode.textContent = roundedScore;
  primaryLeverNode.innerHTML = `<strong>${primaryLever.category}</strong><br>${leverMessages[primaryLever.category] || ""}`;
  secondaryLeversNode.innerHTML = secondaryLevers
    .map(
      (item) =>
        `<li><strong>${item.category}</strong> — ${leverMessages[item.category] || ""}</li>`,
    )
    .join("");
  watchLeversNode.innerHTML = watchLevers.length
    ? watchLevers.map((item) => `<li>${item.category}</li>`).join("")
    : "<li>Aucune zone critique supplémentaire détectée dans cette première lecture.</li>";

  if (roundedScore <= 40) {
    resultTitle.textContent = "Rentabilité difficile à lire";
    resultCopy.textContent =
      "Votre scorecard montre plusieurs zones de tension. Avant d’accélérer, la priorité est de comprendre ce qui empêche vos ventes de se transformer en marge, cash et profit.";
  } else if (roundedScore <= 70) {
    resultTitle.textContent = "Croissance sous tension";
    resultCopy.textContent =
      "Votre e-commerce vend, mais certains leviers peuvent empêcher le profit de suivre le chiffre d’affaires. La priorité est de travailler le bon sujet dans le bon ordre.";
  } else {
    resultTitle.textContent = "Modèle à consolider";
    resultCopy.textContent =
      "Votre pilotage semble déjà structuré. L’enjeu est maintenant de consolider les leviers qui transforment le mieux vos ventes en profit et d’éviter que la croissance ne fragilise le cash.";
  }

  quiz.hidden = true;
  result.hidden = false;
  window.scrollTo({
    top: Math.max(result.offsetTop - 170, 0),
    behavior: "smooth",
  });
  result.focus?.({ preventScroll: true });
};

const restart = () => {
  currentQuestion = 0;
  score = 0;
  categoryScores = [];
  result.hidden = true;
  quiz.hidden = false;
  showQuestion();
};

if (
  quiz &&
  result &&
  questionNode &&
  answersNode &&
  countNode &&
  progressNode &&
  scoreNode &&
  resultTitle &&
  resultCopy &&
  primaryLeverNode &&
  secondaryLeversNode &&
  watchLeversNode
) {
  restartButton?.addEventListener("click", restart);
  showQuestion();
}
