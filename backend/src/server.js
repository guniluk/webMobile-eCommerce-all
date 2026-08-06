import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

import connectDB from "./config/connectDB.js";
import inngestRoute from "./routes/inngest.route.js";
import { initKeepAlive } from "./utils/cronKeepAlive.js";
import userRoute from "./routes/user.route.js";
import adminRoute from "./routes/admin.route.js";
import orderRoute from "./routes/order.route.js";
import reviewRoute from "./routes/review.route.js";
import productRoute from "./routes/product.route.js";
import cartRoute from "./routes/cart.route.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 글로벌 미들웨어 (CORS 허용)
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(clerkMiddleware()); // req.auth 주입

// 1. Health check 엔드포인트
app.get("/api/health", (req, res) => {
  res
    .status(200)
    .json({ message: "Server is OK", timestamp: new Date().toISOString() });
});

// 2. 백엔드 API 라우트 등록
app.use("/api/inngest", inngestRoute);
app.use("/api/users", userRoute);
app.use("/api/admin", adminRoute);
app.use("/api/orders", orderRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/products", productRoute);
app.use("/api/carts", cartRoute);

// 3. Render.com 프로덕션 전용 기능 (Self-Ping Cron & Frontend 정적 서빙)
if (process.env.NODE_ENV === "production") {
  // 14분 주기 Render Keep-Alive Self-Ping Cron 시작
  initKeepAlive();

  // Frontend 정적 파일 서빙 (dist/favicon.ico 포함 정적 파일 제공)
  const frontendDistPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendDistPath));

  // SPA 라우팅 지원 (API 이외의 모든 GET 요청에 대해 React index.html 응답)
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, "index.html"), (err) => {
      if (err) {
        res
          .status(200)
          .send(
            "API Server is running. (Frontend build file index.html not found)",
          );
      }
    });
  });
} else {
  console.log(
    "[Server] 개발 환경(NODE_ENV !== 'production'): Express 백엔드 독립 모드로 가동됩니다.",
  );
}

// 4. 서버 가동 및 DB 연결
app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
