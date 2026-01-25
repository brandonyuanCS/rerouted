export function applyMove(currentState, move, crewData, flightData) {
    const newState = JSON.parse(JSON.stringify(currentState));

    if (move.removeCrewId) {
        newState.assignments = newState.assignments.filter(
        assignment =>
        !(
          assignment.flightNumber === flightNumber &&
          assignment.crewId === move.removeCrewId
        )
    );
  }


    if (move.addCrewId) {
        newState.assignments.push({
            flightNumber: move.flightNumber,
            crewId: move.addCrewId
        });

        const crewState = newState.crewStates[move.addCrewId];
        const flight = flightData[move.flightNumber];

        crewState.dutyTimeToday += flight.duration;
        crewState.flightTimeToday += flight.duration;
        crewState.currentLocation = flight.destination;
    }

    return newState;
}