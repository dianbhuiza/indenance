import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  FormBanner,
} from '@/components/auth/auth-layout';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import {
  getApiErrorMessage,
  loginSchema,
  type LoginFormData,
} from '@indenance/core';
import { fonts, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export default function LoginPage() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ message?: string }>();
  const setSession = useAuthStore((state) => state.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const successMessage =
    typeof params.message === 'string' ? params.message : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      const { data: session } = await api.post('/auth/login', data);
      setSession(session);
      router.replace('/dashboard');
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err, 'Error al iniciar sesión'));
    }
  };

  return (
    <AuthLayout title="Iniciar sesión">
      {successMessage && <FormBanner tone="success">{successMessage}</FormBanner>}
      {serverError && <FormBanner tone="danger">{serverError}</FormBanner>}

      <View style={styles.form}>
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
        <Input
          label="Contraseña"
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Pressable
          onPress={() => router.push('/forgot-password')}
          hitSlop={6}
          style={styles.forgot}
        >
          <Text style={[styles.forgotText, { color: theme.primary[600] }]}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>

        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </View>

      <AuthFooter
        prompt="¿No tienes cuenta?"
        cta="Regístrate"
        onPress={() => router.replace('/register')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  forgot: {
    alignItems: 'flex-end',
    marginTop: -spacing.sm,
  },
  forgotText: {
    fontSize: 14,
    fontFamily: fonts.medium,
  },
});
