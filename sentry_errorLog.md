# 🚨 Sentry 에러 모니터링 & Replay(세션 리플레이) 풀스택 완전 가이드

이 문서는 **Express 백엔드**, **Vite React 프론트엔드**, **Expo 모바일** 애플리케이션에서 **Sentry(센트리)**를 설치하고, 실시간 **에러 로그 추적** 및 **Session Replay(사용자 화면 녹화 리플레이)** 기능을 완벽하게 연동하여 대시보드에서 분석하는 전체 절차와 실전 가이드입니다.

---

## 📌 1. Sentry 에러 모니터링 & Replay 구조 및 처리 흐름

Sentry는 런타임 에러, 스택 트레이스뿐만 아니라 **사용자가 에러를 겪기 전후로 어떤 화면을 보고 클릭했는지 동영상처럼 재현해 주는 Session Replay** 기능을 함께 제공합니다.

```
[ Frontend (React / Vite) ] ──── (에러 스택 & DOM Replay 녹화 데이터) ──┐
                                                                          │
[ Backend (Node / Express) ] ─── (서버 에러 스택 & 트랜잭션) ─────────────┼───► [ Sentry Cloud Server ]
                                                                          │             │
[ Mobile (React Native / Expo) ] ── (앱 예외 & 시스템 로그) ───────────────┘             ▼
                                                                              [ Sentry 대시보드 (sentry.io) ]
                                                                               - 에러 스택 트레이스 분석
                                                                               - Session Replay 동영상 재생
                                                                               - Breadcrumbs (사용자 클릭/네트워크)
                                                                               - Slack/이메일 실시간 알림
```

---

## 🔑 2. 1단계: Sentry 회원가입 및 프로젝트 생성 & Replay 활성화

1. **Sentry 공식 홈페이지 가입**
   - [sentry.io](https://sentry.io) 접속 후 회원가입 (GitHub/Google 계정 지원).
   - 조직(Organization) 및 팀(Team) 설정.

2. **프로젝트(Project) 생성 (Projects ➔ Create Project)**
   - 플랫폼 선택:
     - 백엔드: **Node.js** 또는 **Express**
     - 프론트엔드: **React** (Vite)
     - 모바일: **React Native** 또는 **Expo**
   - 프로젝트 이름 입력 (예: `ecommerce-backend`, `ecommerce-frontend`).

3. **Session Replay 활성화 확인**
   - 대시보드 ➔ **`Settings`** ➔ **`Projects`** ➔ `[내 프로젝트]` ➔ **`Session Replay`** 메뉴로 이동.
   - **`Enable Session Replay`** 스위치가 **ON (활성화)** 상태인지 확인합니다.

4. **DSN (Data Source Name) 키 저장**
   - `Project Settings` ➔ `Client Keys (DSN)`에서 주소 복사:
     `https://xxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX`

---

## 💻 3. 2단계: Backend (Node.js + Express) 에러 트래킹 연동

### 1) 패키지 설치
```bash
cd backend
npm install @sentry/node @sentry/profiling-node
```

### 2) 환경 변수 설정 (`backend/.env`)
```env
SENTRY_DSN=https://xxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX
NODE_ENV=production
```

### 3) Express `server.js` 초기화
> ⚠️ `Sentry.init`은 **최상단**에 선언하고, `Sentry.setupExpressErrorHandler(app)`는 **라우트 정의 바로 다음**에 추가합니다.

```javascript
import express from 'express';
import * as Sentry from '@sentry/node';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

// Sentry 초기화
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 1.0, // 성능 모니터링 샘플링
  });
}

app.use(express.json());

// 백엔드 에러 발생 테스트 라우트
app.get('/api/test-error', (req, res) => {
  throw new Error('🔥 [Sentry Server Test Error] 백엔드 강제 발생 에러!');
});

// Sentry 에러 핸들러 (라우터 하단 배치)
Sentry.setupExpressErrorHandler(app);

// 최종 에러 미들웨어
app.use((err, req, res, next) => {
  res.status(500).json({ error: '서버 내부 오류가 발생했습니다.' });
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));
```

---

## 🎨 4. 3단계: Frontend (React + Vite) Sentry & Replay 연동

### 1) 패키지 설치
```bash
cd frontend
npm install @sentry/react
```

### 2) 환경 변수 설정 (`frontend/.env`)
```env
VITE_SENTRY_DSN=https://xxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX
```

### 3) `frontend/src/main.jsx`에서 Replay 기능 세팅
Replay 기능이 정상 동작하도록 `replayIntegration`을 추가하고 샘플링 비율을 설정합니다.

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.jsx';
import './index.css';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      // 🎥 Session Replay 플러그인 설정
      Sentry.replayIntegration({
        maskAllText: false,     // true로 설정 시 모든 텍스트가 *로 마스킹됨 (개인정보 보호)
        blockAllMedia: false,   // true로 설정 시 모든 이미지/비디오가 블록 처리됨
        networkDetailAllowlist: ['window.location.origin'], // 네트워크 상세 요청 캡처 범위
      }),
    ],
    
    // 📊 성능 모니터링 수집 비율 (1.0 = 100%)
    tracesSampleRate: 1.0,

    // 🎬 [중요] Session Replay 샘플링 비율 설정
    // 💡 개발 및 테스트 환경에서는 100% 수집을 위해 둘 다 1.0으로 지정하는 것을 권장합니다!
    replaysSessionSampleRate: 1.0, // 전체 사용자 일반 세션 수집 비율 (운영 환경 권장: 0.1)
    replaysOnErrorSampleRate: 1.0,  // 에러 발생 세션 수집 비율 (운영 환경 권장: 1.0)
    
    environment: import.meta.env.MODE,
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-4 text-red-500 font-bold">오류가 발생하여 Sentry로 자동 보고되었습니다.</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
```

#### 💡 Replay 샘플링 옵션 한눈에 비교

| 환경 (Environment) | `replaysSessionSampleRate` | `replaysOnErrorSampleRate` | 비고 |
| :--- | :---: | :---: | :--- |
| **테스트/개발 (`development`)** | **`1.0` (100%)** | **`1.0` (100%)** | 테스트 중인 모든 클릭과 세션을 즉시 녹화하여 대시보드에 노출 |
| **실제 운영 (`production`)** | **`0.1` (10%)** | **`1.0` (100%)** | 계정의 Replay 쿼터(수집 한도) 아끼면서 에러 발생 건은 100% 녹화 |

---

### 4) 수동 에러 & Replay 트리거 테스트 버튼 (`TestErrorButton.jsx`)
```jsx
import * as Sentry from '@sentry/react';

export function TestErrorButton() {
  const handleFrontendError = () => {
    try {
      // 강제 예외 발생
      throw new Error('💥 [Sentry Test Error] Replay 연동 프론트엔드 테스트 에러!');
    } catch (error) {
      Sentry.captureException(error, {
        extra: { info: '사용자가 테스트 버튼을 클릭함' },
      });
      alert('Sentry 및 Replay로 에러 데이터가 전송되었습니다!');
    }
  };

  return (
    <button
      onClick={handleFrontendError}
      className="bg-red-600 text-white px-4 py-2 rounded font-semibold hover:bg-red-700 shadow"
    >
      프론트엔드 에러 & Replay 테스트 버튼
    </button>
  );
}
```

---

## 📱 5. 4단계: Mobile (Expo / React Native) 연동

```bash
cd mobile
npx expo install @sentry/react-native
```

```javascript
// mobile/App.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://xxxxxx@oXXXXXX.ingest.sentry.io/XXXXXXX',
  enableInExpoDevelopment: true,
  debug: true,
});

function App() {
  return <RootLayout />;
}

export default Sentry.wrap(App);
```

---

## 🧪 6. 5단계: 에러 & Replay 발생 테스트 실행

1. **프론트엔드 앱 실행**: `npm run dev`
2. **세션 활동 진행**: 브라우저에서 몇 번 페이지를 클릭하거나 텍스트를 입력합니다. (Replay DOM 녹화 궤적 생성)
3. **에러 발생시키기**: 테스트 버튼을 누르거나 브라우저 개발자 콘솔(F12)에 아래 코드 실행:
   ```javascript
   throw new Error("Replay 동영상 캡처 확인용 콘솔 테스트 에러");
   ```

---

## 📊 7. 6단계: Sentry 사이트 대시보드에서 에러 & Replay 확인법

Sentry 웹 대시보드([sentry.io](https://sentry.io))에서 에러 로그와 Session Replay 동영상을 확인하는 구체적인 실전 방법입니다.

### 1) Session Replay 동영상 보는 방법 🎬
Sentry 대시보드 접속 ➔ 좌측 메뉴에서 **`Replays`** 클릭

- **Replay 목록**: 사용자의 브라우저 세션 목록이 표시되며, 에러 발생 여부(Red Badge)가 함께 표시됩니다.
- **플레이어 화면**:
  - ▶️ **재생 버튼**: 에러 발생 직전 사용자의 브라우저 화면 움직임, 마우스 커서 이동, 입력 내용이 **비디오처럼 재생**됩니다.
  - ⏱️ **Timeline & Breadcrumbs**: 오른쪽 탭에서 클릭 이벤트(`ui.click`), URL 이동, Console Log, Network API 요청이 에러 발생 시점과 동기화되어 타임라인으로 표시됩니다.

---

### 2) Issues 메뉴에서 에러와 연결된 Replay 확인 🔍
1. 좌측 메뉴 **`Issues`** ➔ 발생한 에러 클릭.
2. 에러 상세 정보 화면에서:
   - **Stack Trace**: 몇 번째 파일 몇 번 줄에서 에러가 터졌는지 코드 블록 확인.
   - **Replay 탭/섹션**: 상세 화면 중간 또는 하단의 **`Replay`** 탭을 누르면 **해당 에러가 발생한 바로 그 세션의 녹화 영상**으로 이동되어 즉시 재생 가능합니다.

---

### 3) Alerts (실시간 알림)
- **`Alerts`** ➔ **`Create Alert`**: Slack 채널 또는 이메일로 신규 에러 발생 시 즉시 알림 수신 설정.

---

## 🛠️ 8. Replay(세션 리플레이)가 대시보드에 안 보일 때 완전 해결 가이드 (Troubleshooting)

Replay 코드를 넣었음에도 Sentry 대시보드의 `Replays` 메뉴에 아무것도 뜨지 않을 때 아래 **5가지 요인**을 하나씩 점검하세요.

### 🔴 1위 원인: `replaysSessionSampleRate` 샘플링 비율 미조정
- **원인**: `replaysSessionSampleRate: 0.1`로 둔 경우 10번에 1번만 무작위 수집되므로, 수동 테스트 시 녹화가 안 찍히고 누락됩니다.
- **해결**: 개발/테스트 중에는 **`1.0` (100%)**으로 올려서 테스트하세요.

```javascript
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  
  replaysSessionSampleRate: 1.0, // 💡 0.1 ➔ 1.0으로 수정 (100% 수집)
  replaysOnErrorSampleRate: 1.0,
});
```

---

### 🔴 2위 원인: 광고 차단 프로그램 (AdBlock / uBlock / Brave Shield)
- **원인**: 브라우저 확장 프로그램(AdBlocker)이나 Brave 브라우저가 `ingest.sentry.io`로 보내는 대용량 Replay 수집 패킷(Web Worker, Blob 데이터)을 광고/트래커 전송으로 차단합니다.
- **해결**:
  - 개발 사이트(`localhost:5173`)에서 광고 차단기 **일시 정지(Pause)**.
  - F12 개발자 도구 ➔ `Network` 탭에서 `sentry` 또는 `envelope` 데이터가 `blocked:other`나 `403` 상태인지 확인.

---

### 🔴 3위 원인: SDK 버전별 Replay 초기화 구문 차이
- **Sentry SDK v8 이상 (최신 standard)**:
  ```javascript
  integrations: [Sentry.replayIntegration()]
  ```
- **Sentry SDK v7 이하**:
  ```javascript
  integrations: [new Sentry.Replay()]
  ```

---

### 🔴 4위 원인: Sentry 대시보드 프로젝트 설정 & 쿼터(Quota) 초과
1. **프로젝트 활성화 스위치**:
   Sentry 대시보드 ➔ `Settings` ➔ `Projects` ➔ `[내 프로젝트]` ➔ `Session Replay` ➔ **`Enabled`** 체크.
2. **월간 사용량 한도 (Quota Exceeded)**:
   Sentry 대시보드 ➔ `Settings` ➔ `Subscription` (또는 `Usage`)에서 이번 달 무료 제공량(**월 500개 세션**)을 모두 소진했는지 확인.

---

### 🔴 5위 원인: Sentry 서버 인코딩 처리 시차 (1~2분 소요)
- Replay 녹화 파일은 데이터 캡처 후 Sentry 클라우드 서버에서 영상 플레이어로 조합되는 인코딩 과정이 필요하므로, 에러 발생 후 **1~2분 지나서 대시보드를 새로고침**해야 재생 버튼이 표시됩니다.

---

## 🛡️ 9. 개인정보 보호 및 보안 모범 사례 (Privacy & Security)

Session Replay는 사용자 화면을 녹화하므로 비밀번호나 개인정보(PII) 보호 설정이 필수적입니다.

1. **텍스트 & 입력폼 마스킹 (`maskAllText`, `maskAllInputs`)**
   ```javascript
   Sentry.replayIntegration({
     maskAllText: true,    // 모든 화면 텍스트를 *** 로 비공개 처리
     maskAllInputs: true,  // 사용자가 폼에 입력하는 텍스트 비공개 처리
   })
   ```

2. **특정 비밀 요소 클래스 지정 (`sentry-mask`, `sentry-block`)**
   HTML 요소에 클래스를 부여하여 특정 영역만 렌더링에서 마스킹하거나 숨길 수 있습니다:
   ```html
   <!-- 이 텍스트는 Replay 영상에서 ***로 마스킹됨 -->
   <div className="sentry-mask">주민등록번호: 900101-1111111</div>

   <!-- 이 영역 전체는 Replay 영상에서 회색 블록으로 숨겨짐 -->
   <div className="sentry-block">결제 카드 비밀번호 입력 UI</div>
   ```

3. **`Sentry.setUser()` 로그인 정보 연동**
   ```javascript
   Sentry.setUser({
     id: user._id,
     email: user.email,
   });
   ```

---
*가이드 작성 완료 - 프로젝트 루트 디렉터리 (`sentry_errorLog.md`)*
