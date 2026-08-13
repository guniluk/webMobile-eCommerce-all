# 🌼 daisyUI v5 초보자 완전 가이드 (Vite + React + Tailwind CSS v4)

이 문서는 **Vite React** 환경에서 **Tailwind CSS v4**와 **daisyUI (v5)**를 설치하고 프로젝트에 적용하는 전체 과정을 누구나 쉽게 따라 할 수 있도록 정리한 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [daisyUI 소개 & 장점](#1-daisyui-소개--장점)
2. [설치 및 세팅 방법](#2-설치-및-세팅-방법)
3. [daisyUI 메인 컴포넌트 클래스 모음](#3-daisyui-메인-컴포넌트-클래스-모음)
4. [실전 사용 예시 코드 ([ProductsPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx))](#4-실전-사용-예시-코드)
5. [테마(Theme) 설정 및 커스터마이징](#5-테마theme-설정-및-커스터마이징)
6. [자주 하는 실수 & 검증 (Troubleshooting)](#6-자주-하는-실수--검증-troubleshooting)

---

## 1. daisyUI 소개 & 장점

**daisyUI**는 Tailwind CSS를 한 단계 확장해 주는 UI 컴포넌트 클래스 라이브러리입니다.
긴 Tailwind 클래스들의 조합 대신 `btn`, `card`, `badge`, `modal`, `table` 등 **단 하나의 시맨틱 클래스**로 디자인을 완벽하게 적용할 수 있습니다.

### ✨ 대표 장점
- **코드량 대폭 감소**: `<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">` ➔ `<button className="btn btn-primary">`
- **다양한 테마(Theme) 지원**: `light`, `dark`, `cupcake`, `nord` 등 30개 이상의 기본 테마 자동 내장
- **시맨틱 컴포넌트 기반**: 접근성과 일관된 반응형 디자인 제공

---

## 2. 설치 및 세팅 방법

### 2.1 패키지 설치

터미널을 열고 웹 프론트엔드 디렉터리(`frontend`)로 이동한 뒤 설치합니다:

```bash
cd frontend
npm install -D daisyui@latest
```

### 2.2 CSS 파일 세팅 (`frontend/src/index.css`)

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
| **배지 (Badge)** | `badge`, `badge-primary`, `badge-success`, `badge-warning` | 카테고리, 태그, 상태 표시 |
| **테이블 (Table)** | `table`, `table-zebra`, `table-sm` | 깔끔한 표 및 얼룩말 패턴 표 |
| **모달 (Modal)** | `modal`, `modal-box`, `modal-action` | 대화상자/팝업 컴포넌트 |
| **입력폼 (Input/Select)**| `input`, `input-bordered`, `select`, `select-bordered` | 테두리가 있는 입력창 및 선택 박스 |
| **카드 (Card)** | `card`, `card-body`, `card-title`, `card-actions` | 상품 카드 및 정보 컨테이너 |

---

## 4. 실전 사용 예시 코드

프로젝트의 [ProductsPage.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/pages/ProductsPage.jsx) 및 [ProductModal.jsx](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/frontend/src/components/ProductModal.jsx)에서 실제 사용하는 형태의 예시입니다.

```jsx
import React from "react";

export default function SampleProductCard() {
  return (
    <div className="p-6 space-y-4">
      {/* 1. 검색 바 & 선택 드롭다운 */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="상품 검색..."
          className="input input-sm input-bordered bg-base-200 text-xs w-64"
        />
        <select className="select select-sm select-bordered bg-base-200 text-xs">
          <option value="ALL">전체 카테고리</option>
          <option value="Electronics">Electronics</option>
          <option value="Fashion">Fashion</option>
        </select>
        <button className="btn btn-primary btn-sm gap-2">
          <span>신규 상품 등록</span>
        </button>
      </div>

      {/* 2. 뱃지 및 카운트 */}
      <div className="flex items-center gap-2">
        <span className="badge badge-primary badge-sm">전체 12개</span>
        <span className="badge badge-success badge-sm">재고 있음</span>
      </div>

      {/* 3. 데이터 테이블 */}
      <div className="overflow-x-auto bg-base-100 border border-base-300 rounded-2xl">
        <table className="table table-sm text-xs">
          <thead>
            <tr>
              <th>상품명</th>
              <th>카테고리</th>
              <th>가격</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-bold">스마트 워치 Pro</td>
              <td><span className="badge badge-outline">Electronics</span></td>
              <td>₩ 250,000</td>
              <td>
                <button className="btn btn-xs btn-ghost">수정</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 5. 테마(Theme) 설정 및 커스터마이징

daisyUI는 HTML 태그에 `data-theme` 속성을 지정하는 것만으로 테마를 바꿀 수 있습니다.

`index.html`:
```html
<html data-theme="dark">
  ...
</html>
```

---

## 6. 자주 하는 실수 & 검증 (Troubleshooting)

### ❓ 버튼이나 입력창 스타일이 제대로 안 나옵니다.
- **원인**: `src/index.css` 파일에 `@plugin "daisyui";`가 누락되었거나 `@import "tailwindcss";`보다 밑에 위치하지 않은 경우
- **해결**: `index.css` 최상단에 `@import "tailwindcss";`와 `@plugin "daisyui";` 순서대로 작성했는지 확인하세요.

### ❓ 빌드 시 오류가 발생합니다.
- **해결**: 터미널에서 아래 명령어로 빌드 테스트를 수행하여 CSS 번들링 문제를 사전에 검증하세요:
  ```bash
  npm run build
  ```

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
