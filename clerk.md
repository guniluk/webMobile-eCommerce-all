# 🔐 Clerk 인증(Authentication) 풀스택 적용 완전 가이드

이 문서는 **Vite React 프론트엔드**와 **Express.js 백엔드** 환경에 **Clerk(클러크)** 인증 서비스를 쉽고 완벽하게 적용하는 전 과정을 정리한 종합 가이드입니다.

---

## 📌 1. Clerk 인증 소개 & 흐름도

Clerk은 소셜 로그인(구글, 카카오, 네이버 등), 이메일 비밀번호 로그인, 세션 관리, 유저 프로필 UI를 제공하는 현대적인 인증 플랫폼입니다.

```
[React 프론트엔드]                        [Clerk 서버]                     [Express 백엔드]
        │                                      │                                  │
        ├─────── 1. 로그인 요청 (UI) ─────────>│                                  │
        │<────── 2. JWT 토큰 발급 ──────────────┤                                  │
        │                                      │                                  │
        ├─────── 3. API 요청 (Bearer Token) ─────────────────────────────────────>│
        │                                                                         │ 4. clerkMiddleware()
        │                                                                         │    유효성 검증 & getAuth()
        │<────── 5. API 응답 데이터 ──────────────────────────────────────────────┤
```

---

## 🔑 2. 1단계: Clerk 가입 및 API Key 획득

1. [Clerk.com](https://clerk.com) 접속 후 회원가입 ➔ **`Create Application`** 클릭.
2. 애플리케이션 이름 설정 (예: `my-ecommerce-app`) 및 소셜 로그인 제공자(Google, Email 등) 선택.
3. 생성 완료 후 화면에 나오는 **API Keys**를 복사합니다:
   - **Publishable Key**: `pk_test_...`
   - **Secret Key**: `sk_test_...`

---

## 💻 3. 2단계: Frontend (React + Vite) 세팅

### 1) 패키지 설치
`frontend` 디렉터리에서 Clerk React SDK를 설치합니다.

```bash
cd frontend
npm install @clerk/clerk-react
```

### 2) 환경 변수 설정 (`frontend/.env`)
`frontend` 폴더의 `.env` 파일에 발급받은 Publishable Key를 입력합니다:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

### 3) `main.jsx`에 ClerkProvider 적용
`frontend/src/main.jsx`에서 최상단 앱을 `ClerkProvider`로 감싸줍니다:

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

### 4) 컴포넌트에 Clerk UI 적용 (`App.jsx` 예시)
Clerk에서 기본 제공하는 컴포넌트를 사용하면 로그인 버튼, 프로필 아이콘 등을 쉽게 만듭니다:

```jsx
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

export default function App() {
  return (
    <header className="p-4 flex justify-between items-center border-b">
      <h1 className="text-xl font-bold">My E-Commerce</h1>

      {/* 로그아웃 상태일 때 표시 */}
      <SignedOut>
        <SignInButton mode="modal">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">
            로그인 / 회원가입
          </button>
        </SignInButton>
      </SignedOut>

      {/* 로그인 상태일 때 표시 */}
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </header>
  )
}
```

### 5) 백엔드로 인증 요청 시 JWT 토큰 전달 방법
프론트엔드에서 인증이 필요한 백엔드 API를 호출할 때는 `useAuth()` 훅의 `getToken()`을 헤더에 실어 보냅니다:

```javascript
import { useAuth } from '@clerk/clerk-react'

export function useFetchData() {
  const { getToken } = useAuth()

  const fetchProtectedData = async () => {
    const token = await getToken()

    const response = await fetch('/api/user/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return await response.json()
  }

  return { fetchProtectedData }
}
```

---

## ⚙️ 4. 3단계: Backend (Express.js) 세팅

### 1) 패키지 설치
`backend` 디렉터리에서 최신 Clerk Express SDK를 설치합니다:

```bash
cd backend
npm install @clerk/express
```

### 2) 환경 변수 설정 (`backend/.env`)
`backend/.env` 파일에 Publishable Key와 Secret Key를 추가합니다:

```env
CLERK_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_secret_key_here
```

### 3) `server.js`에 Clerk 미들웨어 적용
`backend/src/server.js` 파일에 `clerkMiddleware()`를 연결합니다:

```javascript
import express from 'express'
import dotenv from 'dotenv'
import { clerkMiddleware } from '@clerk/express'

dotenv.config()

const app = express()

app.use(express.json())

// 글로벌 Clerk 미들웨어 등록 (모든 요청의 세션/토큰 자동 해석)
app.use(clerkMiddleware())

// API 라우터 등록
// ...
```

### 4) 보호된 API 라우트 및 유저 정보 추출 (컨트롤러 예시)
`getAuth(req)`를 사용하면 로그인한 유저의 `userId` 및 인증 여부를 손쉽게 판별할 수 있습니다:

```javascript
import { getAuth } from '@clerk/express'

// 인증이 필요한 API 핸들러
export const getUserProfile = async (req, res) => {
  const { userId, isAuthenticated } = getAuth(req)

  if (!isAuthenticated || !userId) {
    return res.status(401).json({ error: '인증되지 않은 사용자입니다.' })
  }

  // userId를 이용해 MongoDB에서 유저 정보를 조회하거나 처리
  res.status(200).json({
    message: '인증 완료!',
    userId: userId,
  })
}
```

특정 라우트 전체를 강제로 보호하려면 `requireAuth()` 미들웨어를 직접 꽂아줄 수도 있습니다:

```javascript
import { requireAuth } from '@clerk/express'

// 로그인하지 않은 사용자는 401 또는 로그인 페이지로 자동 차단
app.get('/api/user/dashboard', requireAuth(), (req, res) => {
  const { userId } = req.auth
  res.json({ message: `환영합니다! User ID: ${userId}` })
})
```

---

## 🌐 5. 4단계: Render.com 배포 시 환경 변수 설정

Render.com 대시보드에서 배포된 Web Service의 **`Environment Variables`** 탭에 아래 항목들을 반드시 추가해주어야 프로덕션 환경에서도 정상 작동합니다:

| Environment Variable | 설명 | 비고 |
| :--- | :--- | :--- |
| `CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key (`pk_test_...` 또는 `pk_live_...`) | 백엔드/프로덕션용 |
| `CLERK_SECRET_KEY` | Clerk Secret Key (`sk_test_...` 또는 `sk_live_...`) | **[보안]** 백엔드 전용 키 |
| `VITE_CLERK_PUBLISHABLE_KEY` | Vite 프론트엔드 빌드 타임에 주입되는 키 | 프론트엔드용 |

---

## 💡 6. 자주 하는 실수 & 체크리스트 (Troubleshooting)

1. **Vite 환경 변수 접두사 미준수**:
   - React(Vite) 프로젝트 환경 변수는 반드시 **`VITE_`**로 시작해야 클라이언트 코드에서 `import.meta.env.VITE_...`로 읽을 수 있습니다.
2. **CORS 에러 발생 시**:
   - 백엔드의 `app.use(cors())`가 설정되어 있는지 확인하고, 필요 시 `cors({ origin: 'http://localhost:5173', credentials: true })` 옵션을 명시합니다.
3. **Clerk 대시보드 도메인 허용 설정**:
   - 프로덕션 배포 후(`*.onrender.com`), Clerk 대시보드 ➔ `Domains` 설정에서 배포된 주소가 정상 등록되어 있는지 확인합니다.
