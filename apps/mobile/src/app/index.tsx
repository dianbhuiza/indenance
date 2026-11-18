import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { useAuthStore } from '@/lib/auth';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function LandingPage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const gradient: [string, string] =
    theme.scheme === 'dark'
      ? [theme.primary[950] ?? theme.primary[900], theme.primary[900]]
      : [theme.primary[50], theme.primary[100]];

  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.root, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}
    >
      <View style={styles.content}>
        <View style={styles.copy}>
          <Text
            style={[
              styles.title,
              { color: theme.scheme === 'dark' ? theme.primary[100] : theme.primary[900] },
            ]}
          >
            Indenance
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: theme.scheme === 'dark' ? theme.primary[300] : theme.primary[700] },
            ]}
          >
            Gestiona tus finanzas personales de forma inteligente
          </Text>
        </View>

        <View style={styles.actions}>
          {isAuthenticated ? (
            <Button size="lg" onPress={() => router.replace('/dashboard')}>
              Ir al Dashboard
            </Button>
          ) : (
            <>
              <Button size="lg" onPress={() => router.replace('/login')}>
                Iniciar sesión
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onPress={() => router.replace('/register')}
              >
                Crear cuenta
              </Button>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  content: {
    alignItems: 'center',
    gap: spacing['2xl'],
  },
  copy: {
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 44,
    fontFamily: fonts.display,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 25,
    fontFamily: fonts.regular,
    textAlign: 'center',
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    maxWidth: 340,
    gap: spacing.md,
  },
});
