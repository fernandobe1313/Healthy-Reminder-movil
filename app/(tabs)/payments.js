import React from 'react';
import { PaymentsScreen } from '../../src/screens/PaymentsScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function PaymentsRoute() {
  const state = useAppState();

  return <PaymentsScreen theme={state.theme} payments={state.payments} setSheet={state.setSheet} />;
}
