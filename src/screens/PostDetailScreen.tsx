// src/screens/PostDetailScreen.tsx
import React, {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
} from 'react'
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  Firestore,
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import {
  colors,
  spacing,
  typography,
  borderRadius,
  commonStyles,
} from '../utils/styles'
import { voteOnPost } from '../utils/voteService'
import Ionicons from '@expo/vector-icons/Ionicons'

// ──────────────────────────
// Types
// ──────────────────────────
interface ThreadedReply {
  id: string
  replierId: string
  username: string
  content: string
  anon: boolean
  karma: number
  createdAt: any
  parentId: string | null
  children: ThreadedReply[]
}

interface PostData {
  content: string
  posterId: string
  posterName: string
  anon: boolean
  karma: number
  createdAt: any
  loopId: string
  loopName: string
}

// ──────────────────────────
// Helpers
// ──────────────────────────

// Build nested replies from flat list
function buildTree(list: ThreadedReply[]): ThreadedReply[] {
  const map = new Map<string, ThreadedReply>()
  const roots: ThreadedReply[] = []
  list.forEach(r => {
    r.children = []
    map.set(r.id, r)
  })
  list.forEach(r => {
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children.push(r)
    } else {
      roots.push(r)
    }
  })
  return roots
}

// Recursively adjust replies’ karma
function adjustReplies(
  list: ThreadedReply[],
  targetId: string,
  delta: number
): ThreadedReply[] {
  return list.map(r => {
    const children = adjustReplies(r.children, targetId, delta)
    if (r.id === targetId) {
      return { ...r, karma: r.karma + delta, children }
    }
    return { ...r, children }
  })
}

// Fetch display name / username by UID
async function fetchUsername(uid: string) {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return 'unknown'
  const data = snap.data() as any
  return data.displayName || data.username || 'unknown'
}

// Fetch loop name by ID
async function fetchLoopName(loopId: string) {
  const snap = await getDoc(doc(db, 'loops', loopId))
  if (!snap.exists()) return loopId
  return (snap.data() as any).name || loopId
}

// ──────────────────────────
// Component
// ──────────────────────────
export default function PostDetailScreen({ route, navigation }: any) {
  const { loopId, postId } = route.params as {
    loopId: string
    postId: string
  }
  const uid = auth.currentUser!.uid

  const [loading, setLoading] = useState(true)
  const [post, setPost] = useState<PostData | null>(null)
  const [tree, setTree] = useState<ThreadedReply[]>([])
  const [flatListData, setFlatListData] = useState<any[]>([])
  const [localVotes, setLocalVotes] = useState<Record<string, number>>({})
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(
    null
  )
  const [submitting, setSubmitting] = useState(false)

  // Toggle upvote/downvote (accepts voteValue: 1 for up, -1 for down)
  const toggleVote = async (
    parentPath: string,
    targetId: string,
    voteValue: 1 | -1
  ) => {
    // Determine loopId from parentPath ("loops/{loopId}/...")
    const [, loopId] = parentPath.split('/')
    const prevVote = localVotes[targetId] ?? 0
    const newVote = prevVote === voteValue ? 0 : voteValue

    // optimistic update
    setLocalVotes(p => ({ ...p, [targetId]: newVote }))
    if (targetId === postId) {
      setPost(p =>
        p ? { ...p, karma: p.karma + (newVote - prevVote) } : p
      )
    } else {
      setTree(t => adjustReplies(t, targetId, newVote - prevVote))
    }

    try {
      // For replies, parentPath includes replies path but voteService only needs loopId and post/reply ID.
      // We'll treat targetId as the postId for top-level or replyId for replies.
      if (parentPath.includes('/replies/')) {
        // write or delete vote doc
        const voteRef = doc(
          db,
          parentPath,
          'votes',
          uid
        )
        const replyRef = doc(db, parentPath)
        if (newVote === 0) {
          await deleteDoc(voteRef)
        } else {
          await setDoc(voteRef, { value: newVote })
        }
        // update reply upvotes/downvotes
        const upChange = (newVote === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0)
        const downChange = (newVote === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0)
        await updateDoc(replyRef, {
          upvotes: increment(upChange),
          downvotes: increment(downChange),
        })
      } else {
        await voteOnPost(loopId, targetId, uid, newVote)
      }
    } catch (err) {
      console.warn('Vote error:', err)
      Alert.alert('Error', 'Could not update vote.')
      // rollback optimistic update
      setLocalVotes(p => ({ ...p, [targetId]: prevVote }))
      if (targetId === postId) {
        setPost(p =>
          p ? { ...p, karma: p.karma - (newVote - prevVote) } : p
        )
      } else {
        setTree(t => adjustReplies(t, targetId, prevVote - newVote))
      }
    }
  }

  // Load post info + replies
  const loadAll = useCallback(async () => {
    try {
      // 1) Fetch loop name
      const loopName = await fetchLoopName(loopId)

      // 2) Fetch post
      const postRef = doc(db, 'loops', loopId, 'posts', postId)
      const postSnap = await getDoc(postRef)
      if (!postSnap.exists()) {
        Alert.alert('Not found', 'This post was deleted')
        navigation.goBack()
        return
      }
      const pd = postSnap.data() as any
      const posterName = await fetchUsername(pd.posterId)
      const createdAt: Date = pd.createdAt.toDate()
      // build date-only string
      const dateStr = createdAt.toLocaleDateString()
      setPost({
        content: pd.content,
        posterId: pd.posterId,
        posterName,
        anon: pd.anon,
        karma: pd.karma,
        createdAt: pd.createdAt,
        loopId,
        loopName,
      })

      // record your vote on the post
      const pvSnap = await getDocs(
        collection(db, 'loops', loopId, 'posts', postId, 'votes')
      )
      // If user has voted, get the value (1 or -1), else 0
      let postVoteValue = 0
      for (let d of pvSnap.docs) {
        if (d.id === uid) {
          const v = d.data().value
          postVoteValue = typeof v === 'number' ? v : 1
        }
      }
      setLocalVotes(p => ({
        ...p,
        [postId]: postVoteValue,
      }))

      // 3) Fetch all replies (flat)
      const repSnap = await getDocs(
        query(
          collection(db, 'loops', loopId, 'posts', postId, 'replies'),
          orderBy('createdAt', 'asc')
        )
      )
      const flat: ThreadedReply[] = []
      for (let d of repSnap.docs) {
        const data = d.data() as any
        const uname = await fetchUsername(data.replierId)
        const rv = await getDocs(
          collection(
            db,
            'loops',
            loopId,
            'posts',
            postId,
            'replies',
            d.id,
            'votes'
          )
        )
        // If user has voted, get the value (1 or -1), else 0
        let replyVoteValue = 0
        for (let v of rv.docs) {
          if (v.id === uid) {
            const val = v.data().value
            replyVoteValue = typeof val === 'number' ? val : 1
          }
        }
        setLocalVotes(p => ({
          ...p,
          [d.id]: replyVoteValue,
        }))
        flat.push({
          id: d.id,
          replierId: data.replierId,
          username: uname,
          content: data.content,
          anon: data.anon,
          karma: data.karma,
          createdAt: data.createdAt,
          parentId: data.parentId ?? null,
          children: [],
        })
      }

      // 4) Build tree & flatList
      const tree = buildTree(flat)
      setTree(tree)

      // flatten: [ post, ... replies ]
      const arr: any[] = []
      arr.push({ type: 'post', data: { ...pd, posterName, loopName, createdAt: dateStr } })

      function walk(nodes: ThreadedReply[], depth = 0) {
        nodes.forEach(r => {
          const date = r.createdAt.toDate().toLocaleDateString()
          arr.push({ type: 'reply', data: r, depth, date })
          if (r.children.length) walk(r.children, depth + 1)
        })
      }
      walk(tree)
      setFlatListData(arr)
    } catch (err) {
      console.warn('Load detail error:', err)
      Alert.alert('Error', 'Could not load post/comments.')
    } finally {
      setLoading(false)
    }
  }, [loopId, postId, uid, navigation])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // Post a comment or reply
  const handleComment = async () => {
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      await addDoc(
        collection(db, 'loops', loopId, 'posts', postId, 'replies'),
        {
          replierId: uid,
          content: commentText.trim(),
          anon: false,
          karma: 0,
          createdAt: serverTimestamp(),
          parentId: replyTo?.id ?? null,
        }
      )
      setCommentText('')
      setReplyTo(null)
      await loadAll()
    } catch (err) {
      console.warn('Comment error:', err)
      Alert.alert('Error', 'Could not post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  // Loading fallback
  if (loading || !post) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator color={colors.accent} size="large" />
      </SafeAreaView>
    )
  }

  // Render each line
  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'post') {
      const p: any = item.data
      return (
        <View style={styles.postCard}>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('UserProfile', { userId: p.posterId })
            }
          >
            <Text style={styles.posterName}>{p.posterName}</Text>
          </TouchableOpacity>
          <Text style={styles.loopName}>#{p.loopName}</Text>
          <Text style={styles.postContent}>{p.content}</Text>
          <Text style={styles.postMeta}>{p.createdAt}</Text>
          <View style={styles.voteRow}>
            <TouchableOpacity
              onPress={() =>
                toggleVote(`loops/${loopId}/posts/${postId}`, postId, 1)
              }
            >
              <Ionicons
                name="arrow-up-circle"
                size={24}
                color={localVotes[postId] === 1 ? colors.accent : colors.textTertiary}
              />
            </TouchableOpacity>
            <Text style={styles.voteCount}>{p.karma}</Text>
            <TouchableOpacity
              onPress={() =>
                toggleVote(`loops/${loopId}/posts/${postId}`, postId, -1)
              }
              style={{ marginLeft: spacing.sm }}
            >
              <Ionicons
                name="arrow-down-circle"
                size={24}
                color={localVotes[postId] === -1 ? colors.accent : colors.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    // It's a reply
    const { data: r, depth, date } = item
    return (
      <View style={{ marginLeft: depth * spacing.md, marginBottom: spacing.sm }}>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('UserProfile', { userId: r.replierId })
          }
        >
          <Text style={styles.posterName}>{r.username}</Text>
        </TouchableOpacity>
        <View style={styles.replyCard}>
          <Text style={styles.replyContent}>{r.content}</Text>
          <Text style={styles.replyMeta}>{date}</Text>
          <View style={styles.replyActions}>
            <View style={styles.voteRow}>
              <TouchableOpacity
                onPress={() =>
                  toggleVote(
                    `loops/${loopId}/posts/${postId}/replies/${r.id}`,
                    r.id,
                    1
                  )
                }
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={20}
                  color={localVotes[r.id] === 1 ? colors.accent : colors.textTertiary}
                />
              </TouchableOpacity>
              <Text style={styles.voteCount}>{r.karma}</Text>
              <TouchableOpacity
                onPress={() =>
                  toggleVote(
                    `loops/${loopId}/posts/${postId}/replies/${r.id}`,
                    r.id,
                    -1
                  )
                }
                style={{ marginLeft: spacing.sm }}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={20}
                  color={localVotes[r.id] === -1 ? colors.accent : colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() =>
                setReplyTo({ id: r.id, content: r.content })
              }
            >
              <Text style={styles.replyLink}>reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={flatListData}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />

      {/* “replying to” banner */}
      {replyTo && (
        <View style={styles.replyingBanner}>
          <Text style={styles.replyingText}>
            replying to: "{replyTo.content}"
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={styles.cancelLink}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input row */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={
            replyTo ? 'Reply to comment…' : 'Add a comment…'
          }
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleComment}
          disabled={submitting}
        >
          <Text style={styles.sendText}>
            {submitting ? '…' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

// ──────────────────────────
// Styles
// ──────────────────────────
const styles = StyleSheet.create({
  posterName: {
    color: colors.accent,
    fontWeight: '600',
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  loopName: {
    color: colors.primary,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '500',
  },
  postCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  postContent: {
    color: colors.textPrimary,
    fontSize: typography.md,
    marginVertical: spacing.sm,
  },
  postMeta: {
    color: colors.textTertiary,
    fontSize: typography.sm,
  },
  voteText: {
    fontSize: typography.md,
    marginTop: spacing.sm,
    color: colors.textTertiary,
  },
  replyCard: {
    backgroundColor: colors.surfaceDark,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  replyContent: {
    color: colors.textPrimary,
    fontSize: typography.sm,
  },
  replyMeta: {
    color: colors.textTertiary,
    fontSize: typography.xs,
    marginTop: spacing.xs,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  replyLink: {
    color: colors.accent,
    fontSize: typography.sm,
  },
  replyingBanner: {
    position: 'absolute',
    bottom: 80,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  replyingText: {
    color: colors.textPrimary,
    fontSize: typography.sm,
    flex: 1,
  },
  cancelLink: {
    color: colors.accent,
    fontSize: typography.md,
    marginLeft: spacing.sm,
  },
  inputRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  sendBtn: {
    width: 40,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendText: {
    color: colors.black,
    fontSize: typography.lg,
    fontWeight: '600',
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  voteCount: {
    marginHorizontal: spacing.xs,
    fontSize: typography.md,
    color: colors.textPrimary,
  },
})
