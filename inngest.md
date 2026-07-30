# ⚡ 초보자도 쉽게 따라하는 Inngest + Clerk + MongoDB 연동 가이드

이 가이드는 **Clerk 웹훅(Webhook)** 이벤트를 **Inngest 백그라운드 일꾼(Worker)**이 받아서 **MongoDB**에 사용자를 **자동 생성, 수정, 삭제**하는 전체 과정을 세상에서 가장 쉽게 설명한 문서입니다.

---

## 📌 1. 핵심 개념 1분 이해하기 (쉬운 비유)

```
[Clerk]                  [Inngest]                      [Express 백엔드 & MongoDB]
"사용자가 가입했어요!"  ──> "이벤트 수신 완료,          ──> MongoDB User 컬렉션에
(웹훅 신호 발생)           안전하게 처리해라!"             신규 사용자 데이터 자동 저장!
```

- **Clerk**: 사용자가 회원가입/수정/탈퇴할 때 신호를 보내주는 **알림이** 역할을 합니다.
- **Inngest**: 신호를 받아서 서버가 다운되거나 에러가 나도 **끝까지 재시도하여 MongoDB에 안전하게 저장**해주는 **베테랑 알림 처리기** 역할을 합니다.
- **MongoDB**: 최종 사용자 데이터가 보관되는 **DB 창고**입니다.

---

## 🛠️ 2. 순서대로 따라하는 4단계 세팅 가이드

---

### 📍 1단계: Inngest 계정 및 Signing Key 복사 (필수)
1. [app.inngest.com](https://app.inngest.com) 접속 후 로그인합니다.
2. 화면 우측 상단(또는 좌측 설정 메뉴)에서 **`Manage Keys`** (또는 `Settings` ➔ `API Keys`)를 클릭합니다.
3. 가장 핵심적인 **`Signing Key`** (예: `signkey-prod-...`)를 복사합니다.
   - 💡 **핵심**: 최신 Inngest에서는 **`INNGEST_SIGNING_KEY` 하나만 백엔드 환경 변수에 등록하면 모든 통신과 인증이 완료됩니다!**  
   - *(Event Key는 외부 클라이언트에서 이벤트를 직접 쏠 때만 필요한 옵션 키입니다.)*

---

### 📍 2단계: Clerk 대시보드에서 Webhook 설정

Clerk에서 발생하는 사용자 이벤트(가입/수정/탈퇴)를 백엔드로 전달하기 위해 Clerk 대시보드에 Webhook Endpoint를 등록합니다.

1. [Clerk.com](https://clerk.com) 접속 ➔ 본인의 프로젝트 선택 ➔ 좌측 메뉴에서 **`Webhooks`** 클릭.
2. 우측 상단 **`Add Endpoint`** 버튼을 클릭합니다.
3. **Endpoint URL** 입력란에 배포된 백엔드의 Inngest 수신 주소를 입력합니다:
   - **Render 배포 주소**: `https://<your-render-app-name>.onrender.com/api/inngest`
   - *(또는 Inngest 대시보드의 Apps 메뉴에서 Sync 등록한 주소)*
4. **Subscribe to events** (수신할 3가지 필수 이벤트 선택):
   - 🟩 `user.created` (신규 회원가입 이벤트)
   - 🟨 `user.updated` (프로필/정보 수정 이벤트)
   - 🟥 `user.deleted` (회원탈퇴/삭제 이벤트)
5. 하단의 **`Create`** 버튼을 누르면 설정이 완료됩니다.

---

### 📍 3단계: 백엔드 환경 변수 (`.env`) 설정

`backend/.env` 파일에 1단계에서 복사한 `Signing Key`를 추가합니다:

```env
# Inngest 핵심 보안 키 (필수)
INNGEST_SIGNING_KEY=signkey-prod-your_signing_key_here
```

> 💡 **Render.com 배포 시**: Render 대시보드의 **`Environment Variables`** 탭에도 `INNGEST_SIGNING_KEY` 환경 변수를 동일하게 등록해주세요.

---

### 📍 4단계: 프로젝트 코드 연동 확인 (이미 세팅 완료됨)

프로젝트 내부에는 **Inngest 최신 SDK (v4)** 규격에 맞춰 코드가 완성되어 있습니다.

#### ① Inngest 이벤트 처리 함수 ([`backend/src/config/inngest.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/config/inngest.js))
Inngest v4 최신 규격인 `triggers: [{ event: "..." }]` 방식으로 작동합니다:

```javascript
import { Inngest } from "inngest";
import { User } from "../models/user.model.js";

export const inngest = new Inngest({ id: "ecommerce-app" });

// 1. 회원가입시 MongoDB에 User 생성
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk", triggers: [{ event: "clerk/user.created" }] },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const email = email_addresses?.[0]?.email_address || "";
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";

    await User.create({ clerkId: id, email, name, imageUrl: image_url || "" });
    return { success: true, userId: id };
  }
);

// 2. 정보 수정시 MongoDB User 업데이트
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk", triggers: [{ event: "clerk/user.updated" }] },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;
    const email = email_addresses?.[0]?.email_address || "";
    const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";

    await User.findOneAndUpdate({ clerkId: id }, { email, name, imageUrl: image_url || "" });
    return { success: true, userId: id };
  }
);

// 3. 탈퇴시 MongoDB User 삭제
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-from-clerk", triggers: [{ event: "clerk/user.deleted" }] },
  async ({ event }) => {
    const { id } = event.data;
    await User.findOneAndDelete({ clerkId: id });
    return { success: true, userId: id };
  }
);
```

#### ② Express 백엔드 라우터 연동 ([`backend/src/routes/inngest.route.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/routes/inngest.route.js))
Inngest의 `serve()` 기능을 이용해 `/api/inngest` 엔드포인트로 노출시켰습니다.

---

## 🧪 3. 검증 및 테스트 방법

### 📍 로컬 컴퓨터에서 테스트하는 방법
터미널에서 아래 명령어를 실행하면 Inngest 개발자 대시보드가 열려 테스트 이벤트를 손쉽게 실행해볼 수 있습니다:

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
```

- 웹 브라우저에서 `http://127.0.0.1:8288`로 접속하면 수신된 이벤트와 실행 결과를 모니터링할 수 있습니다.

### 📍 Render.com 배포 후 연결하기
1. Render.com에 배포 후 환경 변수(`INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`)를 등록합니다.
2. Inngest 대시보드 ➔ **`Apps`** 탭 ➔ **`Sync New App`** 클릭.
3. `https://<your-render-app-name>.onrender.com/api/inngest` 주소를 넣고 동기화(Sync) 버튼을 누르면 배포 완료!

---

## ❓ 4. 트러블슈팅 (자주 발생하는 에러 및 대처법)

### Q1. `"createFunction" expected a handler function as the second argument...` 에러가 떠요.
**원인**: Inngest SDK v4 버전부터는 `createFunction({ id }, { event }, handler)` 대신 `{ id: "...", triggers: [{ event: "..." }] }` 처럼 첫 번째 객체 안에 트리거를 넣는 구문으로 변경되었습니다.  
**해결**: 본 프로젝트의 `backend/src/config/inngest.js` 코드는 이미 최신 v4 규격으로 완성되어 있어 정상 동작합니다.

### Q2. Clerk 회원가입 후 MongoDB에 데이터가 들어오지 않아요.
1. `backend/.env` 및 Render 환경 변수에 **`INNGEST_SIGNING_KEY`**가 올바르게 설정되었는지 확인하세요.
2. Clerk 대시보드의 Webhooks 메뉴에서 `user.created`, `user.updated`, `user.deleted` 3가지 이벤트가 수신 등록되어 있는지 확인하세요.
3. Inngest 대시보드 ➔ **`Apps`** 탭에서 `https://<your-domain>/api/inngest` 백엔드 주소가 성공적으로 Sync(동기화)되었는지 확인하세요.
