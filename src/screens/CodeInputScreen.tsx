import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { CodeInputScreenProps } from '../types/navigation';

export default function CodeInputScreen({ navigation, route }: CodeInputScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const email = route?.params?.email ?? '';

  const handleVerify = () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }
    setError('');
    // TODO: Actually verify code and handle error if invalid.
    // If success:
    navigation.navigate('WelcomeCarousel');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
      <View style={styles.container}>
        <Text style={styles.title}>Enter Verification Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to
        </Text>
        <Text style={styles.email}>{email}</Text>
        <TextInput
          style={styles.input}
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleVerify}>
          <Text style={styles.buttonText}>Verify</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.resend}>Resend code</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:24 },
  title: { fontSize:24, fontWeight:'bold', marginBottom:8 },
  subtitle: { fontSize:15, color:'#888' },
  email: { fontSize:15, color:'#6a3cff', fontWeight:'bold', marginBottom:20 },
  input: { width:'100%', maxWidth:240, borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:16, fontSize:18, marginBottom:12, backgroundColor:'#fff', textAlign:'center' },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:14, width:'100%', maxWidth:240, alignItems:'center', marginTop:10 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  error: { color:'#e53935', marginBottom:10 },
  resend: { marginTop:20, color:'#6a3cff', fontWeight:'500', fontSize:15 }
});