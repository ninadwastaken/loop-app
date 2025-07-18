// src/utils/voteService.ts
import { db } from '../../config/firebase'
import { doc, getDoc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore'
import { Timestamp } from 'firebase/firestore';

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
  // Recalculate trending score
  const latestSnap = await getDoc(postRef);
  const postData = latestSnap.data();
  const upvotes = postData?.upvotes || 0;
  const downvotes = postData?.downvotes || 0;
  const createdAt = postData?.createdAt instanceof Timestamp ? postData.createdAt : Timestamp.now();
  const hoursSincePost = (Date.now() - createdAt.toMillis()) / (1000 * 60 * 60);
  const score = (upvotes - downvotes) / Math.pow(hoursSincePost + 2, 1.5);
  await updateDoc(postRef, { score });

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

/**
 * Casts a vote (1 = upvote, -1 = downvote, 0 = undo)
 * on a reply nested under loops/{loopId}/posts/{postId}/replies/{replyId}/votes/.
 */
export async function voteOnReply(
  loopId: string,
  postId: string,
  replyId: string,
  voterUid: string,
  newVote: 1 | -1 | 0
) {
  console.log('voteOnReply called with', { loopId, postId, replyId, voterUid, newVote });
  if (!loopId || !postId || !replyId || !voterUid) {
    console.error('Missing args:', { loopId, postId, replyId, voterUid });
    return;
  }

  const replyRef = doc(db, 'loops', loopId, 'posts', postId, 'replies', replyId);
  const voteRef = doc(db, 'loops', loopId, 'posts', postId, 'replies', replyId, 'votes', voterUid);

  console.log('Firestore refs:', { 
    replyRef: replyRef.path, 
    voteRef: voteRef.path 
  });

  const [replySnap, voteSnap] = await Promise.all([
    getDoc(replyRef),
    getDoc(voteRef),
  ]);

  console.log('replySnap.exists:', replySnap.exists());
  console.log('voteSnap.exists:', voteSnap.exists());
  if (voteSnap.exists()) {
    console.log('voteSnap data:', voteSnap.data());
  }

  if (!replySnap.exists()) {
    console.error('Reply not found')
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

  // Update reply counters
  const upChange = (newVote === 1 ? 1 : 0) - (prevVote === 1 ? 1 : 0)
  const downChange = (newVote === -1 ? 1 : 0) - (prevVote === -1 ? 1 : 0)
  console.log('Updating reply counters:', { upChange, downChange });
  await updateDoc(replyRef, {
    upvotes: increment(upChange),
    downvotes: increment(downChange),
  })

  console.log('voteOnReply completed')
}