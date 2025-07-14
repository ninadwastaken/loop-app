import React, { useState, useEffect } from 'react'
import { 
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { auth, db } from '../../config/firebase'
import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  arrayUnion 
} from 'firebase/firestore'
import { commonStyles, colors, spacing, typography, borderRadius } from '../utils/styles'

const CATEGORIES = [
  { label: 'Dorm', value: 'dorm' },
  { label: 'Confessions', value: 'confessions' },
  { label: 'Study Help', value: 'study_help' },
  { label: 'Events', value: 'events' },
  { label: 'General', value: 'general' },
]

const COLOR_SWATCHES = [
  '#00d4ff', '#7b68ee', '#ff6b6b', '#feca57', '#5f27cd'
]

export default function CreateLoopScreen({ navigation }: any) {
  const uid = auth.currentUser!.uid

  // form state
  const [name, setName]           = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState(CATEGORIES[0].value)
  const [color, setColor]         = useState(COLOR_SWATCHES[0])
  const [avatarUrl, setAvatarUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter a loop name.')
    setSubmitting(true)
    try {
      // 1) Create new loop doc
      const loopsRef = collection(db, 'loops')
      const newLoopRef = doc(loopsRef)
      await setDoc(newLoopRef, {
        name: name.trim(),
        description: description.trim(),
        category,
        color,
        avatarUrl: avatarUrl.trim() || null,
        createdBy: uid,
        createdAt: serverTimestamp(),
        members: [uid], // initial member is creator
        postCount: 0, // starts empty
      })

      // 2) Add to user.joinedLoops
      const userRef = doc(db, 'users', uid)
      await updateDoc(userRef, {
        joinedLoops: arrayUnion(newLoopRef.id)
      })

      Alert.alert('Loop created!', `"${name.trim()}" is now live.`)
      navigation.goBack()
    } catch (err) {
      console.warn('Create loop error:', err)
      Alert.alert('Error', 'Could not create loop.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.md }}>
        <Text style={styles.label}>Loop Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Maple Dorm Chat"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Description (optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="A short blurb about your loop"
          multiline
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={category}
            onValueChange={v => setCategory(v)}
            style={styles.picker}
          >
            {CATEGORIES.map(c => (
              <Picker.Item key={c.value} label={c.label} value={c.value} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Accent Color</Text>
        <View style={styles.swatchRow}>
          {COLOR_SWATCHES.map(c => (
            <TouchableOpacity
              key={c}
              style={[
                styles.swatch,
                { backgroundColor: c },
                color === c && styles.swatchSelected
              ]}
              onPress={() => setColor(c)}
            />
          ))}
        </View>

        <Text style={styles.label}>Avatar URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={avatarUrl}
          onChangeText={setAvatarUrl}
          placeholder="https://..."
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[commonStyles.buttonPrimary, { marginTop: spacing.lg }]}
          onPress={handleCreate}
          disabled={submitting}
        >
          <Text style={commonStyles.buttonText}>
            {submitting ? 'Creating…' : 'Create Loop'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  label: {
    color: colors.textPrimary,
    fontSize: typography.md,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    color: colors.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  picker: {
    color: colors.textPrimary,
    height: 44,
  },
  swatchRow: {
    flexDirection: 'row',
    marginVertical: spacing.sm,
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
})