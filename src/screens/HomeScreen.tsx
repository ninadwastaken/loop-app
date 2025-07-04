// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../firebase';

interface Post {
  id: string;
  loopId: string;
  content: string;
  posterId: string;
  anon: boolean;
  karma: number;
  createdAt: Timestamp;
}

export default function HomeScreen() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);

  const uid = auth.currentUser?.uid!;
  const nav = useNavigation<any>();

  // 1) Extract load logic to reuse on mount & pull-to-refresh
  const loadPosts = useCallback(async () => {
    try {
      // fetch user profile
      const userRef  = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const joinedLoops: string[] = userSnap.exists()
        ? (userSnap.data().joinedLoops as string[])
        : [];

      if (joinedLoops.length === 0) {
        // no loops joined → empty list
        setPosts([]);
        return;
      }

      // gather all posts across every joined loop
      const allPosts: Post[] = [];
      for (const loopId of joinedLoops) {
        const postsRef = collection(db, 'loops', loopId, 'posts');
        const q        = query(postsRef, orderBy('createdAt', 'desc'));
        const snap     = await getDocs(q);
        snap.docs.forEach(d => {
          allPosts.push({
            id:       d.id,
            loopId,
            ...(d.data() as any)
          });
        });
      }

      // sort by newest first
      allPosts.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setPosts(allPosts);
    } catch (err) {
      console.warn('Error loading home posts:', err);
    }
  }, [uid]);

  // 2) On mount
  useEffect(() => {
    (async () => {
      await loadPosts();
      setLoading(false);
    })();
  }, [loadPosts]);

  // 3) Pull to refresh
  const onRefresh = async () => {
    setRefresh(true);
    await loadPosts();
    setRefresh(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </SafeAreaView>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.emptyText}>
          no posts yet. join some loops or add a post!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              nav.navigate('PostDetail', {
                loopId: item.loopId,
                postId: item.id
              })
            }
          >
            <Text style={styles.loopLabel}>{item.loopId}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.meta}>
              ❤️ {item.karma} •{' '}
              {item.createdAt.toDate().toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center:    { flex: 1, backgroundColor: '#000', justifyContent:'center', alignItems:'center' },
  emptyText: { color: '#888', textAlign:'center', padding:20 },
  list:      { padding: 16 },
  card:      {
    backgroundColor: '#1e1e1e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  loopLabel: { color: '#00d4ff', fontWeight:'600', marginBottom:4 },
  content:   { color: '#fff', marginBottom:8 },
  meta:      { color: '#888', fontSize:12 }
});
