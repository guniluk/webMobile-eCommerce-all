# ⚡ TanStack React Query v5 초보자 완전 가이드 (Web & Mobile)

이 문서는 **Vite React 웹 프론트엔드**와 **Expo React Native 모바일 앱**에서 서버 데이터 패칭, 캐싱, 자동 리프레시를 관리해 주는 **TanStack React Query v5** 라이브러리의 실전 활용 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [TanStack Query 개념 & 도입 장점](#1-tanstack-query-개념--도입-장점)
2. [패키지 설치 및 QueryClientProvider 설정](#2-패키지-설치-및-queryclientprovider-설정)
3. [데이터 조회: `useQuery` 사용법 ([useProductsQuery.ts](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/hooks/useProductsQuery.ts))](#3-데이터-조회-usequery-사용법)
4. [데이터 수정: `useMutation` & 자동 무효화 `invalidateQueries`](#4-데이터-수정-usemutation--자동-무효화-invalidatequeries)
5. [자주 하는 실수 & 검증 (Troubleshooting)](#5-자주-하는-실수--검증-troubleshooting)

---

## 1. TanStack Query 개념 & 도입 장점

**TanStack React Query**는 서버 상태(Server State) 관리 라이브러리로, 데이터 패칭, 로딩/에러 상태 관리, 자동으로 백그라운드 재패칭(Refetching), 캐싱(Caching)을 손쉽게 처리해 줍니다.

---

## 2. 패키지 설치 및 QueryClientProvider 설정

### 2.1 패키지 설치

```bash
# Web 및 Mobile 디렉터리 공통
npm install @tanstack/react-query
```

### 2.2 최상위 Provider 감싸기 (`App.jsx` 또는 `_layout.tsx`)

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분간 캐시 데이터 신선도 유지
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 하위 컴포넌트들 */}
    </QueryClientProvider>
  );
}
```

---

## 3. 데이터 조회: `useQuery` 사용법

모바일 커스텀 훅([useProductsQuery.ts](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/hooks/useProductsQuery.ts)) 예시입니다:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useProductsQuery = (category?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', category || 'All', search || ''],
    queryFn: () => api.getProducts(category, search),
  });
};
```

사용하는 컴포넌트:
```tsx
const { data: products, isLoading, isError } = useProductsQuery(selectedCategory, searchQuery);

if (isLoading) return <ActivityIndicator />;
```

---

## 4. 데이터 수정: `useMutation` & 자동 무효화 `invalidateQueries`

주문 생성 시 즉시 서버 데이터를 최신화하는 패턴 예시입니다:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => api.createOrder(orderData),
    onSuccess: () => {
      // 🔄 주문 목록 및 장바구니 관련 캐시 즉시 무효화하여 최신 데이터로 리프레시
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

---

## 5. 자주 하는 실수 & 검증 (Troubleshooting)

| 현상 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| `queryClient` undefined 에러 | `QueryClientProvider` 미감쌈 | 최상위 컴포넌트에서 `QueryClientProvider`로 감쌌는지 확인 |
| `queryKey` 변경에도 데이터 안 바뀜 | `queryKey` 배열 요소 누락 | 의존하는 상태값(`category`, `search`)을 `queryKey` 배열에 포함시켰는지 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
