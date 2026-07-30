import React from 'react';
import { FollowUpsScreen } from '../../src/screens/FollowUpsScreen';
import { useAppState } from '../../src/navigation/AppStateContext';
import { scheduleLocalReminder } from '../../src/native/native-capabilities';

export default function FollowUpsRoute() {
  const state = useAppState();
  const createAndSchedule = async (form) => {
    await state.createFollowUp(form);
    try {
      await scheduleLocalReminder({
        title: 'Es momento de revisar tu recuperación',
        body: `Completa el seguimiento de ${form.procedure}.`,
        date: form.next_check_at,
        url: '/patient-recovery',
      });
    } catch {
      // El seguimiento permanece creado aunque el dispositivo no permita avisos.
    }
  };
  return <FollowUpsScreen theme={state.theme} patients={state.patients} followUps={state.followUps} onCreate={createAndSchedule} onReview={state.reviewFollowUp} onClose={state.closeFollowUp} notify={state.notify} />;
}
