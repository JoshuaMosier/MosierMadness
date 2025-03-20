import { json } from '@sveltejs/kit';

export async function GET(event) {
  try {
    // Fetch the live bracket data from our existing endpoint
    const response = await event.fetch('/api/live-bracket');
    if (!response.ok) {
      throw new Error(`Error fetching live bracket data: ${response.statusText}`);
    }
    
    const liveBracketData = await response.json();
    if (liveBracketData.error) {
      throw new Error(liveBracketData.error);
    }
    
    // Convert to master bracket format (63 element array of "seed team" strings)
    const masterBracket = Array(63).fill('');
    
    // Populate the master bracket with winners from each match
    for (let i = 1; i <= 63; i++) {
      const match = liveBracketData.matches[i];
      if (match && match.winner) {
        const winningTeam = match.winner === 'A' ? match.teamA : match.teamB;
        if (winningTeam) {
          masterBracket[i-1] = `${winningTeam.seed} ${winningTeam.name}`;
        }
      }
    }
    
    return json({ masterBracket });
    
  } catch (error) {
    console.error('Error creating master bracket:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
} 