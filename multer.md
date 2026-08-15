# 📦 Multer + Cloudinary 연동 및 모바일 이미지 호스팅 완전 가이드

`Multer`와 **Cloudinary**를 연동하면 백엔드 로컬 디스크에 파일 저장을 하지 않고, 메모리 버퍼(RAM)를 통해 클라우드 이미지 호스팅 서비스인 **Cloudinary**로 안전하게 전송 및 호스팅할 수 있습니다. 또한, **Expo Go 모바일 앱** 및 웹 환경에서 이미지 인코딩 훼손 없이 선명하게 렌더링되도록 처리하는 완벽한 가이드입니다.

---

## 📌 목차
1. [개요 및 흐름 구조](#1-개요-및-흐름-구조)
2. [백엔드 (Node.js / Express) 사용 절차](#2-백엔드-nodejs--express-사용-절차)
   - [2.1 필수 패키지 설치 & 환경변수 설정](#21-필수-패키지-설치--환경변수-설정)
   - [2.2 Multer 메모리 스토리지 및 Cloudinary 업로드 유틸 작성](#22-multer-메모리-스토리지-및-cloudinary-업로드-유틸-작성)
   - [2.3 라우터 & 컨트롤러 구현 (단일/다중 업로드)](#23-라우터--컨트롤러-구현-단일다중-업로드)
   - [2.4 Cloudinary 이미지 삭제 유틸](#24-cloudinary-이미지-삭제-유틸)
3. [프론트엔드 (React / Vanilla JS) 사용 절차](#3-프론트엔드-react--vanilla-js-사용-절차)
4. [모바일 앱 (Expo Go) 이미지 렌더링 유틸 (`productUtils.ts`)](#4-모바일-앱-expo-go-이미지-렌더링-유틸-productutilsts)
5. [⚠️ 개발 시 자주 발생하는 이슈 & 트러블슈팅](#5-️-개발-시-자주-발생하는-이슈--트러블슈팅)

---

## 1. 개요 및 흐름 구조

### 🔄 데이터 전송 흐름 (Stream Flow)

```text
[프론트엔드/모바일]           [Express 백엔드]                       [Cloudinary CDN]
 (FormData)    ------->  Multer (memoryStorage)  ------->   cloudinary.uploader.upload_stream
 file 선택                 req.file.buffer 생성                  URL & public_id 반환
                                 │                                        │
                                 └─────────── JSON 응답 반환 ──────────────┘
                                          (secure_url)
```

1. **프론트엔드**: `FormData`에 파일 객체를 담아 백엔드로 `POST` 요청.
2. **Multer (`memoryStorage`)**: 파일 데이터를 디스크가 아닌 **메모리(RAM Buffer)**에 일시 보관 (`req.file.buffer`).
3. **Cloudinary SDK**: 스트림(`upload_stream`) 방식을 사용하여 버퍼 데이터를 Cloudinary 서버로 업로드.
4. **결과 반환**: Cloudinary가 발행한 최종 이미지 CDN URL (`secure_url`)과 관리용 ID (`public_id`)를 DB 저장 및 응답.

---

## 2. 백엔드 (Node.js / Express) 사용 절차

### 2.1 필수 패키지 설치 & 환경변수 설정

```bash
cd backend
npm install multer cloudinary dotenv
```

`backend/.env`:
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 2.2 Multer 메모리 스토리지 및 Cloudinary 업로드 유틸 작성

백엔드 설정 파일 ([cloudinary.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/config/cloudinary.js)):

```javascript
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

미들웨어 파일 ([multer.middleware.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/middleware/multer.middleware.js)):

```javascript
import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
  }
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 제한
}).single('image');

export const uploadMultipleImages = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 3);
```

---

### 2.3 라우터 & 컨트롤러 구현 (단일/다중 업로드)

컨트롤러 파일 ([admin.controller.js](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/backend/src/controllers/admin.controller.js)):

```javascript
import cloudinary from '../config/cloudinary.js';

const processImageUploads = async (req) => {
  const imageUrls = [];
  const files = req.files || (req.file ? [req.file] : []);

  if (files && files.length > 0) {
    const filePromises = files.map(async (file) => {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'products',
      });
      return result.secure_url || result.url;
    });
    const uploadedFromFiles = await Promise.all(filePromises);
    imageUrls.push(...uploadedFromFiles);
  }
  return imageUrls;
};
```

---

### 2.4 Cloudinary 이미지 삭제 유틸

```javascript
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary 이미지 삭제 실패: ${error.message}`);
  }
};
```

---

## 3. 프론트엔드 (React / Vanilla JS) 사용 절차

프론트엔드 전송 시 주의점: `Content-Type: multipart/form-data` 헤더를 수동으로 넣지 말고, 브라우저가 `boundary`를 자동 설정하도록 둡니다.

```javascript
const formData = new FormData();
formData.append('images', fileObj);

const response = await axios.post('/api/admin/products', formData);
```

---

## 4. 모바일 앱 (Expo Go) 이미지 렌더링 유틸 (`productUtils.ts`)

모바일 환경에서 Cloudinary URL이 이중 인코딩되거나 깨지지 않도록 방어해 주는 안전 유틸리티 ([productUtils.ts](file:///Users/guniluk/Desktop/CLI/webMobile-eCommerce-all/mobile/lib/productUtils.ts)):

```typescript
export const formatImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed || trimmed.includes('placeholder')) return '';

  if (trimmed.startsWith('data:image/')) return trimmed;

  if (trimmed.startsWith('/')) {
    const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
    return `${baseUrl.replace(/\/+$/, '')}${trimmed}`;
  }

  let secureUrl = trimmed.replace(/^http:\/\//i, 'https://');
  if (secureUrl.includes('cloudinary.com')) return secureUrl;

  try {
    return encodeURI(decodeURI(secureUrl));
  } catch {
    return secureUrl;
  }
};
```

---

## 5. ⚠️ 개발 시 자주 발생하는 이슈 & 트러블슈팅

1. **`Unexpected field` 에러**:
   - 백엔드 `uploadSingleImage('image')`와 프론트엔드 `formData.append('image', file)`의 키 문자열이 정확히 일치해야 합니다.
2. **`memoryStorage` 대용량 메모리 사용 주의**:
   - 5MB 이하의 이미지 전송에 적합하며, 수백 MB 이상의 대용량 파일은 Direct Unsigned Upload를 추천합니다.
3. **Cloudinary 이중 인코딩 문제 해결**:
   - `encodeURI`를 함부로 전체 URL에 쓰지 않고, `cloudinary.com` URL인 경우 `formatImageUrl`을 통해 안전하게 원본 HTTPS URL을 보장합니다.

---

© Web & Mobile Fullstack E-Commerce Platform. All rights reserved.

