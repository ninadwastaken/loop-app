// src/screens/LoopsScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loop } from '../types';

export default function LoopsScreen() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid!;
  const userRef = doc(db, 'users', uid);

  useEffect(() => {
    (async () => {
      try {
        // Fetch all loops
        const loopSnap = await getDocs(collection(db, 'loops'));
        const allLoops = loopSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        })) as Loop[];
        setLoops(allLoops);

        // Fetch current user's joinedLoops
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setJoined(data.joinedLoops || []);
        } else {
          setJoined([]);
        }
      } catch (err) {
        console.warn('Error loading loops/user:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleJoin = async (loopId: string) => {
    try {
      if (joined.includes(loopId)) {
        await updateDoc(userRef, { joinedLoops: arrayRemove(loopId) });
        setJoined(prev => prev.filter(id => id !== loopId));
      } else {
        await updateDoc(userRef, { joinedLoops: arrayUnion(loopId) });
        setJoined(prev => [...prev, loopId]);
      }
    } catch (err) {
      console.warn('Error joining/leaving loop:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </SafeAreaView>
    );
  }

  if (!loading && loops.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>no loops available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={loops}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isJoined = joined.includes(item.id);
          return (
            <View style={styles.item}>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.desc}>{item.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.btn, isJoined ? styles.leave : styles.join]}
                onPress={() => toggleJoin(item.id)}
              >
                <Text style={styles.btnText}>
                  {isJoined ? 'leave' : 'join'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
  },
  list: {
    padding: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  info: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  desc: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  join: {
    backgroundColor: '#10b981',
  },
  leave: {
    backgroundColor: '#ef4444',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
