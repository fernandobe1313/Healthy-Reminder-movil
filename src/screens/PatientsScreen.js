import React from 'react';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';

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

export function PatientsScreen({ theme, patients, search, setSearch, setSheet }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.screenActions}>
        <View style={[styles.searchBox, { backgroundColor: theme.input, borderColor: theme.line }]}>
          <Text style={[styles.searchIcon, { color: theme.soft }]}>?</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar paciente..."
            placeholderTextColor={theme.soft}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
        <Pressable onPress={() => setSheet({ type: 'patient' })} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {patients.map((patient) => (
          <Pressable
            key={patient.id}
            onPress={() => setSheet({ type: 'patientDetail', data: patient })}
            onLongPress={() => setSheet({ type: 'patientRecord', data: patient })}
            delayLongPress={360}
            style={({ pressed }) => [
              styles.patientCard,
              { backgroundColor: theme.card, borderColor: theme.line },
              pressed && styles.pressed,
            ]}>
            <View style={[styles.avatar, { backgroundColor: theme.chip }]}>
              {patient.photo_url ? (
                <Image source={{ uri: patient.photo_url }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarText}>{patient.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text selectable style={[styles.cardTitle, { color: theme.text }]}>{patient.name}</Text>
              <Text selectable style={[styles.cardSub, { color: theme.muted }]}>{patient.phone}</Text>
              <View style={styles.inlineChips}>
                <Text style={[styles.smallChip, { color: colors.blue, backgroundColor: `${colors.blue}14` }]}>{patient.tag}</Text>
                <Text style={[styles.smallChip, { color: patient.balance ? colors.red : colors.green, backgroundColor: patient.balance ? `${colors.red}14` : `${colors.green}14` }]}>
                  {patient.balance ? `$${patient.balance}` : 'Al dia'}
                </Text>
              </View>
            </View>
            <View style={styles.patientCardActions}>
              <Text selectable style={[styles.cardTime, { color: theme.text }]}>{patient.next}</Text>
              <Pressable
                onPress={() => setSheet({ type: 'deletePatient', data: patient })}
                hitSlop={10}
                style={({ pressed }) => [
                  styles.deletePatientButton,
                  { backgroundColor: 'transparent', borderColor: 'transparent' },
                  pressed && styles.pressed,
                ]}>
                <TrashIcon />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
