<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { supabase } from '$lib/supabase';

  export let data;

  const stageOptions = ['archive', 'bracket-open', 'tournament-live', 'complete'];

  let loading = true;
  let saving = false;
  let error = null;
  let success = null;
  let isAdmin = false;
  let seasons = [];
  const healthChecks = data.healthChecks;

  let teamColors = Object.entries(data.teamColors || {})
    .map(([seoName, colors]) => ({ seoName, ...colors }))
    .sort((a, b) => a.seoName.localeCompare(b.seoName));
  let colorFilter = '';
  let colorSaving = false;
  let colorError = null;
  let colorSuccess = null;
  let newColor = { seoName: '', primaryColor: '#000000', secondaryColor: '#FFFFFF', tertiaryColor: '' };

  $: filteredColors = colorFilter
    ? teamColors.filter(c => c.seoName.includes(colorFilter.toLowerCase()))
    : teamColors;

  let form = {
    entrySeasonYear: data.tournamentSettings?.entrySeasonYear || new Date().getFullYear(),
    displaySeasonYear: data.tournamentSettings?.displaySeasonYear || new Date().getFullYear(),
    stage: data.tournamentSettings?.stage || 'archive',
    archiveScoreboardDate: data.tournamentSettings?.archiveScoreboardDate || '',
    firstRoundDatesText: (data.tournamentSettings?.firstRoundDates || []).join(', '),
    tickerRoundsText: JSON.stringify(data.tournamentSettings?.tickerRounds || [], null, 2),
    firstFourConfigText: JSON.stringify(data.tournamentSettings?.firstFourConfig || {}, null, 2),
    isActive: true,
  };

  $: firstFourStatus = (() => {
    try {
      const config = JSON.parse(form.firstFourConfigText);
      if (config.replacementCompletedAt) return { label: `Resolved ${new Date(config.replacementCompletedAt).toLocaleString()}`, tone: 'text-emerald-400' };
      if (config.games?.length > 0) return { label: `Active (${config.games.length} games)`, tone: 'text-amber-300' };
      return { label: 'Not configured', tone: 'text-zinc-500' };
    } catch {
      return { label: 'Invalid JSON', tone: 'text-red-400' };
    }
  })();

  onMount(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        goto('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      isAdmin = profile?.is_admin === true;
      if (!isAdmin) {
        loading = false;
        return;
      }

      await loadSeasons();
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  });

  async function loadSeasons() {
    const { data: rows, error: rowsError } = await supabase
      .from('tournament_seasons')
      .select('*')
      .order('entry_season_year', { ascending: false });

    if (rowsError) {
      throw rowsError;
    }

    seasons = rows || [];
  }

  function selectSeason(row) {
    form = {
      entrySeasonYear: row.entry_season_year,
      displaySeasonYear: row.display_season_year,
      stage: row.stage,
      archiveScoreboardDate: row.archive_scoreboard_date || '',
      firstRoundDatesText: (row.first_round_dates || []).join(', '),
      tickerRoundsText: JSON.stringify(row.ticker_rounds || [], null, 2),
      firstFourConfigText: JSON.stringify(row.first_four_config || {}, null, 2),
      isActive: row.is_active === true,
    };
    success = null;
    error = null;
  }

  function parseDates(text) {
    return text
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }

  async function saveSeason() {
    saving = true;
    error = null;
    success = null;

    try {
      const payload = {
        entry_season_year: Number.parseInt(form.entrySeasonYear, 10),
        display_season_year: Number.parseInt(form.displaySeasonYear, 10),
        stage: form.stage,
        archive_scoreboard_date: form.archiveScoreboardDate || null,
        first_round_dates: parseDates(form.firstRoundDatesText),
        ticker_rounds: JSON.parse(form.tickerRoundsText),
        first_four_config: JSON.parse(form.firstFourConfigText),
        is_active: form.isActive,
        updated_at: new Date().toISOString(),
      };

      if (!payload.entry_season_year || !payload.display_season_year) {
        throw new Error('Entry season year and display season year are required.');
      }

      if (form.isActive) {
        const { error: deactivateError } = await supabase
          .from('tournament_seasons')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .neq('entry_season_year', payload.entry_season_year);

        if (deactivateError) {
          throw deactivateError;
        }
      }

      const { error: upsertError } = await supabase
        .from('tournament_seasons')
        .upsert(payload, { onConflict: 'entry_season_year' });

      if (upsertError) {
        throw upsertError;
      }

      await loadSeasons();
      success = 'Tournament settings saved.';
    } catch (err) {
      error = err.message;
    } finally {
      saving = false;
    }
  }

  function getHealthTone(count = 0) {
    return count === 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10';
  }

  function formatTime(value) {
    if (!value) {
      return 'n/a';
    }

    return new Date(value).toLocaleString();
  }

  function truncateList(values = [], limit = 6) {
    return values.slice(0, limit);
  }

  async function saveTeamColor(entry) {
    colorSaving = true;
    colorError = null;
    colorSuccess = null;

    try {
      const { error: upsertError } = await supabase
        .from('team_colors')
        .upsert({
          seo_name: entry.seoName,
          primary_color: entry.primaryColor,
          secondary_color: entry.secondaryColor,
          tertiary_color: entry.tertiaryColor || null,
        }, { onConflict: 'seo_name' });

      if (upsertError) throw upsertError;
      colorSuccess = `Saved ${entry.seoName}.`;
    } catch (err) {
      colorError = err.message;
    } finally {
      colorSaving = false;
    }
  }

  async function addTeamColor() {
    if (!newColor.seoName.trim()) return;
    colorSaving = true;
    colorError = null;
    colorSuccess = null;

    try {
      const payload = {
        seo_name: newColor.seoName.trim().toLowerCase(),
        primary_color: newColor.primaryColor,
        secondary_color: newColor.secondaryColor,
        tertiary_color: newColor.tertiaryColor || null,
      };

      const { error: insertError } = await supabase
        .from('team_colors')
        .insert(payload);

      if (insertError) throw insertError;

      teamColors = [...teamColors, {
        seoName: payload.seo_name,
        primaryColor: payload.primary_color,
        secondaryColor: payload.secondary_color,
        tertiaryColor: payload.tertiary_color,
      }].sort((a, b) => a.seoName.localeCompare(b.seoName));

      newColor = { seoName: '', primaryColor: '#000000', secondaryColor: '#FFFFFF', tertiaryColor: '' };
      colorSuccess = `Added ${payload.seo_name}.`;
    } catch (err) {
      colorError = err.message;
    } finally {
      colorSaving = false;
    }
  }

  let archiving = false;
  let archiveError = null;
  let archiveSuccess = null;
  let archiveConfirm = false;

  async function handleArchiveSeason() {
    if (!archiveConfirm) {
      archiveConfirm = true;
      return;
    }

    archiving = true;
    archiveError = null;
    archiveSuccess = null;

    try {
      const response = await fetch('/api/admin/archive-season', { method: 'POST' });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Archive failed');
      }

      archiveSuccess = `Archived ${result.year}: ${result.winner} won with ${result.winningScore} pts (${result.entriesArchived} entries).`;
      archiveConfirm = false;
    } catch (err) {
      archiveError = err.message;
      archiveConfirm = false;
    } finally {
      archiving = false;
    }
  }

  function cancelArchive() {
    archiveConfirm = false;
  }

  async function deleteTeamColor(seoName) {
    colorSaving = true;
    colorError = null;
    colorSuccess = null;

    try {
      const { error: deleteError } = await supabase
        .from('team_colors')
        .delete()
        .eq('seo_name', seoName);

      if (deleteError) throw deleteError;

      teamColors = teamColors.filter(c => c.seoName !== seoName);
      colorSuccess = `Deleted ${seoName}.`;
    } catch (err) {
      colorError = err.message;
    } finally {
      colorSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Mosier Madness - Admin</title>
  <meta name="description" content="Tournament season administration" />
</svelte:head>

<div class="max-w-6xl mx-auto px-4 py-8">
  {#if loading}
    <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-300">
      Loading admin controls...
    </div>
  {:else if !isAdmin}
    <div class="bg-red-950/50 border border-red-900 text-red-400 rounded-xl p-8 text-center">
      You do not have access to this page.
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-6">
      <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h1 class="text-2xl font-semibold text-zinc-100 mb-2">Tournament Admin</h1>
        <p class="text-zinc-400 mb-6">
          Manage the active season, stage, and score/ticker schedule without redeploying.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label class="block">
            <span class="block text-sm text-zinc-400 mb-2">Entry Season Year</span>
            <input bind:value={form.entrySeasonYear} type="number" class="input" />
          </label>

          <label class="block">
            <span class="block text-sm text-zinc-400 mb-2">Display Season Year</span>
            <input bind:value={form.displaySeasonYear} type="number" class="input" />
          </label>

          <label class="block">
            <span class="block text-sm text-zinc-400 mb-2">Stage</span>
            <select bind:value={form.stage} class="input">
              {#each stageOptions as option}
                <option value={option}>{option}</option>
              {/each}
            </select>
          </label>

          <label class="block">
            <span class="block text-sm text-zinc-400 mb-2">Archive Scoreboard Date</span>
            <input bind:value={form.archiveScoreboardDate} type="date" class="input" />
          </label>
        </div>

        <label class="block mt-4">
          <span class="block text-sm text-zinc-400 mb-2">First Round Dates</span>
          <input
            bind:value={form.firstRoundDatesText}
            type="text"
            class="input"
            placeholder="2026-03-19, 2026-03-20"
          />
        </label>

        <label class="block mt-4">
          <span class="block text-sm text-zinc-400 mb-2">
            First Four Config
            <span class="ml-2 {firstFourStatus.tone}">{firstFourStatus.label}</span>
          </span>
          <textarea
            bind:value={form.firstFourConfigText}
            rows="10"
            class="input font-mono text-sm"
          ></textarea>
        </label>

        <label class="block mt-4">
          <span class="block text-sm text-zinc-400 mb-2">Ticker Rounds JSON</span>
          <textarea
            bind:value={form.tickerRoundsText}
            rows="14"
            class="input font-mono text-sm"
          ></textarea>
        </label>

        <label class="mt-4 flex items-center gap-3 text-zinc-300">
          <input bind:checked={form.isActive} type="checkbox" class="h-4 w-4 rounded border-zinc-700 bg-zinc-800" />
          Set this season as active
        </label>

        {#if error}
          <div class="mt-4 bg-red-950/50 border border-red-900 text-red-400 rounded-lg p-3">{error}</div>
        {/if}

        {#if success}
          <div class="mt-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg p-3">{success}</div>
        {/if}

        <button
          class="mt-6 px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 text-white font-medium disabled:opacity-50"
          on:click={saveSeason}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Season'}
        </button>
      </div>

      <div class="space-y-6">
        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 class="text-xl font-semibold text-zinc-100 mb-4">Saved Seasons</h2>

          {#if seasons.length === 0}
            <div class="text-zinc-500">No season rows found yet.</div>
          {:else}
            <div class="space-y-3">
              {#each seasons as season}
                <button
                  class="w-full text-left rounded-lg border border-zinc-800 bg-zinc-800/40 p-4 hover:bg-zinc-800 transition-colors"
                  on:click={() => selectSeason(season)}
                >
                  <div class="flex justify-between items-center gap-3">
                    <div>
                      <div class="font-medium text-zinc-100">
                        Entry {season.entry_season_year} / Display {season.display_season_year}
                      </div>
                      <div class="text-sm text-zinc-400">
                        {season.stage}
                      </div>
                    </div>
                    {#if season.is_active}
                      <span class="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
                    {/if}
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>

        <div class="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 class="text-xl font-semibold text-zinc-100">Health Checks</h2>
              <p class="text-sm text-zinc-400 mt-1">
                Checked {formatTime(healthChecks?.checkedAt)}.
              </p>
            </div>
            <span class="text-xs px-2 py-1 rounded-full {getHealthTone((healthChecks?.coverage?.missingLogoSlugCount || 0) + (healthChecks?.snapshot?.grayPrimaryFallbackTeams?.length || 0) + (healthChecks?.dailyScoreboard?.grayPrimaryFallbackTeams?.length || 0))}">
              {(healthChecks?.coverage?.missingLogoSlugCount || 0) + (healthChecks?.snapshot?.grayPrimaryFallbackTeams?.length || 0) + (healthChecks?.dailyScoreboard?.grayPrimaryFallbackTeams?.length || 0)} open
            </span>
          </div>

          <div class="grid grid-cols-1 gap-4">
            <div class="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-medium text-zinc-200">Full Logo Coverage</div>
                <span class="text-xs px-2 py-1 rounded-full {getHealthTone(healthChecks?.coverage?.missingLogoSlugCount || 0)}">
                  {healthChecks?.coverage?.coveredLogoSlugCount || 0}/{healthChecks?.coverage?.logoSlugCount || 0}
                </span>
              </div>
              <div class="mt-2 text-sm text-zinc-400">
                Missing logo-color mappings: {healthChecks?.coverage?.missingLogoSlugCount || 0}
              </div>
              {#if healthChecks?.coverage?.missingLogoSlugs?.length}
                <div class="mt-3 flex flex-wrap gap-2">
                  {#each truncateList(healthChecks.coverage.missingLogoSlugs, 10) as slug}
                    <span class="text-xs px-2 py-1 rounded-full bg-zinc-700/60 text-zinc-200 font-mono">{slug}</span>
                  {/each}
                </div>
              {/if}
            </div>

            <div class="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-medium text-zinc-200">Tournament Snapshot</div>
                {#if healthChecks?.snapshot?.error}
                  <span class="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">Error</span>
                {:else}
                  <span class="text-xs px-2 py-1 rounded-full {getHealthTone((healthChecks?.snapshot?.missingLogoSeoNames?.length || 0) + (healthChecks?.snapshot?.missingColorSeoNames?.length || 0) + (healthChecks?.snapshot?.grayPrimaryFallbackTeams?.length || 0) + (healthChecks?.snapshot?.missingSeoTeamNames?.length || 0))}">
                    {healthChecks?.snapshot?.scoreboardGameCount || 0} games
                  </span>
                {/if}
              </div>

              {#if healthChecks?.snapshot?.error}
                <div class="mt-2 text-sm text-red-400">{healthChecks.snapshot.error}</div>
              {:else}
                <div class="mt-2 text-sm text-zinc-400 space-y-1">
                  <div>Fetched: {formatTime(healthChecks?.snapshot?.fetchedAt)}</div>
                  <div>Age: {healthChecks?.snapshot?.ageMinutes ?? 'n/a'} min</div>
                  <div>Tracked teams: {healthChecks?.snapshot?.trackedTeamCount || 0}</div>
                  <div>Gray primary fallback teams: {healthChecks?.snapshot?.grayPrimaryFallbackTeams?.length || 0}</div>
                </div>

                {#if healthChecks?.snapshot?.grayPrimaryFallbackTeams?.length}
                  <div class="mt-3">
                    <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">Gray primary fallback</div>
                    <div class="flex flex-wrap gap-2">
                      {#each truncateList(healthChecks.snapshot.grayPrimaryFallbackTeams, 8) as team}
                        <span class="text-xs px-2 py-1 rounded-full bg-zinc-700/60 text-zinc-200">{team}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/if}
            </div>

            <div class="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div class="flex items-center justify-between gap-3">
                <div class="text-sm font-medium text-zinc-200">Today's NCAA Scoreboard</div>
                {#if healthChecks?.dailyScoreboard?.error}
                  <span class="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-400">Error</span>
                {:else}
                  <span class="text-xs px-2 py-1 rounded-full {getHealthTone((healthChecks?.dailyScoreboard?.missingLogoSeoNames?.length || 0) + (healthChecks?.dailyScoreboard?.missingColorSeoNames?.length || 0) + (healthChecks?.dailyScoreboard?.grayPrimaryFallbackTeams?.length || 0) + (healthChecks?.dailyScoreboard?.missingSeoTeamNames?.length || 0))}">
                    {healthChecks?.dailyScoreboard?.gameCount || 0} games
                  </span>
                {/if}
              </div>

              {#if healthChecks?.dailyScoreboard?.error}
                <div class="mt-2 text-sm text-red-400">{healthChecks.dailyScoreboard.error}</div>
              {:else}
                <div class="mt-2 text-sm text-zinc-400 space-y-1">
                  <div>Checked: {formatTime(healthChecks?.dailyScoreboard?.checkedAt)}</div>
                  <div>Tracked teams: {healthChecks?.dailyScoreboard?.trackedTeamCount || 0}</div>
                  <div>Gray primary fallback teams: {healthChecks?.dailyScoreboard?.grayPrimaryFallbackTeams?.length || 0}</div>
                </div>

                {#if healthChecks?.dailyScoreboard?.grayPrimaryFallbackTeams?.length}
                  <div class="mt-3">
                    <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">Gray primary fallback</div>
                    <div class="flex flex-wrap gap-2">
                      {#each truncateList(healthChecks.dailyScoreboard.grayPrimaryFallbackTeams, 8) as team}
                        <span class="text-xs px-2 py-1 rounded-full bg-zinc-700/60 text-zinc-200">{team}</span>
                      {/each}
                    </div>
                  </div>
                {/if}

                {#if healthChecks?.dailyScoreboard?.missingSeoTeamNames?.length}
                  <div class="mt-3">
                    <div class="text-xs uppercase tracking-wide text-zinc-500 mb-2">Missing team ids</div>
                    <div class="flex flex-wrap gap-2">
                      {#each truncateList(healthChecks.dailyScoreboard.missingSeoTeamNames, 8) as team}
                        <span class="text-xs px-2 py-1 rounded-full bg-zinc-700/60 text-zinc-200">{team}</span>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/if}
            </div>

            <div class="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
              <div class="text-sm font-medium text-zinc-200">Settings Validation</div>
              {#if healthChecks?.settingsIssues?.length}
                <ul class="mt-3 space-y-2 text-sm text-amber-300">
                  {#each healthChecks.settingsIssues as issue}
                    <li>{issue}</li>
                  {/each}
                </ul>
              {:else}
                <div class="mt-2 text-sm text-emerald-400">No obvious settings issues detected.</div>
              {/if}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <h2 class="text-xl font-semibold text-zinc-100 mb-2">Archive Season</h2>
      <p class="text-zinc-400 text-sm mb-4">
        Save the {data.tournamentSettings?.displaySeasonYear || '???'} tournament results to the historical record.
        This creates people records, season results, and archived brackets from the submitted entries.
      </p>

      {#if archiveError}
        <div class="mb-4 bg-red-950/50 border border-red-900 text-red-400 rounded-lg p-3">{archiveError}</div>
      {/if}

      {#if archiveSuccess}
        <div class="mb-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg p-3">{archiveSuccess}</div>
      {/if}

      {#if archiveConfirm}
        <div class="bg-amber-950/30 border border-amber-900/50 rounded-lg p-4 mb-4">
          <div class="text-amber-300 font-medium mb-2">Confirm Archive</div>
          <div class="text-zinc-400 text-sm mb-3">
            This will archive the {data.tournamentSettings?.displaySeasonYear} season using entry year {data.tournamentSettings?.entrySeasonYear} brackets.
            This action cannot be easily undone.
          </div>
          <div class="flex gap-3">
            <button
              class="px-4 py-2 rounded-lg bg-amber-600 text-white font-medium disabled:opacity-50"
              on:click={handleArchiveSeason}
              disabled={archiving}
            >
              {archiving ? 'Archiving...' : 'Yes, Archive Now'}
            </button>
            <button
              class="px-4 py-2 rounded-lg bg-zinc-700 text-zinc-300 font-medium"
              on:click={cancelArchive}
              disabled={archiving}
            >
              Cancel
            </button>
          </div>
        </div>
      {:else if !archiveSuccess}
        <button
          class="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-700 to-amber-600 text-white font-medium disabled:opacity-50"
          on:click={handleArchiveSeason}
          disabled={archiving}
        >
          Archive {data.tournamentSettings?.displaySeasonYear || '???'} Season
        </button>
      {/if}
    </div>

    <div class="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div class="flex items-center justify-between gap-4 mb-4">
        <h2 class="text-xl font-semibold text-zinc-100">Team Colors</h2>
        <span class="text-sm text-zinc-400">{teamColors.length} teams</span>
      </div>

      <input
        bind:value={colorFilter}
        type="text"
        placeholder="Filter by seo_name..."
        class="input mb-4"
      />

      {#if colorError}
        <div class="mb-4 bg-red-950/50 border border-red-900 text-red-400 rounded-lg p-3">{colorError}</div>
      {/if}

      {#if colorSuccess}
        <div class="mb-4 bg-emerald-950/40 border border-emerald-900 text-emerald-400 rounded-lg p-3">{colorSuccess}</div>
      {/if}

      <div class="rounded-lg border border-zinc-800 overflow-hidden mb-4">
        <div class="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-2 bg-zinc-800/50 text-xs text-zinc-400 uppercase tracking-wide">
          <div>SEO Name</div>
          <div>Primary</div>
          <div>Secondary</div>
          <div>Tertiary</div>
          <div></div>
        </div>

        <div class="max-h-96 overflow-y-auto divide-y divide-zinc-800/50">
          {#each filteredColors as entry (entry.seoName)}
            <div class="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-4 py-2 items-center hover:bg-zinc-800/30">
              <div class="text-sm text-zinc-200 font-mono truncate">{entry.seoName}</div>
              <div class="flex items-center gap-1">
                <input
                  type="color"
                  bind:value={entry.primaryColor}
                  class="w-6 h-6 rounded border border-zinc-700 cursor-pointer"
                  style="padding: 0;"
                />
                <span class="text-xs text-zinc-400 font-mono hidden xl:inline">{entry.primaryColor}</span>
              </div>
              <div class="flex items-center gap-1">
                <input
                  type="color"
                  bind:value={entry.secondaryColor}
                  class="w-6 h-6 rounded border border-zinc-700 cursor-pointer"
                  style="padding: 0;"
                />
              </div>
              <div class="flex items-center gap-1">
                {#if entry.tertiaryColor}
                  <input
                    type="color"
                    bind:value={entry.tertiaryColor}
                    class="w-6 h-6 rounded border border-zinc-700 cursor-pointer"
                    style="padding: 0;"
                  />
                {:else}
                  <span class="text-xs text-zinc-600">--</span>
                {/if}
              </div>
              <div class="flex items-center gap-1">
                <button
                  class="text-xs px-2 py-1 rounded bg-amber-600/20 text-amber-400 hover:bg-amber-600/30"
                  on:click={() => saveTeamColor(entry)}
                  disabled={colorSaving}
                >Save</button>
                <button
                  class="text-xs px-2 py-1 rounded bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  on:click={() => deleteTeamColor(entry.seoName)}
                  disabled={colorSaving}
                >X</button>
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div class="rounded-lg border border-zinc-800 bg-zinc-800/30 p-4">
        <div class="text-sm font-medium text-zinc-200 mb-3">Add Team Color</div>
        <div class="grid grid-cols-[1fr_80px_80px_80px_auto] gap-2 items-end">
          <label class="block">
            <span class="block text-xs text-zinc-400 mb-1">SEO Name</span>
            <input bind:value={newColor.seoName} type="text" class="input text-sm" placeholder="team-name" />
          </label>
          <label class="block">
            <span class="block text-xs text-zinc-400 mb-1">Primary</span>
            <input bind:value={newColor.primaryColor} type="color" class="w-full h-9 rounded border border-zinc-700 cursor-pointer" />
          </label>
          <label class="block">
            <span class="block text-xs text-zinc-400 mb-1">Secondary</span>
            <input bind:value={newColor.secondaryColor} type="color" class="w-full h-9 rounded border border-zinc-700 cursor-pointer" />
          </label>
          <label class="block">
            <span class="block text-xs text-zinc-400 mb-1">Tertiary</span>
            <input bind:value={newColor.tertiaryColor} type="color" class="w-full h-9 rounded border border-zinc-700 cursor-pointer" />
          </label>
          <button
            class="px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-sm font-medium"
            on:click={addTeamColor}
            disabled={colorSaving || !newColor.seoName.trim()}
          >Add</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .input {
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid rgb(63 63 70 / 1);
    background: rgb(39 39 42 / 1);
    color: rgb(244 244 245 / 1);
    padding: 0.75rem 0.875rem;
  }
</style>
