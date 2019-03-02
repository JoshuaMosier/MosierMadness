from bs4 import BeautifulSoup
import requests
import csv
import json
import datetime
from operator import itemgetter
from pytz import timezone

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

def get_scoreticker_json():
	tz = timezone('EST')
	# sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/"+datetime.datetime.now(tz).strftime('%Y/%m/%d')+"/scoreboard.json")
	sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2018/03/15/scoreboard.json")
	games = json.loads(sauce.content.decode('utf-8'))
	away = []
	home = []
	matches = []
	for game in games['games']:
		gm=[]
		away = [game['game']['away']['names']['char6'],game['game']['away']['score'],game['game']['away']['rank'],game['game']['away']['winner'],game['game']['away']['names']['short'],game['game']['away']['description'],game['game']['away']['names']['seo']]
		home = [game['game']['home']['names']['char6'],game['game']['home']['score'],game['game']['home']['rank'],game['game']['home']['winner'],game['game']['home']['names']['short'],game['game']['home']['description'],game['game']['home']['names']['seo']]
		gm.append(away)
		gm.append(home)
		gm.append(game['game']['gameState'])
		if game['game']['gameState'] == 'live':
			period = game['game']['currentPeriod']
			if period != "HALF" and period != "END 2ND":
				period += " " +str(game['game']['contestClock'])
			gm.append(period)
		elif game['game']['gameState'] == 'final':
			gm.append("")
		else: 
			gm.append(game['game']['startTime'])
		if (game['game']['bracketId'] != ""):
			matches.append(gm)
	type_sorted = sorted(matches, key=itemgetter(3),reverse=True)
	return type_sorted

def get_game_data():
	tz = timezone('EST')
	# sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/"+datetime.datetime.now(tz).strftime('%Y/%m/%d')+"/scoreboard.json")
	sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2018/03/15/scoreboard.json")
	games = json.loads(sauce.content.decode('utf-8'))
	matches = []
	for game in games['games']:
		gm=[]
		gm.append(game['game']['gameState'])
		gm.append(game['game']['url'])
		if (game['game']['bracketId'] != ""):
			matches.append(gm)
	type_sorted = sorted(matches, key=itemgetter(0),reverse=True)
	return type_sorted

def get_bracket_winners(games):
	matches = []
	region = {"SOUTH":'1',"WEST":'2',"EAST":'3',"MIDWEST":'4'}
	winners = {}
	for game in games['games']:
		if game['game']['away']['winner'] and game['game']['bracketRegion'] != "":
			winners[game['game']['bracketId']] = region[game['game']['bracketRegion']] + game['game']['away']['seed'] 
		if game['game']['home']['winner'] and game['game']['bracketRegion'] != "":
			winners[game['game']['bracketId'][1:]] = region[game['game']['bracketRegion']] + game['game']['home']['seed']
	return winners

# sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2018/03/15/scoreboard.json")
# games = json.loads(sauce.content.decode('utf-8'))
# get_bracket_winners(games)
