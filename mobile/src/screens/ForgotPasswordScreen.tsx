import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { resendVerification } from '../api';
import { GodwinshopApiError } from '../lib/http';
import { RootScreenProps } from '../navigation/types';

export default function ForgotPasswordScreen({ navigation }: RootScreenProps<'ForgotPassword'>) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setInfo(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('A valid email is required.');
    setLoading(true);
    try {
      await resendVerification(email.trim());
      setInfo('If your account is pending verification, a new verification link has been sent to your email.');
    } catch (err) {
      setError(err instanceof GodwinshopApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Forgot your password?</Text>
        <Text style={styles.subtitle}>
          Godwinshop currently supports account-verification email resends. If your account is unverified, enter your
          email to receive a new verification link. For password reset support, contact the store admin via the Contact page.
        </Text>

        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}
        {info ? (
          <View style={[styles.alert, styles.successAlert]}>
            <Text style={styles.successText}>{info}</Text>
          </View>
        ) : null}

        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />

        <Button title="Send Verification Email" onPress={submit} loading={loading} />

        <Text style={styles.note}>
          Note: the current API has no password-reset endpoint. Keep your password safe, or sign in and change it from
          your profile.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  container: { padding: 24, paddingTop: 32, flexGrow: 1 },
  title: { color: colors.fg, fontSize: 24, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, marginTop: 4, marginBottom: 24, lineHeight: 21 },
  alert: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  alertText: { color: colors.danger, fontSize: 13 },
  successAlert: { backgroundColor: '#022C22', borderColor: '#047857' },
  successText: { color: colors.success, fontSize: 13 },
  note: { color: colors.muted, fontSize: 12, marginTop: 16, lineHeight: 18 }
});