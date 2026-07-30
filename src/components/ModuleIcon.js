import React from 'react';
import { StyleSheet, View } from 'react-native';

function HomeIcon({ color }) {
  return (
    <View style={i.canvas}>
      <View style={[i.homeRoof, { borderColor: color }]} />
      <View style={[i.homeBody, { borderColor: color }]}>
        <View style={[i.homeDoor, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function CalendarIcon({ color }) {
  return (
    <View style={[i.calendar, { borderColor: color }]}>
      <View style={[i.calendarTop, { backgroundColor: color }]} />
      <View style={[i.calendarRing, i.calendarRingLeft, { backgroundColor: color }]} />
      <View style={[i.calendarRing, i.calendarRingRight, { backgroundColor: color }]} />
      <View style={i.calendarDots}>
        {[0, 1, 2, 3].map((dot) => <View key={dot} style={[i.calendarDot, { backgroundColor: color }]} />)}
      </View>
    </View>
  );
}

function UserIcon({ color, double = false }) {
  return (
    <View style={i.canvas}>
      {double ? (
        <View style={[i.secondaryUser, { borderColor: color }]}>
          <View style={[i.secondaryHead, { borderColor: color }]} />
        </View>
      ) : null}
      <View style={[i.userHead, { borderColor: color }]} />
      <View style={[i.userBody, { borderColor: color }]} />
    </View>
  );
}

function ToothIcon({ color }) {
  return (
    <View style={[i.tooth, { borderColor: color }]}>
      <View style={[i.toothCutout, i.toothCutoutLeft]} />
      <View style={[i.toothCutout, i.toothCutoutRight]} />
      <View style={[i.toothRootLine, { backgroundColor: color }]} />
    </View>
  );
}

function CardIcon({ color }) {
  return (
    <View style={[i.card, { borderColor: color }]}>
      <View style={[i.cardStripe, { backgroundColor: color }]} />
      <View style={[i.cardLine, { backgroundColor: color }]} />
    </View>
  );
}

function GridIcon({ color }) {
  return (
    <View style={i.grid}>
      {[0, 1, 2, 3].map((cell) => <View key={cell} style={[i.gridCell, { borderColor: color }]} />)}
    </View>
  );
}

function MoreIcon({ color }) {
  return (
    <View style={i.more}>
      {[0, 1, 2].map((dot) => <View key={dot} style={[i.moreDot, { backgroundColor: color }]} />)}
    </View>
  );
}

function RecoveryIcon({ color }) {
  return (
    <View style={[i.recoveryCircle, { borderColor: color }]}>
      <View style={[i.recoveryLineHorizontal, { backgroundColor: color }]} />
      <View style={[i.recoveryLineVertical, { backgroundColor: color }]} />
    </View>
  );
}

export function ModuleIcon({ name, color = '#64748b' }) {
  if (name === 'home') return <HomeIcon color={color} />;
  if (name === 'dashboard') return <GridIcon color={color} />;
  if (name === 'calendar') return <CalendarIcon color={color} />;
  if (name === 'patients') return <UserIcon color={color} double />;
  if (name === 'profile') return <UserIcon color={color} />;
  if (name === 'tooth' || name === 'health') return <ToothIcon color={color} />;
  if (name === 'payments') return <CardIcon color={color} />;
  if (name === 'recovery') return <RecoveryIcon color={color} />;
  return <MoreIcon color={color} />;
}

const i = StyleSheet.create({
  canvas: { width: 23, height: 23, alignItems: 'center', justifyContent: 'center' },
  homeRoof: { position: 'absolute', top: 2, width: 15, height: 15, borderLeftWidth: 2, borderTopWidth: 2, transform: [{ rotate: '45deg' }], borderTopLeftRadius: 3 },
  homeBody: { position: 'absolute', bottom: 1, width: 17, height: 13, borderWidth: 2, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center', justifyContent: 'flex-end' },
  homeDoor: { width: 4, height: 7, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  calendar: { width: 21, height: 19, borderWidth: 2, borderRadius: 5, overflow: 'visible', marginTop: 2 },
  calendarTop: { position: 'absolute', left: -2, right: -2, top: 4, height: 2 },
  calendarRing: { position: 'absolute', top: -4, width: 2.5, height: 7, borderRadius: 2 },
  calendarRingLeft: { left: 4 },
  calendarRingRight: { right: 4 },
  calendarDots: { marginTop: 9, paddingHorizontal: 4, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  calendarDot: { width: 3, height: 3, borderRadius: 1.5 },
  userHead: { position: 'absolute', top: 1, width: 8, height: 8, borderWidth: 2, borderRadius: 5 },
  userBody: { position: 'absolute', bottom: 0, width: 18, height: 10, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  secondaryUser: { position: 'absolute', right: -1, bottom: 1, width: 10, height: 8, borderWidth: 1.5, borderBottomWidth: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7, opacity: 0.65 },
  secondaryHead: { position: 'absolute', top: -8, right: 0, width: 6, height: 6, borderWidth: 1.5, borderRadius: 4 },
  tooth: { width: 20, height: 22, borderWidth: 2, borderRadius: 9, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, transform: [{ scaleY: 0.94 }], overflow: 'hidden' },
  toothCutout: { position: 'absolute', bottom: -5, width: 9, height: 11, borderRadius: 6, backgroundColor: 'transparent' },
  toothCutoutLeft: { left: -4 },
  toothCutoutRight: { right: -4 },
  toothRootLine: { position: 'absolute', bottom: 1, left: 8, width: 2, height: 7, borderRadius: 1 },
  card: { width: 23, height: 17, borderWidth: 2, borderRadius: 5, overflow: 'hidden' },
  cardStripe: { height: 3, marginTop: 3 },
  cardLine: { position: 'absolute', left: 4, bottom: 3, width: 7, height: 2, borderRadius: 1 },
  grid: { width: 21, height: 21, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridCell: { width: 9, height: 9, borderWidth: 2, borderRadius: 3 },
  more: { width: 23, height: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  moreDot: { width: 5, height: 5, borderRadius: 3 },
  recoveryCircle: { width: 21, height: 21, borderWidth: 2, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  recoveryLineHorizontal: { position: 'absolute', width: 11, height: 2.5, borderRadius: 2 },
  recoveryLineVertical: { position: 'absolute', width: 2.5, height: 11, borderRadius: 2 },
});
