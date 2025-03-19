<script>
    import { onMount, onDestroy } from 'svelte';
    import { tweened } from 'svelte/motion';
    import { cubicOut } from 'svelte/easing';
    
    // Selection Sunday datetime (March 16, 2025 6:00 PM ET)
    const SELECTION_SUNDAY = new Date('2025-03-16T18:00:00-04:00');
    
    let timeRemaining = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0
    };
    let interval;
    let progress = tweened(100, {
      duration: 1000,
      easing: cubicOut
    });
    
    // Calculate total seconds until Selection Sunday
    const totalSeconds = (SELECTION_SUNDAY - new Date()) / 1000;
    
    function calculateTimeRemaining() {
      const now = new Date();
      const difference = SELECTION_SUNDAY - now;
      
      if (difference > 0) {
        timeRemaining = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        };
        
        // Update progress bar
        const remainingSeconds = difference / 1000;
        progress.set((remainingSeconds / totalSeconds) * 100);
      } else {
        // If we're past Selection Sunday, clear the interval
        if (interval) clearInterval(interval);
        timeRemaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        progress.set(0);
      }
    }
    
    // Format numbers to always show two digits
    const formatNumber = (num) => num.toString().padStart(2, '0');
    
    // Get percentage of time passed with two decimal places
    $: percentageComplete = ((1 - $progress / 100) * 100).toFixed(2);
    
    onMount(() => {
      calculateTimeRemaining();
      interval = setInterval(calculateTimeRemaining, 1000);
    });
    
    onDestroy(() => {
      if (interval) clearInterval(interval);
    });
</script>
  
<div class="w-full max-w-4xl mx-auto bg-stone-900/50 rounded-lg shadow-lg p-6 backdrop-blur-sm border border-stone-800/50 relative overflow-hidden group">

    <!-- Progress bar -->
    <div class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-700 to-amber-500" style="width: {$progress}%"></div>
    
    <div class="text-center mb-12 relative">
        <div class="inline-block">
            <h1 class="text-4xl font-bold relative">
                <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-6 py-3 rounded-lg shadow-md inline-block">
                    Bracket Release Countdown
                </span>
            </h1>
        </div>
        <p class="mt-6 text-zinc-400 flex items-center justify-center gap-2">
            <span class="inline-block w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            Selection Sunday: March 16, 2025 at 6:00 PM ET
        </p>
    </div>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        <!-- Days -->
        <div class="bg-black bg-opacity-40 rounded-xl p-6 text-center border border-white/10 
                    relative group/card overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-700/0 group-hover/card:from-amber-600/10 group-hover/card:to-amber-700/5 transition-all duration-300"></div>
            <div class="relative">
                <div class="text-4xl md:text-5xl font-bold text-amber-500 tabular-nums group-hover/card:text-amber-400 transition-colors">
                    {formatNumber(timeRemaining.days)}
                </div>
                <div class="text-zinc-400 text-sm md:text-base mt-2 group-hover/card:text-zinc-300">
                    Days
                </div>
            </div>
        </div>
        
        <!-- Hours -->
        <div class="bg-black bg-opacity-40 rounded-xl p-6 text-center border border-white/10 
                    relative group/card overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-700/0 group-hover/card:from-amber-600/10 group-hover/card:to-amber-700/5 transition-all duration-300"></div>
            <div class="relative">
                <div class="text-4xl md:text-5xl font-bold text-amber-500 tabular-nums group-hover/card:text-amber-400 transition-colors">
                    {formatNumber(timeRemaining.hours)}
                </div>
                <div class="text-zinc-400 text-sm md:text-base mt-2 group-hover/card:text-zinc-300">
                    Hours
                </div>
            </div>
        </div>
        
        <!-- Minutes -->
        <div class="bg-black bg-opacity-40 rounded-xl p-6 text-center border border-white/10 
                    relative group/card overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-700/0 group-hover/card:from-amber-600/10 group-hover/card:to-amber-700/5 transition-all duration-300"></div>
            <div class="relative">
                <div class="text-4xl md:text-5xl font-bold text-amber-500 tabular-nums group-hover/card:text-amber-400 transition-colors">
                    {formatNumber(timeRemaining.minutes)}
                </div>
                <div class="text-zinc-400 text-sm md:text-base mt-2 group-hover/card:text-zinc-300">
                    Minutes
                </div>
            </div>
        </div>
        
        <!-- Seconds -->
        <div class="bg-black bg-opacity-40 rounded-xl p-6 text-center border border-white/10 
                    relative group/card overflow-hidden">
            <div class="absolute inset-0 bg-gradient-to-br from-amber-600/0 to-amber-700/0 group-hover/card:from-amber-600/10 group-hover/card:to-amber-700/5 transition-all duration-300"></div>
            <div class="relative">
                <div class="text-4xl md:text-5xl font-bold text-amber-500 tabular-nums group-hover/card:text-amber-400">
                    {formatNumber(timeRemaining.seconds)}
                </div>
                <div class="text-zinc-400 text-sm md:text-base mt-2 group-hover/card:text-zinc-300">
                    Seconds
                </div>
            </div>
        </div>
    </div>
    
    <div class="mt-12 text-center space-y-4">
        <h2 class="text-2xl font-semibold text-white relative inline-block">
            Get Ready for MMI Madness!
            <div class="absolute -right-12 top-0">
                🏀
            </div>
        </h2>
        <p class="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The brackets haven't been released yet. Check back on Selection Sunday to see the official tournament matchups and start making your picks!
            <span class="block mt-4 text-sm">
                <span class="inline-block w-1 h-1 bg-amber-500 rounded-full mr-2"></span>
                Stay tuned for updates and notifications
            </span>
        </p>
    </div>
</div>