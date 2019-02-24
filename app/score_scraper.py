from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import re
import os

#launch url
url = "http://www.espn.com/mens-college-basketball/scoreboard"

# create a new Firefox session
def get_scoreticker():
	driver = webdriver.Chrome()
	driver = webdriver.Chrome('C:/Users/joshr/OneDrive/Documents/GitHub/MosierMadness/app/chromedriver.exe') 
	driver.get(url)

	a=[];
	a = driver.find_elements_by_class_name("competitors")

	soup = BeautifulSoup(driver.page_source)
	score_tables = soup.find("div", {"id": "events"})
	teams = score_tables.findAll("span",{"class": "sb-team-abbrev"})
	scores = score_tables.findAll("td",{"class": "total"})
	teams_stripped = []
	scores_stripped = []
	for i,team in enumerate(teams):
			teams_stripped.append(teams[i].getText())
			scores_stripped.append(scores[i].getText())

	driver.close()
	return [teams_stripped,scores_stripped]