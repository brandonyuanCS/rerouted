import { findBestCrew } from "./crewMatcher.js";
import { predictDutyEnd } from "./dutyPredictor.js";

export function planRecovery(flight, affectedPairing, crewList, disruptions) {
    const candidates = findBestCrew(
        flight,
        crewList,
        affectedPairing,
        new Date()
    );

    if (candidates.length === 0) return null;

    return {
        action: "crew_swap",
        flightNumber: flight.flightNumber,
        newCrewId: candidates[0].crew.crewId,
        confidence: Math.min(candidates[0].score / 100, 0.99)
    };
}