import { router } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function NotFoundScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.bg, paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.content}>
        <Text style={[styles.code, { color: theme.primary[300] }]}>404</Text>
        <Text style={[styles.title, { color: theme.text }]}>Página no encontrada</Text>
        <Text style={[styles.message, { color: theme.textMuted }]}>
          La ruta que intentas abrir no existe en Inenance.
        </Text>
        <Button size="lg" onPress={() => router.replace('/')}>
          Volver al inicio
        </Button>
      </View>
    </View>
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
    gap: spacing.md,
  },
  code: {
    fontSize: 64,
    fontFamily: fonts.display,
    lineHeight: 72,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.display,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    textAlign: 'center',
    maxWidth: 300,
    marginBottom: spacing.sm,
  },
});
