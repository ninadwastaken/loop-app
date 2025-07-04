import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Loop } from '../types';
import {
  commonStyles,
  colors,
  spacing,
  typography,
  borderRadius,
} from '../utils/styles'; // Adjust the path if needed

export default function LoopsScreen() {
  const [loops, setLoops] = useState<Loop[]>([]);
  const [joined, setJoined] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const uid = auth.currentUser?.uid!;
  const userRef = doc(db, 'users', uid);

  useEffect(() => {
    (async () => {
      try {
        const loopSnap = await getDocs(collection(db, 'loops'));
        const allLoops = loopSnap.docs.map(d => ({
          id: d.id,
          ...(d.data() as any),
        })) as Loop[];
        setLoops(allLoops);

        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setJoined(data.joinedLoops || []);
        } else {
          setJoined([]);
        }
      } catch (err) {
        console.warn('Error loading loops/user:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleJoin = async (loopId: string) => {
    try {
      if (joined.includes(loopId)) {
        await updateDoc(userRef, { joinedLoops: arrayRemove(loopId) });
        setJoined(prev => prev.filter(id => id !== loopId));
      } else {
        await updateDoc(userRef, { joinedLoops: arrayUnion(loopId) });
        setJoined(prev => [...prev, loopId]);
      }
    } catch (err) {
      console.warn('Error joining/leaving loop:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!loading && loops.length === 0) {
    return (
      <SafeAreaView style={commonStyles.centerContent}>
        <Text style={styles.emptyText}>no loops available</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <FlatList
        data={loops}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isJoined = joined.includes(item.id);
          return (
            <View style={styles.item}>
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
                <Text style={styles.btnText}>
                  {isJoined ? 'leave' : 'join'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: spacing.md,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: typography.md,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  info: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.md,
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
});
