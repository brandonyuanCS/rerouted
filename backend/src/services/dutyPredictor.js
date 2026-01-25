export function predictDutyEnd(crew, pairing, disruptions) {
    let dutyEnd = new Date(pairing.dutyEnd);

    disruptions.forEach(d => {
        if (pairing.flights.includes(d.flightNumber)) {
        dutyEnd = new Date(dutyEnd.getTime() + d.delayMinutes * 60000);
        }
    });

    return dutyEnd;
}