import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@shared/design-system/components';
import { FormInput } from '@shared/design-system/components/FormInput/FormInput';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { registerSchema, type RegisterFormData } from '../validators';
import { useAuth } from '../hooks/useAuth';
import type { AuthStackParamList } from '../../../app/navigation/types/navigation';

type RegisterNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

const PasswordRequirements: React.FC = () => (
  <View style={styles.requirementsContainer} accessibilityLabel="Password requirements">
    <Text style={styles.requirementsTitle}>Password must contain:</Text>
    <Text style={styles.requirementItem}>• At least 8 characters</Text>
    <Text style={styles.requirementItem}>• One uppercase letter</Text>
    <Text style={styles.requirementItem}>• One lowercase letter</Text>
    <Text style={styles.requirementItem}>• One number</Text>
  </View>
);

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterNavigationProp>();
  const { register, isLoading, error, clearError } = useAuth();

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(
    async (data: RegisterFormData) => {
      clearError();
      const { confirmPassword: _, ...registerData } = data;
      await register(registerData);
    },
    [register, clearError],
  );

  const navigateToLogin = useCallback(() => {
    navigation.goBack();
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join VisionAid+ today</Text>
        </View>

        <View style={styles.form}>
          <FormInput
            name="name"
            control={control}
            label="Full Name"
            placeholder="Enter your full name"
            autoCapitalize="words"
            autoCorrect={false}
            error={touchedFields.name ? errors.name?.message : undefined}
            size="lg"
            fullWidth
          />

          <FormInput
            name="email"
            control={control}
            label="Email"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={touchedFields.email ? errors.email?.message : undefined}
            size="lg"
            fullWidth
          />

          <FormInput
            name="password"
            control={control}
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            error={touchedFields.password ? errors.password?.message : undefined}
            size="lg"
            fullWidth
          />

          {touchedFields.password && <PasswordRequirements />}

          <FormInput
            name="confirmPassword"
            control={control}
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            error={touchedFields.confirmPassword ? errors.confirmPassword?.message : undefined}
            size="lg"
            fullWidth
          />

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
            Create Account
          </Button>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable
            onPress={navigateToLogin}
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account">
            <Text style={styles.loginLink}> Sign In</Text>
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
    marginBottom: tokens.spacing[8],
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
  requirementsContainer: {
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.background.subtle,
    borderRadius: semanticTokens.radius.md,
  },
  requirementsTitle: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  requirementItem: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[1],
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
  loginLink: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
});

export default RegisterScreen;
