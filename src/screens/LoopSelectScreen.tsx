import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase'; // update path if needed
import { getAuth } from 'firebase/auth';
import { LoopSelectScreenProps } from '../types/navigation'; 

export default function LoopSelectScreen({ navigation }: LoopSelectScreenProps) {
  const [loops, setLoops] = useState<{ id: string; name: string }[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoops() {
      try {
        const snap = await getDocs(collection(db, 'loops'));
        const data = snap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id
        }));
        setLoops(data);
        setLoading(false);
      } catch (e) {
        setError('Error loading loops.');
        setLoading(false);
      }
    }
    fetchLoops();
  }, []);

  const handleToggle = (loopId: string) => {
    setSelected(prev =>
      prev.includes(loopId) ? prev.filter(id => id !== loopId) : [...prev, loopId]
    );
  };

  const handleFinish = async () => {
    if (selected.length < 3) {
      setError('Please select at least 3 loops to continue.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { currentUser } = getAuth();
      if (!currentUser) {
        setError('User not logged in.');
        setSaving(false);
        return;
      }
      await updateDoc(doc(db, 'users', currentUser.uid), {
        joinedLoops: selected,
        onboarded: true
      });
      // After successfully updating Firestore, end the function.
      return;
    } catch (e) {
      setError('Error saving. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6a3cff" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>Step 6 of 6</Text>
      <Text style={styles.title}>Join your Loops</Text>
      <Text style={styles.subtitle}>We recommend joining at least 3 campus communities to get the best experience!</Text>
      <FlatList
        data={loops}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.loopItem, selected.includes(item.id) && styles.selectedLoop]}
            onPress={() => handleToggle(item.id)}
          >
            <Text style={styles.loopText}>{item.name}</Text>
            {selected.includes(item.id) && <Text style={styles.check}>✓</Text>}
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingBottom: 18 }}
        style={{ alignSelf: 'stretch', maxHeight: 320 }}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[
          styles.button,
          (selected.length < 3 || saving) && styles.buttonDisabled
        ]}
        onPress={handleFinish}
        disabled={selected.length < 3 || saving}
      >
        <Text style={styles.buttonText}>
          {saving ? 'Joining...' : 'Finish'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, justifyContent:'center', alignItems:'center', padding:26, backgroundColor:'#fff' },
  stepText: { color:'#a3a3a3', fontSize:14, marginBottom:14 },
  title: { fontSize:27, fontWeight:'bold', textAlign:'center', marginBottom:10, color:'#3e206a' },
  subtitle: { fontSize:16, color:'#888', marginBottom:18, textAlign:'center' },
  loopItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#f7f6fd',
    padding: 17, borderRadius: 9, marginVertical: 5,
    marginHorizontal: 3
  },
  selectedLoop: { backgroundColor: '#ede9fe' },
  loopText: { fontSize: 17, color: '#392d69', fontWeight: '500' },
  check: { color:'#6a3cff', fontWeight:'bold', fontSize:19 },
  button: { backgroundColor:'#6a3cff', borderRadius:8, paddingVertical:14, width:'100%', maxWidth:340, alignItems:'center', marginTop:16 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color:'#fff', fontWeight:'bold', fontSize:17 },
  error: { color:'#e53935', marginBottom:10, marginTop:8, textAlign:'center' }
});