// ---------------------------------------------------------------------------
// Central configuration. Replace the Firebase values with the client's
// project settings (Firebase console → Project settings → Your apps → Web).
// These values are public by design; security is enforced by firestore.rules.
// ---------------------------------------------------------------------------

export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

export const SDK_VERSION = '10.14.1';

// Standardized collection names (shared with the SQySystems Admin Panel)
export const COLLECTIONS = {
  settings: 'settings',
  siteInfoDoc: 'site_info',
  items: 'site_items',
  leads: 'leads',
  messages: 'messages'
};

export const SUBMIT_TIMEOUT_MS = 15000; // give up waiting for server ack
export const COOLDOWN_MS = 30000;       // minimum gap between submissions per form

export const isFirebaseConfigured = () =>
  !/^YOUR_/.test(firebaseConfig.apiKey) && !/^YOUR_/.test(firebaseConfig.projectId);
