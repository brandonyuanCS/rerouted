export function allAssignmentsLegal(state, crewData, flightData) {
    for (const crewId in state.crewAssignments) {
        const crew = crewData[crewId];
        const flights = state.crewAssignments[crewId];

        if (!isAssignmentLegal(crew, flights, flightData)) {
            return false;
        }
    }
    return true;
}



export function isAssignmentLegal(crew, flight, simTime) {
    if (!crew.certifications.includes(flight.aircraft)) return false;

    if (crew.status == "day_off") return false;

    if (!hasRequiredRest(crew, simTime)) return false;

    if (wouldExceedDuty(crew, flight, pairing)) return false;

    if (crew.consecutiveDutyDays >= 6) return false;

    // if (crew.currentLocation !== flight.origin) {
    //     return false;
    // }

    return true;
}

function hasRequiredRest(crew, simTime) {
    // to do with updated regulations

    if (!crew.lastRestEnd) return true;
    const hoursSinceRest = (new Date(simTime) - new Date(crew.lastRestEnd)) / 36e5;
    return hoursSinceRest >= 10;
}

function wouldExceedDuty(crew, flight, pairing) {
    // to do with updated regulations

    if (crew.dutyTimeToday + flight.duration + 45 > 780) return false;

    if (crew.flightTimeToday + flight.duration > 480) return false;

    return true;
}