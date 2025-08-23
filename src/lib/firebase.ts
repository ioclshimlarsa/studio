
'use server';

import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK
// This is the safest way to initialize, checking if it's already been done.
if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
      // We are not re-throwing the error here to avoid crashing the server
      // in case of intermittent issues. The db export will fail next.
    }
  } else {
    console.warn(
      'Firebase environment variables are not set. Skipping Firebase initialization. This is expected during local development if you have not set up your .env.local file.'
    );
  }
}

// Conditionally export db only if Firebase is initialized
let db;
if (admin.apps.length > 0) {
  db = admin.firestore();
} else {
  // Provide a mock or dummy object when Firebase is not initialized
  // This allows the app to run without crashing, although Firebase features will not work.
  db = {
    collection: () => ({
      doc: () => ({
        get: () => Promise.resolve({ exists: false }),
        set: () => Promise.resolve(),
      }),
      get: () => Promise.resolve({ empty: true, docs: [] }),
    }),
    batch: () => ({
        commit: () => Promise.resolve(),
        set: () => {},
        delete: () => {},
    }),
  };
  console.log("Firebase is not initialized. Using mock Firestore DB.");
}

export { db };
