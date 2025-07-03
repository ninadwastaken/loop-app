import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loop } from '../types';
import {
  commonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
} from '../screens/styles'; // Adjust the path if needed

export default function NewPostScreen() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [selectedLoop, setSelectedLoop] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const uid = auth.currentUser?.uid!;

  useEffect(() => {
    (async () => {
      try {
        const loopSnap = await getDocs(collection(db, 'loops'));
        setLoops(loopSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
      } catch (err) {
        console.warn('Error loading loops:', err);
        Alert.alert('Error', 'Could not load loops');
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!selectedLoop) {
      return Alert.alert('Pick a Loop', 'Choose which loop to post in');
    }
    if (!content.trim()) {
      return Alert.alert('Empty Post', 'Type something first');
    }
    setSubmitting(true);
    try {
      const postRef = doc(collection(db, 'loops', selectedLoop, 'posts'));
      await setDoc(postRef, {
        content: content.trim(),
        posterId: uid,
        anon: false,
        karma: 0,
        createdAt: serverTimestamp(),
      });
      setContent('');
      Alert.alert('Posted!', 'Your post went live 🔥');
    } catch (err) {
      console.warn('Error creating post:', err);
      Alert.alert('Error', 'Could not create post');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loops.length) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Choose a Loop</Text>
      <FlatList
        data={loops}
        horizontal
        keyExtractor={item => item.id}
        contentContainerStyle={styles.loopList}
        renderItem={({ item }) => {
          const isSel = item.id === selectedLoop;
          return (
            <TouchableOpacity
              style={[
                styles.loopBadge,
                isSel ? styles.loopSelected : styles.loopUnselected,
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
          );
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Write a post..."
        placeholderTextColor={colors.inputPlaceholder}
        value={content}
        onChangeText={setContent}
        multiline
      />

      <TouchableOpacity
        style={styles.button}
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
  );
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
  },
  loopTextSel: {
    color: colors.black,
    fontWeight: '500', // fixed
  },
  loopTextUnsel: {
    color: colors.white,
    fontWeight: '500', // fixed
  },
  input: {
    flex: 1,
    backgroundColor: colors.inputBackground,
    color: colors.inputText,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
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
    fontWeight: '600', // fixed
    fontSize: typography.md,
  },
});
