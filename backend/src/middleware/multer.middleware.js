import multer from "multer";

// 메모리 스토리지 (파일을 버퍼 형태로 메모리에 저장하여 Cloudinary 등에 바로 전달)
const storage = multer.memoryStorage();

// 이미지 파일 확장자 및 MIME 타입 필터링
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "이미지 파일만 업로드할 수 있습니다! (jpg, jpeg, png, webp, gif)",
      ),
      false,
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 파일당 최대 10MB
  },
});

// 단일 파일 업로드 미들웨어 (필드명: 'image' 또는 'file')
export const uploadSingleImage = upload.single("image");

// 다중 파일 업로드 미들웨어 (필드명: 'images', 최대 3개)
export const uploadMultipleImages = upload.array("images", 3);

export default upload;
