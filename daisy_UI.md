# Vite + React (Tailwind CSS v4) 환경에서 daisyUI 설치 및 세팅 가이드

이 문서는 **Vite (React)** 환경의 프로젝트에 **daisyUI (v5)**를 설치하고 세팅하는 전체 과정을 누구나 쉽게 따라 할 수 있도록 정리한 실전 가이드입니다.

---

## 1. daisyUI란?

**daisyUI**는 Tailwind CSS를 기반으로 한 구성 요소(Component) 라이브러리로, `btn`, `card`, `badge`, `modal`, `navbar` 등의 다양한 시각적 요소와 컴포넌트 클래스를 즉시 사용할 수 있도록 제공합니다.

---

## 2. 설치 방법

터미널을 열고 프론트엔드 프로젝트 디렉터리(`frontend`)로 이동한 뒤 설치합니다.

```bash
cd frontend
npm install -D daisyui@latest
```

---

## 3. CSS 파일 (`src/index.css`) 세팅

Tailwind CSS v4 환경에서는 메인 CSS 파일 상단에 `@plugin "daisyui";` 플러그인 구문을 추가해 주는 것만으로 세팅이 완료됩니다.

### 📄 `frontend/src/index.css`

```css
@import "tailwindcss";
@plugin "daisyui";
```

---

## 4. daisyUI 컴포넌트 사용 예시

daisyUI가 제공하는 유틸리티 클래스를 사용하여 React 컴포넌트를 손쉽게 스타일링할 수 있습니다.

### 📄 `frontend/src/components/SampleDaisy.jsx` 예시

```jsx
import React from "react";

const SampleDaisy = () => {
  return (
    <div className="p-6 space-y-4">
      {/* 1. 버튼 (Button) */}
      <div className="flex gap-2">
        <button className="btn btn-primary">Primary Button</button>
        <button className="btn btn-secondary">Secondary Button</button>
        <button className="btn btn-accent">Accent Button</button>
        <button className="btn btn-outline">Outline Button</button>
      </div>

      {/* 2. 뱃지 (Badge) */}
      <div className="flex gap-2">
        <span className="badge badge-primary">Primary</span>
        <span className="badge badge-success">Success</span>
        <span className="badge badge-warning">Warning</span>
        <span className="badge badge-error">Error</span>
      </div>

      {/* 3. 카드 (Card) */}
      <div className="card w-96 bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title">daisyUI Card!</h2>
          <p>daisyUI 컴포넌트를 사용하면 스타일링이 훨씬 빨라집니다.</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Buy Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDaisy;
```

---

## 5. 결과 확인 및 검증

### 5.1 개발 서버 실행
다음 명령어로 로컬 개발 서버를 가동하여 브라우저에서 daisyUI 스타일이 잘 반영되는지 확인합니다.

```bash
npm run dev
```

### 5.2 프로덕션 빌드 테스트
스타일 번들링에 이상이 없는지 확인합니다.

```bash
npm run build
```

---

## 💡 요약 체크리스트

| 단계 | 작업 내용 | 파일 및 명령어 |
|---|---|---|
| **1** | 패키지 설치 | `npm install -D daisyui@latest` |
| **2** | CSS 플러그인 추가 | `src/index.css` 파일에 `@plugin "daisyui";` 추가 |
| **3** | 클래스 활용 | React 컴포넌트에서 `btn`, `badge`, `card` 등 사용 |
| **4** | 검증 | `npm run build` 실행하여 성공 여부 확인 |
