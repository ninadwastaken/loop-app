// functions/src/index.ts
console.log("🔥 Cloud Function: index.ts loaded");
console.log("importing dependencies");

import { onDocumentCreated }           from 'firebase-functions/v2/firestore';
import * as logger                     from 'firebase-functions/logger';
import * as admin                      from 'firebase-admin';
import fetch                           from 'node-fetch'; // for Expo push API
import sgMail from '@sendgrid/mail';
import { HttpsError, onCall }          from 'firebase-functions/v2/https';

console.log("imported sgMail and config");

admin.initializeApp();
console.log("admin initialized");

// TODO: For 2nd Gen Firebase compatibility, set SendGrid API key inside the function before sending email.

// // Expo push endpoint
// const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

// // Helper to send a batch of Expo notifications
// async function sendExpoNotifications(messages: any[]) {
//   const resp = await fetch(EXPO_PUSH_URL, {
//     method: 'POST',
//     headers: {
//       Accept:       'application/json',
//       'Accept-encoding': 'gzip, deflate',
//       'Content-Type':    'application/json',
//     },
//     body: JSON.stringify(messages),
//   });

//   if (!resp.ok) {
//     const text = await resp.text();
//     logger.error('Expo push error:', resp.status, text);
//   } else {
//     const data = await resp.json();
//     logger.log('Expo push result:', data);
//   }
//   logger.log('Would send push notification here');
// }

// // Firestore trigger: new post in any loop
// export const onNewLoopPostTest = onDocumentCreated(
//   {
//     region:   'us-central1',
//     document: 'loops/{loopId}/posts/{postId}',
//   },
//   async (event) => {
//     // event.data is a QueryDocumentSnapshot | undefined
//     const snap = event.data;
//     if (!snap) {
//       logger.warn(`No snapshot in onNewLoopPost, skipping.`);
//       return;
//     }

//     // get the raw post data
//     const newPost = snap.data(); 
//     logger.log('onNewLoopPost triggered:', newPost);

//     // NEW: read loop doc
//     const loopId = event.params.loopId!;
//     const loopSnap = await admin.firestore().doc(`loops/${loopId}`).get();
//     if (!loopSnap.exists) {
//       logger.warn(`Loop ${loopId} not found – skipping.`);
//       return;
//     }

//     const loopData = loopSnap.data()!;
//     logger.log('Loop data:', loopData);

//     const tokens: string[] = Array.isArray(loopData.subscriberTokens)
//       ? loopData.subscriberTokens
//       : [];
//     logger.log('Subscriber tokens:', tokens);

//     if (tokens.length === 0) {
//       logger.log(`No subscriber tokens for loop ${loopId}.`);
//       return;
//     }

//     try {
//       // event.data is a QueryDocumentSnapshot | undefined
//       const snap = event.data;
//       if (!snap) {
//         logger.warn(`No snapshot in onNewLoopPost, skipping.`);
//         return;
//       }

//       // get the raw post data
//       const newPost = snap.data(); 
//       // make sure the fields exist
//       const content  = (newPost.content as string)  || 'New activity!';
//       const posterId = (newPost.posterId as string) || 'unknown';

//       const loopId = event.params.loopId!;
//       const postId = event.params.postId!;

//       logger.log(`New post [${postId}] in loop [${loopId}] by ${posterId}`);

//       // 1) Fetch the loop doc to get its subscriber tokens
//       const loopSnap = await admin.firestore().doc(`loops/${loopId}`).get();
//       if (!loopSnap.exists) {
//         logger.warn(`Loop ${loopId} not found – skipping notifications.`);
//         return;
//       }

//       const loopData: any = loopSnap.data();
//       const tokens: string[] = Array.isArray(loopData.subscriberTokens)
//         ? loopData.subscriberTokens
//         : [];

//       if (tokens.length === 0) {
//         logger.log(`No subscriber tokens for loop ${loopId}.`);
//         return;
//       }

//       // 2) Build notification messages
//       //    Truncate to Expo chunk size if needed (per docs, ~100 tokens/batch)
//       const messages = tokens.map((token) => ({
//         to:       token,
//         sound:    'default',
//         title:    `New post in #${loopData.name || loopId}`,
//         body:     content.slice(0, 100), // first 100 chars
//         data:     { loopId, postId },
//       }));

//       // 3) Chunk by 100 (Expo recommendation)
//       const chunkSize = 100;
//       for (let i = 0; i < messages.length; i += chunkSize) {
//         const chunk = messages.slice(i, i + chunkSize);
//         await sendExpoNotifications(chunk);
//       }

//       logger.log(`Dispatched ${messages.length} push notifications.`);
//     } catch (err: any) {
//       logger.error('Error in onNewLoopPost:', err);
//     }
//   }
// );

export const sendSignupCode = onCall(
  { region: 'us-central1' },
  async (req) => {
    console.log("sendSignupCode cloud function called");

    const email = req.data.email;
    console.log("Received email:", email);

    if (!/\.edu$/i.test(email)) {
      console.log("Email failed .edu check:", email);
      throw new HttpsError('invalid-argument', 'Must be a .edu email');
    }

    // 1. Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("Generated code:", code);

    // 2. Save code to Firestore with a timestamp (for 10-min expiry)
    await admin.firestore().collection('signupCodes').doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Saved code to Firestore for", email);

    // 3. Send code by email
    // NOTE: For 2nd Gen Firebase compatibility, set the SendGrid API key here before sending email.
    // Uncomment below to send email in production:
    
    sgMail.setApiKey(require('firebase-functions').config().sendgrid.key);
    const msg = {
      to: email,
      from: 'noreply@joinloop.me', // your SendGrid-verified sender
      subject: 'Your Loop signup code',
      text: `Your Loop verification code is: ${code}`,
    };
    console.log("About to send email with SendGrid...");
    await sgMail.send(msg);
    console.log("Email sent successfully to", email);
    return { success: true };
    
  }
);