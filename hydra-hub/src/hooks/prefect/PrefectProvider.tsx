import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ReactNode } from 'react';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // Consider data stale after 30 seconds
      retry: 2, // Retry failed requests 2 times
      refetchOnWindowFocus: true,
    },
  },
});

interface PrefectProviderProps {
  children: ReactNode;
}

export function PrefectProvider({ children }: PrefectProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
