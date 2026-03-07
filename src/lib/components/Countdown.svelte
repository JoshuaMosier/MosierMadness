<script>
  import { onMount, onDestroy } from 'svelte';
  import { tweened } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';

  export let title = 'Countdown';
  export let targetAt = null;
  export let eventLabel = 'Upcoming event';

  let timeRemaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  let interval;
  let progress = tweened(100, {
    duration: 1000,
    easing: cubicOut,
  });
  let startingSeconds = 1;

  function getTargetDate() {
    if (!targetAt) {
      return null;
    }

    const parsedDate = new Date(targetAt);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  function resetCountdown() {
    const targetDate = getTargetDate();
    const difference = targetDate ? targetDate.getTime() - Date.now() : 0;

    startingSeconds = Math.max(Math.floor(difference / 1000), 1);
    updateCountdown();
  }

  function updateCountdown() {
    const targetDate = getTargetDate();
    const difference = targetDate ? targetDate.getTime() - Date.now() : 0;

    if (difference > 0) {
      timeRemaining = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };

      const remainingSeconds = difference / 1000;
      progress.set((remainingSeconds / startingSeconds) * 100);
      return;
    }

    timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    progress.set(0);
  }

  function formatNumber(value) {
    return value.toString().padStart(2, '0');
  }

  function formatEventTime(value) {
    const targetDate = value ? new Date(value) : null;
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      return eventLabel;
    }

    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(targetDate);
  }

  $: formattedEventTime = formatEventTime(targetAt);
  $: if (targetAt) {
    resetCountdown();
  }

  onMount(() => {
    resetCountdown();
    interval = setInterval(updateCountdown, 1000);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });
</script>

<div class="w-full max-w-4xl mx-auto bg-stone-900/50 rounded-lg shadow-lg p-6 backdrop-blur-sm border border-stone-800/50 relative overflow-hidden group">
  <div class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-700 to-amber-500" style="width: {$progress}%"></div>

  <div class="text-center mb-12 relative">
    <div class="inline-block">
      <h1 class="text-4xl font-bold relative">
        <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-3 rounded-lg shadow-md inline-block">
          {title}
        </span>
      </h1>
    </div>
    <p class="mt-6 text-zinc-400 flex items-center justify-center gap-2">
      <span class="inline-block w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
      <span>{eventLabel}: {formattedEventTime}</span>
    </p>
  </div>

  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
    {#each Object.entries(timeRemaining) as [label, value]}
      <div class="bg-black bg-opacity-40 rounded-xl p-6 text-center border border-white/10 relative group/card overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-700/0 group-hover/card:from-amber-600/10 group-hover/card:to-amber-700/5 transition-all duration-300"></div>
        <div class="relative">
          <div class="text-4xl md:text-5xl font-bold text-amber-500 tabular-nums group-hover/card:text-amber-400 transition-colors">
            {formatNumber(value)}
          </div>
          <div class="text-zinc-400 text-sm md:text-base mt-2 capitalize group-hover/card:text-zinc-300">
            {label}
          </div>
        </div>
      </div>
    {/each}
  </div>

</div>