import { tabuSearch } from "./tabuSearch.js";

export function runOptimization(crewData, flightData, simTime) {

  const initialState = {
    assignments: [],
    crewStates: JSON.parse(JSON.stringify(crewData))
  };

  const finalState = tabuSearch(
    initialState,
    crewData,
    flightData,
    simTime
  );

  return finalState;
}