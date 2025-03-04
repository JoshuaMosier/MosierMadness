# Mosier Madness

A March Madness bracket challenge application built with SvelteKit and Supabase.

## Features

- User authentication and registration
- Bracket creation and submission
- Real-time leaderboard with scoring
- Team tracking with elimination status
- Mobile-responsive design

## Tech Stack

- **Frontend**: SvelteKit, Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Vercel (recommended)

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Run the database setup script:
   ```bash
   npm run setup-db
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following main tables:

- `users`: User accounts and profiles
- `entries`: Bracket entries with round selections
- `eliminated_teams`: Teams that have been eliminated from the tournament

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Deploy to your preferred hosting provider (Vercel recommended for SvelteKit)

## License

MIT

## Credits

Created by [Your Name]
