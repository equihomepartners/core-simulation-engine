import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from 'react-query';
import { Toaster } from '@/components/ui/toaster';

// Import styles
import './styles/globals.css';

// Import layout and pages
import { MainLayout } from './components/layout/main-layout';
import { Dashboard } from './pages/dashboard';
import { Wizard } from './pages/wizard';
import { Results } from './pages/results';
import { CompareResults } from './pages/compare-results';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/wizard" element={<Wizard />} />
          <Route path="/results/compare" element={<CompareResults />} />
          <Route path="/results/:simulationId" element={<Results />} />
          <Route path="/results" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
