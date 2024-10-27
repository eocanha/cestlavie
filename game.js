const enableExtras = false;
const enableSnarkyComment = false;

var state, stages, stateHistory;

function init() {
 console.log("Init");
 startGame();
}

function startGame() {
 state = {
  id: 0,
  stageId: "S",
  total: 0,
  description: "-",
  vote: "no",
  social: "-",
  neighborhood: "-",
  school: "-",
  money: 0,
  debt: 0,
  bonuses: 0,
  experience: 0,
  wellness: 0,
  illness: 0,
  healthToCommit: 0, // Used in D5.1 and D5.2
  progress: 0,
  snarkyComment: "",
  disabledOptions: [],
 };
 stages = {};
 stateHistory = [];

 if (!state.id)
  state.id = Math.trunc(Math.random() * 64) + 1;

 loadProfile(state.id, function() {
  stateHistory.push(JSON.parse(JSON.stringify(state)));
  loadStages(function() {
   displayState();
  });
 });
}

function displayState() {
 updateDisableOptions();
 console.log("Displaying state (stage " + state.stageId + ")");
 var element;
 Object.getOwnPropertyNames(state).forEach(function(key) {
  element = document.getElementById(key);
  if (element)
   element.innerText = state[key];
 });
 var stage = stages[state.stageId];
 element = document.getElementById("decision");
 var description = stage.description;
 if (state.snarkyComment)
  description += "<br/>" + state.snarkyComment;
 element.innerHTML = description;
 element = document.getElementById("options");
 var optionsHTML = "";
 optionsHTML += "<div class=\"optionsgrid\">";
 Object.getOwnPropertyNames(stage.options).forEach(function(id) {
  optionsHTML += "<div class=\"optionscellbutton\"><div id=\"" + id + "\""
   + (state.disabledOptions.includes(id) ? " class=\"disabled\""
     : " onclick=\"javascript: playAction(this)\"") + ">"
   + id + "</div></div><div class=\"optionscelltext\">"
   + stage.options[id] + "</div>";
 });
 if (enableExtras) {
  optionsHTML += "<div class=\"optionscellbutton\"><div id=\"undo\""
  + " onclick=\"javascript: undo(this)\"/>UNDO</div></div><div class=\"optionscelltext\">"
  + "Undo the last decision made</div>";
 }
 optionsHTML += "</div>";
 element.innerHTML = optionsHTML;
}

function loadProfile(id, callback) {
 console.log("Loading profile " + id);
 var req = new XMLHttpRequest();
 req.addEventListener("load", function() {
  req.responseText.split("\n").every(function(line, index) {
   var key, value;
   var endOfRecord = line.startsWith("---");
   if (!endOfRecord)
    [key, value] = line.split(":").map(s => s.trim());
   if (key == "id" && value == id)
    state.id = value;
   if (state.id != id)
    return true;
   else if (endOfRecord) {
    if (callback)
     setTimeout(callback, 0);
    return false;
   } else {
    if (isNaN(parseInt(value)))
     state[key] = value;
    else
     state[key] = parseInt(value);
    return true;
   }
  });
 });
 req.open("GET", "profiles.txt");
 req.send();
}

function loadStages(callback) {
 console.log("Loading stages");
 var req = new XMLHttpRequest();
 req.addEventListener("load", function() {
  var stage = { description: "", options: {} };

  req.responseText.split("\n").forEach(function(line, index) {
   var endOfRecord = line.startsWith("---");
   if (endOfRecord) {
    stages[stage.id] = stage;
    stage = { description: "", options: {} };
   } else if (line.startsWith("id:"))
    stage.id = line.split(":")[1].trim();
   else if (line.startsWith("[")) {
    var [label, text] = line.split(/\[|\] /).slice(1);
    stage.options[label] = text;
   } else
    stage.description += line.trim() + "<br/>";
  });
  if (callback)
   setTimeout(callback, 0);
 });
 req.open("GET", "stages.txt");
 req.send();
}

function borrow(from1, to1, interest1, from2 = 0, to2 = 0, interest2 = 0) {
 var borrowLimit = 0;
 if (from2) {
  if (state.debt + to2 + interest2 <= 20)
   borrowLimit = to2;
  else if (state.debt + from2 + interest2 <= 20)
   borrowLimit = 20 - state.debt - interest2;
 }
 if (borrowLimit == 0) {
  if (state.debt + to1 + interest1 <= 20)
   borrowLimit = to1;
  else if (state.debt + from1 + interest1 <= 20)
   borrowLimit = 20 - state.debt - interest1;
 }
 if (borrowLimit == 0)
  alert("The bank says: sorry, you have reached your credit limit, we can't lend you more money at the current interest rate.");
 else {
  var amount = parseInt(prompt("Amount of money to borrow (0-" + borrowLimit + "):", "0"));
  if (amount === NaN)
   amount = 0;
  else if (amount > borrowLimit)
   amount = borrowLimit;
  if (from2 && amount >= from2 && amount <= to2) {
   state.money += amount;
   state.debt += amount + interest2;
  } else if (amount >= from1 && amount <= to1) {
   state.money += amount;
   state.debt += amount + interest1;
  }
 }
}

function updateDisableOptions() {
 disabledOptions = [];
 switch (state.stageId) {
  case "S":
   break;
  case "D1":
   if (state.money < 50) disabledOptions.push("A");
   if (state.money < 30) disabledOptions.push("B");
   if (state.money < 20) disabledOptions.push("C");
   if (state.money < 5) disabledOptions.push("D");
   break;
  case "D2A":
   if (state.bonuses < 3) disabledOptions.push("B");
   if (state.money < 5) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   if (state.money < 1) disabledOptions.push("E");
   break;
  case "D2B":
   if (state.money < 20) disabledOptions.push("A");
   if (state.money < 5) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   if (state.money < 1) disabledOptions.push("E");
   break;
  case "D2C":
   if (state.money < 20) disabledOptions.push("A");
   if (state.bonuses < 3) disabledOptions.push("B");
   if (state.bonuses < 1) disabledOptions.push("D");
   if (state.money < 1) disabledOptions.push("E");
   break;
  case "D2D":
   if (state.money < 20) disabledOptions.push("A");
   if (state.bonuses < 3) disabledOptions.push("B");
   if (state.money < 5) disabledOptions.push("C");
   if (state.money < 1) disabledOptions.push("E");
   break;
  case "D2E":
   if (state.money < 20) disabledOptions.push("A");
   if (state.bonuses < 3) disabledOptions.push("B");
   if (state.money < 5) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   break;
  case "D3":
   if (!(state.social.includes("V") || state.social.includes("W"))) disabledOptions.push("A");
   if (state.wellness < 3) disabledOptions.push("B");
   if (state.experience < 3) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   break;
  case "D4":
   if (state.wellness < 3) disabledOptions.push("E");
   break;
  case "D5.1":
   if (!state.social.includes("V")) disabledOptions.push("A");
   if (!((state.social.includes("N") || state.social.includes("P"))
    && !(state.social.includes("Q") || state.social.includes("S"))))
    disabledOptions.push("B");
   if (!((state.social.includes("Q") || state.social.includes("S"))
    && !(state.social.includes("N") || state.social.includes("P"))))
    disabledOptions.push("C");
   if (!((state.social.includes("Q") || state.social.includes("S"))
    && (state.social.includes("N") || state.social.includes("P"))))
    disabledOptions.push("D");
   break;
  case "D5.2":
   if (state.bonuses < 1 || state.healthToCommit >= 0) disabledOptions.push("B");
   break;
  case "D6VW":
   if (!(state.school == "A" || state.school == "B")) disabledOptions.push("A");
   if (state.experience < 2) disabledOptions.push("B");
   if (state.bonuses < 1) disabledOptions.push("C");
   if (state.money < 5) disabledOptions.push("D");
   break;
  case "D6S":
   if (!(state.school == "A" || state.school == "B")) disabledOptions.push("A");
   if (state.experience < 4) disabledOptions.push("B");
   if (state.bonuses < 3) disabledOptions.push("C");
   if (state.money < 15) disabledOptions.push("D");
   break;
  case "D6":
   if (!(state.school == "A" || state.school == "B")) disabledOptions.push("A");
   if (state.experience < 3) disabledOptions.push("B");
   if (state.bonuses < 2) disabledOptions.push("C");
   if (state.money < 15) disabledOptions.push("D");
   break;
  case "CV1":
   if (state.bonuses < 2) disabledOptions = ["A", "B", "C", "D"];
   break;
  case "D7VWA":
   break;
  case "D7Q":
   if (state.money < 15) disabledOptions.push("B");
   if (state.bonuses < 3) disabledOptions.push("C");
   if (state.experience < 3) disabledOptions.push("D");
   break;
  case "D7":
   if (state.money < 10) disabledOptions.push("B");
   if (state.bonuses < 2) disabledOptions.push("C");
   if (state.experience < 2) disabledOptions.push("D");
   break;
  case "D8":
   if (state.money < 5) disabledOptions.push("B");
   if (state.experience < 3) disabledOptions.push("E");
   break;
  case "D9AB":
   break;
  case "D9H":
   break;
  case "D9U":
   if (state.bonuses < 2) disabledOptions.push("C");
   if (state.money < 10) disabledOptions.push("D");
   break;
  case "D10E8":
   if (state.money < 5) disabledOptions.push("A");
   break;
  case "D10E6":
   if (state.money < 10) disabledOptions.push("A");
   if (state.money < 5) disabledOptions.push("B");
   break;
  case "D10E4":
   if (state.money < 20) disabledOptions.push("A");
   if (state.money < 10) disabledOptions.push("B");
   if (state.money < 5) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   break;
  case "D10E2":
   disabledOptions.push("A");
   if (state.money < 20) disabledOptions.push("B");
   if (state.money < 10) disabledOptions.push("C");
   if (state.bonuses < 2) disabledOptions.push("D");
   break;
  case "D10E0":
   disabledOptions.push("A");
   disabledOptions.push("B");
   if (state.money < 20) disabledOptions.push("C");
   if (state.bonuses < 3) disabledOptions.push("D");
   break;
  case "CV2":
   if (state.vote != "yes" || (state.money < 2 && state.bonuses < 1))
    disabledOptions = ["A", "B", "C", "D", "E"];
   break;
  case "D11":
   if (state.wellness < 3) disabledOptions.push("E");
   break;
  case "D12E13":
   if (state.bonuses < 1) disabledOptions.push("A");
   break;
  case "D12E10":
   if (state.bonuses < 2) disabledOptions.push("A");
   if (state.bonuses < 1) disabledOptions.push("B");
   break;
  case "D12E7":
   if (state.bonuses < 3) disabledOptions.push("A");
   if (state.bonuses < 2) disabledOptions.push("B");
   if (state.bonuses < 1) disabledOptions.push("C");
   break;
  case "D12E4":
   disabledOptions.push("A");
   if (state.bonuses < 3) disabledOptions.push("B");
   if (state.bonuses < 2) disabledOptions.push("C");
   if (state.bonuses < 1) disabledOptions.push("D");
   break;
  case "D12E0":
   disabledOptions.push("A");
   disabledOptions.push("B");
   if (state.bonuses < 3) disabledOptions.push("C");
   if (state.bonuses < 2) disabledOptions.push("D");
   break;
  case "D13":
   if (state.wellness < 4) disabledOptions.push("A");
   if (state.bonuses < 1) disabledOptions.push("B");
   if (state.money < 5) disabledOptions.push("C");
   break;
  case "D14":
   if (!state.social.includes("M")) disabledOptions.push("A");
   if (!(state.social.includes("N") && !(state.social.includes("S") || state.social.includes("P"))))
    disabledOptions.push("B");
   if (!(state.social.includes("S") && !state.social.includes("P")))
    disabledOptions.push("C");
   if (!(state.social.includes("P") && !state.social.includes("S")))
    disabledOptions.push("D");
   if (!(state.social.includes("S") && state.social.includes("P")))
    disabledOptions.push("E");
  break;
  case "D15":
   if (!state.social.includes("V") || state.bonuses < 1) disabledOptions.push("A");
   var membership = 0;
   if (state.social.includes("N")) membership++;
   if (state.social.includes("P")) membership++;
   if (state.social.includes("Q")) membership++;
   if (state.social.includes("S")) membership = 0;
   if (!(membership == 1) || state.bonuses < 2) disabledOptions.push("B");
   if (!(membership >= 2) || state.bonuses < 3) disabledOptions.push("C");
   if (!state.social.includes("S") || state.bonuses < 4) disabledOptions.push("D");
   break;
  case "CV3":
   if (state.experience < 9) disabledOptions = ["A", "B", "C", "D", "E"];
   break;
  case "E1":
   break;
  case "E2":
   break;
  default:
   throw new Error("Illegal state.stageId: " + stageId);
 }
 state.disabledOptions = disabledOptions;
}

function playAction(button) {
 stateHistory.push(JSON.parse(JSON.stringify(state)));
 var stageId = state.stageId;
 var action = button.id;
 console.log("Playing action (stage: " + stageId + ", action: " + action +")");
 switch (state.stageId) {
  case "S":
   switch (action) {
    case "A":
     state.stageId = "D1";
     state.progress++;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   break;
  case "D1":
   switch (action) {
    case "A":
     state.money -= 50;
     changeHealth(+4);
     break;
    case "B":
     state.money -= 30;
     changeHealth(+3);
     break;
    case "C":
     state.money -= 20;
     changeHealth(+2);
     break;
    case "D":
     state.money -= 5;
     changeHealth(+1);
     break;
    case "E":
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.neighborhood = action;
    state.stageId = "D2" + action;
    state.progress++;
   }
   break;
  case "D2A":
   switch (action) {
    case "A":
     state.experience += 4;
     break;
    case "B":
     state.experience += 3;
     state.bonuses -= 3;
     break;
    case "C":
     state.experience += 2;
     state.money -= 5;
     break;
    case "D":
     state.experience += 1;
     state.bonuses -= 1;
     break;
    case "E":
     state.money -= 1;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.school = action;
    state.stageId = "D3";
    state.progress++;
   }
   break;
  case "D2B":
   switch (action) {
    case "A":
     state.experience += 4;
     state.money -= 20;
     break;
    case "B":
     state.experience += 3;
     break;
    case "C":
     state.experience += 2;
     state.money -= 5;
     break;
    case "D":
     state.experience += 1;
     state.bonuses -= 1;
     break;
    case "E":
     state.money -= 1;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.school = action;
    state.stageId = "D3";
    state.progress++;
   }
   break;
  case "D2C":
   switch (action) {
    case "A":
     state.experience += 4;
     state.money -= 20;
     break;
    case "B":
     state.experience += 3;
     state.bonuses -= 3;
     break;
    case "C":
     state.experience += 2;
     break;
    case "D":
     state.experience += 1;
     state.bonuses -= 1;
     break;
    case "E":
     state.money -= 1;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.school = action;
    state.stageId = "D3";
    state.progress++;
   }
   break;
  case "D2D":
   switch (action) {
    case "A":
     state.experience += 4;
     state.money -= 20;
     break;
    case "B":
     state.experience += 3;
     state.bonuses -= 3;
     break;
    case "C":
     state.experience += 2;
     state.money -= 5;
     break;
    case "D":
     state.experience += 1;
     break;
    case "E":
     state.money -= 1;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.school = action;
    state.stageId = "D3";
    state.progress++;
   }
   break;
  case "D2E":
   switch (action) {
    case "A":
     state.experience += 4;
     state.money -= 20;
     break;
    case "B":
     state.experience += 3;
     state.bonuses -= 3;
     break;
    case "C":
     state.experience += 2;
     state.money -= 5;
     break;
    case "D":
     state.experience += 1;
     state.bonuses -= 1;
     break;
    case "E":
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.school = action;
    state.stageId = "D3";
    state.progress++;
   }
   break;
  case "D3":
   if (!(action.length == 1 && action >= "A" && action <= "E"))
    throw new Error("Illegal action for stage " + stageId + ": " + action);
   if (action >= "A" && action <= "D")
    changeHealth(+1);
   if (action == "D")
    state.bonuses -= 1;
   state.stageId = "D4";
   state.progress++;
   break;
  case "D4":
   switch (action) {
    case "A":
     changeHealth(+1);
     break;
    case "B":
     state.experience += 1;
     break;
    case "C":
     state.money += 3;
     break;
    case "D":
     state.bonuses += 1;
     break;
    case "E":
     changeHealth(-3);
     state.money += 5;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D5.1";
   state.progress++;
   break;
  case "D5.1":
   switch (action) {
    case "A":
     state.healthToCommit = +1;
     break;
    case "B":
     state.healthToCommit = -2;
     break;
    case "C":
     state.healthToCommit = -2;
     break;
    case "D":
     state.healthToCommit = -3;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D5.2";
   state.progress++;
   break;
  case "D5.2":
   switch (action) {
    case "A":
     changeHealth(state.healthToCommit);
     state.healthToCommit = 0;
     break;
    case "B":
     state.bonuses -= 1;
     state.healthToCommit = 0;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (state.social.includes("V") || state.social.includes("W"))
    state.stageId = "D6VW";
   else if (state.social.includes("S"))
    state.stageId = "D6S";
   else
    state.stageId = "D6";
   state.progress++;
   break;
  case "D6VW":
   switch (action) {
    case "A":
    case "B":
     state.experience += 3;
     break;
    case "C":
     state.bonuses -= 1;
     state.experience += 3;
     break;
    case "D":
     state.money -= 5;
     state.experience += 3;
     break;
    case "E":
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV1";
    state.progress++;
   }
   break;
  case "D6S":
   switch (action) {
    case "A":
    case "B":
     state.experience += 3;
     break;
    case "C":
     state.bonuses -= 3;
     state.experience += 3;
     break;
    case "D":
     state.money -= 15;
     state.experience += 3;
     break;
    case "E":
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV1";
    state.progress++;
   }
   break;
  case "D6":
   switch (action) {
    case "A":
    case "B":
     state.experience += 3;
     break;
    case "C":
     state.bonuses -= 2;
     state.experience += 3;
     break;
    case "D":
     state.money -= 15;
     state.experience += 3;
     break;
    case "E":
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV1";
    state.progress++;
   }
   break;
  case "CV1":
   switch (action) {
    case "A":
     state.bonuses -= 2;
     if (state.neighborhood == "A" || state.neighborhood == "B")
      changeHealth(+3);
     else
      changeHealth(-1);
     break;
    case "B":
     state.bonuses -= 2;
     if (state.neighborhood == "C")
      changeHealth(+3);
     else
      changeHealth(-1);
     break;
    case "C":
     state.bonuses -= 2;
     if (state.neighborhood == "D")
      changeHealth(+3);
     else
      changeHealth(-1);
     break;
    case "D":
     state.bonuses -= 2;
     if (state.neighborhood == "E")
      changeHealth(+3);
     else
      changeHealth(-1);
     break;
    case "E":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (state.social.includes("V") || state.social.includes("W") || state.neighborhood == "A")
    state.stageId = "D7VWA";
   else if (state.social.includes("Q"))
    state.stageId = "D7Q";
   else
    state.stageId = "D7";
   state.progress++;
   break;
  case "D7VWA":
   switch (action) {
    case "A":
     changeHealth(-1);
    break;
   default:
    throw new Error("Illegal action for stage " + stageId + ": " + action);
    break;
   }
   state.stageId = "D8";
   state.progress++;
   break;
  case "D7Q":
   switch (action) {
    case "B":
     state.money -= 15;
     break;
    case "C":
     state.bonuses-= 3;
     break;
    case "D":
     state.experience -= 3;
     break;
    case "E":
     changeHealth(-6);
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "B" && action <= "E") {
    state.stageId = "D8";
    state.progress++;
   }
   break;
  case "D7":
   switch (action) {
    case "B":
     state.money -= 10;
     break;
    case "C":
     state.bonuses-= 2;
     break;
    case "D":
     state.experience -= 2;
     break;
    case "E":
     changeHealth(-4);
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "B" && action <= "E") {
    state.stageId = "D8";
    state.progress++;
   }
   break;
  case "D8":
   switch (action) {
    case "A":
     changeHealth(+1);
     break;
    case "B":
     state.money -= 5;
     state.experience += 3;
     break;
    case "C":
     state.money += 3;
     break;
    case "D":
     state.bonuses+= 1;
     break;
    case "E":
     state.experience -= 3;
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    if (state.neighborhood == "A" || state.neighborhood == "B")
     state.stageId = "D9AB";
    else if (state.wellness >= 5)
     state.stageId = "D9H";
    else
     state.stageId = "D9U";
    state.progress++;
   }
   break;
  case "D9AB":
   switch (action) {
    case "A":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (state.experience >= 8)
    state.stageId = "D10E8";
   else if (state.experience >= 6)
    state.stageId = "D10E6";
   else if (state.experience >= 4)
    state.stageId = "D10E4";
   else if (state.experience >= 2)
    state.stageId = "D10E2";
   else
    state.stageId = "D10E0";
   state.progress++;
   break;
  case "D9H":
   switch (action) {
    case "B":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (state.experience >= 8)
    state.stageId = "D10E8";
   else if (state.experience >= 6)
    state.stageId = "D10E6";
   else if (state.experience >= 4)
    state.stageId = "D10E4";
   else if (state.experience >= 2)
    state.stageId = "D10E2";
   else
    state.stageId = "D10E0";
   state.progress++;
   break;
  case "D9U":
   switch (action) {
    case "C":
     state.bonuses -= 2;
     break;
    case "D":
     state.money -= 10;
     break;
    case "E":
     changeHealth(-6);
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "C" && action <= "E") {
    if (state.experience >= 8)
     state.stageId = "D10E8";
    else if (state.experience >= 6)
     state.stageId = "D10E6";
    else if (state.experience >= 4)
     state.stageId = "D10E4";
    else if (state.experience >= 2)
     state.stageId = "D10E2";
    else
     state.stageId = "D10E0";
    state.progress++;
   }
   break;
  case "D10E8":
   switch (action) {
    case "A":
     state.money -= 5;
     state.experience += 4;
     break;
    case "B":
     state.experience += 3;
     break;
    case "C":
     state.experience += 2;
     break;
    case "D":
     state.experience += 1;
     state.money += 5;
     break;
    case "E":
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV2";
    state.progress++;
   }
   break;
  case "D10E6":
   switch (action) {
    case "A":
     state.money -= 10;
     state.experience += 4;
     break;
    case "B":
     state.money -= 5;
     state.experience += 3;
     break;
    case "C":
     state.experience += 2;
     break;
    case "D":
     state.experience += 1;
     state.money += 5;
     break;
    case "E":
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV2";
    state.progress++;
   }
   break;
  case "D10E4":
   switch (action) {
    case "A":
     state.money -= 20;
     state.experience += 4;
     break;
    case "B":
     state.money -= 10;
     state.experience += 3;
     break;
    case "C":
     state.money -= 5;
     state.experience += 2;
     break;
    case "D":
     state.bonuses -= 1;
     state.experience += 1;
     state.money += 5;
     break;
    case "E":
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "CV2";
    state.progress++;
   }
   break;
  case "D10E2":
   switch (action) {
    case "B":
     state.money -= 20;
     state.experience += 3;
     break;
    case "C":
     state.money -= 10;
     state.experience += 2;
     break;
    case "D":
     state.bonuses -= 2;
     state.experience += 1;
     state.money += 5;
     break;
    case "E":
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "B" && action <= "E") {
    state.stageId = "CV2";
    state.progress++;
   }
   break;
  case "D10E0":
   switch (action) {
    case "C":
     state.money -= 20;
     state.experience += 2;
     break;
    case "D":
     state.bonuses -= 3;
     state.experience += 1;
     state.money += 5;
     break;
    case "E":
     state.money += 5;
     break;
    case "DEBT":
     borrow(1, 9, 1, 10, 18, 2);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "C" && action <= "E") {
    state.stageId = "CV2";
    state.progress++;
   }
   break;
  case "CV2":
   if (action.length == 1 && action >= "A" && action <= "E") {
    if (state.money >= 2)
     state.money -= 2;
    else if (state.bonuses >= 1)
     state.bonuses -= 1;
    else
     throw new Error("Illegal money/bonuses state for stage " + stageId + ": " + action);
   }
   switch (action) {
    case "A":
     if (state.money > 20)
      state.money -= 5;
     else if (state.money < 5)
      state.money += 3;
     break;
    case "B":
     if (state.money > 15)
      state.money += 3;
     else if (state.money < 5)
      changeHealth(-3);
     break;
    case "C":
     state.bonuses = 0;
     break;
    case "D":
     if (state.social.includes("P") || state.social.includes("Q") || state.social.includes("S"))
      state.bonuses += 1;
     break;
    case "E":
     break;
    case "N":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D11";
   state.progress++;
   break;
  case "D11":
   switch (action) {
    case "A":
     changeHealth(+1);
    break;
    case "B":
     state.experience += 1;
    break;
    case "C":
     state.money += 3;
     break;
    case "D":
      state.bonuses += 1;
    break;
    case "E":
     changeHealth(-3);
     state.money += 5;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (state.experience >= 13)
    state.stageId = "D12E13";
   else if (state.experience >= 10)
    state.stageId = "D12E10";
   else if (state.experience >= 7)
    state.stageId = "D12E7";
   else if (state.experience >= 4)
    state.stageId = "D12E4";
   else
    state.stageId = "D12E0";
   state.progress++;
   break;
  case "D12E13":
   switch (action) {
    case "A":
     state.bonus -= 1;
     state.money += 20;
     changeHealth(+3);
     break;
    case "B":
     state.money += 10;
     changeHealth(+2);
     break;
    case "C":
     state.money += 5;
     changeHealth(+1);
     break;
    case "D":
     state.money += 2;
     break;
    case "E":
     state.money += 1;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D13";
   state.progress++;
   break;
  case "D12E10":
   switch (action) {
    case "A":
     state.bonus -= 2;
     state.money += 20;
     changeHealth(+3);
     break;
    case "B":
     state.bonus -= 1;
     state.money += 10;
     changeHealth(+2);
     break;
    case "C":
     state.money += 5;
     changeHealth(+1);
     break;
    case "D":
     state.money += 2;
     break;
    case "E":
     state.money += 1;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D13";
   state.progress++;
   break;
  case "D12E7":
   switch (action) {
    case "A":
     state.bonus -= 3;
     state.money += 20;
     changeHealth(+3);
     break;
    case "B":
     state.bonus -= 2;
     state.money += 10;
     changeHealth(+2);
     break;
    case "C":
     state.bonus -= 1;
     state.money += 5;
     changeHealth(+1);
     break;
    case "D":
     state.money += 2;
     break;
    case "E":
     state.money += 1;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D13";
   state.progress++;
   break;
  case "D12E4":
   switch (action) {
    case "B":
     state.bonus -= 3;
     state.money += 10;
     changeHealth(+2);
     break;
    case "C":
     state.bonus -= 2;
     state.money += 5;
     changeHealth(+1);
     break;
    case "D":
     state.bonus -= 1;
     state.money += 2;
     break;
    case "E":
     state.money += 1;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D13";
   state.progress++;
   break;
  case "D12E0":
   switch (action) {
    case "C":
     state.bonus -= 3;
     state.money += 5;
     changeHealth(+1);
     break;
    case "D":
     state.bonus -= 2;
     state.money += 2;
     break;
    case "E":
     state.money += 1;
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D13";
   state.progress++;
   break;
  case "D13":
   switch (action) {
    case "A":
     break;
    case "B":
     state.bonuses -= 1;
     break;
    case "C":
     state.money -= 5;
     break;
    case "D":
     state.experience -= 2;
     break;
    case "E":
     changeHealth(-4);
     break;
    case "DEBT":
     borrow(1, 9, 2, 10, 16, 4);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   if (action.length == 1 && action >= "A" && action <= "E") {
    state.stageId = "D14";
    state.progress++;
   }
   break;
  case "D14":
   switch (action) {
    case "A":
     changeHealth(+2);
     break;
    case "B":
     changeHealth(-1);
     break;
    case "C":
    case "D":
     changeHealth(-3);
     break;
    case "E":
     changeHealth(-5);
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "D15";
   state.progress++;
   break;
  case "D15":
   switch (action) {
    case "A":
     state.bonuses -= 1;
     state.money += 5;
     state.experience += 3;
     break;
    case "B":
     state.bonuses -= 2;
     state.money += 5;
     state.experience += 3;
     break;
    case "C":
     state.bonuses -= 3;
     state.money += 5;
     state.experience += 3;
     break;
    case "D":
     state.bonuses -= 4;
     state.money += 5;
     state.experience += 3;
     break;
    case "E":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "CV3";
   state.progress++;
   break;
  case "CV3":
   switch (action) {
    case "A":
     if (state.experience >= 6) {
      state.money += 5;
      state.experience += 2;
     }
     break;
    case "B":
     if (state.social.includes("N")) {
      state.money += 5;
      state.experience += 2;
     }
     break;
    case "C":
     if (state.social.includes("P")) {
      state.money += 5;
      state.experience += 2;
     }
     break;
    case "D":
     if (state.social.includes("Q")) {
      state.money += 5;
      state.experience += 2;
     }
     break;
    case "E":
     if (state.social.includes("S")) {
      state.money += 5;
      state.experience += 2;
     }
     break;
    case "N":
     break;
    default:
     throw new Error("Illegal action for stage " + stageId + ": " + action);
     break;
   }
   state.stageId = "E1";
   state.progress++;
   state.total = state.money + state.bonuses + state.wellness + state.experience
    - state.debt - state.illness;
   if (enableSnarkyComment) {
    if (state.total < 0)
     state.snarkyComment = "A stranger passes near you, gives you a despective look and says: You're an outcast. You don't even try to do a minimum to try to integrate in our society.";
    else if (state.total < 10)
     state.snarkyComment = "A stranger passes near you, gives you a condescending look and says: It might be that you've taken bad decisions in life. You're such a lazy person. It must have been that you haven't worked hard enough to be successful in life.";
    else if (state.total < 30)
     state.snarkyComment = "A stranger passes near you and doesn't even look to you. \"Just a piece more of our society\", they think, unaware about if you've reached your position because of effort or because of privilege, as they continue their way.";
    else
     state.snarkyComment = "A stranger passes near you, looks at you in admiration and says: See? Anybody can have a good life if they make a little bit of effort to get there!";
   }
   break;
  case "E1":
   state.stageId = "E2";
   state.snarkyComment = "";
   state.progress++;
   break;
  case "E2":
   setTimeout(startGame, 0);
   return;
   break;
  default:
   throw new Error("Illegal state.stageId: " + stageId);
 }
 setTimeout(displayState, 0);
}

function undo() {
 if (stateHistory.length) {
  state = stateHistory.pop();
  setTimeout(displayState, 0);
 }
}

// Manages wellness/illness constraints
function changeHealth(delta) {
 var health = state.wellness - state.illness + delta;
 if (health >= 0) {
  state.wellness = health;
  state.illness = 0;
 } else {
  state.wellness = 0;
  state.illness = -health;
 }
}
