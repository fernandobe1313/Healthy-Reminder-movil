import React, { createContext, useContext, useMemo, useState } from 'react';

const VisualEffectsContext = createContext({
  ledEnabled: true,
  setLedEnabled: () => {},
});

export function VisualEffectsProvider({ children }) {
  const [ledEnabled, setLedEnabled] = useState(true);
  const value = useMemo(() => ({ ledEnabled, setLedEnabled }), [ledEnabled]);

  return (
    <VisualEffectsContext.Provider value={value}>
      {children}
    </VisualEffectsContext.Provider>
  );
}

export function useVisualEffects() {
  return useContext(VisualEffectsContext);
}

