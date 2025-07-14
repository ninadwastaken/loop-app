// src/utils/chat.ts
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from '../../config/firebase';

// Thread metadata we’ll surface in the list
export interface ThreadMeta {
  id: string;
  userIds: string[];         // [me, otherUser]
  lastMessage: string;
  lastTimestamp: Timestamp;
  otherUserId: string;       // convenience field
}

/**
 * Find an existing thread between current user + otherUid,
 * or create one if none exists. Returns the threadId.
 */
export async function getOrCreateThread(otherUid: string): Promise<string> {
  const me = auth.currentUser!.uid;
  const threadsRef = collection(db, 'dmThreads');

  // 1) Look for any thread that includes me
  const q = query(
    threadsRef,
    where('userIds', 'array-contains', me),
    orderBy('lastTimestamp', 'desc')
  );
  const snap = await getDocs(q);
  // 2) Filter locally for one that also has otherUid
  const existing = snap.docs.find(d => {
    const uids = d.data().userIds as string[];
    return uids.includes(otherUid);
  });
  if (existing) {
    return existing.id;
  }

  // 3) None found → create new thread doc
  const newThread = await addDoc(threadsRef, {
    userIds:        [me, otherUid],
    lastMessage:    '',
    lastTimestamp:  serverTimestamp(),
  });
  return newThread.id;
}

/**
 * Listen in real‐time to all threads that include me.
 * Calls onUpdate with a sorted array of ThreadMeta.
 * Returns an unsubscribe function.
 */
export function subscribeToThreads(onUpdate: (threads: ThreadMeta[]) => void) {
  const me = auth.currentUser!.uid;
  const threadsRef = collection(db, 'dmThreads');
  const q = query(
    threadsRef,
    where('userIds', 'array-contains', me),
    orderBy('lastTimestamp', 'desc')
  );

  const unsub = onSnapshot(q, snapshot => {
    const metas: ThreadMeta[] = snapshot.docs.map(d => {
      const data = d.data() as any;
      // pick the other user id
      const other = (data.userIds as string[]).find(uid => uid !== me)!;
      return {
        id:            d.id,
        userIds:       data.userIds,
        lastMessage:   data.lastMessage,
        lastTimestamp: data.lastTimestamp,
        otherUserId:   other,
      };
    });
    onUpdate(metas);
  });

  return unsub;
}
