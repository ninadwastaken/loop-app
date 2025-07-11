// src/screens/ProfileScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase'
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

type Props = NativeStackScreenProps<MainStackParamList, 'MyProfile'>

export default function MyProfileScreen({ navigation }: Props) {
  const uid = auth.currentUser!.uid
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    (async () => {
      const ref = doc(db, 'users', uid)
      const snap = await getDoc(ref)
      if (snap.exists()) {
        setProfile(snap.data())
      }
      setLoading(false)
    })()
  }, [uid])

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.loadingContainer}>
        <Text style={commonStyles.loadingText}>Loading profile…</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        {profile.profilePicUrl ? (
          <Image
            source={{ uri: profile.profilePicUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarPlaceholderText}>
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.displayName}>
            {profile.displayName || profile.username}
          </Text>
          <Text style={styles.username}>@{profile.username}</Text>
        </View>
        <TouchableOpacity
          style={[commonStyles.buttonSecondary, styles.editBtn]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Text style={commonStyles.buttonTextSecondary}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Bio */}
      {profile.bio ? (
        <Text style={styles.bio}>{profile.bio}</Text>
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.karma}</Text>
          <Text style={styles.statLabel}>Karma</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{profile.streak}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {/* Joined Loops */}
      <Text style={styles.sectionTitle}>Your Loops</Text>
      <FlatList
        data={profile.joinedLoops || []}
        keyExtractor={(id: string) => id}
        renderItem={({ item }) => (
          <View style={[styles.loopItem, shadows.sm]}>
            <Text style={styles.loopItemText}>{item}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: spacing.lg }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: typography.xxl,
    color: colors.textSecondary,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  displayName: {
    fontSize: typography.xl,
    fontWeight: '700' as any,
    color: colors.textPrimary,
  },
  username: {
    fontSize: typography.sm,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  editBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bio: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.lg,
    fontWeight: '600' as any,
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: typography.sm,
    color: colors.textSecondary,
  },
  sectionTitle: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    fontSize: typography.md,
    fontWeight: '600' as any,
    color: colors.textPrimary,
  },
  loopItem: {
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  loopItemText: {
    color: colors.textPrimary,
    fontSize: typography.md,
  },
})
