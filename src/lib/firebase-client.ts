import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, type Auth, type GoogleAuthProvider as GoogleProviderType } from 'firebase/auth'
import { publicFirebaseEnv } from '@/lib/public-env'

let _app: FirebaseApp | null = null
let _auth: Auth | null = null
let _googleProvider: GoogleProviderType | null = null

function getFirebaseConfig() {
  const { apiKey, authDomain, projectId, appId, storageBucket, messagingSenderId } = publicFirebaseEnv

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      '[Firebase Client] Missing required environment variables: ' +
      'NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, ' +
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID, NEXT_PUBLIC_FIREBASE_APP_ID'
    )
  }

  return { 
    apiKey, 
    authDomain, 
    projectId, 
    appId,
    storageBucket: storageBucket || undefined,
    messagingSenderId: messagingSenderId || undefined,
  }
}

function getFirebaseApp(): FirebaseApp {
  if (_app) return _app

  const config = getFirebaseConfig()
  const existingApps = getApps()

  _app = existingApps.length > 0 ? existingApps[0] : initializeApp(config)
  return _app
}

export function getFirebaseAuth(): Auth {
  if (!publicFirebaseEnv.isConfigured) {
    throw new Error('[Firebase Client] Firebase client configuration is incomplete')
  }
  if (_auth) return _auth
  _auth = getAuth(getFirebaseApp())
  return _auth
}

export function getGoogleProvider(): GoogleProviderType {
  if (_googleProvider) return _googleProvider
  _googleProvider = new GoogleAuthProvider()
  _googleProvider.addScope('email')
  _googleProvider.addScope('profile')
  return _googleProvider
}
