import React, { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import { styles } from '../styles';
import { colors } from '../theme/palette';

const quickPrompts = [
  'Redacta una nota clínica de limpieza dental',
  'Sugiere un plan de tratamiento',
  'Revisa posibles interacciones medicamentosas',
];

export function AssistantScreen({ theme, patients = [] }) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: 'ai',
      text: 'Soy el asistente clínico de HealthyReminder. Puedo ayudarte con notas, diagnósticos de apoyo, planes de tratamiento e interacciones medicamentosas.',
    },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');

  const send = async (suggestedText) => {
    const text = String(suggestedText || draft).trim();
    if (!text || sending) return;
    setMessages((previous) => [...previous, { id: Date.now(), from: 'user', text }]);
    setDraft('');
    setSending(true);
    Keyboard.dismiss();
    try {
      const result = await api.post('/ai/clinical-assistant', {
        message: text,
        patient_id: selectedPatientId || undefined,
        history: messages
          .filter((message) => message.from === 'user' || message.from === 'ai')
          .slice(-8)
          .map((message) => ({ role: message.from === 'user' ? 'user' : 'assistant', content: message.text })),
      });
      setMessages((previous) => [...previous, {
        id: Date.now() + 1,
        from: 'ai',
        text: result.response || result.message || 'Respuesta preparada.',
      }]);
    } catch (error) {
      setMessages((previous) => [...previous, {
        id: Date.now() + 1,
        from: 'error',
        text: error.message || 'No fue posible consultar el asistente. Intenta nuevamente.',
      }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.chatRoot, { backgroundColor: theme.bg }]}
      behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        ref={scrollRef}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <View style={styles.aiContextSection}>
          <Text selectable style={[styles.aiContextLabel, { color: theme.muted }]}>CONTEXTO DEL PACIENTE</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.aiPatientList}>
            <Pressable
              onPress={() => setSelectedPatientId('')}
              style={[
                styles.aiPatientChip,
                {
                  backgroundColor: selectedPatientId ? theme.input : colors.blue,
                  borderColor: selectedPatientId ? theme.line : colors.blue,
                },
              ]}>
              <Text style={[styles.aiPatientChipText, { color: selectedPatientId ? theme.text : '#ffffff' }]}>Consulta general</Text>
            </Pressable>
            {patients.map((patient) => {
              const selected = selectedPatientId === patient.id;
              return (
                <Pressable
                  key={patient.id}
                  onPress={() => setSelectedPatientId(patient.id)}
                  style={[
                    styles.aiPatientChip,
                    {
                      backgroundColor: selected ? colors.blue : theme.input,
                      borderColor: selected ? colors.blue : theme.line,
                    },
                  ]}>
                  <Text numberOfLines={1} style={[styles.aiPatientChipText, { color: selected ? '#ffffff' : theme.text }]}>{patient.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              {
                alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.from === 'user'
                  ? colors.blue
                  : message.from === 'error'
                    ? theme.name === 'dark' ? 'rgba(239,68,68,0.12)' : '#fef2f2'
                    : theme.card,
                borderColor: message.from === 'error' ? colors.red : theme.line,
              },
            ]}>
            <Text
              selectable
              style={[
                styles.messageText,
                { color: message.from === 'user' ? '#ffffff' : message.from === 'error' ? colors.red : theme.text },
              ]}>
              {message.text}
            </Text>
          </View>
        ))}

        {messages.length === 1 ? (
          <View style={styles.aiQuickPrompts}>
            {quickPrompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => send(prompt)}
                style={[styles.aiQuickPrompt, { backgroundColor: theme.input, borderColor: theme.line }]}>
                <Text style={[styles.aiQuickPromptText, { color: theme.text }]}>{prompt}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {sending ? (
          <View style={[styles.aiTypingBubble, { backgroundColor: theme.card, borderColor: theme.line }]}>
            <ActivityIndicator size="small" color={colors.blue} />
            <Text style={[styles.aiTypingText, { color: theme.muted }]}>Analizando información clínica…</Text>
          </View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.composer,
          {
            backgroundColor: theme.veil,
            borderColor: theme.line,
            paddingBottom: Math.max(96, insets.bottom + 88),
          },
        ]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={selectedPatientId ? 'Pregunta sobre el paciente seleccionado…' : 'Escribe una consulta clínica…'}
          placeholderTextColor={theme.soft}
          multiline
          maxLength={1200}
          style={[styles.composerInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line }]}
        />
        <Pressable
          onPress={() => send()}
          disabled={sending || !draft.trim()}
          accessibilityRole="button"
          accessibilityLabel="Enviar consulta al asistente"
          style={[styles.sendButton, (sending || !draft.trim()) && { opacity: 0.45 }]}>
          {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.sendText}>›</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
