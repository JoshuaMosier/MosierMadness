from bs4 import BeautifulSoup
import requests
import csv

def get_scoreticker():
	sauce = requests.get("https://www.sports-reference.com/cbb/")
	soup = BeautifulSoup(sauce.content,'html.parser')
	games = soup.find("div",{"class": "game_summaries"})
	winners = games.findAll("tr",{"class": "winner"})
	losers = games.findAll("tr",{"class": "loser"})
	list_winners = []
	list_losers =  []
	name_lookup = convert_teamnames()
	for game in winners:
		list_winners.append([name_lookup[game.find("a").getText()],game.find("td",{"class": "right"}).getText()])
	for game in losers:
		list_losers.append([name_lookup[game.find("a").getText()],game.find("td",{"class": "right"}).getText()])
	return [list_winners,list_losers]

def convert_teamnames():
	dict = {}
	with open('abbreviations.txt') as csv_file:
		csv_reader = csv.reader(csv_file, delimiter=',')
		for row in csv_reader:
			dict[row[1]] = row[0]
	return dict

# Match:[[team,score,rank],[team,score,rank],winner,time]
def get_scoreticker_espn():
	sauce = requests.get("http://www.ncaa.com/scoreboard/basketball-men/d1")
	soup = BeautifulSoup(sauce.content,'html.parser')
	scoreboard = soup.find("div",{"id": "scoreboardGames"})
	games = scoreboard.findAll("div",{"class": "gamePod-type-game"})
	name_lookup = convert_teamnames()
	# print(scoreboard)
	matches = []
	home_winners = []
	away_winners = []
	for game in games:
		away = []
		home = []
		matchup = game.find("ul")
		teams = matchup.findAll("span",{"class": "gamePod-game-team-name"})
		scores = matchup.findAll("span",{"class": "gamePod-game-team-score"})
		ranks = matchup.findAll("span",{"class": "gamePod-game-team-rank"})
		if len(teams[0].getText())>8:
			away.append(name_lookup[teams[0].getText()])
		else:
			away.append(teams[0].getText())
		if len(teams[1].getText())>8:
			home.append(name_lookup[teams[1].getText()])
		else:
			home.append(teams[1].getText())
		away.append(scores[0].getText())
		home.append(scores[1].getText())
		away.append(ranks[0].getText() + " ")
		home.append(ranks[1].getText() + " ")
		wins = matchup.findAll("li")
		if wins[0].get("class")[0] == 'winner':
			away_winners.append(1)
		else:
			away_winners.append(0)
		if wins[1].get("class")[0] == 'winner':
			home_winners.append(1)
		else:
			home_winners.append(0)
		date = game.findAll("span",{"class": "game-time"})
		ret_date = ""
		if date != []:
			ret_date = date[0].getText()
		status = game.findAll("div",{"class": "gamePod-status"})
		ret_status = ""
		if status[0]:
			ret_status = status[0].getText()
		matches.append([away,home,ret_date,ret_status])
	return (matches,[away_winners,home_winners])