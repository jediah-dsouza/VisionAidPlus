import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@shared/design-system/components';
import { Input } from '@shared/design-system/components';
import { FormInput } from '@shared/design-system/components/FormInput/FormInput';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { loginSchema, type LoginFormData } from '../validators';
import { useAuth } from '../hooks/useAuth';
import { accessibilityEngine } from '../../../core';
import type { AuthStackParamList } from '../../../app/navigation/types/navigation';

type LoginNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LogoPlaceholder: React.FC = () => (
  <View style={styles.logoOuter}>
    <View style={styles.logoGlow} />
    <View style={styles.logoContainer} accessibilityLabel="VisionAid+ Logo">
      <Text style={styles.logoText}>VA+</Text>
    </View>
  </View>
);

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginNavigationProp>();
  const { login, isLoading, error, clearError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: LoginFormData) => {
      clearError();
      await login(data);
    },
    [login, clearError],
  );

  const navigateToRegister = useCallback(() => {
    navigation.navigate('Register');
  }, [navigation]);

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate('ForgotPassword');
  }, [navigation]);

  return (
    <View style={styles.root}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <LogoPlaceholder />
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue your journey</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formCardInner}>
              <FormInput
                name="email"
                control={control}
                label="Email"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                error={touchedFields.email ? errors.email?.message : undefined}
                hint="We'll never share your email"
                size="lg"
                fullWidth
              />

              <FormInput
                name="password"
                control={control}
                label="Password"
                placeholder="Enter your password"
                secureTextEntry
                error={touchedFields.password ? errors.password?.message : undefined}
                size="lg"
                fullWidth
              />

              <Pressable
                style={styles.forgotPassword}
                onPress={navigateToForgotPassword}
                accessibilityRole="button"
                accessibilityLabel="Forgot password. Navigate to password reset">
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              {error && (
                <View
                  style={styles.errorContainer}
                  accessibilityRole="alert"
                  accessibility-live-region="polite">
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSubmit(onSubmit)}
                isLoading={isLoading}
                disabled={isLoading}>
                Sign In
              </Button>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <Pressable
              onPress={navigateToRegister}
              accessibilityRole="button"
              accessibilityLabel="Create new account">
              <Text style={styles.registerLink}> Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1121',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0F172A',
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1E293B',
    opacity: 0.15,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[10],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing[8],
  },
  logoOuter: {
    position: 'relative',
    marginBottom: tokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: semanticTokens.colors.primary.default,
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: semanticTokens.colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: semanticTokens.colors.primary.default,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  logoText: {
    fontSize: 34,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[2],
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    letterSpacing: 0.2,
  },
  formCard: {
    borderRadius: 20,
    backgroundColor: '#1A2332',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  formCardInner: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[5],
  },
  form: {
    gap: tokens.spacing[5],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: tokens.spacing[1],
  },
  forgotPasswordText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
    letterSpacing: 0.2,
  },
  errorContainer: {
    padding: tokens.spacing[4],
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    fontSize: semanticTokens.fontSize.sm,
    color: '#EF4444',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: tokens.spacing[8],
    gap: tokens.spacing[1],
  },
  footerText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  registerLink: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
});

export default LoginScreen;
