// ─── Tournament Stage ────────────────────────────────────────────────────────

export type TournamentStage = 'archive' | 'bracket-open' | 'tournament-live' | 'complete';

// ─── Tournament Settings ─────────────────────────────────────────────────────

export interface TickerRound {
	key: string;
	label: string;
	dates: string[];
}

export interface FirstFourGame {
	firstFourBracketId: string;
	firstRoundBracketId: string;
	seed: number;
	compositeDisplayName: string;
}

export interface FirstFourConfig {
	dates: string[];
	games: FirstFourGame[];
	replacementCompletedAt: string | null;
}

export interface TournamentSettings {
	entrySeasonYear: number;
	displaySeasonYear: number;
	stage: TournamentStage;
	archiveScoreboardDate: string;
	firstRoundDates: string[];
	tickerRounds: TickerRound[];
	firstFourConfig: FirstFourConfig;
}

// ─── Team & Bracket ──────────────────────────────────────────────────────────

export interface TeamSelection {
	seed: number;
	name: string;
}

export interface TeamInfo {
	name: string;
	seed: number;
	seoName: string;
	color: string;
	secondaryColor: string;
	ncaaName?: string;
	char6?: string;
}

export interface ScoreboardTeam {
	name: string;
	ncaaName: string;
	char6: string;
	displayName: string;
	score: number | null;
	scoreText: string;
	seed: number | null;
	winner: boolean;
	description: string;
	seoName: string;
	color: string;
	secondaryColor: string;
}

export interface ScoreboardGame {
	gameId: string;
	bracketId: string | null;
	bracketIndex: number | null;
	roundNumber: number | null;
	gameNumber: number | null;
	region: string | null;
	status: string;
	statusLabel: string;
	displayClock: string;
	period: string;
	clock: string;
	startTime: string;
	awayTeam: ScoreboardTeam;
	homeTeam: ScoreboardTeam;
	matchup: string;
	sortPriority: number;
	isTournamentGame: boolean;
}

export interface BracketMatch {
	gameId: string | null;
	bracketIndex: number | null;
	roundNumber: number | null;
	region: string | null;
	teamA: TeamInfo | null;
	teamB: TeamInfo | null;
	winner: 'A' | 'B' | null;
	gameState: string | null;
	period: string;
	clock: string;
	startTime: string;
	displayClock: string;
}

export interface TeamColorSet {
	seoName: string;
	primaryColor: string;
	secondaryColor: string;
	tertiaryColor: string | null;
}

// ─── Entries & Scoring ───────────────────────────────────────────────────────

export interface Entry {
	entryId: string;
	id: string;
	user_id: string;
	firstName: string;
	lastName: string;
	first_name?: string;
	last_name?: string;
	selections: string[];
	is_submitted: boolean;
}

export interface EntryScore {
	entryId: string;
	firstName: string;
	lastName: string;
	round1: number;
	round2: number;
	round3: number;
	round4: number;
	round5: number;
	round6: number;
	total: number;
	correctGames: number;
	potential?: number;
	userId?: string | null;
}

// ─── Tournament Snapshot ─────────────────────────────────────────────────────

export interface TournamentSnapshot {
	fetchedAt: string;
	settings: TournamentSettings;
	canonicalByNcaaName: Map<string, string>;
	firstRoundTeams: (TeamInfo | null)[];
	masterBracket: string[];
	bracketMatches: Record<number, BracketMatch>;
	champion: TeamInfo | null;
	gamesById: Map<string, ScoreboardGame>;
	gamesByIndex: Map<number, ScoreboardGame>;
	scoreboardGames: ScoreboardGame[];
	teamByName: Map<string, TeamInfo>;
	teamBySelection: Map<string, TeamInfo>;
}

// ─── Live Bracket ────────────────────────────────────────────────────────────

export interface LiveBracketData {
	matches: Record<number, BracketMatch>;
	champion: TeamInfo | null;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardProjection {
	fetchedAt: string;
	rows: EntryScore[];
	ranks: (number | undefined)[];
	masterBracket: string[];
	eliminatedTeams: string[];
	teamSeoMap: Record<string, string>;
	teamColorMap: Record<string, { primaryColor: string; secondaryColor: string }>;
	teamSelectionsByEntryId: Record<string, {
		e8: string[];
		f4: string[];
		champ: string | null;
	}>;
}

// ─── Scenario Engine ─────────────────────────────────────────────────────────

export interface SimulationConfig {
	masterBracket: string[];
	entries: Entry[];
	filteredRemainingGames: number[];
	selectedWinners: Record<number, string>;
	liveBracketData: LiveBracketData;
}

export interface SimulationResult {
	totalScenarios: number;
	winCounts: Map<string, number>;
	positionCounts: Map<string, Record<number, number>>;
	scenarioPositions: Uint8Array;
}

export interface RootForConfig {
	filteredRemainingGames: number[];
	scenarioPositions: Uint8Array;
	numEntries: number;
	totalScenarios: number;
	entryIndex: number;
	targetPosition: number;
}

// ─── History ─────────────────────────────────────────────────────────────────

export interface HistoricalPerson {
	id: string;
	slug: string;
	displayName: string;
	canonicalFirstName: string;
	canonicalLastName: string;
	linkedProfileId: string | null;
	bio: string | null;
	isFamily: boolean;
	isActiveRecently: boolean;
}

export interface PersonAlias {
	id: string;
	personId: string;
	aliasName: string;
	normalizedAlias: string;
	source: string;
}

export interface HistoricalSeason {
	year: number;
	status: string;
	label: string;
	notes: string | null;
	winnerPersonId: string | null;
	winningScore: number | null;
	fieldSize: number | null;
	source: string;
}

export interface SeasonResult {
	id: string;
	year: number;
	personId: string;
	finalRank: number;
	totalPoints: number | null;
	correctGames: number | null;
	round1Points: number | null;
	round2Points: number | null;
	round3Points: number | null;
	round4Points: number | null;
	round5Points: number | null;
	round6Points: number | null;
	sourceDisplayName: string;
	sourceStandardName: string;
}

export interface HistoryState {
	people: HistoricalPerson[];
	aliases: PersonAlias[];
	seasons: HistoricalSeason[];
	results: SeasonResult[];
	peopleById: Map<string, HistoricalPerson>;
	peopleBySlug: Map<string, HistoricalPerson>;
	aliasesByPersonId: Map<string, PersonAlias[]>;
	resultsByPersonId: Map<string, SeasonResult[]>;
	resultsByYear: Map<number, SeasonResult[]>;
}

// ─── NCAA API (narrow typed for fetch boundary) ──────────────────────────────

export interface NcaaTeamData {
	names: { short: string; char6: string; seo: string };
	seed: string;
	score: string;
	winner: boolean;
	description: string;
}

export interface NcaaGame {
	bracketId: string;
	bracketRound?: string;
	bracketRegion?: string;
	gameState: string;
	currentPeriod: string;
	contestClock: string;
	startTime: string;
	away: NcaaTeamData;
	home: NcaaTeamData;
}

export interface NcaaGameWrapper {
	game: NcaaGame;
}

export interface NcaaScoreboardDay {
	games: NcaaGameWrapper[];
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface Profile {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	is_admin?: boolean;
}

// ─── HTTP Cache ──────────────────────────────────────────────────────────────

export class HttpError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}
