// src/screens/NewPostScreen.tsx
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  collection,
  getDoc,
  doc,
  addDoc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  onSnapshot,
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

export default function NewPostScreen() {
  const uid = auth.currentUser!.uid

  const [joinedLoopIds, setJoinedLoopIds] = useState<string[]|null>(null)
  const [loops, setLoops]       = useState<Loop[]>([])
  const [selectedLoop, setSelectedLoop] = useState<string|null>(null)
  const [content, setContent]   = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 1️⃣ Load user doc to get `joinedLoops` with real-time subscription
  useEffect(() => {
    const userDocRef = doc(db, 'users', uid)
    const unsubscribe = onSnapshot(
      userDocRef,
      snap => {
        if (!snap.exists()) {
          Alert.alert('Error', 'Your user record was not found.')
          return
        }
        const data = snap.data()
        const arr = (data.joinedLoops as string[]) || []
        setJoinedLoopIds(arr)
      },
      err => {
        console.warn('Error loading user loops:', err)
        Alert.alert('Error', 'Could not load your joined loops.')
      }
    )
    return () => unsubscribe()
  }, [uid])

  // 2️⃣ Once we have joinedLoopIds, fetch only those loops
  useEffect(() => {
    if (!joinedLoopIds) return

    ;(async () => {
      if (joinedLoopIds.length === 0) {
        setLoops([])
        return
      }
      try {
        // Firestore `in` query supports <= 10 elements;
        // if you have more than 10 you’ll need to batch them.
        const batches: Loop[][] = []
        const chunkSize = 10
        for (let i = 0; i < joinedLoopIds.length; i += chunkSize) {
          const chunk = joinedLoopIds.slice(i, i + chunkSize)
          const q = query(
            collection(db, 'loops'),
            where('__name__', 'in', chunk)
          )
          const snap = await getDocs(q)
          batches.push(
            snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
          )
        }
        // flatten all batches into one array
        setLoops(batches.flat())
      } catch (err) {
        console.warn('Error loading loops:', err)
        Alert.alert('Error', 'Could not load your loops.')
      }
    })()
  }, [joinedLoopIds])

  const handleSubmit = async () => {
    if (!selectedLoop) {
      return Alert.alert('Pick a Loop', 'Choose a loop to post in')
    }
    if (!content.trim()) {
      return Alert.alert('Empty Post', 'Type something to post')
    }

    setSubmitting(true)
    try {
      // 1) Create post under loops/{loopId}/posts
      const loopPostsRef = collection(db, 'loops', selectedLoop, 'posts')
      const selectedLoopObj = loops.find(l => l.id === selectedLoop)
      const loopName = selectedLoopObj ? selectedLoopObj.name : ''
      const newPostRef = await addDoc(loopPostsRef, {
        content: content.trim(),
        posterId: uid,
        anon: false,
        upvotes: 0,
        downvotes: 0,
        loopId: selectedLoop,
        loopName,
        score: 0, // (Optional: will be updated for trending)
        createdAt: serverTimestamp(),
      })

      // 2) Mirror into users/{uid}/userPosts/{postId}
      const userPostsRef = doc(
        db,
        'users',
        uid,
        'userPosts',
        newPostRef.id
      )
      await setDoc(userPostsRef, {
        loopId: selectedLoop,
        loopName,
        postId: newPostRef.id,
        content: content.trim(),
        posterId: uid,
        anon: false,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        createdAt: serverTimestamp(),
      })

      setContent('')
      Alert.alert('Posted!', 'Your post is live 🔥')
    } catch (err) {
      console.warn('Error creating post:', err)
      Alert.alert('Error', 'Could not create post')
    } finally {
      setSubmitting(false)
    }
  }

  // still loading joinedLoopIds?
  if (joinedLoopIds === null) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    )
  }

  // if they’ve joined zero loops
  if (joinedLoopIds.length === 0) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={{ color: colors.textTertiary }}>
          You haven’t joined any loops yet. Join a loop first!
        </Text>
      </SafeAreaView>
    )
  }

  // still fetching the loop docs?
  if (!loops.length) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Choose a Loop</Text>
      <FlatList
        data={loops}
        horizontal
        keyExtractor={it => it.id}
        contentContainerStyle={styles.loopList}
        renderItem={({ item }) => {
          const isSel = item.id === selectedLoop
          return (
            <TouchableOpacity
              style={[
                styles.loopBadge,
                isSel ? styles.loopSelected : styles.loopUnselected,
                shadows.sm,
              ]}
              onPress={() => setSelectedLoop(item.id)}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={styles.loopAvatar} />
              ) : null}
              <Text
                style={[
                  styles.loopText,
                  isSel ? styles.loopTextSel : styles.loopTextUnsel,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Write your post…"
        placeholderTextColor={colors.inputPlaceholder}
        value={content}
        onChangeText={setContent}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, submitting && { opacity: 0.5 }]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.btnText}>Drop It 🔥</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.md,
    marginBottom: spacing.sm,
  },
  loopList: {
    paddingBottom: spacing.md,
  },
  loopBadge: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  loopSelected: {
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  loopUnselected: {
    backgroundColor: colors.surfaceDark,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  loopText: {
    fontSize: typography.sm,
    fontWeight: '500',
  },
  loopTextSel: {
    color: colors.black,
  },
  loopTextUnsel: {
    color: colors.white,
  },
  loopAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginVertical: spacing.lg,
    minHeight: 120,
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.md,
  },
})