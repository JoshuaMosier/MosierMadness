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

  let form = {
    entrySeasonYear: data.tournamentSettings?.entrySeasonYear || new Date().getFullYear(),
    displaySeasonYear: data.tournamentSettings?.displaySeasonYear || new Date().getFullYear(),
    stage: data.tournamentSettings?.stage || 'archive',
    archiveScoreboardDate: data.tournamentSettings?.archiveScoreboardDate || '',
    firstRoundDatesText: (data.tournamentSettings?.firstRoundDates || []).join(', '),
    tickerRoundsText: JSON.stringify(data.tournamentSettings?.tickerRounds || [], null, 2),
    isActive: true,
  };

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
