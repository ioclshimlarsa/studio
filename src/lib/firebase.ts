
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// When passing the private key from Vercel, it might have literal \n characters.
// These need to be replaced with actual newlines.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  // Check for the existence of Firebase credentials.
  // This is a crucial step to ensure the app has what it needs to connect.
  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin SDK initialized successfully.');
    } catch (error: any) {
      // This can happen in serverless environments if an instance is reused.
      // We can safely ignore the "already exists" error.
      if (!/already exists/i.test(error.message)) {
        console.error('Firebase admin initialization error', error);
        throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
      }
    }
  } else {
    // In a production or deployed environment, we should fail hard if credentials are not set.
    throw new Error(
      'Firebase environment variables are not set. Cannot initialize Firebase Admin SDK.'
    );
  }
}

// Export a function that returns the Firestore instance.
// This complies with "use server" module rules and ensures we're always getting the initialized instance.
export function getDb() {
  if (!admin.apps.length) {
    // This should technically not be reached because of the call above, but it's a safeguard.
    initializeFirebaseAdmin();
  }
  return admin.firestore();
}
