// functions/src/index.ts

import { onDocumentCreated }           from 'firebase-functions/v2/firestore';
import * as logger                     from 'firebase-functions/logger';
import * as admin                      from 'firebase-admin';
import fetch                           from 'node-fetch'; // for Expo push API

admin.initializeApp();

// Expo push endpoint
const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// Helper to send a batch of Expo notifications
async function sendExpoNotifications(messages: any[]) {
  const resp = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept:       'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type':    'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!resp.ok) {
    const text = await resp.text();
    logger.error('Expo push error:', resp.status, text);
  } else {
    const data = await resp.json();
    logger.log('Expo push result:', data);
  }
}

// Firestore trigger: new post in any loop
export const onNewLoopPost = onDocumentCreated(
  {
    region:   'us-central1',
    document: 'loops/{loopId}/posts/{postId}',
  },
  async (event) => {
    try {
      // event.data is a QueryDocumentSnapshot | undefined
      const snap = event.data;
      if (!snap) {
        logger.warn(`No snapshot in onNewLoopPost, skipping.`);
        return;
      }

      // get the raw post data
      const newPost = snap.data(); 
      // make sure the fields exist
      const content  = (newPost.content as string)  || 'New activity!';
      const posterId = (newPost.posterId as string) || 'unknown';

      const loopId = event.params.loopId!;
      const postId = event.params.postId!;

      logger.log(`New post [${postId}] in loop [${loopId}] by ${posterId}`);

      // 1) Fetch the loop doc to get its subscriber tokens
      const loopSnap = await admin.firestore().doc(`loops/${loopId}`).get();
      if (!loopSnap.exists) {
        logger.warn(`Loop ${loopId} not found – skipping notifications.`);
        return;
      }

      const loopData: any = loopSnap.data();
      const tokens: string[] = Array.isArray(loopData.subscriberTokens)
        ? loopData.subscriberTokens
        : [];

      if (tokens.length === 0) {
        logger.log(`No subscriber tokens for loop ${loopId}.`);
        return;
      }

      // 2) Build notification messages
      //    Truncate to Expo chunk size if needed (per docs, ~100 tokens/batch)
      const messages = tokens.map((token) => ({
        to:       token,
        sound:    'default',
        title:    `New post in #${loopData.name || loopId}`,
        body:     content.slice(0, 100), // first 100 chars
        data:     { loopId, postId },
      }));

      // 3) Chunk by 100 (Expo recommendation)
      const chunkSize = 100;
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        await sendExpoNotifications(chunk);
      }

      logger.log(`Dispatched ${messages.length} push notifications.`);
    } catch (err: any) {
      logger.error('Error in onNewLoopPost:', err);
    }
  }
);