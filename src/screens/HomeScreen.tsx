import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import {
  commonStyles,
  colors,
  typography,
  spacing,
  borderRadius,
} from '../utils/styles.js'; // adjust path as necessary

interface Post {
  id: string;
  loopId: string;
  content: string;
  posterId: string;
  anon: boolean;
  karma: number;
  createdAt: any;
}

export default function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});
  const uid = auth.currentUser?.uid!;
  const navigation = useNavigation<any>();

  const toggleVote = async (loopId: string, postId: string) => {
    const votePath = `loops/${loopId}/posts/${postId}/votes`;
    const voteRef = doc(db, votePath, uid);
    const postRef = doc(db, 'loops', loopId, 'posts', postId);
    const hasVoted = !!localVotes[postId];
    const delta = hasVoted ? -1 : 1;

    setLocalVotes(prev => ({ ...prev, [postId]: !hasVoted }));
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, karma: p.karma + delta } : p))
    );

    try {
      if (hasVoted) {
        await deleteDoc(voteRef);
        await updateDoc(postRef, { karma: increment(-1) });
      } else {
        await setDoc(voteRef, { value: 1 });
        await updateDoc(postRef, { karma: increment(1) });
      }
    } catch (err) {
      console.warn('Vote error:', err);
      setLocalVotes(prev => ({ ...prev, [postId]: hasVoted }));
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, karma: p.karma - delta } : p))
      );
    }
  };

  const loadPosts = useCallback(async () => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      const joinedLoops = userSnap.exists()
        ? (userSnap.data().joinedLoops as string[])
        : [];

      if (joinedLoops.length === 0) {
        setPosts([]);
        setLocalVotes({});
        return;
      }

      const allPosts: Post[] = [];
      for (const loopId of joinedLoops) {
        const postsRef = collection(db, 'loops', loopId, 'posts');
        const q = query(postsRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        snap.docs.forEach(d => {
          allPosts.push({
            id: d.id,
            loopId,
            ...(d.data() as any),
          });
        });
      }

      allPosts.sort(
        (a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()
      );
      setPosts(allPosts);

      const votesState: Record<string, boolean> = {};
      for (const p of allPosts) {
        const voteSnap = await getDocs(
          collection(db, 'loops', p.loopId, 'posts', p.id, 'votes')
        );
        votesState[p.id] = voteSnap.docs.some(d => d.id === uid);
      }
      setLocalVotes(votesState);
    } catch (err) {
      console.warn('Error loading home posts:', err);
    }
  }, [uid]);

  useEffect(() => {
    (async () => {
      await loadPosts();
      setLoading(false);
    })();
  }, [loadPosts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={styles.emptyText}>
          no posts yet. join some loops or add a post!
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('PostDetail', {
                loopId: item.loopId,
                postId: item.id,
              })
            }
          >
            <Text style={styles.loopLabel}>{item.loopId}</Text>
            <Text style={styles.content}>{item.content}</Text>
            <TouchableOpacity onPress={() => toggleVote(item.loopId, item.id)}>
              <Text
                style={[
                  styles.meta,
                  {
                    color: localVotes[item.id]
                      ? colors.accent
                      : colors.textTertiary,
                  },
                ]}
              >
                ❤️ {item.karma}
              </Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: typography.md,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    ...commonStyles.card, // optional if card is reused
  },
  loopLabel: {
    color: colors.accent,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  content: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  meta: {
    fontSize: typography.sm,
  },
});
