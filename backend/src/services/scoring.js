export function scoreState(state, flights) {
    let score = 0;

    // Reward assigned flights
    score += state.assignments.length * 100;

    // Penalize unassigned flights
    score -= (flights.length - state.assignments.length) * 200;

    // Penalize excessive duty time
    for (const crewId in state.crewStates) {
        const crew = state.crewStates[crewId];
        if (crew.dutyTimeToday > 600) {
            score -= 50;
        }
    }

    return score;
}