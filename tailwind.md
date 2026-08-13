# 🎨 Tailwind CSS v4 & v3 초보자 완전 가이드

이 문서는 **Vite React 웹 프론트엔드** 프로젝트에 **Tailwind CSS**를 설치하고 효과적인 유틸리티 클래스를 사용하는 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [Tailwind CSS 소개 & 핵심 개념](#1-tailwind-css-소개--핵심-개념)
2. [Vite React 환경 설치 및 세팅](#2-vite-react-환경-설치-및-세팅)
3. [자주 사용하는 필수 유틸리티 클래스 모음](#3-자주-사용하는-필수-유틸리티-클래스-모음)
4. [프로젝트 적용 실전 코드 ([ProductsPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx))](#4-프로젝트-적용-실전-코드)
5. [자주 하는 실수 & 검증 (Troubleshooting)](#5-자주-하는-실수--검증-troubleshooting)

---

## 1. Tailwind CSS 소개 & 핵심 개념

**Tailwind CSS**는 CSS 클래스를 직접 작성하는 대신, 사전 정의된 저수준 유틸리티 클래스(Utility-First)를 사용해 HTML/JSX 내에서 직관적으로 디자인을 구현하는 프레임워크입니다.

---

## 2. Vite React 환경 설치 및 세팅

### 2.1 패키지 설치

`frontend` 디렉터리에서 설치를 진행합니다:

```bash
cd frontend
npm install -D tailwindcss @tailwindcss/vite
```

### 2.2 CSS 파일 세팅 (`frontend/src/index.css`)

Tailwind CSS v4 환경의 `index.css`:

```css
@import "tailwindcss";
```

*(daisyUI를 사용하는 경우 바로 아래에 `@plugin "daisyui";` 추가)*

---

## 3. 자주 사용하는 필수 유틸리티 클래스 모음

| 분류 | 유틸리티 클래스 | 설명 |
| :--- | :--- | :--- |
| **레이아웃** | `flex`, `flex-col`, `grid`, `grid-cols-3`, `items-center`, `justify-between` | Flexbox & Grid 레이아웃 |
| **여백 (Spacing)** | `p-4` (패딩), `px-6`, `py-3`, `m-2` (마진), `space-y-4` | 안쪽/밖깥쪽 여백 및 요소 간 간격 |
| **크기 (Sizing)** | `w-full`, `w-64`, `h-12`, `max-w-md`, `flex-1` | 너비, 높이, 최대 너비 |
| **색상 & 텍스트** | `bg-base-100`, `text-slate-800`, `text-xs`, `font-bold` | 배경색, 글자색, 크기, 굵기 |
| **테두리 & 그림자**| `rounded-2xl`, `border`, `border-base-300`, `shadow-xl` | 모서리 둥글기, 테두리, 그림자 효과 |

---

## 4. 프로젝트 적용 실전 코드

웹 프론트엔드의 [ProductsPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx) 헤더 UI 구성 예시입니다:

```jsx
export default function HeaderBar() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-base-100 border border-base-300 p-5 rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <input
          type="text"
          placeholder="상품명 또는 카테고리 검색..."
          className="input input-sm input-bordered w-full bg-base-200 text-xs pl-9 pr-4"
        />
      </div>
      <button className="btn btn-primary btn-sm text-primary-content gap-2 font-bold shadow-lg shadow-primary/20">
        + 신규 상품 등록
      </button>
    </div>
  );
}
```

---

## 5. 자주 하는 실수 & 검증 (Troubleshooting)

### ❓ 클래스를 추가했는데 스타일 반응이 없습니다.
- **해결**: `index.html` 또는 `main.jsx`에서 `index.css`를 정확하게 `import './index.css'` 하였는지 확인하세요.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
