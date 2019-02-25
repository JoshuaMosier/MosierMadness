var teams = ['Virginia','UMBC','Creighton','Kansas St','Kentucky','Davidson','Arizona','Buffalo','Miami','Loyalo Chi','Tennessee','Wright St','Nevada','Texas','Cincinatti','Georgia St',
			 'Xavier','NCC/TSU','Missouri','Florida St','Ohio St','S Dakota St','Gonzaga','UNCG','Houston','San Diego St','Michigan','Montana','Texas A&M','Providence','UNC','Lipscomb',
			 'Villanova','LIUB/Radford','Virginia Tech','Alabama','West Virginia','Murray St','Wichita St','Marshall','Florida','St Bon/UCLA','Texas Tech','SF Austin','Arkansas','Butler','Purdue','CSU Fullerton',
			 'Kansas','Penn','Seton Hall','NC State','Clemson','New Mexico St','Auburn','Charleston','TCU','ASU/Syracuse','Michigan St','Bucknell','Rhode Island','Oklahoma','Duke','Iona']

var round1 =['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-']

var round2 =['-','-','-','-','-','-','-','-','-','-','-','-','-','-','-','-']

var round3 =['-','-','-','-','-','-','-','-']

var round4 =['-','-','-','-']

var round5 =['-','-']

var round6 =['-']

var rounds_string = ""

function setTeam(teamID, feed, game){
	var el = document.getElementById(feed);
	var set = document.getElementById(teamID);
	el.innerHTML = teamID;
	//el.classList.add("winner");
	round1[game] = teamID;
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//set.insertAdjacentHTML('afterbegin','<em class="score">0</em>');
	//el.insertAdjacentHTML('afterbegin','<strong>' + teamID + '</strong>');
	//alert("setTeam " + game + " " + teamID);
}

function updateRound2(gameID, oldgame, game){
	var el = document.getElementById(gameID);
	el.innerHTML = round1[oldgame];
	//el.classList.add("winner");
	round2[game] = round1[oldgame];
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//alert("updateRound2 " + oldgame + " " +game + " " + gameID);
}

function updateRound3(gameID, oldgame, game){
	var el = document.getElementById(gameID);
	el.innerHTML = round2[oldgame];
	//el.classList.add("winner");
	round3[game] = round2[oldgame];
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//alert("updateRound3 " + oldgame + " " + game + " " + gameID);
}

function updateRound4(gameID, oldgame, game){
	var el = document.getElementById(gameID);
	el.innerHTML = round3[oldgame];
	//el.classList.add("winner");
	round4[game] = round3[oldgame];
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//alert("updateRound4 " + oldgame + " " + game + " " + gameID);
 }

function updateRound5(gameID, oldgame, game){
	var el = document.getElementById(gameID);
	el.innerHTML = round4[oldgame];
	//el.classList.add("winner");
	round5[game] = round4[oldgame];
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//alert("updateRound5 " + oldgame + " " + game + " " + gameID);
}

function updateRound6(gameID, oldgame, game){
	var el = document.getElementById(gameID);
	champ = String(round5[oldgame])
	el.innerHTML = "Champion: " + champ.substring(champ.indexOf(" ") + 1);
	//el.classList.add("winner");
	round6[game] = String(round5[oldgame]);
	rounds_string = round1.concat(round2,round3,round4,round5,round6);
	//alert("updateRound5 " + oldgame + " " + game + " " + gameID);
}


//TO-DO
//-Check if next game winner was previous game winner after update
//-Have game winner seed match bracket CSS
//-Color code winners/loser
//-Have score tie-breaker input
//-Highlight overall winner correctly - maybe add to different location
//-Display team logos next to teamname