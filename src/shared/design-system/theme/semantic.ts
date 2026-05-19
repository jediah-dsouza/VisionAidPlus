import { tokens } from './tokens';

export const semanticTokens = {
  colors: {
    background: {
      default: '#0F172A',
      subtle: '#1E293B',
      muted: '#334155',
      emphasized: '#475569',
    },
    foreground: {
      default: '#FFFFFF',
      muted: '#CBD5E1',
      subtle: '#94A3B8',
      disabled: '#64748B',
    },
    surface: {
      default: '#1E293B',
      elevated: '#334155',
      overlay: '#475569',
    },
    border: {
      default: '#475569',
      muted: '#334155',
      emphasis: '#64748B',
    },
    primary: {
      default: tokens.colors.primary[600],
      hover: tokens.colors.primary[500],
      active: tokens.colors.primary[700],
      muted: tokens.colors.primary[900],
      subtle: tokens.colors.primary[800],
    },
    secondary: {
      default: tokens.colors.secondary[500],
      hover: tokens.colors.secondary[400],
      active: tokens.colors.secondary[600],
      muted: tokens.colors.secondary[900],
      subtle: tokens.colors.secondary[800],
    },
    accent: {
      default: '#8B5CF6',
      hover: '#A78BFA',
      active: '#7C3AED',
    },
    success: {
      default: tokens.colors.success[500],
      hover: tokens.colors.success[400],
      active: tokens.colors.success[600],
      muted: tokens.colors.success[900],
      subtle: tokens.colors.success[800],
    },
    warning: {
      default: tokens.colors.warning[500],
      hover: tokens.colors.warning[400],
      active: tokens.colors.warning[600],
      muted: tokens.colors.warning[900],
      subtle: tokens.colors.warning[800],
    },
    danger: {
      default: tokens.colors.danger[500],
      hover: tokens.colors.danger[400],
      active: tokens.colors.danger[600],
      muted: tokens.colors.danger[900],
      subtle: tokens.colors.danger[800],
    },
    info: {
      default: tokens.colors.info[500],
      hover: tokens.colors.info[400],
      active: tokens.colors.info[600],
      muted: tokens.colors.info[900],
      subtle: tokens.colors.info[800],
    },
    neutral: {
      default: tokens.colors.neutral[600],
      muted: tokens.colors.neutral[700],
      subtle: tokens.colors.neutral[800],
      subtleAlt: tokens.colors.neutral[900],
    },
    dark: {
      default: '#0F172A',
      subtle: '#1E293B',
    },
  },
  spacing: {
    gutter: 16,
    section: 24,
    container: 16,
  },
  radius: {
    button: tokens.radius.md,
    input: tokens.radius.md,
    card: tokens.radius.lg,
    modal: tokens.radius.xl,
    badge: tokens.radius.full,
    sm: tokens.radius.sm,
    md: tokens.radius.md,
    lg: tokens.radius.lg,
    xl: tokens.radius.xl,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },
  touchTarget: {
    minimum: 48,
    comfortable: 56,
    large: 64,
  },
  fontFamily: {
    sans: 'System',
  },
} as const;

export type SemanticTokens = typeof semanticTokens;
