import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import * as Sentry from "@sentry/react";

const queryClient = new QueryClient();

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const isProduction = import.meta.env.PROD;

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  sendDefaultPii: true,
  enableLogs: true,
  // 성능 및 트랜잭션 수집 비율 (개발: 100%, 운영: 10%)
  tracesSampleRate: isProduction ? 0.1 : 1.0,
  // 일반 사용자 세션 리플레이 수집 비율 (운영: 10%, 무료 쿼터 아끼기)
  replaysSessionSampleRate: isProduction ? 0.1 : 0.5,
  // 에러가 발생한 세션의 리플레이 수집 비율 (에러 원인 분석을 위해 100% 수집)
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration({
      maskAllInputs: false,
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);
