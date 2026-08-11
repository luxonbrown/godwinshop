import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { submitContact } from '../api';
import { useAuth } from '../context/AuthContext';
import { GodwinshopApiError } from '../lib/http';

export default function ContactScreen() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setError(null);
    if (name.trim().length < 2) return setError('Name must be at least 2 characters.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('A valid email is required.');
    if (message.trim().length < 5) return setError('Message must be at least 5 characters.');

    setSending(true);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim()
      });
      setSubject('');
      setMessage('');
      Alert.alert('Message sent', 'Thanks for reaching out — the Godwinshop team will get back to you soon.');
    } catch (err) {
      setError(err instanceof GodwinshopApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Questions, feedback or delivery issues? Send a message and the store team will get back to you.
        </Text>

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{String(error)}</Text>
          </View>
        ) : null}

        <Field label="Your name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" />
        <Field label="Your email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Subject (optional)" value={subject} onChangeText={setSubject} placeholder="What is this about?" />
        <Field
          label="Message"
          value={message}
          onChangeText={setMessage}
          placeholder="How can we help?"
          multiline
          style={{ minHeight: 110, textAlignVertical: 'top' }}
        />

        <View style={styles.submit}>
          <Button title="Send Message" onPress={submit} loading={sending} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  container: { padding: 20, paddingTop: 8 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  alert: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  alertText: { color: colors.danger, fontSize: 13 },
  submit: { marginTop: 8 }
});