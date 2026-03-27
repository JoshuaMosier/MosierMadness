/// <reference lib="webworker" />

import { runSimulation } from '$lib/utils/scenarioEngine';
import type {
  ScenarioSimulationWorkerMessage,
  ScenarioSimulationWorkerRequest,
} from '$lib/types';

const workerScope = self as DedicatedWorkerGlobalScope;

workerScope.onmessage = (event: MessageEvent<ScenarioSimulationWorkerRequest>) => {
  const { requestId, config } = event.data;
  const startedAt = performance.now();

  try {
    const result = runSimulation(config);
    const message: ScenarioSimulationWorkerMessage = {
      type: 'result',
      requestId,
      result,
      durationMs: performance.now() - startedAt,
    };

    workerScope.postMessage(message, [
      result.winCounts.buffer,
      result.weightedWinCounts.buffer,
      result.positionCounts.buffer,
      result.weightedPositionCounts.buffer,
      result.scenarioPositions.buffer,
      result.scenarioProbabilityMasses.buffer,
    ]);
  } catch (error: unknown) {
    const message: ScenarioSimulationWorkerMessage = {
      type: 'error',
      requestId,
      message: error instanceof Error ? error.message : String(error),
    };

    workerScope.postMessage(message);
  }
};

export {};
