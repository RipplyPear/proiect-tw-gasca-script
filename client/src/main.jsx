// Punctul de intrare al aplicatiei React
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import './index.css';
import App from './App.jsx';

// QueryClient gestioneaza cache-ul si starile request-urilor HTTP
const queryClient = new QueryClient();

// Randam aplicatia in div#root din index.html
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
