import { scoreState } from "./scoring.js";
import { isAssignmentLegal } from "./constraintChecks.js";
import { applyMove } from "./stateUpdater.js";

export function tabuSearch(initialState, crewData, flightData, simTime) {

    let bestState = initialState;
    let bestScore = scoreState(initialState, flightData);

    let currentState = initialState;
    let tabuList = [];

    const TABU_SIZE = 10;
    const MAX_ITERATIONS = 150;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {

        let bestNeighbor = null;
        let bestNeighborScore = -Infinity;
        let bestMove = null;

        for (const flightNumber in flightData) {
            for (const crewId in crewData) {

                const crew = currentState.crewStates[crewId];
                const flight = flightData[flightNumber];

                if (!isAssignmentLegal(crew, flight, simTime)) {
                    continue;
                }

                const moveKey = `${move.removeCrewId}-${move.addCrewId}-${flightNumber}`;
                if (tabuList.includes(moveKey)) {
                    continue;
                }

                const move = {
                    flightNumber,
                    removeCrewId: currentState.flightAssignments[flightNumber] || null,
                    addCrewId: crewId
                };

                const neighbor = applyMove(
                    currentState,
                    move,
                    crewData,
                    flightData
                );

                const neighborScore = scoreState(neighbor, flightData);

                if (neighborScore > bestNeighborScore) {
                    bestNeighborScore = neighborScore;
                    bestNeighbor = neighbor;
                    bestMove = moveKey;
                }
            }
        }

        if (!bestNeighbor) break;

        currentState = bestNeighbor;
        tabuList.push(bestMove);

        if (tabuList.length > TABU_SIZE) {
            tabuList.shift();
        }

        if (bestNeighborScore > bestScore) {
            bestState = bestNeighbor;
            bestScore = bestNeighborScore;
        }
    }

    return bestState;
}