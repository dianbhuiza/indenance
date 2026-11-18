import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Text, View } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  FormBanner,
} from '@/components/auth/auth-layout';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import {
  getApiError,
  getApiErrorMessage,
  resetPasswordSchema,
  type ResetPasswordFormData,
} from '@indenance/core';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function ResetPasswordPage() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ token?: string }>();
  const clearSession = useAuthStore((state) => state.clearSession);
  const initialToken = typeof params.token === 'string' ? params.token : '';

  const [token, setToken] = useState(initialToken);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showRequestLink, setShowRequestLink] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setServerError(null);
    setShowRequestLink(false);
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: data.newPassword,
      });
      clearSession();
      router.replace({
        pathname: '/login',
        params: {
          message:
            'Contraseña actualizada. Inicia sesión con tu nueva contraseña.',
        },
      });
    } catch (err: unknown) {
      const { status } = getApiError(err);
      if (status === 401) {
        setServerError('El enlace ya no es válido: caducó o ya fue usado.');
        setShowRequestLink(true);
      } else if (status === 429) {
        setServerError(
          'Demasiados intentos. Espera un minuto y vuelve a intentarlo.',
        );
      } else {
        setServerError(
          getApiErrorMessage(err, 'No se pudo restablecer la contraseña.'),
        );
      }
    }
  };

  return (
    <AuthLayout
      title="Nueva contraseña"
      description="Elige una contraseña nueva. Se cerrarán todas las sesiones abiertas en otros dispositivos."
    >
      {serverError && (
        <FormBanner tone="danger">
          {serverError}
          {showRequestLink ? ' Solicita un enlace nuevo.' : ''}
        </FormBanner>
      )}
      {!initialToken && (
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          El enlace de tu correo no se pudo abrir aquí. Pega el token que
          recibiste por email para continuar.
        </Text>
      )}

      <View style={styles.stack}>
        <Input
          label="Token de recuperación"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Token del correo"
          value={token}
          onChangeText={setToken}
          error={!token ? 'El token es obligatorio.' : undefined}
        />
        <Input
          label="Nueva contraseña"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Mínimo 8 caracteres"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <Input
          label="Confirmar contraseña"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Repite la contraseña"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting || !token.trim()}
        >
          {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
        </Button>
        {showRequestLink && (
          <Button variant="secondary" onPress={() => router.replace('/forgot-password')}>
            Solicitar un enlace nuevo
          </Button>
        )}
      </View>

      <AuthFooter
        prompt=""
        cta="Volver al inicio de sesión"
        onPress={() => router.replace('/login')}
      />
    </AuthLayout>
  );
}

const styles = {
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center' as const,
    fontFamily: fonts.regular,
  },
  stack: {
    gap: spacing.md,
  },
};
