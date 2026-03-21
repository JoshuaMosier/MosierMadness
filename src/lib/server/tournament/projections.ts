import {
  assignPositions,
  buildLeaderboardRanks,
  calculatePotential,
  calculateScores,
  getEliminatedTeams,
  sortLeaderboardScores,
} from '$lib/utils/scoringUtils';
import {
  areEquivalentSelections,
  formatTeamSelection,
  getTeamNameFromSelection,
  includesEquivalentSelection,
} from '$lib/utils/bracketUtils';
import { resolveTeamSeoName } from '$lib/utils/teamColorUtils';
import { getTeamColorSet } from '$lib/server/tournament/teamColors';
import { getGameScenarioStakesProjection } from '$lib/server/scenarios/gameStakes';
import type {
  TournamentSnapshot,
  Entry,
  EntryScore,
  GeneratedScenarioArtifact,
  LiveBracketData,
  LeaderboardProjection,
  ScoreboardGame,
} from '$lib/types';

function buildTeamSeoMap(snapshot: TournamentSnapshot): Record<string, string> {
  const teamSeoMap: Record<string, string> = {};

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

function buildTeamColorMap(teamSeoMap: Record<string, string>): Record<string, { primaryColor: string; secondaryColor: string }> {
  const teamColorMap: Record<string, { primaryColor: string; secondaryColor: string }> = {};

  for (const [teamName, seoName] of Object.entries(teamSeoMap)) {
    const { primaryColor, secondaryColor } = getTeamColorSet(seoName);
    teamColorMap[teamName] = { primaryColor, secondaryColor };
  }

  return teamColorMap;
}

export function getLiveBracketProjection(snapshot: TournamentSnapshot): LiveBracketData {
  return {
    matches: snapshot.bracketMatches,
    champion: snapshot.champion,
  };
}

export function getMasterBracketProjection(snapshot: TournamentSnapshot): { masterBracket: string[] } {
  return {
    masterBracket: snapshot.masterBracket,
  };
}

export function getLeaderboardProjection(entries: Entry[], snapshot: TournamentSnapshot): LeaderboardProjection {
  const liveBracketData = getLiveBracketProjection(snapshot);
  const masterBracket = snapshot.masterBracket;
  const eliminatedTeams = getEliminatedTeams(liveBracketData);
  const scores = calculateScores(masterBracket, entries);
  const potentials = calculatePotential(masterBracket, eliminatedTeams, entries);
  const potentialByEntryId = new Map<string, number>(potentials.map(item => [item.entryId, item.potential]));
  const teamSelectionsByEntryId: Record<string, { e8: string[]; f4: string[]; champ: string | null }> = {};
  const entryById = new Map(entries.map(entry => [entry.entryId, entry]));

  const rows = scores.map(score => {
    const entry = entryById.get(score.entryId);
    const selections = entry?.selections || [];
    teamSelectionsByEntryId[score.entryId] = {
      e8: selections.slice(56, 60).map(getTeamNameFromSelection).filter(Boolean) as string[],
      f4: selections.slice(60, 62).map(getTeamNameFromSelection).filter(Boolean) as string[],
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

  const teamSeoMap = buildTeamSeoMap(snapshot);

  return {
    fetchedAt: snapshot.fetchedAt,
    rows: sortedRows,
    ranks,
    masterBracket,
    eliminatedTeams,
    teamSeoMap,
    teamColorMap: buildTeamColorMap(teamSeoMap),
    teamSelectionsByEntryId,
  };
}

export function resolveGame(snapshot: TournamentSnapshot, requestedGameId: string | null | undefined): ScoreboardGame | null {
  if (!requestedGameId) {
    return snapshot.scoreboardGames[0] || null;
  }

  if (snapshot.gamesById.has(requestedGameId)) {
    return snapshot.gamesById.get(requestedGameId)!;
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

interface PickSummary {
  name: string;
  id: string;
  user_id: string;
}

interface OtherTeamPick {
  team: string;
  users: PickSummary[];
  count: number;
  seed: number;
  name: string;
  seoName: string;
  color: string;
  secondaryColor: string;
  eliminated: boolean;
}

export function getGameDetailProjection(
  game: ScoreboardGame | null,
  entries: Entry[],
  snapshot: TournamentSnapshot,
  generatedScenarioArtifact: GeneratedScenarioArtifact | null = null,
) {
  if (!game) {
    return null;
  }

  const bracketIndex = game.bracketIndex!;
  const selectionIndex = bracketIndex - 1;
  const homeSelection = formatTeamSelection(game.homeTeam);
  const awaySelection = formatTeamSelection(game.awayTeam);
  const teamSeoMap = buildTeamSeoMap(snapshot);
  const eliminatedTeams = getEliminatedTeams(getLiveBracketProjection(snapshot));

  const home: PickSummary[] = [];
  const away: PickSummary[] = [];
  const otherMap = new Map<string, PickSummary[]>();

  for (const entry of entries) {
    const userPick = entry.selections?.[selectionIndex];
    if (!userPick) {
      continue;
    }

    const pickSummary: PickSummary = {
      name: `${entry.firstName} ${entry.lastName}`,
      id: entry.entryId,
      user_id: entry.user_id,
    };

    if (areEquivalentSelections(userPick, homeSelection)) {
      home.push(pickSummary);
      continue;
    }

    if (areEquivalentSelections(userPick, awaySelection)) {
      away.push(pickSummary);
      continue;
    }

    const existingEquivalentKey = Array.from(otherMap.keys()).find((key) => areEquivalentSelections(key, userPick));
    const mapKey = existingEquivalentKey || userPick;
    if (!otherMap.has(mapKey)) {
      otherMap.set(mapKey, []);
    }
    otherMap.get(mapKey)!.push(pickSummary);
  }

  const other: OtherTeamPick[] = Array.from(otherMap.entries())
    .map(([team, users]): OtherTeamPick => {
      const teamName = getTeamNameFromSelection(team) || team;
      const seoName = resolveTeamSeoName(teamName, teamSeoMap[teamName]);
      const { primaryColor, secondaryColor } = getTeamColorSet(seoName);
      return {
        team,
        users,
        count: users.length,
        seed: Number.parseInt(team.split(' ')[0], 10),
        name: teamName,
        seoName,
        color: primaryColor,
        secondaryColor,
        eliminated: includesEquivalentSelection(eliminatedTeams, team),
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    game,
    bracketIndex,
    scenarioStakes: getGameScenarioStakesProjection(game, generatedScenarioArtifact),
    teamSelections: {
      home,
      away,
      other,
    },
  };
}

export function getScenarioSeedData(entries: Entry[], snapshot: TournamentSnapshot) {
  const liveBracketData = getLiveBracketProjection(snapshot);
  const leaderboard = getLeaderboardProjection(entries, snapshot);
  const positionLookup = assignPositions(leaderboard.rows, { presorted: true });

  return {
    entries,
    liveBracketData,
    masterBracket: snapshot.masterBracket,
    scoreboardGames: snapshot.scoreboardGames,
    currentPositions: Object.fromEntries(positionLookup),
    teamSeoMap: buildTeamSeoMap(snapshot),
  };
}
