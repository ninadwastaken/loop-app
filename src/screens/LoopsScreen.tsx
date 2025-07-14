// src/screens/LoopsScreen.tsx
import React, { useState, useEffect, useMemo, useLayoutEffect, useCallback } from 'react'
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
  onSnapshot,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import { Loop } from '../types'
import {
  commonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../utils/styles'

export default function LoopsScreen({ navigation }: any) {
  const uid = auth.currentUser!.uid
  const userRef = doc(db, 'users', uid)

  const [allLoops, setAllLoops] = useState<Loop[]>([])
  const [filteredLoops, setFilteredLoops] = useState<Loop[]>([])
  const [joined, setJoined] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  //
  // 1) Add "+" button in header to navigate to CreateLoop screen
  //
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Loops',
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: spacing.md }}
          onPress={() => navigation.navigate('CreateLoop')}
        >
          <Text style={{ color: colors.primary, fontSize: typography.lg }}>＋</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation])

  //
  // 2) Real-time subscription to loops collection
  //
  useEffect(() => {
    // Subscribe to loops
    const loopsCol = collection(db, 'loops')
    const unsubscribeLoops = onSnapshot(
      loopsCol,
      snapshot => {
        const loops = snapshot.docs.map(d => ({
          id: d.id,
          ...(d.data() as Omit<Loop, 'id'>),
        }))
        // update both allLoops + filtered
        setAllLoops(loops)
        setFilteredLoops(loops)
        setLoading(false)
      },
      err => {
        console.warn('Error listening loops:', err)
        setLoading(false)
      }
    )

    // Fetch user’s joinedLoops once
    ;(async () => {
      try {
        const userSnap = await getDoc(userRef)
        const jl = userSnap.exists() ? (userSnap.data().joinedLoops as string[]) || [] : []
        setJoined(jl)
      } catch (err) {
        console.warn('Error fetching joined loops:', err)
      }
    })()

    return () => {
      unsubscribeLoops()
    }
  }, [userRef])

  //
  // 3) Debounced search
  //
  const debouncedFilter = useMemo(
    () =>
      debounce((text: string) => {
        if (!text) {
          setFilteredLoops(allLoops)
          return
        }
        const lower = text.toLowerCase()
        const fil = allLoops.filter(
          l =>
            l.name.toLowerCase().includes(lower) ||
            (l.description || '').toLowerCase().includes(lower)
        )
        setFilteredLoops(fil)
      }, 300),
    [allLoops]
  )

  const onSearchChange = (text: string) => {
    setQuery(text)
    debouncedFilter(text)
  }

  //
  // 4) Join / Leave loop
  //
  const toggleJoin = useCallback(
    async (loopId: string) => {
      try {
        if (joined.includes(loopId)) {
          await updateDoc(userRef, { joinedLoops: arrayRemove(loopId) })
          setJoined(prev => prev.filter(i => i !== loopId))
        } else {
          await updateDoc(userRef, { joinedLoops: arrayUnion(loopId) })
          setJoined(prev => [...prev, loopId])
        }
      } catch (err) {
        console.warn('Error toggling join:', err)
      }
    },
    [joined, userRef]
  )

  //
  // 5) Loading state
  //
  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Search Bar */}
      <View style={[styles.searchBar, shadows.sm]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search loops..."
          placeholderTextColor={colors.textTertiary}
          value={query}
          onChangeText={onSearchChange}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Text style={styles.filterText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* No Loops */}
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
                  {item.description ? (
                    <Text style={styles.desc}>{item.description}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={[styles.btn, isJoined ? styles.leave : styles.join]}
                  onPress={() => toggleJoin(item.id)}
                >
                  <Text style={styles.btnText}>{isJoined ? 'leave' : 'join'}</Text>
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
  info: {
    flex: 1,
    paddingRight: spacing.sm,
  },
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
  join: {
    backgroundColor: colors.success,
  },
  leave: {
    backgroundColor: colors.error,
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
  },
})