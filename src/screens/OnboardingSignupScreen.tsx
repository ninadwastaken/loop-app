import React, { useState } from 'react';
import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../../config/firebase";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { OnboardingSignupScreenProps } from '../types/navigation';

export default function OnboardingSignupScreen({ navigation }: OnboardingSignupScreenProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  function isEduEmail(email: string) {
    return /\.edu$/i.test(email.trim());
  }

  const handleNext = async () => {
    if (!isEduEmail(email)) {
      setError('Please enter a valid .edu email address.');
      return;
    }
    setError('');
    try {
      const functions = getFunctions(app);
      const sendSignupCode = httpsCallable(functions, 'sendSignupCode');
      await sendSignupCode({ email });
      navigation.navigate('CodeInput', { email });
    } catch (err) {
      setError('Failed to send verification code. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign up for Loop</Text>
        <Text style={styles.subtitle}>Enter your .edu email address</Text>
        <TextInput
          style={styles.input}
          placeholder="your@email.edu"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>

        {/* <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Already have an account? Log in</Text>
        </TouchableOpacity> */}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding: 24 },
  title: { fontSize:28, fontWeight:'bold', marginBottom:10 },
  subtitle: { fontSize:16, color:'#888', marginBottom:30 },
  input: { width:'100%', maxWidth:340, borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:16, fontSize:16, marginBottom:12, backgroundColor:'#fff' },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:14, width:'100%', maxWidth:340, alignItems:'center', marginTop:10 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  error: { color:'#e53935', marginBottom:10 },
  loginLink: { marginTop:24, color:'#6a3cff', fontWeight:'500', fontSize:15 }
});