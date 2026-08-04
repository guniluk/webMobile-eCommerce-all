# React (Vite) 환경에서 TanStack Query (v5) 설치 및 사용 가이드

이 문서는 **TanStack Query (React Query v5)**를 설치하고 프로젝트에 적용 및 활용하는 전 과정을 초보자도 쉽게 따라 할 수 있도록 정리한 실전 가이드입니다.

---

## 1. TanStack Query란?

TanStack Query는 React 애플리케이션에서 **서버 상태(Server State) 관리, 데이터 패칭(Data Fetching), 캐싱(Caching), 자동 재요청(Auto Re-fetching)** 등을 간편하게 처리해 주는 라이브러리입니다.

---

## 2. 설치 방법

터미널에서 프론트엔드 디렉터리(`frontend`)로 이동한 후 설치를 진행합니다.

```bash
cd frontend
npm install @tanstack/react-query @tanstack/react-query-devtools
```

---

## 3. 기본 세팅 (`main.jsx`)

애플리케이션 전역에서 TanStack Query를 사용할 수 있도록 `QueryClient` 인스턴스를 생성하고 `<QueryClientProvider>`로 감싸줍니다.

### 📄 `frontend/src/main.jsx`

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router";
import { ClerkProvider } from "@clerk/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// 1. QueryClient 인스턴스 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 데이터 "신선" 상태 유지 (자동 재요청 방지)
      retry: 1, // 실패 시 1회 재시도
    },
  },
});

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* 2. QueryClientProvider로 앱 전체를 감싸기 */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <App />
        </ClerkProvider>
      </BrowserRouter>
      {/* 3. 개발자 도구 (개발 환경에서 화면 하단에 표시) */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
```

---

## 4. 핵심 사용법 (Hooks)

### 4.1 데이터 조회: `useQuery`

서버에서 데이터를 읽어올 때(GET 요청) 사용합니다.

```jsx
import { useQuery } from "@tanstack/react-query";

// API 요청 함수
const fetchProducts = async () => {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("상품 목록을 불러오는데 실패했습니다.");
  return res.json();
};

function ProductList() {
  const { data: products, isLoading, isError, error } = useQuery({
    queryKey: ["products"], // 캐싱에 사용되는 고유 키
    queryFn: fetchProducts, // 데이터를 가져오는 비동기 함수
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (isError) return <div>에러 발생: {error.message}</div>;

  return (
    <ul>
      {products.map((item) => (
        <li key={item.id}>{item.name} - {item.price}원</li>
      ))}
    </ul>
  );
}
```

---

### 4.2 데이터 변경 및 무효화: `useMutation`

서버에 데이터를 생성/수정/삭제(POST, PUT, DELETE)할 때 사용하며, 완료 후 기존 캐시 데이터를 갱신(`invalidateQueries`)합니다.

```jsx
import { useMutation, useQueryClient } from "@tanstack/react-query";

// API 요청 함수 (새 상품 추가)
const addProduct = async (newProduct) => {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newProduct),
  });
  return res.json();
};

function AddProductForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      // 상품 생성 성공 시 'products' 키의 캐시를 무효화하여 자동으로 최신 목록 다시 요청
      queryClient.invalidateQueries({ queryKey: ["products"] });
      alert("상품이 추가되었습니다!");
    },
    onError: (error) => {
      console.error("추가 실패:", error);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ name: "새 상품", price: 15000 });
  };

  return (
    <button onClick={handleSubmit} disabled={mutation.isPending}>
      {mutation.isPending ? "추가 중..." : "상품 추가하기"}
    </button>
  );
}
```

---

## 5. 실전 요약 표

| 기능 | Hook / 메서드 | 설명 |
|---|---|---|
| **데이터 읽기** | `useQuery` | 데이터 조회, 자동 캐싱, 로딩/에러 상태 관리 |
| **데이터 변경** | `useMutation` | 생성(C), 수정(U), 삭제(D) 비동기 작업 처리 |
| **캐시 갱신** | `queryClient.invalidateQueries` | 기존 캐시를 만료시켜 최신 데이터 자동 패칭 |
| **디버깅 도구** | `<ReactQueryDevtools />` | 캐시 상태 확인 및 수동 갱신/초기화 툴 제공 |
