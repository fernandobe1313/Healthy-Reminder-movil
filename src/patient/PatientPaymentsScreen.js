import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { EmptyState, money, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

export function PatientPaymentsScreen() {
  const state = useAppState();
  const [detail, setDetail] = useState(null);
  const patient = state.currentPatient;
  const payments = state.payments.filter((item) => item.patient_id === state.currentPatientId || item.patient === patient?.name);
  const total = payments.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const pending = payments.reduce((sum, item) => sum + Number(item.pending || 0), 0);
  const progress = total ? Math.round((paid / total) * 100) : 100;

  return (
    <>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={s.content}>
        <View style={[s.hero, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
          <Text selectable style={[s.eyebrow, { color: pending ? colors.amber : colors.green }]}>Resumen financiero</Text>
          <Text selectable style={[s.title, { color: state.theme.text }]}>{pending ? money(pending) : 'Sin saldo pendiente'}</Text>
          <Text selectable style={[s.subtitle, { color: state.theme.muted }]}>{pending ? 'Saldo actual de tus tratamientos' : 'Tus pagos se encuentran al corriente.'}</Text>
          <View style={[s.progressTrack, { backgroundColor: state.theme.input }]}>
            <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: colors.green }]} />
          </View>
          <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{progress}% pagado · {money(paid)} de {money(total)}</Text>
        </View>

        <View style={s.grid}>
          <View style={[s.stat, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text selectable style={[s.statValue, { color: colors.green }]}>{money(paid).replace(' MXN', '')}</Text>
            <Text selectable style={[s.statLabel, { color: state.theme.muted }]}>Total pagado</Text>
          </View>
          <View style={[s.stat, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <Text selectable style={[s.statValue, { color: colors.amber }]}>{payments.length}</Text>
            <Text selectable style={[s.statLabel, { color: state.theme.muted }]}>Cuentas registradas</Text>
          </View>
        </View>

        <SectionTitle theme={state.theme}>Movimientos y saldos</SectionTitle>
        {payments.length ? payments.map((item) => (
          <Pressable key={item.id} onPress={() => setDetail(item)} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
            <View style={s.between}>
              <View style={{ flex: 1 }}>
                <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{item.tag || 'Tratamiento dental'}</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Registrado el {item.date}</Text>
              </View>
              <StatusChip label={item.status} tone={toneForStatus(item.status)} />
            </View>
            <View style={s.between}>
              <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Pagado {money(item.paid)}</Text>
              <Text selectable style={[s.cardTitle, { color: item.pending ? colors.red : colors.green }]}>Pendiente {money(item.pending)}</Text>
            </View>
          </Pressable>
        )) : <EmptyState title="Sin movimientos" copy="Los cobros y abonos registrados por la clínica aparecerán aquí." theme={state.theme} />}

        <View style={[s.card, { backgroundColor: `${colors.blue}10`, borderColor: `${colors.blue}35` }]}>
          <Text selectable style={[s.cardTitle, { color: state.theme.text }]}>Pagos en línea</Text>
          <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>La interfaz está preparada. La clínica deberá conectar una pasarela segura antes de aceptar tarjetas.</Text>
          <PrimaryButton disabled label="Próximamente" onPress={() => {}} />
        </View>
      </ScrollView>

      <Modal visible={Boolean(detail)} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={s.modalRoot}>
          <ScrollView contentContainerStyle={[s.modalCard, { backgroundColor: state.theme.surface }]}>
            <View style={s.between}>
              <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>Detalle de pago</Text>
              <Pressable onPress={() => setDetail(null)}><Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text></Pressable>
            </View>
            {detail ? (
              <>
                <StatusChip label={detail.status} tone={toneForStatus(detail.status)} />
                <Text selectable style={[s.title, { color: state.theme.text }]}>{detail.tag || 'Tratamiento dental'}</Text>
                <View style={[s.card, { backgroundColor: state.theme.input, borderColor: state.theme.line }]}>
                  <View style={s.between}><Text style={{ color: state.theme.muted }}>Total</Text><Text selectable style={[s.cardTitle, { color: state.theme.text }]}>{money(detail.total)}</Text></View>
                  <View style={s.between}><Text style={{ color: state.theme.muted }}>Pagado</Text><Text selectable style={[s.cardTitle, { color: colors.green }]}>{money(detail.paid)}</Text></View>
                  <View style={s.between}><Text style={{ color: state.theme.muted }}>Pendiente</Text><Text selectable style={[s.cardTitle, { color: colors.red }]}>{money(detail.pending)}</Text></View>
                  <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Método: {detail.method} · Referencia: {detail.reference || 'Sin referencia'}</Text>
                </View>
                <SectionTitle theme={state.theme}>Historial de abonos</SectionTitle>
                {(detail.history || []).length ? detail.history.map((item) => (
                  <View key={item.id} style={[s.card, { backgroundColor: state.theme.card, borderColor: state.theme.line }]}>
                    <View style={s.between}><Text selectable style={[s.cardTitle, { color: colors.green }]}>{money(item.amount)}</Text><Text selectable style={[s.cardCopy, { color: state.theme.soft }]}>{item.date}</Text></View>
                    <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>{item.method} · {item.notes}</Text>
                  </View>
                )) : <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Todavía no hay abonos asociados.</Text>}
                <OutlineButton label="Preparar comprobante" theme={state.theme} onPress={() => state.notify('Comprobante preparado')} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
