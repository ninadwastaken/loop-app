// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { login } from '../utils/auth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  commonStyles,
} from '../utils/styles'; // Adjust path if needed

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>log in to loop</Text>

      <TextInput
        style={styles.input}
        placeholder="university email"
        placeholderTextColor={colors.inputPlaceholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="username"
        placeholderTextColor={colors.inputPlaceholder}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        style={styles.input}
        placeholder="password"
        placeholderTextColor={colors.inputPlaceholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.buttonText}>log in</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.footerText}>
          don’t have an account?{' '}
          <Text style={styles.link}>sign up</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    fontSize: typography.md,
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: typography.sm,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.md,
  },
  footerText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: typography.sm,
  },
  link: {
    color: colors.accent,
    fontWeight: '600',
  },
});
