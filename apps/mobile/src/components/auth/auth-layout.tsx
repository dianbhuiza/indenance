import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { fonts, radius, shadow, spacing } from '@/theme/tokens';
import { useTheme } from '@/theme/use-theme';

export function AuthLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const theme = useTheme();

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <Pressable
            onPress={() => router.replace('/')}
            style={styles.brandWrap}
            accessibilityRole="link"
          >
            <Text style={[styles.brand, { color: theme.primary[600] }]}>
              Indenance
            </Text>
          </Pressable>

          <View
            style={[
              styles.card,
              shadow.sm,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text
              style={[styles.title, { color: theme.text, fontFamily: fonts.bold }]}
            >
              {title}
            </Text>
            {description ? (
              <Text
                style={[
                  styles.description,
                  { color: theme.textSecondary, fontFamily: fonts.regular },
                ]}
              >
                {description}
              </Text>
            ) : null}
            {children}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function FormBanner({
  tone,
  children,
}: {
  tone: 'success' | 'danger' | 'info';
  children: React.ReactNode;
}) {
  const theme = useTheme();
  const palette = {
    success: { bg: theme.success[50], border: theme.success[200], fg: theme.success[700] },
    danger: { bg: theme.danger[50], border: theme.danger[200], fg: theme.danger[700] },
    info: { bg: theme.info[50], border: theme.info[200], fg: theme.info[700] },
  }[tone];

  const dark = theme.scheme === 'dark';

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: dark ? theme.surfaceRaised : palette.bg,
          borderColor: dark ? theme.border : palette.border,
        },
      ]}
    >
      <Text style={[styles.bannerText, { color: dark ? theme.textSecondary : palette.fg }]}>
        {children}
      </Text>
    </View>
  );
}

export function AuthFooter({ prompt, cta, onPress }: { prompt: string; cta: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: theme.textSecondary }]}>
        {prompt}{' '}
      </Text>
      <Pressable onPress={onPress} hitSlop={6}>
        <Text
          style={[styles.footerLink, { color: theme.primary[600] }]}
        >
          {cta}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing['2xl'],
  },
  inner: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  brandWrap: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brand: {
    fontSize: 26,
    fontFamily: fonts.bold,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  banner: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  footerText: {
    fontSize: 14,
    fontFamily: fonts.regular,
  },
  footerLink: {
    fontSize: 14,
    fontFamily: fonts.semibold,
  },
});
