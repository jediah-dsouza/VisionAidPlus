import React from 'react';
import { Controller } from 'react-hook-form';
import { Input, InputProps } from '../Input/Input';

interface FormInputProps extends InputProps {
  name: string;
  control: unknown;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  control,
  label,
  hint,
  error,
  ...props
}) => {
  return (
    <Controller
      name={name}
      control={control as never}
      render={({ field: { onChange, onBlur, value, ref } }) => (
        <Input
          ref={ref}
          label={label}
          hint={hint}
          error={error}
          value={value as string}
          onChangeText={onChange}
          onBlur={onBlur}
          {...props}
        />
      )}
    />
  );
};
