import { useAccountsQuery } from '@indenance/core';
import { Wallet } from 'lucide-react-native';
import React, { useState, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CreateAccountDialog } from '@/components/create-account-dialog';
import { Button } from '@/components/ui';
import { fonts, radius, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function RequireAccounts({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { data: accounts, isLoading } = useAccountsQuery();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary[600]} />
      </View>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.bg, paddingHorizontal: spacing.xl },
        ]}
      >
        <View
          style={[
            styles.icon,
            { backgroundColor: theme.scheme === 'dark' ? 'rgba(20,184,166,0.16)' : theme.primary[100] },
          ]}
        >
          <Wallet size={40} color={theme.primary[600]} />
        </View>
        <Text style={[styles.title, { color: theme.text }]}>
          Crea tu primera cuenta
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Necesitas al menos una cuenta para comenzar a gestionar tus finanzas.
        </Text>
        <Button
          size="lg"
          style={styles.cta}
          onPress={() => setOpen(true)}
        >
          Crear cuenta
        </Button>

        <CreateAccountDialog open={open} onClose={() => setOpen(false)} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  icon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    textAlign: 'center',
    maxWidth: 320,
  },
  cta: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
    maxWidth: 320,
  },
});
