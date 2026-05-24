// T48: Sentry 프론트엔드 초기화
// NEXT_PUBLIC_SENTRY_DSN 설정 시에만 활성화, 패키지 없으면 조용히 무시

export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    if (process.env.NEXT_RUNTIME === "nodejs") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({ dsn, tracesSampleRate: 0.1, environment: process.env.NODE_ENV });
    }
    if (process.env.NEXT_RUNTIME === "edge") {
      const Sentry = await import("@sentry/nextjs");
      Sentry.init({ dsn, tracesSampleRate: 0.1 });
    }
  } catch {
    // @sentry/nextjs 미설치 시 무시
  }
}
