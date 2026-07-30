import React from 'react';
import { AgendaScreen } from '../../src/screens/AgendaScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function AgendaRoute() {
  const state = useAppState();

  return (
    <AgendaScreen
      theme={state.theme}
      appointments={state.appointments}
      selectedDay={state.selectedDay}
      setSelectedDay={state.setSelectedDay}
      selectedAgendaDate={state.selectedAgendaDate}
      setSelectedAgendaDate={state.setSelectedAgendaDate}
      setSheet={state.setSheet}
    />
  );
}
