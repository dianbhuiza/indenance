import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
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
import {
  forgotPasswordSchema,
  getApiError,
  getApiErrorMessage,
  type ForgotPasswordFormData,
} from '@indenance/core';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function ForgotPasswordPage() {
  const theme = useTheme();
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/forgot-password', data);
      setSent(true);
    } catch (err: unknown) {
      const { status } = getApiError(err);
      if (status === 429) {
        setServerError(
          'Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo.',
        );
        return;
      }
      setServerError(
        getApiErrorMessage(
          err,
          'No se pudo procesar la solicitud. Inténtalo de nuevo.',
        ),
      );
    }
  };

  if (sent) {
    return (
      <AuthLayout title="Revisa tu correo">
        <FormBanner tone="success">
          Si el correo existe, recibirás un enlace para restablecer tu
          contraseña. El enlace caduca en 1 hora.
        </FormBanner>
        <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
          Si no lo ves, revisa tu carpeta de spam. ¿No usas ese correo?
        </Text>
        <View style={styles.stack}>
          <Button variant="secondary" onPress={() => setSent(false)}>
            Probar con otro correo
          </Button>
          <Button variant="ghost" onPress={() => router.replace('/login')}>
            Volver al inicio de sesión
          </Button>
        </View>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recupera tu contraseña"
      description="Escribe el correo de tu cuenta y te enviaremos un enlace seguro para restablecer tu contraseña."
    >
      {serverError && <FormBanner tone="danger">{serverError}</FormBanner>}

      <View style={styles.stack}>
        <Input
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="tu@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </Button>
      </View>

      <AuthFooter
        prompt="¿Recordaste tu contraseña?"
        cta="Inicia sesión"
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
