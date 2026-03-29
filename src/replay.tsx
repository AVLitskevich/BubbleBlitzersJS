import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import ReplayApp from './ReplayApp';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReplayApp />
  </StrictMode>
);
