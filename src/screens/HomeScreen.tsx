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
  Share,
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
  where,
  startAfter,
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
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [voting, setVoting] = useState<Record<string, boolean>>({})
  const [feedType, setFeedType] = useState<'trending' | 'recent' | 'explore'>('recent');

  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [allLoopIds, setAllLoopIds] = useState<string[]>([]);

  const uid = auth.currentUser?.uid!;
  const nav = useNavigation<any>();

  useEffect(() => {
    async function fetchAllLoops() {
      const snap = await getDocs(collection(db, 'loops'));
      setAllLoopIds(snap.docs.map(d => d.id));
    }
    fetchAllLoops();
  }, []);

  // 1) Load posts helper
  const loadPosts = useCallback(async (loadMore = false) => {
    try {
      // fetch joined loops
      const userSnap = await getLoopDoc(doc(db, 'users', uid));
      const joinedLoops: string[] = userSnap.exists()
        ? (userSnap.data().joinedLoops as string[])
        : [];

      if (!joinedLoops.length) {
        if (loadMore) {
          setHasMore(false);
        } else {
          setPosts([]);
        }
        return;
      }

      // Firestore limits 'in' queries to 10 items, so chunk if needed
      const chunkSize = 10;
      let all: Post[] = [];
      let lastFetchedDoc = null;
      for (let i = 0; i < joinedLoops.length; i += chunkSize) {
        const chunk = joinedLoops.slice(i, i + chunkSize);
        let q: ReturnType<typeof query> | undefined;
        if (feedType === 'recent') {
          q = query(
            collectionGroup(db, 'posts'),
            where('loopId', 'in', chunk),
            orderBy('createdAt', 'desc'),
            ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
            limit(15)
          );
        } else if (feedType === 'trending') {
          q = query(
            collectionGroup(db, 'posts'),
            where('loopId', 'in', chunk),
            orderBy('score', 'desc'),
            ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
            limit(15)
          );
        } else if (feedType === 'explore') {
          // Get up to 10 loops the user has NOT joined
          const notJoinedLoops = allLoopIds.filter(id => !joinedLoops.includes(id));
          if (notJoinedLoops.length > 0) {
            q = query(
              collectionGroup(db, 'posts'),
              where('loopId', 'in', notJoinedLoops.slice(0, 10)), // Firestore allows max 10
              orderBy('score', 'desc'),
              ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
              limit(15)
            );
          } else {
            // Fallback: show trending from all loops
            q = query(
              collectionGroup(db, 'posts'),
              orderBy('score', 'desc'),
              ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
              limit(15)
            );
          }
        }
        if (!q) continue;
        const snap = await getDocs(q);
        if (!lastFetchedDoc && !snap.empty) {
          lastFetchedDoc = snap.docs[snap.docs.length - 1];
        }
        snap.forEach(d => all.push({
          id: d.id,
          ...(d.data() as any)
        }));
      }

      // Explore fallback: if no posts from not-joined loops, show all trending posts
      if (feedType === 'explore' && all.length === 0) {
        const q2 = query(
          collectionGroup(db, 'posts'),
          orderBy('score', 'desc'),
          ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
          limit(15)
        );
        if (!q2) return;
        const snap2 = await getDocs(q2);
        if (!lastFetchedDoc && !snap2.empty) {
          lastFetchedDoc = snap2.docs[snap2.docs.length - 1];
        }
        snap2.forEach(d => all.push({
          id: d.id,
          ...(d.data() as any)
        }));
      }

      if (feedType === 'recent') {
        // sort newest-first only for recent
        all.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      }
      // For trending/explore, leave as returned by Firestore (ordered by score)

      // Deduplicate by post id (important for collectionGroup chunking)
      const seen = new Set();
      all = all.filter(post => {
        if (seen.has(post.id)) return false;
        seen.add(post.id);
        return true;
      });

      if (loadMore) {
        setPosts(prev => [...prev, ...all]);
      } else {
        setPosts(all);
      }
      setLastDoc(lastFetchedDoc);
      setHasMore(all.length === 15); // true if loaded full page
    } catch (err) {
      console.warn('Error loading home posts:', err);
    }
  }, [uid, feedType, lastDoc, allLoopIds]);

  // 2) on mount & on focus (so header button can refresh)
  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await loadPosts();
        setLoading(false);
      })();
    }, [loadPosts])
  );

  // Reload feed whenever tab changes
  useEffect(() => {
    setLastDoc(null);
    setHasMore(true);
  }, [feedType]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPosts();
      setLoading(false);
    })();
  }, [feedType]);

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

  // Load poster display names for share messages
  useEffect(() => {
    if (!posts.length) return;
    async function fetchNames() {
      const uniqueIds = Array.from(new Set(posts.map(p => p.posterId)));
      const missing = uniqueIds.filter(id => !(id in userNames));
      if (!missing.length) return;
      const newMapping: Record<string, string> = {};
      await Promise.all(
        missing.map(async id => {
          const userSnap = await getLoopDoc(doc(db, 'users', id));
          if (userSnap.exists()) {
            const data = userSnap.data() as any;
            // Use displayName or fallback to UID
            newMapping[id] = data.displayName || data.username || id;
          }
        })
      );
      if (Object.keys(newMapping).length) {
        setUserNames(prev => ({ ...prev, ...newMapping }));
      }
    }
    fetchNames();
  }, [posts]);

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

  // Share handler (moved here so hooks order is stable)
  const handleShare = useCallback(
    async (post: Post) => {
      // Use display name if available, fallback to posterId
      const posterName = userNames[post.posterId] || post.posterId;
      const message =
        `"${post.content}"\n— p/${posterName} in l/${post.loopName}\n\n` +
        `Open Loop and search “l/${post.loopName}” to see this post.`;
      try {
        await Share.share({ message });
      } catch (err) {
        console.warn('Share failed:', err);
      }
    },
    [userNames]
  );

  // 3) pull-to-refresh
  const onRefresh = async () => {
    setLastDoc(null);
    setHasMore(true);
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
      <SafeAreaView style={[commonStyles.centerContent, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!posts.length) {
    return (
      <SafeAreaView style={[commonStyles.centerContent, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyText}>
          {feedType === 'explore'
            ? "Nothing to explore! You're in every loop or there are no hot posts yet."
            : 'no posts yet. join some loops or add a post!'}
        </Text>
      </SafeAreaView>
    );
  }

  // 6) render list
  return (
    <SafeAreaView style={[commonStyles.container, { backgroundColor: colors.background }]}>
      <View style={{ flexDirection: 'row', marginTop: 8, marginBottom: 10, alignSelf: 'center' }}>
        {['Trending', 'Recent', 'Explore'].map(type => (
          <TouchableOpacity
            key={type}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: feedType === type.toLowerCase() ? colors.accent : colors.surface,
              borderRadius: 24,
              marginRight: 8,
            }}
            onPress={() => setFeedType(type.toLowerCase() as any)}
          >
            <Text style={{
              color: feedType === type.toLowerCase() ? colors.background : colors.textSecondary,
              fontWeight: 'bold'
            }}>{type}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={posts}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            setLoadingMore(true);
            loadPosts(true).finally(() => setLoadingMore(false));
          }
        }}
        onEndReachedThreshold={0.6}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={colors.accent} /> : null}
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
                {/* Display loop with 'l/' prefix */}
                <Text style={styles.tagText}>{`l/${item.loopName}`}</Text>
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
                <TouchableOpacity
                  style={{ marginLeft: spacing.lg }}
                  onPress={() => handleShare(item)}
                >
                  <Ionicons
                    name="share-social-outline"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
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
