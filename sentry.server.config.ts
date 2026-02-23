// Sentry server-side configuration
// Only initializes if @sentry/nextjs is installed and SENTRY_DSN is set
const DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  // @ts-ignore -- @sentry/nextjs is an optional dependency
  import('@sentry/nextjs')
    .then((Sentry: { init: (opts: Record<string, unknown>) => void }) => {
      Sentry.init({
        dsn: DSN,
        tracesSampleRate: 0.1,
        environment: process.env.NODE_ENV,
      });
    })
    .catch(() => {});
}

export {};
