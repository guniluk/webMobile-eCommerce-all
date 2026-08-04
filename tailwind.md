# Vite + React 환경에서 Tailwind CSS v4 설치 및 세팅 가이드

이 문서는 **Vite(React)** 프론트엔드 프로젝트에 **Tailwind CSS v4**를 처음부터 설치하고 설정하는 전체 과정을 누구나 쉽게 따라 할 수 있도록 정리한 가이드입니다.

---

## 1. 프론트엔드 디렉터리로 이동

터미널을 열고 프론트엔드 프로젝트 폴더(`frontend`)로 이동합니다.

```bash
cd frontend
```

---

## 2. Tailwind CSS 및 Vite 플러그인 설치

Tailwind CSS 최신 버전(v4) 및 Vite 전용 공식 플러그인을 개발 의존성(`devDependencies`)으로 설치합니다.

```bash
npm install -D tailwindcss @tailwindcss/vite
```

---

## 3. Vite 설정 파일 (`vite.config.js`) 수정

Vite가 Tailwind CSS를 빌드 프로세스에서 인식하고 처리할 수 있도록 `vite.config.js` 파일에 `@tailwindcss/vite` 플러그인을 추가합니다.

### 📄 `frontend/vite.config.js`

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

---

## 4. 메인 CSS 파일 (`src/index.css`) 수정

CSS 파일 상단에 Tailwind CSS v4의 통합 지시어인 `@import "tailwindcss";`를 추가합니다.

### 📄 `frontend/src/index.css`

```css
@import "tailwindcss";
```

---

## 5. React 컴포넌트에서 Tailwind CSS 사용하기

이제 React 컴포넌트에서 `className` 속성을 사용하여 Tailwind CSS 유틸리티 클래스를 적용할 수 있습니다.

### 📄 `frontend/src/App.jsx` 예시

```jsx
import React from "react";

const App = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-3xl font-bold text-indigo-400">
          Tailwind CSS v4 적용 완료!
        </h1>
        <p className="text-slate-400 mt-2">
          Vite와 Tailwind CSS가 성공적으로 세팅되었습니다.
        </p>
        <button className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-600/30">
          확인
        </button>
      </div>
    </div>
  );
};

export default App;
```

---

## 6. 결과 확인 및 빌드 검증

### 6.1 개발 서버 실행
다음 명령어로 로컬 개발 서버를 실행하여 브라우저에서 스타일이 잘 나오는지 확인합니다.

```bash
npm run dev
```

### 6.2 프로덕션 빌드 검증
스타일 파일이 문제없이 번들링되는지 검증하려면 빌드 명령을 실행합니다.

```bash
npm run build
```

---

## 💡 요약 체크리스트

| 단계 | 작업 내용 | 명령어 / 수정 파일 |
|---|---|---|
| **1** | 패키지 설치 | `npm install -D tailwindcss @tailwindcss/vite` |
| **2** | Vite 플러그인 등록 | `vite.config.js` 에 `plugins: [react(), tailwindcss()]` 추가 |
| **3** | Tailwind 지시어 추가 | `src/index.css` 맨 위에 `@import "tailwindcss";` 추가 |
| **4** | 스타일 적용 | React 컴포넌트에 `className="..."` 활용 |
