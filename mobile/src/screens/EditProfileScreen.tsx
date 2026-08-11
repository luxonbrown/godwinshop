import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Field } from '../components/Field';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';
import { GodwinshopApiError } from '../lib/http';
import { RootScreenProps } from '../navigation/types';
import { Alert } from 'react-native';

export default function EditProfileScreen({ navigation }: RootScreenProps<'EditProfile'>) {
  const { user, applyUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState(user?.address ?? '');
  const [city, setCity] = useState(user?.city ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    if (!fullName.trim() || fullName.trim().length < 2) return setError('Full name must be at least 2 characters.');
    setSaving(true);
    try {
      const res = await updateProfile({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null
      });
      applyUser(res.user);
      Alert.alert('Profile updated', 'Your profile has been saved.');
      navigation.goBack();
    } catch (err) {
      setError(err instanceof GodwinshopApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {error ? (
          <View style={styles.alert}>
            <Text style={styles.alertText}>{String(error)}</Text>
          </View>
        ) : null}

        <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="Your full name" />
        <Field
          label="Phone"
          value={phone}
          onChangeText={setPhone}
          placeholder="+250 7xx xxx xxx"
          keyboardType="phone-pad"
        />
        <Field
          label="Delivery address"
          value={address}
          onChangeText={setAddress}
          placeholder="Street, house number, landmark"
          multiline
        />
        <Field label="City / region" value={city} onChangeText={setCity} placeholder="City, region" />

        <Text style={styles.note}>Email cannot be changed from the app. Contact the store admin if needed.</Text>

        <View style={styles.submit}>
          <Button title="Save Changes" onPress={submit} loading={saving} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.base },
  container: { padding: 20, paddingTop: 24 },
  alert: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#B91C1C',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14
  },
  alertText: { color: colors.danger, fontSize: 13 },
  note: { color: colors.muted, fontSize: 12, marginTop: 4, lineHeight: 18 },
  submit: { marginTop: 20 }
});