import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/connectDB.js";
import userRoute from "./routes/user.route.js";
import { initKeepAlive } from "./utils/cronKeepAlive.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 글로벌 미들웨어
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 1. Health check 엔드포인트
app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Server is OK", timestamp: new Date().toISOString() });
});

// 2. 백엔드 API 라우트 등록
app.use("/api/user", userRoute);

// 3. Render.com 프로덕션 전용 기능 (Self-Ping Cron & Frontend 정적 서빙)
if (process.env.NODE_ENV === "production") {
  // 14분 주기 Render Keep-Alive Self-Ping Cron 시작
  initKeepAlive();

  // Frontend 정적 파일 서빙 (dist/favicon.ico 포함 정적 파일 우선 서빙)
  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDistPath));

  // 정적 파일에 favicon.ico가 누락된 경우를 대비한 404 방지 폴백
  app.get("/favicon.ico", (req, res) => res.status(204).end());

  // SPA 라우팅 지원 (API 이외의 모든 GET 요청에 대해 React index.html 응답)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
      if (err) {
        res.status(200).send("API Server is running. (Frontend build file index.html not found)");
      }
    });
  });
} else {
  // 개발 환경(개발용 API 전용 모드)에서 브라우저 자동 파비콘 요청 시 404 예방
  app.get("/favicon.ico", (req, res) => res.status(204).end());
  console.log("[Server] 개발 환경(NODE_ENV !== 'production'): Express 백엔드 독립 모드로 가동됩니다.");
}

// 4. 서버 가동 및 DB 연결
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
