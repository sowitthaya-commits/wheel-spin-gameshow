import { RealtimeAdapter } from './adapter';
import { LocalBroadcastChannelAdapter } from './local-adapter';
import { FirebaseRealtimeAdapter } from './firebase-adapter';

let activeAdapter: RealtimeAdapter | null = null;

export function getFirebaseConfigFromEnv() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (apiKey && databaseURL && projectId) {
    return {
      apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL,
      projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };
  }

  // Check URL params or localStorage for runtime config
  if (typeof window !== 'undefined') {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const fbParam = urlParams.get('fb');
      if (fbParam) {
        const decoded = JSON.parse(atob(fbParam));
        if (decoded.apiKey && decoded.databaseURL) {
          window.localStorage.setItem('wheel_firebase_custom', JSON.stringify(decoded));
          return decoded;
        }
      }

      const stored = window.localStorage.getItem('wheel_firebase_custom');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  return getFirebaseConfigFromEnv() !== null;
}

export function getRealtimeAdapter(): RealtimeAdapter {
  if (activeAdapter) return activeAdapter;

  const fbConfig = getFirebaseConfigFromEnv();
  if (fbConfig) {
    try {
      activeAdapter = new FirebaseRealtimeAdapter(fbConfig);
      return activeAdapter;
    } catch (err) {
      console.warn('Firebase init failed, falling back to Local Demo Adapter:', err);
    }
  }

  activeAdapter = new LocalBroadcastChannelAdapter();
  return activeAdapter;
}
