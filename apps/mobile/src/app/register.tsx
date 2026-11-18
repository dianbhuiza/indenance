import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import {
  AuthFooter,
  AuthLayout,
  FormBanner,
} from '@/components/auth/auth-layout';
import { Button, Input } from '@/components/ui';
import { api } from '@/lib/api';
import {
  getApiErrorMessage,
  registerSchema,
  type RegisterFormData,
} from '@indenance/core';
import { spacing } from '@/theme/tokens';

export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await api.post('/auth/register', data);
      router.replace({
        pathname: '/login',
        params: {
          message: 'Cuenta creada. Revisa tu email para verificar tu cuenta.',
        },
      });
    } catch (err: unknown) {
      setServerError(getApiErrorMessage(err, 'Error al crear la cuenta'));
    }
  };

  return (
    <AuthLayout title="Crear cuenta">
      {serverError && <FormBanner tone="danger">{serverError}</FormBanner>}

      <View style={styles.form}>
        <Input
          label="Nombre"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          placeholder="Tu nombre"
          error={errors.name?.message}
          {...register('name')}
        />
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
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </View>

      <AuthFooter
        prompt="¿Ya tienes cuenta?"
        cta="Inicia sesión"
        onPress={() => router.replace('/login')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});
