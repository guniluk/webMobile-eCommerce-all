# 🔐 Clerk 인증(Authentication) 풀스택 적용 초보자 완전 가이드

이 문서는 **Vite React 프론트엔드**와 **Express.js 백엔드** 환경에서 **Clerk(클러크)** 인증 서비스를 쉽고 완벽하게 적용하는 전체 가이드입니다.  
컴퓨터 초보자나 풀스택 입문자도 따라 할 수 있도록 클릭 순서부터 환경 변수 설정, 안전한 DB 동기화(3중 안전장치)까지 상세하게 설명합니다.

---

## 📌 1. Clerk 인증 구조 및 처리 흐름 이해하기

Clerk은 소셜 로그인(구글, 카카오, 네이버 등), 이메일 로그인, 세션 관리, 프로필 관리 UI를 완제품 형태로 제공하는 회원 인증 서비스입니다.

```
[ React 프론트엔드 ]             [ Clerk 인증 서버 ]              [ Express 백엔드 & MongoDB ]
         │                               │                                   │
         ├─────── 1. 로그인 요청 (UI) ──>│                                   │
         │<────── 2. JWT 토큰 발급 ──────┤                                   │
         │                                                                   │
         ├─────── 3. API 요청 (Bearer Token 포함) ──────────────────────────>│
         │                                                                   │ 4. clerkMiddleware()
         │                                                                   │    토큰 검증 및 getAuth()
         │<────── 5. DB 응답 데이터 ─────────────────────────────────────────┤
```

### 💡 이 프로젝트의 핵심: 3중 회원 데이터 동기화 (Triple Sync)
사용자가 Clerk으로 로그인하거나 회원가입을 할 때, MongoDB에도 사용자 정보(`User` 모델)가 안전하게 저장되어야 합니다. 이 프로젝트는 데이터 누락을 방지하기 위해 **3중 동기화 방식**을 적용했습니다:

1. **프론트엔드 자동 Sync (`/api/user/sync`)**: 사용자가 로그인하는 즉시 프론트엔드가 백엔드로 프로필을 전송하여 DB에 유저가 없으면 자동 생성(Upsert)합니다. (웹훅 연결이 불가능한 로컬 개발 환경에서도 100% 동작)
2. **Inngest 백그라운드 Worker (`/api/inngest`)**: Clerk 웹훅 이벤트를 Inngest가 전달받아 실패 시 자동 재시도를 거쳐 MongoDB에 안전하게 반영합니다.
3. **Direct Clerk Webhook (`/api/user/webhook`)**: Inngest 없이 Clerk에서 직접 쏘는 웹훅 신호도 받아 처리할 수 있는 예비 엔드포인트를 제공합니다.

---

## 🔑 2. 1단계: Clerk 회원가입 및 API Key 획득

1. [Clerk 공식 홈페이지(clerk.com)](https://clerk.com) 접속 후 회원가입 (GitHub이나 Google 계정으로 로그인 가능).
2. 대시보드 메인에서 **`Add application`** (또는 `Create Application`) 클릭.
3. **Application name**에 프로젝트 이름 입력 (예: `web-mobile-ecommerce`).
4. 사용하고 싶은 로그인 방식 선택 (Google, Email 등 선택) ➔ 하단 **`Create application`** 클릭.
5. 생성 완료 후 화면에 표시되는 **API Keys** 2가지를 복사하여 메모장에 저장합니다:
   - **Publishable Key** (공개 키): `pk_test_...`
   - **Secret Key** (비밀 키): `sk_test_...`

> ⚠️ **주의**: `Secret Key`(`sk_test_...`)는 절대로 외부에 노출되거나 GitHub에 올라가면 안 됩니다! 백엔드 `.env` 파일에만 보관하세요.

---

## 💻 3. 2단계: Frontend (React + Vite) 세팅

### 1) 패키지 설치
프론트엔드 폴더(`frontend`)에서 Clerk React SDK가 설치되어 있는지 확인합니다:

```bash
cd frontend
npm install @clerk/clerk-react
```

### 2) 환경 변수 설정 (`frontend/.env`)
`frontend/.env` 파일을 만들거나 열어서 아래 내용을 입력합니다:

```env
# Vite 환경 변수는 반드시 VITE_ 접두사로 시작해야 합니다.
VITE_CLERK_PUBLISHABLE_KEY=pk_test_여기에_본인의_Publishable_Key_입력
```

### 3) `main.jsx`에 `ClerkProvider` 적용
[`frontend/src/main.jsx`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/main.jsx) 파일에서 앱 전체를 `ClerkProvider`로 감쌉니다:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key in environment variables")
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
```

### 4) 컴포넌트에 Clerk 로그인/프로필 UI 적용
Clerk 컴포넌트(`SignedIn`, `SignedOut`, `SignInButton`, `UserButton`)를 사용하면 로그인 상태에 따라 다른 화면을 띄울 수 있습니다:

```jsx
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'

export default function Header() {
  const { user } = useUser()

  return (
    <header className="p-4 flex justify-between items-center bg-white shadow-sm">
      <h1 className="text-xl font-bold text-gray-800">쇼핑몰</h1>

      {/* 로그아웃 상태일 때: 로그인 버튼 표시 */}
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            로그인 / 회원가입
          </button>
        </SignInButton>
      </SignedOut>

      {/* 로그인 상태일 때: 유저 프로필 아바타 버튼 표시 */}
      <SignedIn>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{user?.fullName || user?.firstName}님</span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </header>
  )
}
```

### 5) 백엔드로 인증 요청 시 JWT 토큰 전달 방법
로그인이 필요한 백엔드 API를 호출할 때는 `useAuth()` 훅의 `getToken()`으로 토큰을 발급받아 `Authorization` 헤더에 담아 보냅니다:

```javascript
import { useAuth } from '@clerk/clerk-react'

export function useApi() {
  const { getToken } = useAuth()

  const fetchWithAuth = async (url, options = {}) => {
    const token = await getToken()

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    return await response.json()
  }

  return { fetchWithAuth }
}
```

---

## ⚙️ 4. 3단계: Backend (Express.js) 세팅

### 1) 패키지 설치
백엔드 폴더(`backend`)에서 최신 Clerk Express SDK가 설치되어 있는지 확인합니다:

```bash
cd backend
npm install @clerk/express
```

### 2) 환경 변수 설정 (`backend/.env`)
`backend/.env` 파일에 Clerk Key 2가지를 추가합니다:

```env
CLERK_PUBLISHABLE_KEY=pk_test_여기에_본인의_Publishable_Key_입력
CLERK_SECRET_KEY=sk_test_여기에_본인의_Secret_Key_입력
```

### 3) `server.js`에 `clerkMiddleware()` 적용
[`backend/src/server.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/server.js)에 글로벌 미들웨어를 연결합니다:

```javascript
import express from 'express'
import dotenv from 'dotenv'
import { clerkMiddleware } from '@clerk/express'

dotenv.config()

const app = express()
app.use(express.json())

// Clerk 미들웨어 등록 (모든 들어오는 요청의 JWT 토큰 및 세션을 자동 분석해 req.auth에 주입)
app.use(clerkMiddleware())
```

### 4) 유저 정보 확인 및 API 보호 ([`user.controller.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/controllers/user.controller.js))
`getAuth(req)` 함수로 현재 요청을 보낸 유저가 누구인지 식별합니다:

```javascript
import { getAuth } from '@clerk/express'
import { User } from '../models/user.model.js'

export const getProfile = async (req, res) => {
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({ success: false, message: '인증되지 않은 사용자입니다.' })
    }

    const user = await User.findOne({ clerkId: userId })
    if (!user) {
      return res.status(404).json({ success: false, message: 'MongoDB에서 사용자를 찾을 수 없습니다.' })
    }

    return res.status(200).json({ success: true, user })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}
```

---

## 🌐 5. 4단계: Render.com 배포 시 환경 변수 설정

Render.com 배포 서비스의 **`Environment Variables`** 탭에 아래 항목들을 입력해주어야 프로덕션 환경에서도 Clerk 인증 및 DB 동기화가 정상 작동합니다:

| 변수명 (Key) | 설명 | 예시 |
| :--- | :--- | :--- |
| `CLERK_PUBLISHABLE_KEY` | 백엔드용 Clerk Publishable Key | `pk_test_...` 또는 `pk_live_...` |
| `CLERK_SECRET_KEY` | 백엔드용 Clerk Secret Key (절대 공개금지) | `sk_test_...` 또는 `sk_live_...` |
| `VITE_CLERK_PUBLISHABLE_KEY` | 프론트엔드 빌드 시 주입되는 Publishable Key | `pk_test_...` |

---

## 💡 6. 자주 묻는 질문 & 트러블슈팅 (Troubleshooting)

### Q1. Clerk으로 로그인했는데 MongoDB `users` 컬렉션에 데이터가 들어오지 않아요!
- **이유**: 웹훅(Webhook) 신호는 외부에 공개된 URL 주소가 필요하므로 `localhost` 개발 환경에서는 Clerk ➔ 백엔드로 신호가 직접 전달되지 않을 수 있습니다.
- **해결책**: 본 프로젝트는 프론트엔드 로그인 성공 직후 `/api/user/sync` API를 자동 호출하도록 구현되어 있어, 로컬 개발 환경에서도 문제없이 MongoDB에 유저 데이터가 생성/업데이트(Upsert)됩니다.

### Q2. `"Missing Publishable Key"` 에러가 발생해요.
- `frontend/.env` 파일에 `VITE_CLERK_PUBLISHABLE_KEY`가 오타 없이 작성되어 있는지 확인하세요.
- `.env` 파일을 새로 만들었거나 수정했다면 Vite 개발 서버(`npm run dev`)를 껐다가 다시 켜야 환경 변수가 반영됩니다.

### Q3. 백엔드에서 `req.auth` 또는 `getAuth(req)`가 `null`을 반환해요.
- [`server.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/server.js)에 `app.use(clerkMiddleware())`가 라우터 등록보다 **상단(먼저)**에 연결되어 있는지 확인하세요.
- 프론트엔드 요청 시 `Authorization: Bearer <token>` 헤더가 올바르게 전달되었는지 확인하세요.
