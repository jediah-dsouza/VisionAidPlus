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
    {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number'].map(
      (req, i) => (
        <View key={i} style={styles.requirementRow}>
          <View style={styles.requirementBullet} />
          <Text style={styles.requirementItem}>{req}</Text>
        </View>
      ),
    )}
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join VisionAid+ and navigate with confidence</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formCardInner}>
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
    paddingVertical: tokens.spacing[8],
    justifyContent: 'center',
  },
  header: {
    marginBottom: tokens.spacing[6],
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
  requirementsContainer: {
    padding: tokens.spacing[4],
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
  },
  requirementsTitle: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[3],
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing[1.5],
  },
  requirementBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: semanticTokens.colors.primary.default,
    marginRight: tokens.spacing[3],
    opacity: 0.7,
  },
  requirementItem: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
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
  loginLink: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
});

export default RegisterScreen;
