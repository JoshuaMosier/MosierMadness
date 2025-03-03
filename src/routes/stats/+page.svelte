<script>
  import { onMount } from 'svelte';
  
  // Stats data organized by category
  const statsData = [
    {
      category: "Most Overall Games",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "49", participant: "Finn OLeary", year: "2017", rank: "2" },
        { stat: "48", participant: "Eric Z", year: "2009", rank: "4" },
        { stat: "48", participant: "Josh M", year: "2015", rank: "4" }
      ]
    },
    {
      category: "Most Games Round of 32",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "31 of 32", participant: "Finn OLeary", year: "2017", rank: "2" },
        { stat: "29 of 32", participant: "The President", year: "2011", rank: "2" },
        { stat: "28 of 32", participant: "Sherri P", year: "2010", rank: "9" },
        { stat: "28 of 32", participant: "Tom OLeary", year: "2017", rank: "6" },
        { stat: "28 of 32", participant: "Ben IV", year: "2017", rank: "13" }
      ]
    },
    {
      category: "Most Games Sweet Sixteen",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "14 of 16", participant: "Russell M", year: "2009", rank: "1" },
        { stat: "14 of 16", participant: "David F", year: "2009", rank: "2" },
        { stat: "14 of 16", participant: "The President", year: "2009", rank: "3" },
        { stat: "14 of 16", participant: "Rebecca M", year: "2009", rank: "7" },
        { stat: "14 of 16", participant: "Just Favorites", year: "2009", rank: "8" }
      ]
    },
    {
      category: "Most Games Round Elite Eight",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "7 of 8", participant: "Eric Z", year: "2009", rank: "4" },
        { stat: "7 of 8", participant: "Kaitlynn M", year: "2009", rank: "10" }
      ]
    },
    {
      category: "Most Games Round Final Four",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "3 of 4", participant: "Numerous", year: "", rank: "" }
      ]
    },
    {
      category: "Most Games Round Championship",
      columns: ["rank", "stat", "participant", "year", "finalRank"],
      records: [
        { stat: "2 of 2", participant: "Josh M", year: "2012", rank: "1" },
        { stat: "2 of 2", participant: "Ben IV", year: "2012", rank: "2" },
        { stat: "2 of 2", participant: "Russell M", year: "2015", rank: "1" },
        { stat: "2 of 2", participant: "Aidan O", year: "2015", rank: "2" },
        { stat: "2 of 2", participant: "Kathy R", year: "2016", rank: "1" },
        { stat: "2 of 2", participant: "Sam Z", year: "2017", rank: "1" }
      ]
    },
    {
      category: "Highest Score (192 max)",
      columns: ["rank", "stat", "participant", "year"],
      records: [
        { stat: "153", participant: "Sam Z", year: "2017", rank: "" },
        { stat: "147", participant: "Russell M", year: "2015", rank: "" },
        { stat: "145", participant: "Josh M", year: "2012", rank: "" }
      ]
    },
    {
      category: "Highest Avg. Place (3+ years)",
      columns: ["rank", "stat", "participant"],
      records: [
        { stat: "4", participant: "David F", year: "", rank: "" },
        { stat: "6.3", participant: "Josh M", year: "", rank: "" }
      ]
    }
  ];
  
  // Calculate top performers for summary cards
  const allParticipants = statsData.flatMap(category => 
    category.records.map(record => record.participant)
  ).filter(name => name !== "Numerous");
  
  const uniqueParticipants = [...new Set(allParticipants)];
  
  // Count appearances in records
  const appearanceCounts = allParticipants.reduce((counts, name) => {
    counts[name] = (counts[name] || 0) + 1;
    return counts;
  }, {});
  
  // Find participants with most appearances in records
  const topPerformers = Object.entries(appearanceCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
  
  // Find the highest overall score
  const highestScore = statsData
    .find(category => category.category === "Highest Score (192 max)")
    ?.records[0] || { stat: "N/A", participant: "N/A" };
  
  // Find the most games correct
  const mostGamesCorrect = statsData
    .find(category => category.category === "Most Overall Games")
    ?.records[0] || { stat: "N/A", participant: "N/A" };
  
  // Animation variables
  let visibleCategories = Array(statsData.length).fill(false);
  let initialized = false;
  
  // Column labels and classes
  const columnConfig = {
    rank: { label: "Rank", class: "col-span-1" },
    stat: { label: "Stat", class: "col-span-1" },
    participant: { label: "Participant", class: "col-span-1" },
    year: { label: "Year", class: "col-span-1" },
    finalRank: { label: "Final Rank", class: "col-span-1" }
  };
  
  onMount(() => {
    // Set all sections to visible initially for users without IntersectionObserver support
    visibleCategories = Array(statsData.length).fill(true);
    initialized = true;
    
    if (typeof IntersectionObserver !== 'undefined') {
      try {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const index = parseInt(entry.target.dataset.index);
              if (!isNaN(index) && index >= 0 && index < visibleCategories.length) {
                visibleCategories[index] = true;
              }
            }
          });
          visibleCategories = [...visibleCategories]; // Trigger reactivity
        }, { threshold: 0.1 });
        
        setTimeout(() => {
          document.querySelectorAll('.stat-category').forEach(section => {
            observer.observe(section);
          });
        }, 100);
        
        return () => observer.disconnect();
      } catch (error) {
        console.error("Error setting up IntersectionObserver:", error);
        // Fallback - show all sections
        visibleCategories = Array(statsData.length).fill(true);
      }
    }
  });
</script>

<div class="container mx-auto px-4 py-8 max-w-6xl">
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold mb-4">
      <span class="bg-gradient-to-r from-amber-700 to-amber-600 text-white px-4 py-2 rounded-lg shadow-md inline-block">
        Tournament Statistics
      </span>
    </h1>
    <p class="text-xl text-zinc-400">Explore the most impressive achievements in Mosier Madness history</p>
  </div>
  
  <!-- Stats summary cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
    
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{mostGamesCorrect.stat}</div>
      <div class="text-zinc-400 text-lg">Most Games Correct</div>
      <div class="text-sm text-zinc-500">{mostGamesCorrect.participant} ({mostGamesCorrect.year})</div>
    </div>
    
    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">{highestScore.stat}</div>
      <div class="text-zinc-400 text-lg">Highest Score</div>
      <div class="text-sm text-zinc-500">{highestScore.participant} ({highestScore.year})</div>
    </div>

    <div class="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-xl p-6 shadow-lg border border-zinc-700 transform hover:scale-105 transition-transform duration-300">
      <div class="text-5xl font-bold text-amber-600 mb-2">4</div>
      <div class="text-zinc-400 text-lg">Most Tournament Wins</div>
      <div class="text-sm text-zinc-500">Josh M (2008, 2012, 2014, 2018)<br>Russell M (2009, 2013, 2015, 2019)</div>
    </div>
  </div>
  
  <!-- Stats categories -->
  {#each statsData as category, categoryIndex}
    <div 
      class="stat-category mb-16 transition-all duration-700 {initialized ? (visibleCategories[categoryIndex] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10') : 'opacity-100'}"
      data-index={categoryIndex}
    >
      <h2 class="text-2xl font-bold mb-6 relative text-center">
        <span class="bg-gradient-to-r from-amber-800 to-amber-600 text-white px-3 py-1 rounded-md shadow-md inline-block">
          {category.category}
        </span>
      </h2>
      
      <div class="bg-zinc-900 bg-opacity-90 border border-zinc-800 rounded-lg shadow-xl overflow-hidden">
        <!-- Dynamic grid based on number of columns -->
        <div class="grid grid-cols-{category.columns.length} text-xs uppercase bg-zinc-800 text-zinc-300 p-4 font-semibold">
          {#each category.columns as column}
            <div class={columnConfig[column].class}>
              <span class="bg-zinc-700 px-2 py-1 rounded text-white">{columnConfig[column].label}</span>
            </div>
          {/each}
        </div>
        
        {#each category.records as record, recordIndex}
          <div class="grid grid-cols-{category.columns.length} p-4 border-b border-zinc-800 items-center {recordIndex === 0 ? 'bg-amber-900/60' : recordIndex % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800/50'}">
            {#if category.columns.includes('rank')}
              <div class="col-span-1 font-medium">{recordIndex === 0 ? '🏆' : recordIndex + 1}</div>
            {/if}
            {#if category.columns.includes('stat')}
              <div class="col-span-1 font-medium">{record.stat}</div>
            {/if}
            {#if category.columns.includes('participant')}
              <div class="col-span-1">{record.participant}</div>
            {/if}
            {#if category.columns.includes('year')}
              <div class="col-span-1">{record.year}</div>
            {/if}
            {#if category.columns.includes('finalRank')}
              <div class="col-span-1">{record.rank}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/each}
  
</div>

<style>
  /* Additional styles */
  :global(body) {
    background-color: #18181b;
    color: #f4f4f5;
  }
  
  /* Ensure animations work even without JavaScript */
  .stat-category {
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
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .grid-cols-5, .grid-cols-4, .grid-cols-3 {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .grid-cols-5 > div:nth-child(3),
    .grid-cols-5 > div:nth-child(4),
    .grid-cols-5 > div:nth-child(5),
    .grid-cols-4 > div:nth-child(3),
    .grid-cols-4 > div:nth-child(4),
    .grid-cols-3 > div:nth-child(3) {
      grid-column: span 2;
    }
  }
</style> 