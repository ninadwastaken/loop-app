// src/screens/ChatScreen.tsx
import React, { useEffect, useState } from 'react'
import {
  FlatList,
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import {
  commonStyles,
  colors,
  typography,
  spacing,
} from '../utils/styles'

export default function ChatScreen({ navigation }: any) {
  const uid = auth.currentUser!.uid

  // DM threads
  const [threads, setThreads] = useState<any[] | null>(null)
  // username cache
  const [usernames, setUsernames] = useState<Record<string, string>>({})

  // 1) Subscribe to your DM threads
  useEffect(() => {
    const q = query(
      collection(db, 'dms'),
      where('userIds', 'array-contains', uid),
      orderBy('lastSentAt', 'desc')
    )

    const unsub = onSnapshot(
      q,
      snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
        setThreads(docs)
      },
      err => {
        console.warn('DM snapshot error:', err)
        setThreads([])
      }
    )

    return unsub
  }, [uid])

  // 2) Whenever threads load (or change), fetch missing usernames
  useEffect(() => {
    if (!threads) return

    // collect all peer IDs from every thread
    const peerIds = threads
      .flatMap(t => t.userIds as string[])
      .filter(id => id !== uid)

    // filter out those we already have cached
    const missing = Array.from(new Set(peerIds)).filter(id => !usernames[id])
    if (missing.length === 0) return

    // fetch each missing profile
    missing.forEach(async id => {
      try {
        const snap = await getDoc(doc(db, 'users', id))
        const username = snap.exists() ? snap.data().username || id : id
        setUsernames(prev => ({ ...prev, [id]: username }))
      } catch {
        setUsernames(prev => ({ ...prev, [id]: id }))
      }
    })
  }, [threads, uid, usernames])

  // 3) Loading state
  if (threads === null) {
    return (
      <SafeAreaView style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    )
  }

  // 4) No threads
  if (threads.length === 0) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={styles.emptyText}>no conversations yet</Text>
      </SafeAreaView>
    )
  }

  // 5) Render threads
  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={threads}
        keyExtractor={t => t.id}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => {
          // map UIDs → usernames, fallback to "..." while loading
          const others = (item.userIds as string[]).filter(i => i !== uid)
          const displayName = others
            .map(id => usernames[id] ?? '…') // show ellipsis until we fetch
            .join(', ')

          return (
            <TouchableOpacity
              style={[commonStyles.card, { marginBottom: spacing.sm }]}
              onPress={() =>
                navigation.navigate('ChatDetail', { threadId: item.id })
              }
            >
              <Text
                style={{
                  fontSize: typography.lg,
                  color: colors.textPrimary,
                }}
              >
                {displayName}
              </Text>
              <Text
                style={{
                  fontSize: typography.sm,
                  color: colors.textSecondary,
                  marginTop: spacing.xs,
                }}
              >
                {item.lastMessage ?? '—'}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.md,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
})
