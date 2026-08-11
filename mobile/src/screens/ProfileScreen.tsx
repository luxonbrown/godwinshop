import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius } from '../theme';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { TabScreenProps } from '../navigation/types';

export default function ProfileScreen({ navigation }: TabScreenProps<'ProfileTab'>) {
  const { user, signOut, restoring } = useAuth();

  const initials = (user?.full_name ?? 'GS')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const menu = [
    { key: 'orders', icon: 'receipt-outline', label: 'My Orders', onPress: () => navigation.navigate('MyOrders') },
    { key: 'profile', icon: 'person-outline', label: 'Edit Profile', onPress: () => navigation.navigate('EditProfile') },
    { key: 'about', icon: 'information-circle-outline', label: 'About Godwinshop', onPress: () => navigation.navigate('About') },
    { key: 'how', icon: 'play-circle-outline', label: 'How It Works', onPress: () => navigation.navigate('HowItWorks') },
    { key: 'contact', icon: 'call-outline', label: 'Contact Us', onPress: () => navigation.navigate('Contact') }
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.identity}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <View style={styles.verifiedRow}>
              {user?.is_verified ? (
                <Text style={styles.verified}>
                  <Ionicons name="checkmark-circle" size={13} color={colors.success} /> Verified
                </Text>
              ) : (
                <Text style={styles.unverified}>Email not verified</Text>
              )}
            </View>
          </View>
        </View>

        {user?.address || user?.city || user?.phone ? (
          <View style={styles.card}>
            {user?.phone ? (
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Phone: </Text>
                {user.phone}
              </Text>
            ) : null}
            {user?.address ? (
              <Text style={styles.detailLine}>
                <Text style={styles.detailLabel}>Address: </Text>
                {user.address}
                {user.city ? `, ${user.city}` : ''}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.menu}>
          {menu.map((item, idx) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.menuItem,
                idx > 0 && styles.menuItemBorder,
                pressed && { opacity: 0.8 }
              ]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon as never} size={20} color={colors.accent} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        <View style={styles.signOut}>
          <Button
            title="Sign Out"
            variant="secondary"
            loading={restoring}
            onPress={() => {
              void signOut().then(() => {});
            }}
          />
        </View>

        <Text style={styles.version}>Godwinshop Mobile v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.base },
  content: { padding: 18, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    padding: 16
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.base2,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: colors.accent, fontSize: 22, fontWeight: '800' },
  identity: { flex: 1 },
  name: { color: colors.fg, fontSize: 18, fontWeight: '800' },
  email: { color: colors.muted, fontSize: 13, marginTop: 2 },
  verifiedRow: { marginTop: 6 },
  verified: { color: colors.success, fontSize: 12, fontWeight: '600' },
  unverified: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  detailLine: { color: colors.muted, fontSize: 13, marginVertical: 3 },
  detailLabel: { color: colors.fg, fontWeight: '600' },
  menu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radius.lg,
    marginTop: 16,
    overflow: 'hidden'
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuItemBorder: { borderTopWidth: 1, borderTopColor: colors.divider },
  menuLabel: { flex: 1, color: colors.fg, fontSize: 15, fontWeight: '600' },
  signOut: { marginTop: 24 },
  version: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 16 }
});