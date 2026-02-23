const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

interface SentryLike {
  captureException: (error: unknown) => void;
  captureMessage: (message: string) => void;
  setUser: (user: { id: string; email?: string } | null) => void;
}

let sentryModule: SentryLike | null = null;
let initPromise: Promise<void> | null = null;

async function loadSentry() {
  if (!DSN) return;
  if (sentryModule) return;
  try {
    // Use a variable so the bundler cannot statically resolve the module
    const pkg = '@sentry' + '/nextjs';
    sentryModule = await import(/* webpackIgnore: true */ pkg);
  } catch {
    // @sentry/nextjs not installed — silently ignore
  }
}

function ensureInit() {
  if (!initPromise) {
    initPromise = loadSentry();
  }
  return initPromise;
}

export async function captureException(error: unknown) {
  await ensureInit();
  sentryModule?.captureException(error);
}

export async function captureMessage(message: string) {
  await ensureInit();
  sentryModule?.captureMessage(message);
}

export async function setUser(user: { id: string; email?: string } | null) {
  await ensureInit();
  sentryModule?.setUser(user);
}
