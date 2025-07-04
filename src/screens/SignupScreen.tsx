import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Try to import styles, fallback if missing
let commonStyles: any = {};
let colors: any = {};
let typography: any = {};
let spacing: any = {};

try {
  const stylesImport = require('../utils/styles');
  commonStyles = stylesImport.commonStyles || {};
  colors = stylesImport.colors || {};
  typography = stylesImport.typography || {};
  spacing = stylesImport.spacing || {};
} catch (error) {
  console.warn('Could not import styles, using defaults');
  colors = {
    primary: '#007AFF',
    background: '#000000',
    buttonText: '#FFFFFF',
    inputPlaceholder: '#999999',
  };
  typography = {
    sm: 14,
    semibold: '600' as const,
  };
  spacing = {
    sm: 8,
    md: 16,
    lg: 24,
  };
}

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [campus, setCampus] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!email.trim() || !campus.trim() || !username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      // auth state listener in App.tsx will switch you into MainTabs
    } catch (err: any) {
      console.log('Signup error code:', err.code, err.message);
      let errorMessage = 'Signup failed. Please try again';

      switch (err.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email format';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later';
          break;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={commonStyles.formContainer}>
          {/* Header */}
          <View style={commonStyles.headerContainer}>
            <Text style={commonStyles.appTitle}>Welcome to Loop!</Text>
            <Text style={commonStyles.appSubtitle}>
              Connect with your campus community
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            {/* University Email Input */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>University Email</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  error && commonStyles.inputError,
                ]}
                placeholder="Enter your university email"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Campus Input Field (editable) */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Campus</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  error && commonStyles.inputError,
                ]}
                placeholder="Enter your campus"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="words"
                value={campus}
                onChangeText={(text) => {
                  setCampus(text);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Username Input */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Username</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  error && commonStyles.inputError,
                ]}
                placeholder="Enter your username"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
                autoComplete="username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Password Input */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Password</Text>
              <TextInput
                style={[
                  commonStyles.input,
                  error && commonStyles.inputError,
                ]}
                placeholder="Enter your password"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <Text style={commonStyles.errorText}>{error}</Text>
            ) : null}

            {/* Signup Button */}
            <TouchableOpacity
              style={[
                commonStyles.buttonPrimary,
                loading && commonStyles.buttonPrimaryDisabled,
              ]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonText} size="small" />
              ) : (
                <Text style={commonStyles.buttonText}>Verify and Continue</Text>
              )}
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footerSection}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}
              >
                <Text style={commonStyles.footerText}>
                  Already have an account?{' '}
                  <Text style={commonStyles.linkText}>Login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  formSection: {
    flex: 1,
    justifyContent: 'center',
  },
  footerSection: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginLink: {
    marginTop: spacing.sm,
  },
});
