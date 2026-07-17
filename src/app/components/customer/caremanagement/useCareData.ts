import { useCustomer } from '../../../data/CustomerContext';
import { CARE_DATA } from './types';

/**
 * Returns the current customer's care-plan data. Names are uppercased to match
 * the constants the tabs previously imported directly, so consumers can simply
 * destructure `{ TASKS, OUTCOMES, VISITS }` at the top of a component.
 */
export function useCareData() {
  const customer = useCustomer();
  const data = CARE_DATA[customer.id] ?? { tasks: [], outcomes: [], visits: [] };
  return { TASKS: data.tasks, OUTCOMES: data.outcomes, VISITS: data.visits };
}
