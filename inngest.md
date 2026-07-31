# ⚡ Inngest + Clerk + MongoDB 자동 동기화 초보자 완전 가이드

이 가이드는 **Clerk 회원가입/수정/탈퇴 웹훅(Webhook) 이벤트**를 **Inngest 백그라운드 Worker**가 전달받아 **MongoDB**에 사용자를 **자동으로 동기화(생성, 수정, 삭제)**하는 전체 과정과, **Inngest 웹사이트(app.inngest.com)에서 App 등록 및 Runs(실행 이력) 모니터링/테스트하는 법**을 상세하게 설명한 문서입니다.

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
1. [Inngest 공식 홈페이지(app.inngest.com)](https://app.inngest.com) 접속 후 회원가입 (GitHub 계정 권장).
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

// 1. 회원가입 시 MongoDB User 생성
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

## 🌐 3. Inngest 웹사이트(app.inngest.com)에서 App 등록 및 모니터링 가이드

Render.com에 백엔드를 배포한 후, Inngest 웹 사이트 대시보드에서 앱을 등록(Sync)하고 함수 작동 상태를 확인하는 방법입니다.

---

### 📍 1단계: Apps 등록 (Sync New App)

Render에 배포된 Express 백엔드를 Inngest 대시보드에 연결하는 과정입니다.

1. [Inngest 대시보드(app.inngest.com)](https://app.inngest.com) 접속 및 로그인.
2. 좌측(또는 상단) 메인 메뉴에서 **`Apps`** 클릭.
3. 우측 상단의 **`Sync New App`** (또는 `Create App`) 파란색 버튼 클릭.
4. **App URL** 입력창에 Render 배포 서비스의 Inngest 주소를 입력합니다:
   ```text
   https://<your-render-app-name>.onrender.com/api/inngest
   ```
5. 하단의 **`Sync App`** 버튼을 클릭합니다.
6. **동기화 성공 확인**:
   - 등록이 완료되면 **App Name**으로 `ecommerce-app` (초록색 `Synced` 표시)이 추가됩니다.
   - 클릭해 들어가면 아래 3개의 함수가 등록된 것을 확인할 수 있습니다:
     - 🟩 `sync-user-from-clerk`
     - 🟨 `update-user-from-clerk`
     - 🟥 `delete-user-from-clerk`

---

### 📍 2단계: Functions 탭에서 테스트 이벤트 전송하기

Inngest 사이트에서 직접 가상 이벤트를 쏘아 테스트해볼 수 있습니다.

1. Inngest 대시보드에서 **`Functions`** 탭 클릭.
2. 목록에서 `sync-user-from-clerk` 함수 클릭.
3. 우측 상단의 **`Test Event`** (또는 `Invoke`) 버튼 클릭.
4. **Event Payload** 입력창에 테스트용 JSON 데이터를 입력합니다:
   ```json
   {
     "name": "clerk/user.created",
     "data": {
       "id": "user_test_12345",
       "first_name": "홍",
       "last_name": "길동",
       "email_addresses": [
         { "email_address": "hong@example.com" }
       ],
       "image_url": "https://example.com/avatar.png"
     }
   }
   ```
5. **`Send Event`** 버튼을 누르면 즉시 함수 실행이 트리거됩니다!

---

### 📍 3단계: Runs 탭에서 실행 이력(Run Status) 확인하기

이벤트가 발생하거나 가상 이벤트를 전송했을 때 **Runs** 탭에서 실행 상태를 모니터링하는 방법입니다.

1. Inngest 대시보드 메뉴에서 **`Runs`** 탭 클릭.
2. 실시간으로 실행된 백그라운드 작업 목록(Run History)을 확인합니다:
   - 🟢 **`Completed`** (초록색): 함수가 에러 없이 완벽히 실행되고 MongoDB에 유저 저장이 끝남.
   - 🟡 **`Running` / `Retrying`** (노란색): 백엔드 응답을 기다리는 중이거나, 에러 발생 후 Inngest가 자동 재시도 중.
   - 🔴 **`Failed`** (빨간색): 최대 재시도 횟수를 초과하여 최종 실패 (상세 로그 확인 가능).
3. **특정 Run 클릭 시 나오는 세부 정보**:
   - **Timeline / Steps**: 함수 시작 시간, 소요 시간, 반환 결과(`{ success: true, userId: 'user_test_12345' }`)가 표시됩니다.
   - **Event Payload**: Clerk에서 넘어온 원본 회원가입 데이터를 열람할 수 있습니다.
   - **Re-run (Replay) 버튼**: 에러 수정 후 동일한 이벤트를 다시 실행해볼 때 사용합니다.

---

## 🧪 4. 로컬 컴퓨터(Local Dev)에서 테스트 및 확인 방법

로컬 개발 환경(`localhost:3000`)에서 Inngest Dev Server 대시보드로 테스트하는 방법입니다.

1. **백엔드 서버 가동**:
   ```bash
   cd backend
   npm run dev
   ```
2. **새 터미널에서 Inngest Dev CLI 실행**:
   ```bash
   npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
   ```
3. **로컬 대시보드 접속**:
   - 브라우저로 `http://127.0.0.1:8288` 접속.
   - **Stream / Events 탭**: 수신된 이벤트 내역 모니터링.
   - **Functions 탭**: 등록된 함수 목록 확인 및 `Send Event` 기능으로 가상 이벤트 실행 테스트.

---

## ❓ 5. 트러블슈팅 (자주 발생하는 에러 및 대처법)

### Q1. Inngest 대시보드 `Apps` 탭에서 Sync 실패 (Red/Failed) 메시지가 떠요.
- **원인 1**: Render 배포 URL 주소가 올바르지 않거나 끝에 `/api/inngest` 경로를 누락한 경우.
- **원인 2**: Render 대시보드의 `Environment Variables` 탭에 `INNGEST_SIGNING_KEY` 키가 등록되지 않았거나 값이 틀린 경우.
- **해결**: URL 주소가 `https://<app-name>.onrender.com/api/inngest` 형식인지 확인하고, Render 환경 변수를 확인한 뒤 **`Resync`** 버튼을 누르세요.

### Q2. `"createFunction" expected a handler function...` 에러가 발생해요.
- **원인**: Inngest SDK v4 버전 기준에 맞지 않는 예전(v3 이하) 방식으로 작성된 구문 에러입니다.
- **해결**: 본 프로젝트의 [`inngest.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/config/inngest.js)는 이미 최신 v4 규격(`triggers: [...]`)으로 작성되어 있어 정상 작동합니다.

### Q3. Clerk 회원가입 후 Runs에 기록이 생성되지 않아요.
1. Clerk 대시보드 ➔ **`Webhooks`** 메뉴에서 등록한 Endpoint URL이 Inngest 주소로 올바르게 설정되어 있는지 확인하세요.
2. Clerk Webhook 이벤트에 `user.created`, `user.updated`, `user.deleted` 3가지가 제대로 체크되어 있는지 확인하세요.
3. 이 프로젝트는 프론트엔드 로그인 직후 `/api/user/sync`도 호출하므로, 웹훅 누락 시에도 DB 동기화는 정상 유지됩니다.
