import fs from 'node:fs/promises';
import path from 'node:path';
import type { ScenarioWeightingModel, TournamentSnapshot } from '$lib/types';

const BRACKET_SCENARIOS_INPUT_DIR = path.resolve(
	process.cwd(),
	'data',
	'input',
);
const DEFAULT_LOGISTIC_SCALE = 10;
const BUNDLED_RATINGS_FILE_CONTENT = import.meta.glob('../../../../data/input/*.{csv,tsv}', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;

type RatingsFileReference =
	| {
			kind: 'filesystem';
			filePath: string;
			fileName: string;
	  }
	| {
			kind: 'bundled';
			filePath: string;
			fileName: string;
	  };

function normalizeHeader(value: string): string {
	let normalized = '';
	let previousWasSeparator = false;

	for (const character of value.trim()) {
		if (/[a-z0-9]/i.test(character)) {
			normalized += character.toLowerCase();
			previousWasSeparator = false;
		} else if (!previousWasSeparator) {
			normalized += '_';
			previousWasSeparator = true;
		}
	}

	return normalized.replace(/^_+|_+$/g, '');
}

function normalizeTeamName(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]/g, '');
}

function stripParentheticalSegments(value: string): string {
	let result = '';
	let depth = 0;

	for (const character of value) {
		if (character === '(') {
			depth += 1;
			continue;
		}

		if (character === ')') {
			depth = Math.max(0, depth - 1);
			continue;
		}

		if (depth === 0) {
			result += character;
		}
	}

	return result.trim();
}

function knownTeamNameAliases(value: string): string[] {
	switch (value) {
		case 'californiabaptist':
		case 'calbaptist':
			return ['californiabaptist', 'calbaptist'];
		case 'connecticut':
		case 'uconn':
			return ['connecticut', 'uconn'];
		case 'mcneese':
		case 'mcneesest':
			return ['mcneese', 'mcneesest'];
		case 'northerniowa':
		case 'uni':
			return ['northerniowa', 'uni'];
		case 'prairieview':
		case 'prairieviewam':
			return ['prairieview', 'prairieviewam'];
		case 'southfla':
		case 'southflorida':
			return ['southfla', 'southflorida'];
		default:
			return [];
	}
}

function collectTeamNameAliases(name: string, seoName: string): string[] {
	const aliases = new Set<string>();
	const push = (value: string) => {
		if (value) {
			aliases.add(value);
		}
	};

	push(normalizeTeamName(name));
	push(normalizeTeamName(stripParentheticalSegments(name)));
	push(normalizeTeamName(seoName));

	for (const alias of [...aliases]) {
		for (const knownAlias of knownTeamNameAliases(alias)) {
			push(knownAlias);
		}
	}

	return [...aliases];
}

function getPreferredRatingsFileNames(displaySeasonYear: number): string[] {
	return [
		`${displaySeasonYear}_team_results.csv`,
		`${displaySeasonYear}_team_results.tsv`,
		`${displaySeasonYear}_team_ratings.csv`,
		`${displaySeasonYear}_team_ratings.tsv`,
	];
}

function getBundledRatingsFiles(): RatingsFileReference[] {
	return Object.keys(BUNDLED_RATINGS_FILE_CONTENT)
		.map((modulePath) => modulePath.replace(/\\/g, '/'))
		.map((modulePath) => {
			const fileName = modulePath.split('/').at(-1) ?? modulePath;

			return {
				kind: 'bundled' as const,
				fileName,
				filePath: modulePath,
			};
		});
}

function findBundledRatingsFile(displaySeasonYear: number): RatingsFileReference | null {
	const files = getBundledRatingsFiles();
	const preferredNames = new Set(getPreferredRatingsFileNames(displaySeasonYear));

	const preferred = files.find((file) => preferredNames.has(file.fileName));
	if (preferred) {
		return preferred;
	}

	const fallback = files.filter((file) => /team_(results|ratings)\.(csv|tsv)$/i.test(file.fileName));
	fallback.sort((left, right) => right.fileName.localeCompare(left.fileName));
	return fallback[0] ?? null;
}

async function findLatestRatingsFile(displaySeasonYear: number): Promise<RatingsFileReference | null> {
	try {
		const entries = await fs.readdir(BRACKET_SCENARIOS_INPUT_DIR, { withFileTypes: true });
		const files = entries
			.filter((entry) => entry.isFile())
			.map((entry) => entry.name);

		const preferredNames = new Set(getPreferredRatingsFileNames(displaySeasonYear));

		const preferred = await Promise.all(
			files
				.filter((name) => preferredNames.has(name))
				.map(async (name) => {
					const fullPath = path.join(BRACKET_SCENARIOS_INPUT_DIR, name);
					const stats = await fs.stat(fullPath);
					return { fullPath, mtimeMs: stats.mtimeMs };
				}),
		);
		preferred.sort((left, right) => right.mtimeMs - left.mtimeMs);
		if (preferred[0]) {
			return {
				kind: 'filesystem',
				fileName: path.basename(preferred[0].fullPath),
				filePath: preferred[0].fullPath,
			};
		}

		const fallback = await Promise.all(
			files
				.filter((name) => /team_(results|ratings)\.(csv|tsv)$/i.test(name))
				.map(async (name) => {
					const fullPath = path.join(BRACKET_SCENARIOS_INPUT_DIR, name);
					const stats = await fs.stat(fullPath);
					return { fullPath, mtimeMs: stats.mtimeMs };
				}),
		);
		fallback.sort((left, right) => right.mtimeMs - left.mtimeMs);
		if (fallback[0]) {
			return {
				kind: 'filesystem',
				fileName: path.basename(fallback[0].fullPath),
				filePath: fallback[0].fullPath,
			};
		}
	} catch {
		return findBundledRatingsFile(displaySeasonYear);
	}

	return findBundledRatingsFile(displaySeasonYear);
}

async function readRatingsFileContent(file: RatingsFileReference): Promise<string | null> {
	if (file.kind === 'filesystem') {
		try {
			return await fs.readFile(file.filePath, 'utf8');
		} catch {
			return null;
		}
	}

	return BUNDLED_RATINGS_FILE_CONTENT[file.filePath] ?? null;
}

function buildSeoNameAliasMap(snapshot: TournamentSnapshot): Map<string, string> {
	const aliasMap = new Map<string, string>();

	for (const team of snapshot.firstRoundTeams) {
		if (!team?.name || !team.seoName) {
			continue;
		}

		for (const alias of collectTeamNameAliases(team.name, team.seoName)) {
			if (!aliasMap.has(alias)) {
				aliasMap.set(alias, team.seoName);
			}
		}
	}

	return aliasMap;
}

export async function getScenarioWeightingModel(
	snapshot: TournamentSnapshot,
	displaySeasonYear: number,
): Promise<ScenarioWeightingModel | null> {
	const ratingsFile = await findLatestRatingsFile(displaySeasonYear);
	if (!ratingsFile) {
		return null;
	}

	try {
		const content = await readRatingsFileContent(ratingsFile);
		if (!content) {
			return null;
		}

		const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
		if (lines.length === 0) {
			return null;
		}

		const delimiter = lines[0].includes('\t') ? '\t' : ',';
		const headers = lines[0].split(delimiter).map(normalizeHeader);
		const headerIndex = new Map(headers.map((header, index) => [header, index]));
		const seoIndex =
			headerIndex.get('seo_name')
			?? headerIndex.get('seo')
			?? headerIndex.get('team_seo_name');
		const nameIndex =
			headerIndex.get('name')
			?? headerIndex.get('team')
			?? headerIndex.get('team_name')
			?? headerIndex.get('display_name');

		const log5MetricIndex =
			headerIndex.get('barthag')
			?? headerIndex.get('pyth')
			?? headerIndex.get('win_pct')
			?? headerIndex.get('win_percentage');
		const logisticMetricIndex =
			headerIndex.get('adjem')
			?? headerIndex.get('rating')
			?? headerIndex.get('strength');

		const metricIndex = log5MetricIndex ?? logisticMetricIndex;
		if (metricIndex == null) {
			return null;
		}

		const kind: ScenarioWeightingModel['kind'] = log5MetricIndex != null ? 'log5' : 'logistic';
		const aliasMap = buildSeoNameAliasMap(snapshot);
		const ratingsBySeoName: Record<string, number> = {};

		for (const line of lines.slice(1)) {
			const columns = line.split(delimiter).map((value) => value.trim());
			const rawMetric = columns[metricIndex];
			if (!rawMetric) {
				continue;
			}

			const rating = Number(rawMetric);
			if (!Number.isFinite(rating)) {
				continue;
			}

			let seoName = '';
			if (seoIndex != null) {
				seoName = (columns[seoIndex] ?? '').trim().toLowerCase();
			}

			if (!seoName && nameIndex != null) {
				const normalizedName = normalizeTeamName(columns[nameIndex] ?? '');
				seoName = aliasMap.get(normalizedName) ?? '';
			}

			if (!seoName) {
				continue;
			}

			ratingsBySeoName[seoName] = rating;
		}

		const matchedCount = Object.keys(ratingsBySeoName).length;
		if (matchedCount === 0) {
			return null;
		}

		const totalTeamCount = snapshot.firstRoundTeams.filter(Boolean).length;
		const metricLabel = headers[metricIndex] ?? 'rating';
		const ratingsFileName = ratingsFile.fileName;
		const coverageNote =
			matchedCount === totalTeamCount
				? `Matched ratings for all ${totalTeamCount} bracket teams.`
				: `Matched ratings for ${matchedCount} of ${totalTeamCount} bracket teams; unmatched teams default to 50/50 in unresolved matchups.`;
		const sourceNote =
			kind === 'log5'
				? `Branch weights use log5 on ${metricLabel} from ${ratingsFileName}. ${coverageNote}`
				: `Branch weights use logistic on ${metricLabel} from ${ratingsFileName} with scale ${DEFAULT_LOGISTIC_SCALE}. ${coverageNote}`;

		return {
			kind,
			scale: kind === 'logistic' ? DEFAULT_LOGISTIC_SCALE : undefined,
			ratingsBySeoName,
			summaryLabel: 'Team strength ratings',
			sourceNote,
		};
	} catch {
		return null;
	}
}
