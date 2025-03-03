import requests
import json
from operator import itemgetter
from pytz import timezone

def get_scoreticker_json():
	tz = timezone('EST')
	sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json")
	games = json.loads(sauce.content.decode('utf-8'))
	away = []
	home = []
	matches = []
	for game in games['games']:
		gm=[]
		away = [game['game']['away']['names']['char6'],game['game']['away']['score'],game['game']['away']['seed'],game['game']['away']['winner'],game['game']['away']['names']['short'],game['game']['away']['description'],game['game']['away']['names']['seo']]
		home = [game['game']['home']['names']['char6'],game['game']['home']['score'],game['game']['home']['seed'],game['game']['home']['winner'],game['game']['home']['names']['short'],game['game']['home']['description'],game['game']['home']['names']['seo']]
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
	sauce = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json")
	games = json.loads(sauce.content.decode('utf-8'))
	matches = []
	for game in games['games']:
		gm=[]
		if game['game']['gameState'] == 'live':
			period = game['game']['currentPeriod']
			if period != "HALF" and period != "END 2ND":
				period += " " +str(game['game']['contestClock'])
			gm.append(period)
		elif game['game']['gameState'] == 'final':
			gm.append("")
		else:
			gm.append(game['game']['startTime'])
		gm.append(game['game']['gameState'])
		gm.append(game['game']['url'])
		if (game['game']['bracketId'] != ""):
			gm.append(game['game']['bracketId'])
			matches.append(gm)
	type_sorted = sorted(matches, key=itemgetter(0),reverse=True)
	return type_sorted

def get_bracket_winners(games,region):
	matches = []
	winners = {}
	for game in games['games']:
		if game['game']['away']['winner'] and (game['game']['bracketRegion'] != ""):
			winners[game['game']['bracketId']] = region[game['game']['bracketRegion']] + game['game']['away']['seed']
		if game['game']['home']['winner'] and (game['game']['bracketRegion'] != ""):
			winners[game['game']['bracketId']] = region[game['game']['bracketRegion']] + game['game']['home']['seed']
	return winners

def get_winners_f4(games,region,region_dict):
	matches = []
	winners = {}
	for game in games['games']:
		if game['game']['away']['winner']:
			winners[game['game']['bracketId']] = region[region_dict[game['game']['away']['names']['short']]]+ game['game']['away']['seed']
		if game['game']['home']['winner']:
			winners[game['game']['bracketId']] = region[region_dict[game['game']['home']['names']['short']]]+game['game']['home']['seed']
	return winners

def get_losers_f4(games,region,region_dict):
	matches = []
	losers = {}
	for game in games['games']:
		if game['game']['away']['winner']:
			losers[game['game']['bracketId']] = region[region_dict[game['game']['home']['names']['short']]]+ game['game']['home']['seed']
		if game['game']['home']['winner']:
			losers[game['game']['bracketId']] = region[region_dict[game['game']['away']['names']['short']]]+game['game']['away']['seed']
	return losers

def get_team_region_dict(games):
	team_region_dict = {}
	for game in games['games']:
		team_region_dict[game['game']['away']['names']['short']] = game['game']['bracketRegion']
		team_region_dict[game['game']['home']['names']['short']] = game['game']['bracketRegion']
	return team_region_dict

def convert_names(games):
	region1 = {"SOUTH":'2',"WEST":'1',"EAST":'3',"MIDWEST":'4'}
	team_name_dict = {}
	for game in games['games']:
		if game['game']['bracketRegion'] != "":
			team_name_dict[region1[game['game']['bracketRegion']] + game['game']['away']['seed']] = game['game']['away']['seed'] + " " + game['game']['away']['names']['short']
			team_name_dict[region1[game['game']['bracketRegion']] + game['game']['home']['seed']] = game['game']['home']['seed'] + " " + game['game']['home']['names']['short']
	return team_name_dict

def convert_short_to_seo():
	s_to_seo = {}
	for game in (games11['games']+games12['games']):
		if game['game']['bracketId'] != '':
			s_to_seo[game['game']['away']['seed'] + " " +game['game']['away']['names']['short']] = game['game']['away']['names']['seo']
			s_to_seo[game['game']['home']['seed'] + " " +game['game']['home']['names']['short']] = game['game']['home']['names']['seo']
	return s_to_seo

def convert_ncaa_to_master(game_id):
	rd = int(game_id[0])
	gm = int(game_id[1:])
	index = gm
	if rd == 3:
		index+=32
	elif rd == 4:
		index+=48
	elif rd == 5:
		index+=56
	elif rd == 6:
		index+=60
	elif rd == 7:
		index+=62
	index-=1
	return index

def get_master_bracket():
	master = ['']*63
	dict11 = get_vars()[0]
	for value in sorted(dict11.items()):
		if int(value[0][0]) == 3:
			offset = 32
		elif int(value[0][0]) == 4:
			offset = 48
		elif int(value[0][0]) == 5:
			offset = 56
		elif int(value[0][0]) == 6:
			offset = 60
		elif int(value[0][0]) == 7:
			offset = 62
		else:
			offset = 0
		master[int(value[0][1:])-1 + offset] = name_conversion[dict11[value[0]]]
	return master

def get_bracket_teams():
	teams = ['']*64
	for game in (games11['games']+games12['games']):
		if game['game']['bracketId'] != '':
			index = int(game['game']['bracketId'][1:])-1
			if len(game['game']['away']['names']['short'])<20:
				away = game['game']['away']['seed'] + " " + game['game']['away']['names']['short']
			else:
				away = game['game']['away']['seed'] + " " + game['game']['away']['names']['char6']
			if len(game['game']['home']['names']['short'])<20:
				home = game['game']['home']['seed'] + " " + game['game']['home']['names']['short']
			else:
				home = game['game']['home']['seed'] + " " + game['game']['home']['names']['char6']
			if int(game['game']['away']['seed']) < int(game['game']['home']['seed']):
				teams[index*2] = away
				teams[index*2+1] = home
			else:
				teams[index*2] = home
				teams[index*2+1] = away
	return teams

def get_bracket_losers(games,region):
	matches = []
	losers = {}
	for game in games['games']:
		if game['game']['away']['winner'] and (game['game']['bracketRegion'] != ""):
			losers[game['game']['bracketId']] = region[game['game']['bracketRegion']] + game['game']['home']['seed']
		if game['game']['home']['winner'] and (game['game']['bracketRegion'] != ""):
			losers[game['game']['bracketId']] = region[game['game']['bracketRegion']] + game['game']['away']['seed']
	return losers

def get_elim():
	elim = ['']*63
	elim_dict11 = get_vars()[1]
	for index,value in enumerate(sorted(elim_dict11.items())):
		elim[index] = name_conversion[elim_dict11[value[0]]]
	return elim

def get_vars():
	region1 = {"SOUTH":'2',"WEST":'1',"EAST":'3',"MIDWEST":'4'}
	round11 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json")
	round12 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/22/scoreboard.json")
	round21 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/23/scoreboard.json")
	round22 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/24/scoreboard.json")
	round31 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/28/scoreboard.json")
	round32 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/29/scoreboard.json")
	# round41 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/30/scoreboard.json")
	# round42 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/31/scoreboard.json")
	# round51 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/06/scoreboard.json")
	# round61 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/04/08/scoreboard.json")
	games11 = json.loads(round11.content.decode('utf-8'))
	games12 = json.loads(round12.content.decode('utf-8'))
	games21 = json.loads(round21.content.decode('utf-8'))
	games22 = json.loads(round22.content.decode('utf-8'))
	games31 = json.loads(round31.content.decode('utf-8'))
	games32 = json.loads(round32.content.decode('utf-8'))
	# games41 = json.loads(round41.content.decode('utf-8'))
	# games42 = json.loads(round42.content.decode('utf-8'))
	# games51 = json.loads(round51.content.decode('utf-8'))
	# games61 = json.loads(round61.content.decode('utf-8'))
	dict11 = get_bracket_winners(games11,region1)
	dict12 = get_bracket_winners(games12,region1)
	dict21 = get_bracket_winners(games21,region1)
	dict22 = get_bracket_winners(games22,region1)
	dict31 = get_bracket_winners(games31,region1)
	dict32 = get_bracket_winners(games32,region1)
	# dict41 = get_bracket_winners(games41,region1)
	# dict42 = get_bracket_winners(games42,region1)
	# dict51 = get_winners_f4(games51,region1,name_region)
	# dict61 = get_winners_f4(games61,region1,name_region)
	dict11.update(dict12)
	dict11.update(dict21)
	dict11.update(dict22)
	dict11.update(dict31)
	dict11.update(dict32)
	# dict11.update(dict41)
	# dict11.update(dict42)
	# dict11.update(dict51)
	# dict11.update(dict61)
	elim_dict11 = get_bracket_losers(games11,region1)
	elim_dict12 = get_bracket_losers(games12,region1)
	elim_dict21 = get_bracket_losers(games21,region1)
	elim_dict22 = get_bracket_losers(games22,region1)
	elim_dict31 = get_bracket_losers(games31,region1)
	elim_dict32 = get_bracket_losers(games32,region1)
	# elim_dict41 = get_bracket_losers(games41,region1)
	# elim_dict42 = get_bracket_losers(games42,region1)
	# elim_dict51 = get_losers_f4(games51,region1,name_region)
	# elim_dict61 = get_losers_f4(games61,region1,name_region)
	elim_dict11.update(elim_dict12)
	elim_dict11.update(elim_dict21)
	elim_dict11.update(elim_dict22)
	elim_dict11.update(elim_dict31)
	elim_dict11.update(elim_dict32)
	# elim_dict11.update(elim_dict41)
	# elim_dict11.update(elim_dict42)
	# elim_dict11.update(elim_dict51)
	# elim_dict11.update(elim_dict61)
	return (dict11,elim_dict11)

region1 = {"SOUTH":'2',"WEST":'1',"EAST":'3',"MIDWEST":'4'}
round11 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/21/scoreboard.json")
round12 = requests.get("https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2024/03/22/scoreboard.json")
games11 = json.loads(round11.content.decode('utf-8'))
games12 = json.loads(round12.content.decode('utf-8'))
name_region = get_team_region_dict(games11)
name_region.update(get_team_region_dict(games12))
name_conversion = convert_names(games11)
name_conversion.update(convert_names(games12))