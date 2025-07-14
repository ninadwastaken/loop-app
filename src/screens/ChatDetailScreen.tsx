import React, { useEffect, useState, useLayoutEffect } from 'react'
import {
  SafeAreaView,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore'
import { db, auth } from '../../config/firebase'
import {
  commonStyles,
  colors,
  typography,
  spacing
} from '../utils/styles'

type Message = {
  id: string
  senderId: string
  text: string
  sentAt: any
}

export default function ChatDetailScreen({
  route,
  navigation
}: any) {
  const { threadId } = route.params as { threadId: string }
  const uid = auth.currentUser!.uid

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  // Subscribe to message subcollection
  useEffect(() => {
    const msgsRef = collection(db, 'dms', threadId, 'messages')
    const q = query(msgsRef, orderBy('sentAt', 'asc'))

    const unsub = onSnapshot(q, snap => {
      const arr: Message[] = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as any)
      }))
      setMessages(arr)
    }, err => console.warn('msg snap err:', err))

    return unsub
  }, [threadId])

  // Optional: set header title to other user(s)
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Chat'
    })
  }, [navigation])

  const sendMessage = async () => {
    if (!input.trim()) return
    const msgsRef = collection(db, 'dms', threadId, 'messages')
    await addDoc(msgsRef, {
      senderId: uid,
      text: input.trim(),
      sentAt: serverTimestamp()
    })
    // also update parent thread's lastMessage + lastSentAt
    const threadRef = doc(db, 'dms', threadId)
    await updateDoc(threadRef, {
      lastMessage: input.trim(),
      lastSentAt: serverTimestamp()
    })
    setInput('')
  }

  const renderItem = ({ item }: { item: Message }) => {
    const isMe = item.senderId === uid
    return (
      <View
        style={[
          styles.msgContainer,
          isMe ? styles.myMsg : styles.theirMsg
        ]}
      >
        <Text style={styles.msgText}>{item.text}</Text>
        <Text style={styles.msgMeta}>
          {item.sentAt?.toDate().toLocaleTimeString()}
        </Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        inverted       // newest at bottom
      />

      {/* Input row */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.textTertiary}
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={sendMessage}
          >
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  msgContainer: {
    maxWidth: '75%',
    padding: spacing.sm,
    borderRadius: spacing.sm,
    marginVertical: spacing.xs
  },
  myMsg: {
    backgroundColor: colors.primary,
    alignSelf: 'flex-end'
  },
  theirMsg: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start'
  },
  msgText: {
    color: colors.textPrimary,
    fontSize: typography.md
  },
  msgMeta: {
    color: colors.textTertiary,
    fontSize: typography.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.xs / 2
  },
  inputRow: {
    flexDirection: 'row',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.background
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    color: colors.textPrimary
  },
  sendBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm
  },
  sendText: {
    color: colors.accent,
    fontSize: typography.lg
  }
})
