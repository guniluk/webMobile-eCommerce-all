# 📦 Multer + Cloudinary 연동 사용법 가이드

`Multer`와 **Cloudinary**를 연동하면 백엔드 로컬 서버 디스크에 파일을 직접 저장하지 않고, 메모리 버퍼(Memory)를 거쳐 클라우드 이미지 호스팅 서비스인 **Cloudinary**로 안전하게 전송 및 호스팅할 수 있습니다.

---

## 📌 목차

- [📦 Multer + Cloudinary 연동 사용법 가이드](#-multer--cloudinary-연동-사용법-가이드)
  - [📌 목차](#-목차)
  - [1. 개요 및 흐름 구조](#1-개요-및-흐름-구조)
    - [🔄 데이터 전송 흐름 (Stream Flow)](#-데이터-전송-흐름-stream-flow)
  - [2. 백엔드 (Node.js / Express) 사용 절차](#2-백엔드-nodejs--express-사용-절차)
    - [2.1 필수 패키지 설치](#21-필수-패키지-설치)
    - [2.2 Cloudinary 계정 및 환경변수 설정](#22-cloudinary-계정-및-환경변수-설정)
    - [2.3 Multer 메모리 스토리지 및 Cloudinary 업로드 유틸 작성](#23-multer-메모리-스토리지-및-cloudinary-업로드-유틸-작성)
      - [1) Cloudinary \& Multer 설정 (`lib/cloudinary.js`)](#1-cloudinary--multer-설정-libcloudinaryjs)
    - [2.4 라우터 \& 컨트롤러 구현 (단일/다중 업로드)](#24-라우터--컨트롤러-구현-단일다중-업로드)
      - [Express 서버 구성 (`server.js`)](#express-서버-구성-serverjs)
    - [2.5 (보너스) Cloudinary 이미지 삭제 유틸](#25-보너스-cloudinary-이미지-삭제-유틸)
  - [3. 프론트엔드 (React / Vanilla JS) 사용 절차](#3-프론트엔드-react--vanilla-js-사용-절차)
    - [3.1 FormData 구성 및 백엔드 전송](#31-formdata-구성-및-백엔드-전송)
    - [3.2 React + Axios 예제](#32-react--axios-예제)
  - [4. ⚠️ Cloudinary 연동 시 자주 발생하는 이슈](#4-️-cloudinary-연동-시-자주-발생하는-이슈)
    - [1) `memoryStorage` 사용 시 대용량 파일 메모리 과부하](#1-memorystorage-사용-시-대용량-파일-메모리-과부하)
    - [2) `.env` 환경변수 미인식](#2-env-환경변수-미인식)
    - [3) `public_id` 저장 관리](#3-public_id-저장-관리)

---

## 1. 개요 및 흐름 구조

### 🔄 데이터 전송 흐름 (Stream Flow)

```text
[프론트엔드]                [Express 백엔드]                     [Cloudinary CDN]
 (FormData)    ------->  Multer (memoryStorage)  ------->   cloudinary.uploader.upload_stream
 file 선택                 req.file.buffer 생성                  URL & public_id 반환
                                 │                                        │
                                 └─────────── JSON 응답 반환 ──────────────┘
                                          (secure_url)
```

1. **프론트엔드**: `FormData`에 파일 객체를 담아 백엔드로 `POST` 요청.
2. **Multer (`memoryStorage`)**: 파일 데이터를 서버의 디스크가 아닌 **메모리(RAM Buffer)**에 일시 보관 (`req.file.buffer`).
3. **Cloudinary SDK**: 스트림(`upload_stream`) 방식을 사용하여 버퍼 데이터를 Cloudinary 서버로 업로드.
4. **결과 반환**: Cloudinary가 발행한 최종 이미지 CDN URL (`secure_url`)과 관리용 ID (`public_id`)를 DB 저장 및 프론트엔드로 응답.

---

## 2. 백엔드 (Node.js / Express) 사용 절차

### 2.1 필수 패키지 설치

```bash
npm install multer cloudinary dotenv
```

---

### 2.2 Cloudinary 계정 및 환경변수 설정

[Cloudinary Dashboard](https://cloudinary.com/)에서 발급받은 API 키 정보를 `.env` 파일에 추가합니다.

```env
PORT=5000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

### 2.3 Multer 메모리 스토리지 및 Cloudinary 업로드 유틸 작성

#### 1) Cloudinary & Multer 설정 (`lib/cloudinary.js`)

```javascript
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// 1. Cloudinary 설정
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Multer MemoryStorage 설정 (디스크가 아닌 메모리 버퍼 사용)
const storage = multer.memoryStorage();

// 3. 파일 검증 필터 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("이미지 파일만 업로드할 수 있습니다."), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
});

// 4. Cloudinary 업로드 함수 (Buffer -> Stream 전송)
export const uploadToCloudinary = (fileBuffer, folderName = "uploads") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName, // Cloudinary 내 생성될 폴더명
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); // result 객체 내 secure_url, public_id 등 포함
      },
    );

    // 버퍼 데이터를 스트림으로 Cloudinary에 쓰기
    uploadStream.end(fileBuffer);
  });
};
```

---

### 2.4 라우터 & 컨트롤러 구현 (단일/다중 업로드)

#### Express 서버 구성 (`server.js`)

```javascript
import express from "express";
import cors from "cors";
import { upload, uploadToCloudinary } from "./lib/cloudinary.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. 단일 이미지 업로드 라우트
app.post("/api/upload/single", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "업로드할 파일이 존재하지 않습니다." });
    }

    // 메모리에 보관된 req.file.buffer를 Cloudinary로 업로드
    const result = await uploadToCloudinary(req.file.buffer, "products");

    res.status(200).json({
      message: "Cloudinary 단일 업로드 성공!",
      url: result.secure_url, // 이미지 접근 가능한 CDN URL
      public_id: result.public_id, // 추후 이미지 삭제 시 사용되는 고유 ID
    });
  } catch (error) {
    console.error("Cloudinary 업로드 에러:", error);
    res.status(500).json({
      message: "업로드 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
});

// 2. 다중 이미지 업로드 라우트
app.post(
  "/api/upload/multiple",
  upload.array("images", 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "업로드할 파일이 없습니다." });
      }

      // 여러 개의 파일 버퍼를 병렬로 Cloudinary에 업로드
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.buffer, "gallery"),
      );

      const results = await Promise.all(uploadPromises);

      // 업로드 결과에서 URL 및 public_id 추출
      const uploadedImages = results.map((item) => ({
        url: item.secure_url,
        public_id: item.public_id,
      }));

      res.status(200).json({
        message: "Cloudinary 다중 업로드 성공!",
        images: uploadedImages,
      });
    } catch (error) {
      console.error("다중 업로드 에러:", error);
      res.status(500).json({
        message: "다중 업로드 중 오류가 발생했습니다.",
        error: error.message,
      });
    }
  },
);

app.listen(5000, () => {
  console.log("서버가 5000번 포트에서 실행 중입니다.");
});
```

---

### 2.5 (보너스) Cloudinary 이미지 삭제 유틸

게시글 수정이나 상품 삭제 시 Cloudinary에 저장된 이미지를 삭제할 때는 `public_id`를 사용합니다.

```javascript
import { v2 as cloudinary } from "cloudinary";

// public_id를 기반으로 Cloudinary 이미지 삭제
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result; // { result: 'ok' }
  } catch (error) {
    throw new Error(`Cloudinary 이미지 삭제 실패: ${error.message}`);
  }
};
```

---

## 3. 프론트엔드 (React / Vanilla JS) 사용 절차

### 3.1 FormData 구성 및 백엔드 전송

프론트엔드의 작성 방식은 일반 파일 업로드와 거의 동일합니다.
백엔드 미들웨어의 `fieldname`과 프론트엔드 `formData.append()`의 키 이름을 일치시키고, 백엔드로부터 최종 Cloudinary **`url`**을 받아서 활용합니다.

---

### 3.2 React + Axios 예제

```jsx
import React, { useState } from "react";
import axios from "axios";

export default function CloudinaryUploadComponent() {
  const [file, setFile] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("업로드할 이미지를 선택하세요.");

    const formData = new FormData();
    // 백엔드 upload.single('image')의 fieldname인 'image'와 정확히 일치
    formData.append("image", file);

    try {
      setLoading(true);
      // 백엔드로 요청 (백엔드가 Cloudinary 업로드 후 URL을 반환해 줌)
      const res = await axios.post(
        "http://localhost:5000/api/upload/single",
        formData,
      );

      setUploadedUrl(res.data.url);
      alert("Cloudinary 업로드 성공!");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "업로드 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px", maxWidth: "500px" }}>
      <h2>Cloudinary 이미지 업로드</h2>
      <form onSubmit={handleUpload}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={loading}>
          {loading ? "업로드 중..." : "전송하기"}
        </button>
      </form>

      {uploadedUrl && (
        <div style={{ marginTop: "20px" }}>
          <h4>업로드된 Cloudinary 이미지:</h4>
          <img
            src={uploadedUrl}
            alt="Uploaded Result"
            style={{ maxWidth: "100%", borderRadius: "8px" }}
          />
          <p style={{ wordBreak: "break-all", fontSize: "12px" }}>
            {uploadedUrl}
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 4. ⚠️ Cloudinary 연동 시 자주 발생하는 이슈

### 1) `memoryStorage` 사용 시 대용량 파일 메모리 과부하

- `memoryStorage`는 파일을 RAM에 버퍼로 저장하므로, 영상이나 매우 큰 파일(수백 MB 이상)을 업로드할 경우 백엔드 서버의 메모리가 부족해질 수 있습니다.
- 이미지 파일(5~10MB 이하) 업로드 용도로 적합하며, 대용량 파일의 경우 프론트엔드에서 Cloudinary **Direct Upload (Unsigned Upload)**를 고려하는 것이 좋습니다.

### 2) `.env` 환경변수 미인식

- `CLOUDINARY_CLOUD_NAME`, `API_KEY`, `API_SECRET` 설정이 누락되면 `Must supply cloud_name` 에러가 발생합니다.
- `dotenv.config()` 호출 위치를 최상단으로 유지하세요.

### 3) `public_id` 저장 관리

- 단순히 `secure_url`만 DB에 저장하면 나중에 이미지를 수정/삭제할 때 Cloudinary에서 해당 이미지를 지우기 힘들어집니다.
- DB에 **`url`과 `public_id`를 함께 저장**하는 것을 권장합니다.
