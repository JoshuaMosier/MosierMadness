def score(master,users):
    scores = []
    ret = ['','','','','','','']
    score1 = score2 = score3 = score4 = score5 = score6 = total = games = 0
    for user in users:
        if user.round1 is "\"":
            scores.append(ret)
        else:
            temp = user.round1.replace('"','').replace('[','').replace(']','')
            submission = temp.split(',')
            for index,selection in enumerate(submission):
                    if submission[index] == master[index]:
                        if index < 32:
                            score1 = score1 + 1
                        elif index < 48:
                            score2 = score2 + 2
                        elif index < 56:
                            score3 = score3 + 4
                        elif index < 60:
                            score4 = score4 + 8
                        elif index < 62:
                            score5 = score5 + 16
                        elif index == 62:
                            score6 = score6 + 32
                        games = games + 1
            total = score1 + score2 + score3 + score4 + score5 + score6
            # print(user.firstname + " " + user.lastname + "," + str(score1+score2))
            ret = [score1, score2, score3, score4, score5, score6, total, games]
            scores.append(ret)
            score1 = score2 = score3 = score4 = score5= score6 = total = games = 0
    return scores

def potential(elim,users,master):
    potentials = []
    ptn = 192
    for user in users:
        if user.round1 is "\"" or "*" in user.round1:
            potentials.append('None')
        else:
            temp = user.round1.replace('"','').replace('[','').replace(']','')
            submission = temp.split(',')
            for ind,team in enumerate(elim):
                for index,selection in enumerate(submission):
                    if submission[index] == elim[ind]:
                        if index < 32:
                            ptn = ptn - 1
                        elif index < 48:
                            ptn = ptn - 2
                        elif index < 56:
                            ptn = ptn - 4
                        elif index < 60:
                            ptn = ptn - 8
                        elif index < 62:
                            ptn = ptn - 16
                        elif index == 62:
                            ptn = ptn - 32
            for index,selection in enumerate(submission):
                if selection == master[index] and selection not in elim:
                    if index < 32:
                        ptn = ptn - 1
                    elif index < 48:
                        ptn = ptn - 2
                    elif index < 56:
                        ptn = ptn - 4
                    elif index < 60:
                        ptn = ptn - 8
                    elif index < 62:
                        ptn = ptn - 16
                    elif index == 62:
                        ptn = ptn - 32
            potentials.append(ptn)
            ptn = 192
    return potentials

def get_end_rounds(users):
    rounds = []
    ret = []
    index = 0
    for user in users:
        if user.round1 == "\"":
            ret = []
        else:
            temp = user.round1.replace('"','').replace('[','').replace(']','')
            submission = temp.split(',')
            for team in submission[56:63]:
                ret.append(team +'.png')
        rounds.append(ret)
        ret = []
    return rounds

def order(scores):
    totals = [row[6] for row in scores]
    positions = list(range(len(scores)))
    matrix = [[positions[i],totals[i]] for i in range(len(totals))]
    matrix = sorted(matrix,key=lambda x: x[1], reverse=True)
    return [row[0] for row in matrix]

def isBracketEmpty(checkBracket):
    if "*" in checkBracket:
        return True
    else:
        return False

def rank(order,scores):
    rank = []
    count = 1
    for index,item in enumerate(order[:-1]):
        if scores[order[index]][6] != scores[order[index+1]][6]:
            rank.append(count)
            count = count + 1
        else:
            rank.append(count)
    rank.append(count)
    return rank

def convert_brackets_to_id(name_map,users,master):
    scores = []
    ret = ['','','','','','','']
    score1 = score2 = score3 = score4 = score5 = score6 = total = games = 0
    ret2 = []
    for user in users:
        temp = user.round1.replace('"','').replace('[','').replace(']','')
        submission = temp.split(',')
        ret1 = []
        for entry in submission:
            if entry in name_map:
                ret1.append(name_map[entry])
            else:
                ret1.append(entry)
        ret2.append(ret1)
    ret3 = []
    for entry in master:
        if entry in name_map:
            ret3.append(name_map[entry])
        else:
            ret3.append(entry)
    print(ret3)
    return ret2