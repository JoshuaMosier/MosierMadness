import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient';

export async function GET({ locals }) {
  try {
    // Get current user ID if authenticated
    const currentUserId = locals.user?.id;

    // First check if our tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('entries')
      .select('count');

    if (tablesError) {
      console.error('Database tables not set up:', tablesError);
      return json({ 
        error: 'Database not initialized. Please run the database setup first.',
        details: tablesError.message 
      }, { status: 500 });
    }

    // Fetch eliminated teams
    const { data: eliminatedData, error: eliminatedError } = await supabase
      .from('eliminated_teams')
      .select('team_name');
    
    if (eliminatedError) throw eliminatedError;
    const eliminatedTeams = eliminatedData.map(team => team.team_name);

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

    return json(processedData);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return json({ 
      error: 'Failed to fetch leaderboard data',
      details: error.message 
    }, { status: 500 });
  }
} 