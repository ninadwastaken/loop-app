// src/utils/voteService.ts
import { db } from '../../config/firebase'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore'

/**
 * Casts a vote (1 = upvote, -1 = downvote, 0 = undo)
 * on a post nested under loops/{loopId}/posts/{postId}/votes/.
 */
export async function voteOnPost(
  loopId: string,
  postId: string,
  voterUid: string,
  newVote: 1 | -1 | 0
) {
  console.log('voteOnPost called with', { loopId, postId, voterUid, newVote });
  if (!loopId || !postId || !voterUid) {
    console.error('Missing args:', { loopId, postId, voterUid });
    return;
  }

  const postRef = doc(db, 'loops', loopId, 'posts', postId)
  const voteRef = doc(db, 'loops', loopId, 'posts', postId, 'votes', voterUid)

  console.log('Firestore refs:', { 
    postRef: postRef.path, 
    voteRef: voteRef.path 
  });

  const [postSnap, voteSnap] = await Promise.all([
    getDoc(postRef),
    getDoc(voteRef),
  ])

  console.log('postSnap.exists:', postSnap.exists());
  console.log('voteSnap.exists:', voteSnap.exists());
  if (voteSnap.exists()) {
    console.log('voteSnap data:', voteSnap.data());
  }

  if (!postSnap.exists()) {
    console.error('Post not found')
    return
  }

  const prevVote = voteSnap.exists() ? (voteSnap.data().value as number) : 0
  console.log('prevVote:', prevVote, 'newVote:', newVote);
  if (prevVote === newVote) return

  // Write or delete vote doc
  if (newVote === 0) {
    console.log('Deleting vote doc...');
    await deleteDoc(voteRef)
  } else {
    console.log('Setting vote doc:', { value: newVote });
    await setDoc(voteRef, { value: newVote })
  }

  // Update post counters
  const upChange = (newVote === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0)
  const downChange = (newVote === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0)
  console.log('Updating post counters:', { upChange, downChange });
  await updateDoc(postRef, {
    upvotes: increment(upChange),
    downvotes: increment(downChange),
  })

  // Update author aura
  const authorUid = postSnap.data().createdBy as string
  const authorRef = doc(db, 'users', authorUid)
  const auraChange = newVote - prevVote
  console.log('Updating author aura:', { authorUid, auraChange });
  await updateDoc(authorRef, {
    auraTotal: increment(auraChange),
  })

  console.log('voteOnPost completed')
}