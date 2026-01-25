import { isCrewLegal } from "./constraintChecks.js";
import { scoreCrew } from "./scoring.js";

export function findBestCrew(flight, crewList, pairing, simTime) {
    const candidates = []
    for (let i = 0; i < crewList.length; i++) {
        const crew = crewList[i];
        if (!isCrewLegal(crew, flight, pairing, simTime)) {
            continue;
        }

        const score = scoreCrew(crew, flight);

        candidates.push({
            crewId: crew.crewId,
            name: crew.name,
            score: score,
            location: crew.currentLocation,
            seniorityScore: crew.seniorityScore
        });
    }

    for (let i = 0; i < candidates.length - 1; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
            if (candidates[j].score > candidates[i].score) {
                const temp = candidates[i];
                candidates[i] = candidates[j];
                candidates[j] = temp;
            }
        }
    }


    return candidates;
}