import React from 'react';
import { Redirect } from 'expo-router';
import { useAppState } from '../../src/navigation/AppStateContext';
import { PatientShell } from '../../src/patient/PatientShell';

export default function PatientLayout() {
  const state = useAppState();
  if (!state.loggedIn) return <Redirect href="/" />;
  if (state.currentRole !== 'patient') return <Redirect href="/dashboard" />;
  return <PatientShell />;
}
