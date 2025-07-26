// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import Logo from '../../assets/loop_logo.svg';
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
} from '../utils/styles'; // Adjust path if needed

type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  WelcomeCarousel: undefined;
};

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'WelcomeCarousel' }] });
    } catch (err: any) {
      setError(err.message || 'login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Logo width={96} height={96} style={styles.logo} />
      <Text style={styles.title}>Welcome Back to Loop</Text>
      <Text style={styles.subtitle}>Available at select schools. Now at NYU.</Text>

      <TextInput
        style={styles.input}
        placeholder="...@uni.edu"
        placeholderTextColor="#bfb9f5"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="password"
        placeholderTextColor="#bfb9f5"
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
    backgroundColor: '#20144c',
    justifyContent: 'center',
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.xxxl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.md,
    fontWeight: '400',
    color: '#bfb9f5',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: '#6a3cff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#3a2a72',
    color: '#fff',
  },
  error: {
    color: colors.error,
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: typography.sm,
  },
  button: {
    backgroundColor: '#6a3cff',
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: spacing.md,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    // textTransform: 'uppercase',
  },
  footerText: {
    color: '#bfb9f5',
    textAlign: 'center',
    fontSize: typography.sm,
  },
  link: {
    color: '#6a3cff',
    fontWeight: '600',
  },
  logo: {
    marginBottom: 24,
  },
});
