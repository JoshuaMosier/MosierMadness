import fs from 'node:fs/promises';
import path from 'node:path';
import type { GeneratedScenarioArtifact, TournamentSnapshot } from '$lib/types';
import { getTeamColorSet, loadTeamColors } from '$lib/server/tournament/teamColors';
import { getTournamentSettings } from '$lib/server/tournament/settings';
import { getTournamentSnapshot } from '$lib/server/tournament/snapshot';

const GENERATED_SCENARIO_PATH = path.resolve(
	process.cwd(),
	'static',
	'generated',
	'scenarios',
	'current.json',
);

export async function getGeneratedScenarioArtifact(): Promise<GeneratedScenarioArtifact | null> {
	try {
		const raw = await fs.readFile(GENERATED_SCENARIO_PATH, 'utf8');
		const parsed = JSON.parse(raw) as GeneratedScenarioArtifact;
		if (!parsed || !Array.isArray(parsed.entries)) {
			return null;
		}

		if (Array.isArray(parsed.previewGames) && parsed.previewGames.length > 0) {
			await loadTeamColors();
			let snapshot: TournamentSnapshot | null = null;

			try {
				const settings = await getTournamentSettings();
				snapshot = await getTournamentSnapshot(settings);
			} catch {
				snapshot = null;
			}

			parsed.previewGames = parsed.previewGames.map((game) => ({
				...game,
				startTime: snapshot?.bracketMatches?.[game.gameIndex]?.startTime || '',
				teamA: {
					...game.teamA,
					primaryColor: getTeamColorSet(game.teamA?.seoName).primaryColor,
					secondaryColor: getTeamColorSet(game.teamA?.seoName).secondaryColor,
				},
				teamB: {
					...game.teamB,
					primaryColor: getTeamColorSet(game.teamB?.seoName).primaryColor,
					secondaryColor: getTeamColorSet(game.teamB?.seoName).secondaryColor,
				},
			}));
		}

		return parsed;
	} catch {
		return null;
	}
}

export async function hasGeneratedScenarioArtifact(): Promise<boolean> {
	try {
		await fs.access(GENERATED_SCENARIO_PATH);
		return true;
	} catch {
		return false;
	}
}

export function getGeneratedScenarioArtifactPath(): string {
	return GENERATED_SCENARIO_PATH;
}
