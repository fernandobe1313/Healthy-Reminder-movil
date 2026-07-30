import React from 'react';
import { RemindersScreen } from '../../src/screens/RemindersScreen';
import { useAppState } from '../../src/navigation/AppStateContext';

export default function RemindersRoute() {
  const state = useAppState();

  return (
    <RemindersScreen
      theme={state.theme}
      reminders={state.reminders}
      setSheet={state.setSheet}
      onSendReminder={state.sendReminder}
      onMarkReminderSent={state.markReminderSent}
      onCopyReminder={state.copyReminder}
      onRefreshReminders={state.refreshReminders}
    />
  );
}
