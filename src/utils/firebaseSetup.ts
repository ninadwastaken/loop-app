// src/utils/firebaseSetup.ts
import { 
  DocumentReference, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion 
} from 'firebase/firestore'
import type { Firestore }        from 'firebase/firestore'
import type { User }             from 'firebase/auth'

/**
 * Ensure the Firestore user doc exists, then
 * append the expoToken (deduped) if present.
 */
export async function bootstrapUser(
  db: Firestore,
  user: User,
  expoToken: string | null
): Promise<void> {
  const userRef: DocumentReference = doc(db, 'users', user.uid)
  const snap = await getDoc(userRef)

  // 1) Create base profile if brand-new
  if (!snap.exists()) {
    await setDoc(userRef, {
      email:       user.email ?? '',
      username:    '',
      interests:   [],
      joinedLoops: [],
      karma:       0,
      streak:      0,
      createdAt:   serverTimestamp(),
      onboarded:   false,
      expoTokens:  [],       // init array so subsequent arrayUnion works
    })
  }

  // 2) Save push token if we have one
  if (expoToken) {
    try {
      await updateDoc(userRef, {
        expoTokens: arrayUnion(expoToken)
      })
    } catch (err) {
      console.warn('[bootstrapUser] could not save push token', err)
    }
  }
}