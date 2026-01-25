export function isCrewLegal(crew, flight, pairing, simTime) {
    if (!crew.certifications.includes(flight.aircraft)) return false;

    if (crew.status == "day_off") return false;

    if (!hasRequiredRest(crew, simTime)) return false;

    if (wouldExceedDuty(crew, flight, pairing)) return false;

    if (crew.consecutiveDutyDays >= 6) return false;

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

    const predictedDuty = crew.dutyTimeToday + flight.duration + 45; // buffer
    return predictedDuty <= 780; // FAA 13 hours
}