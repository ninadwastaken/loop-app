// utils/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

export const signup = async (
  email: string,
  password: string,
  username: string,
  interests: string[] = []
) => {
  const userCred = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const uid = userCred.user.uid;
  await setDoc(doc(db, 'users', uid), {
    email,
    username,
    interests,
    joinedLoops: [],
    karma: 0,
    streak: 0,
    createdAt: serverTimestamp(),
  });
  return userCred.user;
};

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);
