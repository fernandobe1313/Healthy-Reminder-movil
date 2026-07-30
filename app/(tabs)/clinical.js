import React from 'react';
import { ClinicalScreen } from '../../src/screens/ClinicalScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function ClinicalRoute() {
  const state = useAppState();

  return (
    <ClinicalScreen
      theme={state.theme}
      patients={state.patients}
      selectedPatientId={state.selectedClinicalPatientId}
      setSelectedPatientId={state.setSelectedClinicalPatientId}
      selectedTooth={state.selectedTooth}
      setSelectedTooth={state.setSelectedTooth}
      odontogramByPatient={state.odontogramByPatient}
      setOdontogramByPatient={state.setOdontogramByPatient}
      notify={state.notify}
    />
  );
}
