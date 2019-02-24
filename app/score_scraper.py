from bs4 import BeautifulSoup
import requests

def get_scoreticker():
	sauce = requests.get("https://www.sports-reference.com/cbb/")
	soup = BeautifulSoup(sauce.content,'html.parser')
	games = soup.find("div",{"class": "game_summaries"})
	winners = games.findAll("tr",{"class": "winner"})
	losers = games.findAll("tr",{"class": "loser"})
	list_winners = []
	list_losers =  []
	for game in winners:
		list_winners.append([game.find("a").getText(),game.find("td",{"class": "right"}).getText()])

	for game in losers:
		list_losers.append([game.find("a").getText(),game.find("td",{"class": "right"}).getText()])

	print(list_winners)
	return [list_winners,list_losers]

get_scoreticker()