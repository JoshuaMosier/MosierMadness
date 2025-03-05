<script>
  import { onMount } from 'svelte';
  
  // Past winners data
  const winners = [
    { year: 2024, name: "Sam Z", highlight: true },
    { year: 2023, name: "Carolyn M"},
    { year: 2022, name: "Kathy M" },
    { year: 2021, name: "Rebecca M" },
    { year: 2020, name: "Covid-19", special: true },
    { year: 2019, name: "Russell M" },
    { year: 2018, name: "Josh M" },
    { year: 2017, name: "Sam Z" },
    { year: 2016, name: "Kathy M" },
    { year: 2015, name: "Russell M" },
    { year: 2014, name: "Josh M" },
    { year: 2013, name: "Russell M" },
    { year: 2012, name: "Josh M" },
    { year: 2011, name: "Ethan V" },
    { year: 2010, name: "Rebecca M" },
    { year: 2009, name: "Russell M" },
    { year: 2008, name: "Josh M" }
  ];
  
  // Count wins per person
  const winCounts = winners.reduce((counts, winner) => {
    if (winner.name !== "Covid-19") {
      counts[winner.name] = (counts[winner.name] || 0) + 1;
    }
    return counts;
  }, {});
  
  // Sort winners by win count
  const leaderboard = Object.entries(winCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  // Find all players with the highest win count (to handle ties)
  const maxWins = leaderboard[0]?.count || 0;
  const topWinners = leaderboard.filter(entry => entry.count === maxWins);
  const topWinnersText = topWinners.map(winner => winner.name).join(", ");
  
  // Assign ranks with ties handled properly
  let currentRank = 1;
  let previousCount = leaderboard[0]?.count || 0;
  
  leaderboard.forEach((entry, index) => {
    if (index > 0 && entry.count < previousCount) {
      currentRank = index + 1;
    }
    entry.rank = currentRank;
    previousCount = entry.count;
  });
    
  let isVisible = Array(winners.length).fill(false);
  let timelineInitialized = false;
  
  onMount(() => {
    // Set all cards to visible initially for users without IntersectionObserver support
    isVisible = Array(winners.length).fill(true);
    timelineInitialized = true;
    
    if (typeof IntersectionObserver !== 'undefined') {
      try {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.dataset.index);
              if (!isNaN(index) && index >= 0 && index < isVisible.length) {
                isVisible[index] = true;
              }
            }
          });
          isVisible = [...isVisible]; // Trigger reactivity
        }, { threshold: 0.1 });
        
        setTimeout(() => {
          document.querySelectorAll('.winner-card').forEach(card => {
            observer.observe(card);
          });
        }, 100);
        
        return () => observer.disconnect();
      } catch (error) {
        console.error("Error setting up IntersectionObserver:", error);
        // Fallback - show all cards
        isVisible = Array(winners.length).fill(true);
      }
    }
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-5xl">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
        Hall of Champions
      </span>
    </h1>
  </div>
  
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
    <!-- Stats cards -->
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{winners.length}</div>
      <div class="text-zinc-400 text-lg">Tournaments</div>
    </div>
    
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{Object.keys(winCounts).length}</div>
      <div class="text-zinc-400 text-lg">Unique Champions</div>
    </div>
    
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{maxWins}</div>
      <div class="text-zinc-400 text-lg">Most Wins <br>({topWinnersText})</div>
    </div>
  </div>
  
  <!-- Leaderboard section -->
  <div class="mb-16">
    <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
      <div class="grid grid-cols-3 text-xs uppercase bg-zinc-800 text-zinc-300 p-4 font-semibold">
        <div>
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Rank</span>
        </div>
        <div>
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Champion</span>
        </div>
        <div class="text-right">
          <span class="bg-zinc-700 px-2 py-1 rounded text-white">Titles</span>
        </div>
      </div>
      {#each leaderboard as { name, count, rank }, i}
        <div class="grid grid-cols-3 p-4 border-b border-zinc-800 items-center {rank === 1 ? 'bg-amber-900/80' : i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}">
          <div class="font-medium">{rank}</div>
          <div class="font-medium">{name}</div>
          <div class="text-right">
            {#each Array(count) as _, j}
              <span class="inline-block w-4 h-4 bg-amber-600 rounded-full mx-0.5" title="Championship"></span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  <!-- Timeline section -->
  <div class="relative">
    <!-- Timeline header -->
    <h2 class="text-2xl font-bold mb-8 text-center">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-3 py-1 rounded-md shadow-md">
        Championship Timeline
      </span>
    </h2>
    
    <!-- Timeline line -->
    <div class="absolute left-1/2 transform -translate-x-1/2 h-full w-2 bg-zinc-700"></div>
    
    <div class="space-y-12">
      {#each winners as winner, i}
        <div 
          class="winner-card relative {i % 2 === 0 ? 'text-right pr-12 md:pr-0 md:mr-auto md:ml-0 md:text-right' : 'text-left pl-12 md:pl-0 md:ml-auto md:mr-0 md:text-left'} 
                 md:w-5/12 transition-all duration-700 {timelineInitialized ? (isVisible[i] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10') : 'opacity-100'}"
          data-index={i}
        >
          <!-- Timeline dot -->
          <div class="absolute top-5 {i % 2 === 0 ? 'right-0 md:-right-8' : 'left-0 md:-left-8'} w-6 h-6 rounded-full bg-amber-600 border-4 border-zinc-900 z-10"></div>
          
          <!-- Card -->
          <div class="bg-gradient-to-br {winner.special ? 'from-zinc-800 to-zinc-900 border-red-900' : winner.highlight ? 'from-amber-900 to-zinc-900 border-amber-700' : 'from-zinc-900 to-zinc-800 border-zinc-700'} 
                      rounded-xl p-6 shadow-lg border transform hover:scale-105 transition-transform duration-300">
            <div class="text-3xl font-bold text-amber-600 mb-1">{winner.year}</div>
            <div class="text-xl font-medium mb-2">{winner.name}</div>
            {#if winner.special}
              <div class="text-red-600 text-sm">Tournament canceled due to pandemic</div>
            {:else if winner.highlight}
              <div class="text-amber-600 text-sm">Reigning champion</div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* Additional styles can be added here if needed */
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
  
  /* Ensure timeline is visible even without JavaScript */
  .winner-card {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Ensure text is readable in light mode too */
  @media (prefers-color-scheme: light) {
    .bg-gradient-to-r.from-amber-700.to-amber-600 {
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    .bg-zinc-700 {
      background-color: #4b5563;
    }
  }
  
  @media (min-width: 768px) {
    .winner-card[data-index="0"] { margin-top: 0; }
  }
</style> 