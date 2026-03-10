<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Countdown from '$lib/components/Countdown.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import { fade } from 'svelte/transition';

  export let data;

  const stage = data.tournamentSettings?.stage || 'archive';
  const settings = data.tournamentSettings || {};

  // Handle auth error redirects from Supabase (e.g. expired reset links)
  let authError = null;
  $: {
    const errorDesc = $page.url.searchParams.get('error_description')
      || $page.url.hash?.match(/error_description=([^&]*)/)?.[1];
    if (errorDesc) {
      authError = decodeURIComponent(errorDesc.replace(/\+/g, ' '));
    }
  }

  // Dynamic imports for archive mode game (avoids SSR issues with Matter.js)
  let BasketballGame = null;
  let GameLeaderboard = null;
  let gameLeaderboard;
  let userId = null;

  onMount(async () => {
    if (stage !== 'archive') return;

    const { supabase } = await import('$lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;

    const [gameModule, leaderboardModule] = await Promise.all([
      import('$lib/components/BasketballGame.svelte'),
      import('$lib/components/GameLeaderboard.svelte')
    ]);
    BasketballGame = gameModule.default;
    GameLeaderboard = leaderboardModule.default;
  });

  async function handleGameOver({ score, madeShots }) {
    if (!userId) return;

    try {
      await fetch('/api/game-scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, madeShots })
      });
      gameLeaderboard?.refresh();
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  }

  const archiveCards = [
    {
      href: '/past-winners',
      title: 'Hall of Champions',
      description: 'Past winners and pool history.',
    },
    {
      href: '/stats',
      title: 'Tournament Records',
      description: 'All-time stats and records.',
    },
    {
      href: '/scores',
      title: 'Today\'s NCAA Scores',
      description: 'Live scores from today\'s games.',
    },
    {
      href: '/login',
      title: 'Get Account Ready',
      description: 'Sign in before entries open.',
    },
  ];

  const bracketOpenCards = [
    {
      href: '/bracket',
      title: 'Build Your Bracket',
      description: 'Create and edit your entry.',
    },
    {
      href: '/entries',
      title: 'Browse Entrants',
      description: 'See who is in the pool.',
    },
    {
      href: '/scores',
      title: 'Follow Today\'s Games',
      description: 'Today\'s live NCAA scores.',
    },
    {
      href: '/past-winners',
      title: 'Study the History',
      description: 'Past winners and recent champions.',
    },
  ];

  function getPageTitle(currentStage) {
    if (currentStage === 'archive') {
      return 'Mosier Madness - Countdown';
    }

    if (currentStage === 'bracket-open') {
      return 'Mosier Madness - Bracket Season';
    }

    return 'Mosier Madness - Leaderboard';
  }
</script>

<svelte:head>
  <title>{getPageTitle(stage)}</title>
  <meta name="description" content="Mosier Madness family March Madness tournament hub" />
</svelte:head>

<div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
  {#if authError}
    <div class="bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-xl flex items-center justify-between">
      <span>{authError}. <a href="/reset-password" class="text-amber-500 hover:text-amber-400 underline">Request a new link</a></span>
      <button on:click={() => authError = null} class="text-red-400 hover:text-red-300 ml-4">&times;</button>
    </div>
  {/if}
  {#if stage === 'archive'}
    <div class="space-y-8" in:fade={{ duration: 300, delay: 100 }}>
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div class="max-w-3xl mb-6">
          <div class="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
            Pre-Tournament
          </div>
          <h2 class="mt-4 text-3xl md:text-4xl font-semibold text-zinc-100">Mosier Madness returns soon</h2>
          <p class="mt-3 text-sm text-zinc-500">
            Upcoming entry season: {settings.entrySeasonYear} | Archive on display: {settings.displaySeasonYear}
          </p>
        </div>

        <Countdown
          title="Countdown to Bracket Reveal"
          targetAt={data.frontDoor?.bracketRevealAt}
          eventLabel="Selection Sunday"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {#each archiveCards as card}
          <a href={card.href} class="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-amber-600/40 hover:bg-zinc-800/80 transition-colors">
            <div class="text-lg font-semibold text-zinc-100">{card.title}</div>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
          </a>
        {/each}
      </div>

      {#if BasketballGame}
        <div class="relative">
          <svelte:component this={BasketballGame} onGameOver={handleGameOver} />
          {#if userId && GameLeaderboard}
            <div class="hidden xl:block absolute top-6 -right-72 w-64">
              <svelte:component this={GameLeaderboard} {userId} bind:this={gameLeaderboard} />
            </div>
          {/if}
        </div>
      {:else if stage === 'archive'}
        <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
          <div class="h-64 flex items-center justify-center">
            <div class="animate-pulse text-zinc-500">Loading game...</div>
          </div>
        </div>
      {/if}
    </div>
  {:else if stage === 'bracket-open'}
    <div class="space-y-8" in:fade={{ duration: 300, delay: 100 }}>
      <div class="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
        <div class="max-w-3xl mb-6">
          <div class="inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-300">
            Entries Open
          </div>
          <h2 class="mt-4 text-3xl md:text-4xl font-semibold text-zinc-100">Bracket season is live</h2>
        </div>

        <Countdown
          title="Countdown to Entry Deadline"
          targetAt={data.frontDoor?.entryDeadlineAt}
          eventLabel="Bracket deadline"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {#each bracketOpenCards as card}
          <a href={card.href} class="rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-emerald-600/40 hover:bg-zinc-800/80 transition-colors">
            <div class="text-lg font-semibold text-zinc-100">{card.title}</div>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{card.description}</p>
          </a>
        {/each}
      </div>

      <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
        <h3 class="text-xl font-semibold text-zinc-200 mb-3">Leaderboard Hidden Until Tipoff</h3>
        <p class="text-zinc-300">
          Entries are open, but standings stay hidden until the tournament begins so picks remain private.
        </p>
      </div>
    </div>
  {:else}
    <div in:fade={{ duration: 300, delay: 100 }}>
      {#if !data.leaderboard}
        <div class="bg-red-950/50 border border-red-900 text-red-400 p-8 rounded-xl text-center">
          Leaderboard data is unavailable right now.
        </div>
      {:else}
        <Leaderboard leaderboard={data.leaderboard} />
      {/if}
    </div>
  {/if}
</div>
