
import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

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
      console.error('Firebase admin initialization error', error);
      // Throw the error to make it clear that initialization failed.
      throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
    }
  } else {
    // In a production or deployed environment, we should fail hard if credentials are not set.
    throw new Error(
      'Firebase environment variables are not set. Cannot initialize Firebase Admin SDK.'
    );
  }
}

// Call the initialization function.
initializeFirebaseAdmin();


// Export a function that returns the Firestore instance.
// This complies with "use server" module rules.
export function getDb() {
  if (!admin.apps.length) {
    // This should technically not be reached because of the call above, but it's a safeguard.
    initializeFirebaseAdmin();
  }
  return admin.firestore();
}
