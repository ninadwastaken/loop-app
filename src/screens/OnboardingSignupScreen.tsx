import React, { useState } from 'react';
import Logo from '../../assets/loop_logo.svg';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import app from "../../config/firebase";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { OnboardingSignupScreenProps } from '../types/navigation';

export default function OnboardingSignupScreen({ navigation }: OnboardingSignupScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Only allow emails that end with @nyu.edu (case-insensitive)
  function isNYUEmail(email: string) {
    return /^[^@\s]+@nyu\.edu$/i.test(email.trim());
  }

  const handleSignup = async () => {
    if (!isNYUEmail(email)) {
      setError('You must use your @nyu.edu email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    try {
      const auth = getAuth(app);
      await createUserWithEmailAndPassword(auth, email, password);
      navigation.reset({ index: 0, routes: [{ name: 'WelcomeCarousel' }] });
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else {
        setError('Failed to sign up. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
      <View style={styles.container}>
        <Logo width={96} height={96} style={styles.logo} />
        <Text style={styles.title}>Step Inside the Loop</Text>
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
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Text style={styles.buttonText}>sign up</Text>
        </TouchableOpacity>
        <Pressable onPress={() => navigation.navigate('LoginScreen')} style={styles.loginContainer}>
          <Text style={styles.loginText}>already have an account? <Text style={styles.loginLink}>log in</Text></Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding: 24, backgroundColor: '#20144c' },
  logo: { marginBottom: 24 },
  title: { fontSize:28, fontWeight:'bold', marginBottom:10, color: '#fff' },
  subtitle: { fontSize:16, color:'#bfb9f5', marginBottom:30 },
  input: { width:'100%', maxWidth:340, borderWidth:1, borderColor:'#6a3cff', borderRadius:8, padding:16, fontSize:16, marginBottom:12, backgroundColor:'#3a2a72', color:'#fff' },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:14, width:'100%', maxWidth:340, alignItems:'center', marginTop:10 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  error: { color:'#e53935', marginBottom:10 },
  loginContainer: { marginTop: 20 },
  loginText: { color: '#bfb9f5', fontSize: 14 },
  loginLink: { color: '#6a3cff', textDecorationLine: 'underline' }
});