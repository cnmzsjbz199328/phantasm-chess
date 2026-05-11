import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PieceShowcase } from './PieceShowcase';

createRoot(document.getElementById('showcase-root')!).render(
  <StrictMode>
    <PieceShowcase />
  </StrictMode>
);
