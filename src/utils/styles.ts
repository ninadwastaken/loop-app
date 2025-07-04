// src/utils/styles.ts
import { StyleSheet } from 'react-native'

/**
 * A comprehensive color palette for the app.
 * Using `as const` ensures each value is typed as its literal,
 * which helps downstream consumers (e.g. fontWeight, shadows).
 */
export const colors = {
  // Primary purple theme
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',

  // Background layers
  background: '#1a0f2e',
  backgroundSecondary: '#0f0a1a',
  backgroundTertiary: '#2d1b4e',

  // Surfaces (cards, modals, etc.)
  surface: '#2d1b34',
  surfaceLight: '#3d2944',
  surfaceDark: '#1d1124',

  // Text variants
  textPrimary: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textTertiary: '#94A3B8',
  textMuted: '#64748B',

  // Input-related colors
  inputBackground: '#2d1b34',
  inputBackgroundFocused: '#3d2944',
  inputBorder: '#4A5568',
  inputBorderFocused: '#8B5CF6',
  inputPlaceholder: '#94A3B8',
  inputText: '#FFFFFF',

  // Button text colors
  buttonText: '#FFFFFF',
  buttonTextSecondary: '#8B5CF6',

  // Status-indicating colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Accent (pink) theme
  accent: '#EC4899',
  accentLight: '#F472B6',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Overlay backgrounds (modals, toasts)
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  overlayDark: 'rgba(0, 0, 0, 0.7)',

  // Shadow colors
  shadow: 'rgba(139, 92, 246, 0.25)',
  shadowDark: 'rgba(0, 0, 0, 0.3)',
} as const  // lock literals

/**
 * Exported gradient color array for use in <LinearGradient> or similar.
 * NOTE: Not part of StyleSheet.create—it's just a standalone array.
 */
export const gradientColors = [
  colors.background,
  colors.backgroundSecondary,
  colors.backgroundTertiary,
] as const  // each entry is a literal string

/**
 * Typography sizes + weights.
 * - Font sizes are numbers.
 * - Font weights are string literals matching React Native’s allowed values.
 */
export const typography = {
  // Font sizes
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 28,
  huge: 32,

  // Font weights (string literals)
  regular: '400',
  medium:  '500',
  semibold:'600',
  bold:    '700',
  extraBold:'800',
} as const

/**
 * Standardized spacing scale for margins, padding, etc.
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  huge: 80,
} as const

/**
 * Standardized border-radius sizes.
 */
export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 999,
} as const

/**
 * Predefined shadow styles.
 * Use shadows.sm / md / lg / xl in your component styles.
 */
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
} as const

/**
 * Common reusable styles using constants above.
 * Only valid View/Text/Image style props are allowed here.
 */
export const commonStyles = StyleSheet.create({
  // Safe area wrapper
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Full-screen container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Generic form padding
  formContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },

  // Header (title + subtitle)
  headerContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.xl,
  },

  // App title text
  appTitle: {
    fontSize: typography.huge,
    fontWeight: typography.extraBold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  // App subtitle text
  appSubtitle: {
    fontSize: typography.md,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },

  // Input label above text inputs
  inputLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: typography.medium,
    letterSpacing: 0.2,
  },

  // Base input style
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

  // Focused input overrides
  inputFocused: {
    borderColor: colors.inputBorderFocused,
    backgroundColor: colors.inputBackgroundFocused,
    ...shadows.md,
  },

  // Input error state
  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },

  // Primary button
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

  // Disabled primary button
  buttonPrimaryDisabled: {
    backgroundColor: colors.textMuted,
    ...shadows.sm,
  },

  // Secondary button (outline style)
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

  // Primary button text
  buttonText: {
    color: colors.buttonText,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },

  // Secondary button text
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: typography.md,
    fontWeight: typography.semibold,
    letterSpacing: 0.3,
  },

  // Error message text
  errorText: {
    color: colors.error,
    fontSize: typography.sm,
    marginTop: spacing.sm,
    textAlign: 'center',
    fontWeight: typography.medium,
  },

  // Footer link text
  footerText: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Link text style
  linkText: {
    color: colors.primary,
    fontWeight: typography.semibold,
  },

  // Card container style
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadows.md,
  },

  // Card header text
  cardHeader: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },

  // Divider line
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginVertical: spacing.md,
  },

  // Loading screen container
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Loading text below spinner
  loadingText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    marginTop: spacing.md,
  },

  // Center content both vertically and horizontally
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Row layout with space-between
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Status bar background
  statusBar: {
    backgroundColor: colors.background,
  },

  // Focus ring for accessibility outlines
  focusRing: {
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Fade-in animation helper
  fadeIn: {
    opacity: 1,
  },

  // Fade-out animation helper
  fadeOut: {
    opacity: 0.5,
  },
})
