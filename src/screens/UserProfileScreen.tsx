// src/screens/UserProfileScreen.tsx
import React, { useEffect, useState } from 'react'
import { SafeAreaView, View, Text, ActivityIndicator } from 'react-native'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { commonStyles, colors, typography, spacing } from '../utils/styles'

export default function UserProfileScreen({ route }: any) {
  const { userId } = route.params as { userId: string }
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const snap = await getDoc(doc(db, 'users', userId))
      if (snap.exists()) setProfile(snap.data())
      setLoading(false)
    })()
  }, [userId])

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={{ color: colors.textSecondary }}>User not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={{ alignItems: 'center', padding: spacing.lg }}>
        <Text style={{ fontSize: typography.xl, fontWeight: '600' }}>
          {profile.displayName || profile.username}
        </Text>
        <Text style={{ color: colors.textSecondary, marginTop: spacing.sm }}>
          {profile.bio || 'No bio yet'}
        </Text>
        {/* You can also show avatar, list of posts, joined loops, etc. */}
      </View>
    </SafeAreaView>
  )
}
