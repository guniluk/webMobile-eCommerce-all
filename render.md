# 🚀 초보자도 쉽게 따라하는 Render.com 배포 및 관리 가이드

이 가이드는 `webMobile-eCommerce-all` 프로젝트(백엔드 + 프론트엔드)를 **Render.com**에 무료로 배포하고, 서버가 켜져 있도록 유지하는 전체 과정을 **가장 쉽게** 설명한 문서입니다.

---

## 📌 1. 핵심 요약 (이것만 알아도 됩니다!)

1. **하나의 서버로 통합 배포**:
   - Express 백엔드 서버가 React 프론트엔드 화면(`frontend/dist`)까지 한꺼번에 제공합니다.
   - **이유**: Render.com 무료 요금제 1개만 써서 **비용 0원**으로 운영할 수 있고, 도메인이 같아 **CORS 에러가 발생하지 않습니다.**

2. **14분 자동 알람 (Keep-Alive 핑)**:
   - Render 무료 서버는 15분 동안 아무도 안 오면 **잠에 들며(Spin Down/Sleep)**, 다음 첫 방문자가 **30초~1분 동안 기다려야** 합니다.
   - 이를 방지하기 위해 백엔드 코드 내에서 **14분마다 자기 자신에게 "잘 떠있니?" 핑을 보내 항상 깨어있게 설정**했습니다.
   - 💡 *단, 로컬 개발 컴퓨터(`NODE_ENV=development`)에서는 이 핑이 작동하지 않도록 안전장치가 되어 있습니다.*

---

## 🛠️ 2. 준비물 체크리스트

배포를 시작하기 전에 아래 3가지가 필요합니다:
- [ ] **GitHub 계정**: 코드가 올릴 레포지토리
- [ ] **Render.com 계정**: [Render.com 회원가입](https://render.com) (GitHub으로 1초 가입 추천)
- [ ] **MongoDB 데이터베이스 주소**: (예: `mongodb+srv://user:pass@cluster...`)

---

## 🎯 3. Render.com 대시보드 클릭 따라하기 (5단계)

### 1단계: GitHub에 코드 올려두기
*(사용자가 준비되었을 때 커밋 & 푸시 진행)*

### 2단계: Render.com에서 새 웹 서비스 생성
1. [Render 대시보드](https://dashboard.render.com)에 로그인합니다.
2. 우측 상단 파란색 **`New +`** 버튼 클릭 ➔ **`Web Service`** 선택.
3. `Build and deploy from a Git repository` 선택 후 **`Next`**.
4. 본인의 GitHub 계정을 연결하고 `webMobile-eCommerce-all` 레포지토리를 선택합니다.

### 3단계: 기본 정보 입력하기
화면에 나오는 항목들을 아래와 같이 그대로 입력하거나 확인합니다:

| 항목 | 입력할 내용 | 설명 |
| :--- | :--- | :--- |
| **Name** | `my-ecommerce-app` | 본인이 원하는 서비스 이름 (영문/숫자) |
| **Region** | `Singapore` | 한국과 가까운 아시아 지역 (속도가 빠름) |
| **Branch** | `main` | 배포할 Git 브랜치 |
| **Root Directory** | *(비워둠)* | 프로젝트 루트 기준 |
| **Runtime** | `Node` | 실행 환경 |
| **Build Command** | `npm run build` | 의존성 설치 및 프론트엔드 빌드 실행 |
| **Start Command** | `npm start` | 백엔드 서버 가동 |
| **Instance Type** | `Free` ($0/month) | **무료 요금제 선택** |

### 4단계: 환경 변수 (Environment Variables) 설정
스크롤을 내려 `Environment Variables` 항목의 **`Add Environment Variable`** 버튼을 눌러 다음 값들을 추가합니다:

| Key (이름) | Value (값) | 필수 여부 및 설명 |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | **[필수]** 프로덕션 모드 켜기 (14분 핑 & 프론트엔드 서빙 활성화) |
| `MONGO_URI` | `mongodb+srv://...` | **[필수]** 본인의 MongoDB 연결 주소 |
| `JWT_SECRET` | `아무_긴_비밀_문자열` | **[필수]** 회원가입/로그인 토큰용 암호화 키 |
| `PORT` | `10000` | (선택) Render 기본 포트번호 |

> 💡 **참고**: `RENDER_EXTERNAL_URL` 환경 변수는 Render가 배포를 마치면 **자동으로 주입**해주므로 따로 입력할 필요가 없습니다. (14분 핑 코드가 이 주소를 자동으로 읽어옵니다)

### 5단계: 배포 시작!
하단의 파란색 **`Create Web Service`** 버튼을 누르면 배포가 시작됩니다.  
(약 2분 ~ 4분 정도 소요되며, 화면 아래 검은 로그 창에 빌드 과정이 표시됩니다)

---

## ✅ 4. 배포 성공 여부 확인법

배포가 끝나면 화면 좌측 상단에 `https://my-ecommerce-app.onrender.com` 과 같은 나만의 전용 URL 주소가 생성됩니다.

1. **웹 화면 확인**:
   - 주소를 클릭하여 들어갔을 때 React 프론트엔드 웹 화면이 잘 뜨는지 확인합니다.
2. **백엔드 API 작동 확인**:
   - 주소 뒤에 `/api/health` 를 입력해봅니다. (예: `https://my-ecommerce-app.onrender.com/api/health`)
   - `{"message":"Server is OK", ...}` 라는 글자가 뜨면 성공입니다!
3. **14분 핑 로그 확인**:
   - Render 대시보드의 **`Logs`** 탭을 클릭해 둡니다.
   - 서버가 켜진 지 14분이 지나면 아래와 같은 핑 로그가 찍히며 서버가 잠들지 않음을 알 수 있습니다:
     ```text
     [Keep-Alive Ping] 2026. 7. 30. 오전 11:30:00 - Self-Ping 요청 전송: https://.../api/health
     [Keep-Alive Ping Success] 상태 코드: 200
     ```

---

## ❓ 5. 자주 묻는 질문 & 트러블슈팅 (Troubleshooting)

### Q1. 로컬 컴퓨터에서 `npm start` 할 때도 핑이 14분마다 계속 돌아가나요?
**A:** 아니요! 로컬 개발 환경(`.env`에 `NODE_ENV=development`로 되어 있거나 설정되지 않은 경우)에서는 핑 기능과 정적 파일 서빙이 작동하지 않도록 안전장치가 적용되어 있어 안심하셔도 됩니다.

### Q2. DB 연결 실패 에러가 발생해요.
**A:** MongoDB Atlas를 쓰시는 경우, MongoDB 관리자 화면 ➔ `Network Access` 메뉴에서 IP 허용 범위에 `0.0.0.0/0` (Anywhere)이 등록되어 있는지 확인해주세요. Render 서버의 IP가 접속할 수 있어야 합니다.

### Q3. 코드를 수정했을 때는 어떻게 업데이트하나요?
**A:** Render와 연결된 GitHub 브랜치(`main`)에 코드를 Push하기만 하면, Render가 이를 감지하여 **자동으로 재배포(Auto Deploy)**를 진행해 줍니다.
