// src/screens/LoopsScreen.tsx
import React, { useState, useEffect, useMemo } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import debounce from 'lodash.debounce'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db, auth } from '../../firebase'
import { Loop } from '../types'

import {
  commonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../utils/styles'

export default function LoopsScreen() {
  const [allLoops, setAllLoops]       = useState<Loop[]>([])
  const [filteredLoops, setFiltered]  = useState<Loop[]>([])
  const [joined, setJoined]           = useState<string[]>([])
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState('')

  const uid     = auth.currentUser!.uid
  const userRef = doc(db, 'users', uid)

  // 1️⃣ Load loops & joined loops
  useEffect(() => {
    ;(async () => {
      try {
        const loopSnap = await getDocs(collection(db, 'loops'))
        const loops = loopSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Loop, 'id'>),
        }))
        setAllLoops(loops)
        setFiltered(loops)

        const userSnap = await getDoc(userRef)
        setJoined(userSnap.exists() ? userSnap.data().joinedLoops || [] : [])
      } catch (err) {
        console.warn('Error loading loops/user:', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // 2️⃣ Debounced search
  const debouncedFilter = useMemo(
    () =>
      debounce((text: string) => {
        if (!text) return setFiltered(allLoops)

        const lower = text.toLowerCase()
        const filtered = allLoops.filter(loop =>
          // search in name or description (or tags if you add them)
          loop.name.toLowerCase().includes(lower) ||
          (loop.description || '')
            .toLowerCase()
            .includes(lower)
        )
        setFiltered(filtered)
      }, 300),
    [allLoops]
  )

  const onSearchChange = (text: string) => {
    setQuery(text)
    debouncedFilter(text)
  }

  // 3️⃣ Toggle join/leave
  const toggleJoin = async (loopId: string) => {
    try {
      if (joined.includes(loopId)) {
        await updateDoc(userRef, { joinedLoops: arrayRemove(loopId) })
        setJoined(prev => prev.filter(id => id !== loopId))
      } else {
        await updateDoc(userRef, { joinedLoops: arrayUnion(loopId) })
        setJoined(prev => [...prev, loopId])
      }
    } catch (err) {
      console.warn('Error toggling join:', err)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    // ❶ Now we wrap everything in SafeAreaView
    <SafeAreaView style={commonStyles.container}>
      {/* 🔍 Search bar + Filters pill */}
      <View style={[styles.searchBar, shadows.sm]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search loops..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.8}>
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {filteredLoops.length === 0 ? (
        <View style={commonStyles.centerContent}>
          <Text style={styles.emptyText}>no loops found.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLoops}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: spacing.md }}
          renderItem={({ item }) => {
            const isJoined = joined.includes(item.id)
            return (
              <View style={[styles.item, shadows.sm]}>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.desc}>{item.description}</Text>
                  )}
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
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: typography.md,
  },
  filterBtn: {
    marginLeft: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  filterText: {
    color: colors.white,
    fontSize: typography.sm,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: typography.md,
  },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flex: 1, paddingRight: spacing.sm },
  name: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  desc: {
    color: colors.textSecondary,
    fontSize: typography.sm,
    marginTop: spacing.xs,
  },
  btn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  join: { backgroundColor: colors.success },
  leave: { backgroundColor: colors.error },
  btnText: { color: colors.white, fontWeight: '600' },
})
