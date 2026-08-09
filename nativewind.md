# 📱 Expo (React Native) 환경 NativeWind v4 오류 없는 완벽 설치 & 세팅 가이드

이 문서는 **Expo (React Native)** 모바일 프로젝트에 **NativeWind v4(Tailwind CSS)**를 에러 없이 안전하게 설치하고 설정하는 전체 과정을 누구나 쉽게 따라 할 수 있도록 정리한 완전 가이드입니다.

---

## 📌 1. NativeWind란?

**NativeWind**는 웹 개발에서 널리 쓰이는 **Tailwind CSS 유틸리티 클래스**를 React Native 컴포넌트(`View`, `Text`, `TouchableOpacity` 등)의 `className` 속성으로 그대로 사용할 수 있게 해주는 라이브러리입니다.

---

## ⚠️ 2. 에러 방지를 위한 핵심 사전 체크

NativeWind 설치 시 가장 빈번하게 발생하는 **`SyntaxError: private properties are not supported`** 또는 **`Cannot find module 'babel-preset-expo'`** 에러는 패키지 버전 미스매치 및 Babel 플러그인 누락이 원인입니다.

아래 가이드는 Expo SDK 버전과의 호환성을 100% 보장하는 **안전한 설치 순서**로 작성되었습니다.

---

## 🛠️ 3. 단계별 완벽 설치 및 세팅 절차

### 1단계: 모바일 디렉터리로 이동

터미널을 열고 모바일 프로젝트 폴더(`mobile`)로 이동합니다.

```bash
cd mobile
```

---

### 2단계: NativeWind 및 의존 패키지 안전 설치

일반 `npm install` 대신 **`npx expo install`** 명령어를 사용하면 현재 설치된 Expo SDK 버전(SDK 54 등)과 100% 호환되는 최적의 패키지 버전이 자동으로 설치됩니다.

```bash
# Expo 호환 설치 명령
npx expo install nativewind tailwindcss@^3.4.17 react-native-reanimated
```

---

### 3단계: `global.css` 메인 스타일 파일 생성

프로젝트 루트(`mobile/global.css`)에 Tailwind CSS 기본 지시어를 포함하는 CSS 파일을 생성합니다.

#### 📄 `mobile/global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### 4단계: `tailwind.config.js` 설정 파일 생성

Tailwind CSS가 클래스를 스캔할 파일 경로와 NativeWind 프리셋을 설정합니다.

#### 📄 `mobile/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  // 스타일을 적용할 파일 경로 지정 (app, components, src 폴더 등)
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

### 5단계: Metro 번들러 연동 (`metro.config.js`)

Expo의 Metro 번들러가 `global.css`를 인라인 스타일로 번들링할 수 있도록 설정합니다.

#### 📄 `mobile/metro.config.js`

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

---

### 6단계: Babel 프리셋 및 플러그인 설정 (`babel.config.js`) ★ 중요!

> 🚨 **주의**: `react-native-reanimated/plugin` 플러그인을 반드시 포함해야 Private Class Properties 관련 구문 오류(`private properties are not supported`)가 방지됩니다.

#### 📄 `mobile/babel.config.js`

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin", // Reanimated 및 Private 문법 호환성용 플러그인
    ],
  };
};
```

---

### 7단계: TypeScript 타입 선언 (`nativewind-env.d.ts`)

TypeScript 환경에서 `className` 속성 사용 시 빨간 줄(타입 에러)이 생기지 않도록 타입 선언 파일을 생성합니다.

#### 📄 `mobile/nativewind-env.d.ts`

```typescript
/// <reference types="nativewind/types" />
```

---

### 8단계: 최상위 레이아웃에 `global.css` 임포트

Expo Router의 최상위 레이아웃 파일(`app/_layout.tsx` 또는 `app/_layout.jsx`) 맨 위에 `global.css`를 불러옵니다.

#### 📄 `mobile/app/_layout.tsx`

```tsx
import '../global.css'; // 👈 파일 최상단에 임포트 필수!
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}
```

---

### 9단계: React Native 컴포넌트에 NativeWind 적용 및 확인

이제 `className` 속성을 이용해 자유롭게 Tailwind CSS 스타일을 적용할 수 있습니다!

#### 📄 `mobile/app/index.tsx` 예시

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-slate-900 px-6">
      <View className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-lg items-center max-w-sm w-full">
        <Text className="text-3xl font-extrabold text-cyan-400 mb-2">
          NativeWind v4 🚀
        </Text>
        <Text className="text-lg font-semibold text-slate-100 mb-4">
          오류 없이 완벽 적용 완료!
        </Text>
        <Text className="text-sm text-slate-400 text-center leading-6">
          React Native에서도 Tailwind CSS className 스타일을 빠르게 활용할 수 있습니다.
        </Text>
      </View>
    </View>
  );
}
```

---

## 🧪 4. 검증 및 캐시 클리어 실행

설정 변경 후 이전 번들 캐시로 인한 오류를 방지하기 위해 **반드시 `--clear` 옵션**으로 서버를 실행합니다:

```bash
# 1. 의존성 패키지 정상 여부 검증
npx expo-doctor

# 2. 캐시를 비우고 앱 실행 (필수!)
npx expo start --clear
```

---

## 🛠️ 5. 주요 실전 에러 예방 & 해결 트러블슈팅 (Troubleshooting)

### 🔴 1. `runtime not ready: syntaxError: private properties are not supported`
- **원인**: `babel-preset-expo` 버전이 Expo SDK와 미스매치되었거나 `react-native-reanimated/plugin` 설정이 누락된 경우.
- **해결책**:
  1. `mobile/babel.config.js`에 `plugins: ["react-native-reanimated/plugin"]` 추가.
  2. 패키지 자동 재정렬 실행:
     ```bash
     npx expo install --fix
     ```

---

### 🔴 2. `Error: Cannot find module 'babel-preset-expo'`
- **원인**: `mobile` 프로젝트 내에 `babel-preset-expo` 모듈이 누락되었거나 손상된 경우.
- **해결책**:
  ```bash
  npx expo install babel-preset-expo
  ```

---

### 🔴 3. `className` 스타일이 화면에 즉시 안 나와요.
- **원인**: Metro 번들러 및 Babel 캐시가 남아있는 현상.
- **해결책**: Expo 개발 서버 재시작 시 `--clear` 플래그를 꼭 사용하세요:
  ```bash
  npx expo start --clear
  ```

---

### 🔴 4. TypeScript에서 `Property 'className' does not exist...` 빨간 줄 에러
- **해결책**:
  1. `mobile/nativewind-env.d.ts` 파일이 존재하는지 확인.
  2. VSCode에서 `Cmd+Shift+P` ➔ `TypeScript: Restart TS Server` 실행.

---

## 📋 요약 체크리스트

| 순서 | 작업 내용 | 파일 / 명령어 | 비고 |
|:---:|:---|:---|:---|
| **1** | 패키지 안전 설치 | `npx expo install nativewind tailwindcss@^3.4.17` | SDK 호환 버전 설치 |
| **2** | CSS 디렉티브 작성 | `mobile/global.css` | `@tailwind base...` |
| **3** | 스캔 경로 설정 | `mobile/tailwind.config.js` | `presets: [require("nativewind/preset")]` |
| **4** | Metro 번들러 연결 | `mobile/metro.config.js` | `withNativeWind(config, { input: "./global.css" })` |
| **5** | Babel & Reanimated 등록 | `mobile/babel.config.js` | `react-native-reanimated/plugin` 추가 |
| **6** | TypeScript 선언 | `mobile/nativewind-env.d.ts` | `/// <reference types="nativewind/types" />` |
| **7** | global.css 불러오기 | `mobile/app/_layout.tsx` | 최상단 `import '../global.css'` |
| **8** | 검증 & 캐시 클리어 실행 | `npx expo-doctor` & `npx expo start --clear` | 에러 없이 실행 |

---
*가이드 작성 완료 - 프로젝트 루트 디렉터리 (`nativewind.md`)*
