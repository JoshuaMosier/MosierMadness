import {
  assignPositions,
  buildLeaderboardRanks,
  calculatePotential,
  calculateScores,
  getEliminatedTeams,
  sortLeaderboardScores,
} from '$lib/utils/scoringUtils';
import {
  formatTeamSelection,
  getTeamNameFromSelection,
} from '$lib/utils/bracketUtils';

function cloneTeam(team) {
  return team ? { ...team } : null;
}

function buildTeamSeoMap(snapshot) {
  const teamSeoMap = {};

  for (const team of snapshot.firstRoundTeams) {
    if (team?.name) {
      teamSeoMap[team.name] = team.seoName;
    }
  }

  for (let i = 1; i <= 63; i++) {
    const match = snapshot.bracketMatches[i];
    if (match?.teamA?.name) {
      teamSeoMap[match.teamA.name] = match.teamA.seoName;
    }
    if (match?.teamB?.name) {
      teamSeoMap[match.teamB.name] = match.teamB.seoName;
    }
  }

  return teamSeoMap;
}

export function getLiveBracketProjection(snapshot) {
  return {
    matches: snapshot.bracketMatches,
    champion: snapshot.champion,
  };
}

export function getMasterBracketProjection(snapshot) {
  return {
    masterBracket: snapshot.masterBracket,
  };
}

export function getLeaderboardProjection(entries, snapshot) {
  const liveBracketData = getLiveBracketProjection(snapshot);
  const masterBracket = snapshot.masterBracket;
  const eliminatedTeams = getEliminatedTeams(liveBracketData);
  const scores = calculateScores(masterBracket, entries);
  const potentials = calculatePotential(masterBracket, eliminatedTeams, entries);
  const potentialByEntryId = new Map(potentials.map(item => [item.entryId, item.potential]));
  const teamSelectionsByEntryId = {};
  const entryById = new Map(entries.map(entry => [entry.entryId, entry]));

  const rows = scores.map(score => {
    const entry = entryById.get(score.entryId);
    const selections = entry?.selections || [];
    teamSelectionsByEntryId[score.entryId] = {
      e8: selections.slice(56, 60).map(getTeamNameFromSelection).filter(Boolean),
      f4: selections.slice(60, 62).map(getTeamNameFromSelection).filter(Boolean),
      champ: getTeamNameFromSelection(selections[62]),
    };

    return {
      ...score,
      potential: potentialByEntryId.get(score.entryId) || 0,
      userId: entry?.user_id || null,
    };
  });

  const sortedRows = sortLeaderboardScores(rows);
  const ranks = buildLeaderboardRanks(sortedRows);

  return {
    fetchedAt: snapshot.fetchedAt,
    rows: sortedRows,
    ranks,
    masterBracket,
    eliminatedTeams,
    teamSeoMap: buildTeamSeoMap(snapshot),
    teamSelectionsByEntryId,
  };
}

function styleProjectedTeam(team, status) {
  if (!team) {
    return null;
  }

  if (status === 'correct') {
    return {
      ...team,
      color: '#22c55e',
      secondaryColor: '#16a34a',
    };
  }

  if (status === 'eliminated') {
    return {
      ...team,
      color: '#ef4444',
      secondaryColor: '#dc2626',
    };
  }

  return {
    ...team,
    color: '#666666',
    secondaryColor: '#666666',
  };
}

export function buildEntrantBracketData(selectedBracket, snapshot) {
  if (!selectedBracket) {
    return null;
  }

  const selections = selectedBracket.selections || [];
  const liveBracketData = getLiveBracketProjection(snapshot);
  const eliminatedTeams = new Set(getEliminatedTeams(liveBracketData));
  const matches = {};

  for (let i = 0; i < 32; i++) {
    const liveMatch = snapshot.bracketMatches[i + 1];
    matches[i + 1] = {
      teamA: cloneTeam(liveMatch?.teamA),
      teamB: cloneTeam(liveMatch?.teamB),
      winner: selections[i]
        ? selections[i] === formatTeamSelection(liveMatch?.teamA)
          ? 'A'
          : selections[i] === formatTeamSelection(liveMatch?.teamB)
            ? 'B'
            : null
        : null,
    };
  }

  for (let i = 32; i < 63; i++) {
    const prevRoundMatchA = Math.floor((i - 32) * 2) + 1;
    const prevRoundMatchB = prevRoundMatchA + 1;
    const prevMatchA = matches[prevRoundMatchA];
    const prevMatchB = matches[prevRoundMatchB];
    const projectedTeamA = prevMatchA?.winner === 'A' ? prevMatchA.teamA : prevMatchA?.winner === 'B' ? prevMatchA.teamB : null;
    const projectedTeamB = prevMatchB?.winner === 'A' ? prevMatchB.teamA : prevMatchB?.winner === 'B' ? prevMatchB.teamB : null;
    const liveMatch = snapshot.bracketMatches[i + 1];

    const projectedSelectionA = formatTeamSelection(projectedTeamA);
    const projectedSelectionB = formatTeamSelection(projectedTeamB);
    const liveSelectionA = formatTeamSelection(liveMatch?.teamA);
    const liveSelectionB = formatTeamSelection(liveMatch?.teamB);

    const teamAStatus = !projectedSelectionA
      ? 'pending'
      : projectedSelectionA === liveSelectionA
        ? 'correct'
        : eliminatedTeams.has(projectedSelectionA)
          ? 'eliminated'
          : 'pending';
    const teamBStatus = !projectedSelectionB
      ? 'pending'
      : projectedSelectionB === liveSelectionB
        ? 'correct'
        : eliminatedTeams.has(projectedSelectionB)
          ? 'eliminated'
          : 'pending';

    matches[i + 1] = {
      teamA: styleProjectedTeam(projectedTeamA, teamAStatus),
      teamB: styleProjectedTeam(projectedTeamB, teamBStatus),
      winner: selections[i]
        ? selections[i] === projectedSelectionA
          ? 'A'
          : selections[i] === projectedSelectionB
            ? 'B'
            : null
        : null,
    };
  }

  const finalMatch = matches[63];
  const champion = finalMatch?.winner === 'A' ? finalMatch.teamA : finalMatch?.winner === 'B' ? finalMatch.teamB : null;

  return {
    matches,
    champion,
  };
}

export function resolveGame(snapshot, requestedGameId) {
  if (!requestedGameId) {
    return snapshot.scoreboardGames[0] || null;
  }

  if (snapshot.gamesById.has(requestedGameId)) {
    return snapshot.gamesById.get(requestedGameId);
  }

  const asNumber = Number.parseInt(requestedGameId, 10);
  if (Number.isFinite(asNumber)) {
    const byBracketIndex = snapshot.gamesByIndex.get(asNumber);
    if (byBracketIndex) {
      return byBracketIndex;
    }

    if (snapshot.scoreboardGames[asNumber]) {
      return snapshot.scoreboardGames[asNumber];
    }
  }

  return snapshot.scoreboardGames[0] || null;
}

export function getGameDetailProjection(game, entries, snapshot) {
  if (!game) {
    return null;
  }

  const bracketIndex = game.bracketIndex;
  const selectionIndex = bracketIndex - 1;
  const homeSelection = formatTeamSelection(game.homeTeam);
  const awaySelection = formatTeamSelection(game.awayTeam);
  const teamSeoMap = buildTeamSeoMap(snapshot);

  const home = [];
  const away = [];
  const otherMap = new Map();

  for (const entry of entries) {
    const userPick = entry.selections?.[selectionIndex];
    if (!userPick) {
      continue;
    }

    const pickSummary = {
      name: `${entry.firstName} ${entry.lastName}`,
      id: entry.entryId,
      user_id: entry.user_id,
    };

    if (userPick === homeSelection) {
      home.push(pickSummary);
      continue;
    }

    if (userPick === awaySelection) {
      away.push(pickSummary);
      continue;
    }

    if (!otherMap.has(userPick)) {
      otherMap.set(userPick, []);
    }
    otherMap.get(userPick).push(pickSummary);
  }

  const other = Array.from(otherMap.entries())
    .map(([team, users]) => {
      const teamName = getTeamNameFromSelection(team) || team;
      return {
        team,
        users,
        count: users.length,
        seed: Number.parseInt(team.split(' ')[0], 10),
        name: teamName,
        seoName: teamSeoMap[teamName] || teamName.toLowerCase().replace(/[^a-z0-9]/g, ''),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    game,
    bracketIndex,
    teamSelections: {
      home,
      away,
      other,
    },
  };
}

export function getScenarioSeedData(entries, snapshot) {
  const liveBracketData = getLiveBracketProjection(snapshot);
  const leaderboard = getLeaderboardProjection(entries, snapshot);
  const positionLookup = assignPositions(leaderboard.rows);

  return {
    entries,
    liveBracketData,
    masterBracket: snapshot.masterBracket,
    scoreboardGames: snapshot.scoreboardGames,
    currentPositions: Object.fromEntries(positionLookup),
    teamSeoMap: buildTeamSeoMap(snapshot),
  };
}
