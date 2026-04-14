import "server-only";

type EnvValue = string | undefined;

function readEnvVariable(variableName: string): EnvValue {
    const rawValue = process.env[variableName];
    if (!rawValue) {
        return undefined;
    }

    const trimmedValue = rawValue.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function requireEnvVariable(variableName: string): string {
    const value = readEnvVariable(variableName);

    if (!value) {
        throw new Error(`[Env] Missing required environment variable: ${variableName}`);
    }

    return value;
}

function optionalNumberEnv(variableName: string): number | undefined {
    const value = readEnvVariable(variableName);
    if (!value) {
        return undefined;
    }

    const parsedNumber = Number(value);
    if (!Number.isFinite(parsedNumber)) {
        throw new Error(`[Env] ${variableName} must be a valid number`);
    }

    return parsedNumber;
}

function parseJsonEnv<T>(variableName: string): T | undefined {
    const value = readEnvVariable(variableName);
    if (!value) {
        return undefined;
    }

    try {
        return JSON.parse(value) as T;
    } catch {
        throw new Error(`[Env] ${variableName} must contain valid JSON`);
    }
}

export const appEnv = {
    nodeEnv: readEnvVariable("NODE_ENV") ?? "development",
    appUrl: requireEnvVariable("NEXT_PUBLIC_APP_URL"),
    isDevelopment: (readEnvVariable("NODE_ENV") ?? "development") === "development",
    isProduction: readEnvVariable("NODE_ENV") === "production",
    allowDevSeed: readEnvVariable("ENABLE_DEV_SEED") === "true",
} as const;

export const databaseEnv = {
    databaseUrl: readEnvVariable("DATABASE_URL"),
    directDatabaseUrl:
        readEnvVariable("DIRECT_DATABASE_URL") ?? readEnvVariable("DATABASE_URL"),
} as const;

if (!databaseEnv.directDatabaseUrl) {
    throw new Error("[Env] Missing DIRECT_DATABASE_URL or DATABASE_URL");
}

export const authEnv = {
    authSecret: requireEnvVariable("AUTH_SECRET"),
} as const;

const paymentKeyId = readEnvVariable("RAZORPAY_KEY_ID");
const paymentKeySecret = readEnvVariable("RAZORPAY_KEY_SECRET");
const paymentWebhookSecret = readEnvVariable("RAZORPAY_WEBHOOK_SECRET");

export const paymentEnv = {
    keyId: paymentKeyId,
    keySecret: paymentKeySecret,
    webhookSecret: paymentWebhookSecret,
    isConfigured: Boolean(paymentKeyId && paymentKeySecret),
    hasWebhookSecret: Boolean(paymentWebhookSecret),
} as const;

const smtpHost = readEnvVariable("SMTP_HOST");
const smtpPort = optionalNumberEnv("SMTP_PORT");
const smtpUser = readEnvVariable("SMTP_USER");
const smtpPassword = readEnvVariable("SMTP_PASSWORD");
const emailFrom = readEnvVariable("EMAIL_FROM");

export const mailEnv = {
    host: smtpHost,
    port: smtpPort ?? 587,
    user: smtpUser,
    password: smtpPassword,
    from: emailFrom ?? "Sprintern <noreply@sprintern.in>",
    isConfigured: Boolean(smtpHost && smtpUser && smtpPassword),
} as const;

export interface FirebaseServiceAccount {
    project_id?: string;
    private_key?: string;
    client_email?: string;
}

const firebaseServiceAccount = parseJsonEnv<FirebaseServiceAccount>(
    "FIREBASE_SERVICE_ACCOUNT_JSON"
);

export const firebaseEnv = {
    serviceAccount: firebaseServiceAccount,
    isAdminConfigured: Boolean(
        firebaseServiceAccount?.project_id &&
        firebaseServiceAccount?.private_key &&
        firebaseServiceAccount?.client_email
    ),
} as const;
