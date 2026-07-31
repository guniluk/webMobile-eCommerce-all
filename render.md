# 🚀 Render.com 무료 배포 및 서버 유지 초보자 완전 가이드

이 가이드는 `webMobile-eCommerce-all` 풀스택 프로젝트(Express 백엔드 + Vite React 프론트엔드)를 **Render.com**에 무료로 배포하고, 서버가 슬립(Sleep) 상태에 빠지지 않고 항상 켜져 있도록 유지하는 전체 과정을 설명합니다.

---

## 📌 1. 이 프로젝트의 배포 구조 한눈에 보기

```
[ GitHub 레포지토리 ] ──(자동 배포)──> [ Render.com 단일 서버 ]
                                        ├── Express 백엔드 API (/api/...)
                                        └── Vite React 프론트엔드 (정적 서빙)
```

### 💡 풀스택 통합 배포의 장점
1. **비용 0원 (100% 무료)**: 백엔드와 프론트엔드를 별도로 배포하지 않고, Express 서버 하나에서 React 화면(`frontend/dist`)까지 한꺼번에 제공하므로 Render 무료 플랜 1개만으로 가동할 수 있습니다.
2. **CORS 에러 완벽 방지**: 프론트엔드와 백엔드가 동일한 도메인(주소)을 사용하므로 교차 출처 리소스 공유(CORS) 문제가 발생하지 않습니다.
3. **14분 자동 핑(Keep-Alive Self-Ping)**: Render 무료 인스턴스는 15분간 요청이 없으면 서버가 잠드는(Sleep) 특성이 있습니다. 이를 방지하기 위해 백엔드 코드내의 Cron 작업([`cronKeepAlive.js`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/backend/src/utils/cronKeepAlive.js))이 14분마다 자기 자신의 `/api/health` 주소로 핑을 날려 **24시간 서버를 항상 켜두도록 유지**합니다.

---

## 🛠️ 2. 준비물 체크리스트

배포를 진행하기 전에 아래 준비물이 갖춰졌는지 확인하세요:
- [ ] **GitHub 계정**: 최신 코드가 올려진 레포지토리 (예: `webMobile-eCommerce-all`)
- [ ] **Render.com 계정**: [Render.com 회원가입](https://render.com) (GitHub 계정으로 1초 가입 권장)
- [ ] **MongoDB 데이터베이스 주소**: MongoDB Atlas 연결 문자열 (`mongodb+srv://...`)
- [ ] **Clerk API Keys**: Publishable Key (`pk_test_...`) 및 Secret Key (`sk_test_...`)
- [ ] **Inngest Signing Key**: Inngest 대시보드의 Signing Key (`signkey-prod-...`)

---

## 🎯 3. Render.com 대시보드 배포 5단계 따라하기

### 1단계: GitHub에 소스코드 올리기
컴퓨터의 최신 변경사항을 GitHub main 브랜치에 커밋 및 푸시합니다.

### 2단계: Render.com에서 새 웹 서비스 생성
1. [Render 대시보드(dashboard.render.com)](https://dashboard.render.com) 접속 및 로그인.
2. 우측 상단 파란색 **`New +`** 버튼 클릭 ➔ **`Web Service`** 선택.
3. `Build and deploy from a Git repository` 선택 후 **`Next`**.
4. 본인의 GitHub 계정을 연결하고 `webMobile-eCommerce-all` 레포지토리를 찾아 **`Connect`** 클릭.

### 3단계: 기본 설정 값 입력
화면의 입력 폼에 아래 정보들을 똑같이 입력합니다:

| 항목 (Field) | 입력할 값 | 설명 |
| :--- | :--- | :--- |
| **Name** | `my-ecommerce-app` | 본인이 원하는 서비스 이름 (URL 주소에 사용됨) |
| **Region** | `Singapore` | 한국과 가장 가까운 지역 (응답 속도 최적화) |
| **Branch** | `main` | 배포할 Git 브랜치 이름 |
| **Root Directory** | *(비워둠)* | 프로젝트 최상단 루트 기준 |
| **Runtime** | `Node` | 실행 환경 |
| **Build Command** | `npm run build` | 루트 `package.json`의 빌드 스크립트 실행 |
| **Start Command** | `npm start` | 루트 `package.json`의 백엔드 실행 스크립트 |
| **Instance Type** | `Free` ($0/month) | **무료 요금제 선택** |

> 💡 **참고**: 루트 [`package.json`](file:///Users/guniluk/Desktop/CODING/webMobile-eCommerce-all/package.json)에는 `npm run build` 시 백엔드와 프론트엔드 의존성을 모두 설치하고 프론트엔드를 빌드하도록 설정되어 있습니다.

### 4단계: 환경 변수 (Environment Variables) 등록
페이지 하단의 `Environment Variables` 섹션에서 **`Add Environment Variable`** 버튼을 누르고 아래 키/값 쌍들을 추가합니다:

| Key (환경 변수 이름) | Value (설정 값 예시) | 필수 여부 및 설명 |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **[필수]** 프로덕션 모드 켜기 (14분 핑 & 프론트엔드 정적 서빙 활성화) |
| `MONGO_URI` | `mongodb+srv://user:pass@cluster...` | **[필수]** MongoDB Atlas 데이터베이스 주소 |
| `JWT_SECRET` | `your_super_secret_jwt_key` | **[필수]** JWT 토큰 서명용 임의의 긴 문자열 |
| `CLERK_PUBLISHABLE_KEY` | `pk_test_...` | **[필수]** Clerk 백엔드 공개 키 |
| `CLERK_SECRET_KEY` | `sk_test_...` | **[필수]** Clerk 백엔드 비밀 키 |
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_...` | **[필수]** Clerk 프론트엔드 공개 키 |
| `INNGEST_SIGNING_KEY` | `signkey-prod-...` | **[필수]** Inngest 보안 웹훅 키 |

> 💡 `RENDER_EXTERNAL_URL` 변수는 Render에서 배포가 완료되면 서버 자체에서 **자동으로 주입**해주므로 따로 등록하지 않아도 됩니다. (14분 핑 코드가 이 값을 자동으로 읽어옵니다)

### 5단계: 배포 시작!
하단의 파란색 **`Create Web Service`** 버튼을 누르면 배포 프로세스가 시작됩니다.  
(약 2분 ~ 4분 소요되며, 화면 아래 로그 창에 빌드 과정이 실시간으로 출력됩니다)

---

## ✅ 4. 배포 성공 확인 및 14분 핑 모니터링

배포가 정상적으로 완료되면 상단에 나만의 서비스 URL(예: `https://my-ecommerce-app.onrender.com`)이 생성됩니다.

1. **웹페이지 접속**: 주소를 클릭하여 들어갔을 때 Vite React 쇼핑몰 웹 화면이 잘 뜨는지 확인합니다.
2. **백엔드 API 확인**: 주소 끝에 `/api/health`를 붙여 봅니다 (예: `https://my-ecommerce-app.onrender.com/api/health`).
   - `{"message":"Server is OK","timestamp":"..."}` 응답이 나오면 백엔드가 정상 가동 중입니다.
3. **14분 Self-Ping 로그 확인**:
   - Render 대시보드의 **`Logs`** 탭을 클릭하여 모니터링합니다.
   - 서버 실행 후 14분이 지나면 아래와 같은 로그가 찍히며 24시간 잠들지 않는 서버로 가동됩니다:
     ```text
     [Keep-Alive Ping] 2026. 7. 31. 오전 08:00:00 - Self-Ping 요청 전송: https://my-ecommerce-app.onrender.com/api/health
     [Keep-Alive Ping Success] 응답 데이터: { message: 'Server is OK', timestamp: '2026-07-31T08:00:00.000Z' }
     ```

---

## ❓ 5. 트러블슈팅 (자주 발생하는 에러 및 해결책)

### Q1. MongoDB 연결 실패 에러가 발생해요 (`MongooseServerSelectionError`).
- **원인**: MongoDB Atlas에서 Render 서버의 IP 접근을 차단했을 때 일어납니다.
- **해결책**: [MongoDB Atlas](https://cloud.mongodb.com) 접속 ➔ `Network Access` 메뉴 ➔ `Add IP Address` ➔ **`ALLOW ACCESS FROM ANYWHERE` (`0.0.0.0/0`)**를 추가해주세요.

### Q2. 로컬 컴퓨터 개발 시에도 14분 핑이 계속 작동하나요?
- **답변**: 아니요! 로컬 개발 환경(`NODE_ENV !== 'production'`)에서는 14분 핑과 정적 파일 서빙이 작동하지 않도록 안전장치가 내장되어 있어 깔끔하게 독립 모드로 실행됩니다.

### Q3. 코드를 수정하면 다시 Render에서 설정해야 하나요?
- **답변**: 아니요! GitHub `main` 브랜치에 수정 코드를 `push`하기만 하면 Render가 이를 자동으로 감지하여 **자동 재배포(Auto-deploy)**를 수행합니다.
