# ⚡ Inngest + Clerk + MongoDB 자동 동기화 초보자 완전 가이드

이 가이드는 **Clerk 회원가입/수정/탈퇴 웹훅(Webhook) 이벤트**를 **Inngest 백그라운드 Worker**가 전달받아 **MongoDB**에 사용자를 **자동으로 동기화(생성, 수정, 삭제)**하는 전체 과정을 세상에서 가장 쉽게 설명한 가이드입니다.

---

## 📌 1. 핵심 개념 1분 만에 이해하기

```
[ Clerk 인증 ]                   [ Inngest Worker ]                [ Express 백엔드 & MongoDB ]
"사용자가 가입/수정했어요!" ──> "이벤트 수신 완료!            ──> MongoDB User 컬렉션에
(웹훅 알림 발송)                에러 나도 끝까지 재시도!"       유저 정보 안전하게 저장/수정/삭제!
```

### 💡 왜 Inngest를 사용할까요?
- **일반 웹훅의 단점**: 웹훅 수신 도중 백엔드 서버가 점검 중이거나 잠시 다운되면 웹훅 신호를 놓치게 되어 회원 정보가 누락될 위험이 있습니다.
- **Inngest의 장점**: 신호를 일단 큐(Queue)에 보관하고, 백엔드 서버에서 처리될 때까지 **자동 재시도(Retry)** 및 모니터링을 보장하여 100% 데이터 안전성을 제공합니다.

---

## 🛠️ 2. 순서대로 따라하는 4단계 세팅 가이드

### 📍 1단계: Inngest 회원가입 및 Signing Key 복사
1. [Inngest 공식 홈페이지(app.inngest.com)](https://app.inngest.com) 접속 후 회원가입 (GitHub 계정 추천).
2. 로그인 후 상단 메뉴의 **`Manage Keys`** (또는 `Settings` ➔ `API Keys`) 클릭.
3. **`Signing Key`** 항목의 키 값(예: `signkey-prod-...`)을 복사합니다.
   > 💡 **핵심**: 최신 Inngest v4 규격에서는 **`INNGEST_SIGNING_KEY` 하나만 백엔드 환경 변수에 등록하면 모든 보안 검증이 완료됩니다!**

---

### 📍 2단계: 백엔드 환경 변수 (`.env`) 설정
복사한 `Signing Key`를 `backend/.env` 파일에 추가합니다:

```env
# Inngest 핵심 보안 키 (필수)
INNGEST_SIGNING_KEY=signkey-prod-여기에_본인의_Signing_Key_입력
```

> 🌐 **Render.com 배포 시**: Render 대시보드의 **`Environment Variables`** 탭에도 `INNGEST_SIGNING_KEY` 환경 변수를 동일하게 등록해주세요.

---

### 📍 3단계: Clerk 대시보드에서 Webhook 엔드포인트 등록

Clerk에서 회원 이벤트가 발생할 때 백엔드로 신호를 보내도록 웹훅을 등록합니다.

1. [Clerk 대시보드(clerk.com)](https://clerk.com) 접속 ➔ 본인 프로젝트 선택 ➔ 좌측 메뉴 **`Webhooks`** 클릭.
2. 우측 상단 **`Add Endpoint`** 버튼 클릭.
3. **Endpoint URL** 입력란에 백엔드의 Inngest 수신 주소를 입력합니다:
   - **Render 배포 주소**: `https://<your-render-app-name>.onrender.com/api/inngest`
   - *(로컬 테스트 시에는 Inngest Dev Server 주소 사용)*
4. **Subscribe to events** (수신할 3가지 이벤트 체크):
   - 🟩 `user.created` (신규 회원가입)
   - 🟨 `user.updated` (회원 정보 수정)
   - 🟥 `user.deleted` (회원 탈퇴/삭제)
5. 하단 **`Create`** 버튼을 눌러 등록을 완료합니다.

---

### 📍 4단계: 프로젝트 코드 구성 확인 (이미 완벽히 구현됨)

이 프로젝트는 **Inngest 최신 SDK (v4)** 규격으로 작성되어 있습니다.

#### ① Inngest 핸들러 정의 ([`backend/src/config/inngest.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/config/inngest.js))
Inngest v4의 `triggers: [{ event: "..." }]` 이벤트 배열 처리 방식을 따릅니다:

```javascript
import { Inngest } from "inngest";
import { User } from "../models/user.model.js";

export const inngest = new Inngest({ id: "ecommerce-app" });

// 1. 회원가입 시 MongoDB User 생성 (clerk/user.created 및 user.created 모두 처리)
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }, { event: "user.created" }],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    const email = data.email_addresses?.[0]?.email_address || data.email || "";
    const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";

    const user = await User.findOneAndUpdate(
      { clerkId: id },
      { clerkId: id, email, name, imageUrl: data.image_url || "" },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );
    return { success: true, userId: id };
  }
);

// 2. 정보 수정 시 MongoDB User 업데이트
export const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }, { event: "user.updated" }],
  },
  async ({ event }) => {
    const data = event.data || {};
    const id = data.id;
    const email = data.email_addresses?.[0]?.email_address || data.email || "";
    const name = `${data.first_name || ""} ${data.last_name || ""}`.trim() || "User";

    await User.findOneAndUpdate(
      { clerkId: id },
      { email, name, imageUrl: data.image_url || "" },
      { returnDocument: "after" }
    );
    return { success: true, userId: id };
  }
);

// 3. 탈퇴 시 MongoDB User 삭제
export const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    triggers: [{ event: "clerk/user.deleted" }, { event: "user.deleted" }],
  },
  async ({ event }) => {
    const id = event.data?.id;
    await User.findOneAndDelete({ clerkId: id });
    return { success: true, userId: id };
  }
);
```

#### ② Express 백엔드 라우터 연동 ([`backend/src/routes/inngest.route.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/routes/inngest.route.js))
Inngest의 `serve()` 미들웨어를 사용하여 `/api/inngest` 라우트로 연결되어 있습니다:

```javascript
import { serve } from "inngest/express";
import { inngest, syncUserCreation, syncUserUpdation, syncUserDeletion } from "../config/inngest.js";

const router = serve({
  client: inngest,
  functions: [syncUserCreation, syncUserUpdation, syncUserDeletion],
});

export default router;
```

---

## 🧪 3. 테스트 및 검증 방법

### 📍 로컬 컴퓨터에서 Inngest 테스트하기
로컬 개발 환경에서 Inngest 대시보드를 띄우고 가상 이벤트를 전송해볼 수 있습니다:

1. 백엔드 서버 가동:
   ```bash
   cd backend
   npm run dev
   ```
2. 새 터미널에서 Inngest 개발자 대시보드 실행:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
   ```
3. 브라우저에서 `http://127.0.0.1:8288`로 접속하면 수신된 이벤트와 실행 성공/실패 내역을 실시간으로 확인할 수 있습니다.

### 📍 Render.com 배포 후 App Sync 진행하기
1. Render.com에 백엔드를 배포하고 `INNGEST_SIGNING_KEY` 환경 변수를 등록합니다.
2. [Inngest 대시보드](https://app.inngest.com) 접속 ➔ **`Apps`** 탭 ➔ **`Sync New App`** 클릭.
3. 배포된 URL 입력: `https://<your-render-app-name>.onrender.com/api/inngest`
4. **`Sync App`** 버튼을 누르면 배포된 서버와 Inngest 간의 동기화가 완료됩니다!

---

## ❓ 4. 트러블슈팅 (자주 발생하는 에러 및 대처법)

### Q1. `"createFunction" expected a handler function...` 에러가 발생해요.
- **원인**: Inngest SDK v4 버전 기준에 맞지 않는 예전(v3 이하) 방식으로 작성된 구문 에러입니다.
- **해결**: 본 프로젝트의 [`inngest.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/config/inngest.js)는 이미 최신 v4 규격(`triggers: [...]`)으로 작성되어 있어 정상 작동합니다.

### Q2. Clerk에서 회원 가입 후 DB에 데이터가 반영되지 않아요.
1. `backend/.env` 및 Render 환경 변수에 **`INNGEST_SIGNING_KEY`**가 오타 없이 들어갔는지 확인하세요.
2. Inngest 대시보드 ➔ **`Apps`** 탭에서 배포된 앱이 `Synced`(초록색) 상태인지 확인하세요.
3. 만약 웹훅이 연동되지 않더라도, 이 프로젝트의 프론트엔드는 로그인 시 `/api/user/sync`를 직접 호출하므로 DB 데이터 동기화는 정상 수행됩니다.
