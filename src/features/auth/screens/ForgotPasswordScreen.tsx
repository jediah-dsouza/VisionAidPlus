import React, { useState, useCallback } from 'react';
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
import { forgotPasswordSchema, type ForgotPasswordFormData } from '../validators';
import type { AuthStackParamList } from '../../../app/navigation/types/navigation';

type ForgotPasswordNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

export const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = useCallback(async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const navigateBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  if (isSuccess) {
    return (
      <View style={styles.root}>
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientTop} />
          <View style={styles.gradientBottom} />
        </View>
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.successContainer}>
              <View style={styles.successIconOuter}>
                <View style={styles.successIconGlow} />
                <View style={styles.successIcon}>
                  <Text style={styles.successIconText}>✓</Text>
                </View>
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successMessage}>
                We've sent password reset instructions to your email address. Please check your
                inbox and follow the steps to reset your password.
              </Text>
              <View style={styles.successCard}>
                <Text style={styles.successCardHint}>
                  Didn't receive the email? Check your spam folder or try again.
                </Text>
              </View>
              <View style={styles.successButtonWrapper}>
                <Button variant="primary" size="lg" fullWidth onPress={navigateBack}>
                  Back to Login
                </Button>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you instructions to reset your password
            </Text>
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
                size="lg"
                fullWidth
              />

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleSubmit(onSubmit)}
                isLoading={isSubmitting}
                disabled={isSubmitting}>
                Send Reset Instructions
              </Button>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              onPress={navigateBack}
              accessibilityRole="button"
              accessibilityLabel="Go back to login">
              <Text style={styles.backLink}>← Back to Login</Text>
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
    lineHeight: 26,
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
  footer: {
    marginTop: tokens.spacing[8],
    alignItems: 'center',
  },
  backLink: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing[8],
  },
  successIconOuter: {
    position: 'relative',
    marginBottom: tokens.spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#22C55E',
    opacity: 0.2,
    transform: [{ scale: 1.3 }],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconText: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: tokens.fontWeight.bold,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  successMessage: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing[6],
    paddingHorizontal: tokens.spacing[4],
  },
  successCard: {
    padding: tokens.spacing[4],
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    marginBottom: tokens.spacing[8],
    width: '100%',
  },
  successCardHint: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  successButtonWrapper: {
    width: '100%',
  },
});

export default ForgotPasswordScreen;
