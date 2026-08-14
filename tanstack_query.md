# ⚡ TanStack Query v5 (React Query) 실전 활용 가이드

이 문서는 **Vite React 웹 프론트엔드** 및 **Expo (React Native) 모바일 앱** 환경에서 **TanStack Query (v5.101.4 이상)**를 사용하여 서버 상태(Server State) 관리, 자동 캐싱, 무효화(Invalidation), 최فا적 업데이트(Optimistic Update)를 구현하는 구축 가이드입니다.

---

## 📌 목차
1. [TanStack Query v5 주요 개념](#1-tanstack-query-v5-주요-개념)
2. [QueryClient 설정 (`App.jsx` / `_layout.tsx`)](#2-queryclient-설정-appjsx--_layouttsx)
3. [주요 쿼리 훅 (`useQuery`) 작성 패턴](#3-주요-쿼리-훅-usequery-작성-패턴)
4. [뮤테이션 훅 (`useMutation`) & 캐시 무효화 패턴](#4-뮤테이션-훅-usemutation--캐시-무효화-패턴)
5. [모바일 앱 (Expo) 쿼리 캐시 공유 가이드](#5-모바일-앱-expo-쿼리-캐시-공유-가이드)

---

## 1. TanStack Query v5 주요 개념

TanStack Query는 백엔드 API와의 데이터 동기화, 캐싱, 백그라운드 갱신, 에러 처리, 로딩 상태 관리를 라이프사이클에 맞추어 자동화해 주는 상태 관리 라이브러리입니다.

- `useQuery`: 서버 데이터 Fetching 및 캐싱
- `useMutation`: 데이터 생성/수정/삭제 요청 (CUD)
- `queryClient.invalidateQueries()`: 데이터 변경 후 지정된 키의 캐시를 무효화하여 최신 데이터 자동 재조회

---

## 2. QueryClient 설정 (`App.jsx` / `_layout.tsx`)

### 웹 프론트엔드 (`frontend/src/App.jsx`)

```jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분 캐시 유지
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* 라우터 및 메인 앱 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

---

## 3. 주요 쿼리 훅 (`useQuery`) 작성 패턴

[useProductsQuery.ts](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/mobile/hooks/useProductsQuery.ts) 예시:

```typescript
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useProductsQuery = (category?: string, search?: string) => {
  return useQuery({
    queryKey: ['products', { category, search }],
    queryFn: () => api.getProducts(category, search),
  });
};
```

---

## 4. 뮤테이션 훅 (`useMutation`) & 캐시 무효화 패턴

주문 생성 후 장바구니 및 내 주문 목록 캐시 무효화:

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useCreateOrderMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData: any) => api.createOrder(orderData),
    onSuccess: () => {
      // 🔄 주문 생성 성공 시 관련 쿼리 캐시 자동 무효화
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

---

## 5. 모바일 앱 (Expo) 쿼리 캐시 공유 가이드

모바일 앱에서도 동일한 queryKey 규칙(`['products']`, `['orders']`, `['notifications']`)을 사용하여 웹 관리자에서 배송 상태 변경 시 모바일 앱의 주문/알림 캐시가 손쉽게 최신화되도록 래핑하여 사용합니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
