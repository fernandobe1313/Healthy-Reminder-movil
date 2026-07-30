import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { GradientButton, LedText } from '../components/common';

function money(value = 0) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusColor(status = '') {
  if (status === 'Pagado') return colors.green;
  if (status === 'Parcial') return colors.amber;
  return colors.red;
}

function TrashIcon() {
  return (
    <View style={styles.trashIcon}>
      <View style={styles.trashLid} />
      <View style={styles.trashHandle} />
      <View style={styles.trashCan}>
        <View style={styles.trashLine} />
        <View style={styles.trashLine} />
      </View>
    </View>
  );
}

const statusFilters = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Parcial', label: 'Parcial' },
  { value: 'Pagado', label: 'Pagado' },
];

export function PaymentsScreen({ theme, payments, setSheet }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const pendingPayments = payments.filter((payment) => Number(payment.pending || 0) > 0);
  const pendingTotal = pendingPayments.reduce((sum, payment) => sum + Number(payment.pending || 0), 0);
  const paidTotal = payments.reduce((sum, payment) => sum + Number(payment.paid || 0), 0);
  const activeFilter = statusFilters.find((item) => item.value === statusFilter) || statusFilters[0];
  const filteredPayments = useMemo(
    () => payments.filter((payment) => statusFilter === 'all' || payment.status === statusFilter),
    [payments, statusFilter]
  );

  const statusCount = (status) => {
    if (status === 'all') return payments.length;
    return payments.filter((payment) => payment.status === status).length;
  };

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={[styles.payHero, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View>
          <LedText selectable style={styles.heroEyebrow}>Pagos pendientes</LedText>
          <Text selectable style={[styles.bigTitle, { color: theme.text }]}>{money(pendingTotal)}</Text>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>{pendingPayments.length} pacientes con saldo abierto</Text>
        </View>
        <GradientButton label="Registrar" right="$" onPress={() => setSheet({ type: 'payment' })} style={styles.heroButton} />
      </View>

      <View style={styles.paymentMetricRow}>
        <View style={[styles.paymentMetricCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Ingresos</Text>
          <Text selectable style={[styles.paymentMetricValue, { color: colors.green }]}>{money(paidTotal)}</Text>
        </View>
        <View style={[styles.paymentMetricCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Registros</Text>
          <Text selectable style={[styles.paymentMetricValue, { color: theme.text }]}>{payments.length}</Text>
        </View>
      </View>

      <View style={[styles.paymentFilterCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <Text selectable style={[styles.recordLabel, { color: theme.muted }]}>Filtrar por estado</Text>
        <Pressable
          onPress={() => setFilterOpen(true)}
          style={({ pressed }) => [
            styles.paymentFilterButton,
            { backgroundColor: theme.input, borderColor: theme.line },
            pressed && styles.pressed,
          ]}>
          <Text selectable numberOfLines={1} style={[styles.paymentFilterText, { color: theme.text }]}>{activeFilter.label}</Text>
          <Text selectable style={[styles.paymentFilterCount, { color: colors.blue }]}>{statusCount(statusFilter)}</Text>
          <Text style={[styles.selectChevron, { color: theme.muted }]}>v</Text>
        </Pressable>
      </View>

      <LedText selectable style={styles.heroEyebrow}>Registros ({filteredPayments.length})</LedText>
      <View style={{ gap: 12 }}>
        {filteredPayments.length ? filteredPayments.map((payment) => {
          const progress = payment.total ? Math.min(100, Math.round((Number(payment.paid || 0) / Number(payment.total || 1)) * 100)) : 0;
          const tone = statusColor(payment.status);
          return (
          <Pressable
            key={payment.id}
            onLongPress={() => setSheet({ type: 'paymentDetail', data: payment })}
            delayLongPress={360}
            style={({ pressed }) => [
              styles.paymentCard,
              { backgroundColor: theme.card, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <View style={styles.paymentTop}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text selectable numberOfLines={1} style={[styles.cardTitle, { color: theme.text }]}>{payment.patient}</Text>
                <Text selectable numberOfLines={1} style={[styles.cardSub, { color: theme.muted }]}>{payment.tag || payment.method}</Text>
              </View>
              <View style={styles.paymentRightStack}>
                <Text selectable style={[styles.paymentAmount, { color: Number(payment.pending || 0) ? colors.red : colors.green }]}>
                  {money(payment.pending)}
                </Text>
                <Text selectable style={[styles.paymentStatusChip, { color: tone, backgroundColor: `${tone}18` }]}>{payment.status}</Text>
              </View>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.input }]}>
              <View style={[styles.progressFill, { width: `${Math.max(4, progress)}%`, backgroundColor: progress >= 100 ? colors.green : colors.blue }]} />
            </View>
            <View style={styles.paymentFooter}>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{money(payment.paid)} pagado de {money(payment.total)}</Text>
              <View style={styles.paymentActions}>
                {Number(payment.pending || 0) > 0 ? (
                  <Pressable
                    onPress={() => setSheet({ type: 'paymentInstallment', data: payment })}
                    style={({ pressed }) => [
                      styles.paymentActionButton,
                      { backgroundColor: `${colors.blue}18`, borderColor: `${colors.blue}35` },
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.paymentActionText, { color: colors.blue }]}>Abonar</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setSheet({ type: 'deletePayment', data: payment })}
                  hitSlop={10}
                  style={({ pressed }) => [styles.deletePatientButton, pressed && styles.pressed]}>
                  <TrashIcon />
                </Pressable>
              </View>
            </View>
          </Pressable>
          );
        }) : (
          <View style={[styles.detailBand, { backgroundColor: theme.card }]}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Sin pagos en este estado</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Cambia el filtro o registra un pago nuevo.</Text>
          </View>
        )}
      </View>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.selectorBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={[styles.selectorSheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.line }]} />
          <View style={styles.sheetHeader}>
            <Text selectable style={[styles.sheetTitle, { color: theme.text }]}>Estado de pago</Text>
            <Pressable onPress={() => setFilterOpen(false)} hitSlop={12}>
              <Text style={[styles.closeText, { color: theme.muted }]}>x</Text>
            </Pressable>
          </View>
          <View style={styles.selectorListContent}>
            {statusFilters.map((option) => {
              const active = statusFilter === option.value;
              const tone = option.value === 'all' ? colors.blue : statusColor(option.value);
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setStatusFilter(option.value);
                    setFilterOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.selectorRow,
                    { backgroundColor: active ? `${tone}18` : theme.input, borderColor: active ? tone : theme.line },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.paymentFilterOptionRow}>
                    <Text selectable style={[styles.selectorLabel, { color: active ? tone : theme.text }]}>{option.label}</Text>
                    <Text selectable style={[styles.paymentFilterOptionCount, { color: tone, backgroundColor: `${tone}18` }]}>{statusCount(option.value)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
