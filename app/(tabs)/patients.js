import React from 'react';
import { PatientsScreen } from '../../src/screens/PatientsScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function PatientsRoute() {
  const state = useAppState();

  return (
    <PatientsScreen
      theme={state.theme}
      patients={state.filteredPatients}
      search={state.search}
      setSearch={state.setSearch}
      setSheet={state.setSheet}
    />
  );
}
