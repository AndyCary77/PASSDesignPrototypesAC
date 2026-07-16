import { createContext, useContext } from 'react';
import { useParams } from 'react-router';
import { getCustomer, DEFAULT_CUSTOMER, type CustomerProfile } from './customers';

const CustomerContext = createContext<CustomerProfile>(DEFAULT_CUSTOMER);

/** Resolves the current customer from the `:customerId` route param and provides it to the subtree. */
export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const { customerId } = useParams();
  return <CustomerContext.Provider value={getCustomer(customerId)}>{children}</CustomerContext.Provider>;
}

export function useCustomer(): CustomerProfile {
  return useContext(CustomerContext);
}
