// chat generated skeleton scoring for each crew member to flight pairing

export function scoreCrew(crew, flight) {
    let score = 0;

    // Base proximity
    if (crew.currentLocation === flight.origin) score += 30;

    // Aircraft familiarity
    score += crew.certifications.length * 2;

    // Seniority preference (normalized)
    score += Math.min(crew.seniorityScore / 100, 20);

    // Fatigue penalty
    score -= crew.consecutiveDutyDays * 5;

    return score;
}