import { StyleSheet } from 'react-native';

// Enhanced Purple/Dark Color palette
export const colors = {
  // Primary purple theme
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  // Background colors
  background: '#1a0f2e',
  backgroundSecondary: '#0f0a1a',
  backgroundTertiary: '#2d1b4e',
  
  // Surface colors
  surface: '#2d1b34',
  surfaceLight: '#3d2944',
  surfaceDark: '#1d1124',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textTertiary: '#94A3B8',
  textMuted: '#64748B',
  
  // Input colors
  inputBackground: '#2d1b34',
  inputBackgroundFocused: '#3d2944',
  inputBorder: '#4A5568',
  inputBorderFocused: '#8B5CF6',
  inputPlaceholder: '#94A3B8',
  inputText: '#FFFFFF',
  
  // Button colors
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#8B5CF6',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Accent colors
  accent: '#EC4899',
  accentLight: '#F472B6',
  
  // Utility colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',
  
  // Shadow colors
  shadow: 'rgba(139, 92, 246, 0.25)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
};

// Typography
export const typography = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extraBold: '800',
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
};

// Border radius
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 999,
};

// Shadow styles
export const shadows = {
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
};

// Common styles with enhanced purple/dark theme
export const commonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },
  
  appTitle: {
    fontSize: typography.huge,
    fontWeight: typography.extraBold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  appSubtitle: {
    fontSize: typography.md,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  
  // Enhanced input styles
  inputContainer: {
    marginBottom: spacing.lg,
  },
  
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: typography.medium,
    letterSpacing: 0.2,
  },
  
  input: {
    backgroundColor: colors.inputBackground,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    fontSize: typography.md,
    color: colors.inputText,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    minHeight: 50,
    ...shadows.sm,
  },
  
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.inputBackgroundFocused,
    ...shadows.md,
  },
  
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  
  // Enhanced button styles
  buttonPrimary: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    minHeight: 50,
    ...shadows.md,
  },
  
  buttonPrimaryDisabled: {
    backgroundColor: colors.textMuted,
    ...shadows.sm,
  },
  
  buttonSecondary: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.primary,
    ...shadows.sm,
  },
  
  buttonText: {
    color: colors.buttonText,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },
  
  // Enhanced text styles
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: typography.medium,
  },
  
  footerText: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  linkText: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },
  
  // Additional enhanced styles
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },
  
  cardHeader: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginVertical: spacing.md,
  },
  
  // Loading and state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    marginTop: spacing.md,
  },
  
  // Enhanced layout styles
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // Status bar style
  statusBar: {
    backgroundColor: colors.background,
  },
  
  // Gradient background helper (for use with LinearGradient)
  gradientColors: [colors.background, colors.backgroundSecondary, colors.backgroundTertiary],
  
  // Focus ring for accessibility
  focusRing: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  
  // Subtle animation helpers
  fadeIn: {
    opacity: 1,
  },
  
  fadeOut: {
    opacity: 0.5,
  },
});