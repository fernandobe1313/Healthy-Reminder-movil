import React from 'react';
import { AssistantScreen } from '../../src/screens/AssistantScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function AssistantRoute() {
  const { theme } = useAppState();

  return <AssistantScreen theme={theme} />;
}
