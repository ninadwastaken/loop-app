// src/screens/HomeScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  doc,
  getDoc as getLoopDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  getDoc as getVoteDoc,
  collectionGroup,
  limit,
  where
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import {
  commonStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../utils/styles';
import { Ionicons } from '@expo/vector-icons';
import { voteOnPost } from '../utils/voteService'

// Post shape
interface Post {
  id: string;
  loopId: string;
  loopName: string;
  content: string;
  posterId: string;
  anon: boolean;
  karma: number;
  createdAt: Timestamp;
  upvotes: number;
  downvotes: number;
}

export default function HomeScreen() {
  const [posts, setPosts]       = useState<Post[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh] = useState(false);
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({})

  const uid = auth.currentUser?.uid!;
  const nav = useNavigation<any>();

  // 1) Load posts helper
  const loadPosts = useCallback(async () => {
    try {
      // fetch joined loops
      const userSnap = await getLoopDoc(doc(db, 'users', uid));
      const joinedLoops: string[] = userSnap.exists()
        ? (userSnap.data().joinedLoops as string[])
        : [];

      if (!joinedLoops.length) {
        setPosts([]);
        return;
      }

      // Firestore limits 'in' queries to 10 items, so chunk if needed
      const chunkSize = 10;
      let all: Post[] = [];
      for (let i = 0; i < joinedLoops.length; i += chunkSize) {
        const chunk = joinedLoops.slice(i, i + chunkSize);
        const q = query(
          collectionGroup(db, 'posts'),
          where('loopId', 'in', chunk),
          orderBy('createdAt', 'desc'),
          limit(30)
        );
        const snap = await getDocs(q);
        snap.forEach(d => all.push({
          id: d.id,
          ...(d.data() as any)
        }));
      }

      // sort newest-first
      all.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setPosts(all);
    } catch (err) {
      console.warn('Error loading home posts:', err);
    }
  }, [uid]);

  // 2) on mount & on focus (so header button can refresh)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await loadPosts();
        setLoading(false);
      })();
    }, [loadPosts])
  );

  useEffect(() => {
    async function loadVotes() {
      const votes: Record<string, number> = {};
      await Promise.all(posts.map(async post => {
        const voteSnap = await getVoteDoc(
          doc(db, 'loops', post.loopId, 'posts', post.id, 'votes', uid)
        );
        votes[post.id] = voteSnap.exists() ? (voteSnap.data().value as number) : 0;
      }));
      setUserVotes(votes);
    }
    // Only load votes on initial load or manual refresh
    if (loading) {
      loadVotes();
    }
  }, [loading, uid]);

  // helper to cast a vote and refresh posts
  const handleVote = useCallback(
    async (loopId: string, postId: string, vote: 1 | -1 | 0) => {
      if (voting[postId]) return;
      setVoting(v => ({ ...v, [postId]: true }));

      // Optimistic update for userVotes and posts
      setUserVotes(prevUV => {
        const oldVote = prevUV[postId] ?? 0;
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if (p.id !== postId) return p;
            const upChange = (vote === 1 ? 1 : 0) - (oldVote === 1 ? 1 : 0);
            const downChange =
              (vote === -1 ? 1 : 0) - (oldVote === -1 ? 1 : 0);
            return {
              ...p,
              upvotes: p.upvotes + upChange,
              downvotes: p.downvotes + downChange,
            };
          })
        );
        return { ...prevUV, [postId]: vote };
      });

      try {
        await voteOnPost(loopId, postId, uid, vote);
      } catch (err) {
        console.warn('handleVote error:', err);
        // Optionally handle error
      } finally {
        setVoting(v => ({ ...v, [postId]: false }));
      }
    },
    [uid, loadPosts, voting]
  );

  // 3) pull-to-refresh
  const onRefresh = async () => {
    setRefresh(true);
    await loadPosts();
    setRefresh(false);
  };

  // 4) configure header
  useEffect(() => {
    nav.setOptions({
      headerStyle: {
        backgroundColor: colors.background,
        shadowColor: 'transparent',
      },
      headerTitle: () => <Text style={styles.headerTitle}>Loop</Text>,
      headerRight: () => (
        <TouchableOpacity
          onPress={() => nav.navigate('MyProfile')}
          style={styles.headerButton}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      ),
    });
  }, [nav]);

  // 5) loading / empty states
  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!posts.length) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={styles.emptyText}>
          no posts yet. join some loops or add a post!
        </Text>
      </SafeAreaView>
    );
  }

  // 6) render list
  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        renderItem={({ item }) => {
          const dateStr = item.createdAt
            .toDate()
            .toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });
          return (
            <TouchableOpacity
              style={[styles.card, shadows.sm]}
              onPress={() =>
                nav.navigate('PostDetail', {
                  loopId: item.loopId,
                  postId: item.id,
                })
              }
            >
              {/* Loop Label */}
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.loopName}</Text>
              </View>

              {/* Content */}
              <Text style={styles.content}>{item.content}</Text>

              {/* Meta Row */}
              <View style={styles.metaRow}>
                {/* Vote controls */}
                <View style={styles.voteRow}>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Up arrow tapped for', item.id);
                      handleVote(item.loopId, item.id, userVotes[item.id] === 1 ? 0 : 1);
                    }}
                    disabled={voting[item.id]}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={20}
                      color={userVotes[item.id] === 1 ? colors.accent : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <Text style={styles.voteCount}>
                    {item.upvotes - item.downvotes}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      console.log('Down arrow tapped for', item.id);
                      handleVote(item.loopId, item.id, userVotes[item.id] === -1 ? 0 : -1);
                    }}
                    disabled={voting[item.id]}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={20}
                      color={userVotes[item.id] === -1 ? colors.error : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
                {/* Timestamp */}
                <View style={[styles.metaItem, { marginLeft: spacing.lg / 2 }]}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{dateStr}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  headerTitle: {
    fontSize: typography.xxl,
    fontWeight: typography.semibold as any,
    color: colors.primary,
  },
  headerButton: {
    marginRight: spacing.md,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    textAlign: 'center',
    padding: spacing.md,
  },

  list: {
    padding: spacing.md,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  tag: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  tagText: {
    color: colors.background,
    fontSize: typography.sm,
    fontWeight: typography.semibold as any,
  },

  content: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: typography.semibold as any,
    marginBottom: spacing.md,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: spacing.xs / 2,
    color: colors.textSecondary,
    fontSize: typography.sm,
  },

  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteCount: {
    marginHorizontal: spacing.sm,
    fontSize: typography.md,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
