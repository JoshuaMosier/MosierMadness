<script>
  import { fade } from 'svelte/transition';
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase';
  import { calculateScores, calculatePotential, getEliminatedTeams } from '$lib/utils/scoringUtils';
  import { goto } from '$app/navigation';

  export let entries = [];
  export let loading = false;
  export let error = null;

  let masterBracket = [];
  let eliminatedTeams = [];
  let scores = [];
  let potentials = [];
  let loadingLeaderboard = true;
  let teamSelections = new Map();
  let liveBracketData = null;
  let currentUser = null;

  let cachedData = {
    masterBracket: null,
    liveBracket: null,
    lastFetch: null,
    // Cache for 5 minutes
    cacheTimeout: 5 * 60 * 1000
  };

  // Let's modify our approach to use a filter for the SVGs instead of container outlines
  function handleImageError(event) {
    event.target.src = '/images/placeholder-team.svg';
  }

  // We'll use a filter to create the outline effect on the SVG content itself
  const teamLogoClass = "w-full h-full object-contain p-0.5";
  const teamLogoContainerClass = "w-10 h-10 bg-zinc-800 rounded-lg p-1 overflow-hidden";

  // Revised SVG filter to reverse drawing order (black first, then white on top)
  let svgFilter = `
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <filter id="teamLogoOutline" x="-20%" y="-20%" width="140%" height="140%">
        <!-- Black outline (first, larger) -->
        <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="blackThicken" />
        <feFlood flood-color="black" result="blackOutline" />
        <feComposite in="blackOutline" in2="blackThicken" operator="in" result="blackOutline" />
        
        <!-- White outline (second, smaller) -->
        <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="whiteThicken" />
        <feFlood flood-color="white" result="whiteOutline" />
        <feComposite in="whiteOutline" in2="whiteThicken" operator="in" result="whiteOutline" />
        
        <!-- Stack with proper layer order: black on bottom, white in middle, original on top -->
        <feComposite in="whiteOutline" in2="blackOutline" operator="over" result="outlines" />
        <feComposite in="SourceGraphic" in2="outlines" operator="over" />
      </filter>
    </defs>
  </svg>
  `;

  $: sortedScores = [...scores].sort((a, b) => {
    // Sort by total score (descending)
    if (a.total > b.total) return -1;
    if (a.total < b.total) return 1;
    
    // If totals are equal, sort by potential (descending)
    if (a.potential > b.potential) return -1;
    if (a.potential < b.potential) return 1;
    
    // If both total and potential are equal, sort by name
    return a.firstName.localeCompare(b.firstName);
  });
  
  // Generate golf-style ranks
  $: ranks = sortedScores.reduce((acc, score, index) => {
    if (index === 0) {
      acc.push(1); // First entry is always rank 1
    } else {
      // If current total equals previous total, use the same rank
      const prevScore = sortedScores[index - 1];
      const prevRank = acc[index - 1];
      
      if (score.total === prevScore.total) {
        acc.push(prevRank); // Same rank for tied scores
      } else {
        acc.push(index + 1); // Rank is the position + 1 (skipping tied positions)
      }
    }
    return acc;
  }, []);

  function getRankLabel(rank) {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }

  function toggleSort(field) {
    if (sortField === field) {
      sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    } else {
      sortField = field;
      sortDirection = 'desc';
    }
  }
  
  // Helper function to extract team name from selection string (e.g. "1 Houston" -> "Houston")
  function getTeamNameFromSelection(selection) {
    if (!selection) return null;
    const parts = selection.split(' ');
    if (parts.length < 2) return null;
    return parts.slice(1).join(' ');
  }
  
  // Modify the getTeamSeoName function to use seoName from live bracket data
  function getTeamSeoName(team) {
    // First try to find the team in the live bracket data 
    for (let i = 1; i <= 63; i++) {
      const match = liveBracketData?.matches[i];
      if (match?.teamA?.name === team && match.teamA.seoName) {
        return match.teamA.seoName;
      }
      if (match?.teamB?.name === team && match.teamB.seoName) {
        return match.teamB.seoName;
      }
    }
    // Fallback to the old method
    return team.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  // Move the data fetching logic into a separate function
  async function fetchBracketData() {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (cachedData.lastFetch && (now - cachedData.lastFetch) < cachedData.cacheTimeout) {
      return {
        liveBracketData: cachedData.liveBracket,
        masterData: { masterBracket: cachedData.masterBracket }
      };
    }

    // Fetch new data
    const [liveResponse, masterResponse] = await Promise.all([
      fetch('/api/live-bracket'),
      fetch('/api/master-bracket')
    ]);

    if (!liveResponse.ok || !masterResponse.ok) {
      throw new Error('Failed to fetch bracket data');
    }

    const liveBracketData = await liveResponse.json();
    const masterData = await masterResponse.json();

    // Update cache
    cachedData = {
      masterBracket: masterData.masterBracket,
      liveBracket: liveBracketData,
      lastFetch: now,
      cacheTimeout: cachedData.cacheTimeout
    };

    return { liveBracketData, masterData };
  }

  // Memoize team selections processing
  let memoizedTeamSelections = null;
  function processTeamSelections(entries) {
    // If entries haven't changed and we have memoized data, return it
    if (memoizedTeamSelections && memoizedTeamSelections.entries === entries) {
      return memoizedTeamSelections.selections;
    }

    const selections = new Map();
    entries.forEach(entry => {
      const entrySelections = entry.selections || entry.brackets?.[0]?.selections || [];
      const entryId = entry.entryId || entry.id;
      
      const e8Teams = entrySelections.slice(56, 60).map(getTeamNameFromSelection).filter(Boolean);
      const f4Teams = entrySelections.slice(60, 62).map(getTeamNameFromSelection).filter(Boolean);
      const champTeam = getTeamNameFromSelection(entrySelections[62]);
      
      selections.set(entryId, {
        e8: e8Teams,
        f4: f4Teams,
        champ: champTeam
      });
    });

    // Store memoized result
    memoizedTeamSelections = {
      entries,
      selections
    };

    return selections;
  }

  onMount(async () => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;

    try {
      // Fetch bracket data using cached function
      const { liveBracketData: fetchedLiveBracket, masterData } = await fetchBracketData();
      
      if (fetchedLiveBracket.error) {
        throw new Error(fetchedLiveBracket.error);
      }
      
      liveBracketData = fetchedLiveBracket;
      eliminatedTeams = getEliminatedTeams(liveBracketData);
      masterBracket = masterData.masterBracket;
      
      // Calculate scores and potentials
      scores = calculateScores(masterBracket, entries).map(score => {
        const entry = entries.find(e => e.entryId === score.entryId || e.id === score.entryId);
        return {
          ...score,
          userId: entry?.user_id
        };
      });
      
      potentials = calculatePotential(masterBracket, eliminatedTeams, entries);
      
      // Use memoized team selections processing
      teamSelections = processTeamSelections(entries);
      
      // Merge potential data into scores
      scores = scores.map(score => {
        const potential = potentials.find(p => p.entryId === score.entryId)?.potential || 0;
        return { ...score, potential };
      });
      
      loadingLeaderboard = false;
    } catch (err) {
      console.error('Error loading leaderboard data:', err);
      error = err.message;
      loadingLeaderboard = false;
    }
  });

  // Helper function to check if a score belongs to current user
  function isCurrentUserScore(score) {
    return currentUser?.id === score.userId;
  }

  // Function to handle name click and navigation
  function handleNameClick(score) {
    // Create a URL-safe identifier using first and last name
    const nameIdentifier = `${score.firstName}|${score.lastName}`;
    goto(`/entries?selected=${nameIdentifier}`);
  }

  // Add a function to check if a name is hoverable/clickable
  function getNameButtonClass(score) {
    return `
      inline-flex items-center gap-2 px-2 py-1 rounded-md transition-colors duration-150
      hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50
      ${isCurrentUserScore(score) ? 'hover:bg-amber-600/30' : ''}
    `.trim();
  }
</script>

<!-- Add the SVG filter definition to the page -->
  {@html svgFilter}
  
  {#if loading || loadingLeaderboard}
    <div class="flex justify-center items-center min-h-[400px]" in:fade={{ duration: 100 }}>
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        <div class="text-amber-600 font-medium">Calculating scores...</div>
      </div>
    </div>
  {:else if error}
    <div 
      class="bg-red-950/50 border border-red-900 text-red-500 p-4 rounded-lg text-center mb-4" 
      in:fade={{ duration: 100, delay: 100 }}
    >
      {error}
    </div>
  {:else}
    <div 
      class="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl"
      in:fade={{ duration: 300, delay: 100 }}
    >
      
      <!-- Mobile View -->
      <div class="md:hidden">
        <!-- Column Headers -->
        <div class="border-b border-zinc-800 p-3 bg-zinc-900/50 sticky top-0 backdrop-blur-sm z-10">
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <span class="text-zinc-300 text-sm font-semibold">Name</span>
            </div>
            <div class="flex gap-4">
              <div class="w-8 text-center">
                <span class="text-zinc-300 text-sm font-semibold">Tot.</span>
              </div>
              <div class="w-8 text-center">
                <span class="text-zinc-300 text-sm font-semibold">Pot.</span>
              </div>
            </div>
          </div>
        </div>

        {#each sortedScores as score, index}
          <div 
            class="border-b border-zinc-800 p-4 transition-colors duration-150
                   {index % 2 === 0 ? 'bg-zinc-800/30 hover:bg-zinc-800/40' : 'hover:bg-zinc-800/20'} 
                   {isCurrentUserScore(score) ? 'bg-amber-700/20 hover:bg-amber-700/30 border-l-4 border-l-amber-500' : ''}"
            in:fade={{ duration: 100, delay: index * 50 }}
          >
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-3 flex-1">
                <span class="text-amber-500 font-bold text-sm min-w-[2.5rem] bg-amber-500/10 rounded-full py-1 px-2 text-center">{getRankLabel(ranks[index])}</span>
                <button 
                  class={getNameButtonClass(score)}
                  on:click={() => handleNameClick(score)}
                >
                  <span class="text-zinc-100 font-medium">{score.firstName} {score.lastName}</span>
                </button>
              </div>
              <div class="flex gap-6">
                <div class="w-8 text-center">
                  <div class="text-amber-400 font-bold text-lg">{score.total}</div>
                </div>
                <div class="w-8 text-center">
                  <div class="text-emerald-400 font-medium">{score.potential}</div>
                </div>
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <!-- Desktop View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-zinc-800">
          <thead>
            <tr class="bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider w-12">Rank</th>
              <th class="px-6 py-4 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider">
                NAME
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-300 uppercase tracking-wider">
                Total
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Potential
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                R1
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                R2
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                S16
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Elite 8
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Final 4
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                CHAMP
              </th>
              <th class="px-2 text-center text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Games
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-800">
            {#each sortedScores as score, index}
              <tr 
                class="transition-colors duration-150
                       {index % 2 === 0 ? 'bg-zinc-800/30 hover:bg-zinc-800/40' : 'hover:bg-zinc-800/20'} 
                       {isCurrentUserScore(score) ? 'bg-amber-700/20 hover:bg-amber-700/30 border-l-4 border-l-amber-500' : ''}"
                in:fade={{ duration: 100, delay: index * 50 }}
              >
                <td class="px-6 py-2 whitespace-nowrap">
                  <span class="text-amber-500 font-bold bg-amber-500/10 rounded-full py-1 px-3">{getRankLabel(ranks[index])}</span>
                </td>
                <td class="px-6 py-2 whitespace-nowrap">
                  <button 
                    class={getNameButtonClass(score)}
                    on:click={() => handleNameClick(score)}
                  >
                    <span class="text-zinc-100 font-medium">{score.firstName} {score.lastName}</span>
                  </button>
                </td>
                <td class="px-2 whitespace-nowrap text-center text-amber-400 font-bold text-lg">{score.total}</td>
                <td class="px-2 whitespace-nowrap text-center text-emerald-400">{score.potential}</td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round1}</td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round2}</td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.round3}</td>
                <td class="px-2 whitespace-nowrap text-center">
                  <!-- Elite 8 Team Logos -->
                  <div class="flex justify-center gap-1">
                    {#if teamSelections.has(score.entryId) && teamSelections.get(score.entryId).e8.length > 0}
                      {#each teamSelections.get(score.entryId).e8 as team}
                        <div class={teamLogoContainerClass} title={team}>
                          <img src="/images/team-logos/{getTeamSeoName(team)}.svg" 
                               alt={team} 
                               class={teamLogoClass}
                               style="filter: url(#teamLogoOutline);"
                               on:error={handleImageError}>
                        </div>
                      {/each}
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center">
                  <!-- Final Four Team Logos -->
                  <div class="flex justify-center gap-1">
                    {#if teamSelections.has(score.entryId) && teamSelections.get(score.entryId).f4.length > 0}
                      {#each teamSelections.get(score.entryId).f4 as team}
                        <div class={teamLogoContainerClass} title={team}>
                          <img src="/images/team-logos/{getTeamSeoName(team)}.svg" 
                               alt={team} 
                               class={teamLogoClass}
                               style="filter: url(#teamLogoOutline);"
                               on:error={handleImageError}>
                        </div>
                      {/each}
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center">
                  <!-- Championship Team Logo -->
                  <div class="flex justify-center">
                    {#if teamSelections.has(score.entryId) && teamSelections.get(score.entryId).champ}
                      <div class={teamLogoContainerClass} title={teamSelections.get(score.entryId).champ}>
                        <img src="/images/team-logos/{getTeamSeoName(teamSelections.get(score.entryId).champ)}.svg" 
                             alt={teamSelections.get(score.entryId).champ} 
                             class={teamLogoClass}
                             style="filter: url(#teamLogoOutline);"
                             on:error={handleImageError}>
                      </div>
                    {:else}
                      <span class="text-zinc-500 text-sm">-</span>
                    {/if}
                  </div>
                </td>
                <td class="px-2 whitespace-nowrap text-center text-white">{score.correctGames}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
