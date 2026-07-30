import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import * as Print from 'expo-print';
import { colors } from '../theme/palette';
import { useAppState } from '../navigation/AppStateContext';
import { EmptyState, money, OutlineButton, PrimaryButton, SectionTitle, StatusChip, toneForStatus } from './patient-components';
import { patientStyles as s } from './patient-ui';

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function receiptHtml(payment, patientName) {
  const history = payment.history || [];
  const rows = history.length
    ? history.map(item => `
      <tr>
        <td>${escapeHtml(item.date || 'Sin fecha')}</td>
        <td>${escapeHtml(item.method || payment.method || 'Sin especificar')}</td>
        <td style="text-align:right">${escapeHtml(money(item.amount))}</td>
      </tr>`).join('')
    : '<tr><td colspan="3" class="empty">Sin abonos adicionales asociados</td></tr>';
  return `<!DOCTYPE html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        @page { margin: 28px; }
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #172033; margin: 0; padding: 24px; }
        .receipt { max-width: 680px; margin: 0 auto; border: 1px solid #dbe3f0; border-radius: 18px; overflow: hidden; }
        .header { padding: 28px; background: #f5f7ff; border-bottom: 4px solid #7c3aed; }
        .brand { color: #7c3aed; font-size: 14px; font-weight: 800; letter-spacing: 1.5px; }
        h1 { margin: 8px 0 4px; font-size: 28px; }
        .folio,.muted { color: #667085; font-size: 13px; }
        .content { padding: 28px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 22px; }
        .label { color: #667085; font-size: 12px; text-transform: uppercase; letter-spacing: .6px; }
        .value { font-weight: 700; margin-top: 5px; }
        .amounts { background: #f8fafc; border-radius: 14px; padding: 18px; margin: 18px 0 24px; }
        .amount { display: flex; justify-content: space-between; padding: 7px 0; }
        .paid { color: #059669; font-weight: 800; }
        .pending { color: #dc2626; font-weight: 800; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th,td { padding: 11px 8px; border-bottom: 1px solid #e5e7eb; text-align: left; }
        th { color: #667085; font-size: 11px; text-transform: uppercase; }
        .empty { text-align: center; color: #667085; }
        .footer { padding-top: 26px; color: #667085; font-size: 11px; text-align: center; }
      </style>
    </head>
    <body>
      <section class="receipt">
        <header class="header">
          <div class="brand">HEALTHYREMINDER DENTAL</div>
          <h1>Comprobante de pago</h1>
          <div class="folio">Folio: ${escapeHtml(payment.id)}</div>
        </header>
        <main class="content">
          <div class="grid">
            <div><div class="label">Paciente</div><div class="value">${escapeHtml(patientName || payment.patient || 'Paciente')}</div></div>
            <div><div class="label">Fecha de registro</div><div class="value">${escapeHtml(payment.date || 'Sin fecha')}</div></div>
            <div><div class="label">Concepto</div><div class="value">${escapeHtml(payment.tag || 'Tratamiento dental')}</div></div>
            <div><div class="label">Estado</div><div class="value">${escapeHtml(payment.status || 'Sin estado')}</div></div>
            <div><div class="label">Método</div><div class="value">${escapeHtml(payment.method || 'Sin especificar')}</div></div>
            <div><div class="label">Referencia</div><div class="value">${escapeHtml(payment.reference || 'Sin referencia')}</div></div>
          </div>
          <div class="amounts">
            <div class="amount"><span>Total</span><strong>${escapeHtml(money(payment.total))}</strong></div>
            <div class="amount"><span>Pagado</span><span class="paid">${escapeHtml(money(payment.paid))}</span></div>
            <div class="amount"><span>Pendiente</span><span class="pending">${escapeHtml(money(payment.pending))}</span></div>
          </div>
          <h2>Historial de abonos</h2>
          <table>
            <thead><tr><th>Fecha</th><th>Método</th><th style="text-align:right">Importe</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="footer">Este comprobante refleja la información registrada por la clínica al momento de su emisión.</div>
        </main>
      </section>
    </body>
  </html>`;
}

export function PatientPaymentsScreen() {
  const state = useAppState();
  const [detail, setDetail] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [printing, setPrinting] = useState(false);
  const patient = state.currentPatient;
  const payments = state.payments.filter((item) => item.patient_id === state.currentPatientId || item.patient === patient?.name);
  const total = payments.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const paid = payments.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const pending = payments.reduce((sum, item) => sum + Number(item.pending || 0), 0);
  const progress = total ? Math.round((paid / total) * 100) : 100;
  const printReceipt = async () => {
    if (!receipt || printing) return;
    setPrinting(true);
    try {
      await Print.printAsync({ html: receiptHtml(receipt, patient?.name) });
    } catch (error) {
      state.notify(error?.message || 'No fue posible abrir la impresión');
    } finally {
      setPrinting(false);
    }
  };

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
                <OutlineButton
                  label="Preparar comprobante"
                  theme={state.theme}
                  onPress={() => {
                    setReceipt(detail);
                    setDetail(null);
                  }}
                />
              </>
            ) : null}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={Boolean(receipt)} transparent animationType="slide" onRequestClose={() => setReceipt(null)}>
        <View style={s.modalRoot}>
          <ScrollView contentContainerStyle={[s.modalCard, { backgroundColor: state.theme.surface }]}>
            <View style={s.between}>
              <View style={{ flex: 1 }}>
                <Text selectable style={[s.sectionTitle, { color: state.theme.text }]}>Vista previa del comprobante</Text>
                <Text selectable style={[s.cardCopy, { color: state.theme.muted }]}>Revisa la información antes de imprimir.</Text>
              </View>
              <Pressable onPress={() => setReceipt(null)} accessibilityRole="button" accessibilityLabel="Cerrar comprobante">
                <Text style={{ color: state.theme.muted, fontSize: 22 }}>×</Text>
              </Pressable>
            </View>
            {receipt ? (
              <View style={{ backgroundColor: '#ffffff', borderRadius: 20, padding: 20, gap: 16, borderWidth: 1, borderColor: '#dbe3f0' }}>
                <View style={{ borderBottomWidth: 3, borderBottomColor: colors.purple, paddingBottom: 14, gap: 4 }}>
                  <Text selectable style={{ color: colors.purple, fontSize: 11, fontWeight: '900', letterSpacing: 1.2 }}>HEALTHYREMINDER DENTAL</Text>
                  <Text selectable style={{ color: '#172033', fontSize: 24, fontWeight: '900' }}>Comprobante de pago</Text>
                  <Text selectable style={{ color: '#667085', fontSize: 12 }}>Folio: {receipt.id}</Text>
                </View>
                <View style={{ gap: 8 }}>
                  <Text selectable style={{ color: '#667085', fontSize: 12 }}>Paciente</Text>
                  <Text selectable style={{ color: '#172033', fontSize: 16, fontWeight: '800' }}>{patient?.name || receipt.patient || 'Paciente'}</Text>
                  <Text selectable style={{ color: '#667085', fontSize: 12 }}>Concepto</Text>
                  <Text selectable style={{ color: '#172033', fontSize: 15, fontWeight: '700' }}>{receipt.tag || 'Tratamiento dental'}</Text>
                  <Text selectable style={{ color: '#667085', fontSize: 12 }}>Registrado el {receipt.date}</Text>
                </View>
                <View style={{ backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, gap: 10 }}>
                  <View style={s.between}><Text selectable style={{ color: '#667085' }}>Total</Text><Text selectable style={{ color: '#172033', fontWeight: '800' }}>{money(receipt.total)}</Text></View>
                  <View style={s.between}><Text selectable style={{ color: '#667085' }}>Pagado</Text><Text selectable style={{ color: colors.green, fontWeight: '900' }}>{money(receipt.paid)}</Text></View>
                  <View style={s.between}><Text selectable style={{ color: '#667085' }}>Pendiente</Text><Text selectable style={{ color: colors.red, fontWeight: '900' }}>{money(receipt.pending)}</Text></View>
                </View>
                <Text selectable style={{ color: '#667085', fontSize: 12 }}>
                  Método: {receipt.method || 'Sin especificar'} · Referencia: {receipt.reference || 'Sin referencia'}
                </Text>
                <View style={{ gap: 8 }}>
                  <Text selectable style={{ color: '#172033', fontSize: 16, fontWeight: '900' }}>Historial de abonos</Text>
                  {(receipt.history || []).length ? receipt.history.map(item => (
                    <View key={item.id} style={[s.between, { borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 8 }]}>
                      <View><Text selectable style={{ color: '#172033', fontWeight: '700' }}>{item.date}</Text><Text selectable style={{ color: '#667085', fontSize: 12 }}>{item.method}</Text></View>
                      <Text selectable style={{ color: colors.green, fontWeight: '900' }}>{money(item.amount)}</Text>
                    </View>
                  )) : <Text selectable style={{ color: '#667085', fontSize: 12 }}>Sin abonos adicionales asociados.</Text>}
                </View>
              </View>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><OutlineButton label="Cancelar" theme={state.theme} onPress={() => setReceipt(null)} /></View>
              <View style={{ flex: 1 }}><PrimaryButton disabled={printing} label={printing ? 'Abriendo...' : 'Imprimir'} onPress={printReceipt} /></View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
