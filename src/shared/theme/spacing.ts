export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const fontSize = {
  caption: 12,
  bodySM: 14,
  bodyMD: 16,
  bodyLG: 18,
  headingSM: 20,
  headingMD: 24,
  headingLG: 28,
  headingXL: 34,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const touchTarget = {
  minimum: 48,
  comfortable: 56,
  large: 64,
} as const;
