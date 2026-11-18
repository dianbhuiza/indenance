import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AuthLayout, FormBanner } from '@/components/auth/auth-layout';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { getApiErrorMessage } from '@indenance/core';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const setSession = useAuthStore((state) => state.setSession);
  const initialToken = typeof params.token === 'string' ? params.token : '';

  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<Status>(initialToken ? 'loading' : 'idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialToken ? null : 'Token de verificación no encontrado.',
  );
  const started = useRef(false);

  useEffect(() => {
    if (!initialToken || started.current) return;
    started.current = true;
    api
      .post('/auth/verify-email', { token: initialToken })
      .then(({ data }) => {
        setSession(data);
        setStatus('success');
        setTimeout(() => router.replace('/dashboard'), 2000);
      })
      .catch((err: unknown) => {
        setErrorMessage(getApiErrorMessage(err, 'Token inválido o expirado.'));
        setStatus('error');
      });
  }, [initialToken, setSession]);

  const verifyManual = async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      const { data } = await api.post('/auth/verify-email', {
        token: token.trim(),
      });
      setSession(data);
      setStatus('success');
      setTimeout(() => router.replace('/dashboard'), 2000);
    } catch (err: unknown) {
      setErrorMessage(getApiErrorMessage(err, 'Token inválido o expirado.'));
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <AuthLayout title="Verificando tu email...">
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary[600]} />
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Un momento, estamos confirmando tu cuenta.
          </Text>
        </View>
      </AuthLayout>
    );
  }

  if (status === 'success') {
    return (
      <AuthLayout title="Email verificado">
        <View style={styles.center}>
          <Text style={[styles.paragraph, { color: theme.success[700] }]}>
            Tu cuenta está activa. Serás redirigido al dashboard...
          </Text>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Verificar tu email"
      description="Introduce el token que recibiste por correo para activar tu cuenta."
    >
      {errorMessage && <FormBanner tone="danger">{errorMessage}</FormBanner>}
      <View style={styles.stack}>
        <Input
          label="Token de verificación"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Token del correo"
          value={token}
          onChangeText={setToken}
        />
        <Button onPress={verifyManual} disabled={!token.trim()}>
          Verificar cuenta
        </Button>
        <Button variant="ghost" onPress={() => router.replace('/login')}>
          Volver al login
        </Button>
      </View>
    </AuthLayout>
  );
}

const styles = {
  center: {
    alignItems: 'center' as const,
    gap: spacing.md,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 21,
    textAlign: 'center' as const,
    fontFamily: fonts.regular,
  },
  stack: {
    gap: spacing.md,
  },
};
