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
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
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

// Post shape
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

  // 1) Load posts helper
  const loadPosts = useCallback(async () => {
    try {
      // fetch joined loops
      const userSnap = await getDoc(doc(db, 'users', uid));
      const joinedLoops: string[] = userSnap.exists()
        ? (userSnap.data().joinedLoops as string[])
        : [];

      if (!joinedLoops.length) {
        setPosts([]);
        return;
      }

      // gather posts across loops
      const all: Post[] = [];
      for (const loopId of joinedLoops) {
        const q    = query(
          collection(db, 'loops', loopId, 'posts'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        snap.forEach((d) =>
          all.push({ id: d.id, loopId, ...(d.data() as any) })
        );
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
                <Text style={styles.tagText}>{item.loopId}</Text>
              </View>

              {/* Content */}
              <Text style={styles.content}>{item.content}</Text>

              {/* Meta Row */}
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="heart-outline" size={16} color={colors.error} />
                  <Text style={styles.metaText}>{item.karma}</Text>
                </View>
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
    fontSize: typography.md,
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
});
