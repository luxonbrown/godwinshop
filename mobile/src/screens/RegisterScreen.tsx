import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { register } from '../api';
import { GodwinshopApiError } from '../lib/http';
import { RootScreenProps } from '../navigation/types';

export default function RegisterScreen({ navigation }: RootScreenProps<'Register'>) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) return setError('Full name must be at least 2 characters.');
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) return setError('A valid email is required.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await register({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        confirm_password: confirm
      });
      navigation.navigate('Login');
    } catch (err) {
      setError(err instanceof GodwinshopApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Godwinshop and start ordering</Text>

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" autoComplete="name" />
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
        <Field label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="+250 7xx xxx xxx" keyboardType="phone-pad" autoComplete="tel" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" secureTextEntry autoCapitalize="none" />
        <Field label="Confirm password" value={confirm} onChangeText={setConfirm} placeholder="Repeat password" secureTextEntry autoCapitalize="none" />

        <Button title="Create Account" onPress={submit} loading={loading} />

        <Text style={styles.note}>
          After registering, verify your email to place orders. A verification link is sent to your inbox.
        </Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Text style={styles.footerLink} onPress={() => navigation.goBack()}>
            Sign in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  container: { padding: 24, paddingTop: 32, flexGrow: 1 },
  title: { color: colors.fg, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 24 },
  alert: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  alertText: { color: colors.danger, fontSize: 13 },
  note: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: colors.muted },
  footerLink: { color: colors.accent, fontWeight: '700' }
});