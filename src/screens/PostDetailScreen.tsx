import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  commonStyles,
} from '../screens/styles'; // Adjust path as needed

interface ThreadedReply {
  id: string;
  replierId: string;
  content: string;
  anon: boolean;
  karma: number;
  createdAt: any;
  parentId: string | null;
  children: ThreadedReply[];
}

interface PostData {
  content: string;
  posterId: string;
  anon: boolean;
  karma: number;
  createdAt: any;
}

// build nested tree
function buildTree(list: ThreadedReply[]): ThreadedReply[] {
  const map = new Map<string, ThreadedReply>();
  const roots: ThreadedReply[] = [];
  list.forEach(r => {
    r.children = [];
    map.set(r.id, r);
  });
  list.forEach(r => {
    if (r.parentId && map.has(r.parentId)) {
      map.get(r.parentId)!.children.push(r);
    } else if (r.parentId === null) {
      roots.push(r);
    }
  });
  return roots;
}

// helper to apply a karma delta to a reply in the tree
function adjustReplies(
  list: ThreadedReply[],
  targetId: string,
  delta: number
): ThreadedReply[] {
  return list.map(r => {
    const updatedChildren = adjustReplies(r.children, targetId, delta);
    if (r.id === targetId) {
      return { ...r, karma: r.karma + delta, children: updatedChildren };
    } else {
      return { ...r, children: updatedChildren };
    }
  });
}

export default function PostDetailScreen({ route, navigation }: any) {
  const { loopId, postId } = route.params;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<ThreadedReply[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; content: string } | null>(null);
  const [localVotes, setLocalVotes] = useState<Record<string, boolean>>({});

  const toggleVote = async (parentPath: string, targetId: string) => {
    const uid = auth.currentUser!.uid;
    const votesColPath = `${parentPath}/votes`;
    const voteRef = doc(db, votesColPath, uid);
    const parentRef = doc(db, parentPath);
    const hasVoted = !!localVotes[targetId];
    const delta = hasVoted ? -1 : 1;

    setLocalVotes(prev => ({ ...prev, [targetId]: !hasVoted }));
    if (targetId === postId) {
      setPost(p => p && { ...p, karma: p.karma + delta });
    } else {
      setReplies(prev => adjustReplies(prev, targetId, delta));
    }

    try {
      if (hasVoted) {
        await deleteDoc(voteRef);
        await updateDoc(parentRef, { karma: increment(-1) });
      } else {
        await setDoc(voteRef, { value: 1 });
        await updateDoc(parentRef, { karma: increment(1) });
      }
    } catch (err) {
      console.warn('Vote error:', err);
      Alert.alert('Error', 'Could not update vote');
      setLocalVotes(prev => ({ ...prev, [targetId]: hasVoted }));
      if (targetId === postId) {
        setPost(p => p && { ...p, karma: p.karma - delta });
      } else {
        setReplies(prev => adjustReplies(prev, targetId, -delta));
      }
    }
  };

  const loadAll = useCallback(async () => {
    try {
      const postRef = doc(db, 'loops', loopId, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (!postSnap.exists()) {
        Alert.alert('Not found', 'This post was deleted');
        navigation.goBack();
        return;
      }
      const postData = postSnap.data() as PostData;
      setPost(postData);

      const postVotesSnap = await getDocs(
        collection(db, 'loops', loopId, 'posts', postId, 'votes')
      );
      const votedPost = postVotesSnap.docs.some(
        d => d.id === auth.currentUser!.uid
      );
      setLocalVotes(p => ({ ...p, [postId]: votedPost }));

      const repliesSnap = await getDocs(
        query(
          collection(db, 'loops', loopId, 'posts', postId, 'replies'),
          orderBy('createdAt', 'asc')
        )
      );

      const flat: ThreadedReply[] = [];
      for (const d of repliesSnap.docs) {
        const data = d.data();
        const rid = d.id;
        const replyVotesSnap = await getDocs(
          collection(
            db,
            'loops',
            loopId,
            'posts',
            postId,
            'replies',
            rid,
            'votes'
          )
        );
        const votedReply = replyVotesSnap.docs.some(
          v => v.id === auth.currentUser!.uid
        );
        setLocalVotes(p => ({ ...p, [rid]: votedReply }));

        flat.push({
          id: rid,
          replierId: data.replierId,
          content: data.content,
          anon: data.anon,
          karma: data.karma,
          createdAt: data.createdAt,
          parentId: data.parentId ?? null,
          children: [],
        });
      }

      setReplies(buildTree(flat));
    } catch (err) {
      console.warn('Load detail error:', err);
      Alert.alert('Error', 'Could not load post/comments');
    } finally {
      setLoading(false);
    }
  }, [loopId, postId, navigation]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'loops', loopId, 'posts', postId, 'replies'), {
        replierId: auth.currentUser!.uid,
        content: commentText.trim(),
        anon: false,
        karma: 0,
        createdAt: serverTimestamp(),
        parentId: replyTo?.id ?? null,
      });
      setCommentText('');
      setReplyTo(null);
      await loadAll();
    } catch (err) {
      console.warn('Comment error:', err);
      Alert.alert('Error', 'Could not post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderReply = (reply: ThreadedReply, depth = 0) => (
    <View key={reply.id} style={{ marginLeft: depth * spacing.md, marginBottom: spacing.sm }}>
      <View style={styles.replyCard}>
        <Text style={styles.replyContent}>{reply.content}</Text>
        <TouchableOpacity
          onPress={() =>
            toggleVote(
              `loops/${loopId}/posts/${postId}/replies/${reply.id}`,
              reply.id
            )
          }
        >
          <Text
            style={{
              color: localVotes[reply.id] ? colors.accent : colors.textMuted,
              fontSize: typography.sm,
              marginTop: spacing.xs,
            }}
          >
            ❤️ {reply.karma}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        onPress={() => setReplyTo({ id: reply.id, content: reply.content })}
      >
        <Text style={styles.replyLink}>reply</Text>
      </TouchableOpacity>
      {reply.children.map(c => renderReply(c, depth + 1))}
    </View>
  );

  if (loading || !post) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.postCard}>
        <Text style={styles.postContent}>{post.content}</Text>
        <TouchableOpacity
          onPress={() => toggleVote(`loops/${loopId}/posts/${postId}`, postId)}
        >
          <Text
            style={{
              color: localVotes[postId] ? colors.accent : colors.textMuted,
              marginTop: spacing.sm,
            }}
          >
            ❤️ {post.karma}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.commentsHeader}>Comments</Text>
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: spacing.huge * 1.5 }}
      >
        {replies.map(r => renderReply(r))}
      </ScrollView>

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

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder={replyTo ? 'Reply...' : 'Add a comment...'}
          placeholderTextColor={colors.textMuted}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleComment}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.sendText}>➤</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.md,
  },
  postContent: {
    color: colors.textPrimary,
    fontSize: typography.md,
  },
  commentsHeader: {
    color: colors.textPrimary,
    fontSize: typography.lg,
    fontWeight: '600',
    marginLeft: spacing.md,
    marginTop: spacing.sm,
  },
  list: {
    flex: 1,
    paddingHorizontal: spacing.md,
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
  replyLink: {
    color: colors.accent,
    fontSize: typography.sm,
    marginLeft: spacing.xs,
    marginTop: spacing.xs,
  },
  replyingBanner: {
    position: 'absolute',
    bottom: 70,
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
    color: colors.inputText,
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
});
