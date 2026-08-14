# 🚀 Render.com 클라우드 자동 배포 가이드

이 문서는 Node.js Express 백엔드 서버와 React Vite 웹 프론트엔드를 **Render.com** 클라우드 플랫폼에 자동으로 원클릭 배포하는 설정 및 실전 가이드입니다.

---

## 📌 목차
1. [Render.com 배포 구조 및 `render.yaml`](#1-rendercom-배포-구조-및-renderyaml)
2. [백엔드 (Node.js Express) 서비스 배포 설정](#2-백엔드-nodejs-express-서비스-배포-설정)
3. [웹 프론트엔드 (React Vite) Static Site 배포 설정](#3-웹-프론트엔드-react-vite-static-site-배포-설정)
4. [환경변수 (Environment Variables) 세팅 가이드](#4-환경변수-environment-variables-세팅-가이드)
5. [⚠️ 배포 성공 검증 및 트러블슈팅](#5-️-배포-성공-검증-및-트러블슈팅)

---

## 1. Render.com 배포 구조 및 `render.yaml`

프로젝트 루트 디렉터리의 [`render.yaml`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/render.yaml) 파일은 백엔드 Web Service와 웹 Static Site를 한 번에 자동 프로비저닝할 수 있도록 설정되어 있습니다.

`render.yaml`:

```yaml
services:
  # 🟢 Express 백엔드 Web Service
  - type: web
    name: webmobile-ecommerce-backend
    env: node
    region: singapore
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000

  # 💻 React Vite 웹 Static Site
  - type: web
    name: webmobile-ecommerce-frontend
    env: static
    region: singapore
    buildCommand: cd frontend && npm install && npm run build
    staticPublishPath: ./frontend/dist
```

---

## 2. 백엔드 (Node.js Express) 서비스 배포 설정

1. [Render Dashboard](https://dashboard.render.com/) 접속 후 **`New +`** ➔ **`Web Service`** 선택
2. GitHub 저장소(`webMobile-eCommerce-all`) 연결
3. 설정값 지정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x 이상

---

## 3. 웹 프론트엔드 (React Vite) Static Site 배포 설정

1. Render Dashboard에서 **`New +`** ➔ **`Static Site`** 선택
2. 설정값 지정:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. Single Page App(SPA) 라우팅을 위한 Rewrite Rule 설정:
   - **Source**: `/*`
   - **Destination**: `/index.html`

---

## 4. 환경변수 (Environment Variables) 세팅 가이드

Render Dashboard의 백엔드 서비스 `Environment` 탭에 아래 환경변수를 등록해야 합니다:

| 환경변수 Key | 설명 / 예시 값 |
| :--- | :--- |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/eCommerce` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary 클라우드 명 |
| `CLOUDINARY_API_KEY` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Cloudinary API Secret |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` |
| `STRIPE_PUBLISHABLE_KEY` | `pk_test_...` |
| `STRIPE_SECRET_KEY` | `sk_test_...` |

---

## 5. ⚠️ 배포 성공 검증 및 트러블슈팅

1. **상태 검사 (Health Check)**:
   - 백엔드가 정상 배포되면 `https://webmobile-ecommerce-backend.onrender.com/api/products` 접속 시 HTTP 200 OK와 함께 상품 JSON 데이터가 반환되어야 합니다.
2. **CORS 에러 발생 시**:
   - `backend/src/server.js`의 `cors({ origin: '*' })` 설정을 확인하세요.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.
