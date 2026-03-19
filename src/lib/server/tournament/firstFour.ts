import { fetchTournamentDayForDate } from '$lib/server/tournament/tournamentFetch';
import { notifyTournamentRefresh } from '$lib/server/tournament/realtime';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';
import { invalidateSettingsCache } from '$lib/server/tournament/settings';
import type { TournamentSettings } from '$lib/types';

interface FirstFourOverride {
  name: string;
  seed: number;
}

/**
 * Compute team override indices for the bracket entry page.
 * Play-in teams always land at the higher-seed (odd) index in their first-round matchup.
 */
export function getFirstFourOverrides(settings: TournamentSettings): Record<number, FirstFourOverride> {
  const config = settings.firstFourConfig;
  if (!config?.games?.length || config.replacementCompletedAt) {
    return {};
  }

  const overrides: Record<number, FirstFourOverride> = {};
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getCanonicalTeamName(teamData: any): string {
  return teamData.names.short.length < 20 ? teamData.names.short : teamData.names.char6;
}

/**
 * Check if all First Four games are final. If so, replace composite selections
 * in the brackets table with the canonical winner names.
 */
export async function checkAndResolveFirstFour(
  settings: TournamentSettings,
  options: { force?: boolean } = {},
): Promise<void> {
  const config = settings.firstFourConfig;
  if (!config?.games?.length || !config.dates?.length || (config.replacementCompletedAt && !options.force)) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let allGames: any[] = [];
  for (const dateStr of config.dates) {
    const data = await fetchTournamentDayForDate(dateStr);
    allGames = allGames.concat(data.games || []);
  }

  const firstFourGames = allGames.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapper: any) => wrapper.game?.bracketRound === 'First Four'
  );

  const replacements: Array<{ oldSelection: string; newSelection: string }> = [];
  for (const configured of config.games) {
    const match = firstFourGames.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (wrapper: any) => wrapper.game.bracketId === configured.firstFourBracketId
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
    const { data: brackets, error: fetchError } = await supabaseAdmin
      .from('brackets')
      .select('id, selections')
      .eq('year', year);

    if (fetchError) {
      console.warn('First Four: failed to fetch brackets:', fetchError.message);
      return;
    }

    let updatedBracketCount = 0;
    let failedBracketUpdates = 0;

    for (const bracket of brackets || []) {
      let selections: string[] = Array.isArray(bracket.selections) ? [...bracket.selections] : [];
      let changed = false;

      for (const { oldSelection, newSelection } of replacements) {
        if (selections.includes(oldSelection)) {
          selections = selections.map((s: string) => s === oldSelection ? newSelection : s);
          changed = true;
        }
      }

      if (changed) {
        const { error: updateError } = await supabaseAdmin
          .from('brackets')
          .update({ selections, updated_at: new Date().toISOString() })
          .eq('id', bracket.id);

        if (updateError) {
          failedBracketUpdates += 1;
          console.warn(`First Four: failed to update bracket ${bracket.id}:`, updateError.message);
          continue;
        }

        updatedBracketCount += 1;
      }
    }

    if (failedBracketUpdates > 0) {
      console.warn(`First Four: skipped completion flag because ${failedBracketUpdates} bracket update(s) failed.`);
      return;
    }

    const updatedConfig = {
      ...config,
      replacementCompletedAt: new Date().toISOString(),
    };

    const { error: configError } = await supabaseAdmin
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
    await notifyTournamentRefresh();
    console.log(`First Four: resolved ${replacements.length} First Four winner(s) across ${updatedBracketCount} bracket(s)`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('First Four resolution failed:', message);
  }
}
