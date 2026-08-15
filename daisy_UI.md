# 🌼 daisyUI v5 초보자 완전 가이드 (Vite + React + Tailwind CSS v4)

이 문서는 **Vite React** 환경에서 **Tailwind CSS v4**와 **daisyUI (v5)**를 설치하고 프로젝트에 적용하는 전체 과정을 누구나 쉽게 따라 할 수 있도록 정리한 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [daisyUI 소개 & 장점](#1-daisyui-소개--장점)
2. [설치 및 세팅 방법](#2-설치-및-세팅-방법)
3. [daisyUI 메인 컴포넌트 클래스 모음](#3-daisyui-메인-컴포넌트-클래스-모음)
4. [실전 사용 예시 코드 ([ProductsPage.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx))](#4-실전-사용-예시-코드)
5. [테마(Theme) 설정 및 커스터마이징](#5-테마theme-설정-및-커스터마이징)
6. [자주 하는 실수 & 검증 (Troubleshooting)](#6-자주-하는-실수--검증-troubleshooting)

---

## 1. daisyUI 소개 & 장점

**daisyUI**는 Tailwind CSS를 한 단계 확장해 주는 시맨틱 UI 컴포넌트 클래스 라이브러리입니다.
긴 Tailwind 유틸리티 클래스들의 나열 대신 `btn`, `card`, `badge`, `modal`, `table`, `select` 등 **단 하나의 시맨틱 클래스**로 고품질 UI를 구현할 수 있습니다.

### ✨ 대표 장점
- **코드량 대폭 감소**: `<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">` ➔ `<button className="btn btn-primary">`
- **다양한 테마(Theme) 지원**: `forest`, `dark`, `emerald`, `synthwave`, `nord` 등 30개 이상의 기본 테마 자동 내장
- **시맨틱 컴포넌트 기반**: 모바일과 데스크톱 모두에서 일관된 반응형 접근성 제공

---

## 2. 설치 및 세팅 방법

### 2.1 패키지 설치

터미널을 열고 웹 프론트엔드 디렉터리(`frontend`)로 이동한 뒤 설치합니다:

```bash
cd frontend
npm install -D daisyui@latest
```

### 2.2 CSS 파일 세팅 ([index.css](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/index.css))

Tailwind CSS v4 환경에서는 CSS 파일 상단에 `@plugin "daisyui";` 지시어를 추가하는 것만으로 모든 플러그인 설정이 완료됩니다.

`frontend/src/index.css`:
```css
@import "tailwindcss";
@plugin "daisyui";
```

---

## 3. daisyUI 메인 컴포넌트 클래스 모음

| 컴포넌트 구분 | daisyUI 클래스 | 설명 |
| :--- | :--- | :--- |
| **버튼 (Button)** | `btn`, `btn-primary`, `btn-secondary`, `btn-outline`, `btn-sm` | 기본/주요/외곽선/소형 버튼 |
| **배지 (Badge)** | `badge`, `badge-primary`, `badge-success`, `badge-warning`, `badge-error` | 카테고리, 태그, 재고/상태 표시 |
| **테이블 (Table)** | `table`, `table-zebra`, `table-sm` | 정돈된 데이터 테이블 |
| **모달 (Modal)** | `modal`, `modal-box`, `modal-action` | 대화상자/팝업 컴포넌트 |
| **입력폼 (Input/Select)**| `input`, `input-bordered`, `select`, `select-bordered` | 반응형 입력창 및 선택 박스 |
| **카드 (Card)** | `card`, `card-body`, `card-title`, `card-actions` | 통계 카드 및 상품 정보 컨테이너 |

---

## 4. 실전 사용 예시 코드

프로젝트의 [ProductsPage.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx) 및 [ProductModal.jsx](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/frontend/src/components/ProductModal.jsx)에서 실제 사용하는 반응형 패턴 예시입니다.

```jsx
import React from 'react';
import { Search, Plus } from 'lucide-react';

export default function ProductActionHeader() {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 bg-base-100 border border-base-300 p-4 sm:p-5 rounded-2xl shadow-xl">
      {/* 1. 반응형 검색바 & 카테고리 셀렉트 */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
        <div className="relative flex-1 min-w-0 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-base-content/50 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="상품명 또는 카테고리 검색 (2글자 이상)..."
            className="input input-sm input-bordered w-full min-w-0 bg-base-200 text-base-content text-sm sm:text-xs pl-9 pr-4 focus:outline-primary"
          />
        </div>

        <select className="select select-sm select-bordered bg-base-200 text-base-content text-sm sm:text-xs w-full sm:w-auto shrink-0 focus:outline-primary">
          <option value="ALL">전체 카테고리</option>
          <option value="Books">Books</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
        </select>
      </div>

      {/* 2. 주요 액션 버튼 */}
      <button className="btn btn-primary btn-sm text-primary-content gap-2 font-bold shadow-lg shadow-primary/20 w-full sm:w-auto shrink-0 justify-center">
        <Plus className="w-4 h-4" />
        <span>신규 상품 등록</span>
      </button>
    </div>
  );
}
```

---

## 5. 테마(Theme) 설정 및 커스터마이징

daisyUI는 HTML 태그에 `data-theme` 속성을 지정하는 것만으로 테마를 바꿀 수 있습니다.

`index.html`:
```html
<html data-theme="forest">
  ...
</html>
```

---

## 6. 자주 하는 실수 & 검증 (Troubleshooting)

### ❓ 버튼이나 입력창 스타일이 제대로 안 나옵니다.
- **원인**: `src/index.css` 파일에 `@plugin "daisyui";`가 누락되었거나 `@import "tailwindcss";`보다 밑에 위치하지 않은 경우
- **해결**: `index.css` 최상단에 `@import "tailwindcss";`와 `@plugin "daisyui";` 순서대로 작성했는지 확인하세요.

### ❓ 모바일 화면에서 input 내부 글자가 찌그러지거나 잘립니다.
- **해결**: Flexbox 부모 컨테이너 및 input 요소에 `min-w-0 w-full` 클래스를 추가하면 좁은 해상도에서도 글자가 잘리지 않고 온전하게 표시됩니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.

