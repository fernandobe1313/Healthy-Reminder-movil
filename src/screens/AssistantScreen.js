import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { colors } from '../theme/palette';
import { styles } from '../styles';
import { api } from '../api/client';

export function AssistantScreen({ theme }) {
  const [messages, setMessages] = useState([
    { id: 1, from: 'ai', text: 'Puedo ayudarte a redactar notas clinicas, recordatorios o resumenes de citas.' },
    { id: 2, from: 'user', text: 'Prepara una nota para limpieza dental.' },
  ]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!draft.trim()) return;
    const text = draft.trim();
    setMessages((prev) => [...prev, { id: Date.now(), from: 'user', text }]);
    setDraft('');
    setSending(true);
    try {
      const result = await api.post('/ai/clinical-assistant', { message: text });
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'ai', text: result.response || result.message || 'Respuesta preparada.' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: 'ai', text: error.message }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.chatRoot, { backgroundColor: theme.bg }]}>
      <ScrollView contentInsetAdjustmentBehavior="automatic" showsVerticalScrollIndicator={false} contentContainerStyle={styles.chatContent}>
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              {
                alignSelf: message.from === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.from === 'user' ? colors.blue : theme.card,
                borderColor: theme.line,
              },
            ]}>
            <Text selectable style={[styles.messageText, { color: message.from === 'user' ? '#ffffff' : theme.text }]}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={[styles.composer, { backgroundColor: theme.veil, borderColor: theme.line }]}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Pregunta algo..."
          placeholderTextColor={theme.soft}
          style={[styles.composerInput, { color: theme.text, backgroundColor: theme.input, borderColor: theme.line }]}
        />
        <Pressable onPress={send} disabled={sending} style={[styles.sendButton, sending && { opacity: 0.6 }]}>
          <Text style={styles.sendText}>{sending ? '…' : '>'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
