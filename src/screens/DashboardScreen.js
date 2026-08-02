import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { dentalServices } from '../data/services';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { AppLogo, AppointmentCard, GradientButton, IconBadge, LedText, SectionHeader } from '../components/common';

function estimateAppointmentRevenue(appointment = {}) {
  const directAmount = Number(appointment.service_price || appointment.amount || 0);
  if (directAmount) return directAmount;
  const normalized = String(appointment.service || '').toLowerCase();
  const match = dentalServices.find((service) => normalized.includes(service.name.toLowerCase()) || service.name.toLowerCase().includes(normalized));
  return match ? match.price : 700;
}

function money(value = 0) {
  return `$${value.toLocaleString('en-US')}`;
}

function buildTopServices(appointments, dashboardData) {
  if (dashboardData?.topServices?.length) {
    return dashboardData.topServices.slice(0, 4).map((service, index) => ({
      name: service.name,
      count: Number(service.count || 0),
      revenue: Number(service.revenue || 0),
      color: [colors.blue, colors.purple, colors.amber, colors.green][index] || colors.blue,
    }));
  }
  const totals = appointments.reduce((acc, appointment) => {
    const name = appointment.service || 'Consulta';
    const current = acc[name] || { name, count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += estimateAppointmentRevenue(appointment);
    acc[name] = current;
    return acc;
  }, {});
  return Object.values(totals)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((service, index) => ({ ...service, color: [colors.blue, colors.purple, colors.amber, colors.green][index] || colors.blue }));
}

function buildWeeklyIncome(dashboardData) {
  const totals = new Map((dashboardData?.weeklyIncome || []).map((item) => [String(item.date).slice(0, 10), Number(item.total || 0)]));
  const entries = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - offset));
    const key = date.toLocaleDateString('en-CA');
    return { label: date.toLocaleDateString('es-MX', { weekday: 'narrow' }).toUpperCase(), value: totals.get(key) || 0 };
  });
  const values = entries.map((item) => item.value);
  const max = Math.max(...values, 0);
  return entries.map((item) => ({ ...item, height: max && item.value ? Math.max(8, Math.round((item.value / max) * 100)) : 0 }));
}

function buildMonthlyIncome(dashboardData) {
  if (dashboardData?.incomeTrend?.length) {
    return dashboardData.incomeTrend.map((item) => {
      const [year, month] = String(item.month).split('-').map(Number);
      return { month: new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''), total: Number(item.total || 0) };
    });
  }
  return Array.from({ length: 7 }, (_, offset) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (6 - offset));
    return { month: date.toLocaleDateString('es-MX', { month: 'short' }).replace('.', ''), total: 0 };
  });
}

export function DashboardScreen({ theme, setScreen, patients, appointments, dashboardData, setSheet, compact }) {
  const pendingTotal = Number(dashboardData?.summary?.pendingPayments ?? patients.reduce((sum, patient) => sum + Number(patient.balance || 0), 0));
  const weeklyIncome = buildWeeklyIncome(dashboardData);
  const monthlyIncome = buildMonthlyIncome(dashboardData);
  const topServices = buildTopServices(appointments, dashboardData);
  const maxMonthlyIncome = Math.max(...monthlyIncome.map((item) => item.total), 1);
  const totalMonthlyIncome = monthlyIncome.reduce((sum, item) => sum + item.total, 0);
  const bestMonth = monthlyIncome.reduce((best, item) => (item.total > best.total ? item : best), monthlyIncome[0]);
  const maxServiceCount = Math.max(...topServices.map((item) => item.count), 1);
  const baseStats = [
    { label: 'Pacientes', value: String(dashboardData?.summary?.totalPatients ?? patients.length), tone: colors.blue, icon: 'P', target: 'patients' },
    { label: 'Citas hoy', value: String(dashboardData?.summary?.todayAppointments ?? appointments.length), tone: colors.purple, icon: 'C', target: 'agenda' },
    { label: 'Ingresos', value: money(Number(dashboardData?.summary?.monthIncome ?? appointments.reduce((sum, appointment) => sum + estimateAppointmentRevenue(appointment), 0))), tone: colors.green, icon: '$', target: 'payments' },
    { label: 'Pendiente', value: money(pendingTotal), tone: colors.red, icon: '!', target: 'payments' },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.welcomeRow}>
        <View style={{ flex: 1 }}>
          <LedText selectable style={styles.hello}>Buenos dias</LedText>
          <Text selectable style={[styles.bigTitle, { color: theme.text }]}>Doctor</Text>
          <Text selectable style={[styles.mutedCopy, { color: theme.muted }]}>
            Hoy tienes <Text style={{ color: colors.blue, fontWeight: '800' }}>{dashboardData?.summary?.todayAppointments ?? appointments.length} citas</Text> y <Text style={{ color: colors.red, fontWeight: '800' }}>{money(pendingTotal)}</Text> pendientes
          </Text>
        </View>
        <AppLogo theme={theme} compact />
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={{ flex: 1 }}>
          <LedText selectable style={styles.heroEyebrow}>Resumen inteligente</LedText>
          <Text selectable style={[styles.heroText, { color: theme.text }]}>Tu consultorio esta estable y con buena agenda.</Text>
          <Text selectable style={[styles.heroSmall, { color: theme.muted }]}>Revisa cobros pendientes antes de cerrar el dia.</Text>
        </View>
        <GradientButton label="Ver pagos" right="$" onPress={() => setScreen('payments')} style={styles.heroButton} />
      </View>

      <View style={styles.statsGrid}>
        {baseStats.map((stat) => (
          <Pressable
            key={stat.label}
            onPress={() => setScreen(stat.target)}
            style={({ pressed }) => [
              styles.statCard,
              { backgroundColor: theme.card, borderColor: theme.line, width: compact ? '100%' : '48%' },
              pressed && styles.pressed,
            ]}>
            <IconBadge icon={stat.icon} color={stat.tone} />
            <Text selectable style={[styles.statValue, { color: theme.text }]}>{stat.value}</Text>
            <Text selectable style={[styles.statLabel, { color: theme.muted }]}>{stat.label}</Text>
          </Pressable>
        ))}
      </View>

      <SectionHeader title="Ingresos semanales" action="Reporte" theme={theme} onPress={() => setScreen('payments')} />
      <Pressable onPress={() => setScreen('payments')} style={[styles.chartCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.barChart}>
          {weeklyIncome.map((item, index) => (
            <View key={`${item.label}-${index}`} style={styles.barWrap}>
              <View style={[styles.barTrack, { backgroundColor: theme.input }]}>
                <View style={[styles.barFill, { height: `${item.height}%`, backgroundColor: index === 5 ? colors.green : colors.blue }]} />
              </View>
              <Text style={[styles.barLabel, { color: theme.muted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Pressable>

      <SectionHeader title="Ingresos mensuales" action="Finanzas" theme={theme} onPress={() => setScreen('payments')} />
      <Pressable onPress={() => setScreen('payments')} style={[styles.monthlyCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.monthlySummaryRow}>
          <View>
            <Text selectable style={[styles.monthlyTotal, { color: theme.text }]}>${(totalMonthlyIncome / 1000).toFixed(1)}k</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Acumulado ultimos 7 meses</Text>
          </View>
          <View style={[styles.monthlyBadge, { backgroundColor: theme.chip }]}>
            <Text style={styles.monthlyBadgeText}>{bestMonth.month}</Text>
            <Text style={[styles.monthlyBadgeValue, { color: theme.text }]}>Top</Text>
          </View>
        </View>
        <View style={styles.monthlyChart}>
          {monthlyIncome.map((item, index) => {
            const height = Math.max(18, (item.total / maxMonthlyIncome) * 128);
            const active = item.month === bestMonth.month;
            return (
              <View key={item.month} style={styles.monthlyBarWrap}>
                <View style={[styles.monthlyBarTrack, { backgroundColor: theme.input }]}>
                  <View
                    style={[
                      styles.monthlyBarFill,
                      {
                        height,
                        backgroundColor: active ? colors.green : index % 2 ? colors.purple : colors.blue,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: active ? colors.green : theme.muted }]}>{item.month}</Text>
              </View>
            );
          })}
        </View>
      </Pressable>

      <SectionHeader title="Top servicios" action="Ver agenda" theme={theme} onPress={() => setScreen('agenda')} />
      <Pressable onPress={() => setScreen('agenda')} style={[styles.topServicesCard, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {topServices.length ? topServices.map((service, index) => {
          const width = `${Math.max(18, (service.count / maxServiceCount) * 100)}%`;
          return (
            <View key={service.name} style={styles.serviceRow}>
              <View style={[styles.serviceRank, { backgroundColor: `${service.color}18` }]}>
                <Text style={[styles.serviceRankText, { color: service.color }]}>{index + 1}</Text>
              </View>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceTopLine}>
                  <Text selectable style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
                  <Text selectable style={[styles.serviceCount, { color: service.color }]}>{service.count}</Text>
                </View>
                <View style={[styles.serviceTrack, { backgroundColor: theme.input }]}>
                  <View style={[styles.serviceFill, { width, backgroundColor: service.color }]} />
                </View>
                <Text selectable style={[styles.serviceRevenue, { color: theme.muted }]}>${service.revenue.toLocaleString('en-US')} generados</Text>
              </View>
            </View>
          );
        }) : (
          <Text selectable style={[styles.cardSub, { color: theme.muted }]}>Sin servicios activos por ahora.</Text>
        )}
      </Pressable>

      <SectionHeader title="Agenda de hoy" action="Nueva" theme={theme} onPress={() => setSheet({ type: 'appointment' })} />
      <View style={{ gap: 12 }}>
        {appointments.length ? (
          appointments.slice(0, 3).map((item) => <AppointmentCard key={item.id} item={item} theme={theme} />)
        ) : (
          <View style={[styles.detailBand, { backgroundColor: theme.card }]}>
            <Text selectable style={[styles.cardTitle, { color: theme.text }]}>Agenda limpia</Text>
            <Text selectable style={[styles.cardSub, { color: theme.muted }]}>No hay citas ligadas a pacientes activos.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
