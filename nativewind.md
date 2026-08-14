# 📱 NativeWind v4 (Expo / React Native + Tailwind CSS) 가이드

이 문서는 **Expo (React Native)** 모바일 앱 환경에서 **NativeWind (v4)**를 설정하고, `className` 속성을 활용해 유연한 반응형 UI와 다크모드를 구축하는 완전 실전 가이드입니다.

---

## 📌 목차
1. [NativeWind 소개 및 특징](#1-nativewind-소개-및-특징)
2. [Expo 프로젝트 설치 및 설정 과정](#2-expo-프로젝트-설치-및-설정-과정)
3. [메인 컴포넌트 클래스 패턴 & 실전 예시](#3-메인-컴포넌트-클래스-패턴--실전-예시)
4. [다크 모드 (Dark Mode) 적용 방법](#4-다크-모드-dark-mode-적용-방법)
5. [⚠️ 모바일 빌드 및 스타일링 주의사항](#5-️-모바일-빌드-및-스타일링-주의사항)

---

## 1. NativeWind 소개 및 특징

NativeWind는 React Native의 `StyleSheet` 객체 대신 웹의 **Tailwind CSS 클래스명(`className`)**을 동일하게 사용할 수 있게 해주는 전처리기 라이브러리입니다.

- **속도 & 생산성 극대화**: 웹 프론트엔드와 동일한 문법 스타일 적용 가능
- **다크 모드 내장**: `dark:bg-slate-800 dark:text-white` 형태의 다크모드 손쉬운 구현
- **반응형 Flexbox**: `flex-1`, `flex-row`, `items-center`, `justify-between` 등

---

## 2. Expo 프로젝트 설치 및 설정 과정

### 2.1 패키지 설치

```bash
cd mobile
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

### 2.2 `tailwind.config.js` 작성

`mobile/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
```

### 2.3 `babel.config.js` 및 `global.css` 설정

`mobile/babel.config.js`:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
```

`mobile/global.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 3. 메인 컴포넌트 클래스 패턴 & 실전 예시

[ProductCard.tsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/components/shop/ProductCard.tsx) 컴포넌트의 NativeWind 실전 패턴:

```tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Product } from '../../types';
import { getProductImageSource } from '../../lib/productUtils';

export const ProductCard = ({ product, onSelect }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => onSelect(product)}
      className="w-[48%] dark:bg-slate-800 bg-white rounded-2xl mb-4 overflow-hidden border dark:border-slate-700 border-slate-200 shadow-sm"
    >
      <View className="h-40 bg-slate-100 dark:bg-slate-700 relative justify-center items-center">
        <Image
          source={getProductImageSource(product)}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <View className="p-3">
        <Text numberOfLines={1} className="text-sm font-bold dark:text-white text-slate-900 mb-1">
          {product.name}
        </Text>
        <Text className="text-sm font-extrabold dark:text-cyan-400 text-sky-700">
          ₩{(product.price || 0).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
```

---

## 4. 다크 모드 (Dark Mode) 적용 방법

NativeWind v4는 `useColorScheme()` 훅을 통해 다크 모드를 제어합니다:

```tsx
import { useColorScheme } from 'nativewind';
import { Button, View } from 'react-native';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-1 justify-center items-center dark:bg-slate-900 bg-slate-50">
      <Button
        title={`현재 모드: ${colorScheme === 'dark' ? '🌙 다크' : '☀️ 라이트'}`}
        onPress={toggleColorScheme}
      />
    </View>
  );
}
```

---

## 5. ⚠️ 모바일 빌드 및 스타일링 주의사항

1. **`div`, `span` 등 웹 태그 금지**: NativeWind는 `View`, `Text`, `Image`, `TouchableOpacity` 등 React Native 기본 컴포넌트의 `className`에 작동합니다.
2. **`npx tsc --noEmit` 검증**: 컴포넌트 추가 및 리팩토링 후 항상 TypeScript 타입 체크를 수행하세요.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
