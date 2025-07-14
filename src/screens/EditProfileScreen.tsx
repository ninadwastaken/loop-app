// src/screens/EditProfileScreen.tsx

import React, { useState, useEffect } from 'react'
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { auth, db, storage } from '../../config/firebase'
import {
  commonStyles,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} from '../utils/styles'
import { MainStackParamList } from '../types/navigation'

// Screen props type: no route params expected
type Props = NativeStackScreenProps<MainStackParamList, 'EditProfile'>

export default function EditProfileScreen({ navigation }: Props) {
  // Current user's UID and Firestore doc ref
  const uid = auth.currentUser!.uid
  const userRef = doc(db, 'users', uid)

  // Local form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio]                 = useState('')
  const [avatarUri, setAvatarUri]     = useState<string | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [saving, setSaving]           = useState(false)

  // 1️⃣ Load existing user info on mount
  useEffect(() => {
    ;(async () => {
      try {
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const data = snap.data() as any
          // If you've stored displayName or profilePicUrl previously, load them.
          setDisplayName(data.displayName ?? data.username ?? '')
          setBio(data.bio ?? '')
          setAvatarUri(data.profilePicUrl ?? null)
        }
      } catch (err) {
        console.warn('Error fetching profile:', err)
      }
    })()
  }, [])

  // 2️⃣ Pick an image from media library
  const pickImage = async () => {
    // Ask permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to update avatar.')
      return
    }

    // Launch the picker
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,           // let user crop
      aspect: [1, 1],                // square crop
      quality: 0.7,
    })

    // TYPE GUARD: handle cancellation
    if (pickerResult.canceled) {
      // User tapped “Cancel”
      return
    }

    // Now TS knows pickerResult.assets exists (SDK 48+)
    const asset = pickerResult.assets?.[0]
    if (asset?.uri) {
      setAvatarUri(asset.uri)
    }
  }

  // 3️⃣ Upload the local image to Firebase Storage
  const uploadAvatar = async (uri: string): Promise<string | null> => {
    setUploading(true)
    try {
      // Fetch the binary data
      const response = await fetch(uri)
      const blob     = await response.blob()

      // Create a reference in storage
      const storageRef = ref(storage, `avatars/${uid}.jpg`)
      await uploadBytes(storageRef, blob)

      // Get public URL
      const url = await getDownloadURL(storageRef)
      return url
    } catch (err) {
      console.warn('Avatar upload error:', err)
      Alert.alert('Upload failed', 'Could not upload avatar.')
      return null
    } finally {
      setUploading(false)
    }
  }

  // 4️⃣ Save all profile changes to Firestore
  const handleSave = async () => {
    setSaving(true)
    try {
      let profilePicUrl: string | null = null

      // If user picked a new local image, upload it
      if (avatarUri && !avatarUri.startsWith('https://')) {
        const url = await uploadAvatar(avatarUri)
        if (url) profilePicUrl = url
      }

      // Build the update payload
      const payload: any = {
        displayName: displayName.trim(),
        bio: bio.trim(),
      }
      if (profilePicUrl) {
        payload.profilePicUrl = profilePicUrl
      }

      // Push updates
      await updateDoc(userRef, payload)

      // Go back to previous screen (e.g. Profile)
      navigation.goBack()
    } catch (err) {
      console.warn('Save profile error:', err)
      Alert.alert('Save failed', 'Could not save profile changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <View style={styles.container}>
        {/* Avatar preview & change button */}
        <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
          {uploading ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarPlaceholderText}>+</Text>
            </View>
          )}
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>

        {/* Display Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
          />
        </View>

        {/* Bio Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio…"
            placeholderTextColor={colors.textTertiary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[commonStyles.buttonPrimary, styles.saveBtn]}
          onPress={handleSave}
          disabled={uploading || saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={commonStyles.buttonText}>Save Profile</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.md,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: typography.xxxl,
    color: colors.textSecondary,
  },
  changePhotoText: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontWeight: '600' as any,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontSize: typography.sm,
  },
  input: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    color: colors.textPrimary,
    ...shadows.sm,
  },
  bioInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: spacing.lg,
  },
})
