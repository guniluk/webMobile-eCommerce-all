# ☁️ Render.com 클라우드 배포 & Keep-Alive 크론 초보자 완전 가이드

이 문서는 **Express.js 백엔드**와 **Vite React 프론트엔드**를 **Render.com** 무료 클라우드 인프라에 통합 배포하고 슬립(Sleep) 현상을 방지하는 전체 가이드입니다.

---

## 📌 목차 (Table of Contents)
1. [Render.com 배포 구조 및 개요](#1-rendercom-배포-구조-및-개요)
2. [배포 준비: 백엔드 정적 서빙 세팅 ([server.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/server.js))](#2-배포-준비-백엔드-정적-서빙-세팅)
3. [Render 인프라 자동화 설정 (`render.yaml`)](#3-render-인프라-자동화-설정-renderyaml)
4. [14분 주기 Self-Ping Keep-Alive 크론 연동](#4-14분-주기-self-ping-keep-alive-크론-연동)
5. [Render 대시보드 배포 절차](#5-render-대시보드-배포-절차)
6. [자주 하는 실수 & 검증 (Troubleshooting)](#6-자주-하는-실수--검증-troubleshooting)

---

## 1. Render.com 배포 구조 및 개요

Render.com 무료 인스턴스는 일정 시간 요청이 없으면 서버가 **Sleep 모드**에 진입하여 첫 요청 시 약 50초간의 지연(Cold Start)이 발생합니다.
본 프로젝트는 **1) 백엔드가 프론트엔드 빌드 결과물을 직접 정적 서빙하는 단일 웹 서비스 아키텍처**와 **2) 14분마다 자기 자신에게 HTTP 핑을 보내 수면을 방지하는 Self-Ping 크론**을 구축해 이를 완벽히 해결했습니다.

---

## 2. 배포 준비: 백엔드 정적 서빙 세팅

`backend/src/server.js` 파일에 프로덕션 환경(`NODE_ENV === "production"`)일 때 프론트엔드 빌드 결과물(`frontend/dist`)을 Express 정적 아티팩트로 서빙하는 코드를 포함시킵니다:

```javascript
import path from "path";

if (process.env.NODE_ENV === "production") {
  // Self-Ping 크론 시작
  initKeepAlive();

  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDistPath));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDistPath, "index.html"));
  });
}
```

---

## 3. Render 인프라 자동화 설정 (`render.yaml`)

프로젝트 루트 디렉터리에 `render.yaml` 파일을 작성하면 Blueprint 기능으로 인프라 생성이 자동화됩니다:

```yaml
services:
  - type: web
    name: webmobile-ecommerce
    env: node
    plan: free
    buildCommand: "cd backend && npm install && cd ../frontend && npm install && npm run build"
    startCommand: "cd backend && npm run start"
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: MONGODB_URI
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: CLERK_SECRET_KEY
        sync: false
```

---

## 4. 14분 주기 Self-Ping Keep-Alive 크론 연동

`node-cron` 및 백엔드 유틸([cronKeepAlive.js](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/utils/cronKeepAlive.js))을 통해 14분마다 `/api/health` 헬스체크 URL로 요청을 보냅니다.

```javascript
import cron from "node-cron";
import https from "https";

export const initKeepAlive = () => {
  const SERVER_URL = process.env.RENDER_EXTERNAL_URL || "https://your-app.onrender.com";

  cron.schedule("*/14 * * * *", () => {
    https.get(`${SERVER_URL}/api/health`, (res) => {
      console.log(`[Keep-Alive] Self-ping status: ${res.statusCode}`);
    }).on("error", (err) => {
      console.warn("[Keep-Alive Error]:", err.message);
    });
  });
};
```

---

## 5. Render 대시보드 배포 절차

1. GitHub 레포지토리에 소스코드 커밋 & 푸시
2. [Render.com 대시보드](https://dashboard.render.com) 접속 ➔ **`New +`** ➔ **`Blueprint`** 선택
3. 해당 GitHub 레포지토리 연결
4. `render.yaml` 설정 감지 확인 ➔ `MONGODB_URI`, `STRIPE_SECRET_KEY`, `CLERK_SECRET_KEY` 등 환경 변수 값 입력 후 **`Apply`** 클릭

---

## 6. 자주 하는 실수 & 검증 (Troubleshooting)

| 현상 | 원인 | 해결 방법 |
| :--- | :--- | :--- |
| `Page Not Found` 404 에러 | SPA 캐치올 라우터 설정 미흡 | `server.js`에서 `/api` 이외의 GET 요청을 `index.html`로 sendFile 처리했는지 확인 |
| 첫 접속 시 50초 딜레이 | Self-Ping 미작동 | Render 대시보드 환경변수에 `RENDER_EXTERNAL_URL` 지정 확인 |

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
