import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../context/AuthContext';
import { RootScreenProps } from '../navigation/types';

export default function SplashScreen({ navigation }: RootScreenProps<'Splash'>) {
  const { signedIn } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      navigation.replace(signedIn ? 'MainTabs' : 'Login');
    }, 1400);
    return () => clearTimeout(t);
  }, [navigation, signedIn]);

  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>GS</Text>
      </View>
      <Text style={styles.brand}>Godwinshop</Text>
      <Text style={styles.tagline}>Shop smarter. Order easily. Get it delivered.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.base, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: colors.base2,
    borderWidth: 1,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  logoText: { color: colors.accent, fontSize: 40, fontWeight: '800' },
  brand: { color: colors.fg, fontSize: 28, fontWeight: '800' },
  tagline: { color: colors.muted, fontSize: 15, marginTop: 8, textAlign: 'center' }
});