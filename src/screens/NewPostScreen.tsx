// src/screens/NewPostScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loop } from '../types';

export default function NewPostScreen() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const uid = auth.currentUser?.uid!;

  // Fetch all loops (console-readable under new rules)
  useEffect(() => {
    (async () => {
      try {
        const loopSnap = await getDocs(collection(db, 'loops'));
        setLoops(loopSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.warn('Error loading loops:', err);
        Alert.alert('Error', 'Could not load loops');
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedLoop) {
      return Alert.alert('Pick a Loop', 'Choose which loop to post in');
    }
    if (!content.trim()) {
      return Alert.alert('Empty Post', 'Type something first');
    }
    setSubmitting(true);
    try {
      const postRef = doc(collection(db, 'loops', selectedLoop, 'posts'));
      await setDoc(postRef, {
        content:    content.trim(),
        posterId:   uid,
        anon:       false,
        karma:      0,
        createdAt:  serverTimestamp()
      });
      setContent('');
      Alert.alert('Posted!', 'Your post went live 🔥');
    } catch (err) {
      console.warn('Error creating post:', err);
      Alert.alert('Error', 'Could not create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loops.length) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#00d4ff"/>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Choose a Loop</Text>
      <FlatList
        data={loops}
        horizontal
        keyExtractor={item => item.id}
        contentContainerStyle={styles.loopList}
        renderItem={({ item }) => {
          const isSel = item.id === selectedLoop;
          return (
            <TouchableOpacity
              style={[
                styles.loopBadge,
                isSel ? styles.loopSelected : styles.loopUnselected
              ]}
              onPress={() => setSelectedLoop(item.id)}
            >
              <Text style={[
                styles.loopText,
                isSel ? styles.loopTextSel : styles.loopTextUnsel
              ]}>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Write a post..."
        placeholderTextColor="#666"
        value={content}
        onChangeText={setContent}
        multiline
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff"/>
          : <Text style={styles.btnText}>Drop It 🔥</Text>
        }
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#000', padding:16 },
  center: { flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' },
  label: { color:'#fff', fontSize:16, marginBottom:8 },
  loopList:{ paddingBottom:12 },
  loopBadge:{
    paddingVertical:6,
    paddingHorizontal:12,
    borderRadius:20,
    marginRight:8
  },
  loopSelected: { backgroundColor:'#00d4ff' },
  loopUnselected: { backgroundColor:'rgba(40,40,40,0.6)' },
  loopText:{ fontSize:14 },
  loopTextSel:{ color:'#000' },
  loopTextUnsel:{ color:'#fff' },
  input:{
    flex:1,
    backgroundColor:'rgba(40,40,40,0.6)',
    color:'#fff',
    borderRadius:8,
    padding:12,
    textAlignVertical:'top',
    marginBottom:16
  },
  button:{
    backgroundColor:'#ff6b6b',
    padding:16,
    borderRadius:8,
    alignItems:'center'
  },
  btnText:{ color:'#fff', fontWeight:'600' }
});
