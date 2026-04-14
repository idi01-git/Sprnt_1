function normalizePublicEnv(value: string | undefined): string | undefined {
    if (!value) return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}

// IMPORTANT: In Next.js client bundles, `process.env.NEXT_PUBLIC_*` is inlined at build time.
// Dynamic access like `process.env[variableName]` is NOT reliably inlined and can become `undefined` in the browser.

const nextPublicAppUrl = normalizePublicEnv(process.env.NEXT_PUBLIC_APP_URL);

const nextPublicRazorpayKeyId = normalizePublicEnv(
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
);

const nextPublicFirebaseApiKey = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY
);
const nextPublicFirebaseAuthDomain = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
);
const nextPublicFirebaseProjectId = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);
const nextPublicFirebaseStorageBucket = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);
const nextPublicFirebaseMessagingSenderId = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
);
const nextPublicFirebaseAppId = normalizePublicEnv(
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

export const publicAppEnv = {
    appUrl: nextPublicAppUrl ?? "",
} as const;

export const publicPaymentEnv = {
    keyId: nextPublicRazorpayKeyId ?? "",
} as const;

export const publicFirebaseEnv = {
    apiKey: nextPublicFirebaseApiKey,
    authDomain: nextPublicFirebaseAuthDomain,
    projectId: nextPublicFirebaseProjectId,
    storageBucket: nextPublicFirebaseStorageBucket,
    messagingSenderId: nextPublicFirebaseMessagingSenderId,
    appId: nextPublicFirebaseAppId,
    isConfigured: Boolean(
        nextPublicFirebaseApiKey &&
            nextPublicFirebaseAuthDomain &&
            nextPublicFirebaseProjectId &&
            nextPublicFirebaseAppId
    ),
} as const;
