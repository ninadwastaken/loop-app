// src/screens/InterestsScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  commonStyles,
} from '../utils/styles';

// All available interests
const ALL_INTERESTS = [
  'coding','photography','music','art',
  'gaming','reading','coffee','travel',
];

// Interest → loops mapping
const INTEREST_LOOPS: Record<string,string[]> = {
  coding:       ['cs101','cs-101-help','hacknyu-club','js-study-group'],
  photography: ['cs101','photo-club','camera-gear-talk'],
  music:        ['cs101','music-society','open-mic-nights'],
  art:          ['cs101','design-dorm','sketch-sessions'],
  gaming:       ['cs101','nyu-gamers','dota-dorm-wars','smash-sundays'],
  reading:      ['cs101','book-buddies','lit-discussion'],
  coffee:       ['cs101','coffee-culture','midnight-brew'],
  travel:       ['cs101','wanderlust-club','study-abroad'],
};

// Always-join loops
const WILDCARD_LOOPS = ['campus-memes','weekly-events'];

export default function InterestsScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const uid = auth.currentUser!.uid;

  const toggle = (interest: string) => {
    setSelected(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const onContinue = async () => {
    if (selected.length < 3 || selected.length > 5) return;

    const userRef = doc(db, 'users', uid);

    // 1) Save interests
    await updateDoc(userRef, { interests: selected });

    // 2) Build set of loops to auto-join
    const autoJoins = new Set<string>();
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const { dormLoopId, majorLoopId } = snap.data() as any;
      dormLoopId  && autoJoins.add(dormLoopId);
      majorLoopId && autoJoins.add(majorLoopId);
    }
    selected.forEach(i =>
      (INTEREST_LOOPS[i] || []).forEach(loopId => autoJoins.add(loopId))
    );
    WILDCARD_LOOPS.forEach(loopId => autoJoins.add(loopId));

    // 3) Bulk update joinedLoops
    if (autoJoins.size) {
      await updateDoc(userRef, {
        joinedLoops: arrayUnion(...Array.from(autoJoins)),
      });
    }

    // 4) NO manual navigation reset here.
    //    App.tsx will detect profile.interests.length > 0
    //    and switch into the main Tabs flow automatically.
  };

  return (
    <SafeAreaView style={commonStyles.safeArea}>
      <View style={[commonStyles.container, styles.centeredContainer]}>
        <Text style={styles.title}>what are you into?</Text>

        <View style={styles.grid}>
          {ALL_INTERESTS.map(interest => {
            const isSel = selected.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                onPress={() => toggle(interest)}
                style={[
                  styles.chip,
                  isSel && styles.chipSelected,
                  shadows.sm,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSel && styles.chipTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            selected.length >= 3 &&
              selected.length <= 5 &&
              styles.buttonActive,
            shadows.md,
          ]}
          onPress={onContinue}
          disabled={!(selected.length >= 3 && selected.length <= 5)}
        >
          <Text style={styles.buttonText}>
            continue ({selected.length}/5)
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  title: {
    color: colors.textPrimary,
    fontSize: typography.xxl,
    fontWeight: typography.semibold,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
    margin: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.md,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: typography.semibold,
  },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginHorizontal: spacing.lg,
  },
  buttonActive: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    color: colors.buttonText,
    fontSize: typography.md,
    fontWeight: typography.semibold,
  },
});
