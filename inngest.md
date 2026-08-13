<!-- cspell:ignore inngest INNGEST Updation ecommerce -->
# ⚙️ Inngest 백그라운드 작업 & 이벤트 자동화 실전 가이드 (Node.js Express)

이 문서는 본 프로젝트(`webMobile-eCommerce-all`)의 **backend Express 백엔드**에서 **Inngest(인제스트)**를 사용하여 Clerk 회원 이벤트(`user.created`, `user.updated`, `user.deleted`) 발생 시 MongoDB `User` 컬렉션과 비동기로 데이터를 동기화하는 구조 및 세팅 가이드입니다.

---

## 📌 목차 (Table of Contents)

1. [Inngest 개요 및 본 프로젝트 사용 목적](#1-inngest-개요-및-본-프로젝트-사용-목적)
2. [프로젝트 내 Inngest 아키텍처 구조](#2-프로젝트-내-inngest-아키텍처-구조)
3. [실제 소스 코드 구현 내역](#3-실제-소스-코드-구현-내역)
   - [3.1 Inngest 클라이언트 & sync 함수 정의 (`backend/src/config/inngest.js`)](#31-inngest-클라이언트--sync-함수-정의-backendsrcconfiginngestjs)
   - [3.2 Inngest Express 라우터 (`backend/src/routes/inngest.route.js`)](#32-inngest-express-라우터-backendsrcroutesinngestroutejs)
   - [3.3 Express 서버 연결 (`backend/src/server.js`)](#33-express-서버-연결-backendsrcserverjs)
4. [환경 변수 설정 (`backend/.env`)](#4-환경-변수-설정-backendenv)
5. [로컬 Dev CLI 테스트 및 Clerk 대시보드 연동](#5-로컬-dev-cli-테스트-및-clerk-대시보드-연동)
6. [트러블슈팅 및 주의 사항](#6-트러블슈팅-및-주의-사항)

---

## 1. Inngest 개요 및 본 프로젝트 사용 목적

**Inngest**는 별도의 Redis나 complex 큐 인프라 구축 없이 **비동기 이벤트 기반 백그라운드 작업, 자동 재시도(Retry), 크론(Cron) 작업**을 서버리스 환경에서 쉽게 처리하는 플랫폼입니다.

### 💡 본 프로젝트에서의 핵심 역할
- **Clerk 사용자 동기화**: 사용자 가입/수정/삭제 이벤트가 발생하면 Inngest 함수가 이를 수신하여 MongoDB의 `User` 컬렉션에 실시간으로 반영합니다.
- **오류 및 네트워크 지연에 견고함**: 백엔드가 순간적으로 다운되어도 Inngest의 자동 재시도(Retry) 메커니즘을 통해 데이터 유실을 방지합니다.

---

## 2. 프로젝트 내 Inngest 아키텍처 구조

```text
[Clerk Auth / Webhook] 
       │ (이벤트 전송: clerk/user.created, updated, deleted)
       ▼
[Inngest Server / Dev CLI (http://localhost:3000/api/inngest)]
       │ (HTTP POST Request & Handler Dispatch)
       ▼
[Backend: src/routes/inngest.route.js]
       │
       ├─► syncUserCreation ──► MongoDB User.findOneAndUpdate (Upsert)
       ├─► syncUserUpdation ──► MongoDB User.findOneAndUpdate
       └─► syncUserDeletion ──► MongoDB User.findOneAndDelete
```

---

## 3. 실제 소스 코드 구현 내역

### 3.1 Inngest 클라이언트 & sync 함수 정의 ([backend/src/config/inngest.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/config/inngest.js))

본 프로젝트는 `backend/src/config/inngest.js` 파일에 Inngest 클라이언트 및 3가지 주요 동기화 함수가 구현되어 있습니다.

```javascript
import { Inngest } from "inngest";
import { User } from "../models/user.model.js";

// 1. Inngest 클라이언트 초기화 (App ID: ecommerce-app)
export const inngest = new Inngest({ id: "ecommerce-app" });

/**
 * 1. Clerk 회원가입 이벤트 (clerk/user.created 및 user.created)
 * Clerk에서 새 사용자가 가입하면 MongoDB에 User 문서를 생성/업데이트합니다.
 */
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }, { event: "user.created" }],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    if (!id) return { success: false, message: "No user ID found" };

    const first_name = data.first_name || "";
    const last_name = data.last_name || "";
    const email_addresses = data.email_addresses || [];
    const image_url = data.image_url || data.profile_image_url || "";

    const email =
      email_addresses.length > 0
        ? email_addresses[0].email_address
        : data.email || "";

    const name = `${first_name} ${last_name}`.trim() || "User";

    const userData = {
      clerkId: id,
      email,
      name,
      imageUrl: image_url,
      addresses: [],
      wishList: [],
    };

    const user = await User.findOneAndUpdate({ clerkId: id }, userData, {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true,
    });

    return {
      success: true,
      message: "MongoDB User created/synced successfully",
      userId: id,
    };
  }
);

/**
 * 2. Clerk 회원정보 수정 이벤트 (clerk/user.updated 및 user.updated)
 * Clerk에서 사용자 프로필이나 정보가 수정되면 MongoDB User 문서를 업데이트합니다.
 */
export const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }, { event: "user.updated" }],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    if (!id) return { success: false, message: "No user ID found" };

    const first_name = data.first_name || "";
    const last_name = data.last_name || "";
    const email_addresses = data.email_addresses || [];
    const image_url = data.image_url || data.profile_image_url || "";

    const email =
      email_addresses.length > 0
        ? email_addresses[0].email_address
        : data.email || "";

    const name = `${first_name} ${last_name}`.trim() || "User";

    const updatedData = {
      email,
      name,
      imageUrl: image_url,
    };

    await User.findOneAndUpdate({ clerkId: id }, updatedData, {
      returnDocument: "after",
    });

    return {
      success: true,
      message: "MongoDB User updated successfully",
      userId: id,
    };
  }
);

/**
 * 3. Clerk 회원탈퇴/삭제 이벤트 (clerk/user.deleted 및 user.deleted)
 * Clerk에서 계정이 삭제되면 MongoDB에서 해당 User 문서를 제거합니다.
 */
export const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }, { event: "user.deleted" }],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;

    if (id) {
      await User.findOneAndDelete({ clerkId: id });
    }
    return {
      success: true,
      message: "MongoDB User deleted successfully",
      userId: id,
    };
  }
);
```

---

### 3.2 Inngest Express 라우터 ([backend/src/routes/inngest.route.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/routes/inngest.route.js))

`inngest/express`의 `serve` 핸들러를 사용하여 라우터로 노출합니다.

```javascript
import express from "express";
import { serve } from "inngest/express";
import {
  inngest,
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
} from "../config/inngest.js";

const router = express.Router();

// Inngest 이벤트 수신 및 비동기 워크플로우 처리 엔드포인트
router.use(
  "/",
  serve({
    client: inngest,
    functions: [syncUserCreation, syncUserUpdation, syncUserDeletion],
  })
);

export default router;
```

---

### 3.3 Express 서버 연결 ([backend/src/server.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/server.js))

Express 메인 서버 파일에 `/api/inngest` 엔드포인트로 등록되어 있습니다:

```javascript
import inngestRoute from "./routes/inngest.route.js";

// ...중략...

// Inngest 엔드포인트 등록
app.use("/api/inngest", inngestRoute);
```

---

## 4. 환경 변수 설정 (`backend/.env`)

프로덕션 배치 시 Inngest 대시보드와 보안 연동을 위해 다음 환경 변수가 필수입니다:

```env
# Inngest Cloud 프로덕션 연동 키
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

*(참고: 로컬 개발 환경에서는 Signing Key 없이도 Dev CLI를 사용해 테스트 가능합니다.)*

---

## 5. 로컬 Dev CLI 테스트 및 Clerk 대시보드 연동

### 5.1 로컬 개발 모드 실행

1. **백엔드 서버 실행**
   ```bash
   cd backend
   npm run dev
   ```
   (서버가 `http://localhost:3000`에서 가동됨)

2. **Inngest Dev Server 가동**
   새 터미널 탭에서 다음 명령어를 실행합니다:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
   ```

3. **Inngest 대시보드 접속**
   웹 브라우저에서 `http://127.0.0.1:8288`로 접속하면 시각적 대시보드가 열리며 등록된 3가지 함수(`sync-user-from-clerk`, `update-user-from-clerk`, `delete-user-from-clerk`)를 확인하고 테스트 이벤트를 전송해 볼 수 있습니다.

### 5.2 Clerk Dashboard Webhook 연동 방법

Clerk에서 생성된 사용자가 Inngest로 자동 전달되도록 연동하는 두 가지 방법:
- **방법 A (Inngest Integrations)**: Inngest Cloud 대시보드 > Integrations > Clerk 선택 후 키 연결.
- **방법 B (Direct Webhook)**: Clerk 대시보드 > Webhooks > Add Endpoint에서 `https://<backend-domain>/api/inngest` 등록 및 `user.created`, `user.updated`, `user.deleted` 이벤트 구독.

---

## 6. 트러블슈팅 및 주의 사항

| 현상 및 문제 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| **Dev Server 실행 시 `Endpoint fetch error`** | 백엔드 엔드포인트 URL 불일치 | 백엔드 포트(기본 3000) 및 URL `/api/inngest` 확인 (`npx inngest-cli@latest dev -u http://localhost:3000/api/inngest`) |
| **Clerk 이벤트 발생 시 DB 반영 안 됨** | `functions` 배열 등록 누락 또는 이벤트명 불일치 | `inngest.route.js`의 `functions` 배열에 해당 함수가 포함되어 있는지 및 triggers의 이벤트 이름(`clerk/user.created` / `user.created`) 확인 |
| **MongoDB upsert 시 `clerkId` 누락** | Clerk 웹훅 payload의 `data.id` 부재 | `backend/src/config/inngest.js`에서 `if (!id) return` 조건문으로 무효 요청 차단 처리되어 있음 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
