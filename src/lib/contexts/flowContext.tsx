import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createContext } from 'react';

const client: QueryClient = new QueryClient();

export const FlowContext = createContext(undefined);

interface FlowProviderProps {
  children: React.ReactNode;
}

export function FlowProvider({ children }: FlowProviderProps) {
  return (
    <QueryClientProvider client={client}>
      <FlowContext.Provider value={undefined}>{children}</FlowContext.Provider>
    </QueryClientProvider>
  );
}
