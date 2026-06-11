// ============================================================
// IGWEMP — App Root
// ============================================================

import React from 'react';
import { Providers } from './Providers';
import { Router } from './Router';

export function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}
