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
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  collection,
  getDocs,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  writeBatch,
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

export default function NewPostScreen() {
  const [loops, setLoops] = useState<Loop[]>([])
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const uid = auth.currentUser!.uid

  // load all loops once
  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDocs(collection(db, 'loops'))
        const arr = snap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        }))
        setLoops(arr)
      } catch (err) {
        console.warn('Error loading loops:', err)
        Alert.alert('Error', 'Could not load loops')
      }
    })()
  }, [])

  const handleSubmit = async () => {
    if (!selectedLoop) {
      return Alert.alert('Pick a Loop', 'Choose a loop to post in')
    }
    if (!content.trim()) {
      return Alert.alert('Empty Post', 'Type something to post')
    }

    setSubmitting(true)
    try {
      // 1) Create post in loops/{loopId}/posts
      const loopPostsRef = collection(db, 'loops', selectedLoop, 'posts')
      const newPostRef = await addDoc(loopPostsRef, {
        content: content.trim(),
        posterId: uid,
        anon: false,
        karma: 0,
        createdAt: serverTimestamp(),
      })

      // 2) Mirror into users/{uid}/posts/{postId}
      const userPostsRef = doc(
        db,
        'users',
        uid,
        'posts',
        newPostRef.id
      )
      await setDoc(userPostsRef, {
        loopId: selectedLoop,
        postId: newPostRef.id,
        content: content.trim(),
        posterId: uid,
        anon: false,
        karma: 0,
        createdAt: serverTimestamp(),
      })

      setContent('')
      Alert.alert('Posted!', 'Your post is live 🔥')
      // optionally navigate back or reset fields…
    } catch (err) {
      console.warn('Error creating post:', err)
      Alert.alert('Error', 'Could not create post')
    } finally {
      setSubmitting(false)
    }
  }

  // still loading loops?
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
        style={[styles.button, submitting && { opacity: 0.5 } ]}
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
  },
  loopSelected: {
    backgroundColor: colors.accent,
  },
  loopUnselected: {
    backgroundColor: colors.surfaceDark,
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
