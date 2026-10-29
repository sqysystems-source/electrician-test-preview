// Lazy Firebase loader. Nothing is downloaded until needed, and any failure
// resolves to `null` so the static site keeps working silently.
import { firebaseConfig, isFirebaseConfigured, SDK_VERSION } from './config.js';

const CDN = `https://www.gstatic.com/firebasejs/${SDK_VERSION}`;
let pending = null;

export function loadFirebase() {
  if (pending) return pending;

  pending = (async () => {
    if (!isFirebaseConfigured()) return null;

    try {
      const [appMod, fs] = await Promise.all([
        import(`${CDN}/firebase-app.js`),
        import(`${CDN}/firebase-firestore.js`)
      ]);

      fs.setLogLevel('silent'); // no SDK noise in the console if offline / denied

      const app = appMod.getApps().length
        ? appMod.getApp()
        : appMod.initializeApp(firebaseConfig);

      let db;
      try {
        db = fs.initializeFirestore(app, {
          localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() })
        });
      } catch {
        db = fs.getFirestore(app); // already initialised or persistence unsupported
      }

      return { db, fs };
    } catch (err) {
      console.debug('[site] Firebase unavailable, using static content.', err?.message || err);
      return null;
    }
  })();

  return pending;
}
