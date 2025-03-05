# March Madness Website Migration Plan
## Flask to SvelteKit with Tailwind CSS

This document outlines the plan for migrating the existing March Madness bracket website from a Flask-based implementation to a modern tech stack using SvelteKit and Tailwind CSS.

## Current Application Overview

The existing application is a Flask-based web app that allows users to:
- Register and login
- Submit March Madness tournament brackets
- View leaderboards and scores
- Track live game results
- View detailed bracket information and statistics

The current implementation uses:
- Flask for the web framework
- SQLite with SQLAlchemy for the database
- Jinja2 templates for the frontend
- Bootstrap for styling
- Custom JavaScript for bracket interactions

## 1. Project Structure Overview

### Project Structure
```
bracket-madness/
├── src/
│   ├── lib/
│   │   ├── components/ # Reusable UI components
│   │   │   ├── Navbar.svelte
│   │   │   ├── ScoreTicker.svelte
│   │   │   ├── Leaderboard.svelte
│   │   │   ├── BracketDisplay.svelte
│   │   │   └── ...
│   │   ├── services/ # API and data services
│   │   │   ├── auth.js # Authentication logic
│   │   │   ├── bracket.js # Bracket operations
│   │   │   ├── scoring.js # Scoring logic
│   │   │   └── ncaa-api.js # NCAA data fetching
│   │   ├── stores/ # Svelte stores
│   │   │   ├── user.js # User state
│   │   │   ├── bracket.js # Bracket state
│   │   │   └── scores.js # Scores and leaderboard state
│   │   └── utils/ # Utility functions
│   │       ├── bracketUtils.js
│   │       └── scoreUtils.js
│   ├── routes/ # SvelteKit pages/routes
│   │   ├── +layout.svelte # Main layout
│   │   ├── +page.svelte # Home/leaderboard
│   │   ├── bracket/
│   │   │   ├── +page.svelte # Bracket entry
│   │   │   └── +page.server.js # Server logic
│   │   ├── entries/
│   │   │   ├── +page.svelte # View all entries
│   │   │   └── [id]/+page.svelte # View specific entry
│   │   ├── matches/
│   │   │   ├── +page.svelte # View matches
│   │   │   └── [id]/+page.svelte # View specific match
│   │   ├── master/+page.svelte # Master bracket
│   │   ├── stats/+page.svelte # Statistics
│   │   ├── past-winners/+page.svelte # Past winners
│   │   ├── login/+page.svelte # Login page
│   │   └── register/+page.svelte # Registration page
│   └── app.html # Base HTML template
├── static/ # Static assets
│   ├── images/
│   │   ├── team-logos/
│   │   ├── ui/
│   │   └── ...
│   └── favicon.png
└── tailwind.config.js # Tailwind configuration
```

## 2. Database Migration

### Current Database Structure
- SQLite with SQLAlchemy ORM
- User model with bracket data stored as a string

### Migration to Supabase (PostgreSQL)
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brackets table (separate from users for better data structure)
CREATE TABLE brackets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  selections JSONB NOT NULL, -- Store as JSON instead of string
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year)
);
```

## 3. Authentication Implementation

Replace Flask-Login with Supabase Auth:

```javascript
// src/lib/services/auth.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signUp(email, password, firstname, lastname) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstname,
        lastname
      }
    }
  });
  return { data, error };
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}
```

## 4. Core Features Implementation

### Bracket Entry Component
```svelte
<!-- src/lib/components/BracketEntry.svelte -->
<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user';
  import { saveBracket } from '$lib/services/bracket';
  
  export let teams = [];
  let selections = Array(63).fill('');
  let isSubmitting = false;
  let message = '';
  
  function selectTeam(gameIndex, team) {
    selections[gameIndex] = team;
    // Auto-advance team in bracket
    // Logic to propagate selection to next rounds
  }
  
  async function submitBracket() {
    if (!$user) {
      message = 'Please log in to submit your bracket';
      return;
    }
    
    isSubmitting = true;
    const { error } = await saveBracket($user.id, selections);
    isSubmitting = false;
    
    if (error) {
      message = `Error: ${error.message}`;
    } else {
      message = 'Bracket submitted successfully!';
    }
  }
</script>

<div class="bracket-container">
  <!-- Bracket UI with regions -->
  <!-- Similar to the current bracketEntry.html but with Svelte reactivity -->
</div>

<button 
  class="btn-primary" 
  on:click={submitBracket} 
  disabled={isSubmitting || !$user}
>
  {isSubmitting ? 'Submitting...' : 'Submit Bracket'}
</button>

{#if message}
  <div class="message">{message}</div>
{/if}
```

### Leaderboard Component
```svelte
<!-- src/lib/components/Leaderboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { getLeaderboard } from '$lib/services/scoring';
  
  let leaderboard = [];
  let isLoading = true;
  
  onMount(async () => {
    const data = await getLeaderboard();
    leaderboard = data;
    isLoading = false;
  });
</script>

<div class="leaderboard">
  {#if isLoading}
    <p>Loading leaderboard...</p>
  {:else}
    <table class="w-full">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Name</th>
          <th>Score</th>
          <th>R64</th>
          <th>R32</th>
          <th>S16</th>
          <th>E8</th>
          <th>F4</th>
          <th>NCG</th>
          <th>Potential</th>
          <!-- Additional columns -->
        </tr>
      </thead>
      <tbody>
        {#each leaderboard as entry, i}
          <tr class={entry.isCurrentUser ? 'bg-yellow-100' : ''}>
            <td>{entry.rank}</td>
            <td>
              <a href="/entries/{entry.userId}">
                {entry.firstName} {entry.lastName}
              </a>
            </td>
            <td>{entry.totalScore}</td>
            <td>{entry.r64Score}</td>
            <td>{entry.r32Score}</td>
            <td>{entry.s16Score}</td>
            <td>{entry.e8Score}</td>
            <td>{entry.f4Score}</td>
            <td>{entry.ncgScore}</td>
            <td>{entry.potential}</td>
            <!-- Final Four, Finals, Champion columns with team logos -->
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
```

### Score Ticker Component
```svelte
<!-- src/lib/components/ScoreTicker.svelte -->
<script>
  import { onMount } from 'svelte';
  import { getGameScores } from '$lib/services/ncaa-api';
  
  let games = [];
  let isLoading = true;
  
  onMount(async () => {
    games = await getGameScores();
    isLoading = false;
    
    // Set up polling for live score updates
    const interval = setInterval(async () => {
      games = await getGameScores();
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  });
</script>

<div class="score-ticker">
  {#if isLoading}
    <p>Loading scores...</p>
  {:else}
    <div class="flex overflow-x-auto">
      {#each games as game}
        <div class="game-card">
          <div class="team away">
            <img src="/images/team-logos/{game.away.seo}.png" alt={game.away.name}>
            <span class="seed">{game.away.seed}</span>
            <span class="name">{game.away.name}</span>
            <span class="score">{game.away.score}</span>
          </div>
          <div class="team home">
            <img src="/images/team-logos/{game.home.seo}.png" alt={game.home.name}>
            <span class="seed">{game.home.seed}</span>
            <span class="name">{game.home.name}</span>
            <span class="score">{game.home.score}</span>
          </div>
          <div class="game-status">
            {#if game.status === 'live'}
              <span class="live">{game.period}</span>
            {:else if game.status === 'final'}
              <span class="final">Final</span>
            {:else}
              <span class="upcoming">{game.startTime}</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
```

## 5. Scoring Logic Implementation

```javascript
// src/lib/services/scoring.js
export function calculateScore(masterBracket, userBracket) {
  let score = {
    r64: 0,
    r32: 0,
    s16: 0,
    e8: 0,
    f4: 0,
    ncg: 0,
    total: 0,
    correctGames: 0
  };
  
  userBracket.forEach((selection, index) => {
    if (selection === masterBracket[index]) {
      // Increment correct games counter
      score.correctGames++;
      
      // Assign points based on round
      if (index < 32) {
        score.r64 += 1;
        score.total += 1;
      } else if (index < 48) {
        score.r32 += 2;
        score.total += 2;
      } else if (index < 56) {
        score.s16 += 4;
        score.total += 4;
      } else if (index < 60) {
        score.e8 += 8;
        score.total += 8;
      } else if (index < 62) {
        score.f4 += 16;
        score.total += 16;
      } else if (index === 62) {
        score.ncg += 32;
        score.total += 32;
      }
    }
  });
  
  return score;
}

export function calculatePotential(masterBracket, userBracket, eliminatedTeams) {
  let potential = 192; // Maximum possible score
  
  // Subtract points for eliminated teams in user's bracket
  userBracket.forEach((selection, index) => {
    if (eliminatedTeams.includes(selection)) {
      if (index < 32) potential -= 1;
      else if (index < 48) potential -= 2;
      else if (index < 56) potential -= 4;
      else if (index < 60) potential -= 8;
      else if (index < 62) potential -= 16;
      else if (index === 62) potential -= 32;
    }
  });
  
  // Subtract points for already correct picks
  userBracket.forEach((selection, index) => {
    if (selection === masterBracket[index] && !eliminatedTeams.includes(selection)) {
      if (index < 32) potential -= 1;
      else if (index < 48) potential -= 2;
      else if (index < 56) potential -= 4;
      else if (index < 60) potential -= 8;
      else if (index < 62) potential -= 16;
      else if (index === 62) potential -= 32;
    }
  });
  
  return potential;
}
```

## 6. NCAA API Integration

```javascript
// src/lib/services/ncaa-api.js
export async function getGameScores() {
  try {
    const response = await fetch('https://data.ncaa.com/casablanca/scoreboard/basketball-men/d1/2025/03/21/scoreboard.json');
    const data = await response.json();
    
    return data.games.map(game => {
      return {
        id: game.game.bracketId,
        away: {
          name: game.game.away.names.short,
          seed: game.game.away.seed,
          score: game.game.away.score,
          winner: game.game.away.winner,
          seo: game.game.away.names.seo
        },
        home: {
          name: game.game.home.names.short,
          seed: game.game.home.seed,
          score: game.game.home.score,
          winner: game.game.home.winner,
          seo: game.game.home.names.seo
        },
        status: game.game.gameState,
        period: game.game.currentPeriod,
        clock: game.game.contestClock,
        startTime: game.game.startTime,
        bracketRegion: game.game.bracketRegion
      };
    }).filter(game => game.id !== "");
  } catch (error) {
    console.error('Error fetching game scores:', error);
    return [];
  }
}

export async function getMasterBracket() {
  // Fetch and process the master bracket data
  // Similar to the current get_master_bracket function
}

export async function getEliminatedTeams() {
  // Fetch and process eliminated teams
  // Similar to the current get_elim function
}
```

## 7. UI/UX Improvements with Tailwind CSS

### Tailwind Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        'mm-blue': '#0a3161',
        'mm-gold': '#ac9437',
        'mm-gray': '#2d2d2d',
      },
      fontFamily: {
        'montserrat': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Responsive Design
- Implement mobile-first design approach
- Use Tailwind's responsive utilities for different screen sizes
- Create a responsive bracket view that works well on mobile devices

### Modern UI Elements
- Add animations for bracket selections
- Implement toast notifications for user actions
- Add loading skeletons for data fetching
- Use modals for confirmations and detailed information

## 8. Performance Optimizations

### Client-Side Optimizations
- Implement code splitting with SvelteKit
- Lazy load components and routes
- Optimize images with modern formats (WebP)
- Use Svelte stores efficiently for state management

### Server-Side Optimizations
- Implement server-side rendering (SSR) for initial page loads
- Use edge functions for API routes
- Implement caching strategies for NCAA data
- Use Supabase's real-time features for live updates

## 9. Deployment Strategy

### Development Environment
- Set up GitHub repository with CI/CD
- Configure linting and testing
- Create development, staging, and production environments

### Production Deployment
- Deploy to Vercel for frontend
- Use Supabase for backend and database
- Set up monitoring and error tracking
- Configure custom domain and SSL

## 10. Migration Timeline

1. **Week 1-2: Setup and Planning**
   - Set up SvelteKit project with Tailwind
   - Design database schema
   - Create wireframes for UI components

2. **Week 3-4: Core Components**
   - Implement authentication
   - Build bracket entry component
   - Create leaderboard component

3. **Week 5-6: Data Integration**
   - Implement NCAA API integration
   - Build scoring logic
   - Create data stores and services

4. **Week 7-8: UI/UX Refinement**
   - Implement responsive design
   - Add animations and transitions
   - Optimize for mobile

5. **Week 9-10: Testing and Deployment**
   - Conduct user testing
   - Fix bugs and optimize performance
   - Deploy to production

## 11. Additional Features to Consider

1. **Social Features**
   - Share brackets on social media
   - Create groups/pools for private competitions
   - Add comments and discussions

2. **Enhanced Analytics**
   - Detailed statistics and visualizations
   - Historical performance tracking
   - Predictive analytics

3. **Notifications**
   - Email alerts for game results
   - Push notifications for mobile
   - Alerts when your bracket position changes

4. **Mobile App**
   - Consider a Progressive Web App (PWA)
   - Native mobile app with Capacitor

## 12. Key Differences from Current Implementation

### Data Structure
- JSON-based bracket storage instead of string-based
- Normalized database schema with separate tables
- Improved data validation and type safety

### Frontend Architecture
- Component-based UI with Svelte
- Reactive data flow instead of jQuery DOM manipulation
- Modern CSS with Tailwind instead of Bootstrap

### Performance
- Faster page loads with SSR and code splitting
- Optimized API calls with caching
- Improved mobile experience

### Developer Experience
- TypeScript for better type safety
- Modern build tools and development workflow
- Improved testing capabilities

This implementation plan provides a comprehensive roadmap for transitioning the current Flask-based March Madness website to a modern SvelteKit application with Tailwind CSS. The plan maintains all existing functionality while adding improvements in performance, user experience, and maintainability. 