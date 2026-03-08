import { NCAA_SCOREBOARD_BASE_URL } from '$lib/server/tournament/constants';
import { fetchJsonWithCache } from '$lib/server/tournament/httpCache';
import { invalidateSettingsCache } from '$lib/server/tournament/settings';
import { supabase } from '$lib/supabase';

/**
 * Compute team override indices for the bracket entry page.
 * Play-in teams always land at the higher-seed (odd) index in their first-round matchup.
 */
export function getFirstFourOverrides(settings) {
  const config = settings.firstFourConfig;
  if (!config?.games?.length || config.replacementCompletedAt) {
    return {};
  }

  const overrides = {};
  for (const game of config.games) {
    const gameNum = Number.parseInt(game.firstRoundBracketId.slice(1), 10);
    if (!Number.isFinite(gameNum)) {
      continue;
    }

    const index = (gameNum - 1) * 2 + 1;
    overrides[index] = {
      name: game.compositeDisplayName,
      seed: game.seed,
    };
  }

  return overrides;
}

function getScoreboardUrl(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${NCAA_SCOREBOARD_BASE_URL}/${year}/${month}/${day}/scoreboard.json`;
}

function getCanonicalTeamName(teamData) {
  return teamData.names.short.length < 20 ? teamData.names.short : teamData.names.char6;
}

/**
 * Check if all First Four games are final. If so, replace composite selections
 * in the brackets table with the canonical winner names.
 */
export async function checkAndResolveFirstFour(settings) {
  const config = settings.firstFourConfig;
  if (!config?.games?.length || !config.dates?.length || config.replacementCompletedAt) {
    return;
  }

  let allGames = [];
  for (const dateStr of config.dates) {
    try {
      const data = await fetchJsonWithCache(getScoreboardUrl(dateStr));
      allGames = allGames.concat(data.games || []);
    } catch {
      return;
    }
  }

  const firstFourGames = allGames.filter(
    wrapper => wrapper.game?.bracketRound === 'First Four'
  );

  const replacements = [];
  for (const configured of config.games) {
    const match = firstFourGames.find(
      wrapper => wrapper.game.bracketId === configured.firstFourBracketId
    );

    if (!match || match.game.gameState !== 'final') {
      return;
    }

    const game = match.game;
    const winnerTeam = game.away.winner ? game.away : game.home.winner ? game.home : null;
    if (!winnerTeam) {
      return;
    }

    replacements.push({
      oldSelection: `${configured.seed} ${configured.compositeDisplayName}`,
      newSelection: `${configured.seed} ${getCanonicalTeamName(winnerTeam)}`,
    });
  }

  const year = settings.entrySeasonYear;

  try {
    const { data: brackets, error: fetchError } = await supabase
      .from('brackets')
      .select('id, selections')
      .eq('year', year);

    if (fetchError) {
      console.warn('First Four: failed to fetch brackets:', fetchError.message);
      return;
    }

    for (const bracket of brackets || []) {
      let selections = bracket.selections;
      let changed = false;

      for (const { oldSelection, newSelection } of replacements) {
        if (selections.includes(oldSelection)) {
          selections = selections.map(s => s === oldSelection ? newSelection : s);
          changed = true;
        }
      }

      if (changed) {
        const { error: updateError } = await supabase
          .from('brackets')
          .update({ selections, updated_at: new Date().toISOString() })
          .eq('id', bracket.id);

        if (updateError) {
          console.warn(`First Four: failed to update bracket ${bracket.id}:`, updateError.message);
        }
      }
    }

    const updatedConfig = {
      ...config,
      replacementCompletedAt: new Date().toISOString(),
    };

    const { error: configError } = await supabase
      .from('tournament_seasons')
      .update({
        first_four_config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('entry_season_year', year);

    if (configError) {
      console.warn('First Four: failed to update config:', configError.message);
      return;
    }

    invalidateSettingsCache();
    console.log(`First Four: replaced ${replacements.length} composites across ${brackets?.length || 0} brackets`);
  } catch (err) {
    console.warn('First Four resolution failed:', err.message);
  }
}
