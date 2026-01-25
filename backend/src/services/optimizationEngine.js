import { planRecovery } from "./recoveryPlanner.js";

export function runOptimization({
  flights,
  crew,
  pairings,
  disruptions,
  simTime
}) {
  const actions = [];

  disruptions.forEach(disruption => {
    const flight = flights.find(
      f => f.flightNumber === disruption.flightNumber
    );

    if (!flight) return;

    const affectedPairing = pairings.find(p =>
      p.flights.includes(flight.flightNumber)
    );

    const recovery = planRecovery(
      flight,
      affectedPairing,
      crew,
      disruptions
    );

    if (recovery) actions.push(recovery);
  });

  return actions;
}