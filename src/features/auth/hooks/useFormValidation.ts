import { useState, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ZodError, ZodSchema } from 'zod';
import { accessibilityEngine } from '../../../core';

interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>;
  onSubmit: (data: T) => Promise<void>;
}

interface UseFormValidationReturn<T> {
  handleSubmit: (data: T) => Promise<void>;
  validationErrors: Record<string, string>;
  isSubmitting: boolean;
  clearErrors: () => void;
}

export function useFormValidation<T extends Record<string, unknown>>(
  formMethods: UseFormReturn<T>,
  options: UseFormValidationOptions<T>,
): UseFormValidationReturn<T> {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const clearErrors = useCallback(() => {
    setValidationErrors({});
    formMethods.clearErrors();
  }, [formMethods]);

  const handleSubmit = useCallback(
    async (data: T) => {
      setIsSubmitting(true);
      setValidationErrors({});

      try {
        options.schema.parse(data);
        await options.onSubmit(data);
        accessibilityEngine.announce('Form submitted successfully', 'normal');
      } catch (error) {
        if (error instanceof ZodError) {
          const errors: Record<string, string> = {};
          for (const err of error.issues) {
            const path = err.path.join('.');
            errors[path] = err.message;
          }
          setValidationErrors(errors);

          if (error.issues.length > 0) {
            const firstError = error.issues[0];
            accessibilityEngine.announce(`Error: ${firstError.message}`, 'high');
          }
        } else if (error instanceof Error) {
          accessibilityEngine.announce(`Error: ${error.message}`, 'high');
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formMethods, options],
  );

  return {
    handleSubmit,
    validationErrors,
    isSubmitting,
    clearErrors,
  };
}
