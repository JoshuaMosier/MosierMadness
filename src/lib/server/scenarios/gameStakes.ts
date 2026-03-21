import type {
	GameScenarioStakeBranch,
	GameScenarioStakeEntry,
	GameScenarioStakes,
	GeneratedScenarioArtifact,
	GeneratedScenarioEntry,
	GeneratedScenarioGamePreview,
	GeneratedScenarioOutcome,
	ScoreboardGame,
	ScoreboardTeam,
} from '$lib/types';

const HIGHLIGHT_LIMIT = 3;

type OutcomePair = {
	away: GeneratedScenarioOutcome;
	home: GeneratedScenarioOutcome;
};

type RankedStakeEntry = GameScenarioStakeEntry & {
	titleAliveInBranch: boolean;
	titleAliveInOpposite: boolean;
};

function normalizeName(name: string | null | undefined): string {
	return String(name ?? '').trim().toLowerCase();
}

function getDisplayName(entry: GeneratedScenarioEntry): string {
	return entry.displayName || `${entry.firstName ?? ''} ${entry.lastName ?? ''}`.trim() || entry.entryId;
}

function teamMatches(previewTeam: GeneratedScenarioGamePreview['teamA'], gameTeam: ScoreboardTeam): boolean {
	if (!previewTeam || !gameTeam) {
		return false;
	}

	if (previewTeam.seoName && gameTeam.seoName && previewTeam.seoName === gameTeam.seoName) {
		return true;
	}

	return normalizeName(previewTeam.name) === normalizeName(gameTeam.name);
}

function findPreviewGame(
	game: ScoreboardGame,
	previewGames: GeneratedScenarioGamePreview[] | undefined,
): GeneratedScenarioGamePreview | null {
	if (!Array.isArray(previewGames) || previewGames.length === 0 || game.bracketIndex === null) {
		return null;
	}

	const byIndex = previewGames.find((previewGame) => previewGame.gameIndex === game.bracketIndex! - 1);
	if (byIndex) {
		return byIndex;
	}

	return previewGames.find((previewGame) => {
		const sameOrder =
			teamMatches(previewGame.teamA, game.awayTeam) && teamMatches(previewGame.teamB, game.homeTeam);
		const swappedOrder =
			teamMatches(previewGame.teamA, game.homeTeam) && teamMatches(previewGame.teamB, game.awayTeam);
		return sameOrder || swappedOrder;
	}) ?? null;
}

function getOutcomePair(previewGame: GeneratedScenarioGamePreview, game: ScoreboardGame): OutcomePair | null {
	if (teamMatches(previewGame.teamA, game.awayTeam) && teamMatches(previewGame.teamB, game.homeTeam)) {
		return {
			away: previewGame.outcomeA,
			home: previewGame.outcomeB,
		};
	}

	if (teamMatches(previewGame.teamA, game.homeTeam) && teamMatches(previewGame.teamB, game.awayTeam)) {
		return {
			away: previewGame.outcomeB,
			home: previewGame.outcomeA,
		};
	}

	return null;
}

function toRankedStakeEntries(
	baselineEntries: GeneratedScenarioEntry[],
	branchOutcome: GeneratedScenarioOutcome,
	oppositeOutcome: GeneratedScenarioOutcome,
): RankedStakeEntry[] {
	const branchByEntryId = new Map(branchOutcome.entries.map((entry) => [entry.entryId, entry]));
	const oppositeByEntryId = new Map(oppositeOutcome.entries.map((entry) => [entry.entryId, entry]));

	return baselineEntries.map((baselineEntry) => {
		const branchEntry = branchByEntryId.get(baselineEntry.entryId) ?? baselineEntry;
		const oppositeEntry = oppositeByEntryId.get(baselineEntry.entryId) ?? baselineEntry;

		return {
			entryId: baselineEntry.entryId,
			userId: baselineEntry.userId,
			displayName: getDisplayName(baselineEntry),
			firstPlacePct: branchEntry.firstPlacePct,
			swingPct: branchEntry.firstPlacePct - oppositeEntry.firstPlacePct,
			titleAliveInBranch: branchEntry.firstPlaceCount > 0,
			titleAliveInOpposite: oppositeEntry.firstPlaceCount > 0,
		};
	});
}

function stripRankedEntry(entry: RankedStakeEntry): GameScenarioStakeEntry {
	return {
		entryId: entry.entryId,
		userId: entry.userId,
		displayName: entry.displayName,
		firstPlacePct: entry.firstPlacePct,
		swingPct: entry.swingPct,
	};
}

function compareByTitleOdds(left: RankedStakeEntry, right: RankedStakeEntry): number {
	if (right.firstPlacePct !== left.firstPlacePct) {
		return right.firstPlacePct - left.firstPlacePct;
	}

	if (right.swingPct !== left.swingPct) {
		return right.swingPct - left.swingPct;
	}

	return left.displayName.localeCompare(right.displayName);
}

function compareBySwing(left: RankedStakeEntry, right: RankedStakeEntry): number {
	if (right.swingPct !== left.swingPct) {
		return right.swingPct - left.swingPct;
	}

	if (right.firstPlacePct !== left.firstPlacePct) {
		return right.firstPlacePct - left.firstPlacePct;
	}

	return left.displayName.localeCompare(right.displayName);
}

function compareByDrop(left: RankedStakeEntry, right: RankedStakeEntry): number {
	if (left.swingPct !== right.swingPct) {
		return left.swingPct - right.swingPct;
	}

	if (right.firstPlacePct !== left.firstPlacePct) {
		return right.firstPlacePct - left.firstPlacePct;
	}

	return left.displayName.localeCompare(right.displayName);
}

function buildBranchStakeSummary(
	baselineEntries: GeneratedScenarioEntry[],
	branchOutcome: GeneratedScenarioOutcome,
	oppositeOutcome: GeneratedScenarioOutcome,
): GameScenarioStakeBranch {
	const rankedEntries = toRankedStakeEntries(baselineEntries, branchOutcome, oppositeOutcome);
	const titleAliveEntries = rankedEntries.filter((entry) => entry.titleAliveInBranch);
	const mustHaveEntries = titleAliveEntries
		.filter((entry) => !entry.titleAliveInOpposite)
		.sort(compareByTitleOdds);
	const biggestSwingEntries = rankedEntries
		.filter((entry) => entry.swingPct > 0)
		.sort(compareBySwing);
	const biggestDropEntries = rankedEntries
		.filter((entry) => entry.swingPct < 0)
		.sort(compareByDrop);
	const favoriteEntry = [...titleAliveEntries].sort(compareByTitleOdds)[0] ?? null;

	return {
		totalScenarios: branchOutcome.totalScenarios,
		titleAliveCount: titleAliveEntries.length,
		mustHaveCount: mustHaveEntries.length,
		mustHaveEntries: mustHaveEntries.slice(0, HIGHLIGHT_LIMIT).map(stripRankedEntry),
		biggestSwingEntries: biggestSwingEntries.slice(0, HIGHLIGHT_LIMIT).map(stripRankedEntry),
		biggestDropEntries: biggestDropEntries.slice(0, HIGHLIGHT_LIMIT).map(stripRankedEntry),
		favoriteEntry: favoriteEntry ? stripRankedEntry(favoriteEntry) : null,
		maxSwingPct: biggestSwingEntries[0]?.swingPct ?? 0,
	};
}

export function getGameScenarioStakesProjection(
	game: ScoreboardGame | null,
	artifact: GeneratedScenarioArtifact | null,
): GameScenarioStakes | null {
	if (!game || !artifact) {
		return null;
	}

	const previewGame = findPreviewGame(game, artifact.previewGames);
	if (!previewGame) {
		return null;
	}

	const outcomePair = getOutcomePair(previewGame, game);
	if (!outcomePair) {
		return null;
	}

	return {
		totalScenarios: artifact.totalScenarios,
		assumptionSummary: artifact.assumptionSummary,
		away: buildBranchStakeSummary(artifact.entries, outcomePair.away, outcomePair.home),
		home: buildBranchStakeSummary(artifact.entries, outcomePair.home, outcomePair.away),
	};
}
