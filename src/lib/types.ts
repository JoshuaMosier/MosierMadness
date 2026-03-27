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
	contestId: string | null;
	ncaaUrl: string | null;
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
	gameDate?: string;
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

export type ScenarioPageMode = 'browser-exact' | 'generated-snapshot' | 'unavailable';
export type GeneratedScenarioAnalysisMode = 'exact' | 'weighted';

export interface GeneratedScenarioWeighting {
	summaryLabel: string;
	sourceNote: string;
}

export interface GeneratedScenarioEntry {
	entryId: string;
	userId?: string;
	firstName?: string;
	lastName?: string;
	displayName: string;
	lockedScore: number;
	firstPlaceCount: number;
	firstPlacePct: number;
	placeCounts: number[];
	weightedFirstPlacePct?: number;
	weightedPlacePcts?: number[];
	picks?: (number | null)[];
}

export interface GeneratedScenarioTeam {
	teamId: number;
	seed: number;
	name: string;
	seoName: string;
	primaryColor?: string;
	secondaryColor?: string;
}

export interface GeneratedScenarioOutcome {
	winnerTeamId: number;
	totalScenarios: number;
	weightedProbabilityPct?: number;
	entries: GeneratedScenarioEntry[];
}

export interface GeneratedScenarioGamePreview {
	gameIndex: number;
	round: number;
	roundLabel: string;
	startTime?: string;
	teamA: GeneratedScenarioTeam;
	teamB: GeneratedScenarioTeam;
	outcomeA: GeneratedScenarioOutcome;
	outcomeB: GeneratedScenarioOutcome;
}

export interface GeneratedScenarioArtifact {
	schemaVersion: number;
	importedAt: string;
	sourceGeneratedAt: string;
	totalScenarios: number;
	unresolvedGameCount: number;
	assumptionSummary: string;
	reportUrl: string | null;
	weighting?: GeneratedScenarioWeighting | null;
	entries: GeneratedScenarioEntry[];
	previewGames?: GeneratedScenarioGamePreview[];
}

export interface GameScenarioStakeEntry {
	entryId: string;
	userId?: string;
	displayName: string;
	firstPlacePct: number;
	swingPct: number;
}

export interface GameScenarioStakeBranch {
	totalScenarios: number;
	titleAliveCount: number;
	mustHaveCount: number;
	mustHaveEntries: GameScenarioStakeEntry[];
	biggestSwingEntries: GameScenarioStakeEntry[];
	biggestDropEntries: GameScenarioStakeEntry[];
	favoriteEntry: GameScenarioStakeEntry | null;
	maxSwingPct: number;
}

export interface GameScenarioStakes {
	totalScenarios: number;
	assumptionSummary: string;
	away: GameScenarioStakeBranch;
	home: GameScenarioStakeBranch;
}

export interface NcaaBasketballTeamStats {
	fieldGoalsMade: string;
	fieldGoalsAttempted: string;
	freeThrowsMade: string;
	freeThrowsAttempted: string;
	threePointsMade: string;
	threePointsAttempted: string;
	offensiveRebounds: string;
	totalRebounds: string;
	assists: string;
	turnovers: string;
	personalFouls: string;
	steals: string;
	blockedShots: string;
	points: string;
	fieldGoalPercentage: string;
	threePointPercentage: string;
	freeThrowPercentage: string;
}

export interface NcaaBasketballPlayerStats {
	id: string;
	number: string;
	firstName: string;
	lastName: string;
	position: string;
	minutesPlayed: string;
	starter: boolean;
	fieldGoalsMade: string;
	fieldGoalsAttempted: string;
	freeThrowsMade: string;
	freeThrowsAttempted: string;
	threePointsMade: string;
	threePointsAttempted: string;
	offensiveRebounds: string;
	totalRebounds: string;
	assists: string;
	turnovers: string;
	personalFouls: string;
	steals: string;
	blockedShots: string;
	points: string;
}

export interface NcaaBasketballBoxscoreTeam {
	teamId: string;
	isHome: boolean;
	seoname: string;
	name6Char: string;
	nameFull: string;
	nameShort: string;
	teamName: string;
	color: string | null;
	playerStats: NcaaBasketballPlayerStats[];
	teamStats: NcaaBasketballTeamStats | null;
}

export interface NcaaBasketballBoxscore {
	contestId: string;
	description: string;
	status: string;
	period: string;
	teams: NcaaBasketballBoxscoreTeam[];
}

export interface ScenarioWeightingModel {
	kind: 'equal' | 'log5' | 'logistic';
	scale?: number;
	ratingsBySeoName: Record<string, number>;
	summaryLabel?: string;
	sourceNote?: string;
}

export interface SimulationConfig {
	masterBracket: string[];
	entries: Entry[];
	filteredRemainingGames: number[];
	selectedWinners: Record<number, string>;
	liveBracketData: LiveBracketData;
	teamSeoMap?: Record<string, string>;
	weighting?: ScenarioWeightingModel | null;
}

export interface SimulationResult {
	totalScenarios: number;
	totalWeight: number;
	winCounts: Int32Array;
	weightedWinCounts: Float64Array;
	positionCounts: Int32Array;
	weightedPositionCounts: Float64Array;
	scenarioPositions: Uint8Array;
	scenarioProbabilityMasses: Float64Array;
}

export interface RootForConfig {
	filteredRemainingGames: number[];
	scenarioPositions: Uint8Array;
	numEntries: number;
	totalScenarios: number;
	entryIndex: number;
	targetPosition: number;
	scenarioProbabilityMasses?: Float64Array;
	totalWeight?: number;
}

export interface ScenarioSimulationWorkerRequest {
	requestId: number;
	config: SimulationConfig;
}

export interface ScenarioSimulationWorkerResultMessage {
	type: 'result';
	requestId: number;
	result: SimulationResult;
	durationMs: number;
}

export interface ScenarioSimulationWorkerErrorMessage {
	type: 'error';
	requestId: number;
	message: string;
}

export type ScenarioSimulationWorkerMessage =
	| ScenarioSimulationWorkerResultMessage
	| ScenarioSimulationWorkerErrorMessage;

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
	contestId?: string | number;
	url?: string;
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

export interface ViewerProfile {
	firstName: string;
	lastName: string;
	isAdmin: boolean;
}

// ─── HTTP Cache ──────────────────────────────────────────────────────────────

export class HttpError extends Error {
	status: number;
	constructor(message: string, status: number) {
		super(message);
		this.status = status;
	}
}
