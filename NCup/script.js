
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, onSnapshot, collection, addDoc, getDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

import { 
  getAuth,
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';


const app = initializeApp({
  apiKey: "AIzaSyCgX7GhcGAoxANvghAbJonX0e7ABalUWh4",
  authDomain: "ncup-fa0ae.firebaseapp.com",
  projectId: "ncup-fa0ae",
  storageBucket: "ncup-fa0ae.appspot.com",
  messagingSenderId: "415233476320",
  appId: "1:415233476320:web:2d217a347ade891be83285",
  measurementId: "G-C5N6WNESRG"
});

const auth = getAuth(app);

const login = document.getElementById('loginform');
login.addEventListener('submit', (event) => {
  event.preventDefault();
  try{
    // const mailAddr = document.getElementById('email').value;
    const mailAddr = "invenis2@gmail.com";
    const password = document.getElementById('password').value;
    signInWithEmailAndPassword(auth, mailAddr, password)
      .then((userCredential) => {
        
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log("failed to login");
      });
  }catch(ex){
    console.log("something went wrong: ", ex);
  }
});

let IsAdmin = false;

const monitorAuthState = () => {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, user => {
      const logoutBtn = document.getElementById("logoutBtn");
      if (user){
        document.getElementById("emailLoginName").innerText = "logged in as " + user.email;
        IsAdmin = true;
        logoutBtn.style.display = "block";
      }
      else{
        document.getElementById("emailLoginName").innerText = "";
        logoutBtn.style.display = "none";
      }
      resolve();
    })
  });
}

await monitorAuthState();

if (IsAdmin){
  const addBtn = document.getElementById('databaseBtn');
  const reloadBtn = document.getElementById('reloadBtn');
  const numGroups = document.getElementById('numGroups');
  addBtn.addEventListener("click", LoadToDatabase);
  reloadBtn.addEventListener("click", () => {
    const numArr = toNumArr(numGroups.value);
    if (numArr != null){
      curr_doc = INITGroupStages(numArr);
    }
  })
}

const matchTemplate = document.querySelector('#match-template').content;
const innerTestEElements = document.querySelectorAll('.innerTestE');

innerTestEElements.forEach(element => {
  let cloned_temp = matchTemplate.cloneNode(true);
  element.replaceWith(cloned_temp);
});

// setup matches database connection: 
const adminElements = document.querySelectorAll('.adminRights');
const adminElements2 = document.querySelectorAll('.adminRights2');
if (IsAdmin){
  adminElements.forEach((el) => {
    el.setAttribute("contenteditable", true);
    el.style.display = "inline";
  });
  adminElements2.forEach((el) => {
    el.style.display = "block";
  });
}

const addTeamForm = document.querySelector('#add-team-form');
const teamLogosTemplate = document.querySelector('#team-logos-template');

addTeamForm.addEventListener('submit', (event) => {
  event.preventDefault();
  
  const teamName = addTeamForm.elements['team-name'].value;
  const teamLogoUrl = addTeamForm.elements['team-logo-url'].value;
  
  const newTeamLogoTuple = document.importNode(teamLogosTemplate.content, true);
  newTeamLogoTuple.querySelector('img').src = teamLogoUrl;
  newTeamLogoTuple.querySelector('.team-name2').textContent = teamName;
  
  try{
    curr_doc.teamLogos[teamName] = teamLogoUrl;
  }
  catch(error){
  }
  LoadToDatabase();
});

const logoutBtn = document.getElementById("logoutBtn");
logoutBtn.addEventListener('click', ()=>{
  signOut(auth);
})

function CalcPoints(dat){
  if (dat["pkte"] >= 0){
    return dat["pkte"];
  }
  return dat["S"]*3 + dat["U"] + (dat["T"] - dat["GT"])/2000;
}

const numMatches = 7;

let num_functions_updating = 0;

function UpdateTimings(doc, step){
  if (doc == null){
    return;
  }
  if (num_functions_updating > step){
    return;
  }
  doc.matches.forEach((match, index) => {
    let matchDiv = document.querySelector(`#match_${index}`);
    if (matchDiv) {
      let match_duration = match.duration;
      // update the start time
      let startTime = new Date(match.startTime);
      let differenceInMilliseconds = new Date() - startTime;
      let differenceInMinutes = differenceInMilliseconds / 60000;
      const timeDiv = matchDiv.querySelector('#currentMinute');
      const timeDivExtra = matchDiv.querySelector('#currentMinuteExtra');
      const greenBar = matchDiv.querySelector('#greenBar');

      const limit = match_duration*2;
      if (match.is_ended || differenceInMinutes >= limit){
        timeDiv.style.color = "gray";
        timeDiv.style.fontSize = "13px";
        timeDiv.innerText = "Ende";
        greenBar.style.display = "none";
        timeDivExtra.textContent = "";
      }
      else if (differenceInMinutes > 0 && differenceInMinutes < limit){
        timeDiv.textContent = Math.floor(Math.min(differenceInMinutes, match_duration)).toString() + "'";
        timeDivExtra.textContent = "";
        timeDiv.style.fontSize = "15px";
        timeDiv.style.color = "green";
        greenBar.style.display = "block";
        if (differenceInMinutes >= match_duration+1){
          timeDivExtra.style.fontSize = "15px";
          timeDivExtra.textContent = "+" + Math.floor(differenceInMinutes - match_duration).toString();
        }
      }
      else {
        timeDiv.style.color = "gray";
        timeDiv.style.fontSize = "13px";
        timeDiv.innerText = "offen";
        greenBar.style.display = "none";
        timeDivExtra.textContent = "";
      }
    }
  });
  let now = new Date();
  let delay = (60 - now.getSeconds()) * 1000 + 5
  setTimeout(() => {
    UpdateTimings(doc, step);
  }, delay);
}


function VisualizeMatches(data) {
  data.matches.forEach((match, index) => {
    let matchDiv = document.querySelector(`#match_${index}`);
    if (matchDiv) {
      const curr_doc_match = curr_doc.matches[index];

      // update the team names and logos
      let match_1_span = matchDiv.querySelector('#team_1_span');
      let match_2_span = matchDiv.querySelector('#team_2_span');
      let match_1_logo = matchDiv.querySelector('#team1_logo');
      let match_2_logo = matchDiv.querySelector('#team2_logo');

      match_1_span.textContent = match.country_1;
      match_2_span.textContent = match.country_2;
      if (data.teamLogos){
        if (match.country_1 in data.teamLogos){
          match_1_logo.src = data.teamLogos[match.country_1];
        }
        if (match.country_2 in data.teamLogos){
          match_2_logo.src = data.teamLogos[match.country_2];
        }
      }

      if (IsAdmin){
        match_1_span.addEventListener('input', () => { curr_doc_match.country_1 = match_1_span.innerText});
        match_2_span.addEventListener('input', () => { curr_doc_match.country_2 = match_2_span.innerText});
      }

      // update the score
      let scoreDivs = matchDiv.querySelectorAll('.numGoals');
      scoreDivs[0].textContent = match.goals_1;
      scoreDivs[1].textContent = match.goals_2;

      const startDate =  new Date(match.startTime);
      const startTime = startDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      const startSpan = matchDiv.querySelector('#startSpan');
      startSpan.textContent = startTime;

      const durationSpan = matchDiv.querySelector('#durationSpan');
      durationSpan.textContent = match.duration;

      if (IsAdmin){
        scoreDivs[0].addEventListener('input', () => { curr_doc_match.goals_1 = scoreDivs[0].innerText});
        scoreDivs[1].addEventListener('input', () => { curr_doc_match.goals_2 = scoreDivs[1].innerText});

        matchDiv.querySelector("#startTime").addEventListener("change", function() {
          curr_doc_match.startTime = this.value;
        });
        let now = new Date(match.startTime);
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        const formattedDate = now.toISOString().slice(0,16);
        matchDiv.querySelector("#startTime").value = formattedDate;

        let is_ended_inpt = matchDiv.querySelector(`#is_ended`);
        is_ended_inpt.checked = curr_doc_match.is_ended;
        is_ended_inpt.addEventListener('input', () => { curr_doc_match.is_ended = is_ended_inpt.checked });

        durationSpan.addEventListener('input', () => { 
          const duration_as_number = Number(durationSpan.textContent);
          if (duration_as_number)
          {
            curr_doc_match.duration = duration_as_number;
          }
        });
      }

    }
  });
  num_functions_updating += 1;
  UpdateTimings(data, num_functions_updating);
}

function VisualizeGroupStages(table_data, team_logos) {
  // Get the groups container element
  const groupsContainer = document.getElementById('groups');
  groupsContainer.innerHTML = "";
  // Get the group stats template
  const template = document.getElementById('group-stats-template');
  const templateTop = document.getElementById('group-stats-top');

  let k = 0;
  // Loop through the number of groups
  while (`${k + 1}` in table_data) {
    const group_outer = document.createElement('div');
    group_outer.classList.add('columnOuter2');
    const group = document.createElement('div');
    group.classList.add('columnGroups');

    const title = document.createElement('div');
    title.classList.add('title');
    title.textContent = `Gruppe ${k + 1}`;

    const topClone = templateTop.content.cloneNode(true);

    group_outer.appendChild(title);
    group_outer.appendChild(group);
    group.appendChild(topClone);

    // "clean" teams:
    table_data[`${k + 1}`].forEach((team, i) => {
      try{ team['TD'] = team['T'] - team['GT'];} catch(ex) {}
      try{ team['pkte'] = CalcPoints(team);} catch(ex){}
    }); 

    const indexedTeams = table_data[`${k + 1}`].map((team, index) => ({index, team}));
    const sortedIndexedTeams = indexedTeams.sort((a, b) => b.team.pkte - a.team.pkte);
    const reordering = sortedIndexedTeams.map(item => item.index);
    const sortedTeams = sortedIndexedTeams.map(item => item.team);

    // round points to integer
    table_data[`${k + 1}`].forEach((team, i) => {
      try{ team['pkte'] = Math.round(team['pkte']);} catch(ex) {console.log(ex);}
    }); 

    sortedTeams.forEach((team, i) => {
      const clone = template.content.cloneNode(true);
      try{ team['TD'] = team['T'] - team['GT'];} catch(ex) {}
      try{ team['pkte'] = CalcPoints(team); } catch(ex){}
      Object.keys(team).forEach(key => {
        let key_val = team[key];
        let key_div = clone.querySelector(`#${key}`);
        if (key == "team_name"){
          let team_logo = clone.querySelector(`#team_logo`);
          if (team_logos && key_val in team_logos){
            team_logo.src = team_logos[key_val];
          }
        }
        key_div.innerText = key_val;
        const curr_k = k;
        if (IsAdmin){
          key_div.addEventListener('input', () => {
            const as_num = Number(key_div.innerText);
            if (!isNaN(as_num)){
              curr_doc.groups[`${curr_k + 1}`][reordering[i]][key] = as_num;
              console.log(as_num);
            }
            else{
              if (`${key}` == "team_name"){
                curr_doc.groups[`${curr_k + 1}`][reordering[i]][key] = key_div.innerText;
              }
            }
          });
          key_div.setAttribute("contenteditable", true);
          key_div.style.fontSize = "13px";
        }
        else{
          key_div.content
        }
      });
      group.appendChild(clone);
    });

    groupsContainer.appendChild(group_outer);
    k += 1;
  }
}

function VisualizeTeamLogos(teamLogos) {
  if (teamLogos === undefined) {
    console.error('teamLogos is undefined');
    return;
  }

  const teamLogosElement = document.querySelector('#team-logos');
  const teamLogosTemplate = document.querySelector('#team-logos-template');
  
  teamLogosElement.innerHTML = '';

  const sortedTeamNames = Object.keys(teamLogos).sort();
  sortedTeamNames.forEach(teamName => {
    const newTeamLogoTuple = document.importNode(teamLogosTemplate.content, true);
    newTeamLogoTuple.querySelector('img').src = teamLogos[teamName];
    newTeamLogoTuple.querySelector('.team-name2').textContent = teamName;
    const deleteBTN = newTeamLogoTuple.querySelector('#deleteBTN');
    deleteBTN.addEventListener("click", () => {
      delete curr_doc.teamLogos[teamName];
      LoadToDatabase();
    })
    teamLogosElement.appendChild(newTeamLogoTuple);
  });
}

function toNumArr(str) {
  let arr = str.split(',').map(Number);
  if (arr.some(isNaN)) {
      return null;
  }
  return arr;
}


function INITGroupStages(teamsPerGroup){
  let table_data = {};
  const k = teamsPerGroup.length;

  let curr_team = 0;

  for (let i = 0; i < k; i++) {
    table_data[`${i + 1}`] = [];

    for (let j = 0; j < teamsPerGroup[i]; j++) {
      curr_team += 1;
      table_data[`${i + 1}`].push({team_name: `team ${curr_team}`, pkte:-1, S:3, U:2, N:1, T:2, GT:3, TD:4});
    }
  }
  let matches_arr = [];

  for (let index = 0; index < numMatches+1; index++) {
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const curr_date = now.toISOString().substring(0, 16);
    matches_arr.push({country_1: "country 1", country_2: "country 2", goals_1: "1", goals_2: "2", startTime: curr_date, duration: 10, is_ended: false});
  }
  return {groups: table_data, matches: matches_arr, teamLogos: {}};
}

const db = getFirestore(app);
async function setGroupStats(groups_array) {
  try {
    const docRef = await updateDoc(doc(db, "NCup", "groupStages"), {
      groups: groups_array.groups,
      matches: groups_array.matches,
      teamLogos: groups_array.teamLogos
    });
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}


async function getGroupStats() {
  try {
    const docRef = doc(db, "NCup", "groupStages");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().groups;
    } else {
      console.log("No such document!");
    }
  } catch (e) {
    console.error("Error getting document: ", e);
    return null;
  }
}

async function VisualizeReactions(){
  const docRef = doc(db, "NCup", "reactions");
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const reactionsTable = document.querySelector('#reactions');
    const reactionTemplate = document.querySelector('#reaction');
    reactionsTable.innerHTML = "";
    
    Object.entries(docSnap.data()).forEach(([key, value]) => {
      const newReaction = document.importNode(reactionTemplate.content, true);
      newReaction.querySelector('#reactionSymbol').textContent = '"' + value + '"';
      newReaction.querySelector('#reactionName').textContent = " - " + key;
      reactionsTable.appendChild(newReaction);
    });
  } else {
    console.log("No such document!");
  }
}

const reactionForm = document.querySelector('#AddReactionForm');
reactionForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const reactionText = document.querySelector('#ReactionTextInpt').value;
  const reactionName = document.querySelector('#ReactionNameInpt').value;
  
  try {
    const docRef = await updateDoc(doc(db, "NCup", "reactions"), {
      [reactionName]: reactionText
    });
    VisualizeReactions();
  } catch (e) {
    console.error("Error adding reaction: ", e);
  }
});


let curr_doc = null;

async function LoadGroupStats() {
  const docRef = doc(db, "NCup", "groupStages");
  onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      curr_doc = doc.data();
      let curr_data = doc.data();
      try {
        if (IsAdmin){
          VisualizeTeamLogos(curr_data.teamLogos);
        }
        VisualizeMatches(curr_data);
        VisualizeGroupStages(curr_data.groups, curr_data.teamLogos);
      } catch (error) {
        console.log("Could not visualize:(", error);
      }
    } else {
      console.log("No such document!");
    }
  });
}

function LoadToDatabase(){
  console.log(curr_doc);
  setGroupStats(curr_doc);
}

// match: country1, country2, res1, res2, startTime, duration

LoadGroupStats();
VisualizeReactions();
