<script>
  import { onMount } from 'svelte';
  
  let leaderboardData = [];
  let error = null;
  let loading = true;
  let currentUserId = null;
  let eliminatedTeams = [];
  
  // Subscribe to user store to get current user ID
  const unsubscribe = user.subscribe(value => {
    currentUserId = value?.id;
  });

  onMount(async () => {
    try {
      // Fetch eliminated teams first
      const { data: eliminatedData, error: eliminatedError } = await supabase
        .from('eliminated_teams')
        .select('team_name');
      
      if (eliminatedError) throw eliminatedError;
      eliminatedTeams = eliminatedData.map(team => team.team_name);
      
      // Fetch entries with user data
      const { data: entries, error: entriesError } = await supabase
        .from('entries')
        .select(`
          id,
          user_id,
          round1,
          round2,
          round3,
          round4,
          round5,
          round6,
          round7,
          score,
          r64_score,
          r32_score,
          s16_score,
          e8_score,
          f4_score,
          ncg_score,
          total_score,
          correct_games,
          potential_score,
          users (
            firstname,
            lastname
          )
        `)
        .order('total_score', { ascending: false });
      
      if (entriesError) throw entriesError;
      
      // Process the data
      const processedData = [];
      
      entries.forEach((entry, index) => {
        // Parse the JSON strings for each round
        const round1 = JSON.parse(entry.round1 || '[]');
        const round2 = JSON.parse(entry.round2 || '[]');
        const round3 = JSON.parse(entry.round3 || '[]');
        const round4 = JSON.parse(entry.round4 || '[]');
        const round5 = JSON.parse(entry.round5 || '[]');
        const round6 = JSON.parse(entry.round6 || '[]');
        const round7 = JSON.parse(entry.round7 || '[]');
        
        // Extract Final Four teams (round5)
        const finalFour = round5.map(team => ({
          name: team,
          isEliminated: eliminatedTeams.includes(team),
          isWinner: round6.includes(team)
        }));
        
        // Extract Finals teams (round6)
        const finals = round6.map(team => ({
          name: team,
          isEliminated: eliminatedTeams.includes(team),
          isWinner: round7.includes(team)
        }));
        
        // Extract Champion (round7)
        const champion = {
          name: round7[0] || '',
          isEliminated: round7[0] ? eliminatedTeams.includes(round7[0]) : false,
          isWinner: false // We don't know the actual winner yet
        };
        
        // Calculate rank (handle ties by giving same rank)
        let rank = index + 1;
        if (index > 0 && entry.total_score === entries[index - 1].total_score) {
          rank = processedData[index - 1].rank;
        }
        
        processedData.push({
          id: entry.id,
          userId: entry.user_id,
          rank,
          firstName: entry.users.firstname,
          lastName: entry.users.lastname,
          score: entry.total_score,
          rounds: {
            r64: entry.r64_score,
            r32: entry.r32_score,
            s16: entry.s16_score,
            e8: entry.e8_score,
            f4: entry.f4_score,
            ncg: entry.ncg_score
          },
          potential: entry.potential_score,
          correctGames: entry.correct_games,
          finalFour,
          finals,
          champion,
          isCurrentUser: entry.user_id === currentUserId
        });
      });
      
      leaderboardData = processedData;
      loading = false;
    } catch (e) {
      error = e.message;
      console.error('Error fetching leaderboard data:', e);
      loading = false;
    }
    
    return () => {
      unsubscribe();
    };
  });

  function getTeamImagePath(teamName) {
    if (!teamName) return '';
    return `/images/team_images/2024/pngs/${teamName}.png`;
  }
</script>

<div class="w-full">
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong class="font-bold">Error!</strong>
      <span class="block sm:inline"> {error}</span>
    </div>
  {:else if loading}
    <div class="flex justify-center py-8">
      <div class="animate-pulse flex space-x-4">
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-gray-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>
  {:else if leaderboardData.length === 0}
    <div class="text-center py-8">
      <p class="text-lg text-gray-600">No entries found. Be the first to submit your bracket!</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="min-w-full table-auto bg-gray-900 text-white">
        <thead>
          <tr class="bg-gray-800">
            <th class="px-4 py-2 text-center">Rank</th>
            <th class="px-4 py-2 text-center">Score</th>
            <th class="px-4 py-2 text-left">Username</th>
            <th title="Round of 64" class="px-4 py-2 text-center">R64</th>
            <th title="Round of 32" class="px-4 py-2 text-center">R32</th>
            <th title="Sweet Sixteen" class="px-4 py-2 text-center">S16</th>
            <th title="Elite Eight" class="px-4 py-2 text-center">E8</th>
            <th title="Final Four" class="px-4 py-2 text-center">F4</th>
            <th title="National Championship Game" class="px-4 py-2 text-center">NCG</th>
            <th title="Potential Remaining Score" class="px-4 py-2 text-center">Pot.</th>
            <th class="px-4 py-2 text-left">Final Four</th>
            <th class="px-4 py-2 text-left">Finals</th>
            <th class="px-4 py-2 text-center">Champ</th>
            <th title="Total Correct Games" class="px-4 py-2 text-center">Games</th>
          </tr>
        </thead>
        <tbody>
          {#each leaderboardData as entry, i}
            <tr class={entry.isCurrentUser ? 'bg-yellow-600 bg-opacity-20' : 'hover:bg-gray-800'}>
              <td class="px-4 py-2 text-center">{entry.rank}</td>
              <td class="px-4 py-2 text-center font-bold">{entry.score}</td>
              <td class="px-4 py-2">
                <a 
                  href="/entries/{entry.id}" 
                  class="px-2 py-1 rounded transition-colors duration-200 hover:bg-white hover:bg-opacity-10 block text-center {entry.isCurrentUser ? 'text-yellow-400' : 'text-gray-100'}"
                >
                  {entry.firstName} {entry.lastName}
                </a>
              </td>
              <td class="px-4 py-2 text-center">{entry.rounds.r64}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.r32}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.s16}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.e8}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.f4}</td>
              <td class="px-4 py-2 text-center">{entry.rounds.ncg}</td>
              <td class="px-4 py-2 text-center">{entry.potential}</td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finalFour as team, index}
                    {#if team.name}
                      <div class="relative inline-block">
                        <img 
                          title={team.name}
                          src={getTeamImagePath(team.name)}
                          alt={team.name}
                          class="w-8 h-8 object-contain"
                        />
                        {#if team.isWinner}
                          <img src="/images/winner.png" class="absolute top-0 left-0 w-8 h-8" alt="Winner" />
                        {:else if team.isEliminated}
                          <img src="/images/loser.png" class="absolute top-0 left-0 w-8 h-8" alt="Eliminated" />
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center space-x-1">
                  {#each entry.finals as team, index}
                    {#if team.name}
                      <div class="relative inline-block">
                        <img 
                          title={team.name}
                          src={getTeamImagePath(team.name)}
                          alt={team.name}
                          class="w-8 h-8 object-contain"
                        />
                        {#if team.isWinner}
                          <img src="/images/winner.png" class="absolute top-0 left-0 w-8 h-8" alt="Winner" />
                        {:else if team.isEliminated}
                          <img src="/images/loser.png" class="absolute top-0 left-0 w-8 h-8" alt="Eliminated" />
                        {/if}
                      </div>
                    {/if}
                  {/each}
                </div>
              </td>
              <td class="px-4 py-2">
                <div class="flex justify-center items-center">
                  {#if entry.champion.name}
                    <div class="relative inline-block">
                      <img 
                        title={entry.champion.name}
                        src={getTeamImagePath(entry.champion.name)}
                        alt={entry.champion.name}
                        class="w-10 h-10 object-contain mx-auto"
                      />
                      {#if entry.champion.isWinner}
                        <img src="/images/winner.png" class="absolute top-0 left-0 w-10 h-10" alt="Winner" />
                      {:else if entry.champion.isEliminated}
                        <img src="/images/loser.png" class="absolute top-0 left-0 w-10 h-10" alt="Eliminated" />
                      {/if}
                    </div>
                  {/if}
                </div>
              </td>
              <td class="px-4 py-2 text-center">{entry.correctGames}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>