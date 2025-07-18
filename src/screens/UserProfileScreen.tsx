// src/screens/UserProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import {
  commonStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../utils/styles'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { MainStackParamList } from '../types/navigation'

type Props = NativeStackScreenProps<MainStackParamList, 'UserProfile'>

interface Post {
  id: string
  content: string
  aura: number
  createdAt: any
  loopName?: string
  loopId?: string
}

export default function UserProfileScreen({ route }: Props) {
  const { userId } = route.params
  const me = auth.currentUser!.uid
  const isMe = me === userId

  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [refreshing, setRefreshing] = useState(false)

  // 1️⃣ Load profile data + follow status
  const loadProfile = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'users', userId))
      if (!snap.exists()) {
        setProfile(null)
        return
      }
      const data = snap.data()
      setProfile(data)

      // check if current user follows them
      const mySnap = await getDoc(doc(db, 'users', me))
      const myData = mySnap.exists() ? mySnap.data() : {}
      const myFollows: string[] = myData.following || []
      setFollowing(myFollows.includes(userId))
    } catch (err) {
      console.warn('Error loading profile:', err)
      Alert.alert('Error', 'Could not load user profile.')
    }
  }, [userId, me])

  // 2️⃣ Load their posts
  const loadPosts = useCallback(async () => {
    try {
      const q = query(
        collection(db, 'users', userId, 'userPosts'),
        orderBy('createdAt', 'desc')
      )
      const snap = await getDocs(q)
      const arr: Post[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any),
      }))
      setPosts(arr)
    } catch (err) {
      console.warn('Error loading user posts:', err)
    }
  }, [userId])

  // 3️⃣ Combined refresh (for pull‐to‐refresh)
  const refreshAll = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([loadProfile(), loadPosts()])
    setRefreshing(false)
  }, [loadProfile, loadPosts])

  // 4️⃣ Initial mount — only once!
  useEffect(() => {
    (async () => {
      await Promise.all([loadProfile(), loadPosts()])
      setLoading(false)
    })()
  }, [loadProfile, loadPosts])

  // 5️⃣ Follow / unfollow
  const toggleFollow = async () => {
    try {
      const myRef = doc(db, 'users', me)
      if (following) {
        await updateDoc(myRef, { following: arrayRemove(userId) })
      } else {
        await updateDoc(myRef, { following: arrayUnion(userId) })
      }
      setFollowing(!following)
    } catch (err) {
      console.warn('Follow error:', err)
      Alert.alert('Error', 'Could not update follow status.')
    }
  }

  // Loading spinner on first mount
  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    )
  }

  // No such user
  if (!profile) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={styles.emptyText}>User not found</Text>
      </SafeAreaView>
    )
  }

  const {
    displayName,
    username,
    bio,
    profilePicUrl,
    aura = 0,
    streak = 0,
  } = profile

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        {profilePicUrl ? (
          <Image source={{ uri: profilePicUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.avatarInitial}>
              {(displayName || username)?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.name}>{displayName || username}</Text>
          <Text style={styles.handle}>@{username}</Text>
          {bio ? (
            <Text style={styles.bio}>{bio}</Text>
          ) : (
            <Text style={styles.bioPlaceholder}>No bio yet</Text>
          )}
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, following && styles.unfollowBtn]}
            onPress={toggleFollow}
          >
            <Text
              style={[
                styles.followBtnText,
                following && styles.unfollowBtnText,
              ]}
            >
              {following ? 'Unfollow' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{aura}</Text>
          <Text style={styles.statLabel}>Aura</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Recent Posts with pull-to-refresh */}
      <Text style={styles.sectionTitle}>Recent Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        refreshing={refreshing}
        onRefresh={refreshAll}
        contentContainerStyle={{ padding: spacing.md }}
        ListEmptyComponent={
          <Text style={styles.emptyPosts}>No posts yet…</Text>
        }
        renderItem={({ item }) => (
          <View style={[styles.postCard, shadows.sm]}>
            <Text style={styles.postContent}>{item.content}</Text>
            <Text style={styles.postMeta}>
              {item.loopName ? `in ${item.loopName} • ` : ''}
              {item.createdAt?.toDate().toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: typography.xxxl,
    color: colors.textSecondary,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  name: {
    fontSize: typography.xxl,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  handle: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  bio: {
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  bioPlaceholder: {
    color: colors.textTertiary,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  followBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignSelf: 'center',
  },
  unfollowBtn: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  unfollowBtnText: {
    color: colors.primary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.surfaceDark,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  statLabel: {
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginLeft: spacing.md,
  },
  emptyPosts: {
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.textTertiary,
  },
  postCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  postContent: {
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  postMeta: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    textAlign: 'right',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.md,
  },
})
