# ⚡ Inngest v4 백그라운드 워커 & 비동기 이벤트 시스템 가이드

이 문서는 Node.js Express 백엔드 환경에서 **Inngest (v4.13.0 이상)**를 연동하여 Clerk 회원가입 이벤트 비동기 처리, 3중 유저 데이터베이스 동기화, 트랜잭션 성공 알림 등 백그라운드 이벤트를 처리하는 전체 구축 가이드입니다.

---

## 📌 목차
1. [Inngest 개요 및 작동 원리](#1-inngest-개요-및-작동-원리)
2. [패키지 설치 및 환경 설정](#2-패키지-설치-및-환경-설정)
3. [Inngest 클라이언트 & 함수 작성 (`src/inngest/`)](#3-inngest-클라이언트--함수-작성-srcinngest)
4. [Express 엔드포인트 연동 (`/api/inngest`)](#4-express-엔드포인트-연동-apiinngest)
5. [로컬 Dev Server 테스트 및 검증](#5-로컬-dev-server-테스트-및-검증)

---

## 1. Inngest 개요 및 작동 원리

Inngest는 큐(Queue), 워커(Worker) 인프라를 별도로 구축하지 않고도 HTTP 엔드포인트를 통해 비동기 이벤트를 재시도(Retry), 지연(Delay), 팬아웃(Fan-out) 처리할 수 있게 도와주는 Serverless 백그라운드 작업 플랫폼입니다.

```text
[ Clerk / 외부 서비스 ] ─── 1. Webhook Event 발생 ───► [ Express 백엔드 (/api/inngest) ]
                                                                   │
                                                                   ▼ 2. serve() 실행
                                                       [ Inngest Worker Engine ]
                                                                   │
                                                                   ▼ 3. 비동기 DB Upsert / 알림 연동
                                                       [ User.findOneAndUpdate() ]
```

---

## 2. 패키지 설치 및 환경 설정

```bash
cd backend
npm install inngest
```

`backend/.env`:
```env
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

---

## 3. Inngest 클라이언트 & 함수 작성 (`src/inngest/`)

### 3.1 클라이언트 정의 (`src/inngest/client.js`)

```javascript
import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "my-ecommerce-app" });
```

### 3.2 Clerk 유저 생성/수정 동기화 함수 (`src/inngest/functions.js`)

```javascript
import { inngest } from "./client.js";
import { User } from "../models/user.model.js";

export const syncUser = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "고객";

    await User.findOneAndUpdate(
      { clerkId: id },
      {
        $set: {
          clerkId: id,
          email,
          name,
          imageUrl: image_url,
        },
      },
      { upsert: true, new: true }
    );

    return { success: true, userId: id };
  }
);
```

---

## 4. Express 엔드포인트 연동 (`/api/inngest`)

`backend/src/server.js`:

```javascript
import { serve } from "inngest/express";
import { inngest } from "./inngest/client.js";
import { syncUser } from "./inngest/functions.js";

app.use(
  "/api/inngest",
  serve({
    client: inngest,
    functions: [syncUser],
  })
);
```

---

## 5. 로컬 Dev Server 테스트 및 검증

로컬 개발 환경에서는 Inngest Dev Server를 띄워 이벤트를 시뮬레이션할 수 있습니다:

```bash
npx inngest-cli@latest dev -u http://localhost:5000/api/inngest
```

웹 브라우저에서 `http://localhost:8288`로 접근하여 등록된 이벤트 및 함수들의 정상 작동 여부를 시각적으로 확인할 수 있습니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
