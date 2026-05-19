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
import { Button, Alert } from '@shared/design-system/components';
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
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.successContainer}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>Check Your Email</Text>
            <Text style={styles.successMessage}>
              We've sent password reset instructions to your email address. Please check your inbox
              and follow the steps to reset your password.
            </Text>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onPress={navigateBack}
              style={styles.buttonSpacing}>
              Back to Login
            </Button>
          </View>
        </ScrollView>
      </View>
    );
  }

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
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password
          </Text>
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
    lineHeight: 26,
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
    fontWeight: tokens.fontWeight.medium,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: tokens.spacing[8],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.success.default,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: tokens.spacing[6],
  },
  successIconText: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[4],
    textAlign: 'center',
  },
  successMessage: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing[8],
  },
  buttonSpacing: {
    marginTop: tokens.spacing[4],
  },
});

export default ForgotPasswordScreen;
