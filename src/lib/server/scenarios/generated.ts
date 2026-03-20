import fs from 'node:fs/promises';
import path from 'node:path';
import type { GeneratedScenarioArtifact } from '$lib/types';

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
