# 🎨 Tailwind CSS v4 완전 가이드 (Vite & Mobile)

이 문서는 웹 프론트엔드(**Tailwind CSS v4**) 및 모바일 앱(**NativeWind**) 환경에서 Tailwind를 설치하고 구성하는 방법과 주요 유틸리티 클래스 모음 가이드입니다.

---

## 📌 목차
1. [Tailwind CSS v4의 변경사항 & 특징](#1-tailwind-css-v4의-변경사항--특징)
2. [Vite React 웹 프론트엔드 세팅 (`@tailwindcss/vite`)](#2-vite-react-웹-프론트엔드-세팅-tailwindcssvite)
3. [자주 사용되는 반응형 & 유틸리티 클래스 모음](#3-자주-사용되는-반응형--유틸리티-클래스-모음)
4. [모바일 앱 (NativeWind)과 클래스 호환성](#4-모바일-앱-nativewind과-클래스-호환성)

---

## 1. Tailwind CSS v4의 변경사항 & 특징

- **`tailwind.config.js` 비필수화**: `@import "tailwindcss";` 지시어로 CSS 파일 하나에서 모든 테마와 플러그인을 직접 제어
- **Vite 전용 플러그인 제공**: `@tailwindcss/vite`를 통한 번들링 속도 극대화
- **CSS 기반 변수 커스터마이징**: `@theme` 블록을 활용한 색상 및 폰트 확장

---

## 2. Vite React 웹 프론트엔드 세팅 (`@tailwindcss/vite`)

### 2.1 패키지 설치

```bash
cd frontend
npm install tailwindcss @tailwindcss/vite
```

### 2.2 `vite.config.js` 설정 ([vite.config.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/vite.config.js))

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
```

### 2.3 `index.css` 작성 ([index.css](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/index.css))

```css
@import "tailwindcss";
@plugin "daisyui";
```

---

## 3. 자주 사용되는 반응형 & 유틸리티 클래스 모음

| 분류 | Tailwind 클래스 | 설명 |
| :--- | :--- | :--- |
| **Grid 반응형 레이아웃** | `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6` | 화면 크기별 카드 그리드 |
| **Flexbox 동적 정렬** | `flex items-center justify-between gap-4` | 양끝 정렬 및 요소 간격 |
| **카드 & 컨테이너** | `bg-base-100 border border-base-300 rounded-2xl shadow-xl p-5` | 테마 연동 컨테이너 카드 디자인 |
| **반응형 너비 & 줄임 방지**| `min-w-0 flex-1 w-full sm:max-w-md` | 모바일 텍스트 찌그러짐 방지 |
| **텍스트 & 타이포그래피**| `text-sm font-bold text-base-content` | 시맨틱 텍스트 스타일링 |

---

## 4. 모바일 앱 (NativeWind)과 클래스 호환성

- 모바일 앱에서는 `View`, `Text`, `Image`, `TouchableOpacity` 컴포넌트의 `className`에 Tailwind 클래스를 적용합니다.
- `w-[48%]`, `flex-1`, `flex-row`, `dark:bg-slate-800` 등 동일한 유틸리티 클래스를 공유합니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.

