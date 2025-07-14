// src/screens/SignupScreen.tsx

import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

// ← Use your shared navigator props so TS knows "Interests" is valid
import type { SignupScreenProps } from '../types/navigation';

// Dynamic token-based styles (falls back if import fails)
let commonStyles: any = {};
let colors: any = {};
let typography: any = {};
let spacing: any = {};

try {
  // try importing your theme file
  const s = require('../utils/styles');
  commonStyles = s.commonStyles;
  colors      = s.colors;
  typography  = s.typography;
  spacing     = s.spacing;
} catch {
  console.warn('styles import failed, using defaults');
  colors = {
    primary: '#8B5CF6',
    background: '#1A0F2E',
    buttonText: '#FFFFFF',
    inputPlaceholder: '#94A3B8',
    error: '#EF4444',
  };
  typography = {
    sm: 14,
    md: 16,
    semibold: '600' as const,
  };
  spacing = {
    sm: 8,
    md: 16,
    lg: 24,
  };
}

export default function SignupScreen({ navigation }: SignupScreenProps) {
  // Form state
  const [email,    setEmail]    = useState('');
  const [campus,   setCampus]   = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  // Called when user taps "Verify and Continue"
  const handleSignup = async () => {
    // basic validation
    if (
      !email.trim() ||
      !campus.trim() ||
      !username.trim() ||
      !password.trim()
    ) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1) create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = cred.user.uid;

      // 2) immediately seed Firestore profile
      await setDoc(doc(db, 'users', uid), {
        email:       email.trim(),
        campus:      campus.trim(),
        username:    username.trim(),
        interests:   [],     // will fill in next screen
        joinedLoops: [],     // will auto-join next
        karma:       0,
        streak:      0,
        createdAt:   serverTimestamp(),
      });

      // 3) navigate into Interests flow
      navigation.replace('Interests');
    } catch (err: any) {
      console.log('Signup error:', err.code, err.message);
      // map Firebase errors to friendly messages
      let msg = 'Signup failed. Please try again';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email already registered';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Invalid email address';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be ≥ 6 characters';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Try again later';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background}
      />

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

          {/* Form Fields */}
          <View style={styles.formSection}>

            {/* University Email */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>University Email</Text>
              <TextInput
                style={[commonStyles.input, error && commonStyles.inputError]}
                placeholder="you@school.edu"
                placeholderTextColor={colors.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={t => {
                  setEmail(t);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Campus */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Campus</Text>
              <TextInput
                style={[commonStyles.input, error && commonStyles.inputError]}
                placeholder="e.g. NYU Tandon"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="words"
                value={campus}
                onChangeText={t => {
                  setCampus(t);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Username */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Username</Text>
              <TextInput
                style={[commonStyles.input, error && commonStyles.inputError]}
                placeholder="pick a username"
                placeholderTextColor={colors.inputPlaceholder}
                autoCapitalize="none"
                value={username}
                onChangeText={t => {
                  setUsername(t);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Password */}
            <View style={commonStyles.inputContainer}>
              <Text style={commonStyles.inputLabel}>Password</Text>
              <TextInput
                style={[commonStyles.input, error && commonStyles.inputError]}
                placeholder="minimum 6 chars"
                placeholderTextColor={colors.inputPlaceholder}
                secureTextEntry
                value={password}
                onChangeText={t => {
                  setPassword(t);
                  if (error) setError('');
                }}
              />
            </View>

            {/* Show error if present */}
            {error ? (
              <Text style={commonStyles.errorText}>{error}</Text>
            ) : null}

            {/* Signup button */}
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
                <ActivityIndicator
                  color={colors.buttonText}
                  size="small"
                />
              ) : (
                <Text style={commonStyles.buttonText}>
                  Verify and Continue
                </Text>
              )}
            </TouchableOpacity>

            {/* Footer: navigate to Login */}
            <View style={styles.footerSection}>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.loginLink}
              >
                <Text style={commonStyles.footerText}>
                  Already have an account?{' '}
                  <Text style={commonStyles.linkText}>Log in</Text>
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
