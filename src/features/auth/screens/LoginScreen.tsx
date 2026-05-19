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
  <View style={styles.logoContainer} accessibilityLabel="VisionAid+ Logo">
    <Text style={styles.logoText}>VA+</Text>
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
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[8],
  },
  header: {
    alignItems: 'center',
    marginBottom: tokens.spacing[8],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.primary.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  logoText: {
    fontSize: 32,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
  },
  form: {
    gap: tokens.spacing[5],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    paddingVertical: tokens.spacing[2],
  },
  forgotPasswordText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
  errorContainer: {
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.danger.subtle,
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.danger.default,
  },
  errorText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.danger.default,
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
