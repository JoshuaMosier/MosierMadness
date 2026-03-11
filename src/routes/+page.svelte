<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Countdown from '$lib/components/Countdown.svelte';
  import Leaderboard from '$lib/components/Leaderboard.svelte';
  import Alert from '$lib/components/Alert.svelte';
  import { isArchive, isBracketOpen } from '$lib/utils/stageUtils';
  import { fade } from 'svelte/transition';
  import { FADE_CONTENT } from '$lib/constants/transitions';

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

  // Dynamic import for archive mode game (avoids SSR issues with Matter.js)
  let BasketballGameModule = null;
  let userId = null;

  onMount(async () => {
    if (stage !== 'archive') return;

    const { supabase } = await import('$lib/supabase');
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id || null;

    const module = await import('$lib/components/BasketballGameModule.svelte');
    BasketballGameModule = module.default;
  });

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
    <Alert class="flex items-center justify-between rounded-xl">
      <span>{authError}. <a href="/reset-password" class="text-amber-500 hover:text-amber-400 underline">Request a new link</a></span>
      <button on:click={() => authError = null} class="text-red-400 hover:text-red-300 ml-4">&times;</button>
    </Alert>
  {/if}
  {#if isArchive(stage)}
    <div class="space-y-8" in:fade={FADE_CONTENT}>
      <div class="relative rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-600/5 via-transparent to-amber-900/5 pointer-events-none"></div>
        <div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
        <div class="relative p-6 md:p-10 text-center space-y-8">
          <div>
            <div class="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-300">
              Pre-Tournament
            </div>
            <h2 class="mt-4 text-3xl md:text-4xl font-semibold text-zinc-100">Mosier Madness returns soon</h2>
            <p class="mt-3 text-sm text-zinc-500">
              {settings.entrySeasonYear} Entry Season &middot; {settings.displaySeasonYear} Archive
            </p>
          </div>

          <Countdown
            title="Countdown to Bracket Reveal"
            targetAt={data.frontDoor?.bracketRevealAt}
            eventLabel="Selection Sunday"
          />
        </div>
      </div>

      {#if BasketballGameModule}
        <svelte:component this={BasketballGameModule} {userId} />
      {:else if isArchive(stage)}
        <div class="bg-zinc-900 border border-zinc-800 p-8 rounded-xl text-center">
          <div class="h-64 flex items-center justify-center">
            <div class="animate-pulse text-zinc-500">Loading game...</div>
          </div>
        </div>
      {/if}
    </div>
  {:else if isBracketOpen(stage)}
    <div class="space-y-8" in:fade={FADE_CONTENT}>
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
    <div in:fade={FADE_CONTENT}>
      {#if !data.leaderboard}
        <Alert center class="p-8 rounded-xl">Leaderboard data is unavailable right now.</Alert>
      {:else}
        <Leaderboard leaderboard={data.leaderboard} />
      {/if}
    </div>
  {/if}
</div>
