# 📱 NativeWind v4 초보자 & 실전 완전 가이드 (Expo / React Native)

이 문서는 **Expo(React Native)** 프로젝트에서 Tailwind CSS 스타일링 라이브러리인 **NativeWind v4**를 설치하고 세팅하는 가장 최신의 쉽고 자세한 실전 가이드입니다.

> 💡 **NativeWind v4 핵심 차이점**  
> NativeWind v4부터는 Metro 번들러와의 통합을 위해 **`metro.config.js` 설정이 필수**입니다! `metro.config.js`를 통해 CSS를 모바일 런타임용 스타일로 사전 빌드 및 변환합니다.

---

## 📌 목차 (Table of Contents)

1. [NativeWind란 무엇인가?](#1-nativewind란-무엇인가)
2. [필수 6단계 세팅 절차 (Metro.config.js 포함)](#2-필수-6단계-세팅-절차-metroconfigjs-포함)
   - [1단계: 패키지 설치](#21-1단계-패키지-설치)
   - [2단계: `tailwind.config.js` 생성 및 설정](#22-2단계-tailwindconfigjs-생성-및-설정)
   - [3단계: `global.css` 생성](#23-3단계-globalcss-생성)
   - [4단계: `metro.config.js` 설정 (★ 핵심)](#24-4단계-metroconfigjs-설정--핵심)
   - [5단계: `babel.config.js` 설정](#25-5단계-babelconfigjs-설정)
   - [6단계: TypeScript 타입 선언 (`nativewind-env.d.ts`)](#26-6단계-typescript-타입-선언-nativewind-envdts)
3. [Root Layout에서 CSS 적용하기 (`app/_layout.tsx`)](#3-root-layout에서-css-적용하기-app_layouttsx)
4. [실전 사용 예시](#4-실전-사용-예시)
5. [NativeWind v4 자주 묻는 질문 & 트러블슈팅](#5-nativewind-v4-자주-묻는-질문--트러블슈팅)

---

## 1. NativeWind란 무엇인가?

**NativeWind**는 웹에서 가장 인기 있는 Tailwind CSS 유틸리티 클래스를 React Native 모바일 앱 환경에서 사용할 수 있게 해주는 라이브러리입니다.

`StyleSheet.create` 대신 `className="flex-row p-4 bg-sky-500 rounded-2xl"` 과 같이 React Native 컴포넌트에 직접 Tailwind 클래스를 작성하여 반응형 및 직관적인 UI를 신속하게 구현할 수 있습니다.

---

## 2. 필수 6단계 세팅 절차 (Metro.config.js 포함)

모든 설치 명령 및 작업은 모바일 프로젝트 디렉터리(예: `mobile/`) 내부에서 진행합니다.

```bash
cd mobile
```

### 2.1 1단계: 패키지 설치

NativeWind v4 및 필수 의존성 패키지를 설치합니다:

```bash
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

---

### 2.2 2단계: `tailwind.config.js` 생성 및 설정

`mobile/` 디렉터리에 `tailwind.config.js` 파일이 없는 경우 생성 후 아래와 같이 설정합니다:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // className 스타일을 적용할 파일들의 경로를 지정합니다.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  // NativeWind preset 필수 등록
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

### 2.3 3단계: `global.css` 생성

`mobile/global.css` 파일에 Tailwind CSS 진입점을 정의합니다:

```css
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";
```

---

### 2.4 4단계: `metro.config.js` 설정 (★ 핵심)

> ❓ **질문: `metro.config.js` 설정이 빠져 있었는데 포함하는 것이 맞나요?**  
> **네, 맞습니다!** NativeWind v4에서는 Metro 번들러가 `global.css` 파일을 읽어 NativeWind 런타임 CSS로 변환하도록 `withNativeWind` 래퍼(Wrapper) 설정이 **반드시 필요**합니다.

`mobile/metro.config.js` 파일에 `withNativeWind`를 적용합니다:

#### 🟢 기본 Expo 프로젝트 세팅 시 (`mobile/metro.config.js`)

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

#### 💡 Sentry 등 다른 서드파티 Metro 설정과 함께 사용할 때

```javascript
const { withNativeWind } = require("nativewind/metro");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

---

### 2.5 5단계: `babel.config.js` 설정

Babel이 NativeWind JSX 변환 및 Reanimated 플러그인을 처리할 수 있도록 `mobile/babel.config.js`를 작성합니다:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
    ],
  };
};
```

---

### 2.6 6단계: TypeScript 타입 선언 (`nativewind-env.d.ts`)

TypeScript 프로젝트의 경우, React Native 컴포넌트(`View`, `Text` 등)에서 `className` 프로퍼티를 인식하여 빨간 줄(에러)이 뜨지 않도록 타입 선언을 추가합니다.

`mobile/nativewind-env.d.ts` 생성:

```typescript
/// <reference types="nativewind/types" />
```

> **참고**: `mobile/tsconfig.json` 파일의 `include` 항목에 `"nativewind-env.d.ts"`가 포함되어 있는지 확인하세요.

---

## 3. Root Layout에서 CSS 적용하기 (`app/_layout.tsx`)

세팅의 마지막 단계로, 최상위 레이아웃 파일에서 `global.css`를 불러옵니다.

`mobile/app/_layout.tsx` 파일 최상단:

```tsx
import "../global.css"; // 👈 최상단에서 global.css 임포트
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

---

## 4. 실전 사용 예시

설정이 완료되면 `className` 속성을 이용해 유틸리티 스타일을 자유롭게 적용할 수 있습니다.

```tsx
import { View, Text, TouchableOpacity } from "react-native";

export default function NativeWindSampleCard() {
  return (
    <View className="flex-1 p-4 justify-center items-center bg-slate-100 dark:bg-slate-900">
      {/* 카드 Container */}
      <View className="w-full max-w-sm p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-md">
        <Text className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          NativeWind v4 적용완료! 🎉
        </Text>
        <Text className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          metro.config.js 통합으로 빌드 타임 CSS 처리가 더욱 빠르고 강력해졌습니다.
        </Text>

        {/* 액션 버튼 */}
        <TouchableOpacity
          activeOpacity={0.8}
          className="w-full py-3 bg-sky-500 active:bg-sky-600 rounded-2xl items-center"
        >
          <Text className="text-white font-bold text-base">
            시작하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 5. NativeWind v4 자주 묻는 질문 & 트러블슈팅

| 증상 및 문제 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| **`className` 스타일이 완전히 무시됨** | `metro.config.js` 누락 또는 `global.css` 경로 불일치 | `metro.config.js`에 `withNativeWind(config, { input: "./global.css" })`가 정상 적용되어 있는지 및 `app/_layout.tsx`에서 `import '../global.css'`를 실행했는지 확인합니다. |
| **TypeScript에서 `className`에 빨간 줄(Lint 에러)** | `nativewind-env.d.ts` 선언 누락 | `mobile/nativewind-env.d.ts` 파일에 `/// <reference types="nativewind/types" />` 추가 확인 |
| **스타일 변경 후 모바일 앱에 반영되지 않음** | Metro 캐시 꼬임 | `npx expo start -c` 명령어로 캐시를 맑게 초기화한 후 개발 서버 재시작 |
| **`content` 경로 관련 스타일 미적용** | `tailwind.config.js` 경로 설정 오류 | `content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"]`와 같이 스타일을 사용할 파일 경로가 올바른지 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
