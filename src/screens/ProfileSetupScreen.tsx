import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { ProfileSetupScreenProps } from '../types/navigation';
import { db } from '../../config/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ProfileSetupScreen({ navigation }: ProfileSetupScreenProps) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  // TODO: add avatar upload/selection logic if desired

  const handleNext = async () => {
    if (!username.trim() || !displayName.trim()) {
      setError('Please fill out both fields.');
      return;
    }
    setError('');
    try {
      const { currentUser } = getAuth();
      if (!currentUser) {
        setError('User not logged in.');
        return;
      }
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: username.trim(),
        displayName: displayName.trim(),
      });
      navigation.navigate('LoopSelect');
    } catch (err) {
      setError('Error saving profile. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>Step 5 of 6</Text>
      <Text style={styles.title}>Create your profile</Text>
      <Text style={styles.subtitle}>Pick a username and display name</Text>
      {/* <Image source={require('../../assets/avatar_placeholder.png')} style={styles.avatar} /> */}
      {/* TODO: Add avatar picker */}
      <TextInput
        style={styles.input}
        placeholder="Username (unique)"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
        maxLength={20}
      />
      <TextInput
        style={styles.input}
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        maxLength={20}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:30, backgroundColor:'#fff' },
  stepText: { color:'#a3a3a3', fontSize:14, marginBottom:14 },
  title: { fontSize:28, fontWeight:'bold', textAlign:'center', marginBottom:10, color:'#3e206a' },
  subtitle: { fontSize:16, color:'#888', marginBottom:24, textAlign:'center' },
  input: { width:'100%', maxWidth:340, borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:16, fontSize:16, marginBottom:10, backgroundColor:'#fff' },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:14, width:'100%', maxWidth:340, alignItems:'center', marginTop:12 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  error: { color:'#e53935', marginBottom:10, marginTop:6 },
  // avatar: { width:80, height:80, borderRadius:40, marginBottom:20 },
});