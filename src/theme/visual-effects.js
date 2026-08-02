import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import 'expo-sqlite/localStorage/install';

const VisualEffectsContext = createContext({
  ledEnabled: true,
  setLedEnabled: () => {},
});

export function VisualEffectsProvider({ children }) {
  const [ledEnabled, setLedEnabled] = useState(() => {
    try { return globalThis.localStorage?.getItem('hr_led_enabled') !== 'false'; }
    catch { return true; }
  });
  useEffect(() => {
    try { globalThis.localStorage?.setItem('hr_led_enabled', String(ledEnabled)); } catch {}
  }, [ledEnabled]);
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
