import { definition as addItemToCycleDefinition, addItemToCycle } from './add-to-cycle.js';
import { definition as createCycleDefinition, createCycle } from './create.js';
import { definition as getActiveCycleDefinition, getActiveCycle } from './get-active.js';
import { definition as getCycleDefinition, getCycle } from './get.js';
import { definition as listCyclesDefinition, listCycles } from './list.js';
import { definition as setActiveCycleDefinition, setActiveCycle } from './set-active.js';

export const CYCLE_TOOL_DEFINITIONS = [
  listCyclesDefinition,
  getCycleDefinition,
  getActiveCycleDefinition,
  setActiveCycleDefinition,
  createCycleDefinition,
  addItemToCycleDefinition,
];

export { listCycles, getCycle, getActiveCycle, setActiveCycle, createCycle, addItemToCycle };
